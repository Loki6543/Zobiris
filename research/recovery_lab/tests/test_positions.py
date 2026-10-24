import os
import tempfile
import unittest

from research.recovery_lab import positions as ps


class PositionsTest(unittest.TestCase):
    def test_return_and_benchmark_from_entry_day(self):
        d21, d23 = ps._day('2026-10-21'), ps._day('2026-10-23')
        with tempfile.TemporaryDirectory() as t:
            path = os.path.join(t, 'p.jsonl')
            rec = ps.add(path, 'crm', '2026-10-21', 241.78)
            self.assertNotIn('shares', rec)
            rows = ps.report(ps.load(path), {'CRM': {d21: 241.78, d23: 248.57}, 'QQQ': {d21: 725.20, d23: 704.40}})
        r = rows[0]
        self.assertAlmostEqual(r['ret'], 248.57 / 241.78 - 1)
        self.assertAlmostEqual(r['bench_ret'], 704.40 / 725.20 - 1)
        self.assertAlmostEqual(r['vs'], r['ret'] - r['bench_ret'])
        self.assertIn('| CRM | 2026-10-21 | 241.78 | 248.57 (2026-10-23) | +2.81% | QQQ | -2.87% | +5.68% |', ps.render(rows))

    def test_missing_quotes_skip_or_blank(self):
        pos = [{'symbol': 'CRM', 'opened': '2026-10-21', 'entry_price': 241.78, 'benchmark': 'QQQ', 'benchmark_entry': None}]
        self.assertEqual(ps.report(pos, {}), [])
        self.assertIsNone(ps.report(pos, {'CRM': {ps._day('2026-10-23'): 250.0}})[0]['vs'])


if __name__ == '__main__':
    unittest.main()
