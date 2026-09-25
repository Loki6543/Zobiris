import { Fragment, useEffect, useMemo, useState, type CSSProperties } from "react";
import {
  CASH_INFLOW_USD,
  CASH_UPDATED_AT,
  CASH_USD,
  HOLDINGS,
  MANEUVER_CAPITAL_USD,
  PROBE_MAX_USD,
  PROBE_TYPICAL_USD,
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
  const observations = [...(asset?.strategy21?.explanation?.observations ?? [])]
    .filter(o => Number.isFinite(Date.parse(o.observedAt)) && Date.parse(o.expiresAt) > Date.now() && Date.now() - Date.parse(o.observedAt) <= 6 * 60 * 60 * 1000)
    .sort((a,b) => Date.parse(b.observedAt) - Date.parse(a.observedAt));
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

function extractMarketField(asset: RankedAsset | undefined, field: string): number | null {
  if (!asset) return null;
  const observations = [...(asset?.strategy21?.explanation?.observations ?? [])]
    .filter(o => Number.isFinite(Date.parse(o.observedAt)) && Date.parse(o.expiresAt) > Date.now() && Date.now() - Date.parse(o.observedAt) <= 6 * 60 * 60 * 1000)
    .sort((a,b) => Date.parse(b.observedAt) - Date.parse(a.observedAt));
  for (const observation of observations) {
    const claim = safeJson(observation?.claim);
    const value = Number(claim?.[field]);
    if (Number.isFinite(value)) return value;
  }
  return null;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function buildOrderPlan(row: any, regime: string, recentReentry: boolean) {
  const current = Number(row.livePrice);
  const avg = Number(row.avgPriceUsd ?? 0);
  const score = researchScore(row.asset);
  const confidence = confidencePct(row.asset);
  const change24h = extractMarketField(row.asset, "change24hPct") ?? 0;
  const open24h = extractMarketField(row.asset, "open24hUsd");
  const regimeBreak = regime.toLowerCase().includes("break");

  let firstBuyDiscount = regimeBreak ? 0.06 : 0.04;
  if (score < 45) firstBuyDiscount += 0.02;
  if (score >= 55) firstBuyDiscount -= 0.01;
  if (change24h > 4) firstBuyDiscount += 0.01;
  if (recentReentry) firstBuyDiscount += 0.02;
  firstBuyDiscount = clamp(firstBuyDiscount, 0.03, 0.12);

  const secondBuyDiscount = clamp(firstBuyDiscount + 0.04, 0.07, 0.16);
  let buyNear = current * (1 - firstBuyDiscount);
  if (open24h && open24h < current) buyNear = Math.min(buyNear, open24h * 0.995);
  const buyDeep = current * (1 - secondBuyDiscount);

  const firstHarvestPremium = row.upl >= 30 ? 0.025 : row.upl >= 15 ? 0.035 : 0.055;
  const secondHarvestPremium = firstHarvestPremium + 0.045;
  const harvestNear = Math.max(current * (1 + firstHarvestPremium), avg > 0 ? avg * 1.18 : 0);
  const harvestHigh = Math.max(current * (1 + secondHarvestPremium), avg > 0 ? avg * 1.25 : 0);

  const reductionPct = regimeBreak ? 0.055 : 0.075;
  const reduceTrigger = current * (1 - reductionPct);
  const reduceLimit = reduceTrigger * 0.994;

  // Position sizing deliberately reflects the strongest lessons in the user's
  // trade memory: partial harvesting worked, rapid re-entry hurt, and clustered
  // market adds should be smaller and staged.
  const trimPct = row.upl >= 30 ? 20 : row.upl >= 15 ? 15 : 10;
  const secondTrimPct = row.upl >= 30 ? 15 : 10;

  let firstAddPct = regimeBreak ? 8 : 12;
  if (score >= 55 && confidence >= 55) firstAddPct += 4;
  if (score < 45) firstAddPct -= 3;
  if (row.upl >= 15) firstAddPct -= 3;
  if (recentReentry) firstAddPct -= 4;
  firstAddPct = Math.round(clamp(firstAddPct, 5, 18));

  const secondAddPct = Math.round(clamp(firstAddPct * 0.75, 5, 12));
  const defensiveReducePct = regimeBreak
    ? (score < 45 ? 25 : 20)
    : (score < 45 ? 20 : 15);

  return {
    score,
    confidence,
    change24h,
    open24h,
    buyNear,
    buyDeep,
    harvestNear,
    harvestHigh,
    reduceTrigger,
    reduceLimit,
    trimPct,
    secondTrimPct,
    firstAddPct,
    secondAddPct,
    defensiveReducePct,
    recentReentry,
    regimeBreak,
  };
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
      const lot = symbolLots[0]!;
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

const STRATEGY21_MIN_ORDER_CONFIDENCE_PCT = 65;
const STRATEGY21_LATER_LINE_CONFIDENCE_PCT = 75;

function krakenLimitPurchaseGate(detail: any) {
  const strategy =
    detail?.strategy21 ??
    detail?.assetAnalysis?.strategy21 ??
    detail?.caseFile?.strategy21 ??
    {};
  const eligibility = strategy?.eligibility ?? detail?.eligibility ?? {};
  const authority = strategy?.positionAuthority ?? detail?.positionAuthority ?? {};
  const status = String(eligibility?.status ?? "").toUpperCase();
  const failureReasons = Array.isArray(eligibility?.failureReasons)
    ? eligibility.failureReasons.map((reason: unknown) => String(reason))
    : [];

  const authorityMax = Number(authority?.maxNextOrderUsd ?? 0);
  const eligibilityMax = Number(eligibility?.maximumOrderUsd ?? 0);
  const finiteCaps = [authorityMax, eligibilityMax].filter((value) => Number.isFinite(value) && value >= 0);
  const maxNextOrderUsd = finiteCaps.length === 2 ? Math.min(...finiteCaps) : 0;

  const krakenFailure = failureReasons.some((reason: string) =>
    /(kraken|liquidity|volume|turnover|active[- ]minute|trade[- ]count|depth|spread|slippage)/i.test(reason)
  );
  const allowedStatus = ["ACTIVE_ELIGIBLE", "CONDITIONAL_PROBE_ELIGIBLE"].includes(status);

  return {
    pass: maxNextOrderUsd > 0 && !krakenFailure && allowedStatus,
    status: status || "UNKNOWN",
    failureReasons,
    maxNextOrderUsd,
  };
}

export function App() {
  const [nowMs, setNowMs] = useState(Date.now);
  useEffect(() => { const timer = window.setInterval(() => setNowMs(Date.now()), 30000); return () => window.clearInterval(timer); }, []);
  const [view, setView] = useState<View>("portfolio");
  const [snapshot, setSnapshot] = useState<any>(null);
  const [watchlist, setWatchlist] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAllTrades, setShowAllTrades] = useState(false);
  const [customTrades, setCustomTrades] = useState<TradeMemory[]>(loadCustomTrades);
  const [recordOpen, setRecordOpen] = useState(false);
  const [expandedSymbol, setExpandedSymbol] = useState<string | null>(null);
  const [assetDetails, setAssetDetails] = useState<Record<string, any>>({});
  const [assetDetailLoading, setAssetDetailLoading] = useState<Record<string, boolean>>({});
  const [form, setForm] = useState({ symbol: "", side: "BUY", quantity: "", usd: "", orderType: "LIMIT" });

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const [snapshotResponse, watchlistResponse] = await Promise.all([
        fetch("/api/snapshot/latest"),
        fetch("/api/watchlist"),
      ]);
      if (!snapshotResponse.ok) throw new Error(`Snapshot load failed (HTTP ${snapshotResponse.status}).`);
      if (!watchlistResponse.ok) throw new Error(`Watchlist load failed (HTTP ${watchlistResponse.status}).`);
      if (snapshotResponse.ok) {
        setSnapshot(await snapshotResponse.json());
        setAssetDetails({});
      }
      if (watchlistResponse.ok) {
        const data = await watchlistResponse.json();
        setWatchlist(Array.isArray(data?.watchlist) ? data.watchlist : []);
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Market data could not be loaded.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadData(); }, []);

  async function refresh() {
    setRefreshing(true);
    setError(null);
    try {
      const response = await fetch("/api/refresh", {
        method: "POST",
        headers: { "X-Zobiris-Refresh": "1", "Content-Type": "application/json" },
        body: "{}",
      });
      if (response.status === 202) throw new Error("Refresh is still running. Wait and refresh again.");
      if (!response.ok) throw new Error(`Refresh failed (HTTP ${response.status}). Previous market data is still shown.`);
      await loadData();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Refresh failed. Previous market data is still shown.");
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

  const candidateResearchUniverse = useMemo(() => {
    const held = new Set(HOLDINGS.map((holding) => holding.symbol));
    const existingBuy = new Set(OPEN_ORDERS.filter((order) => order.side === "BUY").map((order) => order.symbol));
    return rankedAssets
      .filter((asset) => asset?.mappingStatus === "verified")
      .filter((asset) => {
        const symbol = String(asset?.symbol ?? "").toUpperCase();
        return symbol && !held.has(symbol) && !existingBuy.has(symbol);
      })
      .sort((a, b) => researchScore(b) - researchScore(a))
      .slice(0, 15)
      .map((asset) => String(asset?.symbol ?? "").toUpperCase());
  }, [rankedAssets]);


  const mergedTrades = useMemo(() => [...TRADE_MEMORY, ...customTrades], [customTrades]);
  const learning = useMemo(() => fifoRealized(mergedTrades.filter((trade) => trade.orderType !== "INSTANT_MICRO")), [mergedTrades]);
  const reentryRisk = useMemo(() => reentryRiskSymbols(mergedTrades), [mergedTrades]);

  const snapshotMs = typeof snapshot?.snapshot?.asOf === "number" ? snapshot.snapshot.asOf : Date.parse(snapshot?.snapshot?.asOf ?? "");
  const snapshotFresh = Number.isFinite(snapshotMs) && nowMs - snapshotMs <= 6 * 60 * 60 * 1000;
  const portfolioRows = useMemo(() => HOLDINGS.map((holding) => {
    const asset = assetMap.get(holding.symbol);
    const observedPrice = extractPrice(asset);
    const priceAvailable = observedPrice != null && snapshotFresh;
    const livePrice = observedPrice ?? holding.fallbackPriceUsd;
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
    return { ...holding, livePrice, value, upl, action: priceAvailable ? action : "VERIFY PRICE", asset, priceAvailable };
  }), [assetMap, snapshotFresh, nowMs]);

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
      .flatMap((asset) => {
        const symbol = String(asset?.symbol ?? "").toUpperCase();
        const gate = krakenLimitPurchaseGate(asset);
        const price = extractPrice(asset);
        const score = researchScore(asset);
        const conf = confidencePct(asset);

        // No limit-purchase recommendation exists until Strategy 2.1's existing
        // Kraken execution authority reports positive capacity. This keeps the
        // volume/turnover/depth rules inside the hidden research gate instead of
        // duplicating or weakening them in the UI.
        if (!snapshotFresh || !gate.pass || conf < STRATEGY21_MIN_ORDER_CONFIDENCE_PCT || price == null) return [];

        let discount = regime.toLowerCase().includes("break") ? 0.05 : 0.03;
        if (score >= 55) discount -= 0.01;
        if (score < 45) discount += 0.01;
        if (reentryRisk.has(symbol)) discount += 0.02;
        discount = Math.max(0.02, Math.min(0.08, discount));
        const limit = price * (1 - discount);

        const probeTargetUsd = conf >= STRATEGY21_LATER_LINE_CONFIDENCE_PCT
          ? PROBE_MAX_USD
          : PROBE_TYPICAL_USD;
        const orderUsd = Math.max(0, Math.min(probeTargetUsd, gate.maxNextOrderUsd, freeCash));
        if (orderUsd <= 0) return [];

        return [{
          asset,
          symbol,
          price,
          score,
          conf,
          discount,
          limit,
          orderUsd,
          maxNextOrderUsd: gate.maxNextOrderUsd,
          eligibilityStatus: gate.status,
        }];
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  }, [rankedAssets, regime, reentryRisk, assetDetails, freeCash, snapshotFresh, nowMs]);

  const strongestHoldingAction = [...portfolioRows].sort((a, b) => b.upl - a.upl)[0];

  async function toggleAsset(symbol: string) {
    if (expandedSymbol === symbol) {
      setExpandedSymbol(null);
      return;
    }
    setExpandedSymbol(symbol);
    if (assetDetails[symbol] || assetDetailLoading[symbol]) return;

    setAssetDetailLoading((current) => ({ ...current, [symbol]: true }));
    try {
      const response = await fetch("/api/asset/" + encodeURIComponent(symbol));
      if (response.ok) {
        const detail = await response.json();
        setAssetDetails((current) => ({ ...current, [symbol]: detail }));
      }
    } finally {
      setAssetDetailLoading((current) => ({ ...current, [symbol]: false }));
    }
  }

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

      <div style={styles.notice}>Market as of {Number.isFinite(snapshotMs) ? new Date(snapshotMs).toLocaleString() : "unavailable"}{snapshotFresh ? "" : " — refresh required"}. Account holdings and orders are user-provided, not privately synced.</div>
      {error ? <div role="alert" style={styles.notice}>{error}</div> : null}
      {loading && !snapshot ? <div style={styles.notice}>Loading live Zobiris market data…</div> : null}

      {view === "portfolio" ? (
        <main>
          <section style={styles.metrics}>
            <Metric label="Portfolio" value={money(total)} />
            <Metric label="Cash" value={money(CASH_USD)} note={"+" + money(CASH_INFLOW_USD) + " funded cash added " + CASH_UPDATED_AT + " · " + Math.round(CASH_USD / total * 100) + "% of portfolio"} />
            <Metric label="Reserved buys" value={money(reservedBuys)} />
            <Metric label="Free cash" value={money(freeCash)} />
            <Metric label="Maneuver capital" value={money(MANEUVER_CAPITAL_USD)} note={"Typical probe " + money(PROBE_TYPICAL_USD) + " · max probe " + money(PROBE_MAX_USD)} />
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
                    <Fragment key={row.symbol}>
                      <tr>
                        <td>
                          <button
                            type="button"
                            style={styles.assetButton}
                            onClick={() => void toggleAsset(row.symbol)}
                            aria-expanded={expandedSymbol === row.symbol}
                            aria-label={(expandedSymbol === row.symbol ? "Close " : "Open ") + row.symbol + " order analysis"}
                          >
                            <span><strong>{row.symbol}</strong><div style={styles.tiny}>{row.name}</div></span>
                            <span style={styles.chevron}>{expandedSymbol === row.symbol ? "−" : "+"}</span>
                          </button>
                        </td>
                        <td>{money(row.value)}</td>
                        <td>{row.avgPriceUsd == null ? "—" : money(row.avgPriceUsd)}</td>
                        <td>{money(row.livePrice)}{!row.priceAvailable ? <div style={styles.tiny}>Snapshot estimate — verify</div> : null}</td>
                        <td style={row.upl >= 0 ? styles.good : styles.bad}>{pct(row.upl)}</td>
                        <td><span style={actionStyle(row.action)}>{row.action}</span></td>
                      </tr>
                      {expandedSymbol === row.symbol ? (
                        <tr>
                          <td colSpan={6} style={styles.analysisCell}>
                            <OrderPlanPanel
                              row={row}
                              regime={regime}
                              recentReentry={reentryRisk.has(row.symbol)}
                              detail={assetDetails[row.symbol]}
                              loading={Boolean(assetDetailLoading[row.symbol])}
                            />
                          </td>
                        </tr>
                      ) : null}
                    </Fragment>
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
              <span>Protocol capital {money(MANEUVER_CAPITAL_USD)}</span>
              <span>{watchlist.length || 50} watchlist assets</span>
            </div>
          </section>

          <section style={styles.card}>
            <h2 style={styles.h2}>New positions to consider</h2>
            <div style={styles.subtle}>Ranked by the hidden research engine. A coin is not allowed to become a limit candidate until Strategy 2.1 gives it positive Kraken execution capacity; the existing volume, turnover, depth, spread and slippage gates remain authoritative.</div>
            <div style={{ marginTop: 14 }}>
              {candidates.length ? candidates.map((row, index) => (
                <div key={row.symbol} style={styles.candidate}>
                  <div style={styles.rank}>#{index + 1}</div>
                  <div style={{ flex: 1 }}>
                    <strong style={{ fontSize: 18 }}>{row.symbol}</strong>
                    <div style={styles.tiny}>Research {row.score.toFixed(1)} · confidence {row.conf.toFixed(0)}%</div>
                    <div style={styles.tiny}>Kraken gate passed · max next order {money(row.maxNextOrderUsd)}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={styles.limitLabel}>LIMIT CANDIDATE · {money(row.orderUsd)}</div>
                    <strong style={{ fontSize: 18 }}>{money(row.limit)}</strong>
                    <div style={styles.tiny}>{Math.round(row.discount * 100)}% below current {money(row.price)} · initial PROBE only</div>
                  </div>
                </div>
              )) : <div style={styles.notice}>{candidateResearchUniverse.some((symbol) => assetDetailLoading[symbol]) ? "Checking Kraken execution volume and liquidity gates…" : "No Kraken-eligible live limit candidates yet."}</div>}
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

function OrderPlanPanel({
  row,
  regime,
  recentReentry,
  detail,
  loading,
}: {
  row: any;
  regime: string;
  recentReentry: boolean;
  detail: any;
  loading: boolean;
}) {
  const plan = buildOrderPlan(row, regime, recentReentry);
  const sellOrders = OPEN_ORDERS.filter((order) => order.side === "SELL" && order.symbol === row.symbol);
  const plannedSellUsd = sellOrders.reduce((sum, order) => sum + order.amountUsd, 0);
  const plannedPct = row.value > 0 ? (plannedSellUsd / row.value) * 100 : 0;
  const strategy = row.asset?.strategy21 ?? null;
  const caseFile = detail?.caseFile ?? null;
  const eligibility = strategy?.eligibility?.status ?? "UNKNOWN";
  const nearestFlip = caseFile?.decisionBoundary?.nearestFlip ?? row.asset?.decisionBoundary?.nearestFlip ?? null;
  const failureReasons = Array.isArray(strategy?.eligibility?.failureReasons) ? strategy.eligibility.failureReasons : [];
  const purchaseGate = krakenLimitPurchaseGate({strategy21: strategy});
  const availableCash = Math.max(0, CASH_USD - OPEN_ORDERS.filter(o => o.side === "BUY").reduce((sum,o) => sum + o.amountUsd,0));
  const watchOnly = !row.priceAvailable || !purchaseGate.pass || plan.confidence < STRATEGY21_MIN_ORDER_CONFIDENCE_PCT || availableCash <= 0;
  const addCapacity = watchOnly ? 0 : Math.min(purchaseGate.maxNextOrderUsd, availableCash);
  plan.firstAddPct = row.value > 0 ? Math.min(plan.firstAddPct, addCapacity / row.value * 100) : 0;
  plan.secondAddPct = row.value > 0 ? Math.min(plan.secondAddPct, Math.max(0, addCapacity - row.value * plan.firstAddPct / 100) / row.value * 100) : 0;
  const staleOrderWarning = sellOrders.some((order) => order.targetPriceUsd <= row.livePrice);

  const trimUsd = row.value * (plan.trimPct / 100);
  const trimQty = row.quantity * (plan.trimPct / 100);
  const secondTrimUsd = row.value * (plan.secondTrimPct / 100);
  const firstAddUsd = row.value * (plan.firstAddPct / 100);
  const firstAddQty = plan.buyNear > 0 ? firstAddUsd / plan.buyNear : 0;
  const secondAddUsd = row.value * (plan.secondAddPct / 100);
  const secondAddQty = plan.buyDeep > 0 ? secondAddUsd / plan.buyDeep : 0;
  const defensiveReduceUsd = row.value * (plan.defensiveReducePct / 100);
  const defensiveReduceQty = row.quantity * (plan.defensiveReducePct / 100);

  let firstActionTitle = "HOLD — WAIT FOR A BETTER ENTRY";
  let firstActionDetail = `Do not add at ${money(row.livePrice)}. ${watchOnly ? "No add authorized; research level only." : `First add ${num(plan.firstAddPct, 2)}% near ${money(plan.buyNear)}.`} Research level ${money(plan.buyNear)}.`;
  let learnedReason = "Your trade history favors staged limit entries over chasing strength.";

  if (!row.priceAvailable) {
    firstActionTitle = "VERIFY CURRENT PRICE FIRST";
    firstActionDetail = "Price is unavailable or stale. These are research estimates; refresh before placing any order.";
    learnedReason = "An old screenshot price cannot establish a current trade setup.";
  } else if (staleOrderWarning) {
    firstActionTitle = "VERIFY EXISTING KRAKEN ORDER FIRST";
    firstActionDetail = `Do not duplicate the snapshot order. If it is no longer open, the next planned trim is ${plan.trimPct}% near ${money(plan.harvestNear)}.`;
    learnedReason = "Zobiris learned to avoid stacking duplicate exits when an older order may already have filled.";
  } else if (row.upl >= 15) {
    firstActionTitle = `TRIM ${plan.trimPct}% AT ${money(plan.harvestNear)}`;
    firstActionDetail = `About ${num(trimQty, 8)} ${row.symbol} / ${money(trimUsd)}. Keep the remaining position as the runner.`;
    learnedReason = "Partial harvesting has been one of your better behaviors; fast re-entry after harvesting has been weaker.";
  } else if (!watchOnly && plan.score >= 55 && plan.confidence >= STRATEGY21_MIN_ORDER_CONFIDENCE_PCT && row.upl < 8) {
    firstActionTitle = `ADD ${plan.firstAddPct}% AT ${money(plan.buyNear)}`;
    firstActionDetail = `About ${num(firstAddQty, 8)} ${row.symbol} / ${money(firstAddUsd)}. Use a limit, not a market chase.`;
    learnedReason = "Your cleaner historical trades came from planned limit entries, while clustered market buys added risk.";
  } else if (row.upl >= 8) {
    firstActionTitle = "HOLD — PREPARE A PARTIAL HARVEST";
    firstActionDetail = `Do not add here. First planned reduction is ${plan.trimPct}% at ${money(plan.harvestNear)}.`;
    learnedReason = "Zobiris is preserving the winner while avoiding the all-or-nothing exits your history does not support.";
  }

  return (
    <div style={styles.analysisPanel}>
      <div style={styles.analysisHeader}>
        <div>
          <div style={styles.eyebrow}>{row.symbol} ORDER PLAN</div>
          <div style={styles.analysisTitle}>{money(row.livePrice)} {row.priceAvailable ? "market snapshot" : "snapshot estimate — verify"} · {pct(row.upl)} vs average</div>
          <div style={styles.subtle}>
            Research {plan.score.toFixed(1)} · confidence {plan.confidence.toFixed(0)}% · 24h {pct(plan.change24h)}
          </div>
        </div>
        <span style={actionStyle(row.action)}>{row.action}</span>
      </div>

      <div style={styles.firstAction}>
        <div style={styles.firstActionLabel}>BEST FIRST COURSE OF ACTION</div>
        <div style={styles.firstActionTitle}>{firstActionTitle}</div>
        <div style={styles.firstActionDetail}>{firstActionDetail}</div>
        <div style={styles.learnedWhy}><strong>Why Zobiris learned this:</strong> {learnedReason}</div>
      </div>

      {sellOrders.length ? (
        <div style={styles.existingPlan}>
          <strong>Existing sell orders from the Sep 24 account snapshot</strong>
          <div style={styles.tiny}>
            {sellOrders.map((order) => money(order.amountUsd) + " @ " + money(order.targetPriceUsd)).join(" · ")}
            {" "}({plannedPct.toFixed(0)}% of current position value)
          </div>
          {staleOrderWarning ? (
            <div style={styles.warningText}>One snapshot sell target is now at or below the live price. Verify Kraken before adding another order because it may already have filled or been cancelled.</div>
          ) : null}
        </div>
      ) : null}

      <div style={styles.planGrid}>
        <div style={styles.planCard}>
          <div style={styles.limitLabel}>SELL / HARVEST LADDER</div>
          <strong>{money(plan.harvestNear)} → {money(plan.harvestHigh)}</strong>
          <div style={styles.tiny}>
            Action 1: reduce {plan.trimPct}% ({num(trimQty, 8)} {row.symbol}, about {money(trimUsd)}) near {money(plan.harvestNear)}.
            {" "}Action 2: reduce another {plan.secondTrimPct}% (about {money(secondTrimUsd)}) near {money(plan.harvestHigh)}.
            {" "}Keep the rest as the runner.
          </div>
        </div>
        <div style={styles.planCard}>
          <div style={styles.limitLabel}>DEFENSIVE REDUCTION</div>
          <strong>Trigger {money(plan.reduceTrigger)}</strong>
          <div style={styles.tiny}>
            If structure breaks, reduce {plan.defensiveReducePct}% ({num(defensiveReduceQty, 8)} {row.symbol}, about {money(defensiveReduceUsd)}).
            {" "}Trigger near {money(plan.reduceTrigger)}, limit reference near {money(plan.reduceLimit)}. Do not turn this into an automatic full exit.
          </div>
        </div>
        <div style={styles.planCard}>
          <div style={styles.limitLabel}>BUY / RE-ENTRY RANGE</div>
          <strong>{money(Math.min(plan.buyDeep, plan.buyNear))} → {money(Math.max(plan.buyDeep, plan.buyNear))}</strong>
          <div style={styles.tiny}>
            First add: {plan.firstAddPct}% of the current position (about {money(firstAddUsd)} / {num(firstAddQty, 8)} {row.symbol}) near {money(plan.buyNear)}.
            {" "}Second add: {plan.secondAddPct}% (about {money(secondAddUsd)} / {num(secondAddQty, 8)} {row.symbol}) near {money(plan.buyDeep)}.
            {" "}{plan.recentReentry ? "Your quick re-entry history pushes both sizes and prices lower. " : ""}
            {plan.open24h ? "24h open reference " + money(plan.open24h) + ". " : ""}
            Never chase above the range.
          </div>
        </div>
        <div style={styles.planCard}>
          <div style={styles.limitLabel}>OPENING / ADD STATUS</div>
          <strong>{watchOnly ? "WAIT — research range only" : "Eligible for staged limit"}</strong>
          <div style={styles.tiny}>
            Engine eligibility: {String(eligibility).replaceAll("_", " ")}.
            {failureReasons.length ? " " + failureReasons[0] : ""}
          </div>
        </div>
      </div>

      <div style={styles.analysisText}>
        <strong>Why these levels</strong>
        <div style={styles.tiny}>
          {plan.regimeBreak ? "Regime Break widens entry discounts and tightens the reduction line. " : "Normal regime uses a narrower entry ladder. "}
          Profit targets are set above both the live price and your cost basis, while re-entry levels move lower when research confidence is weak, the coin is already extended, or your trade history shows quick re-entry after selling.
        </div>
        {nearestFlip ? <div style={styles.tiny}><strong>What would improve the signal:</strong> {nearestFlip}</div> : null}
        {loading ? <div style={styles.tiny}>Loading deeper asset analysis…</div> : null}
      </div>
    </div>
  );
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
  navButton: { background: "transparent", color: "#8e99aa", borderTop: 0, borderLeft: 0, borderRight: 0, borderBottom: "2px solid transparent", padding: "12px 14px", cursor: "pointer", fontWeight: 700, whiteSpace: "nowrap" },
  navActive: { background: "transparent", color: "#fff", borderTop: 0, borderLeft: 0, borderRight: 0, borderBottom: "2px solid #fff", padding: "12px 14px", cursor: "pointer", fontWeight: 800, whiteSpace: "nowrap" },
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
  assetButton: { width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, background: "transparent", color: "inherit", border: 0, padding: 0, textAlign: "left", cursor: "pointer", font: "inherit" },
  chevron: { width: 24, height: 24, borderRadius: 7, display: "grid", placeItems: "center", background: "#202631", color: "#c8d1df", fontWeight: 900, flex: "0 0 auto" },
  analysisCell: { padding: "8px 0 16px" },
  analysisPanel: { background: "#0d1015", border: "1px solid #2c3440", borderRadius: 12, padding: 16, marginTop: 6 },
  analysisHeader: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 12 },
  analysisTitle: { fontSize: 20, fontWeight: 900, marginTop: 4 },
  firstAction: { background: "#121922", border: "1px solid #4c6178", borderRadius: 12, padding: 15, marginBottom: 12 },
  firstActionLabel: { color: "#8fbfff", fontSize: 10, fontWeight: 900, letterSpacing: 1.2, marginBottom: 5 },
  firstActionTitle: { fontSize: 21, fontWeight: 950, lineHeight: 1.2 },
  firstActionDetail: { color: "#eef3f9", fontSize: 14, lineHeight: 1.5, marginTop: 6 },
  learnedWhy: { color: "#9facbd", fontSize: 12, lineHeight: 1.5, marginTop: 7 },
  existingPlan: { background: "#171a20", border: "1px solid #343c48", borderRadius: 10, padding: 12, marginBottom: 12 },
  warningText: { color: "#ffd67a", fontSize: 12, lineHeight: 1.45, marginTop: 7 },
  planGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 10 },
  planCard: { background: "#131820", border: "1px solid #29313d", borderRadius: 10, padding: 12, minHeight: 96 },
  analysisText: { marginTop: 12, paddingTop: 12, borderTop: "1px solid #242c37", lineHeight: 1.45 },
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
