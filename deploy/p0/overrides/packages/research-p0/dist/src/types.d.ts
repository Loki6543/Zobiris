export type Sha256 = string;
export type Iso8601 = string;
export type ResearchClass = 'EXPLORATORY' | 'CONFIRMATORY';
export type FamilyStatus = 'OPEN' | 'OBSERVATIONAL' | 'SELECTED' | 'FORWARD_SHADOW' | 'PROMOTED' | 'WATCH' | 'REJECTED' | 'DEMOTED' | 'REVALIDATING' | 'CLOSED';
export type ReproductionTier = 'R1_BYTE_REPRODUCIBLE' | 'R2_CONFIG_REPRODUCIBLE_INPUTS_UNPINNED' | 'R3_CONTEXTUAL_ONLY';
export type FreezeStatus = 'FROZEN' | 'SOURCE_DATA_NOT_FROZEN' | 'RESTATED_SUSPECT' | 'MISSING';
export type ProviderSurface = 'CHATGPT_CONNECTOR' | 'DIRECT_MCP' | 'WEB_UI' | 'OTHER';
export type SplitKind = 'SINGLE' | 'HOLDOUT' | 'WALK_FORWARD' | 'CSCV' | 'CPCV' | 'FORWARD_SHADOW';
export type ResultRole = 'IN_SAMPLE' | 'OUT_OF_SAMPLE' | 'CPCV_PATH' | 'HOLDOUT' | 'FORWARD_SHADOW' | 'REFERENCE_ORACLE';
export type ValidationConclusion = 'EXACT_MATCH' | 'MATCH_WITH_REGISTERED_NUMERIC_TOLERANCE' | 'ORDER_DIVERGENCE' | 'PRICE_DIVERGENCE' | 'SIGNAL_DIVERGENCE' | 'POSITION_DIVERGENCE' | 'CASH_DIVERGENCE' | 'NAV_DIVERGENCE' | 'MATERIAL_EXECUTION_DIVERGENCE' | 'DATASET_NOT_REPRODUCIBLE' | 'NOT_COMPARABLE';
export type PromotionDecision = 'PASS' | 'WATCH' | 'REJECT' | 'PROMOTE' | 'DEMOTE' | 'REVALIDATE';
export interface ArtifactRef {
    sha256: Sha256;
    mediaType: string;
    byteLen: number;
    storagePath: string;
    origin: 'original_input' | 'provider_response' | 'canonical_representation' | 'computed' | 'manual_capture' | 'external_witness';
}
export interface CapabilityTool {
    name: string;
    inputSchema: unknown;
}
export interface CapabilityManifest {
    manifestId: string;
    provider: string;
    surface: ProviderSurface;
    endpoint?: string;
    protocolVersion?: string;
    clientVersion?: string;
    serverVersion?: string;
    accountFingerprint?: string;
    oauthScopeSetSha256?: Sha256;
    toolsRawSha256: Sha256;
    toolsCanonicalSha256: Sha256;
    previousManifestId?: string;
    diffSha256?: Sha256;
    observedAt: Iso8601;
}
export interface AuditChainEvent {
    sequenceNo: number;
    eventId: string;
    eventType: string;
    payloadSha256: Sha256;
    previousEventHash?: Sha256;
    eventHash: Sha256;
    occurredAt: Iso8601;
    externalWitnessRef?: string;
}
export interface ResearchPlan {
    planId: string;
    planHash: Sha256;
    researchClass: ResearchClass;
    hypothesis: string;
    parentFamilyId?: string;
    candidateGenerationHash: Sha256;
    searchSpaceHash: Sha256;
    selectionRuleHash: Sha256;
    effectiveTrialFnHash: Sha256;
    splitDefinitionHash: Sha256;
    metricDefinitionHash: Sha256;
    costModelHash: Sha256;
    dataUniverseDefinitionHash: Sha256;
    stoppingRuleHash: Sha256;
    hypothesisGenerationEndTs?: Iso8601;
    confirmationStartTs?: Iso8601;
    registrationEventId: string;
    registeredAt: Iso8601;
    createdBy: string;
}
export interface DatasetArtifact {
    datasetId: string;
    artifactHash: Sha256;
    name: string;
    provider?: string;
    sourceKind: 'LONA_GLOBAL' | 'LONA_CUSTOM' | 'LOCAL_OWNED' | 'SYNTHETIC' | 'OTHER';
    reproductionTier: ReproductionTier;
    freezeStatus: FreezeStatus;
    originalInputSha256?: Sha256;
    providerResponseSha256?: Sha256;
    canonicalRepresentationSha256?: Sha256;
    symbol?: string;
    frequency?: string;
    startTs?: Iso8601;
    endTs?: Iso8601;
    rowCount?: number;
    captureMethod?: string;
    capabilityManifestId?: string;
    capturedAt: Iso8601;
    notes?: string;
}
export interface EngineRuntime {
    runtimeId: string;
    runtimeHash: Sha256;
    engineName: string;
    engineVersion?: string;
    languageRuntime?: string;
    gitCommit?: string;
    dependencyLockSha256?: Sha256;
    containerImageDigest?: string;
    osArch?: string;
    numericalLibrariesSha256?: Sha256;
    observationProtocolHash: Sha256;
    observationAdapterHash: Sha256;
    executionModelHash: Sha256;
    defaultToleranceScheduleHash: Sha256;
    createdAt: Iso8601;
}
export interface CandidateStrategy {
    candidateId: string;
    familyId: string;
    ordinal: number;
    strategyCodeSha256: Sha256;
    strategySourceSha256?: Sha256;
    parametersSha256: Sha256;
    behavioralSpecSha256?: Sha256;
    provider: string;
    providerStrategyId?: string;
    providerStrategyVersionId?: string;
    providerReportId?: string;
    sourceCaptureMethod: string;
    generationModel?: string;
    behavioralFingerprint?: string;
    createdAt: Iso8601;
}
export interface EvaluationSplit {
    splitId: string;
    familyId: string;
    splitHash: Sha256;
    schemeKind: SplitKind;
    definitionSha256: Sha256;
    partitionCount?: number;
    purgeBars: number;
    embargoBars: number;
    registrationEventId?: string;
    registeredAt: Iso8601;
}
export interface CandidateResult {
    resultId: string;
    familyId: string;
    candidateId: string;
    splitId: string;
    datasetId: string;
    runtimeId: string;
    runConfigHash: Sha256;
    resultHash: Sha256;
    recordEventId?: string;
    resultRole: ResultRole;
    metricDefinitionHash: Sha256;
    costModelHash: Sha256;
    observationsSha256?: Sha256;
    ordersSha256?: Sha256;
    fillsSha256?: Sha256;
    positionsSha256?: Sha256;
    equityMarksSha256?: Sha256;
    periodicReturnsSha256?: Sha256;
    rawReportSha256?: Sha256;
    primaryMetricName: string;
    primaryMetricValue?: number;
    nObservations?: number;
    meanReturn?: number;
    stddevReturn?: number;
    skew?: number;
    kurtosis?: number;
    sharpe?: number;
    maxDrawdownPct?: number;
    cagrPct?: number;
    turnover?: number;
    firstFillTs?: Iso8601;
    maxExposurePct?: number;
    avgExposurePct?: number;
    timeInMarketPct?: number;
    primitiveComplete?: boolean;
    createdAt: Iso8601;
}
export interface SelectionEvent {
    selectionId: string;
    familyId: string;
    selectedCandidateId: string;
    selectedSplitId: string;
    selectionHash: Sha256;
    recordEventId: string;
    selectionRuleHash: Sha256;
    effectiveTrialFnHash: Sha256;
    candidateUniverseHash: Sha256;
    splitDefinitionHash: Sha256;
    metricDefinitionHash: Sha256;
    costModelHash: Sha256;
    trialCountRaw: number;
    effectiveTrialCount: number;
    experimentHash: Sha256;
    dsrArtifactSha256?: Sha256;
    pboArtifactSha256?: Sha256;
    cpcvArtifactSha256?: Sha256;
    selectedAt: Iso8601;
}
export interface ToleranceSchedule {
    scheduleId: string;
    version: string;
    timestampMode: 'EXACT';
    quantityTolerance: number;
    priceToleranceTicks: number;
    navToleranceBps: number;
    cashTolerance: number;
    positionTolerance: number;
}
export interface EngineValidation {
    validationId: string;
    familyId: string;
    candidateId: string;
    referenceResultId: string;
    candidateResultId: string;
    datasetHashEqual: boolean;
    strategyHashEqual: boolean;
    configHashEqual: boolean;
    observationProtocolHashEqual: boolean;
    executionModelHashEqual: boolean;
    toleranceScheduleHash: Sha256;
    verifierVersion: string;
    verifierCodeSha256: Sha256;
    verifierOutputSha256: Sha256;
    conclusion: ValidationConclusion;
    numericToleranceEvidenceSha256?: Sha256;
    diffSummarySha256?: Sha256;
    eligibleForIntegrityScoring?: boolean;
    supersedesValidationId?: string;
    computedAt: Iso8601;
}
export interface PromotionAssessment {
    assessmentId: string;
    familyId: string;
    candidateId: string;
    selectionEventId?: string;
    engineValidationId?: string;
    noiseCalibrationId?: string;
    behavioralConformanceSha256?: Sha256;
    capitalInvariantPassed: boolean;
    integrityAssessmentSha256?: Sha256;
    shadowStartTs?: Iso8601;
    shadowStatus?: string;
    decision: PromotionDecision;
    humanApprover?: string;
    rationale: string;
    supersedesAssessmentId?: string;
    decidedAt: Iso8601;
}
export interface FamilyLifecycleEvent {
    lifecycleId: string;
    familyId: string;
    seq: number;
    fromStatus: FamilyStatus | 'NONE';
    toStatus: FamilyStatus;
    assessmentId?: string;
    reason: string;
    occurredAt: Iso8601;
}
export type ObservationEvent = {
    kind: 'ORDER_SUBMITTED';
    ts: Iso8601;
    orderId: string;
    symbol: string;
    side: 'BUY' | 'SELL';
    quantity: number;
    orderType: string;
    limitPrice?: number;
} | {
    kind: 'ORDER_FILLED';
    ts: Iso8601;
    orderId: string;
    symbol: string;
    side: 'BUY' | 'SELL';
    quantity: number;
    price: number;
    feeQuote?: number;
} | {
    kind: 'MARK_PRICE';
    ts: Iso8601;
    symbol: string;
    price: number;
    markConvention: string;
} | {
    kind: 'POSITION_SNAPSHOT';
    ts: Iso8601;
    symbol: string;
    quantity: number;
} | {
    kind: 'CASH_SNAPSHOT';
    ts: Iso8601;
    currency: string;
    amount: number;
} | {
    kind: 'EQUITY_MARK';
    ts: Iso8601;
    equity: number;
    markConvention: string;
};
export interface ExperimentHashParts {
    strategyCodeHash: Sha256;
    parametersHash: Sha256;
    datasetHashes: Sha256[];
    runtimeHash: Sha256;
    executionModelHash: Sha256;
    costModelHash: Sha256;
    splitDefinitionHash: Sha256;
    metricDefinitionHash: Sha256;
    benchmarkDefinitionHashes: Sha256[];
}
