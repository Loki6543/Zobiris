function ordered(events) {
    return events.map((event, index) => ({ event, index }))
        .sort((a, b) => a.event.ts.localeCompare(b.event.ts) || a.index - b.index)
        .map((x) => x.event);
}
function stream(events, kind) {
    return ordered(events).filter((e) => e.kind === kind);
}
function allowedPriceDelta(symbol, schedule, ticks) {
    const tick = ticks?.[symbol] ?? 0;
    return tick > 0 ? tick * schedule.priceToleranceTicks : 0;
}
function pushTolerance(uses, streamKind, index, field, delta, allowed) {
    if (delta > 0 && delta <= allowed)
        uses.push({ stream: streamKind, index, field, delta, allowed });
}
function compareOrders(input, diffs, toleranceUses) {
    const a = stream(input.reference, 'ORDER_SUBMITTED');
    const b = stream(input.candidate, 'ORDER_SUBMITTED');
    const n = Math.max(a.length, b.length);
    for (let i = 0; i < n; i++) {
        const x = a[i], y = b[i];
        if (!x || !y) {
            diffs.push({ stream: 'ORDER_SUBMITTED', index: i, reason: 'order count differs', reference: x, candidate: y });
            continue;
        }
        if (x.ts !== y.ts || x.symbol !== y.symbol || x.side !== y.side || x.orderType !== y.orderType) {
            diffs.push({ stream: 'ORDER_SUBMITTED', index: i, reason: 'order timestamp/identity/type differs', reference: x, candidate: y });
            continue;
        }
        const qd = Math.abs(x.quantity - y.quantity);
        if (qd > input.schedule.quantityTolerance)
            diffs.push({ stream: 'ORDER_SUBMITTED', index: i, reason: 'order quantity differs', reference: x, candidate: y });
        else
            pushTolerance(toleranceUses, 'ORDER_SUBMITTED', i, 'quantity', qd, input.schedule.quantityTolerance);
        const lx = x.limitPrice, ly = y.limitPrice;
        if ((lx === undefined) !== (ly === undefined))
            diffs.push({ stream: 'ORDER_SUBMITTED', index: i, reason: 'limit-price presence differs', reference: x, candidate: y });
        else if (lx !== undefined && ly !== undefined) {
            const allowed = allowedPriceDelta(x.symbol, input.schedule, input.tickSizeBySymbol);
            const d = Math.abs(lx - ly);
            if (d > allowed)
                diffs.push({ stream: 'ORDER_SUBMITTED', index: i, reason: 'limit price exceeds registered tolerance', reference: x, candidate: y });
            else
                pushTolerance(toleranceUses, 'ORDER_SUBMITTED', i, 'limitPrice', d, allowed);
        }
    }
}
function compareFills(input, diffs, toleranceUses) {
    const a = stream(input.reference, 'ORDER_FILLED');
    const b = stream(input.candidate, 'ORDER_FILLED');
    const n = Math.max(a.length, b.length);
    for (let i = 0; i < n; i++) {
        const x = a[i], y = b[i];
        if (!x || !y) {
            diffs.push({ stream: 'ORDER_FILLED', index: i, reason: 'fill count differs', reference: x, candidate: y });
            continue;
        }
        if (x.ts !== y.ts || x.symbol !== y.symbol || x.side !== y.side) {
            diffs.push({ stream: 'ORDER_FILLED', index: i, reason: 'fill timestamp/identity differs', reference: x, candidate: y });
            continue;
        }
        const qd = Math.abs(x.quantity - y.quantity);
        if (qd > input.schedule.quantityTolerance)
            diffs.push({ stream: 'ORDER_FILLED', index: i, reason: 'fill quantity differs', reference: x, candidate: y });
        else
            pushTolerance(toleranceUses, 'ORDER_FILLED', i, 'quantity', qd, input.schedule.quantityTolerance);
        const allowed = allowedPriceDelta(x.symbol, input.schedule, input.tickSizeBySymbol);
        const pd = Math.abs(x.price - y.price);
        if (pd > allowed)
            diffs.push({ stream: 'ORDER_FILLED', index: i, reason: 'fill price exceeds registered tolerance', reference: x, candidate: y });
        else
            pushTolerance(toleranceUses, 'ORDER_FILLED', i, 'price', pd, allowed);
        const fd = Math.abs((x.feeQuote ?? 0) - (y.feeQuote ?? 0));
        if (fd > input.schedule.cashTolerance)
            diffs.push({ stream: 'ORDER_FILLED', index: i, reason: 'fill fee differs', reference: x, candidate: y });
        else
            pushTolerance(toleranceUses, 'ORDER_FILLED', i, 'feeQuote', fd, input.schedule.cashTolerance);
    }
}
function compareMarks(input, diffs, toleranceUses) {
    const a = stream(input.reference, 'MARK_PRICE');
    const b = stream(input.candidate, 'MARK_PRICE');
    const n = Math.max(a.length, b.length);
    for (let i = 0; i < n; i++) {
        const x = a[i], y = b[i];
        if (!x || !y) {
            diffs.push({ stream: 'MARK_PRICE', index: i, reason: 'mark count differs', reference: x, candidate: y });
            continue;
        }
        if (x.ts !== y.ts || x.symbol !== y.symbol || x.markConvention !== y.markConvention) {
            diffs.push({ stream: 'MARK_PRICE', index: i, reason: 'mark timestamp/identity/convention differs', reference: x, candidate: y });
            continue;
        }
        const allowed = allowedPriceDelta(x.symbol, input.schedule, input.tickSizeBySymbol);
        const d = Math.abs(x.price - y.price);
        if (d > allowed)
            diffs.push({ stream: 'MARK_PRICE', index: i, reason: 'mark price exceeds registered tolerance', reference: x, candidate: y });
        else
            pushTolerance(toleranceUses, 'MARK_PRICE', i, 'price', d, allowed);
    }
}
function comparePositions(input, diffs, toleranceUses) {
    const a = stream(input.reference, 'POSITION_SNAPSHOT');
    const b = stream(input.candidate, 'POSITION_SNAPSHOT');
    const n = Math.max(a.length, b.length);
    for (let i = 0; i < n; i++) {
        const x = a[i], y = b[i];
        if (!x || !y) {
            diffs.push({ stream: 'POSITION_SNAPSHOT', index: i, reason: 'position snapshot count differs', reference: x, candidate: y });
            continue;
        }
        if (x.ts !== y.ts || x.symbol !== y.symbol) {
            diffs.push({ stream: 'POSITION_SNAPSHOT', index: i, reason: 'position timestamp/symbol differs', reference: x, candidate: y });
            continue;
        }
        const d = Math.abs(x.quantity - y.quantity);
        if (d > input.schedule.positionTolerance)
            diffs.push({ stream: 'POSITION_SNAPSHOT', index: i, reason: 'position quantity differs', reference: x, candidate: y });
        else
            pushTolerance(toleranceUses, 'POSITION_SNAPSHOT', i, 'quantity', d, input.schedule.positionTolerance);
    }
}
function compareCash(input, diffs, toleranceUses) {
    const a = stream(input.reference, 'CASH_SNAPSHOT');
    const b = stream(input.candidate, 'CASH_SNAPSHOT');
    const n = Math.max(a.length, b.length);
    for (let i = 0; i < n; i++) {
        const x = a[i], y = b[i];
        if (!x || !y) {
            diffs.push({ stream: 'CASH_SNAPSHOT', index: i, reason: 'cash snapshot count differs', reference: x, candidate: y });
            continue;
        }
        if (x.ts !== y.ts || x.currency !== y.currency) {
            diffs.push({ stream: 'CASH_SNAPSHOT', index: i, reason: 'cash timestamp/currency differs', reference: x, candidate: y });
            continue;
        }
        const d = Math.abs(x.amount - y.amount);
        if (d > input.schedule.cashTolerance)
            diffs.push({ stream: 'CASH_SNAPSHOT', index: i, reason: 'cash amount differs', reference: x, candidate: y });
        else
            pushTolerance(toleranceUses, 'CASH_SNAPSHOT', i, 'amount', d, input.schedule.cashTolerance);
    }
}
function compareEquity(input, diffs, toleranceUses) {
    const a = stream(input.reference, 'EQUITY_MARK');
    const b = stream(input.candidate, 'EQUITY_MARK');
    const n = Math.max(a.length, b.length);
    for (let i = 0; i < n; i++) {
        const x = a[i], y = b[i];
        if (!x || !y) {
            diffs.push({ stream: 'EQUITY_MARK', index: i, reason: 'equity mark count differs', reference: x, candidate: y });
            continue;
        }
        if (x.ts !== y.ts || x.markConvention !== y.markConvention) {
            diffs.push({ stream: 'EQUITY_MARK', index: i, reason: 'equity timestamp/convention differs', reference: x, candidate: y });
            continue;
        }
        const denom = Math.max(Math.abs(x.equity), 1e-12);
        const bps = Math.abs(y.equity - x.equity) / denom * 10_000;
        if (bps > input.schedule.navToleranceBps)
            diffs.push({ stream: 'EQUITY_MARK', index: i, reason: `equity delta ${bps.toFixed(8)} bps exceeds registered tolerance`, reference: x, candidate: y });
        else
            pushTolerance(toleranceUses, 'EQUITY_MARK', i, 'equityBps', bps, input.schedule.navToleranceBps);
    }
}
/** Independently recompute spot cash/positions/equity from fills + mark prices and compare engine snapshots. */
export function verifySelfConformance(events, initialCash = 0, quoteCurrency = 'USD', schedule) {
    const issues = [];
    const state = { cash: initialCash, positions: new Map(), marks: new Map() };
    const qTol = schedule?.positionTolerance ?? 0;
    const cTol = schedule?.cashTolerance ?? 0;
    const navTolBps = schedule?.navToleranceBps ?? 0;
    for (const e of ordered(events)) {
        if (e.kind === 'ORDER_FILLED') {
            const signed = e.side === 'BUY' ? e.quantity : -e.quantity;
            state.positions.set(e.symbol, (state.positions.get(e.symbol) ?? 0) + signed);
            const gross = e.quantity * e.price;
            const fee = e.feeQuote ?? 0;
            state.cash += e.side === 'BUY' ? -(gross + fee) : gross - fee;
        }
        else if (e.kind === 'MARK_PRICE') {
            state.marks.set(e.symbol, e.price);
        }
        else if (e.kind === 'POSITION_SNAPSHOT') {
            const expected = state.positions.get(e.symbol) ?? 0;
            if (Math.abs(expected - e.quantity) > qTol)
                issues.push(`${e.ts} ${e.symbol} position snapshot ${e.quantity} != reconstructed ${expected}`);
        }
        else if (e.kind === 'CASH_SNAPSHOT' && e.currency === quoteCurrency) {
            if (Math.abs(state.cash - e.amount) > cTol)
                issues.push(`${e.ts} cash snapshot ${e.amount} != reconstructed ${state.cash}`);
        }
        else if (e.kind === 'EQUITY_MARK') {
            let equity = state.cash;
            let marksComplete = true;
            for (const [symbol, qty] of state.positions) {
                if (Math.abs(qty) <= qTol)
                    continue;
                const mark = state.marks.get(symbol);
                if (mark === undefined) {
                    marksComplete = false;
                    issues.push(`${e.ts} missing MARK_PRICE for ${symbol} before equity mark`);
                    continue;
                }
                equity += qty * mark;
            }
            if (marksComplete) {
                const denom = Math.max(Math.abs(equity), 1e-12);
                const bps = Math.abs(e.equity - equity) / denom * 10_000;
                if (bps > navTolBps)
                    issues.push(`${e.ts} equity mark ${e.equity} != reconstructed ${equity} (${bps.toFixed(8)} bps)`);
            }
        }
    }
    return issues;
}
function chooseConclusion(diffs) {
    if (diffs.some(d => d.stream === 'ORDER_SUBMITTED'))
        return 'ORDER_DIVERGENCE';
    if (diffs.some(d => d.stream === 'ORDER_FILLED' && /timestamp|count/.test(d.reason)))
        return 'SIGNAL_DIVERGENCE';
    if (diffs.some(d => d.stream === 'ORDER_FILLED' && /quantity/.test(d.reason)))
        return 'POSITION_DIVERGENCE';
    if (diffs.some(d => d.stream === 'MARK_PRICE' || (d.stream === 'ORDER_FILLED' && /price/.test(d.reason))))
        return 'PRICE_DIVERGENCE';
    if (diffs.some(d => d.stream === 'POSITION_SNAPSHOT'))
        return 'POSITION_DIVERGENCE';
    if (diffs.some(d => d.stream === 'CASH_SNAPSHOT'))
        return 'CASH_DIVERGENCE';
    if (diffs.some(d => d.stream === 'EQUITY_MARK'))
        return 'NAV_DIVERGENCE';
    return 'MATERIAL_EXECUTION_DIVERGENCE';
}
export function verifyObservations(input) {
    const empty = (conclusion, reason) => ({
        conclusion, eligibleForIntegrityScoring: false,
        diffs: [{ stream: 'IDENTITY', index: -1, reason }], toleranceUses: [],
        referenceSelfConformanceIssues: [], candidateSelfConformanceIssues: [],
    });
    if (!input.datasetHashEqual)
        return empty('DATASET_NOT_REPRODUCIBLE', 'dataset hash differs');
    if (!input.strategyHashEqual || !input.configHashEqual || !input.observationProtocolHashEqual || !input.executionModelHashEqual) {
        return empty('NOT_COMPARABLE', 'strategy/config/observation-protocol/execution-model identity differs');
    }
    const referenceSelf = verifySelfConformance(input.reference, input.initialCash ?? 0, input.quoteCurrency ?? 'USD', input.schedule);
    const candidateSelf = verifySelfConformance(input.candidate, input.initialCash ?? 0, input.quoteCurrency ?? 'USD', input.schedule);
    if (referenceSelf.length || candidateSelf.length) {
        return {
            conclusion: 'MATERIAL_EXECUTION_DIVERGENCE', eligibleForIntegrityScoring: false,
            diffs: [{ stream: 'SELF_CONFORMANCE', index: -1, reason: 'one or both engines violate independently reconstructed cash/position/equity accounting' }],
            toleranceUses: [], referenceSelfConformanceIssues: referenceSelf, candidateSelfConformanceIssues: candidateSelf,
        };
    }
    const diffs = [];
    const toleranceUses = [];
    compareOrders(input, diffs, toleranceUses);
    compareFills(input, diffs, toleranceUses);
    compareMarks(input, diffs, toleranceUses);
    comparePositions(input, diffs, toleranceUses);
    compareCash(input, diffs, toleranceUses);
    compareEquity(input, diffs, toleranceUses);
    if (diffs.length)
        return {
            conclusion: chooseConclusion(diffs), eligibleForIntegrityScoring: false, diffs, toleranceUses,
            referenceSelfConformanceIssues: referenceSelf, candidateSelfConformanceIssues: candidateSelf,
        };
    return {
        conclusion: toleranceUses.length ? 'MATCH_WITH_REGISTERED_NUMERIC_TOLERANCE' : 'EXACT_MATCH',
        eligibleForIntegrityScoring: true, diffs: [], toleranceUses,
        referenceSelfConformanceIssues: [], candidateSelfConformanceIssues: [],
    };
}
/** Recompute exposure from fills + independent MARK_PRICE/EQUITY_MARK observations, not engine analyzer summaries. */
export function verifyExposureInvariants(events, invariant, initialCash = 0) {
    const issues = [];
    const positions = new Map();
    const marks = new Map();
    let cash = initialCash;
    const exposures = [];
    for (const e of ordered(events)) {
        if (e.kind === 'ORDER_FILLED') {
            const signed = e.side === 'BUY' ? e.quantity : -e.quantity;
            positions.set(e.symbol, (positions.get(e.symbol) ?? 0) + signed);
            const gross = e.quantity * e.price;
            cash += e.side === 'BUY' ? -(gross + (e.feeQuote ?? 0)) : gross - (e.feeQuote ?? 0);
            if (invariant.longOnly && (positions.get(e.symbol) ?? 0) < 0)
                issues.push(`negative reconstructed position in ${e.symbol}`);
        }
        else if (e.kind === 'MARK_PRICE')
            marks.set(e.symbol, e.price);
        else if (e.kind === 'EQUITY_MARK') {
            let gross = 0;
            for (const [symbol, qty] of positions)
                gross += Math.abs(qty * (marks.get(symbol) ?? 0));
            const equity = Math.abs(e.equity) > 1e-12 ? Math.abs(e.equity) : Math.abs(cash);
            exposures.push(100 * gross / equity);
        }
    }
    const first = exposures[0];
    if (first !== undefined && invariant.minInitialExposurePct !== undefined && first < invariant.minInitialExposurePct)
        issues.push(`initial exposure ${first.toFixed(4)}% below ${invariant.minInitialExposurePct}%`);
    if (first !== undefined && invariant.maxInitialExposurePct !== undefined && first > invariant.maxInitialExposurePct)
        issues.push(`initial exposure ${first.toFixed(4)}% above ${invariant.maxInitialExposurePct}%`);
    if (exposures.length && invariant.maxGrossExposurePct !== undefined && Math.max(...exposures) > invariant.maxGrossExposurePct)
        issues.push(`gross exposure exceeds ${invariant.maxGrossExposurePct}%`);
    if (!exposures.length)
        issues.push('no equity marks available to evaluate exposure');
    return issues;
}
