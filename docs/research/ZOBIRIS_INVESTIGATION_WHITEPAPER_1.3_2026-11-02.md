# ZOBIRIS

## Investigate the unexpected

### A research standard for AI trading analysis

**Crypto and equities | Research edition 1.3 | 2 November 2026**

> **What changed in 1.3:**
> - Section 03 is upgraded from *reported* to *checked against repository outputs*.
> - Section 06's Binance source conflict is resolved.
> - Sections 33–37 are new: implementation status in the Zobiris repo, a live evidence log for 29 Oct–2 Nov, source reachability, first live use of Chainlink feeds, and an evaluation of this document with recommended revisions.
>
> Sections 01–32 are otherwise preserved from edition 1.2.

Prepared for Loki. Synthesizes the supplied Zobiris research whitepaper, the Anomaly-Driven Market Discovery and Learning Protocol, our trading discussions, the supplied Mavis Creative Percent proposal, and primary academic and market-data sources.

**The priority:** investigate the specific situation, identify competing explanations, collect evidence that separates them, and record a forecast before its outcome. Use indicators, valuation, news, and AI models where they improve that investigation.

**The ambition:** discover useful relationships that conventional templates miss, then determine when they survive fresh evidence and realistic execution.

**Evidence boundary:** this is a researched methodology and implementation specification. It does not reproduce the earlier backtests, certify trading profits, provide current orders, or deploy a trading system. Historical conversation figures are not live quotes. The 2027 equity mandate and CP integration are specified in Sections 23–27; no Mavis repository was inspected and no runtime modification is claimed. Section 32 evaluates Chainlink CRE starter templates as an optional evidence and workflow layer.

<!-- PAGE -->

## 01 | The central conclusion

AI trading analysis should give first priority to **disciplined investigation of unexpected market behavior**. Its first question should be: what is happening that our current explanation does not adequately predict? Its next question should identify the observation that could resolve that uncertainty.

This combines the most valuable parts of Zobiris. Our trading experience supplied unusual observations and practical constraints. The earlier synthesis separated direction, relative strength, reachable levels, execution, and portfolio risk. The new protocol adds the missing discovery process: imagination, competing explanations, selective evidence collection, and explicit learning from outcomes. [I1; I2]

The research supports parts of this approach. Order-book studies connect short-interval price changes to supply-demand imbalance and depth. Crypto research finds market, size, and momentum effects within studied samples. Statistical research explains why repeated searching and reused holdouts can manufacture apparent discoveries. None of these papers proves this complete Zobiris method is superior. That is a proposition to test prospectively. [R1-R7]

### What takes priority, in order

1. **Integrity:** correct asset, data, timestamps, and decision boundary.
2. **The unresolved situation:** expected behavior versus observed behavior.
3. **Discrimination:** rival explanations and the cheapest useful test.
4. **Prediction:** a specific event, horizon, alternative, and invalidation.
5. **Usefulness:** forecast improvement, execution economics, or risk reduction.
6. **Learning:** preserve the outcome and change the relevant belief.

Novelty has value when it leads to a useful question. The system should remain capable of recognizing an ordinary situation, applying a simple proven rule, or concluding that no new opportunity is detectable. It should not require an exciting story before every decision.

**What changes now:** make the investigation protocol the default analytical standard. Treat particular patterns, including early leaders and pressure absorption, as research candidates until qualified. This prioritizes a method without pretending one market mechanism explains everything.

<!-- PAGE -->

## 02 | What trading changed in our thinking

The record shows a progression from finding promising coins toward understanding situations. Some of the best ideas came from Loki noticing behavior that a generic indicator report would have missed: alts weakening while BTC barely moved, particular coins resisting a selloff, and earlier recovery leaders reappearing. These observations deserve investigation even when the first explanation fails. [I1; I2; I3]

| Earlier intuition | What challenged it | Updated working belief |
|---|---|---|
| The most oversold coin should rebound most | Reported flush and rotation tests weakened after costs or on later data | Distinguish exhaustion from persistent weakness |
| BTC stabilization should rescue most alts | Laggards sometimes remained weak; CAP changed behavior independently | Test each asset's response, exposure, and own supply conditions |
| Repeated support establishes a floor | The recorded BTC $79,700 floor hypothesis failed | Define a conditional defense and its failure event |
| A strong coin is an attractive purchase | CAP's leadership could reverse; entries and horizons mattered | Asset selection and entry quality require separate decisions |
| A convincing forecast should make money | Fees, spreads, missed fills, and adverse movement changed outcomes | Measure net executable payoff separately |
| A larger model or more indicators should help | Reported model and feature tests did not reliably improve direction | Complexity must demonstrate incremental value |

### Preserve the ingenuity

INJ and UNI were useful clues because selected episodes showed substantial BTC-relative strength. Their role is to inspire a test of recovery behavior, not to establish a permanent privileged pair. HYPE and XMR suggested that broad weakness can coexist with asset-specific demand. COMP illustrated the distinction between discovering a move and obtaining a sensible entry. SOL illustrated the difference between adoption progress and near-term price support. [I1]

We should not respond to failed forecasts by declaring markets unknowable. A failed directional model may still help forecast volatility, identify fragile liquidity, rank resilient assets, or improve exits. The task is to determine which of those jobs it actually performs.

<!-- PAGE -->

## 03 | Evidence we have, and evidence still missing

The supplied synthesis reports detailed experiments from earlier work. Edition 1.2 did not have the underlying registry, raw data or replay code.

**1.3 update:** the main results below were **checked against their stored output files in the Zobiris repository** (`docs/research/`, `research/recovery_lab/results/`, `docs/research/registry/tests_registry.jsonl`, 47 lines). They were read, not re-run. They therefore carry the label *Checked*: stronger than *Reported*, weaker than *Tested*. [I5]

| Reported result | What we can retain | What must be reproduced |
|---|---|---|
| 21 direction checks failed to beat the baseline; 8 upper and 9 lower target checks passed a multiplicity procedure | Direction and barrier events deserve different evaluation | Event definitions, target distances, test family, adjustment, dependence |
| 9,640 Kronos forecasts over 15 coins showed no directional skill | Model sophistication alone is insufficient | Model vintage, features, forecast timing, missing data, comparator |
| 20 BTC drops: alts lagged by 1.69% after fees over the next day | Post-shock lag is a useful candidate risk hypothesis | Event overlap, coin eligibility, fees, interval construction |
| Nearness to 30-day highs had a holdout t-statistic of 3.45 | Resilience merits replication | All variants tried, controls, event clustering, untouched holdout |
| 80 flush events: most-flushed fifth lagged BTC by 0.53% after maker fees over six hours | Do not grant oversold assets an automatic recovery premium | Fill feasibility, selection timestamp, maker assumptions |
| Dip strategy: +2.18% development, -4.54% validation, -0.24% holdout | Early attractiveness did not establish generalization | Exact partitions and strategy versions |
| Rotation screen: QUALIFIED minus NOT_LAGGING −1.8% over 30 days (interval −10.0 to +6.1); score correlation slightly negative | Do not use the rotation score to rank new capital | Universe, gate definition, overlap |
| Funding level vs post-flush rebound: correlation +0.002 (t 0.11) | Funding alone does not identify forced buyers | Liquidation and open-interest history (paid source) |
| **Forward test, first live event (1.3):** after the 30 Oct BTC drop, the least-fallen group returned −0.11% over 72h against +7.6% for the most-fallen, a spread of −7.71 points | One event, recorded against the holdout result above; resilience is not yet *qualified* | Accumulate forward events before any conclusion |

The registry file has 47 entries (checked). A file is still not equivalent to immutable, timestamped registrations: commit history or hashes must be audited before relying on it.

**Forecast ledger (checked, 2 Nov):**
- Claude: 7 scored, hit rate 29%, mean Brier 0.203, average confidence 0.39.
- Owner: 3 scored, hit rate 33%, mean Brier 0.335, average confidence 0.63.
- Coin-flip baseline: 0.25.
- Two 15- and 30-minute BTC direction calls on 31 Oct missed (Brier 0.30 and 0.29) while their ranges held.

The samples are too small to rank forecasters. Different observations, forecast horizons, coins, and event counts cannot be pooled into one success percentage.

### Evidence labels for every future report

**Observed:** directly supported by a timestamped source or measurement. **Inferred:** an explanation compatible with observations. **Reported:** supplied by an earlier document or third party but not reproduced. **Tested:** evaluated with an accessible specification and outputs. **Qualified:** passed the separately declared forecasting, economic, and operational requirements.

There is no new empirical trading-performance claim in this whitepaper. Its new contributions are the synthesis, corrected reasoning, operational definitions, and proposed research contracts.

<!-- PAGE -->

## 04 | What external research adds

| Primary research | Finding within its scope | Implication for Zobiris |
|---|---|---|
| Cont, Kukanov & Stoikov [R1] | In 50 U.S. stocks, short-interval price changes related to order-flow imbalance, with impact linked to depth | Study pressure and response; contemporaneous fit is not a forward trading edge |
| Makarov & Schoar [R2] | Crypto exchanges exhibited segmentation and recurrent cross-venue price differences | Verify whether a divergence is broad or venue-specific |
| Brunnermeier & Pedersen [R3] | Their model connects funding constraints and market liquidity, including destabilizing feedback under certain conditions | Investigate amplifiers and liquidity withdrawal; do not presume every fall is forced selling |
| Liu, Tsyvinski & Wu [R4] | Crypto market, size, and momentum factors explain cross-sectional patterns; momentum operates at weekly horizons in the study | Relative strength is credible research territory; this does not validate a 15-minute rule |
| George & Hwang [R5] | Nearness to the 52-week high contains information about stock momentum in the studied sample | Test distance from highs; do not transplant stock horizons to crypto |
| Campbell & Shiller [R10] | Present-value relationships connect valuations, expected dividends, and discount rates | Stocks need a cash-flow and expectations framework alongside trading-flow analysis |

### Three distinctions that keep this synthesis honest

First, a paper describing how prices move during an interval does not necessarily forecast the next interval. The data used to explain a completed move might only become available after that move.

Second, a profitable historical factor portfolio is not equivalent to a small-account, long-only trade after venue-specific fees. Borrowing, turnover, capacity, and selection rules may differ.

Third, evidence from a different market or horizon provides a reason to test, not a license to import its coefficients. The contribution here is a common investigation process with different asset-specific measurements.

**Revised market view:** prices reflect evolving expectations and the terms on which willing or compelled participants can transact. The investigative opportunity is often in a change of response: the same apparent pressure begins producing a different outcome. That proposition is our synthesis, not a theorem established by any single paper.

<!-- PAGE -->

## 05 | The investigation loop

The unit of analysis is **asset + context + sequence + horizon + decision**. “RSI is low” omits almost all of that information. “This asset has stopped making new lows during repeated BTC selling, across liquid venues, before the next hour begins” is a question that can be investigated. [I2]

| Step | Required output | Stop or redirect when |
|---|---|---|
| Establish expectation | A baseline using information available before the observation | The expectation is hindsight or undefined |
| Detect the departure | Magnitude, timing, persistence, and measurement quality | The apparent anomaly is stale data or immaterial |
| Generate rivals | Two to four different explanations, including an artifact explanation | All explanations make the same prediction |
| Choose evidence | What observation would change their ranking? | More data would not change a decision |
| Freeze the call | Event, deadline, forecast basis, falsifier, and comparator | Evidence cannot support a bounded call |
| Resolve and learn | Outcome, execution, counterevidence, and belief update | The record is incomplete; mark it unresolved |

### A useful question before every retrieval

**What uncertainty am I resolving, what observation would distinguish the alternatives, and what would change if I obtained it?** This is a qualitative value-of-information rule. It is not a numerical information-gain estimate unless competing probabilities and evidence likelihoods have actually been modeled.

For example, when a token rises against BTC, fetching another oscillator may add little. Checking whether its spot bid improved on a second venue could distinguish real demand from an isolated quote. If a stock falls after apparently good results, the relevant next source may be guidance or a change in margins, not another summary of headline earnings.

### A bounded output, every time

An investigation should end with one of four useful products: a forecast, a research test, a risk or execution adjustment, or a justified finding that the evidence is insufficient. State the exact obstacle in the last case. “Anything could happen” is not an analytical result.

This is the proposed default workflow for AI market analysis. It preserves curiosity while giving that curiosity a measurable destination.

<!-- PAGE -->

## 06 | Verification before interpretation

### Identity and clocks

Record the instrument, contract or issuer identifier, venue, quote currency, product type, and applicable trading session. A shared ticker does not establish shared identity. A perpetual-futures signal and a spot order are related instruments, not the same executable market.

Maintain separate event, publication, first-observed, ingestion, and decision timestamps. A later article describing an earlier event cannot be used as though it was available at the event time. Revised economic statistics and company figures must retain their earlier vintages.

Kraken documents that its REST OHLC response is capped at 720 recent entries and includes the current uncommitted candle. A month of hourly bars is not a deep historical database. Archived bars or reconstructed trades are needed for longer studies. Its historical files omit intervals without trades; distinguish those intervals from missing-feed observations. [R13; R15]

### A source conflict from this research

Earlier conversations attributed the late-October selloff to a Binance security incident. In 1.2, a direct retrieval of Binance's support URL redirected, so the details were treated as provisional. [R18]

**1.3 resolution.** By 2 November, the outline was corroborated by independent source families:
- **On-chain:** Arkham's "Binance Hacker" entity, about $5.77bn across 819 addresses.
- **Issuers:** Tether and Circle froze roughly $2.8–3bn.
- **Exchange statements reported by several outlets:** about $6.3bn affected, about 95% covered by 2 Nov, and withdrawals resumed with about $3.64bn net outflow.
- **Fund flows:** US spot BTC ETFs −$643.33M on 30 Oct (SoSoValue).

Attribution to North Korea remains reported, not established here. The paper still does not assert that the incident caused a specified return. [E1–E4]

For any market narrative, keep separate: what the source says happened, when traders could know it, what flow was measured, and what remains a causal inference. Repeated articles quoting the same statement are not independent confirmations.

### Data quality can itself explain the anomaly

Check stale last trades, thin books, mismatched candles, stablecoin quote moves, splits, dividends, token migrations, and changed circulating supply. Missing observations must not become artificial zeros or confident neutral signals.

For stocks, SEC submissions and XBRL APIs supply useful primary records, but reporting-period dates are not availability dates. SEC guidance also distinguishes acceptance timestamps from public availability. Save the actual retrieved filing and ingestion time, and avoid using a later restatement in an earlier forecast. [R16; R17]

<!-- PAGE -->

## 07 | Relative strength becomes a research question

“Up while BTC is down” is a useful observation. It leaves several possibilities: the asset has low BTC sensitivity; its own demand increased; a sector moved; a stale quote hid the decline; or derivatives moved before spot. Those explanations imply different next outcomes.

### Measure the departure from the asset's own expectation

Estimate a simple relationship on a trailing window ending before the decision. For crypto, begin with BTC and optionally a clearly justified sector factor. For equities, begin with the broad market and sector. Complexity should enter only after a simpler model fails a relevant test.

**Residual return = observed asset return - return predicted by the frozen exposure model.**

Use the same return interval for every asset and factor. Fit exposure estimates only on earlier observations. Report their instability and residual volatility. Residual strength is a statistical description, not proof of independent buying or a hedge.

| Observation | Rival explanation | Discriminating evidence |
|---|---|---|
| XMR resists a BTC decline | It simply had lower BTC exposure | Compare residual performance with its prior sensitivity |
| A token jumps on one exchange | Thin liquidity or stale comparison venue | Fresh synchronized spot quotes and executable spreads |
| Several former leaders improve first | Sector rally or repeated high-beta behavior | Controls for sector, beta, volatility, and current momentum |
| A coin sits high in its daily range | Its range is narrow or the low is stale | Range width, quote freshness, volume, and future persistence |

### Keep three output layers

**Selection:** which candidates demonstrate unusual strength? **Entry:** can a realistic entry avoid paying away the expected benefit? **Risk:** how does the candidate alter current factor exposure and downside?

Weekly crypto momentum and stock 52-week-high research make this a defensible research direction. They do not verify Zobiris' 30-day thresholds or intraday rotation rules. [R4; R5] Preserve the user's insight about stronger range position as a candidate feature; require it to add value beyond ordinary momentum and volatility.

<!-- PAGE -->

## 08 | The response to pressure

One of the most promising questions in the new protocol is: **when does substantial selling stop producing substantial downside?** A changing response may reveal a transition sooner than a lagging trend indicator. It may also be temporary noise. The next test must distinguish those possibilities. [I2]

### Define what is observable

Measure executed aggressive selling, changes in bid and ask depth, spread, additions and cancellations, and subsequent price response. Trade-side classification must follow the feed's definition. Total candle volume alone does not identify aggressive sellers.

Compare selling episodes matched on notional size, starting depth, spread, volatility, and session. A simple screening statistic is downside basis points per unit of aggressive sell notional. It is not a stable structural parameter: denominators near zero and simultaneous buying make it unreliable. A better test estimates expected impact from earlier data and asks whether current downside is unusually small.

| Sequence | Candidate interpretation | What would weaken it |
|---|---|---|
| Selling continues, bids replenish, price holds | Possible absorption of supply | Replenishment disappears and the next selling wave breaks price |
| Modest selling, bids vanish, price falls sharply | Liquidity fragility | The effect disappears after controlling for starting depth |
| Buying persists, asks replenish, little advance | Possible supply overhang | Offers clear and repricing persists across venues |
| A short burst moves price, then fully reverses | Temporary displacement | Follow-through survives after the initial burst |

Order-flow imbalance includes relevant changes at the best quotes; it is not identical to aggressive trade imbalance. Cont and colleagues provide a foundation for studying impact, not a universal recovery signal. [R1]

### What L2 cannot certify

Aggregated depth updates do not identify trader intent, hidden inventory, or an individual order's exact queue position. Without a trustworthy reconstruction, claims about replenishment may be artifacts. Kraken's checksum procedure verifies book consistency, not the economic explanation. Capture snapshots and updates, verify checksums, mark gaps, and restart invalid books. Historical candles cannot recreate a historical L2 feed. [R14]

This family deserves prospective recording before strong claims. If L2 is unavailable, name the candle-based proxy and downgrade the mechanism claim.

<!-- PAGE -->

## 09 | Derivatives without false certainty

The earlier CAP account described price down about 17.9% and open interest down about 18%, interpreting that combination as a flush of leveraged longs. That conclusion needs a unit check before a market story. [I3]

### The arithmetic matters

For a simplified linear contract, dollar open interest equals token quantity times price. If both quoted changes refer to dollar OI and the same interval:

**Quantity ratio = 0.82 / 0.821 = 0.998782.**

The implied quantity decline is approximately **0.12%**, not 18%. Almost all of the dollar decline could be price translation. This is an illustrative correction using the reported numbers; the original feed's units and exact timestamps have not been verified. Inverse contracts require their own conversion.

A separate CAP snapshot supplied in the chat reported price down 24% and aggregate dollar OI down 28.4%. Under the same simplified, timestamp-aligned linear-contract assumption, `0.716 / 0.76 - 1` implies a quantity decline of about **5.79%**. This is a different historical snapshot, not a correction to the earlier input values. Aggregation across venues and contract types may invalidate this shortcut; verify each component before interpreting deleveraging. [I3]

Even a genuine contraction in contract quantity does not identify which side initiated closing: every outstanding contract has a long and a short. To strengthen a liquidation explanation, obtain venue-specific liquidation records, trade direction, basis, funding, and contemporaneous spot response. None alone proves the next move.

| Combination | Competing explanations | Next useful measurement |
|---|---|---|
| Price falls; quantity OI falls | Position closure, liquidations, hedging reduction | Liquidation records and spot response |
| Price rises; OI rises | New risk, hedged activity, directional leverage | Spot participation, basis, and later persistence |
| Futures lead; spot barely moves | Temporary leverage demand or information transmission | Synchronized venue sequence and later spot acceptance |
| Funding is elevated | Carry demand or costly crowded exposure | Funding interval, realized payments, basis, and unwind behavior |

### Supply is a sequence, not a headline

For unlocks or compromised-wallet claims, distinguish scheduled eligibility, actual release, wallet transfer, exchange deposit, and executed sale. A deposit suggests availability to sell but does not certify execution. A future supply overhang may affect other holders before the alleged source sells.

Never label a liquidation heatmap as observed orders without documenting its construction. Dealer positioning and hedging direction likewise require identifiable exposure and assumptions; option open interest alone is insufficient.

<!-- PAGE -->

## 10 | A distinct equity investigation

Stocks require a view of the business and the expectations embedded in price. Liquidity explains part of transaction-level movement; it does not replace analysis of cash flows, financing, dilution, or discount rates. The Campbell-Shiller framework supports keeping these components conceptually separate. [R10]

### Start with the expectations gap

When a stock falls after apparently good earnings, ask what improved relative to expectations known before the release. Revenue growth can coexist with weaker margins, higher capital requirements, worse guidance, dilution, or a higher required return. A favorable business development can be genuine while its price response remains unfavorable.

| Investigation | Primary inputs | Decision it can improve |
|---|---|---|
| Business change | Filings, segment results, guidance, cash conversion | Whether the long-term thesis strengthened |
| Price-implied expectations | Reverse DCF, margins, reinvestment, discount-rate sensitivity | Whether the price requires an implausible operating path |
| Event response | Exact release time, liquid session prices, market and sector returns | Whether weakness is specific or shared |
| Supply and demand constraints | Disclosed issuance, lockups, index changes, borrow where observable | Whether predictable trading needs alter timing |
| Entry and exposure | Spreads, session liquidity, position overlap, event gaps | Whether to enter, wait, trim, or investigate further |

### Apply the same curiosity, different measurements

For a software stock such as MSFT or CRM, a useful investigation might ask whether AI spending is translating into profitable cash generation or raising the growth already required by valuation. For an energy producer such as FANG or EQNR, ask whether a commodity-price move changes free cash flow after investment and obligations. These are example questions, not current assessments or recommendations.

Separate intraday event response, multi-day drift, and multi-quarter valuation. A reverse DCF is a conditional description of expectations; it does not time tomorrow's move. Historical defensive behavior in CB or BRK.B is a starting point for stress analysis, not a guarantee of future protection.

SEC filings can anchor the evidence, but historical consensus estimates require a dated archive. If no such archive exists, do not call a result a measured earnings surprise. [R16; R17]

<!-- PAGE -->

## 11 | Two investigations worked through

### CAP: a formerly strong token weakens while BTC stabilizes

**Observation:** the conversation records a transition from outperformance to substantial weakness. Exact returns, quote times, and instrument identity require replay before statistical use. [I3]

**Rival A: leverage closure.** Predict unusually high verified long liquidations and declining quantity-adjusted OI. **Rival B: new token supply or demand deterioration.** Predict corroborating supply events or persistent spot selling. **Rival C: measurement or venue effect.** Predict inconsistent timing, quote-currency effects, or a localized price gap.

**Next evidence:** resolve the token and traded product; align spot and futures timestamps; inspect OI units; check primary supply records only if that explanation remains material. Do not fetch ten more oscillators before correcting a potentially misleading OI number.

**Bounded test:** after a predeclared pressure-response transition, forecast the next six-hour residual return and maximum adverse movement. Score it against a momentum-and-volatility baseline. A bounce after the fact is insufficient; the trigger must precede it. No present CAP trade follows from this historical example.

### A stock falls after a headline earnings beat

This second example is hypothetical, not a claim about a specific company.

**Rival A: expectations were higher than the headline suggests.** Inspect dated consensus and guidance. **Rival B: the sector repriced.** Compare liquid-session returns with market and sector benchmarks. **Rival C: temporary trading pressure.** Look for a known supply event or abnormal execution conditions, followed by normalization.

**Discriminator:** if the stock's residual weakness persists into the next liquid session while forward cash-flow expectations worsen, the temporary-displacement explanation loses support. If the apparent weakness vanishes with synchronized quotes and sector adjustment, there may be no firm-specific anomaly.

**Decision:** a long-term holder might review the business thesis; a short-term trader needs a separately validated entry and exit rule. The same observation need not imply the same action for both.

The method is specific enough to change what evidence we seek, yet flexible enough to accommodate a surprising explanation.

<!-- PAGE -->

## 12 | Forecast the event that matters

Zobiris should maintain separate scorecards. A level forecast can be useful even when directional classification is weak. It becomes misleading when a high touch rate is presented as a high probability of profit. [I1]

| Forecast | Exact outcome | Appropriate evaluation |
|---|---|---|
| Direction | Completed future close above a specified reference | Brier or log loss versus a prior-data base rate |
| Relative strength | Asset exceeds benchmark return over the same interval | Residual return, ranking, or properly scored event probability |
| Barrier | Frozen price level reached before the deadline | Probability score, distance and volatility controls |
| Risk | Decline, adverse excursion, or range exceeds a threshold | Quantile or interval score, coverage, and exceedance severity |
| Execution | Specified order fills under stated rules | Fill probability, quantity, delay, slippage, and adverse selection |
| Economic outcome | Net payoff under a frozen entry and exit policy | Net return, uncertainty, drawdown, and capacity |

### A mathematical illustration, not a market forecast

Under driftless Brownian motion with continuous paths, the probability of touching an upper barrier before time T is twice the probability of finishing above it. For a barrier one standard deviation above the start, those probabilities are approximately 31.7% and 15.9%. Both follow from a model with no directional edge.

This explains why touching and closing must not be compared as equivalent tasks. Real markets have jumps, changing volatility, drift, spreads, and trading-session constraints. Use this only as a null-model illustration. For a trade with two barriers, estimate target-before-stop ordering; a target touch after the stop is not a winning trade.

### Calibrated probabilities require records

Brier score is the mean squared difference between predicted event probability and its binary outcome. Lower is better. Compare with a base rate estimated only from prior eligible data, not automatically 50%. Report calibration, sample size, and performance by regime. [R11]

A subjective probability is permitted if labeled as judgment and later scored. Do not describe a probability as calibrated simply because it has two decimal places. Never convert a historical 48-hour touch rate into a six-hour fill probability.

<!-- PAGE -->

## 13 | Testing without teaching the answer to the model

Discovery is allowed to be adaptive. Final evaluation must respect the decisions made during discovery. A threshold changed after seeing a failure creates a new hypothesis version; it does not erase the failed attempt. [R6-R8]

### Chronological evaluation

Use earlier data for discovery, later data for specification choices, and a sealed final interval for evaluation. Purge training examples whose outcome windows overlap the evaluation boundary. Specify any embargo from the information dependencies and maximum outcome horizon. Random row splits are unsuitable when overlapping events share future prices.

Fit scalers, exposure models, regime labels, universe filters, and feature selection inside each training period. Include delisted or failed assets when they were eligible. Estimate costs for the relevant historical venue and size rather than using today's conditions everywhere.

### Dependence and multiple attempts

Many coins experiencing the same BTC shock are not independent shocks. Use event- or time-block uncertainty estimates that preserve dependence, and disclose effective sample limitations. Record all related variants, including asset subsets, holding periods, exits, and apparently minor filters.

Harvey, Liu, and Zhu show why extensive factor searching requires stronger evidence than conventional isolated tests. Their t-statistic discussion is not a universal pass mark for Zobiris. Bailey and López de Prado's Deflated Sharpe Ratio addresses selection and non-normality under its assumptions; it cannot repair bad timestamps or fabricated fills. [R6; R7]

Dwork and colleagues show how adaptive reuse can overfit a holdout, with specialized methods for controlling that problem. The practical default here is simpler: restrict access, preserve trial history, and acquire genuinely later observations. Merely renaming a dataset “holdout” does nothing. [R8]

### What promotion would require

Predeclare a minimum useful improvement, uncertainty procedure, test-family correction, cost stress, and sample or stopping rule. A candidate forecasting gain must survive later evaluation. A trading candidate additionally needs positive net economics and acceptable exposure. Choose power targets from the relevant variance and dependence; there is no universal magic number of trades.

Rejected ideas remain searchable with their failure reasons. Changing the narrative while recycling the same failed rule is not a new discovery.

<!-- PAGE -->

## 14 | AI's special advantage and special failure mode

AI can help generate rival explanations, extract claims from filings, retrieve comparable episodes, draft tests, and find contradictions across sources. Its advantage should be measured in better questions and decisions, not the number of plausible narratives it can produce.

### Historical knowledge can contaminate historical forecasts

Sarkar and Vafa demonstrate that pretrained language models can introduce future information into analyses intended to use only earlier knowledge. Instructions to ignore the future do not reliably remove that risk. This makes present-day roleplay of an old trading day unsuitable as clean prospective evidence. [R9]

There is constructive evidence too. He, Lv, Manela, and Wu report chronologically consistent model families and strong performance in their studied news-embedding tasks. They find modest leakage effects in that particular setting and emphasize that effects depend on the model and application. This prevents the opposite overstatement that all AI financial evidence is invalid. [R12]

### The proposed division of labor

| Component | Responsibility |
|---|---|
| Language model | Questions, competing hypotheses, document extraction, and clear synthesis |
| Deterministic calculations | Returns, timestamps, indicators, OI conversions, costs, and scoring |
| Versioned research store | Raw evidence, discovery history, specifications, forecasts, and outcomes |
| Controlled evaluation | Later-data tests, baseline comparisons, and uncertainty |
| Human decision boundary | Portfolio objectives, risk limits, and authorization to trade |

These are functions, not a requirement for multiple AI agents. A single process can perform them sequentially with distinct outputs.

For historical language-model tests, disclose model and training-cutoff uncertainty. Prefer documented historical model vintages where feasible. For practical validation, freeze the model and prompt, issue forecasts now, and resolve them later. Retrieved evidence should be dated and archived, but retrieval controls alone do not remove pretrained knowledge.

The strongest AI result may be a faster rejection of a false mechanism, a better order plan, or an earlier recognition of a regime change. Test each claimed benefit separately.

<!-- PAGE -->

## 15 | Memory that improves the next investigation

Store episodes with their original information boundary, not only a later summary. A retrospective explanation can generate a new hypothesis; it cannot become evidence that the hypothesis predicted its own discovery example. [I2]

### Minimum episode record

| Group | Fields |
|---|---|
| Identity | Episode ID; asset identifier; instrument; venue; eligible universe |
| Time | Event time; publication time; first seen; ingestion; decision; resolution |
| Context | Session; market state; volatility; spread; exposure estimate |
| Observation | Expected behavior; anomaly; sequence; measurements and quality flags |
| Explanation | Leading account; rivals; supporting evidence; contradictions; missing evidence |
| Test | Version; trigger; outcome; horizon; baseline; falsifier; discovery history |
| Decision | Forecast; probability type; proposed action; execution and risk assumptions |
| Resolution | Price outcome; adverse excursion; fills; costs; errors; belief update |
| Provenance | Raw-data reference and hash; source URL; code, prompt, and model version |

### Retrieve by situation before outcome

Compare episodes using characteristics observable at their decision times: shock size, prior trend, liquidity, session, event type, and exposure. Retrieve comparable failures and non-events alongside successes. Choose matching rules before evaluating future returns.

“Leadership memory” is itself a candidate feature. Test whether earlier recovery behavior adds value after controlling for current momentum, beta, sector, volatility, and tradability. If those controls explain it, keep the simpler feature.

### Learn without quietly rewriting history

Use append-only updates: the old forecast remains, a new observation gets a new timestamp, and a changed forecast is separately scored. Preserve unfilled orders, missed signals, rejected candidates, and data outages. Missing evidence should lower the evidence status, not disappear from the record.

After resolution, record five short entries: what was expected, what occurred, where they differed, which belief changes, and the next test. This is the operational meaning of learning. A warm narrative about lessons learned is not a substitute for that record.

<!-- PAGE -->

## 16 | Research contracts A and B

The following are proposed initial specifications, not validated strategies or already registered tests. Freeze exact parameters, power targets, and the eligible sample before decisive evaluation. Separate discovery examples from evaluation data.

### A. Relationship inversion

**Question:** does unexpected strength during BTC weakness predict persistent relative performance?

**Candidate trigger:** on completed 15-minute bars, BTC's return is in the bottom decile of its trailing 60-day distribution while the asset's residual return is in its top decile. Estimate beta from the prior 30 days, ending before the trigger bar. Exclude stale or untradeable instruments using rules fixed in advance.

**Primary outcome:** asset return minus BTC return over the next four hours. Entry simulation begins at the next executable quote. Permit one event per asset per four hours; cluster inference by common shock or time block.

**Comparators:** matched BTC-shock observations; current momentum; volatility; spread; and prior exposure. Compare with simply choosing the strongest raw-return assets.

**Failure:** no later-data improvement after controls, concentration in a single episode, or inability to execute the apparent advantage. Relative success may remain useful for allocation even when absolute returns are negative.

### B. Early leadership before BTC recovery

**Question:** does a group of assets begin strengthening before BTC's next transition, beyond information already present in BTC itself?

**Candidate trigger:** at each completed 15-minute observation during a predeclared BTC weakness state, calculate breadth of positive residual momentum in an eligible liquid universe. Freeze the selection rule; do not retrospectively choose whichever coins led.

**Primary outcome:** BTC's next completed one-hour return is positive. Score probabilities against a BTC-only model using its momentum, volatility, and recent returns. This event defines the research target; it is not a general definition of a durable bottom.

**Timing test:** enforce a signal-to-decision delay and use exchange and receipt timestamps. Report false alarms, missed recoveries, and usable lead time. A simultaneous reaction to shared news is not proven leadership.

**Failure:** the apparent gain disappears after synchronization, reasonable latency, or the BTC-only comparator. A changed asset-selection rule creates a new version.

<!-- PAGE -->

## 17 | Research contracts C and D

### C. Pressure-response transition

**Question:** does smaller-than-expected downside under comparable selling predict a subsequent recovery?

**Data requirement:** verified L2 updates and trades, with a consistent aggressor convention. Start with BTC, SOL, and a few liquid eligible markets to keep collection and validation feasible. Do not claim historical absorption from hourly candles.

**Candidate trigger:** a completed five-minute interval contains aggressive sell notional in the top quartile of its trailing distribution but downside impact in the bottom quartile conditional on depth, spread, and volatility. Require a documented replenishment measure; its exact calculation belongs in the frozen specification.

**Primary outcome:** next 30-minute mid-price return, compared with matched selling episodes. Secondary economic outcome uses executable quotes after latency, fees, and measured slippage. A mid-price result is research evidence, not a fill.

**Rivals:** hidden offsetting demand, a brief pause before new selling, feed gaps, or a common market rebound. Control for contemporaneous benchmark movement and test later data.

**Failure:** no incremental future information, checksum failures, or a gain consumed by execution costs. A valid risk warning may be retained separately from a failed entry strategy.

### D. Spot and derivatives disagreement

**Question:** which disagreements predict continuation, reversal, or volatility without direction?

**Data requirement:** synchronized spot and perpetual prices, basis, funding intervals, quantity-adjusted OI, and the actual venue coverage of liquidation records.

**Candidate design:** classify completed 15-minute episodes by spot leadership versus perpetual leadership and expanding versus contracting quantity OI. Define thresholds on training data, then freeze them. Avoid selecting the best combination after evaluating all future returns.

**Primary outcome:** next one-hour return, tested against price, volume, and volatility controls. Register realized range as a distinct secondary outcome with a multiple-testing policy.

**Failure:** OI units cannot be reconciled, one venue drives the effect, latency removes it, or directional improvement fails. If only range prediction survives, report a volatility model rather than relabeling it bullish or bearish.

<!-- PAGE -->

## 18 | Research contracts E and F

### E. Leadership memory

**Question:** does an asset's behavior in earlier recoveries improve selection in a new recovery episode?

**Candidate design:** define BTC shock and recovery conditions in advance. At each new episode, rank eligible assets using only their residual responses in earlier qualifying episodes. Apply shrinkage toward the universe average where histories are sparse. Newly listed assets need an explicit missing-history treatment.

**Primary outcome:** next four-hour residual return. Compare with a selection model containing current momentum, distance from recent highs, liquidity, volatility, sector, and BTC exposure.

**Key falsifier:** the memory feature contributes nothing once present characteristics are included. This would not invalidate the original observation about INJ and UNI; it would show that the reusable predictor was current strength rather than remembered identity.

**Evaluation:** leave later episodes untouched. Do not match cases using their eventual winners. Score the entire eligible universe, not just coins that appeared in conversation.

### F. Equity expectation failure

**Question:** does a stock's response to new financial information reveal a durable expectations mismatch or temporary displacement?

**Candidate design:** collect earnings events from a point-in-time liquid equity universe. Use archived pre-release consensus where available, actual guidance, and the first complete liquid-session response. Fix treatment of premarket, intraday, and after-hours releases.

**Primary outcome:** sector-adjusted total return over the next five trading sessions, beginning after the decision. Compare with simple earnings surprise, guidance change, prior momentum, size, and market response.

**Competing mechanisms:** operating deterioration, discount-rate repricing, temporary supply, or a misleading headline beat. Filings provide the primary evidence; a mechanism is still an inference unless separately established.

**Failure:** stale consensus, missing historical filings, future restatements, survival bias, or no improvement over the simple event model. If dated consensus is unavailable, narrow the question to response after a documented release and remove claims about measured surprise.

These six contracts cover the protocol's five initial discovery families and add a distinct equity study. They should not all be optimized simultaneously on the same small sample.

<!-- PAGE -->

## 19 | Execution and whole-account usefulness

Forecast skill, order quality, and portfolio benefit are separate. A useful investigation must identify which one it is trying to improve.

### Model the order that could actually exist

Specify order type, arrival time, size, price, expiry, queue assumptions, partial fills, and cancellation behavior. Candle highs and lows can establish a possible touch; they cannot establish a particular limit order's fill. If a candle touches both target and stop, resolve sequence using finer data or apply a conservative ambiguity rule.

Net payoff must include fees, spread crossing, slippage, funding or borrow when applicable, and actual exit behavior. Avoid charging spread twice when executable bid/ask prices already include it. Report missed fills and opportunity costs separately, with their comparator defined.

**Illustration:** a 0.60% gross round-trip return with 0.80% total fees is approximately -0.20% before additional friction. These are hypothetical inputs, not a statement of current account fees. A good selection model can still be uneconomic at this horizon.

### Cash goals and downside plans

The earlier plan to raise roughly $509 depended on several unfilled limits. Expected proceeds are not available cash. A review deadline prevents indefinite indecision but does not protect against price decline. Stop orders also have execution and gap risk. Record how much of each position is actually covered, and prevent conflicting orders from assuming the same reserved quantity. [I3]

### Portfolio scope

A 34% equity allocation falling 70% loses 23.8% of the whole account under that isolated scenario. A 24% risk target therefore has almost no remaining room for other losses. This is stress arithmetic, not a guaranteed loss cap. Include crypto and correlated exposures if they share the account boundary. [I1]

Measure common exposures, liquidity in stress, and concentration alongside nominal ticker count. A near-zero correlation from one short period does not establish crash protection. The relevant question is whether the proposed decision improves the user's stated objective under plausible adverse outcomes.

Risk constraints remain explicit and stable while research proceeds. Discovery changes beliefs; it does not silently increase trading authority or position limits.

<!-- PAGE -->

## 20 | Test the method itself

The proposed investigation process must face the same standard it imposes on individual signals. It could produce richer explanations while failing to improve decisions. We should measure that possibility directly.

### A prospective comparison

At fixed observation times, provide the same timestamped evidence packet and eligible universe to two workflows. The comparator is a simple indicator-and-context report. The candidate is the anomaly investigation protocol. Give them the same retrieval and time budget, require the same forecast targets, and archive both outputs before resolution.

Use the same model where practical so the comparison tests workflow rather than unrelated model differences. Prevent either workflow from seeing the other's forecast or future outcomes. Include routine periods and non-events, not only dramatic market days. Freeze prompt versions and disclose updates.

| Dimension | Proposed measure |
|---|---|
| Evidence integrity | Unsupported material claims, wrong units, stale data, and timing errors |
| Forecasting | Paired Brier differences versus the same prior-data baseline |
| Selection | Future benchmark-adjusted performance of ranked candidates |
| Risk | Adverse-excursion forecasts and frequency of missed failure conditions |
| Execution | Net simulated outcomes with identical fill and cost assumptions |
| Efficiency | Retrieval cost, time, and useful belief updates per resolved episode |

Choose one primary endpoint before starting, such as paired Brier improvement for a fixed four-hour event. Treat other endpoints as secondary, with an explicit multiplicity policy. Report forecast coverage so selective abstention cannot manufacture apparent accuracy; compare results on common cases and on the full policy.

A practical collection pilot can run for 30 days, but that duration is an engineering milestone, not automatic statistical sufficiency. Set a later evidence threshold using observed dependence and the smallest improvement worth acting on.

**A successful outcome:** fewer factual errors and better prospective decisions at acceptable cost. **An informative failure:** more elaborate stories without forecast, risk, or economic improvement. In that case, simplify the workflow rather than defend its elegance.

<!-- PAGE -->

## 21 | Implementation order

This is a specification for the next Zobiris version. No repository, live engine, trading permissions, or scheduled tasks were modified for this paper.

| Priority | Deliverable | Acceptance condition |
|---|---|---|
| 1. Provenance | Asset registry, raw-source archive, separate clocks, quality flags | A reviewer can reconstruct what was known at each decision |
| 2. Research ledger | Versioned hypotheses, forecasts, outcomes, and discovery history | Failed and superseded calls remain visible |
| 3. Baselines | Direction, relative-return, range, and touch comparators | Predictions use prior data and have reproducible scores |
| 4. Anomaly studies | Start with relationship inversion and equity event response | Each produces a frozen test with explicit rivals |
| 5. L2 collection | Small liquid-universe feed with checksums and gap handling | Replays are internally consistent; invalid intervals excluded |
| 6. Execution | Quote-based costs, conservative limit fills, reservation accounting | No assumed profitable fill rests solely on a candle touch |
| 7. Method evaluation | Paired prospective workflow comparison | Improvement survives declared evidence and cost requirements |

### Infrastructure should follow the question

The existing Node and SQLite design can support a modest research ledger. High-frequency depth capture should be sized separately and may need compressed event files or another storage layer. This is an architectural proposal based on the project context, not an inspection of current infrastructure.

Use deterministic jobs for data validation and scoring. The AI reads bounded evidence packets and writes structured research records. Give missing-data states explicit meanings. Halt only the analyses that require a failed feed, rather than inventing values or presenting the entire system as healthy.

### Source hierarchy

For securities, start with filings and issuer releases; for exchange mechanics, use official API and contract documentation; for on-chain claims, use exact transactions and verified identity; for methodology, use original research. News can surface questions and provide reporting, but causal claims require their own evidence.

No social media source was used as a foundation for this paper. Parallel Search supplied the requested research discovery; selected claims were cross-checked with an additional web retrieval tool. Independent sources matter more than the number of search results.

<!-- PAGE -->

## 22 | The operating directive

### Default instruction for Zobiris market analysis

Begin with the user's decision and horizon. Resolve asset identity and the information cutoff. State what would ordinarily be expected and what is actually occurring. If no meaningful anomaly exists, say so and use the appropriate baseline.

For a material departure, propose a small number of genuinely different explanations. Include measurement or selection error where relevant. Identify what supports each explanation, what conflicts with it, and what observation would separate it from its rivals.

Choose measurements because they answer that question. Use indicators, valuation, news, derivatives, and order-book data when relevant. Do not replace investigation with an automatic dashboard checklist or collect information that cannot change the decision.

Retrieve comparable past situations using only their decision-time characteristics. Include failures and non-events. Treat remembered success as a hypothesis source until tested beyond the episodes that created it.

Make a bounded call when warranted: event, horizon, supporting evidence, strongest rival, invalidation, and resolution rule. Label subjective probabilities. Distinguish price direction, relative strength, barrier touch, fill probability, and net payoff.

Preserve source provenance, timestamps, units, model and code versions, and all material strategy changes. Resolve the forecast and update the relevant belief. Report errors directly. Novelty earns investigation; later evidence determines reliance.

### A compact user-facing report

**Distinctive now:** one situation-specific observation.

**Best explanation and rival:** why each fits, and the unresolved contradiction.

**Next discriminator:** the observation that would change the assessment.

**Bounded outlook:** event, horizon, invalidation, and confidence basis.

**Decision value:** what this changes about selection, entry, exit, or risk, if anything.

**What we learned:** the explicit update since the previous report.

The priority is productive curiosity with a memory. Seek the unusual, test the explanation, and become more precise about what should happen next.

<!-- PAGE -->

## 23 | Equity mandate: ambitious selection, explicit uncertainty

The research mandate is to investigate substantial equity upside over the 2027 investment horizon, including the Magnificent Seven and the wider technology and AI supply chain. Crypto remains a separate, smaller strategic interest in the supplied mandate; this document sets no allocation. Risk analysis should make an ambitious thesis testable and survivable rather than mechanically substitute low-volatility stocks. The proposition that a boom continues until a bubble breaks is a hypothesis, not a usable exit rule. [I3; I4]

Define two distinct forecasts: total return from the actual decision date to the chosen exit date, and calendar-year 2027 total return. A profitable recovery from a depressed entry does not necessarily predict a positive calendar year. Define recovery itself: reclaiming a specified pre-event close, reaching the prior annual high, outperforming a benchmark, or earning a positive return. These are different outcomes with different barriers and horizons.

The working comparison universe includes Apple, Microsoft, Alphabet, Amazon, Meta, Nvidia, and Tesla, evaluated individually. A basket label does not establish shared earnings quality, valuation, or AI economics. Broader comparisons can include semiconductor suppliers, infrastructure providers, software monetizers, and energy producers. FANG means Diamondback Energy in this document; EQNR means Equinor. Neither is automatically an AI investment or a crash hedge. No current buy ranking is asserted here.

### A reproducible stock dossier

| Stage | Required evidence and analysis | Failure to avoid |
|---|---|---|
| Identity and clock | Issuer, ticker, exchange, share class or ADR, currency, filing period, release time, session, observation cutoff | Comparing an after-hours quote with a regular-session close as if simultaneous |
| Business and expectations | Segment economics, customer demand, backlog quality, guidance, dated consensus when available | Treating an earnings beat as proof of attractive future returns |
| Owner economics | Operating cash flow, cash capex, leases, working capital, stock compensation, dilution, debt and contingent obligations | Equating an adjusted free-cash-flow label with cash available to shareholders |
| Valuation | Reverse DCF, explicit growth and margin assumptions, reinvestment, discount-rate sensitivity, bear/base/bull operating paths | Calling a stock cheap because it is below its annual high |
| Market response | Split/dividend-aware returns, market and sector comparison, gap behavior, volume versus comparable sessions | Transplanting crypto thresholds into a market with sessions and overnight gaps |
| Portfolio contribution | Marginal exposure to AI spending, rates, oil, growth, currencies, and common customers; correlated stress losses | Counting different tickers as independent bets |
| Decision | Ranked candidates, reason to act or wait, horizon, review event, invalidation, execution conditions | Inventing precise support or forcing two purchases because two slots were requested |

The requested shortlist can contain two or three candidates only when the comparative evidence supports it. Show the best rejected alternatives and the reason for rejection. Selection quality, entry quality, and position sizing are separate judgments; a strong business can have an unattractive price, and a promising rebound can be unsuitable at a particular exposure.

### Compare companies on consistent economics

For AI platforms, distinguish customer demand and monetization from infrastructure commitments. Reconcile capital expenditure definitions, including cash purchases and finance leases, and distinguish quarterly figures from year-to-date or trailing-twelve-month figures. Do not sum different fiscal quarters and call the result a synchronized industry quarter. Show each company, period, unit, and definition before aggregating. A narrow capex-over-OCF result is sensitive to classification and timing; it does not by itself demonstrate funding distress.

For chip and infrastructure suppliers, inspect customer concentration, backlog conversion, customer financing, inventory, export constraints, gross margins, and capacity commitments. Supplier investment in a customer can create demand while also creating credit exposure. Trace the actual contracts before alleging circular revenue or counting an entire financing vehicle as a corporate guarantee.

For Diamondback and Equinor, normalize profits and cash flow under stated oil and gas scenarios. Compare sustaining investment, production decline, hedges, taxes, leverage, distributions, and currency exposure. Distinguish reported capex from management-adjusted measures. A low earnings multiple at unusually high commodity prices can reflect cyclicality rather than undervaluation. Their energy exposure may offset one inflationary scenario while worsening a recession scenario.

### Technical timing serves the investment horizon

Record adjusted prices, the exact completed bar, and the relevant market calendar. Wilder RSI(14), when useful, must identify its timeframe and warm-up history. Compare completed intraday volume with the same time of day on comparable sessions; distinguish opening auctions, closing auctions, and ordinary continuous trading. Use benchmark-relative returns alongside absolute returns: outperformance can occur while a stock loses money.

For a months-long holding, technical weakness triggers investigation rather than silently redefining the thesis as an intraday trade. Conversely, do not convert a failed short-term setup into a long-term investment without a fresh valuation and explicit decision. Price levels need an identified basis and a review rule, not arbitrary precision.

### Forecasts without invented probabilities

If no suitably validated model exists, provide an evidence-ranked assessment with explicit uncertainty, not numerical recovery probabilities. Analyst targets, self-rated confidence, historical bounce frequencies selected using future outcomes, and agent votes are not calibrated probabilities. A model claiming recovery likelihood must define the event, include failed recoveries, respect information availability, account for delistings and corporate actions, and outperform simple baselines on untouched data. Report calibration and effective sample size, not only classification accuracy. [R6-R9; R11]

The macro brief and geopolitical graphics supplied in the chat are research leads. Audit their underlying dates, series, definitions, and original sources before importing claims into a stock thesis. A two-year yield above current overnight rates does not uniquely identify hike expectations; an unchanged yield-curve slope does not isolate term premium. Election-market odds and a reported military plan do not establish a timed market path. Keep scenarios separate from observations and avoid turning the 1999–2000 analogy into a forecast.

<!-- PAGE -->

## 24 | Mavis Creative Percent: optional exploration architecture

**Status: proposed integration specification, not deployed functionality.** The MiniMax source describes Mavis and a Leader/Worker/Verifier collaboration model with a state-machine engine. It does not establish that the particular runtime available to this project has the supplied nine-state sequence, a compatible `DISPATCH` hook, or the proposed configuration variables. Those require inspection of the actual repository and version. The external repositories are design inspiration, not validated financial methods or adopted dependencies. [C1-C4; I4]

CP allocates a bounded share of research resources to alternative explanations, neglected evidence, and potentially useful analogies. It does not increase trading authority. The base path remains responsible for task decomposition, evidence collection, artifact production, and verification. Exploration findings enter the final synthesis only after the same evidence checks as baseline claims.

### Define the percentage operationally

Let `B` be the predeclared total run budget in estimated monetary cost, with tool and model costs counted consistently. `CP = 0.10` reserves at most `0.10 × B` for exploration and its incremental verification; the remaining budget funds the baseline path and required checks. Record actual expenditure as well as the allocation. If cost cannot be estimated reliably, use a separately named token budget rather than mixing incompatible units. A hard wall-clock deadline also applies. An infeasible reserve must not remove essential baseline verification.

`CP = 0` disables exploration. Values such as 0.05 and 0.10 are experimental settings, not empirically optimal values, probabilities of correctness, or required proportions of creative sentences. An equal-budget comparison must give the baseline-only control access to the same total resources; otherwise a CP advantage may simply be a compute advantage.

### Functional roles

| Exploration role | Stock-research assignment | Required product |
|---|---|---|
| Watcher | Find evidence against the leading thesis, including worsening cash conversion or a sector explanation | A sourced contradiction and its likely consequence |
| Librarian | Retrieve comparable prior episodes using only pre-outcome features | Similarities, dissimilarities, source dates, and previous failures |
| Oracle | Decompose the price-implied economics and test assumptions from first principles | A calculation or assumption tree that can be checked |
| Dreamer | Generate cross-domain hypotheses about overlooked constraints or feedback | A mechanism, a rival, and a discriminating observation |

These names denote software roles, not consciousness or privileged foresight. They may run concurrently where the runtime supports it, or as isolated sequential passes. Four roles are a candidate configuration, not a requirement to spend on four agents for every question. Model diversity does not make shared data or learned assumptions statistically independent.

### Proposed dispatch lifecycle

1. Freeze the task definition, decision horizon, source cutoff, budget, and permissions in an immutable evidence packet.
2. Start ordinary research and, if enabled and affordable, exploration from that packet. Record subsequent evidence additions with timestamps.
3. Collect structured proposals into a staging queue; baseline artifacts remain independently recoverable.
4. Run a bounded challenge pass and independent verification of any material claim, calculation, or citation.
5. Merge accepted findings with their evidence labels; preserve unresolved contradictions and rejected proposals in the audit trail.
6. Complete the baseline response by its deadline. Cancel or quarantine late exploration outputs; do not retroactively rewrite the decision record.
7. Score outcomes later and consider memory promotion separately from immediate synthesis.

The suggested `subconscious.json` is a candidate staging snapshot, not an authoritative knowledge store. Concurrent unrestricted writes risk lost updates and corrupt JSON. Prefer a single-writer append-only event stream or transactional database, with derived snapshots, schema validation, IDs, idempotent writes, and atomic updates. Five-second polling and once-hourly escalation are optional scheduling parameters from the proposal; they are not evidence-based requirements. Event-driven processing may fit better. Rate limits never suppress material integrity failures.

<!-- PAGE -->

## 25 | Dissent, hidden patterns, and knowledge governance

Independent problem restatements should precede shared conclusions. Compare assumptions and evidence paths, not merely the number of bullish and bearish votes. High agreement can justify one targeted challenge; it does not prove groupthink. A low contrarian count can justify checking for missing alternatives; it does not justify inventing a contrary conclusion. [C3; I4]

Use a bounded challenge rule: if a material assumption remains untested and budget remains, assign its strongest plausible counterargument once. Require evidence that would distinguish it. Accept supported consensus after review. End with unresolved uncertainty when evidence cannot decide; do not rerun until a dissent quota is reached. Any proposed agreement-trigger configuration must remain advisory and must not override this stopping rule.

### Proposal schema

The following is an illustrative candidate record, not an observed stock finding. Null forecast probability is intentional.

```json
{
  "schema_version": "cp-proposal-1",
  "task_id": "example-equity-review",
  "proposal_id": "example-001",
  "role": "dreamer",
  "evidence_cutoff_utc": null,
  "observation": "Test whether supplier financing is sustaining customer demand.",
  "status": "hypothesis",
  "insight_kind": "hidden_pattern",
  "source_refs": [],
  "novelty_score": 0.82,
  "self_assessed_confidence": 0.61,
  "calibrated_event_probability": null,
  "rival": "Customer purchases reflect independently funded demand.",
  "discriminator": "Reconcile disclosed financing terms and customer cash flows.",
  "falsifier": "Material purchases remain independent of supplier support.",
  "escalate": false,
  "verification_status": "not_reviewed",
  "memory_status": "candidate_only"
}
```

The two numerical scores organize research attention only. An empty source list prevents the record from becoming an established factual claim. A production observation requires a real cutoff and provenance; a hypothetical example must never enter the live evidence table as observed data.

Hidden-pattern discovery includes isolated citations, neglected assumptions, old signals whose relevance may have changed, and cross-domain mechanisms. A compelling analogy is a hypothesis generator. It needs a market-specific mechanism and test before receiving evidentiary weight. Surface a separate “Unresolved hypothesis” callout only when it changes the next useful investigation. Zero novel findings is a valid outcome.

### Five gates, revised

| Gate | Admission rule |
|---|---|
| Value | Show a reproducible analytical benefit or correction with traceable episodes. Two runs across two domains can nominate a cross-domain pattern, but cannot establish reliability. Market-specific patterns need relevant independent episodes rather than artificial domain transfer. |
| Alignment | Check compatibility with authority and evidence standards. Record and resolve conflicts with existing beliefs; do not reject better evidence because it contradicts memory. |
| Redundancy | Merge true duplicates while retaining provenance and materially different conditions. |
| Freshness | Record valid periods, review triggers, and decay assumptions. Old factual records remain historical facts; stale decision relevance must be downgraded separately. |
| Placement | Distinguish immutable episode evidence, reusable method, provisional hypothesis, and qualified strategy. Each has different promotion and retirement rules. |

A memory entry needs scope, mechanism, supporting and failed episodes, source cutoffs, limitations, verification owner, review date, and links to superseded versions. Preserve rejected candidates for audit without returning all of them as trusted advice. Outcome evidence can update a belief only in a subsequent version. Never rewrite the original forecast to fit the outcome. [C4; R8; R9]

<!-- PAGE -->

## 26 | Telemetry and promotion: reward useful correction

Record every enabled dispatch, including failures and runs with no discoveries. Minimum telemetry includes task and run IDs; timestamps and cutoff; runtime/model/prompt/schema versions; CP allocation and actual cost; latency; roles or research cards used; accepted and rejected claims; hidden-pattern candidates; evidence-supported dissent; independent-restatement differences; challenge reruns; memory admissions; missing sources; verifier decisions; and the reason for any fallback.

Separate contemporaneous process metrics from outcome metrics that mature later. Log the baseline conclusion before merging CP findings so reviewers can inspect what actually changed. Human-readable summaries should reflect measurements, for example: `CP allocated 0.10; 4 roles attempted; 1 hypothesis tested; 0 new patterns admitted; 1 factual correction accepted`. These are counts, not success claims.

### Correct the supplied promotion incentives

| Original proposal | Problem | Replacement |
|---|---|---|
| Higher `user_re_route_rate` | Can reward misunderstanding and unnecessary detours | Separate corrective reroutes from user-approved discoveries; seek fewer avoidable corrections and measure useful changes independently |
| At least one hidden pattern per run | Encourages novelty fabrication | Judge accepted findings by verifiability and decision value; permit zero |
| 90% memory rejection | Rewards arbitrary gate strictness rather than knowledge quality | Measure admission quality, later contradiction, retrieval usefulness, and duplication without a target rejection quota |
| Contrarian quota | Confuses disagreement with information | Require a meaningful rival and a discriminating test where uncertainty warrants one |
| Promotion after 30 dispatches | Thirty correlated tasks may contain little independent evidence | Use 30 as an optional engineering pilot; determine inferential sample size from the endpoint, dependence, and desired precision |
| Automatic reset to CP 0.05 | A smaller unvalidated setting may retain the same defect | Disable or reduce under predeclared rollback rules; diagnose before re-enabling |

### Prospective comparison

Before collecting evaluation outcomes, freeze the task population, cost and deadline limits, scoring rubric, exclusions, primary endpoint, material improvement threshold, and holdout policy. Compare CP-on against baseline-only using the same information availability, model family, and total resource ceiling. Randomize or pair tasks where feasible and blind reviewers to treatment labels. Include simple extra-search and extra-verification controls to test whether lateral reasoning adds anything beyond additional effort.

For evidence reviews, a defensible primary endpoint is a blinded assessment of materially correct, sourced conclusions after penalties for unsupported claims; preregister the rubric. For probabilistic market forecasts, use an event-specific proper score against a frozen baseline, with calibration and economic usefulness assessed separately. Group correlated tasks by issuer, event, and time when estimating uncertainty. Count all tried configurations and retain an untouched prospective segment. [R6-R9; R11]

Promote only when the chosen endpoint improves by a predeclared meaningful amount with uncertainty that supports the claim, while factual integrity, permissions, cost, latency, and failure behavior meet their guardrails. Engineering quality and trading edge are separate promotion decisions. A better research workflow does not certify a profitable trading strategy. Test role and memory ablations before claiming which component caused an improvement.

<!-- PAGE -->

## 27 | Failure behavior and implementation acceptance

Failure of the optional lateral path must not prevent an otherwise valid baseline response. Record timeout, tool failure, schema rejection, or budget exhaustion; quarantine partial outputs and prohibit unverified memory writes. Failed runs remain in reliability, cost, and intention-to-treat evaluation metrics. They do not count as successful discoveries or support memory promotion.

This fallback rule is limited: a failed core data-integrity check cannot be waved through as a normal answer. Mark the affected conclusion unresolved, repair it if possible, or narrow the response. Lack of price, filing, or identity verification is not confirmation.

### Implementation sequence for a future `/mavis` integration

1. Inspect the actual repository and document the runtime version, states, dispatch boundary, permissions, existing audit format, and cancellation behavior. Do not invent the claimed nine states.
2. Define an adapter that leaves the baseline path intact at CP zero. Confirm whether parallel execution and independent verifier context are supported.
3. Implement immutable evidence packets, typed proposal records, a single-writer or transactional staging store, and explicit source-status labels.
4. Add budgeted optional roles and one bounded challenge pass. Preserve an independently reviewable baseline conclusion.
5. Add verifier-controlled synthesis and memory staging. Exploration roles cannot promote their own claims or alter orders and risk gates.
6. Test timeout, missing-source, concurrent-write, cancellation, duplicate-event, stale-cutoff, and corrupted-record cases. Demonstrate that baseline fallback and authority boundaries hold.
7. Run the frozen pilot and prospective evaluation before default enablement. Record rollback reasons and version changes.

### Stock-research output contract

Each final stock review should provide: the research cutoff and horizon; the ranked thesis and strongest rival; primary-source evidence with period and session labels; valuation assumptions; benchmark-relative and absolute context; the next observation that would change the view; the opportunity's portfolio role; and a decision classification such as investigate, eligible for planning, wait, or thesis invalidated. Include CP discoveries only when verified or explicitly labeled unresolved. State whether the conclusion changed because of CP and why.

The user can pursue a growth-oriented 2027 thesis while demanding evidence quality and explicit loss scenarios. Neither a conservative ranking nor an aggressive ranking is the default answer to every task. The method should locate attractive opportunities, expose the assumptions on which they depend, and preserve the distinction between research, portfolio approval, and execution. This document changes research specifications only.

<!-- PAGE -->

## 28 | Sources and scope: internal record

**Original research edition: 1 November 2026, America/Phoenix.** Literature search used Parallel Search with targeted primary-source queries on microstructure, momentum, multiple testing, valuation, proper scoring, and AI temporal leakage. Selected official documentation and source conflicts were checked through a second web retrieval route. This is a targeted research synthesis, not an exhaustive systematic review or meta-analysis.

**[I1] Zobiris Synthesis Whitepaper, 1 November 2026.** Supplied 14-page PDF: “Zobiris_Synthesis_Whitepaper_Nov2026(1).pdf.” Read in full. Used for the historical progression, reported experiments, selected case studies, execution lessons, and risk arithmetic. It is itself a synthesis of earlier papers; those underlying originals and their raw backtest artifacts were not independently recovered for this edition.

**[I2] Zobiris: Anomaly-Driven Market Discovery and Learning Protocol.** Supplied text: “Pasted text(20261101-173000).txt.” Read in full. Source of the situation-first principle, rival explanations, discovery families, research roles, episode memory, contracts, lifecycle, and bounded research budget. These are proposed operating principles, not empirical trading results.

**[I3] Supplied conversation history.** Used for the CAP OI claim, historical order-planning example, BTC floor discussions, user observations, and proposed stock-research context. Screenshots and underlying data referenced in that history were not all available. Historical balances, fills, prices, and technical readings were not independently reconstructed.

**[I4] Supplied Mavis Creative Percent master proposal and stock-research instructions, incorporated 2 November 2026.** Source of the proposed exploration roles, dispatch integration, dissent rules, memory gates, telemetry, and promotion criteria. Sections 23–27 adapt these proposals to the Zobiris equity mandate and correct incentives that could encourage unsupported novelty. The current revision checked the MiniMax description and repository landing pages as architecture context; it did not audit their code, reproduce benchmarks, inspect the user’s Mavis installation, or independently refresh the historical macro and company figures in the chat. The YouTube reference could not be retrieved and is not evidence for implementation claims. Earlier edition source statements below are retained provenance, not claims that every source was rechecked on 2 November.

### What this edition independently contributes

The OI unit check, mathematical distinction between barrier and terminal events, explicit equity translation, six proposed experiments, prospective workflow comparison, and operational implementation sequence are analysis or proposals developed here. They are labeled accordingly. No new trading dataset was analyzed and no quoted historical strategy result was independently replicated. Edition 1.1 additionally specifies a stock dossier, horizon-specific recovery evaluation, optional CP resource allocation, evidence-based dissent, corrected memory governance, prospective promotion criteria, and implementation acceptance checks. These are proposals, not measured improvements.

### Citation convention

Inline references identify the source supporting the nearby factual or methodological point. Design choices and numerical experiment thresholds are our proposals. A source's discussion of a mechanism does not validate our particular signal or establish a causal interpretation of the historical episodes.

The following references are primary research, official documentation, or an explicitly qualified official-source retrieval. Titles are linked for review. Publication dates are distinguished from website upload or retrieval dates where material.

<!-- PAGE -->

## 29 | Sources: markets and evaluation

**[R1] Cont, R.; Kukanov, A.; Stoikov, S. (2014).** “The Price Impact of Order Book Events.” Journal of Financial Econometrics 12(1), 47-88. [Author preprint and publication record](https://arxiv.org/abs/1011.6402). Supports short-interval imbalance and depth relationships; not a claim of Zobiris profitability.

**[R2] Makarov, I.; Schoar, A. (2020).** “Trading and Arbitrage in Cryptocurrency Markets.” Journal of Financial Economics 135(2), 293-319. [LSE publication record](https://researchonline.lse.ac.uk/id/eprint/100409). Supports venue segmentation and the relevance of cross-venue analysis in its sample.

**[R3] Brunnermeier, M. K.; Pedersen, L. H. (2009).** “Market Liquidity and Funding Liquidity.” Review of Financial Studies 22(6), 2201-2238. [NBER working paper and published-version record](https://www.nber.org/papers/w12939). Mechanism model; conditional feedback is not an automatic diagnostic rule.

**[R4] Liu, Y.; Tsyvinski, A.; Wu, X. (2022).** “Common Risk Factors in Cryptocurrency.” Journal of Finance 77(2), 1133-1177. [Published paper](https://onlinelibrary.wiley.com/doi/full/10.1111/jofi.13119). Published version used for the weekly-horizon interpretation; earlier working versions have differences in characteristic counts.

**[R5] George, T. J.; Hwang, C.-Y. (2004).** “The 52-Week High and Momentum Investing.” Journal of Finance 59(5), 2145-2176. [Published paper](https://onlinelibrary.wiley.com/doi/abs/10.1111/j.1540-6261.2004.00695.x). Related equity evidence, not replication of the 30-day crypto idea.

**[R6] Harvey, C. R.; Liu, Y.; Zhu, H. (2016).** “… and the Cross-Section of Expected Returns.” Review of Financial Studies 29(1), 5-68. [Published paper](https://academic.oup.com/rfs/article-abstract/29/1/5/1843824). Supports accounting for extensive factor searching and correlated tests.

**[R7] Bailey, D. H.; López de Prado, M. (2014).** “The Deflated Sharpe Ratio: Correcting for Selection Bias, Backtest Overfitting and Non-Normality.” Journal of Portfolio Management 40(5), 94-107. [Author paper record](https://doi.org/10.2139/ssrn.2460551). Supports selection-aware performance assessment, subject to its assumptions.

**[R8] Dwork, C.; Feldman, V.; Hardt, M.; Pitassi, T.; Reingold, O.; Roth, A. (2015).** “The reusable holdout: Preserving validity in adaptive data analysis.” Science 349(6248), 636-638. [Published paper](https://www.science.org/doi/abs/10.1126/science.aaa9375). Supports the distinction between adaptive discovery and valid evaluation.

<!-- PAGE -->

## 30 | Sources: AI, data, and verification

**[R9] Sarkar, S. K.; Vafa, K. (2024).** “Lookahead Bias in Pretrained Language Models.” Working paper, version dated 28 June 2024. [Author research PDF hosted by NBER](https://conference.nber.org/conf_papers/f205530.pdf). Evidence and tests of temporal leakage; working-paper status retained.

**[R10] Campbell, J. Y.; Shiller, R. J. (1988).** “The Dividend-Price Ratio and Expectations of Future Dividends and Discount Factors.” Review of Financial Studies 1(3), 195-228. [Published record](https://academic.oup.com/rfs/article-abstract/1/3/195/1580239). Valuation decomposition, not a timing system.

**[R11] Gneiting, T.; Raftery, A. E. (2007).** “Strictly Proper Scoring Rules, Prediction, and Estimation.” Journal of the American Statistical Association 102(477), 359-378. [Author PDF](https://www.stat.washington.edu/raftery/Research/PDF/Gneiting2007jasa.pdf). Foundation for probabilistic scoring.

**[R12] He, S.; Lv, L.; Manela, A.; Wu, J. (2026).** “Chronologically consistent large language models.” Journal of Financial Economics 185, 104374; online record dated 6 October 2026. [Published paper](https://www.sciencedirect.com/science/article/pii/S0304405X26001455). Findings apply to the studied models and tasks; not an endorsement of a particular model for this project.

**[R13] Kraken.** “Get OHLC Data.” [Official API documentation](https://docs.kraken.com/api-reference/market-data/get-ohlc-data). Retrieved 1 November 2026. Limited recent history and current uncommitted candle.

**[R14] Kraken.** “Spot WebSocket book checksum, v2.” [Official guide](https://docs.kraken.com/api/docs/guides/spot-ws-book-v2/). Retrieved 1 November 2026. Book integrity procedure, not proof of market intent.

**[R15] Kraken.** “Downloadable historical OHLCVT data.” [Official support documentation](https://support.kraken.com/in/articles/360047124832-downloadable-historical-ohlcvt-open-high-low-close-volume-trades-data). Retrieved 1 November 2026. Archives and no-trade interval treatment.

**[R16] SEC.** “EDGAR Application Programming Interfaces.” [Official documentation](https://www.sec.gov/search-filings/edgar-application-programming-interfaces). Submissions and extracted XBRL data. **[R17] SEC.** “Webmaster Frequently Asked Questions.” [Timestamp and availability guidance](https://www.sec.gov/about/webmaster-frequently-asked-questions). Both retrieved 1 November 2026.

**[R18] Binance.** “Security Incident Update #2 (2026-10-30).” [Support URL returned by Parallel Search](https://www.binance.com/en/support/announcement/detail/d3306d9dca5243548c813b605e1d1751). Parallel Search returned dated article text; separate direct retrieval redirected to the announcement index. Retained as qualified source evidence only. No event amount or return causality depends on it in this paper.

<!-- PAGE -->

## 31 | Sources: CP design and provenance

**[C1] MiniMax (27 May 2026).** [“MiniMax Agent Team: Built for Long-Running Tasks and Continuous Evolution”](https://www.minimax.io/blog/minimax-agent-team-long-running-1779893953). Retrieved 2 November 2026. Primary product description supporting the Mavis name, Leader/Worker/Verifier separation and state-machine collaboration context. It does not validate CP, a trading edge, or compatibility with an uninspected local runtime.

**[C2] amor71/thinking-agents.** [Repository](https://github.com/amor71/thinking-agents). Repository overview accessed 2 November 2026. Inspiration for parallel cognition and a shared staging concept; no code audit or performance replication.

**[C3] 0xNyk/council-of-high-intelligence.** [Repository](https://github.com/0xNyk/council-of-high-intelligence). Repository overview accessed 2 November 2026. Inspiration for independent restatement, bounded challenge, explicit uncertainty, and unresolved verdicts. It does not establish that numerical dissent quotas improve market research.

**[C4] 191341025/Self-Evolving-Skill.** [Repository](https://github.com/191341025/Self-Evolving-Skill). Repository overview accessed 2 November 2026. Governance inspiration. The five-gate wording in this edition adapts the user-supplied proposal; it is not a verified verbatim implementation specification from this repository.

**[C5] Secondary context supplied by the user.** [BigGo article](https://finance.biggo.com/news/0mIKJJ4B6tLPsnrZNqbk), consulted as secondary context; technical architecture statements are anchored to C1 where supported. [YouTube reference](https://www.youtube.com/watch?v=4ijAHPPKk50), retrieval unavailable in this revision. No unverified video content supports a factual claim.

**Editorial acceptance check, 2 November 2026:** retained the original investigation framework and R1–R18 bibliography; separated proposal from implementation; reconciled the two CAP OI examples; removed discovery and dissent quotas from the proposed acceptance standard; distinguished research-workflow improvement from trading profitability; retained all failures in workflow evaluation; and preserved the research-only authority boundary. No live recommendation or order was generated.

<!-- PAGE -->

## 32 | Chainlink CRE: evidence transport and auditable workflows

**Status: evaluated design reference, not an installed dependency.** The user supplied Chainlink's `smartcontractkit/cre-templates/starter-templates` repository. Its starter catalog and selected TypeScript READMEs were inspected through GitHub on 2 November 2026. The observed `main` branch head was `d0223f31182c76bc36b1cc9d47b13b18efcf2bf6`. This was a documentation review, not a source-code audit, simulation, deployment, or measurement of reliability. [C6-C10]

CRE adds a useful third responsibility to the architecture: Zobiris defines the research question and evaluates evidence; Mavis CP explores alternatives; a CRE adapter could coordinate selected external events, data retrieval, and verifiable publication. Keep open-ended reasoning in the research service and explicit workflow rules in the adapter. No inspected template establishes that arbitrary Mavis agents can run unchanged inside CRE.

### Most useful template mappings

The left column describes documented capabilities. The right column proposes Zobiris adaptations; those adaptations have not been implemented.

| Template | Documented capability | Proposed Zobiris use |
|---|---|---|
| Custom Data Feed | Scheduled or event-triggered off-chain data retrieval with optional chain writes | Publish a compact, timestamped research record after verification, when external consumers actually need it |
| Event Reactor | React to on-chain events, read state, and respond | Open an investigation on a verified transfer or protocol event; attach context rather than infer a trade or intent |
| Circuit Breaker | Price-event deviation checks and periodic health monitoring; contract pause path | Quarantine suspect input or suppress new research signals until integrity recovers |
| Prediction Market | Creation, price-based resolution, and dispute workflows | Borrow the explicit forecast and outcome lifecycle for a research scorecard, without staking or payouts |
| Verifiable Build | Docker-based reproducible TypeScript workflow builds | Link reviewed source and built workflow artifacts for independent inspection |

The catalog also includes NAV/Proof-of-Reserve publication and token-management examples. These could become relevant to tokenized assets, but publishing a reserve value does not audit liabilities, establish solvency, or certify equity ownership rights. Confidential workflow examples are listed with access requirements; confidentiality must be assessed for the selected implementation rather than assumed from a template name. [C6]

### The prediction-market limitation matters directly

The prediction-market README identifies a mismatch: its example question implies a price barrier reached at any time before expiry, while resolution and dispute handling use a single spot-price read. That can produce a different outcome. The same documentation says the template has no betting deposits or payouts and is not a production-ready prediction market. [C9]

Zobiris must therefore encode `event_type`, asset identity, quote currency, start time, horizon, barrier, observation method, and resolution source before issuing a forecast. Distinguish `touch_before_deadline`, `close_above_at_deadline`, and `positive_total_return`. For a close event, a later oracle observation is not automatically the exchange close. For a touch event, define eligible trades, sampling frequency, outages, and bad-tick treatment. Equity events additionally need the exchange calendar, session, corporate-action policy, and dividend convention. Missing observations produce an unresolved or explicitly censored outcome, not an invented success or failure.

This mapping gives CRE a concrete research role: preserve and resolve the question that was actually asked. It does not supply a model for predicting the answer or establish that Chainlink prices match the venue and timestamp required by every Zobiris experiment.

### Proposed minimal adapter

1. A scheduled trigger or eligible chain event requests a uniquely identified investigation. Record event time and retrieval time separately; apply chain finality rules where relevant.
2. The existing research service produces an immutable evidence packet and a bounded forecast. CP may suggest an alternative, but cannot change a frozen forecast after its outcome.
3. Verification checks asset identity, source availability, timestamps, units, data quality, permissions, and the declared event definition.
4. Store the full packet and outcome locally in the existing audit system. If external attestation is justified, publish only an authorized compact report or commitment through a separate adapter.
5. An independent outcome job resolves the exact event and records revisions or disputes without erasing the original record.

The proposed report includes `research_id`, `schema_version`, `source_cutoff_utc`, `forecast_created_at`, `event_definition`, `expires_at`, `source_manifest_hash`, `artifact_hash`, `verification_status`, and `supersedes_id`. Hashes need canonical serialization and a documented algorithm. An anchored hash supports integrity of the committed bytes and evidence of commitment by a particular block; it cannot prove that the bytes were truthful or that their claimed observation time was accurate. Full source artifacts must remain available for review.

### Keep the trust claims precise

Workflow consensus can support agreement on execution without validating the economic interpretation. Multiple nodes querying one incorrect API do not create independent evidence. A reproducible build supports source-to-artifact correspondence without establishing that the source is secure, a valuation is correct, or a forecast is profitable. [C7; C10]

An on-chain transfer does not identify beneficial ownership or prove an exchange sale. A configurable price-deviation threshold is an operational rule, not a calibrated crash probability. The circuit-breaker template's contract-pausing capability does not imply control over Kraken orders or ordinary equities. Its Zobiris adaptation initially concerns research integrity only. Publishing a research feed also does not make it an official Chainlink market feed.

For stocks, SEC filings, issuer disclosures, licensed market data, and session-aware calculations remain the analytical inputs. CRE would transport or attest selected outputs; it would not replace those sources. Keep private holdings, credentials, proprietary data, and licensed raw feeds out of public reports. Verify redistribution permissions before any external publication.

### Adoption sequence and acceptance checks

Start with a read-only experiment and recorded inputs. Compare its operational benefit against the existing Node/SQLite scheduler and audit log. A blockchain component is worthwhile only if independent consumers, tamper-evident commitments, or chain events create a measurable requirement. Keep ordinary research simple when they do not.

Before considering deployment, pin the repository and dependencies, inspect source and receiver authorization, verify current SDK and network availability, and measure costs and latency. Test stale prices, wrong decimals, unavailable APIs, duplicate triggers, event replay, chain reorganizations, partial writes, and resolver timing. Simulations must explicitly disable broadcast and use no funded signing identity; the word “simulate” alone is not a permission boundary. Any future contract writes, keys, deployment, or trading capability require their own scoped implementation decision.

The selected template documentation explicitly calls the examples unaudited and potentially incomplete. That is a reason to use them as starting points with acceptance tests, not to dismiss their value. Successful adoption means more reproducible evidence collection and outcome accounting. It does not relax the research rules, forecast evaluation, or trading authority boundaries. [C7-C9]

### Source record for this extension

**[C6] Chainlink CRE starter catalog.** [Catalog and template descriptions](https://github.com/smartcontractkit/cre-templates/blob/d0223f31182c76bc36b1cc9d47b13b18efcf2bf6/starter-templates/README.md). Retrieved 2 November 2026. The actual directory is `starter-templates`; the root README contains some singular-path examples, so this review used the directory listing and template-specific documents.

**[C7] Custom Data Feed, TypeScript.** [README](https://github.com/smartcontractkit/cre-templates/blob/d0223f31182c76bc36b1cc9d47b13b18efcf2bf6/starter-templates/custom-data-feed/cre-custom-data-feed-ts/README.md). Documentation of workflow configuration, simulation, optional chain writes, and educational status.

**[C8] Event Reactor and Circuit Breaker, TypeScript.** [Event Reactor](https://github.com/smartcontractkit/cre-templates/blob/d0223f31182c76bc36b1cc9d47b13b18efcf2bf6/starter-templates/event-reactor/event-reactor-ts/README.md); [Circuit Breaker](https://github.com/smartcontractkit/cre-templates/blob/d0223f31182c76bc36b1cc9d47b13b18efcf2bf6/starter-templates/circuit-breaker/circuit-breaker-ts/README.md). Event/state response and dual-trigger monitoring patterns; not audited Zobiris controls.

**[C9] Prediction Market, TypeScript.** [README, including Known Limitations](https://github.com/smartcontractkit/cre-templates/blob/d0223f31182c76bc36b1cc9d47b13b18efcf2bf6/starter-templates/prediction-market/prediction-market-ts/README.md). Explicit source of the barrier-versus-single-price mismatch and omitted betting functionality.

**[C10] Verifiable Build.** [README](https://github.com/smartcontractkit/cre-templates/blob/d0223f31182c76bc36b1cc9d47b13b18efcf2bf6/starter-templates/verifiable-build/README.md). Build reproducibility scope. No build was executed in this review.

**Edition 1.2 review:** preserved prior sections and their provenance; checked template names against the repository listing; separated documented capabilities from proposed adaptations; added the outcome-resolution limitation; and confirmed that the extension asserts no deployment, live alert, or transaction.

<!-- PAGE -->

## 33 | Implementation status in the Zobiris repository (1.3)

Edition 1.2 specified CP, the planner and the Chainlink extensions as proposals. As of 2 November 2026, the following exist on branch `claude/optimistic-gauss-7g9579` as **Claude Code skills and scripts**. They are not a Mavis runtime and not a deployed service.

| Component | Status | Where | Deviation from this paper |
|---|---|---|---|
| Creative Percent | Implemented as a skill | `.claude/skills/zobiris-creative-percent/` (SKILL.md, `cp_log.py`, `CP_KB.md`) | Lenses run sequentially within one answer; no `subconscious.json`. CP is a share of answer effort and fetch budget, not monetary cost (Section 24 defines cost). |
| CP telemetry | Implemented | `docs/research/registry/cp_telemetry.jsonl` | One CP run logged so far (CAP, 2 Nov) |
| CP knowledge base | Seeded with one entry | `CP_KB.md`: "known overhang is priced before it sells" | Five-gate record kept. See the evaluation below on its Value gate. |
| Research planner | Implemented as a skill | `.claude/skills/zobiris-research-planner/` | Router-plus-dependency pattern adapted in original wording from agenticSeek (GPL-3.0); no code copied |
| Chainlink agent skills | Vendored, reviewed | `.claude/skills/chainlink-*` (9 skills, MIT, commit d907b45) | Read-only research use; Data Feeds used once (Section 36) |
| Forecast ledger | Implemented earlier | `research/recovery_lab/calls.py`, `docs/market-memory/owner-calls.jsonl` | Hourly granularity; intraday calls are graded by hand |
| Drop monitor and forward test | Implemented earlier | `research/recovery_lab/drop_monitor.py`, `post-btc-drop-forward.jsonl` | First event scored 2 Nov (Section 03) |

**Alignment actions taken in 1.3.** Section 26 rejects quota-style incentives. The CP skill's promotion rule therefore no longer targets a fixed knowledge-base rejection rate. Its dissent step is now one bounded challenge, with a reframe only when a material assumption is untested, rather than a quota-driven rerun.

<!-- PAGE -->

## 34 | Live evidence log, 29 October – 2 November 2026

These are observations recorded during the period. Each is labelled by evidence status.

| Date (UTC) | Observation | Status | Bearing |
|---|---|---|---|
| 29–30 Oct | Binance hot-wallet breach of about $6.3bn; about $1.5–1.7bn of crypto liquidations | Observed (multiple outlets) | Forced flows dominated price (Section 09) |
| 30 Oct | US spot BTC ETFs −$643.33M (IBIT −$233.7M, FBTC −$201.0M); October net about −$515M | Observed (SoSoValue) | Cooling demand before the shock: inflows fell $176M → $17M before the outflow |
| 30 Oct | Nasdaq-100 −3.5%, Intel about −29% after a "beat"; hedge funds reported to have unwound all AI buying since early 2025 (Goldman prime data, secondary) | Reported | Equity expectation failure (contract F); deleveraging, not a demand collapse |
| 31 Oct | Arkham attacker entity holds large shares of small coins: SOPH 33.9%, ERA 22.1%, FUN 5.3% of circulating supply | Observed (Arkham, CoinGecko) | Several hit all-time lows before any further selling; the FUN balance was unchanged at 580.77M |
| 31 Oct | CAP: 24h liquidations only $37.8K; open interest $36.4M, 27% of market cap; futures outflow while spot buyers added | Observed (CoinGlass) | Consistent with Section 09's correction: not a squeeze |
| 1 Nov | CAP fell to $0.0657, breaking the pre-declared $0.0683 failure level; broke it again on 2 Nov | Observed (Kraken) | A rule resolved as designed; also the occasion for the first CP run |
| 29 Oct | HYPE +10% on $66.8M of Kraken volume (about 8× normal) while BTC fell; on ordinary BTC-down hours HYPE averages −0.84% | Observed (Kraken) | Catalyst-driven (the ICE partnership), not structural low beta; rival "flight from Binance" is weakened by timing |
| 2 Nov | Polymarket, November: BTC touches $80k 78.5%, dips to $75k 67.5% | Observed | The crowd prices a range; our forecasts must beat this baseline |
| 2 Nov | Relative-strength forward test: first live event went the wrong way (−7.71 points) | Observed | Kept on record; not a refutation from one event |
| 2 Nov | Futures rebound; Brent about −7% on US–Iran peace reports | Reported | Energy hedges such as EQNR lose part of their rationale |

<!-- PAGE -->

## 35 | Source reachability: revise the stack to what can be read

Several primary sources in Sections 21 and 32 were not reachable from the research environment during this period:

- **Blocked from this location:** the Binance futures API (HTTP 451 "restricted location") and Bybit (country block).
- **Refused by the environment proxy:** direct connections to OKX, Gate, MEXC, Bitget, CoinGecko, DexScreener, public Ethereum RPC endpoints, Kalshi and quantera.ai.
- **Exhausted:** CoinDesk's monthly quota.

Binance.com and Bybit also exclude US persons, which matters for an Arizona-based owner.

**Working stack (verified 29 Oct–2 Nov):**
- Kraken public REST for spot, order book and candles.
- data.chain.link pages for oracle reference values.
- Coinversa (Hyperliquid positioning and liquidation maps).
- CoinGlass pages for exchange open interest, liquidations and flows.
- Polymarket gamma API.
- SoSoValue for ETF flows.
- Arkham and Etherscan for wallets.
- Yahoo via Firecrawl's data providers for equities.
- CoinMarketCap connector.

**Constraint:** Firecrawl credits are near exhaustion. The planner skill caps scraping at about three calls per question by default.

**Rule:** if a primary source is unreachable, record it as *missing*, name the substitute and its weaker status, and never treat absence as confirmation.

<!-- PAGE -->

## 36 | First use of Chainlink Data Feeds as an independent reference

The values below were read on 2 November 2026 at about 13:38 UTC from the official data.chain.link pages (standard proxies, Ethereum mainnet). This was **not** an on-chain `latestRoundData` call, because RPC endpoints were blocked; the decimals were therefore not read at runtime.

| Feed (standard proxy) | Answer | Last update | Kraken | Gap | Update trigger |
|---|---|---|---|---|---|
| BTC/USD `0xF403…E88c` | $77,582.69 | 13:11 | $77,944.20 | +0.47% | 0.5% deviation or heartbeat |
| ETH/USD `0x5f4e…8419` | $2,281.30 | 12:40 | $2,293.23 | +0.52% | 0.5% deviation or heartbeat |
| SOL/USD `0x4ffC…1507` | $95.48 | 03:28 | $94.48 | −1.05% | 2% deviation or 24h heartbeat |

**What this shows:**
- **Every gap was inside its update trigger,** so none indicates a stale or faulty feed.
- **The node answers were tight:** BTC spanned $77,579.80–77,596.19 (about 0.02%) across 30 of 31 responding nodes. That makes the feed a useful *outlier check* against a single venue's thin-book print.
- **The SOL feed's 2% and 24h trigger** means it must never be treated as live in short-horizon work. This is the Section 32 warning that Chainlink prices need not match the venue and timestamp an experiment requires, now quantified.

<!-- PAGE -->

## 37 | Evaluation of this document and recommended revisions

**Strengths:**
- **Evidence discipline:** the evidence labels, source hierarchy and evidence-boundary statements are strong.
- **Corrected incentives:** the corrections to the CP promotion rules in Section 26 are right and are now reflected in the implementation.
- **Event definitions:** the barrier-versus-close distinction and the CRE prediction-market critique are precise and directly usable for scoring.
- **Equity work:** the dossier contract keeps the growth thesis while forcing loss scenarios.

**Weaknesses and recommended revisions:**

1. **Too long to operate from.** At about 13,000 words, it reads as a reference manual. Recommendation: a 2-page operating card (the Section 22 directive plus the report contract) as the default, with Sections 03–37 as appendices.
2. **Little quantitative content in the equity sections.** Section 23 rightly refuses invented probabilities but omits the valuation work that already exists. Add the reverse-DCF gate as a worked example:
   - At a 9% discount rate and 3% terminal growth, the price implies 10-year FCF growth of MSFT 9.5%, TSM 10.0%, GOOGL 9.6%, META 5.0% and NVDA 15.1%. AVGO implies about 18.6%, or 15.5% on an optimistic cash-flow base.
   - The gate is crossed near a 10% discount rate.
   - Source: `docs/research/ai-equities-2027/reverse_dcf.py`.
3. **The forecast record is small and should be named as the binding constraint.** Ten scored calls cannot validate any workflow. Set a target, such as 100 resolved, pre-registered calls across asset types, before any claim that the method beats Polymarket or a simple baseline.
4. **The first forward-test miss deserves its own analysis.** Pre-register a rule now for how many forward events must accrue before the resilience finding is promoted or demoted (for example 10 events, with a block-bootstrap interval).
5. **Seeded CP knowledge base:** its first entry was admitted on two domains, crypto and an equity analog, but the equity half is a historical analogy, not a resolved forward outcome. Under Section 25's stricter reading, demote it to *candidate* until a second forward case resolves.
6. **The live trading context belongs outside the paper.** Order specifics (limit levels, holdings) should stay in the dated market-memory notes, not in the standard, both for privacy (the repository is public) and to keep the standard timeless.
7. **Name an owner and cadence for revisions,** for example after every 25 resolved calls or monthly, with a change log, so editions do not drift.

**Bottom line:** the document is a sound research standard. Its main risk is not error but weight. Pairing it with a short operating card, the live ledger and the implemented skills turns it from a specification into a working system.

### Additional sources (1.3)

- **[I5]** Zobiris repository, branch `claude/optimistic-gauss-7g9579`: `docs/research/*.md`, `research/recovery_lab/results/*`, `docs/research/registry/*.jsonl`, `docs/market-memory/*`. Read 1–2 Nov 2026.
- **[E1]** Arkham Intelligence, "Binance Hacker" entity page, retrieved 31 Oct 2026.
- **[E2]** SoSoValue, US BTC spot ETF dashboard, retrieved 2 Nov 2026; cryptotimes.io and Investing.com flow reports, 31 Oct–1 Nov 2026.
- **[E3]** Yahoo Finance live coverage, 30 Oct and 2 Nov 2026 (Binance withdrawals and coverage; market moves).
- **[E4]** CoinGlass CAP page and CoinGecko markets API (via Firecrawl), 31 Oct 2026; data.chain.link feed pages, 2 Nov 2026; Kraken public API throughout.
- **[E5]** BeInCrypto and 247wallst reporting on the HYPE/ICE catalyst, 30 Oct 2026; Goldman/Morgan Stanley hedge-fund positioning as reported by BeInCrypto, 1 Nov 2026 (secondary).

**Edition 1.3 review:** Sections 01–32 were preserved except the marked updates in Sections 03 and 06. The new sections separate observed, reported and checked items. No backtest was re-run, no orders or deployments were made, and holdings are not disclosed.
