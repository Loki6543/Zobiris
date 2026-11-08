"""Reproducible portfolio risk audit for the Zobiris staged plan (v3).

Usage:  python3 risk_audit.py POSITIONS.json DATA2022.json [--seed 7] [--paths 200000]

POSITIONS.json (kept PRIVATE, not in this repo): {"total": float, "stages": {name: {asset: usd, ...}}}
  Cash is the remainder (total - sum of assets). Asset keys must exist in the model table below.
DATA2022.json: per-asset {"base": close 31 Dec 2021, "end": close 30 Dec 2022, "lows": [monthly lows],
  "div": optional 2022 dividend yield}. Price data from Twelve Data monthly bars (split-adjusted).

Outputs, per stage: (1) 2022 replay, calendar total return (price + listed dividends);
(2) 2022 'each asset at its own monthly low' bound (pessimistic: assumes all lows on the same day);
(3) Monte Carlo 1-year loss distribution with t(4) tails and a crash regime with higher correlation.
Every Monte Carlo parameter is listed in MODEL and printed with the results.
"""
import json, sys, argparse
import numpy as np

MODEL = {   # asset: (group, annual vol, annual drift)  -- judgement inputs, printed with results
 'CRM': ('sw', .38, .08), 'MSFT': ('plat', .28, .09), 'GOOGL': ('plat', .32, .09), 'META': ('plat', .45, .09),
 'ADBE': ('sw', .38, .07), 'TSM': ('chip', .45, .10), 'PYPL': ('fin', .45, .07), 'BRK': ('def', .18, .08),
 'CB': ('def', .20, .08), 'FANG': ('en', .38, .08), 'VOO': ('idx', .18, .08), 'GLD': ('gold', .15, .04),
 'SOL': ('cr', .90, .10), 'ALTS': ('cr', 1.10, .0), 'BTC': ('cr', .60, .08)}
BASE_CORR = {('plat','plat'):.65, ('sw','sw'):.7, ('plat','sw'):.6, ('plat','chip'):.6, ('chip','sw'):.5,
 ('idx','plat'):.8, ('idx','sw'):.65, ('idx','chip'):.65, ('idx','fin'):.6, ('idx','def'):.6, ('idx','en'):.4,
 ('cr','cr'):.8, ('cr','plat'):.35, ('cr','idx'):.35, ('cr','chip'):.4, ('cr','sw'):.3, ('def','def'):.5,
 ('fin','plat'):.5, ('fin','sw'):.5, ('en','plat'):.2}
DEFAULT_CORR, CRASH_CORR_ADD, CRASH_PROB, CRASH_DRIFT, CRASH_VOL_MULT, NU, CASH_RATE = .4, .25, .15, -.25, 1.3, 4, .04

def corr(names, crash):
    g = [MODEL[n][0] for n in names]; k = len(names); C = np.eye(k)
    for i in range(k):
        for j in range(k):
            if i == j: continue
            if 'gold' in (g[i], g[j]): c = 0.0
            else: c = BASE_CORR.get((g[i], g[j]), BASE_CORR.get((g[j], g[i]), DEFAULT_CORR))
            if crash and 'gold' not in (g[i], g[j]): c = min(.95, c + CRASH_CORR_ADD)
            C[i, j] = c
    w, v = np.linalg.eigh(C); C = v @ np.diag(np.clip(w, 1e-6, None)) @ v.T; d = np.sqrt(np.diag(C))
    return C / np.outer(d, d)

def simulate(names, paths, rng):
    vol = np.array([MODEL[n][1] for n in names]); mu = np.array([MODEL[n][2] for n in names])
    hard = np.array([MODEL[n][0] in ('chip', 'cr') for n in names])
    out = np.zeros((paths, len(names))); crash = rng.random(paths) < CRASH_PROB
    for flag in (False, True):
        idx = np.where(crash == flag)[0]
        L = np.linalg.cholesky(corr(names, flag) + 1e-9*np.eye(len(names)))
        z = rng.standard_normal((len(idx), len(names))) @ L.T
        t = z / np.sqrt(rng.chisquare(NU, len(idx))/NU)[:, None] * np.sqrt((NU-2)/NU)
        m = mu + (CRASH_DRIFT*(1+0.8*hard) if flag else 0)
        v = vol*(CRASH_VOL_MULT if flag else 1)
        out[idx] = np.clip(np.exp(m - .5*v**2 + v*t) - 1, -1, None)
    return out

def main():
    a = argparse.ArgumentParser(); a.add_argument('positions'); a.add_argument('data2022')
    a.add_argument('--seed', type=int, default=7); a.add_argument('--paths', type=int, default=200000)
    x = a.parse_args(); P = json.load(open(x.positions)); D = json.load(open(x.data2022))
    T = P['total']; names = sorted({k for s in P['stages'].values() for k in s})
    R = simulate(names, x.paths, np.random.default_rng(x.seed))
    print(f"seed {x.seed}, paths {x.paths}, crash prob {CRASH_PROB}, t df {NU}; model table: {MODEL}")
    for st, pos in P['stages'].items():
        cash = T - sum(pos.values())
        cal = sum(v*((D[k]['end']/D[k]['base']-1) + D[k].get('div', 0)) for k, v in pos.items()) + cash*0.015
        low = sum(v*(min(D[k]['lows'])/D[k]['base']-1) for k, v in pos.items())
        w = np.array([pos.get(n, 0) for n in names])/T; p = (R @ w + cash/T*CASH_RATE)*100
        q5 = np.percentile(p, 5)
        print(f"{st:28} 2022 calendar {cal/T*100:+6.1f}%  at-lows bound {low/T*100:+6.1f}% | "
              f"MC P(loss>24%) {np.mean(p < -24)*100:4.1f}%  5th {q5:+6.1f}%  1st {np.percentile(p,1):+6.1f}%  "
              f"CVaR95 {p[p <= q5].mean():+6.1f}%  median {np.median(p):+5.1f}%")

if __name__ == '__main__':
    main()
