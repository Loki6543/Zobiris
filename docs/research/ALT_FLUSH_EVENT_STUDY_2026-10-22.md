# Alt-flush event study: one year of hourly data

**Authority:** `SHADOW_ONLY_NO_TRADING_AUTHORITY`. This brief can demote or flag a signal. It cannot authorize a trade, raise
size or bypass qualification gates. No orders were placed and no production code or settings changed.

**Question.** When alts flush while BTC holds its floor, do the hardest-hit alts beat BTC afterwards, after Kraken fees? And
which coin features predict which alts recover best?

**Registration.** Test `alt-recovery-event-study-1h-v1` was registered at 2026-10-22 02:00 UTC, before any year-long data was
pulled. Thresholds, horizons, costs, features and the pass rule below were fixed then.

## Design

| Item | Choice |
|---|---|
| Data | Twelve Data USD 1h OHLC, BTC + 37 alts, 2025-08-31 → 2026-10-22, 9,994 hours ([snapshot](../../research/recovery_lab/data/)) |
| Event (FLUSH) | BTC \|1h return\| ≤ 0.5%, BTC above its 168h low, median alt 1h return ≤ −1.0%, ≥ 60% of alts down > 0.5%; one per 24h |
| Target | Alt log return minus BTC log return, next 1h open → close at 6h / 24h / 72h |
| Costs | 0.40% round trip (maker), 0.76% (taker) |
| Cohort | Worst fifth of alts by the flush-hour return |
| Features | 24h range position, 30d drawdown, 24h return vs BTC, flush-hour return, 30d down-beta, the coin's average response to earlier flushes |
| Validation | Per-event Spearman IC; first 60% of events for discovery, last 40% as holdout; pass = same sign and holdout \|t\| ≥ 2 |

## Results

80 FLUSH events between 2025-09-13 and 2026-10-18; 76 have every horizon matured.

| Horizon | Worst fifth minus BTC, gross | Net of maker fees (95% CI) | Net of taker fees | Beat BTC |
|---|---|---|---|---|
| 6h | −0.13% | **−0.53%** (−0.93 to −0.15) | −0.89% | 43% |
| 24h | +0.11% (median −0.20%) | **−0.29%** (−0.88 to +0.33) | −0.65% | 46% |
| 72h | +0.66% | **+0.26%** (−0.97 to +1.45) | −0.10% | 54% |

The same worst-fifth rule at ordinary hours returns −0.05% gross at 24h, so the flush adds about 0.16 points at 24h before
costs. That is less than half the maker fee.

| Feature (24h IC) | Discovery (45 events) | Holdout (31 events) | Passes |
|---|---|---|---|
| Range position, 24h | −0.061 (t −2.24) | +0.003 (t 0.09) | No |
| 30d drawdown | −0.005 | +0.001 | No |
| 24h return vs BTC | −0.035 | −0.003 | No |
| Flush-hour return | −0.023 | −0.012 | No |
| 30d down-beta | −0.025 | −0.020 | No |
| Earlier-flush response ("fast recoverer" memory) | +0.002 | +0.024 (t 0.90) | No |

## Decisions

1. **The hourly flush is not an entry trigger.** Buying the most-flushed alts loses to BTC after maker fees at 6h, with a
   confidence interval entirely below zero, and is indistinguishable from zero at 24h and 72h.
2. **Oct 18 was an outlier, not the rule.** INJ +8.3% and UNI +6.6% against BTC +2.2% in six hours sit in the far right tail
   of these 80 events.
3. **"Fast recoverers lead" is not supported.** A coin's response to earlier flushes does not predict its response to the next.
   Episode memory stays as a narrative note, never as a ranking input.
4. **Low 24h range position is neutral.** It neither disqualifies nor favours a coin. The discovery-half signal vanished in the
   holdout.
5. The 15m detector and its open forecast (F-2026-10-19) stay as they are. Hourly bars may blur a 30-minute flush, so a 15m
   replication is still open, but it must clear the same fee hurdle.

## Error checks (22 Oct, after the registered run)

| Check | Finding | Effect on the conclusion |
|---|---|---|
| Bad or duplicate candles | No duplicates. CVX has 6 bars whose close sits 0.001 above the high (rounding). | None |
| Stale feed | **XMR has 2,178 flat hours (22%)** and 115 runs of 6+ hours with an unchanged close. Flat hours count as "not down", which skews the breadth test. | Without XMR: 82 events; net maker 6h −0.51% (−0.88 to −0.14), 24h −0.11% (−0.71 to +0.52), 72h +0.29% (−0.96 to +1.42). Same verdict. |
| Extreme moves | The 10 Oct 2025 crash shows in most coins (real). QNT's +41% hour on 27 Sep 2026 builds over several hours and partly reverses (likely real, unconfirmed on Kraken). | None found |
| Oct 18 as outlier | The 18 Oct 19:00 event ranks **77th of 78** at 6h (+4.07% net). | Confirms decision 2 |
| Threshold sensitivity (exploratory, XMR excluded) | Median alt drop ≤ −0.75%: 161 events, 6h −0.49%. BTC \|r\| ≤ 0.3%: 36 events, 6h −0.72%. 12h declustering: 96 events, 6h −0.41%. All 6h intervals sit below zero. | Same verdict |
| Severe flushes only (median ≤ −1.5%) | 15 events: 6h +0.23%, 24h +0.42%, 72h +1.08%, every interval spans zero. | Too few to call. A forward test on severe flushes is worth registering. |

XMR stays in the registered result, which is reported unchanged above. Future runs should drop any coin with more than 5% flat hours.

## Limits

- Twelve Data candles are aggregated USD prices, not Kraken's book. There is no volume, so the 15m detector's volume leg is untested here.
- The universe is today's survivors among liquid coins; delisted coins are absent.
- The 7-month subset (33 events) showed +0.15% net at 24h and a flipped range-position sign. The full year overturned both.

## Reproduce

```sh
python3 -m unittest discover -s research/recovery_lab/tests -t . -v
python3 -m research.recovery_lab.event_study --out /tmp/zobiris_event_study
```

Output: [`results/2026-10-22_alt_event_study/event_study.json`](../../research/recovery_lab/results/2026-10-22_alt_event_study/event_study.json),
which records the input file's SHA-256.
