# ZOBIRIS Swarm v1 — Shadow Consensus Layer

Date: 2026-10-03  
Status: **SHADOW_ONLY_NO_TRADING_AUTHORITY**

## Purpose

ZOBIRIS now evaluates each Strategy 2.1 candidate through a specialist swarm rather than treating every source as one undifferentiated score. The architecture is inspired by multi-agent crypto systems such as OpenCatz, but ZOBIRIS does **not** copy its fixed 80% voting rule. A raw majority can double-count correlated evidence, so ZOBIRIS uses reliability, coverage, evidence independence and disagreement before producing a shadow consensus.

## Specialists

The v1 swarm contains eight deterministic specialists:

1. **Market / regime** — BTC regime and breadth context.
2. **Entry quality** — existing delayed-rotation score, validated pullback prior and confidence.
3. **Liquidity / execution** — existing Kraken execution eligibility and authority caps.
4. **Relative strength / ecosystem** — cross-asset graph shadow.
5. **Sentiment / catalyst** — CryptoBERT / current social shadow when sufficiently sampled.
6. **On-chain / whale** — deliberately **UNKNOWN** until a trusted live provider is wired.
7. **Portfolio / risk** — fresh holdings, cash, re-entry state and conflicting open orders.
8. **Adversarial critic** — searches for reasons the apparent opportunity may be wrong.

UNKNOWN is a real state. Missing noncritical evidence lowers coverage and confidence; it is never converted into a neutral or bullish observation.

## Data-integrity gate

Critical evidence fails closed. The swarm marks portfolio-specific authority unavailable when the current snapshot, per-asset observation, reference price, market regime, Kraken eligibility, or fresh portfolio/cash/trade context is unavailable.

## Consensus

Each specialist has a base weight and reliability estimate. Signals that share the same evidence family are discounted for dependence before aggregation. Market regime, entry and relative-strength evidence are price-derived, so three bullish readings caused by the same price move do not count as three fully independent confirmations.

The consensus records evidence coverage, reliability, specialist disagreement, correlation discount, regime adjustment, final shadow score and confidence. High disagreement reduces confidence and the final consensus.

## Authority boundary

The swarm is observation and calibration infrastructure only. It cannot increase maxNextOrderUsd, turn WATCH_ONLY or BLOCKED into ACTIVE_ELIGIBLE, bypass liquidity/research/account/security gates, raise a validated entry limit, edit or submit Kraken orders, or change the production ranking.

The returned contract explicitly reports productionScoreChanged=false, productionRankChanged=false, positionAuthorityEffectUsd=0, and all bypass/escalation flags as false. A shadow entry-quality delta is recorded only for forward calibration.

## Forward outcome ledger

Each refresh can record a bounded swarm episode at the current observed price. Outcomes are evaluated at 30 minutes, 2 hours, 8 hours, 12 hours, 1 day, 3 days and 7 days. The active ledger is capped and older episodes are archived before pruning. Writes are serialized and atomic. The ledger is available through a machine-readable API; no new research-heavy UI panel is added.

## Promotion rule

No swarm component gains trading authority merely because its shadow score looks good. Promotion requires forward, timestamped evidence showing incremental value over the existing Strategy 2.1 controls, with adequate sample size, regime separation, realistic spread/fee/slippage treatment and explicit review of false positives.

## Source files

- src/strategy21/swarm.ts — specialist contracts, data-integrity gate and consensus.
- src/server/zobirisWatchlist.ts — per-asset swarm projection beside existing Strategy 2.1 authority.
- src/server/swarmLedger.ts — bounded forward-outcome persistence.
- src/server/server.ts — refresh persistence and read-only swarm outcome API.
- src/tests/swarm-intelligence.test.ts — integrity, UNKNOWN, correlation, disagreement and authority tests.
- src/tests/swarm-ledger.test.ts — forward-outcome persistence tests.
