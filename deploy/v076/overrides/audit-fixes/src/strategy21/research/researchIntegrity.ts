export type EvidenceClass =
  | "PRIMARY_ONCHAIN"
  | "PRIMARY_PROTOCOL"
  | "PRIMARY_PROJECT"
  | "EXCHANGE_MARKET_DATA"
  | "INDEXER_DERIVED"
  | "AUDIT_REPORT"
  | "REPUTABLE_RESEARCH"
  | "NEWS"
  | "SOCIAL"
  | "MODEL_DERIVED";

export type EpistemicStatus =
  | "DIRECT_FACT"
  | "DERIVED_METRIC"
  | "SUPPORTED_INFERENCE"
  | "COMPETING_EXPLANATION"
  | "EMERGING_HYPOTHESIS"
  | "SPECULATIVE_LEAD"
  | "DISPROVEN"
  | "INSUFFICIENT_EVIDENCE";

export interface ResearchEvidenceInput {
  id: string;
  symbol: string;
  factorFamily?: string;
  claim?: string;
  evidenceConfidence?: number;
  observedAt?: string;
  receivedAt?: string;
  freshness?: string;
  providerIds?: string[];
  source?: string;
  dataMode?: string;
  claimOrigin?: string;
  epistemicState?: string;
  parentClaimIds?: string[];
}

export interface PointInTimeEvidenceRecord {
  evidenceId: string;
  assetId: string;
  symbol: string;
  sourceNames: string[];
  sourceClass: EvidenceClass;
  observedAt: string;
  retrievedAt: string;
  reportAsOf: string;
  pointInTimeValid: boolean;
  claim: string;
  factorFamily: string;
  rawPayloadHash: string;
  hashAlgorithm: "FNV1A32";
  transformationVersion: "research-integrity/1.0";
  reliabilityScore: number;
  freshnessScore: number;
  sourceIndependenceScore: number;
  contradictions: string[];
  limitations: string[];
}

export interface FalsificationTest {
  condition: string;
  metric: string;
  threshold: string;
  evaluationWindow: string;
}

export interface ResearchClaim {
  claimId: string;
  topicId: string;
  assetId: string;
  statement: string;
  epistemicStatus: EpistemicStatus;
  importance: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  observedAt: string;
  assertedAt: string;
  lastReviewedAt: string;
  sourceIds: string[];
  supportingEvidenceIds: string[];
  contradictingEvidenceIds: string[];
  dependencyClaimIds: string[];
  assumptions: string[];
  alternativeExplanationIds: string[];
  falsificationTests: FalsificationTest[];
  sourceIndependenceScore: number;
  evidenceQualityScore: number;
  freshnessScore: number;
  confidenceBand: "ESTABLISHED" | "STRONG" | "PROBABLE" | "PLAUSIBLE" | "UNCERTAIN" | "SPECULATIVE";
  status: "ACTIVE" | "WEAKENING" | "STRENGTHENING" | "INVALIDATED" | "SUPERSEDED";
}

export interface ResearchThesis {
  thesisId: string;
  assetId: string;
  symbol: string;
  asOf: string;
  claim: string;
  horizon: "INTRADAY" | "SWING" | "POSITION" | "STRUCTURAL";
  regimeAssumptions: string[];
  supportingEvidenceIds: string[];
  counterEvidenceIds: string[];
  falsifiers: FalsificationTest[];
  confidence: number;
  confidenceKind: "HEURISTIC_NOT_CALIBRATED";
  confidenceBand: ResearchClaim["confidenceBand"];
  invalidated: boolean;
  invalidationReason?: string;
}

export interface ResearchScorecard {
  opportunityQuality: number | null;
  liquidityQuality: number | null;
  fundamentalQuality: number | null;
  discoveryQuality: number | null;
  resilienceQuality: number | null;
  evidenceQuality: number;
  evidenceFreshness: number;
  sourceIndependence: number;
  dataCompleteness: number;
  contradictionPenalty: number;
  tokenomicsPressure: number | null;
  securityGovernanceQuality: number | null;
  manipulationRisk: number | null;
  unmeasuredDimensions: string[];
}

export interface ResearchRiskState {
  researchEligibility: "ELIGIBLE" | "WATCH_ONLY" | "DATA_INSUFFICIENT" | "EXCLUDE";
  hardBlocks: Array<{ code: string; evidenceIds: string[]; explanation: string }>;
  reasons: string[];
}

export interface DecisionOutcomeSeed {
  outcomeId: string;
  symbol: string;
  generatedAt: string;
  action: string;
  assetState: string;
  referencePriceUsd: number | null;
  opportunityScore: number | null;
  researchScore: number;
  evidenceQuality: number;
  thesisId: string;
  horizons: Array<{ horizon: "1H" | "4H" | "1D" | "3D" | "7D"; dueAt: string }>;
}

export interface ResearchIntegrityBundle {
  version: "1.0";
  evidenceLedger: PointInTimeEvidenceRecord[];
  scorecard: ResearchScorecard;
  risk: ResearchRiskState;
  thesis: ResearchThesis;
  claimGraph: {
    claims: ResearchClaim[];
    independentSourceFamilies: number;
    recycledCoverageWarning: boolean;
  };
  outcomeSeed: DecisionOutcomeSeed;
}

export const NARRATIVE_RESEARCH_POLICY = {
  version: "narrative-forensics/1.0",
  discoveryBudget: {
    baselineFacts: 0.25,
    mainstreamNarrativeMapping: 0.15,
    adversarialAlternativeMechanisms: 0.40,
    counterContrarianFalsification: 0.20,
  },
  conclusionWeighting: "EVIDENCE_QUALITY_INDEPENDENCE_RECENCY_EXPLANATORY_POWER",
  rule: "Research-budget allocation must never become conclusion-weighting bias.",
} as const;

export const CAPABILITY_MANIFEST = {
  policyVersion: "zobiris-read-only-account/1.0",
  marketDataRead: true,
  exchangePrivateRead: true,
  exchangeBalancesRead: true,
  exchangeOpenOrdersRead: true,
  exchangeTradeHistoryRead: true,
  exchangeExecutionStreamRead: true,
  exchangeOrderSubmission: false,
  exchangeOrderModification: false,
  exchangeOrderCancellation: false,
  exchangeFundTransfer: false,
  exchangeWithdrawal: false,
  walletKeyAccess: false,
  walletSigning: false,
  transactionBroadcast: false,
} as const;

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
const average = (values: number[]) => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;

function fnv1a32(input: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return `fnv1a32:${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

function parseTime(value: string | undefined, fallback: string): number {
  const parsed = Date.parse(value ?? fallback);
  return Number.isFinite(parsed) ? parsed : Date.parse(fallback);
}

function sourceNamesFor(input: ResearchEvidenceInput): string[] {
  const providers = Array.isArray(input.providerIds) ? input.providerIds.map((item) => String(item).trim()).filter(Boolean) : [];
  const source = String(input.source ?? "").trim();
  return [...new Set([...providers, ...(source ? [source] : [])])];
}

function evidenceClass(input: ResearchEvidenceInput): EvidenceClass {
  const text = [...sourceNamesFor(input), input.factorFamily ?? "", input.claimOrigin ?? ""].join(" ").toLowerCase();
  if (/kraken|coinbase|binance|exchange/.test(text)) return "EXCHANGE_MARKET_DATA";
  if (/onchain|on-chain|chain data|blockchain/.test(text)) return "PRIMARY_ONCHAIN";
  if (/protocol|governance/.test(text)) return "PRIMARY_PROTOCOL";
  if (/project|issuer|treasury/.test(text)) return "PRIMARY_PROJECT";
  if (/audit/.test(text)) return "AUDIT_REPORT";
  if (/news|reuters|bloomberg|journal/.test(text)) return "NEWS";
  if (/social|stocktwits|reddit|twitter|\bx\b/.test(text)) return "SOCIAL";
  if (/cmc|coinmarketcap|indexer|derived/.test(text)) return "INDEXER_DERIVED";
  return "MODEL_DERIVED";
}

function timingMs(family: string | undefined): number {
  const hour = 60 * 60 * 1000;
  const day = 24 * hour;
  switch (family) {
    case "marketTechnical":
    case "liquidityMarketStructure":
    case "derivativesLeverage":
      return 6 * hour;
    case "socialAttention":
      return 12 * hour;
    case "onchainPositioning":
      return 3 * day;
    case "catalystsNarrative":
    case "macro":
      return 28 * day;
    case "fundamentalTokenomics":
    case "identity":
      return 90 * day;
    default:
      return day;
  }
}

function sourceReliability(sourceClass: EvidenceClass): number {
  switch (sourceClass) {
    case "PRIMARY_ONCHAIN":
    case "PRIMARY_PROTOCOL":
      return 0.95;
    case "EXCHANGE_MARKET_DATA":
      return 0.90;
    case "AUDIT_REPORT":
      return 0.88;
    case "PRIMARY_PROJECT":
      return 0.82;
    case "INDEXER_DERIVED":
      return 0.78;
    case "REPUTABLE_RESEARCH":
      return 0.76;
    case "NEWS":
      return 0.68;
    case "SOCIAL":
      return 0.35;
    default:
      return 0.45;
  }
}

function confidenceBand(value: number): ResearchClaim["confidenceBand"] {
  if (value >= 0.90) return "ESTABLISHED";
  if (value >= 0.78) return "STRONG";
  if (value >= 0.65) return "PROBABLE";
  if (value >= 0.50) return "PLAUSIBLE";
  if (value >= 0.35) return "UNCERTAIN";
  return "SPECULATIVE";
}

function epistemicStatus(input: ResearchEvidenceInput, pointInTimeValid: boolean): EpistemicStatus {
  if (!pointInTimeValid) return "INSUFFICIENT_EVIDENCE";
  if (input.factorFamily === "socialAttention" || input.factorFamily === "catalystsNarrative") {
    return (input.evidenceConfidence ?? 0.5) >= 0.7 ? "SUPPORTED_INFERENCE" : "EMERGING_HYPOTHESIS";
  }
  return "DERIVED_METRIC";
}

function extractPrice(claim: string): number | null {
  try {
    const parsed = JSON.parse(claim);
    const price = Number(parsed?.priceUsd);
    return Number.isFinite(price) && price > 0 ? price : null;
  } catch {
    return null;
  }
}

export function buildEvidenceLedger(
  inputs: ResearchEvidenceInput[],
  assetId: string,
  symbol: string,
  asOf: string,
): PointInTimeEvidenceRecord[] {
  const reportMs = Date.parse(asOf);
  return inputs
    .filter((input) => input.symbol.toUpperCase() === symbol.toUpperCase())
    .map((input) => {
      const observedAt = new Date(parseTime(input.observedAt ?? input.receivedAt, asOf)).toISOString();
      const retrievedAt = new Date(parseTime(input.receivedAt ?? input.observedAt, observedAt)).toISOString();
      const observedMs = Date.parse(observedAt);
      const retrievedMs = Date.parse(retrievedAt);
      const ttl = timingMs(input.factorFamily);
      const age = Math.max(0, reportMs - observedMs);
      const freshnessScore = clamp01(1 - age / ttl);
      const sourceClass = evidenceClass(input);
      const sourceNames = sourceNamesFor(input);
      const pointInTimeValid = observedMs <= reportMs && retrievedMs <= reportMs;
      const limitations: string[] = [];
      if (!pointInTimeValid) limitations.push("Evidence was not available by the report as-of timestamp; excluded from point-in-time conclusions.");
      if (!sourceNames.length) limitations.push("Original provider identity is not attached to this legacy evidence row.");
      if (sourceClass === "SOCIAL") limitations.push("Social evidence is a discovery lead unless independently corroborated.");
      const reliability = clamp01(0.55 * clamp01(input.evidenceConfidence ?? 0.5) + 0.45 * sourceReliability(sourceClass));
      return {
        evidenceId: input.id,
        assetId,
        symbol,
        sourceNames,
        sourceClass,
        observedAt,
        retrievedAt,
        reportAsOf: asOf,
        pointInTimeValid,
        claim: input.claim ?? `${input.factorFamily ?? "evidence"} observation`,
        factorFamily: input.factorFamily ?? "unknown",
        rawPayloadHash: fnv1a32(input.claim ?? ""),
        hashAlgorithm: "FNV1A32" as const,
        transformationVersion: "research-integrity/1.0" as const,
        reliabilityScore: reliability,
        freshnessScore,
        sourceIndependenceScore: sourceNames.length >= 2 ? 1 : sourceNames.length === 1 ? 0.6 : 0.25,
        contradictions: [],
        limitations,
      };
    });
}

export interface BuildResearchIntegrityInput {
  assetId: string;
  symbol: string;
  asOf: string;
  action: string;
  assetState: string;
  researchScore: number;
  opportunityScore: number | null;
  opportunityConfidence: number;
  eligibilityStatus: string;
  dataReadiness: string;
  evidenceCoverage: number;
  evidenceClaims: ResearchEvidenceInput[];
  factors: {
    fundamental: number | null;
    execution: number | null;
    flow: number | null;
    discovery: number | null;
    resilience: number | null;
  };
  activeRiskGates: Array<{ code: string; effect: string }>;
}

export function buildResearchIntegrity(input: BuildResearchIntegrityInput): ResearchIntegrityBundle {
  const evidenceLedger = buildEvidenceLedger(input.evidenceClaims, input.assetId, input.symbol, input.asOf);
  const validEvidence = evidenceLedger.filter((item) => item.pointInTimeValid);
  const uniqueSources = new Set(validEvidence.flatMap((item) => item.sourceNames.map((source) => source.toLowerCase())));
  const evidenceFreshness = average(validEvidence.map((item) => item.freshnessScore));
  const reliability = average(validEvidence.map((item) => item.reliabilityScore));
  const sourceIndependence = validEvidence.length
    ? clamp01((uniqueSources.size >= 3 ? 1 : uniqueSources.size === 2 ? 0.8 : uniqueSources.size === 1 ? 0.55 : 0.25))
    : 0;
  const dataCompleteness = clamp01(input.evidenceCoverage);
  const pointInTimeIntegrity = evidenceLedger.length ? validEvidence.length / evidenceLedger.length : 0;
  const contradictionPenalty = 0;
  const evidenceQuality = clamp01(
    (0.35 * reliability + 0.25 * evidenceFreshness + 0.20 * sourceIndependence + 0.20 * dataCompleteness)
    * pointInTimeIntegrity
    * (1 - contradictionPenalty),
  );

  const hardBlocks: ResearchRiskState["hardBlocks"] = [];
  if (input.dataReadiness === "IDENTITY_BLOCKED") {
    hardBlocks.push({ code: "IDENTITY_UNVERIFIED", evidenceIds: [], explanation: "Canonical asset identity is not verified." });
  }
  for (const gate of input.activeRiskGates) {
    if (gate.effect === "veto") {
      hardBlocks.push({ code: gate.code || "RISK_VETO", evidenceIds: [], explanation: `Existing risk gate ${gate.code || "RISK_VETO"} is active.` });
    }
  }

  const reasons: string[] = [];
  let researchEligibility: ResearchRiskState["researchEligibility"] = "ELIGIBLE";
  if (hardBlocks.length) {
    researchEligibility = "EXCLUDE";
    reasons.push("A hard risk/integrity block overrides positive opportunity signals.");
  } else if (evidenceQuality < 0.35 || validEvidence.length === 0) {
    researchEligibility = "DATA_INSUFFICIENT";
    reasons.push("Point-in-time evidence quality is below the research threshold.");
  } else if (!["ACTIVE_ELIGIBLE", "CONDITIONAL_PROBE_ELIGIBLE"].includes(input.eligibilityStatus)) {
    researchEligibility = "WATCH_ONLY";
    reasons.push("Research may continue, but execution/liquidity eligibility is not currently active.");
  }

  const scorecard: ResearchScorecard = {
    opportunityQuality: input.opportunityScore == null ? null : clamp01(input.opportunityScore),
    liquidityQuality: input.factors.execution == null ? null : clamp01(input.factors.execution),
    fundamentalQuality: input.factors.fundamental == null ? null : clamp01(input.factors.fundamental),
    discoveryQuality: input.factors.discovery == null ? null : clamp01(input.factors.discovery),
    resilienceQuality: input.factors.resilience == null ? null : clamp01(input.factors.resilience),
    evidenceQuality,
    evidenceFreshness,
    sourceIndependence,
    dataCompleteness,
    contradictionPenalty,
    tokenomicsPressure: input.activeRiskGates.some((gate) => /unlock|dilution|emission/i.test(gate.code)) ? 1 : null,
    securityGovernanceQuality: input.activeRiskGates.some((gate) => /exploit|contract|identity|admin|governance|bridge|oracle/i.test(gate.code)) ? 0.1 : null,
    manipulationRisk: null,
    unmeasuredDimensions: [
      ...(input.activeRiskGates.some((gate) => /unlock|dilution|emission/i.test(gate.code)) ? [] : ["tokenomicsPressure"]),
      ...(input.activeRiskGates.some((gate) => /exploit|contract|identity|admin|governance|bridge|oracle/i.test(gate.code)) ? [] : ["securityGovernanceQuality"]),
      "manipulationRisk",
    ],
  };

  const activeEvidenceIds = validEvidence
    .sort((a, b) => b.reliabilityScore * b.freshnessScore - a.reliabilityScore * a.freshnessScore)
    .slice(0, 12)
    .map((item) => item.evidenceId);

  const falsifiers: FalsificationTest[] = [
    {
      condition: "Evidence quality falls below the minimum decision-support threshold.",
      metric: "researchIntegrity.scorecard.evidenceQuality",
      threshold: "< 0.35",
      evaluationWindow: "continuous",
    },
    {
      condition: "Kraken execution/liquidity eligibility becomes unavailable.",
      metric: "strategy21.eligibility.status",
      threshold: "not ACTIVE_ELIGIBLE or CONDITIONAL_PROBE_ELIGIBLE",
      evaluationWindow: "next refresh",
    },
    {
      condition: "Market/flow confirmation weakens materially.",
      metric: "strategy21.factors.flow.value",
      threshold: "< 0.45",
      evaluationWindow: "6H",
    },
    {
      condition: "A hard risk gate appears.",
      metric: "riskGates",
      threshold: "active veto exists",
      evaluationWindow: "continuous",
    },
  ];

  const thesisConfidence = clamp01(
    input.opportunityConfidence * (0.45 + 0.55 * evidenceQuality),
  );
  const thesisId = `${input.symbol.toLowerCase()}:${input.asOf}:thesis-v1`;
  const thesis: ResearchThesis = {
    thesisId,
    assetId: input.assetId,
    symbol: input.symbol,
    asOf: input.asOf,
    claim: `${input.symbol} is currently classified as ${input.assetState} with action state ${input.action}; this remains conditional on current evidence, liquidity eligibility, and risk gates.`,
    horizon: "SWING",
    regimeAssumptions: [
      "Current market-state classification remains materially valid.",
      "Observed liquidity remains representative enough for the modeled notional.",
      "No new hard security, identity, or tokenomics veto emerges.",
    ],
    supportingEvidenceIds: activeEvidenceIds,
    counterEvidenceIds: [],
    falsifiers,
    confidence: thesisConfidence,
    confidenceKind: "HEURISTIC_NOT_CALIBRATED",
    confidenceBand: confidenceBand(thesisConfidence),
    invalidated: hardBlocks.length > 0,
    ...(hardBlocks.length ? { invalidationReason: hardBlocks.map((block) => block.explanation).join(" ") } : {}),
  };

  const claims: ResearchClaim[] = validEvidence.slice(0, 40).map((item) => {
    const confidence = clamp01(item.reliabilityScore * (0.5 + 0.5 * item.freshnessScore));
    return {
      claimId: item.evidenceId,
      topicId: `${input.symbol}:research`,
      assetId: input.assetId,
      statement: item.claim,
      epistemicStatus: epistemicStatus(input.evidenceClaims.find((claim) => claim.id === item.evidenceId) ?? { id: item.evidenceId, symbol: input.symbol }, item.pointInTimeValid),
      importance: item.factorFamily === "marketTechnical" || item.factorFamily === "liquidityMarketStructure" ? "HIGH" : "MEDIUM",
      observedAt: item.observedAt,
      assertedAt: item.retrievedAt,
      lastReviewedAt: input.asOf,
      sourceIds: item.sourceNames,
      supportingEvidenceIds: [item.evidenceId],
      contradictingEvidenceIds: item.contradictions,
      dependencyClaimIds: [],
      assumptions: item.limitations,
      alternativeExplanationIds: [],
      falsificationTests: [],
      sourceIndependenceScore: item.sourceIndependenceScore,
      evidenceQualityScore: confidence,
      freshnessScore: item.freshnessScore,
      confidenceBand: confidenceBand(confidence),
      status: "ACTIVE",
    };
  });
  claims.push({
    claimId: thesisId,
    topicId: `${input.symbol}:research`,
    assetId: input.assetId,
    statement: thesis.claim,
    epistemicStatus: evidenceQuality >= 0.65 ? "SUPPORTED_INFERENCE" : evidenceQuality >= 0.35 ? "EMERGING_HYPOTHESIS" : "SPECULATIVE_LEAD",
    importance: "CRITICAL",
    observedAt: input.asOf,
    assertedAt: input.asOf,
    lastReviewedAt: input.asOf,
    sourceIds: [...uniqueSources],
    supportingEvidenceIds: thesis.supportingEvidenceIds,
    contradictingEvidenceIds: thesis.counterEvidenceIds,
    dependencyClaimIds: thesis.supportingEvidenceIds,
    assumptions: thesis.regimeAssumptions,
    alternativeExplanationIds: [],
    falsificationTests: falsifiers,
    sourceIndependenceScore: sourceIndependence,
    evidenceQualityScore: evidenceQuality,
    freshnessScore: evidenceFreshness,
    confidenceBand: thesis.confidenceBand,
    status: thesis.invalidated ? "INVALIDATED" : "ACTIVE",
  });

  const priceCandidates = validEvidence
    .map((item) => ({ item, price: extractPrice(item.claim) }))
    .filter((candidate): candidate is { item: PointInTimeEvidenceRecord; price: number } => candidate.price != null)
    .sort((a, b) => Date.parse(b.item.observedAt) - Date.parse(a.item.observedAt));
  const referencePriceUsd = priceCandidates[0]?.price ?? null;
  const asOfMs = Date.parse(input.asOf);
  const hours = (count: number) => new Date(asOfMs + count * 60 * 60 * 1000).toISOString();
  const days = (count: number) => hours(count * 24);
  const outcomeSeed: DecisionOutcomeSeed = {
    outcomeId: `${input.symbol.toLowerCase()}:${input.asOf}:outcome-v1`,
    symbol: input.symbol,
    generatedAt: input.asOf,
    action: input.action,
    assetState: input.assetState,
    referencePriceUsd,
    opportunityScore: input.opportunityScore,
    researchScore: input.researchScore,
    evidenceQuality,
    thesisId,
    horizons: [
      { horizon: "1H", dueAt: hours(1) },
      { horizon: "4H", dueAt: hours(4) },
      { horizon: "1D", dueAt: days(1) },
      { horizon: "3D", dueAt: days(3) },
      { horizon: "7D", dueAt: days(7) },
    ],
  };

  return {
    version: "1.0",
    evidenceLedger,
    scorecard,
    risk: { researchEligibility, hardBlocks, reasons },
    thesis,
    claimGraph: {
      claims,
      independentSourceFamilies: uniqueSources.size,
      recycledCoverageWarning: validEvidence.length >= 4 && uniqueSources.size <= 1,
    },
    outcomeSeed,
  };
}
