"""Pullback-inside-an-uptrend screen for large US stocks (pre-registered stock-quality-pullback-v1). Research only.

Signal on a Friday close: above the 200-day average, 126-day return in the universe's top half, and 5-15% below the
20-day high. The backtest compares each signal's next 20 trading days with the equal-weight universe average that week;
the confidence interval resamples whole weeks. Prices: Yahoo Finance daily closes (fetched on a GitHub runner).
"""
import json
import os
from datetime import datetime, timezone

import numpy as np

UNIVERSE = ('NVDA', 'AMD', 'AVGO', 'MU', 'TSM', 'ASML', 'QCOM', 'INTC', 'MSFT', 'GOOGL', 'AMZN', 'META', 'AAPL', 'ORCL',
            'CRM', 'NOW', 'ADBE', 'PLTR', 'ANET', 'NFLX', 'TSLA', 'UBER', 'SHOP', 'COIN', 'MSTR', 'HOOD', 'JPM', 'GS',
            'V', 'MA', 'PYPL', 'LLY', 'UNH', 'JNJ', 'ABBV', 'XOM', 'CVX', 'CEG', 'VST', 'GE', 'CAT', 'BA', 'COST', 'WMT',
            'HD', 'NKE', 'MCD', 'DIS', 'PG', 'KO')
BENCH = ('SPY', 'QQQ')
FWD, LONG, MOM, HIGH = 20, 200, 126, 20


def signals_at(C, i):
    """{symbol: info} meeting the signal at row i of the aligned close matrix C (dict symbol -> array)."""
    mom = {s: C[s][i] / C[s][i - MOM] - 1 for s in C if s not in BENCH and i >= LONG and not np.isnan(C[s][i - LONG])}
    if not mom:
        return {}
    med = np.median(list(mom.values()))
    out = {}
    for s, m in mom.items():
        c = C[s]
        ma = np.nanmean(c[i - LONG + 1:i + 1])
        dd = c[i] / np.nanmax(c[i - HIGH + 1:i + 1]) - 1
        if c[i] > ma and m >= med and -0.15 <= dd <= -0.05:
            out[s] = {'mom_126d': m, 'from_20d_high': dd, 'vs_200d': c[i] / ma - 1}
    return out


def table_at(C, i):
    """Every stock's three measures at row i, plus which rule each one misses (for near misses)."""
    mom = {s: C[s][i] / C[s][i - MOM] - 1 for s in C if s not in BENCH and not np.isnan(C[s][i - LONG])}
    med = np.median(list(mom.values()))
    rows = {}
    for s, m in mom.items():
        c = C[s]
        ma = np.nanmean(c[i - LONG + 1:i + 1])
        dd = c[i] / np.nanmax(c[i - HIGH + 1:i + 1]) - 1
        miss = [w for w, ok in (('below 200-day avg', c[i] > ma), ('weak 6-month trend', m >= med),
                                ('pullback under 5%', dd <= -0.05), ('pullback over 15%', dd >= -0.15)) if not ok]
        rows[s] = {'mom_126d': m, 'from_20d_high': dd, 'vs_200d': c[i] / ma - 1, 'misses': miss}
    return rows


def reversal_at(C, i):
    r = {s: C[s][i] / C[s][i - 21] - 1 for s in C if s not in BENCH and not np.isnan(C[s][i - 21])}
    cut = np.quantile(list(r.values()), 0.2)
    return {s for s, v in r.items() if v <= cut}


def backtest(dates, C, pick):
    """Per-week lists of forward excess returns for the stocks `pick(C, i)` selects on Fridays."""
    weeks = []
    for i in range(LONG, len(dates) - FWD):
        if datetime.fromtimestamp(dates[i], timezone.utc).weekday() != 4:
            continue
        fwd = {s: C[s][i + FWD] / C[s][i] - 1 for s in C if s not in BENCH and not np.isnan(C[s][i]) and not np.isnan(C[s][i + FWD])}
        avg = np.mean(list(fwd.values()))
        ex = [fwd[s] - avg for s in pick(C, i) if s in fwd]
        if ex:
            weeks.append(ex)
    return weeks


def summarize(weeks, n_boot=2000, seed=7):
    if not weeks:
        return {'signals': 0}
    flat = np.concatenate(weeks)
    rng = np.random.default_rng(seed)
    boots = [np.concatenate([weeks[k] for k in rng.integers(0, len(weeks), len(weeks))]).mean() for _ in range(n_boot)]
    lo, hi = np.percentile(boots, [2.5, 97.5])
    return {'signals': int(len(flat)), 'weeks': len(weeks), 'mean_excess_20d': round(float(flat.mean()), 4),
            'hit_rate': round(float((flat > 0).mean()), 3), 'ci95': [round(float(lo), 4), round(float(hi), 4)],
            'edge': bool(flat.mean() > 0 and lo > 0)}


def align(series):
    dates = sorted(set.intersection(*[set(series[s]) for s in BENCH]))
    return np.array(dates), {s: np.array([series[s].get(d, np.nan) for d in dates], dtype=float) for s in series}


def render(res, now):
    pc = lambda x: f'{100 * x:+.1f}%'
    p, r = res['pullback'], res['reversal']
    verdict = ('has had an edge' if p.get('edge') else 'has NOT shown a reliable edge')
    lines = ['# Stocks after the pullback', '', f'Updated {now:%Y-%m-%d %H:%M} UTC from Yahoo daily closes through {res["as_of"]}. Research only.', '',
             f"Over the last two years, a pullback inside an uptrend {verdict} in this universe: "
             f"{p.get('signals', 0)} signals, average {pc(p.get('mean_excess_20d', 0))} vs the universe over the next 20 trading days "
             f"(95% CI {pc(p['ci95'][0])} to {pc(p['ci95'][1])}), beat the average {100 * p.get('hit_rate', 0):.0f}% of the time." if p.get('signals') else 'No signals in the backtest.',
             '', f"Reversal check (week's biggest 1-month losers): {r.get('signals', 0)} signals, average {pc(r.get('mean_excess_20d', 0))} "
             + (f"(95% CI {pc(r['ci95'][0])} to {pc(r['ci95'][1])})." if r.get('signals') else '.'), '',
             '## Fits the pattern now', '', '| Stock | Below 20-day high | 6-month return | Above 200-day avg |', '|---|---:|---:|---:|']
    for s, v in sorted(res['now'].items(), key=lambda kv: -kv[1]['mom_126d']):
        lines.append(f"| {s} | {pc(v['from_20d_high'])} | {pc(v['mom_126d'])} | {pc(v['vs_200d'])} |")
    if not res['now']:
        lines.append('| none | | | |')
    near = {s: v for s, v in res.get('table', {}).items() if len(v['misses']) == 1 and (
        (v['misses'][0] == 'pullback under 5%' and v['from_20d_high'] <= -0.02) or
        (v['misses'][0] == 'weak 6-month trend' and v['mom_126d'] > 0))}   # a small dip (2-5%) in an uptrend, or a dip with only middling momentum
    lines += ['', '## Near misses (one rule short)', '', '| Stock | Below 20-day high | 6-month return | Above 200-day avg | Misses |', '|---|---:|---:|---:|---|']
    for s, v in sorted(near.items(), key=lambda kv: -kv[1]['mom_126d']):
        lines.append(f"| {s} | {pc(v['from_20d_high'])} | {pc(v['mom_126d'])} | {pc(v['vs_200d'])} | {v['misses'][0]} |")
    lines += ['', 'Survivorship bias: the universe is today\'s large caps, which flatters any long-only backtest; the comparison '
              'against the same universe removes part of it. Not advice; no orders.', '']
    return '\n'.join(lines)


def main(argv=None):
    import argparse
    from .stocks import fetch_yahoo
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument('--out', required=True)
    x = ap.parse_args(argv)
    series, missing = {}, []
    for s in UNIVERSE + BENCH:
        try:
            series[s] = fetch_yahoo(s, '3y')
        except Exception as e:
            missing.append(f'{s}: {e}')
    dates, C = align(series)
    i = len(dates) - 1
    res = {'as_of': datetime.fromtimestamp(dates[i], timezone.utc).strftime('%Y-%m-%d'), 'missing': missing,
           'pullback': summarize(backtest(dates, C, lambda C, i: set(signals_at(C, i)))),
           'reversal': summarize(backtest(dates, C, reversal_at)), 'now': signals_at(C, i), 'table': table_at(C, i)}
    os.makedirs(x.out, exist_ok=True)
    with open(os.path.join(x.out, 'stock_pullback.json'), 'w') as f:
        json.dump(res, f, indent=1)
    with open(os.path.join(x.out, 'STOCKS.md'), 'w') as f:
        f.write(render(res, datetime.now(timezone.utc)))
    print(json.dumps({k: v for k, v in res.items() if k not in ('now', 'table')}, indent=1))
    print('now:', sorted(res['now']))


if __name__ == '__main__':
    main()
