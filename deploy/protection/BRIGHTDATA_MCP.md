# Bright Data MCP evidence investigator

ZOBIRIS uses Bright Data's hosted MCP server as a **research-only two-stage evidence investigator**:

```text
Bright Data search discovery
  -> candidate scoring / source-family deduplication
  -> selected full-source scrape
  -> immutable SHA-256 raw evidence artifact
  -> atomic claim extraction
  -> corroboration / contradiction review
  -> Research Integrity
```

Search snippets are discovery leads. They are not accepted as primary-confirmed evidence and cannot promote a trade recommendation.

## Authority boundary

This integration does not change ZOBIRIS trading authority.

- Provider ID: `brightdata-mcp-investigator`
- Evidence mode: `LIVE`
- Initial verification: `UNVERIFIED`
- Research authority remains `RESEARCH_ONLY_DEMOTE_OR_FLAG`
- `canPromote: false`
- `mayAffectSizing: false`
- `mayWriteExchange: false`

Full-source evidence can strengthen research coverage or expose contrary evidence. A contradiction may demote a thesis to `THESIS_RISK`; scraped evidence alone cannot authorize an entry, increase position size, submit an order, or write to Kraken.

## Railway configuration

Set these variables on the ZOBIRIS service:

```text
BRIGHTDATA_API_TOKEN=<Bright Data API token>
BRIGHTDATA_GEO_LOCATION=us
BRIGHTDATA_SCRAPE_MAX_PER_ASSET=2
ZOBIRIS_ALLOW_LIVE_PROVIDERS=1
```

`BRIGHTDATA_GEO_LOCATION` is optional and must be a two-letter country code.

`BRIGHTDATA_SCRAPE_MAX_PER_ASSET` defaults to 2 and is clamped to 1-3. This is deliberately bounded to control cost, latency, and evidence-store growth.

Do not commit the API token. ZOBIRIS sends it only to the fixed hosted MCP endpoint:

```text
https://mcp.brightdata.com/mcp
```

The token is supplied as the hosted endpoint's `token` query parameter. It is never written to evidence, artifacts, logs, or provider state.

## Stage 1 — discovery and escalation

The adapter sends at most five canonical-asset queries per research tick using `search_engine_batch`.

Candidate URLs must:

1. use public HTTPS;
2. match the canonical project name in the title or description;
3. survive duplicate-URL filtering.

Candidates are scored from:

- source authority;
- primary-source likelihood;
- high-impact trigger language;
- snippet specificity.

High-impact triggers include exploits, listings/delistings, token unlocks or supply changes, regulation, ecosystem partnerships, network upgrades, treasury flows, and governance actions.

Selection prefers independent source families instead of spending scrape calls on multiple URLs from the same publisher.

## Stage 2 — full-source acquisition

Selected URLs are fetched with Bright Data `scrape_as_markdown`.

The current Bright Data Rapid/default MCP toolset includes search and full-page Markdown scraping, so this workflow does not require enabling the broad Pro tool surface.

A full-source result is rejected when it is empty or exceeds the bounded 160 KiB evidence-artifact ceiling.

ZOBIRIS then performs deterministic atomic-claim extraction from the acquired Markdown. Claims retain:

- source URL;
- source family;
- source-authority score;
- primary-source likelihood;
- claim topic;
- polarity;
- extraction method;
- artifact SHA-256;
- artifact byte length.

Publication time is not invented. When a reliable publication timestamp is unavailable, `publishedAt` remains `null`.

## Immutable raw evidence

The exact Markdown returned by Bright Data is normalized only for CRLF/LF consistency and hashed with SHA-256.

Raw artifacts are stored in the dedicated SQLite table:

```text
research_evidence_artifacts
```

The normal evidence row stores only the artifact reference. Repeated observations of the same claim do not manufacture another confirmation merely because the page content hash changed.

Artifact ingestion verifies:

- public source URL;
- retrieval timestamp;
- byte length;
- SHA-256;
- source URL / evidence URL consistency;
- retrieval-time consistency.

Hash mismatch or provenance mismatch fails closed.

## Corroboration and contradiction

Research reassessment groups evidence by claim topic and counts independent source families.

Current integrity labels are:

- `VERIFIED`
- `STRONGLY_SUPPORTED`
- `CONTESTED`
- `SINGLE_SOURCE`
- `STALE`
- `UNVERIFIED`

A claim is not treated as corroborated merely because many syndicated pages repeat the same publisher family.

Conflicting positive/negative evidence on the same topic, or an explicit `CONFLICTING` verification state, increases contradiction severity. Contested evidence is allowed to demote the research state to `THESIS_RISK`, but never to create buy authority.

## Protocol and failure behavior

The client first attempts the current stateless Streamable HTTP MCP tool-call form and falls back to the older initialize/session flow only for protocol-compatibility failures.

Provider/tool errors do not automatically trigger a second legacy call. This avoids duplicate requests and unnecessary provider charges.

Outbound behavior remains fail-closed:

- fixed Bright Data MCP origin and path;
- redirects rejected;
- 1 MiB MCP response ceiling;
- caller timeouts inherited from the research runtime;
- malformed MCP/search responses rejected;
- empty or oversized full-source artifacts rejected;
- provider absence reported as `NOT_CONFIGURED`;
- provider failures reduce research coverage instead of fabricating evidence.

## Still deliberately excluded

The following do **not** gain authority from this upgrade:

- browser automation;
- arbitrary interaction with target sites;
- automatic trade execution;
- automatic primary confirmation based only on publisher appearance;
- automatic position sizing changes;
- exchange writes.

The two-stage investigator improves evidence quality. It does not bypass ZOBIRIS's existing Research Integrity, delayed-rotation, entry-price, liquidity, or execution gates.
