import { describe, expect, it } from "vitest";
import { openDatabase } from "../db/client.js";
import { migrate } from "../db/migrate.js";
import { ZOBIRIS_POLICY, ZOBIRIS_POLICY_HASH } from "../policy/config.js";
import { applyStrategyTransition, OUTCOME_HORIZONS } from "./episodes.js";

function seededDb(){
  const db=openDatabase(":memory:"); migrate(db);
  db.prepare("INSERT INTO assets(symbol,asset_class,updated_at) VALUES ('AAVE','NORMAL_CRYPTO',?)").run("2026-09-27T00:00:00Z");
  return db;
}
const base={symbol:"AAVE",strategyTag:"DELAYED_ROTATION_PILOT_V2",strategyVersion:ZOBIRIS_POLICY.strategy.version,policyVersion:ZOBIRIS_POLICY.version,policyHash:ZOBIRIS_POLICY_HASH,fromState:"NEAR_ROTATION",toState:"WAIT_FOR_PULLBACK",signalAt:"2026-09-27T01:00:00Z",signalPrice:145,btcSignalPrice:84400,intendedLimit:138,recommendedSizeUsd:37};

describe("strategy episodes",()=>{
  it("creates one episode and horizon schedule when the setup becomes actionable",()=>{
    const db=seededDb();
    const first=applyStrategyTransition(db,base);
    expect(first.created).toBe(true);
    expect((db.prepare("SELECT COUNT(*) n FROM strategy_episodes").get() as any).n).toBe(1);
    expect((db.prepare("SELECT COUNT(*) n FROM episode_outcomes").get() as any).n).toBe(OUTCOME_HORIZONS.length);
    db.close();
  });

  it("does not count repeated refreshes as new episodes",()=>{
    const db=seededDb();
    const first=applyStrategyTransition(db,base);
    const second=applyStrategyTransition(db,{...base,fromState:"WAIT_FOR_PULLBACK",signalAt:"2026-09-27T01:05:00Z",signalPrice:144.5});
    expect(second.episodeId).toBe(first.episodeId);
    expect(second.created).toBe(false);
    expect((db.prepare("SELECT COUNT(*) n FROM strategy_episodes").get() as any).n).toBe(1);
    db.close();
  });

  it("creates one deduplicated control episode for a non-qualified state transition",()=>{
    const db=seededDb();
    const control={...base,fromState:null,toState:"NEAR_ROTATION",signalAt:"2026-09-27T00:30:00Z",recommendedSizeUsd:0,intendedLimit:null};
    const first=applyStrategyTransition(db,control);
    const second=applyStrategyTransition(db,{...control,fromState:"NEAR_ROTATION",signalAt:"2026-09-27T00:35:00Z"});
    expect(first.controlEpisodeId).toBeTruthy();
    expect(first.created).toBe(true);
    expect(second.created).toBe(false);
    expect((db.prepare("SELECT COUNT(*) n FROM strategy_episodes WHERE episode_kind='CONTROL'").get() as any).n).toBe(1);
    expect((db.prepare("SELECT COUNT(*) n FROM episode_outcomes WHERE episode_id=?").get(first.controlEpisodeId) as any).n).toBe(OUTCOME_HORIZONS.length);
    db.close();
  });

  it("closes the episode without deleting its future outcomes when the coin drops from qualification",()=>{
    const db=seededDb();
    const first=applyStrategyTransition(db,base);
    applyStrategyTransition(db,{...base,fromState:"WAIT_FOR_PULLBACK",toState:"ALREADY_EXTENDED",signalAt:"2026-09-27T02:00:00Z"});
    expect((db.prepare("SELECT status FROM strategy_episodes WHERE episode_id=?").get(first.episodeId) as any).status).toBe("CLOSED");
    expect((db.prepare("SELECT COUNT(*) n FROM episode_outcomes WHERE episode_id=?").get(first.episodeId) as any).n).toBe(OUTCOME_HORIZONS.length);
    db.close();
  });
});
