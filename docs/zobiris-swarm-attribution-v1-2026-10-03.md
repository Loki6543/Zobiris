# ZOBIRIS Swarm Specialist Attribution v1

Date: 2026-10-03
Authority: **SHADOW_ONLY_NO_AUTOMATIC_WEIGHT_CHANGES**

## Goal

Measure whether each swarm specialist adds forward predictive information beyond the rest of the swarm, instead of rewarding agents for echoing correlated evidence.

## Attribution method

For each resolved horizon (30m, 2h, 8h, 12h, 1d, 3d, 7d), ZOBIRIS stores the specialist score that existed at decision time and the later mark-to-market return. For each specialist it reconstructs the weighted evidence score from all other KNOWN specialists, then measures:

- raw specialist score / forward-return correlation;
- score / other-specialists correlation (redundancy);
- partial correlation between specialist score and return after controlling for all other specialists;
- a 50-sample shrinkage prior so small samples are pulled toward zero;
- directional hit rate versus the leave-one-out consensus;
- directional lift in percentage points;
- high-score versus low-score forward-return spread;
- the correlation of the specialist's marginal contribution with realized return.

## Independence gate

A horizon is not EVALUABLE merely because it has 30 coin rows. It requires all three:

- at least 30 resolved outcomes;
- at least 10 distinct refresh episodes;
- at least 3 distinct UTC days.

This prevents one broad market rally or selloff from being counted as dozens of independent proofs just because many coins moved together.

## Research labels

- **POSITIVE_EDGE** — incremental evidence is positive after controlling for the rest of the swarm and directional lift is positive.
- **NEGATIVE_EDGE** — the specialist systematically pushes the swarm the wrong way after controls.
- **REDUNDANT** — the specialist strongly echoes the other specialists while adding little incremental information.
- **MIXED** — enough data exists but the evidence is not stable enough for a directional conclusion.
- **COLLECTING** — the independence/sample gate is not yet met.

Cross-horizon summaries require repeated evidence. A specialist is not marked CONSISTENT_POSITIVE or CONSISTENT_NEGATIVE from a single horizon.

## Weight boundary

Attribution produces review recommendations only: REVIEW_FOR_MORE_WEIGHT, REVIEW_FOR_LESS_WEIGHT, REVIEW_FOR_REDUNDANCY, KEEP_OBSERVING, or NO_CHANGE_COLLECTING. `automaticWeightChange` is always false. Strategy 2.1 order authority, Kraken gates, execution limits and production rankings remain unchanged.

## API

`GET /api/swarm/attribution?symbol=ETH` is operator-authenticated and returns all horizon summaries plus cross-horizon specialist attribution.

`GET /api/swarm/calibration?horizon=2h&symbol=ETH` now also includes the leave-one-out attribution metrics for that horizon.
