// Bitcoin daily forecast, built from the research report "Bitcoin indicators and drivers".
// Probability that BTC closes higher in 1, 3 and 7 days, plus a 68% price range. Inputs and starting weights:
//   200-day trend 30% · short trend (20/50-day, 20-day high/low) 20% · macro (Nasdaq-100, dollar, 10y yield) 15%
//   · liquidations (long vs short, recorded hypothesis, 0% until it earns weight) · Fear & Greed extremes 5%
//   Weights of inputs with no data are dropped (renormalised). Fed/CPI, war and bank headlines carry 0 weight:
//   they widen the range, not the direction. Probability is capped at 35-65% until 200 scored days support more.
// Every forecast is recorded daily and scored against what actually happened (hit rate, Brier score, baselines).

export const HORIZONS = [1, 3, 7] as const;
export const P_CAP = 0.15; // |p - 0.5| <= 0.15 until the live record says otherwise
const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));
const sma = (x: number[], n: number) => (x.length >= n ? x.slice(-n).reduce((s, v) => s + v, 0) / n : null);

export interface Macro { ndx5dPct: number | null; dxy5dPct: number | null; us10y5dBp: number | null }
export interface ForecastInput { closes: number[]; highs: number[]; lows: number[]; macro: Macro | null; fearGreed: number | null; eventRisk: string[] }
export interface Component { key: string; label: string; weight: number; score: number | null; detail: string }
export interface Forecast {
  day: string; close: number;
  horizons: Array<{ days: number; pUp: number; low: number; high: number }>;
  components: Component[]; dailyVolPct: number; eventRisk: string[];
}

export function buildForecast(i: ForecastInput, day: string): Forecast | null {
  const c = i.closes, n = c.length;
  if (n < 210) return null;
  const close = c[n - 1]!;
  const s200 = sma(c, 200)!, s50 = sma(c, 50)!, s20 = sma(c, 20)!;
  const hi20 = Math.max(...i.highs.slice(-21, -1)), lo20 = Math.min(...i.lows.slice(-21, -1));
  const rets = c.slice(-31).slice(1).map((v, k) => Math.log(v / c[n - 31 + k]!));
  const m = rets.reduce((s, v) => s + v, 0) / rets.length;
  const vol = Math.sqrt(rets.reduce((s, v) => s + (v - m) ** 2, 0) / (rets.length - 1));
  const comps: Component[] = [];
  // 200-day trend: sign plus distance, saturating at +-20%
  const d200 = close / s200 - 1;
  comps.push({ key: "trend200", label: "200-day trend", weight: 0.3, score: clamp(d200 / 0.2, -1, 1), detail: `${(d200 * 100).toFixed(1)}% vs 200-day average` });
  const st = (close > s20 ? 0.35 : -0.35) + (s20 > s50 ? 0.35 : -0.35) + (close > hi20 ? 0.3 : close < lo20 ? -0.3 : 0);
  comps.push({ key: "trendShort", label: "Short trend (20/50-day, 20-day channel)", weight: 0.2, score: clamp(st, -1, 1), detail: `${close > s20 ? "above" : "below"} 20-day, 20d ${s20 > s50 ? "above" : "below"} 50d${close > hi20 ? ", new 20-day high" : close < lo20 ? ", new 20-day low" : ""}` });
  const mac = i.macro;
  if (mac && (mac.ndx5dPct != null || mac.dxy5dPct != null || mac.us10y5dBp != null)) {
    const parts = [mac.ndx5dPct != null ? clamp(mac.ndx5dPct / 4, -1, 1) : null, mac.dxy5dPct != null ? clamp(-mac.dxy5dPct / 1.5, -1, 1) : null, mac.us10y5dBp != null ? clamp(-mac.us10y5dBp / 20, -1, 1) : null].filter((x): x is number => x != null);
    comps.push({ key: "macro", label: "Macro (Nasdaq-100, dollar, 10-year yield, 5 days)", weight: 0.15, score: parts.reduce((s, v) => s + v, 0) / parts.length,
      detail: `Nasdaq ${mac.ndx5dPct?.toFixed(1) ?? "—"}% · dollar ${mac.dxy5dPct?.toFixed(1) ?? "—"}% · 10y ${mac.us10y5dBp?.toFixed(0) ?? "—"}bp` });
  } else comps.push({ key: "macro", label: "Macro (Nasdaq-100, dollar, 10-year yield)", weight: 0.15, score: null, detail: "unavailable" });
  const fg = i.fearGreed;
  comps.push({ key: "sentiment", label: "Fear & Greed extremes (contrarian)", weight: 0.05, score: fg == null ? null : fg <= 15 ? 0.6 : fg >= 85 ? -0.6 : 0, detail: fg == null ? "unavailable" : `${fg}` });
  const live = comps.filter((x) => x.score != null);
  const wsum = live.reduce((s, x) => s + x.weight, 0) || 1;
  const signal = live.reduce((s, x) => s + x.weight * x.score!, 0) / wsum; // -1..1
  const widen = i.eventRisk.length ? 1.25 : 1;
  const horizons = HORIZONS.map((h) => {
    const pUp = 0.5 + clamp(signal * 0.2 * Math.sqrt(h / 3), -P_CAP, P_CAP);
    const sd = vol * Math.sqrt(h) * widen, drift = signal * vol * 0.15 * h;
    return { days: h, pUp: Math.round(pUp * 1000) / 1000, low: Math.round(close * Math.exp(drift - sd)), high: Math.round(close * Math.exp(drift + sd)) };
  });
  return { day, close, horizons, components: comps, dailyVolPct: Math.round(vol * 10000) / 100, eventRisk: i.eventRisk };
}

export interface ScoreStats { days: number; n: number; hitRate: number | null; brier: number | null; brierCoinFlip: number; brierBaseRate: number | null; baseRateUp: number | null; inRangePct: number | null; hitCi95: number | null; recent: Array<{ day: string; pUp: number; up: boolean; close: number; exit: number }> }

/** Score recorded forecasts against daily closes by UTC day (only forecasts whose horizon has passed). */
export function scoreForecasts(recorded: Forecast[], closeByDay: Map<string, number>): Record<string, ScoreStats> {
  const add = (day: string, n: number) => new Date(Date.parse(day + "T00:00:00Z") + n * 86_400_000).toISOString().slice(0, 10);
  const out: Record<string, ScoreStats> = {};
  for (const h of HORIZONS) {
    const rows: Array<{ day: string; p: number; up: boolean; inR: boolean; close: number; exit: number }> = [];
    for (const f of recorded) {
      const fh = f.horizons.find((x) => x.days === h); const exit = closeByDay.get(add(f.day, h));
      if (!fh || exit == null) continue;
      rows.push({ day: f.day, p: fh.pUp, up: exit > f.close, inR: exit >= fh.low && exit <= fh.high, close: f.close, exit });
    }
    const k = rows.length, ups = rows.filter((r) => r.up).length;
    const base = k ? ups / k : null;
    out[`${h}d`] = {
      days: h, n: k,
      hitRate: k ? rows.filter((r) => (r.p >= 0.5) === r.up).length / k : null,
      brier: k ? rows.reduce((s, r) => s + (r.p - (r.up ? 1 : 0)) ** 2, 0) / k : null,
      brierCoinFlip: 0.25, brierBaseRate: base == null ? null : base * (1 - base),
      baseRateUp: base, inRangePct: k ? rows.filter((r) => r.inR).length / k : null,
      hitCi95: k ? 1.96 * Math.sqrt(0.25 / k) : null,
      recent: rows.slice(-10).reverse().map((r) => ({ day: r.day, pUp: r.p, up: r.up, close: r.close, exit: r.exit })),
    };
  }
  return out;
}
