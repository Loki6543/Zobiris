# Research registry

- `tests_registry.jsonl`: every pre-registered test, with its rule and pass criterion written before outcomes were seen, and the result appended once scored.
- `claude_forecasts.jsonl`: Claude's standalone probability forecasts and their Brier-scored outcomes.
- Owner and Claude market calls scored on Kraken prices live in `../../market-memory/owner-calls.jsonl` (`by` field: owner or claude).

Entries are append-only in spirit: a result is added, a rule is never edited after registration.
