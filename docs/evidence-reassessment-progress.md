# Execution ledger — 2026-10-03-evidence-and-reassessment
Approved spec and plan; native execution authorized.
Preflight: Tasks 1/4 share quote collector status; Tasks 2/3/5 share validated evidence and review contracts.
Ruling: use existing isolated recovered runnable checkout and dedicated deployment branch; avoid duplicate node_modules and preserve overlay precedence. Cost if wrong: reconcile source before deployment.
Task 1: in progress.
Task 1 core: independent observation API and pending-symbol collector implemented; targeted 10/10 pass. Existing serialized queue retained. Runtime provider wiring and restart status belong to Task 4; full acceptance pending integration.
Tasks 1–5: implemented and unit/integration verified; rendered QA remains blocked. Runtime polls every five minutes, evidence import is operator-authenticated, and dashboard surfaces provider availability and review flags separately from investment authority.
Ruling: retain the existing 64KB HTTP import body bound, stricter than the planned 1MiB library bound — avoids widening the server input boundary. Cost: large imports must be split.
Ruling: provider search results remain UNVERIFIED; Stocktwits normalized metrics are not invented raw mentions or unique participants. Cost: automatic social acceleration needs actual comparable raw-count evidence, obtainable through validated imports.
Final review: fresh reviewer found two P2 issues. Fixed re-observation freshness and canonical news matching; regression tests observed RED→GREEN (10/10 relevant tests). No further blocking findings reported. No deferred minor findings.
Additional stale-social regression observed RED→GREEN; source time governs expiry.
Verification: initial full suite 570/570; strategy suite 232/232; decision boundary 4/4; same-origin 2/2; CMC 2/2; P0 adversarial selftest passed. Final suite after three regression additions pending result. Production typecheck and build passed before final run.
Task 6: local HTTP evidence/reassessment/attention/health returned 200; unauthorized import returned 401. Final overlay files compared byte-for-byte. Hosted gate extended for new read-only contracts and import authentication.
QA limitation: Browser plugin absent; existing Playwright dependency has no browser executable. Official browser download failed with truncated/invalid archive. Cloud Browser local navigation returned ERR_BLOCKED_BY_CLIENT. Rendered desktop/mobile verification is not claimed.
Deployment limitation: no git remote or Railway CLI credentials present; Railway browser visibly signed out. Secure sign-in is the remaining deployment access requirement. No production deployment performed.
Final verification: npm test → 573/573 across 101 files; production TypeScript → pass; build:ui → pass; git diff --check and hosted-gate syntax → pass. Both final review fixes verified by failing tests before correction and green full suite afterward. Deployment and rendered QA remain explicitly incomplete.
