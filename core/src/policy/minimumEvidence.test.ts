import { describe,expect,it } from "vitest";
import { openDatabase } from "../db/client.js";
import { migrate } from "../db/migrate.js";
import { ZOBIRIS_POLICY,ZOBIRIS_POLICY_HASH } from "./config.js";
import { assessMinimumEvidence } from "./minimumEvidence.js";

describe("minimum evidence policy",()=>{
  it("refuses promotion when the pilot has too few independent outcomes",()=>{
    const db=openDatabase(":memory:");migrate(db);
    const status=assessMinimumEvidence(db,"7D");
    expect(status.promotable).toBe(false);
    expect(status.qualifiedEpisodes).toBe(0);
    expect(status.reasons.length).toBeGreaterThan(0);
    db.close();
  });

  it("requires counts under the same policy hash",()=>{
    const db=openDatabase(":memory:");migrate(db);
    db.prepare("INSERT INTO assets(symbol,asset_class,updated_at) VALUES ('AAVE','NORMAL_CRYPTO',?)").run("2026-09-01T00:00:00Z");
    const insertEpisode=db.prepare(`INSERT INTO strategy_episodes(
      episode_id,symbol,strategy_tag,strategy_version,policy_version,policy_hash,from_state,to_state,
      signal_at,signal_price,status,created_at,updated_at
    ) VALUES (?,?,?,?,?,?,?,?,?,?, 'CLOSED',?,?)`);
    const insertOutcome=db.prepare("INSERT INTO episode_outcomes(episode_id,horizon,due_at,evaluated_at) VALUES (?,?,?,?)");
    for(let i=0;i<ZOBIRIS_POLICY.evidence.minimumQualifiedEpisodes;i++){
      const day=String((i%20)+1).padStart(2,"0");
      const at=`2026-09-${day}T00:00:00Z`;
      const id=`q-${i}`;
      insertEpisode.run(id,"AAVE",ZOBIRIS_POLICY.strategy.tag,ZOBIRIS_POLICY.strategy.version,ZOBIRIS_POLICY.version,ZOBIRIS_POLICY_HASH,"NEAR_ROTATION","WAIT_FOR_PULLBACK",at,100,at,at);
      insertOutcome.run(id,"7D",at,at);
    }
    const status=assessMinimumEvidence(db,"7D");
    expect(status.qualifiedEpisodes).toBe(ZOBIRIS_POLICY.evidence.minimumQualifiedEpisodes);
    expect(status.promotable).toBe(false);
    expect(status.reasons.some(x=>x.startsWith("control_episodes_"))).toBe(true);
    db.close();
  });
});
