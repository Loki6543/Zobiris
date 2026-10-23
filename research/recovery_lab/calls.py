"""Owner call log: record a market call with a probability, score it when it resolves. Research only; no orders.

A call is written before its outcome is knowable, with the Kraken price of the coin and of BTC at that moment.
Kinds: `beats_btc` (coin outperforms BTC over the window), `up` (coin higher), `above` (coin closes above --target),
`basket` (the equal-weight --strong basket outperforms the --weak basket), `holds` (no 1h low at or below --target
until the deadline; resolves early as a miss the hour the level breaks).
Scoring uses the close of the Kraken 1h candle at the deadline hour and the Brier score (0 perfect, 0.25 = coin flip at 50%).
"""
import json
import os
import urllib.request
from datetime import datetime, timedelta, timezone

from .drop_monitor import PAIRS, fetch_kraken_1h
from .ledger import brier, register

DEFAULT_LOG = os.path.join('docs', 'market-memory', 'owner-calls.jsonl')


def _pair(coin):
    return PAIRS.get(coin, f'{coin}USD')


def _now():
    return datetime.now(timezone.utc).replace(microsecond=0)


def spot(coin):
    with urllib.request.urlopen(f'https://api.kraken.com/0/public/Ticker?pair={_pair(coin)}', timeout=30) as r:
        d = json.load(r)
    if d.get('error'):
        raise RuntimeError(d['error'])
    return float(next(iter(d['result'].values()))['c'][0])


def _load(path):
    if not os.path.exists(path):
        return []
    with open(path) as f:
        return [json.loads(l) for l in f if l.strip()]


def _id(by, body):
    return body if by == 'owner' else f'{by.upper()}-{body}'


def add(path, coin, kind, p, hours, target=None, note='', now=None, price=spot, by='owner'):
    now = now or _now()
    coin = coin.upper()
    rec = {'id': _id(by, f'{coin}-{kind}-{now:%Y%m%dT%H%M}'), 'by': by, 'type': 'call', 'made_at': now.isoformat(), 'coin': coin, 'kind': kind,
           'p': p, 'resolves_at': (now + timedelta(hours=hours)).isoformat(), 'target': target, 'note': note,
           'coin_price': price(coin), 'btc_price': price('BTC'),
           'claim': f'{coin} {kind}{" " + str(target) if target else ""} within {hours}h', 'scoring': 'brier'}
    if kind in ('above', 'holds') and target is None:
        raise ValueError(f'{kind} needs --target')
    register(path, rec)
    return rec


def add_basket(path, strong, weak, p, hours, note='', now=None, price=spot, by='owner'):
    now = now or _now()
    strong, weak = [c.upper() for c in strong], [c.upper() for c in weak]
    rec = {'id': _id(by, f'BASKET-{now:%Y%m%dT%H%M}'), 'by': by, 'type': 'call', 'made_at': now.isoformat(), 'coin': 'BASKET', 'kind': 'basket',
           'p': p, 'resolves_at': (now + timedelta(hours=hours)).isoformat(), 'note': note, 'strong': strong, 'weak': weak,
           'entry': {c: price(c) for c in strong + weak}, 'btc_price': price('BTC'),
           'claim': f'{"+".join(strong)} beat {"+".join(weak)} within {hours}h', 'scoring': 'brier'}
    register(path, rec)
    return rec


def outcome(call, coin_exit, btc_exit):
    if call['kind'] == 'beats_btc':
        return coin_exit / call['coin_price'] > btc_exit / call['btc_price']
    if call['kind'] == 'up':
        return coin_exit > call['coin_price']
    return coin_exit > call['target']


def _close_at(bars, when):
    key = (when.replace(minute=0, second=0) - timedelta(hours=1)).strftime('%Y-%m-%d %H:%M:%S')   # candle closing at that hour
    return next((b['c'] for b in bars if b['t'] == key), None)


def _score_holds(c, bars, now, due):
    """Miss as soon as a closed 1h candle trades at or below the level; hit once every candle up to the deadline held."""
    start = datetime.fromisoformat(c['made_at']).replace(minute=0, second=0).strftime('%Y-%m-%d %H:%M:%S')
    last_needed = (due.replace(minute=0, second=0) - timedelta(hours=1)).strftime('%Y-%m-%d %H:%M:%S')
    window = [b for b in bars if start <= b['t'] <= last_needed]
    broke = next((b for b in window if b['l'] <= c['target']), None)
    if broke is None and (due > now or not window or window[-1]['t'] != last_needed):
        return None
    hit = broke is None
    low = min(b['l'] for b in window)
    return {'id': c['id'], 'type': 'outcome', 'scored_at': now.isoformat(), 'hit': hit, 'brier': round(brier(c['p'], hit), 4),
            'lowest_low': low, 'broke_at': broke['t'] if broke else None,
            'coin_minus_btc_pct': round(100 * (low / c['target'] - 1), 2)}


def score_due(path, now=None, bars_for=fetch_kraken_1h):
    now = now or _now()
    log = _load(path)
    done = {r['id'] for r in log if r.get('type') == 'outcome'}
    new = []
    for c in [r for r in log if r.get('type') == 'call' and r['id'] not in done]:
        due = datetime.fromisoformat(c['resolves_at'])
        if c['kind'] == 'holds':
            rec = _score_holds(c, bars_for(_pair(c['coin'])), now, due)
            if rec:
                with open(path, 'a') as f:
                    f.write(json.dumps(rec, sort_keys=True) + '\n')
                new.append(rec)
            continue
        if due > now:
            continue
        if c['kind'] == 'basket':
            exits = {k: _close_at(bars_for(_pair(k)), due) for k in c['strong'] + c['weak']}
            if any(v is None for v in exits.values()):
                continue
            ret = lambda g: sum(exits[k] / c['entry'][k] - 1 for k in g) / len(g)
            hit = ret(c['strong']) > ret(c['weak'])
            rec = {'id': c['id'], 'type': 'outcome', 'scored_at': now.isoformat(), 'hit': hit, 'brier': round(brier(c['p'], hit), 4),
                   'strong_pct': round(100 * ret(c['strong']), 2), 'weak_pct': round(100 * ret(c['weak']), 2),
                   'coin_minus_btc_pct': round(100 * (ret(c['strong']) - ret(c['weak'])), 2)}
            with open(path, 'a') as f:
                f.write(json.dumps(rec, sort_keys=True) + '\n')
            new.append(rec)
            continue
        coin_exit, btc_exit = _close_at(bars_for(_pair(c['coin'])), due), _close_at(bars_for(_pair('BTC')), due)
        if coin_exit is None or btc_exit is None:
            continue
        hit = outcome(c, coin_exit, btc_exit)
        rec = {'id': c['id'], 'type': 'outcome', 'scored_at': now.isoformat(), 'hit': hit, 'brier': round(brier(c['p'], hit), 4),
               'coin_exit': coin_exit, 'btc_exit': btc_exit,
               'coin_minus_btc_pct': round(100 * (coin_exit / c['coin_price'] - btc_exit / c['btc_price']), 2)}
        with open(path, 'a') as f:
            f.write(json.dumps(rec, sort_keys=True) + '\n')
        new.append(rec)
    return new


def report(path):
    """Scores per forecaster (calls without a `by` field are the owner's)."""
    log = _load(path)
    outs = [r for r in log if r.get('type') == 'outcome']
    calls = {r['id']: r for r in log if r.get('type') == 'call'}
    out = {'calls': len(calls), 'scored': len(outs), 'coin_flip_brier': 0.25}
    for by in sorted({c.get('by', 'owner') for c in calls.values()}):
        mine = [o for o in outs if calls.get(o['id'], {}).get('by', 'owner') == by]
        n_calls = sum(1 for c in calls.values() if c.get('by', 'owner') == by)
        if not mine:
            out[by] = {'calls': n_calls, 'scored': 0}
            continue
        out[by] = {'calls': n_calls, 'scored': len(mine), 'hit_rate': round(sum(o['hit'] for o in mine) / len(mine), 2),
                   'mean_brier': round(sum(o['brier'] for o in mine) / len(mine), 3),
                   'avg_confidence': round(sum(calls[o['id']]['p'] for o in mine) / len(mine), 2)}
    return out


def main(argv=None):
    import argparse
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument('--log', default=DEFAULT_LOG)
    sub = ap.add_subparsers(dest='cmd', required=True)
    a = sub.add_parser('add')
    a.add_argument('coin')
    a.add_argument('kind', choices=('beats_btc', 'up', 'above', 'holds'))
    a.add_argument('--p', type=float, required=True, help='probability the call is right, 0-1')
    a.add_argument('--hours', type=int, required=True)
    a.add_argument('--target', type=float)
    a.add_argument('--note', default='')
    a.add_argument('--by', default='owner', help='who made the call: owner or claude')
    b = sub.add_parser('basket')
    b.add_argument('--strong', required=True, help='comma-separated coins expected to do better')
    b.add_argument('--weak', required=True, help='comma-separated coins expected to do worse')
    b.add_argument('--p', type=float, required=True)
    b.add_argument('--hours', type=int, required=True)
    b.add_argument('--note', default='')
    b.add_argument('--by', default='owner')
    sub.add_parser('score')
    sub.add_parser('report')
    x = ap.parse_args(argv)
    if x.cmd == 'add':
        print(json.dumps(add(x.log, x.coin, x.kind, x.p, x.hours, x.target, x.note, by=x.by), indent=1))
    elif x.cmd == 'basket':
        print(json.dumps(add_basket(x.log, x.strong.split(','), x.weak.split(','), x.p, x.hours, x.note, by=x.by), indent=1))
    elif x.cmd == 'score':
        print(json.dumps(score_due(x.log), indent=1))
    print(json.dumps(report(x.log), indent=1))


if __name__ == '__main__':
    main()
