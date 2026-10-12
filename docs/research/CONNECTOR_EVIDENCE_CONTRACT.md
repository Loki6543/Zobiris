# ZOBIRIS connector evidence contract

## Objective
Minimize duplicated tool/model input without weakening ZOBIRIS Research
Integrity, provenance, or authority gates. This is a *context policy*, not a
replacement for the existing production Bright Data evidence pipeline.

## Source routing
- GitHub connector: exact repo diff, file, PR, or workflow. Do not ingest a
  repository archive when a file or patch resolves the issue.
- Railway connector: only for runtime config, deployment status, health/logs.
  Prefer relevant log windows and redact secrets before model exposure.
- Market-data connector: compact numeric fields + observation timestamp,
  currency, market, source, and aggregation period.
- Parallel Search / Tavily: pick one for initial open-web discovery. Query a
  second ONLY to test contradiction, missing coverage, or a key uncertainty.
- Bright Data: search -> rank/dedup -> selectively scrape full sources ->
  hash/store -> atomic claims -> corroborate/contradict -> Research Integrity.
- Stocktwits and social: sentiment leads, NOT primary verification.
- Backtest tools: research/shadow only; keep data splits and provenance intact.

## Evidence record (schema example; no facts implied)
```json
{
  "claim_id": "sha256-of-normalized-claim-and-source-id",
  "claim_text": "What the source actually supports",
  "question_id": "stable-investigation-identifier",
  "source_url": "https://primary.example/source",
  "source_family": "primary.example",
  "publisher": "Named issuer, exchange, regulator, or analyst",
  "published_at": null,
  "retrieved_at": "UTC timestamp if retrieval actually occurred",
  "evidence_kind": "primary|secondary|market_data|social|snippet",
  "polarity": "support|contradict|neutral|unknown",
  "content_sha256": null,
  "artifact_pointer": null,
  "uncertainties": ["specific unresolved caveat"],
  "authority": "research_only"
}
```

## Freshness policy (defaults, not universal evidence truth)
- Market prices, order-book volume, spreads: request-current, timestamped.
- Exchange listing/rules/status: refresh before consequential use.
- News/event claims: retrieve and cite event date and publication date.
- Tokenomics: primary documents + check revisions, vesting and governance.
- Long-lived architecture/doc facts: reuse while the underlying version/hash
  is unchanged. Expire when source changes or a conflicting primary fact emerges.

## No automatic promotion
A fresh source does not establish an entry price, size, investment merit, or
exchange action. Keep research-only data in research/shadow until the existing
ZOBIRIS validation and execution components explicitly accept it.

## Telemetry ledger to maintain per task
`task_id, timestamp, model, input_tokens_uncached, cache_write_tokens,
cache_read_tokens, output_tokens, tool_calls_by_provider,
provider_bill_if_known, cloud_minutes_if_known, tests_result, changed_paths`
Do not compute "money saved" without a documented comparison baseline.
