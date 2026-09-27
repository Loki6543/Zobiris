import { ZOBIRIS_POLICY } from "../policy/config.js";

export type ClockState = "HEALTHY" | "DEGRADED";

export interface ClockAssessment {
  state: ClockState;
  wallElapsedMs: number;
  monotonicElapsedMs: number;
  wallMonotonicDriftMs: number;
  futureProviderTimestampCount: number;
  reasons: string[];
}

export function assessClock(args: {
  wallStartMs: number;
  wallEndMs: number;
  monotonicStartMs: number;
  monotonicEndMs: number;
  providerTimestamps?: Array<string | null | undefined>;
}): ClockAssessment {
  const wallElapsedMs = args.wallEndMs - args.wallStartMs;
  const monotonicElapsedMs = args.monotonicEndMs - args.monotonicStartMs;
  const wallMonotonicDriftMs = Math.abs(wallElapsedMs - monotonicElapsedMs);
  const futureProviderTimestampCount = (args.providerTimestamps ?? []).filter((value) => {
    if (!value) return false;
    const at = Date.parse(value);
    return Number.isFinite(at) &&
      at - args.wallEndMs > ZOBIRIS_POLICY.clock.maxFutureProviderTimestampMs;
  }).length;

  const reasons: string[] = [];
  if (wallMonotonicDriftMs > ZOBIRIS_POLICY.clock.maxWallMonotonicDriftMs) {
    reasons.push("wall_clock_jump_detected");
  }
  if (futureProviderTimestampCount > 0) {
    reasons.push("provider_timestamp_in_future");
  }

  return {
    state: reasons.length ? "DEGRADED" : "HEALTHY",
    wallElapsedMs,
    monotonicElapsedMs,
    wallMonotonicDriftMs,
    futureProviderTimestampCount,
    reasons,
  };
}
