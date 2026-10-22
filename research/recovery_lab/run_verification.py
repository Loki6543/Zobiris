"""Reproduce the 22 Oct 2026 verification of the sweep and magnet claims from the gzipped snapshots in data/.

Usage (from the repository root):
  python3 -m research.recovery_lab.run_verification --out research/recovery_lab/results/<new_dir>
Refuses an existing output directory. Research only: reads files, writes JSON, sends no orders.
"""
import argparse
import datetime as dt
import gzip
import hashlib
import json
import os

from . import legacy, patterns

HERE = os.path.dirname(os.path.abspath(__file__))


def load(name):
    path = os.path.join(HERE, 'data', name)
    raw = open(path, 'rb').read()
    rows = json.loads(gzip.decompress(raw))['rows']
    times = [dt.datetime.strptime(r['t'], '%Y-%m-%d %H:%M:%S') for r in rows]
    return rows, times, hashlib.sha256(raw).hexdigest()


def resample(rows, times, k):
    out, ot, i = [], [], 0
    while i + k <= len(rows):
        if times[i].minute % (5 * k) == 0 and all((times[i + j] - times[i]).total_seconds() == 300 * j for j in range(k)):
            g = rows[i:i + k]
            out.append({'o': g[0]['o'], 'h': max(x['h'] for x in g), 'l': min(x['l'] for x in g), 'c': g[-1]['c']})
            ot.append(times[i])
            i += k
        else:
            i += 1
    return out, ot


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument('--out', required=True)
    ap.add_argument('--skip-magnet', action='store_true')
    a = ap.parse_args(argv)
    if os.path.exists(a.out):
        raise SystemExit(f'refusing to overwrite {a.out}')
    r5, t5, h5 = load('BTC_5m_2026-08-10_2026-10-22.json.gz')
    r15, t15, h15 = load('BTC_15m_2026-04-27_2026-10-22.json.gz')
    r10, t10 = resample(r5, t5, 2)
    r15b, t15b = resample(r5, t5, 3)
    result = {'inputs': {'BTC_5m': h5, 'BTC_15m': h15}, 'legacy': {}, 'reclaim': [], 'magnet': []}
    for name, n in (('BTC_15m_legacy_2026-08-28_2026-10-19.json.gz', 2), ('BTC_5m_legacy_2026-10-01_2026-10-19.json.gz', 2)):
        rows, _, h = load(name)
        result['legacy'][name] = dict(sha256=h, n=n, **legacy.legacy_sweep_rate([r['h'] for r in rows], [r['l'] for r in rows], [r['c'] for r in rows], n))
    for rows, times, step, n, hz, label in ((r5, t5, 300, 2, 2, '5m prior10m next10m'), (r5, t5, 300, 3, 3, '5m prior15m next15m'),
                                            (r10, t10, 600, 1, 1, '10m prior10m next10m'), (r10, t10, 600, 3, 3, '10m prior30m next30m'),
                                            (r15b, t15b, 900, 2, 2, '15m prior30m next30m'), (r15b, t15b, 900, 4, 4, '15m prior60m next60m')):
        result['reclaim'].append(patterns.reclaim_study(rows, times, step, n, hz, label))
        print(label, json.dumps(result['reclaim'][-1]['classes']['S_strong']), 'matched OR', result['reclaim'][-1]['strong_vs_green_matched_or'], flush=True)
    if not a.skip_magnet:
        for band in (0.5, 1.0):
            for hz in (6, 12):
                m = patterns.magnet_study(r15, t15, 900, horizon_hours=hz, band_pct=band, label='BTC 15m Apr27-Oct22')
                result['magnet'].append(m)
                print('magnet', band, hz, json.dumps({k: m[k] for k in ('high', 'low')}), flush=True)
    os.makedirs(a.out)
    with open(os.path.join(a.out, 'verification.json'), 'w') as f:
        json.dump(result, f, indent=1, sort_keys=True)


if __name__ == '__main__':
    main()
