"""Owner call log: record a market call with a probability, score it when it resolves. Research only; no orders.

A call is written before its outcome is knowable, with the Kraken price of the coin and of BTC at that moment.
Kinds: `beats_btc` (coin outperforms BTC over the window), `up` (coin higher), `above` (coin closes above --target),
`basket` (the equal-weight --strong basket outperforms the --weak basket).
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


def add(path, coin, kind, p, hours, target=None, note='', now=None, price=spot):
    now = now or _now()
    coin = coin.upper()
    rec = {'id': f'{coin}-{kind}-{now:%Y%m%dT%H%M}', 'type': 'call', 'made_at': now.isoformat(), 'coin': coin, 'kind': kind,
           'p': p, 'resolves_at': (now + timedelta(hours=hours)).isoformat(), 'target': target, 'note': note,
           'coin_price': price(coin), 'btc_price': price('BTC'),
           'claim': f'{coin} {kind}{" " + str(target) if target else ""} within {hours}h', 'scoring': 'brier'}
    if kind == 'above' and target is None:
        raise ValueError('above needs --target')
    register(path, rec)
    return rec


def add_basket(path, strong, weak, p, hours, note='', now=None, price=spot):
    now = now or _now()
    strong, weak = [c.upper() for c in strong], [c.upper() for c in weak]
    rec = {'id': f'BASKET-{now:%Y%m%dT%H%M}', 'type': 'call', 'made_at': now.isoformat(), 'coin': 'BASKET', 'kind': 'basket',
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


def score_due(path, now=None, bars_for=fetch_kraken_1h):
    now = now or _now()
    log = _load(path)
    done = {r['id'] for r in log if r.get('type') == 'outcome'}
    new = []
    for c in [r for r in log if r.get('type') == 'call' and r['id'] not in done]:
        due = datetime.fromisoformat(c['resolves_at'])
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
    log = _load(path)
    outs = [r for r in log if r.get('type') == 'outcome']
    calls = {r['id']: r for r in log if r.get('type') == 'call'}
    if not outs:
        return {'calls': len(calls), 'scored': 0}
    br = [o['brier'] for o in outs]
    return {'calls': len(calls), 'scored': len(outs), 'hit_rate': round(sum(o['hit'] for o in outs) / len(outs), 2),
            'mean_brier': round(sum(br) / len(br), 3), 'coin_flip_brier': 0.25,
            'avg_confidence': round(sum(calls[o['id']]['p'] for o in outs) / len(outs), 2),
            'avg_edge_pct': round(sum(o['coin_minus_btc_pct'] for o in outs) / len(outs), 2)}


def main(argv=None):
    import argparse
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument('--log', default=DEFAULT_LOG)
    sub = ap.add_subparsers(dest='cmd', required=True)
    a = sub.add_parser('add')
    a.add_argument('coin')
    a.add_argument('kind', choices=('beats_btc', 'up', 'above'))
    a.add_argument('--p', type=float, required=True, help='probability the call is right, 0-1')
    a.add_argument('--hours', type=int, required=True)
    a.add_argument('--target', type=float)
    a.add_argument('--note', default='')
    b = sub.add_parser('basket')
    b.add_argument('--strong', required=True, help='comma-separated coins expected to do better')
    b.add_argument('--weak', required=True, help='comma-separated coins expected to do worse')
    b.add_argument('--p', type=float, required=True)
    b.add_argument('--hours', type=int, required=True)
    b.add_argument('--note', default='')
    sub.add_parser('score')
    sub.add_parser('report')
    x = ap.parse_args(argv)
    if x.cmd == 'add':
        print(json.dumps(add(x.log, x.coin, x.kind, x.p, x.hours, x.target, x.note), indent=1))
    elif x.cmd == 'basket':
        print(json.dumps(add_basket(x.log, x.strong.split(','), x.weak.split(','), x.p, x.hours, x.note), indent=1))
    elif x.cmd == 'score':
        print(json.dumps(score_due(x.log), indent=1))
    print(json.dumps(report(x.log), indent=1))


if __name__ == '__main__':
    main()
