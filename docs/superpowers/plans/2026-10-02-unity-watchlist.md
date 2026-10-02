# Unity decision-state integration

User supplied and authorized ZOBIRIS_INTEGRATION.pdf as the implementation specification.

1. Add a pure watchlist projection consuming persisted production strategy output, cached account state, and existing entry validator. Preserve nullable data; normalize scores to 0–1. Never promote a qualified pattern past downstream blocks.
2. Add GET /api/zobiris/watchlist using latest persisted snapshot and existing canonical watchlist. No new exchange writes or credentials. Account fields follow existing read-only account API access; no cache of private response.
3. Test missing data, stale/future observations, downstream veto, tick precision, reward scope, existing-order review labels, and no input mutation. Run full release gates.
4. Commit deployment overlays, publish to existing GitHub main/Railway service, verify terminal deployment and endpoint.

Unity prerequisite: CryptoDash scaffold is not present in the available workspace or matching Library results. Do not invent existing visualizer APIs or claim a Unity/WebGL build. Document hookup requirements and request the scaffold after completing Railway work.

Spec corrections: example epoch does not match its ISO date; retain actual source timestamps. JsonUtility primitive DTOs cannot preserve nullable fields; a null-preserving parser is required. 30-minute quote presentation freshness is distinct from the existing 30-minute instrument-rule limit. Missing falsifier is unknown, not 'thesis intact'. Existing order disposition is VERIFY until shared authoritative review output is available.
