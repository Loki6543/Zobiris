import { describe, expect, it } from "vitest";
import { COST_PER_SIDE, STRATEGIES, WARMUP, bootstrapPath, buyAndHold, metrics, monteCarlo, mulberry32, runBacktestLab, simulate, verdictOf, walkForward, type Bar, type Position } from "../strategyV2/backtest";

// Deterministic synthetic market: regime-switching drift with noise and a day-of-week wobble, 700 daily bars.
function market(n = 700, seed = 7): Bar[] {
  const rand = mulberry32(seed); let close = 30000;
  return Array.from({ length: n }, (_, i) => {
    const drift = Math.sin(i / 90) * 0.003, open = close, ret = drift + (rand() - 0.5) * 0.05; close = open * (1 + ret) * (1 + (rand() - 0.5) * 0.004);
    const hi = Math.max(open, close) * (1 + rand() * 0.015), lo = Math.min(open, close) * (1 - rand() * 0.015);
    return { time: 1_700_000_000 + i * 86_400, open, high: hi, low: lo, close };
  });
}
const bars = market();

describe("backtest engine: no look-ahead", () => {
  it("every strategy's signal at bar i is unchanged when all later bars are removed", () => {
    for (const s of STRATEGIES) for (const p of s.grid) {
      const full = s.signal(bars, p);
      for (const i of [WARMUP, 260, 333, 480, 612]) {
        const cut = s.signal(bars.slice(0, i + 1), p);
        expect(cut[i], `${s.id} ${JSON.stringify(p)} @${i}`).toBe(full[i]);
      }
    }
  });
  it("trades fill at the next open: a signal that flips on bar i earns nothing on bar i itself", () => {
    const flat = Array.from({ length: 6 }, (_, i): Bar => ({ time: i, open: 100, high: 101, low: 99, close: 100 }));
    flat[3] = { time: 3, open: 100, high: 130, low: 99, close: 120 }; // big up bar the strategy cannot have seen
    const pos: Position[] = [0, 0, 0, 1, 1, 1]; // signal turns on at the close of bar 3
    const r = simulate(flat, pos, 1, 5, 0).returns;
    expect(r[2]).toBe(0); // bar 3 (+20%) is not earned: the position only exists from bar 4
    expect(r[3]).toBeCloseTo(flat[4]!.close / flat[4]!.open - 1, 12); // it enters at bar 4's open, so only bar 4's own move counts
  });
});

describe("backtest engine: costs and metrics", () => {
  it("charges the per-side cost on every entry and every exit, and nothing while holding", () => {
    const b: Bar[] = Array.from({ length: 8 }, (_, i) => ({ time: i, open: 100, high: 100, low: 100, close: 100 }));
    const pos: Position[] = [0, 1, 1, 0, 0, 0, 0, 0];
    const r = simulate(b, pos, 1, 7).returns;
    expect(r.filter((x) => x !== 0)).toEqual([-COST_PER_SIDE, -COST_PER_SIDE]); // entry on bar 2, exit on bar 4; flat prices so only costs remain
    expect(r[1]).toBe(-COST_PER_SIDE);
  });
  it("starts every window flat so a carried-in position pays its entry again", () => {
    const b: Bar[] = Array.from({ length: 6 }, (_, i) => ({ time: i, open: 100, high: 100, low: 100, close: 100 }));
    const r = simulate(b, [1, 1, 1, 1, 1, 1], 3, 5).returns;
    expect(r[0]).toBeCloseTo(-COST_PER_SIDE, 12);
    expect(r[1]).toBe(0);
  });
  it("computes drawdown, exposure, trades and a Sharpe interval that narrows with more data", () => {
    const rets = [0.1, -0.2, 0.05, 0.05, 0.0, 0.1], held: Position[] = [1, 1, 1, 1, 0, 1];
    const m = metrics(rets, held);
    expect(m.maxDrawdownPct).toBeCloseTo(-20, 5);
    expect(m.trades).toBe(2);
    expect(m.exposurePct).toBe(83);
    const long = Array.from({ length: 400 }, (_, i) => (i % 2 ? 0.01 : -0.004));
    expect(metrics(long, long.map(() => 1)).sharpeCi95).toBeLessThan(metrics(long.slice(0, 40), long.slice(0, 40).map(() => 1)).sharpeCi95);
    expect(metrics([], []).days).toBe(0);
  });
  it("buy & hold pays one entry cost and then tracks the close", () => {
    const h = buyAndHold(bars, 300, 310).returns;
    expect(h[0]).toBeCloseTo(bars[300]!.close / bars[300]!.open - 1 - COST_PER_SIDE, 12);
    expect(h[1]).toBeCloseTo(bars[301]!.close / bars[300]!.close - 1, 12);
  });
});

describe("walk-forward", () => {
  it("scores each test window only after its training window and never overlaps them", () => {
    const wf = walkForward(bars, STRATEGIES[0]!, { train: 180, test: 60 });
    expect(wf.splits.length).toBeGreaterThanOrEqual(4);
    for (const s of wf.splits) { expect(s.trainTo < s.testFrom).toBe(true); expect(s.testFrom <= s.testTo).toBe(true); }
    for (let k = 1; k < wf.splits.length; k++) expect(wf.splits[k]!.testFrom > wf.splits[k - 1]!.testTo).toBe(true);
    expect(wf.returns.length).toBe(wf.splits.reduce((a, s) => a + s.testDays, 0));
    expect(wf.from).toBeGreaterThanOrEqual(WARMUP + 180);
  });
  it("picks parameters from the training window only: changing test-window bars cannot change the chosen params", () => {
    const wf = walkForward(bars, STRATEGIES[0]!, { train: 180, test: 60 });
    const edited = bars.map((b, i) => (i >= wf.from + 5 && i < wf.from + 60 ? { ...b, close: b.close * 1.4, open: b.open * 1.4, high: b.high * 1.4, low: b.low * 1.4 } : b));
    const wf2 = walkForward(edited, STRATEGIES[0]!, { train: 180, test: 60 });
    expect(wf2.splits[0]!.params).toEqual(wf.splits[0]!.params);
    expect(wf2.splits[0]!.trainSharpe).toBe(wf.splits[0]!.trainSharpe);
  });
});

describe("monte carlo", () => {
  const r = Array.from({ length: 300 }, (_, i) => (i % 3 === 0 ? -0.01 : 0.008));
  it("is deterministic for a seed and reports ordered percentiles", () => {
    const a = monteCarlo(r)!, b = monteCarlo(r)!;
    expect(a).toEqual(b);
    for (const h of a.horizons) { expect(h.p5Pct).toBeLessThanOrEqual(h.medianPct); expect(h.medianPct).toBeLessThanOrEqual(h.p95Pct); }
    expect(a.maxDrawdown.worst5Pct).toBeLessThanOrEqual(a.maxDrawdown.medianPct);
    expect(monteCarlo(r.slice(0, 30))).toBeNull();
  });
  it("block bootstrap keeps runs together (neighbours are sampled consecutively far more often than in a shuffle)", () => {
    const seq = Array.from({ length: 200 }, (_, i) => i), rand = mulberry32(3);
    const path = bootstrapPath(seq, 2000, 10, rand);
    const consecutive = path.slice(1).filter((v, k) => v === (path[k]! + 1) % 200).length / 1999;
    expect(consecutive).toBeGreaterThan(0.8); // block length 10 → ~90% of steps continue the run; an iid shuffle would give ~0.5%
  });
});

describe("full lab", () => {
  it("returns every strategy with in-sample and out-of-sample figures, equal-length curves and honest verdicts", () => {
    const rep = runBacktestLab(bars, "2026-10-12")!;
    expect(rep.strategies.map((s) => s.id)).toEqual(STRATEGIES.map((s) => s.id));
    expect(rep.trials).toBe(STRATEGIES.reduce((a, s) => a + s.grid.length, 0));
    for (const s of rep.strategies) { expect(s.equity.length).toBe(rep.oosDates.length); expect(["BEATS_HOLD", "RISK_REDUCER", "UNPROVEN", "LOSES"]).toContain(s.verdict); }
    expect(rep.holdEquity.length).toBe(rep.oosDates.length);
    expect(runBacktestLab(bars.slice(0, 300), "x")).toBeNull();
  });
  it("only calls BEATS_HOLD when the out-of-sample Sharpe interval stays above zero", () => {
    const hold = { ...metrics([0.001, 0.001, -0.001], [1, 1, 1]), totalReturnPct: 10, maxDrawdownPct: -30 };
    const m = (over: object) => ({ ...hold, totalReturnPct: 20, sharpe: 2, sharpeCi95: 1, maxDrawdownPct: -10, ...over });
    expect(verdictOf(m({}), hold)).toBe("BEATS_HOLD");
    expect(verdictOf(m({ sharpeCi95: 2.5 }), hold)).toBe("UNPROVEN"); // more return but not distinguishable from luck
    expect(verdictOf(m({ totalReturnPct: 4, sharpe: 0.3, sharpeCi95: 1 }), hold)).toBe("RISK_REDUCER");
    expect(verdictOf(m({ totalReturnPct: -12, sharpe: -1 }), hold)).toBe("LOSES");
  });
});
