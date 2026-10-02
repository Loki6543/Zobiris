# Entry integrity implementation plan

> **For agentic workers:** Use superpowers:executing-plans task by task.

**Goal:** Unify buy references, validate Kraken order geometry, separate confirmed rewards, and collect honest forward outcomes.
**Architecture:** Shared pure entry module; cached public Kraken instrument metadata; conservative outcome episode tracking; existing SQLite investment tracker with explicit reward classification.
**Tech Stack:** TypeScript, React, Node, SQLite, Vitest.
**Spec:** User-approved workspace audit in this conversation (October 2, 2026).

## Global constraints
- Private Kraken remains read-only. Preserve all balances and existing strategy authority gates.
- Live delayed-rotation prior remains 4–8%, with existing 2pp re-entry adjustment capped at 10%.
- Uncalibrated structure/ATR/cost/LOQS enhancements remain shadow only.
- Confirmed BABY reward lot is at most 0.00523 units; additional quantity remains investment exposure.

## Review focus
- Missing, stale, ambiguous or inactive instrument metadata blocks buy plans.
- Tick/quantity rounding never exceeds price or cash cap; below minimum orders block.
- Future or missing prices cannot resolve a past outcome; late observations expire.
- Repeated snapshots do not masquerade as independent evidence; old records preserved.
- Reward exclusion must not conceal a subsequent purchase or claim complete account NAV.

### Task 1: Entry geometry
- [ ] Add failing tests for shared baseline, re-entry cap, tick/quantity floor, minimums and missing metadata.
- [ ] Implement src/shared/entryPlan.ts and src/server/entryRules.ts with active unambiguous USD pairs.
- [ ] Wire /api/entry-rules and all three SimpleApp buy paths. Preserve selection/capital gates; require strict rotation for holding adds too.
- [ ] Run targeted tests and production typecheck.

### Task 2: Reward classification
- [ ] Add regression test: BABY reward missing price does not block intentional investment tracking; extra BABY does.
- [ ] Version tracking signature and expose reward quantity and valuation scope in ProfitProtection.
- [ ] Run tracker tests.

### Task 3: Forward evidence
- [ ] Add regressions for late horizons, absent prices, overlapping episodes, no false fills.
- [ ] Preserve old records, archive overflow, version new episodes; record proposed limit and sampled touch proxy separately from actual fills.
- [ ] Expose descriptive /api/pilot-scorecard and dashboard research panel, with strict no-verdict state and sample limitations.
- [ ] Run outcome tests.

### Task 4: Release
- [ ] Copy changed source into deploy/protection/overrides; run full Vitest, production tsc, UI build.
- [ ] Independent code review, fix material findings, commit and publish to existing Railway service.
- [ ] Verify hosted gate and live API/UI, report limitations precisely.

## Decisions
- Existing recovered runnable checkout is the build workspace; Git deployment overlays remain canonical. No redundant repository copy.
- Evidence uses nonoverlapping seven-day episodes per symbol, not a claim of statistical independence across correlated coins.
- No historical fill reconstruction without reconciled order identifiers; sampled limit crossings are labeled proxies.

## Verification ledger
- Entry geometry: 4 regression tests pass. Reward classification: 10 tracker tests pass.
- Outcome recording: horizon timing, overlap, touch semantics, overflow archive and corrupt-file preservation covered.
- Independent reviewer found display precision and synthesized quote-time errors; both reproduced with failing tests, then fixed. No deferred review findings.
- Full Vitest: 541/541 pass. Production typecheck/build and live release verification recorded below after completion.
- Ruling: A 1% cash reserve is a conservative UI buffer, not an exact Kraken fee quote. User must verify account fee tier; no orders sent.
- Production tsc passed; UI build passed; Strategy 2.1 Node suite 229/229 passed.
