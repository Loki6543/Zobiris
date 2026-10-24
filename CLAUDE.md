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

## Opus 5.5 credit policy
Use Opus 5.5. Recommend Medium for normal implementation.
Use Low for narrow, reviewable extraction or mechanical edits.
Use High for hard diagnosis, contradictions and consequential logic.
Use Extra high (xhigh) for a specific unresolved complex decision.
The user/runtime must apply the effort setting; do not claim
a prompt or this file changed it. Return to Medium afterward.

Before work, identify the deliverable, likely files/sources,
acceptance checks and remaining uncertainty. Read targeted
files and diffs before expanding scope. Keep exact evidence.

Use one discovery provider first. Add another for a named gap.
Deduplicate source families. Separate snippets from confirmation.
Keep raw artifacts retrievable; return decision-relevant evidence.
Do not spawn agents or switch models merely to save credits.

After two attempts without progress, change the hypothesis,
obtain missing evidence, or recommend raising effort.
Avoid repeating an unchanged failing approach.

Preserve research/shadow authority and fail-closed rules.
Never weaken provenance, sizing, promotion or exchange gates.
Run checks appropriate to the change and required project gates.
Do not skip validation to meet a token target.

Finish with changed files, checks and results, unresolved risks,
and any recommendation to restore Medium.
Report measured usage only when available; label estimates.

Escalation handoff (keep it short): objective and acceptance test;
current/requested effort; files, symbols or sources; exact error or
conflicting evidence; hypotheses tested and outcomes; constraints and
authority boundaries; the one decision still needed; next verification step.

## Learning loop
- Keep facts, hypotheses and predictions apart; label each.
- Record a forecast with its probability and scoring test before
  the outcome; score it afterwards (Brier) and never edit it.
- Record errors with the corrected rule; consult them on similar work.
- Promote a rule, weight or model change only after a pre-registered
  test on held-out data; keep the prior version for instant rollback.
- Research and self-generated lessons stay shadow evidence; they never
  authorize trades or bypass promotion gates.

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
- Run routine changes and focused tests at Medium effort; escalate only the
  unresolved question with the compact handoff above.
- Keep investigation and trading/execution permissions separate.
- Preserve fail-closed behavior on missing/contradictory evidence.
- Check changed files, run tests appropriate to the touched subsystem, and
  run the canonical `docker build --progress=plain -t zobiris-verify .`
  before treating meaningful production-path edits as verified.
- Do not remove existing CI quality gates to reduce compute or token cost.
- After each major change report: files, tests, risks, connector calls,
  estimated prompt tokens, and observed usage metrics if actually available.
- Estimate model token cost separately from connector fees and cloud/runtime.

## Working with the owner
- Keep replies short: one word when that answers it, usually a few sentences, two paragraphs at most. Offer to elaborate instead of front-loading detail.
- Optimistic temperament. Report failed tests plainly, then point to what they enable next; no gloom.
- When the owner asks out of curiosity ("I'm curious", "do you know"), engage with the idea and its spirit before any correction.
- Weigh the owner's opinions by the track record in this repo, its research ledgers and our history.
- The owner's partner is called Firo. Use the owner's name, Kevin, only rarely, to land a point that must not be missed.
- Finish each major piece of work with a proportionate error check or review of what was made; don't overdo it.
- Documents for this project don't need mobile-specific layouts, but no page or table may be cut off.
