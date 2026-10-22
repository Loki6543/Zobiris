import unittest

from research.recovery_lab import btc_event_study as be
from research.recovery_lab import event_study as es


def _panel(path):
    times = [f't{k:05d}' for k in range(len(path))]
    s = {'BTC': [{'t': t, 'o': p, 'h': p * 1.001, 'l': p * 0.999, 'c': p} for t, p in zip(times, path)]}
    return es.build_panel(s)


class EventDetectionTests(unittest.TestCase):
    def test_drop_fires_once_at_first_hour_below_95pct(self):
        path = [100.0] * 600 + [97.0, 94.9, 94.0, 93.0] + [93.0] * 100
        times, idx = _panel(path)
        drops = [e for e in be.find_events(idx, times) if e['type'] == 'BTC_DROP']
        self.assertEqual([e['i'] for e in drops], [601])

    def test_recovery_needs_7pct_drawdown_and_4pct_bounce(self):
        down = [100.0 - k * 0.1 for k in range(80)]                      # 100 -> 92.1, an 8% drawdown
        path = [100.0] * 520 + down + [92.1 * (1 + 0.005 * k) for k in range(1, 20)] + [100.0] * 50
        times, idx = _panel(path)
        rec = [e for e in be.find_events(idx, times) if e['type'] == 'BTC_RECOVERY']
        self.assertEqual(len(rec), 1)
        e = rec[0]
        self.assertGreaterEqual(idx['BTC'][times[e['i']]]['c'], 1.04 * idx['BTC'][times[e['low_i']]]['l'])
        self.assertLessEqual(e['i'] - e['low_i'], 72)

    def test_shallow_dip_is_not_a_recovery(self):
        path = [100.0] * 520 + [100.0 - k * 0.05 for k in range(80)] + [97.0 * (1 + 0.005 * k) for k in range(1, 20)]
        times, idx = _panel(path)
        self.assertFalse([e for e in be.find_events(idx, times) if e['type'] == 'BTC_RECOVERY'])


if __name__ == '__main__':
    unittest.main()
