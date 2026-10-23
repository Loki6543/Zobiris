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
        self.assertEqual((rep['scored'], rep['owner']['hit_rate']), (1, 1.0))

    def test_basket_call(self):
        made = datetime(2026, 1, 1, 10, 30, tzinfo=timezone.utc)
        prices = {'AAA': 1.0, 'BBB': 2.0, 'CCC': 1.0, 'BTC': 100.0}
        bars = {p: [{'t': '2026-01-02 09:00:00', 'c': c}] for p, c in (('AAAUSD', 1.1), ('BBBUSD', 2.0), ('CCCUSD', 0.9))}
        with tempfile.TemporaryDirectory() as d:
            log = os.path.join(d, 'calls.jsonl')
            calls.add_basket(log, ['aaa', 'bbb'], ['ccc'], 0.6, 24, now=made, price=prices.get)
            out = calls.score_due(log, now=datetime(2026, 1, 3, tzinfo=timezone.utc), bars_for=bars.get)
        self.assertTrue(out[0]['hit'])                                                        # +5% vs -10%
        self.assertAlmostEqual(out[0]['coin_minus_btc_pct'], 15.0)

    def test_holds_resolves_early_on_break_and_hits_when_level_holds(self):
        made = datetime(2026, 1, 1, 10, 30, tzinfo=timezone.utc)
        bar = lambda h, low: {'t': f'2026-01-01 {h:02d}:00:00', 'l': low, 'c': low + 5}
        with tempfile.TemporaryDirectory() as d:
            log = os.path.join(d, 'c.jsonl')
            calls.add(log, 'BTC', 'holds', 0.8, 5, target=100.0, now=made, price=lambda c: 110.0)
            held = {'XBTUSD': [bar(h, 101.0) for h in range(10, 15)]}
            self.assertEqual(calls.score_due(log, now=datetime(2026, 1, 1, 13, tzinfo=timezone.utc), bars_for=held.get), [])
            self.assertTrue(calls.score_due(log, now=datetime(2026, 1, 1, 16, tzinfo=timezone.utc), bars_for=held.get)[0]['hit'])
            log2 = os.path.join(d, 'c2.jsonl')
            calls.add(log2, 'BTC', 'holds', 0.8, 5, target=100.0, now=made, price=lambda c: 110.0)
            broke = {'XBTUSD': [bar(10, 101.0), bar(11, 99.0)]}
            out = calls.score_due(log2, now=datetime(2026, 1, 1, 12, 5, tzinfo=timezone.utc), bars_for=broke.get)
        self.assertEqual((out[0]['hit'], out[0]['broke_at']), (False, '2026-01-01 11:00:00'))

    def test_report_splits_by_forecaster(self):
        made = datetime(2026, 1, 1, 10, 30, tzinfo=timezone.utc)
        prices = {'UNI': 6.0, 'BTC': 80000.0}
        bars = {'UNIUSD': [{'t': '2026-01-01 10:00:00', 'c': 5.0}], 'XBTUSD': [{'t': '2026-01-01 10:00:00', 'c': 80000.0}]}
        with tempfile.TemporaryDirectory() as d:
            log = os.path.join(d, 'c.jsonl')
            calls.add(log, 'UNI', 'up', 0.8, 1, now=made, price=prices.get)
            calls.add(log, 'UNI', 'up', 0.3, 1, now=made, price=prices.get, by='claude')
            calls.score_due(log, now=datetime(2026, 1, 1, 13, tzinfo=timezone.utc), bars_for=bars.get)
            rep = calls.report(log)
        self.assertAlmostEqual(rep['owner']['mean_brier'], 0.64)
        self.assertAlmostEqual(rep['claude']['mean_brier'], 0.09)

    def test_above_needs_target(self):
        with tempfile.TemporaryDirectory() as d, self.assertRaises(ValueError):
            calls.add(os.path.join(d, 'c.jsonl'), 'TIA', 'above', 0.5, 24, price=lambda c: 1.0)


if __name__ == '__main__':
    unittest.main()
