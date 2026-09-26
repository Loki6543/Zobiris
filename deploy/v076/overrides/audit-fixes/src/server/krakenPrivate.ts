import { createHash, createHmac } from "node:crypto";
import { HOLDINGS as FALLBACK_HOLDINGS, OPEN_ORDERS as FALLBACK_ORDERS, CASH_USD as FALLBACK_CASH_USD, PORTFOLIO_CAPTURED_AT, TRADE_MEMORY as FALLBACK_TRADES } from "../ui/simplePortfolioData.js";

type Side = "BUY" | "SELL";

export type KrakenSyncedHolding = {
  symbol: string;
  name: string;
  quantity: number;
  avgPriceUsd: number | null;
  fallbackPriceUsd: number;
};

export type KrakenSyncedOrder = {
  id: string;
  side: Side;
  symbol: string;
  name: string;
  targetPriceUsd: number;
  amountUsd: number;
  quantity: number;
  remainingQuantity: number;
  status: string;
};

export type KrakenSyncedTrade = {
  id: string;
  at: string;
  symbol: string;
  side: Side;
  quantity: number;
  usd: number | null;
  feeUsd: number | null;
  priceUsd: number | null;
  orderType: "MARKET" | "LIMIT" | "INSTANT" | "INSTANT_MICRO";
  source: "Kraken private API";
};

export type KrakenAccountState = {
  privateAccountSynced: boolean;
  source: "Kraken private API" | "user-provided Kraken snapshot";
  capturedAt: string;
  cashUsd: number;
  holdings: KrakenSyncedHolding[];
  openOrders: KrakenSyncedOrder[];
  trades: KrakenSyncedTrade[];
  permissions: string[];
  dangerousPermissionsDetected: string[];
  websocketConnected: boolean;
  syncMode: "websocket+poll" | "poll" | "fallback";
  lastError: string | null;
};

const API_ROOT = "https://api.kraken.com";
const WS_URL = "wss://ws-auth.kraken.com/v2";
const POLL_MS = 60_000;
const MAX_FRESH_MS = 15_000;

const NAMES = new Map<string, string>([
  ...FALLBACK_HOLDINGS.map((h) => [h.symbol, h.name] as const),
  ...FALLBACK_ORDERS.map((o) => [o.symbol, o.name] as const),
  ["BTC", "Bitcoin"], ["ETH", "Ethereum"], ["SOL", "Solana"], ["XRP", "XRP"],
  ["XLM", "Stellar"], ["DOGE", "Dogecoin"], ["USD", "US Dollar"], ["EUR", "Euro"],
]);

const FALLBACK_AVG = new Map(FALLBACK_HOLDINGS.map((h) => [h.symbol, h.avgPriceUsd]));
const FALLBACK_PRICE = new Map(FALLBACK_HOLDINGS.map((h) => [h.symbol, h.fallbackPriceUsd]));

function fallbackState(): KrakenAccountState {
  return {
    privateAccountSynced: false,
    source: "user-provided Kraken snapshot",
    capturedAt: PORTFOLIO_CAPTURED_AT,
    cashUsd: FALLBACK_CASH_USD,
    holdings: FALLBACK_HOLDINGS.map((h) => ({ ...h })),
    openOrders: FALLBACK_ORDERS.map((o, index) => ({
      id: `manual-${index}`,
      ...o,
      quantity: o.targetPriceUsd > 0 ? o.amountUsd / o.targetPriceUsd : 0,
      remainingQuantity: o.targetPriceUsd > 0 ? o.amountUsd / o.targetPriceUsd : 0,
      status: "open",
    })),
    trades: FALLBACK_TRADES.map((t) => ({
      ...t,
      source: "Kraken private API" as const,
      feeUsd: null,
      priceUsd: t.usd != null && t.quantity > 0 ? t.usd / t.quantity : null,
    })),
    permissions: [],
    dangerousPermissionsDetected: [],
    websocketConnected: false,
    syncMode: "fallback",
    lastError: "Kraken private account sync has not completed yet.",
  };
}

let state = fallbackState();
let lastNonce = 0n;
let refreshInFlight: Promise<KrakenAccountState> | null = null;
let ws: any = null;
let wsReconnectTimer: ReturnType<typeof setTimeout> | null = null;
let wsRefreshTimer: ReturnType<typeof setTimeout> | null = null;
let pollTimer: ReturnType<typeof setInterval> | null = null;
let started = false;
let updateCallback: (() => void) | null = null;

function nextNonce(): string {
  const wall = BigInt(Date.now()) * 1000n;
  lastNonce = wall > lastNonce ? wall : lastNonce + 1n;
  return lastNonce.toString();
}

export function krakenSignature(path: string, nonce: string, postData: string, secretBase64: string): string {
  const sha = createHash("sha256").update(nonce + postData).digest();
  const message = Buffer.concat([Buffer.from(path), sha]);
  return createHmac("sha512", Buffer.from(secretBase64, "base64")).update(message).digest("base64");
}

function credentials() {
  const apiKey = process.env.KRAKEN_API_KEY?.trim() ?? "";
  const apiSecret = process.env.KRAKEN_SECRET_KEY?.trim() ?? "";
  return { apiKey, apiSecret, configured: Boolean(apiKey && apiSecret) };
}

async function privateCall(endpoint: string, params: Record<string, string> = {}): Promise<any> {
  const { apiKey, apiSecret, configured } = credentials();
  if (!configured) throw new Error("Kraken private API credentials are not configured.");
  const nonce = nextNonce();
  const body = new URLSearchParams({ nonce, ...params }).toString();
  const path = `/0/private/${endpoint}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);
  try {
    const response = await fetch(API_ROOT + path, {
      method: "POST",
      headers: {
        "API-Key": apiKey,
        "API-Sign": krakenSignature(path, nonce, body, apiSecret),
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "application/json",
      },
      body,
      signal: controller.signal,
    });
    const json = await response.json() as { error?: string[]; result?: unknown };
    const errors = Array.isArray(json.error) ? json.error.filter(Boolean) : [];
    if (!response.ok || errors.length) {
      throw new Error(errors.join("; ") || `Kraken HTTP ${response.status}`);
    }
    return json.result;
  } finally {
    clearTimeout(timeout);
  }
}

function normalizeAssetCode(raw: string): string {
  let code = String(raw ?? "").toUpperCase().split(".")[0]!.replace(/[^A-Z0-9]/g, "");
  const direct: Record<string, string> = {
    XXBT: "BTC", XBT: "BTC", BTC: "BTC",
    XETH: "ETH", ETH: "ETH",
    XXRP: "XRP", XRP: "XRP",
    XXLM: "XLM", XLM: "XLM",
    XXDG: "DOGE", XDG: "DOGE", DOGE: "DOGE",
    ZUSD: "USD", USD: "USD",
    ZEUR: "EUR", EUR: "EUR",
  };
  if (direct[code]) return direct[code]!;
  if ((code.startsWith("X") || code.startsWith("Z")) && code.length >= 4 && code.length <= 6) {
    const stripped = code.slice(1);
    if (/^[A-Z0-9]{3,5}$/.test(stripped)) code = stripped;
  }
  return direct[code] ?? code;
}

function symbolFromPair(rawPair: string): string {
  const pair = String(rawPair ?? "").toUpperCase();
  if (pair.includes("/")) return normalizeAssetCode(pair.split("/")[0]!);
  let clean = pair.replace(/[^A-Z0-9]/g, "");
  const quotes = ["ZUSD", "USDT", "USDC", "USD", "ZEUR", "EUR", "XXBT", "XBT", "BTC"];
  for (const quote of quotes) {
    if (clean.endsWith(quote) && clean.length > quote.length) {
      clean = clean.slice(0, -quote.length);
      break;
    }
  }
  return normalizeAssetCode(clean);
}

function nameFor(symbol: string): string {
  return NAMES.get(symbol) ?? symbol;
}

function aggregateBalances(raw: Record<string, unknown>): Map<string, number> {
  const totals = new Map<string, number>();
  for (const [asset, amountRaw] of Object.entries(raw ?? {})) {
    const amount = Number(amountRaw);
    if (!Number.isFinite(amount) || Math.abs(amount) < 1e-12) continue;
    const symbol = normalizeAssetCode(asset);
    totals.set(symbol, (totals.get(symbol) ?? 0) + amount);
  }
  return totals;
}

function parseOpenOrders(raw: any): KrakenSyncedOrder[] {
  const open = raw?.open && typeof raw.open === "object" ? raw.open : {};
  return Object.entries(open).flatMap(([id, value]) => {
    const order = value as any;
    const descr = order?.descr ?? {};
    const side = String(descr.type ?? order.type ?? "").toUpperCase();
    if (side !== "BUY" && side !== "SELL") return [];
    const targetPriceUsd = Number(descr.price ?? order.price ?? 0);
    const quantity = Number(order.vol ?? 0);
    const executed = Number(order.vol_exec ?? 0);
    const remainingQuantity = Math.max(0, quantity - (Number.isFinite(executed) ? executed : 0));
    const symbol = symbolFromPair(String(descr.pair ?? order.pair ?? ""));
    if (!symbol || !Number.isFinite(targetPriceUsd) || targetPriceUsd <= 0) return [];
    return [{
      id,
      side: side as Side,
      symbol,
      name: nameFor(symbol),
      targetPriceUsd,
      amountUsd: targetPriceUsd * remainingQuantity,
      quantity,
      remainingQuantity,
      status: String(order.status ?? "open"),
    }];
  });
}

function parseTrades(raw: any): KrakenSyncedTrade[] {
  const trades = raw?.trades && typeof raw.trades === "object" ? raw.trades : {};
  return Object.entries(trades).flatMap(([id, value]) => {
    const trade = value as any;
    const side = String(trade.type ?? "").toUpperCase();
    if (side !== "BUY" && side !== "SELL") return [];
    const quantity = Number(trade.vol ?? 0);
    const cost = Number(trade.cost ?? 0);
    const fee = Number(trade.fee ?? 0);
    const price = Number(trade.price ?? 0);
    const seconds = Number(trade.time ?? 0);
    const symbol = symbolFromPair(String(trade.pair ?? ""));
    if (!symbol || !Number.isFinite(quantity) || quantity <= 0) return [];
    return [{
      id,
      at: Number.isFinite(seconds) && seconds > 0 ? new Date(seconds * 1000).toISOString() : new Date().toISOString(),
      symbol,
      side: side as Side,
      quantity,
      usd: Number.isFinite(cost) ? cost : null,
      feeUsd: Number.isFinite(fee) ? fee : null,
      priceUsd: Number.isFinite(price) ? price : null,
      orderType: String(trade.ordertype ?? "").toLowerCase().includes("limit") ? "LIMIT" as const : "MARKET" as const,
      source: "Kraken private API" as const,
    }];
  }).sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
}

const DANGEROUS_PERMISSION_PATTERNS = [
  /modify-trades/i,
  /close-trades/i,
  /withdraw-funds/i,
  /add-funds/i,
  /earn-funds/i,
  /add-withdraw-address/i,
  /update-withdraw-address/i,
];

function dangerousPermissions(permissions: string[]): string[] {
  return permissions.filter((permission) => DANGEROUS_PERMISSION_PATTERNS.some((pattern) => pattern.test(permission)));
}

export function getKrakenAccountState(): KrakenAccountState {
  return {
    ...state,
    holdings: state.holdings.map((h) => ({ ...h })),
    openOrders: state.openOrders.map((o) => ({ ...o })),
    trades: state.trades.map((t) => ({ ...t })),
    permissions: [...state.permissions],
    dangerousPermissionsDetected: [...state.dangerousPermissionsDetected],
  };
}

export async function refreshKrakenAccount(options: { force?: boolean } = {}): Promise<KrakenAccountState> {
  const age = Date.now() - Date.parse(state.capturedAt);
  if (!options.force && state.privateAccountSynced && Number.isFinite(age) && age >= 0 && age < MAX_FRESH_MS) {
    return getKrakenAccountState();
  }
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    const { configured } = credentials();
    if (!configured) {
      state = { ...state, lastError: "Kraken private API credentials are not configured.", syncMode: "fallback" };
      return getKrakenAccountState();
    }
    try {
      // Keep private calls sequential so nonce order cannot race at Kraken.
      const keyInfo = await privateCall("GetApiKeyInfo");
      const balanceResult = await privateCall("Balance");
      const openOrdersResult = await privateCall("OpenOrders", { trades: "false" });
      const tradesResult = await privateCall("TradesHistory", { type: "all", trades: "false" });

      const balances = aggregateBalances(balanceResult as Record<string, unknown>);
      const cashUsd = balances.get("USD") ?? 0;
      const holdings: KrakenSyncedHolding[] = [...balances.entries()]
        .filter(([symbol, quantity]) => symbol !== "USD" && symbol !== "EUR" && quantity > 1e-10)
        .map(([symbol, quantity]) => ({
          symbol,
          name: nameFor(symbol),
          quantity,
          avgPriceUsd: FALLBACK_AVG.get(symbol) ?? null,
          fallbackPriceUsd: FALLBACK_PRICE.get(symbol) ?? 0,
        }))
        .sort((a, b) => a.symbol.localeCompare(b.symbol));

      const permissions = Array.isArray((keyInfo as any)?.permissions)
        ? (keyInfo as any).permissions.map((value: unknown) => String(value))
        : [];

      state = {
        privateAccountSynced: true,
        source: "Kraken private API",
        capturedAt: new Date().toISOString(),
        cashUsd,
        holdings,
        openOrders: parseOpenOrders(openOrdersResult),
        trades: parseTrades(tradesResult),
        permissions,
        dangerousPermissionsDetected: dangerousPermissions(permissions),
        websocketConnected: state.websocketConnected,
        syncMode: state.websocketConnected ? "websocket+poll" : "poll",
        lastError: null,
      };
      updateCallback?.();
      return getKrakenAccountState();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      state = {
        ...state,
        websocketConnected: state.websocketConnected,
        syncMode: state.privateAccountSynced ? (state.websocketConnected ? "websocket+poll" : "poll") : "fallback",
        lastError: message,
      };
      updateCallback?.();
      return getKrakenAccountState();
    }
  })();

  try {
    return await refreshInFlight;
  } finally {
    refreshInFlight = null;
  }
}

function scheduleWsRefresh() {
  if (wsRefreshTimer) clearTimeout(wsRefreshTimer);
  wsRefreshTimer = setTimeout(() => { void refreshKrakenAccount({ force: true }); }, 300);
}

async function connectPrivateWebSocket() {
  const WebSocketCtor = (globalThis as any).WebSocket;
  if (!WebSocketCtor || !credentials().configured) return;
  try {
    const tokenResult = await privateCall("GetWebSocketsToken");
    const token = String(tokenResult?.token ?? "");
    if (!token) throw new Error("Kraken did not return a WebSocket token.");

    if (ws) {
      try { ws.close(); } catch { /* noop */ }
    }
    ws = new WebSocketCtor(WS_URL);
    ws.addEventListener("open", () => {
      state = { ...state, websocketConnected: true, syncMode: state.privateAccountSynced ? "websocket+poll" : state.syncMode };
      updateCallback?.();
      ws.send(JSON.stringify({ method: "subscribe", params: { channel: "executions", snap_orders: true, snap_trades: true, order_status: true, token } }));
      ws.send(JSON.stringify({ method: "subscribe", params: { channel: "balances", snapshot: true, token } }));
    });
    ws.addEventListener("message", (event: any) => {
      try {
        const message = JSON.parse(String(event.data ?? "{}"));
        const channel = String(message?.channel ?? "");
        if (channel === "executions" || channel === "balances") scheduleWsRefresh();
      } catch {
        // Ignore malformed/non-JSON frames. Polling remains authoritative.
      }
    });
    ws.addEventListener("close", () => {
      state = { ...state, websocketConnected: false, syncMode: state.privateAccountSynced ? "poll" : "fallback" };
      updateCallback?.();
      if (wsReconnectTimer) clearTimeout(wsReconnectTimer);
      wsReconnectTimer = setTimeout(() => { void connectPrivateWebSocket(); }, 10_000);
    });
    ws.addEventListener("error", () => {
      state = { ...state, websocketConnected: false, syncMode: state.privateAccountSynced ? "poll" : "fallback" };
      updateCallback?.();
    });
  } catch (error) {
    state = { ...state, websocketConnected: false, lastError: error instanceof Error ? error.message : String(error) };
    updateCallback?.();
    if (wsReconnectTimer) clearTimeout(wsReconnectTimer);
    wsReconnectTimer = setTimeout(() => { void connectPrivateWebSocket(); }, 30_000);
  }
}

export function startKrakenAccountSync(onUpdate?: () => void) {
  if (onUpdate) updateCallback = onUpdate;
  if (started) return;
  started = true;
  void refreshKrakenAccount({ force: true }).then(() => void connectPrivateWebSocket());
  pollTimer = setInterval(() => { void refreshKrakenAccount({ force: true }); }, POLL_MS);
  pollTimer.unref?.();
}
