---
name: zobiris-frugal
description: >-
  Run a scoped ZOBIRIS code investigation or implementation
  in an isolated Sonnet 5.5 context, returning only a compact evidence-backed report to the main session.
argument-hint: "[development task or subsystem]"
disable-model-invocation: true
context: fork
agent: general-purpose
model: claude-sonnet-5-5
effort: medium
background: false
---

# ZOBIRIS frugal implementation fork

Requested task: $ARGUMENTS

1. Write acceptance criteria and state which trading/execution authority must
   not change. Check the active branch, git status, and relevant paths.
2. Find symbols/changed files before reading full modules or large logs.
   Do not recursively dump `deploy/`, archives, dependency trees, or `docs/`.
3. Run `python3 scripts/zobiris_budget.py --target <relevant-path>` or
   `python3 scripts/zobiris_budget.py --changed-from origin/main`.
   The 80k default is a project cost-policy threshold, not model capacity.
4. For routine changes, implement here, run focused tests and the canonical
   Docker build where applicable. Respect all existing security/integrity gates.
5. For genuinely hard root causes or architecture, do not solve a huge problem
   twice: return a concise, cited Context Brief so the parent can escalate.
6. Do not call every connector. GitHub for code; Railway only for runtime;
   structured pricing/data for numeric facts; one discovery search provider
   initially; another source only for contradiction or an identified gap.
7. Keep raw tool payloads, long traces, and archives out of the parent reply.
   Never disclose credentials. Never make live trade/deployment changes without
   explicit approval for the specific action.
8. Finish with the following sections, targeting <= 6,000 tokens total:

## Context Brief
Objective, scoped files/symbols, current behavior, exact errors, evidence
references, invariant authority rules, and remaining unknowns.

## Work Completed
Modified files, focused tests, build result, and follow-up risks. Say "none"
if nothing was changed. Never claim an unrun check passed.

## Fable Escalation
The narrow unresolved decision and at most three options, or "not needed."

## Credit/Context Statement
Estimated candidate tokens, route used, whether real cache-hit telemetry
exists, and connector calls actually made. Do not invent a savings percentage.
