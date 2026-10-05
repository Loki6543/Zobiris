import test from "node:test";
import assert from "node:assert/strict";
import {
  findDeadAxes,
  pullbackCompliance,
  validationVerdict,
  policyHashForDelayedRotation,
} from "../research/delayedRotationValidation.js";

test("synthetic validation can never emit a support verdict", () => {
  const verdict = validationVerdict(0.95, 1, "synthetic");
  assert.match(verdict, /^SELF_TEST_ONLY:/);
  assert.equal(verdict.startsWith("SUPPORTED"), false);
});

test("real point-in-time evidence is incomplete until every required layer is present", () => {
  assert.match(
    validationVerdict(0.95, 0.82, "provider_point_in_time"),
    /^INCOMPLETE:/,
  );
  assert.match(
    validationVerdict(0.80, 1, "provider_point_in_time"),
    /^SUPPORTED_PROVISIONAL:/,
  );
});

test("dead-axis detection requires a controlled comparison with every other axis fixed", () => {
  const frozen = [
    { lag: -0.2, vaccel: 1.05, score: 0.5 },
    { lag: -0.2, vaccel: 1.30, score: 0.5 },
    { lag: 0.0, vaccel: 1.05, score: 0.5 },
    { lag: 0.0, vaccel: 1.30, score: 0.5 },
  ];
  assert.deepEqual(
    findDeadAxes(frozen, ["lag", "vaccel"], "score").sort(),
    ["lag", "vaccel"],
  );

  const live = frozen.map((row) => ({
    ...row,
    score: row.lag + row.vaccel,
  }));
  assert.deepEqual(findDeadAxes(live, ["lag", "vaccel"], "score"), []);
});

test("pullback compliance warns below the 80 percent review floor", () => {
  const audit = pullbackCompliance(
    [
      { symbol: "A", return7d: -0.03 },
      { symbol: "B", return7d: -0.04 },
      { symbol: "C", return7d: 0.01 },
      { symbol: "D", return7d: -0.09 },
    ],
    "prospective",
  );
  assert.equal(audit.compliant, 2);
  assert.equal(audit.total, 4);
  assert.equal(audit.complianceRate, 0.5);
  assert.equal(audit.warning, true);
});

test("active policy hash ignores diagnostics that do not control qualification", () => {
  const base = {
    maxRelative90dVsBtcPct: -20,
    minChange30dPctExclusive: 0,
    minChange90dPctExclusive: -35,
    minTurnoverRatio: 0.002,
    minControlledPullback7dPct: -8,
    maxRecovery7dPct: 12,
    maxPositive24hPct: 8,
    minBreadth30dPositive: 0.45,
  };
  const a = policyHashForDelayedRotation({ ...base, diagnosticMinBreadth7dPositive: 0.4 });
  const b = policyHashForDelayedRotation({ ...base, diagnosticMinBreadth7dPositive: 0.9 });
  assert.equal(a, b);
});
