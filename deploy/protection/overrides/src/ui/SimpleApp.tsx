import {ResearchEvidencePanel,useResearchEvidence} from './ResearchEvidencePanel';
import {PilotScorecard} from './PilotScorecard';
import {entryReference,validateEntry,type EntryRules} from '../shared/entryPlan';
import { WatchlistPage } from './WatchlistPage';
import { MarketBrief } from './MarketBrief';
import { Fragment, useEffect, useMemo, useState, type CSSProperties } from "react";
import {
  MANEUVER_CAPITAL_USD,
  PROBE_MAX_USD,
  PROBE_TYPICAL_USD,
  type HoldingSeed,
  type OrderSeed,
  type TradeMemory,
} from "./simplePortfolioData";

const LEARNING_RULES = [
  { title: "Prefer planned limits to clustered market buys", detail: "Stage new entries instead of stacking correlated risk." },
  { title: "Use partial harvesting as a research scenario", detail: "Preserve optionality rather than treating every winner as all-in or all-out." },
  { title: "Re-entry requires a fresh pullback", detail: "A recent exit is not itself evidence that immediate re-entry is attractive." },
  { title: "Limit-order discipline gets extra weight", detail: "New-position ideas default to reviewed limits rather than implied market orders." },
];

import { PortfolioVisuals } from "./PortfolioVisuals";
import { ProfitProtection } from "./ProfitProtection";
import { CompareLab } from "./CompareLab";
import { TimeOutlookPage } from "./TimeOutlookPage";
import { isLongTermProtected, timeOutlookFor } from "./timeOutlook";

type View = "portfolio" | "market" | "watchlist" | "outlook" | "history" | "compare";
type RankedAsset = Record<string, any>;

const money = (value: number) => new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: value < 1 ? 4 : 2,
}).format(value);

const entryPrice = (value:number) => value>0?new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",minimumFractionDigits:0,maximumFractionDigits:12}).format(value):"Unavailable";

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

const MIN_MEANINGFUL_TRIM_USD = 8;
const SMALL_POSITION_USD = 25;

function meaningfulTrimPct(positionValueUsd: number, uplPct: number): number {
  if (!Number.isFinite(positionValueUsd) || positionValueUsd <= 0) return 0;
  const base = uplPct >= 30 ? 20 : uplPct >= 15 ? 15 : 10;
  if ((positionValueUsd * base) / 100 >= MIN_MEANINGFUL_TRIM_USD) return base;
  if (positionValueUsd < SMALL_POSITION_USD) {
    return positionValueUsd * 0.5 >= MIN_MEANINGFUL_TRIM_USD ? 50 : 0;
  }
  const needed = Math.ceil(((MIN_MEANINGFUL_TRIM_USD / positionValueUsd) * 100) / 5) * 5;
  return needed <= 50 ? needed : 0;
}

function buildOrderPlan(row: any, regime: string, recentReentry: boolean) {
  const current = Number(row.livePrice);
  const avg = Number(row.avgPriceUsd ?? 0);
  const score = researchScore(row.asset);
  const confidence = confidencePct(row.asset);
  const change24h = extractMarketField(row.asset, "change24hPct") ?? 0;
  const open24h = extractMarketField(row.asset, "open24hUsd");
  const regimeBreak = regime.toLowerCase().includes("break");

  const buyNear = entryReference(current, row.asset?.strategy21?.delayedRotation?.recommendedPullbackPct, recentReentry) ?? 0;
  // One prior across candidates, order reviews and holding adds; no invented deeper tranche.
  const buyDeep = buyNear;

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
  const trimPct = meaningfulTrimPct(row.value, row.upl);
  const candidateSecondTrimPct = row.value < SMALL_POSITION_USD ? 0 : (row.upl >= 30 ? 15 : 10);
  const secondTrimPct = candidateSecondTrimPct > 0 && row.value * (candidateSecondTrimPct / 100) >= MIN_MEANINGFUL_TRIM_USD
    ? candidateSecondTrimPct
    : 0;

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

const STRATEGY21_MIN_ORDER_CONFIDENCE_PCT = 50;
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

  const researchIntegrity = strategy?.researchIntegrity ?? detail?.researchIntegrity ?? null;
  const researchEligibility = String(researchIntegrity?.risk?.researchEligibility ?? "").toUpperCase();
  const authorityMax = Number(authority?.maxNextOrderUsd ?? 0);
  const eligibilityMax = Number(eligibility?.maximumOrderUsd ?? 0);
  const finiteCaps = [authorityMax, eligibilityMax].filter((value) => Number.isFinite(value) && value >= 0);
  const maxNextOrderUsd = finiteCaps.length === 2 ? Math.min(...finiteCaps) : 0;

  const krakenFailure = failureReasons.some((reason: string) =>
    /(kraken|liquidity|volume|turnover|active[- ]minute|trade[- ]count|depth|spread|slippage)/i.test(reason)
  );
  const allowedStatus = ["ACTIVE_ELIGIBLE", "CONDITIONAL_PROBE_ELIGIBLE"].includes(status);
  const researchPass = !researchIntegrity || researchEligibility === "ELIGIBLE";
  const researchFailure = researchIntegrity && !researchPass
    ? `research integrity is ${researchEligibility || "UNKNOWN"}`
    : null;

  return {
    pass: maxNextOrderUsd > 0 && !krakenFailure && allowedStatus && researchPass,
    status: status || "UNKNOWN",
    failureReasons: researchFailure ? [researchFailure, ...failureReasons] : failureReasons,
    maxNextOrderUsd,
    researchEligibility: researchEligibility || null,
  };
}

export function App() {
  const [nowMs, setNowMs] = useState(Date.now);
  useEffect(() => { const timer = window.setInterval(() => setNowMs(Date.now()), 30000); return () => window.clearInterval(timer); }, []);
  const [operatorToken, setOperatorToken] = useState(() => {
    try { return window.sessionStorage.getItem("zobiris.operatorToken.v1") ?? ""; }
    catch { return ""; }
  });
  const [view, setView] = useState<View>("portfolio");
  const [showAllRankings, setShowAllRankings] = useState(false);
  const [analysisSymbol, setAnalysisSymbol] = useState("BTC");
  const [snapshot, setSnapshot] = useState<any>(null);
  const [instrumentRules,setInstrumentRules] = useState<Record<string,EntryRules>>({});
  const [account, setAccount] = useState<any>(null);
  const researchEvidence=useResearchEvidence();
  const [watchlist, setWatchlist] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshEvaluation, setLastRefreshEvaluation] = useState<any>(null);
  const [showAllTrades, setShowAllTrades] = useState(false);
  const [customTrades, setCustomTrades] = useState<TradeMemory[]>(loadCustomTrades);
  const [recordOpen, setRecordOpen] = useState(false);
  const [expandedSymbol, setExpandedSymbol] = useState<string | null>(null);
  const [assetDetails, setAssetDetails] = useState<Record<string, any>>({});
  const [assetDetailLoading, setAssetDetailLoading] = useState<Record<string, boolean>>({});
  const [form, setForm] = useState({ symbol: "", side: "BUY", quantity: "", usd: "", orderType: "LIMIT" });

  const authHeaders: Record<string, string> = operatorToken
    ? { Authorization: `Bearer ${operatorToken}` }
    : {};

  async function loadData() {
    void fetch("/api/entry-rules").then(async r=>{if(!r.ok)throw new Error();setInstrumentRules((await r.json()).rules??{});}).catch(()=>setInstrumentRules({}));
    setLoading(true);
    setError(null);
    try {
      const [snapshotResponse, watchlistResponse, accountResponse] = await Promise.all([
        fetch("/api/snapshot/latest", { headers: authHeaders }),
        fetch("/api/watchlist"),
        fetch("/api/account", { headers: authHeaders }),
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
      if (accountResponse.ok) {
        const data = await accountResponse.json();
        setAccount(data?.account ?? null);
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Market data could not be loaded.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadData(); }, [operatorToken]);
  useEffect(() => {
    let cancelled = false;
    const pollAccount = async () => {
      try {
        const response = await fetch("/api/account", { headers: authHeaders });
        if (!response.ok || cancelled) return;
        const data = await response.json();
        if (!cancelled) setAccount(data?.account ?? null);
      } catch {
        // Keep the last good account snapshot; server-side reconciliation continues.
      }
    };
    const timer = window.setInterval(() => { void pollAccount(); }, 15_000);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, [operatorToken]);

  const accountSynced = Boolean(account?.privateAccountSynced);
  const LIVE_HOLDINGS: HoldingSeed[] = accountSynced && Array.isArray(account?.holdings)
    ? account.holdings.map((holding: any) => ({
        symbol: String(holding?.symbol ?? "").toUpperCase(),
        name: String(holding?.name ?? holding?.symbol ?? ""),
        quantity: Number(holding?.quantity ?? 0),
        avgPriceUsd: holding?.avgPriceUsd == null ? null : Number(holding.avgPriceUsd),
        fallbackPriceUsd: Number(holding?.fallbackPriceUsd ?? 0),
      }))
    : [];
  const LIVE_OPEN_ORDERS: OrderSeed[] = accountSynced && Array.isArray(account?.openOrders)
    ? account.openOrders.map((order: any) => ({
        side: String(order?.side ?? "").toUpperCase() === "SELL" ? "SELL" as const : "BUY" as const,
        symbol: String(order?.symbol ?? "").toUpperCase(),
        name: String(order?.name ?? order?.symbol ?? ""),
        targetPriceUsd: Number(order?.targetPriceUsd ?? 0),
        amountUsd: Number(order?.amountUsd ?? 0),
      }))
    : [];
  const LIVE_CASH_USD = accountSynced && Number.isFinite(Number(account?.cashUsd))
    ? Number(account.cashUsd)
    : 0;
  const LIVE_CAPTURED_AT = accountSynced && account?.capturedAt
    ? String(account.capturedAt)
    : "";
  const LIVE_TRADE_MEMORY: TradeMemory[] = accountSynced && Array.isArray(account?.trades) && account.trades.length
    ? account.trades.map((trade: any) => ({
        id: String(trade?.id ?? [trade?.at, trade?.symbol, trade?.side, trade?.quantity].join(":")) ,
        at: String(trade?.at ?? new Date().toISOString()),
        symbol: String(trade?.symbol ?? "").toUpperCase(),
        side: String(trade?.side ?? "").toUpperCase() === "SELL" ? "SELL" : "BUY",
        quantity: Number(trade?.quantity ?? 0),
        usd: trade?.usd == null ? null : Number(trade.usd),
        orderType: String(trade?.orderType ?? "").toUpperCase() === "LIMIT" ? "LIMIT" : "MARKET",
        source: "Kraken trades export",
      }))
    : [];

  async function refresh() {
    setRefreshing(true);
    setError(null);
    try {
      const response = await fetch("/api/refresh", {
        method: "POST",
        headers: { "X-Zobiris-Refresh": "1", "Content-Type": "application/json", ...authHeaders },
        body: "{}",
      });
      if (response.status === 202) throw new Error("Refresh is still running. Wait and refresh again.");
      if (!response.ok) throw new Error(`Refresh failed (HTTP ${response.status}). Previous market data is still shown.`);
      const refreshBody = await response.json();
      setLastRefreshEvaluation(refreshBody?.fullWatchlistEvaluation ?? null);
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
    const held = new Set(LIVE_HOLDINGS.map((holding) => holding.symbol));
    const existingBuy = new Set(LIVE_OPEN_ORDERS.filter((order) => order.side === "BUY").map((order) => order.symbol));
    return rankedAssets
      .filter((asset) => asset?.mappingStatus === "verified")
      .filter((asset) => {
        const symbol = String(asset?.symbol ?? "").toUpperCase();
        return symbol && !held.has(symbol) && !existingBuy.has(symbol);
      })
      .sort((a, b) => researchScore(b) - researchScore(a))
      .slice(0, 15)
      .map((asset) => String(asset?.symbol ?? "").toUpperCase());
  }, [rankedAssets, account]);


  const mergedTrades = useMemo(() => [...LIVE_TRADE_MEMORY, ...customTrades], [customTrades, account]);
  const learning = useMemo(() => fifoRealized(mergedTrades.filter((trade) => trade.orderType !== "INSTANT_MICRO")), [mergedTrades]);
  const reentryRisk = useMemo(() => reentryRiskSymbols(mergedTrades), [mergedTrades]);

  const snapshotMs = typeof snapshot?.snapshot?.asOf === "number" ? snapshot.snapshot.asOf : Date.parse(snapshot?.snapshot?.asOf ?? "");
  const snapshotFresh = Number.isFinite(snapshotMs) && nowMs - snapshotMs <= 6 * 60 * 60 * 1000;
  const portfolioRows = useMemo(() => LIVE_HOLDINGS.map((holding) => {
    const asset = assetMap.get(holding.symbol);
    const observedPrice = extractPrice(asset);
    const priceAvailable = observedPrice != null && snapshotFresh;
    const livePrice = observedPrice ?? holding.fallbackPriceUsd;
    const value = livePrice * holding.quantity;
    const upl = holding.avgPriceUsd && holding.avgPriceUsd > 0
      ? ((livePrice / holding.avgPriceUsd) - 1) * 100
      : 0;
    const hasSellPlan = LIVE_OPEN_ORDERS.some((order) => order.side === "SELL" && order.symbol === holding.symbol);
    const longTermProtected = isLongTermProtected(holding.symbol);
    let action = "HOLD";
    if (longTermProtected) action = "L3 CORE HOLD";
    else if (hasSellPlan) action = "HARVEST PLAN";
    else if (upl >= 15) {
      const trimPct = meaningfulTrimPct(value, upl);
      action = trimPct > 0 ? `TRIM ${trimPct}%` : "HOLD — TOO SMALL TO TRIM";
    }
    else if (String(asset?.action ?? "") === "AVOID") action = "NO ADD";
    else if (upl < -8) action = "REVIEW";
    const displayedAction = priceAvailable
      ? action
      : longTermProtected ? "L3 CORE · VERIFY PRICE" : "VERIFY PRICE";
    return { ...holding, livePrice, value, upl, action: displayedAction, asset, priceAvailable, longTermProtected };
  }), [assetMap, snapshotFresh, nowMs, account, instrumentRules]);

  const invested = portfolioRows.reduce((sum, row) => sum + row.value, 0);
  const total = LIVE_CASH_USD + invested;
  const reservedBuys = LIVE_OPEN_ORDERS.filter((order) => order.side === "BUY").reduce((sum, order) => sum + order.amountUsd, 0);
  const freeCash = Math.max(0, LIVE_CASH_USD - reservedBuys);
  const regime = String(snapshot?.snapshot?.regime ?? "Loading market regime");
  const regimeConfidence = Number(snapshot?.snapshot?.regimeConfidence ?? 0);
  const highestConfidence = rankedAssets.reduce((highest, asset) => Math.max(highest, confidencePct(asset)), 0);
  const incompleteKrakenHistory = rankedAssets.some((asset) =>
    (asset?.strategy21?.eligibility?.failureReasons ?? []).some((reason: string) => /14-day Kraken book\/notional history/i.test(reason))
  );

  const candidates = useMemo(() => {
    const held = new Set(LIVE_HOLDINGS.map((holding) => holding.symbol));
    const existingBuy = new Set(LIVE_OPEN_ORDERS.filter((order) => order.side === "BUY").map((order) => order.symbol));
    return rankedAssets
      .filter((asset) => asset?.mappingStatus === "verified")
      .filter((asset) => !held.has(String(asset?.symbol ?? "")) && !existingBuy.has(String(asset?.symbol ?? "")))
      .flatMap((asset) => {
        const symbol = String(asset?.symbol ?? "").toUpperCase();
        const gate = krakenLimitPurchaseGate(asset);
        const price = extractPrice(asset);
        const score = researchScore(asset);
        const conf = confidencePct(asset);
        const rotation = asset?.strategy21?.delayedRotation ?? null;

        // Pilot mode is intentionally fail-closed: deep research can keep running,
        // but new capital is only recommended for a strict delayed-rotation setup
        // that also passes the existing Kraken execution + research-integrity gates.
        if (!snapshotFresh || !gate.pass || conf <= STRATEGY21_MIN_ORDER_CONFIDENCE_PCT || price == null || rotation?.status !== "QUALIFIED") return [];

        const reference = entryReference(price,rotation?.recommendedPullbackPct,reentryRisk.has(symbol));
        const budget = Math.max(0, Math.min(PROBE_TYPICAL_USD, gate.maxNextOrderUsd, freeCash / 1.01));
        const checked = validateEntry(reference,budget,instrumentRules[symbol]);
        if (!checked.valid || checked.limit == null) return [];
        const limit=checked.limit, orderUsd=checked.notional, discount=1-limit/price;

        return [{
          asset,
          symbol,
          price,
          score,
          conf,
          rotationScore: Number(rotation?.score ?? 0),
          discount,
          quantity:checked.quantity,
          limit,
          orderUsd,
          maxNextOrderUsd: gate.maxNextOrderUsd,
          eligibilityStatus: gate.status,
          researchEligibility: gate.researchEligibility,
        }];
      })
      .sort((a, b) => b.rotationScore - a.rotationScore || Number(b.asset?.strategy21?.nextDollarScore ?? 0) - Number(a.asset?.strategy21?.nextDollarScore ?? 0) || b.score - a.score)
      .slice(0, 5);
  }, [rankedAssets, regime, reentryRisk, assetDetails, freeCash, snapshotFresh, nowMs, account, instrumentRules]);

  const watchlistRankings = useMemo(() => {
    const symbols = watchlist.length
      ? watchlist.map((entry) => String(entry?.symbol ?? entry ?? "").toUpperCase()).filter(Boolean)
      : rankedAssets.map((asset) => String(asset?.symbol ?? "").toUpperCase());
    const held = new Set(LIVE_HOLDINGS.map((holding) => holding.symbol));
    const existingBuy = new Set(LIVE_OPEN_ORDERS.filter((order) => order.side === "BUY").map((order) => order.symbol));
    return [...new Set(symbols)].map((symbol) => {
      const asset = assetMap.get(symbol);
      const gate = asset ? krakenLimitPurchaseGate(asset) : null;
      const confidence = confidencePct(asset);
      const rotation = asset?.strategy21?.delayedRotation ?? null;
      const strictRotation = rotation?.status === "QUALIFIED";
      const entryValid=validateEntry(entryReference(extractPrice(asset)??0,rotation?.recommendedPullbackPct,reentryRisk.has(symbol)),Math.min(PROBE_TYPICAL_USD,gate?.maxNextOrderUsd??0,freeCash/1.01),instrumentRules[symbol]).valid;
      const ready = Boolean(entryValid && asset && strictRotation && snapshotFresh && extractPrice(asset) != null && confidence > STRATEGY21_MIN_ORDER_CONFIDENCE_PCT && gate?.pass && !held.has(symbol) && !existingBuy.has(symbol));
      const move = held.has(symbol) ? "Manage holding" : existingBuy.has(symbol) ? "Review existing limit"
        : ready ? "Delayed-rotation limit"
        : rotation?.status === "QUALIFIED" ? "Qualified / wait"
        : rotation?.status === "NEAR_ROTATION" ? "Watch rotation"
        : "Wait";
      const rotationReason: Record<string, string> = {
        QUALIFIED: "30d/90d within approved ranges; 7d recovery confirmed — wait for pullback limit",
        NEAR_ROTATION: "Lagging BTC, but outside the approved 30d/90d ranges",
        TOO_EARLY: "7d recovery has not turned positive",
        EXTENDED: "Recovery already moved too far to chase",
        STRUCTURALLY_WEAK: "Medium-term losses exceed pilot safety floor",
        NOT_LAGGING: "Not a delayed-rotation setup",
        MARKET_NOT_BULLISH: "Broad market/BTC backdrop does not qualify",
        DATA_INSUFFICIENT: "7d/30d/90d calibration data incomplete",
        BENCHMARK: "BTC is the benchmark for this strategy",
      };
      const reason = !asset ? "No current research snapshot"
        : !snapshotFresh ? "Refresh market snapshot"
        : rotationReason[String(rotation?.status ?? "DATA_INSUFFICIENT")]
          ?? (confidence <= STRATEGY21_MIN_ORDER_CONFIDENCE_PCT ? "Confidence must exceed 50%" : asset?.strategy21?.eligibility?.failureReasons?.[0] ?? gate?.failureReasons[0] ?? "Wait");
      return { symbol, asset, confidence, score: researchScore(asset), rotationScore: Number(rotation?.score ?? 0), move, reason, ready,
        nextDollarScore: Number(asset?.strategy21?.nextDollarScore ?? 0) };
    }).sort((a, b) => {
      const priority = (row: typeof a) => row.ready ? 4 : row.move === "Qualified / wait" ? 3 : row.move === "Watch rotation" ? 2 : row.confidence > STRATEGY21_MIN_ORDER_CONFIDENCE_PCT ? 1 : 0;
      return priority(b) - priority(a)
        || b.rotationScore - a.rotationScore
        || b.nextDollarScore - a.nextDollarScore
        || b.score - a.score
        || a.symbol.localeCompare(b.symbol);
    });
  }, [watchlist, rankedAssets, assetMap, snapshotFresh, nowMs, account, instrumentRules,freeCash,reentryRisk]);

  const orderEvaluations = useMemo(() => LIVE_OPEN_ORDERS.map((order, index) => {
    const symbol = order.symbol.toUpperCase();
    const asset = assetMap.get(symbol);
    const holding = portfolioRows.find((row) => row.symbol === symbol);
    const current = extractPrice(asset) ?? (holding?.priceAvailable ? holding.livePrice : null);

    if (order.side === "BUY") {
      if (!snapshotFresh || !asset || current == null) {
        return {
          ...order,
          key: order.side + symbol + index,
          status: "VERIFY",
          suggestedPrice: null as number | null,
          suggestedAmountUsd: null as number | null,
          reason: "Current market evidence is unavailable or stale; do not change this order until refresh succeeds.",
        };
      }
      const gate = krakenLimitPurchaseGate(asset);
      const conf = confidencePct(asset);
      const rotation = asset?.strategy21?.delayedRotation ?? null;
      if (rotation?.status !== "QUALIFIED") {
        return {
          ...order,
          key: order.side + symbol + index,
          status: "PAUSE",
          suggestedPrice: null,
          suggestedAmountUsd: 0,
          reason: `Delayed-rotation pilot does not authorize new capital here (${String(rotation?.status ?? "DATA_INSUFFICIENT")}).`,
        };
      }
      if (!gate.pass || conf <= STRATEGY21_MIN_ORDER_CONFIDENCE_PCT) {
        const reason = gate.failureReasons[0] ?? (conf <= STRATEGY21_MIN_ORDER_CONFIDENCE_PCT
          ? `confidence ${conf.toFixed(1)}% must be above 50% for consideration`
          : "Kraken execution authority is zero");
        return {
          ...order,
          key: order.side + symbol + index,
          status: "PAUSE",
          suggestedPrice: null,
          suggestedAmountUsd: 0,
          reason: `Zobiris does not currently authorize this buy: ${reason}.`,
        };
      }

      const reference=entryReference(current,rotation?.recommendedPullbackPct,reentryRisk.has(symbol));
      // Review may reuse this order's reserved principal; other reservations remain protected.
      const budget=Math.max(0,Math.min(PROBE_TYPICAL_USD,gate.maxNextOrderUsd,(freeCash+order.amountUsd)/1.01));
      const checked=validateEntry(reference,budget,instrumentRules[symbol]);
      if(!checked.valid||checked.limit==null)return {...order,key:order.side+symbol+index,status:"VERIFY",suggestedPrice:null,suggestedAmountUsd:0,reason:checked.reason};
      const preferred=checked.limit, suggestedAmountUsd=checked.notional;

      let status = "KEEP";
      let reason = `Order is close to Zobiris's preferred entry ${entryPrice(preferred)}.`;
      if (order.targetPriceUsd >= current * 0.995 || order.targetPriceUsd > preferred * 1.02) {
        status = "MOVE LOWER";
        reason = `Current limit is too high versus the preferred entry; review the pilot reference ${entryPrice(preferred)}. This price-distance heuristic is not a fill forecast.`;
      } else if (order.targetPriceUsd < preferred * 0.95 && conf >= STRATEGY21_LATER_LINE_CONFIDENCE_PCT) {
        status = "MOVE UP";
        reason = `Order is materially below the preferred entry and may miss a strong setup; review the pilot reference ${entryPrice(preferred)}. This price-distance heuristic is not a fill forecast.`;
      }
      if (suggestedAmountUsd > 0 && order.amountUsd < suggestedAmountUsd * 0.75) {
        status += " / INCREASE SIZE";
        reason += ` New protocol size is about ${money(suggestedAmountUsd)}.`;
      } else if (suggestedAmountUsd > 0 && order.amountUsd > suggestedAmountUsd * 1.2) {
        status += " / REDUCE SIZE";
        reason += ` Cap the order near ${money(suggestedAmountUsd)}.`;
      }

      return {
        ...order,
        key: order.side + symbol + index,
        status,
        suggestedPrice: preferred,
        suggestedAmountUsd,
        reason,
      };
    }

    if (!holding || !holding.priceAvailable || current == null) {
      return {
        ...order,
        key: order.side + symbol + index,
        status: "VERIFY",
        suggestedPrice: null,
        suggestedAmountUsd: null,
        reason: "Current holding/price evidence is unavailable or stale.",
      };
    }

    const outlook = timeOutlookFor(symbol);
    if (outlook?.horizon === "L3" && outlook.protected) {
      return {
        ...order,
        key: order.side + symbol + index,
        status: "REVIEW / CORE HOLD",
        suggestedPrice: null,
        suggestedAmountUsd: 0,
        reason: "L3 long-term core: routine profit harvesting, weekly momentum, and normal pullbacks are not sell triggers. Review or cancel this sell order unless the holding is first downgraded to P2 after a documented thesis break, structural deterioration, or explicit user decision.",
      };
    }

    const plan = buildOrderPlan(holding, regime, reentryRisk.has(symbol));
    const siblingSellOrders = LIVE_OPEN_ORDERS
      .map((candidate, candidateIndex) => ({ candidate, candidateIndex }))
      .filter(({ candidate }) => candidate.side === "SELL" && candidate.symbol.toUpperCase() === symbol)
      .sort((a, b) => a.candidate.targetPriceUsd - b.candidate.targetPriceUsd || a.candidateIndex - b.candidateIndex);
    const ladderSlot = siblingSellOrders.findIndex(({ candidateIndex }) => candidateIndex === index);
    const slotTrimPct = ladderSlot === 0 ? plan.trimPct : ladderSlot === 1 ? plan.secondTrimPct : 0;
    const slotTarget = ladderSlot === 0 ? plan.harvestNear : ladderSlot === 1 ? plan.harvestHigh : null;
    const suggestedAmountUsd = slotTrimPct > 0
      ? Math.min(holding.value, holding.value * (slotTrimPct / 100))
      : 0;

    if (slotTarget == null || slotTrimPct <= 0) {
      return {
        ...order,
        key: order.side + symbol + index,
        status: ladderSlot === 0 ? "CANCEL PARTIAL TRIM" : "CANCEL SECOND TRIM",
        suggestedPrice: null,
        suggestedAmountUsd: 0,
        reason: ladderSlot === 0
          ? `This position does not support a meaningful partial sale of at least ${money(MIN_MEANINGFUL_TRIM_USD)}.`
          : `The next ladder slice is below ${money(MIN_MEANINGFUL_TRIM_USD)}; suppress the nuisance-size follow-up instead of stacking another small order.`,
      };
    }

    if (order.targetPriceUsd <= current * 1.001) {
      return {
        ...order,
        key: order.side + symbol + index,
        status: "VERIFY FIRST",
        suggestedPrice: slotTarget,
        suggestedAmountUsd,
        reason: accountSynced
          ? "Kraken still reports this order open even though its limit is at/below current market; verify the order conditions before changing it."
          : "This snapshot order is already at/below market and may have filled or been cancelled in Kraken.",
      };
    }

    let status = "KEEP";
    let reason = `Existing harvest order is inside Zobiris ladder line ${ladderSlot + 1}.`;
    if (order.targetPriceUsd < slotTarget * 0.97) {
      status = "MOVE UP";
      reason = `This ladder line is too low; Zobiris line ${ladderSlot + 1} is near ${money(slotTarget)}.`;
    } else if (order.targetPriceUsd > slotTarget * 1.05) {
      status = "MOVE DOWN";
      reason = `This ladder line is too high; Zobiris line ${ladderSlot + 1} is near ${money(slotTarget)}.`;
    }

    if (order.amountUsd < suggestedAmountUsd * 0.75) {
      status += " / INCREASE SIZE";
      reason += ` Resize this line toward ${money(suggestedAmountUsd)} so the action is meaningful.`;
    } else if (order.amountUsd > suggestedAmountUsd * 1.25) {
      status += " / REDUCE SIZE";
      reason += ` Resize this line toward ${money(suggestedAmountUsd)} instead of over-harvesting the position.`;
    }

    return {
      ...order,
      key: order.side + symbol + index,
      status,
      suggestedPrice: slotTarget,
      suggestedAmountUsd,
      reason,
    };
  }), [assetMap, portfolioRows, regime, reentryRisk, freeCash, snapshotFresh, nowMs, account, instrumentRules]);

  const strongestHoldingAction = [...portfolioRows]
    .filter((row) => !isLongTermProtected(row.symbol))
    .sort((a, b) => b.upl - a.upl)[0];

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
    <div className="zobiris-dashboard" style={styles.page}>
      <header style={styles.header}>
        <div>
          <div aria-label="ZOBIRIS CORE" style={styles.brand}><span className="brand-mark" aria-hidden="true">Z</span> ZOBIRIS <span className="brand-core">CORE</span></div>
          <div style={styles.subtle}>Portfolio decisions, market limits, and trade memory.</div>
        </div>
        <div className="header-actions" style={{display:"flex",gap:8,alignItems:"center",justifyContent:"flex-end",flexWrap:"wrap"}}>
          {operatorToken ? (
            <button
              type="button"
              style={{...styles.refreshButton,background:"linear-gradient(145deg,#243c47,#12232d)",color:"#edf5fa",border:"1px solid #54727f"}}
              onClick={() => {
                try { window.sessionStorage.removeItem("zobiris.operatorToken.v1"); } catch {}
                setOperatorToken("");
                setAccount(null);
              }}
            >
              <DashboardIcon name="lock" />Lock private portfolio
            </button>
          ) : (
            <button
              type="button"
              style={{...styles.refreshButton,background:"linear-gradient(145deg,#243c47,#12232d)",color:"#edf5fa",border:"1px solid #54727f"}}
              onClick={() => {
                const value = window.prompt("Enter the ZOBIRIS operator token")?.trim() ?? "";
                if (!value) return;
                try { window.sessionStorage.setItem("zobiris.operatorToken.v1", value); } catch {}
                setOperatorToken(value);
              }}
            >
              <DashboardIcon name="lock" />Unlock private portfolio
            </button>
          )}
          <button style={styles.refreshButton} onClick={() => void refresh()} disabled={refreshing}>
            <DashboardIcon name="refresh" />{refreshing ? "Refreshing…" : "Refresh market"}
          </button>
        </div>
      </header>

      <nav className="dashboard-nav" aria-label="Dashboard" style={styles.nav}>
        {([
          ["portfolio", "Portfolio"],
          ["market", "Market Today"],
          ["watchlist", "Watchlist"],
          ["outlook", "Time Outlook"],
          ["history", "History / Learning"],
          ["compare", "Compare Lab"],
        ] as Array<[View, string]>).map(([key, label]) => (
          <button aria-current={view === key ? "page" : undefined} key={key} onClick={() => setView(key)} style={view === key ? styles.navActive : styles.navButton}>
            <DashboardIcon name={key} />{label}
          </button>
        ))}
      </nav>

      <div className="dashboard-notice" style={styles.notice}>Market as of {Number.isFinite(snapshotMs) ? new Date(snapshotMs).toLocaleString() : "unavailable"}{snapshotFresh ? "" : " — refresh required"}. {accountSynced ? `Kraken account synced ${account?.syncMode === "websocket+poll" ? "live by WebSocket + REST reconciliation" : "by automatic REST polling"} · account as of ${new Date(LIVE_CAPTURED_AT).toLocaleString()}.` : "Private Kraken account data is locked on the public view."}</div>
      {error ? <div className="dashboard-notice" role="alert" style={styles.notice}>{error}</div> : null}
      {loading && !snapshot ? <div className="dashboard-notice" style={styles.notice}>Loading live Zobiris market data…</div> : null}

      {view === "portfolio" ? (
        <main>
          <section className="dashboard-metrics" aria-label="Portfolio overview" style={styles.metrics}>
            <Metric label="Portfolio" value={accountSynced ? money(total) : "Private"} />
            <Metric label="Cash" value={accountSynced?money(LIVE_CASH_USD):"Private"} note={accountSynced&&total>0?Math.round(LIVE_CASH_USD / total * 100) + "% of authenticated portfolio":"Private account is locked on the public view"} />
            <Metric label="Reserved buys" value={accountSynced ? money(reservedBuys) : "Private"} />
            <Metric label="Free cash" value={accountSynced ? money(freeCash) : "Private"} />
            <Metric label="Maneuver capital" value={accountSynced ? money(MANEUVER_CAPITAL_USD) : "Private"} note={accountSynced ? "Typical probe " + money(PROBE_TYPICAL_USD) + " · max probe " + money(PROBE_MAX_USD) : "Unlock to view capital limits"} />
          </section>

          <PortfolioVisuals rows={portfolioRows} cash={LIVE_CASH_USD} reserved={reservedBuys} accountSynced={accountSynced} />
          <ProfitProtection operatorToken={operatorToken} />
          <section className="dashboard-panel" style={styles.card}>
            <div style={styles.sectionHead}>
              <div>
                <h2 style={styles.h2}>Current positions</h2>
                <div style={styles.subtle}>{accountSynced ? `Kraken account snapshot ${new Date(LIVE_CAPTURED_AT).toLocaleString()}; prices refresh from the live Zobiris engine.` : "Private Kraken account snapshot is hidden; market prices still refresh from the live Zobiris engine."}</div>
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
                            <span className="asset-identity"><span className="asset-monogram" aria-hidden="true">{row.symbol.slice(0, 1)}</span><span><strong>{row.symbol}</strong><span className="asset-name" style={styles.tiny}>{row.name}</span></span></span>
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
                              openOrders={LIVE_OPEN_ORDERS}
                              cashUsd={LIVE_CASH_USD}
                              instrumentRule={instrumentRules[row.symbol]}
                            />
                          </td>
                        </tr>
                      ) : null}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
            {!portfolioRows.length && <div className="dashboard-empty"><strong>{accountSynced ? "No positions to display" : "Private account"}</strong>{accountSynced ? "Your synchronized positions will appear here." : "Unlock your portfolio above to view your current positions."}</div>}
          </section>

          <section className="dashboard-columns" style={styles.twoCol}>
            <div className="dashboard-panel" style={styles.card}>
              <h2 style={styles.h2}>Open orders</h2>
              {orderEvaluations.map((order) => (
                <div key={order.key} style={styles.orderReviewRow}>
                  <div>
                    <strong>{order.side} {order.symbol} — {order.status}</strong>
                    <div style={styles.tiny}>Current snapshot order: {money(order.amountUsd)} @ {money(order.targetPriceUsd)}</div>
                    <div style={styles.tiny}>{order.reason}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <strong>{order.suggestedPrice == null ? "VERIFY" : entryPrice(order.suggestedPrice)}</strong>
                    <div style={styles.tiny}>{order.suggestedAmountUsd == null ? "size pending" : order.suggestedAmountUsd <= 0 ? "no new size authorized" : "suggested " + money(order.suggestedAmountUsd)}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="dashboard-panel" style={styles.card}>
              <h2 style={styles.h2}>What matters now</h2>
              <DecisionLine title="Market posture" value={regime} detail={regime.toLowerCase().includes("break") ? "Use limits. Do not chase. Keep new entries small." : "Use staged limits and keep cash available."} />
              {strongestHoldingAction ? <DecisionLine title="Best harvest candidate" value={strongestHoldingAction.symbol + " " + pct(strongestHoldingAction.upl)} detail={strongestHoldingAction.action} /> : null}
              <DecisionLine title="New-entry guardrail" value="Max 2 new positions" detail="Avoid clustered entries; stage new exposure and preserve cash for better locations." />
            </div>
          </section>
        </main>
      ) : null}

      {view === "watchlist" ? <WatchlistPage research={researchEvidence.data?.assets??[]} refreshSummary={lastRefreshEvaluation} rows={watchlistRankings} now={nowMs} snapshotFresh={snapshotFresh} onAnalyze={symbol=>{setAnalysisSymbol(symbol);setView("compare");}} /> : null}

      {view === "market" ? (
        <main>
          <MarketBrief refreshKey={snapshotMs} />
          <ResearchEvidencePanel {...researchEvidence} />
          <section className="dashboard-panel" style={styles.heroCard}>
            <div style={styles.eyebrow}>TODAY</div>
            <h1 style={styles.h1}>{regime}</h1>
            <p style={styles.heroText}>
              Portfolio execution posture. Entry decisions below remain subject to their separate evidence and liquidity gates.
            </p>
            <div style={styles.heroStats}>
              <span>Regime confidence {regimeConfidence.toFixed(0)}%</span>
              <span>Free cash {money(freeCash)}</span>
              <span>Protocol capital {money(MANEUVER_CAPITAL_USD)}</span>
              <span>{watchlist.length || 50} watchlist assets</span>
            </div>
          </section>

          <section className="dashboard-panel" style={styles.card}>
            <h2 style={styles.h2}>Entry policy · consistent across every buy plan</h2>
            <div style={styles.subtle}>Live pilot: 4–8% pullback prior, plus 2 percentage points for recent re-entry risk (10% maximum). Buy prices and quantities round down to Kraken requirements. A lower price never overrides strategy, liquidity or capital gates.</div>
            <details style={{marginTop:12}}><summary>Upgraded entry research · shadow only</summary><p style={styles.tiny}>Structural support/retest, ATR, spread, fees and adverse selection belong in the next entry model. Minimum-edge research rule: max(all-in costs + adverse-selection buffer, 0.25 × ATR, 1.5 × spread), in basis points. LOQS and fill/missed-fill proxies remain unavailable until real inputs and forward validation exist. No fixture probabilities or invented optimal price.</p></details>
          </section>
          <section className="dashboard-panel" style={styles.card}>
            <h2 style={styles.h2}>New positions to consider</h2>
            <div style={styles.subtle}>Pilot mode: new capital only goes to 30d + 90d laggards with a fresh 7d recovery, and only through a pullback limit after Kraken execution gates pass.</div>
            <div style={{ marginTop: 14 }}>
              {candidates.length ? candidates.map((row, index) => (
                <div key={row.symbol} style={styles.candidate}>
                  <div style={styles.rank}>#{index + 1}</div>
                  <div style={{ flex: 1 }}>
                    <strong style={{ fontSize: 18 }}>{row.symbol}</strong>
                    <div style={styles.tiny}>Kraken execution gate passed · rotation qualified · max next order {money(row.maxNextOrderUsd)}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={styles.limitLabel}>LIMIT CANDIDATE · {money(row.orderUsd)}</div>
                    <strong style={{ fontSize: 18 }}>{entryPrice(row.limit)}</strong>
                    <div style={styles.tiny}>{Math.round(row.discount * 100)}% below current {money(row.price)} · initial PROBE only · {num(row.quantity, 12)} {row.symbol}</div>
                  </div>
                </div>
              )) : <div className="dashboard-notice" style={styles.notice}>{candidateResearchUniverse.some((symbol) => assetDetailLoading[symbol]) ? "Checking Kraken execution volume and liquidity gates…" : rankedAssets.length ? `No eligible limit candidates. Highest confidence ${highestConfidence.toFixed(1)}% (consideration requires more than ${STRATEGY21_MIN_ORDER_CONFIDENCE_PCT}%). ${incompleteKrakenHistory ? "14-day Kraken book/notional history is incomplete for some assets. " : ""}All entry and liquidity gates remain in force. Kraken tick/minimum checks must also pass; 1% cash buffer is reserved for fees (verify your fee tier).` : "Market research has not loaded yet."}</div>}
            </div>
          </section>

          <section className="dashboard-panel" style={styles.card}>
            <div style={styles.sectionHead}>
              <div>
                <h2 style={styles.h2}>Watchlist ranking</h2>
                <div style={styles.subtle}>Delayed-rotation candidates first. Near-rotation coins stay on watch; everything remains visible even when no new buy is authorized.</div>
              </div>
              <button type="button" style={styles.secondaryButton} onClick={() => setShowAllRankings(!showAllRankings)}>
                {showAllRankings ? "Show top 10" : `Show all ${watchlistRankings.length}`}
              </button>
            </div>
            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead><tr><th>Rank</th><th>Coin</th><th>Best move</th><th>Confidence</th><th>Research</th><th>Reason</th><th>Analysis</th></tr></thead>
                <tbody>{watchlistRankings.slice(0, showAllRankings ? undefined : 10).map((row, index) => (
                  <tr key={row.symbol}>
                    <td>#{index + 1}</td><td><strong>{row.symbol}</strong></td>
                    <td>{row.move}</td><td>{row.asset ? row.confidence.toFixed(1) + "%" : "—"}</td>
                    <td>{row.asset ? row.score.toFixed(1) : "—"}</td>
                    <td style={styles.tiny}>{row.reason}</td>
                    <td><button type="button" style={styles.secondaryButton} onClick={() => { setAnalysisSymbol(row.symbol); setView("compare"); }}>Analyze</button></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </section>

          <section className="dashboard-columns" style={styles.twoCol}>
            <div className="dashboard-panel" style={styles.card}>
              <h2 style={styles.h2}>Existing orders review</h2>
              {orderEvaluations.map((order) => (
                <div key={order.key} style={styles.orderReviewRow}>
                  <div style={{ flex: 1 }}>
                    <div style={styles.limitLabel}>{order.side} {order.symbol} · {order.status}</div>
                    <strong>{money(order.amountUsd)} @ {money(order.targetPriceUsd)}</strong>
                    <div style={styles.tiny}>{order.reason}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={styles.tiny}>Zobiris target</div>
                    <strong>{order.suggestedPrice == null ? "—" : entryPrice(order.suggestedPrice)}</strong>
                    <div style={styles.tiny}>{order.suggestedAmountUsd == null ? "reviewing size" : order.suggestedAmountUsd <= 0 ? "pause / no add" : money(order.suggestedAmountUsd)}</div>
                  </div>
                </div>
              ))}
              {!orderEvaluations.length ? <div className="dashboard-notice" style={styles.notice}>{accountSynced
                ? Number(account?.openOrdersReceivedCount ?? 0) > Number(account?.openOrdersParsedCount ?? 0)
                  ? `Kraken returned orders that Zobiris could not parse (${account.openOrdersParsedCount} of ${account.openOrdersReceivedCount}). Verify orders directly in Kraken until this is resolved.`
                  : "Kraken returned no open orders for this API key. If Kraken shows active limits, check that the API key belongs to the same Kraken account and has Query Open Orders & Trades access."
                : "Kraken account sync is unavailable. Verify active orders directly in Kraken."}</div> : null}
            </div>

            <div className="dashboard-panel" style={styles.card}>
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

      {view === "outlook" ? <TimeOutlookPage holdingSymbols={portfolioRows.map((row) => row.symbol)} /> : null}

      {view === "compare" ? <><ResearchEvidencePanel {...researchEvidence} symbol={analysisSymbol??undefined} /><CompareLab rankedAssets={rankedAssets} focusSymbol={analysisSymbol} /></> : null}

      {view === "history" ? (
        <main>
          <PilotScorecard />
          <section className="dashboard-metrics" aria-label="Portfolio overview" style={styles.metrics}>
            <Metric label="Unique trades" value={String(mergedTrades.length)} note="USD legs merged; duplicates removed" />
            <Metric label="Approx. realized" value={money(learning.realized)} note="gross FIFO on matched known-cost trades" />
            <Metric label="Closed proceeds" value={money(learning.matchedProceeds)} />
            <Metric label="Memory window" value="Sep 5–24" note="Rewards/transfers/dust excluded" />
          </section>

          <section className="dashboard-columns" style={styles.twoCol}>
            <div className="dashboard-panel" style={styles.card}>
              <h2 style={styles.h2}>What Zobiris has learned</h2>
              {LEARNING_RULES.map((rule) => (
                <div key={rule.title} style={styles.rule}>
                  <strong>{rule.title}</strong>
                  <div style={styles.tiny}>{rule.detail}</div>
                </div>
              ))}
              <div className="dashboard-notice" style={styles.notice}>Early sample only. These rules should gain or lose weight as more trades are recorded.</div>
            </div>

            <div className="dashboard-panel" style={styles.card}>
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

          <section className="dashboard-panel" style={styles.card}>
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
        {accountSynced ? "Portfolio quantities, cash, fills, and open orders are synchronized read-only from Kraken. " : "Private portfolio quantities, cash, fills, and open orders are not exposed on the public view. "}Live market prices and rankings come from the Zobiris Kraken/CMC engine. This is decision support, not automatic execution.
      </footer>
    </div>
  );
}

function Metric({ label, value, note }: { label: string; value: string; note?: string }) {
  return <div className="dashboard-metric" style={styles.metric}><div style={styles.tiny}>{label}</div><div style={styles.metricValue}>{value}</div>{note ? <div style={styles.tiny}>{note}</div> : null}</div>;
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
  openOrders,
  cashUsd,
  instrumentRule,
}: {
  row: any;
  regime: string;
  recentReentry: boolean;
  detail: any;
  loading: boolean;
  openOrders: Array<{ side: "BUY" | "SELL"; symbol: string; targetPriceUsd: number; amountUsd: number }>;
  cashUsd: number;
  instrumentRule?:EntryRules;
}) {
  const plan = buildOrderPlan(row, regime, recentReentry);
  const sellOrders = openOrders.filter((order) => order.side === "SELL" && order.symbol === row.symbol);
  const plannedSellUsd = sellOrders.reduce((sum, order) => sum + order.amountUsd, 0);
  const plannedPct = row.value > 0 ? (plannedSellUsd / row.value) * 100 : 0;
  const strategy = row.asset?.strategy21 ?? null;
  const outlook = timeOutlookFor(row.symbol);
  const longTermProtected = outlook?.horizon === "L3" && outlook.protected;
  const caseFile = detail?.caseFile ?? null;
  const eligibility = strategy?.eligibility?.status ?? "UNKNOWN";
  const nearestFlip = caseFile?.decisionBoundary?.nearestFlip ?? row.asset?.decisionBoundary?.nearestFlip ?? null;
  const failureReasons = Array.isArray(strategy?.eligibility?.failureReasons) ? strategy.eligibility.failureReasons : [];
  const purchaseGate = krakenLimitPurchaseGate({strategy21: strategy});
  const availableCash = Math.max(0, cashUsd - openOrders.filter(o => o.side === "BUY").reduce((sum,o) => sum + o.amountUsd,0));
  let watchOnly = strategy?.delayedRotation?.status !== "QUALIFIED" || !row.priceAvailable || !purchaseGate.pass || plan.confidence <= STRATEGY21_MIN_ORDER_CONFIDENCE_PCT || availableCash <= 0;
  const addCapacity = watchOnly ? 0 : Math.min(PROBE_TYPICAL_USD,purchaseGate.maxNextOrderUsd, availableCash/1.01);
  plan.firstAddPct = row.value > 0 ? Math.min(plan.firstAddPct, addCapacity / row.value * 100) : 0;
  plan.secondAddPct = row.value > 0 ? Math.min(plan.secondAddPct, Math.max(0, addCapacity - row.value * plan.firstAddPct / 100) / row.value * 100) : 0;
  const staleOrderWarning = sellOrders.some((order) => order.targetPriceUsd <= row.livePrice);
  const trimUsd = row.value * (plan.trimPct / 100);
  const trimQty = row.quantity * (plan.trimPct / 100);
  const secondTrimUsd = row.value * (plan.secondTrimPct / 100);
  const firstCheck=validateEntry(plan.buyNear,row.value*plan.firstAddPct/100,instrumentRule);
  const secondCheck=validateEntry(plan.buyDeep,row.value*plan.secondAddPct/100,instrumentRule);
  const firstAddUsd=firstCheck.valid?firstCheck.notional:0, firstAddQty=firstCheck.quantity;
  const secondAddUsd=secondCheck.valid?secondCheck.notional:0, secondAddQty=secondCheck.quantity;
  plan.firstAddPct=row.value>0?firstAddUsd/row.value*100:0;
  plan.secondAddPct=row.value>0?secondAddUsd/row.value*100:0;
  if(firstCheck.valid)plan.buyNear=firstCheck.limit!;
  if(secondCheck.valid)plan.buyDeep=secondCheck.limit!;
  watchOnly=watchOnly||!firstCheck.valid;

  const defensiveReduceUsd = row.value * (plan.defensiveReducePct / 100);
  const defensiveReduceQty = row.quantity * (plan.defensiveReducePct / 100);

  let firstActionTitle = "HOLD — WAIT FOR A BETTER ENTRY";
  let firstActionDetail = `Do not add at ${money(row.livePrice)}. ${watchOnly ? "No add authorized; research level only." : `First add ${num(plan.firstAddPct, 2)}% near ${entryPrice(plan.buyNear)}.`} Research level ${entryPrice(plan.buyNear)}.`;
  let learnedReason = "Your trade history favors staged limit entries over chasing strength.";

  if (!row.priceAvailable) {
    firstActionTitle = "VERIFY CURRENT PRICE FIRST";
    firstActionDetail = "Price is unavailable or stale. These are research estimates; refresh before placing any order.";
    learnedReason = "An old screenshot price cannot establish a current trade setup.";
  } else if (longTermProtected) {
    firstActionTitle = sellOrders.length
      ? "CORE HOLD — REVIEW EXISTING SELL ORDER"
      : "CORE HOLD — ROUTINE SELLING DISABLED";
    firstActionDetail = sellOrders.length
      ? `${row.symbol} is L3 long-term core (3–18+ months), but a sell order is still present in the synchronized Kraken account. Verify it and normally cancel it unless the holding is first downgraded to P2 after a documented thesis break, structural deterioration, or explicit user decision.`
      : `${row.symbol} is L3 long-term core (3–18+ months). Short-term profit, weekly weakness, or ordinary technical signals can trigger a review, but not a routine trim. Downgrade to P2 is required before normal sell logic resumes.`;
    learnedReason = "Long-term designation is now a separate user-governed policy layer, so a good short-term trade signal cannot silently override the intended holding horizon.";
  } else if (staleOrderWarning) {
    firstActionTitle = "VERIFY EXISTING KRAKEN ORDER FIRST";
    firstActionDetail = "Do not duplicate the synchronized Kraken order. If it is no longer open, recalculate the position plan from current evidence before placing a replacement.";
    learnedReason = "Zobiris learned to avoid stacking duplicate exits when an older order may already have filled.";
  } else if (row.upl >= 15 && plan.trimPct <= 0) {
    firstActionTitle = "HOLD — POSITION TOO SMALL FOR A USEFUL PARTIAL TRIM";
    firstActionDetail = `A normal trim would be below ${money(MIN_MEANINGFUL_TRIM_USD)}. Keep the position intact unless the thesis breaks badly enough to justify a full exit.`;
    learnedReason = "Zobiris now rejects nuisance-size trims that are too small to materially improve the portfolio.";
  } else if (row.upl >= 15) {
    firstActionTitle = `TRIM ${plan.trimPct}% AT ${money(plan.harvestNear)}`;
    firstActionDetail = `About ${num(trimQty, 8)} ${row.symbol} / ${money(trimUsd)}. Keep the remaining position as the runner.`;
    learnedReason = "Partial harvesting has been one of your better behaviors; fast re-entry after harvesting has been weaker.";
  } else if (!watchOnly && plan.score >= 55 && plan.confidence > STRATEGY21_MIN_ORDER_CONFIDENCE_PCT && row.upl < 8) {
    firstActionTitle = `ADD ${plan.firstAddPct}% AT ${entryPrice(plan.buyNear)}`;
    firstActionDetail = `About ${num(firstAddQty, 12)} ${row.symbol} / ${money(firstAddUsd)}. Use a limit, not a market chase.`;
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
          <div style={styles.subtle}>24h {pct(plan.change24h)} · confidence {plan.confidence.toFixed(0)}%</div>
        </div>
        <span style={actionStyle(longTermProtected ? "HOLD" : row.action)}>{longTermProtected ? "L3 CORE" : row.action}</span>
      </div>

      <div style={styles.firstAction}>
        <div style={styles.firstActionLabel}>BEST FIRST COURSE OF ACTION</div>
        <div style={styles.firstActionTitle}>{firstActionTitle}</div>
        <div style={styles.firstActionDetail}>{firstActionDetail}</div>
        <div style={styles.learnedWhy}><strong>Why Zobiris learned this:</strong> {learnedReason}</div>
      </div>

      {sellOrders.length ? (
        <div style={styles.existingPlan}>
          <strong>Existing sell orders from the synchronized Kraken account</strong>
          <div style={styles.tiny}>
            {sellOrders.map((order) => money(order.amountUsd) + " @ " + money(order.targetPriceUsd)).join(" · ")}
            {" "}({plannedPct.toFixed(0)}% of current position value)
          </div>
          {staleOrderWarning ? (
            <div style={styles.warningText}>One synchronized sell target is now at or below the live price. Verify Kraken before adding another order because it may already have filled or been cancelled.</div>
          ) : null}
        </div>
      ) : null}

      <div style={styles.planGrid}>
        {longTermProtected ? (
          <>
            <div style={styles.planCard}>
              <div style={styles.limitLabel}>LONG-TERM EXIT GATE</div>
              <strong>Protected — no routine harvest</strong>
              <div style={styles.tiny}>
                Weekly profit, a normal pullback, RSI/MACD changes, and ordinary harvest targets are review inputs only. They do not authorize a sale of an L3 core holding.
              </div>
            </div>
            <div style={styles.planCard}>
              <div style={styles.limitLabel}>DOWNGRADE REQUIRED</div>
              <strong>L3 → P2 before normal sell logic</strong>
              <div style={styles.tiny}>
                A documented thesis break, material structural deterioration, or explicit user decision must downgrade the holding before Zobiris can resume routine trim or defensive-reduction recommendations.
              </div>
            </div>
          </>
        ) : (
          <>
            <div style={styles.planCard}>
              <div style={styles.limitLabel}>SELL / HARVEST LADDER</div>
              <strong>{money(plan.harvestNear)} → {money(plan.harvestHigh)}</strong>
              <div style={styles.tiny}>
                {plan.trimPct > 0
                  ? <>Action 1: reduce {plan.trimPct}% ({num(trimQty, 8)} {row.symbol}, about {money(trimUsd)}) near {money(plan.harvestNear)}.</>
                  : <>No partial trim: the position is too small for a meaningful order.</>}
                {plan.secondTrimPct > 0
                  ? <>{" "}Action 2: reduce another {plan.secondTrimPct}% (about {money(secondTrimUsd)}) near {money(plan.harvestHigh)}.</>
                  : null}
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
          </>
        )}
        <div style={styles.planCard}>
          <div style={styles.limitLabel}>BUY / RE-ENTRY RANGE</div>
          <strong>{plan.buyNear>0?entryPrice(plan.buyNear):"Prior unavailable"}</strong>
          <div style={styles.tiny}>
            First add: {plan.firstAddPct}% of the current position (about {money(firstAddUsd)} / {num(firstAddQty, 12)} {row.symbol}) near {entryPrice(plan.buyNear)}.
            {" "}Second add: {plan.secondAddPct}% (about {money(secondAddUsd)} / {num(secondAddQty, 12)} {row.symbol}) near {entryPrice(plan.buyDeep)}.
            {" "}{plan.recentReentry ? "Your quick re-entry history pushes both sizes and prices lower. " : ""}
            {plan.open24h ? "24h open reference " + money(plan.open24h) + ". " : ""}
            Never chase above the range.
          </div>
        </div>
        <div style={styles.planCard}>
          <div style={styles.limitLabel}>OPENING / ADD STATUS</div>
          <strong>{watchOnly ? "WAIT — research range only" : "Eligible for staged limit"}</strong>
          <div style={styles.tiny}>
            Engine eligibility: {String(eligibility).replaceAll("_", " ")}. Rotation: {strategy?.delayedRotation?.status??"UNKNOWN"}. {firstCheck.reason}.
            {failureReasons.length ? " " + failureReasons[0] : ""}
          </div>
        </div>
      </div>

      <div style={styles.analysisText}>
        <strong>Why these levels</strong>
        <div style={styles.tiny}>
          {plan.regimeBreak ? "Regime Break widens entry discounts and tightens the reduction line. " : "Normal regime uses a narrower entry ladder. "}
          {longTermProtected
            ? "L3 core policy suppresses routine harvest and defensive-reduction instructions; short-term signals can still inform adds or trigger a thesis review, not a sale."
            : "Profit targets are set above both the live price and your cost basis, while re-entry levels move lower when research confidence is weak, the coin is already extended, or your trade history shows quick re-entry after selling."}
        </div>
        {nearestFlip ? <div style={styles.tiny}><strong>What would improve the signal:</strong> {nearestFlip}</div> : null}
        {loading ? <div style={styles.tiny}>Loading deeper asset analysis…</div> : null}
      </div>
    </div>
  );
}

function DashboardIcon({name}: {name: string}) {
  const paths: Record<string, string> = {
    portfolio: "M4 20V13h3v7M10 20V8h3v12M16 20V3h3v17",
    market: "M3 17l6-6 4 3 8-10M15 4h6v6",
    watchlist: "m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-2.9-5.6 2.9 1.1-6.2L3 9.6l6.2-.9Z",
    outlook: "M12 8v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0",
    history: "M12 5v15M3 4h5a4 4 0 0 1 4 2 4 4 0 0 1 4-2h5v14h-5a4 4 0 0 0-4 2 4 4 0 0 0-4-2H3Z",
    compare: "M9 3h6M10 3v7L4 20h16l-6-10V3M8 15h8",
    lock: "M7 10V7a5 5 0 0 1 10 0v3M6 10h12v11H6ZM12 14v3",
    refresh: "M20 7a9 9 0 1 0 1 8M20 3v5h-5",
  };
  return <svg className="dashboard-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name] ?? paths.portfolio}/></svg>;
}

function actionStyle(action: string): CSSProperties {
  if (/VERIFY|WAIT|WATCH|PENDING/.test(action)) return { ...styles.pill, borderColor: "#746039", color: "#ffd48a", background: "#332b20" };
  if (action.includes("TRIM") || action.includes("HARVEST")) return { ...styles.pill, borderColor: "#e9b44c", color: "#ffd67a" };
  if (action.includes("NO ADD") || action.includes("REVIEW")) return { ...styles.pill, borderColor: "#d45d79", color: "#ff91aa" };
  return { ...styles.pill, borderColor: "#3fcf8e", color: "#72efbd" };
}

const styles: Record<string, CSSProperties> = {
  page: { minHeight: "100vh", background: "#0a1118", color: "#f3f6fb", fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif", padding: "20px", boxSizing: "border-box" },
  header: { maxWidth: 1440, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, padding: "10px 0 18px" },
  brand: { fontWeight: 900, letterSpacing: 2, fontSize: 28 },
  subtle: { color: "#a7bdc9", fontSize: 13, lineHeight: 1.45 },
  tiny: { color: "#a7bdc9", fontSize: 12, lineHeight: 1.45, marginTop: 3 },
  nav: { maxWidth: 1440, margin: "0 auto 18px", display: "flex", gap: 8, borderBottom: "1px solid #304853", overflowX: "auto" },
  navButton: { background: "transparent", color: "#a7bdc9", borderTop: 0, borderLeft: 0, borderRight: 0, borderBottom: "2px solid transparent", padding: "12px 14px", cursor: "pointer", fontWeight: 700, whiteSpace: "nowrap" },
  navActive: { background: "#75eed6", color: "#082c2a", borderTop: 0, borderLeft: 0, borderRight: 0, borderBottom: "2px solid #a4fff0", padding: "12px 14px", cursor: "pointer", fontWeight: 800, whiteSpace: "nowrap" },
  refreshButton: { background: "linear-gradient(135deg,#8ff4df,#50d9ca)", color: "#082c2a", border: 0, borderRadius: 8, padding: "10px 14px", fontWeight: 800, cursor: "pointer" },
  secondaryButton: { background: "#182b35", color: "#d7dee9", border: "1px solid #36505c", borderRadius: 8, padding: "8px 11px", fontWeight: 700, cursor: "pointer" },
  metrics: { maxWidth: 1440, margin: "0 auto 16px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 },
  metric: { background: "#111e27", border: "1px solid #304853", borderRadius: 12, padding: 16 },
  metricValue: { fontSize: 28, fontWeight: 750, marginTop: 10, letterSpacing: -0.8 },
  card: { maxWidth: 1440, margin: "0 auto 16px", background: "#111e27", border: "1px solid #304853", borderRadius: 14, padding: 18, boxSizing: "border-box" },
  heroCard: { maxWidth: 1440, margin: "0 auto 16px", background: "linear-gradient(120deg, #1d393d, #11212b)", border: "1px solid #2a3040", borderRadius: 16, padding: 24, boxSizing: "border-box" },
  eyebrow: { color: "#88e9d0", fontSize: 11, fontWeight: 900, letterSpacing: 2 },
  h1: { fontSize: 36, margin: "6px 0 8px" },
  h2: { fontSize: 18, fontWeight: 700, margin: 0, letterSpacing: -0.2 },
  heroText: { color: "#c5ccd8", maxWidth: 760, lineHeight: 1.6, margin: "0 0 16px" },
  heroStats: { display: "flex", gap: 18, flexWrap: "wrap", color: "#a8bbd6", fontSize: 13 },
  sectionHead: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 12 },
  twoCol: { maxWidth: 1440, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))", gap: 16 },
  tableWrap: { overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse", minWidth: 680 },
  assetButton: { width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, background: "transparent", color: "inherit", border: 0, padding: 0, textAlign: "left", cursor: "pointer", font: "inherit" },
  chevron: { width: 24, height: 24, borderRadius: 7, display: "grid", placeItems: "center", background: "#28434e", color: "#c8d1df", fontWeight: 900, flex: "0 0 auto" },
  analysisCell: { padding: "8px 0 16px" },
  analysisPanel: { background: "#0c1922", border: "1px solid #365260", borderRadius: 12, padding: 16, marginTop: 6 },
  analysisHeader: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 12 },
  analysisTitle: { fontSize: 20, fontWeight: 900, marginTop: 4 },
  firstAction: { background: "#1b343d", border: "1px solid #4c6178", borderRadius: 12, padding: 15, marginBottom: 12 },
  firstActionLabel: { color: "#8fbfff", fontSize: 10, fontWeight: 900, letterSpacing: 1.2, marginBottom: 5 },
  firstActionTitle: { fontSize: 21, fontWeight: 950, lineHeight: 1.2 },
  firstActionDetail: { color: "#eef3f9", fontSize: 14, lineHeight: 1.5, marginTop: 6 },
  learnedWhy: { color: "#9facbd", fontSize: 12, lineHeight: 1.5, marginTop: 7 },
  existingPlan: { background: "#182b35", border: "1px solid #365260", borderRadius: 10, padding: 12, marginBottom: 12 },
  warningText: { color: "#ffd67a", fontSize: 12, lineHeight: 1.45, marginTop: 7 },
  planGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 10 },
  planCard: { background: "#142731", border: "1px solid #36505c", borderRadius: 10, padding: 12, minHeight: 96 },
  analysisText: { marginTop: 12, paddingTop: 12, borderTop: "1px solid #36505c", lineHeight: 1.45 },
  good: { color: "#4be2a0", fontWeight: 800 },
  bad: { color: "#ff708e", fontWeight: 800 },
  pill: { display: "inline-block", border: "1px solid", borderRadius: 999, padding: "5px 8px", fontSize: 11, fontWeight: 900, letterSpacing: 0.3 },
  orderRow: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "12px 0", borderBottom: "1px solid #304853" },
  orderReviewRow: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 14, padding: "13px 0", borderBottom: "1px solid #304853" },
  rule: { padding: "12px 0", borderBottom: "1px solid #304853", lineHeight: 1.45 },
  candidate: { display: "flex", alignItems: "center", gap: 14, padding: "14px 0", borderBottom: "1px solid #304853" },
  rank: { width: 34, height: 34, borderRadius: 10, display: "grid", placeItems: "center", background: "#28434e", color: "#b9c5d6", fontWeight: 900 },
  limitLabel: { color: "#88e9d0", fontWeight: 900, fontSize: 10, letterSpacing: 1.1 },
  notice: { maxWidth: 1440, margin: "0 auto 18px", lineHeight: 1.6, background: "#182b35", border: "1px solid #36505c", borderRadius: 10, padding: 12, color: "#a8bbd6", fontSize: 13 },
  formGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 8, marginTop: 14 },
  input: { background: "#0c1922", color: "#f3f6fb", border: "1px solid #36505c", borderRadius: 8, padding: "10px 11px", minWidth: 0 },
  footer: { maxWidth: 1440, margin: "28px auto 10px", paddingTop: 16, borderTop: "1px solid #304853", color: "#94a7c4", fontSize: 12, lineHeight: 1.5 },
};

export default App;


