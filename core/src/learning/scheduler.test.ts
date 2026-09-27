import { describe,expect,it } from "vitest";
import { openDatabase } from "../db/client.js";
import { migrate } from "../db/migrate.js";
import { ZOBIRIS_POLICY,ZOBIRIS_POLICY_HASH } from "../policy/config.js";
import { applyStrategyTransition } from "./episodes.js";
import { intervalForHorizon,listDueOutcomes,resolveDueOutcomeBatch } from "./scheduler.js";

const candle=(symbol:string,openTime:string,open:number)=>({
  symbol,intervalMinutes:1,openTime,open,high:open*1.01,low:open*.99,close:open,volume:1,committed:true as const
});

describe("outcome scheduler",()=>{
  it("uses tighter intervals for shorter horizons",()=>{
    expect(intervalForHorizon("1H")).toBe(1);
    expect(intervalForHorizon("7D")).toBe(15);
    expect(intervalForHorizon("30D")).toBe(60);
  });

  it("keeps due outcomes independent of current ranking membership",async()=>{
    const db=openDatabase(":memory:");migrate(db);
    for(const s of ["AAVE","BTC"]) db.prepare("INSERT INTO assets(symbol,asset_class,updated_at) VALUES (?,'NORMAL_CRYPTO',?)").run(s,"2026-09-27T00:00:00Z");
    const ep=applyStrategyTransition(db,{
      symbol:"AAVE",strategyTag:ZOBIRIS_POLICY.strategy.tag,strategyVersion:ZOBIRIS_POLICY.strategy.version,
      policyVersion:ZOBIRIS_POLICY.version,policyHash:ZOBIRIS_POLICY_HASH,
      fromState:"NEAR_ROTATION",toState:"WAIT_FOR_PULLBACK",signalAt:"2026-09-27T01:00:00Z",
      signalPrice:100,btcSignalPrice:100
    });
    expect(listDueOutcomes(db,"2026-09-27T02:00:01Z",3)[0]?.episodeId).toBe(ep.episodeId);

    const result=await resolveDueOutcomeBatch(db,{
      pairForSymbol:(s)=>`${s}/USD`,
      fetchCandles:async(symbol,_pair,interval)=>{
        const c=candle(symbol,"2026-09-27T02:00:00Z",symbol==="BTC"?110:105);
        return [{...c,intervalMinutes:interval}];
      },
      now:()=>new Date("2026-09-27T02:00:01Z"),
    },1);
    expect(result[0]?.updated).toBe(true);
    const stored=db.prepare("SELECT excess_btc_pct FROM episode_outcomes WHERE episode_id=? AND horizon='1H'").get(ep.episodeId) as any;
    expect(stored.excess_btc_pct).toBeCloseTo(-5);
    db.close();
  });
});
