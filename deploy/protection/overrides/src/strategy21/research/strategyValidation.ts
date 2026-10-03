/**
 * ZOBIRIS Strategy Validation Lab
 *
 * Argus-inspired research guardrails for candidate entry/exit models.
 * This module has NO order authority. It only evaluates already-produced
 * strategy episodes and fails closed on temporal leakage.
 */

export interface StrategyValidationEpisode {
  id: string;
  symbol: string;
  decisionAt: string;
  featureMaxAt: string;
  evaluatedAt: string;
  grossReturnPct: number;
  benchmarkReturnPct?: number | null;
  feeBps?: number;
  slippageBps?: number;
  regime?: string | null;
  maxAdversePct?: number | null;
  maxFavorablePct?: number | null;
}

export interface StrategyValidationConfig {
  researchFraction: number;
  oosFraction: number;
  vaultFraction: number;
  minOosEpisodes: number;
  minVaultEpisodes: number;
  minBenchmarkCoverage: number;
  minMeanNetReturnPct: number;
  minMedianNetReturnPct: number;
  minHitRate: number;
  minProfitFactor: number;
  maxDrawdownPct: number;
  minWalkForwardPassRate: number;
}

export const DEFAULT_STRATEGY_VALIDATION_CONFIG: StrategyValidationConfig = {
  researchFraction: 0.60,
  oosFraction: 0.25,
  vaultFraction: 0.15,
  minOosEpisodes: 30,
  minVaultEpisodes: 15,
  minBenchmarkCoverage: 0.60,
  minMeanNetReturnPct: 0,
  minMedianNetReturnPct: 0,
  minHitRate: 0.50,
  minProfitFactor: 1.05,
  maxDrawdownPct: 20,
  minWalkForwardPassRate: 2 / 3,
};

export type StrategyValidationStatus =
  | "INSUFFICIENT_DATA"
  | "LEAKAGE_REJECTED"
  | "FAILED_OOS"
  | "FAILED_WALK_FORWARD"
  | "FAILED_VAULT"
  | "SHADOW_VALIDATED";

export interface ValidationMetrics {
  episodes: number;
  averageNetReturnPct: number | null;
  medianNetReturnPct: number | null;
  p10NetReturnPct: number | null;
  hitRate: number | null;
  profitFactor: number | null;
  tStat: number | null;
  maxDrawdownPct: number | null;
  benchmarkCoverage: number | null;
  averageExcessVsBenchmarkPct: number | null;
  averageMaxAdversePct: number | null;
  averageMaxFavorablePct: number | null;
}

export interface ValidationGate {
  name: string;
  value: number | null;
  rule: string;
  passed: boolean;
}

export interface ValidationWindow {
  label: "RESEARCH" | "OOS" | "VAULT";
  startAt: string | null;
  endAt: string | null;
  metrics: ValidationMetrics;
  gates: ValidationGate[];
  passed: boolean;
}

export interface WalkForwardFold {
  index: number;
  startAt: string | null;
  endAt: string | null;
  metrics: ValidationMetrics;
  passed: boolean;
}

export interface StrategyValidationReport {
  version: "strategy-validation-v1";
  authority: "SHADOW_ONLY";
  liveOrderAuthority: false;
  status: StrategyValidationStatus;
  passesResearchGates: boolean;
  integrity: {
    passed: boolean;
    violations: string[];
  };
  split: {
    totalEpisodes: number;
    researchEpisodes: number;
    oosEpisodes: number;
    vaultEpisodes: number;
  };
  research: ValidationWindow;
  oos: ValidationWindow;
  vault: ValidationWindow;
  walkForward: {
    folds: WalkForwardFold[];
    passRate: number | null;
    passed: boolean;
  };
  regimeMetrics: Record<string, ValidationMetrics>;
  config: StrategyValidationConfig;
}

function mean(values: number[]): number | null {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
}

function median(values: number[]): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[middle]!
    : (sorted[middle - 1]! + sorted[middle]!) / 2;
}

function quantile(values: number[], q: number): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const position = (sorted.length - 1) * Math.max(0, Math.min(1, q));
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  if (lower === upper) return sorted[lower]!;
  const weight = position - lower;
  return sorted[lower]! * (1 - weight) + sorted[upper]! * weight;
}

function ms(value: string): number {
  return Date.parse(value);
}

function netReturnPct(episode: StrategyValidationEpisode): number {
  const feeBps = Number.isFinite(episode.feeBps) ? Math.max(0, episode.feeBps ?? 0) : 0;
  const slippageBps = Number.isFinite(episode.slippageBps) ? Math.max(0, episode.slippageBps ?? 0) : 0;
  const roundTripCostPct = 2 * (feeBps + slippageBps) / 100;
  return episode.grossReturnPct - roundTripCostPct;
}

function maxDrawdownPct(returnsPct: number[]): number | null {
  if (!returnsPct.length) return null;
  let equity = 1;
  let peak = 1;
  let maxDrawdown = 0;
  for (const value of returnsPct) {
    if (value <= -100) return 100;
    equity *= 1 + value / 100;
    peak = Math.max(peak, equity);
    if (peak > 0) maxDrawdown = Math.max(maxDrawdown, (1 - equity / peak) * 100);
  }
  return maxDrawdown;
}

export function calculateValidationMetrics(episodes: StrategyValidationEpisode[]): ValidationMetrics {
  const returns = episodes.map(netReturnPct).filter(Number.isFinite);
  const average = mean(returns);
  let tStat: number | null = null;
  if (returns.length > 1 && average != null) {
    const variance = returns.reduce((sum, value) => sum + (value - average) ** 2, 0) / (returns.length - 1);
    const std = Math.sqrt(variance);
    if (std > 0) tStat = average / (std / Math.sqrt(returns.length));
  }

  const wins = returns.filter((value) => value > 0);
  const losses = returns.filter((value) => value < 0);
  const grossWin = wins.reduce((sum, value) => sum + value, 0);
  const grossLoss = Math.abs(losses.reduce((sum, value) => sum + value, 0));
  const matched = episodes.filter((episode) => Number.isFinite(episode.benchmarkReturnPct));
  const excess = matched.map((episode) => netReturnPct(episode) - Number(episode.benchmarkReturnPct));
  const mae = episodes.map((episode) => episode.maxAdversePct).filter((value): value is number => Number.isFinite(value));
  const mfe = episodes.map((episode) => episode.maxFavorablePct).filter((value): value is number => Number.isFinite(value));

  return {
    episodes: episodes.length,
    averageNetReturnPct: average,
    medianNetReturnPct: median(returns),
    p10NetReturnPct: quantile(returns, 0.10),
    hitRate: returns.length ? wins.length / returns.length : null,
    profitFactor: losses.length ? grossWin / grossLoss : null,
    tStat,
    maxDrawdownPct: maxDrawdownPct(returns),
    benchmarkCoverage: episodes.length ? matched.length / episodes.length : null,
    averageExcessVsBenchmarkPct: mean(excess),
    averageMaxAdversePct: mean(mae),
    averageMaxFavorablePct: mean(mfe),
  };
}

function integrityViolations(episodes: StrategyValidationEpisode[]): string[] {
  const violations: string[] = [];
  const ids = new Set<string>();
  for (const episode of episodes) {
    if (!episode.id || ids.has(episode.id)) violations.push("duplicate_or_missing_episode_id:" + (episode.id || "missing"));
    ids.add(episode.id);
    const decision = ms(episode.decisionAt);
    const feature = ms(episode.featureMaxAt);
    const evaluated = ms(episode.evaluatedAt);
    if (![decision, feature, evaluated].every(Number.isFinite)) {
      violations.push("invalid_timestamp:" + episode.id);
      continue;
    }
    if (feature > decision) violations.push("lookahead_feature_after_decision:" + episode.id);
    if (evaluated < decision) violations.push("outcome_before_decision:" + episode.id);
    if (!Number.isFinite(episode.grossReturnPct)) violations.push("non_finite_return:" + episode.id);
    if ((episode.feeBps ?? 0) < 0 || (episode.slippageBps ?? 0) < 0) violations.push("negative_cost_assumption:" + episode.id);
  }
  return violations;
}

function validateConfig(config: StrategyValidationConfig): void {
  const total = config.researchFraction + config.oosFraction + config.vaultFraction;
  if (Math.abs(total - 1) > 1e-9) throw new Error("strategy validation split fractions must sum to 1");
  if ([config.researchFraction, config.oosFraction, config.vaultFraction].some((value) => value <= 0)) {
    throw new Error("strategy validation split fractions must be positive");
  }
}

function splitChronologically(episodes: StrategyValidationEpisode[], config: StrategyValidationConfig) {
  const ordered = [...episodes].sort((a, b) => ms(a.decisionAt) - ms(b.decisionAt) || a.id.localeCompare(b.id));
  const researchEnd = Math.floor(ordered.length * config.researchFraction);
  const vaultCount = Math.floor(ordered.length * config.vaultFraction);
  const vaultStart = Math.max(researchEnd, ordered.length - vaultCount);
  return {
    research: ordered.slice(0, researchEnd),
    oos: ordered.slice(researchEnd, vaultStart),
    vault: ordered.slice(vaultStart),
  };
}

function gatesFor(metrics: ValidationMetrics, minEpisodes: number, config: StrategyValidationConfig): ValidationGate[] {
  const noLossesWithPositiveEdge = metrics.profitFactor == null && (metrics.averageNetReturnPct ?? 0) > 0;
  const profitFactorPass = noLossesWithPositiveEdge || (metrics.profitFactor != null && metrics.profitFactor >= config.minProfitFactor);
  return [
    { name: "sample_size", value: metrics.episodes, rule: ">=" + minEpisodes, passed: metrics.episodes >= minEpisodes },
    { name: "mean_net_return", value: metrics.averageNetReturnPct, rule: ">" + config.minMeanNetReturnPct, passed: (metrics.averageNetReturnPct ?? -Infinity) > config.minMeanNetReturnPct },
    { name: "median_net_return", value: metrics.medianNetReturnPct, rule: ">=" + config.minMedianNetReturnPct, passed: (metrics.medianNetReturnPct ?? -Infinity) >= config.minMedianNetReturnPct },
    { name: "hit_rate", value: metrics.hitRate, rule: ">=" + config.minHitRate, passed: (metrics.hitRate ?? -Infinity) >= config.minHitRate },
    { name: "profit_factor", value: metrics.profitFactor, rule: ">=" + config.minProfitFactor + " (or no losses with positive mean)", passed: profitFactorPass },
    { name: "max_drawdown_pct", value: metrics.maxDrawdownPct, rule: "<=" + config.maxDrawdownPct, passed: (metrics.maxDrawdownPct ?? Infinity) <= config.maxDrawdownPct },
    { name: "benchmark_coverage", value: metrics.benchmarkCoverage, rule: ">=" + config.minBenchmarkCoverage, passed: (metrics.benchmarkCoverage ?? -Infinity) >= config.minBenchmarkCoverage },
    { name: "excess_vs_benchmark", value: metrics.averageExcessVsBenchmarkPct, rule: ">0", passed: (metrics.averageExcessVsBenchmarkPct ?? -Infinity) > 0 },
  ];
}

function window(label: ValidationWindow["label"], episodes: StrategyValidationEpisode[], minEpisodes: number, config: StrategyValidationConfig): ValidationWindow {
  const metrics = calculateValidationMetrics(episodes);
  const gates = label === "RESEARCH" ? [] : gatesFor(metrics, minEpisodes, config);
  return {
    label,
    startAt: episodes[0]?.decisionAt ?? null,
    endAt: episodes.at(-1)?.decisionAt ?? null,
    metrics,
    gates,
    passed: label === "RESEARCH" ? true : gates.every((gate) => gate.passed),
  };
}

function walkForward(oos: StrategyValidationEpisode[], config: StrategyValidationConfig) {
  if (oos.length < 15) return { folds: [] as WalkForwardFold[], passRate: null, passed: false };
  const folds: WalkForwardFold[] = [];
  const foldCount = 3;
  for (let index = 0; index < foldCount; index += 1) {
    const start = Math.floor(index * oos.length / foldCount);
    const end = Math.floor((index + 1) * oos.length / foldCount);
    const slice = oos.slice(start, end);
    const metrics = calculateValidationMetrics(slice);
    const benchmarkOk = (metrics.benchmarkCoverage ?? 0) >= config.minBenchmarkCoverage
      && (metrics.averageExcessVsBenchmarkPct ?? -Infinity) > 0;
    const passed = (metrics.averageNetReturnPct ?? -Infinity) > config.minMeanNetReturnPct
      && (metrics.maxDrawdownPct ?? Infinity) <= config.maxDrawdownPct
      && benchmarkOk;
    folds.push({
      index: index + 1,
      startAt: slice[0]?.decisionAt ?? null,
      endAt: slice.at(-1)?.decisionAt ?? null,
      metrics,
      passed,
    });
  }
  const passRate = folds.filter((fold) => fold.passed).length / folds.length;
  return { folds, passRate, passed: passRate >= config.minWalkForwardPassRate };
}

function regimeMetrics(episodes: StrategyValidationEpisode[]): Record<string, ValidationMetrics> {
  const groups = new Map<string, StrategyValidationEpisode[]>();
  for (const episode of episodes) {
    const key = (episode.regime || "UNKNOWN").trim() || "UNKNOWN";
    const current = groups.get(key) ?? [];
    current.push(episode);
    groups.set(key, current);
  }
  return Object.fromEntries(
    [...groups.entries()]
      .filter(([, values]) => values.length >= 5)
      .map(([key, values]) => [key, calculateValidationMetrics(values)]),
  );
}

export function validateStrategyEpisodes(
  episodes: StrategyValidationEpisode[],
  override: Partial<StrategyValidationConfig> = {},
): StrategyValidationReport {
  const config = { ...DEFAULT_STRATEGY_VALIDATION_CONFIG, ...override };
  validateConfig(config);
  const violations = integrityViolations(episodes);
  const split = splitChronologically(episodes, config);
  const research = window("RESEARCH", split.research, 0, config);
  const oos = window("OOS", split.oos, config.minOosEpisodes, config);
  const vault = window("VAULT", split.vault, config.minVaultEpisodes, config);
  const wf = walkForward(split.oos, config);

  let status: StrategyValidationStatus;
  if (violations.length) status = "LEAKAGE_REJECTED";
  else if (split.oos.length < config.minOosEpisodes || split.vault.length < config.minVaultEpisodes) status = "INSUFFICIENT_DATA";
  else if (!oos.passed) status = "FAILED_OOS";
  else if (!wf.passed) status = "FAILED_WALK_FORWARD";
  else if (!vault.passed) status = "FAILED_VAULT";
  else status = "SHADOW_VALIDATED";

  return {
    version: "strategy-validation-v1",
    authority: "SHADOW_ONLY",
    liveOrderAuthority: false,
    status,
    passesResearchGates: status === "SHADOW_VALIDATED",
    integrity: { passed: violations.length === 0, violations },
    split: {
      totalEpisodes: episodes.length,
      researchEpisodes: split.research.length,
      oosEpisodes: split.oos.length,
      vaultEpisodes: split.vault.length,
    },
    research,
    oos,
    vault,
    walkForward: wf,
    regimeMetrics: regimeMetrics(episodes),
    config,
  };
}
