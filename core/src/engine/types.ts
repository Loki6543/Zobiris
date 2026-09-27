import type { MarketDepthGrade } from "../market/kraken/execution.js";
import type { RotationState } from "../strategies/delayedRotation/evaluate.js";

export type EngineState =
  | RotationState
  | "BENCHMARK"
  | "NO_KRAKEN_USD_MARKET"
  | "KRAKEN_MARKET_NOT_ONLINE"
  | "EXECUTION_WARMUP";

export interface EngineRow {
  rank:number;
  symbol:string;
  name:string;
  cmcRank:number|null;
  state:EngineState;
  priceUsd:number|null;
  intendedLimitPrice:number|null;
  change7dPct:number|null;
  change30dPct:number|null;
  change90dPct:number|null;
  relative30dVsBtcPct:number|null;
  relative90dVsBtcPct:number|null;
  catchUpQuality:number;
  entryQuality:number;
  marketDepthGrade:MarketDepthGrade|null;
  personalExecutionPass:boolean|null;
  krakenPair:string|null;
  maxNewOrderUsd:number;
  qualifiesForNewCapital:boolean;
  reasonCodes:string[];
}

export interface EngineSnapshot {
  version:"1.0";
  generatedAt:string;
  market:{
    state:"BULLISH"|"NOT_BULLISH"|"DATA_INCOMPLETE";
    btcPriceUsd:number|null;
    btc7dPct:number|null;
    btc30dPct:number|null;
    btc90dPct:number|null;
    breadth7dPositive:number|null;
    breadth30dPositive:number|null;
  };
  health:{
    cmc:"LIVE"|"ERROR"|"MISSING";
    krakenInstruments:"LIVE"|"ERROR";
    executionSampled:number;
    watchlistCount:number;
  };
  qualifiedCount:number;
  nearRotationCount:number;
  rows:EngineRow[];
}
