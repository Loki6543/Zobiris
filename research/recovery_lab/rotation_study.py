"""Replay of the deployed delayed-rotation screen (pre-registered delayed-rotation-replay-daily-v1). Research only.

Re-implements the status ladder and score of DELAYED_ROTATION_PILOT_V1
(deploy/protection/overrides/src/strategy21/engine/delayedRotation.ts @ f7f869c) on hourly closes, one decision every
7 days at the 00:00 UTC bar. Turnover and volume acceleration need market cap and volume, which the snapshot lacks:
turnover is treated as passing and both terms are left out of the score (a constant term cannot change a rank).
Outcome: coin log return minus BTC log return from the next 1h open to the close 7 or 30 days later, minus maker costs.
"""
import math
import statistics as st

from . import event_study as es

H = {'24h': 24, '7d': 168, '30d': 720, '90d': 2160}
HORIZONS = {'7d': 168, '30d': 720}
STATUSES = ('QUALIFIED', 'NEAR_ROTATION', 'EXTENDED', 'TOO_EARLY', 'NOT_LAGGING', 'STRUCTURALLY_WEAK')


def _pct(idx, coin, times, i, back):
    a, b = idx[coin].get(times[i]), idx[coin].get(times[i - back])
    return 100 * (a['c'] / b['c'] - 1) if a and b else None


def changes(idx, coin, times, i):
    out = {k: _pct(idx, coin, times, i, n) for k, n in H.items()}
    return None if any(v is None for v in out.values()) else out


def _lr(p):
    return math.log1p(p / 100)


def market_gate(rows, btc):
    """BTC 30d > 0, BTC 90d > 0 and >= 45% of alts up over 30d, with at least 10 alts."""
    if len(rows) < 10:
        return False
    breadth = sum(1 for r in rows.values() if r['30d'] > 0) / len(rows)
    return btc['30d'] > 0 and btc['90d'] > 0 and breadth >= 0.45


def status(row, btc):
    rel90 = row['90d'] - btc['90d']
    if row['90d'] <= -35:
        return 'STRUCTURALLY_WEAK'
    if rel90 > -20:
        return 'NOT_LAGGING'
    if row['30d'] <= 0:
        return 'TOO_EARLY'
    if row['7d'] > 12 or row['24h'] > 8:
        return 'EXTENDED'
    if row['7d'] > 0:
        return 'QUALIFIED'
    if row['7d'] >= -8:
        return 'NEAR_ROTATION'
    return 'TOO_EARLY'


def score(row, btc):
    """Deployed weights without turnover and volume: lag 30, recovery 25, RSA 15, entry 15."""
    rel90 = row['90d'] - btc['90d']
    lag = min(1, max(0, (-rel90 - 20) / 30))
    rec = 0 if row['7d'] <= 0 or row['7d'] > 12 else min(1, max(0, 1 - abs(row['7d'] - 5) / 7))
    xr7, xr30 = _lr(row['7d']) - _lr(btc['7d']), _lr(row['30d']) - _lr(btc['30d'])
    rsa = 1 if xr7 / 7 - xr30 / 30 > 0 else 0.35
    entry = min(1, max(0, 1 - max(0, row['24h']) / 8))
    return 100 * (30 * lag + 25 * rec + 15 * rsa + 15 * entry) / 85


def run(series, every_h=168, exclude=('XMR',)):
    series = {c: v for c, v in series.items() if c not in exclude}
    times, idx = es.build_panel(series)
    alts = [c for c in idx if c != 'BTC']
    first = next(i for i in range(H['90d'], len(times)) if times[i].endswith('00:00:00'))
    out = []
    for i in range(first, len(times) - 1, every_h):
        btc = changes(idx, 'BTC', times, i)
        if btc is None:
            continue
        rows = {c: r for c in alts if (r := changes(idx, c, times, i))}
        gate = market_gate(rows, btc)
        for c, r in rows.items():
            rec = {'t': times[i], 'coin': c, 'gate': gate, 'status': status(r, btc), 'score': score(r, btc)}
            for k, n in HORIZONS.items():
                o = es.outcome(idx, c, times, i, n)
                rec[k] = (o[0] - o[1] - es.COSTS['maker']) if o else None
            out.append(rec)
    return out


def summarize(recs, gate_only):
    rs = [r for r in recs if r['gate']] if gate_only else recs
    dates = sorted({r['t'] for r in rs})
    res = {'decision_dates': len(dates), 'rows': len(rs)}
    for k in HORIZONS:
        by = {s: [r[k] for r in rs if r['status'] == s and r[k] is not None] for s in STATUSES}
        res[k] = {s: {'n': len(v), 'mean_pct': round(100 * st.mean(v), 2), 'median_pct': round(100 * st.median(v), 2)}
                  for s, v in by.items() if v}
        # per-date QUALIFIED minus NOT_LAGGING, bootstrapped over dates
        diffs = []
        for d in dates:
            q = [r[k] for r in rs if r['t'] == d and r['status'] == 'QUALIFIED' and r[k] is not None]
            n = [r[k] for r in rs if r['t'] == d and r['status'] == 'NOT_LAGGING' and r[k] is not None]
            if q and n:
                diffs.append(st.mean(q) - st.mean(n))
        if len(diffs) >= 3:
            lo, hi = es.bootstrap_ci(diffs)
            res[k]['qualified_minus_not_lagging'] = {'dates': len(diffs), 'mean_pct': round(100 * st.mean(diffs), 2),
                                                     'ci95_pct': [round(100 * lo, 2), round(100 * hi, 2)]}
        ics = []
        for d in dates:
            g = [r for r in rs if r['t'] == d and r[k] is not None]
            if len(g) >= 8 and (v := es.spearman([r['score'] for r in g], [r[k] for r in g])) is not None:
                ics.append(v)
        if len(ics) >= 3:
            m, s = st.mean(ics), st.stdev(ics)
            res[k]['score_ic'] = {'dates': len(ics), 'mean': round(m, 3), 't': round(m / s * math.sqrt(len(ics)), 2) if s else None}
    return res


def main(argv=None):
    import argparse
    import json
    import os
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument('--data', default=os.path.join(os.path.dirname(__file__), 'data', 'ALTS_1h_2025-08-31_2026-10-22.json.gz'))
    ap.add_argument('--out', required=True)
    a = ap.parse_args(argv)
    recs = run(es.load_snapshot(a.data))
    out = {'gate_on': summarize(recs, True), 'all_dates': summarize(recs, False),
           'gate_on_dates': sorted({r['t'] for r in recs if r['gate']}), 'costs': es.COSTS}
    os.makedirs(a.out, exist_ok=True)
    with open(os.path.join(a.out, 'rotation_study.json'), 'w') as f:
        json.dump(out, f, indent=1)
    print(json.dumps({k: out[k] for k in ('gate_on', 'all_dates')}, indent=1))


if __name__ == '__main__':
    main()
