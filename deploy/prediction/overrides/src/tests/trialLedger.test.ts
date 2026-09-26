import { afterEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { recordTrial, readTrials, evaluateWalkForward } from "../server/trialLedger.js";

const dirs: string[] = [];
afterEach(() => { for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true }); });
describe("trial ledger", () => {
  it("retains failed trials and rejects overwritten IDs", () => {
    const dir = mkdtempSync(join(tmpdir(), "zobiris-trial-")); dirs.push(dir);
    const path = join(dir, "trials.sqlite");
    const trial = { id: "trial-1", modelVersion: "shadow/1", features: ["queueImbalance"], trainEnd: "2026-09-01T00:00:00Z", testStart: "2026-09-02T00:00:00Z", testEnd: "2026-09-09T00:00:00Z", status: "failed" as const, netReturnPct: -2 };
    recordTrial(path, trial);
    expect(() => recordTrial(path, { ...trial, netReturnPct: 100 })).toThrow();
    expect(readTrials(path)[0]?.status).toBe("failed");
  });
  it("rejects lookahead and charges explicit execution costs", () => {
    expect(() => evaluateWalkForward({ trainEnd: 10, testStart: 10, testEnd: 20, feeBpsPerSide: 40, spreadBps: 10, impactBps: 5 }, [{ observedAt: 15, availableAt: 16, returnPct: 2 }])).toThrow();
    const result = evaluateWalkForward({ trainEnd: 10, testStart: 12, testEnd: 20, feeBpsPerSide: 40, spreadBps: 10, impactBps: 5 }, [{ observedAt: 15, availableAt: 15, returnPct: 2 }]);
    expect(result.netReturnPct).toBeCloseTo(1.05);
  });
});
