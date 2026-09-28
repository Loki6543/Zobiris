import { createHash } from "node:crypto";

export const ZOBIRIS_POLICY = {
  version: "2.1.0",
  delayedRotation: {
    market: {
      btc30MinPct: 0,
      btc90MinPct: 0,
      breadth7Min: 0.55,
      breadth30Min: 0.45,
    },
    candidate: {
      max7dPct: 12,
      max24hPct: 8,
      min30dPct: -35,
      min90dPct: -75,
      nearRelative30dPct: -8,
      nearRelative90dPct: -20,
    },
    scoring: {
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
        relative: 0.20,
        depth: 0.12,
      },
    },
    entry: {
      minPullbackPct: 4,
      maxPullbackPct: 8,
      sevenDayMultiplier: 0.15,
      weak30BonusPct: 0.5,
      weak90BonusPct: 0.5,
      weak30ThresholdPct: -20,
      weak90ThresholdPct: -50,
    },
    capital: {
      typicalOrderUsd: 37,
      maxManeuverFraction: 0.02,
    },
  },
  execution: {
    standardTestUsd: 100,
    maxImpactBps: 100,
    maxBookAgeMs: 15_000,
    identityMaxGapFraction: 0.10,
    stress: {
      smallUsd: 500,
      normalUsd: 2_500,
      deepUsd: 50_000,
      institutionalUsd: 250_000,
      smallMaxImpactBps: 100,
      normalMaxImpactBps: 100,
      deepMaxImpactBps: 150,
      institutionalMaxImpactBps: 400,
    },
  },
  evidence: {
    minQualifiedEpisodes: 30,
    minControlEpisodes: 30,
    maxUnresolvedFraction: 0.10,
  },
  freshness: {
    marketContextMaxAgeMs: 10 * 60_000,
    metadataMaxAgeMs: 24 * 60 * 60_000,
    instrumentsMaxAgeMs: 60 * 60_000,
    tickerMaxAgeMs: 5 * 60_000,
  },
} as const;

function canonicalize(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${JSON.stringify(k)}:${canonicalize(v)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

export const ZOBIRIS_POLICY_HASH = createHash("sha256")
  .update(canonicalize(ZOBIRIS_POLICY))
  .digest("hex");

export type ZobirisPolicy = typeof ZOBIRIS_POLICY;
