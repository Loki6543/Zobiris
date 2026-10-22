"""Point-in-time features for recovery research.

Every function reads only bars at or before the decision index it is given. Nothing here places orders,
sizes positions or changes Strategy 2.1 permissions: outputs are shadow research evidence.
"""
import math
import statistics as st


def range_position(highs, lows, close):
    """(close - low) / (high - low) over the window passed in; None when the window has no range."""
    hi, lo = max(highs), min(lows)
    return None if hi <= lo else (close - lo) / (hi - lo)


def rolling_anchor_expiry(highs, lows, i, window):
    """Locate the current rolling-window high and low and count the bars until each leaves the window.

    A 24h range position or 24h return can move only because an old extreme dropped out of the window
    (COMP on 21 Oct 2026: its surge high fell out 24h20m after the peak). Log this so a moving
    denominator is not read as fresh buying or selling.
    """
    start = i - window + 1
    if start < 0:
        raise ValueError('not enough bars for the window')
    hi_i = max(range(start, i + 1), key=lambda k: (highs[k], k))
    lo_i = min(range(start, i + 1), key=lambda k: (lows[k], -k))
    return {'high_idx': hi_i, 'low_idx': lo_i,
            'high_expires_in': hi_i - start + 1, 'low_expires_in': lo_i - start + 1}


def frozen_event(highs, lows, closes, peak_i, i):
    """Anchors frozen at an event peak: the lowest low since the peak, drawdown, and recovery of the peak-to-trough gap."""
    if not 0 <= peak_i <= i:
        raise ValueError('peak must be at or before the decision bar')
    peak = highs[peak_i]
    tr_i = min(range(peak_i, i + 1), key=lambda k: lows[k])
    trough = lows[tr_i]
    gap = peak - trough
    return {'peak': peak, 'trough': trough, 'trough_idx': tr_i,
            'drawdown': trough / peak - 1, 'from_peak': closes[i] / peak - 1,
            'recovered_fraction': (closes[i] - trough) / gap if gap > 0 else None,
            'level_382': trough + 0.382 * gap, 'level_500': trough + 0.5 * gap}


def nonoverlap_momentum(closes, i, bars_per_15m):
    """Split the last hour into independent log-return segments: last 15m, the 15m before it, and the 30m before that.

    15m/30m/1h returns overlap, so three positive windows are not three confirmations.
    """
    b = bars_per_15m
    if i - 4 * b < 0:
        raise ValueError('need one hour of history')
    seg = lambda a, c: math.log(closes[a] / closes[c])
    return {'seg_0_15m': seg(i, i - b), 'seg_15_30m': seg(i - b, i - 2 * b), 'seg_30_60m': seg(i - 2 * b, i - 4 * b)}


def _slope(x, y):
    mx, my = st.mean(x), st.mean(y)
    vx = sum((a - mx) ** 2 for a in x)
    return None if vx == 0 else sum((a - mx) * (b - my) for a, b in zip(x, y)) / vx


def beta_residual(coin_rets, btc_rets, fit_n, eval_n):
    """BTC beta fitted on the fit_n returns BEFORE the evaluation window; residual = coin - beta * BTC over the last eval_n returns.

    The beta never sees the window it is used to judge.
    """
    if len(coin_rets) != len(btc_rets) or len(coin_rets) < fit_n + eval_n:
        raise ValueError('aligned return series too short')
    x, y = btc_rets[-(fit_n + eval_n):-eval_n], coin_rets[-(fit_n + eval_n):-eval_n]
    beta = _slope(x, y)
    if beta is None:
        return {'beta': None, 'residual': None}
    return {'beta': beta, 'residual': sum(coin_rets[-eval_n:]) - beta * sum(btc_rets[-eval_n:])}


def up_down_beta(coin_rets, btc_rets, min_n=20):
    """Separate slopes on BTC-up and BTC-down returns (with intercept). None where a side has fewer than min_n observations."""
    up = [(b, c) for b, c in zip(btc_rets, coin_rets) if b > 0]
    dn = [(b, c) for b, c in zip(btc_rets, coin_rets) if b < 0]
    fit = lambda pairs: _slope([p[0] for p in pairs], [p[1] for p in pairs]) if len(pairs) >= min_n else None
    return {'up_beta': fit(up), 'down_beta': fit(dn), 'n_up': len(up), 'n_down': len(dn)}


def oi_quantity_growth(usd_oi_growth, price_growth):
    """Contract-quantity growth implied by dollar open-interest growth on a linear contract: (1+g_usd)/(1+g_price) - 1.

    Never subtract the price change; the relation is multiplicative. Units and timestamps must match.
    """
    return (1 + usd_oi_growth) / (1 + price_growth) - 1


def higher_low_min_bounce(min_drawdown, recovery_fraction):
    """Smallest bounce off the low implied by recovering `recovery_fraction` of a `min_drawdown` correction.

    0.382 of a 10% drawdown already implies a 4.24% bounce, so a separate '>=3% bounce' check adds nothing.
    """
    return recovery_fraction * min_drawdown / (1 - min_drawdown)


def relative_volume(volumes, recent, base):
    """Mean volume per bar over the last `recent` bars divided by the mean over the `base` bars before them."""
    if len(volumes) < recent + base:
        raise ValueError('not enough bars')
    prior = sum(volumes[-(recent + base):-recent]) / base
    return None if prior == 0 else (sum(volumes[-recent:]) / recent) / prior


def venue_liquidity(quote_volumes, bars_per_hour, min_usd_per_hour=50_000):
    """Average quote volume per hour over the bars given, and whether it clears the venue gate.

    Relative volume is venue-specific: MNT read 2.86x on Binance futures but 0.06x on Kraken spot on 21 Oct 2026.
    Judge participation on the venue you would trade.
    """
    hours = len(quote_volumes) / bars_per_hour
    per_hour = sum(quote_volumes) / hours if hours else 0.0
    return {'usd_per_hour': per_hour, 'ok': per_hour >= min_usd_per_hour}
