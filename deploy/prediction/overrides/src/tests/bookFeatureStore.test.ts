import { afterEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { appendBookFeatures, readBookFeatures } from "../server/bookFeatureStore.js";

const dirs: string[] = [];
afterEach(() => { for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true }); });

describe("book feature persistence", () => {
  it("deduplicates a sampling minute and excludes future rows", () => {
    const dir = mkdtempSync(join(tmpdir(), "zobiris-book-")); dirs.push(dir);
    const path = join(dir, "features.sqlite");
    const feature = { pair: "SOL/USD", observedAt: "2026-09-26T09:00:01Z", midpoint: 100, microprice: 100, spreadBps: 10, queueImbalance: 0, bidDepth50BpsUsd: 100, askDepth50BpsUsd: 100, bidDepth100BpsUsd: 200, askDepth100BpsUsd: 200 };
    appendBookFeatures(path, feature);
    appendBookFeatures(path, { ...feature, observedAt: "2026-09-26T09:00:20Z" });
    expect(readBookFeatures(path, "SOL/USD", "2026-09-26T09:00:10Z")).toHaveLength(1);
    expect(readBookFeatures(path, "SOL/USD", "2026-09-26T09:00:00Z")).toHaveLength(0);
  });
});
