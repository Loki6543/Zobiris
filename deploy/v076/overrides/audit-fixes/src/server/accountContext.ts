import { CASH_USD, HOLDINGS, OPEN_ORDERS, MANEUVER_CAPITAL_USD, PORTFOLIO_CAPTURED_AT } from "../ui/simplePortfolioData.js";
import type { NormalizedObservation } from "../domain/index.js";
import type { PortfolioDependencyInput, PortfolioPositionInput } from "../strategy21/engine/portfolioDependency.js";

export const reservedBuysUsd = OPEN_ORDERS.filter(o => o.side === "BUY").reduce((s,o) => s + o.amountUsd, 0);
export const accountCapital = { maneuverNavUsd: MANEUVER_CAPITAL_USD, maneuverCashUsd: Math.max(0, CASH_USD - reservedBuysUsd), maneuverReservedUsd: reservedBuysUsd };
export const accountProvenance = { source: "user-provided Kraken snapshot", capturedAt: PORTFOLIO_CAPTURED_AT, privateAccountSynced: false, fundedCashUsd: CASH_USD, reservedBuysUsd, freeCashUsd: accountCapital.maneuverCashUsd };

export function buildAccountDependency(observations: NormalizedObservation[]): PortfolioDependencyInput {
  const prices = new Map<string, number>();
  // Use the newest eligible observation, preferring Kraken at equal timestamps.
  const sorted = [...observations].sort((a,b) => Date.parse(a.receivedAt) - Date.parse(b.receivedAt) || Number(a.provider === "kraken") - Number(b.provider === "kraken"));
  for (const observation of sorted) {
    const payload = observation.payload as Record<string, unknown>;
    const price = payload?.priceUsd;
    const symbol = String(payload?.symbol ?? "").toUpperCase();
    if (symbol && typeof price === "number" && Number.isFinite(price) && price > 0) prices.set(symbol, price);
  }
  const positions = new Map<string, PortfolioPositionInput>(HOLDINGS.map(h => [h.symbol, {
    symbol: h.symbol, currentExposureUsd: h.quantity * (prices.get(h.symbol) ?? h.fallbackPriceUsd),
  }]));
  for (const order of OPEN_ORDERS) {
    if (order.side !== "BUY") continue;
    const position = positions.get(order.symbol) ?? {symbol:order.symbol,currentExposureUsd:0};
    position.openBuyCommitmentUsd = (position.openBuyCommitmentUsd ?? 0) + order.amountUsd;
    positions.set(order.symbol, position);
  }
  // Unfilled sells do not release exposure or cash. Correlations remain unknown
  // until actual history is supplied, rather than inventing diversification.
  return { asOf: PORTFOLIO_CAPTURED_AT, positions: [...positions.values()], metadata: [], histories: [] };
}

// Provider-native identities verified with CMC on 2026-09-25. These supplement
// the CMC watchlist only for holdings and orders; no Kraken pair is assumed.
export const accountMappings = [
  {symbol:"AAVE",providerIds:{cmcNumericId:"7278",cmcSlug:"aave"},mappingStatus:"verified" as const,mappingConfidence:0.95,chainId:null,contractAddress:null},
  {symbol:"HBAR",providerIds:{cmcNumericId:"4642",cmcSlug:"hedera"},mappingStatus:"verified" as const,mappingConfidence:0.95,chainId:null,contractAddress:null},
  {symbol:"XRP",providerIds:{cmcNumericId:"52",cmcSlug:"xrp"},mappingStatus:"verified" as const,mappingConfidence:0.95,chainId:null,contractAddress:null},
];
