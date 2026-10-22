import os
import tempfile
import unittest
from datetime import datetime, timezone

from research.recovery_lab import calls


class CallLogTests(unittest.TestCase):
    def test_add_score_report(self):
        made = datetime(2026, 1, 1, 10, 30, tzinfo=timezone.utc)
        prices = {'UNI': 6.0, 'BTC': 80000.0}
        bars = {'UNIUSD': [{'t': '2026-01-04 09:00:00', 'c': 6.6}], 'XBTUSD': [{'t': '2026-01-04 09:00:00', 'c': 81000.0}]}
        with tempfile.TemporaryDirectory() as d:
            log = os.path.join(d, 'calls.jsonl')
            calls.add(log, 'uni', 'beats_btc', 0.7, 72, now=made, price=prices.get)
            self.assertEqual(calls.score_due(log, now=made, bars_for=bars.get), [])        # not due yet
            out = calls.score_due(log, now=datetime(2026, 1, 5, tzinfo=timezone.utc), bars_for=bars.get)
            self.assertEqual(len(out), 1)
            self.assertTrue(out[0]['hit'])                                                    # +10% vs +1.25%
            self.assertAlmostEqual(out[0]['brier'], 0.09)
            self.assertEqual(calls.score_due(log, now=datetime(2026, 1, 6, tzinfo=timezone.utc), bars_for=bars.get), [])
            rep = calls.report(log)
        self.assertEqual((rep['scored'], rep['hit_rate']), (1, 1.0))

    def test_above_needs_target(self):
        with tempfile.TemporaryDirectory() as d, self.assertRaises(ValueError):
            calls.add(os.path.join(d, 'c.jsonl'), 'TIA', 'above', 0.5, 24, price=lambda c: 1.0)


if __name__ == '__main__':
    unittest.main()
