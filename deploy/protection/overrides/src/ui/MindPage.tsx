// Mind page: the engine shown as a mind at work. What it believes and how sure it is, what would change its posture,
// where its attention is across the 1,000-coin universe, what is coming, what it got wrong, and where Claude disagrees.
// Read-only: everything comes from /api/strategy-v2, /api/bitcoin and /api/ledger; nothing here places orders.
import { useMemo, useState } from "react";
import "./mind.css";
import "./neural.css";
import { fmtPct, fmtUsd, useApi } from "./charts";
import type { StrategyReport } from "../strategyV2/report";
import type { OpeningCandidate } from "../strategyV2/openings";
import type { Forecast, ScoreStats } from "../strategyV2/btcForecast";
import { currentMix, planAllocation, SLEEVE_LABEL, type Sleeve } from "../strategyV2/valleyForge";
import { beliefDimmed, disagreements, forecastMisses, postureTriggers, radarLayout, type RadarDot } from "../strategyV2/mind";
import { OpeningCard, type ForgeHolding } from "./ForgePage";

type BtcReport = { asOf: string; forecast: Forecast | null; score: Record<string, ScoreStats>; recordedDays: number; fearGreed: number | null };
type SignalStats = { key: string; events: number; horizons: Record<string, { n: number; avgNetPct: number | null; hitRate: number | null; pending: number }> };
type Ledger = { summary?: { days: number; lastDay: string | null }; signals?: { byClass: SignalStats[]; byVerdict: SignalStats[] } };

const STABLES = new Set(["USD", "USDC", "USDT", "DAI", "USDS", "PYUSD", "FDUSD", "TUSD", "USDE", "USD1", "RLUSD"]);
const SLEEVE_COLOR: Record<Sleeve, string> = { cash: "#64748b", stableYield: "#22c55e", top100: "#3b82f6", rank101_200: "#8b5cf6", rank201_500: "#f59e0b", speculative: "#ef4444" };
const TIER_LABEL: Record<RadarDot["tier"], string> = { rank101_200: "Rank 101-200", rank201_500: "Rank 201-500", speculative: "Beyond 500" };
const POSTURE_HUE: Record<string, string> = { RECOVERY: "#2eeccf", TRANSITION: "#60a5fa", EXPLORATION: "#a78bfa", EUPHORIA: "#f59e0b", DETERIORATION: "#fb7185", CAPITULATION: "#38bdf8", INTEGRITY: "#ef4444" };
const pct = (n: number | null | undefined, d = 0) => (n == null || !Number.isFinite(n) ? "—" : `${(n * 100).toFixed(d)}%`);

/** Cash dial: the 10-60% elastic band as a track, the current cash target as the lit arc. */
function PostureRing({ posture, cashPct, hue }: { posture: string; cashPct: number; hue: string }) {
  const R = 54, C = 2 * Math.PI * R, sweep = 0.75; // 270° gauge
  const arc = (from: number, to: number) => ({ strokeDasharray: `${((to - from) / 100) * C * sweep} ${C}`, strokeDashoffset: -((from / 100) * C * sweep) });
  return (
    <svg className="mind-ring" viewBox="0 0 140 140" role="img" aria-label={`${posture} posture, cash target ${cashPct.toFixed(0)}% of a 10 to 60% band`}>
      <circle cx="70" cy="70" r="67" fill="none" stroke="#22d3ee" strokeOpacity=".28" strokeWidth=".8" />
      <g className="mind-ring-orbit"><circle cx="70" cy="70" r="62" fill="none" stroke="#67e8f9" strokeOpacity=".4" strokeWidth="1" strokeDasharray="1 7" /></g>
      <g className="mind-ring-orbit is-rev"><circle cx="70" cy="70" r="43" fill="none" stroke="#8b5cf6" strokeOpacity=".5" strokeWidth="1" strokeDasharray="14 9" /></g>
      <g transform="rotate(135 70 70)">
        <circle cx="70" cy="70" r={R} fill="none" stroke="#17264a" strokeWidth="9" strokeDasharray={`${C * sweep} ${C}`} />
        <circle cx="70" cy="70" r={R} fill="none" stroke="#2a3f6b" strokeWidth="9" style={arc(10, 60)} />
        <circle cx="70" cy="70" r={R} fill="none" stroke={hue} strokeWidth="9" strokeLinecap="round" style={arc(0, cashPct)} className="mind-ring-live" />
      </g>
      <text x="70" y="66" textAnchor="middle" className="mind-ring-big">{cashPct.toFixed(0)}%</text>
      <text x="70" y="84" textAnchor="middle" className="mind-ring-small">cash target</text>
    </svg>
  );
}

function Radar({ dots, pick, onPick }: { dots: RadarDot[]; pick: string | null; onPick: (s: string | null) => void }) {
  const S = 300, c = S / 2, scale = 136;
  // A faint web joins each strong opening to its nearest stronger neighbours: the "neural" read of where attention clusters.
  const ranked = [...dots].filter((d) => !d.vetoed).sort((a, b) => b.score - a.score).slice(0, 14);
  const webLinks = ranked.flatMap((a, i) => ranked.slice(0, i).map((b) => ({ a, b, d: Math.hypot(a.x - b.x, a.y - b.y) })).sort((x, y) => x.d - y.d).slice(0, 2));
  return (
    <div className="mind-sphere"><svg className="mind-radar" viewBox={`0 0 ${S} ${S}`} role="img" aria-label="Attention field: openings placed by score; vetoed coins on the rim">
      {[0.33, 0.66, 1].map((r) => <circle key={r} cx={c} cy={c} r={r * scale} fill="none" stroke={r === 1 ? "#22d3ee" : "#14485c"} strokeOpacity={r === 1 ? 0.55 : 1} strokeDasharray={r === 1 ? "0" : "3 4"} />)}
      {[0.45, 0.75].map((k) => <ellipse key={k} className="mind-meridian" cx={c} cy={c} rx={scale * k} ry={scale} />)}
      {webLinks.map((l, k) => <path key={k} className="mind-web" d={`M${c + l.a.x * scale} ${c + l.a.y * scale} Q${c + (l.a.x + l.b.x) * scale * 0.3} ${c + (l.a.y + l.b.y) * scale * 0.3} ${c + l.b.x * scale} ${c + l.b.y * scale}`} />)}
      {[-90, 30, 150].map((a) => <line key={a} x1={c} y1={c} x2={c + Math.cos((a * Math.PI) / 180) * scale} y2={c + Math.sin((a * Math.PI) / 180) * scale} stroke="#1b2d52" />)}
      <text x={c + 70} y={c - 118} className="mind-radar-label">101-200</text>
      <text x={c + 60} y={c + 125} className="mind-radar-label">201-500</text>
      <text x={c - 135} y={c + 4} className="mind-radar-label">500+</text>
      {dots.map((d) => (
        <g key={d.symbol} className={`mind-dot is-${d.verdict.toLowerCase()}${pick === d.symbol ? " is-picked" : ""}${d.shock !== "NORMAL" ? " is-shock" : ""}`} onClick={() => onPick(pick === d.symbol ? null : d.symbol)} role="button" tabIndex={0} aria-label={`${d.symbol} rank ${d.rank}, ${d.verdict.toLowerCase()}, score ${d.score.toFixed(0)}`} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onPick(pick === d.symbol ? null : d.symbol); } }}>
          {d.shock !== "NORMAL" ? <circle cx={c + d.x * scale} cy={c + d.y * scale} r={d.r * scale + 6} className="mind-dot-ripple" /> : null}
          <circle cx={c + d.x * scale} cy={c + d.y * scale} r={d.r * scale} />
          {d.labelled || pick === d.symbol ? <text x={c + d.x * scale} y={c + d.y * scale + d.labelSide * (d.r * scale + 5) + (d.labelSide > 0 ? 7 : 0)} textAnchor="middle">{d.symbol}</text> : null}
        </g>
      ))}
    </svg></div>
  );
}

export function MindPage({ holdings, cashUsd, accountSynced, onOpen }: { holdings: ForgeHolding[]; cashUsd: number; accountSynced: boolean; onOpen: (view: string) => void }) {
  const { data: report, error } = useApi<StrategyReport>("/api/strategy-v2", 5 * 60_000);
  const { data: btc } = useApi<BtcReport>("/api/bitcoin", 10 * 60_000);
  const { data: ledger } = useApi<Ledger>("/api/ledger", 30 * 60_000);
  const [pick, setPick] = useState<string | null>(null);
  const vf = report?.valleyForge ?? null;

  const plan = useMemo(() => {
    if (!vf) return null;
    if (!accountSynced) return vf.allocation;
    const rank = new Map<string, number>();
    for (const w of report!.watchlist) if (w.rank != null) rank.set(w.symbol, w.rank);
    for (const r of report!.rotationMap) rank.set(r.symbol, r.rank);
    for (const o of vf.openings) if (!rank.has(o.symbol)) rank.set(o.symbol, o.rank);
    return planAllocation(vf.allocation.posture, currentMix(holdings.map((h) => ({ symbol: h.symbol, rank: rank.get(h.symbol) ?? (h.symbol === "BTC" ? 1 : null), valueUsd: h.value, isStable: STABLES.has(h.symbol) })), cashUsd));
  }, [vf, report, holdings, cashUsd, accountSynced]);
  const universe = useMemo(() => (vf ? [...vf.openings, ...vf.aiSpeculative.filter((a) => !vf.openings.some((o) => o.geckoId === a.geckoId))] : []), [vf]);
  const dots = useMemo(() => radarLayout(universe), [universe]);
  const picked: OpeningCandidate | null = pick ? universe.find((c) => c.symbol === pick) ?? null : null;

  if (!report) return <main className="mind-page"><section className="dashboard-panel"><p className="strategy-muted">{error ? `Strategy report unavailable: ${error}` : "Waking up: reading the market…"}</p></section></main>;
  if (!vf || !plan) return <main className="mind-page"><section className="dashboard-panel"><p className="strategy-muted">The mind view appears after the next report refresh.</p></section></main>;

  const p = plan.posture, hue = POSTURE_HUE[p.posture] ?? "#2eeccf";
  const triggers = postureTriggers({ posture: p.posture, fearGreed: btc?.fearGreed ?? null, mayerMultiple: report.regime.mayerMultiple, drawdownFrom365dHighPct: report.regime.drawdownFrom365dHighPct, btcClose: report.regime.close, sma200: report.regime.sma200, stablecoinChange30dPct: report.altGate.stablecoinChange30dPct, breadth30dPositive: report.altGate.breadth30dPositive });
  const f = btc?.forecast ?? null;
  const today = (btc?.asOf ?? report.asOf).slice(0, 10);
  const misses = forecastMisses(btc?.score?.["1d"]?.recent ?? [], today, 7);
  const disagree = disagreements(universe);
  const byClass = (ledger?.signals?.byClass ?? []).filter((s) => s.events >= 3).slice(0, 6);
  const feedsDown = report.feeds.filter((x) => !x.ok);
  const horizonOf = (days: number) => (btc?.score ? btc.score[`${days}d`] : undefined);

  return (
    <main className="mind-page">
      <section className={`dashboard-panel mind-hero posture-${p.posture.toLowerCase()}`} aria-label="State of mind" style={{ ["--mind-hue" as string]: hue }}>
        <PostureRing posture={p.name} cashPct={plan.target.cash} hue={hue} />
        <div className="mind-hero-text">
          <span className="strategy-label">State of mind</span>
          <h1>{p.name}</h1>
          <p className="mind-doctrine">{p.doctrine}</p>
          <p className={p.allowNewBuys ? "is-gain" : "is-loss"}>{p.allowNewBuys ? "Deploying within targets and caps, in tranches." : "No new deployment until the integrity check clears."}</p>
          <ul className="mind-signals">{p.signals.map((s) => <li key={s.label} className={`is-${s.tone}`}><span>{s.label}</span><strong>{s.value}</strong></li>)}</ul>
        </div>
        <div className="mind-triggers">
          <span className="strategy-label">What would change my mind</span>
          {triggers.length ? <ul>{triggers.map((t) => <li key={t.to + t.condition} className={t.near ? "is-near" : ""}><b style={{ color: POSTURE_HUE[t.to] }}>→ {t.to.toLowerCase()}</b><span>{t.condition}</span><small>{t.distance}</small></li>)}</ul> : <p className="strategy-muted">Trigger distances appear once regime and gate data are complete.</p>}
        </div>
      </section>

      <section className="dashboard-panel mind-panel" aria-label="Beliefs">
        <div className="engine-panel-head"><h2>Beliefs</h2><span className="strategy-muted">probabilities with their own track record · a tile dims when it is no better than a coin flip</span></div>
        <div className="mind-beliefs">
          {f ? f.horizons.map((h) => { const sc = horizonOf(h.days); const dim = beliefDimmed(sc?.brier ?? null, sc?.n ?? 0); return (
            <article key={h.days} className={`mind-belief${dim ? " is-dim" : ""}${h.pUp >= 0.55 ? " is-up" : h.pUp <= 0.45 ? " is-down" : ""}`}>
              <span className="strategy-label">Bitcoin up in {h.days} day{h.days > 1 ? "s" : ""}</span>
              <b>{pct(h.pUp)}</b>
              <small>68% range {fmtUsd(h.low, 0)} – {fmtUsd(h.high, 0)}</small>
              <em>{sc && sc.n ? `${sc.n} scored · hit ${pct(sc.hitRate)} · Brier ${sc.brier?.toFixed(3) ?? "—"} vs 0.250 coin flip` : "no scored days yet"}</em>
              {dim ? <i>dimmed: not beating a coin flip</i> : null}
            </article>); }) : <article className="mind-belief"><span className="strategy-label">Bitcoin forecast</span><b>—</b><small>needs 210 daily closes</small></article>}
          <article className={`mind-belief ${report.altGate.allowAltEntries ? "is-up" : "is-down"}`}>
            <span className="strategy-label">Altcoin gate</span>
            <b>{report.altGate.allowAltEntries ? "open" : "closed"}</b>
            <small>{report.altGate.state.replaceAll("_", " ").toLowerCase()}</small>
            <em>dominance {report.altGate.dominanceChange30dPts == null ? "—" : `${report.altGate.dominanceChange30dPts > 0 ? "+" : ""}${report.altGate.dominanceChange30dPts.toFixed(1)} pts`} · stablecoins {fmtPct(report.altGate.stablecoinChange30dPct, 1)} · breadth {pct(report.altGate.breadth30dPositive)}</em>
          </article>
          <article className={`mind-belief ${report.regime.state === "RISK_ON" ? "is-up" : report.regime.state === "RISK_OFF" ? "is-down" : ""}`}>
            <span className="strategy-label">Bitcoin regime</span>
            <b>{report.regime.state.replaceAll("_", " ").toLowerCase()}</b>
            <small>trend score {report.regime.score > 0 ? "+" : ""}{report.regime.score} of ±5</small>
            <em>exposure multiplier {report.regime.exposureMultiplier.toFixed(2)} · realized vol {report.regime.realizedVolAnnualPct?.toFixed(0) ?? "—"}%</em>
          </article>
        </div>
      </section>

      <section className="dashboard-panel mind-panel" aria-label="Attention field">
        <div className="engine-panel-head"><h2>Attention field</h2><span className="strategy-muted">{vf.universe.scored} coins scored · closer to the centre = stronger opening · rim = vetoed · rings = volume shock</span></div>
        <div className="mind-field">
          <Radar dots={dots} pick={pick} onPick={setPick} />
          <div className="mind-field-side">
            {picked ? <OpeningCard c={picked} /> : <>
              <p className="strategy-muted">Tap a coin for the why. Size is market cap; colour is the verdict.</p>
              <ol className="mind-top">{[...universe].sort((a, b) => b.score - a.score).slice(0, 8).map((c) => <li key={c.geckoId}><button type="button" onClick={() => setPick(c.symbol)}><i className={`mind-top-bar${c.verdict === "AVOID" ? " is-avoid" : ""}`} style={{ width: `${Math.max(4, Math.min(100, c.score)) * 0.52}%` }} aria-hidden="true" /><strong>{c.symbol}</strong><small>#{c.rank} · {TIER_LABEL[c.tier]}</small><span className={`forge-verdict fv-${c.verdict.toLowerCase()}`}>{c.verdict}</span><b>{c.score.toFixed(0)}</b></button></li>)}</ol>
              <button type="button" className="forge-more" onClick={() => onOpen("forge")}>Open the full Valley Forge view</button>
            </>}
          </div>
        </div>
      </section>

      <section className="engine-grid">
        <article className="dashboard-panel engine-panel" aria-label="Event horizon">
          <div className="engine-panel-head"><h2>Event horizon</h2><span className="strategy-muted">ranked by measured price impact, not headline size</span></div>
          {f?.eventRisk.length ? <p className="mind-event-risk">Forecast ranges widened: {f.eventRisk.join(", ")}</p> : null}
          {vf.exchangeAlerts?.length ? <ul className="mind-events">{vf.exchangeAlerts.slice(0, 10).map((a) => <li key={a.symbol + a.kind + a.at} className={`is-${a.kind.toLowerCase()}`}><time>{a.at.slice(0, 10)}</time><strong>{a.symbol}</strong><span>{a.exchange} {a.kind.replaceAll("_", " ").toLowerCase()}</span></li>)}</ul> : <p className="strategy-muted">No delistings, monitoring tags or new listings on Binance or Upbit in the last 30 days for scored coins.</p>}
          <p className="mind-noise"><b>Noise bin.</b> Partnership announcements, airdrop teasers, influencer calls and "massive news coming" posts are not inputs: the research found no measurable, repeatable price effect, so the engine does not read them.</p>
        </article>
        <article className="dashboard-panel engine-panel" aria-label="The mirror">
          <div className="engine-panel-head"><h2>The mirror</h2><span className="strategy-muted">what I was wrong about this week</span></div>
          {misses.length ? <ul className="mind-misses">{misses.map((m) => <li key={m.day}><time>{m.day}</time><span>said <b>{m.said}</b></span><span>Bitcoin {m.happened}</span></li>)}</ul>
            : <p className="strategy-muted">{btc?.score?.["1d"]?.n ? "Every 1-day direction call in the last 7 days landed." : "No scored forecasts yet: the first verdicts arrive a day after the first recorded forecast."}</p>}
          {byClass.length ? <table className="mind-table"><thead><tr><th>Signal class</th><th>events</th><th>7d net</th><th>30d net</th><th>hit 30d</th></tr></thead><tbody>
            {byClass.map((s) => <tr key={s.key}><td>{s.key.replaceAll("_", " ").toLowerCase()}</td><td>{s.events}</td><td className={(s.horizons["7"]?.avgNetPct ?? 0) >= 0 ? "is-gain" : "is-loss"}>{fmtPct(s.horizons["7"]?.avgNetPct ?? null, 1)}</td><td className={(s.horizons["30"]?.avgNetPct ?? 0) >= 0 ? "is-gain" : "is-loss"}>{fmtPct(s.horizons["30"]?.avgNetPct ?? null, 1)}</td><td>{pct(s.horizons["30"]?.hitRate ?? null)}</td></tr>)}
          </tbody></table> : <p className="strategy-muted">Signal outcomes fill in as the forward test records 7 and 30-day results{ledger?.summary?.days ? ` (${ledger.summary.days} days recorded so far)` : ""}.</p>}
        </article>
      </section>

      <section className="engine-grid">
        <article className="dashboard-panel engine-panel" aria-label="Capital flow">
          <div className="engine-panel-head"><h2>Capital flow</h2><span className="strategy-muted">target now vs your mix · tranches on day {plan.tranches.days.join(" / ")}</span></div>
          <div className="mind-flow">
            {plan.rows.map((r) => (
              <div key={r.sleeve} className="mind-flow-row">
                <span className="mind-flow-label"><i style={{ background: SLEEVE_COLOR[r.sleeve] }} />{SLEEVE_LABEL[r.sleeve]}</span>
                <div className="mind-flow-bars">
                  <b style={{ width: `${Math.min(100, r.targetPct)}%`, background: SLEEVE_COLOR[r.sleeve] }} title={`target ${r.targetPct}%`} />
                  {r.currentPct != null ? <u style={{ width: `${Math.min(100, r.currentPct)}%` }} title={`now ${r.currentPct.toFixed(1)}%`} /> : null}
                </div>
                <span className="mind-flow-num">{r.targetPct}%{r.currentPct != null ? <small> now {r.currentPct.toFixed(0)}%</small> : null}</span>
              </div>
            ))}
          </div>
          <p className="strategy-muted">{plan.current ? plan.rows.filter((r) => Math.abs(r.gapPct ?? 0) >= 4).map((r) => `${SLEEVE_LABEL[r.sleeve]}: ${r.action}`).join(" · ") || "Every sleeve is within 4 points of target." : "Locked: no private account is linked, so only targets are shown."}</p>
        </article>
        <article className="dashboard-panel engine-panel" aria-label="Counsel">
          <div className="engine-panel-head"><h2>Counsel</h2><span className="strategy-muted">where the daily Claude review and the maths disagree</span></div>
          {disagree.length ? <ul className="mind-counsel">{disagree.slice(0, 6).map((d) => <li key={d.symbol}><strong>{d.symbol}</strong><small>#{d.rank}</small><span>engine <b className={`fv-${d.engine.toLowerCase()}`}>{d.engine.toLowerCase()}</b> · Claude <b className={`fv-${d.claude.toLowerCase()}`}>{d.claude.toLowerCase()} {d.aiScore}</b></span><p>{d.thesis}</p></li>)}</ul>
            : <p className="strategy-muted">{vf.aiWatchlist.items.length ? `Claude and the engine agree on every reviewed coin (${vf.aiWatchlist.items.length} reviewed${vf.aiWatchlist.ageHours != null ? `, ${vf.aiWatchlist.ageHours.toFixed(0)}h ago` : ""}).` : "No Claude review has been published yet."}{vf.aiWatchlist.stale ? " The review is stale; its nudges are ignored until the next one." : ""}</p>}
        </article>
      </section>

      <aside className="dashboard-panel mind-spine" aria-label="Integrity">
        <span className="mind-badge">read-only · no orders · no leverage · no margin</span>
        <ul>{report.feeds.map((x) => <li key={x.name} className={x.ok ? "is-ok" : "is-down"} title={x.detail}><i /> {x.name}</li>)}</ul>
        <small>{feedsDown.length ? `${feedsDown.length} feed${feedsDown.length > 1 ? "s" : ""} degraded: ${feedsDown.map((x) => x.name).join(", ")}` : "all feeds healthy"} · report {report.asOf.slice(11, 16)} UTC</small>
      </aside>
    </main>
  );
}
