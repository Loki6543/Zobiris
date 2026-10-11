/**
 * Bitcoin cycle pivot/exhaustion RESEARCH PROXY, not Cosmic_Whale's proprietary indicators.
 *
 * This is an independently specified, transparent observation over completed
 * Kraken daily-candle inputs already vetted by marketBrief. It never recommends
 * a trade, grants capital, ranks assets or certifies a historical pivot.
 *
 * Source idea: user-supplied August 2026 "Cosmic_Whale's 5-Indicator System"
 * document. Claimed scripts, retrospective hit rate and 97% credibility were
 * NOT independently replicated or validated.
 */
export const CYCLE_RESEARCH_VERSION = 'btc-exhaustion-observer-v0.1' as const;
export const CYCLE_ORIGINAL_INDICATORS = [
  { name: '2x SLIT', theme: 'Potential shock zones' },
  { name: '0xTime', theme: 'Shock zones and candle-close timing' },
  { name: 'Double Slit', theme: 'Potential exhaustion/pivot markers' },
  { name: '0xTimeless', theme: 'Pinch and exhaustion pivot zones' },
  { name: 'OldPNAR+Timeless', theme: 'Variant of pinch/exhaustion pivot zones' },
] as const;

export type CycleResearchWatch =
  | 'POSSIBLE_SELLER_EXHAUSTION'
  | 'POSSIBLE_BUYER_EXHAUSTION'
  | 'NO_CONFLUENCE'
  | 'EVIDENCE_UNAVAILABLE';

export type CycleResearchObservation = {
  version: typeof CYCLE_RESEARCH_VERSION;
  status: 'RESEARCH_ONLY_NO_TRADE_AUTHORITY';
  sourceMethod: 'INDEPENDENT_TRANSPARENT_PROXY_NOT_ORIGINAL_SCRIPTS';
  sourceEvidence: 'USER_DOCUMENT_UNVERIFIED_PRIMARY_SCREENSHOT';
  originalIndicatorStatus: 'NOT_RUN';
  calibration: 'NOT_BACKTESTED';
  validatedSuccessProbability: null;
  asOf: string;
  timeframe: 'COMPLETED_1D';
  intraday1h6h: 'NOT_EVALUATED';
  pivotConfirmed: false;
  shockContext: 'DOWNSIDE_EXPANSION' | 'UPSIDE_EXPANSION' | 'NO_LARGE_MOVE' | 'UNKNOWN';
  rsiContext: 'LOW' | 'HIGH' | 'NEUTRAL' | 'UNKNOWN';
  watch: CycleResearchWatch;
  explanation: string;
  thresholds: { weeklyAbsPct: number | null; rsiLow: 30; rsiHigh: 70 };
};

export function buildBitcoinCycleResearch(input: {
  asOf: string;
  close: number;
  weeklyReturnPct: number;
  ema50: number;
  rsi14: number;
  atrPct: number;
}): CycleResearchObservation {
  const base = {
    version: CYCLE_RESEARCH_VERSION,
    status: 'RESEARCH_ONLY_NO_TRADE_AUTHORITY',
    sourceMethod: 'INDEPENDENT_TRANSPARENT_PROXY_NOT_ORIGINAL_SCRIPTS',
    sourceEvidence: 'USER_DOCUMENT_UNVERIFIED_PRIMARY_SCREENSHOT',
    originalIndicatorStatus: 'NOT_RUN',
    calibration: 'NOT_BACKTESTED',
    validatedSuccessProbability: null,
    asOf: input.asOf,
    timeframe: 'COMPLETED_1D',
    intraday1h6h: 'NOT_EVALUATED',
    pivotConfirmed: false,
  } as const;
  const valid = Number.isFinite(Date.parse(input.asOf))
    && [input.close, input.weeklyReturnPct, input.ema50, input.rsi14, input.atrPct].every(Number.isFinite)
    && input.close > 0 && input.ema50 > 0
    && input.rsi14 >= 0 && input.rsi14 <= 100 && input.atrPct >= 0;
  if (!valid) return {
    ...base, shockContext: 'UNKNOWN', rsiContext: 'UNKNOWN',
    watch: 'EVIDENCE_UNAVAILABLE',
    explanation: 'Required completed-daily price, momentum or volatility observations are invalid or unavailable.',
    thresholds: { weeklyAbsPct: null, rsiLow: 30, rsiHigh: 70 },
  };
  // Illustrative, FIXED research thresholds; no tuning or performance claims.
  const shockThreshold = Math.max(5, 2 * input.atrPct);
  const shockContext =
    input.weeklyReturnPct <= -shockThreshold ? 'DOWNSIDE_EXPANSION' as const
      : input.weeklyReturnPct >= shockThreshold ? 'UPSIDE_EXPANSION' as const
        : 'NO_LARGE_MOVE' as const;
  const rsiContext =
    input.rsi14 <= 30 ? 'LOW' as const
      : input.rsi14 >= 70 ? 'HIGH' as const : 'NEUTRAL' as const;
  const watch: CycleResearchWatch =
    shockContext === 'DOWNSIDE_EXPANSION' && rsiContext === 'LOW' && input.close < input.ema50
      ? 'POSSIBLE_SELLER_EXHAUSTION'
      : shockContext === 'UPSIDE_EXPANSION' && rsiContext === 'HIGH' && input.close > input.ema50
        ? 'POSSIBLE_BUYER_EXHAUSTION' : 'NO_CONFLUENCE';
  const explanation = watch === 'POSSIBLE_SELLER_EXHAUSTION'
    ? 'A large weekly drop coincides with low RSI and a close below EMA50. This flags downside stress, NOT a confirmed bottom or buy.'
    : watch === 'POSSIBLE_BUYER_EXHAUSTION'
      ? 'A large weekly rally coincides with high RSI and a close above EMA50. This flags upside extension, NOT a confirmed top or sell.'
      : 'No simultaneous weekly price expansion, RSI extreme and EMA50 positioning under the illustrative observer rules.';
  return {
    ...base, shockContext, rsiContext, watch, explanation,
    thresholds: { weeklyAbsPct: shockThreshold, rsiLow: 30, rsiHigh: 70 },
  };
}
