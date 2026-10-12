# ZOBIRIS - Claude Code Operating Rules

## Mission and authority
ZOBIRIS is an evidence-led crypto research and decision-support application.
Preserve existing research-integrity, delayed-rotation, provenance, liquidity,
entry-price, statistical-validation, and execution authority boundaries.
Research findings can corroborate, contradict, demote, or flag; they cannot
independently authorize a trade, increase size, or bypass qualification gates.
Do not place orders, modify exchange credentials, change live risk limits, or
trigger production deployment without explicit approval for that action.
Never commit secrets, customer data, API keys, tokens, or raw credentials.
No leverage or margin features: the owner has ruled them out.

## Repository landmarks (verify before modifying)
- Root `Dockerfile` is the existing production build entry point.
- Root `railway.json` defines Railway deployment and `/api/health` checking.
- `.github/workflows/` contains CI; keep existing build gates in place.
- `deploy/` contains deployment variants (layered; `deploy/protection/overrides/src` wins). `docs/` contains research evidence.
- Some historical artifacts are archives: do not read them wholesale by default.
- Inspect current Git status and the relevant paths before assuming architecture.

## Frugal model routing
- Haiku 5.5: narrow extraction, metadata, deduplication, classification,
  connector payload triage, file discovery, and compact status summaries.
- Sonnet 5.5: routine coding, tests, refactoring, focused debugging,
  contradiction review, and most scoped multi-file tasks.
- Opus 5.5: optional escalation after Sonnet fails a verified difficult task.
- Fable 5.1: complex architecture, irreducible multi-system root cause,
  advanced strategy evaluation, and high-stakes synthesis only.
Use `/zobiris-frugal` for major development work and
`/zobiris-research-triage` for source-heavy investigations.
Do not switch the parent model just to run a cheap scan; use forked skills.

## Context, caching, and connector discipline
1. State acceptance criteria and the execution authority boundary.
2. Search symbols/diffs first. Read the smallest relevant files and log lines.
3. Run `python3 scripts/zobiris_budget.py --target PATH` for large reads;
   use `--changed-from origin/main` for pull-request scopes.
4. Default to one broad discovery provider. Cross-check through another
   provider only for a named evidence gap, conflict, or high-impact claim.
5. Prefer source-native structured tools: GitHub for code, Railway for runtime,
   a market-data source for numeric quotes, and primary documents for claims.
6. Record URL, source family, timestamps, claim, polarity, content hash or
   artifact reference, and uncertainty. Search snippets are discovery leads.
7. Return a short sourced evidence brief, not overlapping provider dumps.
8. Keep this file stable: no timestamps, transient IDs, or raw task logs.
9. Prompt-cache eligibility is not a confirmed cache hit; inspect real
   usage telemetry if available. Never pad prompts to meet a token threshold.

## Execution and verification
- Route routine changes and focused tests through Sonnet, escalating only the
  unresolved question with a compact Context Brief (target <= 6k tokens).
- Keep investigation and trading/execution permissions separate.
- Preserve fail-closed behavior on missing/contradictory evidence.
- Check changed files, run tests appropriate to the touched subsystem, and
  run the canonical `docker build --progress=plain -t zobiris-verify .`
  before treating meaningful production-path edits as verified.
- Do not remove existing CI quality gates to reduce compute or token cost.
- After each major change report: files, tests, risks, connector calls,
  estimated prompt tokens, and observed usage metrics if actually available.
- Estimate model token cost separately from connector fees and cloud/runtime.
