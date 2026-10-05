# Bright Data MCP research provider

Zobiris can use Bright Data's hosted MCP server as an additional **research-only** web discovery provider.

## Authority boundary

This integration does not change Zobiris trading authority.

- Provider ID: `brightdata-mcp-search`
- Evidence mode: `LIVE`
- Initial evidence status: `UNVERIFIED`
- Material flag: `false`
- Research authority remains `RESEARCH_ONLY_DEMOTE_OR_FLAG`
- `canPromote: false`
- `mayAffectSizing: false`
- `mayWriteExchange: false`

Bright Data output can add evidence or expose contrary evidence. It cannot authorize an entry, change position sizing, submit an order, or write to Kraken.

## Railway configuration

Set these variables on the Zobiris service:

```text
BRIGHTDATA_API_TOKEN=<Bright Data API token>
BRIGHTDATA_GEO_LOCATION=us
ZOBIRIS_ALLOW_LIVE_PROVIDERS=1
```

`BRIGHTDATA_GEO_LOCATION` is optional and must be a two-letter country code.

Do not commit the API token. Zobiris sends it only to the fixed hosted MCP endpoint:

```text
https://mcp.brightdata.com/mcp
```

The token is supplied as the hosted endpoint's `token` query parameter, per Bright Data's remote MCP setup. It is not written into research evidence or provider state.

## Initial capability

The first production adapter intentionally uses only Bright Data's `search_engine_batch` tool.

For each full-watchlist research batch, Zobiris sends at most five asset-specific Google searches, matching Bright Data's current batch limit. Up to three organic results per asset are admitted only when:

1. the result has a public HTTPS source URL;
2. the title or description contains the canonical project name;
3. a non-empty claim can be extracted.

This protects against common-ticker collisions such as `ONE` appearing in unrelated prose.

Results are stored with the original page URL as provenance. Search snippets do not become primary-confirmed evidence merely because Bright Data returned them.

## Protocol behavior

The client first attempts the current stateless Streamable HTTP MCP tool-call form and falls back to the older initialize/session flow only for protocol-compatibility failures.

Provider/tool errors do not automatically trigger a second legacy call. This avoids duplicate requests and unnecessary provider charges.

Outbound behavior is fail-closed:

- fixed Bright Data MCP origin and path;
- redirects rejected;
- 1 MiB response ceiling;
- 10-12 second caller timeouts inherited from the research runtime;
- malformed MCP or search responses rejected;
- provider absence is reported as `NOT_CONFIGURED`;
- provider failures degrade research coverage instead of fabricating evidence.

## Deliberately deferred

The following Bright Data capabilities are not yet granted authority in this adapter:

- browser automation;
- direct social-network scraping;
- arbitrary URL scraping;
- dataset discovery;
- automatic primary verification.

Those can be added later behind separate adapters and provenance rules. They should not be silently folded into the first integration because their cost, rate limits, freshness semantics, and source-verification requirements differ from search discovery.
