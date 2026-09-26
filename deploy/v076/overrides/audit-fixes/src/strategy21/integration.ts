import { classifyMarketState, deploymentCapForState, doctrineAlias, type PreviousMarketState } from './engine/marketState.js';
import { assessLiquidityAcceleration, buildLiquidityProfile, evaluateLiquidityEligibility, quantile, simulateImpactBps, type LiquidityAccelerationResult, type LiquidityProfile } from './engine/liquidity.js';
import { computeDiscoveryCatalyst, computeExecutionQuality, computeOpportunityHeuristic, type FactorResult } from './engine/factors.js';
import { createCapitalLedger, type CapitalLedger } from './engine/capital.js';
import { adaptiveTargetUsd } from './engine/adaptiveTarget.js';
import { evaluateZobirisDecision, type ZobirisDecision } from './engine/zobiris.js';
import type { EvidenceItem } from './domain/evidence.js';
import { classifyBehavioralPersonality, type BehavioralPersonalityResult, type BehavioralProfileInput } from './engine/personality.js';
import { calculatePortfolioDependency, currentPortfolioContextForAsset, type PortfolioDependencyInput, type PortfolioDependencySummary } from './engine/portfolioDependency.js';
import { buildIntelligenceShadow, type IntelligenceShadowInput, type IntelligenceShadowResult } from './intelligence/index.js';
import {
  buildResearchIntegrity,
  CAPABILITY_MANIFEST,
  NARRATIVE_RESEARCH_POLICY,
  type ResearchIntegrityBundle,
} from './research/researchIntegrity.js';
import {
  DELAYED_ROTATION_MODE,
  calibrateDelayedRotationMarket,
  evaluateDelayedRotation,
  type DelayedRotationCalibration,
  type DelayedRotationProfile,
  type RecommendationMode,
} from './engine/delayedRotation.js';

export interface LegacyFactorLike {
  family?: string;
  raw?: number;
  adjusted?: number;
}

export interface LegacyAssetLike {
  symbol: string;
  canonicalAssetId?: string | null;
  mappingStatus?: string;
  asOf?: string;
  opportunity: { raw?: number; adjusted: number; factorScores?: LegacyFactorLike[] };
  confidence: { pct: number };
  riskGates?: Array<{ active?: boolean; effect?: string; code?: string }>;
  targetWeight?: { pct: number };
  action?: string;
  risk?: string;
  evidenceCoverage?: number;
  [key: string]: unknown;
}

export interface LegacySnapshotLike {
  asOf: string;
  policyVersion: string;
  regime: string;
  regimeConfidence: number;
  rankedAssets: LegacyAssetLike[];
  [key: string]: unknown;
}

export interface CanonicalAssetLike {
  id: string;
  symbol: string;
  name: string;
  mappingStatus: string;
}

export interface EvidenceClaimLike {
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

export interface StrategyLiquidityInput {
  pair: string;
  profile: LiquidityProfile;
  takerFeeBpsPerSide?: number;
  estimatedGrossExpectedReturnBps?: number;
  currentTradeCount24h?: number;
  priorCompletedDayTradeCounts24h?: number[];
}

export interface Strategy21AssetView {
  researchScore: number;
  researchRank: number;
  nextDollarScore: number | null;
  nextDollarRank: number | null;
  doctrine: string;
  marketState: string;
  marketEnteredAt: string;
  minimumDwellUntil: string;
  assetState: string;
  action: string;
  eligibility: ZobirisDecision['eligibility'];
  factors: ZobirisDecision['factors'];
  opportunity: ZobirisDecision['opportunity'];
  positionAuthority: ZobirisDecision['authority'];
  adaptiveTargetUsd: number;
  stagedExecution: ZobirisDecision['stagedExecution'];
  explanation: ZobirisDecision['explanation'];
  personality: BehavioralPersonalityResult | null;
  liquidityAcceleration: LiquidityAccelerationResult;
  dataReadiness: 'READY' | 'KRAKEN_WARMUP' | 'IDENTITY_BLOCKED';
  researchIntegrity: ResearchIntegrityBundle;
  delayedRotation: DelayedRotationProfile;
}

export interface IntegratedAssetLike extends LegacyAssetLike {
  strategy21: Strategy21AssetView;
}

export interface Strategy21PortfolioSummary {
  version: '2.1';
  marketState: string;
  doctrine: string;
  marketConfidence: number;
  deploymentCapPct: number;
  deploymentAuthorityUsd: number;
  maneuverCapitalUsd: 1850;
  researchAuthority: 'DESCRIPTIVE_ONLY';
  rankingAuthority: 'OPPORTUNITY_HEURISTIC_V1';
  positionSizingAuthority: 'CONSERVATIVE_ADAPTIVE_TARGET_WITH_RISK_CAPS';
  strategicReserveTargetUsd: 1800;
  strategicReserveFundedUsd: 0;
  eventualPortfolioTargetUsd: 3000;
  nextDollarReadyAssets: number;
  enteredAt: string;
  minimumDwellUntil: string;
  previousState?: PreviousMarketState;
  portfolioDependency: PortfolioDependencySummary;
  intelligenceShadow?: IntelligenceShadowResult;
  researchIntegrityVersion: '1.0';
  capabilityManifest: typeof CAPABILITY_MANIFEST;
  narrativeResearchPolicy: typeof NARRATIVE_RESEARCH_POLICY;
  recommendationMode: RecommendationMode;
  delayedRotationCalibration: DelayedRotationCalibration;
}

export interface IntegratedSnapshotLike extends LegacySnapshotLike {
  policyVersion: string;
  regime: string;
  regimeConfidence: number;
  rankedAssets: IntegratedAssetLike[];
  strategy21: Strategy21PortfolioSummary;
}

export interface IntegrateStrategy21Input {
  snapshot: LegacySnapshotLike;
  canonicalAssets: Map<string, CanonicalAssetLike>;
  evidenceClaims: EvidenceClaimLike[];
  liquidityBySymbol?: Map<string, StrategyLiquidityInput>;
  personalityBySymbol?: Map<string, BehavioralProfileInput>;
  previousMarketState?: PreviousMarketState;
  portfolioDependency?: PortfolioDependencyInput;
  capitalLedger?: Partial<CapitalLedger>;
  intelligenceShadowInput?: IntelligenceShadowInput;
  recommendationMode?: RecommendationMode;
}

const MEME_SYMBOLS = new Set(['BONK', 'SHIB', 'DOGE', 'PEPE', 'TRUMP', 'FLOKI', 'WIF']);

function clamp01(v: number): number { return Math.max(0, Math.min(1, v)); }
function clampSigned(v: number): number { return Math.max(-1, Math.min(1, v)); }
function avg(values: number[]): number { return values.length ? values.reduce((a,b)=>a+b,0)/values.length : 0; }

function factor(asset: LegacyAssetLike, family: string): number | null {
  const f = asset.opportunity.factorScores?.find((x) => x.family === family);
  const v = f?.adjusted ?? f?.raw;
  return typeof v === 'number' && Number.isFinite(v) ? clamp01(v / 100) : null;
}

function neutralFactor(value: number | null, coverageWhenPresent = 1): FactorResult {
  return { value, coverage: value === null ? 0 : coverageWhenPresent };
}

function researchScore(asset: LegacyAssetLike): number {
  const fundamental = factor(asset, 'fundamentalTokenomics') ?? 0.5;
  const flow = factor(asset, 'marketTechnical') ?? clamp01(asset.opportunity.adjusted / 100);
  const social = factor(asset, 'socialAttention');
  const catalyst = factor(asset, 'catalystsNarrative');
  const discoveryValues = [social, catalyst].filter((v): v is number => v !== null);
  const discovery = discoveryValues.length ? avg(discoveryValues) : 0.5;
  const gates = asset.riskGates ?? [];
  const veto = gates.some((g) => g.active && g.effect === 'veto');
  const capped = gates.some((g) => g.active && g.effect === 'size_cap');
  const resilience = veto ? 0.1 : capped ? 0.5 : 0.75;
  return Math.round((0.30*fundamental + 0.30*flow + 0.20*discovery + 0.20*resilience) * 10_000) / 100;
}

function marketAxes(assets: LegacyAssetLike[]) {
  const btc = assets.find((a) => a.symbol.toUpperCase() === 'BTC');
  const btcStructure = clampSigned(2 * (factor(btc ?? assets[0]!, 'marketTechnical') ?? 0.5) - 1);
  const evaluated = assets.filter((a) => Number.isFinite(a.opportunity.adjusted));
  const breadthShare = evaluated.length ? evaluated.filter((a) => a.opportunity.adjusted >= 55).length / evaluated.length : 0.5;
  const technicals = evaluated.map((a) => factor(a, 'marketTechnical')).filter((v): v is number => v !== null);
  const derivs = evaluated.map((a) => factor(a, 'derivativesLeverage')).filter((v): v is number => v !== null);
  const liquidity = evaluated.map((a) => factor(a, 'liquidityMarketStructure')).filter((v): v is number => v !== null);
  const extendedShare = technicals.length ? technicals.filter((v) => v >= 0.80).length / technicals.length : 0;
  return {
    btcStructure,
    breadth: clampSigned(2 * breadthShare - 1),
    spotParticipation: clampSigned(2 * (technicals.length ? avg(technicals) : 0.5) - 1),
    leverageCrowding: clampSigned(1 - 2 * (derivs.length ? avg(derivs) : 0.5)),
    liquidityStress: clampSigned(1 - 2 * (liquidity.length ? avg(liquidity) : 0.5)),
    extension: clampSigned(2 * extendedShare - 0.2),
    macroImpulse: 0,
  };
}

function marketConfidence(assets: LegacyAssetLike[]): number {
  const confidence = avg(assets.map((a) => clamp01((a.confidence?.pct ?? 0) / 100)));
  const coverage = avg(assets.map((a) => clamp01(a.evidenceCoverage ?? 0)));
  return clamp01(0.7 * confidence + 0.3 * coverage);
}

export function evidenceTimingForFamily(family: string | undefined): { horizon: EvidenceItem['horizon']; ttlMs: number } {
  const hour = 60 * 60 * 1000;
  const day = 24 * hour;
  switch (family) {
    case 'marketTechnical':
    case 'liquidityMarketStructure':
    case 'derivativesLeverage':
      return { horizon: 'HOURS', ttlMs: 6 * hour };
    case 'socialAttention':
      return { horizon: 'HOURS', ttlMs: 12 * hour };
    case 'onchainPositioning':
      return { horizon: 'DAYS', ttlMs: 3 * day };
    case 'catalystsNarrative':
    case 'macro':
      return { horizon: 'WEEKS', ttlMs: 28 * day };
    case 'fundamentalTokenomics':
    case 'identity':
      return { horizon: 'MONTHS', ttlMs: 90 * day };
    default:
      return { horizon: 'DAYS', ttlMs: day };
  }
}

function claimDependency(family: string | undefined): string {
  switch (family) {
    case 'marketTechnical': return 'PRICE_STRUCTURE';
    case 'fundamentalTokenomics': return 'FUNDAMENTALS';
    case 'liquidityMarketStructure': return 'EXECUTION';
    case 'socialAttention': return 'NARRATIVE';
    case 'derivativesLeverage': return 'LEVERAGE';
    case 'onchainPositioning': return 'SPOT_FLOW';
    case 'catalystsNarrative': return 'NARRATIVE';
    default: return 'MACRO';
  }
}

function toEvidence(claims: EvidenceClaimLike[], symbol: string, asOf: string): EvidenceItem[] {
  return claims.filter((c) => c.symbol.toUpperCase() === symbol.toUpperCase()).map((c): EvidenceItem | null => {
    const timing = evidenceTimingForFamily(c.factorFamily);
    const observedAt = c.observedAt ?? c.receivedAt ?? asOf;
    const retrievedAt = c.receivedAt ?? observedAt;
    const asOfMs = Date.parse(asOf);
    if (Date.parse(observedAt) > asOfMs || Date.parse(retrievedAt) > asOfMs) return null;
    return {
      id: c.id,
      type: c.factorFamily === 'socialAttention' || c.factorFamily === 'catalystsNarrative' ? 'NARRATIVE_SIGNAL' : 'OBSERVATION',
      claim: c.claim ?? `${c.factorFamily ?? 'evidence'} observation`,
      confidence: clamp01(c.evidenceConfidence ?? 0.5),
      observedAt,
      expiresAt: new Date(Date.parse(observedAt) + timing.ttlMs).toISOString(),
      horizon: timing.horizon,
      sourceClass: 'point-in-time-evidence-ledger',
      dependencies: [claimDependency(c.factorFamily)],
      contradictions: [],
    };
  }).filter((item): item is EvidenceItem => item !== null && Date.parse(item.expiresAt) > Date.parse(asOf));
}

function emptyEligibility(reason: string, status: 'WATCH_ONLY' | 'INELIGIBLE' = 'WATCH_ONLY'): ZobirisDecision['eligibility'] {
  return {
    status,
    maximumOrderUsd: 0,
    maximumPositionUsd: 0,
    spreadP95Bps: Number.NaN,
    entryImpactP95Bps: null,
    exitImpactP95Bps: null,
    stressedExitImpactBps: null,
    failureReasons: [reason],
  };
}

function buildFactors(asset: LegacyAssetLike, liquidity?: StrategyLiquidityInput) {
  const fundamental = neutralFactor(factor(asset, 'fundamentalTokenomics'));
  const market = factor(asset, 'marketTechnical');
  const flow = neutralFactor(market);
  const social = factor(asset, 'socialAttention') ?? 0.5;
  const catalyst = factor(asset, 'catalystsNarrative') ?? 0.5;
  const discovery = computeDiscoveryCatalyst({
    contributorBreadth: social,
    attentionAcceleration: social,
    catalystObservability: catalyst,
    sourceDiversity: asset.evidenceCoverage ?? 0,
    attentionHeadroom: 1 - social,
    crowdingPenalty: Math.max(0, social - 0.85),
  });
  const gates = asset.riskGates ?? [];
  const veto = gates.some((g) => g.active && g.effect === 'veto');
  const capped = gates.some((g) => g.active && g.effect === 'size_cap');
  const resilience = neutralFactor(veto ? 0.1 : capped ? 0.5 : 0.75, gates.length ? 1 : 0.6);
  let execution: FactorResult = { value: null, coverage: 0 };
  if (liquidity && liquidity.profile.snapshots.length > 0) {
    const planned = 30;
    const impacts = liquidity.profile.snapshots.map((s) => simulateImpactBps(s, 'buy', planned));
    execution = computeExecutionQuality({
      spreadP95Bps: liquidity.profile.spreadP95Bps,
      impactP95Bps: quantile(impacts, 0.95),
      depth50ToOrder: Math.min(liquidity.profile.bidDepth50P10Usd, liquidity.profile.askDepth50P10Usd) / planned,
      depth100ToOrder: Math.min(liquidity.profile.bidDepth100P10Usd, liquidity.profile.askDepth100P10Usd) / planned,
      venueHhi: 0.5,
      activeMinuteCoverage: liquidity.profile.activeMinuteCoverage,
    });
  }
  return { fundamental, execution, flow, discovery, resilience };
}

export function integrateStrategy21(input: IntegrateStrategy21Input): IntegratedSnapshotLike {
  const axes = marketAxes(input.snapshot.rankedAssets);
  const market = classifyMarketState({
    axes,
    confidence: marketConfidence(input.snapshot.rankedAssets),
    asOf: input.snapshot.asOf,
    previous: input.previousMarketState,
  });
  const ledger = createCapitalLedger(input.capitalLedger);
  const liquidityBySymbol = input.liquidityBySymbol ?? new Map<string, StrategyLiquidityInput>();
  const personalityBySymbol = input.personalityBySymbol ?? new Map<string, BehavioralProfileInput>();
  const portfolioDependencyInput = input.portfolioDependency ?? {
    asOf: input.snapshot.asOf,
    positions: [],
    metadata: [],
    histories: [],
  };
  const portfolioDependency = calculatePortfolioDependency(portfolioDependencyInput, { capitalBaseUsd: ledger.maneuverNavUsd });
  const recommendationMode: RecommendationMode = input.recommendationMode ?? 'LEGACY';
  const delayedRotationCalibration = calibrateDelayedRotationMarket(input.evidenceClaims);

  const provisional = input.snapshot.rankedAssets.map((asset) => {
    const symbol = asset.symbol.toUpperCase();
    const canonical = input.canonicalAssets.get(symbol);
    const liq = liquidityBySymbol.get(symbol);
    const identityVerified = canonical?.mappingStatus === 'verified' && asset.mappingStatus === 'verified';
    let eligibility: ZobirisDecision['eligibility'];
    if (!identityVerified) {
      eligibility = emptyEligibility('canonical identity is not verified', 'INELIGIBLE');
    } else if (!liq) {
      eligibility = emptyEligibility('Kraken execution history warming up; 14-day depth/notional evidence not yet available');
    } else {
      eligibility = evaluateLiquidityEligibility({
        pair: liq.pair,
        plannedOrderUsd: 30,
        intendedFinalPositionUsd: MEME_SYMBOLS.has(symbol) ? ledger.maneuverNavUsd * 0.03 : ledger.maneuverNavUsd * 0.12,
        profile: liq.profile,
        identityVerified: true,
        activeKrakenUsdPair: true,
        migrationResolved: true,
        exploitClear: !(asset.riskGates ?? []).some((g) => g.active && /exploit|identity/i.test(g.code ?? '')),
        tokenomicsComplete: (asset.evidenceCoverage ?? 0) >= 0.5,
        bookFresh: liq.profile.snapshots.length > 0 && Date.parse(input.snapshot.asOf) - Date.parse(liq.profile.snapshots.at(-1)!.observedAt) <= 15*60*1000,
        takerFeeBpsPerSide: liq.takerFeeBpsPerSide,
        estimatedGrossExpectedReturnBps: liq.estimatedGrossExpectedReturnBps,
        currentTradeCount24h: liq.currentTradeCount24h,
      });
    }
    const factors = buildFactors(asset, liq);
    const opp = computeOpportunityHeuristic({ ...factors, evidenceConfidence: clamp01(asset.confidence.pct/100) });
    const rScore = researchScore(asset);
    const requestedTargetUsd = adaptiveTargetUsd({
      capitalBaseUsd: ledger.maneuverNavUsd,
      assetClass: MEME_SYMBOLS.has(symbol) ? 'MEME' : 'CORE',
      opportunityScore: asset.opportunity.adjusted,
      opportunityConfidence: opp.confidence,
      marketConfidence: market.confidence,
      deploymentCapPct: market.deploymentCapPct,
    });
    const flowVal = factors.flow.value ?? 0.5;
    const fundVal = factors.fundamental.value ?? 0.5;
    const discoveryVal = factors.discovery.value ?? 0.5;
    const personalityInput = personalityBySymbol.get(symbol);
    const personality = personalityInput ? classifyBehavioralPersonality(personalityInput) : null;
    const liquidityAcceleration = liq
      ? assessLiquidityAcceleration(liq.currentTradeCount24h, liq.priorCompletedDayTradeCounts24h ?? [])
      : { status: 'UNKNOWN' as const, ratio: null, baselineTradeCount24h: null };
    const portfolioContext = currentPortfolioContextForAsset(portfolioDependencyInput, portfolioDependency, symbol, MEME_SYMBOLS);
    const dependencyRisk = portfolioDependency.assets.find((x) => x.symbol === symbol);
    const delayedRotation = evaluateDelayedRotation(symbol, input.evidenceClaims, delayedRotationCalibration);
    const decision = evaluateZobirisDecision({
      asset: { id: canonical?.id ?? asset.canonicalAssetId ?? symbol, symbol, name: canonical?.name ?? symbol, assetClass: MEME_SYMBOLS.has(symbol) ? 'MEME' : 'CORE' },
      asOf: input.snapshot.asOf,
      market,
      eligibility,
      factors,
      opportunity: opp,
      assetStateInput: {
        eligibility: eligibility.status,
        confidence: opp.confidence,
        fundamentalTrajectory: 2*fundVal-1,
        developerHealth: fundVal,
        minimumDeveloperHealth: 0.5,
        attentionPercentile: discoveryVal * 100,
        crowdingThreshold: 85,
        observableCatalyst: catalystOrSocial(asset) >= 0.60,
        contributorBreadthImproving: discoveryVal >= 0.60,
        spotAccumulation: flowVal >= 0.58,
        structurallyDeclining: fundVal < 0.35,
        extended: flowVal >= 0.85,
        deterioration: asset.action === 'REDUCE' || asset.action === 'EXIT' || asset.action === 'AVOID',
        existingPositionUsd: portfolioContext.assetExposureUsd,
        nonPriceConfirmation: fundVal >= 0.6 || discoveryVal >= 0.65,
        trendConfirmed: flowVal >= 0.68,
        profitable: false,
        expectedNextDollarBelowHoldHurdle: false,
      },
      ledger,
      portfolio: portfolioContext,
      requestedTargetUsd,
      evidence: toEvidence(input.evidenceClaims, symbol, input.snapshot.asOf),
      personality,
      lineSignals: {
        nonPriceConfirmation: fundVal >= 0.6 || discoveryVal >= 0.65,
        liquidityStable: eligibility.status === 'ACTIVE_ELIGIBLE' || eligibility.status === 'CONDITIONAL_PROBE_ELIGIBLE',
        supplyRiskStable: !(asset.riskGates ?? []).some((g) => g.active && /unlock|dilution/i.test(g.code ?? '')),
        spotRelativeStrengthConfirmed: flowVal >= 0.68,
        covarianceAcceptable: dependencyRisk?.covarianceAcceptable === true,
      },
    });
    const pilotQualified = recommendationMode !== DELAYED_ROTATION_MODE || delayedRotation.qualifiesForNewCapital;
    const pilotOrderCapUsd = Math.round(ledger.maneuverNavUsd * 0.02 * 100) / 100;
    const positionAuthority: ZobirisDecision['authority'] = pilotQualified
      ? {
          ...decision.authority,
          maxNextOrderUsd: recommendationMode === DELAYED_ROTATION_MODE
            ? Math.min(decision.authority.maxNextOrderUsd, pilotOrderCapUsd)
            : decision.authority.maxNextOrderUsd,
        }
      : { ...decision.authority, maxNextOrderUsd: 0 };
    const nextDollarScore = (eligibility.status === 'ACTIVE_ELIGIBLE' || eligibility.status === 'CONDITIONAL_PROBE_ELIGIBLE')
      && positionAuthority.maxNextOrderUsd > 0
      && opp.eligibleForRanking
      && pilotQualified
      ? (recommendationMode === DELAYED_ROTATION_MODE
          ? Math.round((0.65 * delayedRotation.score + 0.35 * opp.score) * 100) / 100
          : opp.score)
      : null;
    const dataReadiness: Strategy21AssetView['dataReadiness'] = !identityVerified ? 'IDENTITY_BLOCKED' : liq && eligibility.status !== 'WATCH_ONLY' ? 'READY' : 'KRAKEN_WARMUP';
    const researchIntegrity = buildResearchIntegrity({
      assetId: canonical?.id ?? asset.canonicalAssetId ?? symbol,
      symbol,
      asOf: input.snapshot.asOf,
      action: decision.action,
      assetState: decision.assetState.state,
      researchScore: rScore,
      opportunityScore: Number.isFinite(opp.score) ? opp.score : null,
      opportunityConfidence: clamp01(opp.confidence),
      eligibilityStatus: eligibility.status,
      dataReadiness,
      evidenceCoverage: asset.evidenceCoverage ?? 0,
      evidenceClaims: input.evidenceClaims,
      factors: {
        fundamental: factors.fundamental.value,
        execution: factors.execution.value,
        flow: factors.flow.value,
        discovery: factors.discovery.value,
        resilience: factors.resilience.value,
      },
      activeRiskGates: (asset.riskGates ?? [])
        .filter((gate) => gate.active)
        .map((gate) => ({ code: gate.code ?? 'UNSPECIFIED_RISK_GATE', effect: gate.effect ?? 'advisory' })),
    });
    return { asset, decision, positionAuthority, requestedTargetUsd, researchScore: rScore, nextDollarScore, dataReadiness, liquidityAcceleration, researchIntegrity, delayedRotation };
  });

  const researchOrder = [...provisional].sort((a,b) => b.researchScore - a.researchScore);
  const researchRank = new Map(researchOrder.map((x,i) => [x.asset.symbol.toUpperCase(), i+1]));
  const nextOrder = provisional.filter((x) => x.nextDollarScore !== null).sort((a,b) => (b.nextDollarScore ?? -1) - (a.nextDollarScore ?? -1));
  const nextRank = new Map(nextOrder.map((x,i) => [x.asset.symbol.toUpperCase(), i+1]));

  const rankedAssets: IntegratedAssetLike[] = provisional.map(({asset, decision, positionAuthority, requestedTargetUsd, researchScore: rs, nextDollarScore, dataReadiness, liquidityAcceleration, researchIntegrity, delayedRotation}) => ({
    ...asset,
    strategy21: {
      researchScore: rs,
      researchRank: researchRank.get(asset.symbol.toUpperCase()) ?? 0,
      nextDollarScore,
      nextDollarRank: nextRank.get(asset.symbol.toUpperCase()) ?? null,
      doctrine: decision.doctrine,
      marketState: decision.market.state,
      marketEnteredAt: decision.market.enteredAt,
      minimumDwellUntil: decision.market.minimumDwellUntil,
      assetState: decision.assetState.state,
      action: decision.action,
      eligibility: decision.eligibility,
      factors: decision.factors,
      opportunity: decision.opportunity,
      positionAuthority,
      adaptiveTargetUsd: requestedTargetUsd,
      stagedExecution: decision.stagedExecution,
      explanation: decision.explanation,
      personality: decision.personality,
      liquidityAcceleration,
      dataReadiness,
      researchIntegrity,
      delayedRotation,
    },
  }));

  let intelligenceShadow: IntelligenceShadowResult | undefined;
  if (input.intelligenceShadowInput) {
    const dependencyBySymbol = new Map(portfolioDependency.assets.map((x) => [x.symbol.toUpperCase(), x]));
    intelligenceShadow = buildIntelligenceShadow({
      input: input.intelligenceShadowInput,
      decisionAsOf: input.snapshot.asOf,
      market,
      assets: provisional.map(({ asset, decision, dataReadiness }) => {
        const symbol = asset.symbol.toUpperCase();
        const dependency = dependencyBySymbol.get(symbol);
        return {
          symbol,
          liquidityEligible: decision.eligibility.status === 'ACTIVE_ELIGIBLE' || decision.eligibility.status === 'CONDITIONAL_PROBE_ELIGIBLE',
          dependencyAcceptable: dependency?.covarianceAcceptable === true || portfolioDependency.assets.length === 0,
          capitalRoomUsd: decision.authority.maxNextOrderUsd,
          integrityIntact: dataReadiness !== 'IDENTITY_BLOCKED' && !(asset.riskGates ?? []).some((g) => g.active && g.effect === 'veto'),
        };
      }),
    });
  }

  return {
    ...input.snapshot,
    policyVersion: `${input.snapshot.policyVersion}+strategy21`,
    regime: doctrineAlias(market.state),
    regimeConfidence: Math.round(market.confidence * 10000) / 100,
    rankedAssets,
    strategy21: {
      version: '2.1',
      marketState: market.state,
      doctrine: doctrineAlias(market.state),
      marketConfidence: market.confidence,
      deploymentCapPct: market.deploymentCapPct,
      deploymentAuthorityUsd: deploymentCapForState(market.state, ledger.maneuverNavUsd),
      maneuverCapitalUsd: 1850,
      researchAuthority: 'DESCRIPTIVE_ONLY',
      rankingAuthority: 'OPPORTUNITY_HEURISTIC_V1',
      positionSizingAuthority: 'CONSERVATIVE_ADAPTIVE_TARGET_WITH_RISK_CAPS',
      strategicReserveTargetUsd: 1800,
      strategicReserveFundedUsd: 0,
      eventualPortfolioTargetUsd: 3000,
      nextDollarReadyAssets: nextOrder.length,
      enteredAt: market.enteredAt,
      minimumDwellUntil: market.minimumDwellUntil,
      portfolioDependency,
      researchIntegrityVersion: '1.0',
      capabilityManifest: CAPABILITY_MANIFEST,
      narrativeResearchPolicy: NARRATIVE_RESEARCH_POLICY,
      recommendationMode,
      delayedRotationCalibration,
      ...(intelligenceShadow ? { intelligenceShadow } : {}),
      ...(input.previousMarketState ? { previousState: input.previousMarketState } : {}),
    },
  };
}

function catalystOrSocial(asset: LegacyAssetLike): number {
  return Math.max(factor(asset, 'socialAttention') ?? 0, factor(asset, 'catalystsNarrative') ?? 0);
}

export function buildEmptyLiquidityProfile(): LiquidityProfile {
  return buildLiquidityProfile({ snapshots: [], dailyCredibleNotionalUsd: [] });
}
