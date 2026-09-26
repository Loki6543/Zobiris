import { MANEUVER_CAPITAL_USD } from "../ui/simplePortfolioData.js";
import type { NormalizedObservation } from "../domain/index.js";
import type { PortfolioDependencyInput, PortfolioPositionInput } from "../strategy21/engine/portfolioDependency.js";
import { getKrakenAccountState, refreshKrakenAccount, startKrakenAccountSync } from "./krakenPrivate.js";

export let reservedBuysUsd = 0;
export const accountCapital = {
  maneuverNavUsd: MANEUVER_CAPITAL_USD,
  maneuverCashUsd: 0,
  maneuverReservedUsd: 0,
};
export const accountProvenance = {
  source: "user-provided Kraken snapshot",
  capturedAt: "",
  privateAccountSynced: false,
  fundedCashUsd: 0,
  reservedBuysUsd: 0,
  freeCashUsd: 0,
  syncMode: "fallback",
  websocketConnected: false,
  lastError: null as string | null,
  dangerousPermissionsDetected: [] as string[],
};

function synchronizeExportedContext() {
  const account = getKrakenAccountState();
  reservedBuysUsd = account.openOrders
    .filter((order) => order.side === "BUY")
    .reduce((sum, order) => sum + order.amountUsd, 0);

  accountCapital.maneuverNavUsd = MANEUVER_CAPITAL_USD;
  accountCapital.maneuverReservedUsd = reservedBuysUsd;
  accountCapital.maneuverCashUsd = Math.max(0, account.cashUsd - reservedBuysUsd);

  accountProvenance.source = account.source;
  accountProvenance.capturedAt = account.capturedAt;
  accountProvenance.privateAccountSynced = account.privateAccountSynced;
  accountProvenance.fundedCashUsd = account.cashUsd;
  accountProvenance.reservedBuysUsd = reservedBuysUsd;
  accountProvenance.freeCashUsd = accountCapital.maneuverCashUsd;
  accountProvenance.syncMode = account.syncMode;
  accountProvenance.websocketConnected = account.websocketConnected;
  accountProvenance.lastError = account.lastError;
  accountProvenance.dangerousPermissionsDetected = [...account.dangerousPermissionsDetected];
}

synchronizeExportedContext();

export async function refreshAccountContextFromKraken(options: { force?: boolean } = {}) {
  await refreshKrakenAccount(options);
  synchronizeExportedContext();
  return getAccountView();
}

export function startAccountContextSync() {
  startKrakenAccountSync(() => synchronizeExportedContext());
  synchronizeExportedContext();
}

export function getAccountView() {
  synchronizeExportedContext();
  const account = getKrakenAccountState();
  return {
    ...account,
    reservedBuysUsd,
    freeCashUsd: accountCapital.maneuverCashUsd,
    maneuverCapitalUsd: accountCapital.maneuverNavUsd,
  };
}

export function buildAccountDependency(observations: NormalizedObservation[]): PortfolioDependencyInput {
  synchronizeExportedContext();
  const account = getKrakenAccountState();
  const prices = new Map<string, number>();

  // Use the newest eligible observation, preferring Kraken at equal timestamps.
  const sorted = [...observations].sort(
    (a, b) =>
      Date.parse(a.receivedAt) - Date.parse(b.receivedAt) ||
      Number(a.provider === "kraken") - Number(b.provider === "kraken"),
  );
  for (const observation of sorted) {
    const payload = observation.payload as Record<string, unknown>;
    const price = payload?.priceUsd;
    const symbol = String(payload?.symbol ?? "").toUpperCase();
    if (symbol && typeof price === "number" && Number.isFinite(price) && price > 0) {
      prices.set(symbol, price);
    }
  }

  const positions = new Map<string, PortfolioPositionInput>(
    account.holdings.map((holding) => [
      holding.symbol,
      {
        symbol: holding.symbol,
        currentExposureUsd:
          holding.quantity *
          (prices.get(holding.symbol) ??
            (holding.fallbackPriceUsd > 0 ? holding.fallbackPriceUsd : 0)),
      },
    ]),
  );

  for (const order of account.openOrders) {
    if (order.side !== "BUY") continue;
    const position = positions.get(order.symbol) ?? {
      symbol: order.symbol,
      currentExposureUsd: 0,
    };
    position.openBuyCommitmentUsd =
      (position.openBuyCommitmentUsd ?? 0) + order.amountUsd;
    positions.set(order.symbol, position);
  }

  // Unfilled sells do not release exposure or cash. Correlations remain unknown
  // until actual history is supplied, rather than inventing diversification.
  return {
    asOf: account.capturedAt,
    positions: [...positions.values()],
    metadata: [],
    histories: [],
  };
}

// Provider-native identities verified with CMC on 2026-09-25. These supplement
// the CMC watchlist only for holdings and orders; no Kraken pair is assumed.
export const accountMappings = [
  { symbol: "AAVE", providerIds: { cmcNumericId: "7278", cmcSlug: "aave" }, mappingStatus: "verified" as const, mappingConfidence: 0.95, chainId: null, contractAddress: null },
  { symbol: "HBAR", providerIds: { cmcNumericId: "4642", cmcSlug: "hedera" }, mappingStatus: "verified" as const, mappingConfidence: 0.95, chainId: null, contractAddress: null },
  { symbol: "XRP", providerIds: { cmcNumericId: "52", cmcSlug: "xrp" }, mappingStatus: "verified" as const, mappingConfidence: 0.95, chainId: null, contractAddress: null },
];
