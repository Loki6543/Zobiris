import { describe, expect, it } from "vitest";
import { ZOBIRIS_POLICY, ZOBIRIS_POLICY_CANONICAL_JSON, ZOBIRIS_POLICY_HASH } from "./config.js";

describe("Zobiris policy registry", () => {
  it("has a stable versioned sha256 identity", () => {
    expect(ZOBIRIS_POLICY.version).toBe("2.1.0");
    expect(ZOBIRIS_POLICY_HASH).toMatch(/^[a-f0-9]{64}$/);
    expect(ZOBIRIS_POLICY_CANONICAL_JSON).toContain('"standardTestUsd":100');
    expect(ZOBIRIS_POLICY_CANONICAL_JSON).toContain('"maxKrakenReferenceGapPct":0.1');
  });

  it("keeps personal-size execution separate from institutional stress", () => {
    expect(ZOBIRIS_POLICY.execution.standardTestUsd).toBe(100);
    expect(ZOBIRIS_POLICY.execution.stress.institutionalUsd).toBe(250_000);
    expect(ZOBIRIS_POLICY.execution.standardTestUsd).toBeLessThan(
      ZOBIRIS_POLICY.execution.stress.institutionalUsd,
    );
  });
});
