export const ASSET_STATES = [
  "INELIGIBLE",
  "RESEARCH",
  "PRE_IGNITION",
  "PROBE",
  "ACCUMULATE",
  "CONFIRMED_TREND",
  "EXTENDED",
  "HARVEST",
  "DETERIORATING",
  "QUARANTINED",
] as const;

export type AssetStateName = (typeof ASSET_STATES)[number];
export type EligibilityStatus = "QUARANTINED" | "INELIGIBLE" | "WATCH_ONLY" | "CONDITIONAL_PROBE_ELIGIBLE" | "ACTIVE_ELIGIBLE";

export interface AssetStateInput {
  eligibility: EligibilityStatus;
  confidence: number;
  fundamentalTrajectory: number;
  developerHealth: number;
  minimumDeveloperHealth: number;
  attentionPercentile: number;
  crowdingThreshold: number;
  observableCatalyst: boolean;
  contributorBreadthImproving: boolean;
  spotAccumulation: boolean;
  structurallyDeclining: boolean;
  extended: boolean;
  deterioration: boolean;
  existingPositionUsd: number;
  nonPriceConfirmation: boolean;
  trendConfirmed: boolean;
  profitable: boolean;
  expectedNextDollarBelowHoldHurdle: boolean;
}

export interface AssetStateResult {
  state: AssetStateName;
  reasonCodes: string[];
  allowedActions: string[];
}

function result(state: AssetStateName, reasonCodes: string[], allowedActions: string[]): AssetStateResult {
  return { state, reasonCodes, allowedActions };
}

export function classifyAssetState(input: AssetStateInput): AssetStateResult {
  if (input.eligibility === "QUARANTINED") {
    return result("QUARANTINED", ["critical_integrity_or_identity_fault"], ["EXIT_IF_EXECUTABLE"]);
  }
  if (input.eligibility === "INELIGIBLE") {
    return result("INELIGIBLE", ["execution_or_required_evidence_gate_failed"], ["NO_ORDER"]);
  }
  if (input.eligibility === "WATCH_ONLY" || input.confidence <= 0.50) {
    return result("RESEARCH", [input.eligibility === "WATCH_ONLY" ? "critical_evidence_incomplete" : "confidence_below_probe_threshold"], ["OBSERVE"]);
  }
  if (input.deterioration || input.structurallyDeclining) {
    return result("DETERIORATING", [input.deterioration ? "material_thesis_or_flow_deterioration" : "structural_decline"], ["CANCEL_ADDS", "REDUCE_BY_POLICY"]);
  }
  if (input.extended) {
    if (input.profitable && input.expectedNextDollarBelowHoldHurdle) {
      return result("HARVEST", ["extended_and_next_dollar_below_hold_hurdle"], ["TRIM_SYSTEMATICALLY", "NO_CHASE"]);
    }
    return result("EXTENDED", ["extension_or_crowding_threshold_exceeded"], ["HOLD", "NO_NEW_CHASE"]);
  }
  if (input.trendConfirmed && input.existingPositionUsd > 0) {
    return result("CONFIRMED_TREND", ["spot_supported_relative_strength_confirmed"], ["HOLD", "LINE_3_IF_AUTHORIZED"]);
  }
  if (input.existingPositionUsd > 0 && input.nonPriceConfirmation) {
    return result("ACCUMULATE", ["non_price_thesis_confirmation_after_probe"], ["LINE_2_IF_AUTHORIZED"]);
  }
  if (input.existingPositionUsd > 0) {
    return result("PROBE", ["position_open_without_second_line_confirmation"], ["HOLD_PROBE", "NO_AUTOMATIC_AVERAGING"]);
  }

  const discoveryEvidence = input.observableCatalyst || input.contributorBreadthImproving || input.spotAccumulation;
  const preIgnition =
    input.fundamentalTrajectory >= 0 &&
    input.developerHealth >= input.minimumDeveloperHealth &&
    input.attentionPercentile < input.crowdingThreshold &&
    discoveryEvidence &&
    !input.structurallyDeclining &&
    !input.extended;

  if (preIgnition) {
    return result("PRE_IGNITION", ["fundamentals_survive", "execution_eligible", "discovery_mechanism_observed", "not_extended"], ["PREPARE_CONDITIONAL_PROBE"]);
  }

  return result("RESEARCH", ["opportunity_not_yet_confirmed"], ["OBSERVE"]);
}
