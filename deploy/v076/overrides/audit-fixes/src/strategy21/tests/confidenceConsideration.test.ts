import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyAssetState, type AssetStateInput } from '../engine/assetState.js';
import { computeOpportunityHeuristic } from '../engine/factors.js';

const setup: AssetStateInput = {
  eligibility: 'ACTIVE_ELIGIBLE', confidence: 0.51,
  fundamentalTrajectory: 0.15, developerHealth: 0.7, minimumDeveloperHealth: 0.5,
  attentionPercentile: 45, crowdingThreshold: 60, observableCatalyst: true,
  contributorBreadthImproving: false, spotAccumulation: false, structurallyDeclining: false,
  extended: false, deterioration: false, existingPositionUsd: 0,
  nonPriceConfirmation: false, trendConfirmed: false, profitable: false,
  expectedNextDollarBelowHoldHurdle: false,
};

test('51 percent can enter probe consideration; exactly 50 percent remains research', () => {
  assert.equal(classifyAssetState(setup).state, 'PRE_IGNITION');
  assert.equal(classifyAssetState({ ...setup, confidence: 0.5 }).state, 'RESEARCH');
  assert.equal(classifyAssetState({ ...setup, eligibility: 'WATCH_ONLY' }).state, 'RESEARCH');
});

test('opportunity ranking accepts above 50 percent only with factor coverage', () => {
  const factor = { value: 0.7, coverage: 1 };
  const input = { fundamental: factor, execution: factor, flow: factor, discovery: factor, resilience: factor };
  assert.equal(computeOpportunityHeuristic({ ...input, evidenceConfidence: 0.51 }).eligibleForRanking, true);
  assert.equal(computeOpportunityHeuristic({ ...input, evidenceConfidence: 0.5 }).eligibleForRanking, false);
  assert.equal(computeOpportunityHeuristic({ ...input, execution: { value: null, coverage: 0 }, evidenceConfidence: 0.51 }).eligibleForRanking, false);
});
