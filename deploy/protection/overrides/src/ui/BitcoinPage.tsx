// Bitcoin homepage: full chart (timeframes and indicators chosen by evidence), the daily 1/3/7-day forecast, what
// drives it, and an honest live score of past forecasts. Data: /api/bitcoin and /api/bitcoin/candles.
import { useMemo, useState, type PointerEvent as ReactPointerEvent } from "react";
import { fmtBig, fmtPct, fmtUsd, useApi, useWidth } from "./charts";
import type { Forecast, ScoreStats } from "../strategyV2/btcForecast";

type C = { t: number; o: number; h: number; l: number; c: number; v: number };
type Report = { asOf: string; forecast: Forecast | null; score: Record<string, ScoreStats>; recordedDays: number; macro: { ndx5dPct: number | null; dxy5dPct: number | null; us10y5dBp: number | null }; fearGreed: number | null; options?: { nearMoneyIvPct: number; putCallOiRatio: number } | null; chain?: { day: string; netflowUsd: number; netflow7dUsd: number; activeAddresses: number; activeAddresses30dAvg: number | null; preliminary: boolean } | null; liquidations: { longUsd24h: number; shortUsd24h: number; count: number; source: string } | null; sources: string[] };

// Timeframes in order of evidence: daily carries the measured signal; weekly gives cycle context; 4h/1h are for timing.
const TFS: Array<[string, string, string]> = [["1d", "1D", "default · best evidence"], ["1w", "1W", "cycle context"], ["4h", "4H", "entry timing"], ["1h", "1H", "event days"]];
// Indicators: the first three have published Bitcoin evidence and feed the forecast; the rest are optional and labelled.
const IND: Array<[string, string, boolean, string]> = [
  ["sma50", "50 SMA", true, "#f59e0b"], ["sma200", "200 SMA", true, "#3b82f6"], ["donchian", "20-bar high/low", true, "#94a3b8"],
  ["supertrend", "SuperTrend 10/3", false, "#a855f7"], ["bollinger", "Bollinger 20/2", false, "#22d3ee"],
];
const DEFAULT_ON = new Set(["sma50", "sma200", "donchian"]);

const smaS = (x: number[], n: number) => x.map((_, i) => (i >= n - 1 ? x.slice(i - n + 1, i + 1).reduce((s, v) => s + v, 0) / n : null));
function bands(c: C[]) {
  const cl = c.map((x) => x.c);
  const s20 = smaS(cl, 20);
  const bb = cl.map((_, i) => { const m = s20[i]; if (m == null) return null; const w = cl.slice(i - 19, i + 1); const sd = Math.sqrt(w.reduce((s, v) => s + (v - m) ** 2, 0) / 20); return [m + 2 * sd, m - 2 * sd] as const; });
  const don = c.map((_, i) => (i >= 20 ? [Math.max(...c.slice(i - 20, i).map((x) => x.h)), Math.min(...c.slice(i - 20, i).map((x) => x.l))] as const : null));
  const tr = c.map((x, i) => (i ? Math.max(x.h - x.l, Math.abs(x.h - c[i - 1]!.c), Math.abs(x.l - c[i - 1]!.c)) : x.h - x.l));
  const st: Array<{ v: number; up: boolean } | null> = c.map(() => null);
  let ub = 0, lb = 0, up = true;
  for (let i = 10; i < c.length; i++) {
    const atr = tr.slice(i - 9, i + 1).reduce((s, v) => s + v, 0) / 10, mid = (c[i]!.h + c[i]!.l) / 2;
    const bu = mid + 3 * atr, bl = mid - 3 * atr;
    ub = !ub || bu < ub || c[i - 1]!.c > ub ? bu : ub; lb = !lb || bl > lb || c[i - 1]!.c < lb ? bl : lb;
    if (c[i]!.c > ub) up = true; else if (c[i]!.c < lb) up = false;
    st[i] = { v: up ? lb : ub, up };
  }
  return { sma50: smaS(cl, 50), sma200: smaS(cl, 200), bb, don, st };
}

function BtcChart({ candles, on }: { candles: C[]; on: Set<string> }) {
  const [box, W] = useWidth(900);
  const [hover, setHover] = useState<number | null>(null);
  const H = W < 600 ? 300 : 420, PAD = { l: 8, r: 70, t: 12, b: 24 };
  const ind = useMemo(() => bands(candles), [candles]);
  const view = Math.min(candles.length, W < 600 ? 90 : 180), s = candles.length - view;
  const vis = candles.slice(s);
  const geo = useMemo(() => {
    if (vis.length < 2) return null;
    const vals = vis.flatMap((c, k) => [c.h, c.l, ...(on.has("bollinger") && ind.bb[s + k] ? ind.bb[s + k]! : []), ...(on.has("sma200") && ind.sma200[s + k] ? [ind.sma200[s + k]!] : [])]);
    const lo = Math.min(...vals) * 0.995, hi = Math.max(...vals) * 1.005;
    const step = (W - PAD.l - PAD.r) / vis.length;
    return { lo, hi, step, x: (k: number) => PAD.l + step * (k + 0.5), y: (v: number) => PAD.t + (1 - (v - lo) / (hi - lo)) * (H - PAD.t - PAD.b) };
  }, [vis, W, H, on, ind, s]);
  if (!geo) return <div ref={box} className="zs-empty">Loading chart…</div>;
  const line = (arr: Array<number | null>) => vis.map((_, k) => arr[s + k]).map((v, k) => (v == null ? null : `${geo.x(k)},${geo.y(v)}`)).filter(Boolean).join(" ");
  const at = hover != null && hover < vis.length ? hover : vis.length - 1, h = vis[at]!;
  const onMove = (e: ReactPointerEvent<SVGSVGElement>) => { const r = e.currentTarget.getBoundingClientRect(); setHover(Math.max(0, Math.min(vis.length - 1, Math.floor((((e.clientX - r.left) / r.width) * W - PAD.l) / geo.step)))); };
  const ticks = Array.from({ length: 5 }, (_, i) => geo.lo + ((geo.hi - geo.lo) * (i + 0.5)) / 5);
  return (
    <div ref={box} className="btc-chart">
      <div className="btc-readout">{new Date(h.t * 1000).toLocaleString()} · O {fmtUsd(h.o, 0)} H {fmtUsd(h.h, 0)} L {fmtUsd(h.l, 0)} C <b>{fmtUsd(h.c, 0)}</b></div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} onPointerMove={onMove} onPointerLeave={() => setHover(null)} role="img" aria-label="Bitcoin price chart">
        {ticks.map((t) => <g key={t}><line x1={PAD.l} x2={W - PAD.r} y1={geo.y(t)} y2={geo.y(t)} className="zs-grid" /><text x={W - PAD.r + 6} y={geo.y(t) + 4} className="zs-axis">{fmtUsd(t, 0)}</text></g>)}
        {on.has("bollinger") ? <><polyline points={line(ind.bb.map((b) => b?.[0] ?? null))} fill="none" stroke="#22d3ee" strokeOpacity=".6" /><polyline points={line(ind.bb.map((b) => b?.[1] ?? null))} fill="none" stroke="#22d3ee" strokeOpacity=".6" /></> : null}
        {on.has("donchian") ? <><polyline points={line(ind.don.map((d) => d?.[0] ?? null))} fill="none" stroke="#94a3b8" strokeDasharray="4 3" /><polyline points={line(ind.don.map((d) => d?.[1] ?? null))} fill="none" stroke="#94a3b8" strokeDasharray="4 3" /></> : null}
        {vis.map((c, k) => { const upC = c.c >= c.o; const bw = Math.max(1, geo.step * 0.66); return <g key={c.t} className={upC ? "is-up" : "is-down"}><line x1={geo.x(k)} x2={geo.x(k)} y1={geo.y(c.h)} y2={geo.y(c.l)} stroke={upC ? "#22c55e" : "#ef4444"} /><rect x={geo.x(k) - bw / 2} width={bw} y={geo.y(Math.max(c.o, c.c))} height={Math.max(1, Math.abs(geo.y(c.o) - geo.y(c.c)))} fill={upC ? "#22c55e" : "#ef4444"} /></g>; })}
        {on.has("sma50") ? <polyline points={line(ind.sma50)} fill="none" stroke="#f59e0b" strokeWidth="1.6" /> : null}
        {on.has("sma200") ? <polyline points={line(ind.sma200)} fill="none" stroke="#3b82f6" strokeWidth="1.8" /> : null}
        {on.has("supertrend") ? vis.map((_, k) => { const p = ind.st[s + k], q = ind.st[s + k - 1]; return p && q && p.up === q.up ? <line key={k} x1={geo.x(k - 1)} x2={geo.x(k)} y1={geo.y(q.v)} y2={geo.y(p.v)} stroke={p.up ? "#a855f7" : "#f472b6"} strokeWidth="1.6" /> : null; }) : null}
        {hover != null ? <line x1={geo.x(at)} x2={geo.x(at)} y1={PAD.t} y2={H - PAD.b} className="zs-cross" pointerEvents="none" /> : null}
      </svg>
    </div>
  );
}

export function BitcoinPage() {
  const [tf, setTf] = useState("1d");
  const [on, setOn] = useState<Set<string>>(new Set(DEFAULT_ON));
  const { data: rep, error } = useApi<Report>("/api/bitcoin", 10 * 60_000);
  const { data: ch } = useApi<{ candles: C[] }>(`/api/bitcoin/candles?tf=${tf}`, tf === "1h" ? 5 * 60_000 : 15 * 60_000);
  const f = rep?.forecast ?? null;
  const toggle = (k: string) => setOn((o) => { const n = new Set(o); n.has(k) ? n.delete(k) : n.add(k); return n; });
  return (
    <main className="btc-page">
      <section className="dashboard-panel btc-panel" aria-label="Bitcoin chart">
        <div className="engine-panel-head"><h2>Bitcoin {f ? fmtUsd(f.close, 0) : ""}</h2><span className="strategy-muted">Kraken BTC/USD</span></div>
        <div className="forge-tabs" role="tablist">{TFS.map(([k, l, why]) => <button key={k} type="button" role="tab" aria-selected={tf === k} title={why} onClick={() => setTf(k)}>{l}<small className="btc-tf-why"> {why}</small></button>)}</div>
        <div className="btc-toggles">{IND.map(([k, l, ev, col]) => <label key={k} className={on.has(k) ? "is-on" : ""}><input type="checkbox" checked={on.has(k)} onChange={() => toggle(k)} /><i style={{ background: col }} />{l}{ev ? "" : <small> · not in forecast</small>}</label>)}</div>
        {ch?.candles?.length ? <BtcChart candles={ch.candles} on={on} /> : <p className="strategy-muted">Loading chart…</p>}
        <p className="strategy-muted">Default overlays have published Bitcoin evidence (trend vs moving averages, 20-bar breakouts). SuperTrend and Bollinger Bands are available but lost money in Zobiris's own 2-year, fee-included backtest and are not used in the forecast.</p>
      </section>

      <section className="dashboard-panel btc-panel" aria-label="Forecast">
        <div className="engine-panel-head"><h2>Forecast</h2><span className="strategy-muted">{f ? `from the ${f.day} daily close · probabilities capped at 35–65% until the record earns more` : error ? `unavailable: ${error}` : "loading…"}</span></div>
        {f ? <>
          <div className="btc-fc">{f.horizons.map((h) => (
            <div key={h.days} className={h.pUp >= 0.5 ? "is-up" : "is-down"}><span className="strategy-label">Next {h.days} day{h.days > 1 ? "s" : ""}</span>
              <b>{Math.round(h.pUp * 100)}% up</b><small>68% range {fmtUsd(h.low, 0)} – {fmtUsd(h.high, 0)}</small></div>
          ))}</div>
          <ul className="forge-stats">{f.components.map((c) => <li key={c.key}><strong>{c.label}</strong><span>weight {Math.round(c.weight * 100)}%</span><span className={c.score == null ? "" : c.score >= 0 ? "is-gain" : "is-loss"}>{c.score == null ? "no data" : `${c.score >= 0 ? "+" : ""}${c.score.toFixed(2)}`}</span><small>{c.detail}</small></li>)}</ul>
        </> : null}
      </section>

      <section className="engine-grid">
        <article className="dashboard-panel engine-panel" aria-label="How the forecasts have done">
          <div className="engine-panel-head"><h2>Track record</h2><span className="strategy-muted">{rep?.recordedDays ?? 0} forecasts recorded</span></div>
          <ul className="forge-stats">{Object.values(rep?.score ?? {}).map((s) => (
            <li key={s.days}><strong>{s.days}-day</strong>{s.n ? <>
              <span>hit {Math.round(s.hitRate! * 100)}% ±{Math.round(s.hitCi95! * 100)}</span><span>Brier {s.brier!.toFixed(3)} (coin flip 0.250{s.brierBaseRate != null ? `, base rate ${s.brierBaseRate.toFixed(3)}` : ""})</span><span>in range {Math.round(s.inRangePct! * 100)}%</span><small>{s.n} scored</small>
            </> : <small>first results after {s.days} day{s.days > 1 ? "s" : ""}</small>}</li>
          ))}</ul>
          <p className="strategy-muted">Realistic daily direction accuracy is 51–55%. Below about 250 scored days, a 55% hit rate can't be told apart from luck; lower Brier than the coin flip and base rate is what counts.</p>
        </article>
        <article className="dashboard-panel engine-panel" aria-label="Drivers">
          <div className="engine-panel-head"><h2>Drivers right now</h2></div>
          <ul className="forge-stats">
            <li><strong>Nasdaq-100 (5 days)</strong><span>{fmtPct(rep?.macro.ndx5dPct, 1)}</span><small>BTC correlation +0.35 to +0.6</small></li>
            <li><strong>US dollar index (5 days)</strong><span>{fmtPct(rep?.macro.dxy5dPct, 1)}</span></li>
            <li><strong>10-year yield (5 days)</strong><span>{rep?.macro.us10y5dBp == null ? "—" : `${rep.macro.us10y5dBp.toFixed(0)} bp`}</span><small>rising yields + firm dollar hurt BTC</small></li>
            <li><strong>Fear & Greed</strong><span>{rep?.fearGreed ?? "—"}</span></li>
            {rep?.options && <li><strong>Options implied vol (7–45d, near money)</strong><span>{rep.options.nearMoneyIvPct.toFixed(1)}%</span><span>put/call OI {rep.options.putCallOiRatio.toFixed(2)}</span><small>Deribit · information only: puts above calls = hedging demand</small></li>}
            {rep?.chain && <li><strong>Exchange netflow ({rep.chain.day})</strong><span className={rep.chain.netflowUsd > 0 ? "is-loss" : "is-gain"}>{rep.chain.netflowUsd > 0 ? "+" : "−"}{fmtBig(Math.abs(rep.chain.netflowUsd))}</span><span>7d {rep.chain.netflow7dUsd > 0 ? "+" : "−"}{fmtBig(Math.abs(rep.chain.netflow7dUsd))}</span><small>Coin Metrics{rep.chain.preliminary ? " (preliminary)" : ""} · inflow = coins moving to exchanges · {rep.chain.activeAddresses.toLocaleString()} active addresses{rep.chain.activeAddresses30dAvg ? ` (30d avg ${rep.chain.activeAddresses30dAvg.toLocaleString()})` : ""}</small></li>}
            <li><strong>Liquidations, 24h sample</strong>{rep?.liquidations ? <><span className="is-loss">longs {fmtBig(rep.liquidations.longUsd24h)}</span><span className="is-gain">shorts {fmtBig(rep.liquidations.shortUsd24h)}</span><small>information only: no study shows what follows over days</small></> : <span>unavailable</span>}</li>
          </ul>
          <p className="strategy-muted">ETF flows (5-day sums) and Strategy's mNAV are next to add. Fed/CPI days and war headlines widen the range rather than set direction.</p>
        </article>
      </section>
      <p className="visual-footnote">Research output, not orders. Sources: {rep?.sources.join(" · ")}</p>
    </main>
  );
}
