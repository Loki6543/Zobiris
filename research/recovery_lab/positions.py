"""Owner stock positions, tracked against a benchmark (QQQ by default). Research only; no orders.

The log is public, so a position records only the symbol, the entry date and the entry price, never the size.
Each run fetches daily closes (Yahoo public chart endpoint) and writes a markdown page: return since entry,
the benchmark's return over the same days, and the difference.
"""
import json
import os
from datetime import datetime, timezone

from . import stocks


def load(path):
    if not os.path.exists(path):
        return []
    with open(path) as f:
        return [json.loads(l) for l in f if l.strip()]


def add(path, symbol, opened, entry_price, benchmark='QQQ', benchmark_entry=None, note=''):
    rec = {'type': 'position', 'symbol': symbol.upper(), 'opened': opened, 'entry_price': float(entry_price),
           'benchmark': benchmark, 'benchmark_entry': benchmark_entry, 'note': note}
    with open(path, 'a') as f:
        f.write(json.dumps(rec, sort_keys=True) + '\n')
    return rec


def _day(s):
    return int(datetime.strptime(s, '%Y-%m-%d').replace(tzinfo=timezone.utc).timestamp())


def report(positions, closes):
    """closes: {symbol: {day_start_epoch: close}}. One row per open position with data; benchmark entry defaults to
    the benchmark's close on the entry day."""
    rows = []
    for p in positions:
        s, b = closes.get(p['symbol']), closes.get(p['benchmark'])
        if not s:
            continue
        last = max(s)
        r = s[last] / p['entry_price'] - 1
        be = p.get('benchmark_entry') or (b or {}).get(_day(p['opened']))
        br = b[max(b)] / be - 1 if b and be else None
        rows.append({'symbol': p['symbol'], 'opened': p['opened'], 'entry': p['entry_price'], 'last': s[last],
                     'last_day': datetime.fromtimestamp(last, timezone.utc).strftime('%Y-%m-%d'), 'ret': r,
                     'benchmark': p['benchmark'], 'bench_ret': br, 'vs': None if br is None else r - br})
    return rows


def render(rows, now=None):
    now = now or datetime.now(timezone.utc)
    pc = lambda x: '' if x is None else f'{100 * x:+.2f}%'
    lines = ['# Owner positions', '', f'Updated {now:%Y-%m-%d %H:%M} UTC from daily closes. Entry price and date only; sizes are not stored.', '',
             '| Symbol | Opened | Entry | Last close | Return | Benchmark | Benchmark return | vs benchmark |',
             '|---|---|---:|---:|---:|---|---:|---:|']
    for r in rows:
        lines.append(f"| {r['symbol']} | {r['opened']} | {r['entry']:.2f} | {r['last']:.2f} ({r['last_day']}) | {pc(r['ret'])} | "
                     f"{r['benchmark']} | {pc(r['bench_ret'])} | {pc(r['vs'])} |")
    return '\n'.join(lines) + '\n'


def main(argv=None):
    import argparse
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument('--positions', required=True)
    ap.add_argument('--out', required=True)
    x = ap.parse_args(argv)
    pos = load(x.positions)
    closes = {}
    for sym in sorted({p['symbol'] for p in pos} | {p['benchmark'] for p in pos}):
        try:
            closes[sym] = stocks.fetch_yahoo(sym, '1y')
        except Exception as e:   # a failed quote leaves that row out; the previous page stays in git history
            print(f'skip {sym}: {e}')
    rows = report(pos, closes)
    with open(x.out, 'w') as f:
        f.write(render(rows))
    print(json.dumps({'positions': len(pos), 'reported': len(rows)}))


if __name__ == '__main__':
    main()
