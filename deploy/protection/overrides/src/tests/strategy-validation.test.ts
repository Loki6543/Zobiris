import { describe, expect, it } from "vitest";
import {
  validateStrategyEpisodes,
  type StrategyValidationEpisode,
} from "../strategy21/research/strategyValidation.js";
import { buildOutcomeValidationLab } from "../server/strategyValidationReport.js";
import type { DecisionOutcomeRecord } from "../server/outcomeMemory.js";
import type { StrategyStatisticalEvidence } from "../server/researchProvenance.js";

function passingStatisticalEvidence(strategyTag: string): StrategyStatisticalEvidence {
  return {
    strategyTag,
    authority: "SHADOW_ONLY_NO_TRADING_AUTHORITY",
    source: "PERSISTED_P0_EVIDENCE",
    mapping: { status: "MAPPED", familyId: "fam-entry-v1", matchedBy: "family_title" },
    provenanceComplete: true,
    eligibleValidations: 1,
    selectionCount: 1,
    evaluatedSelectionCount: 1,
    truncated: false,
    dsr: { status: "PASS", value: 0.99, sampleCount: 1, threshold: ">0.95", reasons: [] },
    pbo: { status: "PASS", value: 0.05, sampleCount: 1, threshold: "<0.10", reasons: [] },
    cpcv: { status: "WATCH", value: 0.75, sampleCount: 1, threshold: "PREREGISTERED_THRESHOLD_REQUIRED", reasons: ["descriptive only"] },
    gate: { status: "PASS", reasons: [] },
  };
}

function episodes(
  count: number,
  returns: (index: number) => number = () => 1,
  benchmark: (index: number) => number = () => 0.2,
): StrategyValidationEpisode[] {
  const start = Date.parse("2025-01-01T00:00:00.000Z");
  return Array.from({ length: count }, (_, index) => {
    const decision = new Date(start + index * 8 * 86400000).toISOString();
    const evaluated = new Date(start + index * 8 * 86400000 + 7 * 86400000).toISOString();
    return {
      id: "e-" + index,
      symbol: "SOL",
      decisionAt: decision,
      featureMaxAt: decision,
      evaluatedAt: evaluated,
      grossReturnPct: returns(index),
      benchmarkReturnPct: benchmark(index),
      regime: index % 2 ? "RISK_ON" : "SIDEWAYS",
      maxAdversePct: -2,
      maxFavorablePct: 4,
    };
  });
}

describe("strategy validation lab", () => {
  it("passes a temporally clean strategy through OOS, walk-forward and unseen vault gates", () => {
    const report = validateStrategyEpisodes(episodes(120));
    expect(report.integrity.passed).toBe(true);
    expect(report.split).toEqual({
      totalEpisodes: 120,
      researchEpisodes: 72,
      oosEpisodes: 30,
      vaultEpisodes: 18,
    });
    expect(report.oos.passed).toBe(true);
    expect(report.walkForward.passed).toBe(true);
    expect(report.vault.passed).toBe(true);
    expect(report.status).toBe("SHADOW_VALIDATED");
    expect(report.certification.classification).toBe("CERTIFIED_SHADOW");
    expect(report.certification.stable).toBe(true);
    expect(report.certification.stressPassRate).toBe(1);
    expect(report.liveOrderAuthority).toBe(false);
  });

  it("rejects future-derived features before performance can promote a model", () => {
    const sample = episodes(120);
    sample[10] = {
      ...sample[10]!,
      featureMaxAt: new Date(Date.parse(sample[10]!.decisionAt) + 60_000).toISOString(),
    };
    const report = validateStrategyEpisodes(sample);
    expect(report.status).toBe("LEAKAGE_REJECTED");
    expect(report.integrity.violations.some((value) => value.startsWith("lookahead_feature_after_decision:"))).toBe(true);
    expect(report.passesResearchGates).toBe(false);
  });

  it("fails a strategy that looks good before the unseen vault and then breaks", () => {
    const sample = episodes(120, (index) => index >= 102 ? -5 : 1);
    const report = validateStrategyEpisodes(sample);
    expect(report.oos.passed).toBe(true);
    expect(report.walkForward.passed).toBe(true);
    expect(report.vault.passed).toBe(false);
    expect(report.status).toBe("FAILED_VAULT");
  });

  it("tests net edge after round-trip fee and slippage assumptions", () => {
    const sample = episodes(120, () => 0.30, () => 0.05).map((episode) => ({
      ...episode,
      feeBps: 10,
      slippageBps: 10,
    }));
    const report = validateStrategyEpisodes(sample);
    expect(report.oos.metrics.averageNetReturnPct).toBeCloseTo(-0.10, 9);
    expect(report.status).toBe("FAILED_OOS");
    expect(report.certification.classification).toBe("REJECTED");
  });

  it("marks a validation-pass strategy fragile when modest cost/edge stress breaks the vault edge", () => {
    const sample = episodes(120, () => 0.25, () => 0.05);
    const report = validateStrategyEpisodes(sample);
    expect(report.status).toBe("SHADOW_VALIDATED");
    expect(report.certification.classification).toBe("FRAGILE");
    expect(report.certification.stressPassRate).toBeLessThan(1);
    expect(report.certification.executionEvidenceRequiredForLiveUse).toBe(true);
  });

  it("defaults the outcome validation lab to the 1.20 percent maker/taker validation path", () => {
    const base = Date.parse("2025-01-01T00:00:00.000Z");
    const records: DecisionOutcomeRecord[] = Array.from({ length: 120 }, (_, index) => {
      const generatedAt = new Date(base + index * 8 * 86400000).toISOString();
      const dueAt = new Date(base + index * 8 * 86400000 + 7 * 86400000).toISOString();
      return {
        measurementVersion: "episodes-v2",
        outcomeId: "cost-" + index,
        symbol: "SOL",
        generatedAt,
        referencePriceObservedAt: generatedAt,
        action: "BUY",
        assetState: "CONFIRMED_TREND",
        regime: "SIDEWAYS",
        referencePriceUsd: 100,
        opportunityScore: 0.8,
        researchScore: 80,
        evidenceQuality: 0.9,
        thesisId: "cost-t-" + index,
        strategyTag: "COST_DEFAULT_V1",
        strategyStatus: "QUALIFIED",
        recommendedPullbackPct: 5,
        maxFavorablePct: 4,
        maxAdversePct: -2,
        evaluations: [{
          status: "RESOLVED",
          horizon: "7D",
          dueAt,
          evaluatedAt: dueAt,
          priceObservedAt: dueAt,
          priceUsd: 101,
          returnPct: 1,
          benchmarkReturnPct: 0.2,
        }],
      };
    });
    const lab = buildOutcomeValidationLab(records, { horizon: "7D" });
    expect(lab.costAssumptions.selectedPath).toBe("MAKER_TAKER");
    expect(lab.costAssumptions.feeBpsPerSide).toBeCloseTo(60, 9);
    expect(lab.costAssumptions.roundTripFeeBpsByPath.MAKER_TAKER).toBeCloseTo(120, 9);
    expect(lab.reports[0]!.report.oos.metrics.averageNetReturnPct).toBeCloseTo(-0.2, 9);
    expect(lab.reports[0]!.report.status).toBe("FAILED_OOS");
  });

  it("adapts qualified forward outcome episodes by strategy tag without granting authority", () => {
    const base = Date.parse("2025-01-01T00:00:00.000Z");
    const records: DecisionOutcomeRecord[] = Array.from({ length: 120 }, (_, index) => {
      const generatedAt = new Date(base + index * 8 * 86400000).toISOString();
      const dueAt = new Date(base + index * 8 * 86400000 + 7 * 86400000).toISOString();
      return {
        measurementVersion: "episodes-v2",
        outcomeId: "o-" + index,
        symbol: "SOL",
        generatedAt,
        referencePriceObservedAt: generatedAt,
        action: "BUY",
        assetState: "CONFIRMED_TREND",
        regime: index % 2 ? "RISK_ON" : "SIDEWAYS",
        referencePriceUsd: 100,
        opportunityScore: 0.8,
        researchScore: 80,
        evidenceQuality: 0.9,
        thesisId: "t-" + index,
        strategyTag: "ENTRY_MODEL_V1",
        strategyStatus: "QUALIFIED",
        recommendedPullbackPct: 5,
        maxFavorablePct: 4,
        maxAdversePct: -2,
        evaluations: [{
          status: "RESOLVED",
          horizon: "7D",
          dueAt,
          evaluatedAt: dueAt,
          priceObservedAt: dueAt,
          priceUsd: 101,
          returnPct: 2,
          benchmarkReturnPct: 0.2,
        }],
      };
    });
    const lab = buildOutcomeValidationLab(records, { horizon: "7D" });
    expect(lab.reports).toHaveLength(1);
    expect(lab.reports[0]!.strategyTag).toBe("ENTRY_MODEL_V1");
    expect(lab.reports[0]!.report.status).toBe("SHADOW_VALIDATED");
    expect(lab.reports[0]!.report.certification.classification).toBe("CERTIFIED_SHADOW");
    expect(lab.executionEvidence.executableFillCertified).toBe(false);
    expect(lab.factorAudit.find((item) => item.factor === "onchain")?.usedInCertification).toBe(false);
    expect(lab.liveOrderAuthority).toBe(false);
  });
  it("fails closed when base validation passes but DSR/PBO lineage is unmapped", () => {
    const base = Date.parse("2025-01-01T00:00:00.000Z");
    const records: DecisionOutcomeRecord[] = Array.from({ length: 120 }, (_, index) => {
      const generatedAt = new Date(base + index * 8 * 86400000).toISOString();
      const dueAt = new Date(base + index * 8 * 86400000 + 7 * 86400000).toISOString();
      return {
        measurementVersion: "episodes-v2",
        outcomeId: "unmapped-" + index,
        symbol: "SOL",
        generatedAt,
        referencePriceObservedAt: generatedAt,
        action: "BUY",
        assetState: "CONFIRMED_TREND",
        regime: "SIDEWAYS",
        referencePriceUsd: 100,
        opportunityScore: 0.8,
        researchScore: 80,
        evidenceQuality: 0.9,
        thesisId: "unmapped-t-" + index,
        strategyTag: "UNMAPPED_MODEL_V1",
        strategyStatus: "QUALIFIED",
        recommendedPullbackPct: 5,
        maxFavorablePct: 4,
        maxAdversePct: -2,
        evaluations: [{
          status: "RESOLVED",
          horizon: "7D",
          dueAt,
          evaluatedAt: dueAt,
          priceObservedAt: dueAt,
          priceUsd: 102,
          returnPct: 2,
          benchmarkReturnPct: 0.2,
        }],
      };
    });
    const lab = buildOutcomeValidationLab(records, { horizon: "7D" });
    expect(lab.reports[0]!.report.status).toBe("SHADOW_VALIDATED");
    expect(lab.reports[0]!.report.certification.classification).toBe("INSUFFICIENT_DATA");
    expect((lab.reports[0]!.report as any).statisticalCertification).toMatchObject({
      status: "UNKNOWN",
      mappingStatus: "UNMAPPED",
      provenanceComplete: false,
    });
    expect(lab.liveOrderAuthority).toBe(false);
  });

});
