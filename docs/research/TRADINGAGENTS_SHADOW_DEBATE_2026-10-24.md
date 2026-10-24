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


## Optional zero-upfront-cost inference connectors (on demand)

These are **not turned on until credentials are configured and the operator opts in**.
The feature is a qualitative ONE-call/FIVE-role commentary on recorded (up to
three-hour-old) swarm evidence, with a fixed model allowlist and zero decision
authority. Never give the model Kraken secrets, private balances, or personal
data. No automated schedule and no paid-model fallbacks are installed.

Server-side environment variables (set as Railway service secrets, not in Git):

```bash
ZOBIRIS_FREE_RESEARCH_ENABLED=1
ZOBIRIS_FREE_RESEARCH_PROVIDER=gemini   # gemini | groq | openrouter | ollama | auto
GEMINI_API_KEY=...                      # Google AI Studio, free-tier account
# OR GROQ_API_KEY=...                   # Groq free plan
# OR OPENROUTER_API_KEY=...             # OpenRouter free plan
# For Ollama on the SAME server (local dev only):
# ZOBIRIS_FREE_RESEARCH_PROVIDER=ollama
# ZOBIRIS_FREE_RESEARCH_ALLOW_LOCAL=1
```

Model IDs are intentionally **fixed**, not operator/user configurable:
- Google Gemini: `gemini-3.1-flash-lite` via Google OpenAI-compatible API.
- Groq: `openai/gpt-oss-20b` via Groq API.
- OpenRouter: `openrouter/free`, specifically the free router (never `openrouter/auto`).
- Ollama: `qwen3:4b` at `127.0.0.1:11434`; requires your own locally
  running Ollama server and downloaded model, **not installed on Railway**.

Once configured, send an authorized request with the *existing Zobiris operator
Bearer token*, without putting keys in the POST body:

```http
GET /api/research/agent-debate/free-providers
Authorization: Bearer <OPERATOR_TOKEN>

POST /api/research/agent-debate/run
Authorization: Bearer <OPERATOR_TOKEN>
Content-Type: application/json

{"symbol":"SOL"}
```

The reply includes a baseline deterministic debate plus qualitative critiques
from one free-model request. It does **not** add five separate autonomous LLMs,
perform fresh web research, or change production scores. All five roles must
return structured content. The server bounds input/output lengths, enforces a
15-second timeout, 8 requests/hour/IP, one in-flight request per process,
and a best-effort cap of 30 vendor calls/day/process. **The per-process cap is
not a billing limit across replicas or external client usage.** Failed
vendor requests count against that local quota, so intentional one-shot calls
are favored over retries.

Free plans differ: OpenRouter free accounts typically have 50 requests/day;
Groq has model-specific organization-level quotas; Gemini free accounts have
model- and project-specific rate limits and may allow input to improve their
models. Verify current account tier before enabling. Vendor-side paid billing
is possible if an API key belongs to a billing-enabled tier even when using
models that also have a free plan. To stop all external inference at once, set
`ZOBIRIS_FREE_RESEARCH_ENABLED=0`.

External references:
- https://ai.google.dev/gemini-api/docs/openai
- https://ai.google.dev/gemini-api/docs/pricing
- https://console.groq.com/docs/rate-limits
- https://openrouter.ai/pricing
- https://openrouter.ai/collections/free-models
