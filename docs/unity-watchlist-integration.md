# Unity decision-state endpoint

`GET /api/zobiris/watchlist` implements the uploaded PDF's Railway contract. Existing production decisions remain authoritative. No trading capability is added.

## Consumer contract

- Top-level fields: asOf, marketGate, portfolio, assets. Every documented per-asset field is present.
- Prices and returns are unrounded JSON numbers; format small tokens with enough significant digits.
- Scores are normalized from production 0–100 to 0–1. Null is unknown, never zero.
- marketGate.pass is nullable. Null, false, stale observations, or a nonempty blockedReason must prevent the qualified green pulse.
- state preserves the production pattern classification; QUALIFIED does not imply executable authority.
- observationMs is the source quote epoch in milliseconds, not request time. Missing, future, or more than 30-minute-old observations are blocked. Snapshot freshness is also checked. The PDF sample's ISO and epoch disagree; never copy either as runtime data.
- Account context must be synced and no more than five minutes old. Otherwise cash, holding count, held flag, quantity, and reentry status are unknown.
- Holdings count excludes only the persisted confirmed reward lot; quantity and held marker preserve actual account balances.
- Entry reference uses existing baseline/reentry math and Kraken validator. It is null when any downstream gate blocks, metadata is missing/stale, cash cannot support minimums, or there is an existing order requiring review.
- Existing orders currently return VERIFY. Detailed KEEP/MOVE/PAUSE decisions remain in the existing Portfolio UI; no separate conflicting review algorithm has been introduced.
- Reference limits are per-candidate, not collectively funded order instructions. No order quantity or execution button is supplied.
- Endpoint contains financial account context already exposed by the existing account view, but never exchange credentials or raw private payloads. Response is no-store. Do not embed it into a public shared dashboard without appropriate access protection.
- GET may update the existing public instrument metadata cache. It does not refresh strategy, write exchange orders, or record fills.

## Unity prerequisites and corrections

The CryptoDash Unity project/scene was not supplied. No Unity visualizer has been modified, built, or deployed by this backend change. Railway currently serves the Node/React app; a Unity browser scene requires a Unity WebGL build and hosting integration.

Use nullable DTO fields with a null-preserving JSON parser (for example Unity's supported Newtonsoft JSON package). The PDF's nonnullable double/bool fields and JsonUtility approach cannot distinguish null from 0/false. Preserve the exact nested DTO layout and map it into per-symbol snapshots only after validation.

Poll conservatively (for example 30 seconds), prevent overlapping requests, dispose failed requests, and retain original observation times when reusing last-good data. Clear assets removed from the next complete response. Unknown market gate renders neutral/cold, never warm.

Bind state colors, stale labels, held rings, and selection text after data parsing is verified. Downstream blockedReason overrides green pulse. Share one price-to-height mapping between tower candles and entry marker; omit marker for null limit. Missing falsifier must say 'Not supplied', not 'thesis intact'. Existing-order labels are manual review only.

The visual changes require the actual CoinOrbVisualizer, CandlestickTowerVisualizer, TickerRibbonVisualizer, camera/scene setup, and a Unity build environment. Supply the CryptoDash project to complete that portion and visually verify it.
