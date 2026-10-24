// One Kraken spot cost schedule for the decision ledger and the backtest lab.
//
// Fees: Kraken spot schedule kraken-spot-2026-07-09, the same table as feeSchedule in
// server/policy/zobiris-policy-registry-v3.1.json (tests/costs.test.ts keeps the two equal). The account tier comes from
// ZOBIRIS_KRAKEN_FEE_TIER; unknown defaults to tier 1, as in the validation lab. An account-specific schedule that matches no
// published tier is set with ZOBIRIS_KRAKEN_MAKER_PCT and ZOBIRIS_KRAKEN_TAKER_PCT, which take precedence when both are valid.
// Path: MAKER_TAKER, matching the validation lab. Entry is a resting limit order (maker fee, no spread); exit takes
// liquidity (taker fee plus half the bid-ask spread).
// Spread: half of the quoted Kraken bid-ask from a ticker snapshot on 2026-10-22: BTC/ETH about 0.01%, top-100 alts
// 0.03-0.12%, smaller alts 0.05-0.36%. Order-size impact is not modeled; it matters only for orders large against volume.

export const FEE_SCHEDULE_ID = "kraken-spot-2026-07-09";
export const FEE_TIERS = [
  { tier: 1, makerPct: 0.4, takerPct: 0.8 },
  { tier: 2, makerPct: 0.3, takerPct: 0.6 },
  { tier: 3, makerPct: 0.22, takerPct: 0.38 },
  { tier: 4, makerPct: 0.2, takerPct: 0.35 },
  { tier: 5, makerPct: 0.15, takerPct: 0.3 },
  { tier: 6, makerPct: 0.12, takerPct: 0.25 },
] as const;

export function feeTier(env: Record<string, string | undefined> = process.env): { tier: number; makerPct: number; takerPct: number } {
  const maker = Number(env.ZOBIRIS_KRAKEN_MAKER_PCT), taker = Number(env.ZOBIRIS_KRAKEN_TAKER_PCT);
  if (env.ZOBIRIS_KRAKEN_MAKER_PCT && env.ZOBIRIS_KRAKEN_TAKER_PCT && maker >= 0 && taker >= maker && taker < 5) return { tier: 0, makerPct: maker, takerPct: taker };
  const n = Number(env.ZOBIRIS_KRAKEN_FEE_TIER);
  return FEE_TIERS.find((t) => t.tier === n) ?? FEE_TIERS[0];
}

/** Half the quoted bid-ask spread, as a fraction of price. */
export function halfSpread(symbol: string, rank: number | null): number {
  if (symbol === "BTC" || symbol === "ETH") return 0.0001;
  if (rank != null && rank <= 100) return 0.0005;
  return 0.0015;
}

/** Cost of entering with a resting limit order: maker fee only. */
export function entryCost(_symbol: string, _rank: number | null, tier = feeTier()): number {
  return tier.makerPct / 100;
}

/** Cost of exiting at market: taker fee plus half the spread. */
export function exitCost(symbol: string, rank: number | null, tier = feeTier()): number {
  return tier.takerPct / 100 + halfSpread(symbol, rank);
}

/** Net percent return of a round trip after entry and exit costs. */
export function netReturnPct(entry: number, exit: number, symbol: string, rank: number | null, tier = feeTier()): number {
  return ((exit * (1 - exitCost(symbol, rank, tier))) / (entry * (1 + entryCost(symbol, rank, tier))) - 1) * 100;
}

/** Average one-side cost of a BTC round trip, for backtests that charge the same cost on entry and exit. */
export function btcCostPerSide(tier = feeTier()): number {
  return (entryCost("BTC", 1, tier) + exitCost("BTC", 1, tier)) / 2;
}

export type CostTier = { tier: number; makerPct: number; takerPct: number };

/** The active schedule as the UI shows it: where the fees come from, and half-spread by coin class in percent. */
export function costSchedule(tier: CostTier = feeTier()) {
  return {
    scheduleId: FEE_SCHEDULE_ID, tier: tier.tier, source: tier.tier === 0 ? "account schedule" : `Kraken tier ${tier.tier}`,
    makerPct: tier.makerPct, takerPct: tier.takerPct,
    halfSpreadPct: { major: halfSpread("BTC", 1) * 100, top100: halfSpread("X", 100) * 100, smaller: halfSpread("X", null) * 100 },
  };
}

/** Fee break-even for a planned trade (MarketLab's payoff calculator on Zobiris costs): limit entry, market exit.
 *  gainPct/lossPct are the gross price moves to the take-profit and the stop. Returns net results and the win rate
 *  at which the trade breaks even after costs, or null when the inputs cannot describe a trade. */
export function tradeBreakEven(gainPct: number, lossPct: number, symbol: string, rank: number | null, tier: CostTier) {
  if (![gainPct, lossPct].every(Number.isFinite) || gainPct <= 0 || lossPct <= 0 || lossPct >= 100) return null;
  const winNetPct = netReturnPct(100, 100 + gainPct, symbol, rank, tier);
  const lossNetPct = netReturnPct(100, 100 - lossPct, symbol, rank, tier);
  return {
    winNetPct, lossNetPct, roundTripCostPct: -netReturnPct(100, 100, symbol, rank, tier),
    breakEvenWinRate: winNetPct <= 0 ? null : -lossNetPct / (winNetPct - lossNetPct),
  };
}
