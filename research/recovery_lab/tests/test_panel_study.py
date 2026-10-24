import unittest

import numpy as np

from research.recovery_lab import panel_study as ps

SPEC = {'ret': (1, 3, 7, 30), 'short': 7, 'long': 30, 'dd': 30, 'corr': 30, 'btc_drop': 3, 'week': 7}


def _bars(n, seed):
    rng = np.random.default_rng(seed)
    c = 100 * np.exp(np.cumsum(rng.normal(0, 0.02, n)))
    o = np.concatenate([[c[0]], c[:-1]])
    return np.column_stack([o, np.maximum(o, c) * 1.01, np.minimum(o, c) * 0.99, c, rng.uniform(1e5, 2e5, n)])


class PanelStudyTests(unittest.TestCase):
    def test_features_use_no_future_bars(self):
        ts = np.arange(200) * 86400
        a, b = _bars(200, 1), _bars(200, 2)
        full = ps.features(ts, a, b, SPEC)
        a2, b2 = a.copy(), b.copy()
        a2[150:] *= 3
        b2[150:] *= 0.5
        cut = ps.features(ts, a2, b2, SPEC)
        for k in full:
            np.testing.assert_allclose(full[k][:150], cut[k][:150], equal_nan=True, err_msg=k)

    def test_shape_labels(self):
        c = np.array([100.0] * 10 + [101, 103, 106])
        a = np.column_stack([c, c * 1.001, c * 0.999, c, np.ones(len(c))])
        t = ps.targets(a, a, 9, 3, SPEC, True)
        self.assertEqual((t['new_high'], t['shape'], t['dir_abs']), (1, 'breakout_up', 1))
        c2 = np.array([100.0] * 10 + [104, 102, 100])
        a2 = np.column_stack([c2, c2 * 1.001, c2 * 0.999, c2, np.ones(len(c2))])
        self.assertEqual(ps.targets(a2, a2, 9, 3, SPEC, True)['shape'], 'failed_breakout')


if __name__ == '__main__':
    unittest.main()
