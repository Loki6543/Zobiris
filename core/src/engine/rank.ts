import type { CmcMarketQuote } from "../market/cmc/client.js";
import type { AssetClassification } from "../market/classification/classify.js";
import type { PersonalExecutionResult } from "../market/kraken/execution.js";
import { snapBuyLimitToTick, type WatchlistInstrumentState } from "../market/kraken/instruments.js";
import { evaluateDelayedRotation, type RotationMarketContext } from "../strategies/delayedRotation/evaluate.js";
import type { WatchlistAsset } from "../shared/watchlist.js";
import type { EngineRow, EngineSnapshot, EngineState } from "./types.js";

export interface BuildEngineInput {
  generatedAt:string;
  watchlist:WatchlistAsset[];
  quotes:CmcMarketQuote[];
  cmcRanks?:Map<string,number>;
  instruments:WatchlistInstrumentState[];
  classifications:Map<string,AssetClassification>;
  executions:Map<string,Pick<PersonalExecutionResult,"hardPass"|"marketDepthGrade">>;
  riskPass:Map<string,boolean>;
  maneuverNavUsd:number;
  availableCashUsd:number;
  cmcHealth?:EngineSnapshot["health"]["cmc"];
  krakenHealth?:EngineSnapshot["health"]["krakenInstruments"];
}

const ratio=(n:number,d:number)=>d>0?n/d:null;
const present=(n:number|null|undefined):n is number=>n!=null&&Number.isFinite(n);
const qmap=(quotes:CmcMarketQuote[])=>new Map(quotes.map(q=>[q.symbol.toUpperCase(),q]));
const imap=(rows:WatchlistInstrumentState[])=>new Map(rows.map(r=>[r.symbol,r]));

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
  if(!quote||!present(quote.change7dPct)||!present(quote.change30dPct)||!present(quote.change90dPct)) return false;
  const marketPotential=
    present(market.btc30dPct)&&present(market.btc90dPct)&&
    present(market.breadth7dPositive)&&present(market.breadth30dPositive)&&
    market.btc30dPct>0&&market.btc90dPct>0&&
    market.breadth7dPositive>=0.55&&market.breadth30dPositive>=0.45;
  if(!marketPotential) return false;
  const recovering=quote.change7dPct>0&&quote.change7dPct<=14;
  const lagging=quote.change30dPct<=3 || quote.change90dPct<=3
    || quote.change30dPct-market.btc30dPct!<=-8
    || quote.change90dPct-market.btc90dPct!<=-20;
  return recovering&&lagging;
}

export function buildEngineSnapshot(input:BuildEngineInput):EngineSnapshot {
  const quotes=qmap(input.quotes), instruments=imap(input.instruments);
  const market=marketContext(input.quotes,input.watchlist);
  const btc=quotes.get("BTC");
  const marketState:EngineSnapshot["market"]["state"]=
    !present(market.btc30dPct)||!present(market.btc90dPct)||!present(market.breadth7dPositive)||!present(market.breadth30dPositive)
      ? "DATA_INCOMPLETE"
      : market.btc30dPct>0&&market.btc90dPct>0&&market.breadth7dPositive>=.55&&market.breadth30dPositive>=.45
        ? "BULLISH":"NOT_BULLISH";

  const unsorted:Omit<EngineRow,"rank">[]=input.watchlist.map(asset=>{
    const symbol=asset.symbol.toUpperCase();
    const quote=quotes.get(symbol);
    const instrument=instruments.get(symbol);
    const classification=input.classifications.get(symbol);
    const execution=input.executions.get(symbol);
    const riskPass=input.riskPass.get(symbol) ?? false;

    if(symbol==="BTC") return {
      symbol,name:asset.name,cmcRank:input.cmcRanks?.get(symbol)??null,state:"BENCHMARK" as EngineState,
      priceUsd:quote?.priceUsd??null,intendedLimitPrice:null,change7dPct:quote?.change7dPct??null,
      change30dPct:quote?.change30dPct??null,change90dPct:quote?.change90dPct??null,
      relative30dVsBtcPct:0,relative90dVsBtcPct:0,catchUpQuality:0,entryQuality:0,marketDepthGrade:execution?.marketDepthGrade??null,
      personalExecutionPass:execution?.hardPass??null,krakenPair:instrument?.instrument?.pairKey??null,maxNewOrderUsd:0,
      qualifiesForNewCapital:false,reasonCodes:["btc_is_strategy_benchmark"]
    };
    if(!quote) return {
      symbol,name:asset.name,cmcRank:input.cmcRanks?.get(symbol)??null,state:"DATA_INCOMPLETE" as EngineState,
      priceUsd:null,intendedLimitPrice:null,change7dPct:null,change30dPct:null,change90dPct:null,
      relative30dVsBtcPct:null,relative90dVsBtcPct:null,catchUpQuality:0,entryQuality:0,marketDepthGrade:null,
      personalExecutionPass:null,krakenPair:instrument?.instrument?.pairKey??null,maxNewOrderUsd:0,qualifiesForNewCapital:false,
      reasonCodes:["cmc_market_context_missing"]
    };
    if(!instrument||instrument.state==="NO_KRAKEN_USD_MARKET") return {
      symbol,name:asset.name,cmcRank:input.cmcRanks?.get(symbol)??null,state:"NO_KRAKEN_USD_MARKET" as EngineState,
      priceUsd:quote.priceUsd,intendedLimitPrice:null,change7dPct:quote.change7dPct,change30dPct:quote.change30dPct,change90dPct:quote.change90dPct,
      relative30dVsBtcPct:present(quote.change30dPct)&&present(market.btc30dPct)?quote.change30dPct-market.btc30dPct:null,
      relative90dVsBtcPct:present(quote.change90dPct)&&present(market.btc90dPct)?quote.change90dPct-market.btc90dPct:null,
      catchUpQuality:0,entryQuality:0,marketDepthGrade:null,personalExecutionPass:null,krakenPair:null,maxNewOrderUsd:0,
      qualifiesForNewCapital:false,reasonCodes:["no_active_kraken_usd_pair"]
    };
    if(instrument.state==="KRAKEN_MARKET_NOT_ONLINE") return {
      symbol,name:asset.name,cmcRank:input.cmcRanks?.get(symbol)??null,state:"KRAKEN_MARKET_NOT_ONLINE" as EngineState,
      priceUsd:quote.priceUsd,intendedLimitPrice:null,change7dPct:quote.change7dPct,change30dPct:quote.change30dPct,change90dPct:quote.change90dPct,
      relative30dVsBtcPct:null,relative90dVsBtcPct:null,catchUpQuality:0,entryQuality:0,marketDepthGrade:null,personalExecutionPass:null,
      krakenPair:instrument.instrument?.pairKey??null,maxNewOrderUsd:0,qualifiesForNewCapital:false,reasonCodes:["kraken_pair_not_online"]
    };
    const cls=classification ?? {symbol,assetClass:"UNKNOWN" as const,recommendationExcluded:false,reason:"classification_data_missing"};
    const executionNeeded=needsExecutionSample(quote,market);
    if(executionNeeded && !execution) {
      const provisional=evaluateDelayedRotation(market,{
        symbol,priceUsd:quote.priceUsd,change24hPct:quote.change24hPct,change7dPct:quote.change7dPct,
        change30dPct:quote.change30dPct,change90dPct:quote.change90dPct,classification:cls,execution:null,riskPass
      },{maneuverNavUsd:input.maneuverNavUsd,availableCashUsd:input.availableCashUsd});
      return {
        symbol,name:asset.name,cmcRank:input.cmcRanks?.get(symbol)??null,state:"EXECUTION_WARMUP" as EngineState,
        priceUsd:quote.priceUsd,intendedLimitPrice:null,change7dPct:quote.change7dPct,change30dPct:quote.change30dPct,change90dPct:quote.change90dPct,
        relative30dVsBtcPct:provisional.relative30dVsBtcPct,relative90dVsBtcPct:provisional.relative90dVsBtcPct,
        catchUpQuality:provisional.catchUpQuality,entryQuality:0,marketDepthGrade:null,personalExecutionPass:null,
        krakenPair:instrument.instrument?.pairKey??null,maxNewOrderUsd:0,qualifiesForNewCapital:false,
        reasonCodes:["execution_sample_pending",...provisional.reasonCodes]
      };
    }
    const d=evaluateDelayedRotation(market,{
      symbol,priceUsd:quote.priceUsd,change24hPct:quote.change24hPct,change7dPct:quote.change7dPct,
      change30dPct:quote.change30dPct,change90dPct:quote.change90dPct,classification:cls,execution:execution??null,riskPass
    },{maneuverNavUsd:input.maneuverNavUsd,availableCashUsd:input.availableCashUsd});
    const entryQuality=d.recommendedPullbackPct==null?0:Math.round((100-d.recommendedPullbackPct*6)*100)/100;
    const intendedLimitPrice=snapBuyLimitToTick(d.intendedLimitPrice,instrument.instrument?.tickSize ?? null);
    return {
      symbol,name:asset.name,cmcRank:input.cmcRanks?.get(symbol)??null,state:d.state,
      priceUsd:quote.priceUsd,intendedLimitPrice,change7dPct:quote.change7dPct,
      change30dPct:quote.change30dPct,change90dPct:quote.change90dPct,
      relative30dVsBtcPct:d.relative30dVsBtcPct,relative90dVsBtcPct:d.relative90dVsBtcPct,
      catchUpQuality:d.catchUpQuality,entryQuality,marketDepthGrade:execution?.marketDepthGrade??null,
      personalExecutionPass:execution?.hardPass??null,krakenPair:instrument.instrument?.pairKey??null,
      maxNewOrderUsd:d.maxNewOrderUsd,qualifiesForNewCapital:d.qualifiesForNewCapital,reasonCodes:d.reasonCodes
    };
  });

  const statePriority=(row:Omit<EngineRow,"rank">)=>row.qualifiesForNewCapital?6:
    row.state==="EXECUTION_WARMUP"?5:row.state==="NEAR_ROTATION"?4:row.state==="TOO_EARLY"?3:
    row.state==="ALREADY_EXTENDED"?2:row.state==="BENCHMARK"?1:0;
  const rows=unsorted.sort((a,b)=>statePriority(b)-statePriority(a)
    || b.catchUpQuality-a.catchUpQuality
    || (a.cmcRank??999999)-(b.cmcRank??999999)
    || a.symbol.localeCompare(b.symbol))
    .map((row,index)=>({...row,rank:index+1}));

  return {
    version:"1.0",generatedAt:input.generatedAt,
    market:{state:marketState,btcPriceUsd:btc?.priceUsd??null,btc7dPct:market.btc7dPct,btc30dPct:market.btc30dPct,btc90dPct:market.btc90dPct,
      breadth7dPositive:market.breadth7dPositive,breadth30dPositive:market.breadth30dPositive},
    health:{cmc:input.cmcHealth??(input.quotes.length?"LIVE":"MISSING"),krakenInstruments:input.krakenHealth??"LIVE",
      executionSampled:input.executions.size,watchlistCount:input.watchlist.length},
    qualifiedCount:rows.filter(r=>r.qualifiesForNewCapital).length,
    nearRotationCount:rows.filter(r=>r.state==="NEAR_ROTATION"||r.state==="EXECUTION_WARMUP").length,
    rows
  };
}
