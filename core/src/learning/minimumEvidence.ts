import { ZOBIRIS_POLICY } from "../policy/config.js";

export interface EvidenceCounts {
  qualifiedEpisodes: number;
  controlEpisodes: number;
  marketEpisodes: number;
}

export interface EvidenceStatus extends EvidenceCounts {
  promotable: boolean;
  reasons: string[];
}

export function evaluateMinimumEvidence(counts: EvidenceCounts): EvidenceStatus {
  const reasons: string[] = [];
  if (counts.qualifiedEpisodes < ZOBIRIS_POLICY.evidence.minimumQualifiedEpisodes) {
    reasons.push("insufficient_qualified_episodes");
  }
  if (counts.controlEpisodes < ZOBIRIS_POLICY.evidence.minimumControlEpisodes) {
    reasons.push("insufficient_control_episodes");
  }
  if (counts.marketEpisodes < ZOBIRIS_POLICY.evidence.minimumMarketEpisodes) {
    reasons.push("insufficient_independent_market_episodes");
  }
  return { ...counts, promotable: reasons.length === 0, reasons };
}
