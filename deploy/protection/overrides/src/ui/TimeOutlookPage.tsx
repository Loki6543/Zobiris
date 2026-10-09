import { isVisibleAsset } from "../shared/assetUniverse";
import type { CSSProperties } from "react";
import { HORIZON_META, TIME_OUTLOOK, type HorizonCode } from "./timeOutlook";

const ORDER: HorizonCode[] = ["L3", "P2", "T1"];

const statusLabel: Record<string, string> = {
  CORE: "CORE",
  L3_CANDIDATE: "L3 CANDIDATE",
  POSITION: "POSITION",
  REVIEW: "UNDER REVIEW",
  TACTICAL: "TACTICAL",
};

export function TimeOutlookPage({ holdingSymbols = [], watchlist }: { holdingSymbols?: string[]; watchlist?: {symbol:string;name?:string}[] }) {
  const holdings = new Set(holdingSymbols.map((symbol) => symbol.toUpperCase()));

  const active = new Set((watchlist ?? TIME_OUTLOOK).filter(a => isVisibleAsset(a.symbol)).map(a => a.symbol));
  const pending = (watchlist ?? []).filter(a => active.has(a.symbol) && !TIME_OUTLOOK.some(c => c.symbol === a.symbol));

  return (
    <main style={styles.page}>
      <section style={styles.hero}>
        <div style={styles.kicker}>HORIZON POLICY</div>
        <h1 style={styles.h1}>Investment horizons</h1>
        <p style={styles.copy}>
          Zobiris now separates tactical trades, multi-week positions, and true long-term holdings before it decides how aggressively to sell.
        </p>
        <div style={styles.protection}>
          <strong>L3 PROTECTION ACTIVE</strong>
          <span>
            BTC, ETH, and SOL are long-term core by policy. A red week, a normal pullback, short-term RSI/MACD changes, or reaching an ordinary harvest target cannot by itself create a sell recommendation.
          </span>
        </div>
        <div style={styles.ruleRow}>
          <div><strong>No silent horizon drift</strong><span>A losing T1 does not become P2, and a losing P2 does not become L3 just to avoid realizing a loss.</span></div>
          <div><strong>Downgrade before selling L3</strong><span>Routine sell logic resumes only after a documented thesis break, structural deterioration, or explicit user decision moves the holding back to P2.</span></div>
          <div><strong>Candidates must earn L3</strong><span>TAO and ONDO are P2 → L3 candidates, not protected core holdings yet.</span></div>
        </div>
      </section>

      {ORDER.map((horizon) => {
        const meta = HORIZON_META[horizon];
        const coins = TIME_OUTLOOK.filter((coin) => coin.horizon === horizon && active.has(coin.symbol));
        return (
          <section key={horizon} style={styles.section}>
            <div style={styles.sectionHead}>
              <div>
                <div style={styles.kicker}>{meta.window}</div>
                <h2 style={styles.h2}>{meta.title}</h2>
                <p style={styles.muted}>{meta.rule}</p>
              </div>
              <div style={styles.cadence}>Review: {meta.reviewCadence}</div>
            </div>

            <div style={styles.grid}>
              {coins.map((coin) => (
                <article key={coin.symbol} style={coin.protected ? styles.protectedCard : styles.card}>
                  <div style={styles.coinHead}>
                    <div>
                      <strong style={styles.symbol}>{coin.symbol}</strong>
                      {holdings.has(coin.symbol) ? <span style={styles.held}>IN PORTFOLIO</span> : null}
                    </div>
                    <span style={coin.protected ? styles.protectedBadge : styles.badge}>{statusLabel[coin.status]}</span>
                  </div>
                  <div style={styles.role}>{coin.role}</div>
                  <div style={styles.metaLine}><span>Review cadence</span><strong>{coin.reviewCadence}</strong></div>
                  <div style={styles.exit}>{coin.exitPolicy}</div>
                </article>
              ))}
            </div>
          </section>
        );
      })}

      {pending.length > 0 && <section style={styles.section} aria-label="Watchlist horizons awaiting review">
        <h2 style={styles.h2}>Horizon awaiting review · {pending.length} coins</h2>
        <p style={styles.muted}>These coins belong to the same watchlist. No investment horizon has been assigned; inclusion does not grant long-term protection or trading authority.</p>
        <div style={{...styles.grid,marginTop:14}}>{pending.map(a=><article style={styles.card} key={a.symbol}><strong>{a.symbol}</strong><p style={styles.muted}>{a.name ?? a.symbol} · Awaiting horizon review</p></article>)}</div>
      </section>}
      <section style={styles.footerNote}>
        <strong>Authority boundary:</strong> this horizon layer changes how Zobiris interprets holding period and sell urgency. It does not bypass Kraken liquidity, freshness, sizing, or evidence gates for new buys.
      </section>
    </main>
  );
}

const styles: Record<string, CSSProperties> = {
  page: { maxWidth: 1280, margin: "0 auto" },
  hero: { marginBottom: 18, padding: 24, borderRadius: 16, border: "1px solid #3b4d6e", background: "linear-gradient(120deg,#282654,#12283f)" },
  kicker: { color: "#b9adff", fontSize: 10, fontWeight: 900, letterSpacing: 1.8 },
  h1: { fontSize: 34, margin: "7px 0 8px", letterSpacing: -0.8 },
  copy: { maxWidth: 860, margin: 0, color: "#c3d0e3", lineHeight: 1.6, fontSize: 14 },
  protection: { display: "grid", gap: 7, marginTop: 18, padding: 16, borderRadius: 12, border: "1px solid #3e7d70", background: "#12332f", color: "#d9fff5", fontSize: 13, lineHeight: 1.55 },
  ruleRow: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12, marginTop: 14 },
  section: { marginBottom: 18, padding: 18, borderRadius: 14, border: "1px solid #293c5b", background: "#111e36" },
  sectionHead: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 14 },
  h2: { fontSize: 20, margin: "5px 0 4px" },
  muted: { color: "#a4b5cf", fontSize: 12, lineHeight: 1.5, margin: 0, maxWidth: 780 },
  cadence: { color: "#9fd8ef", border: "1px solid #355c70", background: "#123044", borderRadius: 999, padding: "6px 10px", fontSize: 11, fontWeight: 800 },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(235px,1fr))", gap: 10 },
  card: { padding: 14, borderRadius: 12, border: "1px solid #304565", background: "#0d1930" },
  protectedCard: { padding: 14, borderRadius: 12, border: "1px solid #408776", background: "linear-gradient(135deg,#12342f,#11243b)" },
  coinHead: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 },
  symbol: { fontSize: 19, letterSpacing: 0.2 },
  held: { display: "inline-block", marginLeft: 8, color: "#6fe6c7", fontSize: 9, fontWeight: 900, letterSpacing: 0.8 },
  badge: { color: "#c8d5e9", border: "1px solid #405575", borderRadius: 999, padding: "4px 7px", fontSize: 9, fontWeight: 900, letterSpacing: 0.5 },
  protectedBadge: { color: "#82f2d3", border: "1px solid #438a77", background: "#153b34", borderRadius: 999, padding: "4px 7px", fontSize: 9, fontWeight: 900, letterSpacing: 0.5 },
  role: { marginTop: 9, color: "#eef3fb", fontSize: 12, lineHeight: 1.45 },
  metaLine: { display: "flex", justifyContent: "space-between", gap: 10, marginTop: 12, paddingTop: 10, borderTop: "1px solid #263a58", color: "#9fb1cb", fontSize: 10 },
  exit: { marginTop: 9, color: "#aabbd2", fontSize: 11, lineHeight: 1.5 },
  footerNote: { marginBottom: 18, padding: 12, borderRadius: 10, border: "1px solid #304565", background: "#162541", color: "#a8bbd6", fontSize: 12, lineHeight: 1.5 },
};

export default TimeOutlookPage;

