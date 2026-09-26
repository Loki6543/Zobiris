# Zobiris Prediction Layer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a shadow-first, cost-aware Kraken microstructure forecasting layer beneath Zobiris's simplified decision UI.

**Architecture:** Public Kraken book collection writes bounded, point-in-time features; specialists and a soft router produce multi-horizon forecast records. Outcome scoring and a trial ledger determine authority; the first release leaves Strategy 2.1 decisions unchanged until forward validation earns promotion.

**Tech Stack:** Existing TypeScript/Node, Vitest, Railway persistent volume and release gate.

**Spec:** `docs/superpowers/specs/2026-09-26-prediction-layer-design.md`

## Global Constraints

- Private Kraken access remains read-only; never add account write methods.
- No forecast metric enters the main UI; preserve the existing UI text gate.
- Uncalibrated probabilities and unavailable inputs stay null or ABSTAIN.
- Native horizons: 1H, 4H, 1D, 3D, 7D.
- Preserve Strategy 2.1 and all research, liquidity, risk, and capital vetoes.
- Recover and version-match exact production source before modifying product code.

## Review Focus

- A sequence gap invalidates book features until resnapshot: Task 2 test.
- An unmapped or crossed pair yields ABSTAIN: Tasks 2 and 4 tests.
- A horizon evaluated much later than due time is marked late, never treated as the exact horizon close: Task 5 test.
- Repeated tuning cannot reuse a final holdout or omit failed trials: Task 6 test.
- A model may not change buy size or UI confidence in shadow mode: Task 7 test.

---

### Task 1: Recover canonical source

**Files:**
- Create: `docs/superpowers/source-recovery-2026-09-26.md`
- Inspect: `deploy/v076/MANIFEST.txt`, `deploy/v076/overrides/**`, Railway deployment metadata and production checkpoint.

**Interfaces:**
- Produces: a normal source worktree at the exact current production revision, with an independently recorded commit/build identifier.

- [ ] Confirm the live Railway deployment revision and compare it with the GitHub archive manifest, the 15ca5dc2 checkpoint, and the reported 16f6c635 UI release.
- [ ] Reconstruct the actual current source into an isolated branch; document archive hash, overlays, and source provenance. Stop if no reproducible match exists; never promote an older source.
- [ ] Run existing full tests, TypeScript and build unchanged; record counts and any baseline failures.
- [ ] Commit the source-provenance document on the implementation branch.

### Task 2: Validated public Kraken book states

**Files:**
- Create: `src/strategy21/prediction/krakenBook.ts`
- Create: `src/strategy21/tests/krakenBook.test.ts`
- Modify: `src/providers/kraken.ts` only for the public feed integration.

**Interfaces:**
- Produces: `applyBookEvent(state: BookState | null, event: BookEvent): BookState` and `bookValidity(state: BookState, now: string): BookValidity`.

- [ ] Write tests asserting snapshot plus in-order deltas produce expected top levels, a skipped sequence forces resnapshot, crossed levels invalidate state, and unknown pair mapping cannot qualify.
- [ ] Run `npx vitest run src/strategy21/tests/krakenBook.test.ts`; verify expected failures.
- [ ] Implement the pure book reducer and public stream adapter with bounded levels and event timestamps.
- [ ] Run focused test, then commit.

### Task 3: Point-in-time features and bounded persistence

**Files:**
- Create: `src/strategy21/prediction/bookFeatures.ts`
- Create: `src/server/bookFeatureStore.ts`
- Create: `src/strategy21/tests/bookFeatures.test.ts`
- Create: `src/tests/book-feature-store.test.ts`

**Interfaces:**
- Consumes: `BookState`, `BookValidity` from Task 2.
- Produces: `extractBookFeatures(state: BookState, asOf: string): BookFeatures | null` and `appendBookFeatures(path: string, feature: BookFeatures): Promise<void>`.

- [ ] Write tests for spread, microprice, imbalance, depth at 50/100 bps, stale-state rejection, timestamp cutoffs, duplicate writes and retention bounds.
- [ ] Run both focused test files; verify failures.
- [ ] Implement feature extraction and atomic bounded persistence on the existing Railway volume; never persist private account payloads here.
- [ ] Run focused tests, then commit.

### Task 4: Forecast records, specialists and authority

**Files:**
- Create: `src/strategy21/prediction/forecast.ts`
- Create: `src/strategy21/prediction/authority.ts`
- Create: `src/strategy21/tests/forecast.test.ts`
- Create: `src/strategy21/tests/authority.test.ts`

**Interfaces:**
- Produces: `predictHorizons(input: PredictionInput): ForecastRecord[]` and `assessAuthority(forecast: ForecastRecord, diagnostics: Diagnostics): Authority`.
- `ForecastRecord` carries 1H/4H/1D/3D/7D horizon, model/version, feature cutoff, regime, nullable event probabilities and 10/50/90 quantiles, estimated net edge, and availability reason.

- [ ] Write tests for deterministic trend/mean-reversion baselines, short-horizon book specialist, regime weight normalization, no lookahead, nullable untrained outputs, and ABSTAIN on stale/crossed/unmapped data or nonpositive net edge.
- [ ] Run focused tests and verify failures.
- [ ] Implement auditable baselines and soft routing; keep forecast authority shadow-only regardless of emitted numeric estimates.
- [ ] Run focused tests, then commit.

### Task 5: Matured outcomes, calibration and drift

**Files:**
- Modify: `src/server/outcomeMemory.ts`
- Create: `src/strategy21/prediction/calibration.ts`
- Modify: `src/tests/outcome-memory.test.ts`
- Create: `src/strategy21/tests/calibration.test.ts`

**Interfaces:**
- Produces: `scoreMaturedForecasts(records: ForecastOutcome[]): CalibrationSummary` and `detectPredictionDrift(recent: ForecastOutcome[], baseline: ForecastOutcome[]): DriftAssessment`.

- [ ] Write tests for Brier/log loss on matured records, calibration bins and minimum sample guard, missing values, late evaluation annotation, and drift lowering authority rather than automatic promotion.
- [ ] Run focused tests and verify failures.
- [ ] Extend outcome records compatibly (read old version), save immutable forecast/model IDs and evaluation lag, score only matured forecasts.
- [ ] Run focused tests, then commit.

### Task 6: Trial ledger and chronological verifier

**Files:**
- Create: `src/strategy21/prediction/trialLedger.ts`
- Create: `src/strategy21/prediction/walkForward.ts`
- Create: `src/strategy21/tests/trialLedger.test.ts`
- Create: `src/strategy21/tests/walkForward.test.ts`

**Interfaces:**
- Produces: `recordTrial(path: string, trial: StrategyTrial): Promise<void>` and `evaluateWalkForward(config: TrialConfig, observations: TimedObservation[]): TrialResult`.

- [ ] Write tests that retain failed trials, reject overlapping train/test windows and future features, count searched configurations, and charge fees, spread, impact and fill assumptions against existing Strategy 2.1/no-trade baselines.
- [ ] Run focused tests and verify failures.
- [ ] Implement immutable trial IDs, atomic persistence, chronological purged splits and cost accounting.
- [ ] Run focused tests, then commit.

### Task 7: Shadow wiring, UI protection and candidate gate

**Files:**
- Modify: `src/runtime/refresh.ts`, `src/strategy21/integration.ts`, `src/server/server.ts`, `railway_hosted_gate.mjs`
- Modify: `src/strategy21/tests/integration.test.ts`, `src/tests/server-http-integration.test.ts`, `src/tests/ui-intelligence.test.tsx`

**Interfaces:**
- Consumes: Tasks 2–6; writes shadow forecasts and diagnostics to internal API, never overrides Strategy 2.1 actions or sizes.

- [ ] Write tests proving live Kraken orders and Strategy 2.1 decisions are identical with shadow on/off; malformed forecast input produces ABSTAIN; main UI hides model metrics; no private Kraken write endpoints or secrets leak.
- [ ] Run focused tests and verify failures.
- [ ] Wire collectors and persistence with failure isolation; add a bounded diagnostic API and candidate gate assertions.
- [ ] Run focused tests, full suite, strict TypeScript/build and hosted candidate gate; inspect real coverage and resource use.
- [ ] Commit the integration. Promote only after the existing Railway production procedure verifies the exact candidate; keep authority shadow in this release.

## Release acceptance

Report the matched source revision, test count, TypeScript/build result, candidate gate result, actual Kraken book coverage, storage/CPU observations, and shadow-versus-baseline decision parity. If any check fails, leave production unchanged and state the blocker. A subsequent promotion to decision authority requires an independent forward-validation decision and is outside this first release.
