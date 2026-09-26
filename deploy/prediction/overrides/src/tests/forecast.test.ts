import { describe, expect, it } from "vitest";
import { predictHorizons, assessAuthority } from "../strategy21/prediction/forecast.js";
import type { BookFeatures } from "../strategy21/prediction/bookFeatures.js";

const feature = (observedAt: string, midpoint: number): BookFeatures => ({ pair: "SOL/USD", observedAt, midpoint, microprice: midpoint + 0.01, spreadBps: 10, queueImbalance: 0.2, bidDepth50BpsUsd: 1000, askDepth50BpsUsd: 900, bidDepth100BpsUsd: 2000, askDepth100BpsUsd: 1800 });

describe("shadow forecasts", () => {
  it("emits native horizons with honest null probabilities and abstains before calibration", () => {
    const result = predictHorizons({ pair: "SOL/USD", asOf: "2026-09-26T09:00:00Z", features: [feature("2026-09-26T08:59:00Z", 99), feature("2026-09-26T09:00:00Z", 100)], feeBpsPerSide: 40 });
    expect(result.map((item) => item.horizon)).toEqual(["1H", "4H", "1D", "3D", "7D"]);
    expect(result[0]?.positiveReturnProbability).toBeNull();
    expect(result[0]?.featureCutoff).toBe("2026-09-26T09:00:00Z");
    expect(assessAuthority(result[0]!)).toEqual({ level: "ABSTAIN", reason: "uncalibrated" });
  });

  it("ignores future features and abstains with insufficient data", () => {
    const result = predictHorizons({ pair: "SOL/USD", asOf: "2026-09-26T09:00:00Z", features: [feature("2026-09-26T09:01:00Z", 101)], feeBpsPerSide: 40 });
    expect(result[0]?.availability).toBe("insufficient_data");
    expect(result[0]?.estimatedNetReturnPct).toBeNull();
  });
});
