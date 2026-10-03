# Live Evidence and Reassessment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task if the user selects native execution. Use superpowers:subagent-driven-development only if the user selects delegation.

**Goal:** Connect timestamped news/social evidence to explicit coin reassessment, and collect decision outcomes independently of dashboard use.

**Architecture:** Extend the existing Node/SQLite evidence and attention paths. Separate new decision creation from quote follow-up, retain the per-file write queue, and expose compact evidence/reassessment information in the existing React dashboard. Import is the supported fallback when continuous provider access is unavailable.

**Tech Stack:** TypeScript, Node, better-sqlite3, Zod, React, Vitest; existing provider adapters.

**Spec:** `docs/superpowers/specs/2026-10-03-evidence-and-reassessment-design.md` — approved by the user October 2, 2026, Phoenix.

## Global constraints

- No exchange orders, subscription purchases, credential copying from chat connectors, new profit probabilities or changes to capital/entry authority.
- Preserve actual publication, retrieval and quote observation times separately.
- Outcome collection every five minutes; retain 25% post-horizon windows, five-minute BTC alignment and existing 15-minute quote freshness checks.
- Snapshot execution freshness is 30 minutes. Individual evidence kinds carry explicit expiry times, rather than borrowing the account timestamp.
- Existing expired outcomes remain expired. Actual fills remain distinct from price touches.
- Preserve fixture tests but remove fixture-backed production attention responses.
- Work in `/workspace/scratch/3fe31d482044/recovered/Zobiris_v0.7.6_Railway_Staging`; persist source changes in `/workspace/scratch/3fe31d482044/zobiris/deploy/protection/overrides` and documentation in the git repository.
- Do not overwrite unrelated local changes. Check repository instructions and workspace status before implementation; reconcile the runnable checkout against Docker overlay precedence first.

## Review focus

- Provider records for the wrong coin or syndicated copies must not become independent confirmations: Task 2.
- Concurrent refresh and collection must not lose episodes or resolve them using stale/future quotes: Task 1.
- Credentials, import payloads, remote redirects and external text must not cross security boundaries: Tasks 2–3.
- Restart, failed fetches and removed watchlist symbols must not silently stop follow-ups: Tasks 1 and 3.
- A working account feed, empty social response or unavailable provider must not imply current investment evidence: Tasks 3–5.

## Task 1 — Independent outcome follow-up

**Files:** Modify `src/server/outcomeMemory.ts`; create `src/server/outcomeCollector.ts`; extend `src/tests/entry-outcome-timing.test.ts`; create `src/tests/outcome-collector.test.ts`.

**Interfaces:** Export `OutcomeQuote { symbol: string; priceUsd: number; observedAt: string }`; `updateOutcomeObservations(path: string, quotes: OutcomeQuote[], receivedAt: string): Promise<void>`; `collectOutcomeTick({path, now, fetchQuotes}): Promise<CollectionStatus>`. `CollectionStatus` has status, attemptedAt, lastSuccessAt, requestedSymbols, observedSymbols and sanitized error code. `fetchQuotes(symbols: string[]): Promise<OutcomeQuote[]>` is injected.

- [ ] Add failing tests: an episode due at 01:00 resolves from a 01:05 observation received at 01:06 without creating a new episode; quote at 00:59 does not resolve; a quote outside the 25% horizon window does not resolve; BTC over five minutes apart is not a matched benchmark.
- [ ] Add tests: refresh and observation update concurrently preserve both writes; expired outcomes stay expired; corrupted file is preserved; a removed watchlist symbol with pending outcomes is requested; restart reads pending work from disk; overlapping ticks do not overlap provider calls.
- [ ] Run `npx vitest run src/tests/entry-outcome-timing.test.ts src/tests/outcome-collector.test.ts`; confirm the new interface tests fail before implementation.
- [ ] Extract the existing follow-up arithmetic into a shared internal function used by both update paths. Both paths use the existing per-file queue. Do not create synthetic outcome seeds for follow-up quotes.
- [ ] Implement pending-symbol selection plus BTC, bounded batches of at most 100 symbols, and quote fetch injection. Missing identity mapping produces unavailable coverage, not symbol guessing. Reuse the verified CMC/Kraken mapping and quote parser; inspect its current supported contract before wiring.
- [ ] Rerun the targeted tests and copy the changed source/tests into the deployment overlay. Commit only this task's files after review.

## Task 2 — Persistent research evidence and review decisions

**Files:** Create `src/server/researchEvidence.ts`, `src/server/reassessment.ts`, `src/tests/research-evidence.test.ts`, `src/tests/reassessment.test.ts`.

**Interfaces:** `ResearchEvidence` includes ID, canonicalAssetId, symbol, provider, sourceUrl, publishedAt (nullable), retrievedAt, expiresAt, kind, lineageId, summary, claim, relevance, verification, contentHash, polarity, material (boolean), verificationSourceUrl (nullable), dataMode (`LIVE` or `IMPORTED`) and optional raw social measurements. Kind and verification enums are exactly those in the spec. `openResearchEvidence(dbPath: string)` returns a repository with `append(records)`, `list(assetId)`, `readReview(assetId)`, `saveReview(review)` and `close()`.

**Review:** `{assetId, status, evidenceIds, previousEvidenceIds, changedClaims, counterEvidenceIds, missingEvidence, nextReviewCondition, updatedAt}`. Status uses the four spec states. `evaluateReassessment(previous, evidence, now): Review` is pure and has no order/capital outputs.

- [ ] Add failing tests: wrong canonical ID rejected; missing publication date stays null; future retrieval rejected; duplicate URL/claim does not increase independent source count; revised/conflicting claim retains prior evidence; restart retains review state.
- [ ] Add tests: confirmed material catalyst changes NO_MATERIAL_CHANGE to REVIEW_REQUIRED; material negative primary-confirmed claim produces THESIS_RISK; duplicate ingestion leaves queue unchanged; unverified story yields EVIDENCE_INCOMPLETE; no order or position fields exist.
- [ ] Run `npx vitest run src/tests/research-evidence.test.ts src/tests/reassessment.test.ts` and verify new tests fail.
- [ ] Implement Zod validation and SQLite tables in a separate research database beside the existing database. Use transactions, parameterized statements and SHA-256 hashes. Store raw source lineage; normalize URLs and claim whitespace for exact deduplication. Similar but nonidentical stories remain explicitly uncertain rather than being claimed independent.
- [ ] Require a verification source and recorded rationale for PRIMARY_CONFIRMED. Provider delivery alone cannot assign that status. Unverified free text cannot generate verified token-demand claims.
- [ ] Implement deterministic review comparison. Social REVIEW_REQUIRED requires at least seven comparable daily observations from the same source, current activity over twice the median and increased unique participation where available; label this an unvalidated review heuristic, never an investment score. Missing comparability means insufficient evidence.
- [ ] Rerun tests, copy exact files to overlay, review and commit.

## Task 3 — Authorized collection and import

**Files:** Create `src/server/researchCollection.ts`, `src/server/researchRoutes.ts`, `src/tests/research-collection.test.ts`, `src/tests/research-routes.test.ts`; modify `src/server/server.ts`.

**Interfaces:** `ResearchAdapter { id; configured(): boolean; fetch(assetIds: string[], signal: AbortSignal): Promise<ResearchEvidence[]> }`; `collectResearchTick(repo, adapters, universe, now): Promise<CollectionStatus[]>`; `registerResearchRoutes` follows the server's existing route handler convention after inspection. A persisted cursor and per-asset attempted/succeeded times expose partial coverage.

- [ ] Inspect credential presence and provider capabilities without printing values. Reuse existing authorized social adapters only when their response shape and coverage pass a live read-only probe. Verify any proposed server news endpoint against official documentation before coding that adapter. Do not invent an endpoint or claim chat connector access is server access.
- [ ] Add failing tests: missing key gives NOT_CONFIGURED; HTTP failure gives UNAVAILABLE; empty results give an empty successful response with no popularity score; one provider failure leaves existing evidence intact; cursor survives restart and eventually visits held assets plus the full active watchlist.
- [ ] Add tests: authenticated import accepts canonical bounded records; anonymous request is 401; over 100 records or 1 MiB is rejected; javascript URLs and private-network source targets rejected; imported text is rendered as text and never executed; diagnostics omit secrets.
- [ ] Run `npx vitest run src/tests/research-collection.test.ts src/tests/research-routes.test.ts`; verify new tests fail.
- [ ] Implement 10-second fetch timeout, 1 MiB response limit, fixed allowlisted API origins, redirects disabled, and sanitized error codes. Retry on subsequent ticks with persisted exponential backoff capped at one hour. Use at most five assets per tick and two concurrent requests unless the verified provider contract permits a safe batch.
- [ ] Add authenticated `POST /api/research/evidence/import` using the existing operator-token authorization and request size controls. Add read-only `GET /api/research/evidence?symbol=...` and `GET /api/research/reassessment?symbol=...` without exposing private account records or secrets. Imported records retain original timestamps and IMPORTED data mode.
- [ ] Prefer verified live adapters; if credentials/capability are unavailable, ship a clearly labeled imported-research path and precise provider status. Record the integration blocker instead of pretending continuous collection works.
- [ ] Rerun tests, copy files to overlay, review and commit.

## Task 4 — Scheduling, attention truth and integrity

**Files:** Modify `src/server/server.ts`; create `src/tests/research-runtime.test.ts`; extend existing integrity/attention route tests found during implementation.

**Interfaces:** Start/stop lifecycle hooks own five-minute timers, unref them and clean up on server close. Timers call Tasks 1 and 3 with nonoverlap protection. Persist last attempt and successful observation timestamps separately.

- [ ] Add failing tests using fake timers: five-minute follow-up runs with no UI request; server close stops timers; restart resumes pending work; failing provider does not crash server; production attention endpoint never calls the fixture overview.
- [ ] Add tests: market snapshot older than 30 minutes is stale despite fresh account sync; absent/future snapshot timestamp is unavailable; live vs imported attention is explicit; zero coverage cannot be healthy evidence.
- [ ] Implement lifecycle hooks and replace fixture attention results with persisted evidence or an explicit unavailable empty result retaining `authority`, `asOf`, `provenance`, and `attentionIgnition` contract fields. Do not relabel unavailable evidence DORMANT.
- [ ] Add collection status to `/api/integrity` and pilot scorecard diagnostics. Report account, market, news/social and outcome timestamps independently. Do not delete existing attention history or silently clear its backlog.
- [ ] Run `npx vitest run src/tests/research-runtime.test.ts` plus affected route tests. Review, copy and commit.

## Task 5 — Compact dashboard reassessment

**Files:** Create `src/ui/ResearchEvidencePanel.tsx`, `src/tests/research-evidence-panel.test.tsx`; modify `src/ui/SimpleApp.tsx`, `src/ui/MarketBrief.tsx` and existing styles only where needed.

**Interfaces:** Panel consumes evidence/reassessment route responses. Watchlist displays coverage and review status; expandable details contain source links, original dates, thesis changes, contrary evidence and outstanding checks. Market Today distinguishes technical-only analysis from verified evidence context.

- [ ] Add failing UI tests: unconfigured social renders Unavailable rather than zero; imported evidence is labeled Imported research; stale evidence displays its age; negative and supporting claims both appear; external content remains escaped text; review flag never becomes a Buy label.
- [ ] Implement batched loading or one selected-coin request, not 60 parallel per-row fetches. Keep existing price/return rankings and entry gates unchanged in this release. Review flags prioritize investigation separately from investment rankings.
- [ ] Run `npx vitest run src/tests/research-evidence-panel.test.tsx`; verify small-screen layout and expandable behavior in the rendered app using the frontend testing skill. Copy changed files, review and commit.

## Task 6 — Integrated verification and Railway release

**Files:** Extend `zobiris/railway_hosted_gate.mjs` only for the new read-only contract checks; add `docs/evidence-and-reassessment-release.md` with verified provider status and limits.

- [ ] Review changes for security, missing-data handling, gate preservation, overlapping writes and timestamp integrity. Fix concrete findings before release.
- [ ] In the runnable checkout run `npm test`, `npm run test:strategy21`, `npm run test:decision-boundary`, `npm run test:same-origin-refresh`, `npx tsc -p tsconfig.production.json --noEmit`, and `npm run build:ui`. Run the remaining Dockerfile release gates required by the current deployment.
- [ ] Verify overlay precedence reproduces the tested files. Check `git diff --check` and inspect staged changes; do not include credentials, local account dumps, databases or generated research raw text in source commits.
- [ ] Deploy through the existing authorized repository/service route. Do not create a second app or reset persistent volumes. If deployment access is unavailable, finish the tested change and report that exact blocker.
- [ ] Hosted read-only checks: health, integrity, evidence/reassessment routes, no fixture production attention, account sync intact, watchlist and Market Today render. Verify a pending outcome receives a fresh independent observation after a timer tick; do not invent an already-due outcome to make verification pass.
- [ ] Report shipped commit, actual configured/imported/unavailable sources, tests, observed collection times and remaining coverage limits. Preserve all unvalidated strategy labels.

## Self-review and execution choice

The plan covers the approved first release only. New return forecasts, advanced entry pricing and relaxed liquidity policy are subsequent releases, not hidden additions. The social trigger is a transparent queue heuristic requiring validation; it cannot authorize investment. Provider access remains a capability gate with an honest import fallback, not an assumption that a subscription exists.

Recommended execution: native, task by task in this session, because the changes share persistence and timestamp contracts and can reuse one verified runnable checkout. No delegation is assumed. The writing-plans workflow requires user review of this plan and selection of execution method before product code is changed.
