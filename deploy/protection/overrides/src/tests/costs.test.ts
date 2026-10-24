import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { FEE_SCHEDULE_ID, FEE_TIERS, btcCostPerSide, costSchedule, entryCost, exitCost, feeTier, netReturnPct, tradeBreakEven } from "../strategyV2/costs";

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
  it("uses an exact account schedule when both maker and taker are set", () => {
    expect(feeTier({ ZOBIRIS_KRAKEN_MAKER_PCT: "0.20", ZOBIRIS_KRAKEN_TAKER_PCT: "0.38", ZOBIRIS_KRAKEN_FEE_TIER: "1" })).toEqual({ tier: 0, makerPct: 0.2, takerPct: 0.38 });
    expect(feeTier({ ZOBIRIS_KRAKEN_MAKER_PCT: "0.20" }).tier).toBe(1);                                   // one value alone is ignored
    expect(feeTier({ ZOBIRIS_KRAKEN_MAKER_PCT: "0.5", ZOBIRIS_KRAKEN_TAKER_PCT: "0.3" }).tier).toBe(1);   // taker below maker is rejected
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

describe("fee break-even", () => {
  const owner = { tier: 0, makerPct: 0.2, takerPct: 0.38 };
  it("matches hand arithmetic for the owner's fees on a top-100 alt", () => {
    const r = tradeBreakEven(8, 4, "ALT", 50, owner)!;
    const win = (108 * (1 - 0.0038 - 0.0005)) / (100 * 1.002) - 1;
    const loss = (96 * (1 - 0.0038 - 0.0005)) / (100 * 1.002) - 1;
    expect(r.winNetPct).toBeCloseTo(win * 100, 10);
    expect(r.lossNetPct).toBeCloseTo(loss * 100, 10);
    expect(r.breakEvenWinRate!).toBeCloseTo(-loss / (win - loss), 10);
    expect(r.roundTripCostPct).toBeCloseTo((1 - (1 - 0.0043) / 1.002) * 100, 10);
    expect(r.breakEvenWinRate!).toBeGreaterThan(4 / 12);              // costs push break-even above the no-fee 33.3%
  });
  it("reports no break-even when costs eat the whole target, and rejects impossible inputs", () => {
    expect(tradeBreakEven(0.3, 2, "ALT", null, owner)!.breakEvenWinRate).toBeNull();
    expect(tradeBreakEven(0, 2, "BTC", 1, owner)).toBeNull();
    expect(tradeBreakEven(5, 100, "BTC", 1, owner)).toBeNull();
    expect(tradeBreakEven(Number.NaN, 2, "BTC", 1, owner)).toBeNull();
  });
  it("labels where the schedule comes from", () => {
    expect(costSchedule(owner)).toMatchObject({ source: "account schedule", makerPct: 0.2, takerPct: 0.38, halfSpreadPct: { major: 0.01, top100: 0.05, smaller: 0.15 } });
    expect(costSchedule(FEE_TIERS[2]).source).toBe("Kraken tier 3");
  });
});
