import { describe,expect,it } from "vitest";
import { openDatabase } from "../db/client.js";
import { migrate } from "../db/migrate.js";
import { applyStrategyTransition } from "./episodes.js";
import { resolveEpisodeOutcome } from "./outcomes.js";

const candle=(symbol:string,openTime:string,open:number,high=open,low=open)=>({symbol,intervalMinutes:1,openTime,open,high,low,close:open,volume:1,committed:true as const});

describe("episode outcome resolution",()=>{
  it("benchmarks the same horizon against BTC instead of flattering a rising market",()=>{
    const db=openDatabase(":memory:"); migrate(db);
    for(const s of ["AAVE","BTC"]) db.prepare("INSERT INTO assets(symbol,asset_class,updated_at) VALUES (?,'NORMAL_CRYPTO',?)").run(s,"2026-09-27T00:00:00Z");
    const ep=applyStrategyTransition(db,{symbol:"AAVE",strategyTag:"DELAYED_ROTATION_PILOT_V2",strategyVersion:"2.0.0",fromState:"NEAR_ROTATION",toState:"WAIT_FOR_PULLBACK",signalAt:"2026-09-27T01:00:00Z",signalPrice:100,btcSignalPrice:100});
    const result=resolveEpisodeOutcome(db,{episodeId:ep.episodeId!,horizon:"1H",maxTimingErrorMs:60_000,
      assetCandles:[candle("AAVE","2026-09-27T02:00:20Z",105,106,99)],
      btcCandles:[candle("BTC","2026-09-27T02:00:10Z",110)]});
    expect(result.updated).toBe(true);
    expect(result.returnPct).toBeCloseTo(5);
    expect(result.excessBtcPct).toBeCloseTo(-5);
    db.close();
  });

  it("does not substitute a price hours late for a one-hour result",()=>{
    const db=openDatabase(":memory:"); migrate(db);
    for(const s of ["AAVE","BTC"]) db.prepare("INSERT INTO assets(symbol,asset_class,updated_at) VALUES (?,'NORMAL_CRYPTO',?)").run(s,"2026-09-27T00:00:00Z");
    const ep=applyStrategyTransition(db,{symbol:"AAVE",strategyTag:"DELAYED_ROTATION_PILOT_V2",strategyVersion:"2.0.0",fromState:"NEAR_ROTATION",toState:"WAIT_FOR_PULLBACK",signalAt:"2026-09-27T01:00:00Z",signalPrice:100,btcSignalPrice:100});
    const result=resolveEpisodeOutcome(db,{episodeId:ep.episodeId!,horizon:"1H",maxTimingErrorMs:60_000,
      assetCandles:[candle("AAVE","2026-09-27T05:00:00Z",105)],
      btcCandles:[candle("BTC","2026-09-27T05:00:00Z",110)]});
    expect(result).toEqual({updated:false,reason:"price_timing_unresolved"});
    db.close();
  });
});
