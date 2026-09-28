import type { CmcMarketQuote } from "../market/cmc/client.js";
import type { AssetClassification } from "../market/classification/classify.js";
import type { PersonalExecutionResult } from "../market/kraken/execution.js";
import { snapBuyLimitToTick, type WatchlistInstrumentState } from "../market/kraken/instruments.js";
import { ZOBIRIS_POLICY, ZOBIRIS_POLICY_HASH } from "../policy/config.js";
import { evaluateDelayedRotation, type RotationMarketContext } from "../strategies/delayedRotation/evaluate.js";
import type { WatchlistAsset } from "../shared/watchlist.js";
import type { EngineRow, EngineSnapshot, EngineState, ProviderHealth } from "./types.js";

export interface BuildEngineInput {
  generatedAt:string;
  watchlist:WatchlistAsset[];
  quotes:CmcMarketQuote[];
  marketQuotes?:CmcMarketQuote[];
  staleQuoteSymbols?:Set<string>;
  cmcRanks?:Map<string,number>;
  instruments:WatchlistInstrumentState[];
  classifications:Map<string,AssetClassification>;
  executions:Map<string,Pick<PersonalExecutionResult,"hardPass"|"marketDepthGrade">>;
  riskPass:Map<string,boolean>;
  maneuverNavUsd:number;
  availableCashUsd:number;
  authority?:EngineSnapshot["authority"];
  runtimeHealth?:EngineSnapshot["health"];
}

const ratio=(n:number,d:number)=>d>0?n/d:null;
const present=(n:number|null|undefined):n is number=>n!=null&&Number.isFinite(n);
const qmap=(quotes:CmcMarketQuote[])=>new Map(quotes.map(q=>[q.symbol.toUpperCase(),q]));
const imap=(rows:WatchlistInstrumentState[])=>new Map(rows.map(r=>[r.symbol,r]));

function emptyProvider(status:ProviderHealth["status"]="MISSING"):ProviderHealth {
  return {status,lastAttemptAt:null,lastSuccessAt:null,dataAsOf:null,ageMs:null,error:null,mode:null};
}

export function marketContext(quotes:CmcMarketQuote[],watchlist:WatchlistAsset[]):RotationMarketContext {
  const bySymbol=qmap(quotes);
  const btc=bySymbol.get("BTC");
  const comparable=watchlist.filter(a=>a.symbol!=="BTC").map(a=>bySymbol.get(a.symbol)).filter((q):q is CmcMarketQuote=>!!q);
  const valid7=comparable.filter(q=>present(q.change7dPct));
  const valid30=comparable.filter(q=>present(q.change30dPct));
  return {
    btc7dPct:btc?.change7dPct ?? null,
    btc30dPct:btc?.change30dPct ?? null,
    btc90dPct:btc?.change90dPct ?? null,
    breadth7dPositive:ratio(valid7.filter(q=>q.change7dPct!>0).length,valid7.length),
    breadth30dPositive:ratio(valid30.filter(q=>q.change30dPct!>0).length,valid30.length),
  };
}

export function needsExecutionSample(quote:CmcMarketQuote|undefined,market:RotationMarketContext) {
  const p=ZOBIRIS_POLICY;
  if(!quote||!present(quote.change7dPct)||!present(quote.change30dPct)||!present(quote.change90dPct)) return false;
  const marketPotential=
    present(market.btc30dPct)&&present(market.btc90dPct)&&
    present(market.breadth7dPositive)&&present(market.breadth30dPositive)&&
    market.btc30dPct>p.market.btc30dMinPct&&market.btc90dPct>p.market.btc90dMinPct&&
    market.breadth7dPositive>=p.market.breadth7dPositiveMin&&
    market.breadth30dPositive>=p.market.breadth30dPositiveMin;
  if(!marketPotential) return false;
  const recovering=quote.change7dPct>0&&quote.change7dPct<=p.candidate.maxRecovery7dPct+2;
  const lagging=quote.change30dPct<=p.executionSampling.absoluteLagBufferPct || quote.change90dPct<=p.executionSampling.absoluteLagBufferPct
    || quote.change30dPct-market.btc30dPct!<=p.candidate.relative30dNearRotationPct
    || quote.change90dPct-market.btc90dPct!<=p.candidate.relative90dNearRotationPct;
  return recovering&&lagging;
}

export function buildEngineSnapshot(input:BuildEngineInput):EngineSnapshot {
  const quotes=qmap(input.quotes), instruments=imap(input.instruments);
  const market=marketContext(input.marketQuotes ?? input.quotes,input.watchlist);
  const btc=quotes.get("BTC");
  const p=ZOBIRIS_POLICY;
  const authority=input.authority ?? {newBuyEnabled:true,reasons:[]};
  const marketState:EngineSnapshot["market"]["state"]=
    !present(market.btc30dPct)||!present(market.btc90dPct)||!present(market.breadth7dPositive)||!present(market.breadth30dPositive)
      ? "DATA_INCOMPLETE"
      : market.btc30dPct>p.market.btc30dMinPct&&market.btc90dPct>p.market.btc90dMinPct&&
        market.breadth7dPositive>=p.market.breadth7dPositiveMin&&market.breadth30dPositive>=p.market.breadth30dPositiveMin
        ? "BULLISH":"NOT_BULLISH";

  const unsorted:Omit<EngineRow,"rank">[]=input.watchlist.map(asset=>{
    const symbol=asset.symbol.toUpperCase();
    const quote=quotes.get(symbol);
    const instrument=instruments.get(symbol);
    const classification=input.classifications.get(symbol);
    const execution=input.executions.get(symbol);
    const riskPass=input.riskPass.get(symbol) ?? false;
    const inert=(state:EngineState,reasons:string[],price=quote?.priceUsd??null):Omit<EngineRow,"rank">=>({
      symbol,name:asset.name,cmcRank:input.cmcRanks?.get(symbol)??null,state,
      priceUsd:price,intendedLimitPrice:null,change7dPct:quote?.change7dPct??null,
      change30dPct:quote?.change30dPct??null,change90dPct:quote?.change90dPct??null,
      relative30dVsBtcPct:null,relative90dVsBtcPct:null,catchUpQuality:0,entryQuality:0,
      marketDepthGrade:execution?.marketDepthGrade??null,personalExecutionPass:execution?.hardPass??null,
      krakenPair:instrument?.instrument?.pairKey??null,setupQualified:false,maxNewOrderUsd:0,
      qualifiesForNewCapital:false,reasonCodes:reasons
    });

    if(input.staleQuoteSymbols?.has(symbol)) return inert("DATA_STALE",["asset_market_quote_stale"]);
    if(symbol==="BTC") return {...inert("BENCHMARK",["btc_is_strategy_benchmark"]),relative30dVsBtcPct:0,relative90dVsBtcPct:0};
    if(!quote) return inert("DATA_INCOMPLETE",["cmc_market_context_missing"],null);
    if(!instrument||instrument.state==="NO_KRAKEN_USD_MARKET") {
      return {...inert("NO_KRAKEN_USD_MARKET",["no_active_kraken_usd_pair"]),krakenPair:null,
        relative30dVsBtcPct:present(quote.change30dPct)&&present(market.btc30dPct)?quote.change30dPct-market.btc30dPct:null,
        relative90dVsBtcPct:present(quote.change90dPct)&&present(market.btc90dPct)?quote.change90dPct-market.btc90dPct:null};
    }
    if(instrument.state==="KRAKEN_IDENTITY_UNVERIFIED" || instrument.state==="KRAKEN_ASSET_MISMATCH") {
      return inert(instrument.state as EngineState,[
        instrument.state==="KRAKEN_ASSET_MISMATCH"?"kraken_reference_price_mismatch":instrument.reason
      ]);
    }
    if(instrument.state==="KRAKEN_MARKET_NOT_ONLINE") return inert("KRAKEN_MARKET_NOT_ONLINE",["kraken_pair_not_online"]);

    const cls=classification ?? {symbol,assetClass:"UNKNOWN" as const,recommendationExcluded:false,reason:"classification_data_missing"};
    const executionNeeded=needsExecutionSample(quote,market);
    if(executionNeeded && !execution) {
      const provisional=evaluateDelayedRotation(market,{
        symbol,priceUsd:quote.priceUsd,change24hPct:quote.change24hPct,change7dPct:quote.change7dPct,
        change30dPct:quote.change30dPct,change90dPct:quote.change90dPct,classification:cls,execution:null,riskPass
      },{maneuverNavUsd:input.maneuverNavUsd,availableCashUsd:input.availableCashUsd});
      return {
        ...inert(authority.newBuyEnabled?"EXECUTION_WARMUP":"DATA_STALE",[
          authority.newBuyEnabled?"execution_sample_pending":"global_new_buy_authority_disabled",
          ...(!authority.newBuyEnabled?authority.reasons:[]),
          ...provisional.reasonCodes
        ]),
        relative30dVsBtcPct:provisional.relative30dVsBtcPct,relative90dVsBtcPct:provisional.relative90dVsBtcPct,
        catchUpQuality:provisional.catchUpQuality
      };
    }

    const d=evaluateDelayedRotation(market,{
      symbol,priceUsd:quote.priceUsd,change24hPct:quote.change24hPct,change7dPct:quote.change7dPct,
      change30dPct:quote.change30dPct,change90dPct:quote.change90dPct,classification:cls,execution:execution??null,riskPass
    },{maneuverNavUsd:input.maneuverNavUsd,availableCashUsd:input.availableCashUsd});
    const intendedLimitPrice=snapBuyLimitToTick(d.intendedLimitPrice,instrument.instrument?.tickSize ?? null);
    const entryQuality=d.recommendedPullbackPct==null?0:
      Math.round((100-d.recommendedPullbackPct*p.display.entryQualityPenaltyPerPullbackPct)*100)/100;
    const authorityBlocked=d.setupQualified&&!authority.newBuyEnabled;
    return {
      symbol,name:asset.name,cmcRank:input.cmcRanks?.get(symbol)??null,
      state:authorityBlocked?"DATA_STALE":d.state,
      priceUsd:quote.priceUsd,intendedLimitPrice,change7dPct:quote.change7dPct,
      change30dPct:quote.change30dPct,change90dPct:quote.change90dPct,
      relative30dVsBtcPct:d.relative30dVsBtcPct,relative90dVsBtcPct:d.relative90dVsBtcPct,
      catchUpQuality:d.catchUpQuality,entryQuality,marketDepthGrade:execution?.marketDepthGrade??null,
      personalExecutionPass:execution?.hardPass??null,krakenPair:instrument.instrument?.pairKey??null,
      setupQualified:d.setupQualified,
      maxNewOrderUsd:authorityBlocked?0:d.maxNewOrderUsd,
      qualifiesForNewCapital:authorityBlocked?false:d.qualifiesForNewCapital,
      reasonCodes:authorityBlocked?[...d.reasonCodes,"global_new_buy_authority_disabled",...authority.reasons]:d.reasonCodes
    };
  });

  const statePriority=(row:Omit<EngineRow,"rank">)=>row.qualifiesForNewCapital?6:
    row.state==="EXECUTION_WARMUP"?5:row.state==="NEAR_ROTATION"?4:row.state==="TOO_EARLY"?3:
    row.state==="ALREADY_EXTENDED"?2:row.state==="BENCHMARK"?1:0;
  const governed=(input.newCapitalAuthorityEnabled===false
    ? unsorted.map(row=>row.symbol==="BTC"?row:{
        ...row,
        qualifiesForNewCapital:false,
        maxNewOrderUsd:0,
        reasonCodes:[...new Set([...row.reasonCodes,"provider_or_clock_authority_disabled"])],
      })
    : unsorted);
  const rows=governed.sort((a,b)=>statePriority(b)-statePriority(a)
    || b.catchUpQuality-a.catchUpQuality
    || (a.cmcRank??999999)-(b.cmcRank??999999)
    || a.symbol.localeCompare(b.symbol))
    .map((row,index)=>({...row,rank:index+1}));

  const defaultHealth:EngineSnapshot["health"]={
    cmc:input.quotes.length?"LIVE":"MISSING",
    krakenInstruments:"LIVE",
    executionSampled:input.executions.size,
    watchlistCount:input.watchlist.length,
    lastRefreshAttemptAt:input.generatedAt,
    lastRefreshSuccessAt:input.generatedAt,
    refreshDurationMs:0,
    lastError:null,
    providers:{
      cmcQuotes:emptyProvider(input.quotes.length?"LIVE":"MISSING"),
      cmcMetadata:emptyProvider("MISSING"),
      krakenInstruments:emptyProvider("LIVE"),
      krakenTicker:emptyProvider("LIVE"),
    },
    clock:{state:"HEALTHY",wallMonotonicDriftMs:0,futureProviderTimestampCount:0,reasons:[]},
    stages:[],
  };

  return {
    version:"1.1",generatedAt:input.generatedAt,
    policy:{version:DELAYED_ROTATION_POLICY.version,hash:DELAYED_ROTATION_POLICY_HASH},
    policy:{version:p.version,hash:ZOBIRIS_POLICY_HASH},
    authority,
    market:{state:marketState,btcPriceUsd:btc?.priceUsd??null,btc7dPct:market.btc7dPct,btc30dPct:market.btc30dPct,btc90dPct:market.btc90dPct,
      breadth7dPositive:market.breadth7dPositive,breadth30dPositive:market.breadth30dPositive},
    health:input.runtimeHealth ?? defaultHealth,
    qualifiedCount:rows.filter(r=>r.qualifiesForNewCapital).length,
    nearRotationCount:rows.filter(r=>r.state==="NEAR_ROTATION"||r.state==="EXECUTION_WARMUP").length,
    rows
  };
}
