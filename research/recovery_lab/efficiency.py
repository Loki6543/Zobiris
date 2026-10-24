"""Path-efficiency inputs and candle checks, ported from MarketLab 1.2 (src/lib/evidence.ts). Research only.

Efficiency ratio (Kaufman): net move over a window divided by the sum of bar-to-bar moves; 1 = a straight line, 0 = pure chop.
KAMA(10, 2, 30): a moving average whose speed follows the efficiency ratio; seeded with the mean of the first `period` closes.
Every value at bar i uses closes up to and including bar i only.
"""
import numpy as np


def efficiency_ratio(c, n):
    out = np.full(len(c), np.nan)
    for i in range(n, len(c)):
        path = np.abs(np.diff(c[i - n:i + 1])).sum()
        out[i] = 0.0 if path == 0 else abs(c[i] - c[i - n]) / path
    return out


def kama(c, period=10, fast=2, slow=30):
    out = np.full(len(c), np.nan)
    if len(c) <= period:
        return out
    er = efficiency_ratio(c, period)
    fa, sa = 2 / (fast + 1), 2 / (slow + 1)
    prev = c[:period].mean()
    for i in range(period, len(c)):
        prev += (er[i] * (fa - sa) + sa) ** 2 * (c[i] - prev)
        out[i] = prev
    return out


def features(c):
    k = kama(c)
    slope = np.full(len(c), np.nan)
    slope[3:] = k[3:] / k[:-3] - 1
    return {'eff_ratio_10': efficiency_ratio(c, 10), 'eff_ratio_30': efficiency_ratio(c, 30),
            'kama_dist': c / k - 1, 'kama_slope': slope}


def candle_quality(times, ohlcv, step):
    """Counts of invalid rows, out-of-order or duplicate times, and missing candles for a series of [o, h, l, c, v] rows."""
    invalid = sum(1 for o, h, l, c, v in ohlcv
                  if not all(np.isfinite([o, h, l, c, v])) or min(o, h, l, c) <= 0 or v < 0 or h < max(o, c, l) or l > min(o, c, h))
    d = np.diff(np.asarray(times))
    unordered = int((d <= 0).sum())
    missing = int(sum(x // step - 1 for x in d if x > step))
    return {'rows': len(times), 'invalid': invalid, 'unordered': unordered, 'missing': missing}


def usable(q, max_missing_share=0.01):
    """Fail closed: no invalid or unordered rows, and at most 1% of candles missing."""
    return q['rows'] > 0 and q['invalid'] == 0 and q['unordered'] == 0 and q['missing'] <= max_missing_share * q['rows']
