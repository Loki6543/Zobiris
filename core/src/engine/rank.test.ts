import { describe,expect,it } from "vitest";
import { classifyAsset } from "../market/classification/classify.js";
import { buildEngineSnapshot } from "./rank.js";

const watchlist=[
  {symbol:"BTC",name:"Bitcoin",cmcId:"1"},
  {symbol:"AAVE",name:"Aave",cmcId:"7278"},
  {symbol:"FAKE",name:"Fake",cmcId:"999"},
];
const quotes=[
  {cmcId:"1",symbol:"BTC",name:"Bitcoin",priceUsd:85000,change1hPct:0,change24hPct:1,change7dPct:4,change30dPct:10,change60dPct:20,change90dPct:40,marketCapUsd:1,volume24hUsd:1,volumeChange24hPct:0,lastUpdated:null},
  {cmcId:"7278",symbol:"AAVE",name:"Aave",priceUsd:145,change1hPct:0,change24hPct:-1,change7dPct:5,change30dPct:-10,change60dPct:-15,change90dPct:-28,marketCapUsd:1,volume24hUsd:1,volumeChange24hPct:0,lastUpdated:null},
  {cmcId:"999",symbol:"FAKE",name:"Fake",priceUsd:2,change1hPct:0,change24hPct:1,change7dPct:2,change30dPct:-2,change60dPct:-3,change90dPct:-5,marketCapUsd:1,volume24hUsd:1,volumeChange24hPct:0,lastUpdated:null},
];
const instruments:any[]=[
  {symbol:"BTC",state:"ACTIVE",instrument:{pairKey:"BTC/USD",online:true}},
  {symbol:"AAVE",state:"ACTIVE",instrument:{pairKey:"AAVE/USD",online:true}},
  {symbol:"FAKE",state:"NO_KRAKEN_USD_MARKET",instrument:null},
];
const classifications=new Map([
  ["BTC",classifyAsset({symbol:"BTC",categories:["cryptocurrency"]})],
  ["AAVE",classifyAsset({symbol:"AAVE",categories:["DeFi"]})],
  ["FAKE",classifyAsset({symbol:"FAKE",categories:["cryptocurrency"]})],
]);

describe("Engine ranking",()=>{
  it("keeps every watchlist coin visible and explicitly shows unsupported Kraken markets",()=>{
    const snap=buildEngineSnapshot({generatedAt:"2026-09-27T00:00:00Z",watchlist,quotes,instruments,classifications,
      executions:new Map(),riskPass:new Map([["AAVE",true]]),maneuverNavUsd:1850,availableCashUsd:600});
    expect(snap.rows).toHaveLength(3);
    expect(snap.rows.find(r=>r.symbol==="FAKE")?.state).toBe("NO_KRAKEN_USD_MARKET");
    expect(snap.rows.find(r=>r.symbol==="AAVE")?.state).toBe("EXECUTION_WARMUP");
  });

  it("places an authorized laggard ahead once personal execution passes",()=>{
    const executions=new Map([["AAVE",{hardPass:true,marketDepthGrade:"SMALL_SIZE_ONLY" as const}]]);
    const snap=buildEngineSnapshot({generatedAt:"2026-09-27T00:00:00Z",watchlist,quotes,instruments,classifications,executions,
      riskPass:new Map([["AAVE",true]]),maneuverNavUsd:1850,availableCashUsd:600});
    expect(snap.rows[0]?.symbol).toBe("AAVE");
    expect(snap.rows[0]?.qualifiesForNewCapital).toBe(true);
    expect(snap.rows[0]?.maxNewOrderUsd).toBe(37);
  });
});
