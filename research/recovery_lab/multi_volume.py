"""24-hour volume summed across several exchanges (public ccxt tickers, no keys, no orders). Research only.

Kraken-only volume understates thin coins; this adds the other venues a US-based runner can reach. For each coin it sums
the USD value of every USD, USDT and USDC spot market on each exchange (quote volume, or base volume x last price when
the exchange gives no quote volume). An exchange that errors or blocks the runner is skipped and listed as missing.
Each run appends one record per coin to a JSONL history and rewrites VOLUME.md.
"""
import json
import os
from datetime import datetime, timezone

EXCHANGES = ('kraken', 'coinbase', 'bitstamp', 'gemini', 'binanceus', 'cryptocom', 'okx', 'bybit')
QUOTES = ('USD', 'USDT', 'USDC')
BASE_ALIASES = {'TON': ('TON',), 'DOGE': ('DOGE', 'XDG')}


def _usd(t):
    if t.get('quoteVolume'):
        return float(t['quoteVolume'])
    if t.get('baseVolume') and t.get('last'):
        return float(t['baseVolume']) * float(t['last'])
    return 0.0


def collect(coins, exchanges=EXCHANGES, make=None):
    """({coin: {exchange: usd_24h}}, {exchange: error}). `make(name)` builds an exchange (default: ccxt)."""
    if make is None:
        import ccxt
        make = lambda name: getattr(ccxt, name)({'enableRateLimit': True, 'timeout': 20000})
    vol, missing = {c: {} for c in coins}, {}
    for name in exchanges:
        try:
            ex = make(name)
            markets = ex.load_markets()
            wanted = [s for s, m in markets.items() if m.get('spot') and m.get('quote') in QUOTES
                      and any(m.get('base') in BASE_ALIASES.get(c, (c,)) for c in coins)]
            tick = ex.fetch_tickers(wanted) if wanted else {}
        except Exception as e:   # one venue failing must not stop the others
            missing[name] = f'{type(e).__name__}: {str(e)[:120]}'
            continue
        for sym, t in tick.items():
            base = markets[sym]['base']
            coin = next((c for c in coins if base in BASE_ALIASES.get(c, (c,))), None)
            if coin:
                vol[coin][name] = vol[coin].get(name, 0.0) + _usd(t)
    return vol, missing


def render(vol, missing, now):
    fmt = lambda x: f'${x / 1e9:.2f}B' if x >= 1e9 else f'${x / 1e6:.1f}M' if x >= 1e6 else f'${x / 1e3:.0f}K'
    ex = [e for e in EXCHANGES if e not in missing]
    lines = ['# 24-hour volume across exchanges', '',
             f'Updated {now:%Y-%m-%d %H:%M} UTC. USD, USDT and USDC spot markets. '
             + (f"Unreachable this run: {', '.join(sorted(missing))}." if missing else 'All exchanges reached.'), '',
             '| Coin | Total | Kraken share | ' + ' | '.join(ex) + ' |', '|---|---:|---:|' + '---:|' * len(ex)]
    for coin, v in sorted(vol.items(), key=lambda kv: -sum(kv[1].values())):
        tot = sum(v.values())
        share = f"{100 * v.get('kraken', 0) / tot:.0f}%" if tot else ''
        lines.append(f'| {coin} | {fmt(tot)} | {share} | ' + ' | '.join(fmt(v[e]) if v.get(e) else '' for e in ex) + ' |')
    return '\n'.join(lines) + '\n'


def main(argv=None):
    import argparse
    from .live_panel import COINS
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument('--history', required=True)
    ap.add_argument('--out', required=True)
    x = ap.parse_args(argv)
    now = datetime.now(timezone.utc).replace(microsecond=0)
    vol, missing = collect(('BTC',) + tuple(COINS))
    with open(x.history, 'a') as f:
        for coin, v in vol.items():
            f.write(json.dumps({'t': now.isoformat(), 'coin': coin, 'usd_24h': {k: round(u) for k, u in v.items()},
                                'total': round(sum(v.values()))}, sort_keys=True) + '\n')
    with open(x.out, 'w') as f:
        f.write(render(vol, missing, now))
    print(json.dumps({'coins': len(vol), 'missing': missing}))


if __name__ == '__main__':
    main()
