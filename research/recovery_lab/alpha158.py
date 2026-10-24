"""Alpha158-style features (Microsoft Qlib's Alpha158 handler, reimplemented in numpy) and the pre-registered batch test
alpha158-panel-batch-v1 against the live panel model. Research only.

Every feature at bar t uses bars up to and including t. Prices are divided by the current close, volumes by the current
volume, as in Qlib. VWAP0 is omitted because the Kraken pull has no VWAP.
"""
import json
import os

import numpy as np

from . import efficiency as ef
from . import live_panel as lp
from . import panel_study as ps

WINDOWS = (5, 10, 20, 30, 60)
EPS = 1e-12
OPS = ('ROC', 'MA', 'STD', 'BETA', 'RSQR', 'RESI', 'MAX', 'MIN', 'QTLU', 'QTLD', 'RANK', 'RSV', 'IMAX', 'IMIN', 'IMXD',
       'CORR', 'CORD', 'CNTP', 'CNTN', 'CNTD', 'SUMP', 'SUMN', 'SUMD', 'VMA', 'VSTD', 'WVMA', 'VSUMP', 'VSUMN', 'VSUMD')


def _win(x, d):
    """Trailing windows of length d as rows of a 2-D view; row t covers x[t-d+1..t] (NaN rows before t = d-1)."""
    out = np.full((len(x), d), np.nan)
    if len(x) >= d:
        out[d - 1:] = np.lib.stride_tricks.sliding_window_view(x, d)
    return out


def _corr_rows(A, B):
    am, bm = A - A.mean(1, keepdims=True), B - B.mean(1, keepdims=True)
    den = np.sqrt((am ** 2).sum(1) * (bm ** 2).sum(1))
    with np.errstate(invalid='ignore', divide='ignore'):
        return np.where(den > 0, (am * bm).sum(1) / np.where(den > 0, den, 1), np.nan)


def groups(o, h, l, c, v):
    """{group: {feature: array}} for KBAR, PRICE and the 29 rolling operators."""
    G = {}
    rng = h - l + EPS
    G['KBAR'] = {'KMID': (c - o) / o, 'KLEN': (h - l) / o, 'KMID2': (c - o) / rng, 'KUP': (h - np.maximum(o, c)) / o,
                 'KUP2': (h - np.maximum(o, c)) / rng, 'KLOW': (np.minimum(o, c) - l) / o,
                 'KLOW2': (np.minimum(o, c) - l) / rng, 'KSFT': (2 * c - h - l) / o, 'KSFT2': (2 * c - h - l) / rng}
    G['PRICE'] = {'OPEN0': o / c, 'HIGH0': h / c, 'LOW0': l / c}
    lv = np.log(v + 1)
    cp = np.concatenate([[np.nan], c[:-1]])
    vp = np.concatenate([[np.nan], v[:-1]])
    chg, vchg = c - cp, v - vp
    ret = c / cp - 1
    G.update({op: {} for op in OPS})
    for d in WINDOWS:
        C, H, L, V = _win(c, d), _win(h, d), _win(l, d), _win(v, d)
        x = np.arange(d) - (d - 1) / 2
        slope = (C * x).sum(1) / (x ** 2).sum()
        fit = C.mean(1, keepdims=True) + slope[:, None] * x
        ss_res, ss_tot = ((C - fit) ** 2).sum(1), ((C - C.mean(1, keepdims=True)) ** 2).sum(1)
        hi, lo = H.max(1), L.min(1)
        imax, imin = (d - 1 - H.argmax(1)) / d, (d - 1 - L.argmin(1)) / d
        CH, VC = _win(chg, d), _win(vchg, d)
        G['ROC'][f'ROC{d}'] = np.concatenate([np.full(d, np.nan), c[:-d]]) / c if len(c) > d else np.full(len(c), np.nan)
        G['MA'][f'MA{d}'] = C.mean(1) / c
        G['STD'][f'STD{d}'] = C.std(1) / c
        G['BETA'][f'BETA{d}'] = slope / c
        G['RSQR'][f'RSQR{d}'] = np.where(ss_tot > 0, 1 - ss_res / np.where(ss_tot > 0, ss_tot, 1), np.nan)
        G['RESI'][f'RESI{d}'] = (C[:, -1] - fit[:, -1]) / c
        G['MAX'][f'MAX{d}'] = hi / c
        G['MIN'][f'MIN{d}'] = lo / c
        G['QTLU'][f'QTLU{d}'] = np.quantile(C, 0.8, axis=1) / c
        G['QTLD'][f'QTLD{d}'] = np.quantile(C, 0.2, axis=1) / c
        G['RANK'][f'RANK{d}'] = (C < C[:, -1:]).mean(1)
        G['RSV'][f'RSV{d}'] = (c - lo) / (hi - lo + EPS)
        G['IMAX'][f'IMAX{d}'], G['IMIN'][f'IMIN{d}'], G['IMXD'][f'IMXD{d}'] = imax, imin, imax - imin
        G['CORR'][f'CORR{d}'] = _corr_rows(C, _win(lv, d))
        G['CORD'][f'CORD{d}'] = _corr_rows(_win(c / cp, d), _win(np.log(v / vp + 1), d))
        up, dn = (CH > 0).mean(1), (CH < 0).mean(1)
        G['CNTP'][f'CNTP{d}'], G['CNTN'][f'CNTN{d}'], G['CNTD'][f'CNTD{d}'] = up, dn, up - dn
        tot = np.abs(CH).sum(1) + EPS
        sp, sn = np.clip(CH, 0, None).sum(1) / tot, np.clip(-CH, 0, None).sum(1) / tot
        G['SUMP'][f'SUMP{d}'], G['SUMN'][f'SUMN{d}'], G['SUMD'][f'SUMD{d}'] = sp, sn, sp - sn
        G['VMA'][f'VMA{d}'] = V.mean(1) / (v + EPS)
        G['VSTD'][f'VSTD{d}'] = V.std(1) / (v + EPS)
        W = _win(np.abs(ret) * v, d)
        G['WVMA'][f'WVMA{d}'] = W.std(1) / (W.mean(1) + EPS)
        vt = np.abs(VC).sum(1) + EPS
        vp_, vn_ = np.clip(VC, 0, None).sum(1) / vt, np.clip(-VC, 0, None).sum(1) / vt
        G['VSUMP'][f'VSUMP{d}'], G['VSUMN'][f'VSUMN{d}'], G['VSUMD'][f'VSUMD{d}'] = vp_, vn_, vp_ - vn_
    return G


# ---------- batch test ----------

def _brier_rows(X, y, tr_end, te, horizon):
    """Brier sums for a model fit on rows [0, tr_end - horizon) and scored on rows `te` (slice)."""
    Xtr, ytr = X[:max(0, tr_end - horizon)], y[:max(0, tr_end - horizon)]
    if len(set(ytr)) < 2:
        return None
    med = np.nanmedian(Xtr, 0)
    med = np.where(np.isnan(med), 0, med)
    from sklearn.linear_model import LogisticRegression
    from sklearn.preprocessing import StandardScaler
    Xf, Xt = np.where(np.isnan(Xtr), med, Xtr), np.where(np.isnan(X[te]), med, X[te])
    sc = StandardScaler().fit(Xf)
    p = LogisticRegression(C=lp.C_REG, max_iter=2000).fit(sc.transform(Xf), ytr).predict_proba(sc.transform(Xt))[:, 1]
    yt = y[te]
    return float(((p - yt) ** 2).sum()), float(((ytr.mean() - yt) ** 2).sum())


def run_batch(data, group_names=None, log=print):
    """{phase: {group: {(chart, horizon, target): [ext_brier, base_brier, baseline_brier]}}} for phases 'V' and 'T'."""
    acc = {'V': {}, 'T': {}}
    for chart, C in lp.CHARTS.items():
        for coin in lp.COINS:
            if coin not in data[chart]:
                continue
            ts, a, b = ps.align(data[chart], coin)
            if len(ts) < 200:
                continue
            F = ps.features(ts, a, b, C['spec'])
            F.update(ef.features(a[:, 3]))
            M0 = np.column_stack(list(F.values()))
            G = groups(*a.T)
            names = group_names or list(G)
            for h, hz in C['horizons'].items():
                rows = [(i, t) for i in range(len(ts)) if np.isnan(M0[i]).sum() <= len(F) // 3
                        for t in [ps.targets(a, b, i, hz, C['spec'], True)] if t]
                idx = np.array([i for i, _ in rows])
                n = len(rows)
                cv, ct = int(n * 0.55), int(n * 0.80)
                for tn in lp.BINARY:
                    y = np.array([t[tn] for _, t in rows])
                    base_v = _brier_rows(M0[idx], y, cv, slice(cv, ct), hz)
                    base_t = _brier_rows(M0[idx], y, ct, slice(ct, n), hz)
                    for g in names:
                        X1 = np.column_stack([M0] + list(G[g].values()))[idx]
                        for ph, base, (end, te) in (('V', base_v, (cv, slice(cv, ct))), ('T', base_t, (ct, slice(ct, n)))):
                            ext = _brier_rows(X1, y, end, te, hz)
                            if ext is None or base is None:
                                continue
                            cell = acc[ph].setdefault(g, {}).setdefault((chart, h, tn), [0.0, 0.0, 0.0])
                            cell[0] += ext[0]
                            cell[1] += base[0]
                            cell[2] += ext[1]
            log(f'{chart} {coin} done')
    return acc


def judge(cells):
    """Per group: skill change per cell (extended minus baseline, both vs the base rate) and the proven-cell tally."""
    out = {}
    for g, cs in cells.items():
        diffs = {k: (1 - e / r) - (1 - b / r) for k, (e, b, r) in cs.items() if r > 0}
        proven = {k: d for k, d in diffs.items() if k[2] in ('new_high', 'new_low', 'range_widen', 'vol_up')}
        out[g] = {'improved': sum(d > 0 for d in proven.values()), 'cells': len(proven),
                  'worst': min(proven.values(), default=0.0), 'mean': float(np.mean(list(proven.values()))) if proven else 0.0,
                  'diffs': {'|'.join(k): round(d, 4) for k, d in sorted(diffs.items())}}
    return out


def main(argv=None):
    import argparse
    from . import kronos_challenger as kc
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument('--out', required=True)
    x = ap.parse_args(argv)
    acc = run_batch(kc.load_snapshot(), log=lambda m: print(m, flush=True))
    V = judge(acc['V'])
    selected = [g for g, r in V.items() if r['improved'] >= 10 and r['worst'] >= -0.01]
    T = judge({g: acc['T'][g] for g in selected if g in acc['T']})
    confirmed = sorted([g for g, r in T.items() if r['improved'] >= 11 and r['mean'] > 0], key=lambda g: -T[g]['mean'])
    res = {'selection': V, 'selected': selected, 'confirmation': T, 'confirmed': confirmed, 'adopt': confirmed[:2]}
    os.makedirs(os.path.dirname(x.out) or '.', exist_ok=True)
    with open(x.out, 'w') as f:
        json.dump(res, f, indent=1)
    print(json.dumps({'selected': selected, 'confirmed': confirmed, 'adopt': confirmed[:2]}))
    for g in sorted(V, key=lambda g: -V[g]['mean']):
        t = T.get(g)
        print(f"{g:6s} V {V[g]['improved']:2d}/16 mean {V[g]['mean']:+.4f} worst {V[g]['worst']:+.4f}"
              + (f" | T {t['improved']:2d}/16 mean {t['mean']:+.4f}" if t else ''))


if __name__ == '__main__':
    main()
