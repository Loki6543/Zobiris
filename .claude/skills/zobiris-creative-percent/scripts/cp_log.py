#!/usr/bin/env python3
"""Append one Creative Percent telemetry record and print the human-readable line."""
import argparse
import json
import os
from datetime import datetime, timezone

LOG = os.path.join('docs', 'research', 'registry', 'cp_telemetry.jsonl')


def main():
    a = argparse.ArgumentParser()
    a.add_argument('--task', required=True)
    a.add_argument('--cp', type=float, default=0.10)
    a.add_argument('--lenses', type=int, default=4)
    a.add_argument('--triplets', type=int, default=0)
    a.add_argument('--hidden', type=int, default=0)
    a.add_argument('--dissenting', type=int, default=0)
    a.add_argument('--divergence', choices=('low', 'medium', 'high'), default='medium')
    a.add_argument('--rerun', type=int, choices=(0, 1), default=0)
    a.add_argument('--kb-candidates', type=int, default=0)
    a.add_argument('--kb-added', type=int, default=0)
    a.add_argument('--failed', action='store_true')
    a.add_argument('--log', default=LOG)
    x = a.parse_args()
    if not 0 <= x.cp <= 0.25:
        a.error('cp must be between 0 and 0.25')
    rec = {'ts': datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'), 'task': x.task, 'cp': x.cp,
           'lenses_active': x.lenses, 'triplets': x.triplets, 'hidden_patterns': x.hidden,
           'dissenting': x.dissenting, 'restate_divergence': x.divergence, 'rerun': bool(x.rerun),
           'kb_candidates': x.kb_candidates, 'kb_added': x.kb_added, 'failed': x.failed}
    os.makedirs(os.path.dirname(x.log), exist_ok=True)
    with open(x.log, 'a') as f:
        f.write(json.dumps(rec) + '\n')
    status = 'FAILED · ' if x.failed else ''
    print(f"[CP-{x.cp:.2f}] {status}lateral: {x.lenses}/4 lenses · {x.hidden} hidden pattern"
          f"{'' if x.hidden == 1 else 's'} · {x.dissenting}/{x.lenses} dissenting · "
          f"rerun: {'yes' if x.rerun else 'no'} · {x.kb_added} new KB entries")


if __name__ == '__main__':
    main()
