import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

const HYPERLIQUID_INFO_URL = "https://api.hyperliquid.xyz/info";
const MAX_RESPONSE_BYTES = 2 * 1024 * 1024;
const MIN_HISTORY_GAP_MS = 5 * 60_000;
const MAX_DELTA_LOOKBACK_MS = 6 * 60 * 60_000;
const HISTORY_RETENTION_MS = 72 * 60 * 60_000;
const MAX_HISTORY_RECORDS = 20_000;

export type HyperliquidCrowdingState =
  | "CROWDED_LONG"
  | "LONG_BIAS"
  | "BALANCED"
  | "SHORT_BIAS"
  | "CROWDED_SHORT";

export type HyperliquidFlowState =
  | "LEVERAGED_LONG_BUILD"
  | "LEVERAGED_SHORT_BUILD"
  | "SHORT_COVERING"
  | "LONG_FLUSH"
  | "NO_LARGE_FLOW_SIGNAL"
  | "DELTA_UNAVAILABLE";

export type HyperliquidPositioningSummary = {
  provider: "hyperliquid";
  provenance: "HYPERLIQUID_META_AND_ASSET_CTXS";
  authority: "SHADOW_ONLY_NO_TRADING_AUTHORITY";
  symbol: string;
  observedAt: string;
  markPx: number;
  oraclePx: number | null;
  prevDayPx: number | null;
  dayChangePct: number | null;
  fundingRate: number | null;
  fundingPercentile: number | null;
  premiumPct: number | null;
  premiumPercentile: number | null;
  openInterestUnits: number | null;
  openInterestUsd: number | null;
  dayNtlVolumeUsd: number | null;
  volumeToOpenInterest: number | null;
  previousObservedAt: string | null;
  priceChangeSincePriorPct: number | null;
  oiChangePct: number | null;
  oiAbsoluteMovePercentile: number | null;
  fundingChangeBps: number | null;
  crowdingState: HyperliquidCrowdingState;
  flowState: HyperliquidFlowState;
  confidence: number;
  whaleWalletEvidence: "UNKNOWN_PUBLIC_AGGREGATE_ONLY";
};

type HyperliquidHistoryFile = {
  version: "hyperliquid-positioning-v1";
  updatedAt: string | null;
  records: HyperliquidPositioningSummary[];
};

type ParsedContext = {
  symbol: string;
  markPx: number;
  oraclePx: number | null;
  prevDayPx: number | null;
  dayChangePct: number | null;
  fundingRate: number | null;
  premiumPct: number | null;
  openInterestUnits: number | null;
  openInterestUsd: number | null;
  dayNtlVolumeUsd: number | null;
  volumeToOpenInterest: number | null;
};

const queues = new Map<string, Promise<unknown>>();

const emptyHistory = (): HyperliquidHistoryFile => ({
  version: "hyperliquid-positioning-v1",
  updatedAt: null,
  records: [],
});

const finite = (value: unknown): number | null => {
  const n =
    typeof value === "number"
      ? value
      : typeof value === "string" && value.trim() !== ""
        ? Number(value)
        : Number.NaN;
  return Number.isFinite(n) ? n : null;
};

const pctChange = (from: number | null, to: number | null): number | null =>
  from != null && to != null && from > 0 ? ((to / from) - 1) * 100 : null;

function percentileRank(values: number[], value: number | null): number | null {
  if (value == null || !Number.isFinite(value) || values.length < 3) return null;
  const sorted = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (sorted.length < 3) return null;
  const less = sorted.filter((item) => item < value).length;
  const equal = sorted.filter((item) => item === value).length;
  const midpoint = less + Math.max(0, equal - 1) / 2;
  return Math.max(0, Math.min(1, midpoint / Math.max(1, sorted.length - 1)));
}

function classifyCrowding(
  fundingPercentile: number | null,
  premiumPercentile: number | null,
): HyperliquidCrowdingState {
  if (
    fundingPercentile != null &&
    premiumPercentile != null &&
    fundingPercentile >= 0.8 &&
    premiumPercentile >= 0.65
  )
    return "CROWDED_LONG";
  if (
    fundingPercentile != null &&
    premiumPercentile != null &&
    fundingPercentile <= 0.2 &&
    premiumPercentile <= 0.35
  )
    return "CROWDED_SHORT";
  if (fundingPercentile != null && fundingPercentile >= 0.7) return "LONG_BIAS";
  if (fundingPercentile != null && fundingPercentile <= 0.3) return "SHORT_BIAS";
  return "BALANCED";
}

function classifyFlow(
  oiChangePct: number | null,
  oiAbsoluteMovePercentile: number | null,
  dayChangePct: number | null,
): HyperliquidFlowState {
  if (oiChangePct == null || dayChangePct == null) return "DELTA_UNAVAILABLE";
  if (
    oiAbsoluteMovePercentile == null ||
    oiAbsoluteMovePercentile < 0.8 ||
    Math.abs(oiChangePct) < 1
  )
    return "NO_LARGE_FLOW_SIGNAL";
  if (oiChangePct > 0)
    return dayChangePct >= 0
      ? "LEVERAGED_LONG_BUILD"
      : "LEVERAGED_SHORT_BUILD";
  return dayChangePct >= 0 ? "SHORT_COVERING" : "LONG_FLUSH";
}

async function fetchHyperliquidJson(
  fetcher: typeof fetch,
  signal?: AbortSignal,
): Promise<unknown> {
  const response = await fetcher(HYPERLIQUID_INFO_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    redirect: "error",
    signal: signal ?? AbortSignal.timeout(8_000),
    body: JSON.stringify({ type: "metaAndAssetCtxs" }),
  });
  if (!response.ok) throw new Error("Hyperliquid positioning unavailable");
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("application/json"))
    throw new Error("Hyperliquid positioning response is not JSON");
  const length = Number(response.headers.get("content-length"));
  if (Number.isFinite(length) && length > MAX_RESPONSE_BYTES)
    throw new Error("Hyperliquid positioning response too large");
  if (!response.body) throw new Error("Hyperliquid positioning response empty");

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  try {
    while (true) {
      const part = await reader.read();
      if (part.done) break;
      bytes += part.value.byteLength;
      if (bytes > MAX_RESPONSE_BYTES)
        throw new Error("Hyperliquid positioning response too large");
      chunks.push(part.value);
    }
  } finally {
    await reader.cancel().catch(() => undefined);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

export function parseHyperliquidPositioning(payload: unknown): ParsedContext[] {
  if (!Array.isArray(payload) || payload.length < 2)
    throw new Error("Invalid Hyperliquid metaAndAssetCtxs payload");
  const meta = payload[0] as { universe?: unknown[] } | null;
  const contexts = payload[1];
  if (!meta || !Array.isArray(meta.universe) || !Array.isArray(contexts))
    throw new Error("Invalid Hyperliquid market context shape");
  if (contexts.length < meta.universe.length)
    throw new Error("Hyperliquid universe/context alignment incomplete");

  const rows: ParsedContext[] = [];
  for (let index = 0; index < meta.universe.length; index++) {
    const asset = meta.universe[index] as Record<string, unknown> | undefined;
    const context = contexts[index] as Record<string, unknown> | undefined;
    const symbol =
      typeof asset?.name === "string" ? asset.name.trim().toUpperCase() : "";
    if (!symbol || !context || asset?.isDelisted === true) continue;
    const markPx = finite(context.markPx);
    if (markPx == null || markPx <= 0) continue;
    const oraclePx = finite(context.oraclePx);
    const prevDayPx = finite(context.prevDayPx);
    const fundingRate = finite(context.funding);
    const premiumRaw = finite(context.premium);
    const openInterestUnits = finite(context.openInterest);
    const dayNtlVolumeUsd = finite(context.dayNtlVlm);
    const openInterestUsd =
      openInterestUnits != null && openInterestUnits >= 0
        ? openInterestUnits * markPx
        : null;
    rows.push({
      symbol,
      markPx,
      oraclePx: oraclePx != null && oraclePx > 0 ? oraclePx : null,
      prevDayPx: prevDayPx != null && prevDayPx > 0 ? prevDayPx : null,
      dayChangePct: pctChange(
        prevDayPx != null && prevDayPx > 0 ? prevDayPx : null,
        markPx,
      ),
      fundingRate,
      premiumPct: premiumRaw == null ? null : premiumRaw * 100,
      openInterestUnits,
      openInterestUsd,
      dayNtlVolumeUsd:
        dayNtlVolumeUsd != null && dayNtlVolumeUsd >= 0
          ? dayNtlVolumeUsd
          : null,
      volumeToOpenInterest:
        dayNtlVolumeUsd != null &&
        dayNtlVolumeUsd >= 0 &&
        openInterestUsd != null &&
        openInterestUsd > 0
          ? dayNtlVolumeUsd / openInterestUsd
          : null,
    });
  }
  return rows;
}

function isHyperliquidPositioningSummary(
  value: unknown,
): value is HyperliquidPositioningSummary {
  if (value == null || typeof value !== "object" || Array.isArray(value))
    return false;
  const record = value as Record<string, unknown>;
  const nullableNumbers = [
    record.oraclePx,
    record.prevDayPx,
    record.dayChangePct,
    record.fundingRate,
    record.fundingPercentile,
    record.premiumPct,
    record.premiumPercentile,
    record.openInterestUnits,
    record.openInterestUsd,
    record.dayNtlVolumeUsd,
    record.volumeToOpenInterest,
    record.priceChangeSincePriorPct,
    record.oiChangePct,
    record.oiAbsoluteMovePercentile,
    record.fundingChangeBps,
  ];
  const nullableNumbersValid = nullableNumbers.every(
    (field) =>
      field === null ||
      (typeof field === "number" && Number.isFinite(field)),
  );
  const percentilesValid = [
    record.fundingPercentile,
    record.premiumPercentile,
    record.oiAbsoluteMovePercentile,
  ].every(
    (field) =>
      field === null ||
      (typeof field === "number" &&
        Number.isFinite(field) &&
        field >= 0 &&
        field <= 1),
  );
  const previousObservedAtValid =
    record.previousObservedAt === null ||
    (typeof record.previousObservedAt === "string" &&
      Number.isFinite(Date.parse(record.previousObservedAt)));
  return (
    record.provider === "hyperliquid" &&
    record.provenance === "HYPERLIQUID_META_AND_ASSET_CTXS" &&
    record.authority === "SHADOW_ONLY_NO_TRADING_AUTHORITY" &&
    typeof record.symbol === "string" &&
    /^[A-Z0-9]{2,20}$/.test(record.symbol) &&
    typeof record.observedAt === "string" &&
    Number.isFinite(Date.parse(record.observedAt)) &&
    typeof record.markPx === "number" &&
    Number.isFinite(record.markPx) &&
    record.markPx > 0 &&
    nullableNumbersValid &&
    percentilesValid &&
    previousObservedAtValid &&
    [
      "CROWDED_LONG",
      "LONG_BIAS",
      "BALANCED",
      "SHORT_BIAS",
      "CROWDED_SHORT",
    ].includes(String(record.crowdingState)) &&
    [
      "LEVERAGED_LONG_BUILD",
      "LEVERAGED_SHORT_BUILD",
      "SHORT_COVERING",
      "LONG_FLUSH",
      "NO_LARGE_FLOW_SIGNAL",
      "DELTA_UNAVAILABLE",
    ].includes(String(record.flowState)) &&
    typeof record.confidence === "number" &&
    Number.isFinite(record.confidence) &&
    record.confidence >= 0 &&
    record.confidence <= 1 &&
    record.whaleWalletEvidence === "UNKNOWN_PUBLIC_AGGREGATE_ONLY"
  );
}

async function loadHistory(path: string): Promise<HyperliquidHistoryFile> {
  try {
    const raw = JSON.parse(await readFile(path, "utf8"));
    if (
      raw?.version !== "hyperliquid-positioning-v1" ||
      !Array.isArray(raw.records)
    )
      throw new Error("Invalid Hyperliquid positioning history");
    return {
      version: "hyperliquid-positioning-v1",
      updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : null,
      records: raw.records.filter(isHyperliquidPositioningSummary),
    };
  } catch (error) {
    if ((error as NodeJS.ErrnoException)?.code === "ENOENT") return emptyHistory();
    throw error;
  }
}

async function saveHistory(
  path: string,
  history: HyperliquidHistoryFile,
): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  const tmp = path + ".tmp";
  await writeFile(tmp, JSON.stringify(history), "utf8");
  await rename(tmp, path);
}

function priorRecord(
  history: HyperliquidHistoryFile,
  symbol: string,
  now: number,
): HyperliquidPositioningSummary | null {
  for (let index = history.records.length - 1; index >= 0; index--) {
    const record = history.records[index]!;
    if (record.symbol !== symbol) continue;
    const observed = Date.parse(record.observedAt);
    if (!Number.isFinite(observed) || observed > now) continue;
    const age = now - observed;
    if (age < MIN_HISTORY_GAP_MS) continue;
    if (age > MAX_DELTA_LOOKBACK_MS) return null;
    return record;
  }
  return null;
}

function buildSummaries(
  parsed: ParsedContext[],
  history: HyperliquidHistoryFile,
  requestedSymbols: Set<string>,
  now: number,
): HyperliquidPositioningSummary[] {
  const current = parsed.filter((row) => requestedSymbols.has(row.symbol));
  const fundingValues = current
    .map((row) => row.fundingRate)
    .filter((value): value is number => value != null);
  const premiumValues = current
    .map((row) => row.premiumPct)
    .filter((value): value is number => value != null);

  const withDelta = current.map((row) => {
    const prior = priorRecord(history, row.symbol, now);
    return {
      row,
      prior,
      priceChangeSincePriorPct:
        prior?.markPx != null ? pctChange(prior.markPx, row.markPx) : null,
      oiChangePct:
        prior?.openInterestUnits != null && row.openInterestUnits != null
          ? pctChange(prior.openInterestUnits, row.openInterestUnits)
          : null,
      fundingChangeBps:
        prior?.fundingRate != null && row.fundingRate != null
          ? (row.fundingRate - prior.fundingRate) * 10_000
          : null,
    };
  });
  const absoluteOiMoves = withDelta
    .map((item) =>
      item.oiChangePct == null ? null : Math.abs(item.oiChangePct),
    )
    .filter((value): value is number => value != null);

  return withDelta.map(({
    row,
    prior,
    priceChangeSincePriorPct,
    oiChangePct,
    fundingChangeBps,
  }) => {
    const fundingPercentile = percentileRank(fundingValues, row.fundingRate);
    const premiumPercentile = percentileRank(premiumValues, row.premiumPct);
    const oiAbsoluteMovePercentile = percentileRank(
      absoluteOiMoves,
      oiChangePct == null ? null : Math.abs(oiChangePct),
    );
    const crowdingState = classifyCrowding(
      fundingPercentile,
      premiumPercentile,
    );
    const flowState = classifyFlow(
      oiChangePct,
      oiAbsoluteMovePercentile,
      priceChangeSincePriorPct,
    );
    let confidence = 0.5;
    if (
      row.fundingRate != null &&
      row.premiumPct != null &&
      row.openInterestUsd != null &&
      row.dayNtlVolumeUsd != null
    )
      confidence += 0.12;
    if (current.length >= 10) confidence += 0.08;
    if (oiChangePct != null) confidence += 0.1;
    if (flowState !== "DELTA_UNAVAILABLE") confidence += 0.04;
    confidence = Math.min(0.84, confidence);

    return {
      provider: "hyperliquid",
      provenance: "HYPERLIQUID_META_AND_ASSET_CTXS",
      authority: "SHADOW_ONLY_NO_TRADING_AUTHORITY",
      symbol: row.symbol,
      observedAt: new Date(now).toISOString(),
      markPx: row.markPx,
      oraclePx: row.oraclePx,
      prevDayPx: row.prevDayPx,
      dayChangePct: row.dayChangePct,
      fundingRate: row.fundingRate,
      fundingPercentile,
      premiumPct: row.premiumPct,
      premiumPercentile,
      openInterestUnits: row.openInterestUnits,
      openInterestUsd: row.openInterestUsd,
      dayNtlVolumeUsd: row.dayNtlVolumeUsd,
      volumeToOpenInterest: row.volumeToOpenInterest,
      previousObservedAt: prior?.observedAt ?? null,
      priceChangeSincePriorPct,
      oiChangePct,
      oiAbsoluteMovePercentile,
      fundingChangeBps,
      crowdingState,
      flowState,
      confidence,
      whaleWalletEvidence: "UNKNOWN_PUBLIC_AGGREGATE_ONLY",
    };
  });
}

async function collectAndStore(
  path: string,
  symbols: string[],
  fetcher: typeof fetch,
  now: number,
): Promise<Map<string, HyperliquidPositioningSummary>> {
  const history = await loadHistory(path);
  const requested = new Set(
    symbols.map((symbol) => symbol.trim().toUpperCase()).filter(Boolean),
  );
  const payload = await fetchHyperliquidJson(fetcher);
  const parsed = parseHyperliquidPositioning(payload);
  const summaries = buildSummaries(parsed, history, requested, now);

  const cutoff = now - HISTORY_RETENTION_MS;
  history.records = history.records.filter((record) => {
    const observed = Date.parse(record.observedAt);
    return Number.isFinite(observed) && observed >= cutoff && observed <= now;
  });

  for (const summary of summaries) {
    const latest = [...history.records]
      .reverse()
      .find((record) => record.symbol === summary.symbol);
    const latestMs = latest ? Date.parse(latest.observedAt) : Number.NaN;
    if (!Number.isFinite(latestMs) || now - latestMs >= MIN_HISTORY_GAP_MS)
      history.records.push(summary);
  }

  history.records.sort(
    (a, b) => Date.parse(a.observedAt) - Date.parse(b.observedAt),
  );
  if (history.records.length > MAX_HISTORY_RECORDS)
    history.records = history.records.slice(-MAX_HISTORY_RECORDS);
  history.updatedAt = new Date(now).toISOString();
  await saveHistory(path, history);
  return new Map(summaries.map((summary) => [summary.symbol, summary]));
}

export async function collectHyperliquidPositioning(
  path: string,
  symbols: string[],
  fetcher: typeof fetch = fetch,
  now = Date.now(),
): Promise<Map<string, HyperliquidPositioningSummary>> {
  const next = (queues.get(path) ?? Promise.resolve())
    .catch(() => undefined)
    .then(() => collectAndStore(path, symbols, fetcher, now));
  queues.set(path, next);
  try {
    return await next;
  } finally {
    if (queues.get(path) === next) queues.delete(path);
  }
}

export async function readLatestHyperliquidPositioning(
  path: string,
  options: {
    symbols?: string[];
    now?: number;
    maxAgeMs?: number;
  } = {},
): Promise<Map<string, HyperliquidPositioningSummary>> {
  const history = await loadHistory(path);
  const now = options.now ?? Date.now();
  const maxAgeMs = options.maxAgeMs ?? 30 * 60_000;
  const requested = options.symbols
    ? new Set(options.symbols.map((symbol) => symbol.toUpperCase()))
    : null;
  const latest = new Map<string, HyperliquidPositioningSummary>();
  for (let index = history.records.length - 1; index >= 0; index--) {
    const record = history.records[index]!;
    if (latest.has(record.symbol)) continue;
    if (requested && !requested.has(record.symbol)) continue;
    const observed = Date.parse(record.observedAt);
    if (
      !Number.isFinite(observed) ||
      observed > now ||
      now - observed > maxAgeMs
    )
      continue;
    latest.set(record.symbol, record);
  }
  return latest;
}

export async function readHyperliquidPositioningHistory(
  path: string,
  options: { symbol?: string; limit?: number } = {},
): Promise<HyperliquidHistoryFile> {
  const history = await loadHistory(path);
  const symbol = options.symbol?.toUpperCase();
  const limit = Math.max(1, Math.min(500, Number(options.limit ?? 100) || 100));
  const records = history.records
    .filter((record) => !symbol || record.symbol === symbol)
    .slice(-limit)
    .reverse();
  return { ...history, records };
}
