# Zobiris Core Operational Hardening Runbook

**Branch:** `zobiris-core-rebuild`  
**Purpose:** pre-staging operational controls derived from the September 27 architecture review.

## 1. Policy governance

- All decision-affecting thresholds live in `core/src/policy/config.ts`.
- Every policy has a semantic version and deterministic SHA-256 hash.
- Engine snapshots expose the version/hash.
- Strategy episodes persist the version/hash.
- Automatic parameter mutation is disabled.
- A policy cannot be considered promotable until:
  - minimum qualified episodes pass;
  - minimum control episodes pass;
  - minimum independent market episodes pass;
  - chronological validation passes;
  - realistic costs are included;
  - shadow evaluation is complete.

## 2. Provider degradation

Required market providers are evaluated independently.

- Fresh current response -> `LIVE`.
- Failed current response with still-fresh cache -> `DEGRADED`.
- Cache past TTL -> `STALE`.
- No usable current or cached result -> `ERROR` / `MISSING`.

New-buy authority is disabled when required market data is stale/missing/error or clock integrity is degraded.

CMC quote freshness is measured against the expected watchlist. BTC must be fresh and at least the configured fraction of the full watchlist must have fresh quotes. One stale coin does not veto the full system; that asset is surfaced as `DATA_STALE`.

## 3. SQLite integrity and backups

Before staging cutover:

1. Keep one Railway replica and one writer.
2. Mount the SQLite file on the service volume.
3. Enable Railway volume backups:
   - daily;
   - weekly.
4. Run `npm run db:backup` before schema-changing cutovers or migrations that cannot be trivially reversed.
5. Verify the generated copy passes SQLite `quick_check`.
6. Perform a restore drill in staging before production replacement.
7. Keep at least one backup copy outside the active service volume before production promotion.

The public health endpoint reports database integrity and approximate database size.

## 4. Authentication boundary

Current Core contains no private Kraken/account read routes.

Before adding any:

- configure `AUTH_SESSION_SECRET` with at least 32 characters;
- register the route as `private` or `mutating`;
- route registration must include the session guard or application startup fails;
- use only the `__Host-zobiris-session` cookie;
- cookie properties remain `Secure; HttpOnly; SameSite=Strict; Path=/`;
- do not store session/auth tokens in browser localStorage/sessionStorage;
- private responses use `Cache-Control: no-store`.

A future mutating endpoint also requires CSRF protection before activation.

## 5. Observability

Use:

- structured JSON refresh logs;
- `GET /api/health` for DB/policy/Engine integrity;
- `GET /api/metrics` for:
  - refresh total/failures over 24h;
  - open strategy episodes;
  - overdue outcomes;
  - database size;
  - provider statuses;
  - clock state;
  - new-buy authority.

The desktop Engine must display authority state and market-data age.

## 6. Clock integrity

Core compares wall-clock elapsed time with monotonic elapsed time during refresh and rejects materially future provider timestamps.

If clock state becomes `DEGRADED`:

- new-buy authority is disabled;
- no fresh strategy episode should be created;
- outcome resolution requiring authoritative time is skipped.

## 7. Outcome integrity

A strategy episode is created from a fresh, authoritative setup transition rather than each refresh.

Each episode stores:

- strategy tag/version;
- policy version/hash;
- signal timestamp/price;
- BTC benchmark price;
- intended limit;
- recommended size;
- 1H/4H/1D/3D/7D/14D/30D schedules.

Due outcomes resolve from historical Kraken OHLC. Unresolvable timing remains unresolved; a later arbitrary refresh price is not substituted.

## 8. Staging acceptance before production

Do not replace the existing Railway service until the rebuilt staging service passes:

- full CI;
- strict TypeScript;
- server compile;
- production UI build;
- DB migration;
- DB integrity;
- live CMC/Kraken provider checks;
- stale-provider authority lockout test;
- Kraken identity mismatch test;
- personal-size execution test;
- policy identity persistence;
- episode creation and due-outcome resolution;
- authenticated private-route test once private account sync is added;
- desktop browser QA;
- hosted release/security gate;
- Railway terminal SUCCESS.

Production cutover still remains a separate explicit step.
