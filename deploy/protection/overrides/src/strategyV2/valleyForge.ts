// Valley Forge allocation: the owner's base mix made elastic by market phase (Elastische Verteidigung).
//
// Base (recovery) mix:  30% cash · 8% stablecoin yield · 27% top 100 · 20% rank 101-200 · 10% rank 201-500 · 5% beyond 500.
// Each phase from the Valley Forge Protocol moves cash inside a 10-60% band and tilts the risk sleeves:
//   RECOVERY       Bewegungskrieg + Findigkeit   scale into confirmed, liquid opportunities (the base mix)
//   TRANSITION     Bewegungskrieg + Findigkeit   regime just turned up: rotate toward the openings, cash lowest of the up phases
//   EXPLORATION    Auftragstaktik (reconnaissance) mixed / unknown signals: research, keep new exposure smaller
//   EUPHORIA       List + elastic defense         take profit into cash and yield, trim the speculative sleeves hardest
//   DETERIORATION  elastic defense + delaying res. protect liquidity, keep a small non-zero presence
//   CAPITULATION   Valley Forge + Zeitgewinn      washed out with infrastructure intact: accumulate in measured tranches
//   INTEGRITY      mission boundaries first       stablecoin depeg or stablecoin money fleeing: stop new deployment
// Every phase keeps some exposure (counterattack capacity) and none goes all-in.
import type { BtcRegime } from "./btcRegime";
import type { AltGate } from "./altGate";

export type Sleeve = "cash" | "stableYield" | "top100" | "rank101_200" | "rank201_500" | "speculative";
export const SLEEVES: Sleeve[] = ["cash", "stableYield", "top100", "rank101_200", "rank201_500", "speculative"];
export const SLEEVE_LABEL: Record<Sleeve, string> = {
  cash: "Cash reserve", stableYield: "Stablecoin yield", top100: "Top 100", rank101_200: "Rank 101-200", rank201_500: "Rank 201-500", speculative: "Speculative 500+",
};

export type Posture = "RECOVERY" | "TRANSITION" | "EXPLORATION" | "EUPHORIA" | "DETERIORATION" | "CAPITULATION" | "INTEGRITY";
export type Mix = Record<Sleeve, number>; // percent of total portfolio, sums to 100

export const BASE_MIX: Mix = { cash: 30, stableYield: 8, top100: 27, rank101_200: 20, rank201_500: 10, speculative: 5 };

export const POSTURE_MIX: Record<Posture, Mix> = {
  RECOVERY: BASE_MIX,
  TRANSITION: { cash: 20, stableYield: 8, top100: 28, rank101_200: 24, rank201_500: 13, speculative: 7 },
  EXPLORATION: { cash: 38, stableYield: 10, top100: 26, rank101_200: 15, rank201_500: 7, speculative: 4 },
  EUPHORIA: { cash: 50, stableYield: 12, top100: 24, rank101_200: 9, rank201_500: 4, speculative: 1 },
  DETERIORATION: { cash: 55, stableYield: 12, top100: 22, rank101_200: 7, rank201_500: 3, speculative: 1 },
  CAPITULATION: { cash: 15, stableYield: 6, top100: 38, rank101_200: 24, rank201_500: 12, speculative: 5 },
  INTEGRITY: { cash: 60, stableYield: 0, top100: 30, rank101_200: 7, rank201_500: 2, speculative: 1 },
};

export const POSTURE_DOCTRINE: Record<Posture, { name: string; doctrine: string; mission: string }> = {
  RECOVERY: { name: "Recovery / broad expansion", doctrine: "Bewegungskrieg + Findigkeit", mission: "Scale into confirmed, liquid openings at the base mix." },
  TRANSITION: { name: "Transition", doctrine: "Bewegungskrieg + Findigkeit", mission: "The regime just turned: rotate reserve into the strongest openings before consensus." },
  EXPLORATION: { name: "Exploration / uncertain", doctrine: "Auftragstaktik (reconnaissance)", mission: "Signals are mixed: research, keep new exposure smaller, wait for confirmation." },
  EUPHORIA: { name: "Overheated / euphoric", doctrine: "List + Elastische Verteidigung", mission: "Do not chase: take measured profits into cash and yield, trim speculative sleeves first." },
  DETERIORATION: { name: "Deterioration", doctrine: "Elastische Verteidigung + Hinhaltender Widerstand", mission: "Protect liquidity, keep a small presence, re-check every thesis." },
  CAPITULATION: { name: "Capitulation, infrastructure intact", doctrine: "Valley Forge + Zeitgewinn", mission: "Accumulate selectively in scheduled tranches; keep a reserve, never all-in." },
  INTEGRITY: { name: "Integrity failure", doctrine: "Mission boundaries first", mission: "Stop new deployment; review stablecoin and venue exposure before anything else." },
};

/** Largest single position as a share of the portfolio (Taleb: every bet's maximum loss is known and small). */
export const POSITION_CAP_PCT: Record<Exclude<Sleeve, "cash" | "stableYield">, number> = { top100: 6, rank101_200: 2.5, rank201_500: 1.5, speculative: 0.75 };
/** BTC and ETH may each hold up to this share inside the top-100 sleeve. */
export const MAJOR_CAP_PCT = 15;
/** New positions go in three tranches (Hinhaltender Widerstand): now, after 7 days, after 21 days, each only if the thesis still holds. */
export const TRANCHE_DAYS = [0, 7, 21] as const;
/** Rebalance only when a sleeve drifts this many points from target (movement has costs). */
export const DRIFT_BAND_PTS = 4;
/** In capitulation the move to target is spread over this many weekly steps. */
export const CAPITULATION_STEPS = 8;

export interface PostureInput {
  regime: BtcRegime;
  altGate: AltGate | null;
  fearGreed: number | null;
  /** Prices of the two largest USD stablecoins (depeg check). */
  stablePrices: Array<{ symbol: string; priceUsd: number | null }>;
  /** Regime states of the most recent recorded days, oldest first (decision ledger). */
  recentRegimes: string[];
  /** Core market feeds healthy (CoinGecko markets + Kraken BTC). */
  coreFeedsOk: boolean;
}

export interface PostureResult {
  posture: Posture;
  name: string;
  doctrine: string;
  mission: string;
  allowNewBuys: boolean;
  reasons: string[];
  signals: Array<{ label: string; value: string; tone: "good" | "bad" | "neutral" }>;
}

const fmt = (n: number | null | undefined, d = 1, suffix = "") => (n == null || !Number.isFinite(n) ? "unknown" : `${n.toFixed(d)}${suffix}`);

export function detectPosture(i: PostureInput): PostureResult {
  const r = i.regime;
  const reasons: string[] = [];
  const st30 = i.altGate?.stablecoinChange30dPct ?? null;
  const breadth = i.altGate?.breadth30dPositive ?? null;
  const depegged = i.stablePrices.filter((s) => s.priceUsd != null && Math.abs(s.priceUsd - 1) > 0.02).map((s) => s.symbol);
  const fg = i.fearGreed;
  const mayer = r.mayerMultiple;
  const dd = r.drawdownFrom365dHighPct;
  const hadRiskOff = i.recentRegimes.slice(-30).includes("RISK_OFF");

  let posture: Posture;
  if (depegged.length || (st30 != null && st30 < -5)) {
    posture = "INTEGRITY";
    if (depegged.length) reasons.push(`STABLECOIN_DEPEG_${depegged.join("_")}`);
    if (st30 != null && st30 < -5) reasons.push("STABLECOIN_SUPPLY_FLEEING");
  } else if (!i.coreFeedsOk || r.state === "UNKNOWN") {
    posture = "EXPLORATION"; reasons.push("CORE_DATA_INCOMPLETE");
  } else if ((fg != null && fg >= 80) || (mayer != null && mayer >= 2.0) || (fg != null && fg >= 75 && breadth != null && breadth >= 0.85)) {
    posture = "EUPHORIA";
    if (fg != null && fg >= 75) reasons.push(`FEAR_GREED_${fg}`);
    if (mayer != null && mayer >= 2.0) reasons.push("BTC_FAR_ABOVE_200D");
  } else if ((r.capitulationWatch || (dd != null && dd <= -40 && fg != null && fg <= 20)) && (st30 == null || st30 >= -2)) {
    posture = "CAPITULATION"; reasons.push("WASHED_OUT", "STABLECOIN_BASE_INTACT");
  } else if (r.state === "RISK_OFF" || i.altGate?.state === "BTC_DOWNTREND") {
    posture = "DETERIORATION"; reasons.push(r.state === "RISK_OFF" ? "BTC_REGIME_RISK_OFF" : "BTC_BELOW_200D");
  } else if (hadRiskOff && (breadth == null || breadth >= 0.45)) {
    posture = "TRANSITION"; reasons.push("REGIME_TURNED_UP_WITHIN_30D");
  } else if (r.state === "RISK_ON" && (i.altGate?.allowAltEntries ?? true)) {
    posture = "RECOVERY"; reasons.push("BTC_UPTREND", "ALT_GATE_OPEN");
  } else {
    posture = "EXPLORATION";
    if (r.state === "NEUTRAL") reasons.push("BTC_REGIME_NEUTRAL");
    if (i.altGate && !i.altGate.allowAltEntries) reasons.push(`ALT_GATE_${i.altGate.state}`);
  }
  const d = POSTURE_DOCTRINE[posture];
  return {
    posture, ...d, allowNewBuys: posture !== "INTEGRITY", reasons,
    signals: [
      { label: "BTC regime", value: `${r.state.replace("_", " ")} (score ${r.score})`, tone: r.state === "RISK_ON" ? "good" : r.state === "RISK_OFF" ? "bad" : "neutral" },
      { label: "Mayer multiple", value: fmt(mayer, 2), tone: mayer == null ? "neutral" : mayer >= 2 ? "bad" : mayer < 0.8 ? "good" : "neutral" },
      { label: "Drawdown from 1y high", value: fmt(dd, 1, "%"), tone: dd != null && dd <= -40 ? "good" : "neutral" },
      { label: "Fear & Greed", value: fg == null ? "unknown" : String(fg), tone: fg == null ? "neutral" : fg >= 75 ? "bad" : fg <= 25 ? "good" : "neutral" },
      { label: "Stablecoin supply 30d", value: fmt(st30, 2, "%"), tone: st30 == null ? "neutral" : st30 < 0 ? "bad" : "good" },
      { label: "Top-100 breadth 30d", value: breadth == null ? "unknown" : `${Math.round(breadth * 100)}%`, tone: breadth == null ? "neutral" : breadth >= 0.45 ? "good" : "bad" },
    ],
  };
}

export type TierOfRank = "top100" | "rank101_200" | "rank201_500" | "speculative";
export function sleeveForRank(rank: number | null): TierOfRank | null {
  if (rank == null || !Number.isFinite(rank) || rank < 1) return null;
  return rank <= 100 ? "top100" : rank <= 200 ? "rank101_200" : rank <= 500 ? "rank201_500" : "speculative";
}

export interface AllocationPlan {
  posture: PostureResult;
  base: Mix;
  target: Mix;
  /** Current mix from synchronized holdings, null when the account is not linked. */
  current: Mix | null;
  rows: Array<{ sleeve: Sleeve; label: string; basePct: number; targetPct: number; currentPct: number | null; gapPct: number | null; action: string; positionCapPct: number | null; minPositions: number | null }>;
  tranches: { days: readonly number[]; note: string };
  capitulationStepPct: number | null;
}

export interface HoldingForMix { symbol: string; rank: number | null; valueUsd: number; isStable: boolean }

/** Current mix from holdings + cash (stablecoins held count as cash unless a yield position says otherwise). */
export function currentMix(holdings: HoldingForMix[], cashUsd: number, stableYieldUsd = 0): Mix | null {
  const mix: Mix = { cash: Math.max(0, cashUsd), stableYield: Math.max(0, stableYieldUsd), top100: 0, rank101_200: 0, rank201_500: 0, speculative: 0 };
  for (const h of holdings) {
    if (!(h.valueUsd > 0)) continue;
    if (h.isStable) { mix.cash += h.valueUsd; continue; }
    const s = sleeveForRank(h.rank) ?? "speculative"; // unranked coins are speculative
    mix[s] += h.valueUsd;
  }
  const total = SLEEVES.reduce((s, k) => s + mix[k], 0);
  if (!(total > 0)) return null;
  for (const k of SLEEVES) mix[k] = (mix[k] / total) * 100;
  return mix;
}

export function planAllocation(posture: PostureResult, current: Mix | null): AllocationPlan {
  const target = POSTURE_MIX[posture.posture];
  const rows = SLEEVES.map((sleeve) => {
    const cur = current ? current[sleeve] : null;
    const gap = cur == null ? null : target[sleeve] - cur;
    const cap = sleeve === "cash" || sleeve === "stableYield" ? null : POSITION_CAP_PCT[sleeve];
    let action = "Hold the target";
    if (gap != null && Math.abs(gap) >= DRIFT_BAND_PTS) {
      if (gap > 0) action = !posture.allowNewBuys && sleeve !== "cash" ? "Under target, but new deployment is paused" : sleeve === "cash" ? "Raise cash: take profits from the most over-target sleeve" : `Add about ${gap.toFixed(1)} pts${posture.posture === "CAPITULATION" ? ` in ${CAPITULATION_STEPS} weekly steps` : " in 3 tranches"}`;
      else action = sleeve === "cash" ? "Deploy reserve into under-target sleeves" : `Trim about ${(-gap).toFixed(1)} pts (largest winners first)`;
    } else if (gap != null) action = "Within the drift band: no trade";
    return { sleeve, label: SLEEVE_LABEL[sleeve], basePct: BASE_MIX[sleeve], targetPct: target[sleeve], currentPct: cur, gapPct: gap, action, positionCapPct: cap, minPositions: cap ? Math.ceil(target[sleeve] / cap) : null };
  });
  return {
    posture, base: BASE_MIX, target, current, rows,
    tranches: { days: TRANCHE_DAYS, note: "New positions enter in thirds: now, day 7 and day 21, each only if the thesis and the contract checks still hold." },
    capitulationStepPct: posture.posture === "CAPITULATION" ? Number((100 / CAPITULATION_STEPS).toFixed(1)) : null,
  };
}

/** First-tranche order as a share of the portfolio for a new position in a sleeve (cap split into the 3 tranches). */
export function firstTranchePct(sleeve: TierOfRank, symbol: string): number {
  const cap = sleeve === "top100" && (symbol === "BTC" || symbol === "ETH") ? MAJOR_CAP_PCT : POSITION_CAP_PCT[sleeve];
  return Number((cap / TRANCHE_DAYS.length).toFixed(3));
}
