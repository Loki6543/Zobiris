// Valley Forge page: the elastic allocation (posture, target mix vs holdings), openings outside the top 100,
// volume shocks and what they led to, AI speculative coins, the daily Claude review, and stablecoin yield.
// Everything is read from /api/strategy-v2 (valleyForge section) and /api/ledger.
import { useMemo, useState } from "react";
import { fmtBig, fmtPct, fmtUsd, useApi } from "./charts";
import type { StrategyReport } from "../strategyV2/report";
import type { OpeningCandidate } from "../strategyV2/openings";
import { VOLUME_CLASS_LABEL, type VolumeClass } from "../strategyV2/volumeShock";
import { currentMix, planAllocation, SLEEVE_LABEL, type Mix, type Sleeve } from "../strategyV2/valleyForge";

export interface ForgeHolding { symbol: string; value: number }
type SignalStats = { key: string; events: number; horizons: Record<string, { n: number; avgNetPct: number | null; hitRate: number | null; avgVsBtcPct: number | null; pending: number }> };

const STABLES = new Set(["USD", "USDC", "USDT", "DAI", "USDS", "PYUSD", "FDUSD", "TUSD", "USDE", "USD1", "RLUSD"]);
const SLEEVE_COLOR: Record<Sleeve, string> = { cash: "#64748b", stableYield: "#22c55e", top100: "#3b82f6", rank101_200: "#8b5cf6", rank201_500: "#f59e0b", speculative: "#ef4444" };
const TIERS: Array<[string, string]> = [["rank101_200", "Rank 101-200"], ["rank201_500", "Rank 201-500"], ["speculative", "Beyond 500"], ["ai", "AI coins"]];
const FACTOR_LABEL: Record<string, string> = { value: "Value", dilution: "Dilution", turn: "Turn", liquidity: "Liquidity", volume: "Volume", attention: "Mindshare", legitimacy: "Legitimacy" };
const pct0 = (n: number | null | undefined) => (n == null || !Number.isFinite(n) ? "—" : `${n.toFixed(n >= 10 || n <= -10 ? 0 : 1)}%`);

function MixBar({ mix, label }: { mix: Mix; label: string }) {
  const keys = Object.keys(mix) as Sleeve[];
  return (
    <div className="forge-mixbar" role="img" aria-label={`${label}: ${keys.map((k) => `${SLEEVE_LABEL[k]} ${mix[k].toFixed(0)}%`).join(", ")}`}>
      {keys.map((k) => mix[k] > 0 ? <i key={k} style={{ width: `${mix[k]}%`, background: SLEEVE_COLOR[k] }} title={`${SLEEVE_LABEL[k]} ${mix[k].toFixed(1)}%`} /> : null)}
    </div>
  );
}

function OpeningCard({ c }: { c: OpeningCandidate }) {
  const [open, setOpen] = useState(false);
  return (
    <article className={`forge-card verdict-${c.verdict.toLowerCase()}`}>
      <div className="forge-card-head">
        <div><strong>{c.symbol}</strong> <small>#{c.rank} · {c.name}</small></div>
        <span className={`forge-verdict fv-${c.verdict.toLowerCase()}`}>{c.verdict}</span>
      </div>
      <div className="forge-card-score"><b>{c.score.toFixed(0)}</b><small>opening score</small>
        <span>{fmtUsd(c.priceUsd)} · 24h <em className={(c.change24hPct ?? 0) >= 0 ? "is-gain" : "is-loss"}>{fmtPct(c.change24hPct, 1)}</em> · 30d <em className={(c.change30dPct ?? 0) >= 0 ? "is-gain" : "is-loss"}>{fmtPct(c.change30dPct, 0)}</em></span>
      </div>
      {c.labels.length ? <div className="forge-labels">{c.labels.map((l) => <span key={l}>{VOLUME_CLASS_LABEL[l as VolumeClass] ?? l.replaceAll("_", " ").toLowerCase()}</span>)}</div> : null}
      <div className="forge-factors">
        {Object.entries(c.factors).map(([k, v]) => <div key={k}><span>{FACTOR_LABEL[k]}</span><i><b style={{ width: `${Math.round(v * 100)}%` }} /></i></div>)}
      </div>
      <dl className="forge-facts">
        <div><dt>Legitimacy</dt><dd>{c.legitimacy.grade === "UNVERIFIED" ? "not scanned yet" : `${c.legitimacy.score} · ${c.legitimacy.grade.toLowerCase()}`}</dd></div>
        <div><dt>Volume vs normal</dt><dd>{c.volume.ratio == null ? "—" : `${c.volume.ratio.toFixed(1)}×`} <small>{c.volume.source === "history" ? `${c.volume.historyDays}d history` : c.volume.source}</small></dd></div>
        <div><dt>Half-way to ATH</dt><dd>{c.upsideHalfAthPct == null ? "—" : `+${c.upsideHalfAthPct.toFixed(0)}%`}</dd></div>
        <div><dt>Mkt cap · 24h vol</dt><dd>{fmtBig(c.marketCapUsd)} · {fmtBig(c.volume24hUsd)}</dd></div>
        {c.risk ? <div><dt>Vol · CVaR95 · β</dt><dd>{pct0(c.risk.volPct)} · {pct0(c.risk.cvar95Pct)} · {c.risk.betaBtc?.toFixed(2) ?? "—"}</dd></div> : null}
        <div><dt>First tranche</dt><dd>{c.firstTranchePct}% of portfolio{c.krakenListed ? " · Kraken" : " · not on Kraken"}</dd></div>
      </dl>
      {c.ai ? <p className="forge-ai"><b>Claude review · {c.ai.verdict.toLowerCase()} {c.ai.aiScore}</b> {c.ai.thesis}</p> : null}
      {c.reasons.length ? <p className="forge-reasons">{c.reasons.map((r) => r.replaceAll("_", " ").toLowerCase()).join(" · ")}</p> : null}
      <button type="button" className="forge-more" aria-expanded={open} onClick={() => setOpen(!open)}>{open ? "Hide" : "Why this score"}</button>
      {open ? <div className="forge-why">
        {c.legitimacy.points.length ? <ul>{c.legitimacy.points.map((p) => <li key={p.label}><span>{p.label}</span><b className={p.points >= 0 ? "is-gain" : "is-loss"}>{p.points > 0 ? "+" : ""}{p.points}</b></li>)}</ul> : null}
        {c.legitimacy.redFlags.length ? <p>Red flags: {c.legitimacy.redFlags.map((r) => r.replaceAll("_", " ").toLowerCase()).join(", ")}</p> : null}
        {c.ai?.redFlags.length ? <p>Claude red flags: {c.ai.redFlags.join("; ")}</p> : null}
        {c.ai?.sources.length ? <p>Sources: {c.ai.sources.map((s, k) => <a key={s} href={s} target="_blank" rel="noopener noreferrer">[{k + 1}]</a>)}</p> : null}
      </div> : null}
    </article>
  );
}

export function ForgePage({ holdings, cashUsd, accountSynced }: { holdings: ForgeHolding[]; cashUsd: number; accountSynced: boolean }) {
  const { data: report, error } = useApi<StrategyReport>("/api/strategy-v2", 5 * 60_000);
  const { data: ledger } = useApi<{ signals?: { byClass: SignalStats[]; byVerdict: SignalStats[] } }>("/api/ledger", 30 * 60_000);
  const [tier, setTier] = useState("rank101_200");
  const [allShocks, setAllShocks] = useState(false);
  const vf = report?.valleyForge ?? null;

  const plan = useMemo(() => {
    if (!vf) return null;
    if (!accountSynced) return vf.allocation;
    const rank = new Map<string, number>();
    for (const w of report!.watchlist) if (w.rank != null) rank.set(w.symbol, w.rank);
    for (const r of report!.rotationMap) rank.set(r.symbol, r.rank);
    for (const o of vf.openings) if (!rank.has(o.symbol)) rank.set(o.symbol, o.rank);
    const mix = currentMix(holdings.map((h) => ({ symbol: h.symbol, rank: rank.get(h.symbol) ?? (h.symbol === "BTC" ? 1 : null), valueUsd: h.value, isStable: STABLES.has(h.symbol) })), cashUsd);
    return planAllocation(vf.allocation.posture, mix);
  }, [vf, report, holdings, cashUsd, accountSynced]);

  if (!report) return <main className="forge-page"><section className="dashboard-panel"><p className="strategy-muted">{error ? `Strategy report unavailable: ${error}` : "Loading the Valley Forge allocation…"}</p></section></main>;
  if (!vf || !plan) return <main className="forge-page"><section className="dashboard-panel"><p className="strategy-muted">The Valley Forge section appears after the next report refresh.</p></section></main>;

  const p = plan.posture;
  const shown = tier === "ai" ? vf.aiSpeculative : vf.openings.filter((o) => o.tier === tier);
  const byClass = ledger?.signals?.byClass ?? [];
  return (
    <main className="forge-page">
      <section className={`dashboard-panel forge-hero posture-${p.posture.toLowerCase()}`} aria-label="Valley Forge posture">
        <div>
          <span className="strategy-label">Valley Forge posture</span>
          <h1>{p.name}</h1>
          <p className="forge-doctrine">{p.doctrine}</p>
          <p>{p.mission}</p>
          <p className={p.allowNewBuys ? "is-gain" : "is-loss"}>{p.allowNewBuys ? "New deployment allowed within the targets and position caps." : "New deployment paused until the integrity check clears."}</p>
        </div>
        <ul className="forge-signals">{p.signals.map((s) => <li key={s.label} className={`is-${s.tone}`}><span>{s.label}</span><strong>{s.value}</strong></li>)}</ul>
      </section>

      <section className="dashboard-panel forge-panel" aria-label="Target allocation">
        <div className="engine-panel-head"><h2>Target allocation</h2><span className="strategy-muted">cash band 10-60% · base is your 30 / 8 / 27 / 20 / 10 / 5 mix</span></div>
        <div className="forge-mixes">
          <div><span className="strategy-label">Base mix</span><MixBar mix={plan.base} label="Base mix" /></div>
          <div><span className="strategy-label">Target now ({p.posture.toLowerCase()})</span><MixBar mix={plan.target} label="Target now" /></div>
          {plan.current ? <div><span className="strategy-label">Your portfolio</span><MixBar mix={plan.current} label="Your portfolio" /></div> : null}
        </div>
        <div className="forge-rows">
          {plan.rows.map((r) => (
            <div key={r.sleeve} className="forge-row">
              <span className="forge-swatch" style={{ background: SLEEVE_COLOR[r.sleeve] }} aria-hidden="true" />
              <strong>{r.label}</strong>
              <span>base {r.basePct}%</span>
              <span>target <b>{r.targetPct}%</b></span>
              <span>{r.currentPct == null ? "—" : `now ${r.currentPct.toFixed(1)}%`}</span>
              <small>{r.positionCapPct ? `max ${r.positionCapPct}% per coin (≥${r.minPositions} coins) · ` : ""}{plan.current ? r.action : "Link the private account to see gaps"}</small>
            </div>
          ))}
        </div>
        <p className="strategy-muted">{plan.tranches.note}{plan.capitulationStepPct ? ` In capitulation the move to target is spread over weekly steps of ${plan.capitulationStepPct}%.` : ""} Rebalance only when a sleeve drifts 4+ points.</p>
      </section>

      <section className="dashboard-panel forge-panel" aria-label="Openings">
        <div className="engine-panel-head"><h2>Openings outside the top 100</h2><span className="strategy-muted">{vf.universe.scored} coins scored · value, dilution, turn, liquidity, volume, mindshare, legitimacy</span></div>
        <div className="forge-tabs" role="tablist">{TIERS.map(([k, label]) => <button key={k} type="button" role="tab" aria-selected={tier === k} onClick={() => setTier(k)}>{label}</button>)}</div>
        {shown.length ? <div className="forge-cards">{shown.map((c) => <OpeningCard key={c.geckoId} c={c} />)}</div> : <p className="strategy-muted">No coins in this band pass the liquidity and age filters right now.</p>}
      </section>

      <section className="engine-grid">
        <article className="dashboard-panel engine-panel" aria-label="Volume shocks">
          <div className="engine-panel-head"><h2>Volume shocks</h2><span className="strategy-muted">{vf.universe.historyDays >= 7 ? `vs each coin's ${vf.universe.historyDays}-day history` : "vs its rank band until 7 days of history exist"}</span></div>
          {vf.volumeShocks.length ? <ul className="forge-shocks">{vf.volumeShocks.slice(0, allShocks ? undefined : 12).map((s) => (
            <li key={s.symbol + s.class}><strong>{s.symbol}</strong><small>#{s.rank}</small><span className={`forge-class is-${s.class.toLowerCase()}`}>{VOLUME_CLASS_LABEL[s.class as VolumeClass]}</span><b>{s.ratio?.toFixed(1)}×</b><em className={(s.change24hPct ?? 0) >= 0 ? "is-gain" : "is-loss"}>{fmtPct(s.change24hPct, 1)}</em></li>
          ))}</ul> : <p className="strategy-muted">No unusual volume outside the top 100 right now.</p>}
          {vf.volumeShocks.length > 12 ? <button type="button" className="forge-more" aria-expanded={allShocks} onClick={() => setAllShocks(!allShocks)}>{allShocks ? "Show fewer" : `Show all ${vf.volumeShocks.length}`}</button> : null}
        </article>
        <article className="dashboard-panel engine-panel" aria-label="What volume shocks led to">
          <div className="engine-panel-head"><h2>What each shock led to</h2><span className="strategy-muted">forward test, net of costs</span></div>
          {byClass.length ? <ul className="forge-stats">{byClass.map((s) => {
            const h7 = s.horizons["7d"], h30 = s.horizons["30d"];
            return <li key={s.key}><strong>{VOLUME_CLASS_LABEL[s.key as VolumeClass] ?? s.key}</strong><small>{s.events} event{s.events === 1 ? "" : "s"}</small>
              <span>7d {h7?.n ? fmtPct(h7.avgNetPct, 1) : `${h7?.pending ?? 0} pending`}</span>
              <span>30d {h30?.n ? fmtPct(h30.avgNetPct, 1) : `${h30?.pending ?? 0} pending`}</span>
              <span>hit {h30?.hitRate == null ? "—" : `${Math.round(h30.hitRate * 100)}%`}</span>
              <span>vs BTC {fmtPct(h30?.avgVsBtcPct, 1)}</span></li>;
          })}</ul> : <p className="strategy-muted">Recording starts with today's report; 7-day results appear after a week, 30-day after a month.</p>}
        </article>
      </section>

      <section className="engine-grid">
        <article className="dashboard-panel engine-panel" aria-label="Stablecoin yield">
          <div className="engine-panel-head"><h2>Stablecoin yield sleeve</h2><span className="strategy-muted">DefiLlama · single-asset, no IL, TVL ≥ $25M</span></div>
          {vf.stableYield.length ? <ul className="forge-yields">{vf.stableYield.map((y) => (
            <li key={y.pool}><div><a href={y.url} target="_blank" rel="noopener noreferrer">{y.project}</a> <small>{y.symbol} · {y.chain}{y.optimizer ? " · optimizer" : ""}{y.synthetic ? " · synthetic" : ""}</small></div>
              <span>TVL {fmtBig(y.tvlUsd)}</span><span>30d APY {pct0(y.apyMean30d ?? y.apy)}</span><b>risk-adj. {pct0(y.riskAdjApy)}</b></li>
          ))}</ul> : <p className="strategy-muted">Yield data unavailable right now.</p>}
          <p className="strategy-muted">Spread the sleeve over 3+ pools, no protocol above 40% of it. Issuer, smart-contract and depeg risk remain.</p>
        </article>
        <article className="dashboard-panel engine-panel" aria-label="Claude review">
          <div className="engine-panel-head"><h2>Daily Claude review</h2><span className="strategy-muted">{vf.aiWatchlist.generatedAt ? `${new Date(vf.aiWatchlist.generatedAt).toLocaleString()}${vf.aiWatchlist.stale ? " · stale" : ""}` : "first review not published yet"}</span></div>
          {vf.aiWatchlist.items.length ? <ul className="forge-ai-list">{vf.aiWatchlist.items.slice(0, 12).map((a) => (
            <li key={a.symbol}><div><strong>{a.symbol}</strong> <span className={`forge-verdict fv-${a.verdict.toLowerCase()}`}>{a.verdict}</span> <small>AI {a.aiScore}{a.socialScore != null ? ` · social ${a.socialScore}` : ""} · mindshare {a.mindshareTrend.toLowerCase()}{a.narrative ? ` · ${a.narrative}` : ""}</small></div><p>{a.thesis}</p></li>
          ))}</ul> : <p className="strategy-muted">CoinMarketCap trends and mindshare, social legitimacy, white paper and team checks for the top candidates. It can veto a coin or nudge its score, never override a failed check.</p>}
        </article>
      </section>
      <p className="visual-footnote">Research output, not orders. Scores rank candidates; the forward test shows whether they work. Every position has a known maximum loss: its stake.</p>
    </main>
  );
}
