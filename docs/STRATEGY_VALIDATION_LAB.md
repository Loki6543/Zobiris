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


## Signal Certification v1

The validation lab now emits a `certification` block for every strategy report.

Certification remains **shadow-only** and never grants live order authority.

### Certification states

- `INSUFFICIENT_DATA` — not enough OOS/vault observations.
- `REJECTED` — leakage, OOS, walk-forward, or unseen-vault validation failed.
- `FRAGILE` — the base validation passed, but modest execution-cost or positive-edge stress breaks robustness.
- `CERTIFIED_SHADOW` — temporal integrity, OOS, walk-forward, unseen vault, and all defined stress cases pass.

The score is a 0–100 research-quality score built from integrity, OOS, walk-forward, vault, and stress survival. It is not a probability of profit.

### Stress cases

The certification layer re-evaluates the unseen vault under:

1. +5 bps modeled cost per side.
2. +10 bps modeled cost per side.
3. 25% haircut to positive observed edge.
4. Combined +10 bps per side plus 25% positive-edge haircut.

These are robustness shocks, not claims about actual Kraken fill cost.

### Execution evidence boundary

The API explicitly reports modeled fee/slippage separately from executable-fill evidence:

- `l2FillReconciled: false`
- `queuePositionKnown: false`
- `executableFillCertified: false`

A sampled limit touch is still not a fill. Kraken L2 depth, queue position, missed-fill regret, and reconciled order/fill evidence remain separate future certification inputs.

### Point-in-time factor audit

Historical certification currently admits persisted price/reference timestamps. Macro, news/sentiment, and genuine on-chain inputs remain blocked from historical certification unless point-in-time source/observation timestamps are available. Order-book-derived proxies must not be relabeled as on-chain metrics.

### API

`GET /api/strategy-validation?horizon=7D&symbol=SOL&strategyTag=ENTRY_MODEL_V1&feeBps=5&slippageBps=8`

`feeBps` and `slippageBps` are optional modeled per-side costs from 0 to 1000 bps. Their source is reported as `MODELED_ASSUMPTION`.
