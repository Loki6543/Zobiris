/**
 * Portfolio gate: one shared check for every recommendation path.
 *
 * It can only BLOCK or REDUCE a proposed action. It never raises a size,
 * never proposes a trade and never touches an exchange. Every path that
 * produces a buy or sell suggestion should pass through it, so the holding
 * cap, cash commitments and the meaningful-action floor are enforced in one
 * place instead of being re-implemented per screen.
 */

export interface PortfolioPolicy {
  intentionalHoldingsTarget: [number, number];
  intentionalHoldingsMax: number;
  meaningfulActionFloorUsd: number;
  cashBufferDivisor: number;
  typicalProbeUsd: number;
  maxAccountDataAgeMin: number;
}

export interface GateHolding {
  symbol: string;
  /** null means valuation unavailable; this holding still occupies a slot. */
  valueUsd: number | null;
  /** false for reward dust and other balances that do not occupy a slot */
  intentional?: boolean;
}

export interface GateOpenOrder {
  symbol: string;
  side: 'buy' | 'sell';
  notionalUsd: number;
}

export type GateAction = 'NEW_BUY' | 'ADD' | 'PARTIAL_SELL' | 'FULL_EXIT';

export interface GateCandidate {
  symbol: string;
  action: GateAction;
  requestedUsd: number;
  /** Strategy 2.1 next-order authority, when the caller has it. */
  strategyAuthorityUsd?: number;
}

export interface PortfolioState {
  asOf: string;
  cashUsd: number;
  /** TOTAL: open buys still have to be subtracted. NET_OF_OPEN_ORDERS: the exchange already reserved them. */
  cashBasis: 'TOTAL' | 'NET_OF_OPEN_ORDERS';
  holdings: GateHolding[];
  openOrders: GateOpenOrder[];
  /** Recorded for transparency only: unfilled sells never count as cash. */
  pendingSellProceedsUsd?: number;
}

export interface GateResult {
  symbol: string;
  action: GateAction;
  decision: 'ALLOW' | 'REDUCE' | 'BLOCK';
  requestedUsd: number;
  allowedUsd: number;
  reasons: string[];
  warnings: string[];
  slots: { current: number; afterAction: number; target: [number, number]; max: number };
  cash: { basis: PortfolioState['cashBasis']; freeAfterCommitmentsUsd: number | null; spendableAfterBufferUsd: number | null; ignoredPendingSellProceedsUsd: number };
  authority: 'VETO_OR_REDUCE_ONLY';
  mayIncreaseSize: false;
}

const round2 = (x: number) => Math.floor(x * 100) / 100;

function finiteNonNeg(x: unknown): x is number {
  return typeof x === 'number' && Number.isFinite(x) && x >= 0;
}

/** Gate compares canonical exchange symbols, not input letter case or whitespace. */
const symbolKey = (symbol: string): string => symbol.trim().toUpperCase();

function validPolicy(policy: PortfolioPolicy): boolean {
  if (!policy || typeof policy !== 'object') return false;
  const t = policy.intentionalHoldingsTarget;
  return Array.isArray(t) && t.length === 2
    && t.every(x => Number.isSafeInteger(x) && x >= 0)
    && t[0] <= t[1]
    && Number.isSafeInteger(policy.intentionalHoldingsMax)
    && policy.intentionalHoldingsMax >= t[1]
    && Number.isFinite(policy.meaningfulActionFloorUsd) && policy.meaningfulActionFloorUsd >= 0
    && Number.isFinite(policy.typicalProbeUsd) && policy.typicalProbeUsd >= 0
    && Number.isFinite(policy.cashBufferDivisor) && policy.cashBufferDivisor > 0
    && Number.isFinite(policy.maxAccountDataAgeMin) && policy.maxAccountDataAgeMin > 0;
}

function slotSymbols(state: PortfolioState): Set<string> {
  const s = new Set<string>();
  for (const h of state.holdings) if (h && typeof h.symbol === 'string' && h.intentional !== false && (h.valueUsd === null || (finiteNonNeg(h.valueUsd) && h.valueUsd > 0))) s.add(symbolKey(h.symbol));
  for (const o of state.openOrders) if (o && typeof o.symbol === 'string' && o.side === 'buy') s.add(symbolKey(o.symbol));
  return s;
}

/** Evaluates one candidate against the current state. */
export function evaluatePortfolioGate(state: PortfolioState, c: GateCandidate, policy: PortfolioPolicy, nowMs: number = Date.now()): GateResult {
  const reasons: string[] = [];
  const warnings: string[] = [];
  const requested = Number.isFinite(c.requestedUsd) ? c.requestedUsd : NaN;
  const validCollections = Array.isArray(state.holdings) && Array.isArray(state.openOrders);
  const slots = validCollections ? slotSymbols(state) : new Set<string>();
  const result = (decision: GateResult['decision'], allowed: number, after: number, free: number | null, spendable: number | null): GateResult => ({
    symbol: c.symbol,
    action: c.action,
    decision,
    requestedUsd: requested,
    allowedUsd: decision === 'BLOCK' ? 0 : Math.min(allowed, requested),
    reasons,
    warnings,
    slots: { current: slots.size, afterAction: after, target: policy.intentionalHoldingsTarget, max: policy.intentionalHoldingsMax },
    cash: { basis: state.cashBasis, freeAfterCommitmentsUsd: free, spendableAfterBufferUsd: spendable, ignoredPendingSellProceedsUsd: state.pendingSellProceedsUsd ?? 0 },
    authority: 'VETO_OR_REDUCE_ONLY',
    mayIncreaseSize: false,
  });

  // Fail closed on account data the gate cannot trust.
  // Exits must remain possible when non-exit sizing policy is unavailable.
  const isBuy = c.action === 'NEW_BUY' || c.action === 'ADD';
  if (isBuy && !validPolicy(policy)) reasons.push('PORTFOLIO_POLICY_INVALID');
  if (isBuy && state.cashBasis !== 'TOTAL' && state.cashBasis !== 'NET_OF_OPEN_ORDERS') reasons.push('CASH_BASIS_INVALID');
  if (!['NEW_BUY', 'ADD', 'PARTIAL_SELL', 'FULL_EXIT'].includes(c.action)) reasons.push('ACTION_INVALID');
  if (typeof c.symbol !== 'string' || symbolKey(c.symbol).length === 0) reasons.push('SYMBOL_INVALID');
  const asOf = Date.parse(state.asOf);
  if (!Number.isFinite(nowMs) || !Number.isFinite(asOf) || asOf > nowMs + 5000) reasons.push('ACCOUNT_STATE_TIME_INVALID');
  else if (nowMs - asOf > policy.maxAccountDataAgeMin * 60_000) reasons.push('ACCOUNT_STATE_STALE');
  if (!finiteNonNeg(state.cashUsd)) reasons.push('CASH_INVALID');
  if (!(requested > 0)) reasons.push('REQUESTED_SIZE_INVALID');
  if (!validCollections || state.holdings.some(h => !h || (h.valueUsd !== null && !finiteNonNeg(h.valueUsd)) || typeof h.symbol !== 'string' || !h.symbol.trim())
      || state.openOrders.some(o => !o || !finiteNonNeg(o.notionalUsd) || typeof o.symbol !== 'string' || !o.symbol.trim()
        || (o.side !== 'buy' && o.side !== 'sell'))) reasons.push('POSITION_DATA_INVALID');
  if (reasons.length) return result('BLOCK', 0, slots.size, null, null);

  const unknownValuations = state.holdings.filter(h => h.intentional !== false && h.valueUsd === null);
  if (unknownValuations.length) warnings.push('HOLDING_VALUE_UNKNOWN');
  const held = state.holdings.find((h) => symbolKey(h.symbol) === symbolKey(c.symbol) && h.intentional !== false && (h.valueUsd === null || h.valueUsd > 0));
  const openBuys = state.openOrders.filter((o) => o.side === 'buy');
  const openSellSameSymbol = state.openOrders.filter((o) => o.side === 'sell' && symbolKey(o.symbol) === symbolKey(c.symbol)).reduce((a, o) => a + o.notionalUsd, 0);
  if ((state.pendingSellProceedsUsd ?? 0) > 0) warnings.push('PENDING_SELL_PROCEEDS_NOT_COUNTED');

  if (c.action === 'NEW_BUY' || c.action === 'ADD') {
    let action = c.action;
    if (action === 'NEW_BUY' && held) {
      warnings.push('ALREADY_HELD_EVALUATED_AS_ADD');
      action = 'ADD';
    }
    if (action === 'ADD' && held?.valueUsd === null) {
      reasons.push('HOLDING_VALUE_UNKNOWN_FOR_ADD');
      return result('BLOCK', 0, slots.size, null, null);
    }
    if (action === 'ADD' && !held) {
      reasons.push('ADD_REQUIRES_INTENTIONAL_HOLDING');
      return result('BLOCK', 0, slots.size, null, null);
    }
    if (openBuys.some((o) => symbolKey(o.symbol) === symbolKey(c.symbol))) warnings.push('EXISTING_OPEN_BUY_NEEDS_REVIEW');
    const after = slots.has(symbolKey(c.symbol)) ? slots.size : slots.size + 1;
    if (after > policy.intentionalHoldingsMax) {
      reasons.push('HOLDINGS_MAX_REACHED');
      return result('BLOCK', 0, slots.size, null, null);
    }
    if (after > policy.intentionalHoldingsTarget[1]) warnings.push('ABOVE_TARGET_HOLDINGS_RANGE');

    const commitments = openBuys.reduce((a, o) => a + o.notionalUsd, 0);
    const free = round2(state.cashBasis === 'TOTAL' ? state.cashUsd - commitments : state.cashUsd);
    const spendable = round2(Math.max(0, free) / policy.cashBufferDivisor);
    let allowed = requested;
    const caps: [number, string][] = [
      [spendable, 'CASH_AFTER_COMMITMENTS_AND_BUFFER'],
      [policy.typicalProbeUsd, 'TYPICAL_PROBE_CAP'],
    ];
    if (c.strategyAuthorityUsd !== undefined) caps.push([finiteNonNeg(c.strategyAuthorityUsd) ? c.strategyAuthorityUsd : 0, 'STRATEGY_AUTHORITY_CAP']);
    for (const [cap, why] of caps) {
      if (cap < allowed) {
        allowed = cap;
        reasons.push(why);
      }
    }
    allowed = round2(allowed);
    if (allowed < policy.meaningfulActionFloorUsd) {
      reasons.push('BELOW_MEANINGFUL_ACTION_FLOOR');
      return result('BLOCK', 0, slots.size, free, spendable);
    }
    return result(allowed < requested ? 'REDUCE' : 'ALLOW', allowed, after, free, spendable);
  }

  // Sells
  if (!held) {
    reasons.push('SELL_REQUIRES_HOLDING');
    return result('BLOCK', 0, slots.size, null, null);
  }
  if (held.valueUsd === null) {
    reasons.push('HOLDING_VALUE_UNKNOWN_FOR_SELL');
    return result('BLOCK', 0, slots.size, null, null);
  }
  const sellable = round2(Math.max(0, held.valueUsd - openSellSameSymbol));
  if (openSellSameSymbol > 0) warnings.push('OPEN_SELL_ALREADY_COMMITS_PART_OF_POSITION');
  if (c.action === 'FULL_EXIT') {
    // A genuine risk-driven full exit is not blocked by the floor.
    const allowed = round2(Math.min(requested, sellable));
    if (allowed <= 0) {
      reasons.push('NOTHING_LEFT_TO_SELL');
      return result('BLOCK', 0, slots.size, null, null);
    }
    if (allowed < requested) reasons.push('LIMITED_TO_UNCOMMITTED_POSITION');
    return result(allowed < requested ? 'REDUCE' : 'ALLOW', allowed, slots.size - 1, null, null);
  }
  let allowed = requested;
  if (sellable < allowed) {
    allowed = sellable;
    reasons.push('LIMITED_TO_UNCOMMITTED_POSITION');
  }
  allowed = round2(allowed);
  if (allowed < policy.meaningfulActionFloorUsd) {
    reasons.push('BELOW_MEANINGFUL_ACTION_FLOOR');
    return result('BLOCK', 0, slots.size, null, null);
  }
  if (held.valueUsd - allowed > 0 && held.valueUsd - allowed < policy.meaningfulActionFloorUsd) warnings.push('REMAINDER_BELOW_FLOOR_CONSIDER_FULL_EXIT');
  return result(allowed < requested ? 'REDUCE' : 'ALLOW', allowed, slots.size, null, null);
}

/**
 * Evaluates candidates in the given priority order, reserving cash and slots as
 * each one is allowed. Several displayed candidates do not each get the full
 * cash balance: later candidates see what earlier ones would consume.
 */
export function evaluatePortfolioBatch(state: PortfolioState, candidates: GateCandidate[], policy: PortfolioPolicy, nowMs: number = Date.now()): GateResult[] {
  let s: PortfolioState = { ...state, holdings: [...state.holdings], openOrders: [...state.openOrders] };
  const out: GateResult[] = [];
  for (const c of candidates) {
    const r = evaluatePortfolioGate(s, c, policy, nowMs);
    out.push(r);
    if (r.decision === 'BLOCK') continue;
    if (c.action === 'NEW_BUY' || c.action === 'ADD') {
      // Treat the allowed buy as a pending commitment for the next candidate.
      s = { ...s, openOrders: [...s.openOrders, { symbol: c.symbol, side: 'buy', notionalUsd: r.allowedUsd }] };
      if (s.cashBasis === 'NET_OF_OPEN_ORDERS') s = { ...s, cashUsd: s.cashUsd - r.allowedUsd };
    } else {
      s = { ...s, openOrders: [...s.openOrders, { symbol: c.symbol, side: 'sell', notionalUsd: r.allowedUsd }] };
    }
  }
  return out;
}
