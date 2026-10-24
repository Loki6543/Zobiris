"""Multi-target prediction panel: which inputs predict which kinds of movement (pre-registered multi-target-panel-baseline-v1).

For COMP, HBAR and SOL (BTC as anchor) this predicts, at every decision point and for several horizons:
direction (absolute and versus BTC), range widening, volume rising, a new 7-day high or low, and the shape of the next window.
Every input is computed from bars at or before the decision bar. Models are fit on the first 70% of decisions and scored once
on the last 30%. Skill is measured against the base rate; input importance is holdout permutation importance.
Research only; no trading authority.
"""
import gzip
import json
import math
import os

import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler

from . import event_study as es
from . import funding_study as fs

HERE = os.path.dirname(__file__)
COINS = ('COMP', 'HBAR', 'SOL')
SHAPES = ('trend_up', 'trend_down', 'breakout_up', 'breakdown', 'failed_breakout', 'range')
SEED = 7


# ---------- data ----------

def load_kraken(interval):
    with gzip.open(os.path.join(HERE, 'data', 'PANEL_kraken_daily_4h_2026-10-24.json.gz'), 'rt') as f:
        d = json.load(f)['series'][str(interval)]
    return {c: {r[0]: r[1:] for r in rows} for c, rows in d.items()}


def load_hourly():
    from datetime import datetime, timezone
    s = es.load_snapshot(os.path.join(HERE, 'data', 'ALTS_1h_2025-08-31_2026-10-22.json.gz'))
    out = {}
    for c in COINS + ('BTC',):
        out[c] = {int(datetime.fromisoformat(b['t']).replace(tzinfo=timezone.utc).timestamp()): [b['o'], b['h'], b['l'], b['c'], None]
                  for b in s[c]}
    return out


def align(series, coin):
    ts = sorted(set(series[coin]) & set(series['BTC']))
    a = np.array([series[coin][t] for t in ts], dtype=float)
    b = np.array([series['BTC'][t] for t in ts], dtype=float)
    return np.array(ts), a, b


# ---------- features ----------

def _lr(x, k):
    out = np.full(len(x), np.nan)
    out[k:] = np.log(x[k:] / x[:-k])
    return out


def _roll(fn, x, n):
    out = np.full(len(x), np.nan)
    for i in range(n - 1, len(x)):
        out[i] = fn(x[i - n + 1:i + 1])
    return out


def features(ts, a, b, spec, funding=None, coin=None):
    """a, b: arrays [o,h,l,c,usd_vol] for coin and BTC. spec: bar-count settings for this dataset."""
    o, h, l, c, v = a.T
    bc = b[:, 3]
    F = {}
    for k in spec['ret']:
        F[f'ret_{k}'] = _lr(c, k)
        F[f'btc_ret_{k}'] = _lr(bc, k)
    k7 = spec['ret'][2]
    F['excess_vs_btc'] = F[f'ret_{k7}'] - F[f'btc_ret_{k7}']
    for name, n in (('rangepos_short', spec['short']), ('rangepos_long', spec['long'])):
        hi, lo = _roll(np.max, h, n), _roll(np.min, l, n)
        F[name] = np.where(hi > lo, (c - lo) / np.where(hi > lo, hi - lo, 1), 0.5)
    F['dd_from_high'] = c / _roll(np.max, h, spec['dd']) - 1
    r1, br1 = _lr(c, 1), _lr(bc, 1)
    rv = _roll(np.std, np.nan_to_num(r1), 20)
    F['realized_vol'] = rv
    F['vol_trend'] = rv / _roll(np.std, np.nan_to_num(r1), 60) - 1
    F['btc_realized_vol'] = _roll(np.std, np.nan_to_num(br1), 20)
    n = spec['corr']
    corr = np.full(len(c), np.nan)
    beta = np.full(len(c), np.nan)
    for i in range(n, len(c)):
        x, y = br1[i - n + 1:i + 1], r1[i - n + 1:i + 1]
        if np.std(x) > 0 and np.std(y) > 0:
            corr[i] = np.corrcoef(x, y)[0, 1]
            beta[i] = np.cov(x, y)[0, 1] / np.var(x)
    F['btc_corr'] = corr
    F['btc_corr_change'] = corr - np.concatenate([np.full(n, np.nan), corr[:-n]])
    F['btc_beta'] = beta
    F['btc_from_recent_high'] = bc / _roll(np.max, bc, spec['btc_drop']) - 1
    if not np.isnan(v).all():
        F['volume_ratio'] = v / _roll(np.mean, v, 20)
        F['volume_trend'] = _roll(np.mean, v, 5) / _roll(np.mean, v, 20) - 1
    dow = ((ts // 86400) + 4) % 7
    F['dow_sin'], F['dow_cos'] = np.sin(2 * np.pi * dow / 7), np.cos(2 * np.pi * dow / 7)
    if spec.get('hourly'):
        hr = (ts % 86400) // 3600
        F['hour_sin'], F['hour_cos'] = np.sin(2 * np.pi * hr / 24), np.cos(2 * np.pi * hr / 24)
    if funding is not None and coin in funding:
        from datetime import datetime, timezone
        lvl, chg = np.full(len(c), np.nan), np.full(len(c), np.nan)
        for i, t in enumerate(ts):
            f = fs.funding_features(funding, coin, datetime.fromtimestamp(t, timezone.utc).strftime('%Y-%m-%d %H:%M:%S'))
            if f:
                lvl[i], chg[i] = f['fund_now'], f['fund_chg']
        F['funding'], F['funding_change'] = lvl, chg
    return F


# ---------- targets ----------

def targets(a, b, i, hz, spec, has_volume):
    o, h, l, c, v = a.T
    if i + hz >= len(c) or i - hz < 0 or i - spec['week'] < 0:
        return None
    nxt = slice(i + 1, i + hz + 1)
    prv = slice(i - hz + 1, i + 1)
    R = math.log(c[i + hz] / c[i])
    B = math.log(b[i + hz, 3] / b[i, 3])
    H, L = h[nxt].max(), l[nxt].min()
    wk_hi, wk_lo = h[i - spec['week'] + 1:i + 1].max(), l[i - spec['week'] + 1:i + 1].min()
    t = {'dir_abs': int(R > 0), 'dir_btc': int(R - B > 0),
         'range_widen': int((H - L) / c[i] > (h[prv].max() - l[prv].min()) / c[i - hz]),
         'new_high': int(H > wk_hi), 'new_low': int(L < wk_lo)}
    if has_volume:
        t['vol_up'] = int(v[nxt].sum() > v[prv].sum())
    rv = np.std(np.diff(np.log(c[max(0, i - 20):i + 1])))
    sig = rv * math.sqrt(hz) if rv > 0 else 1e-9
    close_pos = (c[i + hz] - L) / (H - L) if H > L else 0.5
    if t['new_high'] and close_pos >= 0.7 and R > 0:
        s = 'breakout_up'
    elif t['new_low'] and close_pos <= 0.3 and R < 0:
        s = 'breakdown'
    elif (t['new_high'] and R <= 0) or (t['new_low'] and R >= 0):
        s = 'failed_breakout'
    elif R > 0.5 * sig:
        s = 'trend_up'
    elif R < -0.5 * sig:
        s = 'trend_down'
    else:
        s = 'range'
    t['shape'] = s
    return t


# ---------- evaluation ----------

def _brier(p, y):
    return float(np.mean((p - y) ** 2))


def _logloss(P, Y):
    return float(-np.mean(np.log(np.clip(P[np.arange(len(Y)), Y], 1e-6, 1))))


def _boot_ci(loss_m, loss_b, block=10, n=1000, rng=None):
    """Block bootstrap of skill = 1 - mean(loss_m)/mean(loss_b) over holdout decisions."""
    rng = rng or np.random.default_rng(SEED)
    m, k = len(loss_m), max(1, len(loss_m) // block)
    out = []
    for _ in range(n):
        idx = np.concatenate([np.arange(s, min(s + block, m)) for s in rng.integers(0, m, k)])
        out.append(1 - loss_m[idx].mean() / max(loss_b[idx].mean(), 1e-12))
    out = np.sort(out)
    return float(out[int(0.025 * n)]), float(out[int(0.975 * n) - 1]), float(np.mean(np.array(out) <= 0))


def evaluate(X, y, names, multiclass=False, rng=None):
    n = len(y)
    cut = int(n * 0.7)
    if cut < 30 or n - cut < 20:
        return None
    Xtr, Xte, ytr, yte = X[:cut], X[cut:], y[:cut], y[cut:]
    med = np.nanmedian(Xtr, axis=0)
    Xtr, Xte = np.where(np.isnan(Xtr), med, Xtr), np.where(np.isnan(Xte), med, Xte)
    sc = StandardScaler().fit(Xtr)
    Xtr, Xte = sc.transform(Xtr), sc.transform(Xte)
    model = LogisticRegression(C=0.3, max_iter=2000)
    if multiclass:
        classes = np.arange(len(SHAPES))
        if len(set(ytr)) < 2:
            return None
        model.fit(Xtr, ytr)
        P = np.zeros((len(yte), len(SHAPES)))
        P[:, model.classes_] = model.predict_proba(Xte)
        base = np.bincount(ytr, minlength=len(SHAPES)) / len(ytr)
        Pb = np.tile(np.clip(base, 1e-6, 1), (len(yte), 1))
        lm = -np.log(np.clip(P[np.arange(len(yte)), yte], 1e-6, 1))
        lb = -np.log(Pb[np.arange(len(yte)), yte])
        loss = lambda Xm: -np.log(np.clip(_proba_full(model, Xm)[np.arange(len(yte)), yte], 1e-6, 1)).mean()
    else:
        if len(set(ytr)) < 2:
            return None
        model.fit(Xtr, ytr)
        p = model.predict_proba(Xte)[:, 1]
        pb = np.full(len(yte), ytr.mean())
        lm, lb = (p - yte) ** 2, (pb - yte) ** 2
        loss = lambda Xm: np.mean((model.predict_proba(Xm)[:, 1] - yte) ** 2)
    skill = 1 - lm.mean() / lb.mean()
    lo, hi, p_le0 = _boot_ci(lm, lb, rng=rng)
    rng = rng or np.random.default_rng(SEED)
    base_loss = loss(Xte)
    imp = {}
    for j, name in enumerate(names):
        drops = []
        for _ in range(10):
            Xp = Xte.copy()
            Xp[:, j] = rng.permutation(Xp[:, j])
            drops.append(loss(Xp) - base_loss)
        imp[name] = float(np.mean(drops))
    return {'n_train': cut, 'n_test': n - cut, 'base_rate': (float(ytr.mean()) if not multiclass else None),
            'skill': round(float(skill), 4), 'ci95': [round(lo, 4), round(hi, 4)], 'p_skill_le0': round(p_le0, 4),
            'importance': dict(sorted(imp.items(), key=lambda kv: -kv[1]))}


def _proba_full(model, X):
    P = np.zeros((len(X), len(SHAPES)))
    P[:, model.classes_] = model.predict_proba(X)
    return P


DATASETS = {
    'daily': {'loader': lambda: load_kraken(1440), 'horizons': {'1d': 1, '7d': 7}, 'volume': True,
              'spec': {'ret': (1, 3, 7, 30), 'short': 7, 'long': 30, 'dd': 30, 'corr': 30, 'btc_drop': 3, 'week': 7}},
    'hourly': {'loader': load_hourly, 'horizons': {'2h': 2, '4h': 4, '24h': 24}, 'volume': False, 'funding': True,
               'spec': {'ret': (1, 4, 24, 168), 'short': 24, 'long': 168, 'dd': 720, 'corr': 168, 'btc_drop': 48, 'week': 168, 'hourly': True}},
    '4h_volume': {'loader': lambda: load_kraken(240), 'horizons': {'4h': 1, '24h': 6}, 'volume': True,
                  'spec': {'ret': (1, 6, 42, 180), 'short': 6, 'long': 42, 'dd': 180, 'corr': 42, 'btc_drop': 12, 'week': 42}},
}


def run():
    funding = fs.load_funding(os.path.join(HERE, 'data', 'KRAKEN_FUNDING_1h_2025-10-15_2026-10-22.json.gz'))
    rng = np.random.default_rng(SEED)
    results = []
    for dname, D in DATASETS.items():
        series = D['loader']()
        for coin in COINS:
            ts, a, b = align(series, coin)
            F = features(ts, a, b, D['spec'], funding if D.get('funding') else None, coin)
            names = list(F)
            M = np.column_stack([F[k] for k in names])
            for hname, hz in D['horizons'].items():
                rows = []
                for i in range(0, len(ts), hz):     # non-overlapping decisions
                    if np.isnan(M[i]).sum() > len(names) // 3:
                        continue
                    t = targets(a, b, i, hz, D['spec'], D['volume'])
                    if t:
                        rows.append((i, t))
                if not rows:
                    continue
                X = np.array([M[i] for i, _ in rows])
                for tname in rows[0][1]:
                    mc = tname == 'shape'
                    y = np.array([SHAPES.index(t[tname]) if mc else t[tname] for _, t in rows])
                    r = evaluate(X, y, names, multiclass=mc, rng=rng)
                    if r:
                        results.append({'dataset': dname, 'coin': coin, 'horizon': hname, 'target': tname,
                                        'from': int(ts[rows[0][0]]), 'to': int(ts[rows[-1][0]]), **r})
    # Holm adjustment across every look
    ps = sorted(range(len(results)), key=lambda k: results[k]['p_skill_le0'])
    m = len(results)
    running = 0.0
    for rank, k in enumerate(ps):
        running = max(running, min(1.0, (m - rank) * results[k]['p_skill_le0']))
        results[k]['p_holm'] = round(running, 4)
        results[k]['predictable'] = bool(results[k]['skill'] > 0 and results[k]['ci95'][0] > 0)
    return results


def summarize(results):
    pred = [r for r in results if r['predictable']]
    agg = {}
    for r in pred:
        for k, v in r['importance'].items():
            agg.setdefault(k, []).append(max(v, 0))
    weights = {k: round(float(np.mean(v)), 6) for k, v in agg.items()}
    total = sum(weights.values()) or 1
    return {'looks': len(results), 'predictable': len(pred), 'predictable_after_holm': sum(1 for r in pred if r['p_holm'] < 0.05),
            'input_weight_share': {k: round(v / total, 3) for k, v in sorted(weights.items(), key=lambda kv: -kv[1])}}


def main(argv=None):
    import argparse
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument('--out', required=True)
    a = ap.parse_args(argv)
    res = run()
    summ = summarize(res)
    os.makedirs(a.out, exist_ok=True)
    with open(os.path.join(a.out, 'panel_study.json'), 'w') as f:
        json.dump({'summary': summ, 'results': res}, f, indent=1)
    print(json.dumps(summ, indent=1))
    print(f"{'dataset':10s} {'coin':5s} {'hz':4s} {'target':16s} {'skill':>7s}  ci95             p_holm  top inputs")
    for r in sorted(res, key=lambda r: (r['target'], r['dataset'], r['horizon'], r['coin'])):
        top = ', '.join(k for k, v in list(r['importance'].items())[:3] if v > 0)
        flag = '*' if r['predictable'] else ' '
        print(f"{r['dataset']:10s} {r['coin']:5s} {r['horizon']:4s} {r['target']:16s} {r['skill']:+7.3f}{flag} [{r['ci95'][0]:+.3f},{r['ci95'][1]:+.3f}] {r['p_holm']:.3f}  {top}")


if __name__ == '__main__':
    main()
