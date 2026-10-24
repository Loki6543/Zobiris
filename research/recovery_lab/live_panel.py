"""Live multi-target panel: predict and score many kinds of movement for many coins, automatically. Research only; no orders.

Each run pulls Kraken public 4h and daily candles (with USD volume) for every coin and BTC, refits the panel model
(panel_study: same inputs, same targets, logistic regression on standardized features) on each coin's own history, and
logs probabilities for the latest closed candle: 4h and 24h ahead on the 4h chart, 1 and 7 days ahead on the daily chart.
Targets: up or down, beat BTC, range widens, volume rises, new 7-day high, new 7-day low, and the shape of the window.
A candle is predicted once (runs are idempotent). Predictions are scored against the same target definitions once their
window has closed, and the scorecard compares each target's Brier score with the base rate the model was trained on.
"""
import json
import os
import time
import urllib.request
from datetime import datetime, timezone

import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler

from . import alpha158 as a158
from . import efficiency as ef
from . import panel_study as ps
from .drop_monitor import PAIRS

MODEL = 'panel-logit-v3'   # v2 added path efficiency (kama-efficiency-panel-input-v1); v3 adds Alpha158 KBAR + VMA (alpha158-panel-batch-v1)
# C=0.01: on a purged 70/30 split of the 24 Oct Kraken pull (15 coins), C=0.3 (the study setting) overfit the overlapping
# 4h rows; C=0.01 kept new-high/low skill +0.12 to +0.32 and volume/range +0.04 to +0.09. Direction stayed below base.
C_REG = 0.01
DEFAULT_DIR = os.path.join('docs', 'market-memory', 'panel')
COINS = ('COMP', 'HBAR', 'SOL', 'ETH', 'XRP', 'ADA', 'AVAX', 'LINK', 'DOGE', 'DOT', 'LTC', 'NEAR', 'SUI', 'ZEC', 'TON')
ALIASES = {'TON': 'TONUSD', 'GRAM': 'TONUSD'}
CHARTS = {
    '4h': {'interval': 240, 'horizons': {'4h': 1, '24h': 6}, 'spec': ps.DATASETS['4h_volume']['spec']},
    '1d': {'interval': 1440, 'horizons': {'1d': 1, '7d': 7}, 'spec': ps.DATASETS['daily']['spec']},
}
BINARY = ('dir_abs', 'dir_btc', 'range_widen', 'vol_up', 'new_high', 'new_low')
LABELS = {'dir_abs': 'closes higher', 'dir_btc': 'beats BTC', 'range_widen': 'range widens', 'vol_up': 'volume rises',
          'new_high': 'new 7-day high', 'new_low': 'new 7-day low', 'shape': 'shape'}


# ---------- data ----------

def fetch_ohlc(coin, interval):
    """Closed Kraken candles as {open_time: [o, h, l, c, usd_volume]}; the forming candle is dropped."""
    pair = PAIRS.get(coin) or ALIASES.get(coin) or f'{coin}USD'
    with urllib.request.urlopen(f'https://api.kraken.com/0/public/OHLC?pair={pair}&interval={interval}', timeout=30) as r:
        d = json.load(r)
    if d.get('error'):
        raise RuntimeError(f'{coin}: {d["error"]}')
    rows = next(v for k, v in d['result'].items() if k != 'last')[:-1]
    return {int(r[0]): [float(r[1]), float(r[2]), float(r[3]), float(r[4]), float(r[5]) * float(r[6])] for r in rows}


def fetch_all(coins, fetch=fetch_ohlc, pause=1.1):
    out = {}
    for chart, C in CHARTS.items():
        out[chart] = {}
        for coin in ('BTC',) + tuple(coins):
            try:
                bars = fetch(coin, C['interval'])
                q = ef.candle_quality(sorted(bars), [bars[t] for t in sorted(bars)], C['interval'] * 60)
                if ef.usable(q):
                    out[chart][coin] = bars
                else:   # fail closed: no prediction from damaged candles
                    print(f'skip {coin} {chart}: candle check {q}')
            except Exception as e:   # one bad pair must not stop the run
                print(f'skip {coin} {chart}: {e}')
            time.sleep(pause)
    return out


# ---------- model ----------

def _fit(X, y, multiclass):
    med = np.nanmedian(X, axis=0)
    med = np.where(np.isnan(med), 0, med)
    Xf = np.where(np.isnan(X), med, X)
    sc = StandardScaler().fit(Xf)
    m = LogisticRegression(C=C_REG, max_iter=2000).fit(sc.transform(Xf), y)
    return lambda x: m.predict_proba(sc.transform(np.where(np.isnan(x), med, x)[None, :]))[0], m.classes_


def predict_coin(series, coin, chart):
    """Probabilities for the latest closed candle of one coin on one chart, or None when history is too short."""
    C = CHARTS[chart]
    ts, a, b = ps.align(series, coin)
    if len(ts) < 120:
        return None
    F = ps.features(ts, a, b, C['spec'])
    F.update(ef.features(a[:, 3]))
    G = a158.groups(*a.T)
    F.update(G['KBAR'])
    F.update(G['VMA'])
    names = list(F)
    M = np.column_stack([F[k] for k in names])
    last = len(ts) - 1
    if np.isnan(M[last]).sum() > len(names) // 3:
        return None
    preds, base = {}, {}
    for hname, hz in C['horizons'].items():
        rows = [(i, t) for i in range(len(ts)) if np.isnan(M[i]).sum() <= len(names) // 3
                for t in [ps.targets(a, b, i, hz, C['spec'], True)] if t]
        if len(rows) < 60:
            continue
        X = np.array([M[i] for i, _ in rows])
        preds[hname], base[hname] = {}, {}
        for tname in BINARY:
            y = np.array([t[tname] for _, t in rows])
            if len(set(y)) < 2:
                continue
            f, classes = _fit(X, y, False)
            preds[hname][tname] = round(float(f(M[last])[list(classes).index(1)]), 3)
            base[hname][tname] = round(float(y.mean()), 3)
        y = np.array([ps.SHAPES.index(t['shape']) for _, t in rows])
        f, classes = _fit(X, y, True)
        P = np.zeros(len(ps.SHAPES))
        P[classes] = f(M[last])
        preds[hname]['shape'] = {s: round(float(p), 3) for s, p in zip(ps.SHAPES, P)}
        bc = np.bincount(y, minlength=len(ps.SHAPES)) / len(y)
        base[hname]['shape'] = {s: round(float(p), 3) for s, p in zip(ps.SHAPES, bc)}
    if not preds:
        return None
    return {'bar_t': int(ts[last]), 'close': float(a[last, 3]), 'n_train': len(rows), 'preds': preds, 'base': base}


# ---------- log ----------

def _month_file(d, when):
    return os.path.join(d, f'{when:%Y-%m}.jsonl')


def load(d):
    if not os.path.isdir(d):
        return []
    out = []
    for name in sorted(os.listdir(d)):
        if name.endswith('.jsonl'):
            with open(os.path.join(d, name)) as f:
                out += [json.loads(l) for l in f if l.strip()]
    return out


def _append(d, when, recs):
    if not recs:
        return
    os.makedirs(d, exist_ok=True)
    with open(_month_file(d, when), 'a') as f:
        for r in recs:
            f.write(json.dumps(r, sort_keys=True) + '\n')


def pred_id(coin, chart, bar_t):
    return f'{coin}-{chart}-{datetime.fromtimestamp(bar_t, timezone.utc):%Y%m%dT%H%M}'


def predict_all(d, data, coins, now=None):
    now = now or datetime.now(timezone.utc).replace(microsecond=0)
    have = {r['id'] for r in load(d) if r['type'] == 'panel_prediction'}
    new = []
    for chart, C in CHARTS.items():
        series = data.get(chart, {})
        if 'BTC' not in series:
            continue
        for coin in coins:
            if coin not in series:
                continue
            p = predict_coin(series, coin, chart)
            if not p or pred_id(coin, chart, p['bar_t']) in have:
                continue
            step = C['interval'] * 60
            new.append({'type': 'panel_prediction', 'id': pred_id(coin, chart, p['bar_t']), 'model': MODEL, 'by': 'panel',
                        'made_at': now.isoformat(), 'coin': coin, 'chart': chart, **p,
                        'resolves_at': {h: datetime.fromtimestamp(p['bar_t'] + (hz + 1) * step, timezone.utc).isoformat()
                                        for h, hz in C['horizons'].items()}})
    _append(d, now, new)
    return new


def _shape_brier(P, s):
    return sum((P.get(k, 0) - (k == s)) ** 2 for k in ps.SHAPES)


def score_all(d, data, now=None):
    now = now or datetime.now(timezone.utc).replace(microsecond=0)
    log = load(d)
    done = {(r['id'], r['horizon']) for r in log if r['type'] == 'panel_outcome'}
    new = []
    for p in (r for r in log if r['type'] == 'panel_prediction'):
        C = CHARTS[p['chart']]
        series = data.get(p['chart'], {})
        if p['coin'] not in series or 'BTC' not in series:
            continue
        ts, a, b = ps.align(series, p['coin'])
        idx = np.searchsorted(ts, p['bar_t'])
        if idx >= len(ts) or ts[idx] != p['bar_t']:
            continue
        for h, hz in C['horizons'].items():
            if (p['id'], h) in done or h not in p['preds'] or datetime.fromisoformat(p['resolves_at'][h]) > now:
                continue
            t = ps.targets(a, b, int(idx), hz, C['spec'], True)
            if t is None:
                continue
            res = {}
            for k, v in p['preds'][h].items():
                if k == 'shape':
                    res[k] = {'y': t[k], 'brier': round(_shape_brier(v, t[k]), 4), 'brier_base': round(_shape_brier(p['base'][h][k], t[k]), 4)}
                else:
                    res[k] = {'y': t[k], 'brier': round((v - t[k]) ** 2, 4), 'brier_base': round((p['base'][h][k] - t[k]) ** 2, 4)}
            new.append({'type': 'panel_outcome', 'id': p['id'], 'model': p['model'], 'coin': p['coin'], 'chart': p['chart'], 'horizon': h,
                        'scored_at': now.isoformat(), 'results': res})
    _append(d, now, new)
    return new


# ---------- scorecard ----------

def scorecard(d):
    """Skill per model, chart, horizon and target: 1 - model Brier / base-rate Brier over every scored prediction."""
    log = load(d)
    model = {r['id']: r['model'] for r in log if r['type'] == 'panel_prediction'}
    agg = {}
    for o in (r for r in log if r['type'] == 'panel_outcome'):
        for k, v in o['results'].items():
            a = agg.setdefault((o.get('model') or model.get(o['id'], ''), o['chart'], o['horizon'], k), [0, 0.0, 0.0])
            a[0] += 1
            a[1] += v['brier']
            a[2] += v['brier_base']
    return [{'model': md, 'chart': c, 'horizon': h, 'target': k, 'n': n, 'brier': round(m / n, 4), 'brier_base': round(bb / n, 4),
             'skill': round(1 - m / bb, 3) if bb > 0 else None} for (md, c, h, k), (n, m, bb) in sorted(agg.items())]


def render(d, now=None):
    now = now or datetime.now(timezone.utc)
    log = load(d)
    preds = [r for r in log if r['type'] == 'panel_prediction']
    lines = ['# Zobiris live prediction panel', '',
             f'Updated {now:%Y-%m-%d %H:%M} UTC. Current model `{MODEL}`, refit every run on each coin\'s own Kraken history. '
             'Research only: no trading authority.', '',
             f'{len(preds)} predictions logged; {sum(1 for r in log if r["type"] == "panel_outcome")} windows scored.', '',
             '## Scorecard', '',
             'Skill above 0 means the panel beat the base rate (how often the event happened in training). '
             'Below 20 scored windows a row is noise.', '',
             '| Model | Chart | Horizon | Target | Scored | Brier | Base Brier | Skill |', '|---|---|---|---|---:|---:|---:|---:|']
    for r in scorecard(d):
        lines.append(f"| {r['model']} | {r['chart']} | {r['horizon']} | {LABELS[r['target']]} | {r['n']} | {r['brier']:.3f} | {r['brier_base']:.3f} | "
                     + (f"{r['skill']:+.3f}" if r['skill'] is not None else '') + ' |')
    latest = {}
    for p in preds:
        k = (p['coin'], p['chart'])
        if k not in latest or p['bar_t'] > latest[k]['bar_t']:
            latest[k] = p
    for chart, C in CHARTS.items():
        h = list(C['horizons'])[-1]
        lines += ['', f'## Latest {chart} chart, {h} ahead', '',
                  '| Coin | Candle (UTC) | Close | New high | New low | Range widens | Volume rises | Up* | Beats BTC* | Likeliest shape* |',
                  '|---|---|---:|---:|---:|---:|---:|---:|---:|---|']
        for (coin, ch), p in sorted(latest.items()):
            if ch != chart or h not in p['preds']:
                continue
            q = p['preds'][h]
            pc = lambda k: f"{100 * q[k]:.0f}%" if k in q else ''
            sh = max(q['shape'].items(), key=lambda kv: kv[1])
            lines.append(f"| {coin} | {datetime.fromtimestamp(p['bar_t'], timezone.utc):%m-%d %H:%M} | {p['close']:.6g} | {pc('new_high')} | "
                         f"{pc('new_low')} | {pc('range_widen')} | {pc('vol_up')} | {pc('dir_abs')} | {pc('dir_btc')} | "
                         f"{sh[0].replace('_', ' ')} {100 * sh[1]:.0f}% |")
    lines += ['', '\\* No proven skill yet: logged so the scorecard can test it, not to act on.', '',
              'Earlier study: up/down and beat-BTC did not beat the base rate; new highs and lows did '
              '(docs/research/MULTI_TARGET_PANEL_2026-10-24.md). This page checks that out of sample, live.', '']
    return '\n'.join(lines)


def main(argv=None):
    import argparse
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument('--dir', default=DEFAULT_DIR)
    ap.add_argument('--coins', default=','.join(COINS))
    ap.add_argument('--scorecard', default=None, help='write the markdown scorecard here (default: <dir>/SCORECARD.md)')
    x = ap.parse_args(argv)
    coins = [c.strip().upper() for c in x.coins.split(',') if c.strip()]
    data = fetch_all(coins)
    scored = score_all(x.dir, data)
    made = predict_all(x.dir, data, coins)
    out = x.scorecard or os.path.join(x.dir, 'SCORECARD.md')
    os.makedirs(os.path.dirname(out) or '.', exist_ok=True)
    with open(out, 'w') as f:
        f.write(render(x.dir))
    print(json.dumps({'scored': len(scored), 'predicted': len(made), 'scorecard': out}))


if __name__ == '__main__':
    main()
