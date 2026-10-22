"""Do funding rates explain which alts rebound after a flush? (pre-registered flush-funding-positioning-v1). Research only.

Events, outcomes and costs are those of event_study.py. Positioning comes from Kraken Futures hourly relative funding
(PF_<COIN>USD). Only funding stamped at or before the event hour is used.
fund_now: latest funding at or before the event hour. fund_chg: fund_now minus the mean over (t-72h, t-24h].
Negative values mean shorts pay longs, i.e. the trade is crowded short.
"""
import bisect
import gzip
import json
import math
import statistics as st
from datetime import datetime, timedelta

from . import event_study as es

FEATURES = ('fund_now', 'fund_chg')
HORIZONS = (6, 24, 72)


def load_funding(path):
    with gzip.open(path, 'rt') as f:
        return {c: (list(zip(*rows))[0], list(zip(*rows))[1]) for c, rows in json.load(f).items() if rows}


def _iso(t):
    return t.replace(' ', 'T')[:19] + 'Z'


def funding_features(fund, coin, t):
    if coin not in fund:
        return None
    ts, vals = fund[coin]
    now = _iso(t)
    k = bisect.bisect_right(ts, now) - 1
    if k < 0 or ts[k] < _iso(str(datetime.fromisoformat(t) - timedelta(hours=3))):
        return None   # no fresh funding print
    lo = _iso(str(datetime.fromisoformat(t) - timedelta(hours=72)))
    hi = _iso(str(datetime.fromisoformat(t) - timedelta(hours=24)))
    a, b = bisect.bisect_right(ts, lo), bisect.bisect_right(ts, hi)
    past = vals[a:b]
    if len(past) < 24:
        return None
    return {'fund_now': vals[k], 'fund_chg': vals[k] - st.mean(past)}


def run(series, fund, exclude=('XMR',)):
    series = {c: v for c, v in series.items() if c not in exclude}
    times, events, rows, _ = es.run(series)
    out = []
    for r in rows:
        f = funding_features(fund, r['coin'], r['t'])
        if f:
            out.append({**r, **f})
    return events, out


def summarize(events, rows):
    by = {}
    for r in rows:
        by.setdefault(r['i'], []).append(r)
    ids = [i for i in sorted(by) if len(by[i]) >= 10]
    cut = int(len(ids) * 0.6)
    res = {'events_with_funding': len(ids), 'rows': sum(len(by[i]) for i in ids)}
    for h in HORIZONS:
        k = f'ret_{h}'
        ic = {}
        for f in FEATURES:
            parts = {}
            for name, part in (('discovery', ids[:cut]), ('holdout', ids[cut:]), ('all', ids)):
                vals = []
                for i in part:
                    g = [r for r in by[i] if r[k] is not None]
                    if len(g) >= 8 and (v := es.spearman([r[f] for r in g], [r[k] - r[f'btc_{h}'] for r in g])) is not None:
                        vals.append(v)
                if len(vals) >= 3:
                    m, s = st.mean(vals), st.stdev(vals)
                    parts[name] = {'n_events': len(vals), 'mean_ic': round(m, 3), 't': round(m / s * math.sqrt(len(vals)), 2) if s else None}
                else:
                    parts[name] = {'n_events': len(vals)}
            d, ho = parts['discovery'], parts['holdout']
            parts['passes'] = bool(d.get('mean_ic') is not None and ho.get('t') is not None
                                   and (d['mean_ic'] > 0) == (ho['mean_ic'] > 0) and abs(ho['t']) >= 2)
            ic[f] = parts
        res[f'{h}h'] = ic
    # event-level split: did flushes with a sharper funding drop rebound more?
    lvl = []
    for i in ids:
        g = [r for r in by[i] if r['ret_24'] is not None]
        if len(g) < 10:
            continue
        g.sort(key=lambda r: r['r1h'])
        w = g[:max(3, len(g) // 5)]
        lvl.append((st.median(r['fund_chg'] for r in by[i]), st.mean(r['ret_24'] for r in w) - g[0]['btc_24'] - es.COSTS['maker']))
    if len(lvl) >= 6:
        med = st.median(x for x, _ in lvl)
        lo_grp = [y for x, y in lvl if x <= med]
        hi_grp = [y for x, y in lvl if x > med]
        res['event_split_24h'] = {}
        for name, grp in (('funding_fell_most', lo_grp), ('funding_fell_least', hi_grp)):
            a, b = es.bootstrap_ci(grp)
            res['event_split_24h'][name] = {'n': len(grp), 'mean_pct': round(100 * st.mean(grp), 2), 'ci95_pct': [round(100 * a, 2), round(100 * b, 2)]}
    return res


def main(argv=None):
    import argparse
    import os
    here = os.path.dirname(__file__)
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument('--data', default=os.path.join(here, 'data', 'ALTS_1h_2025-08-31_2026-10-22.json.gz'))
    ap.add_argument('--funding', default=os.path.join(here, 'data', 'KRAKEN_FUNDING_1h_2025-10-15_2026-10-22.json.gz'))
    ap.add_argument('--out', required=True)
    a = ap.parse_args(argv)
    events, rows = run(es.load_snapshot(a.data), load_funding(a.funding))
    out = summarize(events, rows)
    os.makedirs(a.out, exist_ok=True)
    with open(os.path.join(a.out, 'funding_study.json'), 'w') as f:
        json.dump(out, f, indent=1)
    print(json.dumps(out, indent=1))


if __name__ == '__main__':
    main()
