export const DELAYED_ROTATION_MODE = "DELAYED_ROTATION_PILOT_V1" as const;
export type RecommendationMode = "LEGACY" | typeof DELAYED_ROTATION_MODE;

export type DelayedRotationStatus =
  | "QUALIFIED"
  | "NEAR_ROTATION"
  | "TOO_EARLY"
  | "EXTENDED"
  | "STRUCTURALLY_WEAK"
  | "NOT_LAGGING"
  | "MARKET_NOT_BULLISH"
  | "DATA_INSUFFICIENT"
  | "BENCHMARK";

export type DelayedRotationResearchState =
  | "ROTATION_CONFIRMED"
  | "ROTATION_FORMING"
  | "LAGGARD_UNCONFIRMED"
  | "VALUE_TRAP"
  | "ALREADY_CAUGHT_UP";

export interface RotationEvidenceClaim {
  symbol: string;
  claim?: string;
  observedAt?: string;
  receivedAt?: string;
  providerIds?: string[];
  source?: string;
}

export interface RotationMarketRow {
  symbol: string;
  observedAt: string;
  priceUsd: number | null;
  change24hPct: number;
  change7dPct: number;
  change30dPct: number;
  change90dPct: number;
  marketCapUsd: number | null;
  volume24hUsd: number | null;
  priorCompletedDailyVolumesUsd: number[] | null;
}

export interface DelayedRotationSnapshotDiagnostics {
  nBaseCohort: number;
  recoveryCount: number;
  descriptivePullbackCount: number;
  prospectivePullbackCount: number;
  deepPullbackCount: number;
  rsa7_30Pass: number;
  rsa30_90Pass: number;
  rsa30_90Degenerate: boolean;
  volumeAccelAvailableCount: number;
}

export interface DelayedRotationCalibration {
  mode: typeof DELAYED_ROTATION_MODE;
  marketStatus: "BULLISH" | "NOT_BULLISH" | "INSUFFICIENT_DATA";
  marketBullish: boolean;
  sampleSize: number;
  btc: {
    change7dPct: number | null;
    change30dPct: number | null;
    change90dPct: number | null;
  };
  breadth7dPositive: number | null;
  breadth30dPositive: number | null;
  thresholds: {
    minBreadth7dPositive: number;
    minBreadth30dPositive: number;
    maxRecovery7dPct: number;
    minChange30dPct: number;
    maxChange30dPct: number;
    minChange90dPct: number;
    maxChange90dPct: number;
    maxPositive24hPct: number;
  };
  verifiedBaseFilters: {
    maxRelative90dVsBtcPct: number;
    minChange30dPctExclusive: number;
    minChange90dPctExclusive: number;
    minTurnoverRatio: number;
    minControlledPullback7dPct: number;
    maxRecovery7dPct: number;
    volumeAccelResearchPrior: number;
  };
  diagnostics: DelayedRotationSnapshotDiagnostics;
  volumeAccelMedianLog: number | null;
  evidenceAuthority: "RESEARCH_PRIOR_ONLY";
  prospectiveValidationStart: "2026-10-05";
}

export interface DelayedRotationProfile {
  mode: typeof DELAYED_ROTATION_MODE;
  status: DelayedRotationStatus;
  researchState: DelayedRotationResearchState;
  qualifiesForNewCapital: boolean;
  score: number;
  scoreLabel: "RESEARCH_PRIOR_SCORE";
  validatedAlpha: false;
  evidenceAuthority: "RESEARCH_PRIOR_ONLY";
  prospectiveValidationStart: "2026-10-05";
  symbol: string;
  observedAt: string | null;
  priceUsd: number | null;
  change24hPct: number | null;
  change7dPct: number | null;
  change30dPct: number | null;
  change90dPct: number | null;
  relative30dVsBtcPct: number | null;
  relative90dVsBtcPct: number | null;
  logRelative7dVsBtc: number | null;
  logRelative30dVsBtc: number | null;
  logRelative90dVsBtc: number | null;
  rsa7_30: number | null;
  rsa30_90: number | null;
  rsa30_90DiagnosticOnly: true;
  volumeToMarketCap: number | null;
  volumeAccel: number | null;
  relativeVolumeAccelLog: number | null;
  volumeEvidenceStatus: "AVAILABLE" | "UNAVAILABLE";
  verifiedBaseFilterPassed: boolean;
  recommendedPullbackPct: number | null;
  reasonCodes: string[];
}

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const finite = (value: unknown): number | null => {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};
const ratio = (count: number, total: number) => total > 0 ? count / total : null;
const mean = (values: number[]) => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
const median = (values: number[]) => {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle]! : (sorted[middle - 1]! + sorted[middle]!) / 2;
};
const logReturn = (pct: number) => Math.log1p(pct / 100);

function isCmc(claim: RotationEvidenceClaim): boolean {
  return (claim.providerIds ?? []).some((id) => id.toLowerCase() === "cmc")
    || /(^|\s)cmc(\s|$)|coinmarketcap/i.test(claim.source ?? "");
}

function parseVolumeHistory(payload: any): number[] | null {
  const candidate = payload?.priorCompletedDailyVolumesUsd
    ?? payload?.prior_7_complete_daily_volumes_usd
    ?? payload?.priorDailyVolumesUsd
    ?? payload?.volumeHistoryDailyUsd;
  if (!Array.isArray(candidate)) return null;
  const values = candidate.map(finite).filter((value): value is number => value !== null && value >= 0);
  return values.length >= 7 ? values.slice(-7) : null;
}

function parseMarketRow(claim: RotationEvidenceClaim): RotationMarketRow | null {
  if (!isCmc(claim) || !claim.claim) return null;
  let payload: any;
  try { payload = JSON.parse(claim.claim); } catch { return null; }
  const symbol = String(payload?.symbol ?? claim.symbol ?? "").toUpperCase();
  const change24hPct = finite(payload?.change24hPct ?? payload?.percent_change_24h);
  const change7dPct = finite(payload?.change7dPct ?? payload?.percent_change_7d);
  const change30dPct = finite(payload?.change30dPct ?? payload?.percent_change_30d);
  const change90dPct = finite(payload?.change90dPct ?? payload?.percent_change_90d);
  if (!symbol || [change24hPct, change7dPct, change30dPct, change90dPct].some((value) => value === null)) return null;
  const observedAt = claim.observedAt ?? claim.receivedAt ?? "";
  return {
    symbol,
    observedAt,
    priceUsd: finite(payload?.priceUsd ?? payload?.price),
    change24hPct: change24hPct!,
    change7dPct: change7dPct!,
    change30dPct: change30dPct!,
    change90dPct: change90dPct!,
    marketCapUsd: finite(payload?.marketCapUsd ?? payload?.market_cap),
    volume24hUsd: finite(payload?.volume24hUsd ?? payload?.volume_24h),
    priorCompletedDailyVolumesUsd: parseVolumeHistory(payload),
  };
}

export function extractLatestRotationRows(claims: RotationEvidenceClaim[]): Map<string, RotationMarketRow> {
  const rows = new Map<string, RotationMarketRow>();
  for (const claim of claims) {
    const row = parseMarketRow(claim);
    if (!row) continue;
    const prior = rows.get(row.symbol);
    const priorTime = Date.parse(prior?.observedAt ?? "");
    const nextTime = Date.parse(row.observedAt);
    if (!prior || !Number.isFinite(priorTime) || (Number.isFinite(nextTime) && nextTime >= priorTime)) rows.set(row.symbol, row);
  }
  return rows;
}

export function computeVolumeAccel(row: RotationMarketRow): number | null {
  if (row.volume24hUsd == null || !row.priorCompletedDailyVolumesUsd || row.priorCompletedDailyVolumesUsd.length < 7) return null;
  const baseline = mean(row.priorCompletedDailyVolumesUsd.slice(-7));
  if (baseline == null || baseline <= 0) return null;
  return row.volume24hUsd / baseline;
}

function logRelative(rowChangePct: number, btcChangePct: number): number {
  return logReturn(rowChangePct) - logReturn(btcChangePct);
}

function rsa(row: RotationMarketRow, btc: RotationMarketRow) {
  const xr7 = logRelative(row.change7dPct, btc.change7dPct);
  const xr30 = logRelative(row.change30dPct, btc.change30dPct);
  const xr90 = logRelative(row.change90dPct, btc.change90dPct);
  return {
    xr7,
    xr30,
    xr90,
    rsa7_30: xr7 / 7 - xr30 / 30,
    rsa30_90: xr30 / 30 - xr90 / 90,
  };
}

function turnover(row: RotationMarketRow): number | null {
  return row.marketCapUsd && row.volume24hUsd != null && row.marketCapUsd > 0 ? row.volume24hUsd / row.marketCapUsd : null;
}

function passesVerifiedBase(row: RotationMarketRow, btc: RotationMarketRow): boolean {
  const t = turnover(row);
  return row.change90dPct - btc.change90dPct <= -20
    && row.change30dPct > 0
    && row.change90dPct > -35
    && t != null
    && t >= 0.002;
}

export function calibrateDelayedRotationMarket(claims: RotationEvidenceClaim[]): DelayedRotationCalibration {
  const rows = [...extractLatestRotationRows(claims).values()];
  const btc = rows.find((row) => row.symbol === "BTC");
  const comparable = rows.filter((row) => row.symbol !== "BTC");
  const breadth7dPositive = ratio(comparable.filter((row) => row.change7dPct > 0).length, comparable.length);
  const breadth30dPositive = ratio(comparable.filter((row) => row.change30dPct > 0).length, comparable.length);
  const enoughData = comparable.length >= 10 && btc != null && breadth7dPositive != null && breadth30dPositive != null;
  const marketBullish = Boolean(enoughData
    && btc!.change30dPct > 0
    && btc!.change90dPct > 0
    && breadth7dPositive! >= 0.40
    && breadth30dPositive! >= 0.45);

  const base = btc ? comparable.filter((row) => passesVerifiedBase(row, btc)) : [];
  let rsa7_30Pass = 0;
  let rsa30_90Pass = 0;
  if (btc) {
    for (const row of base) {
      const values = rsa(row, btc);
      if (values.rsa7_30 > 0) rsa7_30Pass += 1;
      if (values.rsa30_90 > 0) rsa30_90Pass += 1;
    }
  }
  const volumeLogs = comparable
    .map(computeVolumeAccel)
    .filter((value): value is number => value != null && value > 0)
    .map((value) => Math.log(value));

  return {
    mode: DELAYED_ROTATION_MODE,
    marketStatus: !enoughData ? "INSUFFICIENT_DATA" : marketBullish ? "BULLISH" : "NOT_BULLISH",
    marketBullish,
    sampleSize: comparable.length,
    btc: {
      change7dPct: btc?.change7dPct ?? null,
      change30dPct: btc?.change30dPct ?? null,
      change90dPct: btc?.change90dPct ?? null,
    },
    breadth7dPositive,
    breadth30dPositive,
    thresholds: {
      minBreadth7dPositive: 0.40,
      minBreadth30dPositive: 0.45,
      maxRecovery7dPct: 12,
      minChange30dPct: -35,
      maxChange30dPct: 45,
      minChange90dPct: -70,
      maxChange90dPct: 55,
      maxPositive24hPct: 8,
    },
    verifiedBaseFilters: {
      maxRelative90dVsBtcPct: -20,
      minChange30dPctExclusive: 0,
      minChange90dPctExclusive: -35,
      minTurnoverRatio: 0.002,
      minControlledPullback7dPct: -8,
      maxRecovery7dPct: 12,
      volumeAccelResearchPrior: 1.15,
    },
    diagnostics: {
      nBaseCohort: base.length,
      recoveryCount: base.filter((row) => row.change7dPct > 0 && row.change7dPct <= 12).length,
      descriptivePullbackCount: base.filter((row) => row.change7dPct < 0).length,
      prospectivePullbackCount: base.filter((row) => row.change7dPct >= -8 && row.change7dPct < 0).length,
      deepPullbackCount: base.filter((row) => row.change7dPct < -8).length,
      rsa7_30Pass,
      rsa30_90Pass,
      rsa30_90Degenerate: base.length > 0 && rsa30_90Pass / base.length >= 0.95,
      volumeAccelAvailableCount: volumeLogs.length,
    },
    volumeAccelMedianLog: median(volumeLogs),
    evidenceAuthority: "RESEARCH_PRIOR_ONLY",
    prospectiveValidationStart: "2026-10-05",
  };
}

function lagScore(relative90: number): number {
  return clamp((-relative90 - 20) / 30, 0, 1);
}

function recoveryScore(change7dPct: number): number {
  if (change7dPct <= 0 || change7dPct > 12) return 0;
  return clamp(1 - Math.abs(change7dPct - 5) / 7, 0, 1);
}

export function evaluateDelayedRotation(
  symbolInput: string,
  claims: RotationEvidenceClaim[],
  calibration = calibrateDelayedRotationMarket(claims),
): DelayedRotationProfile {
  const symbol = symbolInput.toUpperCase();
  const rows = extractLatestRotationRows(claims);
  const row = rows.get(symbol);
  const btc = rows.get("BTC");

  const build = (
    status: DelayedRotationStatus,
    researchState: DelayedRotationResearchState,
    reasons: string[],
  ): DelayedRotationProfile => {
    const relative30 = row && btc ? row.change30dPct - btc.change30dPct : null;
    const relative90 = row && btc ? row.change90dPct - btc.change90dPct : null;
    const t = row ? turnover(row) : null;
    const v = row ? computeVolumeAccel(row) : null;
    const relativeV = v != null && v > 0 && calibration.volumeAccelMedianLog != null
      ? Math.log(v) - calibration.volumeAccelMedianLog
      : null;
    const rel = row && btc ? rsa(row, btc) : null;
    const basePassed = Boolean(row && btc && passesVerifiedBase(row, btc));

    let score = 0;
    if (row && btc && relative90 != null) {
      const lag = lagScore(relative90);
      const recovery = recoveryScore(row.change7dPct);
      const rsaScore = rel == null ? 0.5 : rel.rsa7_30 > 0 ? 1 : 0.35;
      const entry = clamp(1 - Math.max(0, row.change24hPct) / 8, 0, 1);
      const turnoverScore = t == null ? 0 : clamp(t / 0.08, 0, 1);
      const volumeScore = v == null ? 0.5 : clamp(v / calibration.verifiedBaseFilters.volumeAccelResearchPrior, 0, 1);
      score = Math.round((30 * lag + 25 * recovery + 15 * rsaScore + 15 * entry + 10 * turnoverScore + 5 * volumeScore) * 100) / 100;
    }

    return {
      mode: DELAYED_ROTATION_MODE,
      status,
      researchState,
      qualifiesForNewCapital: false,
      score,
      scoreLabel: "RESEARCH_PRIOR_SCORE",
      validatedAlpha: false,
      evidenceAuthority: "RESEARCH_PRIOR_ONLY",
      prospectiveValidationStart: "2026-10-05",
      symbol,
      observedAt: row?.observedAt ?? null,
      priceUsd: row?.priceUsd ?? null,
      change24hPct: row?.change24hPct ?? null,
      change7dPct: row?.change7dPct ?? null,
      change30dPct: row?.change30dPct ?? null,
      change90dPct: row?.change90dPct ?? null,
      relative30dVsBtcPct: relative30,
      relative90dVsBtcPct: relative90,
      logRelative7dVsBtc: rel?.xr7 ?? null,
      logRelative30dVsBtc: rel?.xr30 ?? null,
      logRelative90dVsBtc: rel?.xr90 ?? null,
      rsa7_30: rel?.rsa7_30 ?? null,
      rsa30_90: rel?.rsa30_90 ?? null,
      rsa30_90DiagnosticOnly: true,
      volumeToMarketCap: t,
      volumeAccel: v,
      relativeVolumeAccelLog: relativeV,
      volumeEvidenceStatus: v == null ? "UNAVAILABLE" : "AVAILABLE",
      verifiedBaseFilterPassed: basePassed,
      recommendedPullbackPct: null,
      reasonCodes: reasons,
    };
  };

  if (symbol === "BTC") return build("BENCHMARK", "ALREADY_CAUGHT_UP", ["btc_is_market_benchmark"]);
  if (!row || !btc) return build("DATA_INSUFFICIENT", "LAGGARD_UNCONFIRMED", ["cmc_7d_30d_90d_history_missing"]);
  if (calibration.marketStatus === "INSUFFICIENT_DATA") return build("DATA_INSUFFICIENT", "LAGGARD_UNCONFIRMED", ["watchlist_breadth_or_btc_history_missing"]);
  if (!calibration.marketBullish) return build("MARKET_NOT_BULLISH", "LAGGARD_UNCONFIRMED", ["btc_and_watchlist_breadth_not_bullish"]);

  const relative90 = row.change90dPct - btc.change90dPct;
  const t = turnover(row);

  if (row.change90dPct <= calibration.verifiedBaseFilters.minChange90dPctExclusive) {
    return build("STRUCTURALLY_WEAK", "VALUE_TRAP", ["90d_loss_breaches_verified_structural_floor"]);
  }
  if (relative90 > calibration.verifiedBaseFilters.maxRelative90dVsBtcPct) {
    return build("NOT_LAGGING", "ALREADY_CAUGHT_UP", ["90d_btc_relative_lag_below_required_20pp"]);
  }
  if (t == null) return build("DATA_INSUFFICIENT", "LAGGARD_UNCONFIRMED", ["turnover_unavailable"]);
  if (t < calibration.verifiedBaseFilters.minTurnoverRatio) {
    return build("TOO_EARLY", "LAGGARD_UNCONFIRMED", ["turnover_below_permissive_research_floor", "turnover_is_not_execution_liquidity"]);
  }
  if (row.change30dPct <= calibration.verifiedBaseFilters.minChange30dPctExclusive) {
    return build("TOO_EARLY", "LAGGARD_UNCONFIRMED", ["30d_recovery_not_positive"]);
  }
  if (row.change7dPct > calibration.verifiedBaseFilters.maxRecovery7dPct || row.change24hPct > calibration.thresholds.maxPositive24hPct) {
    const result = build("EXTENDED", "ROTATION_CONFIRMED", ["rotation_present_but_current_entry_is_extended", "do_not_chase"]);
    result.recommendedPullbackPct = Math.round(clamp(4 + Math.max(0, row.change7dPct) * 0.15, 4, 8) * 100) / 100;
    return result;
  }
  if (row.change7dPct > 0) {
    const result = build("QUALIFIED", "ROTATION_CONFIRMED", [
      "verified_90d_btc_relative_lag",
      "positive_30d_structure",
      "7d_recovery_confirmed",
      "research_prior_not_validated_alpha",
      ...(computeVolumeAccel(row) == null ? ["volume_acceleration_not_yet_available"] : []),
    ]);
    result.qualifiesForNewCapital = true;
    result.recommendedPullbackPct = Math.round(clamp(
      4 + Math.max(0, row.change7dPct) * 0.15 + (relative90 < -35 ? 0.5 : 0),
      4,
      8,
    ) * 100) / 100;
    return result;
  }
  if (row.change7dPct >= calibration.verifiedBaseFilters.minControlledPullback7dPct) {
    return build("NEAR_ROTATION", "ROTATION_FORMING", ["controlled_pullback_with_verified_base_lag", "await_positive_7d_recovery"]);
  }
  return build("TOO_EARLY", "LAGGARD_UNCONFIRMED", ["deep_pullback_below_prospective_minus_8pct_band"]);
}
