import unittest

import numpy as np

from research.recovery_lab import alpha158 as a158


def series(n=200, seed=3):
    rng = np.random.default_rng(seed)
    c = 100 * np.exp(np.cumsum(rng.normal(0, 0.02, n)))
    o = np.concatenate([[c[0]], c[:-1]])
    h, l = np.maximum(o, c) * 1.01, np.minimum(o, c) * 0.99
    v = 1e6 * (1 + rng.random(n))
    return o, h, l, c, v


class Alpha158Test(unittest.TestCase):
    def test_158_minus_vwap_and_no_lookahead(self):
        o, h, l, c, v = series()
        full = a158.groups(o, h, l, c, v)
        self.assertEqual(sum(len(g) for g in full.values()), 9 + 3 + 29 * 5)   # Alpha158 without VWAP0
        cut = a158.groups(*(x[:150] for x in (o, h, l, c, v)))
        for g in full:
            for k in full[g]:
                np.testing.assert_allclose(full[g][k][:150], cut[g][k], equal_nan=True, err_msg=k)

    def test_definitions_on_simple_cases(self):
        c = np.arange(1.0, 101.0)
        o, h, l, v = c - 0.5, c + 1, c - 1, np.full(100, 10.0)
        g = a158.groups(o, h, l, c, v)
        self.assertAlmostEqual(g['ROC']['ROC5'][-1], 95 / 100)
        self.assertAlmostEqual(g['RSQR']['RSQR20'][-1], 1.0)
        self.assertAlmostEqual(g['RESI']['RESI20'][-1], 0.0, places=10)
        self.assertAlmostEqual(g['CNTP']['CNTP10'][-1], 1.0)
        self.assertAlmostEqual(g['RANK']['RANK10'][-1], 0.9)
        self.assertAlmostEqual(g['IMAX']['IMAX5'][-1], 0.0)        # the high is the latest bar
        self.assertAlmostEqual(g['IMIN']['IMIN5'][-1], 0.8)        # the low is 4 bars back
        self.assertAlmostEqual(g['VMA']['VMA20'][-1], 1.0)
        self.assertTrue(np.isnan(g['MA']['MA60'][58]))


if __name__ == '__main__':
    unittest.main()
