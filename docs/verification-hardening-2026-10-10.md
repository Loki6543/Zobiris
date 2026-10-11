# Verification hardening — scoped change record (2026-10-10 baseline)

## Source identity and deployment scope

- Original `main` baseline: `b8259aca40e3d60cb331e42c2237b534d63152d3`.
- This is a targeted follow-up, not a strategy rewrite or a new live-trading authorization.
- The repository is layered: `Dockerfile` restores the v0.7.6 archive and overlays v076, prediction, P0, dashboard and protection source **in that order**; protection can replace paths supplied by earlier overlays. Verify the built image, not only source existence.
- The previous 76-file sanitized PDF was a curated analytical artifact and did not prove deployment or full source completeness.
- Research-only tactical margin remains paper-only. Delayed rotation remains demote/flag-only. Registry controls still govern authority.

## Adopted fixes and reasons

1. `deploy/p0/overrides/src/strategy21/integration.ts`
   - A future or invalid order-book observation no longer passes the 15-minute Strategy 2.1 profile freshness check.
   - Malformed/future-dated evidence timestamps are rejected before producing an expiration timestamp (prevents invalid-date runtime failure).
   - The profile's exchange `observedAt` is not assumed to be a local receipt timestamp. The upstream Kraken collector has a separate 30-second book validity requirement; these are not interchangeable.

2. `deploy/protection/overrides/src/tactical/risk.ts`
   - Standalone signal and replay functions now reject unordered/nonfinite/impossible candles and invalid replay horizons. `parseBars` already validated Kraken candles; this extends the contract to direct callers and replay input.

3. `deploy/protection/overrides/src/tactical/service.ts`
   - Paper-ledger recovery validates each restored position before reopening paper observation.
   - Instrument metadata now rejects malformed/future timestamps. Check-time is captured when metadata has actually arrived rather than before awaiting its fetch.
   - The observer cannot submit live trades.

4. `deploy/protection/overrides/src/server/policy/portfolioGate.ts`
   - Buy recommendations fail closed on invalid policy caps/divisors, invalid account cash basis, unknown actions, or corrupt portfolio collections.
   - Asset symbol comparisons are normalized to prevent duplicate slots and mismatched held-asset checks.
   - Full exits do not depend on buy-sizing policy or cash-basis checks; their existing account/position checks remain.

5. Tests:
   - `deploy/p0/overrides/src/tests/freshness-boundary.test.ts`
   - `deploy/protection/overrides/src/tests/tacticalMargin.test.ts`
   - `deploy/protection/overrides/src/tests/v31-policy-binding.test.ts`

## Explicitly deferred

- Do **not** replace the current risk sizing with a Kelly/volatility/liquidation formula on the strength of citations alone. Test incremental paper-only challengers with frozen inputs, costs and holdouts.
- Do **not** represent the 59-asset delayed-rotation retrospective screen as verified forward alpha.
- Full policy-hash registry identity enforcement, per-field episode provenance, a permanent vault manifest, portfolio-level drawdown and cross-venue market-depth impact remain follow-on audit tasks requiring call-site tracing and data-model review.
- Do **not** conflate a top-of-book quote, a modeled exit, a simulated fill and a real execution.
- No source-code control alone proves that an identical control is active in a deployed image.

## Verification protocol

The canonical `.github/workflows/zobiris-build-check.yml` builds `Dockerfile`, which invokes research P0 self-tests, decision-boundary/refresh checks, Strategy 2.1 tests, full Vitest, production TypeScript checking and UI build.

For each future release, retain: source revision, build result, failing/passing test details, image identity, configuration fingerprint, production deployment identity, policy stamp and a tested endpoint receipt. Build success is not deployment attestation.

Primary background sources:
- Kraken WebSocket v2 book checksum: https://docs.kraken.com/exchange/guides/websockets/book-checksum-v2
- Kraken book channel: https://docs.kraken.com/exchange/api-reference/spot-websocket-v2/book
- Coinbase WebSocket sequencing caveats: https://docs.cdp.coinbase.com/exchange/websocket-feed/overview
- Bailey et al., Probability of Backtest Overfitting: https://www.davidhbailey.com/dhbpapers/backtest-prob.pdf
