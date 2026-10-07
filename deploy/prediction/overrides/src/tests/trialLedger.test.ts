import { afterEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  VALIDATION_ROUND_TRIP_BPS,
  bpsToPct,
  evaluateWalkForward,
  mayPass,
  recordTrial,
  readTrials,
  requiredZ,
} from "../server/trialLedger.js";

const dirs: string[] = [];
afterEach(() => { for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true }); });

function dbPath() {
  const dir = mkdtempSync(join(tmpdir(), "zobiris-trial-"));
  dirs.push(dir);
  return join(dir, "trials.sqlite");
}

const cell = { featureSetId: "entry-v1", horizon: "7D", regime: "ALL" };

describe("trial ledger", () => {
  it("retains failed trials and rejects overwritten IDs", () => {
    const path = dbPath();
    const trial = { id: "trial-1", modelVersion: "shadow/1", features: ["queueImbalance"], trainEnd: "2026-09-01T00:00:00Z", testStart: "2026-09-02T00:00:00Z", testEnd: "2026-09-09T00:00:00Z", status: "failed" as const, netReturnPct: -2 };
    recordTrial(path, trial);
    expect(() => recordTrial(path, { ...trial, netReturnPct: 100 })).toThrow();
    expect(readTrials(path)[0]?.status).toBe("failed");
  });

  it("rejects lookahead and charges explicit execution costs", () => {
    expect(() => evaluateWalkForward({ trainEnd: 10, testStart: 10, testEnd: 20, feeBpsPerSide: 40, spreadBps: 10, impactBps: 5 }, [{ observedAt: 15, availableAt: 16, returnPct: 2 }])).toThrow();
    const result = evaluateWalkForward({ trainEnd: 10, testStart: 12, testEnd: 20, feeBpsPerSide: 40, spreadBps: 10, impactBps: 5 }, [{ observedAt: 15, availableAt: 15, returnPct: 2 }]);
    expect(result.netReturnPct).toBeCloseTo(1.05);
    expect(result.roundTripCostBpsPerObservation).toBe(95);
  });

  it("uses the 1.20 percent maker/taker validation path without a bps-vs-percent unit error", () => {
    expect(VALIDATION_ROUND_TRIP_BPS).toBe(120);
    expect(bpsToPct(VALIDATION_ROUND_TRIP_BPS)).toBeCloseTo(1.2, 12);
    const result = evaluateWalkForward({ trainEnd: 1, testStart: 2, testEnd: 3, feePath: "MAKER_TAKER", spreadBps: 0, impactBps: 0 }, [{ observedAt: 2, availableAt: 2, returnPct: 2 }]);
    expect(result.grossReturnPct).toBe(2);
    expect(result.netReturnPct).toBeCloseTo(0.8, 12);
  });

  it("does not charge the 1.20 percent validation path twice after net return is computed", () => {
    const gate = mayPass({
      id: "trial-net",
      modelVersion: "shadow/2",
      features: ["x"],
      trainEnd: "2026-01-01T00:00:00Z",
      testStart: "2026-02-01T00:00:00Z",
      testEnd: "2026-03-01T00:00:00Z",
      status: "passed",
      netReturnPct: 0.25,
      feePath: "MAKER_TAKER",
      zScore: 4,
      testedCells: [cell],
    });
    expect(gate.ok).toBe(true);
  });

  it("derives the multiple-testing family size and blocks an uncorrected pass", () => {
    const cells = Array.from({ length: 105 }, (_, index) => ({ featureSetId: `f-${index}`, horizon: "7D", regime: "ALL" }));
    expect(requiredZ(105)).toBeGreaterThan(3.4);
    expect(requiredZ(105)).toBeLessThan(3.6);
    const gate = mayPass({
      id: "many-cells",
      modelVersion: "shadow/3",
      features: ["x"],
      trainEnd: "2026-01-01T00:00:00Z",
      testStart: "2026-02-01T00:00:00Z",
      testEnd: "2026-03-01T00:00:00Z",
      status: "passed",
      netReturnPct: 1,
      feePath: "MAKER_TAKER",
      zScore: 2.69,
      testedCells: cells,
    });
    expect(gate.ok).toBe(false);
    expect(gate.nCellsEvaluated).toBe(105);
  });

  it("stores invalid separately from inconclusive and requires an invalid reason", () => {
    const path = dbPath();
    const base = {
      modelVersion: "shadow/4",
      features: ["x"],
      trainEnd: "2026-01-01T00:00:00Z",
      testStart: "2026-02-01T00:00:00Z",
      testEnd: "2026-03-01T00:00:00Z",
      netReturnPct: 0,
    };
    expect(() => recordTrial(path, { ...base, id: "bad-invalid", status: "invalid" as const })).toThrow(/invalidReason/);
    recordTrial(path, { ...base, id: "invalid", status: "invalid", invalidReason: "chain_broken" });
    recordTrial(path, { ...base, id: "inconclusive", status: "inconclusive" });
    const trials = readTrials(path);
    expect(trials.find((trial) => trial.id === "invalid")?.status).toBe("invalid");
    expect(trials.find((trial) => trial.id === "inconclusive")?.status).toBe("inconclusive");
  });

  it("a passed trial must use the validation cost path and survive its declared family-wise correction", () => {
    const path = dbPath();
    const z = requiredZ(2) + 0.1;
    const trial = {
      id: "pass-1",
      modelVersion: "shadow/5",
      features: ["x"],
      trainEnd: "2026-01-01T00:00:00Z",
      testStart: "2026-02-01T00:00:00Z",
      testEnd: "2026-03-01T00:00:00Z",
      status: "passed" as const,
      netReturnPct: 0.1,
      feePath: "MAKER_TAKER" as const,
      zScore: z,
      testedCells: [cell, { ...cell, regime: "RISK_OFF" }],
    };
    recordTrial(path, trial);
    expect(readTrials(path)[0]).toMatchObject({ nCellsEvaluated: 2, feePath: "MAKER_TAKER" });
    expect(() => recordTrial(dbPath(), { ...trial, id: "cheap-path", feePath: "MAKER_MAKER" as const })).toThrow(/fee path/);
  });
});
