// Pure helpers for the Mind page: what would change the posture, where each opening sits on the attention radar,
// where Claude and the engine disagree, and which forecasts were wrong. Every input is passed in; nothing is fetched.
import type { Posture } from "./valleyForge";
import type { OpeningCandidate, Verdict } from "./openings";

export interface MindSignals {
  posture: Posture;
  fearGreed: number | null;
  mayerMultiple: number | null;
  drawdownFrom365dHighPct: number | null;
  btcClose: number | null;
  sma200: number | null;
  stablecoinChange30dPct: number | null;
  breadth30dPositive: number | null;
}
export interface Trigger { to: Posture; condition: string; distance: string; near: boolean }

const n = (v: number | null | undefined) => v != null && Number.isFinite(v);
const money = (v: number) => `$${Math.round(v).toLocaleString("en-US")}`;

/** The nearest thresholds that would move the posture, with the gap left, so the triggers are visible before they fire. */
export function postureTriggers(s: MindSignals): Trigger[] {
  const t: Trigger[] = [];
  if (n(s.stablecoinChange30dPct)) {
    const gap = s.stablecoinChange30dPct! + 5;
    t.push({ to: "INTEGRITY", condition: "Stablecoin supply shrinks 5% in 30 days", distance: `${gap.toFixed(1)} pts of supply left`, near: gap <= 2 });
  }
  if (s.posture !== "EUPHORIA" && n(s.fearGreed)) {
    const gap = 80 - s.fearGreed!;
    t.push({ to: "EUPHORIA", condition: "Fear & Greed reaches 80", distance: gap <= 0 ? "reached" : `${gap} points away (now ${s.fearGreed})`, near: gap <= 10 });
  }
  if (s.posture !== "EUPHORIA" && n(s.mayerMultiple) && n(s.btcClose)) {
    const price = (s.btcClose! / s.mayerMultiple!) * 2;
    const gap = (price / s.btcClose! - 1) * 100;
    t.push({ to: "EUPHORIA", condition: "Bitcoin at 2× its 200-day average", distance: gap <= 0 ? "reached" : `${money(price)} · ${gap.toFixed(0)}% above now`, near: gap <= 15 });
  }
  if (s.posture !== "DETERIORATION" && n(s.sma200) && n(s.btcClose)) {
    const gap = (s.btcClose! / s.sma200! - 1) * 100;
    t.push({ to: "DETERIORATION", condition: "Bitcoin closes below its 200-day average", distance: gap <= 0 ? "below now" : `${money(s.sma200!)} · ${gap.toFixed(1)}% below now`, near: gap <= 5 });
  }
  if (s.posture !== "CAPITULATION" && n(s.drawdownFrom365dHighPct)) {
    const gap = -40 - s.drawdownFrom365dHighPct!;
    t.push({ to: "CAPITULATION", condition: "40% below the 1-year high with Fear & Greed ≤ 20", distance: gap >= 0 ? "drawdown reached; waiting on fear" : `${(-gap).toFixed(0)} pts of drawdown left`, near: gap >= -10 });
  }
  if (n(s.breadth30dPositive)) {
    const b = Math.round(s.breadth30dPositive! * 100);
    t.push({ to: "EXPLORATION", condition: "Fewer than 45% of the top 100 up over 30 days", distance: b < 45 ? "below now" : `${b - 45} pts of breadth left (now ${b}%)`, near: b - 45 <= 10 && b >= 45 });
  }
  return t.sort((a, b) => Number(b.near) - Number(a.near));
}

export interface RadarDot { symbol: string; name: string; rank: number; tier: OpeningCandidate["tier"]; verdict: Verdict; score: number; x: number; y: number; r: number; vetoed: boolean; shock: string; labelled: boolean; /** Label above (-1) or below (+1) the dot, alternating by score rank so neighbours do not overlap. */ labelSide: -1 | 1 }
const TIER_ANGLE: Record<OpeningCandidate["tier"], [number, number]> = { rank101_200: [-90, 30], rank201_500: [30, 150], speculative: [150, 270] };

/**
 * Place openings on a unit radar: the better a coin's score ranks among all openings the closer to the centre it sits
 * (rank order, not raw score, so a field of similar scores still spreads out), a veto pins it to the rim, each rank
 * band owns a 120° sector and coins spread inside it by market rank. Coordinates are -1..1 with (0,0) the centre.
 * The top `labels` scorers carry a label; the rest are labelled only when picked.
 */
export function radarLayout(openings: OpeningCandidate[], labels = 6): RadarDot[] {
  const byTier = new Map<OpeningCandidate["tier"], OpeningCandidate[]>();
  for (const c of openings) byTier.set(c.tier, [...(byTier.get(c.tier) ?? []), c]);
  const order = [...openings].filter((c) => c.verdict !== "AVOID").sort((a, b) => b.score - a.score).map((c) => c.geckoId);
  const dots: RadarDot[] = [];
  for (const [tier, list] of byTier) {
    const [a0, a1] = TIER_ANGLE[tier];
    const sorted = [...list].sort((a, b) => a.rank - b.rank);
    sorted.forEach((c, k) => {
      const vetoed = c.verdict === "AVOID";
      const pos = order.indexOf(c.geckoId);
      const radius = vetoed ? 0.97 : 0.16 + (order.length > 1 ? pos / (order.length - 1) : 0) * 0.74;
      const angle = ((a0 + ((k + 0.5) / sorted.length) * (a1 - a0)) * Math.PI) / 180;
      const cap = Math.max(1e6, c.marketCapUsd);
      dots.push({ symbol: c.symbol, name: c.name, rank: c.rank, tier, verdict: c.verdict, score: c.score, x: Math.cos(angle) * radius, y: Math.sin(angle) * radius,
        r: 0.02 + Math.min(0.06, Math.log10(cap / 1e6) * 0.014), vetoed, shock: c.volume.class, labelled: vetoed || (pos >= 0 && pos < labels), labelSide: pos % 2 === 0 ? -1 : 1 });
    });
  }
  return dots;
}

export interface Disagreement { symbol: string; rank: number; engine: Verdict; claude: string; aiScore: number; thesis: string }
/** Openings where the Claude review and the engine verdict point different ways; agreement is silent. */
export function disagreements(openings: OpeningCandidate[]): Disagreement[] {
  const rankOf = (v: string) => (v === "CONSIDER" ? 2 : v === "WATCH" ? 1 : 0);
  return openings.filter((c) => c.ai && Math.abs(rankOf(c.ai.verdict) - rankOf(c.verdict)) >= 1)
    .map((c) => ({ symbol: c.symbol, rank: c.rank, engine: c.verdict, claude: c.ai!.verdict, aiScore: c.ai!.aiScore, thesis: c.ai!.thesis }))
    .sort((a, b) => Math.abs(rankOf(b.claude) - rankOf(b.engine)) - Math.abs(rankOf(a.claude) - rankOf(a.engine)));
}

export interface Miss { day: string; said: string; happened: string; pUp: number }
/** Forecasts whose direction call (p > 0.5 = up) did not happen, newest first, within the last `days`. */
export function forecastMisses(recent: Array<{ day: string; pUp: number; up: boolean; close: number; exit: number }>, today: string, days = 7): Miss[] {
  const cutoff = Date.parse(today) - days * 86_400_000;
  return recent.filter((r) => Date.parse(r.day) >= cutoff && (r.pUp > 0.5) !== r.up && r.pUp !== 0.5)
    .map((r) => ({ day: r.day, said: `${Math.round(r.pUp * 100)}% up`, happened: `${r.up ? "rose" : "fell"} ${Math.abs((r.exit / r.close - 1) * 100).toFixed(1)}%`, pUp: r.pUp }))
    .sort((a, b) => b.day.localeCompare(a.day));
}

/** A belief tile dims when its track record is no better than a coin flip (Brier >= 0.25) on at least 10 scored days. */
export function beliefDimmed(brier: number | null, n: number): boolean {
  return n >= 10 && brier != null && brier >= 0.25;
}
