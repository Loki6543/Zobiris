/**
 * A conservative target within Strategy 2.1's existing absolute risk caps.
 * This cannot grant execution authority; eligibility, cash, market deployment,
 * portfolio concentration, and staged-line checks still apply downstream.
 */
export interface AdaptiveTargetInput {
  capitalBaseUsd: number;
  assetClass: 'CORE' | 'MEME';
  opportunityScore: number;
  opportunityConfidence: number;
  marketConfidence: number;
  deploymentCapPct: number;
}

function ramp(value: number, low: number, high: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, (value - low) / (high - low)));
}

export function adaptiveTargetUsd(input: AdaptiveTargetInput): number {
  const base = Number.isFinite(input.capitalBaseUsd) ? Math.max(0, input.capitalBaseUsd) : 0;
  const ceiling = base * (input.assetClass === 'MEME' ? 0.03 : 0.12);
  // Heuristic scores determine only how much of the existing ceiling is sought.
  // An unsupported signal cannot manufacture a minimum order.
  const confidence = ramp(input.opportunityConfidence, 0.50, 0.85);
  const signal = ramp(input.opportunityScore, 50, 75);
  const market = ramp(input.marketConfidence, 0.5, 0.8);
  const regime = Number.isFinite(input.deploymentCapPct)
    ? Math.max(0, Math.min(1, input.deploymentCapPct / 0.85))
    : 0;
  return Math.round(ceiling * confidence * signal * market * regime * 100) / 100;
}
