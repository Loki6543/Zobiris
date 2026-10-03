# ZOBIRIS Strategy Validation Lab

This layer imports the useful parts of Argus without importing Argus as a trading system.

## Purpose

Candidate entry/exit models are evaluated in a read-only research pipeline:

1. chronological research block (60%)
2. out-of-sample block (25%)
3. unseen vault block (15%)
4. three contiguous walk-forward stability folds inside OOS
5. fail-closed temporal leakage checks
6. fee/slippage-adjusted return metrics
7. benchmark-relative metrics versus the persisted BTC observation
8. regime breakdowns where at least five episodes exist

A model can reach `SHADOW_VALIDATED`, but that status has **no order authority** and cannot override ZOBIRIS liquidity, lifecycle, capital, execution, or manual-order protections.

## Default research gates

Both OOS and vault must clear:

- minimum observations: OOS 30, vault 15
- mean net return > 0
- median net return >= 0
- hit rate >= 50%
- profit factor >= 1.05 (or no losses with a positive mean)
- max drawdown <= 20%
- benchmark coverage >= 60%
- average excess return versus benchmark > 0

At least two of the three OOS walk-forward folds must also preserve positive net edge, acceptable drawdown and positive benchmark-relative edge.

The t-statistic is reported but deliberately not used as a gate because forward crypto episodes across correlated assets are not independent.

## Current data limitation

The first adapter uses the existing forward `episodes-v2` outcome memory. These are sampled observations, not proven fills. A touched proposed limit does not imply execution. Historical Kraken L2/trade replay and reconciled real-order fills remain the required next step for fill probability, queue effects and missed-fill regret.

## API

`GET /api/strategy-validation?horizon=7D&symbol=SOL&strategyTag=ENTRY_MODEL_V1`

All filters are optional except that `horizon` must be one of `1H, 4H, 1D, 3D, 7D`. The route is read-only and intentionally not shown in the main UI.
