import { afterEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { saveShadowForecasts, settleShadowForecasts, readShadowForecasts } from "../server/predictionOutcomes.js";
import { predictHorizons } from "../strategy21/prediction/forecast.js";
import type { BookFeatures } from "../strategy21/prediction/bookFeatures.js";

const dirs: string[] = [];
afterEach(() => { for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true }); });
const feature = (observedAt: string, midpoint: number): BookFeatures => ({ pair: "SOL/USD", observedAt, midpoint, microprice: midpoint, spreadBps: 10, queueImbalance: 0, bidDepth50BpsUsd: 1000, askDepth50BpsUsd: 1000, bidDepth100BpsUsd: 2000, askDepth100BpsUsd: 2000 });

describe("shadow outcomes", () => {
  it("settles only within five minutes of a due time and records late evaluations as missing", () => {
    const dir = mkdtempSync(join(tmpdir(), "zobiris-outcome-")); dirs.push(dir);
    const path = join(dir, "outcomes.sqlite");
    const records = predictHorizons({ pair: "SOL/USD", asOf: "2026-09-26T09:00:00Z", features: [feature("2026-09-26T08:59:00Z", 99), feature("2026-09-26T09:00:00Z", 100)], feeBpsPerSide: 40 });
    saveShadowForecasts(path, records);
    settleShadowForecasts(path, feature("2026-09-26T10:20:00Z", 120));
    expect(readShadowForecasts(path, "SOL/USD").find((row) => row.horizon === "1H")?.outcomeStatus).toBe("missing_window");
    expect(readShadowForecasts(path, "SOL/USD").find((row) => row.horizon === "4H")?.outcomeStatus).toBe("pending");
  });
});
