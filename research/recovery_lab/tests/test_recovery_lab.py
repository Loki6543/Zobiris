"""Deterministic checks for the recovery research lab. Run from the repo root:
python3 -m unittest discover -s research/recovery_lab/tests -t . -v
"""
import datetime as dt
import math
import os
import tempfile
import unittest

from research.recovery_lab import clock, features, flush_detector, ledger, legacy, patterns


def bar(o, h, l, c):
    return {'o': o, 'h': h, 'l': l, 'c': c}


class Features(unittest.TestCase):
    def test_higher_low_gate_redundancy(self):
        # 38.2% recovery of a 10% drawdown already implies a 4.24% bounce (Oct 21 audit of higherLow.ts)
        self.assertAlmostEqual(features.higher_low_min_bounce(0.10, 0.382), 0.042444, places=5)

    def test_oi_quantity_growth_is_multiplicative(self):
        # archive illustration: +138.2% dollar OI with +21.41% price -> ~+96.2% contracts
        self.assertAlmostEqual(features.oi_quantity_growth(1.382, 0.2141), 0.9621, places=3)
        self.assertNotAlmostEqual(features.oi_quantity_growth(1.382, 0.2141), 1.382 - 0.2141, places=2)

    def test_frozen_event_comp(self):
        highs, lows, closes = [29.18, 28.0, 26.5, 26.2], [28.5, 25.02, 25.14, 25.9], [29.0, 25.5, 26.0, 26.03]
        e = features.frozen_event(highs, lows, closes, 0, 3)
        self.assertAlmostEqual(e['recovered_fraction'], (26.03 - 25.02) / (29.18 - 25.02))
        self.assertAlmostEqual(e['level_382'], 26.609, places=3)
        self.assertEqual(e['trough_idx'], 1)

    def test_anchor_expiry(self):
        highs = [10, 12, 11, 9, 9]
        lows = [8, 9, 7, 8, 8]
        x = features.rolling_anchor_expiry(highs, lows, 4, 4)   # window = bars 1..4
        self.assertEqual((x['high_idx'], x['high_expires_in']), (1, 1))   # the 12 high leaves on the next bar
        self.assertEqual((x['low_idx'], x['low_expires_in']), (2, 2))

    def test_nonoverlap_segments_sum_to_hour(self):
        closes = [100 * math.exp(0.001 * k) for k in range(20)]
        s = features.nonoverlap_momentum(closes, 16, 3)
        self.assertAlmostEqual(sum(s.values()), math.log(closes[16] / closes[4]))

    def test_beta_residual_excludes_eval_window(self):
        btc = [0.01, -0.01] * 10 + [0.02, 0.02]
        coin = [2 * x for x in btc[:-2]] + [0.10, 0.10]   # beta 2 before; a jump inside the evaluation window
        r = features.beta_residual(coin, btc, 20, 2)
        self.assertAlmostEqual(r['beta'], 2.0)
        self.assertAlmostEqual(r['residual'], 0.20 - 2.0 * 0.04)

    def test_venue_gate(self):
        self.assertFalse(features.venue_liquidity([100.0] * 96, 4)['ok'])
        self.assertTrue(features.venue_liquidity([20_000.0] * 96, 4)['ok'])


class Patterns(unittest.TestCase):
    def test_reclaim_taxonomy_matches_audit_example(self):
        # prior N-bar low 100, previous close 110, current low 99, close 105: support reclaimed, close below previous close
        bars = [bar(105, 112, 100, 108), bar(108, 115, 102, 110), bar(110, 111, 99, 105)]
        self.assertEqual(patterns.classify(bars, 2, 2)[0], 'S_level')
        bars[2] = bar(110, 113, 99, 111)
        self.assertEqual(patterns.classify(bars, 2, 2)[0], 'S_strong')
        bars[2] = bar(110, 111, 98, 99)
        self.assertEqual(patterns.classify(bars, 2, 2)[0], 'S_accept')

    def test_mantel_haenszel_known_value(self):
        # single stratum: (10*20)/(10*5)=4 ; two identical strata keep the same common odds ratio
        self.assertAlmostEqual(patterns.mantel_haenszel([(10, 10, 5, 20)]), 4.0)
        self.assertAlmostEqual(patterns.mantel_haenszel([(10, 10, 5, 20), (10, 10, 5, 20)]), 4.0)

    def test_reclaim_study_has_no_lookahead_in_features(self):
        t0 = dt.datetime(2026, 1, 1)
        bars, times = [], []
        for k in range(300):
            p = 100 + 3 * math.sin(k / 5)
            bars.append(bar(p, p + 1, p - 1, p + 0.2 * math.cos(k)))
            times.append(t0 + dt.timedelta(minutes=5 * k))
        a = patterns.reclaim_study(bars, times, 300, 2, 2)
        bars2 = [dict(b) for b in bars]
        for b in bars2[-2:]:
            b['h'] += 50   # changing only the final bars may change outcomes, never the classes of earlier bars
        b2 = patterns.reclaim_study(bars2, times, 300, 2, 2)
        self.assertEqual({k: v['n'] for k, v in a['classes'].items()}, {k: v['n'] for k, v in b2['classes'].items()})

    def test_gap_windows_are_skipped(self):
        t0 = dt.datetime(2026, 1, 1)
        bars = [bar(100, 101, 99, 100)] * 60
        times = [t0 + dt.timedelta(minutes=5 * k + (60 if k >= 30 else 0)) for k in range(60)]
        self.assertLess(patterns.reclaim_study(bars, times, 300, 2, 2)['n_bars'], 60 - 17)

    def test_rolling_target_hits_where_frozen_target_misses(self):
        # The 59-68% vs ~38% disagreement: the old rolling target only had to beat the sweep bar's own (lower) high.
        highs, lows, closes = [10, 10, 9.5, 9.7, 9.0], [9, 9, 8.0, 9.2, 8.5], [9.5, 9.3, 9.4, 9.5, 8.8]
        r = legacy.legacy_sweep_rate(highs, lows, closes, 1)
        self.assertEqual((r['n_sweeps'], r['sweep'], r['plain_new_low']), (1, 1.0, None))
        bars = [bar(c, h, l, c) for h, l, c in zip(highs, lows, closes)]
        cls, _, prior_high = patterns.classify(bars, 2, 1)
        self.assertEqual(cls, 'S_strong')
        self.assertFalse(bars[3]['h'] > prior_high)


class Ledger(unittest.TestCase):
    def test_brier(self):
        self.assertAlmostEqual(ledger.brier(0.55, True), 0.2025)
        self.assertEqual(ledger.brier(1.0, True), 0.0)

    def test_register_rejects_duplicates_and_missing_fields(self):
        with tempfile.TemporaryDirectory() as d:
            p = os.path.join(d, 'f.jsonl')
            rec = {'id': 'F1', 'made_at': '2026-10-22T01:20Z', 'claim': 'x', 'scoring': 'y'}
            ledger.register(p, rec)
            with self.assertRaises(ValueError):
                ledger.register(p, rec)
            with self.assertRaises(ValueError):
                ledger.register(p, {'id': 'F2'})

    def test_sizing_wrong_sign_bets_nothing(self):
        cal = ledger.calibrate([(1.0, -1.0)] * 40)
        self.assertEqual(ledger.size_multiplier(cal), 0.0)
        self.assertEqual(ledger.size_multiplier(ledger.calibrate([(1.0, 1.0)] * 5)), ledger.FLOOR_M)


class FlushAndClock(unittest.TestCase):
    def test_flush_state(self):
        btc = {'r30_pct': -0.2, 'range30_pct': 0.3, 'close': 80778}
        alts = {c: {'r30_pct': -1.4, 'r15_pct': 0.1, 'relvol': 5.8, 'range_pos': 0.1} for c in ('A', 'B', 'C', 'ZRO')}
        self.assertEqual(flush_detector.market_state(btc, alts, anchor_low=79709)[0], 'FLUSH')
        self.assertEqual(flush_detector.market_state(dict(btc, close=79000), alts, anchor_low=79709)[0], 'RISK_OFF')

    def test_clock_profile_detects_planted_burst(self):
        trades, t, px = [], 1_800_000_000 - (1_800_000_000 % 900), 100.0
        for sec in range(0, 4 * 3600):
            px *= 1.00001 if sec % 7 else 0.99999
            k = 5 if (sec % 900) < 10 else 1   # planted quarter-hour burst
            for _ in range(k):
                trades.append((t + sec + 0.5, px, 0.01, 'b' if sec % 2 else 's'))
        prof = clock.quarter_hour_profile(trades, iters=20)
        self.assertGreater(prof['contrasts']['QH_sec0-10_n']['excess_pct'], 200)


if __name__ == '__main__':
    unittest.main()
