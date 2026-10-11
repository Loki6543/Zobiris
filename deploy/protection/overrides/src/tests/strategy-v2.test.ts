import { describe, expect, it } from "vitest";
import { computeBtcRegime, rotationBreadth } from "../strategyV2/btcRegime";
import { screenSmallCap, type SmallCapInput } from "../strategyV2/smallCapScreen";
import { planBarbell, ladderDecision } from "../strategyV2/barbell";

// Deterministic series: geometric drift with a small bounded wiggle.
const series = (n: number, start: number, dailyDrift: number, wiggle = 0.004) =>
  Array.from({ length: n }, (_, i) => start * Math.exp(dailyDrift * i + wiggle * Math.sin(i / 3)));

describe("BTC regime gate", () => {
  it("fails closed with too little history", () => {
    const r = computeBtcRegime(series(150, 50000, 0.002));
    expect(r.state).toBe("UNKNOWN");
    expect(r.allowTop100Rotation).toBe(false);
    expect(r.allowSmallCapBets).toBe(false);
    expect(r.exposureMultiplier).toBe(0);
  });
  it("rejects invalid closes", () => {
    const s = series(300, 50000, 0.001); s[100] = Number.NaN;
    expect(computeBtcRegime(s).state).toBe("UNKNOWN");
  });
  it("classifies a steady uptrend as RISK_ON and allows both strategies", () => {
    const r = computeBtcRegime(series(400, 30000, 0.002));
    expect(r.state).toBe("RISK_ON");
    expect(r.score).toBe(5);
    expect(r.allowTop100Rotation).toBe(true);
    expect(r.allowSmallCapBets).toBe(true);
    expect(r.exposureMultiplier).toBeGreaterThan(0);
  });
  it("classifies a downtrend as RISK_OFF with zero new altcoin exposure", () => {
    const r = computeBtcRegime(series(400, 100000, -0.002));
    expect(r.state).toBe("RISK_OFF");
    expect(r.exposureMultiplier).toBe(0);
    expect(r.allowTop100Rotation).toBe(false);
    expect(r.allowSmallCapBets).toBe(false);
  });
  it("flags capitulation after a deep fall below the 200-day average", () => {
    const s = [...series(300, 60000, 0.002), ...series(120, 60000 * Math.exp(0.6), -0.008)];
    const r = computeBtcRegime(s);
    expect(r.capitulationWatch).toBe(true);
    expect(r.allowSmallCapBets).toBe(false);
  });
  it("scales exposure down when realized volatility is high", () => {
    const calm = computeBtcRegime(series(400, 30000, 0.002, 0.002));
    // Alternating +/-3% wiggle => ~6% daily swings, ~115% annualised volatility.
    const wild = computeBtcRegime(Array.from({ length: 400 }, (_, i) => 30000 * Math.exp(0.002 * i + (i % 2 ? 0.03 : -0.03))));
    expect(wild.exposureMultiplier).toBeLessThan(calm.exposureMultiplier);
  });
  it("measures top-100 breadth vs BTC", () => {
    const rows = Array.from({ length: 40 }, (_, i) => ({ symbol: "C" + i, change90dPct: i < 32 ? 20 : -5 }));
    expect(rotationBreadth(rows, 10).phase).toBe("ALT_ROTATION");
    expect(rotationBreadth(rows.map((r) => ({ ...r, change90dPct: -30 })), 10).phase).toBe("BITCOIN_LED");
    expect(rotationBreadth(rows.slice(0, 5), 10).phase).toBe("UNKNOWN");
  });
});

const good: SmallCapInput = {
  symbol: "GOOD", cmcRank: 240, marketCapUsd: 60_000_000, fullyDilutedValueUsd: 90_000_000, volume24hUsd: 4_000_000,
  ageDays: 900, krakenListed: true, change30dPct: 12, change90dPct: -10, btcChange30dPct: 3,
  drawdownFromAthPct: -85, priceAboveSma50: true, unlockShareNext60d: 0.01,
};
const riskOn = { allowSmallCapBets: true, state: "RISK_ON" as const };

describe("small-cap screen (ranks 101-500)", () => {
  it("passes a liquid, low-dilution, washed-out coin that has stopped falling", () => {
    const r = screenSmallCap(good, riskOn);
    expect(r.eligible).toBe(true);
    expect(r.convexityScore).toBeGreaterThan(50);
  });
  it("blocks every bet when the BTC regime does not allow small caps", () => {
    const r = screenSmallCap(good, { allowSmallCapBets: false, state: "NEUTRAL" });
    expect(r.eligible).toBe(false);
    expect(r.rejections).toContain("BTC_REGIME_NEUTRAL_NO_SMALL_CAP_BETS");
  });
  it.each([
    [{ cmcRank: 80 }, "OUTSIDE_RANK_101_500"],
    [{ krakenListed: false }, "NOT_TRADABLE_ON_KRAKEN"],
    [{ volume24hUsd: 200_000 }, "VOLUME_TOO_LOW_OR_UNKNOWN"],
    [{ volume24hUsd: 90_000_000 }, "SUSPICIOUS_TURNOVER_POSSIBLE_WASH_OR_PUMP"],
    [{ fullyDilutedValueUsd: 300_000_000 }, "HEAVY_FUTURE_DILUTION"],
    [{ unlockShareNext60d: 0.12 }, "LARGE_UNLOCK_WITHIN_60D"],
    [{ unlockShareNext60d: null }, "UNLOCK_SCHEDULE_UNKNOWN"],
    [{ ageDays: 40 }, "TOO_NEW_UNPROVEN_SURVIVAL"],
    [{ priceAboveSma50: null }, "PRICE_HISTORY_INCOMPLETE"],
  ] as Array<[Partial<SmallCapInput>, string]>)("rejects %o with %s", (patch, code) => {
    const r = screenSmallCap({ ...good, ...patch }, riskOn);
    expect(r.eligible).toBe(false);
    expect(r.rejections).toContain(code);
  });
  it("ranks a coin still falling below its 50-day lower than one that has based", () => {
    const based = screenSmallCap(good, riskOn).convexityScore;
    const falling = screenSmallCap({ ...good, priceAboveSma50: false, change30dPct: -25, change90dPct: -10 }, riskOn).convexityScore;
    expect(falling).toBeLessThan(based);
  });
  it("penalises chasing a coin already up >100% in 30 days", () => {
    const chased = screenSmallCap({ ...good, change30dPct: 140 }, riskOn);
    expect(chased.notes).toContain("ALREADY_UP_100PCT_30D_CHASE_RISK");
  });
});

describe("antifragile barbell sizing", () => {
  it("caps each bet at 1.5% of the portfolio and the sleeve at 10%", () => {
    const p = planBarbell(1000, [], 1);
    expect(p.sleeveBudgetUsd).toBe(100);
    expect(p.betSizeUsd).toBe(15);
    expect(p.canOpenNewBet).toBe(true);
  });
  it("counts losing stakes at cost so a losing sleeve cannot be refilled", () => {
    const losers = Array.from({ length: 6 }, (_, i) => ({ symbol: "L" + i, costUsd: 15, valueUsd: 3 }));
    const p = planBarbell(1000, losers, 1);
    expect(p.sleeveRemainingUsd).toBe(10);
    expect(p.betSizeUsd).toBe(10);
  });
  it("blocks new bets when the regime gives zero exposure or slots are full", () => {
    expect(planBarbell(1000, [], 0).reasons).toContain("BTC_REGIME_BLOCKS_NEW_RISK");
    const full = Array.from({ length: 8 }, (_, i) => ({ symbol: "F" + i, costUsd: 1, valueUsd: 1 }));
    expect(planBarbell(1000, full, 1).reasons).toContain("MAX_OPEN_BETS_REACHED");
  });
  it("refuses bets below the minimum useful order", () => {
    const p = planBarbell(300, [], 1);
    expect(p.betSizeUsd).toBe(4.5);
    expect(p.reasons).toContain("BET_BELOW_MIN_ORDER");
  });
});

describe("convex profit ladder", () => {
  const base = { entryPrice: 1, originalQty: 100, remainingQty: 100, daysHeld: 30, priceAboveSma50: true, thesisBroken: false };
  it("holds below 2x and never averages down", () => {
    expect(ladderDecision({ ...base, currentPrice: 0.4 }).action).toBe("HOLD");
  });
  it("takes the stake off at 2x, then 25% at 5x, then 15% at 10x — in order even on a gap", () => {
    expect(ladderDecision({ ...base, currentPrice: 2.1 })).toMatchObject({ action: "SELL_STAKE_FREE_ROLL", sellQty: 50 });
    expect(ladderDecision({ ...base, currentPrice: 12 }).action).toBe("SELL_STAKE_FREE_ROLL");
    expect(ladderDecision({ ...base, remainingQty: 50, currentPrice: 6 })).toMatchObject({ action: "SELL_25PCT_ORIGINAL", sellQty: 25 });
    expect(ladderDecision({ ...base, remainingQty: 25, currentPrice: 11 })).toMatchObject({ action: "SELL_15PCT_ORIGINAL", sellQty: 15 });
    expect(ladderDecision({ ...base, remainingQty: 10, currentPrice: 20 }).action).toBe("HOLD");
  });
  it("exits on a broken thesis and reviews dead money after 180 days", () => {
    expect(ladderDecision({ ...base, currentPrice: 3, thesisBroken: true })).toMatchObject({ action: "EXIT_THESIS_BROKEN", sellQty: 100 });
    expect(ladderDecision({ ...base, currentPrice: 1.1, daysHeld: 200, priceAboveSma50: false }).action).toBe("REVIEW_EXIT_DEAD_MONEY");
  });
});
