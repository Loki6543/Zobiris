import { evaluateMinimumEvidence, type EvidenceCounts } from "../learning/minimumEvidence.js";
import { ZOBIRIS_POLICY } from "./config.js";

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
  const evidence=evaluateMinimumEvidence(input.evidence);
  const reasons=[...evidence.reasons];
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
