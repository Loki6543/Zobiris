# ZOBIRIS b8259aca independent audit reconciliation — 2026-10-11

**Source:** User-supplied 26-page `Zobiris b8259aca Code Audit.pdf`, dated October 10, 2026, originally examining older commit `b8259aca`.  
**Compared against:** production `main` commit `ecdf44d519d468de6fbd7d8cfddb97f5ebeb1018` (October 11).  
**This document records implementation decisions, not proof of a deployed release.** Retain the canonical GitHub Actions Docker build receipt and Railway deployment identity separately.

## Guiding decisions

- Fix actual correctness/security defects but **do not change frozen delayed-rotation pilot thresholds or give its research score more capital authority**.
- Keep tactical margin **PAPER ONLY**, no new live orders, 1–1.5x research cap. Leave `POLICY.version` at tactical-v1; do not silently compare the new fee assumptions with old P&L or claim verified US margin market fills.
- An unpriced held balance may occupy a portfolio slot with an unknown USD mark. Forbid price-dependent add/sell but do not block an unrelated safe buy. An unknown valuation is **not** an invented zero; a corrupt negative/NaN value still blocks.
- Treat the Kraken Pro Tier-1 July 2026 **spot** 0.80%-per-side taker fee as conservative paper-book proxy until the actual account and Bitnomial US margin product costs are verified. Distinguish provider observations, simulations and actual executions.

## Twenty-five audit finding dispositions

| # | Report severity | Finding | Disposition |
|---|---|---|---|
| 1 | P0 | Unpriced holding freezes account portfolio gate | **PATCHED:** nullable unknown USD value; intentional unpriced holdings occupy slots; valuation-dependent trades gated; BABY reward lot from registry fallback |
| 2 | P0 | QUALIFIED onsets lost to symbol-only 7d spacing | **PATCHED:** cohort-specific spacing; `samplingRule: COHORT_SPACED_7D`; old and new samples not pooled blindly |
| 3 | P0 | Fee assumptions half Tier-1 spot taker fees | **PATCHED:** tactical spot-book proxy 0.008 each side; shadow and liquidity default 80bps. Actual account tier and US margin venue cost still unknown |
| 4 | P1 | Tactical paper ledger stalls at 20,000 | **PATCHED:** completed-record JSONL archive at 18k; preserve open positions and historical counters; possible archive duplicates after crash require ID deduplication |
| 5 | P1 | Health checks repeatedly run statistics | **PATCHED:** 60s research health cache and degraded fallback |
| 6 | P1 | Research import limiter argument order wrong | **PATCHED:** `(key, Date.now(), 10)` with effective retry period |
| 7 | P1 | Heavy public routes uncapped | **PATCHED:** per-IP throttling of liquidity and specialist summary reads |
| 8 | P1 | Dashboard computes buy suggestions without portfolio gate | **PATCHED:** read live authenticated unified server gate; require ALLOW/REDUCE and source plan; fail closed on missing/stale server decision |
| 9 | P1 | Liquidity loader global 64 MB budget is watchlist-order dependent | **DEFERRED:** requires a careful persistent aggregate schema and measured cost; meanwhile insufficient history cannot enable orders |
| 10 | P1 | Registry descriptions/weights drift from deployed delayed-rotation code | **DEFERRED:** correct registry documentation and structural-break stamp separately after policy-owner review; don't mutate prospective pilot parameters now |
| 11 | P2 | Validation split missing purge/embargo and vault exposed | **DEFERRED PRIORITY:** introduce explicit horizon embargo and frozen prospective vault governance before any strategy promotion; do not claim research is out-of-sample now |
| 12 | P2 | Walk-forward timestamps reject normal reporting latency | **DEFERRED:** move validation membership to verified available-at time with chronological fixtures |
| 13 | P2 | DSR conventions (raw kurtosis/Sharpe periodicity) unclear | **DEFERRED:** specify input semantics and reject mismatches rather than guessing |
| 14 | P2 | PBO median out-of-sample tie counted as skill | **PATCHED:** conservative `lambda <= 0` criterion with regression |
| 15 | P2 | Funding crowding only relative cross-section | **DEFERRED:** need per-asset 72h history and defensible absolute thresholds; no upgraded market authority |
| 16 | P2 | Shadow prediction horizon mismatches features | **DEFERRED:** record horizon-specific correlations before claiming forecasting edge |
| 17 | P2 | 30m/2h swarm outcomes often expire | **DEFERRED:** integrate with periodic outcome collector and preserve event-time cutoffs |
| 18 | P2 | Textual sentiment treated as price-derived | **PATCHED:** `language` evidence family for known sentiment |
| 19 | P2 | CoinDesk domain mismatch and boilerplate negativity | **PATCHED:** `coindesk.com` authority classification and no generic disclaimer words as automatically negative |
| 20 | P2 | Strategy2.1 liquidity assessed against $30 while probe may be $37 | **DEFERRED HIGH PRIORITY:** align check to actual proposed notional, after carefully reviewing legacy baseline test and without raising size |
| 21 | P2 | Dead p0 research provenance overlay | **DOCUMENTED:** protection overlay is last; do not rely on dead copy; cleanup separate from behavior release |
| 22 | P2 | Snapshot/synthetic quote mistakenly qualifies rotation | **PATCHED:** retains research state but requires provider-live provenance for capital-ready flag and dashboard candidate |
| 23 | P1 | Tactical 2R cost economics poor at 1.5% stop | **HONEST DISCLOSURE:** corrected fee proxy; live trading still disabled. Evaluate a new independent tactical-v2 ledger with actual venue fees only after evidence, don't silently optimize v1 mid-pilot |
| 24 | P2 | Missing factor values masquerade as neutral | **DEFERRED SHADOW DIAGNOSTIC:** log unknown-weight coverage/bands but don't alter frozen scoring |
| 25 | P2 | Kraken spot book isn't US Bitnomial margin book | **DISCLOSED:** existing paper feed uses spot-book proxy; do not claim actual executable US margin quotes or liquidation until separate data are independently integrated |

## Essential validation steps

1. GitHub build from this exact PR SHA: full Docker build, strategy21 tests, Vitest, production TypeScript and UI build.
2. Check portfolio/gate, watchlist and UI-fixture regressions (private account locked vs unlocked).
3. Ensure existing open tactical v1 ledger loads unchanged, archives completed records safely, status historical counts reconcile, and `liveEnabled === false`.
4. Confirm the sidecar keeps `SHADOW_ONLY`, note external sidecar v0.2 is in a compressed bundle; its own fee config must be independently inspected and verified before equating economics with main app.
5. For Railway release, verify both `Zobiris` and `zobiris-evidence-v01` deploy the merged SHA, are online with running replicas and no critical errors; do not infer deployment from a green build.
6. Future work: run a canary UI/browser check using an unlocked account only through an authorized session and verify live data with no sensitive info in public views.

**Statistical warning:** retrospective signal hit counts from one month, handpicked coin universes and preliminary replay P&L must not be described as statistically established live edge. Outcome horizons and costs require matching forward evaluation. Re-ranking or gate relaxation mid-pilot would contaminate that evaluation.
