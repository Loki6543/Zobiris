// Tail-aware risk metrics from daily closes (Kraken). All functions return null when history is too short.
//   realized volatility (annualised), CVaR 95% (average of the worst 5% daily returns), Sortino ratio,
//   beta to BTC, max drawdown, and payoff asymmetry (upside to half-recovering the ATH gap vs losing the stake).

const logRets = (closes: number[]) => closes.slice(1).map((c, i) => Math.log(c / closes[i]!)).filter(Number.isFinite);
const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;

export function realizedVolPct(closes: number[], days = 30): number | null {
  const r = logRets(closes.slice(-(days + 1)));
  if (r.length < Math.min(20, days)) return null;
  const m = mean(r);
  return Math.sqrt(r.reduce((s, x) => s + (x - m) ** 2, 0) / (r.length - 1)) * Math.sqrt(365) * 100;
}

/** Expected shortfall: mean of the worst 5% daily simple returns over the window, as a negative percent. */
export function cvar95Pct(closes: number[], days = 180): number | null {
  const w = closes.slice(-(days + 1));
  const rr = w.slice(1).map((c, i) => c / w[i]! - 1).filter(Number.isFinite);
  if (rr.length < 60) return null;
  const sorted = [...rr].sort((a, b) => a - b);
  const k = Math.max(1, Math.floor(sorted.length * 0.05));
  return mean(sorted.slice(0, k)) * 100;
}

export function sortino(closes: number[], days = 180): number | null {
  const r = logRets(closes.slice(-(days + 1)));
  if (r.length < 60) return null;
  const down = r.filter((x) => x < 0);
  if (!down.length) return null;
  const dd = Math.sqrt(down.reduce((s, x) => s + x * x, 0) / r.length);
  return dd > 0 ? (mean(r) / dd) * Math.sqrt(365) : null;
}

/** Beta of daily log returns to BTC over the last `days`, both series aligned on their most recent closes. */
export function betaToBtc(closes: number[], btcCloses: number[], days = 90): number | null {
  const n = Math.min(days, closes.length - 1, btcCloses.length - 1);
  if (n < 40) return null;
  const a = logRets(closes.slice(-(n + 1))), b = logRets(btcCloses.slice(-(n + 1)));
  const len = Math.min(a.length, b.length);
  const x = a.slice(-len), y = b.slice(-len);
  const mx = mean(x), my = mean(y);
  let cov = 0, vy = 0;
  for (let i = 0; i < len; i++) { cov += (x[i]! - mx) * (y[i]! - my); vy += (y[i]! - my) ** 2; }
  return vy > 0 ? cov / vy : null;
}

export function maxDrawdownPct(closes: number[], days = 90): number | null {
  const c = closes.slice(-days);
  if (c.length < 20) return null;
  let peak = c[0]!, worst = 0;
  for (const p of c) { peak = Math.max(peak, p); worst = Math.min(worst, p / peak - 1); }
  return worst * 100;
}

/**
 * Convex payoff estimate: return if the coin recovers half of its gap to the all-time high, against a worst case of
 * losing the whole stake. A coin 80% below its ATH has +200% to the half-way point; 20% below has +12.5%.
 */
export function halfRecoveryUpsidePct(athChangePct: number | null): number | null {
  if (athChangePct == null || !Number.isFinite(athChangePct) || athChangePct >= 0 || athChangePct <= -99.99) return null;
  const fromAth = 1 + athChangePct / 100; // price / ATH
  const halfway = fromAth + (1 - fromAth) / 2;
  return (halfway / fromAth - 1) * 100;
}

export interface RiskProfile { volPct: number | null; cvar95Pct: number | null; sortino: number | null; betaBtc: number | null; maxDd90Pct: number | null }
export function riskProfile(closes: number[] | null, btcCloses: number[]): RiskProfile | null {
  if (!closes || closes.length < 31) return null;
  return { volPct: realizedVolPct(closes), cvar95Pct: cvar95Pct(closes), sortino: sortino(closes), betaBtc: betaToBtc(closes, btcCloses), maxDd90Pct: maxDrawdownPct(closes) };
}
