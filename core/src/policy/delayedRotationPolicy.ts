import { createHash } from "node:crypto";

export const DELAYED_ROTATION_POLICY = {
  version: "2.1.0",
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
    nearRelative30MaxPct: -8,
    nearRelative90MaxPct: -20,
  },
  score: {
    recoveryWeight: 0.28,
    lag30Weight: 0.20,
    lag90Weight: 0.20,
    relativeWeight: 0.20,
    depthWeight: 0.12,
    recoveryCenterPct: 5,
    recoverySpanPct: 7,
    lag30CenterPct: -12,
    lag30SpanPct: 23,
    lag90CenterPct: -30,
    lag90SpanPct: 45,
    relative30SpanPct: 25,
    relative90SpanPct: 50,
    depthGrades: {
      INSTITUTIONAL: 1,
      DEEP: 0.95,
      NORMAL: 0.85,
      SMALL_SIZE_ONLY: 0.72,
      VERY_THIN: 0.45,
    },
  },
  entry: {
    minPullbackPct: 4,
    maxPullbackPct: 8,
    sevenDayMultiplier: 0.15,
    extra30dLossTriggerPct: -20,
    extra90dLossTriggerPct: -50,
    extraPullbackPct: 0.5,
  },
  capital: {
    pilotTypicalUsd: 37,
    maxManeuverFraction: 0.02,
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
    maxReferenceGapFraction: 0.10,
  },
  freshness: {
    providerMaxAgeMs: 20 * 60_000,
    providerMaxFutureSkewMs: 2 * 60_000,
    executionCacheMinTtlMs: 15 * 60_000,
  },
  learning: {
    minQualifiedEpisodes: 30,
    minControlEpisodes: 30,
    maxSingleMarketEpisodeFraction: 0.35,
  },
} as const;

function stable(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (value && typeof value === "object") {
    const record=value as Record<string,unknown>;
    return `{${Object.keys(record).sort().map(key=>`${JSON.stringify(key)}:${stable(record[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

export const DELAYED_ROTATION_POLICY_HASH = createHash("sha256")
  .update(stable(DELAYED_ROTATION_POLICY))
  .digest("hex");

export type DelayedRotationPolicy = typeof DELAYED_ROTATION_POLICY;
