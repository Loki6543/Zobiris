# ZOBIRIS Research Discipline P1B — verified synthesis

**Date:** 2026-10-07  
**Authority:** `SHADOW_ONLY_NO_TRADING_AUTHORITY`  
**Purpose:** reconcile the uploaded YSF discipline bundle with the code actually deployed by ZOBIRIS, verify the previously open dependency questions against source, and implement only the non-redundant pieces.

## 1. Reconciliation before implementation

The uploaded correction is directionally right that ZOBIRIS already contains substantial provenance and pre-registration machinery, but one claim is too strong for the current tree: the P0 package explicitly says production DSR/PBO/CPCV mathematics were **not yet implemented**. The registry had a shadow-only capability slot named `sidecar_trial_registry_dsr_pbo`, but the production provenance reader returned all three metrics as `UNKNOWN` and `statisticalEvaluatorsImplemented: false`.

Therefore this change is a **P1B evaluator implementation + wiring task**, not merely a call-site switch.

The uploaded `trialLedger.fixed.ts` is also treated as a design reference rather than copied verbatim. Two repairs were required before adoption:

1. `netReturnPct` is percentage points, while 80/120/160 are basis points. Comparing `netReturnPct` directly with `120` is a 100× unit error.
2. The existing ZOBIRIS walk-forward helper already subtracts execution costs before returning `netReturnPct`; requiring net return to exceed the fee again would double-charge cost.

The implemented rule is: **charge the declared fee path in the evaluation, then require post-cost net return > 0**, alongside family-wise statistical correction.

## 2. Dependency verification completed from source

### purged-cross-validation

Verified against `eslazarev/purged-cross-validation` commit `aee1215c58d65a60a1d6af4b483f929fecde76e2`:

- `purge()` removes **training rows whose label horizon overlaps test horizons**; it is not merely removing the test rows.
- embargo is explicitly **post-test/asymmetric**.
- embargo supports duration, observation-count, or dataset-fraction modes; no mode is silently assumed when omitted.
- `PurgedGroupKFold` accepts a per-sample `groups` vector and prevents the same group from appearing in train and test for a fold.
- PBO is computed from CSCV: select the in-sample winner, rank it out of sample, transform the relative rank to a logit, and report the fraction of logits below zero.
- DSR is PSR evaluated against the Bailey–Lopez de Prado selection-adjusted Sharpe benchmark. The implementation requires ordinary (non-excess) kurtosis and sample variance across searched Sharpe values.

ZOBIRIS does **not** vendor or runtime-import the Python package. The verified semantics are used to implement equivalent read-only TypeScript diagnostics over the existing P0 evidence schema. This avoids introducing a Python production dependency into the decision server.

### falsification-ledger

Verified against `holdout-labs/falsification-ledger` commit `f886ee31cba489d20031cb1ed74e698772de34be`:

- the chain payload uses deterministic JSON with sorted keys, compact separators, UTF-8, and non-finite numbers rejected;
- required preregistered criteria that are omitted from a report produce `criterion_not_covered` blockers;
- a `not_falsified` conclusion is blocked unless every required criterion is explicitly `met`;
- the CLI `conformance` command exits non-zero when blocked.

ZOBIRIS already has the stronger structural analogue in P0: append-only audit events, confirmatory plan ordering, immutable family/candidate/split lineage, primitive-complete evidence requirements, and fail-closed promotion constraints. No redundant Python ledger was added to production.

### Consensus

Verified against `seanheiney/consensus` commit `10ce9c720dd2ccaef3f69ba1bccb97fef05706cc` and its shipped ablation JSON.

The evidence supports Consensus as a useful **judgment/review layer in some conditions**, but not as an empirical alpha gate. Results are grader-dependent and profile/sample sizes differ. ZOBIRIS therefore does not grant Consensus statistical promotion or trading authority.

## 3. Implemented changes

### 3.1 P1B statistical integrity evaluator

Production research provenance now computes, from persisted P0 evidence only:

- **DSR diagnostic** for selected candidates when all family candidates on the selected split have primitive-complete Sharpe/skew/kurtosis/sample evidence. The effective trial count stored by P0 is used conservatively.
- **PBO diagnostic** from complete CSCV in-sample/out-of-sample matrices. A split is discarded rather than partially scored when the full registered candidate universe is not present.
- **CPCV path diagnostics** (path count, positive-path rate, median path metric). CPCV remains `WATCH` rather than inventing a ZOBIRIS-specific promotion threshold that was never preregistered.

Research-integrity thresholds used where the uploaded spec explicitly defined them:

- DSR: `> 0.95`
- PBO: `< 0.10`

Missing, convention-ambiguous, or incomplete evidence stays `UNKNOWN`/`WATCH`; it never becomes a neutral or positive value.

### 3.2 Trial-ledger hardening

The TypeScript trial ledger now distinguishes:

- `passed`
- `failed`
- `inconclusive`
- `invalid`

`invalid` requires an explicit reason such as a broken chain, moved data snapshot, registry-version drift, skipped required criterion, or unknown family size.

A `passed` trial now additionally requires:

- positive **post-cost** net return;
- the Tier-1 `MAKER_TAKER` validation path (120 bps round trip) or a stricter declared path;
- an explicit set of tested feature/horizon/regime cells;
- family size derived from those cells rather than accepted as a caller-supplied count;
- a z-score that exceeds the Bonferroni critical value for the derived family size.

The existing legacy symmetric-fee API remains available for historical callers, but new validation can use the exact 80/120/160 bps fee-path model.

### 3.3 Authority remains unchanged

This work does **not** create order authority. DSR/PBO/CPCV remain research-integrity evidence only. The existing hard boundaries remain:

- no qualification authority;
- no reference-limit authority;
- no sizing authority;
- no order-recommendation authority;
- no exchange-write authority.

Even a statistically strong result remains non-promotable while point-in-time universe, CPCV policy, parameter stability, benchmark, execution-fill, or other required evidence is unresolved.

## 4. Regression requirements

The release must pass tests for:

- 120 bps = 1.20%, not 120%;
- no double charging of already-net returns;
- `invalid` distinct from `inconclusive`;
- invalid reason required;
- family size derived from tested cells;
- Bonferroni correction (105-cell neighborhood near z=3.49);
- DSR stricter under larger search families;
- PBO robust/overfit rank examples;
- incomplete CSCV families fail closed instead of shrinking the denominator;
- DSR fail-closed on incompatible kurtosis convention;
- research provenance still returns `UNKNOWN` when evidence is absent;
- all statistical outputs remain shadow-only.
