import type Database from "better-sqlite3";
import { applyStrategyTransition } from "../learning/episodes.js";
import { resolveDueOutcomeBatch } from "../learning/scheduler.js";
import { classifyAsset } from "../market/classification/classify.js";
import { fetchCmcMetadata, fetchCmcQuotes, type CmcMarketQuote, type CmcMetadata } from "../market/cmc/client.js";
import { evaluatePersonalExecution, type PersonalExecutionResult } from "../market/kraken/execution.js";
import {
  fetchOhlc,
  fetchOrderBook,
  fetchTickers,
  fetchUsdInstrumentRegistry,
  type KrakenTicker,
} from "../market/kraken/client.js";
import type { KrakenCandle } from "../market/kraken/ohlc.js";
import {
  resolveWatchlistInstruments,
  verifyKrakenInstrumentPrices,
  type WatchlistInstrumentState,
} from "../market/kraken/instruments.js";
import {
  ZOBIRIS_POLICY,
  ZOBIRIS_POLICY_CANONICAL_JSON,
  ZOBIRIS_POLICY_HASH,
} from "../policy/config.js";
import { CURRENT_WATCHLIST, type WatchlistAsset } from "../shared/watchlist.js";
import { assessClock } from "../time/clock.js";
import { buildEngineSnapshot, marketContext, needsExecutionSample } from "./rank.js";
import { runStage, skippedStage, type StageResult } from "./stages.js";
import type { EngineSnapshot, ProviderHealth } from "./types.js";

export interface EngineRuntimeDeps {
  fetchQuotes:(ids:string[])=>Promise<CmcMarketQuote[]>;
  fetchMetadata:(ids:string[])=>Promise<CmcMetadata[]>;
  fetchInstruments:()=>Promise<Map<string,any>>;
  fetchTickers:(pairs:string[])=>Promise<Map<string,KrakenTicker>>;
  fetchBook:(pair:string)=>Promise<any>;
  fetchCandles:(symbol:string,pair:string,intervalMinutes:number,sinceSeconds:number)=>Promise<KrakenCandle[]>;
  now:()=>Date;
  monotonicNow:()=>number;
  sleep:(ms:number)=>Promise<void>;
}

export interface EngineRuntimeOptions {
  watchlist?:WatchlistAsset[];
  maneuverNavUsd?:number;
  availableCashUsd?:number;
  proposedOrderUsd?:number;
  executionSampleLimit?:number;
  executionSampleDelayMs?:number;
  outcomeResolveLimit?:number;
}

interface CacheEntry<T> {
  data:T;
  lastSuccessAt:string;
  dataAsOf:string;
}

interface ProviderResolution<T> {
  data:T;
  cache:CacheEntry<T>|null;
  health:ProviderHealth;
}

function defaultDeps(cmcApiKey?:string):EngineRuntimeDeps {
  return {
    fetchQuotes:(ids)=>fetchCmcQuotes(ids,{apiKey:cmcApiKey}),
    fetchMetadata:(ids)=>fetchCmcMetadata(ids,{apiKey:cmcApiKey}),
    fetchInstruments:()=>fetchUsdInstrumentRegistry(),
    fetchTickers:(pairs)=>fetchTickers(pairs),
    fetchBook:(pair)=>fetchOrderBook(pair),
    fetchCandles:(symbol,pair,interval,since)=>fetchOhlc(symbol,pair,interval,since),
    now:()=>new Date(),
    monotonicNow:()=>performance.now(),
    sleep:(ms)=>new Promise(resolve=>setTimeout(resolve,ms)),
  };
}

function validIso(value:string|null|undefined) {
  if(!value) return null;
  const ms=Date.parse(value);
  return Number.isFinite(ms)?new Date(ms).toISOString():null;
}

function medianQuoteAsOf(quotes:CmcMarketQuote[],fallback:string) {
  const times=quotes.flatMap(q=>{
    const value=validIso(q.lastUpdated);
    return value?[Date.parse(value)]:[];
  }).sort((a,b)=>a-b);
  if(!times.length) return fallback;
  const mid=Math.floor(times.length/2);
  const median=times.length%2 ? times[mid]! : (times[mid-1]!+times[mid]!)/2;
  return new Date(median).toISOString();
}

function quoteFreshness(quotes:CmcMarketQuote[],expectedSymbols:string[],nowMs:number) {
  const fresh=new Set<string>();
  const stale=new Set<string>();
  const bySymbol=new Map(quotes.map(q=>[q.symbol.toUpperCase(),q]));
  for(const symbol of expectedSymbols.map(s=>s.toUpperCase())) {
    const quote=bySymbol.get(symbol);
    const at=validIso(quote?.lastUpdated);
    if(!quote || !at) {
      stale.add(symbol);
      continue;
    }
    const age=nowMs-Date.parse(at);
    if(age>=0 && age<=ZOBIRIS_POLICY.providerFreshness.cmcQuotesMs) fresh.add(symbol);
    else stale.add(symbol);
  }
  return {
    fresh,
    stale,
    coverage:expectedSymbols.length?fresh.size/expectedSymbols.length:0,
    btcFresh:fresh.has("BTC"),
  };
}

function resolveProvider<T>(args:{
  stage:StageResult<T>;
  prior:CacheEntry<T>|null;
  fallback:T;
  ttlMs:number;
  nowMs:number;
  mode:string|null;
  dataAsOf:(data:T,completedAt:string)=>string;
}):ProviderResolution<T> {
  if(args.stage.status==="SUCCESS" && args.stage.data!==null) {
    const dataAsOf=args.dataAsOf(args.stage.data,args.stage.completedAt);
    const cache={data:args.stage.data,lastSuccessAt:args.stage.completedAt,dataAsOf};
    const ageMs=Math.max(0,args.nowMs-Date.parse(dataAsOf));
    return {
      data:args.stage.data,
      cache,
      health:{
        status:ageMs<=args.ttlMs?"LIVE":"STALE",
        lastAttemptAt:args.stage.completedAt,
        lastSuccessAt:args.stage.completedAt,
        dataAsOf,
        ageMs,
        error:null,
        mode:args.mode,
      }
    };
  }

  if(args.prior) {
    const ageMs=Math.max(0,args.nowMs-Date.parse(args.prior.dataAsOf));
    return {
      data:args.prior.data,
      cache:args.prior,
      health:{
        status:ageMs<=args.ttlMs?"DEGRADED":"STALE",
        lastAttemptAt:args.stage.completedAt,
        lastSuccessAt:args.prior.lastSuccessAt,
        dataAsOf:args.prior.dataAsOf,
        ageMs,
        error:args.stage.error,
        mode:args.mode,
      }
    };
  }

  return {
    data:args.fallback,
    cache:null,
    health:{
      status:args.stage.status==="SKIPPED"?"MISSING":"ERROR",
      lastAttemptAt:args.stage.completedAt,
      lastSuccessAt:null,
      dataAsOf:null,
      ageMs:null,
      error:args.stage.error,
      mode:args.mode,
    }
  };
}

function stageHealth(stage:StageResult<unknown>):EngineSnapshot["health"]["stages"][number] {
  return {name:stage.name,status:stage.status,durationMs:stage.durationMs,error:stage.error};
}

export class EngineRuntime {
  private snapshot:EngineSnapshot|null=null;
  private inflight:Promise<EngineSnapshot>|null=null;
  private executionCursor=0;
  private executionCache=new Map<string,{observedAt:string;value:Pick<PersonalExecutionResult,"hardPass"|"marketDepthGrade">}>();
  private quotesCache:CacheEntry<CmcMarketQuote[]>|null=null;
  private metadataCache:CacheEntry<CmcMetadata[]>|null=null;
  private instrumentCache:CacheEntry<Map<string,any>>|null=null;
  private tickerCache:CacheEntry<Map<string,KrakenTicker>>|null=null;
  private lastRefreshSuccessAt:string|null=null;

  constructor(
    private readonly db:Database.Database,
    private readonly cmcApiKey?:string,
    private readonly options:EngineRuntimeOptions={},
    private readonly deps:EngineRuntimeDeps=defaultDeps(cmcApiKey),
  ) {}

  current(){ return this.snapshot; }

  refresh():Promise<EngineSnapshot> {
    if(this.inflight) return this.inflight;
    this.inflight=this.doRefresh().finally(()=>{this.inflight=null;});
    return this.inflight;
  }

  private async doRefresh():Promise<EngineSnapshot> {
    const priorSnapshot=this.snapshot;
    const watchlist=this.options.watchlist ?? CURRENT_WATCHLIST;
    const ids=watchlist.map(a=>a.cmcId);
    const wallStart=this.deps.now();
    const monoStart=this.deps.monotonicNow();
    const attemptAt=wallStart.toISOString();
    const clock={now:this.deps.now,monotonicNow:this.deps.monotonicNow};

    const [quoteStage,metadataStage,instrumentStage]=await Promise.all([
      runStage("cmcQuotes",clock,()=>this.deps.fetchQuotes(ids)),
      runStage("cmcMetadata",clock,()=>this.deps.fetchMetadata(ids)),
      runStage("krakenInstruments",clock,()=>this.deps.fetchInstruments()),
    ]);

    const providerNowMs=this.deps.now().getTime();
    const quotesResolved=resolveProvider({
      stage:quoteStage,prior:this.quotesCache,fallback:[],
      ttlMs:ZOBIRIS_POLICY.providerFreshness.cmcQuotesMs,nowMs:providerNowMs,
      mode:this.cmcApiKey?"keyed":"keyless",
      dataAsOf:(data,completedAt)=>medianQuoteAsOf(data,completedAt),
    });
    this.quotesCache=quotesResolved.cache;

    const metadataResolved=resolveProvider({
      stage:metadataStage,prior:this.metadataCache,fallback:[],
      ttlMs:ZOBIRIS_POLICY.providerFreshness.cmcMetadataMs,nowMs:providerNowMs,
      mode:this.cmcApiKey?"keyed":"keyless",
      dataAsOf:(_data,completedAt)=>completedAt,
    });
    this.metadataCache=metadataResolved.cache;

    const instrumentsResolved=resolveProvider({
      stage:instrumentStage,prior:this.instrumentCache,fallback:new Map<string,any>(),
      ttlMs:ZOBIRIS_POLICY.providerFreshness.krakenInstrumentsMs,nowMs:providerNowMs,
      mode:"public-rest",
      dataAsOf:(_data,completedAt)=>completedAt,
    });
    this.instrumentCache=instrumentsResolved.cache;

    const rawInstruments=resolveWatchlistInstruments(watchlist.map(a=>a.symbol),instrumentsResolved.data);
    const quoteMap=new Map(quotesResolved.data.map(row=>[row.symbol.toUpperCase(),row]));
    const tickerPairs=rawInstruments.flatMap(row=>row.instrument?[row.instrument.pairKey]:[]);
    const tickerStage=tickerPairs.length
      ? await runStage("krakenTicker",clock,()=>this.deps.fetchTickers(tickerPairs))
      : skippedStage<Map<string,KrakenTicker>>("krakenTicker",clock,"no_resolved_kraken_pairs");

    const tickerResolved=resolveProvider({
      stage:tickerStage,prior:this.tickerCache,fallback:new Map<string,KrakenTicker>(),
      ttlMs:ZOBIRIS_POLICY.providerFreshness.krakenTickerMs,nowMs:this.deps.now().getTime(),
      mode:"public-rest",
      dataAsOf:(_data,completedAt)=>completedAt,
    });
    this.tickerCache=tickerResolved.cache;

    const freshness=quoteFreshness(quotesResolved.data,watchlist.map(a=>a.symbol),this.deps.now().getTime());
    const marketQuotes=quotesResolved.data.filter(q=>freshness.fresh.has(q.symbol.toUpperCase()));
    const referencePrices=new Map(
      [...quoteMap.entries()].flatMap(([symbol,quote])=>
        quote.priceUsd!=null&&Number.isFinite(quote.priceUsd)&&quote.priceUsd>0
          ? [[symbol,quote.priceUsd] as const] : []
      )
    );
    const instruments=verifyKrakenInstrumentPrices(
      rawInstruments,
      referencePrices,
      tickerResolved.data,
      ZOBIRIS_POLICY.identity.maxKrakenReferenceGapPct,
    );
    const instrumentMap=new Map(instruments.map(row=>[row.symbol,row]));
    const metaMap=new Map(metadataResolved.data.map(row=>[row.symbol.toUpperCase(),row]));
    const classifications=new Map(watchlist.map(asset=>{
      const meta=metaMap.get(asset.symbol);
      return [asset.symbol,classifyAsset({
        symbol:asset.symbol,
        categories:meta?.category?[meta.category]:[],
        tags:meta?.tags ?? [],
      })] as const;
    }));
    const metadataAuthoritative=!["STALE","ERROR","MISSING"].includes(metadataResolved.health.status);
    const riskPass=new Map(watchlist.map(asset=>{
      const c=classifications.get(asset.symbol)!;
      return [asset.symbol,metadataAuthoritative&&c.assetClass!=="UNKNOWN"&&!c.recommendationExcluded] as const;
    }));

    const clockBeforeExecution=assessClock({
      wallStartMs:wallStart.getTime(),
      wallEndMs:this.deps.now().getTime(),
      monotonicStartMs:monoStart,
      monotonicEndMs:this.deps.monotonicNow(),
      providerTimestamps:quotesResolved.data.map(q=>q.lastUpdated),
    });

    const authorityReasons:string[]=[];
    for(const [name,health] of [
      ["cmc_quotes",quotesResolved.health],
      ["kraken_instruments",instrumentsResolved.health],
      ["kraken_ticker",tickerResolved.health],
    ] as const) {
      if(["STALE","ERROR","MISSING"].includes(health.status)) authorityReasons.push(`${name}_not_fresh`);
    }
    if(!freshness.btcFresh) authorityReasons.push("btc_quote_not_fresh");
    if(freshness.coverage<ZOBIRIS_POLICY.providerFreshness.minFreshQuoteCoverage) authorityReasons.push("fresh_quote_coverage_too_low");
    if(clockBeforeExecution.state!=="HEALTHY") authorityReasons.push(...clockBeforeExecution.reasons);
    const authority={newBuyEnabled:authorityReasons.length===0,reasons:[...new Set(authorityReasons)]};

    this.persistPolicy();
    this.persistStatic(watchlist,classifications,instruments,attemptAt,metadataAuthoritative);

    const market=marketContext(marketQuotes,watchlist);
    const candidatePool=authority.newBuyEnabled ? watchlist
      .filter(a=>a.symbol!=="BTC")
      .filter(a=>!classifications.get(a.symbol)?.recommendationExcluded)
      .filter(a=>needsExecutionSample(quoteMap.get(a.symbol),market))
      .filter(a=>instrumentMap.get(a.symbol)?.state==="ACTIVE")
      .sort((a,b)=>{
        const qa=quoteMap.get(a.symbol),qb=quoteMap.get(b.symbol);
        const ra=(qa?.change30dPct??0)-(market.btc30dPct??0)+(qa?.change90dPct??0)-(market.btc90dPct??0);
        const rb=(qb?.change30dPct??0)-(market.btc30dPct??0)+(qb?.change90dPct??0)-(market.btc90dPct??0);
        return ra-rb;
      }) : [];

    const cacheTtlMs=Math.max(
      ZOBIRIS_POLICY.providerFreshness.executionCacheMinMs,
      (this.options.executionSampleDelayMs ?? ZOBIRIS_POLICY.executionSampling.delayMs)*
        candidatePool.length*ZOBIRIS_POLICY.executionSampling.cacheTtlMultiplier,
    );
    const nowMs=this.deps.now().getTime();
    for(const [symbol,cached] of this.executionCache) {
      const age=nowMs-Date.parse(cached.observedAt);
      if(!Number.isFinite(age)||age<0||age>cacheTtlMs) this.executionCache.delete(symbol);
    }

    const sampleLimit=Math.max(1,this.options.executionSampleLimit ?? ZOBIRIS_POLICY.executionSampling.sampleLimit);
    const candidates=[] as WatchlistAsset[];
    if(candidatePool.length) {
      const start=this.executionCursor % candidatePool.length;
      for(let i=0;i<Math.min(sampleLimit,candidatePool.length);i++) {
        candidates.push(candidatePool[(start+i)%candidatePool.length]!);
      }
      this.executionCursor=(start+candidates.length)%candidatePool.length;
    }

    const executions=new Map<string,Pick<PersonalExecutionResult,"hardPass"|"marketDepthGrade">>(
      [...this.executionCache.entries()].map(([symbol,cached])=>[symbol,cached.value])
    );

    let executionStage=authority.newBuyEnabled
      ? await runStage("executionSampling",clock,async()=>{
          let failures=0;
          for(let i=0;i<candidates.length;i++) {
            const asset=candidates[i]!;
            const instrument=instrumentMap.get(asset.symbol);
            if(!instrument?.instrument) continue;
            try {
              const book=await this.deps.fetchBook(instrument.instrument.pairKey);
              const result=evaluatePersonalExecution(book,{
                asOf:this.deps.now().toISOString(),
                proposedOrderUsd:this.options.proposedOrderUsd ?? ZOBIRIS_POLICY.capital.defaultPilotOrderUsd,
                costMinUsd:instrument.instrument.costMinUsd,
                orderMinBase:instrument.instrument.orderMin,
              });
              const value={hardPass:result.hardPass,marketDepthGrade:result.marketDepthGrade};
              executions.set(asset.symbol,value);
              this.executionCache.set(asset.symbol,{observedAt:book.observedAt,value});
              this.persistExecution(asset.symbol,result,book.observedAt);
            } catch {
              failures++;
            }
            if(i<candidates.length-1) await this.deps.sleep(this.options.executionSampleDelayMs ?? ZOBIRIS_POLICY.executionSampling.delayMs);
          }
          return {sampled:candidates.length-failures,failures};
        })
      : skippedStage<{sampled:number;failures:number}>("executionSampling",clock,"global_new_buy_authority_disabled");
    if(executionStage.status==="SUCCESS" && executionStage.data && executionStage.data.failures>0) {
      executionStage={...executionStage,status:"DEGRADED",error:`${executionStage.data.failures} candidate execution fetches failed`};
    }

    const decisionAt=this.deps.now().toISOString();
    const provisional=buildEngineSnapshot({
      generatedAt:decisionAt,watchlist,quotes:quotesResolved.data,marketQuotes,staleQuoteSymbols:freshness.stale,instruments,classifications,executions,riskPass,
      maneuverNavUsd:this.options.maneuverNavUsd ?? ZOBIRIS_POLICY.capital.defaultManeuverNavUsd,
      availableCashUsd:this.options.availableCashUsd ?? 0,
      authority,
    });

    if(authority.newBuyEnabled) this.applyEpisodes(provisional,priorSnapshot);

    const outcomeStage=clockBeforeExecution.state==="HEALTHY" &&
      !["STALE","ERROR","MISSING"].includes(instrumentsResolved.health.status)
      ? await runStage("outcomeResolution",clock,()=>resolveDueOutcomeBatch(this.db,{
          pairForSymbol:(symbol)=>this.pairForSymbol(symbol,instrumentMap),
          fetchCandles:this.deps.fetchCandles,
          now:this.deps.now,
        },this.options.outcomeResolveLimit ?? ZOBIRIS_POLICY.outcomes.resolveLimitPerRefresh))
      : skippedStage("outcomeResolution",clock,"clock_or_kraken_instruments_not_authoritative");

    const wallEnd=this.deps.now();
    const monoEnd=this.deps.monotonicNow();
    const finalClock=assessClock({
      wallStartMs:wallStart.getTime(),
      wallEndMs:wallEnd.getTime(),
      monotonicStartMs:monoStart,
      monotonicEndMs:monoEnd,
      providerTimestamps:quotesResolved.data.map(q=>q.lastUpdated),
    });
    if(finalClock.state!=="HEALTHY" && authority.newBuyEnabled) {
      authority.newBuyEnabled=false;
      authority.reasons=[...new Set([...authority.reasons,...finalClock.reasons])];
    }

    const stages=[quoteStage,metadataStage,instrumentStage,tickerStage,executionStage,outcomeStage];
    const failedStages=stages.filter(stage=>stage.status==="FAILED");
    const currentPipelineSuccess=
      quoteStage.status==="SUCCESS" &&
      metadataStage.status==="SUCCESS" &&
      instrumentStage.status==="SUCCESS" &&
      tickerStage.status==="SUCCESS" &&
      finalClock.state==="HEALTHY";
    if(currentPipelineSuccess) this.lastRefreshSuccessAt=wallEnd.toISOString();

    const runtimeHealth:EngineSnapshot["health"]={
      cmc:quotesResolved.health.status,
      krakenInstruments:instrumentsResolved.health.status,
      executionSampled:executions.size,
      watchlistCount:watchlist.length,
      lastRefreshAttemptAt:attemptAt,
      lastRefreshSuccessAt:this.lastRefreshSuccessAt,
      refreshDurationMs:Math.max(0,monoEnd-monoStart),
      lastError:failedStages.length
        ? failedStages.map(stage=>`${stage.name}: ${stage.error ?? "failed"}`).join("; ")
        : null,
      providers:{
        cmcQuotes:quotesResolved.health,
        cmcMetadata:metadataResolved.health,
        krakenInstruments:instrumentsResolved.health,
        krakenTicker:tickerResolved.health,
      },
      clock:{
        state:finalClock.state,
        wallMonotonicDriftMs:finalClock.wallMonotonicDriftMs,
        futureProviderTimestampCount:finalClock.futureProviderTimestampCount,
        reasons:finalClock.reasons,
      },
      stages:stages.map(stage=>stageHealth(stage)),
    };

    const snapshot=buildEngineSnapshot({
      generatedAt:decisionAt,watchlist,quotes:quotesResolved.data,marketQuotes,staleQuoteSymbols:freshness.stale,instruments,classifications,executions,riskPass,
      maneuverNavUsd:this.options.maneuverNavUsd ?? ZOBIRIS_POLICY.capital.defaultManeuverNavUsd,
      availableCashUsd:this.options.availableCashUsd ?? 0,
      authority,
      runtimeHealth,
    });

    this.persistProviderHealth(runtimeHealth.providers);
    this.persistRefreshRun(snapshot,currentPipelineSuccess,wallEnd.toISOString());
    this.snapshot=snapshot;
    return snapshot;
  }

  private applyEpisodes(snapshot:EngineSnapshot,prior:EngineSnapshot|null) {
    const indeterminate=new Set(["EXECUTION_WARMUP","DATA_INCOMPLETE","DATA_STALE","KRAKEN_IDENTITY_UNVERIFIED"]);
    for(const row of snapshot.rows) {
      if(row.symbol==="BTC" || row.priceUsd==null || indeterminate.has(row.state)) continue;
      const fromState=prior?.rows.find(x=>x.symbol===row.symbol)?.state ?? null;
      applyStrategyTransition(this.db,{
        symbol:row.symbol,
        strategyTag:ZOBIRIS_POLICY.strategy.tag,
        strategyVersion:ZOBIRIS_POLICY.strategy.version,
        policyVersion:ZOBIRIS_POLICY.version,
        policyHash:ZOBIRIS_POLICY_HASH,
        fromState,
        toState:row.state,
        signalAt:snapshot.generatedAt,
        signalPrice:row.priceUsd,
        btcSignalPrice:snapshot.market.btcPriceUsd,
        intendedLimit:row.intendedLimitPrice,
        recommendedSizeUsd:row.maxNewOrderUsd,
        decisionContext:{
          market:snapshot.market,
          authority:snapshot.authority,
          row:{
            state:row.state,
            priceUsd:row.priceUsd,
            intendedLimitPrice:row.intendedLimitPrice,
            change7dPct:row.change7dPct,
            change30dPct:row.change30dPct,
            change90dPct:row.change90dPct,
            relative30dVsBtcPct:row.relative30dVsBtcPct,
            relative90dVsBtcPct:row.relative90dVsBtcPct,
            catchUpQuality:row.catchUpQuality,
            entryQuality:row.entryQuality,
            marketDepthGrade:row.marketDepthGrade,
            personalExecutionPass:row.personalExecutionPass,
            setupQualified:row.setupQualified,
            maxNewOrderUsd:row.maxNewOrderUsd,
            reasonCodes:row.reasonCodes,
          },
        },
      });
    }
  }

  private pairForSymbol(symbol:string,instrumentMap:Map<string,WatchlistInstrumentState>) {
    const current=instrumentMap.get(symbol);
    if(current) return current.state==="ACTIVE"&&current.instrument ? current.instrument.pairKey : null;
    const stored=this.db.prepare("SELECT pair_key,status,online FROM kraken_instruments WHERE symbol=?").get(symbol) as
      {pair_key:string;status:string;online:number}|undefined;
    return stored?.online===1&&stored.status==="online"?stored.pair_key:null;
  }

  private persistPolicy() {
    this.db.prepare(`INSERT OR IGNORE INTO policy_versions(policy_hash,policy_version,canonical_json,first_seen_at)
      VALUES (?,?,?,?)`).run(
        ZOBIRIS_POLICY_HASH,ZOBIRIS_POLICY.version,ZOBIRIS_POLICY_CANONICAL_JSON,this.deps.now().toISOString()
      );
  }

  private persistProviderHealth(providers:EngineSnapshot["health"]["providers"]) {
    const stmt=this.db.prepare(`INSERT INTO provider_health(provider,status,last_attempt_at,last_success_at,data_as_of,error,updated_at)
      VALUES (?,?,?,?,?,?,?)
      ON CONFLICT(provider) DO UPDATE SET status=excluded.status,last_attempt_at=excluded.last_attempt_at,
        last_success_at=excluded.last_success_at,data_as_of=excluded.data_as_of,error=excluded.error,updated_at=excluded.updated_at`);
    const now=this.deps.now().toISOString();
    this.db.transaction(()=>{
      for(const [name,health] of Object.entries(providers)) {
        stmt.run(name,health.status,health.lastAttemptAt ?? now,health.lastSuccessAt,health.dataAsOf,health.error,now);
      }
    })();
  }

  private persistRefreshRun(snapshot:EngineSnapshot,success:boolean,completedAt:string) {
    this.db.prepare(`INSERT INTO refresh_runs(
      started_at,completed_at,duration_ms,success,clock_state,new_buy_authority,policy_version,policy_hash,error
    ) VALUES (?,?,?,?,?,?,?,?,?)`).run(
      snapshot.health.lastRefreshAttemptAt,completedAt,snapshot.health.refreshDurationMs,
      success?1:0,snapshot.health.clock.state,snapshot.authority.newBuyEnabled?1:0,
      snapshot.policy.version,snapshot.policy.hash,snapshot.health.lastError
    );
  }

  private persistStatic(
    watchlist:WatchlistAsset[],
    classifications:Map<string,ReturnType<typeof classifyAsset>>,
    instruments:WatchlistInstrumentState[],
    at:string,
    classificationAuthoritative:boolean,
  ) {
    const assetStmt=this.db.prepare(`INSERT INTO assets(symbol,asset_class,classification_reason,updated_at) VALUES (?,?,?,?)
      ON CONFLICT(symbol) DO UPDATE SET asset_class=excluded.asset_class,classification_reason=excluded.classification_reason,updated_at=excluded.updated_at`);
    const assetInsertOnly=this.db.prepare(`INSERT OR IGNORE INTO assets(symbol,asset_class,classification_reason,updated_at) VALUES (?,?,?,?)`);
    const watchStmt=this.db.prepare(`INSERT INTO watchlist(symbol,enabled,added_at) VALUES (?,1,?)
      ON CONFLICT(symbol) DO UPDATE SET enabled=1`);
    const instrumentStmt=this.db.prepare(`INSERT INTO kraken_instruments(symbol,pair_key,altname,wsname,status,online,order_min,cost_min_usd,tick_size,pair_decimals,lot_decimals,observed_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
      ON CONFLICT(symbol) DO UPDATE SET pair_key=excluded.pair_key,altname=excluded.altname,wsname=excluded.wsname,status=excluded.status,online=excluded.online,
      order_min=excluded.order_min,cost_min_usd=excluded.cost_min_usd,tick_size=excluded.tick_size,pair_decimals=excluded.pair_decimals,lot_decimals=excluded.lot_decimals,observed_at=excluded.observed_at`);
    this.db.transaction(()=>{
      for(const asset of watchlist) {
        const classification=classifications.get(asset.symbol)!;
        if(classificationAuthoritative) assetStmt.run(asset.symbol,classification.assetClass,classification.reason,at);
        else assetInsertOnly.run(asset.symbol,classification.assetClass,classification.reason,at);
        watchStmt.run(asset.symbol,at);
      }
      for(const row of instruments) {
        if(!row.instrument) continue;
        const x=row.instrument;
        instrumentStmt.run(row.symbol,x.pairKey,x.altname,x.wsname,x.status,x.online?1:0,x.orderMin,x.costMinUsd,x.tickSize,x.pairDecimals,x.lotDecimals,at);
      }
    })();
  }

  private persistExecution(symbol:string,result:PersonalExecutionResult,observedAt:string) {
    const stmt=this.db.prepare(`INSERT OR REPLACE INTO execution_snapshots(symbol,observed_at,side,notional_usd,complete,impact_bps,vwap,worst_price,personal_gate)
      VALUES (?,?,?,?,?,?,?,?,?)`);
    const rows=[
      [result.standardBuy,1],[result.standardSell,1],[result.proposedBuy,1],
      ...Object.values(result.stress).flatMap(pair=>[[pair.buy,0],[pair.sell,0]] as const),
    ] as const;
    this.db.transaction(()=>{
      for(const [walk,personal] of rows) stmt.run(symbol,observedAt,walk.side,walk.requestedUsd,walk.complete?1:0,walk.impactBps,walk.vwap,walk.worstPrice,personal);
    })();
  }
}
