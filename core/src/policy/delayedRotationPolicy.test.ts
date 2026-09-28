import { describe, expect, it } from "vitest";
import { DELAYED_ROTATION_POLICY, DELAYED_ROTATION_POLICY_HASH } from "./delayedRotationPolicy.js";

describe("Delayed Rotation policy registry",()=>{
  it("has a stable semver-like version and deterministic SHA-256 hash",()=>{
    expect(DELAYED_ROTATION_POLICY.version).toMatch(/^\d+\.\d+\.\d+$/);
    expect(DELAYED_ROTATION_POLICY_HASH).toMatch(/^[0-9a-f]{64}$/);
  });

  it("keeps personal execution separate from institutional stress diagnostics",()=>{
    expect(DELAYED_ROTATION_POLICY.execution.standardTestUsd).toBe(100);
    expect(DELAYED_ROTATION_POLICY.execution.stress.institutionalUsd).toBe(250_000);
    expect(DELAYED_ROTATION_POLICY.execution.standardTestUsd)
      .toBeLessThan(DELAYED_ROTATION_POLICY.execution.stress.deepUsd);
  });
});
