"""Kronos-small versus the live panel model (pre-registered kronos-small-vs-panel-v1). Research only; no orders.

For each coin and chart in the frozen 24 Oct Kraken pull, at non-overlapping decisions in the last 30% of history,
this asks Kronos-small for 100 sampled future paths and reads probabilities for the panel's targets off those paths
(the share of paths where the event happens, using panel_study.targets definitions). The live panel model
(panel-logit-v2) and the base rate are scored at the same decisions.

  python3 -m research.recovery_lab.kronos_challenger run --coin SOL --out results/SOL.json      # needs torch + Kronos
  python3 -m research.recovery_lab.kronos_challenger aggregate --dir results --out summary.json
Set KRONOS_DIR to a checkout of github.com/shiyu-coder/Kronos (pinned commit in the registry entry).
"""
import gzip
import json
import os
import sys
from datetime import datetime, timezone

import numpy as np

from . import efficiency as ef
from . import live_panel as lp
from . import panel_study as ps

HERE = os.path.dirname(__file__)
SNAPSHOT = os.path.join(HERE, 'data', 'PANEL_LIVE_kraken_4h_1d_2026-10-24.json.gz')
SCORED = ('dir_abs', 'new_high', 'new_low', 'range_widen', 'vol_up')
PROVEN = ('new_high', 'new_low', 'range_widen', 'vol_up')
CHART_STEP = {'4h': 6, '1d': 7}     # decision stride = longest horizon in bars = Kronos prediction length
PATHS = 100


def load_snapshot(path=SNAPSHOT):
    with gzip.open(path, 'rt') as f:
        d = json.load(f)['series']
    return {ch: {c: {int(r[0]): r[1:] for r in rows} for c, rows in s.items()} for ch, s in d.items()}


def decisions(ts, a, b, chart):
    """Holdout decision bars: last 30% of bars that have a full longest-horizon target, every CHART_STEP bars."""
    C, step = lp.CHARTS[chart], CHART_STEP[chart]
    valid = [i for i in range(len(ts)) if ps.targets(a, b, i, step, C['spec'], True)]
    if len(valid) < 60:
        return [], None
    first = valid[int(len(valid) * 0.7)]
    return [i for i in valid if i >= first][::step], first


def panel_probs(ts, a, b, chart, dec, first):
    """{(i, horizon, target): (p_panel, base_rate)} from panel-logit-v2 fit on rows before the holdout (purged)."""
    C = lp.CHARTS[chart]
    F = ps.features(ts, a, b, C['spec'])
    F.update(ef.features(a[:, 3]))
    names = list(F)
    M = np.column_stack([F[k] for k in names])
    out = {}
    for h, hz in C['horizons'].items():
        rows = [(i, t) for i in range(first - hz) if np.isnan(M[i]).sum() <= len(names) // 3
                for t in [ps.targets(a, b, i, hz, C['spec'], True)] if t]
        X = np.array([M[i] for i, _ in rows])
        for tn in SCORED:
            y = np.array([t[tn] for _, t in rows])
            if len(set(y)) < 2:
                continue
            f, classes = lp._fit(X, y, False)
            k = list(classes).index(1)
            for i in dec:
                out[(i, h, tn)] = (float(f(M[i])[k]), float(y.mean()))
    return out


def path_probs(paths, a, i, hz, spec):
    """Share of sampled paths (arrays [steps, 6]: open, high, low, close, volume, amount) where each target happens."""
    o, h, l, c, v = a.T
    prv = slice(i - hz + 1, i + 1)
    wk_hi, wk_lo = h[i - spec['week'] + 1:i + 1].max(), l[i - spec['week'] + 1:i + 1].min()
    prev_range = (h[prv].max() - l[prv].min()) / c[i - hz]
    hits = {k: 0 for k in SCORED}
    for p in paths:
        H, L, close = p[:hz, 1].max(), p[:hz, 2].min(), p[hz - 1, 3]
        hits['dir_abs'] += close > c[i]
        hits['new_high'] += H > wk_hi
        hits['new_low'] += L < wk_lo
        hits['range_widen'] += (H - L) / c[i] > prev_range
        hits['vol_up'] += p[:hz, 5].sum() > v[prv].sum()
    return {k: n / len(paths) for k, n in hits.items()}


def load_kronos(kronos_dir):
    sys.path.insert(0, kronos_dir)
    from model import Kronos, KronosPredictor, KronosTokenizer   # noqa: E402  (third-party checkout)
    tok = KronosTokenizer.from_pretrained('NeoQuasar/Kronos-Tokenizer-base')
    model = Kronos.from_pretrained('NeoQuasar/Kronos-small')
    return KronosPredictor(model, tok, device='cpu', max_context=512)


def kronos_paths(predictor, ts, a, i, pred_len, step_s, n=PATHS):
    """n independent sampled paths: the series is repeated n times in one batch with sample_count=1, so nothing is averaged."""
    import pandas as pd
    lo = max(0, i - 511)
    close = a[lo:i + 1, 3]
    df = pd.DataFrame({'open': a[lo:i + 1, 0], 'high': a[lo:i + 1, 1], 'low': a[lo:i + 1, 2], 'close': close,
                       'volume': a[lo:i + 1, 4] / close, 'amount': a[lo:i + 1, 4]})
    xt = pd.Series(pd.to_datetime(ts[lo:i + 1], unit='s'))
    yt = pd.Series(pd.to_datetime([ts[i] + step_s * (k + 1) for k in range(pred_len)], unit='s'))
    out = predictor.predict_batch([df] * n, [xt] * n, [yt] * n, pred_len=pred_len, T=1.0, top_p=0.9, sample_count=1, verbose=False)
    return [o[['open', 'high', 'low', 'close', 'volume', 'amount']].to_numpy() for o in out]


def run_coin(coin, predictor, data=None, log=print, charts=None, save=None):
    """Records for one coin; `save(recs)` is called after every decision so a timed-out job keeps what it finished."""
    data = data or load_snapshot()
    recs = []
    for chart, C in lp.CHARTS.items():
        if charts and chart not in charts:
            continue
        if coin not in data[chart]:
            continue
        ts, a, b = ps.align(data[chart], coin)
        dec, first = decisions(ts, a, b, chart)
        if not dec:
            continue
        panel = panel_probs(ts, a, b, chart, dec, first)
        for n, i in enumerate(dec):
            paths = kronos_paths(predictor, ts, a, i, CHART_STEP[chart], C['interval'] * 60)
            for h, hz in C['horizons'].items():
                t = ps.targets(a, b, i, hz, C['spec'], True)
                pk = path_probs(paths, a, i, hz, C['spec'])
                for tn in SCORED:
                    if (i, h, tn) not in panel:
                        continue
                    pp, base = panel[(i, h, tn)]
                    recs.append({'coin': coin, 'chart': chart, 'bar_t': int(ts[i]), 'horizon': h, 'target': tn,
                                 'y': int(t[tn]), 'p_kronos': pk[tn], 'p_panel': round(pp, 4), 'base': round(base, 4)})
            log(f'{coin} {chart} {n + 1}/{len(dec)}')
            if save:
                save(recs)
    return recs


def aggregate(recs):
    cells = {}
    for r in recs:
        c = cells.setdefault((r['chart'], r['horizon'], r['target']), {'n': 0, 'k': 0.0, 'p': 0.0, 'b': 0.0})
        c['n'] += 1
        c['k'] += (r['p_kronos'] - r['y']) ** 2
        c['p'] += (r['p_panel'] - r['y']) ** 2
        c['b'] += (r['base'] - r['y']) ** 2
    rows = []
    for (ch, h, tn), c in sorted(cells.items()):
        sk, sp = 1 - c['k'] / c['b'], 1 - c['p'] / c['b']
        rows.append({'chart': ch, 'horizon': h, 'target': tn, 'n': c['n'], 'skill_kronos': round(sk, 4),
                     'skill_panel': round(sp, 4), 'kronos_minus_panel': round(sk - sp, 4)})
    proven = [r for r in rows if r['target'] in PROVEN]
    wins = sum(r['kronos_minus_panel'] > 0 for r in proven)
    worst = min((r['kronos_minus_panel'] for r in proven), default=0)
    dir_pos = sum(r['skill_kronos'] > 0 for r in rows if r['target'] == 'dir_abs')
    return {'cells': rows, 'kronos_beats_panel_cells': wins, 'proven_cells': len(proven), 'worst_vs_panel': worst,
            'verdict': 'ADOPT as logged challenger' if wins >= 10 and worst >= -0.02 else 'REJECT',
            'direction_skill': dir_pos >= 3, 'dir_abs_cells_positive': dir_pos}


def main(argv=None):
    import argparse
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    sub = ap.add_subparsers(dest='cmd', required=True)
    r = sub.add_parser('run')
    r.add_argument('--coin', required=True)
    r.add_argument('--out', required=True)
    r.add_argument('--chart', choices=tuple(lp.CHARTS), help='one chart only (default: both)')
    g = sub.add_parser('aggregate')
    g.add_argument('--dir', required=True)
    g.add_argument('--out', required=True)
    x = ap.parse_args(argv)
    if x.cmd == 'run':
        from huggingface_hub import HfApi
        revs = {m: HfApi().model_info(m).sha for m in ('NeoQuasar/Kronos-small', 'NeoQuasar/Kronos-Tokenizer-base')}
        predictor = load_kronos(os.environ['KRONOS_DIR'])
        os.makedirs(os.path.dirname(x.out) or '.', exist_ok=True)

        def save(recs, done=False):
            with open(x.out, 'w') as f:
                json.dump({'coin': x.coin.upper(), 'chart': x.chart, 'complete': done, 'hf_revisions': revs,
                           'generated_at': datetime.now(timezone.utc).isoformat(), 'records': recs}, f)

        recs = run_coin(x.coin.upper(), predictor, log=lambda m: print(m, flush=True),
                        charts=(x.chart,) if x.chart else None, save=save)
        save(recs, done=True)
    else:
        recs, revs, incomplete = [], set(), []
        for name in sorted(os.listdir(x.dir)):
            if name.endswith('.json'):
                with open(os.path.join(x.dir, name)) as f:
                    d = json.load(f)
                recs += d['records']
                if not d.get('complete', True):
                    incomplete.append(name)
                revs.add(json.dumps(d.get('hf_revisions'), sort_keys=True))
        summ = aggregate(recs)
        summ['records'] = len(recs)
        summ['coins'] = sorted({r['coin'] for r in recs})
        summ['hf_revisions'] = [json.loads(r) for r in sorted(revs)]
        summ['incomplete_jobs'] = incomplete   # jobs that timed out: their finished decisions are scored, the rest are missing
        with open(x.out, 'w') as f:
            json.dump(summ, f, indent=1)
        print(json.dumps({k: v for k, v in summ.items() if k != 'cells'}, indent=1))
        for c in summ['cells']:
            print(f"{c['chart']:3s} {c['horizon']:4s} {c['target']:12s} n={c['n']:4d} kronos {c['skill_kronos']:+.3f} panel {c['skill_panel']:+.3f} diff {c['kronos_minus_panel']:+.3f}")


if __name__ == '__main__':
    main()
