import { createHash } from "node:crypto";

function canonicalize(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(",")}]`;
  return `{${Object.entries(value as Record<string, unknown>)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, item]) => `${JSON.stringify(key)}:${canonicalize(item)}`)
    .join(",")}}`;
}

export const ZOBIRIS_POLICY = {
  version: "2.1.0",
  strategy: {
    tag: "DELAYED_ROTATION_PILOT_V2",
    version: "2.1.0",
  },
  market: {
    btc30dMinPct: 0,
    btc90dMinPct: 0,
    breadth7dPositiveMin: 0.55,
    breadth30dPositiveMin: 0.45,
  },
  candidate: {
    maxRecovery7dPct: 12,
    maxPositive24hPct: 8,
    minChange30dPct: -35,
    maxChange30dPct: 0,
    minChange90dPct: -75,
    maxChange90dPct: 0,
    relative30dNearRotationPct: -8,
    relative90dNearRotationPct: -20,
  },
  catchUp: {
    recoveryIdeal7dPct: 5,
    recoverySpanPct: 7,
    lag30IdealPct: -12,
    lag30SpanPct: 23,
    lag90IdealPct: -30,
    lag90SpanPct: 45,
    relative30ScalePct: 25,
    relative90ScalePct: 50,
    weights: {
      recovery: 0.28,
      lag30: 0.20,
      lag90: 0.20,
      relativeLag: 0.20,
      marketDepth: 0.12,
    },
    depthQuality: {
      INSTITUTIONAL: 1,
      DEEP: 0.95,
      NORMAL: 0.85,
      SMALL_SIZE_ONLY: 0.72,
      VERY_THIN: 0.45,
    },
  },
  pullback: {
    basePct: 4,
    perPositive7dPct: 0.15,
    extraIf30dBelowPct: -20,
    extra30dPct: 0.5,
    extraIf90dBelowPct: -50,
    extra90dPct: 0.5,
    minPct: 4,
    maxPct: 8,
  },
  capital: {
    defaultManeuverNavUsd: 1850,
    defaultPilotOrderUsd: 37,
    maxManeuverNavPct: 0.02,
  },
  execution: {
    standardTestUsd: 100,
    maxImpactBps: 100,
    maxBookAgeMs: 15_000,
    stress: {
      smallUsd: 500,
      normalUsd: 2_500,
      deepUsd: 50_000,
      institutionalUsd: 250_000,
      smallMaxBps: 100,
      normalMaxBps: 100,
      deepMaxBps: 150,
      institutionalMaxBps: 400,
    },
  },
  identity: {
    maxKrakenReferenceGapPct: 0.10,
  },
  providerFreshness: {
    cmcQuotesMs: 15 * 60_000,
    cmcMetadataMs: 24 * 60 * 60_000,
    krakenInstrumentsMs: 6 * 60 * 60_000,
    krakenTickerMs: 10 * 60_000,
    executionCacheMinMs: 15 * 60_000,
  },
  clock: {
    maxWallMonotonicDriftMs: 2_000,
    maxFutureProviderTimestampMs: 2 * 60_000,
  },
  evidence: {
    minimumQualifiedEpisodes: 30,
    minimumControlEpisodes: 30,
    minimumMarketEpisodes: 10,
  },
  retention: {
    hotExecutionDays: 30,
    hotBookSampleDays: 30,
  },
} as const;

export const ZOBIRIS_POLICY_CANONICAL_JSON = canonicalize(ZOBIRIS_POLICY);
export const ZOBIRIS_POLICY_HASH = createHash("sha256")
  .update(ZOBIRIS_POLICY_CANONICAL_JSON)
  .digest("hex");

export type ZobirisPolicy = typeof ZOBIRIS_POLICY;
