"""Forecast and test registry with proper scoring. Research only: sizes are caps for shadow evaluation, never orders.

- register(): append a forecast BEFORE its outcome is observable; entries are never edited, outcomes are appended separately.
- brier(): squared-error score of a probability against a 0/1 outcome (lower is better; 0.25 = coin flip at p=0.5).
- calibrate()/size_multiplier(): the 2m - m^2 rule. A forecast scaled by c earns R^2(c) = 2c*Sxy/Syy - c^2*Sxx/Syy, best at
  c* = Sxy/Sxx. Betting twice the best size scores zero; more loses even when direction is right.
- sharpe_hurdle(): two-sided Bonferroni hurdle for an annualised Sharpe after n_tests tries over `years` of data.
"""
import json
import math
import os
from statistics import NormalDist

MIN_OUTCOMES = 30
FLOOR_M = 0.5


def register(path, record):
    for k in ('id', 'made_at', 'claim', 'scoring'):
        if k not in record:
            raise ValueError(f'forecast missing {k}')
    if os.path.exists(path):
        with open(path) as f:
            if any(json.loads(line).get('id') == record['id'] for line in f if line.strip()):
                raise ValueError(f"duplicate forecast id {record['id']}")
    with open(path, 'a') as f:
        f.write(json.dumps(record, sort_keys=True) + '\n')


def brier(p, outcome):
    if not 0 <= p <= 1:
        raise ValueError('probability outside [0, 1]')
    return (p - (1 if outcome else 0)) ** 2


def calibrate(pairs):
    n = len(pairs)
    sxx = sum(f * f for f, _ in pairs)
    sxy = sum(f * y for f, y in pairs)
    syy = sum(y * y for _, y in pairs)
    if n == 0 or sxx == 0 or syy == 0:
        return {'n': n, 'c_star': None}
    c = sxy / sxx
    r2 = lambda k: 2 * k * sxy / syy - k * k * sxx / syy
    return {'n': n, 'c_star': c, 'r2_raw': r2(1.0), 'r2_best': r2(c) if c > 0 else 0.0}


def size_multiplier(cal):
    """Fraction of the planned research size cap: no measured edge -> 0, too few outcomes -> floor."""
    if cal['n'] < MIN_OUTCOMES or cal.get('c_star') is None:
        return FLOOR_M
    if cal['c_star'] <= 0:
        return 0.0
    return min(1.0, FLOOR_M + (1 - FLOOR_M) * min(1.0, cal['n'] / 200))


def sharpe_hurdle(n_tests, years, alpha=0.05):
    z = NormalDist().inv_cdf(1 - alpha / (2 * max(1, n_tests)))
    return z / math.sqrt(years)
