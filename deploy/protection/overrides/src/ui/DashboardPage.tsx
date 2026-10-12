// Dashboard: the landing page. Market mood, your watchlist as decision cards, engine signals, fear & greed and sectors.
// Everything comes from /api/strategy-v2 (Zobiris decisions) and /api/market-overview (free market data).
import { useMemo, useState } from "react";
import type { StrategyReport, WatchlistDecision } from "../strategyV2/report";
import { signalGroup } from "./EnginePage";
import { RangeTabs, Sparkline, fmtBig, fmtPct, fmtUsd, toneOf, useApi } from "./charts";
import type { MarketOverview, MarketQuote } from "./MarketToday";

type Sector = { id: string; label: string; change24hPct: number | null; reliable: boolean };
type Overview = MarketOverview & { sectors?: Sector[] };
type Open = (view: "strategy" | "engine" | "market" | "watchlist" | "portfolio") => void;

/** Percentile (0-100) of 0.6 x 30d + 0.4 x 7d return among the watchlist coins that have both. Exported for tests. */
export function momentumScores(rows: Array<{ symbol: string; change7dPct: number | null; change30dPct: number | null }>): Map<string, number> {
  const scored = rows.filter((r) => r.change7dPct != null && r.change30dPct != null).map((r) => ({ s: r.symbol, v: 0.6 * r.change30dPct! + 0.4 * r.change7dPct! }));
  const sorted = [...scored].sort((a, b) => a.v - b.v);
  const out = new Map<string, number>();
  sorted.forEach((r, i) => out.set(r.s, sorted.length > 1 ? Math.round((i / (sorted.length - 1)) * 100) : 50));
  return out;
}

export function trendLabel(d: { change7dPct: number | null; change30dPct: number | null }): "BULLISH" | "BEARISH" | "MIXED" {
  if (d.change7dPct == null || d.change30dPct == null) return "MIXED";
  if (d.change7dPct > 0 && d.change30dPct > 0) return "BULLISH";
  if (d.change7dPct < 0 && d.change30dPct < 0) return "BEARISH";
  return "MIXED";
}

const ACTION: Record<ReturnType<typeof signalGroup>, { label: string; cls: string }> = {
  buy: { label: "BUY ZONE", cls: "is-buy" }, bet: { label: "SMALL BET", cls: "is-bet" }, watch: { label: "WATCH", cls: "is-watch" },
  wait: { label: "HOLD", cls: "is-hold" }, filtered: { label: "AVOID", cls: "is-avoid" }, outside: { label: "NO DATA", cls: "is-none" },
};

const PRIORITY: Record<ReturnType<typeof signalGroup>, number> = { buy: 0, bet: 1, watch: 2, wait: 3, filtered: 4, outside: 5 };
const TABS = ["My watchlist", "Buy signals", "Small bets", "Gainers 24h", "Losers 24h"] as const;
type Tab = (typeof TABS)[number];

function MiniGauge({ value }: { value: number }) {
  const a = Math.PI * (1 - Math.max(0, Math.min(100, value)) / 100);
  return (
    <svg viewBox="0 0 44 26" className="db-mini-gauge" aria-hidden="true">
      <path d="M4 22 A18 18 0 0 1 40 22" className="db-mg-track" />
      <path d={`M4 22 A18 18 0 0 1 ${(22 + 18 * Math.cos(a)).toFixed(2)} ${(22 - 18 * Math.sin(a)).toFixed(2)}`} className="db-mg-fill" />
    </svg>
  );
}

function CoinCard({ d, q, momentum, onAnalyze }: { d: WatchlistDecision; q: MarketQuote | undefined; momentum: number | undefined; onAnalyze: (s: string) => void }) {
  const act = ACTION[signalGroup(d)];
  const trend = trendLabel(d);
  const ch24 = q?.change24hPct ?? null;
  return (
    <article className={`db-card ${act.cls} trend-${trend.toLowerCase()}`}>
      <header>
        <span className="asset-monogram db-coin-icon" data-symbol={d.symbol} aria-hidden="true">{d.symbol.slice(0, 1)}</span>
        <div className="db-coin-id"><strong>{d.symbol}</strong><small>{d.name}</small></div>
        <div className="db-coin-px"><strong>{fmtUsd(q?.priceUsd ?? d.priceUsd)}</strong><small className={toneOf(ch24 ?? d.change7dPct)}>{ch24 != null ? `${fmtPct(ch24, 1)} 24h` : `${fmtPct(d.change7dPct, 1)} 7d`}</small></div>
      </header>
      <div className="db-card-chart">{q?.sparkline7d.length ? <Sparkline values={q.sparkline7d} width={240} height={62} /> : <span className="strategy-muted">no 7-day chart</span>}<span className={`db-trend is-${trend.toLowerCase()}`}>{trend}</span></div>
      <footer>
        <div className="db-momentum" title="Momentum rank among your watchlist: 60% 30-day + 40% 7-day return">
          <small>Momentum</small><strong>{momentum ?? "—"}<span>/100</span></strong>
        </div>
        {momentum != null ? <MiniGauge value={momentum} /> : <span />}
        <button type="button" className={`db-action ${act.cls}`} onClick={() => onAnalyze(d.symbol)} title={d.signal} aria-label={`${d.symbol}: ${d.signal}. Open analysis`}>{act.label}</button>
      </footer>
    </article>
  );
}

function FearGreedGauge({ history }: { history: MarketOverview["fearGreed"] }) {
  const now = history.at(-1);
  if (!now) return <p className="strategy-muted">Fear &amp; Greed unavailable.</p>;
  const ago = (days: number) => history[history.length - 1 - days]?.value ?? null;
  const a = Math.PI * (1 - now.value / 100);
  const x = 100 + 78 * Math.cos(a), y = 96 - 78 * Math.sin(a);
  return (
    <div className="db-fng">
      <svg viewBox="0 0 200 110" role="img" aria-label={`Fear and Greed ${now.value}, ${now.label}`}>
        <defs><linearGradient id="db-fng-grad" x1="0" x2="1"><stop offset="0" stopColor="#ef4444" /><stop offset=".45" stopColor="#f59e0b" /><stop offset=".55" stopColor="#eab308" /><stop offset="1" stopColor="#22c55e" /></linearGradient></defs>
        <path d="M22 96 A78 78 0 0 1 178 96" className="db-fng-track" />
        <path d="M22 96 A78 78 0 0 1 178 96" className="db-fng-arc" />
        <circle cx={x} cy={y} r="7" className="db-fng-knob" />
        <text x="100" y="82" textAnchor="middle" className="db-fng-num">{now.value}</text>
        <text x="100" y="102" textAnchor="middle" className="db-fng-label">{now.label}</text>
      </svg>
      <div className="db-fng-hist">{([["Yesterday", 1], ["7 days", 7], ["30 days", 30], ["90 days", 89]] as const).map(([l, d]) => { const v = ago(d); return <div key={l}><small>{l}</small><strong className={v == null ? "" : v >= 55 ? "is-gain" : v <= 45 ? "is-loss" : "is-mid"}>{v ?? "—"}</strong></div>; })}</div>
    </div>
  );
}

/** Plain-language signals built from the live report and quotes (rules, not AI). */
function engineSignals(report: StrategyReport, quotes: Record<string, MarketQuote>, fng: MarketOverview["fearGreed"]) {
  const out: Array<{ icon: string; title: string; detail: string; tone: string }> = [];
  const g = report.regime;
  out.push({ icon: "₿", title: `Bitcoin regime ${g.state.replace("_", " ")} · score ${g.score > 0 ? "+" : ""}${g.score}/5`, detail: `Price ${fmtUsd(g.close, 0)}, ${g.mayerMultiple?.toFixed(2) ?? "—"}× its 200-day average. New-risk size ${Math.round(g.exposureMultiplier * 100)}%.`, tone: g.state === "RISK_ON" ? "is-gain" : g.state === "RISK_OFF" ? "is-loss" : "" });
  const buys = report.watchlist.filter((d) => d.rotation?.status === "QUALIFIED");
  if (buys.length) out.push({ icon: "◎", title: `${buys.length} top-100 coin${buys.length > 1 ? "s" : ""} in a buy zone`, detail: buys.slice(0, 4).map((d) => `${d.symbol} limit ${fmtUsd(d.rotation?.limitPriceUsd)}`).join(" · "), tone: "is-gain" });
  const bets = report.watchlist.filter((d) => d.smallCap?.eligible).sort((a, b) => (b.smallCap?.convexityScore ?? 0) - (a.smallCap?.convexityScore ?? 0));
  if (bets[0]) out.push({ icon: "◆", title: `Top small-bet candidate: ${bets[0].symbol} (score ${bets[0].smallCap?.convexityScore})`, detail: `${bets.length} watchlist small caps passed every survival filter.`, tone: "is-gain" });
  const movers = Object.values(quotes).filter((q) => q.change24hPct != null).sort((a, b) => Math.abs(b.change24hPct!) - Math.abs(a.change24hPct!));
  if (movers[0]) out.push({ icon: "⚡", title: `Biggest 24h move: ${movers[0].symbol} ${fmtPct(movers[0].change24hPct, 1)}`, detail: `${movers[0].name} at ${fmtUsd(movers[0].priceUsd)}.`, tone: toneOf(movers[0].change24hPct) });
  const f = fng.at(-1), f7 = fng[fng.length - 8];
  if (f) out.push({ icon: "◐", title: `Fear & Greed ${f.value} (${f.label})`, detail: f7 ? `${f.value >= f7.value ? "Up" : "Down"} from ${f7.value} a week ago.` : "Market mood today.", tone: f.value >= 55 ? "is-gain" : f.value <= 45 ? "is-loss" : "" });
  const b = report.breadth;
  if (b.share != null) out.push({ icon: "≋", title: `Altcoin breadth ${Math.round(b.share * 100)}% · ${b.phase.replace("_", " ").toLowerCase()}`, detail: "Share of the top 100 beating Bitcoin over 200 days.", tone: "" });
  return out;
}

export function DashboardPage({ onOpen, onAnalyze }: { onOpen: Open; onAnalyze: (symbol: string) => void }) {
  const { data: report, error } = useApi<StrategyReport>("/api/strategy-v2", 5 * 60_000);
  const syms = report ? report.watchlist.filter((d) => d.tier !== "OUTSIDE_STRATEGY").map((d) => d.symbol).slice(0, 80).sort().join(",") : null;
  const { data: ovRaw } = useApi<Overview>(syms != null ? `/api/market-overview?symbols=${encodeURIComponent(syms)}` : null, 5 * 60_000);
  const ov = ovRaw && ovRaw.quotes && ovRaw.btc ? ovRaw : null;
  const [tab, setTab] = useState<Tab>("My watchlist");
  const [showAll, setShowAll] = useState(false);
  const momentum = useMemo(() => momentumScores(report?.watchlist ?? []), [report]);

  if (!report) return <main><section className="dashboard-panel strategy-panel" role="status"><h2>Dashboard</h2><p className="strategy-muted">{error ? `${error}. ` : ""}Loading market mood and your watchlist… (first report after a restart takes about two minutes)</p></section></main>;

  const quotes = ov?.quotes ?? {};
  const g = report.regime;
  const hour = new Date().getHours();
  const greeting = hour < 5 ? "Good night" : hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const mcapCh = ov?.global?.marketCapChange24hPct ?? null;
  const btcPx = quotes.BTC?.priceUsd ?? g.close;
  const level = btcPx ? Math.floor(btcPx / 5000) * 5000 : null;
  const fng = ov?.fearGreed ?? [];
  const opp = report.watchlist.filter((d) => ["buy", "bet"].includes(signalGroup(d))).length;
  const sentiment = g.state === "RISK_ON" ? "Bullish trend" : g.state === "RISK_OFF" ? "Bearish trend" : g.state === "NEUTRAL" ? "Neutral trend" : "Trend unknown";

  const inStrategy = report.watchlist.filter((d) => d.tier !== "OUTSIDE_STRATEGY");
  const ch24 = (d: WatchlistDecision) => quotes[d.symbol]?.change24hPct ?? null;
  const tabRows: Record<Tab, WatchlistDecision[]> = {
    "My watchlist": [...inStrategy].sort((a, b) => PRIORITY[signalGroup(a)] - PRIORITY[signalGroup(b)] || (a.rank ?? 1e9) - (b.rank ?? 1e9)),
    "Buy signals": report.watchlist.filter((d) => signalGroup(d) === "buy"),
    "Small bets": report.watchlist.filter((d) => signalGroup(d) === "bet").sort((a, b) => (b.smallCap?.convexityScore ?? 0) - (a.smallCap?.convexityScore ?? 0)),
    "Gainers 24h": inStrategy.filter((d) => (ch24(d) ?? 0) > 0).sort((a, b) => ch24(b)! - ch24(a)!),
    "Losers 24h": inStrategy.filter((d) => (ch24(d) ?? 0) < 0).sort((a, b) => ch24(a)! - ch24(b)!),
  };
  const rows = tabRows[tab];
  const shown = showAll ? rows : rows.slice(0, 8);
  const signals = engineSignals(report, quotes, fng);
  const sectors = (ov?.sectors ?? []).slice().sort((a, b) => (b.reliable ? b.change24hPct ?? -999 : -999) - (a.reliable ? a.change24hPct ?? -999 : -999));
  const maxAbs = Math.max(1, ...sectors.filter((s) => s.reliable).map((s) => Math.abs(s.change24hPct ?? 0)));

  return (
    <main className="db-page">
      <section className="db-hero-row">
        <div className="dashboard-panel db-hero">
          <h2>{greeting}, <span>Trader</span>.</h2>
          <p>{mcapCh != null ? <>The crypto market is <strong className={toneOf(mcapCh)}>{mcapCh >= 0 ? "up" : "down"} {fmtPct(Math.abs(mcapCh), 1).replace("+", "")}</strong> today. </> : null}Bitcoin's trend reads <strong>{g.state.replace("_", " ")}</strong>.</p>
          <div className="db-chips">
            <span className={`db-chip ${g.state === "RISK_ON" ? "is-gain" : g.state === "RISK_OFF" ? "is-loss" : ""}`}>{sentiment}</span>
            {level ? <span className="db-chip">BTC above {fmtUsd(level, 0)}</span> : null}
            {fng.at(-1) ? <span className="db-chip">Market mood: {fng.at(-1)!.label}</span> : null}
            <button type="button" className="db-chip is-link" onClick={() => onOpen("strategy")}>{opp} opportunit{opp === 1 ? "y" : "ies"} →</button>
          </div>
        </div>
        <div className="dashboard-panel db-overview">
          <div className="db-overview-head"><h2>Market overview</h2><span className="db-live">● Live</span></div>
          <div className="db-overview-grid">
            <div><small>Total crypto market</small><strong>{fmtBig(ov?.global?.totalMarketCapUsd)}</strong><small className={toneOf(mcapCh)}>{fmtPct(mcapCh, 1)} 24h</small></div>
            <div><small>24h volume</small><strong>{fmtBig(ov?.global?.totalVolumeUsd)}</strong><small className="strategy-muted">{ov?.global?.totalVolumeUsd == null ? "source glitch hidden" : "all coins"}</small></div>
            <div><small>BTC dominance</small><strong>{ov?.global?.btcDominancePct != null ? ov.global.btcDominancePct.toFixed(1) + "%" : "—"}</strong></div>
            <div><small>Fear &amp; Greed</small><strong>{fng.at(-1)?.value ?? "—"}</strong><small className="strategy-muted">{fng.at(-1)?.label ?? ""}</small></div>
            <div><small>Bitcoin trend</small><strong className={g.state === "RISK_ON" ? "is-gain" : g.state === "RISK_OFF" ? "is-loss" : ""}>{g.state.replace("_", " ")}</strong><small className="strategy-muted">score {g.score > 0 ? "+" : ""}{g.score}/5</small></div>
            <div><small>Altcoin season</small><strong>{report.breadth.share == null ? "—" : Math.round(report.breadth.share * 100)}<span className="db-of">/100</span></strong><small className="strategy-muted">top 100 beating BTC</small></div>
          </div>
        </div>
      </section>

      <section className="db-watch" aria-label="Watchlist analysis">
        <div className="db-watch-head">
          <h2>Watchlist analysis</h2>
          <RangeTabs options={TABS} value={tab} onChange={(t) => { setTab(t); setShowAll(false); }} label="Watchlist view" />
        </div>
        {rows.length ? <div className="db-cards">{shown.map((d) => <CoinCard key={d.symbol + d.name} d={d} q={quotes[d.symbol]} momentum={momentum.get(d.symbol)} onAnalyze={onAnalyze} />)}</div>
          : <p className="strategy-muted">Nothing in “{tab}” right now.</p>}
        {rows.length > 8 ? <button type="button" className="db-more" onClick={() => setShowAll(!showAll)}>{showAll ? "Show fewer" : `Show all ${rows.length}`}</button> : null}
      </section>

      <section className="db-bottom">
        <article className="dashboard-panel db-panel">
          <div className="db-panel-head"><h2>Engine signals</h2><button type="button" className="engine-link" onClick={() => onOpen("engine")}>Engine →</button></div>
          <ul className="db-signals">{signals.map((s) => <li key={s.title}><span className={`db-sig-icon ${s.tone}`} aria-hidden="true">{s.icon}</span><div><strong>{s.title}</strong><small>{s.detail}</small></div></li>)}</ul>
          <small className="strategy-muted">Rules applied to live data · report {new Date(report.asOf).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</small>
        </article>
        <article className="dashboard-panel db-panel">
          <div className="db-panel-head"><h2>Fear &amp; Greed index</h2></div>
          <FearGreedGauge history={fng} />
        </article>
        <article className="dashboard-panel db-panel">
          <div className="db-panel-head"><h2>Sector performance (24h)</h2></div>
          {sectors.length ? <ul className="db-sectors">{sectors.map((s) => (
            <li key={s.id} title={s.reliable ? undefined : "CoinGecko changed which coins are in this sector; the 24h figure is not comparable"}>
              <span>{s.label}</span>
              <strong className={s.reliable ? toneOf(s.change24hPct) : "strategy-muted"}>{s.reliable ? fmtPct(s.change24hPct, 1) : "n/a"}</strong>
              <div className="db-sector-bar">{s.reliable && s.change24hPct != null ? <i className={s.change24hPct >= 0 ? "is-up" : "is-down"} style={{ width: `${(Math.abs(s.change24hPct) / maxAbs) * 100}%` }} /> : null}</div>
            </li>))}</ul> : <p className="strategy-muted">Loading sectors…</p>}
          <small className="strategy-muted">Market-cap change of each CoinGecko sector</small>
        </article>
      </section>
    </main>
  );
}
