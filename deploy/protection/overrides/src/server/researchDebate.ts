/**
 * TradingAgents-inspired, evidence-grounded research debate over the existing
 * Zobiris shadow swarm. No remote LLM calls or trade authority.
 *
 * This is deliberately a deterministic five-role MVP, NOT five live LLMs.
 * Never treat an absent macro/news provider as a neutral or favorable vote.
 * Scoring the *recorded* swarm at later outcome dates avoids future inputs.
 */
import type { SwarmShadow, SwarmSpecialist, SwarmSpecialistId } from "../strategy21/swarm.js";
import type { SwarmLedgerRecord, SwarmOutcomeHorizon } from "./swarmLedger.js";

export type DebateRole = "btcRegime" | "altRecovery" | "macroNews" | "contrarian" | "risk";
export type RoleVote = {
  role: DebateRole;
  status: "KNOWN" | "PARTIAL" | "UNKNOWN" | "FAIL_CLOSED";
  score: number | null;
  reliability: number;
  weight: number;
  evidenceFamilies: string[];
  case: string[];
};
export type MacroNewsEvidence = {
  observedAt: string;
  retrievedAt: string;
  sourceUrl: string;
  stance: "BULLISH" | "BEARISH" | "MIXED";
  confidence: number;
};

const WEIGHT: Record<DebateRole, number> = {
  btcRegime: 0.23, altRecovery: 0.36, macroNews: 0.16,
  contrarian: 0.11, risk: 0.14,
};
const roles: DebateRole[] = ["btcRegime", "altRecovery", "macroNews", "contrarian", "risk"];
const round = (n: number) => Math.round(n * 100) / 100;
const clamp = (n: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, Number.isFinite(n) ? n : lo));
const valid = (s: SwarmSpecialist | undefined): s is SwarmSpecialist & { score: number } =>
  !!s && s.state === "KNOWN" && typeof s.score === "number" && Number.isFinite(s.score) && s.score >= 0 && s.score <= 1;

function specialistRole(role: DebateRole, s: SwarmSpecialist | undefined): RoleVote {
  const failed = s?.state === "FAIL_CLOSED";
  return {
    role, status: failed ? "FAIL_CLOSED" : valid(s) ? "KNOWN" : "UNKNOWN",
    score: valid(s) ? round(s.score * 100) : null,
    reliability: valid(s) ? clamp(s.reliability * s.independenceFactor) : 0,
    weight: WEIGHT[role], evidenceFamilies: s ? [s.evidenceFamily] : [],
    case: s?.reasons.slice(0, 3) ?? ["No verified specialist evidence."],
  };
}

function combine(role: DebateRole, sw: SwarmShadow, ids: SwarmSpecialistId[], parts: number[]): RoleVote {
  const members = ids.map((id, i) => ({ s: sw.specialists[id], share: parts[i] ?? 0 }));
  const known = members.filter((m) => valid(m.s));
  const failed = members.some((m) => m.s?.state === "FAIL_CLOSED");
  const coverage = known.reduce((x, m) => x + m.share, 0);
  const score = coverage > 0
    ? known.reduce((x, m) => x + (m.s.score ?? 0) * m.share, 0) / coverage : null;
  const reliability = coverage > 0
    ? known.reduce((x, m) => x + m.s.reliability * m.s.independenceFactor * m.share, 0) / coverage : 0;
  return {
    role,
    status: failed ? "FAIL_CLOSED" : coverage === 0 ? "UNKNOWN" : coverage < 0.999 ? "PARTIAL" : "KNOWN",
    score: score == null ? null : round(score * 100),
    reliability: round(clamp(reliability) * coverage * 100) / 100,
    weight: WEIGHT[role],
    evidenceFamilies: [...new Set(members.map((m) => m.s?.evidenceFamily).filter((x): x is string => !!x))],
    case: members.flatMap((m) => m.s?.reasons.slice(0, 2) ?? ["Specialist unavailable."]).slice(0, 4),
  };
}

function verifiedMacro(evidence: MacroNewsEvidence | undefined, decisionAt: string): RoleVote {
  const unknown: RoleVote = {
    role: "macroNews", status: "UNKNOWN", score: null, reliability: 0,
    weight: WEIGHT.macroNews, evidenceFamilies: ["macro-news"],
    case: ["No validated, time-bounded macro/news observation; missing evidence is not neutral."],
  };
  if (!evidence) return unknown;
  const decision = Date.parse(decisionAt), observed = Date.parse(evidence.observedAt);
  const retrieved = Date.parse(evidence.retrievedAt);
  if (!Number.isFinite(decision) || !Number.isFinite(observed) || !Number.isFinite(retrieved)
    || retrieved < observed || decision < retrieved || decision - observed > 6 * 3600000
    || !/^https:\/\/[^\s/]+(?:\/|$)/.test(evidence.sourceUrl)
    || !Number.isFinite(evidence.confidence) || evidence.confidence < 0.3 || evidence.confidence > 1
    || !["BULLISH", "BEARISH", "MIXED"].includes(evidence.stance)) return unknown;
  const score = evidence.stance === "BULLISH" ? 70 : evidence.stance === "BEARISH" ? 30 : 50;
  return { ...unknown, status: "KNOWN", score, reliability: round(evidence.confidence * 0.65 * 100) / 100,
    case: [evidence.stance + " macro/news observation, source: " + evidence.sourceUrl] };
}

export function deliberateShadow(
  sw: SwarmShadow,
  options: { decisionAt?: string; macroNews?: MacroNewsEvidence } = {},
) {
  const decisionAt = options.decisionAt ?? new Date().toISOString();
  const votes: Record<DebateRole, RoleVote> = {
    btcRegime: specialistRole("btcRegime", sw.specialists.regime),
    altRecovery: combine("altRecovery", sw, ["entry", "relative"], [0.7, 0.3]),
    macroNews: verifiedMacro(options.macroNews, decisionAt),
    contrarian: specialistRole("contrarian", sw.specialists.critic),
    risk: combine("risk", sw, ["portfolioRisk", "liquidity"], [0.55, 0.45]),
  };
  const known = roles.map((role) => votes[role]).filter((v) =>
    (v.status === "KNOWN" || v.status === "PARTIAL") && v.score != null && v.reliability > 0);
  const coverage = known.reduce((sum, v) => sum + v.weight, 0);
  const effective = known.map((v) => ({ vote: v, w: v.weight * v.reliability }));
  const totalWeight = effective.reduce((sum, v) => sum + v.w, 0);
  const mean = totalWeight > 0
    ? effective.reduce((sum, v) => sum + v.w * v.vote.score!, 0) / totalWeight : null;
  const variation = mean == null ? 1 : Math.sqrt(
    effective.reduce((sum, v) => sum + v.w * ((v.vote.score! - mean) / 100) ** 2, 0) / totalWeight);
  const disagreement = clamp(variation * 2);
  const confidence = mean == null ? 0 : clamp(
    coverage * (totalWeight / Math.max(coverage, 0.001)) * (1 - 0.60 * disagreement)
    * clamp(sw.consensus.confidencePct / 100));
  const failClosed = sw.integrity.status === "FAIL_CLOSED"
    || votes.btcRegime.status !== "KNOWN" || votes.risk.status !== "KNOWN"
    || sw.consensus.score == null || !Number.isFinite(sw.consensus.score);
  const debatedScore = !failClosed && mean != null ? round(clamp((mean / 100) - 0.12 * disagreement) * 100) : null;
  const baseline = sw.consensus.score == null ? null : round(sw.consensus.score);
  const bullishCase = [...known].sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    .slice(0, 2).map((v) => ({ role: v.role, score: v.score, evidence: v.case }));
  const bearishCase = [...known].sort((a, b) => (a.score ?? 100) - (b.score ?? 100))
    .slice(0, 2).map((v) => ({ role: v.role, score: v.score, evidence: v.case }));
  const verdict = debatedScore == null || confidence < 0.20 || coverage < 0.70
    ? "INCONCLUSIVE" : debatedScore >= 60 ? "LEAN_BULLISH"
    : debatedScore <= 40 ? "LEAN_BEARISH" : "MIXED";
  return {
    version: "ZOBIRIS_RESEARCH_DEBATE_V1",
    approach: "DETERMINISTIC_EVIDENCE_AGENT_ROLES_NOT_LIVE_LLMS",
    authority: "SHADOW_ONLY_NO_TRADING_AUTHORITY",
    symbol: sw.symbol,
    decisionAt,
    integrity: sw.integrity.status,
    votes, bullishCase, bearishCase, verdict,
    coveragePct: round(coverage * 100),
    disagreementPct: round(disagreement * 100),
    confidencePct: round(confidence * 100),
    comparison: {
      currentSwarmScore: baseline,
      debatedShadowScore: debatedScore,
      deltaPoints: debatedScore == null || baseline == null ? null : round(debatedScore - baseline),
      productionScoreChanged: false as const,
      productionRankChanged: false as const,
    },
    executionBoundary: {
      liveOrderAuthority: false as const, mayIncreaseOrderSize: false as const,
      mayBypassEligibility: false as const, positionAuthorityEffectUsd: 0 as const,
    },
  };
}

/**
 * Paired retrospective diagnostic only: both classifiers replay the same
 * previously recorded swarm, and both face the same recorded forward return.
 * This is NOT prospective validation of this new debate layer, nor a fill model.
 */
export function compareRecordedOutcomes(
  records: SwarmLedgerRecord[],
  horizon: SwarmOutcomeHorizon = "1d",
  roundTripCostBps = 25,
) {
  if (!Number.isFinite(roundTripCostBps) || roundTripCostBps < 0 || roundTripCostBps > 1000)
    throw new RangeError("roundTripCostBps must be in [0,1000]");
  const costPct = roundTripCostBps / 100;
  const bins = {
    originalSwarm: { selections: 0, wins: 0, sumNetPct: 0 },
    agentDebate: { selections: 0, wins: 0, sumNetPct: 0 },
  };
  let evaluated = 0, abstained = 0;
  for (const row of records) {
    const evaluation = row.evaluations.find((e) => e.horizon === horizon);
    if (!evaluation || evaluation.status !== "RESOLVED"
      || evaluation.returnPct == null || !Number.isFinite(evaluation.returnPct)) continue;
    evaluated++;
    const result = deliberateShadow(row.swarm, { decisionAt: row.generatedAt });
    if (result.comparison.debatedShadowScore == null) abstained++;
    const vals = {
      originalSwarm: row.swarm.consensus.score,
      agentDebate: result.comparison.debatedShadowScore,
    };
    for (const label of ["originalSwarm", "agentDebate"] as const) {
      const v = vals[label];
      if (v == null || !Number.isFinite(v) || v < 60) continue;
      bins[label].selections++;
      const net = evaluation.returnPct - costPct;
      bins[label].sumNetPct += net;
      if (net > 0) bins[label].wins++;
    }
  }
  const summarize = (b: typeof bins.originalSwarm) => ({
    selections: b.selections,
    winRatePct: b.selections ? round(b.wins / b.selections * 100) : null,
    meanNetReturnPct: b.selections ? round(b.sumNetPct / b.selections) : null,
  });
  return {
    version: "ZOBIRIS_DEBATE_COMPARISON_V1",
    status: evaluated >= 30 ? "DESCRIPTIVE_ONLY" : "INSUFFICIENT_SAMPLE",
    authority: "SHADOW_ONLY_NO_TRADING_AUTHORITY",
    method: "PAIRED_RETROSPECTIVE_REPLAY_NOT_PROSPECTIVE",
    horizon, roundTripCostBps, evaluated, abstained,
    originalSwarm: summarize(bins.originalSwarm), agentDebate: summarize(bins.agentDebate),
    caveat: "No position sizing, fill price, execution spread, survival bias correction or significance test. Do not promote on this result.",
  };
}
