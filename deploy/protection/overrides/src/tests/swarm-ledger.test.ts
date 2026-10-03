import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { evaluateSwarmShadow, type SwarmContext } from "../strategy21/swarm.js";
import { readSwarmLedger, updateSwarmLedger } from "../server/swarmLedger.js";

const dirs: string[] = [];
afterEach(async () => {
  await Promise.all(dirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

function shadow() {
  const ctx: SwarmContext = {
    symbol: "ETH",
    snapshotFresh: true,
    observationFresh: true,
    priceUsd: 100,
    marketGate: { pass: true, btc30d: 5, btc90d: 12, breadth7d: 0.6, breadth30d: 0.55 },
    rotationScore: 0.76,
    recommendedPullbackPct: 6,
    eligibilityStatus: "ACTIVE_ELIGIBLE",
    eligibleMaxUsd: 37,
    positionAuthorityUsd: 37,
    researchEligibility: "ELIGIBLE",
    accountFresh: true,
    freeCashUsd: 200,
    reentry: false,
    hasOpenOrder: false,
    confidencePct: 75,
    socialShadow: { state: "INSUFFICIENT_DATA", samples: 0, netSentiment: null },
    graphShadow: { available: false, state: "INSUFFICIENT", confidence: null },
    blockedReasonCount: 0,
  };
  return evaluateSwarmShadow(ctx);
}

describe("swarm outcome ledger", () => {
  it("records all requested horizons and resolves forward outcomes without duplicating the episode", async () => {
    const dir = await mkdtemp(join(tmpdir(), "zobiris-swarm-"));
    dirs.push(dir);
    const path = join(dir, "ledger.json");
    const t0 = Date.parse("2026-10-03T12:00:00Z");

    await updateSwarmLedger(path, new Date(t0).toISOString(), [
      { symbol: "ETH", price: 100, swarmShadow: shadow() },
    ]);
    await updateSwarmLedger(path, new Date(t0 + 31 * 60_000).toISOString(), [
      { symbol: "ETH", price: 110, swarmShadow: shadow() },
    ]);

    const ledger = await readSwarmLedger(path, { symbol: "ETH" });
    expect(ledger.records).toHaveLength(1);
    const record = ledger.records[0]!;
    expect(record.evaluations.map((item) => item.horizon)).toEqual([
      "30m",
      "2h",
      "8h",
      "12h",
      "1d",
      "3d",
      "7d",
    ]);
    const thirty = record.evaluations.find((item) => item.horizon === "30m")!;
    expect(thirty.status).toBe("RESOLVED");
    expect(thirty.priceUsd).toBe(110);
    expect(thirty.returnPct).toBeCloseTo(10);
    expect(record.swarm.authority).toBe("SHADOW_ONLY_NO_TRADING_AUTHORITY");
  });
});
