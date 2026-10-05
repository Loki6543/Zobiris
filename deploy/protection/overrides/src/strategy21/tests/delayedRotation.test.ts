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

test("7d breadth is diagnostic-only while BTC and 30d breadth remain the market gate", () => {
  const claims = [claim("BTC", 0.5, 7.7, 37.25)];
  for (let i = 0; i < 20; i += 1) claims.push(claim(`ALT${i}`, i < 7 ? 2 : -2, i < 10 ? 5 : -1, 5));
  const accepted = calibrateDelayedRotationMarket(claims);
  assert.ok((accepted.breadth7dPositive ?? 1) < 0.40);
  assert.equal(accepted.marketBullish, true);

  // Leave only 7 of 20 alts with positive 30d structure (35%), below the 45% gate.
  const weak30d = claims.map((item, index) => index >= 8 ? claim(item.symbol, -2, -2, 5) : item);
  const weak = calibrateDelayedRotationMarket(weak30d);
  assert.ok((weak.breadth30dPositive ?? 1) < 0.45);
  assert.equal(weak.marketBullish, false);
});

test("verified 59-asset appendix reproduces the 24/10/13/12 cohort counts and RSA diagnostics", () => {
  const rows = [
    ["SCRT", 5.5, 19.48, -86.12, 2.89],
    ["VELVET", 20.26, -8.18, -85.88, 22.57],
    ["TLM", -6.92, 13.07, -55.95, 35.92],
    ["PARTI", 4.55, 8.44, -41.44, 54.74],
    ["ICX", 3.77, 0.25, -39.95, 29.81],
    ["RVN", -2.41, -20.91, -37.14, 5.6],
    ["DATA", 11.11, 19.37, -33.14, 0.0],
    ["MITO", -0.88, -7.83, -32.49, 78.14],
    ["WEMIX", -0.41, 2.82, -25.38, 0.57],
    ["TEL", 2.63, 10.42, -17.33, 0.73],
    ["BONK", 3.63, 24.73, -17.24, 12.23],
    ["HELLO", 8.69, -6.57, -15.41, 18.17],
    ["MOVE", 7.41, 14.31, -12.78, 52.08],
    ["BRISE", -1.42, -2.58, -10.25, 7.74],
    ["TAG", -5.62, 18.05, -8.58, 2.46],
    ["PONKE", -7.31, 12.28, 1.66, 10.25],
    ["HIGH", 2.93, 33.34, 3.15, 405.42],
    ["ELON", -2.46, -0.28, 4.57, 5.88],
    ["UMA", -4.27, 10.45, 5.51, 14.72],
    ["XLM", 0.63, 20.57, 9.0, 1.39],
    ["GHST", -8.65, 4.29, 9.22, 1.28],
    ["DAG", 27.93, 10.26, 10.14, 2.67],
    ["COW", -1.54, 24.91, 11.14, 3.11],
    ["GNO", 0.19, 1.28, 13.89, 0.21],
    ["ARKM", -5.57, 26.44, 13.9, 70.37],
    ["MLN", -0.46, 6.49, 14.06, 0.73],
    ["ATOM", -3.22, 20.42, 14.29, 4.22],
    ["MATH", 3.4, 17.23, 14.4, 2.25],
    ["ATR", -7.6, -1.3, 15.45, 8.11],
    ["PERP", -2.98, 8.09, 15.67, 4.97],
    ["MASK", 5.0, 14.9, 15.71, 6.28],
    ["XDC", 2.53, 16.07, 15.75, 1.6],
    ["SNX", -2.25, 22.28, 15.93, 9.66],
    ["TURBO", -2.2, 8.89, 15.98, 10.68],
    ["CRO", 1.32, 21.34, 16.34, 0.24],
    ["EIGEN", -4.1, 35.64, 17.18, 8.33],
    ["LAYER", -4.22, 14.24, 17.81, 24.4],
    ["ENJ", 10.43, 28.31, 18.21, 27.41],
    ["APE", 5.38, 21.85, 23.85, 9.55],
    ["RENDER", -2.59, 39.04, 24.85, 2.55],
    ["XCN", -7.64, 26.44, 24.86, 2.68],
    ["CTSI", 1.22, 21.94, 28.16, 10.16],
    ["HOT", -2.34, 22.55, 28.8, 2.0],
    ["NEO", -3.75, 24.38, 30.79, 1.74],
    ["APT", -3.68, 40.75, 31.33, 5.39],
    ["ORDI", -6.35, 14.08, 33.35, 10.69],
    ["BCH", -4.57, 27.1, 33.68, 2.75],
    ["AST", -0.6, -9.62, 34.49, 1.55],
    ["BabyDoge", -3.12, 8.19, 34.53, 2.51],
    ["XEM", -1.74, 5.2, 35.81, 4.63],
    ["FIL", -6.73, 42.01, 36.5, 5.91],
    ["XVS", -1.5, 9.26, 36.81, 3.83],
    ["ACH", -3.07, 15.29, 37.86, 4.78],
    ["DOT", -3.34, 40.42, 38.13, 4.57],
    ["PENGU", -8.89, 12.26, 39.73, 20.06],
    ["SAMO", -16.18, 11.5, 40.16, 0.62],
    ["TLOS", 5.86, -16.94, 45.11, 4.18],
    ["COTI", -7.85, -4.23, 63.75, 18.45],
    ["ZEC", -18.26, 35.86, 195.4, 2.73]
  ] as const;
  const claims: RotationEvidenceClaim[] = [claim("BTC", 0.45, 7.72, 37.25, 0, 0.01)];
  for (const [symbol, r7, r30, r90, turnoverPct] of rows) {
    claims.push(claim(symbol, r7, r30, r90, 0, turnoverPct / 100));
  }
  const c = calibrateDelayedRotationMarket(claims);
  assert.equal(c.diagnostics.nBaseCohort, 24);
  assert.equal(c.diagnostics.recoveryCount, 10);
  assert.equal(c.diagnostics.descriptivePullbackCount, 13);
  assert.equal(c.diagnostics.prospectivePullbackCount, 12);
  assert.equal(c.diagnostics.deepPullbackCount, 1);
  assert.equal(c.diagnostics.rsa7_30Pass, 8);
  assert.equal(c.diagnostics.rsa30_90Pass, 24);
  assert.equal(c.diagnostics.rsa30_90Degenerate, true);
  assert.ok((c.breadth7dPositive ?? 1) < 0.40);
  assert.equal(c.marketBullish, true);
});
