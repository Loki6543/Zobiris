import unittest

from research.recovery_lab import rotation_study as rs

BTC = {'24h': 0.0, '7d': 1.0, '30d': 5.0, '90d': 10.0}


def row(**kw):
    r = {'24h': 1.0, '7d': 3.0, '30d': 4.0, '90d': -20.0}
    r.update(kw)
    return r


class StatusLadderTests(unittest.TestCase):
    """Mirrors evaluateDelayedRotation in deploy/protection/overrides/src/strategy21/engine/delayedRotation.ts."""

    def test_ladder(self):
        self.assertEqual(rs.status(row(), BTC), 'QUALIFIED')
        self.assertEqual(rs.status(row(**{'90d': -35}), BTC), 'STRUCTURALLY_WEAK')
        self.assertEqual(rs.status(row(**{'90d': -9.9}), BTC), 'NOT_LAGGING')      # lag 19.9pp < 20
        self.assertEqual(rs.status(row(**{'30d': 0}), BTC), 'TOO_EARLY')
        self.assertEqual(rs.status(row(**{'7d': 12.1}), BTC), 'EXTENDED')
        self.assertEqual(rs.status(row(**{'24h': 8.1}), BTC), 'EXTENDED')
        self.assertEqual(rs.status(row(**{'7d': -8}), BTC), 'NEAR_ROTATION')
        self.assertEqual(rs.status(row(**{'7d': -8.1}), BTC), 'TOO_EARLY')

    def test_gate_needs_btc_trend_and_breadth(self):
        alts = {f'A{k}': row(**{'30d': 1.0 if k < 5 else -1.0}) for k in range(10)}
        self.assertTrue(rs.market_gate(alts, BTC))
        alts['A4']['30d'] = -1.0
        self.assertFalse(rs.market_gate(alts, BTC))                                 # 40% breadth
        self.assertFalse(rs.market_gate({k: row() for k in 'ABCDEFGHIJ'}, dict(BTC, **{'90d': -1.0})))

    def test_score_peaks_at_5pct_recovery_and_deep_lag(self):
        best = rs.score(row(**{'7d': 5.0, '24h': 0.0, '90d': -50.0}), BTC)
        self.assertGreater(best, rs.score(row(**{'7d': 11.0, '24h': 0.0, '90d': -50.0}), BTC))
        self.assertGreater(best, rs.score(row(**{'7d': 5.0, '24h': 0.0, '90d': -25.0}), BTC))


if __name__ == '__main__':
    unittest.main()
