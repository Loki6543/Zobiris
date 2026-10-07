export type HoldingSeed = {
  symbol: string;
  name: string;
  quantity: number;
  avgPriceUsd: number | null;
  fallbackPriceUsd: number;
};

export type OrderSeed = {
  side: "BUY" | "SELL";
  symbol: string;
  name: string;
  targetPriceUsd: number;
  amountUsd: number;
};

export type TradeMemory = {
  id: string;
  at: string;
  symbol: string;
  side: "BUY" | "SELL";
  quantity: number;
  usd: number | null;
  orderType: "MARKET" | "LIMIT" | "INSTANT" | "INSTANT_MICRO";
  source: "Kraken trades export" | "Kraken ledger screenshot";
};

// SANITIZED EXPORT:
// Real portfolio balances, cost bases, cash, order history, trade IDs and
// timestamps are intentionally omitted. These placeholders exist only to keep
// the source interface understandable outside the private deployment.
export const PORTFOLIO_CAPTURED_AT = "";
export const CASH_BEFORE_INFLOW_USD = 0;
export const CASH_INFLOW_USD = 0;
export const CASH_UPDATED_AT = "";
export const CASH_USD = 0;

export const MANEUVER_CAPITAL_USD = 1000;
export const PROBE_TYPICAL_USD = MANEUVER_CAPITAL_USD * 0.02;
export const PROBE_MAX_USD = MANEUVER_CAPITAL_USD * 0.025;
export const STATE_DEPLOYMENT_CAPS_USD = {
  UNCERTAIN: MANEUVER_CAPITAL_USD * 0.15,
  DELEVERAGED_ACCUMULATION: MANEUVER_CAPITAL_USD * 0.55,
  BROAD_EXPANSION: MANEUVER_CAPITAL_USD * 0.85,
  LEVERAGED_EXPANSION: MANEUVER_CAPITAL_USD * 0.45,
  EUPHORIA: MANEUVER_CAPITAL_USD * 0.10,
  DETERIORATION: MANEUVER_CAPITAL_USD * 0.10,
  CAPITULATION: MANEUVER_CAPITAL_USD * 0.35,
  SYSTEMIC_BREAK: 0,
} as const;

export const HOLDINGS: HoldingSeed[] = [];
export const OPEN_ORDERS: OrderSeed[] = [];
export const TRADE_MEMORY: TradeMemory[] = [];
