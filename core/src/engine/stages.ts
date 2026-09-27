export type StageStatus = "SUCCESS" | "DEGRADED" | "FAILED" | "SKIPPED";

export interface StageResult<T> {
  name: string;
  status: StageStatus;
  startedAt: string;
  completedAt: string;
  durationMs: number;
  data: T | null;
  error: string | null;
}

export interface StageClock {
  now(): Date;
  monotonicNow(): number;
}

export async function runStage<T>(
  name: string,
  clock: StageClock,
  work: () => Promise<T>,
): Promise<StageResult<T>> {
  const startedAt = clock.now().toISOString();
  const startedMono = clock.monotonicNow();
  try {
    const data = await work();
    const completedAt = clock.now().toISOString();
    return {
      name,
      status: "SUCCESS",
      startedAt,
      completedAt,
      durationMs: Math.max(0, clock.monotonicNow() - startedMono),
      data,
      error: null,
    };
  } catch (error) {
    const completedAt = clock.now().toISOString();
    return {
      name,
      status: "FAILED",
      startedAt,
      completedAt,
      durationMs: Math.max(0, clock.monotonicNow() - startedMono),
      data: null,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export function skippedStage<T>(name: string, clock: StageClock, reason: string): StageResult<T> {
  const at = clock.now().toISOString();
  return {
    name,
    status: "SKIPPED",
    startedAt: at,
    completedAt: at,
    durationMs: 0,
    data: null,
    error: reason,
  };
}
