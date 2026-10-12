---
name: zobiris-research-triage
description: >-
  De-duplicate and qualify connector-heavy crypto, code, or market research
  using an isolated low-cost Haiku 5.5 agent;
  return only a provenance-preserving evidence brief.
argument-hint: "[research question and optional date window]"
disable-model-invocation: true
context: fork
agent: general-purpose
model: claude-haiku-5-5
effort: low
background: false
---

# ZOBIRIS low-cost research triage

Research question: $ARGUMENTS

1. State the three (or fewer) claims whose resolution would actually change
   the ZOBIRIS development/strategy decision. Do not start with an unbounded
   "research everything" search.
2. Choose the matching source class: GitHub for code, Railway for live state,
   structured market data for prices/volumes, exchange docs for listing/rules,
   official issuer primary material for tokenomics, or one broad search provider
   for discovery. Use a second search provider only for a clear evidence gap.
3. Set an explicit cap: at most 5 discovery queries and 8 full source fetches
   per invocation unless the caller authorizes more. Bounds are POLICY, not
   implied plugin limits. Deduplicate canonical URLs and publisher families.
4. Preserve per-claim source URL, author/publisher, publication and retrieval
   time where known, claim polarity, direct-vs-indirect status, SHA-256 artifact
   pointer when present, and missing/counterevidence. Never claim a hash was
   created unless an actual artifact was hashed.
5. Do not equate social consensus or snippets with official confirmation.
   Expired quotes require a refresh from the source of record.
6. Return only:
   - Research question and known constraints
   - Evidence matrix: <= 8 rows, each with source, date, claim, confidence limits
   - What is confirmed / contradicted / unresolved
   - Next source or test (only if consequential)
   - Connector counts and raw-reference pointers
7. No trading authority or execution instructions derive from this skill.
   Treat missing important evidence as UNKNOWN or WATCH per ZOBIRIS policy.
8. For technical synthesis requiring sustained reasoning, recommend the
   Sonnet `/zobiris-frugal` fork; only escalate a compact brief to Fable when
   cheaper models cannot reliably resolve the remaining question.
