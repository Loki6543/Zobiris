# P0 v3 Research Evidence Boundary — Railway integration

This overlay is applied after the existing prediction overlay. The supplied package is preserved under `packages/research-p0`; Docker compiles it and runs its adversarial self-test before the application release checks.

The server initializes a separate versioned ledger at `<ZOBIRIS_DB_PATH>.research-p0.sqlite` (production: `/data/zobiris.sqlite.research-p0.sqlite`). Portfolio tables and Kraken credentials are unchanged. Initialization is transactional; unknown existing schemas, migration checksum mismatches and schema/trigger changes fail closed. Once initialized, API reads use readonly WAL snapshots, allowing evidence writers without blocking the HTTP event loop on a write lock. Research read errors degrade the health metadata; research assessment routes fail rather than falling back to example data.

`GET /api/intelligence/research-integrity` uses the persisted evidence registry. `GET /api/intelligence/overview` replaces only its research assessment and supplies separate research provenance; other legacy research panels remain labeled fixtures. `GET /api/research/provenance` requires the existing operator token. `/api/health` exposes the P0 version and evidence readiness only. No UI sections or order authority were added.

An empty ledger is `AWAITING_EVIDENCE`, with zero disclosed candidates and unknown statistical gates. Eligible engine validations alone do not prove alpha. P1B DSR/PBO/CPCV evaluators are not implemented, and automatic promotion is disabled. Historical LONA records have not been frozen or upgraded to R1. Use the supplied freeze runner with authorized credentials and exact original inputs when available; no import or fabricated evidence is performed by startup.

SQL guards validate relations, hash shape, primitive references and lifecycle rules; they do not prove artifact bytes, verifier execution, or external witnessing. Preserve original artifacts and witness audit heads before making cryptographic provenance claims.

Rollback: redeploy the prior GitHub commit. The new research file remains on the persistent volume but old code does not read it. Do not delete the volume or portfolio database.
