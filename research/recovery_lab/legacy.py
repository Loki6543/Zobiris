"""Exact re-implementation of the 19 Oct 2026 sweep test whose 59-68% figures were questioned as unreproducible.

Definition used then: sweep = bar low below the previous N-bar low and close above the previous close; outcome = any of the next
N bars makes a NEW ROLLING N-bar high (its window includes the sweep bar's own high). Kept for reproducibility only; the frozen-
target, distance-matched test in patterns.py supersedes it.
"""


def legacy_sweep_rate(highs, lows, closes, n):
    count = len(highs)
    new_high = lambda j: highs[j] > max(highs[j - n:j])
    sweep = [i for i in range(n + 1, count - n) if lows[i] < min(lows[i - n:i]) and closes[i] > closes[i - 1]]
    plain = [i for i in range(n + 1, count - n) if lows[i] < min(lows[i - n:i]) and closes[i] <= closes[i - 1]]
    hit = lambda i: any(new_high(j) for j in range(i + 1, i + 1 + n))
    every = range(n + 1, count - n)
    rate = lambda idx: sum(1 for i in idx if hit(i)) / len(idx) if len(idx) else None
    return {'n_sweeps': len(sweep), 'sweep': rate(sweep), 'plain_new_low': rate(plain), 'any_bar': rate(every)}
