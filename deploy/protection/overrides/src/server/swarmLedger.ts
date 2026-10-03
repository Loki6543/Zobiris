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

export type SwarmCalibrationSummary = {
  horizon: SwarmOutcomeHorizon;
  symbol: string | null;
  status: "COLLECTING" | "EVALUABLE";
  minimumEvaluableSamples: 30;
  promotionAuthority: "NONE_SHADOW_ONLY";
  returnBasis: "REFERENCE_PRICE_MARK_TO_MARKET_NOT_EXECUTED_PNL";
  highScoreThreshold: 60;
  lowScoreThreshold: 40;
  sampleSize: number;
  consensus: SwarmCalibrationMetric;
  specialists: Record<string, SwarmCalibrationMetric>;
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
  for (const id of specialistIds) {
    const pairs = rows.flatMap(({ record, returnPct }) => {
      const specialist = (record.swarm?.specialists as Record<string, any> | undefined)?.[id];
      if (!specialist || specialist.state !== "KNOWN") return [];
      const score = normalizedSpecialistScore(specialist.score);
      return score == null ? [] : [{ score, value: returnPct }];
    });
    specialists[id] = calibrationMetric(pairs);
  }

  return {
    horizon: options.horizon,
    symbol,
    status: rows.length >= 30 ? "EVALUABLE" : "COLLECTING",
    minimumEvaluableSamples: 30,
    promotionAuthority: "NONE_SHADOW_ONLY",
    returnBasis: "REFERENCE_PRICE_MARK_TO_MARKET_NOT_EXECUTED_PNL",
    highScoreThreshold: 60,
    lowScoreThreshold: 40,
    sampleSize: rows.length,
    consensus: calibrationMetric(consensusPairs),
    specialists,
  };
}
