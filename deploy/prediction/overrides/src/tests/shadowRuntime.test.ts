import { afterEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createShadowFeatureHandler } from "../server/shadowRuntime.js";
import { readBookFeatures } from "../server/bookFeatureStore.js";
import { readShadowForecasts } from "../server/predictionOutcomes.js";
import type { BookFeatures } from "../strategy21/prediction/bookFeatures.js";

const dirs: string[] = [];
afterEach(() => { for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true }); });
const feature = (observedAt: string, midpoint: number): BookFeatures => ({ pair: "SOL/USD", observedAt, midpoint, microprice: midpoint, spreadBps: 10, queueImbalance: 0, bidDepth50BpsUsd: 1000, askDepth50BpsUsd: 1000, bidDepth100BpsUsd: 2000, askDepth100BpsUsd: 2000 });
describe("shadow runtime", () => {
  it("records features and forecasts without a decision mutation interface", () => {
    const dir = mkdtempSync(join(tmpdir(), "zobiris-runtime-")); dirs.push(dir);
    const path = join(dir, "shadow.sqlite");
    const ingest = createShadowFeatureHandler(path);
    ingest(feature("2026-09-26T09:00:00Z", 99));
    ingest(feature("2026-09-26T09:01:00Z", 100));
    expect(readBookFeatures(path, "SOL/USD", "2026-09-26T09:01:00Z")).toHaveLength(2);
    expect(readShadowForecasts(path, "SOL/USD")).toHaveLength(5);
    expect(readShadowForecasts(path, "SOL/USD")[0]?.positiveReturnProbability).toBeNull();
  });
});
