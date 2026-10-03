export type SwarmSpecialistId =
  | "regime"
  | "entry"
  | "liquidity"
  | "relative"
  | "sentiment"
  | "onchainWhale"
  | "portfolioRisk"
  | "critic";

export type SwarmSignalState = "KNOWN" | "UNKNOWN" | "FAIL_CLOSED";
export type SwarmIntegrityStatus = "PASS" | "DEGRADED" | "FAIL_CLOSED";

export type SwarmSpecialist = {
  id: SwarmSpecialistId;
  state: SwarmSignalState;
  score: number | null;
  reliability: number;
  baseWeight: number;
  independenceFactor: number;
  effectiveWeight: number;
  evidenceFamily: string;
  reasons: string[];
};

export type SwarmShadow = {
  version: "ZOBIRIS_SWARM_V1";
  authority: "SHADOW_ONLY_NO_TRADING_AUTHORITY";
  symbol: string;
  integrity: {
    status: SwarmIntegrityStatus;
    criticalIssues: string[];
    unknownSpecialists: SwarmSpecialistId[];
    portfolioRecommendationAllowed: boolean;
  };
  specialists: Record<SwarmSpecialistId, SwarmSpecialist>;
  consensus: {
    score: number | null;
    confidencePct: number;
    coveragePct: number;
    disagreementPct: number;
    reliabilityPct: number;
    regimeAdjustmentPctPoints: number;
    correlationDiscountPct: number;
  };
  entryQuality: {
    shadowDeltaPctPoints: number;
    productionScoreChanged: false;
  };
  ranking: {
    shadowScore: number | null;
    productionRankChanged: false;
  };
  executionBoundary: {
    mayIncreaseOrderSize: false;
    mayBypassEligibility: false;
    mayBypassLiquidity: false;
    mayBypassSecurity: false;
    positionAuthorityEffectUsd: 0;
  };
};

export type SwarmContext = {
  symbol: string;
  snapshotFresh: boolean;
  observationFresh: boolean;
  priceUsd: number | null;
  marketGate: {
    pass: boolean | null;
    btc30d?: number | null;
    btc90d?: number | null;
    breadth7d?: number | null;
    breadth30d?: number | null;
  };
  rotationScore: number | null;
  recommendedPullbackPct: number | null;
  eligibilityStatus: string | null;
  eligibleMaxUsd: number | null;
  positionAuthorityUsd: number | null;
  researchEligibility: string | null;
  accountFresh: boolean;
  freeCashUsd: number | null;
  reentry: boolean | null;
  hasOpenOrder: boolean;
  confidencePct: number | null;
  socialShadow?: {
    state?: string;
    samples?: number;
    netSentiment?: number | null;
    acceleration?: number | null;
    price24hPct?: number | null;
  } | null;
  graphShadow?: {
    available?: boolean;
    state?: string;
    confidence?: number | null;
    residual24hPct?: number | null;
    residual7dPct?: number | null;
  } | null;
  perpPositioning?: {
    provider?: string;
    observedAt?: string;
    fundingRate?: number | null;
    fundingPercentile?: number | null;
    premiumPct?: number | null;
    premiumPercentile?: number | null;
    openInterestUsd?: number | null;
    dayNtlVolumeUsd?: number | null;
    oiChangePct?: number | null;
    oiAbsoluteMovePercentile?: number | null;
    crowdingState?: string;
    flowState?: string;
    confidence?: number | null;
    whaleWalletEvidence?: string;
  } | null;
  blockedReasonCount?: number;
};

const BASE_WEIGHTS: Record<SwarmSpecialistId, number> = {
  regime: 0.14,
  entry: 0.24,
  liquidity: 0.18,
  relative: 0.12,
  sentiment: 0.09,
  onchainWhale: 0.07,
  portfolioRisk: 0.10,
  critic: 0.06,
};

const clamp = (value: number, low = 0, high = 1) =>
  Number.isFinite(value) ? Math.max(low, Math.min(high, value)) : low;

const round = (value: number, digits = 4) => {
  const scale = 10 ** digits;
  return Math.round(value * scale) / scale;
};

function finite(value: unknown): number | null {
  const n = typeof value === "number" ? value : Number.NaN;
  return Number.isFinite(n) ? n : null;
}

function known(
  id: SwarmSpecialistId,
  score: number,
  reliability: number,
  evidenceFamily: string,
  reasons: string[] = [],
): SwarmSpecialist {
  return {
    id,
    state: "KNOWN",
    score: clamp(score),
    reliability: clamp(reliability),
    baseWeight: BASE_WEIGHTS[id],
    independenceFactor: 1,
    effectiveWeight: 0,
    evidenceFamily,
    reasons,
  };
}

function unknown(
  id: SwarmSpecialistId,
  evidenceFamily: string,
  reason: string,
): SwarmSpecialist {
  return {
    id,
    state: "UNKNOWN",
    score: null,
    reliability: 0,
    baseWeight: BASE_WEIGHTS[id],
    independenceFactor: 0,
    effectiveWeight: 0,
    evidenceFamily,
    reasons: [reason],
  };
}

function failClosed(
  id: SwarmSpecialistId,
  evidenceFamily: string,
  reason: string,
): SwarmSpecialist {
  return {
    id,
    state: "FAIL_CLOSED",
    score: 0,
    reliability: 1,
    baseWeight: BASE_WEIGHTS[id],
    independenceFactor: 1,
    effectiveWeight: 0,
    evidenceFamily,
    reasons: [reason],
  };
}

function regimeSpecialist(ctx: SwarmContext): SwarmSpecialist {
  if (ctx.marketGate.pass == null)
    return failClosed("regime", "price-derived", "Market regime gate is unknown.");
  const breadth7 = finite(ctx.marketGate.breadth7d);
  const breadth30 = finite(ctx.marketGate.breadth30d);
  const btc30 = finite(ctx.marketGate.btc30d);
  const btc90 = finite(ctx.marketGate.btc90d);
  const components = [
    ctx.marketGate.pass ? 0.72 : 0.22,
    breadth7 == null ? null : clamp(breadth7),
    breadth30 == null ? null : clamp(breadth30),
    btc30 == null ? null : btc30 > 0 ? 0.65 : 0.35,
    btc90 == null ? null : btc90 > 0 ? 0.65 : 0.35,
  ].filter((v): v is number => v != null);
  return known(
    "regime",
    components.reduce((a, b) => a + b, 0) / components.length,
    components.length >= 4 ? 0.92 : 0.78,
    "price-derived",
    [ctx.marketGate.pass ? "Market gate passes." : "Market gate is not bullish."],
  );
}

function entrySpecialist(ctx: SwarmContext): SwarmSpecialist {
  if (!ctx.snapshotFresh || !ctx.observationFresh)
    return failClosed("entry", "price-derived", "Entry evidence is stale or future-dated.");
  if (ctx.priceUsd == null || ctx.priceUsd <= 0)
    return failClosed("entry", "price-derived", "Current reference price is unavailable.");
  if (ctx.rotationScore == null)
    return unknown("entry", "price-derived", "Rotation score is unavailable.");
  const pullback = ctx.recommendedPullbackPct;
  const pullbackScore =
    pullback == null ? 0.5 : pullback >= 4 && pullback <= 10 ? 0.74 : pullback > 10 ? 0.58 : 0.42;
  const confidence =
    ctx.confidencePct == null ? 0.5 : clamp(ctx.confidencePct / 100);
  return known(
    "entry",
    0.5 * clamp(ctx.rotationScore) + 0.3 * pullbackScore + 0.2 * confidence,
    pullback == null ? 0.75 : 0.9,
    "price-derived",
    ["Uses the existing delayed-rotation score and validated pullback prior only."],
  );
}

function liquiditySpecialist(ctx: SwarmContext): SwarmSpecialist {
  const status = String(ctx.eligibilityStatus ?? "").toUpperCase();
  if (!status)
    return failClosed("liquidity", "execution", "Kraken execution eligibility is unavailable.");
  const score =
    status === "ACTIVE_ELIGIBLE"
      ? 0.84
      : status === "CONDITIONAL_PROBE_ELIGIBLE"
        ? 0.68
        : status === "WATCH_ONLY"
          ? 0.32
          : status === "BLOCKED"
            ? 0.08
            : 0.22;
  const maxKnown =
    ctx.eligibleMaxUsd != null &&
    ctx.positionAuthorityUsd != null &&
    Number.isFinite(ctx.eligibleMaxUsd) &&
    Number.isFinite(ctx.positionAuthorityUsd);
  return known(
    "liquidity",
    maxKnown && Math.min(ctx.eligibleMaxUsd!, ctx.positionAuthorityUsd!) <= 0
      ? Math.min(score, 0.18)
      : score,
    maxKnown ? 0.97 : 0.82,
    "execution",
    [`Execution state: ${status}.`],
  );
}

function relativeSpecialist(ctx: SwarmContext): SwarmSpecialist {
  const graph = ctx.graphShadow;
  if (!graph?.available)
    return unknown("relative", "price-derived", "Cross-asset graph has insufficient fresh peers.");
  const state = String(graph.state ?? "MIXED");
  const score =
    state === "CATCH_UP_CANDIDATE"
      ? 0.72
      : state === "OVEREXTENDED"
        ? 0.24
        : state === "ALIGNED"
          ? 0.56
          : 0.5;
  const reliability = graph.confidence == null ? 0.7 : clamp(graph.confidence);
  return known(
    "relative",
    score,
    0.55 + 0.4 * reliability,
    "price-derived",
    [`Cross-asset state: ${state}.`],
  );
}

function sentimentSpecialist(ctx: SwarmContext): SwarmSpecialist {
  const social = ctx.socialShadow;
  const state = String(social?.state ?? "INSUFFICIENT_DATA");
  if (!social || state === "INSUFFICIENT_DATA")
    return unknown("sentiment", "language", "CryptoBERT/social evidence is insufficient.");
  const net = finite(social.netSentiment);
  let score = 0.5;
  if (state === "BULLISH_CROWDING_PULLBACK_RISK") score = 0.28;
  else if (state === "POSITIVE_SENTIMENT_DIVERGENCE") score = 0.66;
  else if (state === "NEGATIVE_SENTIMENT_DIVERGENCE") score = 0.34;
  else if (state === "PRICE_SENTIMENT_CONFIRMATION")
    score = net == null ? 0.5 : net >= 0 ? 0.62 : 0.38;
  const samples = Math.max(0, Number(social.samples ?? 0));
  return known(
    "sentiment",
    score,
    clamp(0.55 + Math.min(samples, 8) * 0.05),
    "price-derived",
    [`Social state: ${state}.`],
  );
}

function onchainWhaleSpecialist(ctx: SwarmContext): SwarmSpecialist {
  const positioning = ctx.perpPositioning;
  if (!positioning)
    return unknown(
      "onchainWhale",
      "derivatives",
      "Hyperliquid aggregate perp positioning is unavailable; whale-wallet evidence remains unknown.",
    );
  const observedAt =
    typeof positioning.observedAt === "string"
      ? Date.parse(positioning.observedAt)
      : Number.NaN;
  if (
    !Number.isFinite(observedAt) ||
    observedAt > Date.now() ||
    Date.now() - observedAt > 30 * 60_000
  )
    return unknown(
      "onchainWhale",
      "derivatives",
      "Hyperliquid aggregate perp positioning is stale or future-dated.",
    );

  let score = 0.5;
  const reasons: string[] = [];
  switch (positioning.crowdingState) {
    case "CROWDED_LONG":
      score -= 0.22;
      reasons.push("Hyperliquid funding/premium cross-section indicates crowded longs.");
      break;
    case "LONG_BIAS":
      score -= 0.10;
      reasons.push("Hyperliquid funding cross-section leans long.");
      break;
    case "SHORT_BIAS":
      score += 0.07;
      reasons.push("Hyperliquid funding cross-section leans short.");
      break;
    case "CROWDED_SHORT":
      score += 0.14;
      reasons.push("Hyperliquid funding/premium cross-section indicates crowded shorts.");
      break;
    default:
      reasons.push("Hyperliquid perp crowding is balanced.");
  }

  switch (positioning.flowState) {
    case "LEVERAGED_LONG_BUILD":
      score -= positioning.crowdingState === "CROWDED_LONG" ? 0.12 : 0.04;
      reasons.push("Open interest is expanding with price, increasing leveraged-long crowding risk.");
      break;
    case "LEVERAGED_SHORT_BUILD":
      score -= 0.06;
      reasons.push("Open interest is expanding while price falls, consistent with leveraged short build.");
      break;
    case "SHORT_COVERING":
      score += 0.04;
      reasons.push("Open interest is contracting while price rises, consistent with short covering.");
      break;
    case "LONG_FLUSH":
      score += 0.08;
      reasons.push("Open interest is contracting while price falls, consistent with a leverage flush.");
      break;
    case "NO_LARGE_FLOW_SIGNAL":
      reasons.push("No cross-sectionally large open-interest move is present.");
      break;
    default:
      reasons.push("Open-interest delta history is not mature enough yet.");
  }

  reasons.push(
    "Public aggregate perp data is not wallet-level whale evidence; whale identity remains UNKNOWN.",
  );
  const sourceConfidence = finite(positioning.confidence) ?? 0.5;
  return known(
    "onchainWhale",
    score,
    Math.min(0.78, 0.52 + 0.3 * clamp(sourceConfidence)),
    "derivatives",
    reasons,
  );
}

function portfolioRiskSpecialist(ctx: SwarmContext): SwarmSpecialist {
  if (!ctx.accountFresh || ctx.freeCashUsd == null || ctx.reentry == null)
    return failClosed(
      "portfolioRisk",
      "account",
      "Fresh holdings/cash/trade context is unavailable.",
    );
  let score = ctx.freeCashUsd > 0 ? 0.68 : 0.35;
  if (ctx.reentry) score -= 0.12;
  if (ctx.hasOpenOrder) score -= 0.22;
  if (String(ctx.researchEligibility ?? "").toUpperCase() !== "ELIGIBLE") score -= 0.18;
  return known(
    "portfolioRisk",
    score,
    0.96,
    "account",
    [
      ctx.reentry ? "Recent re-entry risk detected." : "No recent re-entry penalty.",
      ctx.hasOpenOrder ? "Existing order requires human review." : "No conflicting open order.",
    ],
  );
}

function criticSpecialist(ctx: SwarmContext): SwarmSpecialist {
  let score = 0.74;
  const reasons: string[] = [];
  if (ctx.marketGate.pass === false) {
    score -= 0.22;
    reasons.push("Market gate is not bullish.");
  }
  if (ctx.graphShadow?.state === "OVEREXTENDED") {
    score -= 0.18;
    reasons.push("Graph flags relative overextension.");
  }
  if (ctx.socialShadow?.state === "BULLISH_CROWDING_PULLBACK_RISK") {
    score -= 0.16;
    reasons.push("Social crowding raises pullback risk.");
  }
  if ((ctx.confidencePct ?? 0) <= 50) {
    score -= 0.12;
    reasons.push("Base confidence is low.");
  }
  if (ctx.reentry) {
    score -= 0.10;
    reasons.push("Recent re-entry increases behavioral risk.");
  }
  if (ctx.hasOpenOrder) {
    score -= 0.18;
    reasons.push("Existing order creates duplication risk.");
  }
  if ((ctx.blockedReasonCount ?? 0) > 0) {
    score -= Math.min(0.18, (ctx.blockedReasonCount ?? 0) * 0.03);
    reasons.push("Production gate blockers are present.");
  }
  return known(
    "critic",
    score,
    0.72,
    "derived",
    reasons.length ? reasons : ["No strong adversarial objection from currently available evidence."],
  );
}

function withIndependenceDiscount(
  specialists: Record<SwarmSpecialistId, SwarmSpecialist>,
): Record<SwarmSpecialistId, SwarmSpecialist> {
  const knownSignals = Object.values(specialists).filter((s) => s.state !== "UNKNOWN");
  const familyCounts = new Map<string, number>();
  for (const signal of knownSignals)
    familyCounts.set(signal.evidenceFamily, (familyCounts.get(signal.evidenceFamily) ?? 0) + 1);

  const result = { ...specialists };
  for (const signal of Object.values(specialists)) {
    if (signal.state === "UNKNOWN") continue;
    const familyCount = familyCounts.get(signal.evidenceFamily) ?? 1;
    let independenceFactor = 1 / (1 + 0.30 * Math.max(0, familyCount - 1));
    if (signal.id === "critic") independenceFactor *= 0.55;
    result[signal.id] = {
      ...signal,
      independenceFactor: round(independenceFactor),
      effectiveWeight: round(
        signal.baseWeight * signal.reliability * independenceFactor,
        6,
      ),
    };
  }
  return result;
}

export function evaluateSwarmShadow(ctx: SwarmContext): SwarmShadow {
  const criticalIssues: string[] = [];
  if (!ctx.snapshotFresh) criticalIssues.push("Snapshot is stale or future-dated.");
  if (!ctx.observationFresh) criticalIssues.push("Asset observation is stale or future-dated.");
  if (ctx.priceUsd == null || ctx.priceUsd <= 0) criticalIssues.push("Reference price unavailable.");
  if (ctx.marketGate.pass == null) criticalIssues.push("Market regime is unknown.");
  if (!ctx.eligibilityStatus) criticalIssues.push("Execution eligibility unavailable.");
  if (!ctx.accountFresh || ctx.freeCashUsd == null || ctx.reentry == null)
    criticalIssues.push("Fresh portfolio context unavailable.");

  let specialists: Record<SwarmSpecialistId, SwarmSpecialist> = {
    regime: regimeSpecialist(ctx),
    entry: entrySpecialist(ctx),
    liquidity: liquiditySpecialist(ctx),
    relative: relativeSpecialist(ctx),
    sentiment: sentimentSpecialist(ctx),
    onchainWhale: onchainWhaleSpecialist(ctx),
    portfolioRisk: portfolioRiskSpecialist(ctx),
    critic: criticSpecialist(ctx),
  };
  specialists = withIndependenceDiscount(specialists);

  const all = Object.values(specialists);
  const knownSignals = all.filter((s) => s.state !== "UNKNOWN" && s.score != null);
  const totalBaseWeight = all.reduce((sum, s) => sum + s.baseWeight, 0);
  const coveredBaseWeight = knownSignals.reduce((sum, s) => sum + s.baseWeight, 0);
  const coverage = totalBaseWeight > 0 ? coveredBaseWeight / totalBaseWeight : 0;
  const totalEffectiveWeight = knownSignals.reduce((sum, s) => sum + s.effectiveWeight, 0);

  let rawConsensus: number | null = null;
  let disagreement = 1;
  let averageReliability = 0;
  if (totalEffectiveWeight > 0) {
    rawConsensus =
      knownSignals.reduce(
        (sum, s) => sum + (s.score ?? 0) * s.effectiveWeight,
        0,
      ) / totalEffectiveWeight;
    const variance =
      knownSignals.reduce(
        (sum, s) =>
          sum +
          s.effectiveWeight *
            ((s.score ?? rawConsensus!) - rawConsensus!) ** 2,
        0,
      ) / totalEffectiveWeight;
    disagreement = clamp(Math.sqrt(variance) * 2);
    averageReliability =
      knownSignals.reduce(
        (sum, s) => sum + s.reliability * s.effectiveWeight,
        0,
      ) / totalEffectiveWeight;
  }

  const regimeAdjustment =
    ctx.marketGate.pass === true ? 0.02 : ctx.marketGate.pass === false ? -0.08 : 0;
  const finalConsensus =
    rawConsensus == null
      ? null
      : clamp(rawConsensus - 0.12 * disagreement + regimeAdjustment);
  const confidence =
    finalConsensus == null
      ? 0
      : clamp(coverage * averageReliability * (1 - 0.55 * disagreement));
  const undiscountedWeight = knownSignals.reduce(
    (sum, s) => sum + s.baseWeight * s.reliability,
    0,
  );
  const correlationDiscount =
    undiscountedWeight > 0
      ? clamp(1 - totalEffectiveWeight / undiscountedWeight)
      : 0;
  const unknownSpecialists = all
    .filter((s) => s.state === "UNKNOWN")
    .map((s) => s.id);

  const integrityStatus: SwarmIntegrityStatus =
    criticalIssues.length > 0
      ? "FAIL_CLOSED"
      : unknownSpecialists.length > 0
        ? "DEGRADED"
        : "PASS";
  const portfolioRecommendationAllowed = criticalIssues.length === 0;

  const shadowDelta =
    finalConsensus == null || !portfolioRecommendationAllowed
      ? 0
      : clamp((finalConsensus - 0.5) * 10, -5, 5);

  return {
    version: "ZOBIRIS_SWARM_V1",
    authority: "SHADOW_ONLY_NO_TRADING_AUTHORITY",
    symbol: ctx.symbol.toUpperCase(),
    integrity: {
      status: integrityStatus,
      criticalIssues,
      unknownSpecialists,
      portfolioRecommendationAllowed,
    },
    specialists,
    consensus: {
      score: finalConsensus == null ? null : round(finalConsensus * 100, 2),
      confidencePct: round(confidence * 100, 2),
      coveragePct: round(coverage * 100, 2),
      disagreementPct: round(disagreement * 100, 2),
      reliabilityPct: round(averageReliability * 100, 2),
      regimeAdjustmentPctPoints: round(regimeAdjustment * 100, 2),
      correlationDiscountPct: round(correlationDiscount * 100, 2),
    },
    entryQuality: {
      shadowDeltaPctPoints: round(shadowDelta, 2),
      productionScoreChanged: false,
    },
    ranking: {
      shadowScore: finalConsensus == null ? null : round(finalConsensus * 100, 2),
      productionRankChanged: false,
    },
    executionBoundary: {
      mayIncreaseOrderSize: false,
      mayBypassEligibility: false,
      mayBypassLiquidity: false,
      mayBypassSecurity: false,
      positionAuthorityEffectUsd: 0,
    },
  };
}
