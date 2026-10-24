# Zobiris five-role research debate (TradingAgents-inspired)

Status: **Experimental / read-only / shadow only** (2026-10-24).
Source inspiration: https://github.com/TauricResearch/TradingAgents (Apache-2.0).
This implementation borrows the role/debate architecture, not upstream source code or a promise of profitable signals.

## Implemented now

- A deterministic deliberation over the **recorded** Zobiris v1 swarm, so the
  application does not need a second trading engine or new market provider.
- Five researcher roles: BTC regime, altcoin recovery, macro/news, contrarian
  critic, liquidity/portfolio risk. Bullish and bearish evidence is shown
  side-by-side; role disagreements and coverage reduce confidence.
- Contradictory or stale market/portfolio evidence fails closed. News/macro
  stays **UNKNOWN** without verified timestamped inputs. A standalone macro
  evidence contract is provided; it is not wired to unverified RSS snippets.
- Read-only, **operator-authenticated** endpoints:
  - `GET /api/research/agent-debate` – latest stored episode per symbol,
    including as-of age/freshness; optional `?symbol=SOL`.
  - `GET /api/research/agent-debate/calibration` – paired retrospective
    reconstruction using existing stored episodes/outcomes, with optional
    `?horizon=1d&symbol=SOL&roundTripCostBps=25`.
- Five roles are rule-driven **not live LLM instances** in this first version.
  Later model-assisted analysts may supply **bounded, time-stamped,
  independently verified evidence**, subject to identical integrity rules.

## Validation and interpretation

The calibration compares selected long-only observations from the original
swarm score versus the new debate score using the **same recorded forward
return**; selection threshold is 60/100. It deducts a configurable round-trip
cost from the observed gross return and reports win rate/mean return on
selected rows. The underlying ledger is recorded every ~2h; outcomes have
30m/2h/8h/12h/1d/3d/7d windows with missing outcomes excluded. Old swarm
episodes are replayed **retrospectively**; therefore this result is **not** an
independent forward test of the new debate and must not be interpreted as
execution P&L, causal alpha, or statistical proof.

Limitations: up to 500 recent ledger entries for each HTTP query; missing
symbols or stale episodes may be absent. No portfolio simulator, point-in-time
macroeconomic history, intrabar fills, transaction-cost breakdown, confidence
intervals, or rank-quality measurement here.

## Operating boundary

- Do not edit Strategy 2.1 score, eligibility, watchlist rank, order sizing,
  Kraken private endpoints, live orders, or policy registry.
- Authenticated read endpoints must not write to the ledger or make provider
  requests. This first version only reads persisted swarm data.
- No production deployment or automatic merge as part of the research PR.
- Promotion requires a new **prospective** version-stamped prediction log,
  ample nonoverlapping outcomes by BTC regime, fee/slippage-aware replay,
  false-positive review, and observed incremental performance against the
  exact same baseline and timestamps.

Files:
- `deploy/protection/overrides/src/server/researchDebate.ts`
- `deploy/protection/overrides/src/server/server.ts` (two read-only routes)
- `deploy/protection/overrides/src/tests/research-debate.test.ts`
