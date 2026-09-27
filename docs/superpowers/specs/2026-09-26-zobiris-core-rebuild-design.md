# Zobiris Core Rebuild — Design Specification

**Date:** 2026-09-26  
**Status:** Design approved in chat; implementation not yet started  
**Production baseline:** `c20451d7db0473188bfa415e0e9d9e07ea6f0c5d`  
**Target platform:** Railway, desktop web only  
**Primary venue:** Kraken  
**Primary strategy during pilot:** Delayed Rotation + Pullback Limit Entry

---

## 1. Product intent

Zobiris is a private crypto intelligence and decision-support engine for a single user who trades primarily on Kraken. Its job is not to predict every price perfectly or maximize trade frequency. Its job is to improve decision quality around:

- which watchlist coin deserves the next dollar;
- whether a coin is still early, entering a delayed catch-up phase, already extended, structurally weak, or untradeable;
- what limit-entry price creates useful breathing room;
- whether Kraken-specific execution quality makes the idea practical;
- when existing positions should be held, harvested, reduced, or left alone;
- whether Zobiris's own strategy is actually improving entries and reducing drawdowns over time.

The rebuild must preserve the strongest validated behaviors already present in the live system while eliminating the layered source architecture and duplicated decision logic that accumulated through repeated patches.

The product should become more sophisticated internally and simpler externally.

---

## 2. Scope and non-goals

### 2.1 In scope

The rebuild includes:

1. A single canonical TypeScript/React source tree.
2. Kraken-native instrument, price, order-book, execution, account and trade-history ingestion.
3. CoinMarketCap as a supplemental broad-market / longer-horizon metadata provider where useful.
4. Explicit classification of stablecoins, wrapped/LST assets, meme assets, RWA/tokenized assets and normal crypto assets.
5. A canonical ranked watchlist home screen showing every watchlist coin.
6. A persistent right-side detail inspector.
7. The Delayed Rotation strategy as the only strategy authorized for new capital during the pilot.
8. A shadow Trend Leader benchmark strategy for comparison.
9. Kraken-specific liquidity and slippage measurement at realistic order sizes.
10. Historical liquidity snapshots and execution-quality trends.
11. Point-in-time evidence, provenance and research-integrity logic.
12. Outcome memory and experiment tracking.
13. Multi-horizon prediction infrastructure with mandatory abstention until calibrated.
14. Compare Lab using real completed Kraken OHLC data only.
15. Portfolio management / harvesting support for existing holdings.
16. Authenticated account endpoints and strict read-only Kraken permissions.
17. Railway staging, shadow deployment, migration and production cutover.

### 2.2 Explicit non-goals

The rebuild will not:

- submit, edit or cancel Kraken orders;
- withdraw or transfer funds;
- sign wallet transactions;
- execute autonomous trades;
- optimize for phone or tablet layouts;
- use synthetic candles or synthetic order-book data in any analytical path;
- expose verbose research internals in the main decision UI;
- treat uncalibrated model scores as probabilities;
- silently weaken strategy gates merely to produce a recommendation;
- use multi-exchange liquidity as the authority for whether a trade is executable on Kraken;
- discard failed experiments or hide non-fill regret.

---

## 3. Architectural principles

### 3.1 One authoritative implementation per concept

The current production build is assembled from an encoded v0.7.6 baseline, overrides, production patches, audit fixes, prediction overrides and a final hosted-gate replacement. That layering has repeatedly created risk that a later overlay can replace an earlier fix.

The rebuilt app must have one normal source tree in which:

- there is one server implementation;
- one hosted release gate;
- one strategy integration path;
- one account synchronization implementation;
- one source of truth for recommendation authority;
- one UI implementation of each screen;
- no encoded application baseline;
- no runtime source overlay process.

### 3.2 Venue truth over abstract liquidity

Because the user executes on Kraken, Zobiris must answer:

> Can this asset be safely entered and exited on Kraken at the intended order size?

rather than relying on global turnover alone.

### 3.3 Evidence and decision authority are separate

Research may be rich and exploratory, but a claim cannot become decision authority unless:

- it is point-in-time valid;
- its provenance is known;
- its freshness is acceptable for its factor family;
- its source class is appropriate;
- required hard gates pass;
- the strategy module explicitly authorizes it.

### 3.4 Abstention is successful behavior

If evidence is incomplete, models disagree, liquidity is poor, the market regime fails, or no watchlist coin meets the Delayed Rotation criteria, the correct output is:

- WAIT
- NO NEW BUY
- DATA INCOMPLETE
- ABSTAIN

The engine must not manufacture opportunities.

---

## 4. Canonical source layout

The rebuild will use a normal application tree:

```text
src/
├── app/
│   ├── shell/
│   ├── engine/
│   ├── compare/
│   ├── portfolio/
│   └── learning/
│
├── market/
│   ├── kraken/
│   │   ├── instruments.ts
│   │   ├── ticker.ts
│   │   ├── candles.ts
│   │   ├── trades.ts
│   │   ├── orderBook.ts
│   │   ├── bookFeatures.ts
│   │   └── execution.ts
│   ├── cmc/
│   └── classification/
│
├── account/
│   ├── krakenPrivate.ts
│   ├── permissions.ts
│   └── normalize.ts
│
├── evidence/
│   ├── ledger.ts
│   ├── provenance.ts
│   ├── freshness.ts
│   └── claims.ts
│
├── strategies/
│   ├── delayedRotation/
│   ├── trendLeaderShadow/
│   └── registry.ts
│
├── prediction/
│   ├── features/
│   ├── forecasts/
│   ├── calibration/
│   ├── regimes/
│   └── abstention/
│
├── portfolio/
│   ├── dependency.ts
│   ├── sizing.ts
│   ├── harvesting.ts
│   └── capital.ts
│
├── risk/
│   ├── execution.ts
│   ├── liquidity.ts
│   ├── dilution.ts
│   ├── listing.ts
│   └── integrity.ts
│
├── learning/
│   ├── outcomes.ts
│   ├── experiments.ts
│   ├── calibration.ts
│   └── counterfactuals.ts
│
├── compare/
├── api/
├── db/
└── tests/
```

Modules must expose focused interfaces so internal implementations can change without forcing UI or strategy rewrites.

---

## 5. Market and instrument layer

### 5.1 Kraken instrument registry

Kraken `AssetPairs` becomes the canonical source for executable Kraken USD markets.

For each asset, store:

- canonical symbol;
- Kraken pair key;
- altname / wsname;
- USD-pair availability;
- online/listing status;
- base and quote precision;
- lot precision;
- minimum order constraints when available;
- last successful market-data timestamp;
- current data-health status.

An asset with no active Kraken USD market remains visible in the watchlist but receives:

`NO_KRAKEN_USD_MARKET`

and zero new-buy authority.

### 5.2 Classification before scoring

Every watchlist asset must be classified before recommendation logic:

- `NORMAL_CRYPTO`
- `STABLECOIN`
- `WRAPPED_OR_LST`
- `MEME`
- `RWA_TOKENIZED`
- `UNKNOWN`

Stablecoins are excluded from ordinary investment recommendations but remain recorded and visible if present.

Excluded assets must never disappear silently.

### 5.3 CoinMarketCap role

CMC remains supplemental rather than authoritative for execution.

Useful CMC fields include:

- broader market-cap rank;
- 7d / 30d / 90d performance;
- market cap;
- circulating supply;
- FDV where available;
- volume;
- broad-market context.

Kraken remains the execution venue truth.

---

## 6. Kraken microstructure and execution engine

### 6.1 Core live features

The rebuild preserves and formalizes current order-book work:

- midpoint;
- microprice;
- spread bps;
- bid/ask queue imbalance;
- bid/ask depth within 50 bps;
- bid/ask depth within 100 bps;
- one-minute trade notional;
- active-minute coverage;
- trade-count acceleration;
- depth changes;
- spread distribution.

### 6.2 Execution-cost simulation

For each sampled book, walk the Kraken book and estimate entry and exit impact for:

- $25
- $50
- $100
- $500
- $2,500
- $50,000 stress reference

The $25-$500 tiers are primary for the user's current portfolio. Larger tiers are market-quality stress references, not direct order-size recommendations.

Persist:

- impact bps;
- weighted average execution price;
- worst consumed level;
- fill completeness;
- spread component;
- timestamp.

### 6.3 Historical liquidity

Persist time series for:

- spread p50/p95;
- depth 50/100 bps;
- impact at each test notional;
- active-minute coverage;
- one-minute notional;
- liquidity deterioration / acceleration.

Zobiris should compare current liquidity with 7d and 30d historical baselines.

---

## 7. Delayed Rotation strategy

### 7.1 Role

During the pilot, Delayed Rotation is the only strategy allowed to authorize new capital.

The strategy seeks quality assets that:

1. lagged the broader bullish move over 30d and 90d;
2. have recently turned positive over 7d;
3. are not already extended;
4. are not structurally broken;
5. have acceptable Kraken liquidity;
6. pass research-integrity and portfolio-risk gates;
7. offer a pullback limit entry rather than requiring a chase.

### 7.2 Market prerequisite

A candidate cannot qualify unless the market backdrop is sufficiently constructive.

Initial priors may use:

- BTC positive over 30d;
- BTC positive over 90d;
- minimum watchlist breadth positive over 7d;
- minimum watchlist breadth positive over 30d.

These are priors, not permanent truth. They must be experiment-versioned and later calibrated.

### 7.3 Candidate states

Every watchlist coin must map to exactly one clear state:

- `READY`
- `WAIT_FOR_PULLBACK`
- `QUALIFIED`
- `NEAR_ROTATION`
- `TOO_EARLY`
- `ALREADY_EXTENDED`
- `STRUCTURALLY_WEAK`
- `NO_KRAKEN_USD_MARKET`
- `LIQUIDITY_FAIL`
- `RISK_BLOCKED`
- `DATA_INCOMPLETE`
- `EXCLUDED`

### 7.4 Catch-Up Quality

Create an internal `CatchUpQuality` score that combines:

- 30d deficit vs BTC;
- 90d deficit vs BTC;
- recent 7d acceleration;
- recent relative-strength inflection;
- historical response lag to BTC;
- historical catch-up frequency;
- Kraken liquidity trend;
- volume acceleration;
- token dilution / unlock pressure;
- research-integrity quality;
- portfolio correlation and concentration.

A large historical loss must never be positive by itself.

### 7.5 Pullback entry

Every qualifying new-buy recommendation must include:

- signal-time price;
- intended limit price;
- discount percentage;
- max authorized USD;
- expiration / invalidation rules;
- reason for the proposed limit.

Initial pullback prior: approximately 4%-8%, subject to execution/risk context and later calibration.

The system must not continuously raise an unfilled order just because price moves away.

---

## 8. Shadow benchmark strategy

A `TrendLeaderShadow` strategy runs in parallel but cannot authorize capital during the pilot.

For each Delayed Rotation recommendation, record the best available non-laggard / leader candidate that day.

This creates a counterfactual comparison:

> Did the recovering laggard outperform the leader that Zobiris could have bought instead?

Metrics include:

- 1d / 3d / 7d / 14d / 30d return;
- MFE;
- MAE;
- drawdown;
- volatility;
- fill success;
- non-fill regret;
- post-entry downside capture;
- catch-up percentage.

---

## 9. Prediction engine

### 9.1 No uncalibrated authority

The current shadow predictor's conservative behavior is preserved:

- uncalibrated outputs remain shadow-only;
- uncalibrated "probabilities" are prohibited;
- decision authority remains `ABSTAIN` until validation and calibration gates pass.

### 9.2 Native horizons

Prediction records use:

- 1H
- 4H
- 1D
- 3D
- 7D

### 9.3 Target outputs after calibration

When and only when calibration becomes valid, models may produce:

- P(return > 0);
- P(return > +3%);
- P(drawdown > 5%);
- p10 / p50 / p90 return;
- estimated net return after execution cost;
- expected MAE;
- expected MFE;
- fill probability for selected limits.

### 9.4 Authority levels

Prediction authority must be explicit:

- `HIGH`
- `NORMAL`
- `LOW`
- `ABSTAIN`

Authority depends on:

- data sufficiency;
- calibration;
- regime similarity;
- model agreement;
- drift status;
- execution-quality confidence.

---

## 10. Tokenomics and structural risk

Tokenomics should act mainly as risk context, not as a generic "fundamental" score.

Track where available:

- unlock percentage of circulating supply;
- unlock USD / broad ADV;
- unlock USD / Kraken ADV;
- FDV / market cap;
- circulating-supply change;
- major listing / delisting events.

Unknown values remain unknown and must not default to safe.

---

## 11. Portfolio logic

### 11.1 Existing holdings

The Delayed Rotation pilot governs new capital only.

Existing holdings continue to receive:

- HOLD
- HARVEST
- REDUCE
- DEFENSIVE_REDUCTION
- NO_ACTION

based on existing position state, exposure, concentration, realized/unrealized performance, liquidity and risk.

### 11.2 Capital authority

Recommendation size is constrained by:

- maneuver-capital availability;
- existing open buy commitments;
- correlation / ecosystem concentration;
- execution cost;
- asset risk;
- pilot sizing cap.

The current small pilot sizing behavior remains conservative until enough outcomes exist.

---

## 12. Outcome memory and experiment ledger

### 12.1 Decision outcomes

Every recommendation stores:

- strategy tag;
- strategy version;
- candidate state;
- signal time;
- signal price;
- intended limit;
- actual fill if observed;
- recommended size;
- 1H / 4H / 1D / 3D / 7D outcomes;
- later 14D / 30D outcomes where available;
- MFE;
- MAE;
- fill delay;
- non-fill regret.

### 12.2 Experiment ledger

Every strategy / threshold test records:

- experiment ID;
- strategy version;
- parameter set;
- feature set;
- asset universe;
- training window;
- validation window;
- test window;
- fee assumptions;
- spread / slippage assumptions;
- results;
- rejected / failed status.

Failed experiments are permanent records.

### 12.3 Calibration

Initial thresholds are versioned priors.

Threshold changes require evidence from:

- walk-forward testing;
- shadow outcomes;
- sufficient sample size;
- sensitivity analysis;
- realistic execution costs.

No hidden threshold changes.

---

## 13. Compare Lab

Compare Lab is a user-controlled research workbench.

### 13.1 Data rule

Only real, completed Kraken market data may be used for:

- charts;
- performance comparisons;
- historical analogues;
- lead/lag analysis;
- AI structured analysis;
- backtests.

Synthetic display data is prohibited from analytical paths.

### 13.2 User workflow

The user selects 2-5 assets and a timeframe.

The lab computes:

- normalized performance;
- 7d / 30d / 90d relative return;
- BTC beta;
- rolling correlation;
- upside capture;
- downside capture;
- max drawdown;
- volatility;
- recovery speed;
- historical catch-up behavior;
- BTC-sideways performance;
- lead/lag where data quality supports it.

An optional "Ask Zobiris" layer may consume these structured statistics but should not infer from chart pixels.

---

## 14. Desktop UI design

### 14.1 Platform target

Desktop only.

Primary design target:

- 1440px-1920px wide displays;
- ordinary laptop and desktop browsers;
- no phone-specific responsive design;
- no tablet-specific interaction design.

The layout may tolerate smaller desktop windows, but mobile is explicitly not a product requirement.

### 14.2 Visual direction

The app should feel like a sophisticated intelligence engine, not a generic crypto dashboard.

Palette:

- deep navy / blue-black base;
- layered dark-blue surfaces;
- electric cyan / bright blue primary accent;
- restrained green for positive outcomes;
- restrained coral/red for negative outcomes;
- soft amber for warnings;
- muted blue-gray secondary text.

Use:

- thin illuminated dividers;
- subtle grid texture;
- minimal glow;
- restrained motion only for meaningful state changes;
- strong typography and information hierarchy.

Avoid:

- purple-gradient crypto clichés;
- glowing card walls;
- excessive pills/badges;
- giant decorative charts;
- dense research prose on the main screen;
- constant animation.

### 14.3 Navigation

Primary navigation:

- `ENGINE`
- `COMPARE`
- `PORTFOLIO`
- `LEARNING`

`ENGINE` is the default home screen.

### 14.4 Engine screen

The Engine screen is the product centerpiece.

#### Top status rail

Compact full-width telemetry:

- market state;
- BTC state;
- watchlist count;
- qualified count;
- near-rotation count;
- available capital;
- Kraken connection / data health;
- latest refresh timestamp.

No giant metric cards.

#### Main split

Approximately:

- 70% ranked watchlist;
- 30% persistent detail inspector.

The divider may be resizable.

### 14.5 Ranked watchlist table

Every watchlist asset remains visible.

Initial columns:

1. Rank
2. Coin
3. Zobiris State
4. Current Price
5. Zobiris Limit Entry
6. 7D
7. 30D
8. 90D
9. Relative vs BTC
10. Catch-Up / Rotation Quality
11. Entry Quality
12. Kraken Liquidity
13. Risk

The table supports:

- sortable columns;
- sticky header;
- compact row density;
- direct filtering;
- state filters;
- stable rank display;
- one selected row at a time;
- no card-per-coin layout.

Default ordering is Zobiris Rank / next-dollar quality.

### 14.6 Row visual language

The recommendation state is more visually prominent than a generic numerical score.

For example:

- WAIT FOR LIMIT
- QUALIFIED
- NEAR ROTATION
- TOO EARLY
- EXTENDED
- STRUCTURALLY WEAK

A compact 7D / 30D / 90D strip should visually reveal the desired pattern:

> long-horizon weakness + fresh short-horizon improvement.

Color must never be the only state indicator.

### 14.7 Right-side inspector

Selecting a row opens details without leaving the table.

Persistent inspector sections:

#### Decision
- current recommendation;
- current price;
- proposed entry;
- entry discount;
- authorized size;
- invalidation condition.

#### Why
- 30d / 90d lag;
- 7d recovery;
- BTC-relative behavior;
- liquidity status;
- research/risk gates.

#### Execution
- spread;
- slippage at realistic order sizes;
- depth;
- liquidity trend.

#### Risk
- concentration;
- structural risk;
- tokenomics;
- unknown / missing dimensions.

#### Change conditions
A small section explaining what would alter the current call.

Verbose evidence ledgers and research-thesis text remain hidden behind an optional deeper research view.

### 14.8 Filters

Primary filters:

- All
- Qualified
- Near Rotation
- Holdings
- Open Orders

Primary sort:

- Zobiris Rank

Secondary sorts:

- Entry Quality
- Rotation Quality
- Kraken Liquidity
- 7D
- 30D
- 90D

### 14.9 Compare screen

Desktop workspace:

- left asset-selection rail;
- large central comparison chart;
- right structured metrics panel.

No mobile compromise.

### 14.10 Portfolio screen

Desktop holdings and order-management intelligence:

- holdings table;
- open orders;
- capital summary;
- harvest recommendations;
- concentration / correlation summary;
- realized / unrealized performance.

Still read-only with respect to exchange execution.

### 14.11 Learning screen

The Learning screen answers:

> Is Zobiris becoming more useful?

Show:

- delayed-rotation sample count;
- fill rate;
- average entry improvement;
- MAE / MFE;
- 1D / 3D / 7D / 14D / 30D results;
- non-fill regret;
- leader benchmark comparison;
- calibration / confidence quality;
- strategy version history.

This screen should emphasize experiment evidence rather than educational quizzes.

---

## 15. Research UI boundary

Research should affect:

- eligibility;
- ranking;
- confidence;
- sizing;
- warnings;
- WAIT / ABSTAIN decisions.

Research should not dominate the visible app.

The main UI must not show by default:

- full thesis text;
- evidence-quality internals;
- falsifier lists;
- source-provenance trees;
- unmeasured-dimension lists;
- long research prose.

The rebuilt release gate should fail if verbose research copy leaks back into the main Engine table.

---

## 16. Account security

### 16.1 Read-only Kraken permissions

Allowed:

- read balances;
- read open orders;
- read closed orders / trade history;
- read ledgers;
- read execution streams;
- read public market data.

Forbidden:

- create orders;
- modify orders;
- cancel orders;
- withdraw;
- transfer;
- deposit / funding mutation;
- earn / stake mutation;
- wallet signing;
- transaction broadcast.

The app fails closed if dangerous API permissions are detected.

### 16.2 Authenticated account APIs

Unlike the current architecture, account-sensitive routes must require an authenticated HttpOnly session.

No private account data should be exposed through unauthenticated public endpoints.

Secrets never enter browser JavaScript.

---

## 17. Database model

SQLite remains appropriate while production uses one Railway replica and one writer.

Recommended schema groups:

```text
assets
kraken_instruments
watchlist

market_observations
daily_candles
book_samples
execution_snapshots

evidence
claims
theses

account_snapshots
orders_readonly
trades_readonly

strategy_signals
recommendations
entry_plans

forecast_runs
forecast_outcomes
calibration_metrics

strategy_experiments
experiment_outcomes

portfolio_snapshots
decision_outcomes

schema_migrations
```

Requirements:

- WAL mode;
- explicit migrations;
- unique point-in-time identifiers;
- one production writer;
- no mutable schema assumptions;
- durable versioning.

---

## 18. API design

The rebuilt API should expose intentional resource groups rather than a historical collection of routes.

Proposed shape:

```text
GET  /api/health
GET  /api/status

POST /api/refresh

GET  /api/engine
GET  /api/watchlist
GET  /api/assets/:symbol

GET  /api/portfolio
GET  /api/account
GET  /api/orders
GET  /api/trades

GET  /api/compare
GET  /api/compare/history

GET  /api/learning
GET  /api/outcomes
GET  /api/experiments

GET  /api/predictions
GET  /api/calibration
```

Sensitive account routes require session authentication.

Public market-data endpoints may remain read-only public if appropriate.

---

## 19. Railway deployment strategy

### 19.1 No in-place rebuild

Do not overwrite the existing healthy production app while the rebuild is under construction.

Use a separate Railway staging service with:

- separate volume;
- separate database;
- separate domain;
- same read-only market/account architecture;
- no shared SQLite writer.

### 19.2 Migration stages

1. Build canonical source tree.
2. Port validated market / account / strategy modules.
3. Create new schema and migrations.
4. Import watchlist and safe configuration.
5. Run tests.
6. Replay historical data where available.
7. Deploy staging.
8. Run live shadow collection.
9. Compare new outputs against production.
10. Run desktop UI QA.
11. Run security QA.
12. Run hosted release gate.
13. Stop staging writer.
14. Backup production database.
15. Run production migration.
16. Deploy rebuilt app to existing production service.
17. Verify terminal Railway `SUCCESS`.
18. Verify health, data freshness and recommendation authority.
19. Retain previous deployment as rollback target.

---

## 20. Acceptance tests

Production promotion requires all of the following.

### 20.1 Code and build

- unit tests pass;
- integration tests pass;
- strict TypeScript passes;
- production Vite build passes;
- no duplicate source-overlay mechanism remains;
- canonical source can be built directly from repo checkout.

### 20.2 Market integrity

- Kraken pair resolution works;
- unsupported USD pairs fail closed;
- stablecoins are explicitly excluded;
- unknown classifications remain visible;
- missing data never silently passes;
- completed OHLC only in Compare Lab;
- L2 sequence-gap handling works;
- stale book features are rejected.

### 20.3 Execution and liquidity

- spread computed correctly;
- depth 50/100 bps computed correctly;
- book-walk execution impact tested;
- current and historical liquidity available;
- non-qualifying liquidity produces zero new-buy authority.

### 20.4 Strategy

- Delayed Rotation is the only active new-capital strategy;
- every watchlist coin receives a visible state;
- non-qualified coins receive zero new-buy authority;
- qualifying coins still require execution and research-integrity gates;
- pullback entry is produced only for authorized candidates;
- no chase behavior automatically raises limits;
- Trend Leader remains shadow-only.

### 20.5 Learning

- recommendation outcomes persist;
- strategy tags persist;
- non-fill regret is measurable;
- MFE and MAE are measurable;
- failed experiments persist;
- calibration cannot mutate thresholds silently.

### 20.6 Prediction

- uncalibrated models return ABSTAIN;
- shadow predictions cannot change Strategy authority;
- future data cannot enter point-in-time features;
- calibration metrics are computed from held-out outcomes.

### 20.7 Account and security

- read-only Kraken scopes accepted;
- write-capable Kraken scopes rejected;
- no order-submit code path exists;
- no transfer/withdraw path exists;
- account-sensitive endpoints require authentication;
- no credential literals in browser bundle;
- no secret values in logs;
- same-origin / mutation protections pass.

### 20.8 UI

- Engine opens by default;
- every watchlist coin is visible;
- ranking is stable and sortable;
- state is more prominent than generic score;
- right-side inspector remains pinned during table scroll;
- no verbose research panel appears by default;
- deep-blue desktop design matches approved concept;
- table remains usable at 1440px and 1920px widths;
- no phone-specific layout work is required.

### 20.9 Railway

- staging deployment reaches terminal `SUCCESS`;
- hosted gate passes;
- production deployment reaches terminal `SUCCESS`;
- health endpoint passes;
- live Kraken collection resumes;
- database migration succeeds;
- only one production writer is active.

---

## 21. Migration boundaries: preserve vs replace

### Preserve / migrate

- read-only Kraken private sync;
- dangerous-permission fail-closed logic;
- current persistent account reconciliation;
- current L2 book validation;
- microprice / queue imbalance features;
- 50 / 100 bps depth;
- real completed Kraken Compare Lab candles;
- point-in-time evidence discipline;
- research-integrity capability manifest;
- outcome memory concepts;
- delayed-rotation pilot behavior;
- hidden-research UI principle;
- hosted release-gate philosophy.

### Replace / retire

- encoded base64 production application;
- chained source overlays;
- duplicate server implementations;
- duplicate hosted-gate copies;
- duplicated strategy logic between UI and backend;
- fallback/demo data in any production decision path;
- synthetic bars in analytical paths;
- generic multi-venue execution authority;
- verbose research panels;
- threshold changes without experiment versioning;
- account-sensitive public APIs.

---

## 22. External design research incorporated

The desktop UI direction is informed by current patterns in professional trading / screening products:

- compact, sortable data tables with strong information hierarchy;
- persistent, docked right-side inspectors;
- configurable real-time refresh;
- limited hover actions rather than nested hover menus;
- keyboard-friendly navigation;
- restrained dark-blue / cyan signal hierarchy;
- minimal animation in data-dense screens;
- pinned / sticky headers and inspector regions.

These patterns are implementation references, not a requirement to copy any external product.

---

## 23. Success criteria

The rebuild is successful when:

1. Zobiris can be understood and built from a normal source checkout.
2. The home screen immediately answers what is interesting in the entire watchlist.
3. The Delayed Rotation strategy is explicit, measurable and isolated.
4. New-buy authority depends on Kraken execution reality.
5. The system can say "nothing qualifies" without degrading thresholds.
6. Entry quality and missed-fill regret become measurable.
7. Prediction remains abstinent until calibrated.
8. Failed experiments are remembered.
9. Research stays powerful but visually hidden.
10. Production can be upgraded, tested and rolled back without source-overlay ambiguity.
