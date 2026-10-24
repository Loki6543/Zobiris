# Recovery research lab

Shadow research code for BTC-led altcoin recovery. **No trading authority:** nothing here places orders, sizes positions, reads
credentials or changes Strategy 2.1 gates. Standard library only (Python 3.10+).

| Module | Purpose |
|---|---|
| `features.py` | Point-in-time features: range position, frozen event anchors, rolling-anchor expiry, non-overlapping momentum, prior-window beta residual, up/down beta, OI quantity conversion, relative volume, venue liquidity gate |
| `patterns.py` | Sweep/reclaim taxonomy and range-edge magnet tests with frozen targets, distance-matched controls (Mantel-Haenszel) and UTC-day block bootstrap |
| `clock.py` | Quarter-hour and 5-minute boundary activity in raw trades, and first-minute signed flow vs the rest of the quarter-hour |
| `flush_detector.py` | Alt-flush divergence state (pre-registered thresholds, 19 Oct 2026) |
| `event_study.py` | Year-long hourly event study: alt-vs-BTC returns net of Kraken fees after alt flushes, feature ICs with a chronological holdout |
| `rotation_study.py` | Replay of the deployed delayed-rotation screen (status ladder, gate, score) on the same hourly year |
| `btc_event_study.py` | Alt-vs-BTC outcomes 1–5 days after BTC drops and recoveries, with per-event feature ICs |
| `drop_monitor.py` | Live Kraken check for the BTC-drop rule; logs each new drop with the 30-day-high ranking and scores it after 72h |
| `funding_study.py` | Kraken Futures funding at flush time vs the next 6–72h alt-vs-BTC return |
| `calls.py` | Owner call log: record a call with a probability and Kraken prices, score it with Brier when it resolves |
| `panel_study.py` | Multi-target panel: direction, volume, range, new highs/lows and shape at several horizons; which inputs matter |
| `ledger.py` | Forecast registry, Brier score, 2m − m² sizing calibration, Bonferroni Sharpe hurdle |
| `legacy.py` | Exact re-implementation of the 19 Oct sweep test, kept only to reproduce its figures |
| `run_verification.py` | Re-runs the 22 Oct verification from `data/` and writes a new results directory |

## Data

`data/*.json.gz` are Twelve Data BTC/USD candle snapshots (UTC open times). SHA-256 hashes of the gzipped files are written into
each results file. Two files reproduce the 19 Oct tests; two longer files back the 22 Oct study. A 19-hour gap on 1 Oct and one
missing 5m bar on 18 Sep are left as gaps: any window touching them is skipped, never filled.
`ALTS_1h_2025-08-31_2026-10-22.json.gz` holds 1h USD candles for BTC and 37 alts (Twelve Data, no volume).

## Run

```sh
python3 -m unittest discover -s research/recovery_lab/tests -t . -v
python3 -m research.recovery_lab.run_verification --out /tmp/zobiris_verify_run
python3 -m research.recovery_lab.event_study --out /tmp/zobiris_event_study
```

Findings and decisions: [`docs/research/RECOVERY_RESEARCH_VERIFICATION_2026-10-22.md`](../../docs/research/RECOVERY_RESEARCH_VERIFICATION_2026-10-22.md)
and [`docs/research/ALT_FLUSH_EVENT_STUDY_2026-10-22.md`](../../docs/research/ALT_FLUSH_EVENT_STUDY_2026-10-22.md).
