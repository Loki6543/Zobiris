import { describe, expect, it } from "vitest";
import { buildForecast, scoreForecasts, P_CAP } from "../strategyV2/btcForecast";

const series = (n: number, f: (i: number) => number) => Array.from({ length: n }, (_, i) => f(i));
describe("bitcoin forecast", () => {
  it("leans up in an uptrend, down in a downtrend, and never past the probability cap", () => {
    const up = series(260, (i) => 50000 * (1 + i * 0.004 + 0.01 * Math.sin(i)));
    const f = buildForecast({ closes: up, highs: up.map((x) => x * 1.01), lows: up.map((x) => x * 0.99), macro: null, fearGreed: 50, eventRisk: [] }, "2026-10-12")!;
    expect(f.horizons.every((h) => h.pUp > 0.5 && h.pUp <= 0.5 + P_CAP + 1e-9)).toBe(true);
    expect(f.components.find((c) => c.key === "macro")!.score).toBeNull();
    const dn = [...up].reverse();
    const g = buildForecast({ closes: dn, highs: dn.map((x) => x * 1.01), lows: dn.map((x) => x * 0.99), macro: { ndx5dPct: -3, dxy5dPct: 1, us10y5dBp: 15 }, fearGreed: 50, eventRisk: [] }, "2026-10-12")!;
    expect(g.horizons.every((h) => h.pUp < 0.5 && h.pUp >= 0.5 - P_CAP - 1e-9)).toBe(true);
    expect(g.horizons[2]!.high - g.horizons[2]!.low).toBeGreaterThan(g.horizons[0]!.high - g.horizons[0]!.low);
    expect(buildForecast({ closes: up.slice(0, 100), highs: [], lows: [], macro: null, fearGreed: null, eventRisk: [] }, "x")).toBeNull();
  });
  it("scores recorded forecasts against later closes", () => {
    const f = (day: string, p: number, close: number) => ({ day, close, horizons: [{ days: 1, pUp: p, low: close * 0.97, high: close * 1.03 }], components: [], dailyVolPct: 2, eventRisk: [] });
    const closes = new Map([["2026-01-02", 101], ["2026-01-03", 99]]);
    const s = scoreForecasts([f("2026-01-01", 0.6, 100), f("2026-01-02", 0.6, 101), f("2026-01-03", 0.6, 99)], closes)["1d"]!;
    expect(s.n).toBe(2);
    expect(s.hitRate).toBe(0.5);
    expect(s.brier).toBeCloseTo(((0.4) ** 2 + (0.6) ** 2) / 2, 6);
  });
});
