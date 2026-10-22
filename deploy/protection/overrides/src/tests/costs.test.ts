import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { FEE_SCHEDULE_ID, FEE_TIERS, btcCostPerSide, entryCost, exitCost, feeTier, netReturnPct } from "../strategyV2/costs";

describe("shared Kraken cost schedule", () => {
  it("matches the fee schedule in the policy registry", () => {
    const reg = JSON.parse(readFileSync(fileURLToPath(new URL("../server/policy/zobiris-policy-registry-v3.1.json", import.meta.url)), "utf8"));
    expect(reg.feeSchedule.scheduleId).toBe(FEE_SCHEDULE_ID);
    expect(FEE_TIERS.map((t) => [t.tier, t.makerPct, t.takerPct])).toEqual(reg.feeSchedule.tiers.map((t: any) => [t.tier, t.makerPct, t.takerPct]));
  });
  it("defaults to tier 1 and reads the account tier from the environment", () => {
    expect(feeTier({}).tier).toBe(1);
    expect(feeTier({ ZOBIRIS_KRAKEN_FEE_TIER: "3" }).takerPct).toBe(0.38);
    expect(feeTier({ ZOBIRIS_KRAKEN_FEE_TIER: "99" }).tier).toBe(1);
  });
  it("charges maker in and taker plus half-spread out", () => {
    const t1 = FEE_TIERS[0];
    expect(entryCost("GALA", 150, t1)).toBeCloseTo(0.004, 12);
    expect(exitCost("GALA", 150, t1)).toBeCloseTo(0.0095, 12);
    expect(exitCost("BTC", 1, t1)).toBeCloseTo(0.0081, 12);
    expect(netReturnPct(10, 10, "GALA", 150, t1)).toBeCloseTo(((1 - 0.0095) / 1.004 - 1) * 100, 10);
    expect(btcCostPerSide(t1)).toBeCloseTo((0.004 + 0.0081) / 2, 12);
  });
  it("keeps a small-cap round trip near the real cost, not the old 14.5%", () => {
    expect(-netReturnPct(10, 10, "SAND", 300, FEE_TIERS[0])).toBeLessThan(1.5);
  });
});
