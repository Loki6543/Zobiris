// Antifragile (Taleb barbell) sizing for small-cap bets.
//
// Principles applied:
// - Barbell: the bulk of capital stays in the safe end (cash / BTC / top-100 rotation). A small
//   speculative sleeve holds many equal, small bets whose maximum loss is the stake itself.
// - Avoid ruin first: under fat tails ruin comes from one extreme event, so no leverage, no
//   averaging down, and no single bet larger than a loss you can absorb without changing plans.
// - Convexity: losses are capped at the stake, gains are left open-ended. Take the stake off the
//   table early (free roll), then ladder out while keeping a runner.
// - Stops are NOT used on small caps: illiquid books gap through stops, turning a planned small loss
//   into a forced sale at the worst price. Position size is the stop.

export interface BarbellConfig {
  /** Share of total portfolio for the speculative sleeve. */
  sleevePct: number;
  /** Max stake per small-cap bet as share of total portfolio. */
  maxBetPct: number;
  /** Smallest order worth placing (Kraken minimums / fees). */
  minOrderUsd: number;
  maxOpenBets: number;
}

export const DEFAULT_BARBELL: BarbellConfig = { sleevePct: 0.1, maxBetPct: 0.015, minOrderUsd: 8, maxOpenBets: 8 };

export interface SpeculativePosition { symbol: string; costUsd: number; valueUsd: number | null }

export interface BarbellPlan {
  sleeveBudgetUsd: number;
  sleeveCommittedUsd: number;
  sleeveRemainingUsd: number;
  betSizeUsd: number;
  openBets: number;
  slotsOpen: number;
  canOpenNewBet: boolean;
  reasons: string[];
}

export function planBarbell(portfolioUsd: number, positions: SpeculativePosition[], exposureMultiplier: number, cfg: BarbellConfig = DEFAULT_BARBELL): BarbellPlan {
  const reasons: string[] = [];
  const valid = Number.isFinite(portfolioUsd) && portfolioUsd > 0;
  const sleeveBudgetUsd = valid ? portfolioUsd * cfg.sleevePct : 0;
  // Committed = original stakes still at risk (cost basis), not marked value: winners must not
  // crowd out new bets, and losers still count against the sleeve until closed.
  const sleeveCommittedUsd = positions.reduce((s, p) => s + Math.max(0, p.costUsd), 0);
  const sleeveRemainingUsd = Math.max(0, sleeveBudgetUsd - sleeveCommittedUsd);
  const rawBet = valid ? portfolioUsd * cfg.maxBetPct * Math.max(0, Math.min(1, exposureMultiplier)) : 0;
  const betSizeUsd = Number(Math.min(rawBet, sleeveRemainingUsd).toFixed(2));
  const openBets = positions.length;
  const slotsOpen = Math.max(0, cfg.maxOpenBets - openBets);

  if (!valid) reasons.push("PORTFOLIO_VALUE_UNKNOWN");
  if (exposureMultiplier <= 0) reasons.push("BTC_REGIME_BLOCKS_NEW_RISK");
  if (slotsOpen === 0) reasons.push("MAX_OPEN_BETS_REACHED");
  if (sleeveRemainingUsd < cfg.minOrderUsd) reasons.push("SLEEVE_FULLY_COMMITTED");
  if (betSizeUsd < cfg.minOrderUsd) reasons.push("BET_BELOW_MIN_ORDER");
  return { sleeveBudgetUsd, sleeveCommittedUsd, sleeveRemainingUsd, betSizeUsd, openBets, slotsOpen, canOpenNewBet: reasons.length === 0, reasons };
}

export type LadderAction = "HOLD" | "SELL_STAKE_FREE_ROLL" | "SELL_25PCT_ORIGINAL" | "SELL_15PCT_ORIGINAL" | "REVIEW_EXIT_DEAD_MONEY" | "EXIT_THESIS_BROKEN";

export interface LadderInput {
  entryPrice: number;
  currentPrice: number;
  originalQty: number;
  remainingQty: number;
  daysHeld: number;
  priceAboveSma50: boolean | null;
  /** Delisting notice, exploit, team exit, or a large unannounced unlock. */
  thesisBroken: boolean;
}

export interface LadderDecision { action: LadderAction; sellQty: number; multiple: number; reason: string }

/**
 * Profit ladder: at 2x sell enough to recover the stake (the rest rides for free); at 5x sell 25% of
 * the original quantity; at 10x sell another 15%; keep the remaining runner for the fat right tail.
 */
export function ladderDecision(i: LadderInput): LadderDecision {
  const multiple = i.entryPrice > 0 ? i.currentPrice / i.entryPrice : 0;
  const soldShare = i.originalQty > 0 ? 1 - i.remainingQty / i.originalQty : 0;
  const has = (share: number) => soldShare >= share - 1e-9;
  if (i.thesisBroken) return { action: "EXIT_THESIS_BROKEN", sellQty: i.remainingQty, multiple, reason: "Thesis broken: exit fully regardless of price." };
  // Tiers fire in order even if price gaps through several at once.
  if (multiple >= 2 && !has(0.5)) return { action: "SELL_STAKE_FREE_ROLL", sellQty: Math.min(i.remainingQty, i.originalQty * 0.5), multiple, reason: "2x: sell half to recover the stake; the rest is a free roll." };
  if (multiple >= 5 && !has(0.75)) return { action: "SELL_25PCT_ORIGINAL", sellQty: Math.min(i.remainingQty, i.originalQty * 0.25), multiple, reason: "5x: take 25% of the original position." };
  if (multiple >= 10 && !has(0.9)) return { action: "SELL_15PCT_ORIGINAL", sellQty: Math.min(i.remainingQty, i.originalQty * 0.15), multiple, reason: "10x: take another 15% of the original position, keep the 10% runner." };
  if (i.daysHeld >= 180 && multiple < 1.5 && i.priceAboveSma50 === false) return { action: "REVIEW_EXIT_DEAD_MONEY", sellQty: 0, multiple, reason: "180 days with no re-rating and below the 50-day average: review and recycle the slot." };
  return { action: "HOLD", sellQty: 0, multiple, reason: "Hold: the stake is the stop; no averaging down." };
}
