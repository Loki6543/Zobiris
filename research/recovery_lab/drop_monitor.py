"""Live BTC-drop monitor for forward test post-btc-drop-relative-strength-forward-v1. Research only; no trading authority.

Pulls closed 1h Kraken spot candles (public API, last ~30 days), applies the registered BTC_DROP rule, and ranks the alt
universe by distance from its 30-day high. Each new drop is logged once with the ranking known at the event hour; once 72
hours have passed it is scored: least-fallen fifth minus most-fallen fifth, and each fifth minus BTC, net of maker costs.
"""
import json
import math
import os
import statistics as st
import time
import urllib.request
from datetime import datetime, timezone

from . import btc_event_study as be
from . import event_study as es

PAIRS = {"BTC": "XBTUSD", "ETH": "ETHUSD", "SOL": "SOLUSD", "XRP": "XRPUSD", "DOGE": "XDGUSD", "ADA": "ADAUSD",
         "LINK": "LINKUSD", "AVAX": "AVAXUSD", "DOT": "DOTUSD", "LTC": "LTCUSD", "BCH": "BCHUSD", "NEAR": "NEARUSD",
         "UNI": "UNIUSD", "AAVE": "AAVEUSD", "INJ": "INJUSD", "SUI": "SUIUSD", "TAO": "TAOUSD", "ZEC": "ZECUSD",
         "ZRO": "ZROUSD", "ARB": "ARBUSD", "TIA": "TIAUSD", "ENA": "ENAUSD", "FIL": "FILUSD", "QNT": "QNTUSD",
         "CVX": "CVXUSD", "SAND": "SANDUSD", "APE": "APEUSD", "GALA": "GALAUSD", "DASH": "DASHUSD", "ATOM": "ATOMUSD",
         "HBAR": "HBARUSD", "STX": "STXUSD", "COMP": "COMPUSD", "CHZ": "CHZUSD", "PYTH": "PYTHUSD", "ETC": "ETCUSD",
         "XLM": "XLMUSD"}
SCORE_H = 72
TEST = 'post-btc-drop-relative-strength-forward-v1'


def fetch_kraken_1h(pair):
    url = f'https://api.kraken.com/0/public/OHLC?pair={pair}&interval=60'
    with urllib.request.urlopen(url, timeout=30) as r:
        d = json.load(r)
    if d.get('error'):
        raise RuntimeError(f'{pair}: {d["error"]}')
    rows = next(iter(v for k, v in d['result'].items() if k != 'last'))
    rows = rows[:-1]   # the last candle is still open
    fmt = lambda s: datetime.fromtimestamp(int(s), timezone.utc).strftime('%Y-%m-%d %H:%M:%S')
    return [{'t': fmt(r[0]), 'o': float(r[1]), 'h': float(r[2]), 'l': float(r[3]), 'c': float(r[4]), 'v': float(r[6])}
            for r in rows]


def fetch_all(pairs=PAIRS, pause=1.1):
    out = {}
    for coin, pair in pairs.items():
        try:
            out[coin] = fetch_kraken_1h(pair)
        except Exception as e:   # one bad pair must not stop the scan
            print(f'skip {coin}: {e}')
        time.sleep(pause)
    return out


def dd_from_high(idx, times, coin, i, window=720):
    bars = [idx[coin].get(times[k]) for k in range(max(0, i - window + 1), i + 1)]
    bars = [b for b in bars if b]
    if len(bars) < 600 or times[i] not in idx[coin]:
        return None
    return idx[coin][times[i]]['c'] / max(b['h'] for b in bars) - 1


def ranking(idx, times, i):
    rows = [(c, dd_from_high(idx, times, c, i)) for c in idx if c != 'BTC']
    return sorted([(c, d) for c, d in rows if d is not None], key=lambda x: -x[1])


def quintiles(rank):
    q = max(3, len(rank) // 5)
    return [c for c, _ in rank[:q]], [c for c, _ in rank[-q:]]


def _load(path):
    if not os.path.exists(path):
        return []
    with open(path) as f:
        return [json.loads(l) for l in f if l.strip()]


def _append(path, rec):
    with open(path, 'a') as f:
        f.write(json.dumps(rec) + '\n')


def score_event(idx, times, ev):
    """Net-maker 72h excess vs BTC for both fifths, entry at the next open after the event hour."""
    if ev['event_t'] not in times:
        return None
    i = times.index(ev['event_t'])
    if i + SCORE_H >= len(times):
        return None
    res = {}
    for name in ('least_fallen', 'most_fallen'):
        xs = [o[0] - o[1] - es.COSTS['maker'] for c in ev[name] if c in idx and (o := es.outcome(idx, c, times, i, SCORE_H))]
        res[name] = round(100 * st.mean(xs), 2) if xs else None
    if None in res.values():
        return None
    res['spread_pct'] = round(res['least_fallen'] - res['most_fallen'], 2)
    return res


def scan(series, ledger_path, now=None):
    now = now or datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%MZ')
    times, idx = es.build_panel(series)
    log = _load(ledger_path)
    logged = {r['event_t'] for r in log if r.get('kind') == 'event'}
    scored = {r['event_t'] for r in log if r.get('kind') == 'score'}
    report = {'as_of_bar': times[-1], 'scanned_at': now}
    hi48 = max(idx['BTC'][t]['c'] for t in times[-49:-1])
    report['btc_close'] = idx['BTC'][times[-1]]['c']
    report['btc_vs_48h_high_pct'] = round(100 * (report['btc_close'] / hi48 - 1), 2)
    report['drop_rule_true_now'] = report['btc_close'] <= 0.95 * hi48
    drops = [e for e in be.find_events(idx, times) if e['type'] == 'BTC_DROP']
    report['drops_in_window'] = [e['t'] for e in drops]
    report['new_events'], report['new_scores'] = [], []
    for e in drops:
        if e['t'] in logged:
            continue
        rank = ranking(idx, times, e['i'])
        top, bottom = quintiles(rank)
        rec = {'kind': 'event', 'test': TEST, 'event_t': e['t'], 'logged_at': now, 'btc_move_48h': e['btc_move'],
               'least_fallen': top, 'most_fallen': bottom, 'n_ranked': len(rank),
               'dd_30d': {c: round(d, 4) for c, d in rank}, 'source': 'Kraken public OHLC 1h, closed bars'}
        _append(ledger_path, rec)
        log.append(rec)
        report['new_events'].append(e['t'])
    for ev in [r for r in log if r.get('kind') == 'event' and r['event_t'] not in scored]:
        s = score_event(idx, times, ev)
        if s:
            rec = {'kind': 'score', 'test': TEST, 'event_t': ev['event_t'], 'scored_at': now, 'horizon_h': SCORE_H, **s}
            _append(ledger_path, rec)
            report['new_scores'].append(rec)
    report['current_ranking'] = [(c, round(100 * d, 1)) for c, d in ranking(idx, times, len(times) - 1)]
    return report


def main(argv=None):
    import argparse
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument('--ledger', default=os.path.join('docs', 'market-memory', 'post-btc-drop-forward.jsonl'))
    a = ap.parse_args(argv)
    rep = scan(fetch_all(), a.ledger)
    rk = rep.pop('current_ranking')
    print(json.dumps(rep, indent=1))
    q = max(3, len(rk) // 5)
    print('Closest to 30-day high:', ', '.join(f'{c} {d:+.1f}%' for c, d in rk[:q]))
    print('Furthest from 30-day high:', ', '.join(f'{c} {d:+.1f}%' for c, d in rk[-q:]))


if __name__ == '__main__':
    main()
