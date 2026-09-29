# Verification — 2026-09-29

Recovered main commit `c20451d7db0473188bfa415e0e9d9e07ea6f0c5d` using the exact source archive (SHA-256 `fd32f772482562ad7ce8597d7ff3e3fc318dd7d7f5cfb6ff1d376a599218f4f7`) and Docker overlay order.

- Supplied P0 source compiled; adversarial provenance self-test passed.
- Application suite: 507 tests passed in 86 files.
- Strategy 2.1 suite: 229 tests passed.
- New persistence and HTTP checks: 13 passed, included in the application suite.
- Production TypeScript check and UI build passed.
- Decision-boundary, same-origin refresh and both CMC shape checks passed.
- Root hosted gate syntax and git whitespace checks passed.
- Independent code review completed; corrected synchronous write-lock reads, candidate trial counting and supersession lineage filtering.

Regression evidence: the HTTP test first failed because the endpoint returned the example fixture; it passes with the persistent adapter. The concurrent-writer test first failed with `database is locked`; it passes with readonly WAL snapshot reads.

Local environment: Node 24.19.0. Initial dependency build failed on sandbox file ownership during header extraction; manually extracting the matching Node headers without ownership restoration and rebuilding better-sqlite3 resolved this environment issue. No application dependency changes were needed. A Strategy 2.1 check initially failed because the local reconstruction omitted the Docker-copied attention-ledger documentation; after reproducing that copy, all 229 checks passed.

The Railway Docker build repeats compilation and release checks. The existing hosted pre-deploy gate is retained and extended to verify P0 version, persisted provenance, disabled promotion and authenticated diagnostics.

Post-release refresh diagnosis: two live refreshes crashed at the Node heap limit. Railway reported the production database at 870,739,968 bytes. Added a bounded order-book history loader without deleting source evidence or certifying sampled history. The first memory regression failed before the guard and passed afterward. A second regression verifies the aggregate memory budget and duplicate-symbol handling. After the guard, 508 application tests and 229 strategy tests passed; the additional aggregate-budget test and final transactional read change passed the focused suite and production typecheck. Railway repeats the complete final suite before deployment.
