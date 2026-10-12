# Bubblemaps API — evaluation and how Zobiris uses it

Retrieved 2026-10-12 from docs.bubblemaps.io (OpenAPI 0.3.1), blog.bubblemaps.io and pro.bubblemaps.io.

## What it is
Two products:
- **iFrame** (`https://iframe.bubblemaps.io/map?chain=…&address=…&partnerId=…`): the visual bubble map. `partnerId=demo` works only on localhost; production needs a partner id issued by Bubblemaps (contact@bubblemaps.io), with subscription plans for analytics platforms. Not embeddable in Zobiris without that agreement, so the app links out to `https://app.bubblemaps.io/{chain}/token/{address}` instead.
- **Data API** (`https://api.bubblemaps.io/v0/…`, header `X-ApiKey`): token metrics, top holders, clusters, bubble map data, address labels, relationship subgraphs, screenshots. Paid by monthly credits: **$170/month for 100,000 credits, $850/month for 750,000** (pro.bubblemaps.io, as of this note). `GET /v0/tokens/metrics/{chain}/{address}` costs **25 credits**; map and holders endpoints cost more and more again with optional parameters. 429 once credits are spent; 10k calls/minute IP rate limit.

Chains: eth, base, solana, tron, bsc, sonic, ton, avalanche, polygon, monad, hyperevm, arbitrum, robinhood, arc.

## Why it matters for the opening screen
The metrics endpoint returns the one thing the free GoPlus scan cannot: holders **clustered by on-chain relationships** with exchange, DEX and contract supply stripped out.
- `supply_stats.top_10_adjusted`: top-10 *entities* after clustering, CEX/DEX excluded.
- `supply_stats.bundles`: share held by the top-10 wallet clusters (bundled launches, sniper rings, insider groups).
- `supply_stats.fresh_wallets`: share held by wallets under 10 days old.
- `scores.bubblemaps_score` (0–100 decentralization), `gini_index`, `herfindahl_hirschman_index`, `nakamoto_coefficient`.

This maps directly onto the "liquidity holder analysis" the Valley Forge brief asked for, and onto the price-driver research finding that concentrated, coordinated supply precedes the distribution dumps that hit coins outside the top 100.

## Verdict: helpful, optional, paid
Integrated as an optional feed keyed by `BUBBLEMAPS_API_KEY`:
- Not set: nothing is called; legitimacy uses the GoPlus raw top-10 as before; the feed row reads "not configured".
- Set: one metrics call per newly scanned token, capped at 8 per refresh (24h diligence cache) ≈ 200 credits/refresh, well under the 100k plan even with hourly refreshes of new candidates.
- Legitimacy score: clustered top-10 replaces the raw figure; decentralization score ≥ 60 +5; bundles ≥ 25% −15 and red flag `BUNDLED_SUPPLY`; fresh wallets ≥ 20% −10 and red flag `FRESH_WALLET_SUPPLY`. Flags `CLUSTERED_TOP10`, `LOW_NAKAMOTO`, `CONCENTRATED_SCORE` are shown, not scored.
- The opening card's "Why this score" shows the holder map numbers and a link to the public map.

Start with the $170 plan only if the openings sleeve is actually being deployed; until then the free GoPlus figure plus the link-out is enough for manual checks.
