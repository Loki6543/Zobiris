import type { ObservationEvent, ToleranceSchedule, ValidationConclusion } from './types.js';
export interface VerificationInput {
    reference: ObservationEvent[];
    candidate: ObservationEvent[];
    schedule: ToleranceSchedule;
    datasetHashEqual: boolean;
    strategyHashEqual: boolean;
    configHashEqual: boolean;
    observationProtocolHashEqual: boolean;
    executionModelHashEqual: boolean;
    initialCash?: number;
    quoteCurrency?: string;
    tickSizeBySymbol?: Record<string, number>;
}
export interface VerificationDiff {
    stream: ObservationEvent['kind'] | 'IDENTITY' | 'SELF_CONFORMANCE';
    index: number;
    reason: string;
    reference?: ObservationEvent;
    candidate?: ObservationEvent;
}
export interface NumericToleranceUse {
    stream: ObservationEvent['kind'];
    index: number;
    field: string;
    delta: number;
    allowed: number;
}
export interface VerificationResult {
    conclusion: ValidationConclusion;
    eligibleForIntegrityScoring: boolean;
    diffs: VerificationDiff[];
    toleranceUses: NumericToleranceUse[];
    referenceSelfConformanceIssues: string[];
    candidateSelfConformanceIssues: string[];
}
/** Independently recompute spot cash/positions/equity from fills + mark prices and compare engine snapshots. */
export declare function verifySelfConformance(events: ObservationEvent[], initialCash?: number, quoteCurrency?: string, schedule?: ToleranceSchedule): string[];
export declare function verifyObservations(input: VerificationInput): VerificationResult;
export interface ExposureInvariant {
    minInitialExposurePct?: number;
    maxInitialExposurePct?: number;
    maxGrossExposurePct?: number;
    longOnly?: boolean;
}
/** Recompute exposure from fills + independent MARK_PRICE/EQUITY_MARK observations, not engine analyzer summaries. */
export declare function verifyExposureInvariants(events: ObservationEvent[], invariant: ExposureInvariant, initialCash?: number): string[];
