"""Distance-matched tests of two BTC microstructure hypotheses. Research only; no trading authority.

1. Sweep and reclaim. A bar trades below the low of the previous N bars. Classes:
   S_strong  close above the previous close
   S_level   close back at or above the breached low, but not above the previous close
   S_accept  close below the breached low (acceptance below)
   G / R     no breach, close up / not up (controls)
   Primary outcome: a later bar within H exceeds the high of the N bars BEFORE the signal (frozen target).
   'rolling' is the earlier, easier target (a new rolling N-bar high within H bars). It includes the signal bar's own
   high, so its hit rates run higher. That definition difference produced the 59-68% vs ~38% disagreement.
   The fair comparison matches distance to the target in ATR units (Mantel-Haenszel odds ratio over quintiles).

2. Range-edge magnet. A 24h extreme is frozen before a 3h dwell window and must stay untouched. Event = every dwell bar
   within `band`% of the level plus a fresh 1h extreme toward it (one event per horizon). Control = the same kind of live
   level at a similar current distance without the full dwell. Outcome = a wick beyond the level within the horizon.

Bars are dicts with o, h, l, c and a datetime 't'. Any window touching a missing bar is skipped.
"""
import random
import statistics as st


def contiguous_run(times, step_seconds):
    """run[i] = number of consecutive bars before i spaced exactly step_seconds apart."""
    run = [0] * len(times)
    for i in range(1, len(times)):
        run[i] = run[i - 1] + 1 if (times[i] - times[i - 1]).total_seconds() == step_seconds else 0
    return run


def atr(bars, i, n=14):
    return st.mean(max(bars[j]['h'], bars[j - 1]['c']) - min(bars[j]['l'], bars[j - 1]['c']) for j in range(i - n + 1, i + 1))


def classify(bars, i, n):
    """Return (class, prior_low, prior_high) for bar i using only bars i-n..i."""
    prior_low = min(bars[j]['l'] for j in range(i - n, i))
    prior_high = max(bars[j]['h'] for j in range(i - n, i))
    b, prev_close = bars[i], bars[i - 1]['c']
    if b['l'] < prior_low:
        cls = 'S_strong' if b['c'] > prev_close else 'S_level' if b['c'] >= prior_low else 'S_accept'
    else:
        cls = 'G' if b['c'] > prev_close else 'R'
    return cls, prior_low, prior_high


def mantel_haenszel(strata):
    """Common odds ratio over strata of (exposed hit, exposed miss, control hit, control miss)."""
    num = sum(a * d / (a + b + c + d) for a, b, c, d in strata if a + b + c + d)
    den = sum(b * c / (a + b + c + d) for a, b, c, d in strata if a + b + c + d)
    return num / den if den else float('nan')


def _strata(events, controls, bin_of):
    s = {}
    for e in events:
        s.setdefault(bin_of(e), [0, 0, 0, 0])[0 if e['hit'] else 1] += 1
    for c in controls:
        s.setdefault(bin_of(c), [0, 0, 0, 0])[2 if c['hit'] else 3] += 1
    return [tuple(v) for v in s.values()]


def day_block_ci(events, controls, bin_of, iters=400, seed=7):
    """95% interval for the matched odds ratio, resampling whole UTC days (signals within a day are not independent)."""
    rng = random.Random(seed)
    by = {}
    for e in events:
        by.setdefault(e['day'], ([], []))[0].append(e)
    for c in controls:
        by.setdefault(c['day'], ([], []))[1].append(c)
    days = sorted(by)
    out = []
    for _ in range(iters):
        E, C = [], []
        for d in rng.choices(days, k=len(days)):
            E += by[d][0]
            C += by[d][1]
        v = mantel_haenszel(_strata(E, C, bin_of))
        if v == v and v != float('inf'):
            out.append(v)
    out.sort()
    return (out[int(0.025 * len(out))], out[int(0.975 * len(out))]) if out else (float('nan'), float('nan'))


def reclaim_study(bars, times, step_seconds, n, horizon, label=''):
    run = contiguous_run(times, step_seconds)
    warm = max(n, 15)
    rows = []
    for i in range(warm, len(bars) - horizon):
        if run[i] < warm or run[i + horizon] < warm + horizon:
            continue
        cls, _, prior_high = classify(bars, i, n)
        a = atr(bars, i)
        rows.append({
            'cls': cls, 'day': times[i].date().isoformat(),
            'dist': (prior_high - bars[i]['c']) / a if a else 0.0,
            'hit': max(bars[j]['h'] for j in range(i + 1, i + 1 + horizon)) > prior_high,
            'rolling': any(bars[j]['h'] > max(bars[k]['h'] for k in range(j - n, j)) for j in range(i + 1, i + 1 + horizon)),
            'fwd_bps': 1e4 * (bars[i + horizon]['c'] / bars[i + 1]['o'] - 1),   # next-open entry, close-at-horizon exit, before costs
        })
    qs = sorted(r['dist'] for r in rows)
    cuts = [qs[int(len(qs) * q / 5)] for q in range(1, 5)]
    bin_of = lambda r: sum(r['dist'] > c for c in cuts)
    pct = lambda g, k: round(100 * sum(r[k] for r in g) / len(g), 1)
    out = {'label': label, 'n_bars': len(rows), 'classes': {}}
    for c in ('S_strong', 'S_level', 'S_accept', 'G', 'R'):
        g = [r for r in rows if r['cls'] == c]
        if g:
            out['classes'][c] = {'n': len(g), 'fixed_pct': pct(g, 'hit'), 'rolling_pct': pct(g, 'rolling'),
                                 'fwd_bps': round(st.mean(r['fwd_bps'] for r in g), 2),
                                 'median_dist_atr': round(st.median(r['dist'] for r in g), 2)}
    S = [r for r in rows if r['cls'] == 'S_strong']
    G = [r for r in rows if r['cls'] == 'G']
    out['strong_vs_green_matched_or'] = round(mantel_haenszel(_strata(S, G, bin_of)), 3)
    out['strong_vs_green_ci95'] = [round(x, 3) for x in day_block_ci(S, G, bin_of)]
    L = [r for r in rows if r['cls'] == 'S_level']
    R = [r for r in rows if r['cls'] == 'R']
    out['level_vs_red_matched_or'] = round(mantel_haenszel(_strata(L, R, bin_of)), 3)
    return out


def magnet_study(bars, times, step_seconds, hover_hours=3, horizon_hours=6, band_pct=1.0, label=''):
    per_h = int(3600 / step_seconds)
    day, hv, hz = 24 * per_h, hover_hours * per_h, horizon_hours * per_h
    run = contiguous_run(times, step_seconds)
    out = {'label': label, 'hover_h': hover_hours, 'horizon_h': horizon_hours, 'band_pct': band_pct}
    for side in ('high', 'low'):
        events, controls, last = [], [], -10 ** 9
        for i in range(day + hv + 1, len(bars) - hz):
            if run[i + hz] < day + hv + hz:
                continue
            win = range(i - hv + 1, i + 1)
            if side == 'high':
                level = max(bars[j]['h'] for j in range(i - hv - day, i - hv + 1))
                if any(bars[j]['h'] >= level for j in win):
                    continue
                dist = 100 * (level / bars[i]['c'] - 1)
                dwell = all(100 * (level / bars[j]['h'] - 1) <= band_pct for j in win)
                fresh = any(bars[j]['h'] > max(bars[k]['h'] for k in range(j - per_h, j)) for j in range(i - per_h + 1, i + 1))
                hit = max(bars[j]['h'] for j in range(i + 1, i + 1 + hz)) > level
            else:
                level = min(bars[j]['l'] for j in range(i - hv - day, i - hv + 1))
                if any(bars[j]['l'] <= level for j in win):
                    continue
                dist = 100 * (bars[i]['c'] / level - 1)
                dwell = all(100 * (bars[j]['l'] / level - 1) <= band_pct for j in win)
                fresh = any(bars[j]['l'] < min(bars[k]['l'] for k in range(j - per_h, j)) for j in range(i - per_h + 1, i + 1))
                hit = min(bars[j]['l'] for j in range(i + 1, i + 1 + hz)) < level
            if dist > band_pct:
                continue
            a_pct = atr(bars, i) / bars[i]['c'] * 100
            rec = {'dist_atr': dist / a_pct if a_pct else 0.0, 'hit': hit, 'day': times[i].date().isoformat()}
            if dwell and fresh:
                if i - last >= hz:
                    events.append(rec)
                    last = i
            else:
                controls.append(rec)
        bin_of = lambda r: 0 if r['dist_atr'] < 1 else 1 if r['dist_atr'] < 2 else 2 if r['dist_atr'] < 4 else 3
        rate = lambda g: round(100 * sum(r['hit'] for r in g) / len(g), 1) if g else None
        out[side] = {'dwell_n': len(events), 'dwell_pct': rate(events), 'control_n': len(controls), 'control_pct': rate(controls),
                     'matched_or': round(mantel_haenszel(_strata(events, controls, bin_of)), 3),
                     'ci95': [round(x, 3) for x in day_block_ci(events, controls, bin_of)]}
    return out
