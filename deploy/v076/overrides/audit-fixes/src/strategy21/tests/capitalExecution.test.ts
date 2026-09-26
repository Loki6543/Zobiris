import test from "node:test";
import assert from "node:assert/strict";
import {
  calculatePositionAuthority,
  createCapitalLedger,
  deploymentAuthorityUsd,
  reserveCapital,
} from "../engine/capital.js";
import { authorizeExecutionLine, planStagedExecution } from "../engine/executionPlan.js";

test("capital ledger keeps the $1,800 future strategic reserve out of current tactical buying power", () => {
  const ledger = createCapitalLedger();
  assert.equal(ledger.maneuverCashUsd, 1850);
  assert.equal(ledger.strategicTargetUsd, 1800);
  assert.equal(ledger.strategicFundedUsd, 0);
  const after = reserveCapital(ledger, 100, "TACTICAL");
  assert.equal(after.maneuverReservedUsd, 100);
  assert.equal(after.strategicFundedUsd, 0);
});

test("unfunded strategic reserve cannot be debited", () => {
  const ledger = createCapitalLedger();
  assert.throws(() => reserveCapital(ledger, 100, "STRATEGIC"), /strategic reserve/i);
});

test("market state creates a ceiling rather than a spending target", () => {
  const ledger = createCapitalLedger();
  assert.equal(deploymentAuthorityUsd("BROAD_EXPANSION", ledger, "TACTICAL"), 1572.5);
  assert.equal(deploymentAuthorityUsd("UNCERTAIN", ledger, "TACTICAL"), 277.5);
});

test("current maneuver sleeve caps one non-meme at 12% and one meme at 3%", () => {
  const ledger = createCapitalLedger();
  const core = calculatePositionAuthority({
    assetId: "ONDO",
    assetClass: "CORE",
    requestedTargetUsd: 200,
    marketState: "BROAD_EXPANSION",
    assetState: "ACCUMULATE",
    confidence: 0.82,
    eligibilityMaximumPositionUsd: 1000,
    eligibilityMaximumOrderUsd: 500,
    ledger,
    portfolio: { grossExposureUsd: 0, assetExposureUsd: 0, clusterExposureUsd: 0, memeExposureUsd: 0 },
  });
  const meme = calculatePositionAuthority({
    assetId: "BONK",
    assetClass: "MEME",
    requestedTargetUsd: 95,
    marketState: "BROAD_EXPANSION",
    assetState: "ACCUMULATE",
    confidence: 0.82,
    eligibilityMaximumPositionUsd: 1000,
    eligibilityMaximumOrderUsd: 500,
    ledger,
    portfolio: { grossExposureUsd: 0, assetExposureUsd: 0, clusterExposureUsd: 0, memeExposureUsd: 0 },
  });
  assert.equal(core.maxPositionUsd, 200);
  assert.equal(meme.maxPositionUsd, 55.5);
});

test("cluster and total meme caps constrain otherwise eligible positions", () => {
  const ledger = createCapitalLedger();
  const core = calculatePositionAuthority({
    assetId: "RENDER",
    assetClass: "CORE",
    requestedTargetUsd: 180,
    marketState: "BROAD_EXPANSION",
    assetState: "ACCUMULATE",
    confidence: 0.9,
    eligibilityMaximumPositionUsd: 1000,
    eligibilityMaximumOrderUsd: 500,
    ledger,
    portfolio: { grossExposureUsd: 300, assetExposureUsd: 0, clusterExposureUsd: 355, memeExposureUsd: 0 },
  });
  const meme = calculatePositionAuthority({
    assetId: "SHIB",
    assetClass: "MEME",
    requestedTargetUsd: 45,
    marketState: "BROAD_EXPANSION",
    assetState: "ACCUMULATE",
    confidence: 0.9,
    eligibilityMaximumPositionUsd: 1000,
    eligibilityMaximumOrderUsd: 500,
    ledger,
    portfolio: { grossExposureUsd: 300, assetExposureUsd: 0, clusterExposureUsd: 0, memeExposureUsd: 65 },
  });
  assert.equal(core.maxPositionUsd, 107.5);
  assert.equal(meme.maxPositionUsd, 27.5);
});

test("confidence of 50% blocks while above 50% is probe-only until 75%", () => {
  const ledger = createCapitalLedger();
  const blocked = calculatePositionAuthority({
    assetId: "X",
    assetClass: "CORE",
    requestedTargetUsd: 100,
    marketState: "BROAD_EXPANSION",
    assetState: "PRE_IGNITION",
    confidence: 0.5,
    eligibilityMaximumPositionUsd: 1000,
    eligibilityMaximumOrderUsd: 500,
    ledger,
    portfolio: { grossExposureUsd: 0, assetExposureUsd: 0, clusterExposureUsd: 0, memeExposureUsd: 0 },
  });
  const probe = calculatePositionAuthority({
    assetId: "Y",
    assetClass: "CORE",
    requestedTargetUsd: 100,
    marketState: "BROAD_EXPANSION",
    assetState: "PRE_IGNITION",
    confidence: 0.51,
    eligibilityMaximumPositionUsd: 1000,
    eligibilityMaximumOrderUsd: 500,
    ledger,
    portfolio: { grossExposureUsd: 0, assetExposureUsd: 0, clusterExposureUsd: 0, memeExposureUsd: 0 },
  });
  assert.equal(blocked.maxPositionUsd, 0);
  assert.equal(probe.maxNextOrderUsd, 46.25);
  assert.equal(probe.probeOnly, true);
});

test("staged execution uses 20/30/50 and never lets price alone authorize another line", () => {
  const plan = planStagedExecution(100, {
    maxPositionUsd: 100,
    maxNextOrderUsd: 30,
    probeOnly: false,
  });
  assert.deepEqual(plan.lines.map((line) => line.amountUsd), [20, 30, 50]);

  const line2WithoutThesis = authorizeExecutionLine(2, {
    marketState: "BROAD_EXPANSION",
    assetState: "ACCUMULATE",
    confidence: 0.8,
    eligibilityStatus: "ACTIVE_ELIGIBLE",
    opportunityPositive: true,
    nonPriceConfirmation: false,
    liquidityStable: true,
    supplyRiskStable: true,
    spotRelativeStrengthConfirmed: true,
    covarianceAcceptable: true,
  });
  assert.equal(line2WithoutThesis.authorized, false);
  assert.match(line2WithoutThesis.reason, /non-price/i);
});


test("eligibility and opportunity are hard AND gates for every execution line", () => {
  const otherwiseReady = {
    marketState: "BROAD_EXPANSION" as const,
    assetState: "ACCUMULATE" as const,
    confidence: 0.8,
    nonPriceConfirmation: true,
    liquidityStable: true,
    supplyRiskStable: true,
    spotRelativeStrengthConfirmed: true,
    covarianceAcceptable: true,
  };
  const eligibilityBlocked = authorizeExecutionLine(1, {
    ...otherwiseReady,
    eligibilityStatus: "INELIGIBLE",
    opportunityPositive: true,
  });
  assert.equal(eligibilityBlocked.authorized, false);
  assert.match(eligibilityBlocked.reason, /eligibility/i);
});

test("positive execution eligibility cannot override a non-positive opportunity", () => {
  const result = authorizeExecutionLine(1, {
    marketState: "BROAD_EXPANSION",
    assetState: "PROBE",
    confidence: 0.8,
    eligibilityStatus: "ACTIVE_ELIGIBLE",
    opportunityPositive: false,
    nonPriceConfirmation: true,
    liquidityStable: true,
    supplyRiskStable: true,
    spotRelativeStrengthConfirmed: true,
    covarianceAcceptable: true,
  });
  assert.equal(result.authorized, false);
  assert.match(result.reason, /opportunity/i);
});

test("conditional execution eligibility can authorize line 1 but never line 2 or line 3", () => {
  const base = {
    marketState: "BROAD_EXPANSION" as const,
    assetState: "ACCUMULATE" as const,
    confidence: 0.8,
    eligibilityStatus: "CONDITIONAL_PROBE_ELIGIBLE" as const,
    opportunityPositive: true,
    nonPriceConfirmation: true,
    liquidityStable: true,
    supplyRiskStable: true,
    spotRelativeStrengthConfirmed: true,
    covarianceAcceptable: true,
  };
  assert.equal(authorizeExecutionLine(1, base).authorized, true);
  assert.equal(authorizeExecutionLine(2, base).authorized, false);
  assert.equal(authorizeExecutionLine(3, base).authorized, false);
});

 test("orders cannot spend unfunded protocol capital or exceed remaining funded cash", () => {
  for (const cash of [0, 3.25]) {
    const result = calculatePositionAuthority({
      assetId: "SOL", assetClass: "CORE", requestedTargetUsd: 200,
      marketState: "BROAD_EXPANSION", assetState: "ACCUMULATE", confidence: 0.9,
      eligibilityMaximumPositionUsd: 1000, eligibilityMaximumOrderUsd: 500,
      ledger: createCapitalLedger({ maneuverCashUsd: cash, maneuverReservedUsd: 102 }),
      portfolio: { grossExposureUsd: 0, assetExposureUsd: 0, clusterExposureUsd: 0, memeExposureUsd: 0 },
    });
    assert.equal(result.maxNextOrderUsd, cash);
  }
});
