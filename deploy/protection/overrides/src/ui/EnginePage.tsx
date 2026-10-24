// ZOBIRIS Engine: one screen that shows what the engine sees and decides, every panel wired to live data.
//   /api/strategy-v2  BTC trend series, regime votes, rotation map, small-cap funnel, watchlist decisions, feed health
//   /api/health       Kraken private account sync state
//   props             your synchronized holdings (for the barbell check)
import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { decisionGroup, type StrategyReport, type WatchlistDecision } from "../strategyV2/report";
import { DEFAULT_BARBELL } from "../strategyV2/barbell";
import { ALT_GATE_LABEL } from "../strategyV2/altGate";
import type { LedgerSummary } from "../strategyV2/ledger";
import { tradeBreakEven, type costSchedule } from "../strategyV2/costs";

export interface EngineHolding { symbol: string; value: number }

const money = (n: number | null | undefined, digits = 2) => n == null || !Number.isFinite(n) ? "—"
  : n !== 0 && Math.abs(n) < 0.001 ? n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumSignificantDigits: 4 })
  : n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: Math.abs(n) < 1 ? 6 : digits });
const pct = (n: number | null | undefined, d = 1) => n == null || !Number.isFinite(n) ? "—" : (n > 0 ? "+" : "") + n.toFixed(d) + "%";
const ago = (iso: string | null, now: number) => {
  const t = iso ? Date.parse(iso) : NaN;
  if (!Number.isFinite(t)) return iso ? "unknown" : "never";
  const m = Math.max(0, Math.round((now - t) / 60_000));
  return m < 60 ? `${m}m ago` : m < 48 * 60 ? `${Math.round(m / 60)}h ago` : `${Math.round(m / 1440)}d ago`;
};

function useJson<T>(url: string, everyMs: number) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let live = true;
    const load = async () => {
      try {
        const r = await fetch(url);
        const body = await r.json().catch(() => null);
        if (!r.ok) throw new Error(body?.error ?? `HTTP ${r.status}`);
        if (body == null || typeof body !== "object") throw new Error("Unexpected response");
        if (live) { setData(body as T); setError(""); }
        return true;
      } catch (e) { if (live) setError(String(e instanceof Error ? e.message : e)); return false; }
    };
    // Normal interval after success; retry within a minute after a failure (e.g. the first build after a restart).
    let t: ReturnType<typeof setTimeout> | undefined;
    const next = (ok: boolean) => { if (live) t = setTimeout(async () => next(await load()), ok ? everyMs : Math.min(60_000, everyMs)); };
    void load().then(next);
    return () => { live = false; clearTimeout(t); };
  }, [url, everyMs]);
  return { data, error };
}

/** Width of a chart container, so SVG text stays at real pixel size on phones instead of shrinking. */
function useWidth(fallback: number) {
  const ref = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(fallback);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(([e]) => { const cw = Math.round(e?.contentRect.width ?? 0); if (cw > 0) setW(cw); });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, w] as const;
}

/* ---------- BTC trend chart ---------- */
function BtcTrendChart({ series }: { series: StrategyReport["btcSeries"] }) {
  const [hover, setHover] = useState<number | null>(null);
  const [box, cw] = useWidth(860);
  const W = Math.max(300, cw), H = W < 520 ? 210 : 250, DD = W < 520 ? 60 : 70, PAD = { l: 8, r: 60, t: 10, b: 18 };
  const geo = useMemo(() => {
    if (series.length < 2) return null;
    const vals = series.flatMap((p) => [p.close, p.sma50 ?? p.close, p.sma200 ?? p.close]);
    const lo = Math.min(...vals) * 0.97, hi = Math.max(...vals) * 1.02;
    const x = (i: number) => PAD.l + (i / (series.length - 1)) * (W - PAD.l - PAD.r);
    const y = (v: number) => PAD.t + (1 - (v - lo) / (hi - lo)) * (H - PAD.t - PAD.b);
    const line = (key: "close" | "sma50" | "sma200") => series.map((p, i) => p[key] == null ? null : `${x(i).toFixed(1)},${y(p[key]!).toFixed(1)}`).filter(Boolean).join(" ");
    let peak = 0;
    const dd = series.map((p) => { peak = Math.max(peak, p.close); return (p.close / peak - 1) * 100; });
    const ddMin = Math.min(-5, ...dd);
    const yd = (v: number) => H + 14 + (v / ddMin) * (DD - 18);
    const ddArea = `${x(0)},${yd(0)} ` + dd.map((v, i) => `${x(i).toFixed(1)},${yd(v).toFixed(1)}`).join(" ") + ` ${x(series.length - 1)},${yd(0)}`;
    // Shade the background green/red where price sits above/below its 200-day average.
    const bands: Array<{ x0: number; x1: number; up: boolean }> = [];
    series.forEach((p, i) => {
      if (p.sma200 == null) return;
      const up = p.close >= p.sma200;
      const last = bands[bands.length - 1];
      if (last && last.up === up) last.x1 = x(i); else bands.push({ x0: x(Math.max(0, i - 0.5)), x1: x(i), up });
    });
    const ticks = [lo + (hi - lo) * 0.15, lo + (hi - lo) * 0.5, lo + (hi - lo) * 0.85];
    const step = W < 520 ? 2 : 1; // every other month on phones
    const months = series.map((p, i) => ({ i, d: p.t })).filter((m, k, arr) => k > 0 && m.d.slice(5, 7) !== arr[k - 1]!.d.slice(5, 7)).filter((_, k) => k % step === 0);
    return { x, y, line, dd, ddMin, yd, ddArea, bands, ticks, months };
  }, [series, W, H, DD]);
  if (!geo) return <p className="strategy-muted">Not enough Bitcoin history yet.</p>;
  const onMove = (e: ReactPointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * W;
    setHover(Math.max(0, Math.min(series.length - 1, Math.round(((px - PAD.l) / (W - PAD.l - PAD.r)) * (series.length - 1)))));
  };
  const h = hover == null ? null : series[hover]!;
  const last = series[series.length - 1]!;
  return (
    <div className="engine-chart" ref={box}>
      <svg viewBox={`0 0 ${W} ${H + DD}`} onPointerMove={onMove} onPointerLeave={() => setHover(null)} role="img"
        aria-label={`Bitcoin daily close for the last ${series.length} days with 50 and 200 day averages; last close ${money(last.close, 0)}`}>
        <defs>
          <linearGradient id="eng-price" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#60a5fa" stopOpacity=".35" /><stop offset="1" stopColor="#60a5fa" stopOpacity="0" /></linearGradient>
        </defs>
        {geo.bands.map((b, i) => <rect key={i} x={b.x0} y={PAD.t} width={Math.max(1, b.x1 - b.x0)} height={H - PAD.t - PAD.b} className={b.up ? "eng-band-up" : "eng-band-down"} />)}
        {geo.ticks.map((t) => <g key={t}><line x1={PAD.l} x2={W - PAD.r} y1={geo.y(t)} y2={geo.y(t)} className="eng-gridline" /><text x={W - PAD.r + 6} y={geo.y(t) + 4} className="eng-axis">{money(t, 0)}</text></g>)}
        {geo.months.map((m) => <text key={m.i} x={geo.x(m.i)} y={H - 2} className="eng-axis" textAnchor="middle">{new Date(m.d + "T00:00:00Z").toLocaleString("en-US", { month: "short", timeZone: "UTC" })}</text>)}
        <polygon points={`${geo.x(0)},${H - PAD.b} ${geo.line("close")} ${geo.x(series.length - 1)},${H - PAD.b}`} fill="url(#eng-price)" />
        <polyline points={geo.line("sma200")} className="eng-sma200" />
        <polyline points={geo.line("sma50")} className="eng-sma50" />
        <polyline points={geo.line("close")} className="eng-close" />
        <circle cx={geo.x(series.length - 1)} cy={geo.y(last.close)} r="4" className="eng-dot" />
        <text x={8} y={H + DD - 2} className="eng-axis">Drawdown from 1-year high</text>
        <polygon points={geo.ddArea} className="eng-dd" />
        <text x={W - PAD.r + 6} y={geo.yd(geo.ddMin) + 4} className="eng-axis">{geo.ddMin.toFixed(0)}%</text>
        {h ? <g pointerEvents="none">
          <line x1={geo.x(hover!)} x2={geo.x(hover!)} y1={PAD.t} y2={H + DD - 4} className="eng-cross" />
          <circle cx={geo.x(hover!)} cy={geo.y(h.close)} r="4" className="eng-dot" />
        </g> : null}
      </svg>
      <div className="engine-legend">
        <span><i className="sw-close" />BTC close</span><span><i className="sw-50" />50-day</span><span><i className="sw-200" />200-day</span>
        <span><i className="sw-up" />above 200-day</span><span><i className="sw-down" />below</span>
      </div>
      <div className="engine-readout" aria-live="polite">
        {(h ?? last).t} · close <strong>{money((h ?? last).close, 0)}</strong> · 50D {money((h ?? last).sma50, 0)} · 200D {money((h ?? last).sma200, 0)}
        {hover != null ? <> · drawdown <strong>{pct(geo.dd[hover])}</strong></> : null}
      </div>
    </div>
  );
}

/* ---------- Exposure gauge ---------- */
function Gauge({ value, label }: { value: number; label: string }) {
  const v = Math.max(0, Math.min(1, value));
  const a = Math.PI * (1 - v);
  const x = 60 + 48 * Math.cos(a), y = 60 - 48 * Math.sin(a);
  return (
    <svg viewBox="0 0 120 70" className="engine-gauge" role="img" aria-label={`${label}: ${Math.round(v * 100)}%`}>
      <path d="M12 60 A48 48 0 0 1 108 60" className="eng-gauge-track" />
      {v > 0 ? <path d={`M12 60 A48 48 0 0 1 ${x.toFixed(2)} ${y.toFixed(2)}`} className="eng-gauge-fill" /> : null}
      <text x="60" y="56" textAnchor="middle" className="eng-gauge-num">{Math.round(v * 100)}%</text>
    </svg>
  );
}

/* ---------- Rotation map ---------- */
function RotationMap({ points, decisions }: { points: StrategyReport["rotationMap"]; decisions: Map<string, WatchlistDecision> }) {
  const [pick, setPick] = useState<string | null>(null);
  const [box, cw] = useWidth(520);
  const W = Math.max(300, cw), H = Math.round(Math.max(280, Math.min(380, W * 0.68))), P = 34;
  const clampX = (v: number) => Math.max(-100, Math.min(100, v)), clampY = (v: number) => Math.max(-50, Math.min(50, v));
  const x = (v: number) => P + ((clampX(v) + 100) / 200) * (W - 2 * P);
  const y = (v: number) => P + (1 - (clampY(v) + 50) / 100) * (H - 2 * P);
  const maxCap = Math.max(...points.map((p) => p.marketCapUsd), 1);
  const r = (cap: number) => 3 + 9 * Math.sqrt(Math.log10(1 + cap) / Math.log10(1 + maxCap)) * (cap / maxCap > 0.02 ? 1.4 : 0.8);
  const sel = points.find((p) => p.symbol === pick) ?? null;
  // Label only what matters: entries, watch, the five largest coins, and the picked one.
  const labelled = new Set([...points.filter((p) => ["QUALIFIED", "NEAR_ROTATION"].includes(decisions.get(p.symbol)?.rotation?.status ?? "")).map((p) => p.symbol),
    ...[...points].sort((a, b) => b.marketCapUsd - a.marketCapUsd).slice(0, 5).map((p) => p.symbol), ...(pick ? [pick] : [])]);
  const tone = (p: StrategyReport["rotationMap"][number]) => {
    const s = decisions.get(p.symbol)?.rotation?.status;
    return s === "QUALIFIED" ? "is-buy" : s === "NEAR_ROTATION" ? "is-watch" : p.onWatchlist ? "is-watchlist" : "";
  };
  return (
    <div className="engine-chart" ref={box}>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Rotation map of ${points.length} top-100 coins by 200-day and 30-day performance versus Bitcoin`}>
        <rect x={P} y={P} width={x(-10) - P} height={y(0) - P} className="eng-zone" />
        <text x={P + 6} y={P + 14} className="eng-zone-label">{W < 460 ? "Rotation zone" : "Rotation zone · lagged, now recovering"}</text>
        <text x={W - P - 6} y={P + 14} textAnchor="end" className="eng-quad">Leaders</text>
        <text x={P + 6} y={H - P - 6} className="eng-quad">Laggards</text>
        <text x={W - P - 6} y={H - P - 6} textAnchor="end" className="eng-quad">Fading</text>
        <line x1={x(0)} x2={x(0)} y1={P} y2={H - P} className="eng-axisline" />
        <line x1={P} x2={W - P} y1={y(0)} y2={y(0)} className="eng-axisline" />
        <text x={W / 2} y={H - 8} textAnchor="middle" className="eng-axis">200-day return vs BTC →</text>
        <text x={12} y={H / 2} textAnchor="middle" className="eng-axis" transform={`rotate(-90 12 ${H / 2})`}>30-day vs BTC →</text>
        {[...points].sort((a, b) => b.marketCapUsd - a.marketCapUsd).map((p) => (
          <g key={p.symbol} className={`eng-bubble ${tone(p)}${pick === p.symbol ? " is-picked" : ""}`} onClick={() => setPick(pick === p.symbol ? null : p.symbol)}>
            <circle cx={x(p.rel200)} cy={y(p.rel30)} r={r(p.marketCapUsd)} />
            {labelled.has(p.symbol) ? <text x={x(p.rel200)} y={y(p.rel30) - r(p.marketCapUsd) - 3} textAnchor="middle">{p.symbol}</text> : null}
          </g>
        ))}
      </svg>
      <div className="engine-legend"><span><i className="sw-buy" />buy zone</span><span><i className="sw-watch" />watch</span><span><i className="sw-wl" />on your watchlist</span><span><i className="sw-other" />other top 100</span></div>
      <div className="engine-readout" aria-live="polite">{sel
        ? <>{sel.symbol} <span className="strategy-muted">{sel.name} · #{sel.rank}</span> · 200d vs BTC <strong>{pct(sel.rel200)}</strong> · 30d vs BTC <strong>{pct(sel.rel30)}</strong>{decisions.get(sel.symbol) ? <> · {decisions.get(sel.symbol)!.signal}</> : null}</>
        : "Tap a bubble for details. Bubble size is market cap."}</div>
    </div>
  );
}

/* ---------- Signal grouping ---------- */
const GROUPS = [
  { key: "buy", label: "Buy zone", cls: "is-buy" },
  { key: "bet", label: "Small-bet candidate", cls: "is-bet" },
  { key: "watch", label: "Watch", cls: "is-watch" },
  { key: "wait", label: "Wait / hold", cls: "is-wait" },
  { key: "filtered", label: "Filtered or avoid", cls: "is-avoid" },
  { key: "outside", label: "Outside strategy / no data", cls: "is-outside" },
] as const;
export const signalGroup = decisionGroup;

/* ---------- Forward paper test ---------- */
const GROUP_LABEL: Record<string, string> = { buy: "Buy zones (filled limits)", bet: "Small-bet candidates", watch: "Watch", wait: "Wait / hold", filtered: "Filtered / avoid" };
function LedgerPanel() {
  const { data, error } = useJson<{ rows: number; error: string | null; summary: LedgerSummary }>("/api/ledger", 30 * 60_000);
  if (!data) return <p className="strategy-muted">{error ? `Ledger unavailable: ${error}` : "Loading the decision ledger…"}</p>;
  const s = data.summary;
  const cell = (g: LedgerSummary["groups"][number], h: string) => {
    const x = g.horizons[h]!;
    if (!x.n) return <td className="strategy-muted">{x.pending ? `${x.pending} pending` : "—"}</td>;
    return <td><strong className={x.avgNetPct! >= 0 ? "is-gain" : "is-loss"}>{pct(x.avgNetPct)}</strong><small> n={x.n}{x.lostCoverage ? ` · ${x.lostCoverage} lost` : ""}</small></td>;
  };
  return (
    <>
      <p className="strategy-muted">{s.firstDay ? <>Recording since {s.firstDay} · {s.days} day{s.days === 1 ? "" : "s"} · {data.rows} rows. </> : "Recording starts with the first report. "}
        Net of Kraken fees (maker in, taker out) and half the bid-ask spread · each signal counted once, on its first day · results appear 7 days after a signal.</p>
      {data.error ? <p className="engine-warn">Ledger not writable: {data.error}</p> : null}
      <div className="engine-ledger-scroll"><table className="engine-ledger">
        <thead><tr><th>Signal group</th><th>Signals</th><th>7 days</th><th>30 days</th><th>90 days</th><th>30d vs BTC</th><th>30d hit rate</th></tr></thead>
        <tbody>{s.groups.map((g) => (
          <tr key={g.group}><td>{GROUP_LABEL[g.group] ?? g.group}</td><td>{g.events}{g.group === "buy" && g.events ? <small> · {g.filled} filled</small> : null}</td>
            {cell(g, "7d")}{cell(g, "30d")}{cell(g, "90d")}
            <td>{g.horizons["30d"]!.avgVsBtcPct == null ? "—" : <span className={g.horizons["30d"]!.avgVsBtcPct! >= 0 ? "is-gain" : "is-loss"}>{pct(g.horizons["30d"]!.avgVsBtcPct)}</span>}</td>
            <td>{g.horizons["30d"]!.hitRate == null ? "—" : Math.round(g.horizons["30d"]!.hitRate! * 100) + "%"}</td></tr>))}</tbody>
      </table></div>
    </>
  );
}

/* ---------- Fee break-even ---------- */
const COIN_CLASS = { major: { label: "BTC or ETH", symbol: "BTC", rank: 1 }, top100: { label: "Top-100 alt", symbol: "ALT", rank: 50 }, smaller: { label: "Smaller alt", symbol: "ALT", rank: null } } as const;
export function FeeBreakEvenPanel() {
  const { data } = useJson<{ costs?: ReturnType<typeof costSchedule> }>("/api/ledger", 30 * 60_000);
  const [gain, setGain] = useState("8");
  const [loss, setLoss] = useState("4");
  const [cls, setCls] = useState<keyof typeof COIN_CLASS>("top100");
  const c = data?.costs;
  if (!c) return <p className="strategy-muted">Loading the fee schedule…</p>;
  const k = COIN_CLASS[cls];
  const r = tradeBreakEven(Number(gain), Number(loss), k.symbol, k.rank, { tier: c.tier, makerPct: c.makerPct, takerPct: c.takerPct });
  return (
    <>
      <p className="strategy-muted">Fees: {c.source} · maker {c.makerPct}% in, taker {c.takerPct}% out, plus half the bid-ask spread ({cls === "major" ? c.halfSpreadPct.major : cls === "top100" ? c.halfSpreadPct.top100 : c.halfSpreadPct.smaller}%).</p>
      <div className="engine-fee-form">
        <label>Take-profit move <input type="number" min="0.1" step="0.5" inputMode="decimal" value={gain} onChange={(e) => setGain(e.target.value)} />%</label>
        <label>Stop-loss move <input type="number" min="0.1" max="99" step="0.5" inputMode="decimal" value={loss} onChange={(e) => setLoss(e.target.value)} />%</label>
        <label>Coin <select value={cls} onChange={(e) => setCls(e.target.value as keyof typeof COIN_CLASS)}>{Object.entries(COIN_CLASS).map(([key, v]) => <option key={key} value={key}>{v.label}</option>)}</select></label>
      </div>
      {r ? <dl className="engine-fee-out">
        <div><dt>Round-trip cost</dt><dd>{r.roundTripCostPct.toFixed(2)}%</dd></div>
        <div><dt>If it hits the target</dt><dd className={r.winNetPct >= 0 ? "is-gain" : "is-loss"}>{pct(r.winNetPct, 2)}</dd></div>
        <div><dt>If it hits the stop</dt><dd className="is-loss">{pct(r.lossNetPct, 2)}</dd></div>
        <div><dt>Wins needed to break even</dt><dd>{r.breakEvenWinRate == null ? "never: costs exceed the target" : `${(r.breakEvenWinRate * 100).toFixed(1)}%`}</dd></div>
      </dl> : <p className="engine-warn">Enter a take-profit above 0% and a stop between 0% and 100%.</p>}
      <p className="strategy-muted">Limit order in, market order out, as the ledger scores it; a take-profit filled as a limit order costs a little less. This is arithmetic, not a forecast: it says how often a setup must work, not whether it will.</p>
    </>
  );
}

/* ---------- Page ---------- */
export function EnginePage({ holdings, cashUsd, accountSynced, onOpen }: { holdings: EngineHolding[]; cashUsd: number; accountSynced: boolean; onOpen: (view: "strategy" | "portfolio" | "market" | "forge") => void }) {
  const { data: report, error } = useJson<StrategyReport>("/api/strategy-v2", 5 * 60_000);
  const { data: health } = useJson<{ krakenAccount?: { privateAccountSynced: boolean; capturedAt: string | null; syncMode?: string; lastError?: string | null } }>("/api/health", 60_000);
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 60_000); return () => clearInterval(t); }, []);
  const decisions = useMemo(() => new Map((report?.watchlist ?? []).map((d) => [d.symbol, d])), [report]);

  if (!report) {
    return <main><section className="dashboard-panel strategy-panel" role="status"><h2>Zobiris Engine</h2>
      <p className="strategy-muted">{error ? `${error}. ` : ""}The engine builds its first report from free market feeds; this takes about two minutes after a restart.</p></section></main>;
  }

  const g = report.regime;
  const groups = GROUPS.map((gr) => ({ ...gr, items: report.watchlist.filter((d) => signalGroup(d) === gr.key) }));
  const buys = groups[0]!.items, bets = [...groups[1]!.items].sort((a, b) => (b.smallCap?.convexityScore ?? 0) - (a.smallCap?.convexityScore ?? 0));
  const funnelMax = Math.max(1, report.screenFunnel[0]?.remaining ?? 1);

  // Barbell check from synchronized holdings: cash, top-100 core, rank 101-500 sleeve, everything else.
  const tierOf = (sym: string) => decisions.get(sym)?.tier ?? (report.rotationMap.some((p) => p.symbol === sym) || sym === "BTC" ? "TOP_100" : "OUTSIDE_STRATEGY");
  const buckets = { cash: cashUsd, core: 0, sleeve: 0, other: 0 };
  holdings.forEach((h) => { const t = tierOf(h.symbol); if (t === "TOP_100") buckets.core += h.value; else if (t === "RANK_101_500") buckets.sleeve += h.value; else buckets.other += h.value; });
  const totalUsd = buckets.cash + buckets.core + buckets.sleeve + buckets.other;
  const share = (v: number) => (totalUsd > 0 ? v / totalUsd : 0);
  // Rank 101+ share allowed by the Valley Forge target for the current posture (falls back to the old 10% sleeve).
  const vfTarget = report.valleyForge?.allocation.target;
  const sleeveCap = vfTarget ? (vfTarget.rank101_200 + vfTarget.rank201_500 + vfTarget.speculative) / 100 : DEFAULT_BARBELL.sleevePct;
  const acct = health?.krakenAccount;
  const feeds = [...report.feeds, ...(acct ? [{ name: "Kraken account", ok: acct.privateAccountSynced && !acct.lastError, detail: acct.privateAccountSynced ? `synced · ${acct.syncMode ?? "poll"}` : /not configured/i.test(acct.lastError ?? "") ? "disconnected · no account link" : "locked / not synced", at: acct.capturedAt }] : [])];

  return (
    <main className="engine-page">
      <section className="dashboard-panel engine-hero" aria-label="Engine status">
        <div className={`engine-state is-${g.state.toLowerCase()}`}>
          <span className="strategy-label">Market regime</span>
          <strong>{g.state.replace("_", " ")}</strong>
          <small>Bitcoin trend score {g.score > 0 ? "+" : ""}{g.score} / 5 · Mayer {g.mayerMultiple?.toFixed(2) ?? "—"}× · 30d vol {g.realizedVolAnnualPct?.toFixed(0) ?? "—"}%</small>
        </div>
        <div className="engine-gauge-wrap"><Gauge value={g.exposureMultiplier} label="New-risk size" /><span className="strategy-label">New-risk size</span></div>
        <div className="engine-hero-stats">
          <div><span className="strategy-label">Altcoin breadth</span><strong>{report.breadth.share == null ? "—" : Math.round(report.breadth.share * 100) + "%"}</strong><small>{report.breadth.phase.replace("_", " ").toLowerCase()}</small></div>
          <div><span className="strategy-label">Buy zones</span><strong>{buys.length}</strong><small>top-100 watchlist</small></div>
          <div><span className="strategy-label">Small-bet candidates</span><strong>{bets.length}</strong><small>ranks 101–500</small></div>
          <div><span className="strategy-label">Report</span><strong>{ago(report.asOf, now)}</strong><small>refreshes every 15 min</small></div>
        </div>
      </section>

      <section className="engine-feeds" aria-label="Data feeds">
        {feeds.map((f) => <span key={f.name} className={`engine-feed ${f.ok ? "is-ok" : "is-bad"}`} title={f.at ? new Date(f.at).toLocaleString() : ""}><i aria-hidden="true" /><strong>{f.name}</strong> {f.detail} · {ago(f.at, now)}</span>)}
      </section>

      <section className="engine-grid engine-grid-main">
        <article className="dashboard-panel engine-panel engine-span-2">
          <div className="engine-panel-head"><h2>Bitcoin trend · 1 year</h2><span className="strategy-muted">Kraken daily closes</span></div>
          <BtcTrendChart series={report.btcSeries} />
        </article>
        <article className="dashboard-panel engine-panel">
          <div className="engine-panel-head"><h2>Why the regime is {g.state.replace("_", " ").toLowerCase()}</h2></div>
          <div className="engine-votes">
            {report.regimeComponents.map((c) => (
              <div key={c.label} className="engine-vote">
                <span>{c.label}</span>
                <div className="engine-vote-bar"><i className={c.points >= 0 ? "is-up" : "is-down"} style={{ width: `${(Math.abs(c.points) / 2) * 50}%`, [c.points >= 0 ? "left" : "right"]: "50%" }} /></div>
                <strong className={c.points >= 0 ? "is-gain" : "is-loss"}>{c.points > 0 ? "+" : ""}{c.points}</strong>
              </div>
            ))}
          </div>
          {report.altGate ? <div className="engine-gate">
            <h3>Altcoin gate · <span className={report.altGate.allowAltEntries ? "is-gain" : "is-loss"}>{ALT_GATE_LABEL[report.altGate.state]}</span></h3>
            <ul>{report.altGate.checks.map((c) => <li key={c.label} className={c.ok == null ? "is-unknown" : c.ok ? "is-on" : "is-off"}><span>{c.label}</span><small>{c.detail}</small></li>)}</ul>
          </div> : null}
          <ul className="strategy-rules">
            <li className={g.allowTop100Rotation ? "is-on" : "is-off"}>Top-100 rotation {g.allowTop100Rotation ? (g.state === "NEUTRAL" ? "at half size" : "allowed") : "paused"}</li>
            <li className={g.allowSmallCapBets ? "is-on" : "is-off"}>Small-cap bets {g.allowSmallCapBets ? "allowed" : "paused until RISK ON"}</li>
            <li className={g.capitulationWatch ? "is-on" : "is-off"}>Capitulation watch {g.capitulationWatch ? "ON — review core BTC" : "off"}</li>
          </ul>
        </article>
      </section>

      <section className="engine-grid">
        <article className="dashboard-panel engine-panel">
          <div className="engine-panel-head"><h2>Top-100 rotation map</h2><button type="button" className="engine-link" onClick={() => onOpen("strategy")}>Entries →</button></div>
          <RotationMap points={report.rotationMap} decisions={decisions} />
        </article>
        <article className="dashboard-panel engine-panel">
          <div className="engine-panel-head"><h2>Small-cap survival funnel</h2><span className="strategy-muted">ranks 101–500</span></div>
          <ol className="engine-funnel">
            {report.screenFunnel.map((s, i) => {
              const dropped = i > 0 ? report.screenFunnel[i - 1]!.remaining - s.remaining : 0;
              return <li key={s.stage}>
                <div className="engine-funnel-bar"><i style={{ width: `${Math.max(2, (s.remaining / funnelMax) * 100)}%` }} /></div>
                <span>{s.stage}</span><strong>{s.remaining}</strong>{i > 0 ? <small>−{dropped}</small> : <small>start</small>}
              </li>;
            })}
          </ol>
          <p className="strategy-muted">About 40% of coins eventually delist, so the screen removes likely failures first. Only the survivors are ranked.</p>
        </article>
      </section>

      <section className="dashboard-panel engine-panel" aria-label="Forward paper test">
        <div className="engine-panel-head"><h2>Forward test · paper results</h2><span className="strategy-muted">decision ledger</span></div>
        <LedgerPanel />
      </section>

      <section className="dashboard-panel engine-panel" aria-label="Fee break-even">
        <div className="engine-panel-head"><h2>Fee break-even</h2><span className="strategy-muted">your Kraken costs</span></div>
        <FeeBreakEvenPanel />
      </section>

      <section className="engine-grid">
        <article className="dashboard-panel engine-panel">
          <div className="engine-panel-head"><h2>Your watchlist, decided</h2><span className="strategy-muted">{report.watchlist.length} coins</span></div>
          <div className="engine-stack" role="img" aria-label={groups.map((gr) => `${gr.label} ${gr.items.length}`).join(", ")}>
            {groups.filter((gr) => gr.items.length).map((gr) => <i key={gr.key} className={gr.cls} style={{ flexGrow: gr.items.length }} title={`${gr.label}: ${gr.items.length}`} />)}
          </div>
          <ul className="engine-stack-legend">{groups.map((gr) => <li key={gr.key}><i className={gr.cls} />{gr.label}<strong>{gr.items.length}</strong></li>)}</ul>
          <div className="engine-actions">
            <div><h3>Buy zones · limit orders</h3>
              {buys.length ? <ul>{buys.map((d) => <li key={d.symbol}><strong>{d.symbol}</strong><span>{money(d.rotation?.limitPriceUsd)}</span><small>−{d.rotation?.pullbackPct?.toFixed(0)}% from {money(d.priceUsd)}</small></li>)}</ul> : <p className="strategy-muted">None right now.</p>}</div>
            <div><h3>Small bets · convexity</h3>
              {bets.length ? <ul>{bets.slice(0, 6).map((d) => <li key={d.symbol}><strong>{d.symbol}</strong><span className="engine-score"><i style={{ width: `${d.smallCap?.convexityScore ?? 0}%` }} /></span><small>{d.smallCap?.convexityScore}</small></li>)}</ul> : <p className="strategy-muted">{g.allowSmallCapBets ? "No watchlist coin passes every filter." : "Paused until RISK ON."}</p>}</div>
          </div>
        </article>
        <article className="dashboard-panel engine-panel">
          <div className="engine-panel-head"><h2>Portfolio vs Valley Forge</h2><button type="button" className="engine-link" onClick={() => onOpen("forge")}>Valley Forge →</button></div>
          {accountSynced && totalUsd > 0 ? <>
            <div className="engine-barbell" role="img" aria-label={`Cash ${Math.round(share(buckets.cash) * 100)}%, top-100 ${Math.round(share(buckets.core) * 100)}%, small-cap sleeve ${Math.round(share(buckets.sleeve) * 100)}%, other ${Math.round(share(buckets.other) * 100)}%`}>
              <i className="b-cash" style={{ width: `${share(buckets.cash) * 100}%` }} />
              <i className="b-core" style={{ width: `${share(buckets.core) * 100}%` }} />
              <i className="b-sleeve" style={{ width: `${share(buckets.sleeve) * 100}%` }} />
              <i className="b-other" style={{ width: `${share(buckets.other) * 100}%` }} />
              {(share(buckets.cash) + share(buckets.core) + sleeveCap) < 1 ? <span className="engine-cap" style={{ left: `${(share(buckets.cash) + share(buckets.core) + sleeveCap) * 100}%` }} title="Speculative cap" /> : null}
            </div>
            <ul className="engine-stack-legend">
              <li><i className="b-cash" />Cash<strong>{money(buckets.cash)}</strong></li>
              <li><i className="b-core" />Top-100 core<strong>{money(buckets.core)}</strong></li>
              <li><i className="b-sleeve" />Small-cap sleeve<strong>{money(buckets.sleeve)}</strong></li>
              <li><i className="b-other" />Rank 500+<strong>{money(buckets.other)}</strong></li>
            </ul>
            <p className={share(buckets.sleeve + buckets.other) > sleeveCap ? "engine-warn" : "strategy-muted"}>
              Rank 101+ share {Math.round(share(buckets.sleeve + buckets.other) * 100)}% of a {Math.round(sleeveCap * 100)}% target{report.valleyForge ? ` (${report.valleyForge.allocation.posture.name.toLowerCase()})` : ""}.
              {share(buckets.sleeve + buckets.other) > sleeveCap ? " Over target: trim before adding new bets." : ` Room for about ${money(Math.max(0, sleeveCap * totalUsd - buckets.sleeve - buckets.other))} more.`}
            </p>
          </> : <p className="strategy-muted">Unlock your private portfolio to check it against the Valley Forge target mix.</p>}
        </article>
      </section>
    </main>
  );
}
