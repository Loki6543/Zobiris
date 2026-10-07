import { describe, expect, it } from "vitest";
import {
  bonferroniCriticalZ,
  cpcvDiagnostics,
  deflatedSharpeFromSummary,
  pboFromSplitMatrix,
} from "../strategy21/researchIntegrity/statistics.js";

describe("P1B statistical integrity", () => {
  it("reproduces the expected Bonferroni neighborhood for 105 cells", () => {
    const z = bonferroniCriticalZ(105);
    expect(z).toBeGreaterThan(3.4);
    expect(z).toBeLessThan(3.6);
  });

  it("deflated Sharpe gets stricter as the effective search family grows", () => {
    const few = deflatedSharpeFromSummary({
      observedSharpe: 0.20,
      skew: 0,
      kurtosis: 3,
      nObservations: 252,
      trialSharpes: [0.05, 0.07, 0.08, 0.10, 0.20],
      effectiveTrialCount: 5,
    });
    const many = deflatedSharpeFromSummary({
      observedSharpe: 0.20,
      skew: 0,
      kurtosis: 3,
      nObservations: 252,
      trialSharpes: [0.05, 0.07, 0.08, 0.10, 0.20],
      effectiveTrialCount: 100,
    });
    expect(few).not.toBeNull();
    expect(many).not.toBeNull();
    expect(many!.dsr).toBeLessThan(few!.dsr);
  });

  it("fails closed when kurtosis convention is incompatible with the PSR formula", () => {
    expect(deflatedSharpeFromSummary({
      observedSharpe: 1,
      skew: 0,
      kurtosis: 0,
      nObservations: 100,
      trialSharpes: [0.8, 1],
    })).toBeNull();
  });

  it("computes PBO from the rank of each in-sample winner out of sample", () => {
    const robust = pboFromSplitMatrix([
      { splitId: "s1", candidateId: "a", role: "IN_SAMPLE", value: 2 },
      { splitId: "s1", candidateId: "b", role: "IN_SAMPLE", value: 1 },
      { splitId: "s1", candidateId: "a", role: "OUT_OF_SAMPLE", value: 2 },
      { splitId: "s1", candidateId: "b", role: "OUT_OF_SAMPLE", value: 1 },
      { splitId: "s2", candidateId: "a", role: "IN_SAMPLE", value: 1 },
      { splitId: "s2", candidateId: "b", role: "IN_SAMPLE", value: 2 },
      { splitId: "s2", candidateId: "a", role: "OUT_OF_SAMPLE", value: 1 },
      { splitId: "s2", candidateId: "b", role: "OUT_OF_SAMPLE", value: 2 },
    ]);
    const overfit = pboFromSplitMatrix([
      { splitId: "s1", candidateId: "a", role: "IN_SAMPLE", value: 2 },
      { splitId: "s1", candidateId: "b", role: "IN_SAMPLE", value: 1 },
      { splitId: "s1", candidateId: "a", role: "OUT_OF_SAMPLE", value: 0 },
      { splitId: "s1", candidateId: "b", role: "OUT_OF_SAMPLE", value: 2 },
      { splitId: "s2", candidateId: "a", role: "IN_SAMPLE", value: 1 },
      { splitId: "s2", candidateId: "b", role: "IN_SAMPLE", value: 2 },
      { splitId: "s2", candidateId: "a", role: "OUT_OF_SAMPLE", value: 2 },
      { splitId: "s2", candidateId: "b", role: "OUT_OF_SAMPLE", value: 0 },
    ]);
    expect(robust?.pbo).toBe(0);
    expect(overfit?.pbo).toBe(1);
  });

  it("drops an incomplete CSCV split instead of shrinking the registered candidate family", () => {
    const incomplete = pboFromSplitMatrix([
      { splitId: "s1", candidateId: "a", role: "IN_SAMPLE", value: 2 },
      { splitId: "s1", candidateId: "b", role: "IN_SAMPLE", value: 1 },
      { splitId: "s1", candidateId: "a", role: "OUT_OF_SAMPLE", value: 2 },
      { splitId: "s1", candidateId: "b", role: "OUT_OF_SAMPLE", value: 1 },
    ], 3);
    expect(incomplete).toBeNull();
  });

  it("keeps CPCV path behavior descriptive until a preregistered promotion threshold exists", () => {
    const diagnostics = cpcvDiagnostics([1, -0.5, 2, 0.25]);
    expect(diagnostics.pathCount).toBe(4);
    expect(diagnostics.positivePathRate).toBe(0.75);
    expect(diagnostics.medianPathMetric).toBeCloseTo(0.625);
  });
});
