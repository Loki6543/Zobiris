import {
  entryReference,
  validateEntry,
  type EntryRules,
} from "../shared/entryPlan.js";
import { PROBE_TYPICAL_USD } from "../ui/simplePortfolioData.js";

// Presentation only: consume production strategy outputs; never recalculate qualification.
const states = new Set([
  "BENCHMARK",
  "DATA_INSUFFICIENT",
  "MARKET_NOT_BULLISH",
  "TOO_EARLY",
  "EXTENDED",
  "STRUCTURALLY_WEAK",
  "QUALIFIED",
  "NEAR_ROTATION",
  "NOT_LAGGING",
]);
const number = (v: unknown): number | null =>
  typeof v === "number" && Number.isFinite(v) ? v : null;
const time = (v: unknown): number | null => {
  const n =
    typeof v === "number" ? v : typeof v === "string" ? Date.parse(v) : NaN;
  return Number.isFinite(n) ? n : null;
};
const fresh = (v: unknown, now: number, ttl: number) => {
  const t = time(v);
  return t !== null && t <= now && now - t <= ttl;
};
const score = (v: unknown) => {
  const n = number(v);
  return n !== null && n >= 0 && n <= 100 ? n / 100 : null;
};
const list = (v: any): any[] => {
  if (typeof v === "string") {
    try {
      v = JSON.parse(v);
    } catch {
      return [];
    }
  }
  return Array.isArray(v) ? v : [];
};
type Input = {
  snapshot: any;
  watchlist: { symbol: string }[];
  account: any;
  rules: Record<string, EntryRules>;
  now?: number;
  rewardRemaining?: number | null;
};

export function buildZobirisWatchlist({
  snapshot,
  watchlist,
  account,
  rules,
  now = Date.now(),
  rewardRemaining = null,
}: Input) {
  const ranked = list(snapshot?.rankedAssets),
    bySymbol = new Map(ranked.map((a) => [a.symbol, a]));
  const accountFresh =
    account?.privateAccountSynced === true &&
    !account.lastError &&
    fresh(account.capturedAt, now, 5 * 60000);
  const holdings = accountFresh ? list(account.holdings) : [],
    orders = accountFresh ? list(account.openOrders) : [];
  const freeCash = accountFresh ? number(account.freeCashUsd) : null;
  const validCash = freeCash !== null && freeCash >= 0 ? freeCash : null;
  const snapshotFresh = fresh(snapshot?.asOf, now, 30 * 60000);
  const calibration = ranked.find(
    (a) => a?.strategy21?.delayedRotationCalibration,
  )?.strategy21.delayedRotationCalibration;
  // Calibration has no separate timestamp. Require fresh source observations as well as snapshot time.
  const evidenceFresh =
    ranked.length > 0 &&
    ranked.filter((a) => a?.strategy21?.delayedRotation?.observedAt != null)
      .length > 0 &&
    ranked
      .filter((a) => a?.strategy21?.delayedRotation?.observedAt != null)
      .every((a) =>
        fresh(a.strategy21.delayedRotation.observedAt, now, 30 * 60000),
      );
  const gateKnown =
    snapshotFresh &&
    evidenceFresh &&
    calibration &&
    ["BULLISH", "NOT_BULLISH"].includes(calibration.marketStatus) &&
    typeof calibration.marketBullish === "boolean";
  const marketGate = {
    pass: gateKnown ? (calibration.marketBullish as boolean) : null,
    btc30d: number(calibration?.btc?.change30dPct),
    btc90d: number(calibration?.btc?.change90dPct),
    breadth7d: number(calibration?.breadth7dPositive),
    breadth30d: number(calibration?.breadth30dPositive),
    comparables: number(calibration?.sampleSize),
  };
  const reentries = new Set<string>(),
    lastSell = new Map<string, number>();
  for (const t of [...list(account?.trades)].sort(
    (a, b) => (time(a.at) ?? 0) - (time(b.at) ?? 0),
  )) {
    const at = time(t.at);
    if (at === null || at > now) continue;
    if (t.side === "SELL") lastSell.set(t.symbol, at);
    else if (
      t.side === "BUY" &&
      lastSell.has(t.symbol) &&
      at - lastSell.get(t.symbol)! <= 7 * 86400000
    )
      reentries.add(t.symbol);
  }
  const intentional = holdings.filter((h) => {
    const q = number(h.quantity);
    return (
      q !== null &&
      q > 0 &&
      (h.symbol !== "BABY" ||
        rewardRemaining == null ||
        q - rewardRemaining > 1e-12)
    );
  });
  const symbols = [
    ...new Set(
      watchlist.map((a) => String(a.symbol).toUpperCase()).filter(Boolean),
    ),
  ];
  const assets = symbols.map((symbol) => {
    const asset = bySymbol.get(symbol),
      strategy = asset?.strategy21,
      rotation = strategy?.delayedRotation;
    const state = states.has(rotation?.status)
      ? String(rotation.status)
      : "DATA_INSUFFICIENT";
    const observed = time(rotation?.observedAt),
      rawPrice = number(rotation?.priceUsd),
      price = rawPrice !== null && rawPrice > 0 ? rawPrice : null;
    const holding = holdings.find((h) => h.symbol === symbol),
      symbolOrders = orders.filter((o) => o.symbol === symbol);
    const quantity = accountFresh
      ? holding
        ? number(holding.quantity)
        : 0
      : null;
    const baseline = number(rotation?.recommendedPullbackPct),
      reentry =
        accountFresh && Array.isArray(account?.trades)
          ? reentries.has(symbol)
          : null;
    const discount =
      baseline !== null && baseline >= 4 && baseline <= 8 ? baseline : null;
    const effective =
      discount !== null && reentry !== null
        ? Math.min(10, discount + (reentry ? 2 : 0))
        : null;
    const authority = number(strategy?.positionAuthority?.maxNextOrderUsd),
      eligibleMax = number(strategy?.eligibility?.maximumOrderUsd);
    const eligibility = strategy?.eligibility,
      integrity = strategy?.researchIntegrity;
    const failures = list(eligibility?.failureReasons).filter(
      (v) => typeof v === "string",
    );
    const reasons: string[] = [];
    if (!snapshotFresh || !fresh(observed, now, 30 * 60000))
      reasons.push("Market observation is stale, missing or future-dated");
    if (marketGate.pass !== true)
      reasons.push(
        marketGate.pass === false
          ? "Market gate failed"
          : "Market gate is unknown",
      );
    if (state !== "QUALIFIED")
      reasons.push(`Pilot state: ${state}; not an exit instruction`);
    if (asset?.mappingStatus !== "verified")
      reasons.push("Asset identity is not verified");
    if (price === null) reasons.push("Price unavailable");
    if (!accountFresh || validCash === null || reentry === null)
      reasons.push("Fresh account/cash/trade context unavailable");
    if (symbolOrders.length)
      reasons.push("Existing order requires review in Portfolio");
    if (
      !["ACTIVE_ELIGIBLE", "CONDITIONAL_PROBE_ELIGIBLE"].includes(
        eligibility?.status,
      )
    )
      reasons.push("Kraken execution eligibility does not pass");
    if (integrity && integrity?.risk?.researchEligibility !== "ELIGIBLE")
      reasons.push("Research integrity does not pass");
    reasons.push(...failures);
    if ((number(asset?.confidence?.pct) ?? 0) <= 50)
      reasons.push("Confidence must exceed 50%");
    if (
      authority === null ||
      eligibleMax === null ||
      Math.min(authority, eligibleMax) <= 0
    )
      reasons.push("Next-order authority unavailable or zero");
    const budget = Math.max(
      0,
      Math.min(
        PROBE_TYPICAL_USD,
        authority ?? 0,
        eligibleMax ?? 0,
        (validCash ?? 0) / 1.01,
      ),
    );
    const check = validateEntry(
      price !== null && reentry !== null
        ? entryReference(price, discount, reentry)
        : null,
      budget,
      rules[symbol],
      now,
    );
    if (!check.valid) reasons.push(check.reason);
    return {
      symbol,
      krakenPair: rules[symbol]?.pair ?? null,
      price,
      returns: {
        h24: number(rotation?.change24hPct),
        d7: number(rotation?.change7dPct),
        d30: number(rotation?.change30dPct),
        d90: number(rotation?.change90dPct),
      },
      state,
      blockedReason: reasons.length ? [...new Set(reasons)].join("; ") : null,
      scores: {
        rotation: score(rotation?.score),
        nextDollar: score(strategy?.nextDollarScore),
        research: score(strategy?.researchScore),
      },
      entry: {
        baselineDiscountPct: discount,
        reentry,
        effectiveDiscountPct: effective,
        referencePrice: price,
        referenceLimit: reasons.length ? null : check.limit,
      },
      position: {
        held: quantity === null ? null : quantity > 0,
        quantity,
        openOrderDisposition: symbolOrders.length ? "VERIFY" : null,
      },
      observationMs: observed,
    };
  });
  const asOf = time(snapshot?.asOf);
  return {
    asOf: asOf === null ? null : new Date(asOf).toISOString(),
    marketGate,
    portfolio: {
      holdings: accountFresh ? intentional.length : null,
      maxHoldings: 7,
      freeCash: validCash,
    },
    assets,
  };
}
