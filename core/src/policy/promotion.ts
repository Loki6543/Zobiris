import { ZOBIRIS_POLICY } from "./config.js";

export interface EvidenceCounts {
  qualifiedEpisodes:number;
  controlEpisodes:number;
  marketEpisodes:number;
}

function evidenceReasons(counts:EvidenceCounts) {
  const reasons:string[]=[];
  if(counts.qualifiedEpisodes<ZOBIRIS_POLICY.evidence.minimumQualifiedEpisodes) {
    reasons.push("insufficient_qualified_episodes");
  }
  if(counts.controlEpisodes<ZOBIRIS_POLICY.evidence.minimumControlEpisodes) {
    reasons.push("insufficient_control_episodes");
  }
  if(counts.marketEpisodes<ZOBIRIS_POLICY.evidence.minimumMarketEpisodes) {
    reasons.push("insufficient_independent_market_episodes");
  }
  return reasons;
}

export interface PolicyPromotionInput {
  evidence:EvidenceCounts;
  chronologicalValidationPassed:boolean;
  realisticCostsIncluded:boolean;
  shadowEvaluationComplete:boolean;
}

export interface PolicyPromotionStatus {
  promotable:boolean;
  reasons:string[];
}

export function evaluatePolicyPromotion(input:PolicyPromotionInput):PolicyPromotionStatus {
  const reasons=evidenceReasons(input.evidence);
  if(ZOBIRIS_POLICY.governance.allowAutomaticParameterMutation) {
    reasons.push("automatic_parameter_mutation_must_remain_disabled");
  }
  if(ZOBIRIS_POLICY.governance.requireChronologicalValidationForPromotion && !input.chronologicalValidationPassed) {
    reasons.push("chronological_validation_required");
  }
  if(ZOBIRIS_POLICY.governance.requireCostModelForPromotion && !input.realisticCostsIncluded) {
    reasons.push("realistic_cost_model_required");
  }
  if(!input.shadowEvaluationComplete) reasons.push("shadow_evaluation_incomplete");
  return {promotable:reasons.length===0,reasons};
}
