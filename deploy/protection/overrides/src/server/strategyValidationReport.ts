import type { DecisionOutcomeRecord, OutcomeHorizon } from "./outcomeMemory.js";
import {
  validateStrategyEpisodes,
  type StrategyValidationEpisode,
  type StrategyValidationReport,
} from "../strategy21/research/strategyValidation.js";
import { fileURLToPath } from "node:url";
import { loadRegistry, statusLabel } from "./policy/zobirisPolicyBinding.js";
import type { StrategyStatisticalEvidence } from "./researchProvenance.js";

const VALIDATION_POLICY_REGISTRY = (() => {
  try {
    return loadRegistry(fileURLToPath(new URL("./policy/zobiris-policy-registry-v3.1.json", import.meta.url)));
  } catch {
    return null;
  }
})();

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
  statisticalEvidenceByTag?: Record<string, StrategyStatisticalEvidence>;
}

export interface StatisticalCertificationView {
  requiredForCertifiedShadow: true;
  authority: "SHADOW_ONLY_NO_TRADING_AUTHORITY";
  source: StrategyStatisticalEvidence["source"] | "UNAVAILABLE";
  status: "PASS" | "FAIL" | "WATCH" | "UNKNOWN";
  mappingStatus: "MAPPED" | "UNMAPPED" | "AMBIGUOUS";
  familyId: string | null;
  provenanceComplete: boolean;
  eligibleValidations: number;
  dsr: StrategyStatisticalEvidence["dsr"] | null;
  pbo: StrategyStatisticalEvidence["pbo"] | null;
  cpcv: StrategyStatisticalEvidence["cpcv"] | null;
  reasons: string[];
}

function statisticalCertificationFor(
  strategyTag: string,
  evidence?: StrategyStatisticalEvidence,
): StatisticalCertificationView {
  if (!evidence) {
    return {
      requiredForCertifiedShadow: true,
      authority: "SHADOW_ONLY_NO_TRADING_AUTHORITY",
      source: "UNAVAILABLE",
      status: "UNKNOWN",
      mappingStatus: "UNMAPPED",
      familyId: null,
      provenanceComplete: false,
      eligibleValidations: 0,
      dsr: null,
      pbo: null,
      cpcv: null,
      reasons: [`No persisted DSR/PBO family mapping is available for ${strategyTag}; certification fails closed.`],
    };
  }
  return {
    requiredForCertifiedShadow: true,
    authority: evidence.authority,
    source: evidence.source,
    status: evidence.gate.status,
    mappingStatus: evidence.mapping.status,
    familyId: evidence.mapping.familyId,
    provenanceComplete: evidence.provenanceComplete,
    eligibleValidations: evidence.eligibleValidations,
    dsr: evidence.dsr,
    pbo: evidence.pbo,
    cpcv: evidence.cpcv,
    reasons: evidence.gate.reasons,
  };
}

function applyStatisticalCertification(
  report: StrategyValidationReport,
  statistical: StatisticalCertificationView,
): StrategyValidationReport {
  const base = report.certification;
  if (base.classification !== "CERTIFIED_SHADOW") return report;

  let classification: typeof base.classification | "INSUFFICIENT_DATA" | "REJECTED" = base.classification;
  const reasons = [...base.reasons];
  if (statistical.status === "FAIL") {
    classification = "REJECTED";
    reasons.push("Mapped DSR/PBO evidence fails the preregistered statistical thresholds.");
  } else if (
    statistical.status !== "PASS"
    || statistical.mappingStatus !== "MAPPED"
    || !statistical.provenanceComplete
  ) {
    classification = "INSUFFICIENT_DATA";
    reasons.push("Mapped, provenance-complete DSR/PBO evidence is required before CERTIFIED_SHADOW.");
  }

  return {
    ...report,
    certification: {
      ...base,
      classification,
      stable: classification === "CERTIFIED_SHADOW",
      reasons: [...new Set(reasons)],
    },
  };
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
  const feePolicy = VALIDATION_POLICY_REGISTRY?.registry.feeSchedule?.sidecarPolicyProposed ?? null;
  // The validation default is the Tier-1 maker/taker round trip (120 bps).
  // This adapter stores costs as a symmetric per-side assumption, so 60 bps
  // per side is the conservative arithmetic equivalent. Callers may override
  // it for sensitivity analysis, but zero cost is never the implicit default.
  const defaultValidationFeeBpsPerSide = feePolicy
    ? (Number(feePolicy.makerBps) + Number(feePolicy.takerBps)) / 2
    : 60;
  const feeBps = Number.isFinite(options.feeBps)
    ? Math.max(0, options.feeBps ?? defaultValidationFeeBpsPerSide)
    : defaultValidationFeeBpsPerSide;
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
    report: StrategyValidationReport & { evidenceClass: string; statusLabel?: string };
  }> = [];
  for (const strategyTag of tags) {
    const episodes = eligible
      .filter((record) => record.strategyTag === strategyTag)
      .map((record) => toEpisode(record, horizon, feeBps, slippageBps))
      .filter((episode): episode is StrategyValidationEpisode => episode != null);
    const baseReport = validateStrategyEpisodes(episodes);
    const statisticalCertification = statisticalCertificationFor(
      strategyTag,
      options.statisticalEvidenceByTag?.[strategyTag],
    );
    const report = applyStatisticalCertification(baseReport, statisticalCertification);
    const classification = report.certification.classification ?? report.status;
    reports.push({
      strategyTag,
      resolvedEpisodes: episodes.length,
      report: {
        ...report,
        evidenceClass: "QUOTE_OUTCOME_ONLY",
        statusLabel: statusLabel(String(classification), "QUOTE_OUTCOME_ONLY"),
        statisticalCertification,
      } as StrategyValidationReport & { evidenceClass: string; statusLabel?: string; statisticalCertification: StatisticalCertificationView },
    });
  }

  return {
    version: "outcome-validation-lab-v1",
    authority: "SHADOW_ONLY",
    liveOrderAuthority: false,
    evidenceClass: "QUOTE_OUTCOME_ONLY",
    registryVersion: VALIDATION_POLICY_REGISTRY?.registryVersion ?? null,
    policyHash: VALIDATION_POLICY_REGISTRY?.registrySha256 ?? null,
    source: "forward outcome memory",
    horizon,
    symbol: symbol ?? null,
    strategyTag: options.strategyTag ?? null,
    costAssumptions: {
      feeScheduleVersion: VALIDATION_POLICY_REGISTRY?.registry.feeSchedule?.scheduleId ?? null,
      accountFeeTierAssumption: feePolicy?.accountFeeTierAssumption ?? "TIER_1_UNKNOWN_ACCOUNT_TIER",
      selectedPath: "MAKER_TAKER",
      feeBpsPerSide: feeBps,
      slippageBpsPerSide: slippageBps,
      roundTripFeeBpsByPath: feePolicy ? {
        MAKER_MAKER: Number(feePolicy.makerBps) * 2,
        MAKER_TAKER: Number(feePolicy.makerBps) + Number(feePolicy.takerBps),
        TAKER_TAKER: Number(feePolicy.takerBps) * 2,
      } : { MAKER_MAKER: 80, MAKER_TAKER: 120, TAKER_TAKER: 160 },
      source: "MODELED_ASSUMPTION",
      referenceTier1MakerBps: feePolicy ? Number(feePolicy.makerBps) : 40,
      referenceTier1TakerBps: feePolicy ? Number(feePolicy.takerBps) : 80,
      note: options.feeBps === undefined
        ? "Default validation arithmetic uses the Tier-1 MAKER_TAKER round trip (120 bps; represented as 60 bps per side). Slippage remains a separate modeled assumption."
        : "fee/slippage are caller-supplied research assumptions only; outcome memory does not prove executable fills",
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
      "CERTIFIED_SHADOW requires temporal/OOS/vault/stress gates plus an exact persisted strategy-family mapping whose DSR and PBO both pass. Missing or ambiguous statistical provenance fails closed.",
      "DSR/PBO evidence is shadow-only and may only preserve or demote certification; it can never create live trading or order authority.",
      "Modeled execution costs are not executable-fill evidence; Kraken L2/fill reconciliation remains a separate required gate.",
    ],
  };
}
