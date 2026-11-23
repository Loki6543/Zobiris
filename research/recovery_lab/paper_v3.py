"""Strategy v3 paper log (research only: no orders, no sizing authority).

Each run (after the 00:00 UTC daily close):
  1. Scores earlier wick bids whose exit close is now known.
  2. Logs tomorrow's wick bids: prior close - 2.5 x ATR14 (Wilder), per coin.
  3. Logs the BTC core target: max(0.25, votes/8 x min(1, 0.40 / 30d vol)).
A bid counts as filled only if the day's low trades 1% through it; exit is the
next daily close. Costs: maker 0.16% + 0.2% slip in, taker 0.31% + 0.2% slip out.
Standard library only. Usage: python3 -m research.recovery_lab.paper_v3
"""
import json
import math
import statistics
import time
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

LOG = Path(__file__).resolve().parents[2] / 'docs' / 'market-memory' / 'paper-strategy-v3.jsonl'
COINS = ['BTC', 'ETH', 'SOL', 'XRP', 'DOGE', 'ADA', 'AVAX', 'LINK', 'DOT', 'LTC', 'BCH', 'XLM', 'UNI', 'AAVE', 'ZEC', 'XMR']
DEPTH, THROUGH = 2.5, 0.01
COST_IN, COST_OUT = 0.0016 + 0.002, 0.0031 + 0.002


def daily(coin):
    pair = 'XBT' if coin == 'BTC' else coin
    url = f'https://api.kraken.com/0/public/OHLC?pair={pair}USD&interval=1440'
    r = json.load(urllib.request.urlopen(url, timeout=30))['result']
    key = next(k for k in r if k != 'last')
    rows = r[key][:-1]  # drop the open candle
    return [(int(x[0]), float(x[2]), float(x[3]), float(x[4])) for x in rows]  # t, high, low, close


def atr14(rows):
    trs = [rows[0][1] - rows[0][2]] + [max(h - l, abs(h - rows[i - 1][3]), abs(l - rows[i - 1][3]))
                                       for i, (_, h, l, _c) in enumerate(rows) if i]
    a = sum(trs[:14]) / 14
    for t in trs[14:]:
        a = (a * 13 + t) / 14
    return a


def core_target(closes):
    votes = sum(closes[-1] > sum(closes[-n:]) / n for n in (10, 20, 50, 100))
    votes += sum(closes[-1] > closes[-1 - n] for n in (10, 20, 50, 100))
    rets = [closes[i] / closes[i - 1] - 1 for i in range(len(closes) - 30, len(closes))]
    vol = statistics.pstdev(rets) * math.sqrt(365)
    return votes, max(0.25, votes / 8 * min(1.0, 0.40 / vol)), vol


def day(t):
    return datetime.fromtimestamp(t, timezone.utc).strftime('%Y-%m-%d')


def main():
    old = [json.loads(x) for x in LOG.read_text().splitlines()] if LOG.exists() else []
    scored = {(o['coin'], o['for_utc_day']) for o in old if o.get('type') == 'paper_wick_score'}
    now = datetime.now(timezone.utc).isoformat(timespec='minutes')
    out = []
    for coin in COINS:
        try:
            rows = daily(coin)
        except Exception as e:  # fail closed: skip the coin, record why
            out.append({'type': 'paper_error', 'coin': coin, 'error': str(e)[:120], 'made_at': now})
            continue
        bydate = {day(t): i for i, (t, *_rest) in enumerate(rows)}
        for o in old:
            if o.get('type') != 'paper_wick_bid' or o['coin'] != coin or (coin, o['for_utc_day']) in scored:
                continue
            i = bydate.get(o['for_utc_day'])
            if i is None or i + 1 >= len(rows):
                continue
            low, exit_close = rows[i][2], rows[i + 1][3]
            filled = low <= o['bid'] * (1 - THROUGH)
            ret = exit_close * (1 - COST_OUT) / (o['bid'] * (1 + COST_IN)) - 1 if filled else None
            out.append({'type': 'paper_wick_score', 'coin': coin, 'for_utc_day': o['for_utc_day'], 'bid': o['bid'],
                        'day_low': low, 'filled': filled, 'exit_close': exit_close if filled else None,
                        'net_ret_pct': round(ret * 100, 2) if filled else None, 'made_at': now})
        prior = rows[-1][3]
        bid = prior - DEPTH * atr14(rows)
        out.append({'type': 'paper_wick_bid', 'coin': coin, 'for_utc_day': day(rows[-1][0] + 86400),
                    'prior_close': prior, 'bid': round(bid, 6), 'bid_pct': round((bid / prior - 1) * 100, 2),
                    'depth_atr': DEPTH, 'made_at': now})
        if coin == 'BTC':
            votes, target, vol = core_target([r[3] for r in rows])
            out.append({'type': 'paper_core_target', 'asof_close': day(rows[-1][0]), 'votes_of_8': votes,
                        'vol_30d': round(vol, 3), 'btc_target_share': round(target, 3),
                        'note': 'acts on Sunday close only', 'made_at': now})
        time.sleep(0.3)
    with LOG.open('a') as f:
        for o in out:
            f.write(json.dumps(o) + '\n')
    fills = [o for o in out if o['type'] == 'paper_wick_score' and o['filled']]
    core = next((o for o in out if o['type'] == 'paper_core_target'), None)
    print(json.dumps({'logged': len(out), 'new_scores': sum(o['type'] == 'paper_wick_score' for o in out),
                      'new_fills': [(o['coin'], o['net_ret_pct']) for o in fills], 'core': core}, indent=1))


if __name__ == '__main__':
    main()
