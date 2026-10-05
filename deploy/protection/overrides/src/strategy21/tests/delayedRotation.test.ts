import test from "node:test";
import assert from "node:assert/strict";
import {
  calibrateDelayedRotationMarket,
  computeVolumeAccel,
  evaluateDelayedRotation,
  type RotationEvidenceClaim,
} from "../engine/delayedRotation.js";

const at = "2026-10-05T12:00:00.000Z";
function claim(symbol: string, d7: number, d30: number, d90: number, d24 = 1, turnover = 0.08, priorVolumes?: number[]): RotationEvidenceClaim {
  const marketCapUsd = 1_000_000_000;
  const volume24hUsd = marketCapUsd * turnover;
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
      marketCapUsd,
      volume24hUsd,
      ...(priorVolumes ? { priorCompletedDailyVolumesUsd: priorVolumes } : {}),
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

test("verified base filter requires >=20pp BTC-relative 90d lag plus positive 30d structure", () => {
  const claims = [...bullishClaims(), claim("LAG", 5, 16, 15, -1, 0.016)];
  const result = evaluateDelayedRotation("LAG", claims);
  assert.equal(result.status, "QUALIFIED");
  assert.equal(result.researchState, "ROTATION_CONFIRMED");
  assert.equal(result.verifiedBaseFilterPassed, true);
  assert.equal(result.validatedAlpha, false);
  assert.equal(result.evidenceAuthority, "RESEARCH_PRIOR_ONLY");
});

test("old absolute ranges no longer qualify a coin that has already caught BTC", () => {
  const claims = [...bullishClaims().map((x) => x.symbol === "BTC" ? claim("BTC", 4, 10, 20) : x), claim("CAUGHT", 5, 15, 10)];
  const result = evaluateDelayedRotation("CAUGHT", claims);
  assert.equal(result.status, "NOT_LAGGING");
  assert.equal(result.researchState, "ALREADY_CAUGHT_UP");
  assert.equal(result.qualifiesForNewCapital, false);
});

test("structural floor is ex-ante and does not reward catastrophic collapse", () => {
  const claims = [...bullishClaims(), claim("BROKEN", 4, 8, -35.01)];
  const result = evaluateDelayedRotation("BROKEN", claims);
  assert.equal(result.status, "STRUCTURALLY_WEAK");
  assert.equal(result.researchState, "VALUE_TRAP");
  assert.equal(result.qualifiesForNewCapital, false);
});

test("separates controlled pullback from deep pullback using the prospective -8% floor", () => {
  const controlled = evaluateDelayedRotation("PULL", [...bullishClaims(), claim("PULL", -3, 10, 5)]);
  assert.equal(controlled.status, "NEAR_ROTATION");
  assert.equal(controlled.researchState, "ROTATION_FORMING");

  const deep = evaluateDelayedRotation("GHSTLIKE", [...bullishClaims(), claim("GHSTLIKE", -8.65, 10, 5)]);
  assert.equal(deep.status, "TOO_EARLY");
  assert.equal(deep.researchState, "LAGGARD_UNCONFIRMED");
});

test("VAccel excludes the current observation from its seven-day baseline", () => {
  const claims = [...bullishClaims(), claim("VOL", 5, 10, 5, 1, 0.16, [80_000_000,80_000_000,80_000_000,80_000_000,80_000_000,80_000_000,80_000_000])];
  const calibration = calibrateDelayedRotationMarket(claims);
  const rowClaim = claims.at(-1)!;
  const payload = JSON.parse(rowClaim.claim!);
  const v = computeVolumeAccel({
    symbol: "VOL", observedAt: at, priceUsd: 10,
    change24hPct: 1, change7dPct: 5, change30dPct: 10, change90dPct: 5,
    marketCapUsd: payload.marketCapUsd, volume24hUsd: payload.volume24hUsd,
    priorCompletedDailyVolumesUsd: payload.priorCompletedDailyVolumesUsd,
  });
  assert.equal(v, 2);
  assert.ok(calibration.diagnostics.volumeAccelAvailableCount >= 1);
});

test("RSA_30,90 degeneracy is surfaced as a diagnostic and never used as a qualification gate", () => {
  const claims = [claim("BTC", 0.5, 7.7, 37.25)];
  for (let i = 0; i < 24; i += 1) claims.push(claim(`ALT${i}`, i < 8 ? 3 : -2, 12, 10, 0.5, 0.02));
  const calibration = calibrateDelayedRotationMarket(claims);
  assert.equal(calibration.diagnostics.nBaseCohort, 24);
  assert.equal(calibration.diagnostics.rsa30_90Pass, 24);
  assert.equal(calibration.diagnostics.rsa30_90Degenerate, true);
});
