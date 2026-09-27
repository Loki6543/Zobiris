# Zobiris Core Rebuild — Implementation Plan

**Date:** 2026-09-27  
**Branch:** `zobiris-core-rebuild`  
**Production baseline:** `c20451d7db0473188bfa415e0e9d9e07ea6f0c5d`  
**Approved design spec:** `docs/superpowers/specs/2026-09-26-zobiris-core-rebuild-design.md`

## Delivery strategy

Build the replacement application beside the current production implementation. Do not modify the existing Railway production service until the rebuilt staging service has passed all acceptance gates.

The rebuild is divided into independently testable milestones. Every milestone must pass its own tests before the next milestone can inherit authority.

---

## Milestone 0 — Canonical project skeleton

Create `core/` as the temporary rebuild root on the rebuild branch.

Target stack:

- Node 22+
- TypeScript strict mode
- Express API
- React + Vite desktop UI
- SQLite with WAL
- Vitest
- Playwright for desktop UI smoke tests

Requirements:

1. A single package.json and dependency graph.
2. One server entry point.
3. One frontend entry point.
4. One configuration module.
5. One SQLite migration runner.
6. One health endpoint.
7. One production build command.
8. No imports from encoded archives or runtime overlays.

Tests:

- TypeScript strict build.
- server health integration test.
- database migration test.
- Vite production build.
- repository grep proving no encoded application dependency exists inside `core/`.

---

## Milestone 1 — Kraken instrument registry and classification

Implement:

- `market/kraken/instruments.ts`
- canonical asset normalization;
- AssetPairs-based pair discovery;
- XBT/BTC and XDG/DOGE handling through resolved Kraken metadata rather than ticker guessing;
- pair status;
- order minimum;
- cost minimum;
- tick size;
- precision;
- USD-market availability;
- wrong-asset price cross-check hook.

Implement classification:

- NORMAL_CRYPTO
- STABLECOIN
- WRAPPED_OR_LST
- MEME
- RWA_TOKENIZED
- UNKNOWN

Hard behavior:

- no active Kraken USD pair => visible state `NO_KRAKEN_USD_MARKET`;
- stablecoins => `EXCLUDED` with explicit reason;
- malformed/missing metadata => fail closed.

Tests:

- BTC resolves through XBTUSD metadata.
- ETH, XRP and DOGE resolve correctly.
- inactive pair fails.
- wrong-symbol cross-check can fail.
- excluded asset remains in output.
- every watchlist symbol receives a registry status.

---

## Milestone 2 — Personal-size execution engine

Implement order-book normalization and book walking.

Primary hard tests:

- $100 buy simulation;
- $100 sell simulation;
- proposed order size;
- current position size.

Initial personal-execution prior:

- pair online;
- fresh valid book;
- complete fill;
- <=100 bps simulated impact for standardized $100 buy and sell.

Stress diagnostics:

- $500;
- $2,500;
- $50,000;
- $250,000 when book depth permits.

Stress outputs must never independently veto a small personal-size order.

Market-depth grades:

- INSTITUTIONAL
- DEEP
- NORMAL
- SMALL_SIZE_ONLY
- VERY_THIN

Volume behavior:

- remove universal $500k Kraken-volume hard gate;
- retain Kraken 24h volume as confidence/market-health evidence;
- top-100 assets with excellent personal execution cannot be vetoed by arbitrary venue-volume floors;
- global turnover is structural-risk context only.

Tests:

- $100 pass + $250k fail still authorizes personal execution.
- incomplete $100 book walk fails.
- stale book fails.
- stress grade changes without changing personal execution authority.
- volume below $500k does not automatically fail.
- top-100 example with excellent book remains eligible.
- actual position size larger than the book can support fails that holding-specific exit check.

---

## Milestone 3 — Historical market and liquidity persistence

SQLite tables:

- assets
- kraken_instruments
- market_observations
- daily_candles
- book_samples
- execution_snapshots
- schema_migrations

Persist:

- spread;
- midpoint;
- microprice;
- queue imbalance;
- 50/100 bps depth;
- execution impact by notional;
- Kraken 24h volume;
- active-minute coverage.

Compute:

- 7d baseline;
- 30d baseline;
- deterioration / acceleration.

Tests:

- duplicate snapshot idempotence.
- stale/future samples rejected.
- 7d/30d baselines use only prior data.
- liquidity deterioration does not imply hard failure when personal execution remains acceptable, but produces a warning.

---

## Milestone 4 — Watchlist market context and Delayed Rotation

Implement explicit strategy module.

Inputs:

- BTC 7d/30d/90d;
- watchlist breadth;
- coin 7d/30d/90d;
- relative 30d/90d vs BTC;
- 7d acceleration;
- classification;
- personal execution;
- market-depth grade;
- research/risk state;
- portfolio context.

Outputs:

- candidate state;
- CatchUpQuality;
- proposed pullback percentage;
- max new-order authority;
- reason codes.

Hard rule:

Only Delayed Rotation can authorize new capital during the pilot.

Tests:

- 30d/90d laggard + modest 7d turn can qualify.
- negative 7d remains TOO_EARLY.
- severe medium-term collapse becomes STRUCTURALLY_WEAK.
- already-large 7d move becomes ALREADY_EXTENDED.
- personal execution failure zeroes new-buy authority.
- stress-only liquidity failure does not zero a small order.
- no qualifying coin => zero recommendations, not relaxed thresholds.

---

## Milestone 5 — Strategy episodes and unbiased outcome scorecard

Replace refresh-counted observations with stable episodes.

Episode creation:

- create only on meaningful state transitions;
- refreshes update the same episode.

Every episode records:

- strategy/version;
- signal price/time;
- BTC benchmark;
- shadow leader/control;
- proposed limit;
- actual fill status;
- size;
- horizon outcomes;
- MFE/MAE;
- non-fill regret.

Exact horizon resolver:

- historical Kraken data at +1H/+4H/+1D/+3D/+7D;
- +14D/+30D where available;
- evaluation timestamp/delay stored.

Limit-fill resolver:

- use real Kraken interval data, not refresh observations.

Persistence:

- open episodes remain resolvable after a coin leaves the current ranking;
- live record cap archives rather than deletes.

Pilot scorecard:

- qualified vs BTC;
- qualified vs same-time controls;
- coin episodes;
- independent market/regime episodes;
- no verdict before at least 30 qualified and 30 control episodes for the evaluated horizon.

Tests:

- repeated refresh does not create repeated episode.
- dropped coin still resolves.
- exact +1H evaluation cannot be replaced by a +3H refresh.
- archived record remains queryable.
- fill uses historical interval low/high.
- same-market clustering reduces pseudo-independent sample count.

---

## Milestone 6 — Read-only Kraken account service and authentication

Port proven behavior:

- GetApiKeyInfo;
- Balance;
- OpenOrders;
- TradesHistory;
- WebSocket token / private streams where supported;
- nonce serialization;
- retry/reconciliation.

Fail closed if dangerous scopes are detected.

Add authenticated HttpOnly session around account-sensitive APIs.

No mutation client methods are allowed in source.

Tests:

- read-only key accepted.
- modify/cancel/withdraw-capable key rejected.
- account endpoint unauthenticated => 401.
- browser bundle contains no secret.
- repository scan contains no Kraken trading endpoint implementation.

---

## Milestone 7 — Prediction shadow layer

Port validated book features.

Persist forecast ledger.

Prediction remains shadow-only until calibration passes.

Native horizons:

- 1H
- 4H
- 1D
- 3D
- 7D

Outputs remain null/ABSTAIN where not calibrated.

Tests:

- future feature rejected.
- stale book rejected.
- uncalibrated forecast => ABSTAIN.
- shadow forecast cannot modify new-buy authority.
- forecast record persists across restart.

---

## Milestone 8 — Compare Lab

Use only real completed Kraken candles.

Desktop layout:

- asset selector;
- large comparison chart;
- structured metrics.

Metrics:

- normalized performance;
- 7d/30d/90d relative return;
- BTC beta;
- rolling correlation;
- upside/downside capture;
- max drawdown;
- volatility;
- recovery speed;
- catch-up behavior;
- BTC-sideways analogues.

Tests:

- no synthetic bars.
- incomplete current daily candle excluded.
- overlapping dates required.
- historical analogue forward windows fully matured.

---

## Milestone 9 — Desktop Engine UI

Desktop only.

Primary layout:

- compact top telemetry rail;
- ~70% ranked watchlist table;
- ~30% persistent right inspector.

Every watchlist coin appears.

Initial columns:

- Rank
- Coin
- State
- Price
- Limit Entry
- 7D
- 30D
- 90D
- Relative vs BTC
- Catch-Up Quality
- Entry Quality
- Kraken Liquidity
- Risk

Inspector:

- Decision
- Why
- Execution
- Risk
- Change conditions

Visual direction:

- deep navy / blue-black;
- dark-blue surfaces;
- cyan/electric-blue accents;
- restrained green/red/amber;
- thin illuminated dividers;
- subtle grid;
- no card wall;
- no verbose research prose.

Tests:

- all watchlist coins rendered.
- sticky table header.
- selecting row updates inspector.
- state visible as text, not color-only.
- no verbose research strings.
- usable screenshots at 1440x900 and 1920x1080.

---

## Milestone 10 — Portfolio and Learning screens

Portfolio:

- holdings;
- open orders;
- current cash;
- harvest/reduce/hold states;
- concentration;
- execution exit quality.

Learning:

- episode count;
- fill rate;
- entry improvement;
- MAE/MFE;
- BTC-relative returns;
- leader-relative returns;
- non-fill regret;
- market-episode count;
- strategy version history;
- calibration state.

---

## Milestone 11 — Staging Railway service

Create a separate service from the rebuild branch.

Requirements:

- separate persistent volume;
- one replica;
- separate DB;
- no production DB sharing;
- staging domain;
- same read-only Kraken credentials only after scope verification.

Run:

- full tests;
- strict typecheck;
- UI build;
- migration;
- hosted gate;
- live public Kraken refresh;
- private account read-only sync;
- desktop browser QA.

Shadow new Engine recommendations against current production without executing anything.

---

## Milestone 12 — Production migration

Only after staging acceptance:

1. freeze new schema changes;
2. backup production data;
3. migrate relevant watchlist/account/outcome history;
4. stop staging writer;
5. deploy rebuilt canonical app to existing production Railway service;
6. ensure exactly one production writer;
7. verify health;
8. verify Kraken collector;
9. verify read-only account sync;
10. verify every watchlist coin ranked;
11. verify non-qualified coins have zero new-buy authority;
12. verify Delayed Rotation episode creation;
13. run hosted security/release gate;
14. require Railway terminal SUCCESS;
15. preserve prior deployment as rollback target.

---

## Release invariants

The rebuild cannot ship if any of these are false:

1. A $50k/$250k stress failure can veto a safe $100 personal-size order.
2. A universal $500k Kraken volume floor exists in new-buy authority.
3. Global turnover is used as a Kraken execution veto.
4. Refresh frequency inflates strategy sample count.
5. Dropping from the watchlist can prevent a losing episode from resolving.
6. A 1H result can silently become a multi-hour result.
7. Sparse refresh prices are used as proof of limit fill.
8. Uncalibrated predictions influence new-buy authority.
9. Any account-sensitive endpoint is public.
10. Kraken mutation permissions or order-writing code paths exist.
11. Verbose research internals leak into the primary Engine table.
12. Production is replaced before staging reaches terminal SUCCESS.
