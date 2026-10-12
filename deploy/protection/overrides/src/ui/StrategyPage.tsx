import { useEffect, useMemo, useState } from "react";
import type { StrategyReport, WatchlistDecision } from "../strategyV2/report";
import { planBarbell, type SpeculativePosition } from "../strategyV2/barbell";

export interface StrategyHolding { symbol: string; quantity: number; avgPriceUsd: number | null; value: number }

const money = (n: number | null | undefined) => n == null || !Number.isFinite(n) ? "—" : n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: n < 1 ? 6 : 2 });
const pct = (n: number | null | undefined) => n == null || !Number.isFinite(n) ? "—" : (n > 0 ? "+" : "") + n.toFixed(1) + "%";
const tone = (n: number | null | undefined) => n == null ? undefined : n >= 0 ? "is-gain" : "is-loss";
const SEC_LABEL = { PASS: "Passed", WARN: "Warning", FAIL: "Failed", NATIVE: "Native coin", UNSUPPORTED_CHAIN: "Not scannable", UNCHECKED: "Pending" } as const;
const TIER_LABEL = { TOP_100: "Top 100", RANK_101_500: "101–500", OUTSIDE_STRATEGY: "500+" } as const;
type Filter = "ALL" | keyof typeof TIER_LABEL;

function signalClass(d: WatchlistDecision) {
  if (d.rotation?.status === "QUALIFIED" || d.smallCap?.eligible) return "strategy-pill is-buy";
  if (d.rotation?.status === "NEAR_ROTATION") return "strategy-pill is-watch";
  if (d.rotation?.status === "STRUCTURALLY_WEAK" || d.tier === "OUTSIDE_STRATEGY") return "strategy-pill is-avoid";
  return "strategy-pill";
}

export function StrategyPage({ portfolioUsd, holdings, accountSynced }: { portfolioUsd: number; holdings: StrategyHolding[]; accountSynced: boolean }) {
  const [report, setReport] = useState<StrategyReport | null>(null);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<Filter>("ALL");
  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const r = await fetch("/api/strategy-v2");
        if (!r.ok) throw new Error((await r.json().catch(() => null))?.error ?? "Strategy data unavailable");
        const d = await r.json();
        if (active) { setReport(d); setError(""); }
      } catch (e) { if (active) setError(String(e instanceof Error ? e.message : e)); }
    };
    void load();
    const t = setInterval(() => void load(), 5 * 60_000);
    return () => { active = false; clearInterval(t); };
  }, []);

  const barbell = useMemo(() => {
    if (!report || !accountSynced || !(portfolioUsd > 0)) return null;
    const smallCapSymbols = new Set(report.watchlist.filter((w) => w.tier === "RANK_101_500").map((w) => w.symbol));
    const positions: SpeculativePosition[] = holdings.filter((h) => smallCapSymbols.has(h.symbol))
      .map((h) => ({ symbol: h.symbol, costUsd: h.avgPriceUsd ? h.avgPriceUsd * h.quantity : h.value, valueUsd: h.value }));
    return { plan: planBarbell(portfolioUsd, positions, report.regime.exposureMultiplier), positions };
  }, [report, holdings, portfolioUsd, accountSynced]);

  if (error && !report) return <main><section className="dashboard-panel strategy-panel" role="status"><h2>Opportunities</h2><p className="strategy-muted">{error}. The free market feeds refresh every 15 minutes; first load can take about two minutes.</p></section></main>;
  if (!report) return <main><section className="dashboard-panel strategy-panel" role="status"><p className="strategy-muted">Loading market direction and watchlist…</p></section></main>;

  const g = report.regime;
  const rows = report.watchlist.filter((w) => filter === "ALL" || w.tier === filter);
  const counts = { ALL: report.watchlist.length, TOP_100: 0, RANK_101_500: 0, OUTSIDE_STRATEGY: 0 } as Record<Filter, number>;
  report.watchlist.forEach((w) => { counts[w.tier]++; });

  return (
    <main className="strategy-page">
      <section className="strategy-kpis" aria-label="Bitcoin market direction">
        <article className={`dashboard-panel strategy-regime is-${g.state.toLowerCase()}`}>
          <span className="strategy-label">Bitcoin direction</span>
          <strong>{g.state.replace("_", " ")}</strong>
          <small>Trend score {g.score > 0 ? "+" : ""}{g.score} / 5 · {g.reasons.filter((r) => !r.startsWith("HIGH_VOL")).slice(0, 2).map((r) => r.replaceAll("_", " ").toLowerCase()).join(" · ")}</small>
        </article>
        <article className="dashboard-panel"><span className="strategy-label">BTC vs 200-day average</span><strong>{g.mayerMultiple ? g.mayerMultiple.toFixed(2) + "×" : "—"}</strong><small>{money(g.close)} · 200D {money(g.sma200)}</small></article>
        <article className="dashboard-panel"><span className="strategy-label">New-risk size</span><strong>{Math.round(g.exposureMultiplier * 100)}%</strong><small>30d volatility {g.realizedVolAnnualPct ? g.realizedVolAnnualPct.toFixed(0) + "%" : "—"} · {g.drawdownFrom365dHighPct != null ? pct(g.drawdownFrom365dHighPct) + " from 1y high" : ""}</small></article>
        <article className="dashboard-panel"><span className="strategy-label">Altcoin breadth</span><strong>{report.breadth.share == null ? "—" : Math.round(report.breadth.share * 100) + "%"}</strong><small>Top 100 beating BTC over 200d · {report.breadth.phase.replace("_", " ").toLowerCase()}</small></article>
      </section>

      <section className="dashboard-columns strategy-columns">
        <article className="dashboard-panel strategy-panel">
          <h2>What the regime allows</h2>
          <ul className="strategy-rules">
            <li className={g.allowTop100Rotation ? "is-on" : "is-off"}>Top-100 delayed rotation {g.allowTop100Rotation ? (g.state === "NEUTRAL" ? "— half size" : "— allowed") : "— paused"}</li>
            <li className={g.allowSmallCapBets ? "is-on" : "is-off"}>Rank 101–500 small bets {g.allowSmallCapBets ? "— allowed" : "— paused until RISK ON"}</li>
            <li className="is-on">No leverage · no averaging down · stake is the stop</li>
          </ul>
        </article>
        <article className="dashboard-panel strategy-panel" aria-label="Small-cap sleeve">
          <h2>Small-cap sleeve (barbell)</h2>
          {barbell ? <div className="strategy-sleeve">
            <div><span className="strategy-label">Sleeve budget (10%)</span><strong>{money(barbell.plan.sleeveBudgetUsd)}</strong></div>
            <div><span className="strategy-label">Committed at cost</span><strong>{money(barbell.plan.sleeveCommittedUsd)}</strong></div>
            <div><span className="strategy-label">Next bet size</span><strong>{barbell.plan.canOpenNewBet ? money(barbell.plan.betSizeUsd) : "None"}</strong></div>
            <div><span className="strategy-label">Open slots</span><strong>{barbell.plan.slotsOpen} / 8</strong></div>
            {!barbell.plan.canOpenNewBet ? <p className="strategy-muted">{barbell.plan.reasons.map((r) => r.replaceAll("_", " ").toLowerCase()).join(" · ")}</p> : null}
          </div> : <p className="strategy-muted">Unlock your portfolio to size bets (max 1.5% of portfolio each, 10% total).</p>}
          <p className="strategy-muted">Take profits: sell half at 2× (stake back), 25% at 5×, 15% at 10×, keep a 10% runner.</p>
        </article>
      </section>

      <section className="dashboard-panel strategy-panel" aria-label="Watchlist decisions">
        <div className="strategy-head">
          <div><h2>Your watchlist</h2><p className="strategy-muted">CoinMarketCap “Coins” list · {report.watchlist.length} coins · as of {new Date(report.asOf).toLocaleString()}</p></div>
          <div className="watch-categories strategy-filters">{(["ALL", "TOP_100", "RANK_101_500", "OUTSIDE_STRATEGY"] as Filter[]).map((f) =>
            <button key={f} type="button" aria-pressed={filter === f} onClick={() => setFilter(f)}>{f === "ALL" ? "All" : TIER_LABEL[f as keyof typeof TIER_LABEL]} ({counts[f]})</button>)}</div>
        </div>
        <div className="strategy-scroll">
          <table className="strategy-table">
            <thead><tr><th>Asset</th><th>Rank</th><th>Price</th><th>7d</th><th>30d</th><th>From ATH</th><th>Kraken</th><th>Contract</th><th>Signal</th><th>Entry limit</th></tr></thead>
            <tbody>{rows.map((d) => (
              <tr key={d.symbol + d.name}>
                <td className="strategy-asset"><span className="asset-identity"><span className="asset-monogram" data-symbol={d.symbol} aria-hidden="true">{d.symbol.slice(0, 1)}</span><span><strong>{d.symbol}</strong><small className="strategy-muted"> {d.name}</small></span></span></td>
                <td data-label="Rank">{d.rank ?? "—"}</td>
                <td data-label="Price">{money(d.priceUsd)}</td>
                <td data-label="7d" className={tone(d.change7dPct)}>{pct(d.change7dPct)}</td>
                <td data-label="30d" className={tone(d.change30dPct)}>{pct(d.change30dPct)}</td>
                <td data-label="From ATH">{pct(d.athChangePct)}</td>
                <td data-label="Kraken">{d.krakenListed ? "Yes" : "—"}</td>
                <td data-label="Contract">{d.diligence ? <span className={`strategy-sec is-${d.diligence.security.status.toLowerCase()}`} title={[...d.diligence.security.vetoes, ...d.diligence.security.warnings].map((x) => x.replaceAll("_", " ").toLowerCase()).join(", ") + (d.diligence.commits12w != null ? ` · ${d.diligence.commits12w} commits in 12 weeks (listed repo)` : "")}>{SEC_LABEL[d.diligence.security.status]}</span> : "—"}</td>
                <td className="strategy-signal" data-label="Signal"><span className={signalClass(d)} title={[...(d.rotation?.reasons ?? []), ...(d.smallCap?.rejections ?? []), ...(d.smallCap?.notes ?? []), d.matchNote ?? ""].filter(Boolean).join(", ")}>{d.signal}</span></td>
                <td data-label="Entry limit">{d.rotation?.limitPriceUsd ? <>{money(d.rotation.limitPriceUsd)} <small className="strategy-muted">−{d.rotation.pullbackPct?.toFixed(0)}%</small></> : "—"}</td>
              </tr>))}</tbody>
          </table>
        </div>
      </section>

      <section className="dashboard-panel strategy-panel" aria-label="Market small-cap candidates">
        <h2>Best rank 101–500 candidates in the whole market</h2>
        <p className="strategy-muted">Passed every survival filter (Kraken-listed, liquid, real volume, low dilution, 180+ days old, stopped falling). Score ranks asymmetry; it is not a probability.</p>
        {report.marketSmallCapCandidates.length ? <ol className="strategy-candidates">{report.marketSmallCapCandidates.map((c) =>
          <li key={c.symbol}><strong>{c.symbol}</strong> <span className="strategy-muted">{c.name} · rank {c.rank}</span><span className="strategy-score">{c.convexityScore}</span></li>)}</ol>
          : <p className="strategy-muted">{g.allowSmallCapBets ? "No coin passes every filter right now." : "Paused: small-cap bets only open when Bitcoin is RISK ON."}</p>}
      </section>
    </main>
  );
}
