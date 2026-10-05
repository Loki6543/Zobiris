import test from "node:test";
import assert from "node:assert/strict";
import { integrateStrategy21 } from "../integration.js";
import { buildLiquidityProfile, type OrderBookSnapshot } from "../engine/liquidity.js";
import { DELAYED_ROTATION_MODE } from "../engine/delayedRotation.js";

function asset(symbol: string, score: number) {
  return {
    symbol,
    canonicalAssetId: symbol + "-id",
    mappingStatus: "verified",
    opportunity: {
      raw: score,
      adjusted: score,
      factorScores: [
        { family: "marketTechnical", raw: score, adjusted: score },
        { family: "fundamentalTokenomics", raw: 70, adjusted: 70 },
        { family: "liquidityMarketStructure", raw: 70, adjusted: 70 },
        { family: "socialAttention", raw: 60, adjusted: 60 },
        { family: "catalystsNarrative", raw: 60, adjusted: 60 },
      ],
    },
    confidence: { pct: 85 },
    riskGates: [],
    targetWeight: { pct: 0 },
    action: "ACCUMULATE",
    risk: "Moderate",
    evidenceCoverage: 0.9,
  };
}

function liquidity(): ReturnType<typeof buildLiquidityProfile> {
  const end = Date.parse("2026-10-05T12:00:00Z");
  const snapshots: OrderBookSnapshot[] = Array.from({ length: 14 }, (_, i) => ({
    pair: "LAGUSD",
    observedAt: new Date(end - (13 - i) * 86_400_000).toISOString(),
    activeMinute: true,
    tradeNotional1m: 20_000,
    bids: [{ price: 9.99, size: 10_000 }, { price: 9.95, size: 10_000 }],
    asks: [{ price: 10.01, size: 10_000 }, { price: 10.05, size: 10_000 }],
  }));
  return buildLiquidityProfile({
    snapshots,
    dailyCredibleNotionalUsd: Array(14).fill(5_000_000),
  });
}

function cmc(symbol: string, d7: number, d30: number, d90: number) {
  return {
    id: "cmc-" + symbol,
    symbol,
    factorFamily: "marketTechnical",
    providerIds: ["cmc"],
    source: "cmc /v3/cryptocurrency/quotes/latest",
    claimOrigin: "provider",
    dataMode: "live",
    observedAt: "2026-10-05T12:00:00Z",
    receivedAt: "2026-10-05T12:00:00Z",
    evidenceConfidence: 1,
    claim: JSON.stringify({
      symbol,
      priceUsd: symbol === "LAG" ? 10 : 100,
      change24hPct: 0.5,
      change7dPct: d7,
      change30dPct: d30,
      change60dPct: d30 * 1.4,
      change90dPct: d90,
      marketCapUsd: 1_000_000_000,
      volume24hUsd: 80_000_000,
    }),
  };
}

function evidence() {
  return [
    cmc("BTC", 2, 10, 40),
    cmc("LAG", 4, 14, 10),
    cmc("ETH", 3, 8, 25),
    cmc("SOL", 3, 7, 20),
    cmc("XRP", 2, 6, 15),
    cmc("LINK", 2, 5, 14),
    cmc("AVAX", 2, 4, 12),
    cmc("AAVE", 2, 3, 11),
    cmc("HBAR", -1, 2, 9),
    cmc("ATOM", -2, 1, 8),
    cmc("SUI", -2, 1, 7),
    cmc("COMP", -3, -1, 5),
  ];
}

test("delayed rotation may demote baseline authority but cannot manufacture a higher order cap", () => {
  const snapshot = {
    asOf: "2026-10-05T12:00:00Z",
    policyVersion: "test",
    regime: "legacy",
    regimeConfidence: 80,
    rankedAssets: [asset("BTC", 70), asset("LAG", 76)],
  };
  const canonicalAssets = new Map([
    ["BTC", { id: "BTC-id", symbol: "BTC", name: "Bitcoin", mappingStatus: "verified" }],
    ["LAG", { id: "LAG-id", symbol: "LAG", name: "Laggard", mappingStatus: "verified" }],
  ]);
  const liquidityBySymbol = new Map([
    ["LAG", { pair: "LAGUSD", profile: liquidity(), takerFeeBpsPerSide: 10, estimatedGrossExpectedReturnBps: 1000 }],
  ]);

  const legacy = integrateStrategy21({
    snapshot,
    canonicalAssets,
    evidenceClaims: evidence(),
    liquidityBySymbol,
    recommendationMode: "LEGACY",
  });
  const rotation = integrateStrategy21({
    snapshot,
    canonicalAssets,
    evidenceClaims: evidence(),
    liquidityBySymbol,
    recommendationMode: DELAYED_ROTATION_MODE,
  });

  const legacyLag = legacy.rankedAssets.find((row) => row.symbol === "LAG")!.strategy21;
  const rotationLag = rotation.rankedAssets.find((row) => row.symbol === "LAG")!.strategy21;

  assert.equal(rotationLag.delayedRotation.status, "QUALIFIED");
  assert.ok(rotationLag.positionAuthority.maxNextOrderUsd <= legacyLag.positionAuthority.maxNextOrderUsd);
  assert.equal(rotationLag.nextDollarScore, rotationLag.opportunity.score);
  assert.notEqual(rotationLag.nextDollarScore, rotationLag.delayedRotation.score);
});

test("a failed delayed-rotation screen only demotes an otherwise eligible baseline candidate", () => {
  const snapshot = {
    asOf: "2026-10-05T12:00:00Z",
    policyVersion: "test",
    regime: "legacy",
    regimeConfidence: 80,
    rankedAssets: [asset("BTC", 70), asset("LAG", 76)],
  };
  const canonicalAssets = new Map([
    ["BTC", { id: "BTC-id", symbol: "BTC", name: "Bitcoin", mappingStatus: "verified" }],
    ["LAG", { id: "LAG-id", symbol: "LAG", name: "Laggard", mappingStatus: "verified" }],
  ]);
  const claims = evidence().map((row) =>
    row.symbol === "LAG" ? cmc("LAG", 4, 14, 35) : row,
  );
  const result = integrateStrategy21({
    snapshot,
    canonicalAssets,
    evidenceClaims: claims,
    liquidityBySymbol: new Map([
      ["LAG", { pair: "LAGUSD", profile: liquidity(), takerFeeBpsPerSide: 10, estimatedGrossExpectedReturnBps: 1000 }],
    ]),
    recommendationMode: DELAYED_ROTATION_MODE,
  });
  const lag = result.rankedAssets.find((row) => row.symbol === "LAG")!.strategy21;
  assert.equal(lag.delayedRotation.status, "NOT_LAGGING");
  assert.equal(lag.positionAuthority.maxNextOrderUsd, 0);
  assert.equal(lag.nextDollarScore, null);
});
