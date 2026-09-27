import type Database from "better-sqlite3";
import { ZOBIRIS_POLICY, ZOBIRIS_POLICY_HASH } from "./config.js";

export interface MinimumEvidenceStatus {
  policyVersion:string;
  policyHash:string;
  horizon:string;
  qualifiedEpisodes:number;
  controlEpisodes:number;
  independentMarketEpisodes:number;
  promotable:boolean;
  reasons:string[];
}

function dayKey(value:string) {
  const ms=Date.parse(value);
  return Number.isFinite(ms)?new Date(ms).toISOString().slice(0,10):value;
}

export function assessMinimumEvidence(
  db:Database.Database,
  horizon:string,
  args:{controlStates?:string[]}={},
):MinimumEvidenceStatus {
  const controlStates=args.controlStates ?? ["NEAR_ROTATION","TOO_EARLY","ALREADY_EXTENDED","STRUCTURALLY_WEAK"];
  const qualified=(db.prepare(`
    SELECT COUNT(DISTINCT se.episode_id) AS n
    FROM strategy_episodes se
    JOIN episode_outcomes eo ON eo.episode_id=se.episode_id
    WHERE se.policy_hash=? AND eo.horizon=? AND eo.evaluated_at IS NOT NULL
  `).get(ZOBIRIS_POLICY_HASH,horizon) as {n:number}).n;

  const placeholders=controlStates.map(()=>"?").join(",");
  const controls=controlStates.length ? (db.prepare(`
    SELECT signal_at,to_state FROM strategy_episodes
    WHERE policy_hash=? AND status='CLOSED' AND to_state IN (${placeholders})
  `).all(ZOBIRIS_POLICY_HASH,...controlStates) as Array<{signal_at:string;to_state:string}>) : [];

  const controlEpisodes=controls.length;
  const qualifiedMarkets=(db.prepare(`
    SELECT DISTINCT substr(se.signal_at,1,10) AS d
    FROM strategy_episodes se
    JOIN episode_outcomes eo ON eo.episode_id=se.episode_id
    WHERE se.policy_hash=? AND eo.horizon=? AND eo.evaluated_at IS NOT NULL
  `).all(ZOBIRIS_POLICY_HASH,horizon) as Array<{d:string}>).map(x=>x.d);
  const controlMarkets=controls.map(x=>dayKey(x.signal_at));
  const independentMarketEpisodes=new Set([...qualifiedMarkets,...controlMarkets]).size;

  const reasons:string[]=[];
  if(qualified<ZOBIRIS_POLICY.evidence.minimumQualifiedEpisodes) {
    reasons.push(`qualified_episodes_${qualified}_below_${ZOBIRIS_POLICY.evidence.minimumQualifiedEpisodes}`);
  }
  if(controlEpisodes<ZOBIRIS_POLICY.evidence.minimumControlEpisodes) {
    reasons.push(`control_episodes_${controlEpisodes}_below_${ZOBIRIS_POLICY.evidence.minimumControlEpisodes}`);
  }
  if(independentMarketEpisodes<ZOBIRIS_POLICY.evidence.minimumMarketEpisodes) {
    reasons.push(`market_episodes_${independentMarketEpisodes}_below_${ZOBIRIS_POLICY.evidence.minimumMarketEpisodes}`);
  }

  return {
    policyVersion:ZOBIRIS_POLICY.version,
    policyHash:ZOBIRIS_POLICY_HASH,
    horizon,
    qualifiedEpisodes:qualified,
    controlEpisodes,
    independentMarketEpisodes,
    promotable:reasons.length===0,
    reasons,
  };
}
