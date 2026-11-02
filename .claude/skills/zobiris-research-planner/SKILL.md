---
name: zobiris-research-planner
description: >-
  Plan a multi-source crypto, stock or macro research question before fetching
  anything: route it by complexity, break it into dependent steps (each with a
  data family, the step IDs it needs, and the decision it serves), then execute
  in order. Use for multi-part market questions ("is X a buy", "why did Y move",
  "check my orders", coin due diligence). Research only.
argument-hint: "[market question]"
---

# Zobiris research planner

Pattern adapted (in original wording, no code copied) from the planner/router
design in Fosowl/agenticSeek (GPL-3.0): a router decides how complex a request
is, a planner splits complex requests into steps that name which capability
runs each step and which earlier steps it depends on, and a final step
synthesizes. Here the "agents" are Zobiris data families and skills.

## 1. Route by complexity

| Class | Examples | Action |
|---|---|---|
| LOW | single price, one level, one definition | Answer directly from one source; no plan |
| HIGH | why something moved, buy/sell research, multi-coin or multi-source checks, scam checks, order reviews | Write the plan below first |

When unsure, treat as HIGH but keep the plan to ≤6 steps.

## 2. Data families (the "agents")

| Family | Use for | Notes |
|---|---|---|
| `kraken` | spot prices, candles, order book | Bash + public API; 720-candle limit |
| `chainlink` | independent oracle reference | `chainlink-data-feeds-skill`; scrape data.chain.link pages |
| `positioning` | leverage, liquidation clusters | Coinversa (Hyperliquid), CoinGlass page |
| `onchain` | wallets, holders, supply | Arkham, Etherscan; verify identity labels |
| `odds` | crowd probabilities | Polymarket gamma API |
| `flows` | ETF flows | SoSoValue page |
| `fundamentals` | stocks, filings, valuation | Yahoo (Alexandria), SEC, `docs/research/ai-equities-2027/` |
| `news` | catalysts | Firecrawl search; secondary until confirmed |
| `repo` | prior studies, ledger, KB | `docs/research/`, `docs/market-memory/`, CP_KB |
| `synthesis` | verdict | Research Standard 2.0 report format; optional `zobiris-creative-percent` |

## 3. Plan format

Write the plan (in the answer or scratch) before the first fetch:

```json
{"plan": [
  {"id": "1", "family": "kraken", "needs": [], "task": "CAP price, 24h range, order book ±2%", "decides": "where price sits vs levels"},
  {"id": "2", "family": "positioning", "needs": [], "task": "CoinGlass OI, liquidations, flows", "decides": "squeeze vs spot-led"},
  {"id": "3", "family": "repo", "needs": [], "task": "prior CAP calls and failure levels", "decides": "which rule applies"},
  {"id": "4", "family": "synthesis", "needs": ["1","2","3"], "task": "verdict, levels, rival, invalidation", "decides": "hold / exit / wait"}
]}
```

## 4. Rules

- One step, one family. Steps with empty `needs` run in parallel.
- Every step names the decision it serves; drop steps that cannot change the
  decision (value-of-information rule).
- Prefer free, reachable sources; Firecrawl credits are scarce, so ≤3
  Firecrawl calls unless the owner asks for depth.
- Never plan a step that places orders, signs, moves funds or uses leverage.
- If a step fails (blocked API, empty page), record it and continue; the
  synthesis states what is missing.
- The final step is always `synthesis`, and it uses only outputs from the
  steps it depends on, plus clearly labelled prior knowledge.
