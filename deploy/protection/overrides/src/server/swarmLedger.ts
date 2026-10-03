import { appendFile, mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import type { SwarmShadow } from "../strategy21/swarm.js";

export type SwarmOutcomeHorizon = "30m" | "2h" | "8h" | "12h" | "1d" | "3d" | "7d";

export type SwarmOutcomeEvaluation = {
  horizon: SwarmOutcomeHorizon;
  dueAt: string;
  status: "PENDING" | "RESOLVED" | "EXPIRED";
  evaluatedAt: string | null;
  priceUsd: number | null;
  returnPct: number | null;
};

export type SwarmLedgerRecord = {
  id: string;
  generatedAt: string;
  symbol: string;
  referencePriceUsd: number;
  swarm: SwarmShadow;
  evaluations: SwarmOutcomeEvaluation[];
};

export type SwarmLedgerFile = {
  version: "swarm-ledger-v1";
  updatedAt: string | null;
  archivedRecordCount: number;
  records: SwarmLedgerRecord[];
};

const HORIZON_MS: Record<SwarmOutcomeHorizon, number> = {
  "30m": 30 * 60_000,
  "2h": 2 * 3_600_000,
  "8h": 8 * 3_600_000,
  "12h": 12 * 3_600_000,
  "1d": 24 * 3_600_000,
  "3d": 3 * 24 * 3_600_000,
  "7d": 7 * 24 * 3_600_000,
};
const HORIZONS = Object.keys(HORIZON_MS) as SwarmOutcomeHorizon[];
const MAX_RECORDS = 5000;
const MIN_EPISODE_GAP_MS = 2 * 3_600_000;

const queues = new Map<string, Promise<unknown>>();

const emptyFile = (): SwarmLedgerFile => ({
  version: "swarm-ledger-v1",
  updatedAt: null,
  archivedRecordCount: 0,
  records: [],
});

async function loadFile(path: string): Promise<SwarmLedgerFile> {
  try {
    const raw = JSON.parse(await readFile(path, "utf8"));
    if (raw?.version !== "swarm-ledger-v1" || !Array.isArray(raw.records))
      throw new Error("Invalid swarm ledger format");
    return {
      version: "swarm-ledger-v1",
      updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : null,
      archivedRecordCount: Number(raw.archivedRecordCount ?? 0) || 0,
      records: raw.records,
    };
  } catch (error) {
    if ((error as NodeJS.ErrnoException)?.code === "ENOENT") return emptyFile();
    throw error;
  }
}

async function saveFile(path: string, data: SwarmLedgerFile): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  const tmp = path + ".tmp";
  await writeFile(tmp, JSON.stringify(data), "utf8");
  await rename(tmp, path);
}

function returnPct(reference: number, price: number) {
  return ((price / reference) - 1) * 100;
}

function evaluations(generatedAt: string): SwarmOutcomeEvaluation[] {
  const start = Date.parse(generatedAt);
  return HORIZONS.map((horizon) => ({
    horizon,
    dueAt: new Date(start + HORIZON_MS[horizon]).toISOString(),
    status: "PENDING",
    evaluatedAt: null,
    priceUsd: null,
    returnPct: null,
  }));
}

export type SwarmLedgerAsset = {
  symbol: string;
  price: number | null;
  swarmShadow: SwarmShadow;
};

async function updateFile(
  path: string,
  asOf: string,
  assets: SwarmLedgerAsset[],
): Promise<SwarmLedgerFile> {
  const data = await loadFile(path);
  const asOfMs = Date.parse(asOf);
  if (!Number.isFinite(asOfMs)) return data;

  const prices = new Map<string, number>();
  for (const asset of assets) {
    const symbol = String(asset.symbol ?? "").toUpperCase();
    if (symbol && typeof asset.price === "number" && Number.isFinite(asset.price) && asset.price > 0)
      prices.set(symbol, asset.price);
  }

  for (const record of data.records) {
    const price = prices.get(record.symbol);
    for (const evaluation of record.evaluations) {
      if (evaluation.status !== "PENDING") continue;
      const due = Date.parse(evaluation.dueAt);
      const horizonMs = HORIZON_MS[evaluation.horizon];
      const grace = Math.max(15 * 60_000, horizonMs * 0.25);
      if (!Number.isFinite(due) || asOfMs < due) continue;
      if (price != null && asOfMs <= due + grace) {
        evaluation.status = "RESOLVED";
        evaluation.evaluatedAt = asOf;
        evaluation.priceUsd = price;
        evaluation.returnPct = returnPct(record.referencePriceUsd, price);
      } else if (asOfMs > due + grace) {
        evaluation.status = "EXPIRED";
      }
    }
  }

  for (const asset of assets) {
    const symbol = String(asset.symbol ?? "").toUpperCase();
    const price = asset.price;
    if (!symbol || price == null || !Number.isFinite(price) || price <= 0) continue;
    if (asset.swarmShadow?.version !== "ZOBIRIS_SWARM_V1") continue;
    const latest = [...data.records]
      .reverse()
      .find((record) => record.symbol === symbol);
    if (
      latest &&
      Number.isFinite(Date.parse(latest.generatedAt)) &&
      asOfMs - Date.parse(latest.generatedAt) < MIN_EPISODE_GAP_MS
    )
      continue;
    data.records.push({
      id: asOf + ":" + symbol,
      generatedAt: asOf,
      symbol,
      referencePriceUsd: price,
      swarm: asset.swarmShadow,
      evaluations: evaluations(asOf),
    });
  }

  data.records.sort((a, b) => Date.parse(a.generatedAt) - Date.parse(b.generatedAt));
  if (data.records.length > MAX_RECORDS) {
    const overflow = data.records.slice(0, -MAX_RECORDS);
    await mkdir(dirname(path), { recursive: true });
    await appendFile(
      path + ".archive.jsonl",
      overflow.map((record) => JSON.stringify(record)).join("\n") + "\n",
      "utf8",
    );
    data.archivedRecordCount += overflow.length;
    data.records = data.records.slice(-MAX_RECORDS);
  }

  data.updatedAt = asOf;
  await saveFile(path, data);
  return data;
}

export async function updateSwarmLedger(
  path: string,
  asOf: string,
  assets: SwarmLedgerAsset[],
): Promise<SwarmLedgerFile> {
  const next = (queues.get(path) ?? Promise.resolve())
    .catch(() => undefined)
    .then(() => updateFile(path, asOf, assets));
  queues.set(path, next);
  try {
    return await next;
  } finally {
    if (queues.get(path) === next) queues.delete(path);
  }
}

export async function readSwarmLedger(
  path: string,
  options: { symbol?: string; limit?: number } = {},
): Promise<SwarmLedgerFile> {
  const data = await loadFile(path);
  const symbol = options.symbol?.toUpperCase();
  const limit = Math.max(1, Math.min(500, Number(options.limit ?? 100) || 100));
  const records = data.records
    .filter((record) => !symbol || record.symbol === symbol)
    .slice(-limit)
    .reverse();
  return { ...data, records };
}


export type SwarmCalibrationMetric = {
  sampleSize: number;
  averageReturnPct: number | null;
  positiveReturnRatePct: number | null;
  pearsonScoreReturn: number | null;
  highScoreSampleSize: number;
  highScoreAverageReturnPct: number | null;
  lowScoreSampleSize: number;
  lowScoreAverageReturnPct: number | null;
  highMinusLowReturnPct: number | null;
};

export type SwarmAttributionStatus =
  | "COLLECTING"
  | "POSITIVE_EDGE"
  | "NEGATIVE_EDGE"
  | "REDUNDANT"
  | "MIXED";

export type SwarmWeightReview =
  | "NO_CHANGE_COLLECTING"
  | "REVIEW_FOR_MORE_WEIGHT"
  | "REVIEW_FOR_LESS_WEIGHT"
  | "REVIEW_FOR_REDUNDANCY"
  | "KEEP_OBSERVING";

export type SwarmSpecialistAttribution = {
  specialistId: string;
  status: SwarmAttributionStatus;
  weightReview: SwarmWeightReview;
  automaticWeightChange: false;
  sampleSize: number;
  independentEpisodeCount: number;
  distinctUtcDays: number;
  resolvedUniverseSampleSize: number;
  knownCoveragePct: number;
  rawScoreReturnCorrelation: number | null;
  shrunkScoreReturnCorrelation: number | null;
  consensusWithoutSpecialistCorrelation: number | null;
  specialistConsensusWithoutCorrelation: number | null;
  partialCorrelationControllingOtherSpecialists: number | null;
  shrunkPartialCorrelation: number | null;
  marginalContributionReturnCorrelation: number | null;
  directionalSampleSize: number;
  directionalHitRatePct: number | null;
  consensusWithoutDirectionalHitRatePct: number | null;
  directionalLiftPctPoints: number | null;
  highMinusLowReturnPct: number | null;
  highScoreSampleSize: number;
  lowScoreSampleSize: number;
  evidenceNote: string;
};

export type SwarmCalibrationSummary = {
  horizon: SwarmOutcomeHorizon;
  symbol: string | null;
  status: "COLLECTING" | "EVALUABLE";
  minimumEvaluableSamples: 30;
  minimumIndependentEpisodes: 10;
  minimumDistinctUtcDays: 3;
  independentEpisodeCount: number;
  distinctUtcDays: number;
  promotionAuthority: "NONE_SHADOW_ONLY";
  returnBasis: "REFERENCE_PRICE_MARK_TO_MARKET_NOT_EXECUTED_PNL";
  highScoreThreshold: 60;
  lowScoreThreshold: 40;
  sampleSize: number;
  consensus: SwarmCalibrationMetric;
  specialists: Record<string, SwarmCalibrationMetric>;
  attribution: Record<string, SwarmSpecialistAttribution>;
};

export type SwarmCrossHorizonAttribution = {
  specialistId: string;
  evaluableHorizons: number;
  collectingHorizons: number;
  positiveEdgeHorizons: number;
  negativeEdgeHorizons: number;
  redundantHorizons: number;
  mixedHorizons: number;
  weightedShrunkPartialCorrelation: number | null;
  totalAttributedSamples: number;
  status:
    | "COLLECTING"
    | "CONSISTENT_POSITIVE"
    | "CONSISTENT_NEGATIVE"
    | "MOSTLY_REDUNDANT"
    | "MIXED";
  weightReview: SwarmWeightReview;
  automaticWeightChange: false;
};

export type SwarmAttributionReport = {
  version: "SWARM_ATTRIBUTION_V1";
  symbol: string | null;
  authority: "SHADOW_ONLY_NO_AUTOMATIC_WEIGHT_CHANGES";
  minimumEvaluableSamplesPerHorizon: 30;
  minimumIndependentEpisodesPerHorizon: 10;
  minimumDistinctUtcDaysPerHorizon: 3;
  shrinkagePriorSamples: 50;
  horizons: Record<SwarmOutcomeHorizon, SwarmCalibrationSummary>;
  specialists: Record<string, SwarmCrossHorizonAttribution>;
};

function average(values: number[]): number | null {
  return values.length
    ? values.reduce((sum, value) => sum + value, 0) / values.length
    : null;
}

function pearson(pairs: Array<{ score: number; value: number }>): number | null {
  if (pairs.length < 3) return null;
  const meanScore = average(pairs.map((pair) => pair.score));
  const meanValue = average(pairs.map((pair) => pair.value));
  if (meanScore == null || meanValue == null) return null;
  let covariance = 0;
  let scoreVariance = 0;
  let valueVariance = 0;
  for (const pair of pairs) {
    const scoreDelta = pair.score - meanScore;
    const valueDelta = pair.value - meanValue;
    covariance += scoreDelta * valueDelta;
    scoreVariance += scoreDelta ** 2;
    valueVariance += valueDelta ** 2;
  }
  if (scoreVariance <= 0 || valueVariance <= 0) return null;
  return covariance / Math.sqrt(scoreVariance * valueVariance);
}

function residualize(
  values: Array<{ target: number; control: number }>,
): number[] | null {
  if (values.length < 3) return null;
  const controlMean = average(values.map((row) => row.control));
  const targetMean = average(values.map((row) => row.target));
  if (controlMean == null || targetMean == null) return null;
  let numerator = 0;
  let denominator = 0;
  for (const row of values) {
    numerator += (row.control - controlMean) * (row.target - targetMean);
    denominator += (row.control - controlMean) ** 2;
  }
  const beta = denominator > 0 ? numerator / denominator : 0;
  const alpha = targetMean - beta * controlMean;
  return values.map((row) => row.target - (alpha + beta * row.control));
}

function partialCorrelation(
  rows: Array<{ specialist: number; outcome: number; control: number }>,
): number | null {
  if (rows.length < 5) return null;
  const specialistResidual = residualize(
    rows.map((row) => ({ target: row.specialist, control: row.control })),
  );
  const outcomeResidual = residualize(
    rows.map((row) => ({ target: row.outcome, control: row.control })),
  );
  if (!specialistResidual || !outcomeResidual) return null;
  return pearson(
    specialistResidual.map((score, index) => ({
      score,
      value: outcomeResidual[index]!,
    })),
  );
}

function shrinkCorrelation(value: number | null, sampleSize: number): number | null {
  if (value == null || !Number.isFinite(value)) return null;
  const priorSamples = 50;
  return value * (sampleSize / (sampleSize + priorSamples));
}

function directionalHitRate(
  rows: Array<{ score: number; value: number }>,
): { sampleSize: number; hitRatePct: number | null } {
  const directional = rows.filter(
    (row) => row.score !== 50 && row.value !== 0,
  );
  if (!directional.length) return { sampleSize: 0, hitRatePct: null };
  const hits = directional.filter(
    (row) => (row.score > 50) === (row.value > 0),
  ).length;
  return {
    sampleSize: directional.length,
    hitRatePct: (hits / directional.length) * 100,
  };
}

function calibrationMetric(
  pairs: Array<{ score: number; value: number }>,
): SwarmCalibrationMetric {
  const returns = pairs.map((pair) => pair.value);
  const high = pairs.filter((pair) => pair.score >= 60).map((pair) => pair.value);
  const low = pairs.filter((pair) => pair.score <= 40).map((pair) => pair.value);
  const highAverage = average(high);
  const lowAverage = average(low);
  return {
    sampleSize: pairs.length,
    averageReturnPct: average(returns),
    positiveReturnRatePct: returns.length
      ? (returns.filter((value) => value > 0).length / returns.length) * 100
      : null,
    pearsonScoreReturn: pearson(pairs),
    highScoreSampleSize: high.length,
    highScoreAverageReturnPct: highAverage,
    lowScoreSampleSize: low.length,
    lowScoreAverageReturnPct: lowAverage,
    highMinusLowReturnPct:
      highAverage != null && lowAverage != null ? highAverage - lowAverage : null,
  };
}

function normalizedSpecialistScore(score: unknown): number | null {
  if (typeof score !== "number" || !Number.isFinite(score)) return null;
  if (score >= 0 && score <= 1) return score * 100;
  if (score >= 0 && score <= 100) return score;
  return null;
}

function knownSpecialistRows(record: SwarmLedgerRecord): Array<{
  id: string;
  score: number;
  weight: number;
}> {
  const specialists =
    record.swarm?.specialists as Record<
      string,
      { state?: string; score?: unknown; effectiveWeight?: unknown }
    > | undefined;
  if (!specialists) return [];
  return Object.entries(specialists).flatMap(([id, specialist]) => {
    if (specialist?.state !== "KNOWN") return [];
    const score = normalizedSpecialistScore(specialist.score);
    const weight =
      typeof specialist.effectiveWeight === "number" &&
      Number.isFinite(specialist.effectiveWeight) &&
      specialist.effectiveWeight > 0
        ? specialist.effectiveWeight
        : null;
    return score == null || weight == null ? [] : [{ id, score, weight }];
  });
}

function weightedEvidenceScore(
  rows: Array<{ score: number; weight: number }>,
): number | null {
  const totalWeight = rows.reduce((sum, row) => sum + row.weight, 0);
  if (totalWeight <= 0) return null;
  return (
    rows.reduce((sum, row) => sum + row.score * row.weight, 0) / totalWeight
  );
}

function classifyAttribution(
  sampleSize: number,
  independentEpisodeCount: number,
  distinctUtcDays: number,
  shrunkPartial: number | null,
  scoreOtherCorrelation: number | null,
  directionalLift: number | null,
): { status: SwarmAttributionStatus; weightReview: SwarmWeightReview } {
  if (
    sampleSize < 30 ||
    independentEpisodeCount < 10 ||
    distinctUtcDays < 3
  )
    return { status: "COLLECTING", weightReview: "NO_CHANGE_COLLECTING" };

  const lift = directionalLift ?? 0;
  if (
    scoreOtherCorrelation != null &&
    Math.abs(scoreOtherCorrelation) >= 0.85 &&
    (shrunkPartial == null || Math.abs(shrunkPartial) < 0.04) &&
    Math.abs(lift) < 2
  )
    return { status: "REDUNDANT", weightReview: "REVIEW_FOR_REDUNDANCY" };

  if (shrunkPartial != null && shrunkPartial >= 0.08 && lift >= 2)
    return { status: "POSITIVE_EDGE", weightReview: "REVIEW_FOR_MORE_WEIGHT" };

  if (shrunkPartial != null && shrunkPartial <= -0.08 && lift <= -2)
    return { status: "NEGATIVE_EDGE", weightReview: "REVIEW_FOR_LESS_WEIGHT" };

  return { status: "MIXED", weightReview: "KEEP_OBSERVING" };
}

function specialistAttribution(
  id: string,
  rows: Array<{ record: SwarmLedgerRecord; returnPct: number }>,
): SwarmSpecialistAttribution {
  const attributed = rows.flatMap(({ record, returnPct }) => {
    const specialists = knownSpecialistRows(record);
    const specialist = specialists.find((row) => row.id === id);
    if (!specialist) return [];
    const others = specialists.filter((row) => row.id !== id);
    const consensusWithout = weightedEvidenceScore(others);
    const fullEvidence = weightedEvidenceScore(specialists);
    if (consensusWithout == null || fullEvidence == null) return [];
    return [{
      specialist: specialist.score,
      outcome: returnPct,
      control: consensusWithout,
      fullEvidence,
      contribution: fullEvidence - consensusWithout,
    }];
  });

  const rawPairs = attributed.map((row) => ({
    score: row.specialist,
    value: row.outcome,
  }));
  const controlPairs = attributed.map((row) => ({
    score: row.control,
    value: row.outcome,
  }));
  const specialistControlPairs = attributed.map((row) => ({
    score: row.specialist,
    value: row.control,
  }));
  const contributionPairs = attributed.map((row) => ({
    score: row.contribution,
    value: row.outcome,
  }));

  const rawCorrelation = pearson(rawPairs);
  const partial = partialCorrelation(attributed);
  const shrunkRaw = shrinkCorrelation(rawCorrelation, attributed.length);
  const shrunkPartial = shrinkCorrelation(partial, attributed.length);
  const specialistDirectional = directionalHitRate(rawPairs);
  const controlDirectional = directionalHitRate(controlPairs);
  const directionalLift =
    specialistDirectional.hitRatePct != null &&
    controlDirectional.hitRatePct != null
      ? specialistDirectional.hitRatePct - controlDirectional.hitRatePct
      : null;
  const metric = calibrationMetric(rawPairs);
  const scoreOtherCorrelation = pearson(specialistControlPairs);
  const independentEpisodeCount = new Set(
    rows.flatMap(({ record }) =>
      knownSpecialistRows(record).some((row) => row.id === id)
        ? [record.generatedAt]
        : [],
    ),
  ).size;
  const distinctUtcDays = new Set(
    rows.flatMap(({ record }) =>
      knownSpecialistRows(record).some((row) => row.id === id)
        ? [record.generatedAt.slice(0, 10)]
        : [],
    ),
  ).size;
  const classified = classifyAttribution(
    attributed.length,
    independentEpisodeCount,
    distinctUtcDays,
    shrunkPartial,
    scoreOtherCorrelation,
    directionalLift,
  );

  return {
    specialistId: id,
    status: classified.status,
    weightReview: classified.weightReview,
    automaticWeightChange: false,
    sampleSize: attributed.length,
    independentEpisodeCount,
    distinctUtcDays,
    resolvedUniverseSampleSize: rows.length,
    knownCoveragePct: rows.length ? (attributed.length / rows.length) * 100 : 0,
    rawScoreReturnCorrelation: rawCorrelation,
    shrunkScoreReturnCorrelation: shrunkRaw,
    consensusWithoutSpecialistCorrelation: pearson(controlPairs),
    specialistConsensusWithoutCorrelation: scoreOtherCorrelation,
    partialCorrelationControllingOtherSpecialists: partial,
    shrunkPartialCorrelation: shrunkPartial,
    marginalContributionReturnCorrelation: pearson(contributionPairs),
    directionalSampleSize: specialistDirectional.sampleSize,
    directionalHitRatePct: specialistDirectional.hitRatePct,
    consensusWithoutDirectionalHitRatePct: controlDirectional.hitRatePct,
    directionalLiftPctPoints: directionalLift,
    highMinusLowReturnPct: metric.highMinusLowReturnPct,
    highScoreSampleSize: metric.highScoreSampleSize,
    lowScoreSampleSize: metric.lowScoreSampleSize,
    evidenceNote:
      classified.status === "COLLECTING"
        ? "Collecting: requires at least 30 resolved outcomes, 10 distinct refresh episodes, and 3 distinct UTC days at this horizon."
        : "Attribution controls for the weighted score of all other known specialists; correlations are shrunk toward zero with a 50-sample prior.",
  };
}

export async function summarizeSwarmCalibration(
  path: string,
  options: {
    horizon: SwarmOutcomeHorizon;
    symbol?: string;
  },
): Promise<SwarmCalibrationSummary> {
  const data = await loadFile(path);
  const symbol = options.symbol?.toUpperCase() ?? null;
  const rows = data.records.flatMap((record) => {
    if (symbol && record.symbol !== symbol) return [];
    const evaluation = record.evaluations.find(
      (item) =>
        item.horizon === options.horizon &&
        item.status === "RESOLVED" &&
        typeof item.returnPct === "number" &&
        Number.isFinite(item.returnPct),
    );
    if (!evaluation || evaluation.returnPct == null) return [];
    return [{ record, returnPct: evaluation.returnPct }];
  });

  const consensusPairs = rows.flatMap(({ record, returnPct }) => {
    const score = record.swarm?.consensus?.score;
    return typeof score === "number" && Number.isFinite(score)
      ? [{ score, value: returnPct }]
      : [];
  });

  const specialistIds = new Set<string>();
  for (const { record } of rows)
    for (const key of Object.keys(record.swarm?.specialists ?? {}))
      specialistIds.add(key);

  const specialists: Record<string, SwarmCalibrationMetric> = {};
  const attribution: Record<string, SwarmSpecialistAttribution> = {};
  for (const id of specialistIds) {
    const pairs = rows.flatMap(({ record, returnPct }) => {
      const specialist = (
        record.swarm?.specialists as Record<string, any> | undefined
      )?.[id];
      if (!specialist || specialist.state !== "KNOWN") return [];
      const score = normalizedSpecialistScore(specialist.score);
      return score == null ? [] : [{ score, value: returnPct }];
    });
    specialists[id] = calibrationMetric(pairs);
    attribution[id] = specialistAttribution(id, rows);
  }

  const independentEpisodeCount = new Set(
    rows.map(({ record }) => record.generatedAt),
  ).size;
  const distinctUtcDays = new Set(
    rows.map(({ record }) => record.generatedAt.slice(0, 10)),
  ).size;
  const evaluable =
    rows.length >= 30 &&
    independentEpisodeCount >= 10 &&
    distinctUtcDays >= 3;

  return {
    horizon: options.horizon,
    symbol,
    status: evaluable ? "EVALUABLE" : "COLLECTING",
    minimumEvaluableSamples: 30,
    minimumIndependentEpisodes: 10,
    minimumDistinctUtcDays: 3,
    independentEpisodeCount,
    distinctUtcDays,
    promotionAuthority: "NONE_SHADOW_ONLY",
    returnBasis: "REFERENCE_PRICE_MARK_TO_MARKET_NOT_EXECUTED_PNL",
    highScoreThreshold: 60,
    lowScoreThreshold: 40,
    sampleSize: rows.length,
    consensus: calibrationMetric(consensusPairs),
    specialists,
    attribution,
  };
}

export async function summarizeSwarmAttribution(
  path: string,
  options: { symbol?: string } = {},
): Promise<SwarmAttributionReport> {
  const horizonEntries = await Promise.all(
    HORIZONS.map(async (horizon) => [
      horizon,
      await summarizeSwarmCalibration(path, {
        horizon,
        symbol: options.symbol,
      }),
    ] as const),
  );
  const horizons = Object.fromEntries(horizonEntries) as Record<
    SwarmOutcomeHorizon,
    SwarmCalibrationSummary
  >;

  const specialistIds = new Set<string>();
  for (const summary of Object.values(horizons))
    for (const id of Object.keys(summary.attribution))
      specialistIds.add(id);

  const specialists: Record<string, SwarmCrossHorizonAttribution> = {};
  for (const id of specialistIds) {
    const metrics = HORIZONS.map((horizon) => horizons[horizon].attribution[id])
      .filter((metric): metric is SwarmSpecialistAttribution => Boolean(metric));
    const evaluable = metrics.filter((metric) => metric.status !== "COLLECTING");
    const weighted = evaluable.filter(
      (metric) => metric.shrunkPartialCorrelation != null,
    );
    const weightTotal = weighted.reduce(
      (sum, metric) => sum + Math.sqrt(metric.sampleSize),
      0,
    );
    const weightedShrunkPartialCorrelation =
      weightTotal > 0
        ? weighted.reduce(
            (sum, metric) =>
              sum +
              (metric.shrunkPartialCorrelation ?? 0) *
                Math.sqrt(metric.sampleSize),
            0,
          ) / weightTotal
        : null;
    const positiveEdgeHorizons = evaluable.filter(
      (metric) => metric.status === "POSITIVE_EDGE",
    ).length;
    const negativeEdgeHorizons = evaluable.filter(
      (metric) => metric.status === "NEGATIVE_EDGE",
    ).length;
    const redundantHorizons = evaluable.filter(
      (metric) => metric.status === "REDUNDANT",
    ).length;
    const mixedHorizons = evaluable.filter(
      (metric) => metric.status === "MIXED",
    ).length;

    let status: SwarmCrossHorizonAttribution["status"] = "COLLECTING";
    let weightReview: SwarmWeightReview = "NO_CHANGE_COLLECTING";
    if (evaluable.length > 0) {
      if (
        positiveEdgeHorizons >= 2 &&
        negativeEdgeHorizons === 0 &&
        (weightedShrunkPartialCorrelation ?? 0) > 0
      ) {
        status = "CONSISTENT_POSITIVE";
        weightReview = "REVIEW_FOR_MORE_WEIGHT";
      } else if (
        negativeEdgeHorizons >= 2 &&
        positiveEdgeHorizons === 0 &&
        (weightedShrunkPartialCorrelation ?? 0) < 0
      ) {
        status = "CONSISTENT_NEGATIVE";
        weightReview = "REVIEW_FOR_LESS_WEIGHT";
      } else if (
        redundantHorizons >= Math.max(2, Math.ceil(evaluable.length / 2))
      ) {
        status = "MOSTLY_REDUNDANT";
        weightReview = "REVIEW_FOR_REDUNDANCY";
      } else {
        status = "MIXED";
        weightReview = "KEEP_OBSERVING";
      }
    }

    specialists[id] = {
      specialistId: id,
      evaluableHorizons: evaluable.length,
      collectingHorizons: HORIZONS.length - evaluable.length,
      positiveEdgeHorizons,
      negativeEdgeHorizons,
      redundantHorizons,
      mixedHorizons,
      weightedShrunkPartialCorrelation,
      totalAttributedSamples: metrics.reduce(
        (sum, metric) => sum + metric.sampleSize,
        0,
      ),
      status,
      weightReview,
      automaticWeightChange: false,
    };
  }

  return {
    version: "SWARM_ATTRIBUTION_V1",
    symbol: options.symbol?.toUpperCase() ?? null,
    authority: "SHADOW_ONLY_NO_AUTOMATIC_WEIGHT_CHANGES",
    minimumEvaluableSamplesPerHorizon: 30,
    minimumIndependentEpisodesPerHorizon: 10,
    minimumDistinctUtcDaysPerHorizon: 3,
    shrinkagePriorSamples: 50,
    horizons,
    specialists,
  };
}
