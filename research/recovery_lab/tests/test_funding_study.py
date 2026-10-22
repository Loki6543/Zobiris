import unittest

from research.recovery_lab import funding_study as fs


class FundingFeatureTests(unittest.TestCase):
    def setUp(self):
        ts = tuple(f'2026-01-{1 + h // 24:02d}T{h % 24:02d}:00:00Z' for h in range(24 * 6))
        vals = tuple(0.001 if h < 120 else -0.002 for h in range(24 * 6))
        self.fund = {'AAA': (ts, vals)}

    def test_uses_only_prints_at_or_before_event(self):
        f = fs.funding_features(self.fund, 'AAA', '2026-01-05 23:00:00')     # hour 119, before the flip at 120
        self.assertAlmostEqual(f['fund_now'], 0.001)
        self.assertAlmostEqual(f['fund_chg'], 0.0)

    def test_change_against_prior_window(self):
        f = fs.funding_features(self.fund, 'AAA', '2026-01-06 02:00:00')
        self.assertAlmostEqual(f['fund_now'], -0.002)
        self.assertAlmostEqual(f['fund_chg'], -0.003)

    def test_missing_coin_or_short_history(self):
        self.assertIsNone(fs.funding_features(self.fund, 'BBB', '2026-01-05 23:00:00'))
        self.assertIsNone(fs.funding_features(self.fund, 'AAA', '2026-01-02 00:00:00'))


if __name__ == '__main__':
    unittest.main()
