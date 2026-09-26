import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

export type OutcomeHorizon = "1H" | "4H" | "1D" | "3D" | "7D";

export interface OutcomeEvaluation {
  horizon: OutcomeHorizon;
  dueAt: string;
  evaluatedAt: string | null;
  priceUsd: number | null;
  returnPct: number | null;
}

export interface DecisionOutcomeRecord {
  outcomeId: string;
  symbol: string;
  generatedAt: string;
  action: string;
  assetState: string;
  referencePriceUsd: number;
  opportunityScore: number | null;
  researchScore: number;
  evidenceQuality: number;
  thesisId: string;
  strategyTag?: string;
  strategyStatus?: string;
  recommendedPullbackPct?: number | null;
  maxFavorablePct: number;
  maxAdversePct: number;
  evaluations: OutcomeEvaluation[];
}

interface OutcomeFile {
  version: "1.0";
  updatedAt: string;
  records: DecisionOutcomeRecord[];
}

interface SnapshotLike {
  asOf: string;
  rankedAssets: Array<{
    symbol: string;
    strategy21?: {
      researchIntegrity?: {
        outcomeSeed?: {
          outcomeId?: string;
          symbol?: string;
          generatedAt?: string;
          action?: string;
          assetState?: string;
          referencePriceUsd?: number | null;
          opportunityScore?: number | null;
          researchScore?: number;
          evidenceQuality?: number;
          thesisId?: string;
          strategyTag?: string;
          strategyStatus?: string;
          recommendedPullbackPct?: number | null;
          horizons?: Array<{ horizon: OutcomeHorizon; dueAt: string }>;
        };
      };
    };
  }>;
}

const emptyFile = (): OutcomeFile => ({
  version: "1.0",
  updatedAt: new Date(0).toISOString(),
  records: [],
});

async function loadFile(path: string): Promise<OutcomeFile> {
  try {
    const parsed = JSON.parse(await readFile(path, "utf8"));
    if (parsed?.version !== "1.0" || !Array.isArray(parsed?.records)) return emptyFile();
    return {
      version: "1.0",
      updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : new Date(0).toISOString(),
      records: parsed.records,
    };
  } catch {
    return emptyFile();
  }
}

async function saveFile(path: string, data: OutcomeFile): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  const tmp = `${path}.tmp`;
  await writeFile(tmp, JSON.stringify(data, null, 2), "utf8");
  await rename(tmp, path);
}

function finitePositive(value: unknown): number | null {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
}

function returnPct(reference: number, current: number): number {
  return ((current / reference) - 1) * 100;
}

function seedToRecord(seed: NonNullable<NonNullable<NonNullable<SnapshotLike["rankedAssets"][number]["strategy21"]>["researchIntegrity"]>["outcomeSeed"]>): DecisionOutcomeRecord | null {
  const referencePriceUsd = finitePositive(seed.referencePriceUsd);
  if (!seed.outcomeId || !seed.symbol || !seed.generatedAt || !referencePriceUsd || !seed.thesisId) return null;
  const horizons = Array.isArray(seed.horizons) ? seed.horizons : [];
  return {
    outcomeId: seed.outcomeId,
    symbol: seed.symbol.toUpperCase(),
    generatedAt: seed.generatedAt,
    action: String(seed.action ?? "UNKNOWN"),
    assetState: String(seed.assetState ?? "UNKNOWN"),
    referencePriceUsd,
    opportunityScore: Number.isFinite(Number(seed.opportunityScore)) ? Number(seed.opportunityScore) : null,
    researchScore: Number.isFinite(Number(seed.researchScore)) ? Number(seed.researchScore) : 0,
    evidenceQuality: Number.isFinite(Number(seed.evidenceQuality)) ? Number(seed.evidenceQuality) : 0,
    thesisId: seed.thesisId,
    ...(seed.strategyTag ? { strategyTag: seed.strategyTag } : {}),
    ...(seed.strategyStatus ? { strategyStatus: seed.strategyStatus } : {}),
    ...(seed.recommendedPullbackPct != null ? { recommendedPullbackPct: Number(seed.recommendedPullbackPct) } : {}),
    maxFavorablePct: 0,
    maxAdversePct: 0,
    evaluations: horizons.map((item) => ({
      horizon: item.horizon,
      dueAt: item.dueAt,
      evaluatedAt: null,
      priceUsd: null,
      returnPct: null,
    })),
  };
}

export async function updateOutcomeMemory(path: string, snapshot: SnapshotLike): Promise<OutcomeFile> {
  const data = await loadFile(path);
  const asOfMs = Date.parse(snapshot.asOf);
  if (!Number.isFinite(asOfMs)) return data;

  const currentPrices = new Map<string, number>();
  for (const asset of snapshot.rankedAssets ?? []) {
    const seed = asset.strategy21?.researchIntegrity?.outcomeSeed;
    const price = finitePositive(seed?.referencePriceUsd);
    if (price) currentPrices.set(String(asset.symbol ?? seed?.symbol ?? "").toUpperCase(), price);
  }

  for (const record of data.records) {
    const current = currentPrices.get(record.symbol);
    if (!current) continue;
    const generatedMs = Date.parse(record.generatedAt);
    const ageMs = asOfMs - generatedMs;
    if (!Number.isFinite(generatedMs) || ageMs < 0) continue;
    const currentReturn = returnPct(record.referencePriceUsd, current);
    if (ageMs <= 7 * 24 * 60 * 60 * 1000) {
      record.maxFavorablePct = Math.max(record.maxFavorablePct, currentReturn);
      record.maxAdversePct = Math.min(record.maxAdversePct, currentReturn);
    }
    for (const evaluation of record.evaluations) {
      if (evaluation.evaluatedAt) continue;
      if (Date.parse(evaluation.dueAt) > asOfMs) continue;
      evaluation.evaluatedAt = snapshot.asOf;
      evaluation.priceUsd = current;
      evaluation.returnPct = currentReturn;
    }
  }

  const known = new Set(data.records.map((record) => record.outcomeId));
  for (const asset of snapshot.rankedAssets ?? []) {
    const seed = asset.strategy21?.researchIntegrity?.outcomeSeed;
    if (!seed?.outcomeId || known.has(seed.outcomeId)) continue;
    const record = seedToRecord(seed);
    if (!record) continue;
    data.records.push(record);
    known.add(record.outcomeId);
  }

  data.records.sort((a, b) => Date.parse(a.generatedAt) - Date.parse(b.generatedAt));
  if (data.records.length > 5000) data.records = data.records.slice(-5000);
  data.updatedAt = snapshot.asOf;
  await saveFile(path, data);
  return data;
}

export async function readOutcomeMemory(path: string, symbol?: string): Promise<OutcomeFile> {
  const data = await loadFile(path);
  if (!symbol) return data;
  const normalized = symbol.toUpperCase();
  return { ...data, records: data.records.filter((record) => record.symbol === normalized) };
}

export function summarizeOutcomeMemory(records: DecisionOutcomeRecord[]) {
  const horizons: OutcomeHorizon[] = ["1H", "4H", "1D", "3D", "7D"];
  const byHorizon = Object.fromEntries(horizons.map((horizon) => {
    const values = records
      .flatMap((record) => record.evaluations)
      .filter((evaluation) => evaluation.horizon === horizon && evaluation.returnPct != null)
      .map((evaluation) => evaluation.returnPct as number);
    const count = values.length;
    return [horizon, {
      count,
      averageReturnPct: count ? values.reduce((sum, value) => sum + value, 0) / count : null,
      positiveRate: count ? values.filter((value) => value > 0).length / count : null,
    }];
  }));
  const resolvedRecords = records.filter((record) => record.evaluations.some((evaluation) => evaluation.returnPct != null));
  return {
    recordCount: records.length,
    resolvedRecordCount: resolvedRecords.length,
    byHorizon,
    averageMaxFavorablePct: resolvedRecords.length
      ? resolvedRecords.reduce((sum, record) => sum + record.maxFavorablePct, 0) / resolvedRecords.length
      : null,
    averageMaxAdversePct: resolvedRecords.length
      ? resolvedRecords.reduce((sum, record) => sum + record.maxAdversePct, 0) / resolvedRecords.length
      : null,
  };
}
