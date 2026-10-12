// Mid/low-cap opportunity screen for CoinMarketCap ranks 101-500.
//
// The academic evidence says size and momentum explain crypto returns, BUT momentum is not
// statistically significant in below-median-size coins, and ~40% of coins delist with ~76% of
// delistings ending in total loss. So this screen does NOT try to predict winners. It:
//   1. Removes coins most likely to be failures, dilution traps or fake volume (hard filters, fail closed).
//   2. Ranks the survivors by convexity: room to re-rate plus evidence the selling has stopped.
// The score is a ranking prior, not a probability of success.

import type { BtcRegime } from "./btcRegime";

export interface SmallCapInput {
  symbol: string;
  cmcRank: number | null;
  marketCapUsd: number | null;
  fullyDilutedValueUsd: number | null;
  volume24hUsd: number | null;
  /** Days since first listing / launch. */
  ageDays: number | null;
  krakenListed: boolean;
  change30dPct: number | null;
  change90dPct: number | null;
  /** BTC 30-day change for relative strength. */
  btcChange30dPct: number | null;
  /** Negative percent, e.g. -85 = 85% below all-time high. */
  drawdownFromAthPct: number | null;
  priceAboveSma50: boolean | null;
  /** Share of circulating supply unlocking in the next 60 days (0.05 = 5%). null = unknown. */
  unlockShareNext60d: number | null;
  /**
   * Circulating / max(total, max) supply. Used as a free proxy when no unlock schedule exists:
   * if most supply already circulates, future unlocks are necessarily small.
   */
  unlockedSupplyShare?: number | null;
  /** For stablecoin / pegged-asset detection. */
  priceUsd?: number | null;
  change7dPct?: number | null;
}

export interface SmallCapScreenResult {
  symbol: string;
  eligible: boolean;
  /** 0..100 ranking prior among eligible coins; 0 if not eligible. */
  convexityScore: number;
  rejections: string[];
  notes: string[];
}

export const SMALL_CAP_RULES = {
  minRank: 101,
  maxRank: 500,
  minVolume24hUsd: 1_000_000,
  minTurnover: 0.01, // volume / market cap: below this, exits are hard
  maxTurnover: 1.0, // above this, volume is likely wash-traded or a pump
  minFloatRatio: 0.4, // market cap / FDV: below this, future dilution dominates
  maxUnlockShare60d: 0.05,
  minUnlockedSupplyShareProxy: 0.75,
  minAgeDays: 180,
  minDrawdownForConvexityPct: -60,
} as const;

const finite = (v: number | null): v is number => v != null && Number.isFinite(v);

export function screenSmallCap(a: SmallCapInput, regime: Pick<BtcRegime, "allowSmallCapBets" | "state">): SmallCapScreenResult {
  const r = SMALL_CAP_RULES;
  const rejections: string[] = [];
  const notes: string[] = [];

  if (!regime.allowSmallCapBets) rejections.push(`BTC_REGIME_${regime.state}_NO_SMALL_CAP_BETS`);
  const pegged = finite(a.priceUsd ?? null) && a.priceUsd! > 0.9 && a.priceUsd! < 1.2 && Math.abs(a.change7dPct ?? 99) < 1.5 && Math.abs(a.change30dPct ?? 99) < 3;
  if (pegged) rejections.push("STABLECOIN_OR_PEGGED_ASSET");
  if (!finite(a.cmcRank) || a.cmcRank < r.minRank || a.cmcRank > r.maxRank) rejections.push("OUTSIDE_RANK_101_500");
  if (!a.krakenListed) rejections.push("NOT_TRADABLE_ON_KRAKEN");
  if (!finite(a.volume24hUsd) || a.volume24hUsd < r.minVolume24hUsd) rejections.push("VOLUME_TOO_LOW_OR_UNKNOWN");
  if (!finite(a.marketCapUsd) || a.marketCapUsd <= 0) rejections.push("MARKET_CAP_UNKNOWN");
  if (finite(a.volume24hUsd) && finite(a.marketCapUsd) && a.marketCapUsd > 0) {
    const turnover = a.volume24hUsd / a.marketCapUsd;
    if (turnover < r.minTurnover) rejections.push("ILLIQUID_TURNOVER");
    if (turnover > r.maxTurnover) rejections.push("SUSPICIOUS_TURNOVER_POSSIBLE_WASH_OR_PUMP");
  }
  if (!finite(a.fullyDilutedValueUsd) || !finite(a.marketCapUsd) || a.fullyDilutedValueUsd <= 0) rejections.push("FDV_UNKNOWN");
  else if (a.marketCapUsd / a.fullyDilutedValueUsd < r.minFloatRatio) rejections.push("HEAVY_FUTURE_DILUTION");
  if (a.unlockShareNext60d == null) {
    if (a.unlockedSupplyShare == null || !Number.isFinite(a.unlockedSupplyShare)) rejections.push("UNLOCK_SCHEDULE_UNKNOWN");
    else if (a.unlockedSupplyShare < r.minUnlockedSupplyShareProxy) rejections.push("UNLOCK_RISK_TOO_MUCH_SUPPLY_LOCKED");
    else notes.push("UNLOCK_RISK_FROM_SUPPLY_PROXY");
  } else if (a.unlockShareNext60d > r.maxUnlockShare60d) rejections.push("LARGE_UNLOCK_WITHIN_60D");
  else notes.push("UNLOCK_SCHEDULE_VERIFIED");
  if (!finite(a.ageDays) || a.ageDays < r.minAgeDays) rejections.push("TOO_NEW_UNPROVEN_SURVIVAL");
  if (!finite(a.drawdownFromAthPct) || !finite(a.change30dPct) || !finite(a.change90dPct) || a.priceAboveSma50 == null) rejections.push("PRICE_HISTORY_INCOMPLETE");

  if (rejections.length) return { symbol: a.symbol, eligible: false, convexityScore: 0, rejections, notes };

  // Convexity ranking among survivors (each component 0..25).
  const dd = a.drawdownFromAthPct!;
  const reRatingRoom = dd <= r.minDrawdownForConvexityPct ? Math.min(25, ((-dd - 60) / 35) * 25 + 10) : Math.max(0, ((-dd) / 60) * 10);
  const sellingExhausted = (a.priceAboveSma50 ? 15 : 0) + (a.change30dPct! > a.change90dPct! ? 10 : 0);
  const rel30 = finite(a.btcChange30dPct) ? a.change30dPct! - a.btcChange30dPct : 0;
  const relativeStrength = Math.max(0, Math.min(25, 12.5 + rel30 / 2));
  const turnover = a.volume24hUsd! / a.marketCapUsd!;
  const liquidityHealth = Math.min(25, (Math.log10(turnover / r.minTurnover) / Math.log10(r.maxTurnover / r.minTurnover)) * 25 + 5);
  if (a.change30dPct! > 100) notes.push("ALREADY_UP_100PCT_30D_CHASE_RISK");
  if (dd > r.minDrawdownForConvexityPct) notes.push("SHALLOW_DRAWDOWN_LESS_ASYMMETRY");
  const score = Math.round(Math.max(0, Math.min(100, reRatingRoom + sellingExhausted + relativeStrength + liquidityHealth)) * (a.change30dPct! > 100 ? 0.6 : 1));
  return { symbol: a.symbol, eligible: true, convexityScore: score, rejections, notes };
}
