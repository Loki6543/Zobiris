import { useEffect, useMemo, useState, type CSSProperties } from "react";
import {
  CASH_USD,
  HOLDINGS,
  LEARNING_RULES,
  OPEN_ORDERS,
  PORTFOLIO_CAPTURED_AT,
  TRADE_MEMORY,
  type TradeMemory,
} from "./simplePortfolioData";

type View = "portfolio" | "market" | "history";
type RankedAsset = Record<string, any>;

const money = (value: number) => new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: value < 1 ? 4 : 2,
}).format(value);

const num = (value: number, digits = 4) => new Intl.NumberFormat("en-US", {
  maximumFractionDigits: digits,
}).format(value);

const pct = (value: number) => (value >= 0 ? "+" : "") + value.toFixed(1) + "%";

function safeJson(value: unknown): any {
  if (typeof value !== "string") return value;
  try { return JSON.parse(value); } catch { return null; }
}

function extractPrice(asset: RankedAsset | undefined): number | null {
  if (!asset) return null;
  const observations = asset?.strategy21?.explanation?.observations ?? [];
  for (const observation of observations) {
    const claim = safeJson(observation?.claim);
    const price = Number(claim?.priceUsd);
    if (Number.isFinite(price) && price > 0) return price;
  }
  return null;
}

function researchScore(asset: RankedAsset | undefined): number {
  const value = Number(asset?.strategy21?.researchScore ?? asset?.opportunity?.adjusted ?? 0);
  return Number.isFinite(value) ? value : 0;
}

function confidencePct(asset: RankedAsset | undefined): number {
  const value = Number(asset?.confidence?.pct ?? 0);
  return Number.isFinite(value) ? value : 0;
}

function fifoRealized(trades: TradeMemory[]) {
  const lots = new Map<string, Array<{ qty: number; unitCost: number | null }>>();
  const perSymbol = new Map<string, number>();
  let realized = 0;
  let matchedCost = 0;
  let matchedProceeds = 0;

  const sorted = [...trades].sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
  for (const trade of sorted) {
    const symbolLots = lots.get(trade.symbol) ?? [];
    if (trade.side === "BUY") {
      symbolLots.push({
        qty: trade.quantity,
        unitCost: trade.usd == null ? null : trade.usd / trade.quantity,
      });
      lots.set(trade.symbol, symbolLots);
      continue;
    }

    if (trade.usd == null) continue;
    let remaining = trade.quantity;
    let cost = 0;
    let known = true;
    while (remaining > 0.0000000001 && symbolLots.length) {
      const lot = symbolLots[0];
      const take = Math.min(remaining, lot.qty);
      if (lot.unitCost == null) known = false;
      else cost += take * lot.unitCost;
      lot.qty -= take;
      remaining -= take;
      if (lot.qty <= 0.0000000001) symbolLots.shift();
    }
    lots.set(trade.symbol, symbolLots);
    if (!known || remaining > 0.000001) continue;
    const pnl = trade.usd - cost;
    realized += pnl;
    matchedCost += cost;
    matchedProceeds += trade.usd;
    perSymbol.set(trade.symbol, (perSymbol.get(trade.symbol) ?? 0) + pnl);
  }

  return { realized, matchedCost, matchedProceeds, perSymbol };
}

function reentryRiskSymbols(trades: TradeMemory[]) {
  const result = new Set<string>();
  const lastSell = new Map<string, number>();
  const sorted = [...trades].sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
  for (const trade of sorted) {
    const at = new Date(trade.at).getTime();
    if (trade.side === "SELL") lastSell.set(trade.symbol, at);
    else {
      const previousSell = lastSell.get(trade.symbol);
      if (previousSell && at - previousSell <= 7 * 24 * 60 * 60 * 1000) result.add(trade.symbol);
    }
  }
  return result;
}

function loadCustomTrades(): TradeMemory[] {
  try {
    const raw = window.localStorage.getItem("zobiris.simple.tradeMemory.v1");
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function App() {
  const [view, setView] = useState<View>("portfolio");
  const [snapshot, setSnapshot] = useState<any>(null);
  const [watchlist, setWatchlist] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAllTrades, setShowAllTrades] = useState(false);
  const [customTrades, setCustomTrades] = useState<TradeMemory[]>(loadCustomTrades);
  const [recordOpen, setRecordOpen] = useState(false);
  const [form, setForm] = useState({ symbol: "", side: "BUY", quantity: "", usd: "", orderType: "LIMIT" });

  async function loadData() {
    setLoading(true);
    try {
      const [snapshotResponse, watchlistResponse] = await Promise.all([
        fetch("/api/snapshot/latest"),
        fetch("/api/watchlist"),
      ]);
      if (snapshotResponse.ok) setSnapshot(await snapshotResponse.json());
      if (watchlistResponse.ok) {
        const data = await watchlistResponse.json();
        setWatchlist(Array.isArray(data?.watchlist) ? data.watchlist : []);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadData(); }, []);

  async function refresh() {
    setRefreshing(true);
    try {
      await fetch("/api/refresh", {
        method: "POST",
        headers: { "X-Zobiris-Refresh": "1", "Content-Type": "application/json" },
        body: "{}",
      });
      await loadData();
    } finally {
      setRefreshing(false);
    }
  }

  const rankedAssets = useMemo<RankedAsset[]>(() => {
    const raw = snapshot?.snapshot?.rankedAssets;
    const parsed = safeJson(raw);
    return Array.isArray(parsed) ? parsed : [];
  }, [snapshot]);

  const assetMap = useMemo(() => {
    const map = new Map<string, RankedAsset>();
    for (const asset of rankedAssets) map.set(String(asset?.symbol ?? "").toUpperCase(), asset);
    return map;
  }, [rankedAssets]);

  const mergedTrades = useMemo(() => [...TRADE_MEMORY, ...customTrades], [customTrades]);
  const learning = useMemo(() => fifoRealized(mergedTrades.filter((trade) => trade.orderType !== "INSTANT_MICRO")), [mergedTrades]);
  const reentryRisk = useMemo(() => reentryRiskSymbols(mergedTrades), [mergedTrades]);

  const portfolioRows = useMemo(() => HOLDINGS.map((holding) => {
    const asset = assetMap.get(holding.symbol);
    const livePrice = extractPrice(asset) ?? holding.fallbackPriceUsd;
    const value = livePrice * holding.quantity;
    const upl = holding.avgPriceUsd && holding.avgPriceUsd > 0
      ? ((livePrice / holding.avgPriceUsd) - 1) * 100
      : 0;
    const hasSellPlan = OPEN_ORDERS.some((order) => order.side === "SELL" && order.symbol === holding.symbol);
    let action = "HOLD";
    if (hasSellPlan) action = "HARVEST PLAN";
    else if (upl >= 15) action = "TRIM 20%";
    else if (String(asset?.action ?? "") === "AVOID") action = "NO ADD";
    else if (upl < -8) action = "REVIEW";
    return { ...holding, livePrice, value, upl, action, asset };
  }), [assetMap]);

  const invested = portfolioRows.reduce((sum, row) => sum + row.value, 0);
  const total = CASH_USD + invested;
  const reservedBuys = OPEN_ORDERS.filter((order) => order.side === "BUY").reduce((sum, order) => sum + order.amountUsd, 0);
  const freeCash = Math.max(0, CASH_USD - reservedBuys);
  const regime = String(snapshot?.snapshot?.regime ?? "Loading market regime");
  const regimeConfidence = Number(snapshot?.snapshot?.regimeConfidence ?? 0);

  const candidates = useMemo(() => {
    const held = new Set(HOLDINGS.map((holding) => holding.symbol));
    const existingBuy = new Set(OPEN_ORDERS.filter((order) => order.side === "BUY").map((order) => order.symbol));
    return rankedAssets
      .filter((asset) => asset?.mappingStatus === "verified")
      .filter((asset) => !held.has(String(asset?.symbol ?? "")) && !existingBuy.has(String(asset?.symbol ?? "")))
      .map((asset) => {
        const symbol = String(asset?.symbol ?? "");
        const price = extractPrice(asset);
        const score = researchScore(asset);
        const conf = confidencePct(asset);
        let discount = regime.toLowerCase().includes("break") ? 0.05 : 0.03;
        if (score >= 55) discount -= 0.01;
        if (score < 45) discount += 0.01;
        if (reentryRisk.has(symbol)) discount += 0.02;
        discount = Math.max(0.02, Math.min(0.08, discount));
        const limit = price == null ? null : price * (1 - discount);
        return { asset, symbol, price, score, conf, discount, limit };
      })
      .filter((row) => row.price != null)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  }, [rankedAssets, regime, reentryRisk]);

  const strongestHoldingAction = [...portfolioRows].sort((a, b) => b.upl - a.upl)[0];

  function saveTrade() {
    const symbol = form.symbol.trim().toUpperCase();
    const quantity = Number(form.quantity);
    const usd = Number(form.usd);
    if (!symbol || !Number.isFinite(quantity) || quantity <= 0 || !Number.isFinite(usd) || usd <= 0) return;
    const trade: TradeMemory = {
      id: "manual-" + Date.now(),
      at: new Date().toISOString(),
      symbol,
      side: form.side as "BUY" | "SELL",
      quantity,
      usd,
      orderType: form.orderType as TradeMemory["orderType"],
      source: "Kraken ledger screenshot",
    };
    const next = [...customTrades, trade];
    setCustomTrades(next);
    window.localStorage.setItem("zobiris.simple.tradeMemory.v1", JSON.stringify(next));
    setForm({ symbol: "", side: "BUY", quantity: "", usd: "", orderType: "LIMIT" });
    setRecordOpen(false);
  }

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div>
          <div style={styles.brand}>ZOBIRIS CORE</div>
          <div style={styles.subtle}>Portfolio decisions, market limits, and trade memory.</div>
        </div>
        <button style={styles.refreshButton} onClick={() => void refresh()} disabled={refreshing}>
          {refreshing ? "Refreshing…" : "Refresh market"}
        </button>
      </header>

      <nav style={styles.nav}>
        {([
          ["portfolio", "Portfolio"],
          ["market", "Market Today"],
          ["history", "History / Learning"],
        ] as Array<[View, string]>).map(([key, label]) => (
          <button key={key} onClick={() => setView(key)} style={view === key ? styles.navActive : styles.navButton}>
            {label}
          </button>
        ))}
      </nav>

      {loading && !snapshot ? <div style={styles.notice}>Loading live Zobiris market data…</div> : null}

      {view === "portfolio" ? (
        <main>
          <section style={styles.metrics}>
            <Metric label="Portfolio" value={money(total)} />
            <Metric label="Cash" value={money(CASH_USD)} note={Math.round(CASH_USD / total * 100) + "% of portfolio"} />
            <Metric label="Reserved buys" value={money(reservedBuys)} />
            <Metric label="Free cash" value={money(freeCash)} />
          </section>

          <section style={styles.card}>
            <div style={styles.sectionHead}>
              <div>
                <h2 style={styles.h2}>Current positions</h2>
                <div style={styles.subtle}>Kraken account snapshot {new Date(PORTFOLIO_CAPTURED_AT).toLocaleString()}; prices refresh from the live Zobiris engine.</div>
              </div>
            </div>
            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead>
                  <tr><th>Asset</th><th>Value</th><th>Avg</th><th>Now</th><th>P/L</th><th>Zobiris</th></tr>
                </thead>
                <tbody>
                  {portfolioRows.map((row) => (
                    <tr key={row.symbol}>
                      <td><strong>{row.symbol}</strong><div style={styles.tiny}>{row.name}</div></td>
                      <td>{money(row.value)}</td>
                      <td>{row.avgPriceUsd == null ? "—" : money(row.avgPriceUsd)}</td>
                      <td>{money(row.livePrice)}</td>
                      <td style={row.upl >= 0 ? styles.good : styles.bad}>{pct(row.upl)}</td>
                      <td><span style={actionStyle(row.action)}>{row.action}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section style={styles.twoCol}>
            <div style={styles.card}>
              <h2 style={styles.h2}>Open orders</h2>
              {OPEN_ORDERS.map((order, index) => {
                const current = extractPrice(assetMap.get(order.symbol));
                const distance = current ? ((order.targetPriceUsd / current) - 1) * 100 : null;
                return (
                  <div key={order.side + order.symbol + index} style={styles.orderRow}>
                    <div>
                      <strong>{order.side} {order.symbol}</strong>
                      <div style={styles.tiny}>{money(order.amountUsd)} at {money(order.targetPriceUsd)}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <strong>{distance == null ? "Pending" : pct(distance)}</strong>
                      <div style={styles.tiny}>{distance == null ? "from target" : "vs live price"}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={styles.card}>
              <h2 style={styles.h2}>What matters now</h2>
              <DecisionLine title="Market posture" value={regime} detail={regime.toLowerCase().includes("break") ? "Use limits. Do not chase. Keep new entries small." : "Use staged limits and keep cash available."} />
              {strongestHoldingAction ? <DecisionLine title="Best harvest candidate" value={strongestHoldingAction.symbol + " " + pct(strongestHoldingAction.upl)} detail={strongestHoldingAction.action} /> : null}
              <DecisionLine title="New-entry guardrail" value="Max 2 new positions" detail="Your Sep 5 cluster of four rapid market buys is now treated as a risk pattern." />
            </div>
          </section>
        </main>
      ) : null}

      {view === "market" ? (
        <main>
          <section style={styles.heroCard}>
            <div style={styles.eyebrow}>TODAY</div>
            <h1 style={styles.h1}>{regime}</h1>
            <p style={styles.heroText}>
              Zobiris is compressing the research engine into one decision: protect cash, use planned limits, and rank only the best next uses of capital.
            </p>
            <div style={styles.heroStats}>
              <span>Regime confidence {regimeConfidence.toFixed(0)}%</span>
              <span>Free cash {money(freeCash)}</span>
              <span>{watchlist.length || 50} watchlist assets</span>
            </div>
          </section>

          <section style={styles.card}>
            <h2 style={styles.h2}>New positions to consider</h2>
            <div style={styles.subtle}>Ranked by the hidden research engine. Entry price is deliberately lower than market because your history favors staged limits over chasing.</div>
            <div style={{ marginTop: 14 }}>
              {candidates.length ? candidates.map((row, index) => (
                <div key={row.symbol} style={styles.candidate}>
                  <div style={styles.rank}>#{index + 1}</div>
                  <div style={{ flex: 1 }}>
                    <strong style={{ fontSize: 18 }}>{row.symbol}</strong>
                    <div style={styles.tiny}>Research {row.score.toFixed(1)} · confidence {row.conf.toFixed(0)}%</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={styles.limitLabel}>LIMIT CANDIDATE</div>
                    <strong style={{ fontSize: 18 }}>{row.limit == null ? "—" : money(row.limit)}</strong>
                    <div style={styles.tiny}>{Math.round(row.discount * 100)}% below current {row.price == null ? "" : money(row.price)}</div>
                  </div>
                </div>
              )) : <div style={styles.notice}>No verified live candidates yet.</div>}
            </div>
          </section>

          <section style={styles.twoCol}>
            <div style={styles.card}>
              <h2 style={styles.h2}>Existing orders review</h2>
              {OPEN_ORDERS.map((order, index) => {
                const current = extractPrice(assetMap.get(order.symbol));
                const distance = current ? ((order.targetPriceUsd / current) - 1) * 100 : null;
                const label = order.side === "BUY" ? "BUY LIMIT" : "HARVEST";
                return (
                  <div key={order.symbol + index} style={styles.orderRow}>
                    <div><strong>{label} {order.symbol}</strong><div style={styles.tiny}>{money(order.amountUsd)} order</div></div>
                    <div style={{ textAlign: "right" }}><strong>{money(order.targetPriceUsd)}</strong><div style={styles.tiny}>{distance == null ? "price feed unavailable" : pct(distance) + " vs live"}</div></div>
                  </div>
                );
              })}
            </div>

            <div style={styles.card}>
              <h2 style={styles.h2}>Rules learned from you</h2>
              {LEARNING_RULES.map((rule) => (
                <div key={rule.title} style={styles.rule}>
                  <strong>{rule.title}</strong>
                  <div style={styles.tiny}>{rule.detail}</div>
                </div>
              ))}
            </div>
          </section>
        </main>
      ) : null}

      {view === "history" ? (
        <main>
          <section style={styles.metrics}>
            <Metric label="Unique trades" value={String(mergedTrades.length)} note="USD legs merged; duplicates removed" />
            <Metric label="Approx. realized" value={money(learning.realized)} note="gross FIFO on matched known-cost trades" />
            <Metric label="Closed proceeds" value={money(learning.matchedProceeds)} />
            <Metric label="Memory window" value="Sep 5–24" note="Rewards/transfers/dust excluded" />
          </section>

          <section style={styles.twoCol}>
            <div style={styles.card}>
              <h2 style={styles.h2}>What Zobiris has learned</h2>
              {LEARNING_RULES.map((rule) => (
                <div key={rule.title} style={styles.rule}>
                  <strong>{rule.title}</strong>
                  <div style={styles.tiny}>{rule.detail}</div>
                </div>
              ))}
              <div style={styles.notice}>Early sample only. These rules should gain or lose weight as more trades are recorded.</div>
            </div>

            <div style={styles.card}>
              <div style={styles.sectionHead}>
                <div>
                  <h2 style={styles.h2}>Add a future trade</h2>
                  <div style={styles.subtle}>Manual fallback until private Kraken account sync is available.</div>
                </div>
                <button style={styles.secondaryButton} onClick={() => setRecordOpen(!recordOpen)}>{recordOpen ? "Close" : "Record trade"}</button>
              </div>
              {recordOpen ? (
                <div style={styles.formGrid}>
                  <input style={styles.input} placeholder="Symbol" value={form.symbol} onChange={(e) => setForm({ ...form, symbol: e.target.value })} />
                  <select style={styles.input} value={form.side} onChange={(e) => setForm({ ...form, side: e.target.value })}><option>BUY</option><option>SELL</option></select>
                  <input style={styles.input} placeholder="Quantity" inputMode="decimal" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
                  <input style={styles.input} placeholder="USD value" inputMode="decimal" value={form.usd} onChange={(e) => setForm({ ...form, usd: e.target.value })} />
                  <select style={styles.input} value={form.orderType} onChange={(e) => setForm({ ...form, orderType: e.target.value })}><option>LIMIT</option><option>MARKET</option><option>INSTANT</option></select>
                  <button style={styles.refreshButton} onClick={saveTrade}>Save to memory</button>
                </div>
              ) : null}
            </div>
          </section>

          <section style={styles.card}>
            <div style={styles.sectionHead}>
              <div>
                <h2 style={styles.h2}>Trade memory</h2>
                <div style={styles.subtle}>One economic trade per row. Rewards, deposits, standalone USD transfers, duplicate ledger legs and Sep 24 dust cleanup are not included.</div>
              </div>
              <button style={styles.secondaryButton} onClick={() => setShowAllTrades(!showAllTrades)}>{showAllTrades ? "Show recent" : "Show all"}</button>
            </div>
            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead><tr><th>Date</th><th>Asset</th><th>Side</th><th>USD</th><th>Qty</th><th>Method</th></tr></thead>
                <tbody>
                  {[...mergedTrades].sort((a,b) => new Date(b.at).getTime() - new Date(a.at).getTime()).slice(0, showAllTrades ? mergedTrades.length : 20).map((trade) => (
                    <tr key={trade.id}>
                      <td>{new Date(trade.at).toLocaleDateString()}</td>
                      <td><strong>{trade.symbol}</strong></td>
                      <td style={trade.side === "SELL" ? styles.good : undefined}>{trade.side}</td>
                      <td>{trade.usd == null ? "unknown" : money(trade.usd)}</td>
                      <td>{num(trade.quantity, 8)}</td>
                      <td>{trade.orderType.replace("_MICRO", "")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </main>
      ) : null}

      <footer style={styles.footer}>
        Portfolio quantities and open orders are seeded from your Sep 24 Kraken screenshots. Live market prices and rankings come from the Zobiris Kraken/CMC engine. This is decision support, not automatic execution.
      </footer>
    </div>
  );
}

function Metric({ label, value, note }: { label: string; value: string; note?: string }) {
  return <div style={styles.metric}><div style={styles.tiny}>{label}</div><div style={styles.metricValue}>{value}</div>{note ? <div style={styles.tiny}>{note}</div> : null}</div>;
}

function DecisionLine({ title, value, detail }: { title: string; value: string; detail: string }) {
  return <div style={styles.rule}><div style={styles.tiny}>{title}</div><strong>{value}</strong><div style={styles.tiny}>{detail}</div></div>;
}

function actionStyle(action: string): CSSProperties {
  if (action.includes("TRIM") || action.includes("HARVEST")) return { ...styles.pill, borderColor: "#e9b44c", color: "#ffd67a" };
  if (action.includes("NO ADD") || action.includes("REVIEW")) return { ...styles.pill, borderColor: "#d45d79", color: "#ff91aa" };
  return { ...styles.pill, borderColor: "#3fcf8e", color: "#72efbd" };
}

const styles: Record<string, CSSProperties> = {
  page: { minHeight: "100vh", background: "#0b0d11", color: "#f3f6fb", fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif", padding: "20px", boxSizing: "border-box" },
  header: { maxWidth: 1180, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, padding: "10px 0 18px" },
  brand: { fontWeight: 900, letterSpacing: 2, fontSize: 22 },
  subtle: { color: "#8e99aa", fontSize: 13, lineHeight: 1.45 },
  tiny: { color: "#8e99aa", fontSize: 12, lineHeight: 1.45, marginTop: 3 },
  nav: { maxWidth: 1180, margin: "0 auto 18px", display: "flex", gap: 8, borderBottom: "1px solid #242a33", overflowX: "auto" },
  navButton: { background: "transparent", color: "#8e99aa", border: 0, padding: "12px 14px", cursor: "pointer", fontWeight: 700, whiteSpace: "nowrap" },
  navActive: { background: "transparent", color: "#fff", border: 0, borderBottom: "2px solid #fff", padding: "12px 14px", cursor: "pointer", fontWeight: 800, whiteSpace: "nowrap" },
  refreshButton: { background: "#f2f5f9", color: "#0b0d11", border: 0, borderRadius: 8, padding: "10px 14px", fontWeight: 800, cursor: "pointer" },
  secondaryButton: { background: "#171a20", color: "#d7dee9", border: "1px solid #303744", borderRadius: 8, padding: "8px 11px", fontWeight: 700, cursor: "pointer" },
  metrics: { maxWidth: 1180, margin: "0 auto 16px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 },
  metric: { background: "#12151b", border: "1px solid #232935", borderRadius: 12, padding: 16 },
  metricValue: { fontSize: 24, fontWeight: 900, marginTop: 4 },
  card: { maxWidth: 1180, margin: "0 auto 16px", background: "#12151b", border: "1px solid #232935", borderRadius: 14, padding: 18, boxSizing: "border-box" },
  heroCard: { maxWidth: 1180, margin: "0 auto 16px", background: "linear-gradient(135deg, #171b24, #15131d)", border: "1px solid #2a3040", borderRadius: 16, padding: 24, boxSizing: "border-box" },
  eyebrow: { color: "#7ee2b8", fontSize: 11, fontWeight: 900, letterSpacing: 2 },
  h1: { fontSize: 36, margin: "6px 0 8px" },
  h2: { fontSize: 18, margin: 0 },
  heroText: { color: "#c5ccd8", maxWidth: 760, lineHeight: 1.6, margin: "0 0 16px" },
  heroStats: { display: "flex", gap: 18, flexWrap: "wrap", color: "#9eabbc", fontSize: 13 },
  sectionHead: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 12 },
  twoCol: { maxWidth: 1180, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16 },
  tableWrap: { overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse", minWidth: 680 },
  good: { color: "#4be2a0", fontWeight: 800 },
  bad: { color: "#ff708e", fontWeight: 800 },
  pill: { display: "inline-block", border: "1px solid", borderRadius: 999, padding: "5px 8px", fontSize: 11, fontWeight: 900, letterSpacing: 0.3 },
  orderRow: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "12px 0", borderBottom: "1px solid #222833" },
  rule: { padding: "12px 0", borderBottom: "1px solid #222833", lineHeight: 1.45 },
  candidate: { display: "flex", alignItems: "center", gap: 14, padding: "14px 0", borderBottom: "1px solid #222833" },
  rank: { width: 34, height: 34, borderRadius: 10, display: "grid", placeItems: "center", background: "#202631", color: "#b9c5d6", fontWeight: 900 },
  limitLabel: { color: "#7ee2b8", fontWeight: 900, fontSize: 10, letterSpacing: 1.1 },
  notice: { background: "#171a20", border: "1px solid #303744", borderRadius: 10, padding: 12, color: "#9eabbc", fontSize: 13, marginTop: 12 },
  formGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 8, marginTop: 14 },
  input: { background: "#0d1015", color: "#f3f6fb", border: "1px solid #303744", borderRadius: 8, padding: "10px 11px", minWidth: 0 },
  footer: { maxWidth: 1180, margin: "28px auto 10px", paddingTop: 16, borderTop: "1px solid #232935", color: "#6f7b8e", fontSize: 12, lineHeight: 1.5 },
};

export default App;
