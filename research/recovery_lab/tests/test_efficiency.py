import unittest

import numpy as np

from research.recovery_lab import efficiency as ef


class EfficiencyTest(unittest.TestCase):
    def test_efficiency_ratio_straight_and_chop(self):
        self.assertAlmostEqual(ef.efficiency_ratio(np.arange(1.0, 30.0), 10)[-1], 1.0)
        chop = np.array([10.0, 11.0] * 15)
        self.assertAlmostEqual(ef.efficiency_ratio(chop, 10)[-1], 0.0)

    def test_kama_uses_only_past_closes(self):
        c = 100 * np.exp(np.cumsum(np.random.default_rng(1).normal(0, 0.02, 200)))
        full, prefix = ef.kama(c), ef.kama(c[:150])
        np.testing.assert_allclose(full[:150], prefix, equal_nan=True)
        self.assertTrue(np.isnan(full[:10]).all())

    def test_flat_series_is_zero_efficiency_and_flat_kama(self):
        c = np.full(40, 5.0)
        self.assertEqual(ef.efficiency_ratio(c, 10)[-1], 0.0)
        self.assertAlmostEqual(ef.kama(c)[-1], 5.0)

    def test_candle_quality_fails_closed(self):
        good = [[1, 2, 0.5, 1.5, 10]] * 3
        self.assertTrue(ef.usable(ef.candle_quality([0, 60, 120], good, 60)))
        bad_high = [[1, 2, 0.5, 1.5, 10], [1, 0.9, 0.5, 0.8, 10], [1, 2, 0.5, 1.5, 10]]
        self.assertEqual(ef.candle_quality([0, 60, 120], bad_high, 60)['invalid'], 1)
        q = ef.candle_quality([0, 60, 300], good, 60)
        self.assertEqual(q['missing'], 3)
        self.assertFalse(ef.usable(q))
        self.assertEqual(ef.candle_quality([0, 60, 60], good, 60)['unordered'], 1)


if __name__ == '__main__':
    unittest.main()
