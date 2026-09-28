import { describe, expect, it } from "vitest";
import { ZOBIRIS_POLICY, ZOBIRIS_POLICY_HASH } from "./policy.js";

describe("versioned policy registry", () => {
  it("has a stable version and sha256 policy hash", () => {
    expect(ZOBIRIS_POLICY.version).toBe("2.1.0");
    expect(ZOBIRIS_POLICY_HASH).toMatch(/^[0-9a-f]{64}$/);
  });

  it("keeps personal execution separate from institutional stress depth", () => {
    expect(ZOBIRIS_POLICY.execution.standardTestUsd).toBe(100);
    expect(ZOBIRIS_POLICY.execution.stress.institutionalUsd).toBe(250_000);
    expect(ZOBIRIS_POLICY.execution.stress.institutionalMaxImpactBps).toBeGreaterThan(
      ZOBIRIS_POLICY.execution.maxImpactBps
    );
  });
});
