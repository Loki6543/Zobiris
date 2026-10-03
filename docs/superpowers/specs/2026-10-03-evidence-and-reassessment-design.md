# Zobiris live evidence and reassessment — first release

Status: concrete design for user review; not implemented or deployed.
Prepared October 2, 2026, Phoenix (October 3 UTC).

## Goal

Turn available research into timely, specific coin assessments: what changed, why it matters to the token, which evidence contradicts it, whether a fresh entry review is warranted, and what happens after the decision. This is the foundation for the user's requested comparison of profitable ROI and best entry prices. It does not claim to predict the highest-return coin.

Keep the existing simple portfolio/watchlist/Market Today experience. Detailed research stays expandable. Existing read-only Kraken integration, capital limits and order geometry remain intact.

## Verified starting point

- Railway health reported working Kraken account synchronization using WebSocket plus polling.
- The latest research session reported social, derivatives, catalysts/macro and on-chain acquisition as not configured.
- `/api/intelligence/attention-ignition` returns `v0.7.1-research-fixture`, explicitly snapshot/shadow, rather than live social observations.
- Attention integrity reported a partial collection, zero providers in its coverage summary and 7,800 due outcomes. This is a backlog count, not proof of 7,800 independent missing investment decisions.
- The pilot scorecard contained 58 nonqualifying episodes with expired 1H/4H observations and no resolved observations at those horizons. Actual fills and missed-fill regret were null.
- Current delayed-rotation ranking uses returns and turnover. Coin-specific support/volatility/cost-aware entry pricing is not the active baseline.
- The live QNT assessment lists incomplete critical tokenomics and incomplete 14-day Kraken history. Its narrative signals and forecasts were empty. This is current saved state, not a reconstruction of the rejection before QNT's rally.

## Access probe

CoinMarketCap's chat connector returned five news records for QNT. Some are broad market recaps; returned coverage cannot be assumed coin-specific merely because a coin ID was requested. Records included conflicting or unsupported implications for QNT demand; do not promote those statements as verified facts.

The first Parallel primary-source verification query returned an empty result set. That means verification was unsuccessful, not that the announcements are false.

No relevant provider credential environment-variable names were present in the local execution process. This does not determine what is configured in Railway. Railway CLI was not found. Existing deployment access must be inspected without printing secrets. Chat connector access cannot be silently copied into server API access.

## Selected approach and alternatives

Selected: extend the existing evidence pipeline, persist new observations, and add a small reassessment view. Separate observation collection from decision refresh and from execution authority.

A news panel alone would display stories without influencing research priority. A wholesale model/recommendation rewrite would mix collection problems with unvalidated scoring. The selected approach makes evidence available and measures outcomes before promoting stronger entry/ROI models.

## Evidence contract

Each record contains canonical asset/provider ID, provider, source URL, source publication time, retrieval time, evidence kind, source lineage, text summary, exact claim, relevance rationale, verification state, and content hash. Times are never substituted for each other. Missing publication dates remain unknown and cannot support a claim that information preceded a price move.

Kinds: NEWS, OFFICIAL_CATALYST, SOCIAL_ACTIVITY, SUPPLY_EVENT, CONTRADICTING_EVIDENCE. Verification: UNVERIFIED, PRIMARY_CONFIRMED, CONFLICTING, RETRACTED. Availability: AVAILABLE, NOT_CONFIGURED, UNAVAILABLE, STALE, PARTIAL. These are separate concepts.

Deduplicate syndicated stories by normalized source/claim; do not count copied headlines as independent confirmations. Resolve ambiguous symbols using canonical IDs. Preserve both supporting and opposing claims. A project partnership does not establish token demand without a documented economic link.

Raw external content is data, never an instruction. Server fetches require an allowlisted provider endpoint, request timeout, bounded payload size and redirect handling that excludes private addresses. Secrets stay server-side and are removed from diagnostics.

## News and social acquisition

Use authorized server APIs only after verifying capability, permissions, response contract and rate limits. An unavailable paid feed remains visibly unavailable; no subscription purchase is included.

Start news collection with held assets and the entire active watchlist, using provider-supported batches and a bounded round-robin queue. Show per-asset coverage and last successful observation; do not call a partial sweep complete. Cache/deduplicate evidence and retry with backoff. Provider failure must not remove already stored records or show stale material as current.

For social, record available mention counts, unique participants, engagement and source coverage separately from sentiment. Calculate acceleration only with sufficient historical observations from the same source and comparable windows. Do not substitute price/volume for social popularity. No composite vendor score acquires a profitability interpretation.

If continuous server access is unavailable, authenticated research import may deliver explicitly dated connector-assisted evidence. Label it imported research and expose its age; never label it a continuously monitored feed.

## Reassessment behavior

New material verified evidence, a changed lifecycle risk, or supported unusual social activity queues a coin for reassessment. A new story alone is not a buy signal. Reassessment compares the previous thesis and evidence with the new record and returns what changed, why it matters, counterevidence, outstanding checks and next review condition.

Persist queue state and the previous assessment. Deduplicate repeated triggers. Negative catalysts receive the same treatment as positive catalysts. Already rejected coins remain monitored. Reassessment status is distinct from eligibility; no bypass of execution, account or risk gates.

First-release output: REVIEW_REQUIRED, NO_MATERIAL_CHANGE, EVIDENCE_INCOMPLETE, or THESIS_RISK. No fabricated probabilities, target prices or new position sizing.

## Independent outcome collection

Separate price-follow-up ingestion from decision creation. Every five minutes, request fresh provider quotes for pending episode symbols plus BTC, including symbols removed from the active watchlist. Retain provider observation times. Overlapping runs are skipped, requests are bounded, and restart resumes persisted due work.

Feed observations through the existing horizon rules: first quote within the allowed 25% post-horizon window; matched BTC within five minutes; stale/future/missing observations cannot resolve an outcome. Do not create another decision episode just to record a quote. Existing expired episodes remain expired unless a separately versioned historical reconstruction uses genuine timestamped historical data.

Serialize memory writes across refresh and follow-up collection to prevent dropped records. Keep existing archive and corruption-preservation behavior. Distinguish sample price touch from real fill; do not invent fees, fill probability or realized execution edge.

## Dashboard and integrity

Watchlist adds compact evidence coverage and changed-thesis indicators. An expandable coin panel presents source links, dates, thesis changes, opposing evidence and required checks. Market Today summarizes material verified changes affecting holdings and candidates; it must distinguish technical-only from evidence-informed analysis.

The production attention endpoint must return actual persisted evidence or an explicit unavailable response. Move fixtures behind test/development paths; preserve any legacy endpoint shape through an explicit data-mode/status contract and tests.

Integrity shows separate timestamps for account sync, market snapshot, news/social collection and outcomes. A fresh account timestamp cannot make an old investment assessment fresh. Align execution freshness labels with the existing 30-minute boundary rather than representing a two-hour snapshot as universally current.

## Modules and integration

Implement in the recovered runnable checkout and copy exact changed files into the canonical deployment overlay after verification.

- `src/server/researchEvidence.ts`: validated records, persistence, deduplication and per-asset retrieval.
- `src/server/researchCollection.ts`: authorized adapters, bounded collection and provider status.
- `src/server/reassessment.ts`: deterministic evidence changes and persisted review queue.
- `src/server/outcomeCollector.ts`: independent quote follow-ups, no new decisions.
- Existing `src/server/outcomeMemory.ts`: separate follow-up update interface and serialized writes.
- Existing `src/server/server.ts`: lifecycle scheduling, authenticated import if needed, read-only evidence/reassessment routes and honest attention responses.
- Existing `src/ui/SimpleApp.tsx` and `MarketBrief.tsx`: compact coverage/reassessment display, expandable evidence details.

## Acceptance checks

1. Two syndicated stories cannot become two independent confirmations.
2. Ambiguous symbols, absent dates, future observations and stale evidence remain explicit.
3. A material confirmed catalyst queues a waiting coin; duplicate fetch does not queue it repeatedly.
4. Negative news produces review/risk information without an automatic order.
5. Missing social credentials produce NOT_CONFIGURED, never zero-popularity or a fixture score.
6. Outcome follow-ups resolve inside the existing windows with the dashboard closed; removed watchlist symbols remain covered.
7. Concurrent manual refresh and follow-up preserve every decision record.
8. Restart resumes persisted pending work; a provider outage cannot corrupt history.
9. Source URLs and untrusted text cannot execute code, expose secrets or cause private-network requests.
10. Existing account, entry, strategy, authentication and no-trading tests remain green; production typecheck and UI build pass.
11. Hosted checks prove data provenance and timestamps; a successful build alone is insufficient.

## Next releases, explicitly separate

After reliable evidence collection: coin-specific support/volatility/cost entry scenarios; separate laggard, strong-trend-pullback and catalyst setups; order-size liquidity reconciliation; complete portfolio dependencies; scenario returns net of costs; confirmed-fill linkage and strategy validation. Promotion requires point-in-time tests and comparisons with BTC/cash and simpler baselines. Do not fit to QNT alone.

## Review boundary

User authorized starting the project. The brainstorming workflow requires review of this concrete architectural specification before the implementation plan and code. No server credentials, application code, live policy or Railway deployment have been changed by preparing this document.
