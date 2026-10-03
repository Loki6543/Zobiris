import { describe, it, expect } from "vitest";
import { buildZobirisWatchlist } from "../server/zobirisWatchlist.js";
const now = Date.parse("2026-10-02T22:00:00Z");
function fixture() {
  const calibration = {
    marketBullish: true,
    marketStatus: "BULLISH",
    btc: { change30dPct: 10, change90dPct: 20 },
    breadth7dPositive: 0.6,
    breadth30dPositive: 0.5,
    sampleSize: 12,
  };
  const asset = {
    symbol: "ETH",
    mappingStatus: "verified",
    confidence: { pct: 80 },
    strategy21: {
      researchScore: 55,
      nextDollarScore: 61,
      delayedRotationCalibration: calibration,
      delayedRotation: {
        status: "QUALIFIED",
        score: 72,
        priceUsd: 10,
        observedAt: new Date(now).toISOString(),
        change24hPct: 1,
        change7dPct: 6,
        change30dPct: -25,
        change90dPct: -55,
        recommendedPullbackPct: 5.9,
      },
      eligibility: {
        status: "ACTIVE_ELIGIBLE",
        maximumOrderUsd: 37,
        failureReasons: [],
      },
      positionAuthority: { maxNextOrderUsd: 37 },
      researchIntegrity: { risk: { researchEligibility: "ELIGIBLE" } },
    },
  };
  return {
    snapshot: { asOf: new Date(now).toISOString(), rankedAssets: [asset] },
    watchlist: [{ symbol: "ETH" }, { symbol: "MISSING" }],
    account: {
      privateAccountSynced: true,
      capturedAt: new Date(now).toISOString(),
      lastError: null,
      freeCashUsd: 100,
      holdings: [],
      openOrders: [],
      trades: [],
    },
    rules: {
      ETH: {
        symbol: "ETH",
        pair: "XETHZUSD",
        tickSize: 0.01,
        lotDecimals: 3,
        orderMin: 0.01,
        costMin: 1,
        status: "online",
        observedAt: new Date(now).toISOString(),
      },
    },
    now,
  };
}
describe("Unity watchlist projection", () => {
  it("honors the persisted reward lot without hiding later investments", () => {
    const f = fixture();
    (f.account.holdings as any[]).push({ symbol: "BABY", quantity: 0.00523 });
    expect(
      buildZobirisWatchlist({ ...f, rewardRemaining: 0.00523 }).portfolio
        .holdings,
    ).toBe(0);
    (f.account.holdings as any[])[0].quantity = 2;
    expect(
      buildZobirisWatchlist({ ...f, rewardRemaining: 0.00523 }).portfolio
        .holdings,
    ).toBe(1);
  });
  it("applies recorded reentry adjustment with shared entry math", () => {
    const f = fixture();
    (f.account.trades as any[]).push(
      { symbol: "ETH", side: "SELL", at: new Date(now - 120000).toISOString() },
      { symbol: "ETH", side: "BUY", at: new Date(now - 60000).toISOString() },
    );
    const a = buildZobirisWatchlist(f).assets[0];
    expect(a.entry.reentry).toBe(true);
    expect(a.entry.effectiveDiscountPct).toBe(7.9);
    expect(a.entry.referenceLimit).toBeCloseTo(9.21);
  });
  it("accepts persisted JSON rows and millisecond snapshot timestamps", () => {
    const f = fixture();
    const r = buildZobirisWatchlist({
      ...f,
      snapshot: {
        asOf: now,
        rankedAssets: JSON.stringify(f.snapshot.rankedAssets),
      },
    });
    expect(r.asOf).toBe(new Date(now).toISOString());
    expect(r.assets[0].price).toBe(10);
  });
  it("never rounds tiny token prices to zero in the contract", () => {
    const f = fixture();
    f.snapshot.rankedAssets[0].strategy21.delayedRotation.priceUsd = 0.0000035628;
    expect(buildZobirisWatchlist(f).assets[0].price).toBe(0.0000035628);
  });
  it("preserves missing rows and null values instead of fabricated zero", () => {
    const r = buildZobirisWatchlist(fixture());
    expect(r.assets[1].state).toBe("DATA_INSUFFICIENT");
    expect(r.assets[1].price).toBeNull();
    expect(r.assets[1].scores.rotation).toBeNull();
    expect(r.assets[1].observationMs).toBeNull();
  });
  it("uses production scores and validated tick-rounded reference without mutating source", () => {
    const f = fixture(),
      before = JSON.stringify(f);
    const r = buildZobirisWatchlist(f);
    expect(r.assets[0].scores).toEqual({
      rotation: 0.72,
      nextDollar: 0.61,
      research: 0.55,
    });
    expect(r.assets[0].entry.referenceLimit).toBeCloseTo(9.41);
    expect(r.assets[0].blockedReason).toBeNull();
    expect(JSON.stringify(f)).toBe(before);
  });
  it("exposes CryptoBERT price-sentiment context without changing entry authority", () => {
    const f = fixture();
    const baseline = buildZobirisWatchlist(f).assets[0];
    const socialIntelligence = new Map([
      [
        "ETH",
        {
          available: true,
          model: "ElKulako/cryptobert" as const,
          authority: "SHADOW_ONLY_NO_TRADING_AUTHORITY" as const,
          horizons: {
            "8h": {
              hours: 8,
              samples: 4,
              bearish: 0.05,
              neutral: 0.15,
              bullish: 0.8,
              net: 0.75,
              confidence: 0.8,
              acceleration: 0.2,
              crowding: "BULLISH" as const,
            },
          },
        },
      ],
    ]);
    f.snapshot.rankedAssets[0].strategy21.delayedRotation.change24hPct = 6;
    const enriched = buildZobirisWatchlist({ ...f, socialIntelligence }).assets[0];
    expect(enriched.socialShadow.state).toBe("BULLISH_CROWDING_PULLBACK_RISK");
    expect(enriched.socialShadow.authority).toBe("SHADOW_ONLY_NO_ENTRY_SCORE_CHANGE");
    expect(enriched.entry.referenceLimit).toBe(baseline.entry.referenceLimit);
    expect(enriched.scores).toEqual(baseline.scores);
  });
  it("exposes graph overextension as a deeper shadow reference without changing live entry authority", () => {
    const f = fixture();
    const target = f.snapshot.rankedAssets[0];
    target.strategy21.delayedRotation.change24hPct = 10;
    target.strategy21.delayedRotation.change7dPct = 10;
    target.strategy21.delayedRotation.change30dPct = 10;
    target.strategy21.delayedRotation.change90dPct = 20;
    const peerRows = [
      ["BTC", 4, 7, 10.3, 20.4],
      ["SOL", 5, 7.5, 9.8, 19.7],
      ["XRP", 4.5, 6.8, 10.5, 20.6],
      ["LINK", 3.8, 7.2, 9.6, 19.5],
      ["AAVE", -2, -5, -20, -35],
      ["ADA", 1, 0, 35, 55],
      ["DOGE", -4, -10, -40, -60],
      ["HBAR", 2, 3, 45, 70],
      ["COMP", -1, -3, -30, -50],
    ] as const;
    for (const [symbol, h24, d7, d30, d90] of peerRows) {
      f.snapshot.rankedAssets.push({
        symbol,
        strategy21: {
          delayedRotation: {
            observedAt: new Date(now).toISOString(),
            change24hPct: h24,
            change7dPct: d7,
            change30dPct: d30,
            change90dPct: d90,
          },
        },
      } as any);
    }
    const result = buildZobirisWatchlist(f).assets[0];
    expect(result.graphShadow.state).toBe("OVEREXTENDED");
    expect(result.graphShadow.authority).toBe(
      "SHADOW_ONLY_NO_ENTRY_SCORE_CHANGE",
    );
    expect(result.entry.graphShadowReferencePrice).toBeLessThan(
      result.entry.referenceLimit!,
    );
    expect(result.entry.referenceLimit).toBeCloseTo(9.41);
    expect(result.scores).toEqual({
      rotation: 0.72,
      nextDollar: 0.61,
      research: 0.55,
    });
  });

  it("retains pattern state but blocks downstream execution failures", () => {
    const f = fixture();
    f.snapshot.rankedAssets[0].strategy21.positionAuthority.maxNextOrderUsd = 0;
    const a = buildZobirisWatchlist(f).assets[0];
    expect(a.state).toBe("QUALIFIED");
    expect(a.blockedReason).toBeTruthy();
    expect(a.entry.referenceLimit).toBeNull();
  });
  it.each([-31 * 60000, 60000])(
    "rejects stale or future observations (%s)",
    (offset) => {
      const f = fixture();
      f.snapshot.rankedAssets[0].strategy21.delayedRotation.observedAt =
        new Date(now + offset).toISOString();
      const r = buildZobirisWatchlist(f);
      expect(r.marketGate.pass).toBeNull();
      expect(r.assets[0].blockedReason).toBeTruthy();
      expect(r.assets[0].entry.referenceLimit).toBeNull();
    },
  );
  it("does not present stale account fallback as current cash or holdings", () => {
    const f = fixture();
    f.account.privateAccountSynced = false;
    const r = buildZobirisWatchlist(f);
    expect(r.portfolio.freeCash).toBeNull();
    expect(r.portfolio.holdings).toBeNull();
    expect(r.assets[0].position.held).toBeNull();
    expect(r.assets[0].entry.reentry).toBeNull();
    expect(r.assets[0].entry.referenceLimit).toBeNull();
  });
  it("unknown market calibration is not false evidence and never enables entries", () => {
    const f = fixture();
    delete (f.snapshot.rankedAssets[0].strategy21 as any)
      .delayedRotationCalibration;
    const r = buildZobirisWatchlist(f);
    expect(r.marketGate.pass).toBeNull();
    expect(r.marketGate.btc30d).toBeNull();
    expect(r.assets[0].entry.referenceLimit).toBeNull();
  });
  it("missing metadata or below-minimum cash cannot emit a limit", () => {
    const f = fixture();
    f.account.freeCashUsd = 0.1;
    expect(buildZobirisWatchlist(f).assets[0].entry.referenceLimit).toBeNull();
    f.account.freeCashUsd = 100;
    delete (f.rules as any).ETH;
    expect(buildZobirisWatchlist(f).assets[0].entry.referenceLimit).toBeNull();
  });
  it("keeps a stable entry certification shadow-only and preserves the live reference limit", () => {
    const f = fixture();
    const strategy = f.snapshot.rankedAssets[0].strategy21 as any;
    strategy.eligibility = {
      ...strategy.eligibility,
      spreadP95Bps: 6,
      entryImpactP95Bps: 5,
      exitImpactP95Bps: 5,
      stressedExitImpactBps: 18,
    };
    strategy.executionCostEvidence = {
      takerFeeBpsPerSide: 40,
      feeSource: "CONSERVATIVE_DEFAULT",
    };
    const baseline = buildZobirisWatchlist(f).assets[0];
    const start = Date.parse("2025-01-01T00:00:00Z");
    const outcomeRecords = Array.from({ length: 40 }, (_, i) => {
      const generatedAt = start + i * 8 * 86400000;
      const dueAt = generatedAt + 7 * 86400000;
      const observedAt = dueAt + 60000;
      return {
        measurementVersion: "episodes-v2",
        outcomeId: "eth-cert-" + i,
        symbol: "ETH",
        generatedAt: new Date(generatedAt).toISOString(),
        referencePriceObservedAt: new Date(generatedAt).toISOString(),
        action: "HOLD",
        assetState: "QUALIFIED",
        referencePriceUsd: 10,
        proposedLimitUsd: 9.41,
        sampledTouchAt: new Date(generatedAt + 86400000).toISOString(),
        actualFill: null,
        opportunityScore: 70,
        researchScore: 60,
        evidenceQuality: 0.8,
        thesisId: "cert-" + i,
        strategyStatus: "QUALIFIED",
        recommendedPullbackPct: 5.9,
        maxFavorablePct: 8,
        maxAdversePct: -7,
        evaluations: [{
          status: "RESOLVED",
          horizon: "7D",
          dueAt: new Date(dueAt).toISOString(),
          evaluatedAt: new Date(observedAt + 60000).toISOString(),
          priceObservedAt: new Date(observedAt).toISOString(),
          priceUsd: 10.3,
          returnPct: 3,
        }],
      } as any;
    });
    const enriched = buildZobirisWatchlist({ ...f, outcomeRecords }).assets[0];
    expect(enriched.signalCertification.status).toBe("STABLE_SHADOW");
    expect(enriched.signalCertification.authority).toBe("SHADOW_ONLY_NO_ENTRY_SCORE_CHANGE");
    expect(enriched.signalCertification.execution.feeSource).toBe("CONSERVATIVE_DEFAULT");
    expect(enriched.entry.referenceLimit).toBe(baseline.entry.referenceLimit);
    expect(enriched.scores).toEqual(baseline.scores);
  });
  it("existing orders stay human review and cannot imply automatic edits", () => {
    const f = fixture();
    (f.account.openOrders as any[]).push({
      symbol: "ETH",
      side: "BUY",
      amountUsd: 20,
    });
    const r = buildZobirisWatchlist(f);
    expect(r.assets[0].position.openOrderDisposition).toBe("VERIFY");
    expect(r.assets[0].blockedReason).toContain("Existing order");
    expect(r.assets[0].entry.referenceLimit).toBeNull();
  });
});
