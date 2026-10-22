"""Alt behaviour in the days after BTC drops and recoveries (pre-registered btc-event-conditional-alt-study-v1). Research only.

BTC_DROP: BTC close <= 0.95 x the highest BTC close of the prior 48 hours.
BTC_RECOVERY: BTC's 7-day low is >= 7% below the highest close of the 14 days before that low, the low is at most 72 hours
old, and BTC closes >= 4% above it. Each type is declustered to one event per 7 days; the event hour is the first hour true.
Outcome: alt minus BTC log return from the next 1h open to the close 24/72/120 hours later, minus maker costs.
Features use bars at or before the event hour only.
"""
import math
import statistics as st

from . import event_study as es
from . import rotation_study as rs

HORIZONS = (24, 72, 120)
FEATURES = ('drop_beta', 'dd_30d', 'bounce_vs_btc', 'range_pos_24h', 'rel90_vs_btc', 'rotation_score')
DECLUSTER_H = 168


def _c(idx, coin, t):
    b = idx[coin].get(t)
    return b['c'] if b else None


def find_events(idx, times):
    btc = idx['BTC']
    c = [btc[t]['c'] if t in btc else None for t in times]
    lo = [btc[t]['l'] if t in btc else None for t in times]
    events, last = [], {'BTC_DROP': -10 ** 9, 'BTC_RECOVERY': -10 ** 9}
    for i in range(504, len(times)):
        if c[i] is None:
            continue
        prior = [(c[k], k) for k in range(i - 48, i) if c[k] is not None]
        if prior and i - last['BTC_DROP'] >= DECLUSTER_H:
            hi, h0 = max(prior)
            if c[i] <= 0.95 * hi:
                events.append({'type': 'BTC_DROP', 'i': i, 't': times[i], 'ref_high_i': h0, 'low_i': i,
                               'btc_move': round(c[i] / hi - 1, 4)})
                last['BTC_DROP'] = i
        if i - last['BTC_RECOVERY'] >= DECLUSTER_H:
            win = [(lo[k], k) for k in range(i - 167, i + 1) if lo[k] is not None]
            if not win:
                continue
            low, j = min(win)
            if i - j > 72:
                continue
            before = [(c[k], k) for k in range(j - 336, j) if c[k] is not None]
            if not before:
                continue
            hi, h0 = max(before)
            if low <= 0.93 * hi and c[i] >= 1.04 * low:
                events.append({'type': 'BTC_RECOVERY', 'i': i, 't': times[i], 'ref_high_i': h0, 'low_i': j,
                               'btc_move': round(low / hi - 1, 4)})
                last['BTC_RECOVERY'] = i
    return events


def features(idx, times, coin, e):
    i, h0, j = e['i'], e['ref_high_i'], e['low_i']
    t, th, tj = times[i], times[h0], times[j]
    ac, ah, aj = _c(idx, coin, t), _c(idx, coin, th), _c(idx, coin, tj)
    bc, bh, bj = _c(idx, 'BTC', t), _c(idx, 'BTC', th), _c(idx, 'BTC', tj)
    if None in (ac, ah, aj, bc, bh, bj):
        return None
    btc_drop = math.log(bj / bh)
    f = {'drop_beta': math.log(aj / ah) / btc_drop if btc_drop else None,
         'bounce_vs_btc': (math.log(ac / aj) - math.log(bc / bj)) if e['type'] == 'BTC_RECOVERY' else None}
    base = es.features_at(idx, coin, times, i)
    f['dd_30d'] = base['dd_30d'] if base else None
    f['range_pos_24h'] = base['range_pos_24h'] if base else None
    r, b = (rs.changes(idx, coin, times, i), rs.changes(idx, 'BTC', times, i)) if i >= 2160 else (None, None)
    f['rel90_vs_btc'] = (r['90d'] - b['90d']) if r and b else None
    f['rotation_score'] = rs.score(r, b) if r and b else None
    return f


def run(series, exclude=('XMR',)):
    series = {c: v for c, v in series.items() if c not in exclude}
    times, idx = es.build_panel(series)
    alts = [c for c in idx if c != 'BTC']
    events = find_events(idx, times)
    rows = []
    for e in events:
        for c in alts:
            f = features(idx, times, c, e)
            if f is None:
                continue
            rec = {'type': e['type'], 'i': e['i'], 't': e['t'], 'coin': c, **f}
            for h in HORIZONS:
                o = es.outcome(idx, c, times, e['i'], h)
                rec[f'x{h}'] = (o[0] - o[1] - es.COSTS['maker']) if o else None
            rows.append(rec)
    return events, rows


def _ic_stats(vals):
    if len(vals) < 3:
        return {'n_events': len(vals)}
    m, s = st.mean(vals), st.stdev(vals)
    return {'n_events': len(vals), 'mean_ic': round(m, 3), 't': round(m / s * math.sqrt(len(vals)), 2) if s else None}


def summarize(events, rows):
    out = {}
    for typ in ('BTC_DROP', 'BTC_RECOVERY'):
        ev = [e for e in events if e['type'] == typ]
        by = {}
        for r in rows:
            if r['type'] == typ:
                by.setdefault(r['i'], []).append(r)
        ids = sorted(by)
        cut = int(len(ids) * 0.6)
        res = {'n_events': len(ev), 'events': [{k: e[k] for k in ('t', 'btc_move')} for e in ev]}
        for h in HORIZONS:
            k = f'x{h}'
            allx, coh = [], []
            for i in ids:
                g = [r for r in by[i] if r[k] is not None]
                if len(g) < 10:
                    continue
                allx.append(st.mean(r[k] for r in g))
                gb = sorted([r for r in g if r['drop_beta'] is not None], key=lambda r: -r['drop_beta'])
                if len(gb) >= 10:
                    coh.append(st.mean(r[k] for r in gb[:max(3, len(gb) // 5)]))
            hr = {'all_alts_minus_btc_net': None, 'high_beta_quintile_minus_btc_net': None}
            if allx:
                lo, hi = es.bootstrap_ci(allx)
                hr['all_alts_minus_btc_net'] = {'n': len(allx), 'mean_pct': round(100 * st.mean(allx), 2), 'ci95_pct': [round(100 * lo, 2), round(100 * hi, 2)]}
            if coh:
                lo, hi = es.bootstrap_ci(coh)
                hr['high_beta_quintile_minus_btc_net'] = {'n': len(coh), 'mean_pct': round(100 * st.mean(coh), 2), 'ci95_pct': [round(100 * lo, 2), round(100 * hi, 2)]}
            ic = {}
            for f in FEATURES:
                parts = {}
                for name, part in (('discovery', ids[:cut]), ('holdout', ids[cut:]), ('all', ids)):
                    vals = []
                    for i in part:
                        g = [r for r in by[i] if r[f] is not None and r[k] is not None]
                        if len(g) >= 8 and (v := es.spearman([r[f] for r in g], [r[k] for r in g])) is not None:
                            vals.append(v)
                    parts[name] = _ic_stats(vals)
                d, ho = parts['discovery'], parts['holdout']
                parts['passes'] = bool(d.get('mean_ic') is not None and ho.get('t') is not None
                                       and (d['mean_ic'] > 0) == (ho['mean_ic'] > 0) and abs(ho['t']) >= 2)
                ic[f] = parts
            hr['feature_ic'] = ic
            res[f'{h}h'] = hr
        out[typ] = res
    return out


def main(argv=None):
    import argparse
    import json
    import os
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument('--data', default=os.path.join(os.path.dirname(__file__), 'data', 'ALTS_1h_2025-08-31_2026-10-22.json.gz'))
    ap.add_argument('--out', required=True)
    a = ap.parse_args(argv)
    events, rows = run(es.load_snapshot(a.data))
    out = summarize(events, rows)
    out['costs'] = es.COSTS
    os.makedirs(a.out, exist_ok=True)
    with open(os.path.join(a.out, 'btc_event_study.json'), 'w') as f:
        json.dump(out, f, indent=1)
    for typ in ('BTC_DROP', 'BTC_RECOVERY'):
        o = out[typ]
        print(typ, 'events', o['n_events'])
        for h in HORIZONS:
            hr = o[f'{h}h']
            print(f"  {h}h all alts {hr['all_alts_minus_btc_net']}  high-beta {hr['high_beta_quintile_minus_btc_net']}")
            for f, v in hr['feature_ic'].items():
                print(f"     {f:15s} disc {v['discovery'].get('mean_ic')} hold {v['holdout'].get('mean_ic')} (t {v['holdout'].get('t')}) "
                      f"all {v['all'].get('mean_ic')} (t {v['all'].get('t')}, n {v['all'].get('n_events')}) pass {v['passes']}")


if __name__ == '__main__':
    main()
