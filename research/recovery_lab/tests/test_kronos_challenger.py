import unittest

import numpy as np

from research.recovery_lab import kronos_challenger as kc
from research.recovery_lab import panel_study as ps


class StubPredictor:
    """Stands in for KronosPredictor: returns n random-walk paths with the same columns."""
    def __init__(self, seed=0):
        self.rng = np.random.default_rng(seed)

    def predict_batch(self, dfs, xts, yts, pred_len, **kw):
        import pandas as pd
        out = []
        for df, yt in zip(dfs, yts):
            last = df['close'].iloc[-1]
            c = last * np.exp(np.cumsum(self.rng.normal(0, 0.02, pred_len)))
            out.append(pd.DataFrame({'open': c, 'high': c * 1.01, 'low': c * 0.99, 'close': c,
                                     'volume': df['volume'].mean(), 'amount': df['amount'].mean()}, index=yt))
        return out


class KronosChallengerTest(unittest.TestCase):
    def test_path_probabilities_match_target_definitions(self):
        a = np.array([[100, 101, 99, 100, 10.0]] * 50)
        spec = {'week': 7}
        up = np.array([[100, 103, 100, 102, 1, 15.0]] * 6)       # breaks the 101 weekly high, range 3% > 2%, more volume
        down = np.array([[100, 100.5, 98, 98.5, 1, 5.0]] * 6)    # new low, range 2.5% > 2%, less volume
        p = kc.path_probs([up, down], a, 40, 1, spec)
        self.assertEqual(p, {'dir_abs': 0.5, 'new_high': 0.5, 'new_low': 0.5, 'range_widen': 1.0, 'vol_up': 0.5})

    def test_run_and_aggregate_on_frozen_data_with_stub(self):
        data = kc.load_snapshot()
        saves = []
        recs = kc.run_coin('SOL', StubPredictor(), data=data, log=lambda m: None, save=lambda r: saves.append(len(r)))
        self.assertTrue(recs)
        self.assertEqual(saves[-1], len(recs))                    # saved after every decision, last save = everything
        self.assertEqual(saves, sorted(saves))
        only4h = kc.run_coin('SOL', StubPredictor(), data=data, log=lambda m: None, charts=('4h',))
        self.assertEqual({r['chart'] for r in only4h}, {'4h'})
        self.assertEqual({r['chart'] for r in recs}, {'4h', '1d'})
        ts, a, b = ps.align(data['4h'], 'SOL')
        dec, first = kc.decisions(ts, a, b, '4h')
        self.assertTrue(all(i >= first for i in dec))
        self.assertTrue(all(0 <= r['p_kronos'] <= 1 and 0 <= r['p_panel'] <= 1 for r in recs))
        s = kc.aggregate(recs)
        self.assertEqual(s['proven_cells'], 16)         # 4 proven targets x 2 horizons x 2 charts
        self.assertIn(s['verdict'], ('ADOPT as logged challenger', 'REJECT'))


if __name__ == '__main__':
    unittest.main()
