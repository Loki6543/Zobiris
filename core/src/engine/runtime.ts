import type Database from "better-sqlite3";
import { classifyAsset } from "../market/classification/classify.js";
import { fetchCmcMetadata, fetchCmcQuotes, type CmcMarketQuote, type CmcMetadata } from "../market/cmc/client.js";
import { evaluatePersonalExecution, type PersonalExecutionResult } from "../market/kraken/execution.js";
import { fetchOrderBook, fetchUsdInstrumentRegistry } from "../market/kraken/client.js";
import { resolveWatchlistInstruments, type WatchlistInstrumentState } from "../market/kraken/instruments.js";
import { CURRENT_WATCHLIST, type WatchlistAsset } from "../shared/watchlist.js";
import { buildEngineSnapshot, marketContext, needsExecutionSample } from "./rank.js";
import type { EngineSnapshot } from "./types.js";

export interface EngineRuntimeDeps {
  fetchQuotes:(ids:string[])=>Promise<CmcMarketQuote[]>;
  fetchMetadata:(ids:string[])=>Promise<CmcMetadata[]>;
  fetchInstruments:()=>Promise<Map<string,any>>;
  fetchBook:(pair:string)=>Promise<any>;
  now:()=>Date;
  sleep:(ms:number)=>Promise<void>;
}

export interface EngineRuntimeOptions {
  watchlist?:WatchlistAsset[];
  maneuverNavUsd?:number;
  availableCashUsd?:number;
  proposedOrderUsd?:number;
  executionSampleLimit?:number;
  executionSampleDelayMs?:number;
}

function defaultDeps(cmcApiKey?:string):EngineRuntimeDeps {
  return {
    fetchQuotes:(ids)=>fetchCmcQuotes(ids,{apiKey:cmcApiKey}),
    fetchMetadata:(ids)=>fetchCmcMetadata(ids,{apiKey:cmcApiKey}),
    fetchInstruments:()=>fetchUsdInstrumentRegistry(),
    fetchBook:(pair)=>fetchOrderBook(pair),
    now:()=>new Date(),
    sleep:(ms)=>new Promise(resolve=>setTimeout(resolve,ms)),
  };
}

export class EngineRuntime {
  private snapshot:EngineSnapshot|null=null;
  private inflight:Promise<EngineSnapshot>|null=null;
  private executionCursor=0;
  private executionCache=new Map<string,{observedAt:string;value:Pick<PersonalExecutionResult,"hardPass"|"marketDepthGrade">}>();

  constructor(
    private readonly db:Database.Database,
    cmcApiKey?:string,
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
    const watchlist=this.options.watchlist ?? CURRENT_WATCHLIST;
    const ids=watchlist.map(a=>a.cmcId);
    const generatedAt=this.deps.now().toISOString();

    const [quotes,metadata,registry]=await Promise.all([
      this.deps.fetchQuotes(ids),
      this.deps.fetchMetadata(ids),
      this.deps.fetchInstruments(),
    ]);
    const instruments=resolveWatchlistInstruments(watchlist.map(a=>a.symbol),registry);
    const instrumentMap=new Map(instruments.map(row=>[row.symbol,row]));
    const quoteMap=new Map(quotes.map(row=>[row.symbol.toUpperCase(),row]));
    const metaMap=new Map(metadata.map(row=>[row.symbol.toUpperCase(),row]));
    const classifications=new Map(watchlist.map(asset=>{
      const meta=metaMap.get(asset.symbol);
      return [asset.symbol,classifyAsset({
        symbol:asset.symbol,
        categories:meta?.category?[meta.category]:[],
        tags:meta?.tags ?? [],
      })] as const;
    }));
    const riskPass=new Map(watchlist.map(asset=>{
      const c=classifications.get(asset.symbol)!;
      return [asset.symbol,c.assetClass!=="UNKNOWN"&&!c.recommendationExcluded] as const;
    }));

    this.persistStatic(watchlist,classifications,instruments,generatedAt);

    const market=marketContext(quotes,watchlist);
    const candidatePool=watchlist
      .filter(a=>a.symbol!=="BTC")
      .filter(a=>!classifications.get(a.symbol)?.recommendationExcluded)
      .filter(a=>needsExecutionSample(quoteMap.get(a.symbol),market))
      .filter(a=>instrumentMap.get(a.symbol)?.state==="ACTIVE")
      .sort((a,b)=>{
        const qa=quoteMap.get(a.symbol),qb=quoteMap.get(b.symbol);
        const ra=(qa?.change30dPct??0)-(market.btc30dPct??0)+(qa?.change90dPct??0)-(market.btc90dPct??0);
        const rb=(qb?.change30dPct??0)-(market.btc30dPct??0)+(qb?.change90dPct??0)-(market.btc90dPct??0);
        return ra-rb;
      });

    const cacheTtlMs=Math.max(15*60_000,(this.options.executionSampleDelayMs ?? 300)*candidatePool.length*3);
    const nowMs=this.deps.now().getTime();
    for(const [symbol,cached] of this.executionCache) {
      const age=nowMs-Date.parse(cached.observedAt);
      if(!Number.isFinite(age)||age<0||age>cacheTtlMs) this.executionCache.delete(symbol);
    }

    const sampleLimit=Math.max(1,this.options.executionSampleLimit ?? 12);
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
    for(let i=0;i<candidates.length;i++) {
      const asset=candidates[i]!;
      const instrument=instrumentMap.get(asset.symbol);
      if(!instrument?.instrument) continue;
      try {
        const book=await this.deps.fetchBook(instrument.instrument.pairKey);
        const result=evaluatePersonalExecution(book,{
          asOf:this.deps.now().toISOString(),
          proposedOrderUsd:this.options.proposedOrderUsd ?? 37,
          costMinUsd:instrument.instrument.costMinUsd,
          orderMinBase:instrument.instrument.orderMin,
        });
        const value={hardPass:result.hardPass,marketDepthGrade:result.marketDepthGrade};
        executions.set(asset.symbol,value);
        this.executionCache.set(asset.symbol,{observedAt:book.observedAt,value});
        this.persistExecution(asset.symbol,result,book.observedAt);
      } catch {
        // Missing execution evidence stays missing; ranking will show warmup/incomplete instead of passing.
      }
      if(i<candidates.length-1) await this.deps.sleep(this.options.executionSampleDelayMs ?? 300);
    }

    const snapshot=buildEngineSnapshot({
      generatedAt,watchlist,quotes,instruments,classifications,executions,riskPass,
      maneuverNavUsd:this.options.maneuverNavUsd ?? 1850,
      availableCashUsd:this.options.availableCashUsd ?? 0,
      cmcHealth:"LIVE",krakenHealth:"LIVE",
    });
    this.snapshot=snapshot;
    return snapshot;
  }

  private persistStatic(watchlist:WatchlistAsset[],classifications:Map<string,ReturnType<typeof classifyAsset>>,instruments:WatchlistInstrumentState[],at:string) {
    const assetStmt=this.db.prepare(`INSERT INTO assets(symbol,asset_class,classification_reason,updated_at) VALUES (?,?,?,?)
      ON CONFLICT(symbol) DO UPDATE SET asset_class=excluded.asset_class,classification_reason=excluded.classification_reason,updated_at=excluded.updated_at`);
    const watchStmt=this.db.prepare(`INSERT INTO watchlist(symbol,enabled,added_at) VALUES (?,1,?)
      ON CONFLICT(symbol) DO UPDATE SET enabled=1`);
    const instrumentStmt=this.db.prepare(`INSERT INTO kraken_instruments(symbol,pair_key,altname,wsname,status,online,order_min,cost_min_usd,tick_size,pair_decimals,lot_decimals,observed_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
      ON CONFLICT(symbol) DO UPDATE SET pair_key=excluded.pair_key,altname=excluded.altname,wsname=excluded.wsname,status=excluded.status,online=excluded.online,
      order_min=excluded.order_min,cost_min_usd=excluded.cost_min_usd,tick_size=excluded.tick_size,pair_decimals=excluded.pair_decimals,lot_decimals=excluded.lot_decimals,observed_at=excluded.observed_at`);
    this.db.transaction(()=>{
      for(const asset of watchlist) {
        const classification=classifications.get(asset.symbol)!;
        assetStmt.run(asset.symbol,classification.assetClass,classification.reason,at);
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
