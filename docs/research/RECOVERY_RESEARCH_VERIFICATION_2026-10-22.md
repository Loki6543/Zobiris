# Verification of the 21 Oct 2026 master research document

**Authority:** `SHADOW_ONLY_NO_TRADING_AUTHORITY`. Findings can corroborate, contradict, demote or flag. They cannot authorize
a trade, raise size or bypass qualification gates. No orders were placed and no production code or settings changed.

**Scope.** The user-supplied *Zobiris Master Research — Consolidated 21 October 2026* (124 pages, 16 embedded data files).
Pages 1–86, 110–117 and 122–124 were new and were checked here; pages 87–109 and 118–121 were already in this project.
Every check used exchange data, primary sources or the document's own embedded raw files. Code and data snapshots are in
[`research/recovery_lab/`](../../research/recovery_lab/README.md).

## Verdicts

| Area | Verdict | How it was checked |
|---|---|---|
| Historical market figures (Sep 15–20 analog, Oct 18 entry table, COMP event, SOL corrections) | **Verified** within spot-vs-futures differences | Kraken 4h/15m/5m closed candles |
| Oct 21 snapshot: prices, returns, range positions, 72h BTC correlations | **Verified** for 15 of 17 assets | Kraken 15m, independent code |
| Oct 21 snapshot: hourly relative volume | **Venue-specific, not portable** | MNT 2.86× Binance futures vs 0.06× Kraken spot; EGLD 1.01× vs 9.22× |
| Literature and news (23 citations) | **18 verified, 5 partly, 0 fabricated** | Primary pages fetched 22 Oct |
| "Sweep 59–68% is unreproduced" | **Now reproduced exactly**, and the critique of it is **correct** | Archived data + code; frozen target + distance matching |
| "Magnet has 3–7 effective episodes" | **Superseded.** Six months gives 126–214 episodes per side at 1%; the dwell effect is small | Twelve Data BTC 15m, Apr 27–Oct 22 |
| Higher-low gate redundancy (38.2% of a 10% drop implies a 4.24% bounce) | **Correct** | Algebra + unit test |
| OI quantity growth = (1+g_usd)/(1+g_price) − 1 | **Correct** | Unit test with the document's COMP example |
| SEC "Economic and Non-Economic Trading in Bitcoin" authorship | **Document correct, Claude's earlier register wrong.** The cover names Hougan, Kim and Lerner of Bitwise | PDF cover via Exa |

### Citation scope flags

- Xu et al. (order-book resiliency) uses Chinese equities, not crypto.
- Sensoy (2019) "alternative currencies" means BTC/EUR versus BTC/USD, not altcoins.
- Makarov & Schoar's ~40% is a share of filtered on-chain BTC transfers to known exchanges, not of exchange trading volume.
- CoinDesk, 21 Oct: Zcash developers *set* the NU7 activation height; the upgrade was not yet live.
- Binance `openInterestHist` documentation does not state USD units or period-end timestamps. Test both before relying on them.
- Kim & Hansen (0.5 bp per boundary) and Kitron & Wengrowicz (1.3 bp gross vs 5 bp round trip) both say their edges sit below
  trading costs. Use them as context features, not trade triggers.

## The sweep dispute, resolved

The 19 Oct test measured "a new *rolling* N-bar high within N bars". That window includes the sweep bar's own, lower high, so
the target is close. The 18 Oct pilot measured the high of the N bars *before* the signal, which is a harder target. Both
numbers were computed correctly; they answer different questions.

On 72 days of BTC 5m data (Aug 10–Oct 22, 20,569 bars), with the frozen target:

| Config | Sweep + strong close | Green, no sweep | Matched odds ratio (95% CI) | Sweep, rolling target |
|---|---|---|---|---|
| 5m, prior 10m → next 10m | 43.9% (n=1,994) | 75.7% | 0.92 (0.82–1.05) | 65.5% |
| 5m, prior 15m → next 15m | 38.2% (n=1,621) | 71.9% | 0.90 (0.80–1.03) | 60.6% |
| 10m, prior 10m → next 10m | 53.0% (n=1,432) | 82.4% | 0.76 (0.65–0.90) | 67.7% |
| 15m, prior 30m → next 30m | 46.6% (n=672) | 75.7% | 0.92 (0.77–1.09) | 68.0% |

Matched on distance to the target in ATR units, the sweep adds nothing and is significantly worse at 10m. Mean forward return
from next-bar open is −1 to +1.3 bps for every class. **Decision:** the sweep is demoted to entry geometry. It is not a
signal, and a 60%+ hit rate must never be quoted for it again.

## The range-edge magnet

Same live level (frozen 24h extreme, untouched during the dwell), same current distance, with versus without a 3h dwell:

| Band / horizon | High side: dwell vs control | Matched OR (95% CI) | Low side: dwell vs control | Matched OR (95% CI) |
|---|---|---|---|---|
| 1% / 6h | 44.9% (214) vs 35.8% | 1.20 (0.95–1.50) | 42.0% (188) vs 31.7% | 1.27 (0.98–1.72) |
| 1% / 12h | 62.5% (136) vs 53.3% | 1.29 (1.00–1.69) | 54.8% (126) vs 45.7% | 1.26 (0.95–1.64) |
| 0.5% / 6h | 62.0% (71) vs 55.9% | 1.26 (0.86–1.90) | 59.1% (44) vs 57.4% | 1.12 (0.59–2.10) |

All eight variants point the same way (odds ratio 1.12–1.29), but only one clears 95% on its own, and the eight share data.
**Decision:** keep the magnet as a small tilt, roughly +5–9 points over proximity alone. "Almost definitely" is wrong; most
setups still fail to break within 6h.

## Clock effect on Kraken spot

Raw Kraken XBTUSD spot trades: 457,943 over 71.8 hours (19–22 Oct). Each 10-second slot is compared with the same slot in
ordinary minutes. Intervals resample whole days; with three days they are rough.

| Window vs ordinary minutes | Trades | Dollar volume | Absolute return |
|---|---|---|---|
| Quarter-hour minute, seconds 0–10 | +64% (+54 to +84) | +5% (−3 to +16) | +26% (+17 to +39) |
| Quarter-hour minute, seconds 10–20 | +36% (+28 to +42) | +34% (+6 to +74) | +32% (+20 to +47) |
| Other 5-minute mark, seconds 0–10 | +10% (+6 to +16) | +29% (−24 to +96) | +5% (−0 to +10) |

The clock effect replicates on Kraken spot: many more, smaller trades and larger price moves right after quarter-hour marks,
close to Kim & Hansen's +26% absolute-return figure on Binance perpetuals. Direction does not: signed flow in a quarter-hour's
first minute did not predict the next 14 minutes (correlation 0.015; same sign 51% of 287 quarter-hours). **Decision:** add clock
phase as a context feature for volatility and execution timing, never as a directional trigger. Results:
`research/recovery_lab/results/2026-10-22_kraken_clock/clock.json`.

## Economics

Every intraday BTC pattern tested here moves the next 10–60 minutes by less than 5 bps on average. The user's Kraken spot fees
of 0.20% maker / 0.38% taker cost 40–76 bps per round trip. No tested BTC microstructure pattern is tradeable on spot at that
tier. Their value is as context for alt entries that have a much larger expected move, such as the flush-recovery cohort.

## What Zobiris adopts

1. **Frozen-target, distance-matched tests** (`patterns.py`) replace raw target-touch hit rates.
2. **Reclaim taxonomy:** acceptance below, level reclaim and strong-close reclaim are separate labels.
3. **Event anchors with expiry** (`features.frozen_event`, `rolling_anchor_expiry`) so a rolling 24h window dropping an old
   extreme is not read as fresh buying or selling.
4. **Non-overlapping momentum segments** (last 15m, prior 15m, prior 30m) instead of counting overlapping windows as confirmations.
5. **Beta residuals fitted only on earlier data**, plus separate up and down betas.
6. **Venue liquidity gate:** participation is judged on Kraken, the venue the user trades.
7. **OI conversion** to contract quantity before any open-interest reading.
8. **Forecast registry with Brier scoring** (`ledger.py`). Tests are registered before outcomes are observable.
9. **Flush detector** kept with its pre-registered thresholds; still only about 1.5 independent firings.

Not adopted: a single blended "AI probability", any rule that turns a pattern into an order, and leverage of any kind.

## Open, pre-registered tests

| Test | Registered | Resolves |
|---|---|---|
| Oct 21 rotation buckets: LEAD (ZEC, MNT, QNT) beats FOLLOWING and NEEDS_CONFIRMATION over 24h | ~2026-10-22 01:15 UTC (see disclosure) | 2026-10-22 17:30 UTC |
| TIA: two consecutive 1h closes above 0.6464 | same | same |
| Next flush firing: cohort beats BTC and gains > 2% in 6h | 2026-10-19 03:45 UTC | first out-of-sample firing |

Disclosure: a routine scan at 00:45 UTC on 22 Oct displayed a few coins' 30-minute moves before the two Oct 21 tests were
registered, including QNT (LEAD) at −1.2%. No group or 24h return was computed or viewed.

## Reproduce

```sh
python3 -m unittest discover -s research/recovery_lab/tests -t . -v
python3 -m research.recovery_lab.run_verification --out /tmp/zobiris_verify_run
```

Inputs are hashed in `results/2026-10-22_btc_patterns/verification.json`. The legacy files reproduce the 19 Oct figures
exactly: 68.3% (486 sweeps, 15m) and 62.6% (476 sweeps, 5m).
