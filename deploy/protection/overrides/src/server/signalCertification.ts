import type { DecisionOutcomeRecord, OutcomeHorizon } from "./outcomeMemory.js";

export type SignalCertificationStatus =
  | "UNAVAILABLE"
  | "INSUFFICIENT_SAMPLE"
  | "FRAGILE"
  | "STABLE_SHADOW";

export type SignalCertification = {
  version: "1.0";
  authority: "SHADOW_ONLY_NO_ENTRY_SCORE_CHANGE";
  status: SignalCertificationStatus;
  promotionEligible: false;
  primaryHorizon: OutcomeHorizon;
  pointInTimeAudit: {
    acceptedEpisodes: number;
    rejectedEpisodes: number;
    status: "PASS" | "PARTIAL" | "NO_DATA";
  };
  sample: {
    resolvedEpisodes: number;
    sampledTouches: number;
    validWalkForwardWindows: number;
    minimumResolvedForStability: number;
    minimumTouchesForStability: number;
  };
  walkForward: {
    trainEpisodes: number;
    validationEpisodes: number;
    windows: Array<{
      index: number;
      validationResolved: number;
      validationTouches: number;
      touchRate: number | null;
      averageReturnAfterKnownCostsPct: number | null;
      positiveRate: number | null;
    }>;
    medianWindowReturnPct: number | null;
    worstWindowReturnPct: number | null;
    positiveWindowRate: number | null;
  };
  perturbation: {
    method: "7D_MAX_ADVERSE_EXCURSION_PROXY";
    currentPullbackPct: number | null;
    cases: Array<{
      pullbackPct: number;
      touchedEpisodes: number;
      touchRate: number | null;
      averageReturnAfterKnownCostsPct: number | null;
    }>;
    fragile: boolean | null;
  };
  execution: {
    spreadP95Bps: number | null;
    entryImpactP95Bps: number | null;
    exitImpactP95Bps: number | null;
    stressedExitImpactBps: number | null;
    roundTripFeeBps: number | null;
    knownRoundTripCostBps: number | null;
    feesKnown: boolean;
  };
  regime: {
    marketState: string | null;
    pilotState: string | null;
    currentCompatible: boolean;
    historicalRegimeStratificationAvailable: false;
  };
  limitations: string[];
};

const PRIMARY_HORIZON: OutcomeHorizon = "7D";
const MIN_RESOLVED = 30;
const MIN_TOUCHES = 8;
const MIN_TRAIN = 12;
const VALIDATION_SIZE = 5;

function finite(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function positive(value: unknown): number | null {
  const n = finite(value);
  return n !== null && n > 0 ? n : null;
}

function validTime(value: unknown): number | null {
  const n = typeof value === "number" ? value : Date.parse(String(value ?? ""));
  return Number.isFinite(n) ? n : null;
}

function median(values: number[]): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[mid]!
    : (sorted[mid - 1]! + sorted[mid]!) / 2;
}

function average(values: number[]): number | null {
  return values.length
    ? values.reduce((sum, value) => sum + value, 0) / values.length
    : null;
}

function round(value: number | null, digits = 4): number | null {
  return value === null ? null : Number(value.toFixed(digits));
}

function executionCosts(eligibility: any) {
  const spreadP95Bps = finite(eligibility?.spreadP95Bps);
  const entryImpactP95Bps = finite(eligibility?.entryImpactP95Bps);
  const exitImpactP95Bps = finite(eligibility?.exitImpactP95Bps);
  const stressedExitImpactBps = finite(eligibility?.stressedExitImpactBps);
  const feePerSide = finite(
    eligibility?.takerFeeBpsPerSide ?? eligibility?.feeBpsPerSide,
  );
  const explicitRoundTripFee = finite(
    eligibility?.roundTripFeeBps ?? eligibility?.estimatedRoundTripFeeBps,
  );
  const roundTripFeeBps =
    explicitRoundTripFee ?? (feePerSide === null ? null : feePerSide * 2);
  const knownRoundTripCostBps =
    entryImpactP95Bps !== null && exitImpactP95Bps !== null
      ? entryImpactP95Bps + exitImpactP95Bps + (roundTripFeeBps ?? 0)
      : null;
  return {
    spreadP95Bps,
    entryImpactP95Bps,
    exitImpactP95Bps,
    stressedExitImpactBps,
    roundTripFeeBps,
    knownRoundTripCostBps,
    feesKnown: roundTripFeeBps !== null,
  };
}

type Episode = {
  record: DecisionOutcomeRecord;
  generatedAt: number;
  evaluatedAt: number;
  observedAt: number;
  dueAt: number;
  priceUsd: number;
  proposedLimitUsd: number | null;
  referencePriceUsd: number;
  baselineTouched: boolean;
  baselineReturnPct: number | null;
  maxAdversePct: number;
};

function normalizeEpisode(
  record: DecisionOutcomeRecord,
  symbol: string,
): Episode | null {
  if (
    record.measurementVersion !== "episodes-v2" ||
    record.symbol.toUpperCase() !== symbol ||
    record.strategyStatus !== "QUALIFIED"
  )
    return null;

  const evaluation = record.evaluations.find(
    (item) =>
      item.horizon === PRIMARY_HORIZON &&
      item.status === "RESOLVED" &&
      item.priceUsd != null,
  );
  if (!evaluation) return null;

  const generatedAt = validTime(record.generatedAt);
  const dueAt = validTime(evaluation.dueAt);
  const observedAt = validTime(evaluation.priceObservedAt);
  const evaluatedAt = validTime(evaluation.evaluatedAt);
  const priceUsd = positive(evaluation.priceUsd);
  const referencePriceUsd = positive(record.referencePriceUsd);
  if (
    generatedAt === null ||
    dueAt === null ||
    observedAt === null ||
    evaluatedAt === null ||
    priceUsd === null ||
    referencePriceUsd === null ||
    generatedAt > dueAt ||
    dueAt > observedAt ||
    observedAt > evaluatedAt
  )
    return null;

  const proposedLimitUsd = positive(record.proposedLimitUsd);
  const touchAt = validTime(record.sampledTouchAt);
  const baselineTouched =
    proposedLimitUsd !== null &&
    touchAt !== null &&
    touchAt >= generatedAt &&
    touchAt <= observedAt;
  const baselineReturnPct =
    baselineTouched && proposedLimitUsd !== null
      ? (priceUsd / proposedLimitUsd - 1) * 100
      : null;

  return {
    record,
    generatedAt,
    dueAt,
    observedAt,
    evaluatedAt,
    priceUsd,
    proposedLimitUsd,
    referencePriceUsd,
    baselineTouched,
    baselineReturnPct,
    maxAdversePct: finite(record.maxAdversePct) ?? 0,
  };
}

function adjustedReturn(
  returnPct: number | null,
  knownRoundTripCostBps: number | null,
) {
  if (returnPct === null) return null;
  return returnPct - (knownRoundTripCostBps ?? 0) / 100;
}

function perturbationCase(
  episodes: Episode[],
  pullbackPct: number,
  knownRoundTripCostBps: number | null,
) {
  const touched = episodes.filter(
    (episode) => episode.maxAdversePct <= -pullbackPct,
  );
  const returns = touched
    .map((episode) => {
      const hypotheticalLimit =
        episode.referencePriceUsd * (1 - pullbackPct / 100);
      const gross = (episode.priceUsd / hypotheticalLimit - 1) * 100;
      return adjustedReturn(gross, knownRoundTripCostBps);
    })
    .filter((value): value is number => value !== null && Number.isFinite(value));
  return {
    pullbackPct: Number(pullbackPct.toFixed(2)),
    touchedEpisodes: touched.length,
    touchRate: episodes.length ? round(touched.length / episodes.length) : null,
    averageReturnAfterKnownCostsPct: round(average(returns)),
  };
}

export function certifyEntrySignal(args: {
  symbol: string;
  baselinePullbackPct: number | null;
  effectivePullbackPct?: number | null;
  marketState?: string | null;
  pilotState?: string | null;
  eligibility?: any;
  records?: DecisionOutcomeRecord[];
}): SignalCertification {
  const symbol = String(args.symbol ?? "").toUpperCase();
  const source = (args.records ?? []).filter(
    (record) =>
      record.measurementVersion === "episodes-v2" &&
      record.symbol.toUpperCase() === symbol &&
      record.strategyStatus === "QUALIFIED",
  );
  const accepted = source
    .map((record) => normalizeEpisode(record, symbol))
    .filter((episode): episode is Episode => episode !== null)
    .sort((a, b) => a.generatedAt - b.generatedAt);
  const rejectedEpisodes = source.length - accepted.length;
  const execution = executionCosts(args.eligibility);
  const baselineReturns = accepted
    .map((episode) =>
      adjustedReturn(episode.baselineReturnPct, execution.knownRoundTripCostBps),
    )
    .filter((value): value is number => value !== null && Number.isFinite(value));

  const windows: SignalCertification["walkForward"]["windows"] = [];
  for (
    let validationStart = MIN_TRAIN;
    validationStart + VALIDATION_SIZE <= accepted.length;
    validationStart += VALIDATION_SIZE
  ) {
    const validation = accepted.slice(
      validationStart,
      validationStart + VALIDATION_SIZE,
    );
    const touchedReturns = validation
      .map((episode) =>
        adjustedReturn(
          episode.baselineReturnPct,
          execution.knownRoundTripCostBps,
        ),
      )
      .filter(
        (value): value is number => value !== null && Number.isFinite(value),
      );
    windows.push({
      index: windows.length + 1,
      validationResolved: validation.length,
      validationTouches: touchedReturns.length,
      touchRate: validation.length
        ? round(touchedReturns.length / validation.length)
        : null,
      averageReturnAfterKnownCostsPct: round(average(touchedReturns)),
      positiveRate: touchedReturns.length
        ? round(
            touchedReturns.filter((value) => value > 0).length /
              touchedReturns.length,
          )
        : null,
    });
  }
  const validWindows = windows.filter(
    (window) =>
      window.validationTouches >= 2 &&
      window.averageReturnAfterKnownCostsPct !== null,
  );
  const windowReturns = validWindows
    .map((window) => window.averageReturnAfterKnownCostsPct)
    .filter((value): value is number => value !== null);
  const positiveWindowRate = validWindows.length
    ? validWindows.filter(
        (window) => (window.averageReturnAfterKnownCostsPct ?? -Infinity) > 0,
      ).length / validWindows.length
    : null;

  const currentPullback =
    finite(args.baselinePullbackPct) !== null &&
    (args.baselinePullbackPct as number) >= 4 &&
    (args.baselinePullbackPct as number) <= 8
      ? (args.baselinePullbackPct as number)
      : null;
  const perturbationCases =
    currentPullback === null
      ? []
      : [
          Math.max(4, currentPullback - 1),
          currentPullback,
          Math.min(10, currentPullback + 1),
        ]
          .filter((value, index, values) => values.indexOf(value) === index)
          .map((pullbackPct) =>
            perturbationCase(
              accepted,
              pullbackPct,
              execution.knownRoundTripCostBps,
            ),
          );
  const perturbationReturns = perturbationCases
    .map((item) => item.averageReturnAfterKnownCostsPct)
    .filter((value): value is number => value !== null);
  const center = perturbationCases.find(
    (item) =>
      currentPullback !== null &&
      Math.abs(item.pullbackPct - currentPullback) < 1e-9,
  );
  const worstPerturbation = perturbationReturns.length
    ? Math.min(...perturbationReturns)
    : null;
  const perturbationFragile =
    center?.averageReturnAfterKnownCostsPct == null || worstPerturbation == null
      ? null
      : worstPerturbation < 0 ||
        center.averageReturnAfterKnownCostsPct - worstPerturbation >
          Math.max(2, Math.abs(center.averageReturnAfterKnownCostsPct) * 0.5);

  const sampledTouches = baselineReturns.length;
  const enoughSample =
    accepted.length >= MIN_RESOLVED &&
    sampledTouches >= MIN_TOUCHES &&
    validWindows.length >= 3;
  const medianWindowReturn = median(windowReturns);
  const worstWindowReturn = windowReturns.length
    ? Math.min(...windowReturns)
    : null;
  const robustWalkForward =
    enoughSample &&
    medianWindowReturn !== null &&
    medianWindowReturn > 0 &&
    worstWindowReturn !== null &&
    worstWindowReturn > -2 &&
    positiveWindowRate !== null &&
    positiveWindowRate >= 2 / 3;
  const currentCompatible =
    args.pilotState === "QUALIFIED" &&
    ["ACTIVE_ELIGIBLE", "CONDITIONAL_PROBE_ELIGIBLE"].includes(
      String(args.eligibility?.status ?? ""),
    );

  let status: SignalCertificationStatus = "UNAVAILABLE";
  if (source.length || accepted.length) status = "INSUFFICIENT_SAMPLE";
  if (enoughSample)
    status =
      robustWalkForward && perturbationFragile === false
        ? "STABLE_SHADOW"
        : "FRAGILE";

  return {
    version: "1.0",
    authority: "SHADOW_ONLY_NO_ENTRY_SCORE_CHANGE",
    status,
    promotionEligible: false,
    primaryHorizon: PRIMARY_HORIZON,
    pointInTimeAudit: {
      acceptedEpisodes: accepted.length,
      rejectedEpisodes,
      status:
        source.length === 0
          ? "NO_DATA"
          : rejectedEpisodes === 0
            ? "PASS"
            : "PARTIAL",
    },
    sample: {
      resolvedEpisodes: accepted.length,
      sampledTouches,
      validWalkForwardWindows: validWindows.length,
      minimumResolvedForStability: MIN_RESOLVED,
      minimumTouchesForStability: MIN_TOUCHES,
    },
    walkForward: {
      trainEpisodes: Math.min(MIN_TRAIN, accepted.length),
      validationEpisodes: Math.max(0, accepted.length - MIN_TRAIN),
      windows,
      medianWindowReturnPct: round(medianWindowReturn),
      worstWindowReturnPct: round(worstWindowReturn),
      positiveWindowRate: round(positiveWindowRate),
    },
    perturbation: {
      method: "7D_MAX_ADVERSE_EXCURSION_PROXY",
      currentPullbackPct: round(currentPullback, 2),
      cases: perturbationCases,
      fragile: perturbationFragile,
    },
    execution: {
      spreadP95Bps: round(execution.spreadP95Bps),
      entryImpactP95Bps: round(execution.entryImpactP95Bps),
      exitImpactP95Bps: round(execution.exitImpactP95Bps),
      stressedExitImpactBps: round(execution.stressedExitImpactBps),
      roundTripFeeBps: round(execution.roundTripFeeBps),
      knownRoundTripCostBps: round(execution.knownRoundTripCostBps),
      feesKnown: execution.feesKnown,
    },
    regime: {
      marketState: args.marketState ?? null,
      pilotState: args.pilotState ?? null,
      currentCompatible,
      historicalRegimeStratificationAvailable: false,
    },
    limitations: [
      "Walk-forward uses timestamped forward outcome episodes, not reconstructed candles.",
      "Sampled limit touches are not confirmed exchange fills.",
      "Perturbation uses seven-day maximum adverse excursion as a touch proxy.",
      "Known execution cost uses current Kraken p95 entry/exit impact; fees remain excluded unless explicitly present in eligibility data.",
      "Historical regime labels are not stored on outcome episodes yet, so regime-stratified certification remains unavailable.",
      "Certification is shadow-only and cannot change qualification, score, order size, or the production reference limit.",
    ],
  };
}
