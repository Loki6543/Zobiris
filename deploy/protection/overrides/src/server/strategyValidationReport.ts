import type { DecisionOutcomeRecord, OutcomeHorizon } from "./outcomeMemory.js";
import {
  validateStrategyEpisodes,
  type StrategyValidationEpisode,
  type StrategyValidationReport,
} from "../strategy21/research/strategyValidation.js";

const VALID_HORIZONS: OutcomeHorizon[] = ["1H", "4H", "1D", "3D", "7D"];

export function isOutcomeHorizon(value: string): value is OutcomeHorizon {
  return VALID_HORIZONS.includes(value as OutcomeHorizon);
}

export interface OutcomeValidationLabOptions {
  horizon?: OutcomeHorizon;
  symbol?: string;
  strategyTag?: string;
  feeBps?: number;
  slippageBps?: number;
}

function toEpisode(
  record: DecisionOutcomeRecord,
  horizon: OutcomeHorizon,
  feeBps: number,
  slippageBps: number,
): StrategyValidationEpisode | null {
  const evaluation = record.evaluations.find(
    (item) => item.horizon === horizon && item.status === "RESOLVED" && item.returnPct != null,
  );
  if (!evaluation) return null;
  const grossReturnPct = evaluation.returnPct;
  if (grossReturnPct == null) return null;
  const evaluatedAt = evaluation.priceObservedAt ?? evaluation.evaluatedAt;
  if (!evaluatedAt) return null;
  return {
    id: record.outcomeId + ":" + horizon,
    symbol: record.symbol,
    decisionAt: record.generatedAt,
    featureMaxAt: record.referencePriceObservedAt ?? record.generatedAt,
    evaluatedAt,
    grossReturnPct,
    benchmarkReturnPct: evaluation.benchmarkReturnPct ?? null,
    feeBps,
    slippageBps,
    regime: record.regime ?? record.assetState,
    maxAdversePct: record.maxAdversePct,
    maxFavorablePct: record.maxFavorablePct,
  };
}

export function buildOutcomeValidationLab(
  records: DecisionOutcomeRecord[],
  options: OutcomeValidationLabOptions = {},
) {
  const horizon = options.horizon ?? "7D";
  const symbol = options.symbol?.trim().toUpperCase();
  const feeBps = Number.isFinite(options.feeBps) ? Math.max(0, options.feeBps ?? 0) : 0;
  const slippageBps = Number.isFinite(options.slippageBps) ? Math.max(0, options.slippageBps ?? 0) : 0;

  const eligible = records.filter((record) =>
    record.measurementVersion === "episodes-v2"
    && record.symbol !== "BTC"
    && record.strategyStatus === "QUALIFIED"
    && !!record.strategyTag
    && (!symbol || record.symbol === symbol)
    && (!options.strategyTag || record.strategyTag === options.strategyTag),
  );
  const tags = options.strategyTag
    ? [options.strategyTag]
    : [...new Set(eligible.map((record) => record.strategyTag!).filter(Boolean))].sort();

  const reports: Array<{
    strategyTag: string;
    resolvedEpisodes: number;
    report: StrategyValidationReport;
  }> = [];
  for (const strategyTag of tags) {
    const episodes = eligible
      .filter((record) => record.strategyTag === strategyTag)
      .map((record) => toEpisode(record, horizon, feeBps, slippageBps))
      .filter((episode): episode is StrategyValidationEpisode => episode != null);
    reports.push({
      strategyTag,
      resolvedEpisodes: episodes.length,
      report: validateStrategyEpisodes(episodes),
    });
  }

  return {
    version: "outcome-validation-lab-v1",
    authority: "SHADOW_ONLY",
    liveOrderAuthority: false,
    source: "forward outcome memory",
    horizon,
    symbol: symbol ?? null,
    strategyTag: options.strategyTag ?? null,
    costAssumptions: {
      feeBpsPerSide: feeBps,
      slippageBpsPerSide: slippageBps,
      source: "MODELED_ASSUMPTION",
      note: "fee/slippage are research assumptions only; outcome memory does not prove executable fills",
    },
    executionEvidence: {
      l2FillReconciled: false,
      queuePositionKnown: false,
      executableFillCertified: false,
      source: "MODELED_ASSUMPTION",
      requiredBeforeAnyLiveAuthority: true,
    },
    factorAudit: [
      {
        factor: "price",
        status: "POINT_IN_TIME_ENFORCED",
        usedInCertification: true,
        note: "persisted quote timestamps may not exceed decisionAt",
      },
      {
        factor: "macro",
        status: "BLOCKED_UNLESS_POINT_IN_TIME",
        usedInCertification: false,
        note: "latest/revised macro snapshots are not admitted into historical certification",
      },
      {
        factor: "news",
        status: "BLOCKED_UNLESS_POINT_IN_TIME",
        usedInCertification: false,
        note: "news/sentiment requires source publication and observation timestamps",
      },
      {
        factor: "onchain",
        status: "BLOCKED_UNLESS_POINT_IN_TIME",
        usedInCertification: false,
        note: "proxy order-book fields must never be mislabeled as genuine on-chain history",
      },
    ],
    candidateRecordCount: eligible.length,
    reports,
    limitations: [
      "Outcome-memory episodes are forward observations, not reconstructed historical order fills.",
      "The feature timestamp check uses the persisted reference quote timestamp; upstream feature provenance remains separately governed by research-integrity checks.",
      "A sampled limit touch is not a fill. This lab cannot estimate queue position or missed-fill regret without reconciled order/L2 evidence.",
      "Correlated crypto assets are not statistically independent; t-statistics are descriptive and are not promotion gates.",
      "CERTIFIED_SHADOW means validation plus stress certification passed. It never grants live trading or order authority.",
      "Modeled execution costs are not executable-fill evidence; Kraken L2/fill reconciliation remains a separate required gate.",
    ],
  };
}
