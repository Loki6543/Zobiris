# P0 v3 Railway integration plan

**Goal:** Deploy the supplied research evidence boundary into the current Zobiris application.

**Architecture:** Vendor the supplied package, including its source and adversarial tests. Use a separate SQLite research database beside the existing portfolio database on the persistent Railway volume. Expose aggregate provenance status and feed a fail-closed assessment to the existing Research Integrity API. No inferred historical reproducibility or statistical validation.

**Spec:** Supplied `zobiris-p0-handoff-v3(3).zip`, README and integration gate.

**Constraints:** Preserve portfolio storage, Kraken credentials, existing trade authority and concise UI. P0 does not implement P1B statistical evaluators or automatic trading. Keep the current Docker build and hosted release gate.

## Tasks
- [x] Recover exact main archive and overlays; verify archive hash and supplied self-test.
- [x] Test persistent initialization, reopen, schema mismatch rejection, append-only gates, and empty evidence yielding unknown/unpromotable results.
- [x] Vendor P0; add a checksum-tracked transactional SQLite initializer and read-only status adapter. Refuse unknown existing research schemas.
- [x] Replace sample research assessment in server responses with the persisted evidence adapter; add authenticated diagnostics and a minimal health version marker.
- [x] Run P0 compilation/self-test, integration tests, full application tests, typecheck and UI build. Review diff and deployment configuration.
- [ ] Commit through connected GitHub, deploy through existing Railway pipeline, verify live health/version, research status, and Kraken continuity.

## Review focus
Schema changes must not be silently accepted; missing evaluators must not imply a pass; sample backtests must not appear as current evidence; research state must survive restarts; operational diagnostics must preserve token checks.
