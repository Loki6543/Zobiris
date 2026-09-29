# Zobiris P0 v3 — Research Evidence Boundary

This package hardens the P0 provenance layer after adversarial review. It is deliberately **not a trading engine**. It sits between research engines (LONA, local Backtrader, vectorbt, later Nautilus) and Zobiris Research Integrity.

Core rule:

> **Zobiris does not trust a backtest engine. It trusts evidence only after the evidence survives the protocol.**

## What v3 fixes

v3 closes the concrete integrity holes found in the prior handoff:

- **Cross-family lineage mixing is blocked.** Composite foreign keys tie `candidate_strategy`, `evaluation_split`, `candidate_result`, `selection_event`, `engine_validation`, and `promotion_assessment` to the same family/candidate lineage.
- **Pre-registration is derived, not self-asserted.** `preregistration_proven` is no longer a writable field. Confirmatory plans must point to a `RESEARCH_PLAN_REGISTERED` audit-chain event whose payload hash equals the plan hash; confirmatory results must be chained strictly after that event.
- **Selection must match the registered plan.** Selection rule, effective-trial function, split definition, metric definition, cost model, candidate universe, and candidate count are checked before a confirmatory selection can be inserted.
- **Validation eligibility is database-computed.** `eligible_for_integrity_scoring` is a generated column. Both `EXACT_MATCH` and `MATCH_WITH_REGISTERED_NUMERIC_TOLERANCE` require identity agreement plus primitive-complete results. The database cross-checks actual dataset hashes, run-config hashes, metric/cost/split identity, observation protocol, and execution model rather than trusting Boolean claims alone.
- **Tolerance matches require evidence.** A tolerance-based match cannot be stored without a `numeric_tolerance_evidence_sha256` artifact.
- **Lifecycle is a real state machine.** Sequence gaps, stale `from_status`, illegal jumps such as `OPEN -> PROMOTED`, and unbacked PROMOTED/DEMOTED transitions are rejected.
- **Primitive evidence is enforced for confirmatory claims.** Confirmatory results require R1 byte-reproducible data plus observations, fills, positions, equity marks, periodic returns, and a chain event.
- **SHA fields validate lowercase 64-character hex**, not merely string length.
- **The verifier compares the full canonical path**, not only fills and final NAV, and independently reconstructs cash/positions/equity from fills and mark prices.
- **Probe vocabulary is consistent** with the SQL/verifier and no probe can create a promotion assessment.
- **Historical LONA R1 claims require exact original input bytes.** Current-vintage provider data is never used to retroactively claim historical byte reproducibility.

## Reproduction tiers

| Tier | Meaning | Permitted claim |
|---|---|---|
| `R1_BYTE_REPRODUCIBLE` | Exact original input bytes + strategy/config/runtime provenance | Eligible for engine-level reproduction and integrity validation |
| `R2_CONFIG_REPRODUCIBLE_INPUTS_UNPINNED` | Strategy/config known, historical data vintage unpinned | Experiment definition/history only; signals may differ |
| `R3_CONTEXTUAL_ONLY` | Material source/config provenance missing | Context only; excluded from reproduction claims |

`SOURCE_DATA_NOT_FROZEN` is an expected honest state for many historical hosted-data runs.

## Files

- `migrations/001_research_provenance.sql` — v3 SQLite schema, composite lineage constraints, audit-chain pre-registration, promotion gates, lifecycle state machine, benchmark registry, append-only guards.
- `src/types.ts` — TypeScript contracts for the v3 evidence protocol.
- `src/canonical.ts` — canonical JSON/SHA-256 helpers and content-addressed storage.
- `src/capability-manifest.ts` — normalized MCP `tools/list` hashing/diffing.
- `src/verifier.ts` — independent full-path verifier and state reconstruction.
- `src/freeze-core.ts` — resumable capability-driven LONA freeze core.
- `scripts/freeze-lona.ts` — direct MCP runner; optional exact-original-input capture.
- `scripts/selftest.ts` — adversarial regression suite exercising the integrity gates.
- `probes/probe-plan.json` — normalized R1 engine-semantics probe corpus.
- `VERIFICATION.md` — what was actually compiled and tested in this package.

## Canonical observation protocol

Engine adapters emit the same engine-independent event vocabulary:

- `ORDER_SUBMITTED`
- `ORDER_FILLED`
- `MARK_PRICE`
- `POSITION_SNAPSHOT`
- `CASH_SNAPSHOT`
- `EQUITY_MARK`

The verifier does **not** trust an engine analyzer's exposure/NAV summary. From `ORDER_FILLED` + `MARK_PRICE`, it reconstructs cash, positions, and equity and checks snapshots against that reconstruction before cross-engine comparison.

`ORDER_FILLED.feeQuote` is part of the primitive event so fee accounting can be reconstructed rather than inferred from summary metrics.

## Pre-registration proof

Wall-clock timestamps are metadata, not the proof.

A confirmatory plan must be witnessed by an append-only audit event:

```text
RESEARCH_PLAN_REGISTERED(payload_sha256 = plan_hash)
        ↓ chain sequence
candidate result events
        ↓
selection event
```

A candidate result whose chain event precedes or equals the plan registration event is rejected. An unrelated event type or mismatched payload hash cannot register the plan.

For an exploratory → confirmatory lineage, the confirmation period must not overlap the parent's hypothesis-generation period when those boundaries are provided.

## Selection integrity

Confirmatory `selection_event` insertion is blocked unless all of these agree with the registered plan:

- selection rule hash;
- effective-trial-count function hash;
- split definition hash and an actual family split row;
- metric definition hash;
- cost model hash;
- candidate universe hash;
- raw trial count equals the stored candidate count;
- all family result chain events follow the plan registration event;
- the selected candidate actually has a matching result under the selected split/metric/cost.

There is no writable `preregistration_proven` flag.

## Validation integrity

Eligible conclusions are exactly:

- `EXACT_MATCH`
- `MATCH_WITH_REGISTERED_NUMERIC_TOLERANCE`

Eligibility is generated by SQLite and is still subject to the hard trigger that verifies the underlying rows actually share:

- dataset artifact hash;
- run configuration hash;
- metric definition;
- cost model;
- split;
- canonical observation protocol;
- execution model;
- primitive-complete evidence.

A tolerance match additionally requires a stored tolerance-evidence artifact. This avoids the old overclaim implied by `MATCH_WITH_EXPLAINED_ROUNDING` when a difference was merely within a tolerance.

## Lifecycle / promotion

`experiment_family` has no mutable authoritative status. Current state is derived from ordered `family_lifecycle_event` rows.

Examples of allowed paths:

```text
OPEN → SELECTED → FORWARD_SHADOW → PROMOTED
PROMOTED → WATCH → DEMOTED → REVALIDATING
REVALIDATING → FORWARD_SHADOW → PROMOTED
```

Sequence must be `previous max + 1`, `from_status` must equal the current state, and `PROMOTED`/`DEMOTED` transitions require matching promotion-assessment decisions.

`PROMOTE` itself requires a confirmatory family, integrity-eligible engine validation, behavioral-conformance artifact, integrity assessment, capital-invariant pass, and human approver.

## LONA freeze

Install/run in an environment with the MCP SDK available:

```bash
npm install
npm test

export LONA_MCP_TOKEN='...'
export LONA_MCP_URL='https://mcp.lona.agency/mcp'
export LONA_ACCOUNT_FINGERPRINT='non-secret-fingerprint'
export FREEZE_DIR='./private/lona-freeze'
npm run freeze:lona
```

### Optional exact original input mapping

To permit an R1 classification, the freezer can copy and hash exact user-owned source files before calling the provider. Supply JSON mapping provider data IDs to local files:

```bash
export LONA_ORIGINAL_INPUT_MAP='{"custom-data-id":"/secure/path/original.csv"}'
```

Those bytes are copied into `original-inputs/` and included in the freeze manifest. A report is awarded R1 only if its full report exposes data/symbol IDs and **every referenced ID** is bound to exact captured original bytes. If the provider does not expose enough report→dataset lineage, the report remains R2/R3 rather than guessing.

`lona_get_symbol_data` is still treated as a **provider observation**, not proof of the exact originally uploaded bytes.

### Capture limitation

The MCP SDK returns decoded objects. The freezer stores SDK-decoded JSON, not literal HTTP wire bytes. The manifest says so explicitly. Wire-level preservation would require transport instrumentation and a separate artifact type.

## Capability drift

Each freeze stores a canonicalized `tools/list` hash and the producer surface (`DIRECT_MCP`, `CHATGPT_CONNECTOR`, etc.). The same account can expose different tool assemblies on different surfaces; that is recorded as evidence rather than normalized away.

Re-run the R1 probe corpus after a relevant provider/runtime capability change.

## Probe corpus

The probe corpus uses byte-frozen 1-minute UTC 24/7 synthetic/custom bars. Pass/fail does not depend on Sharpe annualization. Execution semantics are explicit:

- `buy_on_close=true` → decision-bar close;
- `buy_on_close=false` → next-bar open;
- commission → quote-currency fee on executed notional;
- slippage → applied to execution price only when explicitly enabled;
- ambiguous OHLC-only intrabar limit sequencing must be flagged rather than silently assumed.

The probes validate engine behavior, not trading alpha, and they **never create `promotion_assessment` rows**.

## Adversarial tests included

`npm test` attempts the attacks that motivated v3, including:

- attach candidate B to family A;
- attach family-B split to family A;
- use an unrelated audit event as plan registration proof;
- use a candidate-result chain event from before plan registration;
- insert confirmatory summary metrics with no primitive observations;
- use R2 data for a confirmatory result;
- change registered metric/cost/split selection semantics;
- claim tolerance match without a tolerance evidence artifact;
- claim exact validation across different underlying datasets;
- claim exact validation across a different `run_config_hash` while setting the equality Boolean to true;
- promote candidate B using candidate A's selection/validation lineage;
- jump lifecycle `OPEN -> PROMOTED`;
- create lifecycle sequence gaps;
- hide an incorrect intermediate position behind the same final NAV.

## Benchmark drift

The schema now includes `benchmark_definition` and `benchmark_recompute`.

A benchmark cannot enter `REGISTERED` status unless its capital invariant passed. Recomputes distinguish:

- `BIT_EXACT`
- `WITHIN_REGISTERED_TOLERANCE`
- `DRIFT`
- `NOT_COMPARABLE`

This supports deterministic same-container regression checks while avoiding pressure to silently loosen tolerances after an environment change.

## Scope boundary

P0 v3 creates the evidence boundary and hard gates. It does **not** claim to implement production DSR/PBO/CPCV mathematics yet. Those evaluators should consume the complete candidate matrix/primitive-derived metrics behind this schema. The schema deliberately preserves the fields and artifacts required to build P1B without winner-only transcription.

Recommended sequence remains:

```text
P0  freeze + evidence boundary + capability manifest
P1A local reproduction + R1 probe corpus
P1B DSR/PBO/CPCV + synthetic/noise calibration
P2  high-volume candidate generation
P3  forward-shadow evidence + outcome learning
P4  reversible promotion/demotion
P5  historical Kraken L2 / execution-grade simulation
```
