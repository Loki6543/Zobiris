import test from 'node:test';
import assert from 'node:assert/strict';
import { adaptiveTargetUsd } from '../engine/adaptiveTarget.js';

const strong = {
  capitalBaseUsd: 1850,
  assetClass: 'CORE' as const,
  opportunityScore: 80,
  opportunityConfidence: 0.9,
  marketConfidence: 0.85,
  deploymentCapPct: 0.85,
};

test('strong verified opportunity reaches, but never exceeds, the existing single asset cap', () => {
  assert.equal(adaptiveTargetUsd(strong), 222);
  assert.equal(adaptiveTargetUsd({ ...strong, assetClass: 'MEME' }), 55.5);
});

test('weaker signal, weaker evidence, and defensive regime each reduce requested capital', () => {
  const baseline = adaptiveTargetUsd(strong);
  assert.ok(adaptiveTargetUsd({ ...strong, opportunityScore: 60 }) < baseline);
  assert.ok(adaptiveTargetUsd({ ...strong, opportunityConfidence: 0.7 }) < baseline);
  assert.ok(adaptiveTargetUsd({ ...strong, marketConfidence: 0.6 }) < baseline);
  assert.ok(adaptiveTargetUsd({ ...strong, deploymentCapPct: 0.15 }) < baseline);
});

test('missing or unsupported evidence cannot create a minimum allocation', () => {
  assert.equal(adaptiveTargetUsd({ ...strong, opportunityScore: Number.NaN }), 0);
  assert.equal(adaptiveTargetUsd({ ...strong, opportunityConfidence: 0.50 }), 0);
  assert.equal(adaptiveTargetUsd({ ...strong, marketConfidence: Number.NaN }), 0);
  assert.equal(adaptiveTargetUsd({ ...strong, deploymentCapPct: Number.NaN }), 0);
  assert.equal(adaptiveTargetUsd({ ...strong, capitalBaseUsd: -1 }), 0);
});
