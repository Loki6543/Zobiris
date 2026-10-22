"""Alt-flush divergence detector (user hypothesis, 19 Oct 2026; thresholds pre-registered before the first backtest).

Idea: when BTC-heavy automated traders judge BTC has bottomed, they unload alts together. On the tape: alts fall far more than
BTC over ~30 minutes while BTC is flat, with volume rising across the universe, while BTC holds above its 7-day low.
Fast recoverers (ZRO, CVX, INJ, NEAR, ZEC) are treated as confirmation canaries, not as buys.

Shadow evidence only. A FLUSH or CONFIRM state can nominate candidates for a paper ledger; it cannot place or size an order.
Backtest on Kraken 15m, 12-19 Oct 2026: two firings (13 Oct 00:30, 18 Oct 19:45 UTC). One is the motivating event, so the
sample is about 1.5 independent observations. Do not promote without out-of-sample firings.
"""
import statistics as st

THRESHOLDS = {'btc_abs_r30_pct': 0.35, 'btc_range30_pct': 0.70, 'alt_median_r30_pct': -1.0,
              'breadth_down': 0.60, 'down_cut_pct': -0.5, 'relvol_median': 1.5}
CANARIES = ('ZRO', 'CVX', 'INJ', 'NEAR', 'ZEC')


def market_state(btc, alts, anchor_low, th=THRESHOLDS):
    """btc: dict r30_pct, range30_pct, close. alts: {coin: dict r30_pct, r15_pct, relvol, range_pos}.

    Returns the flags and one of RISK_OFF / FLUSH / EXPANSION / WATCH. CONFIRM needs a recent FLUSH and is set by the caller.
    """
    r30 = [a['r30_pct'] for a in alts.values()]
    rv = [a['relvol'] for a in alts.values() if a.get('relvol') is not None]
    flags = {
        'floor_intact': btc['close'] > anchor_low,
        'btc_sideways': abs(btc['r30_pct']) <= th['btc_abs_r30_pct'] and btc['range30_pct'] <= th['btc_range30_pct'],
        'alt_median_r30_pct': st.median(r30),
        'breadth_down': sum(1 for x in r30 if x < th['down_cut_pct']) / len(r30),
        'relvol_median': st.median(rv) if rv else None,
        'canary_r15_median': st.median(a['r15_pct'] for c, a in alts.items() if c in CANARIES) if any(c in alts for c in CANARIES) else None,
        'range_pos_median': st.median(a['range_pos'] for a in alts.values()),
        'up30_share': sum(1 for x in r30 if x > 0) / len(r30),
    }
    flags['alt_flush'] = flags['alt_median_r30_pct'] <= th['alt_median_r30_pct'] and flags['breadth_down'] >= th['breadth_down']
    flags['volume_surge'] = (flags['relvol_median'] or 0) >= th['relvol_median']
    if not flags['floor_intact']:
        state = 'RISK_OFF'
    elif flags['btc_sideways'] and flags['alt_flush'] and flags['volume_surge']:
        state = 'FLUSH'
    elif flags['range_pos_median'] > 0.70 and flags['up30_share'] > 0.60:
        state = 'EXPANSION'
    else:
        state = 'WATCH'
    return state, flags
