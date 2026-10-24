import unittest
from datetime import datetime, timezone

from research.recovery_lab import multi_volume as mv


class FakeExchange:
    def __init__(self, markets, tickers, fail=False):
        self.markets, self.tickers, self.fail = markets, tickers, fail

    def load_markets(self):
        if self.fail:
            raise ConnectionError('451 restricted location')
        return self.markets

    def fetch_tickers(self, symbols):
        return {s: self.tickers[s] for s in symbols}


def m(base, quote, spot=True):
    return {'base': base, 'quote': quote, 'spot': spot}


class MultiVolumeTest(unittest.TestCase):
    def test_sums_usd_stable_quotes_and_skips_failures(self):
        venues = {
            'kraken': FakeExchange({'SOL/USD': m('SOL', 'USD'), 'XDG/USD': m('XDG', 'USD'), 'SOL/EUR': m('SOL', 'EUR')},
                                   {'SOL/USD': {'quoteVolume': 10e6}, 'XDG/USD': {'baseVolume': 1e6, 'last': 0.08}}),
            'coinbase': FakeExchange({'SOL/USD': m('SOL', 'USD'), 'SOL/USDC': m('SOL', 'USDC'), 'SOL/USD:USD': m('SOL', 'USD', False)},
                                     {'SOL/USD': {'quoteVolume': 30e6}, 'SOL/USDC': {'quoteVolume': 5e6}}),
            'bybit': FakeExchange({}, {}, fail=True),
        }
        vol, missing = mv.collect(('SOL', 'DOGE'), exchanges=tuple(venues), make=venues.get)
        self.assertEqual(vol['SOL'], {'kraken': 10e6, 'coinbase': 35e6})     # EUR and perp markets ignored
        self.assertAlmostEqual(vol['DOGE']['kraken'], 80_000)                # XDG alias, base x last
        self.assertIn('bybit', missing)
        page = mv.render(vol, missing, datetime(2026, 10, 24, tzinfo=timezone.utc))
        self.assertIn('| SOL | $45.0M | 22% |', page)
        self.assertIn('Unreachable this run: bybit.', page)


if __name__ == '__main__':
    unittest.main()
