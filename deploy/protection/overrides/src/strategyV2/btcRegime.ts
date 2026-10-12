// Bitcoin market-direction regime. Every new entry in ZOBIRIS is gated by this first.
//
// Design (see docs/strategy-v2-research-2026-10.md):
// - Simple, robust trend rules on completed daily closes (200D/50D SMA, 20-week SMA, 200D slope).
//   Popular cycle indicators (MVRV, Pi Cycle, 200-week MA bands) have decayed across cycles, so they
//   are not used as gates.
// - Volatility scaling: much of trend-following's drawdown reduction in BTC comes from sizing down
//   when realized volatility is high, so exposure is scaled by targetVol / realizedVol.
// - Fails closed: insufficient or invalid history => UNKNOWN, which permits no new altcoin entries.

export type BtcRegimeState = "RISK_ON" | "NEUTRAL" | "RISK_OFF" | "UNKNOWN";

export interface BtcRegime {
  state: BtcRegimeState;
  /** Trend score from -5 (strong downtrend) to +5 (strong uptrend). */
  score: number;
  close: number | null;
  sma50: number | null;
  sma200: number | null;
  sma140: number | null;
  /** close / 200-day SMA (Mayer multiple). */
  mayerMultiple: number | null;
  sma200Rising: boolean | null;
  realizedVolAnnualPct: number | null;
  drawdownFrom365dHighPct: number | null;
  /** 0..1 multiplier for new risk. 0 = no new altcoin risk. */
  exposureMultiplier: number;
  allowTop100Rotation: boolean;
  allowSmallCapBets: boolean;
  /** Deep, washed-out market: core BTC accumulation may be reviewed; no small-cap bets. */
  capitulationWatch: boolean;
  reasons: string[];
}

export interface BtcRegimeOptions {
  targetVolAnnualPct?: number;
  minExposure?: number;
}

const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
const sma = (closes: number[], n: number, endOffset = 0): number | null => {
  const end = closes.length - endOffset;
  if (end < n) return null;
  return mean(closes.slice(end - n, end));
};

export function computeBtcRegime(dailyCloses: number[], opts: BtcRegimeOptions = {}): BtcRegime {
  const targetVol = opts.targetVolAnnualPct ?? 50;
  const minExposure = opts.minExposure ?? 0.25;
  const unknown = (reason: string): BtcRegime => ({
    state: "UNKNOWN", score: 0, close: dailyCloses.at(-1) ?? null, sma50: null, sma200: null, sma140: null,
    mayerMultiple: null, sma200Rising: null, realizedVolAnnualPct: null, drawdownFrom365dHighPct: null,
    exposureMultiplier: 0, allowTop100Rotation: false, allowSmallCapBets: false, capitulationWatch: false, reasons: [reason],
  });
  if (dailyCloses.length < 221) return unknown("INSUFFICIENT_HISTORY_NEED_221_DAILY_CLOSES");
  if (dailyCloses.some((c) => !Number.isFinite(c) || c <= 0)) return unknown("INVALID_CLOSE_IN_HISTORY");

  const close = dailyCloses[dailyCloses.length - 1]!;
  const sma50 = sma(dailyCloses, 50)!;
  const sma200 = sma(dailyCloses, 200)!;
  const sma140 = sma(dailyCloses, 140)!;
  const sma200Prev = sma(dailyCloses, 200, 20)!;
  const sma200Rising = sma200 > sma200Prev;

  const reasons: string[] = [];
  let score = 0;
  if (close > sma200) { score += 2; reasons.push("PRICE_ABOVE_200D"); } else { score -= 2; reasons.push("PRICE_BELOW_200D"); }
  if (sma50 > sma200) { score += 1; reasons.push("50D_ABOVE_200D"); } else { score -= 1; reasons.push("50D_BELOW_200D"); }
  if (sma200Rising) { score += 1; reasons.push("200D_RISING"); } else { score -= 1; reasons.push("200D_FALLING"); }
  if (close > sma140) { score += 1; reasons.push("PRICE_ABOVE_20W"); } else { score -= 1; reasons.push("PRICE_BELOW_20W"); }

  const rets = dailyCloses.slice(-31).map((c, i, a) => (i === 0 ? 0 : Math.log(c / a[i - 1]!))).slice(1);
  const mu = mean(rets);
  const realizedVolAnnualPct = Math.sqrt(rets.reduce((s, r) => s + (r - mu) ** 2, 0) / (rets.length - 1)) * Math.sqrt(365) * 100;
  const high365 = Math.max(...dailyCloses.slice(-365));
  const drawdownFrom365dHighPct = (close / high365 - 1) * 100;
  const mayerMultiple = close / sma200;

  const state: BtcRegimeState = score >= 3 ? "RISK_ON" : score <= -2 ? "RISK_OFF" : "NEUTRAL";
  const volScale = Math.min(1, Math.max(minExposure, targetVol / Math.max(realizedVolAnnualPct, 1e-9)));
  const stateScale = state === "RISK_ON" ? 1 : state === "NEUTRAL" ? 0.5 : 0;
  const exposureMultiplier = Number((volScale * stateScale).toFixed(3));
  const capitulationWatch = drawdownFrom365dHighPct <= -35 && mayerMultiple < 0.8;
  if (capitulationWatch) reasons.push("CAPITULATION_WATCH");
  if (volScale < 1) reasons.push("HIGH_VOLATILITY_SIZE_REDUCED");

  return {
    state, score, close, sma50, sma200, sma140, mayerMultiple, sma200Rising,
    realizedVolAnnualPct, drawdownFrom365dHighPct, exposureMultiplier,
    allowTop100Rotation: state === "RISK_ON" || state === "NEUTRAL",
    allowSmallCapBets: state === "RISK_ON" && !capitulationWatch,
    capitulationWatch, reasons,
  };
}

export interface BreadthRow { symbol: string; change90dPct: number | null }

/** Share of a top-100 cohort outperforming BTC over 90 days (altcoin-season breadth, 0..1). */
export function rotationBreadth(rows: BreadthRow[], btcChange90dPct: number | null): { share: number | null; sample: number; phase: "BITCOIN_LED" | "MIXED" | "ALT_ROTATION" | "UNKNOWN" } {
  const valid = rows.filter((r) => r.symbol !== "BTC" && r.change90dPct != null && Number.isFinite(r.change90dPct));
  if (btcChange90dPct == null || !Number.isFinite(btcChange90dPct) || valid.length < 20) return { share: null, sample: valid.length, phase: "UNKNOWN" };
  const share = valid.filter((r) => r.change90dPct! > btcChange90dPct).length / valid.length;
  return { share, sample: valid.length, phase: share >= 0.75 ? "ALT_ROTATION" : share <= 0.25 ? "BITCOIN_LED" : "MIXED" };
}
