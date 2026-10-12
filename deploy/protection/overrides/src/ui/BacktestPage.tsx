// Backtest Lab: long/flat rules tested on Kraken BTC daily bars with the usual backtesting pitfalls guarded.
// Shows out-of-sample (walk-forward) results next to the optimistic in-sample ones, with Sharpe intervals and Monte Carlo odds.
// Research only: nothing here is a signal and nothing places orders.
import { useMemo, useState } from "react";
import "./backtest.css";
import { useApi } from "./charts";
import type { BacktestReport, Metrics, StrategyResult, Verdict } from "../strategyV2/backtest";

const COLORS = ["#22d3ee", "#a78bfa", "#fbbf24", "#34d399", "#f472b6", "#60a5fa", "#fb923c", "#c084fc"];
const VERDICT: Record<Verdict, { label: string; tip: string }> = {
  BEATS_HOLD: { label: "Beats buy & hold", tip: "More return than holding, with a Sharpe whose 95% interval stays above zero." },
  RISK_REDUCER: { label: "Cuts drawdown", tip: "Earned less than holding but with a much shallower worst drop." },
  UNPROVEN: { label: "Unproven", tip: "The result cannot be told apart from luck on this much history." },
  LOSES: { label: "Loses", tip: "Lost money out-of-sample and did worse than holding." },
};
const pct = (n: number, d = 1) => `${n > 0 ? "+" : ""}${n.toFixed(d)}%`;
const tone = (n: number) => (n > 0 ? "is-gain" : n < 0 ? "is-loss" : "");
const paramText = (p: Record<string, number>) => Object.entries(p).map(([k, v]) => `${k}=${v}`).join(", ") || "none";

function EquityChart({ dates, series }: { dates: string[]; series: Array<{ key: string; label: string; color: string; values: number[] }> }) {
  const W = 480, H = 210, padL = 36, padB = 20;
  const all = series.flatMap((s) => s.values);
  const lo = Math.min(1, ...all), hi = Math.max(1, ...all), span = hi - lo || 1;
  const x = (i: number) => padL + (i / Math.max(1, dates.length - 1)) * (W - padL - 6), y = (v: number) => 8 + (1 - (v - lo) / span) * (H - padB - 8);
  const ticks = [lo, 1, hi].filter((v, i, a) => a.indexOf(v) === i);
  return (
    <svg className="bt-chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Out-of-sample growth of 1 dollar: ${series.map((s) => `${s.label} ends at ${s.values.at(-1)?.toFixed(2)}`).join("; ")}`}>
      {ticks.map((t) => <g key={t}><line x1={padL} x2={W - 6} y1={y(t)} y2={y(t)} className={t === 1 ? "bt-base" : "bt-grid"} /><text x={padL - 5} y={y(t) + 3} textAnchor="end" className="bt-axis">{t.toFixed(2)}</text></g>)}
      {series.map((s) => <polyline key={s.key} fill="none" stroke={s.color} strokeWidth={s.key === "hold" ? 2.2 : 1.8} strokeDasharray={s.key === "hold" ? "5 4" : undefined} points={s.values.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ")} />)}
      <text x={padL} y={H - 4} className="bt-axis">{dates[0]}</text><text x={W - 6} y={H - 4} textAnchor="end" className="bt-axis">{dates.at(-1)}</text>
    </svg>
  );
}

function Stat({ k, v, cls }: { k: string; v: string; cls?: string }) { return <div><dt>{k}</dt><dd className={cls}>{v}</dd></div>; }

function StrategyCard({ s, hold, color, on, toggle }: { s: StrategyResult; hold: Metrics; color: string; on: boolean; toggle: () => void }) {
  const [open, setOpen] = useState(false);
  const v = VERDICT[s.verdict], o = s.oos, mc = s.mc, h180 = mc?.horizons.find((h) => h.days === 180);
  const lucky = o.sharpe - o.sharpeCi95 <= 0 && o.sharpe + o.sharpeCi95 >= 0;
  return (
    <article className={`bt-card is-${s.verdict.toLowerCase()}`}>
      <div className="bt-card-head">
        <label className="bt-pick"><input type="checkbox" checked={on} onChange={toggle} aria-label={`Show ${s.label} on the chart`} /><i style={{ background: color }} /><strong>{s.label}</strong></label>
        <span className={`bt-verdict bv-${s.verdict.toLowerCase()}`} title={v.tip}>{v.label}</span>
      </div>
      <p className="bt-desc">{s.description}</p>
      <dl className="bt-stats">
        <Stat k="Out-of-sample return" v={pct(o.totalReturnPct)} cls={tone(o.totalReturnPct)} />
        <Stat k="vs buy & hold" v={pct(o.totalReturnPct - hold.totalReturnPct)} cls={tone(o.totalReturnPct - hold.totalReturnPct)} />
        <Stat k="Sharpe (95% range)" v={`${o.sharpe.toFixed(2)} ± ${o.sharpeCi95.toFixed(2)}`} />
        <Stat k="Worst drop" v={pct(o.maxDrawdownPct)} cls="is-loss" />
        <Stat k="Trades · time invested" v={`${o.trades} · ${o.exposurePct}%`} />
        <Stat k="In-sample (optimistic)" v={pct(s.inSample.totalReturnPct)} cls="bt-dim" />
      </dl>
      {lucky ? <p className="bt-note">The Sharpe range spans zero: this result is not distinguishable from luck.</p> : null}
      <button type="button" className="forge-more" aria-expanded={open} onClick={() => setOpen(!open)}>{open ? "Hide detail" : "Walk-forward and Monte Carlo"}</button>
      {open ? (
        <div className="bt-detail">
          <h3>Walk-forward ({s.splits.length} windows, parameters chosen on the training window only)</h3>
          <ul className="bt-splits">{s.splits.map((sp) => (
            <li key={sp.testFrom}><span>train {sp.trainFrom.slice(2)} → {sp.trainTo.slice(2)}</span><b>{paramText(sp.params)}</b><span>test {sp.testFrom.slice(2)} → {sp.testTo.slice(2)}</span><em className={tone(sp.testReturnPct)}>{pct(sp.testReturnPct)}</em></li>
          ))}</ul>
          {s.distinctParams > 1 ? <p className="bt-note">The chosen parameters changed {s.distinctParams - 1} time{s.distinctParams > 2 ? "s" : ""}: the best setting is not stable.</p> : null}
          {mc ? <>
            <h3>Monte Carlo ({mc.sims.toLocaleString()} block-bootstrapped futures from the out-of-sample days)</h3>
            <ul className="bt-mc">{mc.horizons.map((h) => <li key={h.days}><span>{h.days} days</span><b>{h.probLossPct}% chance of a loss</b><em>5th–95th percentile {pct(h.p5Pct, 0)} to {pct(h.p95Pct, 0)}</em></li>)}</ul>
            <p className="bt-note">Typical worst drop in a year: {pct(mc.maxDrawdown.medianPct, 0)}; in the unluckiest 5% of futures: {pct(mc.maxDrawdown.worst5Pct, 0)}.{h180 ? ` Over 180 days it lost money in ${h180.probLossPct}% of futures.` : ""}</p>
          </> : <p className="bt-note">Not enough out-of-sample days for a Monte Carlo run.</p>}
        </div>
      ) : null}
    </article>
  );
}

export function BacktestPage() {
  const { data: rep, error } = useApi<BacktestReport>("/api/backtest", 6 * 3_600_000);
  const [off, setOff] = useState<Set<string> | null>(null);
  const initial = useMemo(() => (rep ? new Set([...rep.strategies].sort((a, b) => b.oos.totalReturnPct - a.oos.totalReturnPct).slice(0, 3).map((s) => s.id)) : new Set<string>()), [rep]);
  const on = off ?? initial;
  if (!rep) return <main className="bt-page"><section className="dashboard-panel"><p className="strategy-muted">{error ? `Backtest unavailable: ${error}` : "Running the strategy suite on Bitcoin daily history…"}</p></section></main>;
  const toggle = (id: string) => { const n = new Set(on); n.has(id) ? n.delete(id) : n.add(id); setOff(n); };
  const proven = rep.strategies.filter((s) => s.verdict === "BEATS_HOLD"), best = [...rep.strategies].sort((a, b) => b.oos.totalReturnPct - a.oos.totalReturnPct)[0]!;
  const series = [{ key: "hold", label: "Buy & hold", color: "#94a3b8", values: rep.holdEquity }, ...rep.strategies.map((s, i) => ({ key: s.id, label: s.label, color: COLORS[i % COLORS.length]!, values: s.equity })).filter((s) => on.has(s.key))];
  return (
    <main className="bt-page">
      <section className="dashboard-panel bt-hero" aria-label="Backtest summary">
        <span className="strategy-label">Backtest Lab · Bitcoin, long or flat, no leverage</span>
        <h1>{proven.length ? `${proven.length} rule${proven.length > 1 ? "s" : ""} beat holding with a provable edge` : "No rule has a provable edge yet"}</h1>
        <p>{rep.trials} rule and setting combinations were tried on {rep.bars} days of Kraken data ({rep.from} to {rep.to}). Judged only on the {rep.oosFrom} to {rep.oosTo} window they had not seen, buying and holding Bitcoin returned <b className={tone(rep.hold.oos.totalReturnPct)}>{pct(rep.hold.oos.totalReturnPct)}</b> with a worst drop of <b className="is-loss">{pct(rep.hold.oos.maxDrawdownPct)}</b>. The best rule, <b>{best.label.toLowerCase()}</b>, returned <b className={tone(best.oos.totalReturnPct)}>{pct(best.oos.totalReturnPct)}</b> with a worst drop of {pct(best.oos.maxDrawdownPct)}, but its Sharpe range ({best.oos.sharpe.toFixed(2)} ± {best.oos.sharpeCi95.toFixed(2)}) {best.oos.sharpe - best.oos.sharpeCi95 > 0 ? "stays above zero" : "includes zero, so luck can't be ruled out"}.</p>
        <p className="bt-note">With {rep.trials} tries, one will look good by chance. A rule earns trust only after the forward test confirms it.</p>
      </section>

      <section className="dashboard-panel bt-panel" aria-label="Out-of-sample growth">
        <div className="engine-panel-head"><h2>Growth of $1, out-of-sample only</h2><span className="strategy-muted">after {rep.costPerSidePct.toFixed(2)}% cost on every entry and exit</span></div>
        <EquityChart dates={rep.oosDates} series={series} />
        <ul className="bt-legend">{series.map((s) => <li key={s.key}><i style={{ background: s.color }} />{s.label} <b>{s.values.at(-1)!.toFixed(2)}</b></li>)}</ul>
      </section>

      <section className="bt-cards" aria-label="Strategies">
        {rep.strategies.map((s, i) => <StrategyCard key={s.id} s={s} hold={rep.hold.oos} color={COLORS[i % COLORS.length]!} on={on.has(s.id)} toggle={() => toggle(s.id)} />)}
      </section>

      <section className="dashboard-panel bt-panel" aria-label="How the tests are kept honest">
        <div className="engine-panel-head"><h2>How the tests are kept honest</h2></div>
        <ul className="bt-method">
          <li><b>No look-ahead.</b> A signal uses only bars up to that day's close and trades at the next day's open. Automated tests cut off the future and check that no past signal changes.</li>
          <li><b>Real costs.</b> Kraken's 0.26% taker fee plus 0.10% slippage on every entry and every exit, which is why rules that trade often fare worst.</li>
          <li><b>Walk-forward.</b> Settings are chosen on {rep.trainDays} days of history, then judged on the next {rep.testDays} days, rolling forward. The first {rep.warmupDays} days only warm up indicators.</li>
          <li><b>Honest uncertainty.</b> Every Sharpe ratio carries its 95% range, and Monte Carlo reshuffles the out-of-sample days in blocks (keeping volatility clustering) to show loss odds and drawdowns.</li>
          <li><b>Long or flat only.</b> No shorting, no margin, no leverage. Bitcoin only, daily bars; {rep.bars} days is a short history with one bull-bear cycle, so treat every figure as a hint.</li>
        </ul>
        <p className="visual-footnote">Research output, not signals or orders. Source: Kraken public OHLC (XBT/USD). Computed {rep.asOf.slice(0, 16).replace("T", " ")} UTC.</p>
      </section>
    </main>
  );
}
