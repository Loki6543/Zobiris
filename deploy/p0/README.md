# P0 v3 Research Evidence Boundary — Railway integration

This overlay is applied after the existing prediction overlay. The supplied package is preserved under `packages/research-p0`; Docker compiles it and runs its adversarial self-test before the application release checks.

The server initializes a separate versioned ledger at `<ZOBIRIS_DB_PATH>.research-p0.sqlite` (production: `/data/zobiris.sqlite.research-p0.sqlite`). Portfolio tables and Kraken credentials are unchanged. Initialization is transactional; unknown existing schemas, migration checksum mismatches and schema/trigger changes fail closed. Once initialized, API reads use readonly WAL snapshots, allowing evidence writers without blocking the HTTP event loop on a write lock. Research read errors degrade the health metadata; research assessment routes fail rather than falling back to example data.

`GET /api/intelligence/research-integrity` uses the persisted evidence registry. `GET /api/intelligence/overview` replaces only its research assessment and supplies separate research provenance; other legacy research panels remain labeled fixtures. `GET /api/research/provenance` requires the existing operator token. `/api/health` exposes the P0 version and evidence readiness only. No UI sections or order authority were added.

An empty ledger is `AWAITING_EVIDENCE`, with zero disclosed candidates and unknown statistical gates. Eligible engine validations alone do not prove alpha. P1B DSR/PBO/CPCV evaluators are not implemented, and automatic promotion is disabled. Historical LONA records have not been frozen or upgraded to R1. Use the supplied freeze runner with authorized credentials and exact original inputs when available; no import or fabricated evidence is performed by startup.

SQL guards validate relations, hash shape, primitive references and lifecycle rules; they do not prove artifact bytes, verifier execution, or external witnessing. Preserve original artifacts and witness audit heads before making cryptographic provenance claims.

Rollback: redeploy the prior GitHub commit. The new research file remains on the persistent volume but old code does not read it. Do not delete the volume or portfolio database.

## Production refresh memory guard

Post-deployment validation exposed a pre-existing full-history materialization problem: production refresh exhausted the Node 2 GiB heap against the ~870 MB persistent database, while the empty candidate DB passed. `loadStrategyLiquidity` now preflights row counts and encoded JSON bytes in the same readonly transaction as materialization. The refresh now loads and evaluates one complete symbol profile at a time, releasing its book references before the next asset. Limits are 12,000 rows / 64 MiB per symbol; direct multi-symbol callers also have a 64 MiB aggregate bound. A symbol exceeding those bounds is omitted from executable-liquidity evidence and remains WATCH_ONLY; data stays on disk. No sampling is presented as complete history. The guard logs `LIQUIDITY_HISTORY_BUDGET_EXCEEDED` with symbol/count/bytes. The observed production profiles (largest about 35 MiB) fit the per-symbol bound. Eager and per-symbol evaluation produce identical decisions in regression tests. These limits are conservative availability controls, not a certification shortcut.
