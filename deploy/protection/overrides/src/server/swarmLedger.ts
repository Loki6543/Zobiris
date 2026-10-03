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
