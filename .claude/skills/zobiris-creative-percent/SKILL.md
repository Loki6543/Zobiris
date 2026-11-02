---
name: zobiris-creative-percent
description: >-
  Creative Percent (CP) lateral-exploration layer for Zobiris crypto and market
  analysis. Runs four bounded lateral lenses (Watcher, Librarian, Oracle,
  Dreamer) alongside the normal investigation, enforces dissent before
  consensus, surfaces "10% you missed" hidden patterns as a separate callout,
  retains only gate-passing patterns, and logs telemetry. Use for ambiguous or
  high-stakes crypto/market questions (anomalies, divergences, shocks, coin
  due diligence, trade-plan reviews). Research only; never authorizes trades.
argument-hint: "[question or situation] [cp=0.10]"
---

# Zobiris Creative Percent (CP)

Adapted from the "Mavis Creative Percent Master Document" for a single-agent
Claude Code workflow. The baseline Zobiris investigation loop (Research Standard
2.0, `docs/research/ZOBIRIS_RESEARCH_STANDARD_2.0_2026-11-01.md`) stays in
charge: expectation → departure → rivals → evidence → frozen call → resolution.
CP is an **optional, bounded side track**. It may add rivals, contradictions and
hidden-pattern callouts; it may never override evidence, risk limits, or the
no-orders / no-leverage rules in CLAUDE.md.

## 0. When and how much

- `cp` (Creative Percent) = share of effort spent on lateral work. Default
  `0.10`; allowed `0.05`–`0.25`. `0` disables CP entirely.
- Use CP when the question is ambiguous, the stakes are high, or the obvious
  explanation fits too neatly. Skip it for plain price lookups and scheduled
  checks (the daily drop-monitor routine runs CP-free unless asked).
- Budget: at `cp=0.10`, CP gets at most one extra data fetch and ~10% of the
  answer length. Lateral output never displaces the main answer.

## 1. Four lateral lenses (run after the main evidence pass, before the call)

Each lens writes one or more triplets: `{observation, novelty 0-1, confidence 0-1}`.

| Lens | Job in crypto/market work | Typical checks |
|---|---|---|
| **Watcher** | Find signals that contradict the main assumption | Venue/data artifacts, stale prints vs Chainlink feed, on-chain flows vs headline, ETF flow vs price |
| **Librarian** | Link to prior Zobiris learnings | `docs/research/`, `docs/market-memory/`, call ledger, `CP_KB.md` patterns; prior failed rules (flush-buying, rotation score) |
| **Oracle** | First-principles decomposition | Who is forced to buy/sell? Units (OI quantity vs dollars), supply sequence, fees, base rates |
| **Dreamer** | Cross-domain analogies and the "10% you missed" | Lonely citations, analogies (Intel 2000, Ponzi yield, bank runs), unexamined assumptions, time-decayed signals |

Weighting ("decay and reinforce"): a triplet's weight = novelty × confidence,
halved if it relies on a single secondary source, doubled (cap 1.0) if a primary
source corroborates it. Only triplets with weight ≥ 0.35 enter the merge.
"Escalation" (promotion to a headline point) is allowed at most once per
answer, and only for a triplet with confidence ≥ 0.6 backed by data fetched in
this turn.

## 2. Dissent enforcement (before writing the verdict)

1. Each lens restates the problem in one line. If all four restatements are
   essentially identical, note `restate_divergence: low`.
2. Each lens states a direction: supports / contradicts / orthogonal to the
   main thesis.
3. If agreement ≥ `AGREEMENT_TRIGGER` (default 0.75): write a **steelman of the
   strongest minority view** (2–3 sentences) in the answer.
4. If all four agree **and** a material assumption is still untested, run one
   bounded challenge: reframe once (invert the thesis, change the horizon, or
   take the counterparty's view) and name the evidence that would decide it.
   Never more than one challenge; supported consensus is acceptable. No
   dissent quota.
5. Dissent changes the stated uncertainty or adds a rival; it does not flip a
   verdict without evidence.

## 3. Hidden-pattern callout

If a weighted Dreamer/Watcher triplet survives, present it **separately** from
the main synthesis:

> **10% you might have missed:** <one sentence> — *confidence 0.xx; evidence: observed/inferred/reported*

Zero callouts is a valid outcome. Never invent one to meet a quota.

## 4. Knowledge retention (`CP_KB.md`, Five-Gate review)

Append a pattern to `.claude/skills/zobiris-creative-percent/CP_KB.md` only if
all five gates pass, and record the gate result:

1. **Value**: seen in ≥2 runs across ≥2 assets or domains, with at least one
   outcome that resolved in its favour.
2. **Alignment**: does not contradict a tested Zobiris result (if it does, it is
   a research question, not a pattern).
3. **Redundancy**: not a restatement of an existing entry.
4. **Freshness**: still supported by data from the last 30 days.
5. **Placement**: filed under the right section (Flows & supply / Derivatives /
   Data artifacts / Macro & equities / Behaviour & narratives).

Candidates that fail stay in telemetry only. Rejection should be the norm.

## 5. Telemetry (every CP-enabled answer)

Append one JSON line with `scripts/cp_log.py` (see below) and include the
human-readable line at the end of the answer:

```text
[CP-0.10] lateral: 4/4 lenses · 1 hidden pattern · 1/4 dissenting · rerun: no · 0 new KB entries
```

Fields: `ts, task, cp, lenses_active, triplets, hidden_patterns, dissenting,
restate_divergence, rerun, kb_candidates, kb_added, failed`.

```sh
python3 .claude/skills/zobiris-creative-percent/scripts/cp_log.py \
  --task "XMR range check" --cp 0.10 --lenses 4 --triplets 6 --hidden 1 \
  --dissenting 1 --divergence medium --rerun 0 --kb-candidates 1 --kb-added 0
```

Log file: `docs/research/registry/cp_telemetry.jsonl`.

## 6. Promotion and dial-back (corrected from the source document)

CP stays experimental until **30 CP-enabled analyses across ≥3 asset types**
are logged and their forecasts resolved. Promote to default only if, versus
comparable CP-free calls:

- the **paired Brier score is lower** (better), or the user's follow-up
  corrections / re-asks are **less** frequent (the source said "higher
  re-route rate", which would reward worse answers);
- hidden-pattern callouts that later proved useful ≥ 1 in 5 callouts (not "one
  per run", which rewards fabrication);
- retained patterns are not later contradicted by tested results and prove
  useful when retrieved (no fixed rejection-rate target).

If any of these regress, set default `cp` back to `0.05` and keep testing.

## 7. Failure handling

If the lateral pass fails (tool error, no data, contradictory garbage): keep
the main answer, log `failed: true`, write nothing to `CP_KB.md`, and exclude
the run from promotion statistics. CP failure never blocks an answer.

## 8. Safeguards

- Grounded first: every lens must cite data from this turn or a repo file;
  speculation is labelled *inferred*.
- Bounded: one extra fetch at most per 0.10 CP; Firecrawl credits are scarce.
- Easy off: `cp=0` or "no CP".
- Authority: CP output can flag, demote or add a rival; it cannot authorize a
  trade, raise size, or bypass a qualification gate.

## Not implemented from the source (by design)

- Background threads polling `subconscious.json` every 5 s: Claude Code has no
  persistent daemon per answer; the four lenses run sequentially inside the
  turn instead, and telemetry replaces the subconscious file.
- Mavis 9-state DISPATCH integration and Leader/Worker/Verifier agents: Zobiris
  uses the single-agent investigation loop; spawn subagents only if the owner
  asks.

Source design inspirations named in the original: `amor71/thinking-agents`,
`0xNyk/council-of-high-intelligence`, `191341025/Self-Evolving-Skill`
(not vendored; not dependencies).
