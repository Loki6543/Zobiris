import test from "node:test";
import assert from "node:assert/strict";
import {
  calibrateDelayedRotationMarket,
  evaluateDelayedRotation,
} from "../engine/delayedRotation.js";

const at = "2026-09-26T19:00:00.000Z";
function claim(symbol: string, d7: number, d30: number, d90: number, d24 = 1) {
  return {
    symbol,
    providerIds: ["cmc"],
    source: "cmc /v3/cryptocurrency/quotes/latest",
    observedAt: at,
    claim: JSON.stringify({
      symbol,
      priceUsd: 10,
      change24hPct: d24,
      change7dPct: d7,
      change30dPct: d30,
      change90dPct: d90,
      marketCapUsd: 1_000_000_000,
      volume24hUsd: 80_000_000,
    }),
  };
}
function bullishClaims() {
  return [
    claim("BTC", 4, 10, 40),
    claim("ETH", 5, 8, 20), claim("SOL", 6, 7, 30), claim("XRP", 3, 4, 15),
    claim("AAVE", 7, 5, 18), claim("LINK", 4, 3, 16), claim("AVAX", 5, 2, 12),
    claim("ATOM", 2, 1, 8), claim("HBAR", 3, 1, 5), claim("SUI", 8, -2, 4),
    claim("RENDER", 7, -4, 2), claim("TAO", 6, -5, 1), claim("COMP", 4, -3, 3),
  ];
}

test("qualifies a strict 30d/90d laggard only after a modest 7d recovery in a bullish market", () => {
  const claims = [...bullishClaims(), claim("LAG", 5, -12, -30, -1)];
  const calibration = calibrateDelayedRotationMarket(claims);
  assert.equal(calibration.marketBullish, true);
  const result = evaluateDelayedRotation("LAG", claims, calibration);
  assert.equal(result.status, "QUALIFIED");
  assert.equal(result.qualifiesForNewCapital, true);
  assert.ok(result.score > 70);
  assert.ok((result.recommendedPullbackPct ?? 0) >= 4);
  assert.ok((result.recommendedPullbackPct ?? 0) <= 8);
});

test("does not chase a laggard whose 7d recovery is already extended", () => {
  const claims = [...bullishClaims(), claim("FAST", 19, -8, -22, 5)];
  const result = evaluateDelayedRotation("FAST", claims);
  assert.equal(result.status, "EXTENDED");
  assert.equal(result.qualifiesForNewCapital, false);
});

test("rejects a severely broken asset instead of rewarding a large discount", () => {
  const claims = [...bullishClaims(), claim("BROKEN", 4, -50, -82)];
  const result = evaluateDelayedRotation("BROKEN", claims);
  assert.equal(result.status, "STRUCTURALLY_WEAK");
  assert.equal(result.qualifiesForNewCapital, false);
});

test("stays fail-closed when BTC or watchlist breadth is not bullish", () => {
  const claims = bullishClaims().map((item) => item.symbol === "BTC" ? claim("BTC", -2, -5, -15) : item);
  const calibration = calibrateDelayedRotationMarket(claims);
  assert.equal(calibration.marketBullish, false);
  const result = evaluateDelayedRotation("SUI", claims, calibration);
  assert.equal(result.status, "MARKET_NOT_BULLISH");
  assert.equal(result.qualifiesForNewCapital, false);
});

test("separates near-rotation watch candidates from strict buy candidates", () => {
  const claims = [...bullishClaims(), claim("NEAR", 5, 4, -5)];
  const result = evaluateDelayedRotation("NEAR", claims);
  assert.equal(result.status, "NEAR_ROTATION");
  assert.equal(result.qualifiesForNewCapital, false);
});


// User policy revision, 2026-10-02: exactly half the universe may be recovering.
test("accepts exactly 50 percent seven-day breadth and rejects below it", () => {
  const claims = [claim("BTC", 4, 10, 40),
    ...Array.from({ length: 10 }, (_, i) => claim(`ALT${i}`, i < 5 ? 2 : -2, 5, 10))];
  const accepted = calibrateDelayedRotationMarket(claims);
  assert.equal(accepted.breadth7dPositive, 0.5);
  assert.equal(accepted.marketBullish, true);
  assert.equal(accepted.thresholds.minBreadth7dPositive, 0.5);
  claims[1] = claim("ALT0", -2, 5, 10);
  assert.equal(calibrateDelayedRotationMarket(claims).marketBullish, false);
});
