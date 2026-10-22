// Backtest Lab engine: honest long/flat research backtests on daily bars. Pure and deterministic; nothing here trades.
// Rules that keep it honest (the standard backtesting pitfalls):
//   Look-ahead   a signal at bar i uses bars 0..i only (tests truncate the series to prove it) and executes at the NEXT bar's open.
//   Costs        every entry and every exit pays COST_PER_SIDE: the average one-side BTC cost from costs.ts.
//   Overfitting  parameter grids are tiny; choices are made on a training window and scored on the test window after it (walk-forward).
//   Uncertainty  a Sharpe ratio is shown with its 95% interval, and a block-bootstrap Monte Carlo gives loss odds and drawdown spread.
//   No leverage  positions are 0 or 1 (flat or fully long); shorting and margin are not modelled.
import { btcCostPerSide } from "./costs";

export interface Bar { time: number; open: number; high: number; low: number; close: number }
export type Position = 0 | 1;
export type Params = Record<string, number>;

/** Average of Kraken's maker entry and taker exit cost for BTC (shared schedule), charged on each entry and each exit. */
export const COST_PER_SIDE = btcCostPerSide();
export const ANN = 365; // crypto trades every day
export const WARMUP = 200;

export interface Strategy {
  id: string; label: string; description: string;
  defaults: Params; grid: Params[];
  /** signal[i] is decided at the close of bar i from bars 0..i only. */
  signal(bars: Bar[], p: Params): Position[];
}

const mean = (x: number[]) => x.reduce((s, v) => s + v, 0) / x.length;
function smaAt(c: number[], i: number, n: number): number | null { return i >= n - 1 ? mean(c.slice(i - n + 1, i + 1)) : null; }
function emaArr(x: number[], n: number): number[] { const a = 2 / (n + 1), out = [x[0]!]; for (let i = 1; i < x.length; i++) out.push(out[i - 1]! + a * (x[i]! - out[i - 1]!)); return out; }

const above = (bars: Bar[], f: (c: number[], i: number) => number | null): Position[] => {
  const c = bars.map((b) => b.close);
  return c.map((v, i) => { const t = f(c, i); return t != null && v > t ? 1 : 0; });
};

function holdRule(bars: Bar[], enter: (i: number) => boolean | null, exit: (i: number) => boolean | null, warm: number): Position[] {
  const out: Position[] = new Array(bars.length).fill(0); let pos: Position = 0;
  for (let i = warm; i < bars.length; i++) { const e = enter(i), x = exit(i); if (e === null || x === null) { out[i] = pos; continue; } if (pos === 0 && e) pos = 1; else if (pos === 1 && x) pos = 0; out[i] = pos; }
  return out;
}

function superTrend(bars: Bar[], period: number, mult: number): Position[] {
  const n = bars.length, out: Position[] = new Array(n).fill(0);
  const tr = bars.map((b, i) => (i === 0 ? b.high - b.low : Math.max(b.high - b.low, Math.abs(b.high - bars[i - 1]!.close), Math.abs(b.low - bars[i - 1]!.close))));
  let ub = 0, lb = 0, dir = 0;
  for (let i = period; i < n; i++) {
    const atr = mean(tr.slice(i - period + 1, i + 1)), mid = (bars[i]!.high + bars[i]!.low) / 2, bu = mid + mult * atr, bl = mid - mult * atr, c = bars[i]!.close;
    if (i > period) { if (c > ub) dir = 1; else if (c < lb) dir = -1; }
    const prevC = bars[i - 1]!.close;
    ub = i === period || bu < ub || prevC > ub ? bu : ub;
    lb = i === period || bl > lb || prevC < lb ? bl : lb;
    out[i] = dir === 1 ? 1 : 0;
  }
  return out;
}

const rsiAt = (c: number[], i: number, p: number): number | null => {
  if (i < p) return null;
  let g = 0, l = 0; for (let j = i - p + 1; j <= i; j++) { const d = c[j]! - c[j - 1]!; if (d > 0) g += d; else l -= d; }
  return l === 0 ? 100 : 100 - 100 / (1 + g / l);
};
const bands = (c: number[], i: number, n: number) => { const m = smaAt(c, i, n); if (m == null) return null; const w = c.slice(i - n + 1, i + 1), s = Math.sqrt(mean(w.map((v) => (v - m) ** 2))); return { m, s }; };

export const STRATEGIES: Strategy[] = [
  { id: "sma_trend", label: "Price above N-day average", description: "Long while the close is above its N-day simple average, flat otherwise. The trend filter Zobiris's Bitcoin indicator research found most useful.",
    defaults: { n: 200 }, grid: [50, 100, 150, 200].map((n) => ({ n })), signal: (b, p) => above(b, (c, i) => smaAt(c, i, p.n!)) },
  { id: "sma_cross", label: "Fast average above slow average", description: "Long while the fast average is above the slow one (golden/death cross family).",
    defaults: { fast: 50, slow: 200 }, grid: [{ fast: 20, slow: 50 }, { fast: 50, slow: 200 }, { fast: 50, slow: 100 }],
    signal: (b, p) => { const c = b.map((x) => x.close); return c.map((_, i) => { const f = smaAt(c, i, p.fast!), s = smaAt(c, i, p.slow!); return f != null && s != null && f > s ? 1 : 0; }); } },
  { id: "donchian", label: "N-day breakout (channel)", description: "Buy a close above the N-day high, sell a close below the N/2-day low.",
    defaults: { n: 20 }, grid: [20, 55].map((n) => ({ n })),
    signal: (b, p) => { const n = p.n!, h = Math.max(2, Math.floor(n / 2));
      return holdRule(b, (i) => (i < n ? null : b[i]!.close > Math.max(...b.slice(i - n, i).map((x) => x.high))), (i) => (i < h ? null : b[i]!.close < Math.min(...b.slice(i - h, i).map((x) => x.low))), n); } },
  { id: "supertrend", label: "SuperTrend (10, multiplier)", description: "ATR-band trend follower: long while price stays above the lower band.",
    defaults: { mult: 3 }, grid: [2, 3, 4].map((mult) => ({ mult })), signal: (b, p) => superTrend(b, 10, p.mult!) },
  { id: "bollinger_breakout", label: "Bollinger breakout", description: "Buy a close above the upper 20-day band (2σ), sell below the middle band.",
    defaults: { k: 2 }, grid: [{ k: 2 }],
    signal: (b, p) => { const c = b.map((x) => x.close); return holdRule(b, (i) => { const x = bands(c, i, 20); return x ? c[i]! > x.m + p.k! * x.s : null; }, (i) => { const x = bands(c, i, 20); return x ? c[i]! < x.m : null; }, 20); } },
  { id: "bollinger_revert", label: "Bollinger mean reversion", description: "Buy a close below the lower 20-day band (2σ), sell above the middle band.",
    defaults: { k: 2 }, grid: [{ k: 2 }],
    signal: (b, p) => { const c = b.map((x) => x.close); return holdRule(b, (i) => { const x = bands(c, i, 20); return x ? c[i]! < x.m - p.k! * x.s : null; }, (i) => { const x = bands(c, i, 20); return x ? c[i]! > x.m : null; }, 20); } },
  { id: "rsi", label: "RSI above 50", description: "Long while 14-day RSI is above 50 (momentum regime).",
    defaults: { p: 14 }, grid: [{ p: 14 }], signal: (b, p) => { const c = b.map((x) => x.close); return c.map((_, i) => { const r = rsiAt(c, i, p.p!); return r != null && r > 50 ? 1 : 0; }); } },
  { id: "macd", label: "MACD above signal", description: "Long while the 12/26 MACD line is above its 9-day signal line.",
    defaults: {}, grid: [{}], signal: (b) => { const c = b.map((x) => x.close), m = emaArr(c, 12).map((v, i) => v - emaArr(c, 26)[i]!), s = emaArr(m, 9); return c.map((_, i) => (i > 35 && m[i]! > s[i]! ? 1 : 0)); } },
];

/** Daily returns for bars from..to (inclusive). Position decided at the close of bar j-1 is held during bar j; trades fill at bar j's open.
 *  The window starts flat, so a position carried in from before the window still pays its entry. */
export function simulate(bars: Bar[], pos: Position[], from: number, to: number, cost = COST_PER_SIDE): { returns: number[]; held: Position[] } {
  const returns: number[] = [], held: Position[] = [];
  for (let j = from; j <= to; j++) {
    const h = (j >= 1 ? pos[j - 1]! : 0) as Position, hp = (j === from ? 0 : j >= 2 ? pos[j - 2]! : 0) as Position, b = bars[j]!, pc = bars[j - 1]?.close ?? b.open;
    let r = 0;
    if (h === 1 && hp === 1) r = b.close / pc - 1;
    else if (h === 1 && hp === 0) r = b.close / b.open - 1 - cost;
    else if (h === 0 && hp === 1) r = b.open / pc - 1 - cost;
    returns.push(r); held.push(h);
  }
  return { returns, held };
}

export interface Metrics { totalReturnPct: number; cagrPct: number; annVolPct: number; sharpe: number; sharpeCi95: number; sortino: number; maxDrawdownPct: number; calmar: number; exposurePct: number; trades: number; winDaysPct: number; days: number }
const round = (x: number, d = 2) => (Number.isFinite(x) ? Math.round(x * 10 ** d) / 10 ** d : 0);

export function metrics(returns: number[], held: Position[]): Metrics {
  const n = returns.length;
  if (!n) return { totalReturnPct: 0, cagrPct: 0, annVolPct: 0, sharpe: 0, sharpeCi95: 0, sortino: 0, maxDrawdownPct: 0, calmar: 0, exposurePct: 0, trades: 0, winDaysPct: 0, days: 0 };
  let eq = 1, peak = 1, mdd = 0;
  for (const r of returns) { eq *= 1 + r; peak = Math.max(peak, eq); mdd = Math.min(mdd, eq / peak - 1); }
  const m = mean(returns), sd = Math.sqrt(mean(returns.map((r) => (r - m) ** 2))), down = Math.sqrt(mean(returns.map((r) => Math.min(0, r) ** 2)));
  const daily = sd > 0 ? m / sd : 0, sharpe = daily * Math.sqrt(ANN);
  const cagr = eq > 0 ? eq ** (ANN / n) - 1 : -1;
  let trades = 0; for (let i = 0; i < held.length; i++) if (held[i] === 1 && (i === 0 || held[i - 1] === 0)) trades++;
  const active = returns.filter((r) => r !== 0);
  return { totalReturnPct: round((eq - 1) * 100, 1), cagrPct: round(cagr * 100, 1), annVolPct: round(sd * Math.sqrt(ANN) * 100, 1), sharpe: round(sharpe),
    // standard error of a Sharpe ratio (Lo 2002), annualised: wide intervals mean "not distinguishable from zero".
    sharpeCi95: round(1.96 * Math.sqrt((1 + 0.5 * daily * daily) / n) * Math.sqrt(ANN)), sortino: round(down > 0 ? (m / down) * Math.sqrt(ANN) : 0),
    maxDrawdownPct: round(mdd * 100, 1), calmar: round(mdd < 0 ? cagr / Math.abs(mdd) : 0), exposurePct: round((held.filter((h) => h === 1).length / n) * 100, 0), trades,
    winDaysPct: round(active.length ? (active.filter((r) => r > 0).length / active.length) * 100 : 0, 0), days: n };
}

export function buyAndHold(bars: Bar[], from: number, to: number): { returns: number[]; held: Position[] } {
  const returns: number[] = [], held: Position[] = [];
  for (let j = from; j <= to; j++) { const pc = bars[j - 1]?.close ?? bars[j]!.open; returns.push(j === from ? bars[j]!.close / bars[j]!.open - 1 - COST_PER_SIDE : bars[j]!.close / pc - 1); held.push(1); }
  return { returns, held };
}

export interface Split { trainFrom: string; trainTo: string; testFrom: string; testTo: string; params: Params; trainSharpe: number; testReturnPct: number; testSharpe: number; testDays: number }
export interface WalkForward { splits: Split[]; returns: number[]; held: Position[]; from: number; to: number; distinctParams: number }
const day = (b: Bar) => new Date(b.time * 1000).toISOString().slice(0, 10);

/** Rolling walk-forward: choose parameters on `train` bars by Sharpe, apply them unchanged to the next `test` bars, then roll forward by `test`. */
export function walkForward(bars: Bar[], s: Strategy, opts: { train: number; test: number; minTest?: number; warmup?: number } = { train: 180, test: 60 }): WalkForward {
  const warm = opts.warmup ?? WARMUP, minTest = opts.minTest ?? 30;
  const signals = s.grid.map((p) => ({ p, sig: s.signal(bars, p) })); // causal: computed once on the full series
  const splits: Split[] = [], returns: number[] = [], held: Position[] = [];
  let from = -1, to = -1;
  for (let start = warm; ; start += opts.test) {
    const trainEnd = start + opts.train - 1, testStart = trainEnd + 1, testEnd = Math.min(testStart + opts.test - 1, bars.length - 1);
    if (testEnd - testStart + 1 < minTest) break;
    let best = signals[0]!, bestSharpe = -Infinity;
    for (const g of signals) { const t = simulate(bars, g.sig, start, trainEnd), m = metrics(t.returns, t.held); if (m.sharpe > bestSharpe) { bestSharpe = m.sharpe; best = g; } }
    const test = simulate(bars, best.sig, testStart, testEnd), tm = metrics(test.returns, test.held);
    splits.push({ trainFrom: day(bars[start]!), trainTo: day(bars[trainEnd]!), testFrom: day(bars[testStart]!), testTo: day(bars[testEnd]!), params: best.p, trainSharpe: bestSharpe, testReturnPct: tm.totalReturnPct, testSharpe: tm.sharpe, testDays: tm.days });
    returns.push(...test.returns); held.push(...test.held);
    if (from < 0) from = testStart; to = testEnd;
    if (testEnd >= bars.length - 1) break;
  }
  return { splits, returns, held, from, to, distinctParams: new Set(splits.map((x) => JSON.stringify(x.params))).size };
}

// ---- Monte Carlo (stationary block bootstrap, seeded so results are stable between refreshes) ----
export function mulberry32(seed: number) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const pctile = (sorted: number[], p: number) => sorted[Math.min(sorted.length - 1, Math.max(0, Math.floor(p * (sorted.length - 1))))]!;

/** Resample `length` days from `returns` in blocks (mean block length `block`) so volatility clustering survives, unlike a plain shuffle. */
export function bootstrapPath(returns: number[], length: number, block: number, rand: () => number): number[] {
  const out: number[] = []; let i = Math.floor(rand() * returns.length);
  while (out.length < length) { out.push(returns[i]!); i = rand() < 1 / block ? Math.floor(rand() * returns.length) : (i + 1) % returns.length; }
  return out;
}
export interface MonteCarlo { sims: number; horizons: Array<{ days: number; probLossPct: number; medianPct: number; p5Pct: number; p95Pct: number }>; maxDrawdown: { medianPct: number; worst5Pct: number } }
export function monteCarlo(returns: number[], opts: { sims?: number; block?: number; horizons?: number[]; seed?: number } = {}): MonteCarlo | null {
  if (returns.length < 60) return null;
  const sims = opts.sims ?? 1000, block = opts.block ?? 10, horizons = opts.horizons ?? [30, 90, 180, 365], rand = mulberry32(opts.seed ?? 1337);
  const end: Record<number, number[]> = Object.fromEntries(horizons.map((h) => [h, []])), dds: number[] = [];
  const longest = Math.max(...horizons);
  for (let s = 0; s < sims; s++) {
    const path = bootstrapPath(returns, longest, block, rand); let eq = 1, peak = 1, mdd = 0;
    for (let d = 0; d < longest; d++) { eq *= 1 + path[d]!; peak = Math.max(peak, eq); mdd = Math.min(mdd, eq / peak - 1); if (end[d + 1]) end[d + 1]!.push(eq - 1); }
    dds.push(mdd);
  }
  dds.sort((a, b) => a - b);
  return { sims, horizons: horizons.map((h) => { const e = [...end[h]!].sort((a, b) => a - b); return { days: h, probLossPct: round((e.filter((x) => x < 0).length / e.length) * 100, 0), medianPct: round(pctile(e, 0.5) * 100, 1), p5Pct: round(pctile(e, 0.05) * 100, 1), p95Pct: round(pctile(e, 0.95) * 100, 1) }; }),
    maxDrawdown: { medianPct: round(pctile(dds, 0.5) * 100, 1), worst5Pct: round(pctile(dds, 0.05) * 100, 1) } };
}

export type Verdict = "BEATS_HOLD" | "RISK_REDUCER" | "UNPROVEN" | "LOSES";
export interface StrategyResult {
  id: string; label: string; description: string; defaults: Params; trials: number;
  inSample: Metrics; oos: Metrics; splits: Split[]; distinctParams: number; mc: MonteCarlo | null; verdict: Verdict; equity: number[];
}
export interface BacktestReport {
  asOf: string; bars: number; from: string; to: string; oosFrom: string; oosTo: string; costPerSidePct: number; trials: number; warmupDays: number; trainDays: number; testDays: number;
  hold: { inSample: Metrics; oos: Metrics }; oosDates: string[]; holdEquity: number[]; strategies: StrategyResult[];
}

const curve = (r: number[], keep = 90): number[] => { let eq = 1; const all = r.map((x) => (eq *= 1 + x)); const step = Math.max(1, Math.ceil(all.length / keep)); return all.filter((_, i) => i % step === 0 || i === all.length - 1).map((x) => round(x, 3)); };

/** Verdict from out-of-sample numbers only: beating buy & hold needs more return AND a Sharpe whose 95% interval stays above zero. */
export function verdictOf(oos: Metrics, hold: Metrics): Verdict {
  if (oos.totalReturnPct > hold.totalReturnPct && oos.sharpe - oos.sharpeCi95 > 0) return "BEATS_HOLD";
  if (oos.totalReturnPct < 0 && oos.totalReturnPct < hold.totalReturnPct) return "LOSES";
  if (oos.maxDrawdownPct > hold.maxDrawdownPct * 0.75 && oos.totalReturnPct < hold.totalReturnPct) return "RISK_REDUCER"; // drawdown at most 75% of buy & hold's (both negative)
  return "UNPROVEN";
}

export function runBacktestLab(bars: Bar[], asOf: string, opts: { train?: number; test?: number } = {}): BacktestReport | null {
  const train = opts.train ?? 180, test = opts.test ?? 60;
  if (bars.length < WARMUP + train + 30 + 2) return null;
  const wfs = STRATEGIES.map((s) => ({ s, wf: walkForward(bars, s, { train, test }) }));
  const ref = wfs[0]!.wf;
  if (!ref.splits.length) return null;
  const hold = { inSample: buyAndHold(bars, WARMUP, bars.length - 1), oos: buyAndHold(bars, ref.from, ref.to) };
  const holdIn = metrics(hold.inSample.returns, hold.inSample.held), holdOos = metrics(hold.oos.returns, hold.oos.held);
  const strategies: StrategyResult[] = wfs.map(({ s, wf }) => {
    const full = simulate(bars, s.signal(bars, s.defaults), WARMUP, bars.length - 1), oos = metrics(wf.returns, wf.held);
    return { id: s.id, label: s.label, description: s.description, defaults: s.defaults, trials: s.grid.length, inSample: metrics(full.returns, full.held), oos, splits: wf.splits, distinctParams: wf.distinctParams,
      mc: monteCarlo(wf.returns), verdict: verdictOf(oos, holdOos), equity: curve(wf.returns) };
  });
  const all = Array.from({ length: ref.to - ref.from + 1 }, (_, k) => day(bars[ref.from + k]!));
  const step = Math.max(1, Math.ceil(all.length / 90));
  return { asOf, bars: bars.length, from: day(bars[0]!), to: day(bars.at(-1)!), oosFrom: day(bars[ref.from]!), oosTo: day(bars[ref.to]!), costPerSidePct: COST_PER_SIDE * 100,
    trials: STRATEGIES.reduce((a, s) => a + s.grid.length, 0), warmupDays: WARMUP, trainDays: train, testDays: test, hold: { inSample: holdIn, oos: holdOos },
    oosDates: all.filter((_, i) => i % step === 0 || i === all.length - 1), holdEquity: curve(hold.oos.returns), strategies };
}
