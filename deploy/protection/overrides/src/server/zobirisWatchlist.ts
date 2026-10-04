import {
  entryReference,
  validateEntry,
  type EntryRules,
} from "../shared/entryPlan.js";
import { PROBE_TYPICAL_USD } from "../ui/simplePortfolioData.js";
import { priceSentimentShadow, type SocialIntelligenceSummary } from "./socialIntelligence.js";
import { buildCrossAssetGraph } from "./crossAssetGraph.js";
import { evaluateSwarmShadow } from "../strategy21/swarm.js";
import type { HyperliquidPositioningSummary } from "./hyperliquidPositioning.js";
import { fileURLToPath } from "node:url";
import { evaluatePortfolioBatch, type PortfolioState } from "./policy/portfolioGate.js";
import { bindDecision, loadRegistry, portfolioPolicyFromRegistry } from "./policy/zobirisPolicyBinding.js";

const POLICY_REGISTRY = (() => {
  try {
    return loadRegistry(fileURLToPath(new URL("./policy/zobiris-policy-registry-v3.1.json", import.meta.url)));
  } catch {
    return null;
  }
})();

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
  socialIntelligence?: Map<string, SocialIntelligenceSummary>;
  perpPositioning?: Map<string, HyperliquidPositioningSummary>;
};

export function buildZobirisWatchlist({
  snapshot,
  watchlist,
  account,
  rules,
  now = Date.now(),
  rewardRemaining = null,
  socialIntelligence = new Map(),
  perpPositioning = new Map(),
}: Input) {
  const ranked = list(snapshot?.rankedAssets),
    bySymbol = new Map(ranked.map((a) => [a.symbol, a]));
  const graphShadow = buildCrossAssetGraph(
    ranked.map((asset) => {
      const rotation = asset?.strategy21?.delayedRotation;
      const observationFresh = fresh(rotation?.observedAt, now, 30 * 60000);
      return {
        symbol: String(asset?.symbol ?? "").toUpperCase(),
        change24hPct: observationFresh ? number(rotation?.change24hPct) : null,
        change7dPct: observationFresh ? number(rotation?.change7dPct) : null,
        change30dPct: observationFresh ? number(rotation?.change30dPct) : null,
        change90dPct: observationFresh ? number(rotation?.change90dPct) : null,
      };
    }),
  );
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
    const graph = graphShadow.get(symbol) ?? null;
    const positioning = perpPositioning.get(symbol) ?? null;
    const failures = list(eligibility?.failureReasons).filter(
      (v) => typeof v === "string",
    );
    const reasons: string[] = [];
    if (!POLICY_REGISTRY) reasons.push("POLICY_REGISTRY_UNAVAILABLE");
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
    const socialShadow = priceSentimentShadow(
      socialIntelligence.get(symbol),
      number(rotation?.change24hPct),
    );
    const swarmShadow = evaluateSwarmShadow({
      symbol,
      nowMs: now,
      snapshotFresh,
      observationFresh: fresh(observed, now, 30 * 60000),
      priceUsd: price,
      marketGate,
      rotationScore: score(rotation?.score),
      recommendedPullbackPct: effective ?? discount,
      eligibilityStatus:
        typeof eligibility?.status === "string" ? eligibility.status : null,
      eligibleMaxUsd: eligibleMax,
      positionAuthorityUsd: authority,
      researchEligibility:
        typeof integrity?.risk?.researchEligibility === "string"
          ? integrity.risk.researchEligibility
          : null,
      accountFresh,
      freeCashUsd: validCash,
      reentry,
      hasOpenOrder: symbolOrders.length > 0,
      confidencePct: number(asset?.confidence?.pct),
      socialShadow,
      graphShadow: graph,
      perpPositioning: positioning,
      blockedReasonCount: reasons.length,
    });
    return {
      symbol,
      krakenPair: rules[symbol]?.pair ?? null,
      krakenWsPair: rules[symbol]?.wsPair ?? null,
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
      socialShadow,
      graphShadow: graph,
      perpPositioningShadow: positioning,
      swarmShadow,
      entry: {
        baselineDiscountPct: discount,
        reentry,
        effectiveDiscountPct: effective,
        referencePrice: price,
        referenceLimit: reasons.length ? null : check.limit,
        requestedNotionalUsd: reasons.length ? null : check.notional,
        graphShadowPullbackAdjustmentPct:
          graph?.entryPullbackAdjustmentPct ?? null,
        graphShadowReferencePrice:
          reasons.length === 0 &&
          price !== null &&
          effective !== null &&
          graph?.available === true &&
          (graph.entryPullbackAdjustmentPct ?? 0) > 0
            ? price *
              (1 -
                Math.min(
                  10,
                  effective + graph.entryPullbackAdjustmentPct,
                ) /
                  100)
            : null,
        graphShadowAuthority:
          graph?.authority ?? "SHADOW_ONLY_NO_ENTRY_SCORE_CHANGE",
      },
      position: {
        held: quantity === null ? null : quantity > 0,
        quantity,
        openOrderDisposition: symbolOrders.length ? "VERIFY" : null,
      },
      observationMs: observed,
    };
  });
  let gatedAssets = assets;
  if (POLICY_REGISTRY && accountFresh) {
    const byAsset = new Map(assets.map((asset) => [asset.symbol, asset]));
    const gateState: PortfolioState = {
      asOf: String(account.capturedAt ?? ""),
      cashUsd: validCash ?? Number.NaN,
      cashBasis: "NET_OF_OPEN_ORDERS",
      holdings: list(account.holdings).map((holding) => {
        const symbol = String(holding.symbol ?? "").toUpperCase();
        const quantity = number(holding.quantity);
        const mark = byAsset.get(symbol)?.price ?? null;
        const valueUsd = quantity !== null && quantity >= 0 && typeof mark === "number" && mark > 0
          ? quantity * mark
          : Number.NaN;
        const intentionalHolding = symbol !== "BABY"
          || rewardRemaining == null
          || (quantity ?? 0) - rewardRemaining > 1e-12;
        return { symbol, valueUsd, intentional: intentionalHolding };
      }),
      openOrders: list(account.openOrders).map((order) => ({
        symbol: String(order.symbol ?? "").toUpperCase(),
        side: String(order.side ?? "").toUpperCase() === "SELL" ? "sell" as const : "buy" as const,
        notionalUsd: number(order.amountUsd) ?? Number.NaN,
      })),
      pendingSellProceedsUsd: 0,
    };
    const candidates = assets
      .filter((asset) => asset.entry.referenceLimit != null && asset.entry.requestedNotionalUsd != null)
      .map((asset) => ({
        symbol: asset.symbol,
        action: asset.position.held ? "ADD" as const : "NEW_BUY" as const,
        requestedUsd: asset.entry.requestedNotionalUsd as number,
      }));
    const gateResults = evaluatePortfolioBatch(
      gateState,
      candidates,
      portfolioPolicyFromRegistry(POLICY_REGISTRY),
      now,
    );
    const byGate = new Map(gateResults.map((result) => [result.symbol, result]));
    gatedAssets = assets.map((asset) => {
      const gate = byGate.get(asset.symbol);
      if (!gate) return { ...asset, portfolioGate: null };
      if (gate.decision === "BLOCK") {
        const reason = ["PORTFOLIO_GATE_BLOCK", ...gate.reasons].join(":");
        return {
          ...asset,
          blockedReason: [asset.blockedReason, reason].filter(Boolean).join("; "),
          entry: { ...asset.entry, referenceLimit: null, requestedNotionalUsd: null },
          portfolioGate: gate,
        };
      }
      if (gate.decision === "REDUCE") {
        const ref = typeof asset.entry.referencePrice === "number"
          ? entryReference(
              asset.entry.referencePrice,
              asset.entry.baselineDiscountPct,
              asset.entry.reentry === true,
            )
          : null;
        const checked = validateEntry(ref, gate.allowedUsd, rules[asset.symbol], now);
        if (!checked.valid) {
          return {
            ...asset,
            blockedReason: [asset.blockedReason, "PORTFOLIO_GATE_REVALIDATION_FAILED:" + checked.reason].filter(Boolean).join("; "),
            entry: { ...asset.entry, referenceLimit: null, requestedNotionalUsd: null },
            portfolioGate: gate,
          };
        }
        return {
          ...asset,
          entry: { ...asset.entry, referenceLimit: checked.limit, requestedNotionalUsd: checked.notional },
          portfolioGate: gate,
        };
      }
      return { ...asset, portfolioGate: gate };
    });
  }

  const asOf = time(snapshot?.asOf);
  const output = {
    asOf: asOf === null ? null : new Date(asOf).toISOString(),
    marketGate,
    portfolio: {
      holdings: accountFresh ? intentional.length : null,
      maxHoldings: POLICY_REGISTRY ? portfolioPolicyFromRegistry(POLICY_REGISTRY).intentionalHoldingsMax : 7,
      freeCash: validCash,
    },
    assets: gatedAssets,
  };
  return POLICY_REGISTRY ? bindDecision(POLICY_REGISTRY, output) : output;
}
