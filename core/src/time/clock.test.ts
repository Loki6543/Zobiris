import { describe, expect, it } from "vitest";
import { assessClock } from "./clock.js";

describe("clock integrity", () => {
  it("detects wall-clock jumps relative to monotonic time", () => {
    const result = assessClock({
      wallStartMs: 1_000,
      wallEndMs: 10_000,
      monotonicStartMs: 100,
      monotonicEndMs: 1_100,
    });
    expect(result.state).toBe("DEGRADED");
    expect(result.reasons).toContain("wall_clock_jump_detected");
  });

  it("rejects provider timestamps materially in the future", () => {
    const now = Date.parse("2026-09-27T10:00:00Z");
    const result = assessClock({
      wallStartMs: now - 100,
      wallEndMs: now,
      monotonicStartMs: 0,
      monotonicEndMs: 100,
      providerTimestamps: ["2026-09-27T10:05:00Z"],
    });
    expect(result.state).toBe("DEGRADED");
    expect(result.reasons).toContain("provider_timestamp_in_future");
  });
});
