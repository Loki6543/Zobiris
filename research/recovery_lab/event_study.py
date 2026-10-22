"""One-year alt recovery event study (pre-registered alt-recovery-event-study-1h-v1). Research only; no trading authority.

Step 2, the target: what an alt earns over the next 6/24/72 hours relative to simply holding BTC, after round-trip costs.
Entry is the next hourly open after the signal close; exit is the close `h` hours later.
Step 3, the events: hourly alt flushes while BTC holds its floor. FLUSH at hour t when
  |BTC 1h log return| <= 0.5%, BTC close > the lowest low of the prior 168 hours,
  median alt 1h return <= -1.0%, and >= 60% of alts fell more than 0.5%; declustered to one per 24h.
Features use bars at or before t only. Prior-episode response uses only earlier events whose 24h outcome had matured by t.
Evaluation: per-event cross-sectional Spearman IC, chronological discovery (first 60% of events) vs holdout (last 40%).
"""
import math
import statistics as st

TH = {'btc_abs_r1h': 0.005, 'alt_median_r1h': -0.010, 'down_cut': -0.005, 'breadth': 0.60, 'min_alts': 15, 'decluster_h': 24}
HORIZONS = (6, 24, 72)
COSTS = {'maker': 0.0040, 'taker': 0.0076}   # round trip at the user's Kraken tier, as a log-return approximation
FEATURES = ('range_pos_24h', 'dd_30d', 'x24_vs_btc', 'r1h', 'down_beta_30d', 'prior_response')


def _lr(a, b):
    return math.log(a / b)


def _rank(xs):
    order = sorted(range(len(xs)), key=lambda k: xs[k])
    r = [0.0] * len(xs)
    i = 0
    while i < len(order):
        j = i
        while j + 1 < len(order) and xs[order[j + 1]] == xs[order[i]]:
            j += 1
        for k in range(i, j + 1):
            r[order[k]] = (i + j) / 2
        i = j + 1
    return r


def spearman(x, y):
    if len(x) < 3:
        return None
    rx, ry = _rank(x), _rank(y)
    try:
        return st.correlation(rx, ry)
    except st.StatisticsError:
        return None


def build_panel(series):
    """series: {coin: [{'t': 'YYYY-mm-dd HH:MM:SS', 'o','h','l','c'}...]} -> (times, {coin: {t: bar}}), BTC defines the clock."""
    idx = {c: {b['t']: b for b in rows} for c, rows in series.items()}
    times = sorted(idx['BTC'])
    return times, idx


def _down_beta(idx, coin, times, i, n=720):
    xs, ys = [], []
    for k in range(max(1, i - n), i):
        t0, t1 = times[k - 1], times[k]
        b0, b1, c0, c1 = idx['BTC'].get(t0), idx['BTC'].get(t1), idx[coin].get(t0), idx[coin].get(t1)
        if b0 and b1 and c0 and c1:
            rb = _lr(b1['c'], b0['c'])
            if rb < 0:
                xs.append(rb)
                ys.append(_lr(c1['c'], c0['c']))
    if len(xs) < 50:
        return None
    mx, my = st.mean(xs), st.mean(ys)
    vx = sum((a - mx) ** 2 for a in xs)
    return sum((a - mx) * (b - my) for a, b in zip(xs, ys)) / vx if vx else None


def features_at(idx, coin, times, i):
    t = times[i]
    bar = idx[coin].get(t)
    prev = idx[coin].get(times[i - 1])
    if not bar or not prev or i < 720:
        return None
    w24 = [idx[coin].get(times[k]) for k in range(i - 23, i + 1)]
    w30 = [idx[coin].get(times[k]) for k in range(i - 719, i + 1)]
    b24 = idx['BTC'].get(times[i - 24])
    c24 = idx[coin].get(times[i - 24])
    if any(x is None for x in w24) or sum(x is None for x in w30) > 72 or not b24 or not c24:
        return None
    hi, lo = max(x['h'] for x in w24), min(x['l'] for x in w24)
    return {'range_pos_24h': (bar['c'] - lo) / (hi - lo) if hi > lo else 0.5,
            'dd_30d': bar['c'] / max(x['h'] for x in w30 if x) - 1,
            'x24_vs_btc': _lr(bar['c'], c24['c']) - _lr(idx['BTC'][t]['c'], b24['c']),
            'r1h': _lr(bar['c'], prev['c']),
            'down_beta_30d': _down_beta(idx, coin, times, i)}


def outcome(idx, coin, times, i, h):
    """Log return from the next open to the close h hours after the signal, for coin and BTC."""
    if i + h >= len(times):
        return None
    e, x = idx[coin].get(times[i + 1]), idx[coin].get(times[i + h])
    be, bx = idx['BTC'].get(times[i + 1]), idx['BTC'].get(times[i + h])
    if not (e and x and be and bx):
        return None
    return _lr(x['c'], e['o']), _lr(bx['c'], be['o'])


def find_events(idx, times, th=TH):
    alts = [c for c in idx if c != 'BTC']
    events, last = [], -10 ** 9
    for i in range(169, len(times)):
        t, tp = times[i], times[i - 1]
        b, bp = idx['BTC'].get(t), idx['BTC'].get(tp)
        if not b or not bp:
            continue
        rb = _lr(b['c'], bp['c'])
        floor = min((idx['BTC'][times[k]]['l'] for k in range(i - 168, i) if times[k] in idx['BTC']), default=None)
        rs = [_lr(idx[c][t]['c'], idx[c][tp]['c']) for c in alts if t in idx[c] and tp in idx[c]]
        if len(rs) < th['min_alts'] or floor is None:
            continue
        flush = (abs(rb) <= th['btc_abs_r1h'] and b['c'] > floor and st.median(rs) <= th['alt_median_r1h']
                 and sum(1 for r in rs if r < th['down_cut']) / len(rs) >= th['breadth'])
        if flush and i - last >= th['decluster_h']:
            events.append({'i': i, 't': t, 'btc_r1h': rb, 'alt_median_r1h': st.median(rs),
                           'breadth': sum(1 for r in rs if r < th['down_cut']) / len(rs), 'n_alts': len(rs)})
            last = i
    return events


def run(series, baseline_every=24):
    times, idx = build_panel(series)
    alts = [c for c in idx if c != 'BTC']
    events = find_events(idx, times)
    memory = {c: [] for c in alts}   # (mature_index, 24h excess) per coin from earlier events
    rows = []
    for e in events:
        i = e['i']
        for c in alts:
            f = features_at(idx, c, times, i)
            if f is None:
                continue
            past = [x for m, x in memory[c] if m <= i]
            f['prior_response'] = st.mean(past) if past else None
            outs = {h: outcome(idx, c, times, i, h) for h in HORIZONS}
            rows.append({'t': e['t'], 'i': i, 'coin': c, **f, **{f'ret_{h}': (o[0] if o else None) for h, o in outs.items()},
                         **{f'btc_{h}': (o[1] if o else None) for h, o in outs.items()}})
            if outs[24]:
                memory[c].append((i + 24, outs[24][0] - outs[24][1]))
    # unconditional baseline: every `baseline_every` hours, same construction
    base = []
    for i in range(721, len(times) - 73, baseline_every):
        for c in alts:
            f = features_at(idx, c, times, i)
            o = outcome(idx, c, times, i, 24)
            if f and o:
                base.append({'i': i, 'coin': c, 'r1h': f['r1h'], 'ret_24': o[0], 'btc_24': o[1]})
    return times, events, rows, base


def summarize(events, rows, base):
    out = {'n_events': len(events), 'events': [{k: (round(v, 5) if isinstance(v, float) else v) for k, v in e.items() if k != 'i'} for e in events]}
    by_event = {}
    for r in rows:
        by_event.setdefault(r['i'], []).append(r)
    ev_ids = sorted(by_event)
    cut = int(len(ev_ids) * 0.6)
    split = {'discovery': ev_ids[:cut], 'holdout': ev_ids[cut:]}
    # step 2: what the flushed cohort earns, net of costs, vs equal-weight alts and BTC
    coh = {}
    for h in HORIZONS:
        acc = {'worst_quintile': [], 'all_alts': [], 'btc': []}
        for i in ev_ids:
            g = [r for r in by_event[i] if r[f'ret_{h}'] is not None]
            if len(g) < 10:
                continue
            g.sort(key=lambda r: r['r1h'])
            worst = g[:max(3, len(g) // 5)]
            acc['worst_quintile'].append(st.mean(r[f'ret_{h}'] for r in worst))
            acc['all_alts'].append(st.mean(r[f'ret_{h}'] for r in g))
            acc['btc'].append(g[0][f'btc_{h}'])
        def stats(v):
            if not v:
                return None
            return {'n': len(v), 'mean_pct': round(100 * st.mean(v), 2), 'median_pct': round(100 * st.median(v), 2),
                    'win_pct': round(100 * sum(1 for x in v if x > 0) / len(v), 1)}
        coh[h] = {k: stats(v) for k, v in acc.items()}
        ex = [w - b for w, b in zip(acc['worst_quintile'], acc['btc'])]
        coh[h]['worst_minus_btc'] = stats(ex)
        coh[h]['worst_minus_btc_net_maker'] = stats([x - COSTS['maker'] for x in ex])
        coh[h]['worst_minus_btc_net_taker'] = stats([x - COSTS['taker'] for x in ex])
    out['cohort'] = coh
    # baseline: the same worst-quintile-of-1h rule at ordinary hours
    bb = {}
    for r in base:
        bb.setdefault(r['i'], []).append(r)
    bx = []
    for i, g in bb.items():
        if len(g) < 10:
            continue
        g.sort(key=lambda r: r['r1h'])
        worst = g[:max(3, len(g) // 5)]
        bx.append(st.mean(r['ret_24'] for r in worst) - g[0]['btc_24'])
    out['baseline_worst_minus_btc_24h'] = {'n_hours': len(bx), 'mean_pct': round(100 * st.mean(bx), 2) if bx else None,
                                           'win_pct': round(100 * sum(1 for x in bx if x > 0) / len(bx), 1) if bx else None}
    # step 3: which features rank the cross-section of 24h excess returns
    ic = {}
    for f in FEATURES:
        ic[f] = {}
        for part, ids in split.items():
            vals = []
            for i in ids:
                g = [r for r in by_event[i] if r[f] is not None and r['ret_24'] is not None]
                if len(g) >= 8:
                    v = spearman([r[f] for r in g], [r['ret_24'] - r['btc_24'] for r in g])
                    if v is not None:
                        vals.append(v)
            if len(vals) >= 3:
                m, s = st.mean(vals), st.stdev(vals)
                ic[f][part] = {'n_events': len(vals), 'mean_ic': round(m, 3), 't': round(m / s * math.sqrt(len(vals)), 2) if s else None}
            else:
                ic[f][part] = {'n_events': len(vals)}
        d, h = ic[f].get('discovery', {}), ic[f].get('holdout', {})
        ic[f]['passes'] = bool(d.get('mean_ic') is not None and h.get('mean_ic') is not None and h.get('t') is not None
                               and (d['mean_ic'] > 0) == (h['mean_ic'] > 0) and abs(h['t']) >= 2)
    out['feature_ic_24h'] = ic
    out['split'] = {'discovery_events': len(split['discovery']), 'holdout_events': len(split['holdout'])}
    return out


def load_snapshot(path):
    """Read a gzipped {'series': {coin: {'rows': [[t,o,h,l,c], ...]}}} snapshot into run()'s input form."""
    import gzip
    import json
    with gzip.open(path, 'rt') as f:
        d = json.load(f)
    return {c: [dict(zip(('t', 'o', 'h', 'l', 'c'), r)) for r in v['rows']] for c, v in d['series'].items()}


def bootstrap_ci(xs, n=2000, seed=5):
    """95% percentile interval of the mean, resampling events."""
    import random
    rng = random.Random(seed)
    bs = sorted(st.mean(rng.choices(xs, k=len(xs))) for _ in range(n))
    return bs[int(0.025 * n)], bs[int(0.975 * n) - 1]


def main(argv=None):
    import argparse
    import hashlib
    import json
    import os
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument('--data', default=os.path.join(os.path.dirname(__file__), 'data', 'ALTS_1h_2025-08-31_2026-10-22.json.gz'))
    ap.add_argument('--out', required=True)
    a = ap.parse_args(argv)
    series = load_snapshot(a.data)
    times, events, rows, base = run(series)
    out = summarize(events, rows, base)
    by = {}
    for r in rows:
        by.setdefault(r['i'], []).append(r)
    ci = {}
    for h in HORIZONS:
        xs = []
        for i, g in sorted(by.items()):
            g = [r for r in g if r[f'ret_{h}'] is not None]
            if len(g) < 10:
                continue
            g.sort(key=lambda r: r['r1h'])
            w = g[:max(3, len(g) // 5)]
            xs.append(st.mean(r[f'ret_{h}'] for r in w) - g[0][f'btc_{h}'] - COSTS['maker'])
        lo, hi = bootstrap_ci(xs)
        ci[h] = {'n': len(xs), 'mean_pct': round(100 * st.mean(xs), 2), 'ci95_pct': [round(100 * lo, 2), round(100 * hi, 2)]}
    out['worst_minus_btc_net_maker_ci'] = ci
    with open(a.data, 'rb') as f:
        out['input'] = {'file': os.path.basename(a.data), 'sha256': hashlib.sha256(f.read()).hexdigest(),
                        'coins': len(series), 'hours': len(times), 'first': times[0], 'last': times[-1]}
    out['thresholds'], out['costs'] = TH, COSTS
    os.makedirs(a.out, exist_ok=True)
    with open(os.path.join(a.out, 'event_study.json'), 'w') as f:
        json.dump(out, f, indent=1)
    print(json.dumps({'n_events': out['n_events'], 'net_maker_ci': ci,
                      'passing_features': [k for k, v in out['feature_ic_24h'].items() if v['passes']]}, indent=1))


if __name__ == '__main__':
    main()
