import { describe,expect,it } from "vitest";
import { ZOBIRIS_POLICY } from "./config.js";
import { evaluatePolicyPromotion } from "./promotion.js";

describe("policy promotion governance",()=>{
  it("keeps automatic parameter mutation disabled",()=>{
    expect(ZOBIRIS_POLICY.governance.allowAutomaticParameterMutation).toBe(false);
  });

  it("requires evidence, chronological validation, costs and shadow completion",()=>{
    expect(evaluatePolicyPromotion({
      evidence:{qualifiedEpisodes:30,controlEpisodes:30,marketEpisodes:10},
      chronologicalValidationPassed:true,
      realisticCostsIncluded:true,
      shadowEvaluationComplete:true,
    }).promotable).toBe(true);

    const blocked=evaluatePolicyPromotion({
      evidence:{qualifiedEpisodes:8,controlEpisodes:8,marketEpisodes:3},
      chronologicalValidationPassed:false,
      realisticCostsIncluded:false,
      shadowEvaluationComplete:false,
    });
    expect(blocked.promotable).toBe(false);
    expect(blocked.reasons).toContain("chronological_validation_required");
  });
});
