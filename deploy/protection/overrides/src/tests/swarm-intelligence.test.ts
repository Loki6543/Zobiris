import { describe, expect, it } from "vitest";
import { evaluateSwarmShadow, type SwarmContext } from "../strategy21/swarm.js";

function baseContext(): SwarmContext {
  return {
    symbol: "ETH",
    snapshotFresh: true,
    observationFresh: true,
    priceUsd: 2500,
    marketGate: {
      pass: true,
      btc30d: 9,
      btc90d: 21,
      breadth7d: 0.64,
      breadth30d: 0.57,
    },
    rotationScore: 0.78,
    recommendedPullbackPct: 6,
    eligibilityStatus: "ACTIVE_ELIGIBLE",
    eligibleMaxUsd: 37,
    positionAuthorityUsd: 37,
    researchEligibility: "ELIGIBLE",
    accountFresh: true,
    freeCashUsd: 250,
    reentry: false,
    hasOpenOrder: false,
    confidencePct: 78,
    socialShadow: {
      state: "PRICE_SENTIMENT_CONFIRMATION",
      samples: 5,
      netSentiment: 0.42,
      acceleration: 0.08,
      price24hPct: 1.5,
    },
    graphShadow: {
      available: true,
      state: "ALIGNED",
      confidence: 0.82,
      residual24hPct: 0.3,
      residual7dPct: 0.8,
    },
    blockedReasonCount: 0,
  };
}

describe("ZOBIRIS swarm v1 shadow consensus", () => {
  it("fails closed when critical price or portfolio context is stale", () => {
    const ctx = baseContext();
    ctx.snapshotFresh = false;
    ctx.accountFresh = false;
    ctx.freeCashUsd = null;
    ctx.reentry = null;

    const result = evaluateSwarmShadow(ctx);
    expect(result.integrity.status).toBe("FAIL_CLOSED");
    expect(result.integrity.portfolioRecommendationAllowed).toBe(false);
    expect(result.integrity.criticalIssues.length).toBeGreaterThan(0);
    expect(result.specialists.portfolioRisk.state).toBe("FAIL_CLOSED");
    expect(result.entryQuality.shadowDeltaPctPoints).toBe(0);
    expect(result.executionBoundary.positionAuthorityEffectUsd).toBe(0);
  });

  it("keeps missing noncritical evidence UNKNOWN instead of treating it as neutral", () => {
    const ctx = baseContext();
    ctx.socialShadow = {
      state: "INSUFFICIENT_DATA",
      samples: 0,
      netSentiment: null,
      acceleration: null,
      price24hPct: 1,
    };
    ctx.graphShadow = { available: false, state: "INSUFFICIENT", confidence: null };

    const result = evaluateSwarmShadow(ctx);
    expect(result.integrity.status).toBe("DEGRADED");
    expect(result.specialists.sentiment.state).toBe("UNKNOWN");
    expect(result.specialists.relative.state).toBe("UNKNOWN");
    expect(result.specialists.onchainWhale.state).toBe("UNKNOWN");
    expect(result.consensus.coveragePct).toBeLessThan(100);
    expect(result.consensus.score).not.toBeNull();
  });

  it("discounts correlated price-derived confirmations", () => {
    const result = evaluateSwarmShadow(baseContext());
    expect(result.specialists.regime.independenceFactor).toBeLessThan(1);
    expect(result.specialists.entry.independenceFactor).toBeLessThan(1);
    expect(result.specialists.relative.independenceFactor).toBeLessThan(1);
    expect(result.consensus.correlationDiscountPct).toBeGreaterThan(0);
  });

  it("penalizes high specialist disagreement", () => {
    const coherent = evaluateSwarmShadow(baseContext());
    const conflictCtx = baseContext();
    conflictCtx.graphShadow = {
      available: true,
      state: "OVEREXTENDED",
      confidence: 0.95,
      residual24hPct: -8,
      residual7dPct: -10,
    };
    conflictCtx.socialShadow = {
      state: "BULLISH_CROWDING_PULLBACK_RISK",
      samples: 8,
      netSentiment: 0.82,
      acceleration: 0.2,
      price24hPct: 8,
    };
    conflictCtx.reentry = true;
    conflictCtx.hasOpenOrder = true;
    conflictCtx.blockedReasonCount = 3;

    const conflict = evaluateSwarmShadow(conflictCtx);
    expect(conflict.consensus.disagreementPct).toBeGreaterThan(
      coherent.consensus.disagreementPct,
    );
    expect(conflict.consensus.confidencePct).toBeLessThan(
      coherent.consensus.confidencePct,
    );
  });

  it("contains non-finite inputs instead of poisoning consensus math", () => {
    const ctx = baseContext();
    ctx.rotationScore = Number.NaN;
    (ctx.socialShadow as any).samples = "not-a-number";
    const result = evaluateSwarmShadow(ctx);
    expect(Number.isNaN(result.consensus.score)).toBe(false);
    expect(Number.isNaN(result.consensus.confidencePct)).toBe(false);
    expect(result.specialists.entry.score).toBe(0.3 * 0.74 + 0.2 * 0.78);
  });

  it("uses aggregate perp positioning without claiming wallet-level whale evidence", () => {
    const ctx = baseContext();
    ctx.nowMs = Date.parse("2026-10-03T12:10:00Z");
    ctx.perpPositioning = {
      provider: "hyperliquid",
      provenance: "HYPERLIQUID_META_AND_ASSET_CTXS",
      observedAt: "2026-10-03T12:00:00Z",
      fundingRate: 0.00008,
      fundingPercentile: 0.95,
      premiumPct: 0.1,
      premiumPercentile: 0.9,
      openInterestUsd: 125000,
      dayNtlVolumeUsd: 1000000,
      oiChangePct: 25,
      oiAbsoluteMovePercentile: 1,
      crowdingState: "CROWDED_LONG",
      flowState: "LEVERAGED_LONG_BUILD",
      confidence: 0.82,
      whaleWalletEvidence: "UNKNOWN_PUBLIC_AGGREGATE_ONLY",
    };
    const result = evaluateSwarmShadow(ctx);
    expect(result.specialists.onchainWhale.state).toBe("KNOWN");
    expect(result.specialists.onchainWhale.evidenceFamily).toBe("derivatives");
    expect(result.specialists.onchainWhale.score).toBeLessThan(0.5);
    expect(result.specialists.onchainWhale.reliability).toBeLessThanOrEqual(0.78);
    expect(
      result.specialists.onchainWhale.reasons.some((reason) =>
        reason.includes("wallet-level whale evidence"),
      ),
    ).toBe(true);
    expect(result.executionBoundary.positionAuthorityEffectUsd).toBe(0);
  });

  it("keeps stale perp positioning UNKNOWN", () => {
    const ctx = baseContext();
    ctx.nowMs = Date.parse("2026-10-03T13:00:01Z");
    ctx.perpPositioning = {
      provider: "hyperliquid",
      provenance: "HYPERLIQUID_META_AND_ASSET_CTXS",
      observedAt: "2026-10-03T12:00:00Z",
      crowdingState: "BALANCED",
      flowState: "NO_LARGE_FLOW_SIGNAL",
      confidence: 0.8,
      whaleWalletEvidence: "UNKNOWN_PUBLIC_AGGREGATE_ONLY",
    };
    const result = evaluateSwarmShadow(ctx);
    expect(result.specialists.onchainWhale.state).toBe("UNKNOWN");
  });

  it("cannot escalate Strategy 2.1 execution authority", () => {
    const result = evaluateSwarmShadow(baseContext());
    expect(result.authority).toBe("SHADOW_ONLY_NO_TRADING_AUTHORITY");
    expect(result.entryQuality.productionScoreChanged).toBe(false);
    expect(result.ranking.productionRankChanged).toBe(false);
    expect(result.executionBoundary).toEqual({
      mayIncreaseOrderSize: false,
      mayBypassEligibility: false,
      mayBypassLiquidity: false,
      mayBypassSecurity: false,
      positionAuthorityEffectUsd: 0,
    });
  });
});
