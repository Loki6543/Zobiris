import math
import unittest

from research.recovery_lab import event_study as es


def _series(n_hours=900, n_alts=16, flush_at=850):
    """Flat synthetic market; at `flush_at` every alt drops 2% while BTC is flat. Alt k rebounds k*0.1% afterwards."""
    times = [f'2026-01-{1 + h // 24:02d} {h % 24:02d}:00:00' if h < 31 * 24 else f'2026-02-{1 + (h - 744) // 24:02d} {h % 24:02d}:00:00'
             for h in range(n_hours)]
    s = {'BTC': [{'t': t, 'o': 100.0, 'h': 100.5 + (k % 2) * 0.1, 'l': 99.5, 'c': 100.0} for k, t in enumerate(times)]}
    for a in range(n_alts):
        rows, p = [], 10.0
        for k, t in enumerate(times):
            o = p
            if k == flush_at:
                p = p * 0.98
            elif k > flush_at:
                p = p * (1 + 0.001 * a / 24)
            else:
                p = p * (1 + (0.0005 if k % 2 else -0.0005))
            rows.append({'t': t, 'o': o, 'h': max(o, p) * 1.001, 'l': min(o, p) * 0.999, 'c': p})
        s[f'A{a:02d}'] = rows
    return s


class EventStudyTests(unittest.TestCase):
    def setUp(self):
        self.s = _series()
        self.times, self.idx = es.build_panel(self.s)

    def test_flush_detected_once(self):
        ev = es.find_events(self.idx, self.times)
        self.assertEqual([e['i'] for e in ev], [850])

    def test_features_ignore_future_bars(self):
        f1 = es.features_at(self.idx, 'A05', self.times, 850)
        poisoned = {c: list(v) for c, v in self.s.items()}
        for c in poisoned:
            poisoned[c] = poisoned[c][:851] + [dict(b, c=b['c'] * 50, h=b['h'] * 50) for b in poisoned[c][851:]]
        t2, idx2 = es.build_panel(poisoned)
        f2 = es.features_at(idx2, 'A05', t2, 850)
        self.assertEqual(f1, f2)

    def test_outcome_enters_at_next_open(self):
        coin, btc = es.outcome(self.idx, 'A00', self.times, 850, 6)
        e = self.idx['A00'][self.times[851]]['o']
        x = self.idx['A00'][self.times[856]]['c']
        self.assertAlmostEqual(coin, math.log(x / e))
        self.assertAlmostEqual(btc, 0.0)

    def test_prior_response_needs_matured_outcome(self):
        _, events, rows, _ = es.run(self.s)
        self.assertTrue(all(r['prior_response'] is None for r in rows))

    def test_net_cost_subtracted_once(self):
        _, events, rows, base = es.run(self.s)
        out = es.summarize(events, rows, base)
        c = out['cohort'][24]
        self.assertAlmostEqual(c['worst_minus_btc']['mean_pct'] - c['worst_minus_btc_net_maker']['mean_pct'], 100 * es.COSTS['maker'], places=2)
        self.assertAlmostEqual(c['worst_minus_btc']['mean_pct'] - c['worst_minus_btc_net_taker']['mean_pct'], 100 * es.COSTS['taker'], places=2)


if __name__ == '__main__':
    unittest.main()
