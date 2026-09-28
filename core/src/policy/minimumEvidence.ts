import type Database from "better-sqlite3";
import { ZOBIRIS_POLICY, ZOBIRIS_POLICY_HASH } from "./config.js";

export interface MinimumEvidenceStatus {
  policyVersion:string;
  policyHash:string;
  horizon:string;
  qualifiedEpisodes:number;
  controlEpisodes:number;
  independentMarketEpisodes:number;
  maxMarketEpisodeShare:number|null;
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

  const qualifiedRows=db.prepare(`
    SELECT DISTINCT se.episode_id,se.signal_at
    FROM strategy_episodes se
    JOIN episode_outcomes eo ON eo.episode_id=se.episode_id
    WHERE se.policy_hash=? AND se.episode_kind='QUALIFIED'
      AND eo.horizon=? AND eo.evaluated_at IS NOT NULL
  `).all(ZOBIRIS_POLICY_HASH,horizon) as Array<{episode_id:string;signal_at:string}>;

  const placeholders=controlStates.map(()=>"?").join(",");
  const controls=controlStates.length ? (db.prepare(`
    SELECT DISTINCT se.episode_id,se.signal_at,se.to_state
    FROM strategy_episodes se
    JOIN episode_outcomes eo ON eo.episode_id=se.episode_id
    WHERE se.policy_hash=? AND se.episode_kind='CONTROL'
      AND se.to_state IN (${placeholders})
      AND eo.horizon=? AND eo.evaluated_at IS NOT NULL
  `).all(ZOBIRIS_POLICY_HASH,...controlStates,horizon) as Array<{episode_id:string;signal_at:string;to_state:string}>) : [];

  const qualifiedEpisodes=qualifiedRows.length;
  const controlEpisodes=controls.length;
  const dates=[...qualifiedRows.map(x=>dayKey(x.signal_at)),...controls.map(x=>dayKey(x.signal_at))];
  const dateCounts=new Map<string,number>();
  for(const date of dates) dateCounts.set(date,(dateCounts.get(date)??0)+1);
  const independentMarketEpisodes=dateCounts.size;
  const largestMarketEpisodeCount=Math.max(0,...dateCounts.values());
  const maxMarketEpisodeShare=dates.length?largestMarketEpisodeCount/dates.length:null;

  const reasons:string[]=[];
  if(qualifiedEpisodes<ZOBIRIS_POLICY.evidence.minimumQualifiedEpisodes) {
    reasons.push(`qualified_episodes_${qualifiedEpisodes}_below_${ZOBIRIS_POLICY.evidence.minimumQualifiedEpisodes}`);
  }
  if(controlEpisodes<ZOBIRIS_POLICY.evidence.minimumControlEpisodes) {
    reasons.push(`control_episodes_${controlEpisodes}_below_${ZOBIRIS_POLICY.evidence.minimumControlEpisodes}`);
  }
  if(independentMarketEpisodes<ZOBIRIS_POLICY.evidence.minimumMarketEpisodes) {
    reasons.push(`market_episodes_${independentMarketEpisodes}_below_${ZOBIRIS_POLICY.evidence.minimumMarketEpisodes}`);
  }
  if(maxMarketEpisodeShare!=null && maxMarketEpisodeShare>ZOBIRIS_POLICY.evidence.maxSingleMarketEpisodeShare) {
    reasons.push(`market_episode_share_${maxMarketEpisodeShare.toFixed(3)}_above_${ZOBIRIS_POLICY.evidence.maxSingleMarketEpisodeShare}`);
  }

  return {
    policyVersion:ZOBIRIS_POLICY.version,
    policyHash:ZOBIRIS_POLICY_HASH,
    horizon,
    qualifiedEpisodes,
    controlEpisodes,
    independentMarketEpisodes,
    maxMarketEpisodeShare,
    promotable:reasons.length===0,
    reasons,
  };
}
