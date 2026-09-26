import test from "node:test";
import assert from "node:assert/strict";
import {
  buildEvidenceLedger,
  buildResearchIntegrity,
  CAPABILITY_MANIFEST,
  NARRATIVE_RESEARCH_POLICY,
} from "../research/researchIntegrity.js";

test("point-in-time evidence ledger preserves observed/retrieved time and rejects future knowledge", () => {
  const asOf = "2026-09-25T20:00:00.000Z";
  const ledger = buildEvidenceLedger([
    {
      id: "known",
      symbol: "BTC",
      factorFamily: "marketTechnical",
      claim: JSON.stringify({ priceUsd: 85000 }),
      evidenceConfidence: 0.9,
      observedAt: "2026-09-25T19:55:00.000Z",
      receivedAt: "2026-09-25T19:55:02.000Z",
      providerIds: ["kraken"],
    },
    {
      id: "future",
      symbol: "BTC",
      factorFamily: "marketTechnical",
      claim: JSON.stringify({ priceUsd: 90000 }),
      evidenceConfidence: 0.9,
      observedAt: "2026-09-25T20:05:00.000Z",
      receivedAt: "2026-09-25T20:05:01.000Z",
      providerIds: ["kraken"],
    },
  ], "btc-id", "BTC", asOf);

  assert.equal(ledger.length, 2);
  assert.equal(ledger.find((item) => item.evidenceId === "known")?.pointInTimeValid, true);
  assert.equal(ledger.find((item) => item.evidenceId === "future")?.pointInTimeValid, false);
  assert.match(ledger.find((item) => item.evidenceId === "known")?.rawPayloadHash ?? "", /^fnv1a32:[0-9a-f]{8}$/);
});

test("high opportunity cannot manufacture high research confidence when evidence is missing", () => {
  const result = buildResearchIntegrity({
    assetId: "ondo-id",
    symbol: "ONDO",
    asOf: "2026-09-25T20:00:00.000Z",
    action: "ACCUMULATE",
    assetState: "CONFIRMED_TREND",
    researchScore: 90,
    opportunityScore: 0.95,
    opportunityConfidence: 0.95,
    eligibilityStatus: "ACTIVE_ELIGIBLE",
    dataReadiness: "READY",
    evidenceCoverage: 0.1,
    evidenceClaims: [],
    factors: { fundamental: 0.9, execution: 0.9, flow: 0.9, discovery: 0.9, resilience: 0.9 },
    activeRiskGates: [],
  });

  assert.equal(result.risk.researchEligibility, "DATA_INSUFFICIENT");
  assert.equal(result.scorecard.evidenceQuality, 0);
  assert.ok(result.thesis.confidence < 0.5);
  assert.equal(result.scorecard.manipulationRisk, null);
  assert.ok(result.scorecard.unmeasuredDimensions.includes("manipulationRisk"));
});

test("hard risk veto overrides otherwise strong setup", () => {
  const asOf = "2026-09-25T20:00:00.000Z";
  const result = buildResearchIntegrity({
    assetId: "x-id",
    symbol: "X",
    asOf,
    action: "ACCUMULATE",
    assetState: "CONFIRMED_TREND",
    researchScore: 88,
    opportunityScore: 0.9,
    opportunityConfidence: 0.9,
    eligibilityStatus: "ACTIVE_ELIGIBLE",
    dataReadiness: "READY",
    evidenceCoverage: 0.9,
    evidenceClaims: [{
      id: "e1",
      symbol: "X",
      factorFamily: "marketTechnical",
      claim: JSON.stringify({ priceUsd: 10 }),
      evidenceConfidence: 0.9,
      observedAt: asOf,
      receivedAt: asOf,
      providerIds: ["kraken"],
    }],
    factors: { fundamental: 0.8, execution: 0.8, flow: 0.8, discovery: 0.8, resilience: 0.2 },
    activeRiskGates: [{ code: "ACTIVE_EXPLOIT", effect: "veto" }],
  });

  assert.equal(result.risk.researchEligibility, "EXCLUDE");
  assert.equal(result.thesis.invalidated, true);
  assert.ok(result.risk.hardBlocks.some((block) => block.code === "ACTIVE_EXPLOIT"));
});

test("adversarial discovery allocation is symmetric and does not control conclusion weighting", () => {
  const budget = NARRATIVE_RESEARCH_POLICY.discoveryBudget;
  const total = Object.values(budget).reduce((sum, value) => sum + value, 0);
  assert.equal(total, 1);
  assert.ok(Math.abs((budget.adversarialAlternativeMechanisms + budget.counterContrarianFalsification) - 0.6) < 1e-12);
  assert.match(NARRATIVE_RESEARCH_POLICY.conclusionWeighting, /EVIDENCE_QUALITY/);
});

test("capability manifest permits private reads but forbids every exchange write path", () => {
  assert.equal(CAPABILITY_MANIFEST.exchangePrivateRead, true);
  assert.equal(CAPABILITY_MANIFEST.exchangeOrderSubmission, false);
  assert.equal(CAPABILITY_MANIFEST.exchangeOrderModification, false);
  assert.equal(CAPABILITY_MANIFEST.exchangeOrderCancellation, false);
  assert.equal(CAPABILITY_MANIFEST.exchangeFundTransfer, false);
  assert.equal(CAPABILITY_MANIFEST.exchangeWithdrawal, false);
  assert.equal(CAPABILITY_MANIFEST.walletSigning, false);
  assert.equal(CAPABILITY_MANIFEST.transactionBroadcast, false);
});
