import { describe, expect, it } from "vitest";
import { deliberateShadow, compareRecordedOutcomes } from "../server/researchDebate.js";
import type { SwarmShadow, SwarmSpecialistId } from "../strategy21/swarm.js";
import type { SwarmLedgerRecord } from "../server/swarmLedger.js";

const ids: SwarmSpecialistId[] = [
  "regime", "entry", "liquidity", "relative",
  "sentiment", "onchainWhale", "portfolioRisk", "critic",
];
function shadow(): SwarmShadow {
  const scores: Record<SwarmSpecialistId, number> = {
    regime: 0.78, entry: 0.86, liquidity: 0.8, relative: 0.72,
    sentiment: 0.66, onchainWhale: 0.52, portfolioRisk: 0.8, critic: 0.62,
  };
  return {
    version: "ZOBIRIS_SWARM_V1",
    authority: "SHADOW_ONLY_NO_TRADING_AUTHORITY",
    symbol: "SOL",
    integrity: {
      status: "PASS", criticalIssues: [], unknownSpecialists: [], portfolioRecommendationAllowed: true,
    },
    specialists: Object.fromEntries(ids.map(id => [id, {
      id, state: "KNOWN", score: scores[id], reliability: 0.85,
      baseWeight: 0.125, independenceFactor: id === "critic" ? 0.55 : 0.8,
      effectiveWeight: 0.07, evidenceFamily: id === "sentiment" ? "social" : "price",
      reasons: ["Recorded " + id + " evidence."],
    }])) as SwarmShadow["specialists"],
    consensus: {
      score: 71, confidencePct: 80, coveragePct: 100,
      disagreementPct: 15, reliabilityPct: 80, regimeAdjustmentPctPoints: 2,
      correlationDiscountPct: 20,
    },
    entryQuality: { shadowDeltaPctPoints: 2, productionScoreChanged: false },
    ranking: { shadowScore: 71, productionRankChanged: false },
    executionBoundary: {
      mayIncreaseOrderSize: false, mayBypassEligibility: false,
      mayBypassLiquidity: false, mayBypassSecurity: false,
      positionAuthorityEffectUsd: 0,
    },
  };
}
const when = "2026-10-24T10:00:00.000Z";
function record(returnPct: number, status: "PENDING" | "RESOLVED" = "RESOLVED"): SwarmLedgerRecord {
  return {
    id: when + ":SOL", generatedAt: when, symbol: "SOL",
    referencePriceUsd: 100, swarm: shadow(),
    evaluations: [{
      horizon: "1d", dueAt: "2026-10-25T10:00:00.000Z",
      status, evaluatedAt: status === "RESOLVED" ? "2026-10-25T10:05:00.000Z" : null,
      priceUsd: status === "RESOLVED" ? 100 * (1 + returnPct / 100) : null,
      returnPct: status === "RESOLVED" ? returnPct : null,
    }],
  };
}
describe("TradingAgents-inspired research debate (research only)", () => {
  it("uses recorded evidence and explicitly leaves missing macro news UNKNOWN", () => {
    const d = deliberateShadow(shadow(), { decisionAt: when });
    expect(d.votes.btcRegime.status).toBe("KNOWN");
    expect(d.votes.altRecovery.status).toBe("KNOWN");
    expect(d.votes.macroNews.status).toBe("UNKNOWN");
    expect(d.votes.macroNews.score).toBeNull();
    expect(d.coveragePct).toBeLessThan(100);
    expect(d.comparison.debatedShadowScore).not.toBeNull();
    expect(d.approach).toContain("NOT_LIVE_LLMS");
    expect(d.executionBoundary.liveOrderAuthority).toBe(false);
    expect(d.comparison.productionScoreChanged).toBe(false);
    expect(d.comparison.productionRankChanged).toBe(false);
  });
  it("fails closed if a critical swarm input failed or risk is unavailable", () => {
    const s = shadow();
    s.integrity.status = "FAIL_CLOSED";
    expect(deliberateShadow(s, { decisionAt: when }).comparison.debatedShadowScore).toBeNull();
    const s2 = shadow();
    s2.specialists.liquidity.state = "UNKNOWN";
    expect(deliberateShadow(s2, { decisionAt: when }).comparison.debatedShadowScore).toBeNull();
  });
  it("does not turn missing relative strength into fabricated confirmation", () => {
    const s = shadow();
    s.specialists.relative.state = "UNKNOWN";
    const d = deliberateShadow(s, { decisionAt: when });
    expect(d.votes.altRecovery.status).toBe("PARTIAL");
    expect(d.votes.altRecovery.reliability).toBeLessThan(0.8);
  });
  it("rejects future-dated, stale, or invalid macro evidence", () => {
    const evidence = {
      observedAt: "2026-10-24T09:50:00.000Z",
      retrievedAt: "2026-10-24T09:55:00.000Z",
      sourceUrl: "https://example.org/research",
      stance: "BEARISH" as const, confidence: 0.7,
    };
    expect(deliberateShadow(shadow(), { decisionAt: when, macroNews: evidence }).votes.macroNews.score).toBe(30);
    expect(deliberateShadow(shadow(), { decisionAt: when, macroNews: {...evidence, retrievedAt:"2026-10-24T10:01:00.000Z"} }).votes.macroNews.status).toBe("UNKNOWN");
    expect(deliberateShadow(shadow(), { decisionAt: when, macroNews: {...evidence, sourceUrl:"javascript:alert(1)"} }).votes.macroNews.status).toBe("UNKNOWN");
    expect(deliberateShadow(shadow(), { decisionAt: when, macroNews: {...evidence, observedAt:"2026-10-23T04:00:00.000Z"} }).votes.macroNews.status).toBe("UNKNOWN");
  });
  it("pairs recorded forward outcomes, excluding pending outcomes and charging costs", () => {
    const summary = compareRecordedOutcomes([record(2),record(-1),record(0, "PENDING")], "1d", 25);
    expect(summary.evaluated).toBe(2);
    expect(summary.originalSwarm.selections).toBe(2);
    expect(summary.originalSwarm.winRatePct).toBe(50);
    expect(summary.originalSwarm.meanNetReturnPct).toBe(0.25);
    expect(summary.status).toBe("INSUFFICIENT_SAMPLE");
    expect(summary.method).toContain("RETROSPECTIVE");
    expect(summary.authority).toBe("SHADOW_ONLY_NO_TRADING_AUTHORITY");
  });
  it("guards cost configuration and never scores unresolved returns", () => {
    expect(() => compareRecordedOutcomes([record(2)], "1d", -1)).toThrow(RangeError);
    expect(compareRecordedOutcomes([record(2, "PENDING")]).evaluated).toBe(0);
  });
});
