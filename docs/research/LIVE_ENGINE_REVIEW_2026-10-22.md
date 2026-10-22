# Live engine review: what the production app's public endpoints show

**Authority:** `SHADOW_ONLY_NO_TRADING_AUTHORITY`. Read-only review. No settings, deployments, credentials or orders were
touched. Sources: public GET endpoints of `zobiris-production.up.railway.app` fetched 2026-10-22 03:38–03:40 UTC, the
deployed source in `deploy/`, Kraken public tickers, and the hourly snapshot in `research/recovery_lab/data/`.
Endpoints that need an operator token (`/api/prediction/shadow`, `/api/swarm/*`, `/api/profit-protection`) were not read.

## Findings

| # | Finding | Evidence | Severity |
|---|---|---|---|
| 1 | **The forward ledger's cost model swamps every signal.** `slippageFor()` charges 7% per side for rank > 100 and 2% for rank 11–100, on top of a 0.26% fee. A small-cap round trip is booked at ~14.5%. | `deploy/protection/overrides/src/strategyV2/ledger.ts:25-30`. Live Kraken spreads for the same coins are 0.03–0.36% (GALA 0.05%, CHZ 0.15%, SAND 0.36%, TIA 0.03%). | High: the "bet" group shows −22% avg at 7d and a 0% hit rate; about 14 points of that is the assumed cost |
| 2 | **Three different cost models in one app.** Ledger: 0.26% fee + 0.1–7% slippage per side. Backtest: 0.36% per side. Strategy validation: 0.60% per side, no slippage. Recovery research: 0.20%/0.38% (user's tier). | `/api/ledger`, `/api/backtest`, `/api/strategy-validation` | Medium: results are not comparable across pages |
| 3 | **Corrected 22 Oct:** outcome scoring is automatic. Every 1H–7D evaluation in the latest 100 records landed 2–31 minutes after its due time. The records only *look* stale because new decisions are created by the keyed manual refresh, and the Oct 9 batch finished its 7D window on Oct 16. The 82 expired short horizons predate the collector. | `evaluatedAt` vs `dueAt` in `/api/outcomes` | Low: daily decisions are already recorded automatically in `/api/ledger` |
| 4 | **The calibration page was a stub.** It built a new, empty in-memory ledger on every request; no component records probability forecasts. Now returns `NO_PROBABILITY_FORECASTS_RECORDED` and points to the stores that are scored. | `/api/calibration`, `server.ts` | Fixed on branch |
| 5 | **"sharpeCi95" is mislabeled.** It is 1.64 in-sample and 2.03 out-of-sample for every strategy, so it is a required-Sharpe hurdle, not a confidence interval. | `/api/backtest` | Low |
| 6 | The 1D outcome average (+1.06%) is driven by outliers: only 41% of outcomes are positive. 7D is −3.4% with 20% positive. Means should be reported with medians. | `/api/outcomes` summary, 1,247 records | Low |

## What the engine's own records say (small samples, before fees unless noted)

- **Forward ledger, 12–22 Oct (`/api/ledger`).** Backing out the modeled costs, the 7d gross returns were roughly: buy zone −3%
  (n=3), small bets −10% (n=16), filtered-out −15% (n=20). BTC was flat (82,759 → 82,600, Oct 12–19 noon). The ordering
  is what the filters intend, but n is tiny and every group lost in absolute terms in a falling alt market.
  Spot check from exchange candles: TIA, a "bet" entered at 0.5767, was +4.7% by Oct 19 noon, yet the group's hit rate is 0%.
  With 7.26% per-side costs it still books as a loss.
- **Outcome memory (`/api/outcomes`, latest 100 of 1,247 records, two decision snapshots on Oct 2 and Oct 9).**
  The opportunity score's rank correlation with excess return vs BTC is −0.12 at 1D, +0.05 at 3D and +0.02 at 7D.
  The research score's is +0.09, −0.13 and −0.10. No predictive signal, though two snapshots are only two independent draws.
  Coins tagged `NEAR_ROTATION` had the worst 7D median vs BTC (−5.6%, n=11). `EXTENDED` (+0.5%) and `TOO_EARLY` (+0.3%) did best.
- **Pilot scorecard.** 116 non-qualifying episodes: 1D +2.1% vs BTC, 7D −0.8%, before fees. Zero qualified episodes.
- **Backtest of BTC daily rules (Nov 2025–Oct 2026 walk-forward).** None proven. Best out-of-sample: RSI > 50 (+6.6%, Sharpe 0.39)
  and 200-day average (+0.8%); holding BTC returned −12.4%.

## What carries into the research

1. **Done on branch:** replace tiered slippage with a measured cost: Kraken half-spread at decision time, plus a size-vs-volume impact term.
   Keep the old tier as a stress case only.
2. **Done on branch:** one cost schedule (`strategyV2/costs.ts`, mirrored from the policy registry) for the ledger and backtests; validation already reads the registry.
3. Persist forecasts and score them (Brier), as `research/recovery_lab/ledger.py` already does.
4. Test the rotation labels head-to-head as an event study with the same design as `event_study.py`: does `NEAR_ROTATION`
   underperform `EXTENDED` over months, not two snapshots?
5. Bring the full 1,247-record outcome memory into the research (needs operator access or the Railway database), so the
   opportunity and research scores can be validated on every record instead of the latest 100.

None of these changes were made to production. Items 1–3 touch the deployed app and need the owner's approval.
