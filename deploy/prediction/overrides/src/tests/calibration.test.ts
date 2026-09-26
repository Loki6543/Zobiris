import { describe, expect, it } from "vitest";
import { scoreMaturedForecasts, detectPredictionDrift } from "../strategy21/prediction/calibration.js";

describe("forecast calibration", () => {
  it("scores only matured numeric probabilities and reports insufficient samples", () => {
    const rows = [{ probability: 0.8, outcome: true }, { probability: 0.2, outcome: false }, { probability: null, outcome: true }];
    const result = scoreMaturedForecasts(rows, 30);
    expect(result.count).toBe(2);
    expect(result.brierScore).toBeCloseTo(0.04);
    expect(result.calibrated).toBe(false);
  });

  it("lowers authority when recent error exceeds a matured baseline", () => {
    const baseline = Array.from({ length: 30 }, () => ({ probability: 0.8, outcome: true }));
    const recent = Array.from({ length: 30 }, () => ({ probability: 0.8, outcome: false }));
    expect(detectPredictionDrift(recent, baseline).drifted).toBe(true);
  });
});
