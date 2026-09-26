export interface FactorResult {
  value: number | null;
  coverage: number;
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function mapSignedToUnit(value: number): number {
  return clamp01((Math.max(-1, Math.min(1, value)) + 1) / 2);
}

function average(values: number[]): number {
  return values.length === 0 ? 0 : values.reduce((sum, value) => sum + value, 0) / values.length;
}

function geometricMean(values: number[]): number {
  if (values.length === 0) return 0;
  if (values.some((value) => value <= 0)) return 0;
  return Math.exp(values.reduce((sum, value) => sum + Math.log(value), 0) / values.length);
}

export interface FundamentalInputs {
  usersDelta?: number;
  feesDelta?: number;
  retentionDelta?: number;
  developerBreadthDelta?: number;
  tokenValueCaptureDelta?: number;
  concentrationPenalty?: number;
}

export function computeFundamentalTrajectory(input: FundamentalInputs): FactorResult {
  const values = [
    input.usersDelta,
    input.feesDelta,
    input.retentionDelta,
    input.developerBreadthDelta,
    input.tokenValueCaptureDelta,
  ].filter((value): value is number => value !== undefined && Number.isFinite(value));

  const coverage = values.length / 5;
  if (values.length < 2) return { value: null, coverage };
  const signed = average(values) - (input.concentrationPenalty ?? 0);
  return { value: mapSignedToUnit(signed), coverage };
}

export interface ExecutionInputs {
  spreadP95Bps: number;
  impactP95Bps: number;
  depth50ToOrder: number;
  depth100ToOrder: number;
  venueHhi: number;
  activeMinuteCoverage: number;
}

export function computeExecutionQuality(input: ExecutionInputs): FactorResult {
  const components = [
    clamp01(1 - input.spreadP95Bps / 25),
    clamp01(1 - input.impactP95Bps / 35),
    clamp01(input.depth50ToOrder / 10),
    clamp01(input.depth100ToOrder / 25),
    clamp01(1 - input.venueHhi),
    clamp01(input.activeMinuteCoverage),
  ];
  return { value: geometricMean(components), coverage: 1 };
}

export interface FlowSetupInputs {
  spotCvd: number;
  spotVolumeResidual: number;
  betaNeutralRelativeStrength: number;
  priceStructure: number;
  leverageResilience: number;
}

export function computeFlowSetup(input: FlowSetupInputs): FactorResult {
  const signed =
    0.30 * input.spotCvd +
    0.20 * input.spotVolumeResidual +
    0.20 * input.betaNeutralRelativeStrength +
    0.15 * input.priceStructure +
    0.15 * input.leverageResilience;
  return { value: mapSignedToUnit(signed), coverage: 1 };
}

export interface DiscoveryInputs {
  contributorBreadth: number;
  attentionAcceleration: number;
  catalystObservability: number;
  sourceDiversity: number;
  attentionHeadroom: number;
  crowdingPenalty: number;
}

export function computeDiscoveryCatalyst(input: DiscoveryInputs): FactorResult {
  const value =
    0.30 * clamp01(input.contributorBreadth) +
    0.20 * clamp01(input.attentionAcceleration) +
    0.25 * clamp01(input.catalystObservability) +
    0.15 * clamp01(input.sourceDiversity) +
    0.10 * clamp01(input.attentionHeadroom) -
    clamp01(input.crowdingPenalty);
  return { value: clamp01(value), coverage: 1 };
}

export interface LossResilienceInputs {
  dilutionRisk: number;
  unlockRisk: number;
  securityRisk: number;
  holderConcentration: number;
  regulatoryTail: number;
  venueDependency: number;
}

export function computeLossResilience(input: LossResilienceInputs): FactorResult {
  const lossRisk =
    0.25 * clamp01(input.dilutionRisk) +
    0.20 * clamp01(input.unlockRisk) +
    0.20 * clamp01(input.securityRisk) +
    0.15 * clamp01(input.holderConcentration) +
    0.10 * clamp01(input.regulatoryTail) +
    0.10 * clamp01(input.venueDependency);
  return { value: clamp01(1 - lossRisk), coverage: 1 };
}

export interface OpportunityHeuristicInput {
  fundamental: FactorResult;
  execution: FactorResult;
  flow: FactorResult;
  discovery: FactorResult;
  resilience: FactorResult;
  evidenceConfidence: number;
}

export interface OpportunityHeuristicResult {
  score: number;
  confidence: number;
  coverage: number;
  eligibleForRanking: boolean;
}

export function computeOpportunityHeuristic(input: OpportunityHeuristicInput): OpportunityHeuristicResult {
  const factors = [input.fundamental, input.execution, input.flow, input.discovery, input.resilience];
  const coverage = average(factors.map((factor) => factor.coverage));
  const confidence = clamp01(input.evidenceConfidence);
  if (input.fundamental.value === null || input.execution.value === null || input.flow.value === null || input.resilience.value === null) {
    return { score: 0, confidence, coverage, eligibleForRanking: false };
  }
  const discovery = input.discovery.value ?? 0.5;
  const raw =
    0.25 * input.fundamental.value +
    0.20 * input.execution.value +
    0.25 * input.flow.value +
    0.15 * discovery +
    0.15 * input.resilience.value;
  return {
    score: Math.round(raw * 10_000) / 100,
    confidence,
    coverage,
    eligibleForRanking: coverage >= 0.65 && confidence > 0.50,
  };
}

export interface MemeOpportunityInput {
  distributionIntegrity: number;
  execution: FactorResult;
  flow: FactorResult;
  discovery: FactorResult;
  resilience: FactorResult;
  evidenceConfidence: number;
}

export interface MemeOpportunityResult extends OpportunityHeuristicResult {
  coreAuthority: false;
  distributionIntegrity: number;
}

export function computeMemeOpportunity(input: MemeOpportunityInput): MemeOpportunityResult {
  const distribution = clamp01(input.distributionIntegrity);
  const execution = input.execution.value ?? 0;
  const flow = input.flow.value ?? 0;
  const discovery = input.discovery.value ?? 0;
  const resilience = input.resilience.value ?? 0;
  const raw = 0.25 * distribution + 0.25 * execution + 0.25 * flow + 0.15 * discovery + 0.10 * resilience;
  let score = raw * 100;
  if (distribution < 0.35) score = Math.min(score, 40);
  return {
    score: Math.round(score * 100) / 100,
    confidence: clamp01(input.evidenceConfidence),
    coverage: average([input.execution.coverage, input.flow.coverage, input.discovery.coverage, input.resilience.coverage, 1]),
    eligibleForRanking: distribution >= 0.25 && input.evidenceConfidence > 0.50,
    coreAuthority: false,
    distributionIntegrity: distribution,
  };
}
