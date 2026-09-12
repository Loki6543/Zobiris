# Zobiris v0.6.7 Post-Railway Risk / Execution / ML Shadow — Design

Date: 2026-09-12
Status: Approved design, pre-implementation
Target branch: `feature/v067-post-railway-risk-execution-ml`
Source baseline: `Zobiris_v0.6.6_Model_Coordination_Shadow_Checkpoint.zip`
Baseline SHA-256: `f818e05c5676ac42d3c32a04834ac56f024416ac2757d24f25281315c66fb8ed`

## 1. Reconciliation and scope

The verified Railway deployment is the hosted v0.6.3 staging baseline. The source used for this development cycle is the later v0.6.6 Model Coordination Shadow development checkpoint. They are not the same artifact and must not be conflated.

The post-Railway bundle is a backlog to apply after the hosted gate is green. It explicitly preserves the already-implemented v0.6.4 Portfolio Dependency Engine, v0.6.5 Conditional Probe Liquidity/Liquidity Acceleration, and v0.6.6 Model Coordination Shadow. The work in this design implements PRU-001 through PRU-010 plus the historical Kraken L2 dependency required for honest `ACTIVE_ELIGIBLE` certification.

The current Railway staging service remains the known-good reference while development occurs on a separate branch. No live trade-placement, cancellation, or mutation authority is added by this release.

## 2. Global invariants

1. `SHADOW_ONLY_NO_TRADING_AUTHORITY` remains authoritative for the model-coordination layer.
2. No new code path may place, edit, cancel, or imply a live trade fill.
3. Missing, stale, malformed, ambiguous, or insufficient critical evidence fails closed.
4. Public market-price crossing never proves a private Kraken order fill/cancel.
5. Conditional Probe remains Line-1-only with the stricter $25 total exposure cap.
6. Full `ACTIVE_ELIGIBLE` scaling still requires historical execution certification.
7. Research score is ranking only; it is not probability, execution certification, or buy authority.
8. Dated prices/RSI/support levels never become permanent regime constants.
9. External models cannot override integrity, lifecycle, liquidity, capital, concentration, dependency, or execution vetoes.
10. Secrets are never serialized into audit payloads, fixtures, browser responses, or model artifacts.

## 3. Architecture

Production logic remains authoritative:

`market state -> portfolio risk -> asset state -> capital authority -> dependency -> liquidity -> execution authorization`

Shadow intelligence remains parallel:

`market evidence -> workers -> coordinator -> shadow policy -> audit ledger`

The new offline ML package lives inside the repository but is not a Railway runtime dependency:

```text
ml/
  data/
  features/
  labels/
  train_rf.py
  calibrate_rf.py
  calibrate_allora.py
  walk_forward.py
  friction.py
  evaluate.py
  export_artifact.py
```

Python trains and validates models offline. Runtime TypeScript consumes only validated, versioned artifacts. Railway stays Node-only.

## 4. PRU-001 — Flow-adjusted portfolio high-water mark

Persist an append-only equity series with at least:

- `account_equity_raw_usd`
- `external_flow_usd`
- `equity_flow_adjusted_usd`
- `flow_adjusted_hwm_usd`
- `flow_adjusted_drawdown_pct`
- `drawdown_24h_pct`
- `risk_band`
- `risk_band_reason`
- `as_of`

Use recursive flow adjustment:

```text
strategy_pnl_t = raw_equity_t - raw_equity_(t-1) - external_flow_t
adjusted_equity_t = adjusted_equity_(t-1) + strategy_pnl_t
HWM_t = max(HWM_(t-1), adjusted_equity_t)
drawdown_t = max(0, (HWM_t - adjusted_equity_t) / HWM_t)
```

Initialization: `adjusted_equity_0 = raw_equity_0`, `HWM_0 = adjusted_equity_0`.

A deposit or withdrawal changes raw equity but does not create strategy return. The 24-hour loss uses the nearest valid observation at or before the 24-hour boundary within a bounded tolerance; if unavailable, persist `null`, not zero.

## 5. PRU-002 — Tight Portfolio Drawdown Guard v1

Base bands:

- GREEN: 0.00%–0.75%
- YELLOW: >0.75%–1.50%
- ORANGE: >1.50%–2.25%
- ORANGE_PLUS: >2.25%–<3.00%
- RED: >=3.00%
- CRITICAL: >=4.50%

CRITICAL dominates RED at overlap.

Speed override:

- >=2.0% loss in 24h: escalate exactly one band.
- >=3.0% loss in 24h: force at least RED.

Return both `baseBand` and `effectiveBand`, plus reasons. A risk band may only reduce/block authority; it can never convert an underlying veto into permission.

## 6. PRU-003 — Discount Entry Promotion v1

Base planned entry: $30 / 1.00x.

- 1.25x = $37.50
- 1.50x = $45
- 2.00x = $60 total maximum

The 2.00x case is staged: approximately $45 first, approximately $15 only after confirmation/reclaim/stabilization.

The sizing pipeline is:

`base size -> entry-quality multiplier -> portfolio-risk cap -> concentration cap -> dependency/theme cap -> liquidity-tier cap -> lifecycle allowance -> final shadow proposal`

Lower price alone never improves conviction. Broken thesis, lifecycle veto, execution failure, concentration failure, poor invalidation geometry, or integrity failure can reduce the multiplier to zero. Conditional Probe's $25 cap always wins and Line 2/3 remain prohibited until full `ACTIVE_ELIGIBLE`.

## 7. PRU-004 — Generalized Exceptional-Strength RED exception

Remove the static BTC/AAVE/XRP RED quality set. Any asset may qualify only through an explicit AND-gate object containing at least:

- `researchTierExceptional`
- `executionPass`
- `entryGeometryPass`
- `lifecycleClear`
- `dependencyAcceptable`
- `concentrationAcceptable`
- `riskToInvalidationPass`
- `integrityPass`
- `capitalAuthorityPass`

At RED, every required field must pass and sizing remains reduced. At CRITICAL, default deny.

Research score cannot override supply/lifecycle quarantine, execution failure, concentration, or invalidation vetoes. This remains shadow/recommendation-only in v0.6.7.

## 8. PRU-005 — Sub-High Momentum Harvest

Use the previous completed calendar day's high, preferably Kraken venue OHLC, never rolling 24-hour high when the prior completed day is requested.

First-harvest target:

`prior_day_high * (1 - target_offset_pct)`

Bounded offset policy:

- low/normal volatility: 0.5%–1.0%
- elevated volatility: 1.0%–1.5%
- extreme/structural noise: >1.5% up to ~2.0% maximum

First harvest is partial and preserves a runner unless the remaining notional would be economically meaningless. In ORANGE/ORANGE_PLUS/RED, technically extended relative winners are preferred sources of defensive cash before mechanically dumping weaker holdings.

## 9. PRU-006 — Defensive stop / market-deterioration planner

Planner only; no autonomous order execution.

Per-position output records:

- total held quantity
- actually sellable quantity
- unavailable/staked/Earn/reserved quantity
- invalidation source, price, timestamp
- route: `STOP_MARKET`, `STOP_LIMIT`, or `NO_STOP`
- defensive tranche quantity/fraction
- gap-risk classification
- rationale

When gap-through risk is material, prefer stop-market/stop-loss semantics because stop-limit cannot guarantee exit. Stop-limit is allowed only when price control matters more than guaranteed exit and gap risk is sufficiently low.

Portfolio deterioration state is dynamic and dated. Sep-12 BTC/market references are examples only. Generic sequence:

1. first material BTC support failure -> withhold/cancel marginal alt adds;
2. deeper structural failure -> active de-risking / RED escalation;
3. major structural failure -> materially higher desired cash and full regime/portfolio reassessment.

## 10. PRU-007 — Kraken execution-routing policy

Recommendation hierarchy:

1. Kraken app Custom Order/target price when the effective premium is reasonable and the entry zone remains intact;
2. Kraken Pro maker limit when exact book price matters or app premium/spread is materially worse than likely maker cost;
3. Instant Buy only when immediacy matters more than entry precision.

Every decision records intended entry zone, market/book reference, displayed app effective price, estimated premium/spread, likely maker cost, chosen route, and reason.

Do not hardcode one universal app-premium threshold. Compare real all-in effective cost against maker execution cost and entry geometry. A visible $0 fee is never treated as zero execution cost.

## 11. Historical Kraken L2 certification dependency

Build an immutable Kraken USD L2 collector/certifier that computes:

- active-minute coverage
- historical p95 spread
- historical p10 depth inside 50 bps
- historical p10 depth inside 100 bps
- entry impact for Q
- exit impact for Q
- stressed full-exit impact
- 14 completed-day turnover median
- nearest-rank p10 turnover
- `Q_turnover`
- verified direct Kraken asset/USD identity and provenance

For typical Q, preserve current gates:

- active-minute coverage >=90%
- p95 spread <=25 bps
- p10 depth 50 bps >=10x Q
- p10 depth 100 bps >=25x Q
- 14-day median turnover >=500x Q
- 14-day p10 turnover >=200x Q

The 720 trades/day rule can only open Conditional-Probe research when every stricter conditional gate passes. 1,296 trades/day is only the mathematical feasibility floor for 90% active-minute coverage. Neither is historical certification. Snapshot evidence can never be mislabeled historical L2 evidence.

## 12. PRU-008 — Top-500 CMC x Kraken USD discovery sweep

Pipeline:

1. pull CMC top 500 identity/rank;
2. canonicalize ticker/slug/chain;
3. verify direct Kraken asset/USD spot pair;
4. fundamental/tokenomics/integrity screen;
5. fast Kraken execution snapshot;
6. Conditional-Probe screen where applicable;
7. historical L2 certification only from archived evidence;
8. technical entry geometry;
9. dependency/concentration fit;
10. rank and disposition.

Output separates discovery score, research score, execution status, liquidity acceleration, technical entry quality, lifecycle/supply state, portfolio fit, disposition, and buy authorization. `buyAuthorization` remains a separate authority path and is false for discovery output.

Expose "jump-off-screen research candidates" separately from "execution-certified candidates". Strong momentum may produce `NO_CHASE` rather than a buy signal.

## 13. PRU-009 — Research/watchlist state synchronization

Synchronize research coverage for CC, SUI, ENA, HBAR, QNT, TIA, XPL, ALLO, COMP, BONK, and newer scan names.

Persist research score/tier, lifecycle state/reason/until, notes, last research refresh, last lifecycle refresh, and explicit `RANKING_ONLY` authority.

Lifecycle quarantine survives high research score, RSI, or momentum. ALLO network/model quality is not equivalent to ALLO token attractiveness. Transient prices/RSI/one-day levels are not permanent strategy constants.

## 14. PRU-010 — Offline Random Forest stress model

Train two probabilistic targets matching the existing worker semantics:

- `BTC_STRESS_72H`: BTC suffers >=5% peak-to-trough downside during the next 72h;
- `BTC_STRESS_7D`: BTC suffers >=8% downside during the next 7d.

Build decision rows on a 6-hour cadence unless data availability forces a coarser cadence.

Candidate point-in-time-safe features include:

- BTC returns over 1h/6h/24h/7d;
- realized/downside volatility, normalized ATR/range expansion;
- trend distance/slope, relative ATH distance, current drawdown;
- breadth, BTC-dominance changes, alt/BTC relative strength, dispersion where point-in-time history exists;
- funding/open interest/liquidation data where point-in-time history exists;
- spread, depth, activity, turnover and liquidity deterioration;
- dependency/correlation regime and portfolio drawdown;
- existing Zobiris market axes.

Features without trustworthy historical point-in-time data are excluded rather than reconstructed.

Every training row records `decisionAsOf`, feature source/version/timestamp, `trainingCutoff`, `labelStart`, and `labelEnd`.

Hard invariants:

- `featureObservedAt <= decisionAsOf`
- `trainingCutoff < forecastAsOf`
- `labelStart > decisionAsOf`

Use walk-forward temporal folds only. Random train/test splitting is prohibited. Purge/embargo must be at least the longest forecast horizon to prevent overlapping-label leakage.

RF hyperparameter selection occurs only inside temporal training folds. Calibrate raw probabilities on a separate calibration window. Compare Platt/logistic and isotonic calibration; choose the lower out-of-sample Brier/calibration error, with simpler calibration preferred when isotonic sample size is inadequate.

Primary predictive metrics: Brier score, calibration error, ROC-AUC, PR-AUC, log loss, stress-event recall/false-negative rate, and probability stability.

## 15. Runtime-neutral RF artifact

Python is not a Railway runtime dependency. Export versioned JSON model artifacts under a namespaced intelligence-model directory. Each artifact contains at least:

- model version
- feature schema version/order
- training start/cutoff
- source-data hashes/provenance
- serialized tree structures
- calibration mapping
- training and walk-forward metrics
- artifact hash

TypeScript implements deterministic evaluation. Cross-language parity tests must show Python and TypeScript probabilities agree within a tiny numerical tolerance on fixed fixtures. Parity failure blocks artifact loading.

## 16. Allora-to-stress calibration

Do not invent a hand-written Allora-to-stress formula. Align timestamped Allora BTC return and BTC/ETH/XRP/SOL realized-volatility observations with later realized 72h/7d BTC stress outcomes and fit an interpretable probabilistic mapping first.

Historical Allora data is never fabricated. If there is insufficient genuine timestamped history, record `INSUFFICIENT_HISTORY`, keep Allora stress-worker weight at zero, and continue live shadow-canary observation until enough evidence accumulates.

Missing, stale, ambiguous, or schema-drifted Allora data remains unavailable/advisory and never breaks production continuity.

## 17. Walk-forward and friction validation

Compare:

1. baseline production logic;
2. baseline + RF shadow;
3. baseline + Allora shadow;
4. full calibrated coordinator;
5. full coordinator with Allora removed.

Run under observed/base friction, conservative friction, 2x friction, and 4x friction. Friction includes time-appropriate maker/taker fees, spread, and slippage.

Evaluate net return, max drawdown, downside deviation, Sharpe, Sortino, profit factor, turnover, whipsaw, recovery time, CVaR/tail loss, blocked profitable trades, avoided losing trades, calibration/Brier, and worker-weight stability.

Promotion candidate gates remain:

- >=15% OOS max-drawdown improvement;
- >=90% baseline net-return retention;
- improved Sortino;
- CVaR/tail loss not worsened;
- recovery time improved or materially similar;
- no unacceptable turnover/whipsaw increase;
- improvement across multiple regimes/folds;
- acceptable performance with Allora unavailable;
- no hard gate bypass;
- live shadow-canary evidence;
- explicit human approval.

Passing these gates does not self-promote a model.

## 18. Shadow monitoring UI

Add a clearly labeled Shadow Intelligence surface showing, where available:

- 72h and 7d RF stress probabilities;
- Allora calibrated probability or unavailable reason;
- worker weights;
- forecast freshness/provenance;
- Brier/calibration history;
- regret and diversity;
- production decision vs shadow counterfactual;
- difference reason;
- model version/training cutoff;
- promotion-gate status.

The UI must visibly state `SHADOW ONLY — NO TRADING AUTHORITY` and expose no control that silently promotes RF/Allora into production authority.

Maintain the current coordinator safeguards of 45% maximum per stress worker and 10% baseline floor unless a later separately approved validation changes them.

## 19. Test and release requirements

Use TDD for implementation changes. Required focused tests include:

- deposits/withdrawals do not alter strategy P/L;
- HWM continuity across flows/restarts;
- all drawdown-band boundaries and both speed overrides;
- risk escalation never grants authority;
- all DEP multipliers and broken-thesis zeroing;
- Conditional-Probe $25 cap overrides DEP;
- generalized RED exception positive/negative cases and CRITICAL deny;
- previous completed day high and runner preservation;
- stop-market preference under gap risk and sellable-balance checks;
- execution route audit and `$0 fee != cheapest` behavior;
- target crossing does not mark a private order filled;
- direct USD identity and 720/1296 semantics;
- snapshot != historical L2 certification;
- research rank cannot override quarantine;
- RF future-feature/training-cutoff rejection;
- deterministic replay and cross-language model parity;
- stale/missing Allora fail-closed behavior;
- no nominal BTC price-threshold switch;
- Allora-removal robustness;
- model-coordination authority remains shadow-only;
- no trading-execution static gate remains green;
- secrets remain absent from persisted/audit/browser outputs.

Before a v0.6.7 candidate is called complete, rerun the full Vitest suite, TypeScript checks, UI build, Python tests, integration/source verification, security tests, no-trading scan, deterministic replay, model parity tests, and credential/secret scan.

## 20. Release sequence

Implementation order:

1. PRU-001 through PRU-004 risk/sizing foundations;
2. PRU-005 through PRU-007 harvest/defense/execution routing;
3. historical Kraken L2 collector/certifier;
4. PRU-008 discovery;
5. PRU-009 research-state synchronization;
6. PRU-010 offline dataset/training pipeline;
7. RF training/calibration and TypeScript parity;
8. Allora calibration if evidence is adequate, otherwise live canary with weight zero;
9. friction/walk-forward evaluation;
10. shadow monitoring UI;
11. full verification;
12. freeze `v0.6.7 Post-Railway Risk/Execution/ML Shadow` candidate;
13. deploy the candidate separately and repeat Railway HTTP/security/persistence/rendered-browser QA.

A poorly performing trained RF is retained as a rejected experiment, not quietly promoted. An Allora mapping without adequate evidence stays unavailable. Unknown/insufficient evidence is a valid result.
