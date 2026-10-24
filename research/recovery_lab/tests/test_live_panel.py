import os
import tempfile
import unittest
from datetime import datetime, timezone

import numpy as np

from research.recovery_lab import live_panel as lp


def walk(n, step, seed, start=1_700_000_000):
    rng = np.random.default_rng(seed)
    c = 100 * np.exp(np.cumsum(rng.normal(0, 0.02, n)))
    return {start + i * step: [c[i - 1] if i else c[0], c[i] * 1.01, c[i] * 0.99, c[i], 1e6 * (1 + rng.random())] for i in range(n)}


def data(n4=400, nd=300):
    return {'4h': {k: walk(n4, 14400, s) for s, k in enumerate(('BTC', 'SOL'))},
            '1d': {k: walk(nd, 86400, s + 5) for s, k in enumerate(('BTC', 'SOL'))}}


class LivePanelTest(unittest.TestCase):
    def test_predict_is_idempotent_and_bounded(self):
        with tempfile.TemporaryDirectory() as d:
            now = datetime(2026, 10, 24, tzinfo=timezone.utc)
            made = lp.predict_all(d, data(), ['SOL'], now=now)
            self.assertEqual({r['chart'] for r in made}, {'4h', '1d'})
            for r in made:
                for h, q in r['preds'].items():
                    for k, v in q.items():
                        vals = v.values() if k == 'shape' else [v]
                        self.assertTrue(all(0 <= x <= 1 for x in vals))
            self.assertEqual(lp.predict_all(d, data(), ['SOL'], now=now), [])

    def test_prediction_uses_only_closed_history(self):
        full, cut = data(), data()
        for ch in cut:
            for coin in cut[ch]:
                keep = sorted(cut[ch][coin])[:-10]
                cut[ch][coin] = {t: cut[ch][coin][t] for t in keep}
        a = lp.predict_coin(cut['4h'], 'SOL', '4h')
        trimmed = {k: {t: v for t, v in s.items() if t <= a['bar_t']} for k, s in full['4h'].items()}
        self.assertEqual(lp.predict_coin(trimmed, 'SOL', '4h')['preds'], a['preds'])

    def test_scoring_waits_for_window_then_scores_once(self):
        with tempfile.TemporaryDirectory() as d:
            early = data(n4=390, nd=290)
            last_t = max(early['4h']['SOL'])
            made_at = datetime.fromtimestamp(last_t + 14400, timezone.utc)
            lp.predict_all(d, early, ['SOL'], now=made_at)
            self.assertEqual(lp.score_all(d, early, now=made_at), [])
            later = datetime.fromtimestamp(max(early['1d']['SOL']) + 9 * 86400, timezone.utc)
            out = lp.score_all(d, data(), now=later)
            self.assertEqual({(o['chart'], o['horizon']) for o in out}, {('4h', '4h'), ('4h', '24h'), ('1d', '1d'), ('1d', '7d')})
            self.assertEqual(lp.score_all(d, data(), now=later), [])
            rows = lp.scorecard(d)
            self.assertTrue(all(r['n'] == 1 for r in rows))
            self.assertIn('Scorecard', lp.render(d))


if __name__ == '__main__':
    unittest.main()
