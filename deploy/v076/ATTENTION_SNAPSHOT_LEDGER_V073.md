# Zobiris v0.7.3 — Attention Snapshot Ledger

## Purpose

The Attention Snapshot Ledger is a shadow-only research persistence layer for testing whether social-attention sources add forward-return information beyond Zobiris's existing market and BTC-relative signals.

It does not score coins for production execution. It makes future scoring claims reproducible.

**Authority:** `SHADOW_ONLY_NO_TRADING_AUTHORITY`

## What is persisted

The ledger creates dedicated SQLite research tables for:

- `attention_collection_runs` — collection-cycle cutoff, policy/version, and seal status;
- `attention_universe_membership` — the point-in-time top-100 universe as observed at the decision cutoff;
- `attention_provider_observations` — immutable raw normalized observations from CMC Social, Stocktwits, and later challengers;
- `attention_provider_capture_status` — explicit provider coverage, mapping failures, outages, stale captures, and after-cutoff captures;
- `attention_market_anchors` — decision-time asset/BTC prices and optional market-cap/volume context;
- `attention_forward_outcomes` — immutable 1h/4h/24h/72h asset, BTC, and BTC-excess outcomes.

The provider payload is sanitized before persistence. Authentication headers, API keys, credentials, passwords, and access/refresh tokens are excluded.

## Time-integrity rules

Every provider observation preserves three different concepts:

1. `source_observed_at` — when the provider says the observation applies;
2. `received_at` — when Zobiris received it;
3. `decision_cutoff_at` — the run's point-in-time decision boundary.

An observation may be preserved for audit while still being unavailable for a historical decision. It satisfies decision-time coverage only when both source and receive timestamps are at or before the cutoff and the observation is not stale under that provider's collection policy.

Historical universe membership follows the same point-in-time principle. Today's top-100 list is never substituted for an old decision date.

## Collection lifecycle

`recordAttentionCollectionCycle(repo, input)` is the one-cycle collection boundary. It accepts already-fetched, provider-neutral data and performs no network calls.

A run is:

- `COMPLETE` when the declared universe, decision anchors, and all expected provider captures are present and cutoff-eligible;
- `PARTIAL` when useful evidence exists but expected provider/anchor coverage is incomplete, stale, after-cutoff, or mapping-unavailable;
- `FAILED` when the point-in-time universe or all decision-time market anchors are unavailable;
- `OPEN` only while operational collection is still in progress.

Exact retries are idempotent. Conflicting retries cannot overwrite immutable evidence.

No scheduler is installed by v0.7.3. Hourly top-of-hour execution remains an explicit later deployment step.

## Provider capture semantics

Missing data is never converted to zero.

Provider capture status is stored separately from provider observations:

- `CAPTURED`
- `MAPPING_UNAVAILABLE`
- `PROVIDER_UNAVAILABLE`
- `STALE`
- `AFTER_CUTOFF`

This distinction matters because “Stocktwits has no mapping for this coin” is different from “Stocktwits was down” and both are different from a real zero-attention observation.

CMC Social remains the benchmark provider. Stocktwits remains an independent challenger. LunarCrush raw features may be added later, but proprietary composites such as Galaxy Score do not receive automatic authority.

## Outcome resolution

`resolveAttentionOutcome(repo, request)` resolves a target only after the horizon has elapsed. It uses the original decision-time market anchor as denominator and stores:

- asset return;
- BTC return;
- BTC-excess return.

Maximum source-time distance from the target is:

- 1H: 10 minutes
- 4H: 15 minutes
- 24H: 30 minutes
- 72H: 60 minutes

Missing or unreliable prices remain unresolved. They are not silently interpolated.

## Deterministic validation export

`exportAttentionValidationRows(repo, request)` regenerates the v0.7.2 `AttentionValidationRow` contract from ledger history only.

The exporter:

- verifies rank 1–100 point-in-time membership;
- rejects universe/provider/anchor evidence that was not known by the decision cutoff;
- requires a decision-time market anchor and resolved requested horizon;
- reconstructs raw provider history and calls `buildAttentionSnapshotFromHistory`;
- recomputes 24h asset/BTC relative context from prior stored anchors;
- never reads a cached Attention Ignition/Attention Lead score as historical truth;
- reports rejection reasons, provider source coverage, mapping failures, and usable cross-sectional periods.

This makes CMC-vs-Stocktwits-vs-combined comparisons reproducible without querying current APIs.

## Current evidence policy

The first v0.7.2 Stocktwits pilot remains `PILOT_ONLY`:

- 56 accepted observations;
- only 8 usable cross-sectional periods;
- message-volume-only pooled Attention Lead IC approximately +0.136;
- adding sentiment reduced pooled IC to approximately +0.082;
- cross-sectional Attention Lead did not beat BTC-relative momentum.

Therefore v0.7.3 does not promote Stocktwits, CMC Social, LunarCrush, sentiment, or message volume to trading authority. It only builds the clean evidence base required to test them properly.

## Persistence and retention

Attention research evidence has **no automatic TTL**. This differs intentionally from short-lived order-book microstructure snapshots. Long histories are required for point-in-time walk-forward, CPCV, DSR/PBO, regime splits, and provider ablations.

For the existing Railway SQLite architecture, the persistent-volume and one-replica rules remain unchanged. v0.7.3 does not deploy or modify Railway staging.

## Production isolation

The attention ledger is not imported by `src/strategy21/integration.ts`.

The existing `src/strategy21/storage.ts` exposes only a thin `withAttentionLedger(...)` wrapper around the existing SQLite connection. The ledger contains no order mutation primitive and exposes no production authorization or sizing field.

## v0.7.4 live collection capability layer

The live collector uses CoinMarketCap's **official keyless top-100** listings endpoint for the point-in-time universe and decision-time market anchors. This path requires no CMC API key and avoids HTML scraping.

The richer broad per-coin CMC Social Mentions/Social Sentiment product is **not exposed as a broad top-100 API endpoint** in the current official Community API. The official Community API provides sparse trending tokens/topics instead. Zobiris therefore records `CMC_SOCIAL` as unavailable for the broad cross-sectional collection rather than fabricating zeros or substituting community trending ranks for social-volume metrics.

Stocktwits continuous collection uses the official Firestream all-symbol sentiment/message-volume feed when separate Firestream credentials are available. Credentials are request-only and are never persisted in the attention ledger. A Firestream JSON payload can also be imported with `--stocktwits-file=PATH`; this is useful when the payload is acquired by another authorized collector. If neither credentials nor an imported payload are available, the ledger persists `PROVIDER_UNAVAILABLE` for Stocktwits.

CLI examples:

```bash
# Safe network/data-shape check; writes only to an in-memory ledger.
npm run collect:attention:live -- --dry-run

# Persist to the normal Zobiris SQLite database.
npm run collect:attention:live -- --db=/data/zobiris.sqlite

# Import an already-authorized Firestream all-symbol JSON payload.
npm run collect:attention:live -- --db=/data/zobiris.sqlite --stocktwits-file=/data/stocktwits-1d.json
```

No scheduler is enabled by source code. Hourly execution is a deployment/runtime choice and does not change Strategy 2.1 trading authority.