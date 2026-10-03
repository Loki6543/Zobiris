# Evidence and reassessment release — 2026-10-03

Status: implemented locally; not yet deployed to Railway. Desktop/mobile rendered validation remains unverified because test-browser acquisition failed and Cloud Browser cannot reach localhost.

The release adds independent five-minute follow-up of pending outcome episodes, persistent canonical-asset evidence, source/publication/retrieval/expiry dates, contradictory claims, and explicit reassessment flags. Watchlist, Market Today and coin comparison show research coverage separately from investment rankings. Production attention now reads persisted evidence rather than the research fixture.

## Data sources and limits

- Parallel news requires PARALLEL_API_KEY. Search matches are UNVERIFIED and do not become confirmed catalysts automatically. Each tick examines at most five assets with a shared ten-second provider budget and persisted round-robin coverage/backoff.
- Stocktwits requires STOCKTWITS_FIRESTREAM_USERNAME and STOCKTWITS_FIRESTREAM_PASSWORD. Normalized metrics remain distinct from raw mention/participant counts. Observations older than 24 hours are excluded. No claim that this subscription is configured on Railway has been made.
- CMC outcome quotes use verified canonical numeric IDs and actual provider observation times. Missing/expired observations do not become fills or successful outcomes. Pending removed-watchlist coins continue to be requested.
- POST /api/research/evidence/import requires the existing operator Bearer token; at most 100 records and the existing 64KB HTTP body limit. Every imported record is labeled IMPORTED. No evidence was imported into production during this release.
- News evidence and social observations expire independently. Research flags request investigation; no new order authority, ROI probability or automatic buy promotion is introduced.
- Seven comparable social baseline periods and actual mention/participant counts are required for the unvalidated social acceleration review heuristic.

## Verification and release gate

Production TypeScript and UI builds pass. The existing strategy, CMC, P0 provenance, decision-boundary and same-origin suites pass. Local HTTP health/evidence/reassessment/attention are 200 and unauthenticated import is 401. Final test count is recorded in evidence-reassessment-progress.md.

Before claiming production release: obtain Railway account access, deploy this branch through the existing service source, run the hosted contract checks, visually verify Market Today/watchlist/coin details, and observe an independent collector tick. Confirm provider configuration from runtime statuses; never infer it from the presence of ChatGPT connectors.
