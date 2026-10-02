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
}

export interface DelayedRotationProfile {
  mode: typeof DELAYED_ROTATION_MODE;
  status: DelayedRotationStatus;
  qualifiesForNewCapital: boolean;
  score: number;
  symbol: string;
  observedAt: string | null;
  priceUsd: number | null;
  change24hPct: number | null;
  change7dPct: number | null;
  change30dPct: number | null;
  change90dPct: number | null;
  relative30dVsBtcPct: number | null;
  relative90dVsBtcPct: number | null;
  volumeToMarketCap: number | null;
  recommendedPullbackPct: number | null;
  reasonCodes: string[];
}

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const finite = (value: unknown): number | null => {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};
const ratio = (count: number, total: number) => total > 0 ? count / total : null;

function isCmc(claim: RotationEvidenceClaim): boolean {
  return (claim.providerIds ?? []).some((id) => id.toLowerCase() === "cmc")
    || /(^|\s)cmc(\s|$)|coinmarketcap/i.test(claim.source ?? "");
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
    && breadth7dPositive! >= 0.50
    && breadth30dPositive! >= 0.45);
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
      minBreadth7dPositive: 0.50,
      minBreadth30dPositive: 0.45,
      maxRecovery7dPct: 12,
      minChange30dPct: -35,
      maxChange30dPct: 0,
      minChange90dPct: -75,
      maxChange90dPct: 0,
      maxPositive24hPct: 8,
    },
  };
}

function lagQuality(change: number, ideal: number, span: number): number {
  return clamp(1 - Math.abs(change - ideal) / span, 0, 1);
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
  const empty = (status: DelayedRotationStatus, reasons: string[]): DelayedRotationProfile => ({
    mode: DELAYED_ROTATION_MODE,
    status,
    qualifiesForNewCapital: false,
    score: 0,
    symbol,
    observedAt: row?.observedAt ?? null,
    priceUsd: row?.priceUsd ?? null,
    change24hPct: row?.change24hPct ?? null,
    change7dPct: row?.change7dPct ?? null,
    change30dPct: row?.change30dPct ?? null,
    change90dPct: row?.change90dPct ?? null,
    relative30dVsBtcPct: row && btc ? row.change30dPct - btc.change30dPct : null,
    relative90dVsBtcPct: row && btc ? row.change90dPct - btc.change90dPct : null,
    volumeToMarketCap: row?.marketCapUsd && row.volume24hUsd != null && row.marketCapUsd > 0 ? row.volume24hUsd / row.marketCapUsd : null,
    recommendedPullbackPct: null,
    reasonCodes: reasons,
  });

  if (symbol === "BTC") return empty("BENCHMARK", ["btc_is_market_benchmark"]);
  if (!row || !btc) return empty("DATA_INSUFFICIENT", ["cmc_7d_30d_90d_history_missing"]);
  if (calibration.marketStatus === "INSUFFICIENT_DATA") return empty("DATA_INSUFFICIENT", ["watchlist_breadth_or_btc_history_missing"]);
  if (!calibration.marketBullish) return empty("MARKET_NOT_BULLISH", ["btc_and_watchlist_breadth_not_bullish"]);
  if (row.change7dPct <= 0) return empty("TOO_EARLY", ["seven_day_recovery_not_positive"]);
  if (row.change7dPct > calibration.thresholds.maxRecovery7dPct || row.change24hPct > calibration.thresholds.maxPositive24hPct) {
    return empty("EXTENDED", ["recovery_already_too_extended_to_chase"]);
  }
  if (row.change30dPct < calibration.thresholds.minChange30dPct || row.change90dPct < calibration.thresholds.minChange90dPct) {
    return empty("STRUCTURALLY_WEAK", ["medium_term_loss_exceeds_pilot_safety_floor"]);
  }

  const relative30 = row.change30dPct - btc.change30dPct;
  const relative90 = row.change90dPct - btc.change90dPct;
  const volumeToMarketCap = row.marketCapUsd && row.volume24hUsd != null && row.marketCapUsd > 0 ? row.volume24hUsd / row.marketCapUsd : null;
  const recoveryQuality = clamp(1 - Math.abs(row.change7dPct - 5) / 7, 0, 1);
  const lag30Quality = lagQuality(row.change30dPct, -12, 23);
  const lag90Quality = lagQuality(row.change90dPct, -30, 45);
  const calm24hQuality = clamp(1 - Math.max(0, row.change24hPct) / 8, 0, 1);
  const turnoverQuality = volumeToMarketCap == null ? 0.5 : clamp(volumeToMarketCap / 0.08, 0, 1);
  const score = Math.round((30 * recoveryQuality + 20 * lag30Quality + 20 * lag90Quality + 15 * calm24hQuality + 15 * turnoverQuality) * 100) / 100;
  const recommendedPullbackPct = Math.round(clamp(
    4
      + Math.max(0, row.change7dPct) * 0.15
      + (row.change30dPct < -20 ? 0.5 : 0)
      + (row.change90dPct < -50 ? 0.5 : 0),
    4,
    8,
  ) * 100) / 100;

  const strictLag = row.change30dPct <= calibration.thresholds.maxChange30dPct
    && row.change90dPct <= calibration.thresholds.maxChange90dPct;
  if (strictLag) {
    return {
      ...empty("QUALIFIED", ["market_bullish", "30d_and_90d_laggard", "7d_recovery_confirmed", "pullback_entry_required"]),
      status: "QUALIFIED",
      qualifiesForNewCapital: true,
      score,
      relative30dVsBtcPct: relative30,
      relative90dVsBtcPct: relative90,
      volumeToMarketCap,
      recommendedPullbackPct,
    };
  }

  if (relative30 <= -8 || relative90 <= -20) {
    return {
      ...empty("NEAR_ROTATION", ["still_lagging_btc_but_not_strict_30d_90d_loser"]),
      status: "NEAR_ROTATION",
      score: Math.round(score * 0.75 * 100) / 100,
      relative30dVsBtcPct: relative30,
      relative90dVsBtcPct: relative90,
      volumeToMarketCap,
      recommendedPullbackPct,
    };
  }

  return {
    ...empty("NOT_LAGGING", ["coin_is_not_a_strict_delayed_rotation_setup"]),
    status: "NOT_LAGGING",
    score: Math.round(score * 0.5 * 100) / 100,
    relative30dVsBtcPct: relative30,
    relative90dVsBtcPct: relative90,
    volumeToMarketCap,
    recommendedPullbackPct,
  };
}

