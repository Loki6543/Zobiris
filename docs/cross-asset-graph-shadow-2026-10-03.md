# ZOBIRIS Cross-Asset Graph Shadow

Date: 2026-10-03  
Research reference: arXiv:2606.27670, *CryptoGAT*  
Implementation status: shadow research layer; no trading or entry-score authority

## Why this exists

CryptoGAT's useful production lesson is cross-sectional: crypto assets should not be evaluated only as isolated time series. Related assets can contain information about relative extension, lagging behavior, and market-wide versus ecosystem-specific movement.

ZOBIRIS therefore adds a lightweight cross-asset graph beside the existing entry engine. It does not replace Strategy 2.1, Kraken execution validation, the delayed-rotation prior, or the current entry-reference calculation.

## What ZOBIRIS copied conceptually

The paper builds a graph of crypto assets, then lets connected peers contribute to each asset's prediction through graph attention. ZOBIRIS adopts the graph-and-attention idea, but not the trained model or its published backtest claims.

For each fresh production snapshot, ZOBIRIS builds a graph from the assets that have complete 24-hour, 7-day, 30-day, and 90-day return observations. Medium- and long-horizon similarity determine most of an edge. Weekly similarity is secondary. A small explicit ecosystem prior is currently allowed only for relationships with an unambiguous parent-chain interpretation:

- RAY -> SOL
- JUP -> SOL
- JOE -> AVAX
- ARB -> ETH
- OP -> ETH

The strongest peer edges receive normalized softmax-like attention. Their observed short-horizon returns form a network-implied 24-hour and 7-day move for the target asset.

The residual is:

network-implied return - target observed return

A positive residual can identify a lagging/catch-up candidate. A sufficiently negative residual can identify relative overextension.

## Deliberate differences from CryptoGAT

### No full-period correlation graph

The public CryptoGAT training code constructs its relation matrix from the loaded price matrix before the train/validation/test loops. Because the relation graph is therefore derived from the full available sample, its topology can contain information from dates later than the training observation being scored.

ZOBIRIS does not copy this behavior. The live graph uses only values already present in the current, timestamp-validated production snapshot. Stale or future-dated peer observations are excluded.

### Edge magnitude actually matters

CryptoGAT's public `GATLayer` checks only whether `adj > 0` when masking attention. The stored correlation magnitude is not multiplied into the attention score. The network learns attention from node representations among the allowed neighbors.

ZOBIRIS's lightweight shadow layer explicitly uses the calculated edge strength when forming its attention weights. This is not presented as a reproduction of the paper's GAT.

### No PyTorch model in the serving path

The current runtime does not add Torch or a separately trained neural checkpoint. That would add deployment complexity before ZOBIRIS has a leakage-safe, Kraken-relevant training and validation dataset.

The graph layer is intentionally transparent and deterministic so its outcomes can first be recorded and calibrated against forward results.

## Current algorithm

For each complete fresh asset:

1. Standardize 7-day, 30-day, and 90-day returns across the current cross-section.
2. Measure 30/90-day similarity, with a smaller 7-day similarity component.
3. Apply the limited ecosystem edge prior where applicable.
4. Retain peer edges above the minimum similarity and at most the five strongest neighbors.
5. Convert edge strengths into normalized attention.
6. Calculate attention-weighted peer 24-hour and 7-day movement.
7. Compare those network-implied movements with the target's observed returns.
8. Label the result as CATCH_UP_CANDIDATE, OVEREXTENDED, ALIGNED, MIXED, or INSUFFICIENT.

The confidence value is intentionally conservative. It falls with weak edges, too few neighbors, or too small a usable cross-section.

## Entry behavior

The graph has **SHADOW_ONLY_NO_ENTRY_SCORE_CHANGE** authority.

It cannot:

- increase a live buy price;
- improve the production entry score;
- raise order size;
- bypass market, research, account, liquidity, Kraken tick, quantity, or minimum-order gates;
- send or edit an order.

When an asset is sufficiently overextended relative to its graph peers, the shadow layer may calculate a deeper alternative pullback reference of up to two additional percentage points. This value is shown beside the existing entry plan for observation and outcome tracking only. The validated production `referenceLimit` is unchanged.

Catch-up signals do not reduce the required production pullback and therefore cannot cause ZOBIRIS to chase a coin merely because peers moved first.

## Promotion requirements

No graph signal should gain production entry authority until a forward, timestamped evaluation demonstrates incremental value beyond the existing entry model. At minimum, evaluation should separate market regimes and measure:

- forward return and adverse excursion after graph states;
- whether residual direction is calibrated;
- whether ecosystem edges add value over generic market edges;
- stability by liquidity tier and asset age;
- incremental entry-price improvement after spread/fee/slippage assumptions;
- false catch-up rate during market reversals;
- comparison against a no-graph control using identical observation timestamps.

A future trained graph model should use walk-forward graph construction. Every training, validation, and test observation must build its graph only from information available at that observation time.

## Source files

- `src/server/crossAssetGraph.ts` — graph construction, attention, residual and shadow pullback logic.
- `src/server/zobirisWatchlist.ts` — read-only graph projection beside the production entry plan.
- `src/tests/cross-asset-graph.test.ts` — graph behavior and fail-closed tests.
- `src/tests/zobiris-watchlist.test.ts` — integration test proving graph overextension does not alter production entry authority.
