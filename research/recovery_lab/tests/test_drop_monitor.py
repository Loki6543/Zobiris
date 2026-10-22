import json
import os
import tempfile
import unittest

from research.recovery_lab import drop_monitor as dm


def _bars(path, start=0):
    return [{'t': f'2026-01-{1 + (k + start) // 24:02d} {(k + start) % 24:02d}:00:00' if k + start < 31 * 24 else
             f'2026-02-{1 + (k + start - 744) // 24:02d} {(k + start) % 24:02d}:00:00',
             'o': p, 'h': p * 1.001, 'l': p * 0.999, 'c': p} for k, p in enumerate(path)]


class DropMonitorTests(unittest.TestCase):
    def test_logs_event_once_then_scores_after_72h(self):
        n_pre, n_post = 600, 100
        btc = [100.0] * n_pre + [94.0] * n_post                     # drop fires at bar 600
        series = {'BTC': _bars(btc)}
        for a in range(15):
            fall = 1 - 0.01 * a                                       # A00 holds up best, A14 falls most
            series[f'A{a:02d}'] = _bars([10.0] * n_pre + [10.0 * fall] * n_post)
        with tempfile.TemporaryDirectory() as d:
            path = os.path.join(d, 'ledger.jsonl')
            r1 = dm.scan(series, path, now='x')
            r2 = dm.scan(series, path, now='y')
            recs = [json.loads(l) for l in open(path)]
        self.assertEqual(len(r1['new_events']), 1)
        self.assertEqual(r2['new_events'], [])
        ev = [r for r in recs if r['kind'] == 'event'][0]
        self.assertEqual(ev['least_fallen'][0], 'A00')
        self.assertEqual(ev['most_fallen'][-1], 'A14')
        scores = [r for r in recs if r['kind'] == 'score']
        self.assertEqual(len(scores), 1)                              # scored once, not again on the second scan
        self.assertAlmostEqual(scores[0]['spread_pct'], 0.0, places=2)  # flat after the event: no spread


if __name__ == '__main__':
    unittest.main()
