import unittest
from datetime import datetime, timezone

import numpy as np

from research.recovery_lab import stock_pullback as sp


def days(n):
    start = datetime(2024, 1, 1, tzinfo=timezone.utc).timestamp()
    return np.array([start + 86400 * k for k in range(n)])


class StockPullbackTest(unittest.TestCase):
    def test_signal_needs_uptrend_momentum_and_pullback(self):
        n = 260
        up = np.linspace(100, 200, n)
        dip = up.copy()
        dip[-5:] = dip[-6] * 0.9                     # 10% below its 20-day high, still above the 200-day average
        crash = up.copy()
        crash[-5:] = 80                               # below the 200-day average
        flat = np.full(n, 100.0)
        C = {'DIP': dip, 'UP': up, 'CRASH': crash, 'FLAT': flat, 'SPY': flat, 'QQQ': flat}
        self.assertEqual(set(sp.signals_at(C, n - 1)), {'DIP'})

    def test_backtest_excess_is_relative_to_the_week_average(self):
        n = 300
        d = days(n)
        a = np.linspace(100, 300, n)
        b = np.linspace(100, 150, n)
        C = {'A': a, 'B': b, 'SPY': b, 'QQQ': b}
        weeks = sp.backtest(d, C, lambda C, i: {'A'})
        self.assertTrue(weeks and all(len(w) == 1 and w[0] > 0 for w in weeks))
        s = sp.summarize(weeks, n_boot=200)
        self.assertTrue(s['edge'])
        self.assertEqual(s['hit_rate'], 1.0)


if __name__ == '__main__':
    unittest.main()
