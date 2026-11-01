# ZOBIRIS: Investigate the Unexpected, Forecast What Matters

**Research Standard 2.0 · Crypto and equities · 1 November 2026**

This edition merges two documents into one standard:

- **Investigation Whitepaper 1.0:** investigate the specific situation, weigh competing explanations, and record a forecast before the outcome.
- **Forecasting Addendum:** an inclusion rule, defined forecast targets, leakage-safe validation, provenance, and a source stack.

It also updates both with evidence from the Zobiris repository and from market events through 1 November 2026.

**Evidence boundary.** This is a methodology and implementation specification. It does not certify trading profits, give current orders, or authorize autonomous trading. Historical figures from conversations are not live quotes. Forecasts may inform the owner; they never replace the owner's decision or risk limits.

---

## Contents

1. The central conclusion
2. What trading changed in our thinking
3. The evidence we have, and what is still missing
4. What external research adds
5. The rule for adding anything to Zobiris
6. The investigation loop
7. Verification before interpretation
8. Relative strength as a research question
9. The response to pressure
10. Derivatives and supply without false certainty
11. A separate investigation for stocks
12. Three investigations worked through
13. Forecast the event that matters
14. Regimes and change detection
15. Testing without teaching the model the answer
16. AI's special advantage and special failure mode
17. Memory and records
18. Data sources that are actually reachable
19. Research contracts A to F
20. Execution and the whole account
21. Test the method itself
22. Rejected and deferred ideas
23. Implementation order and current status
24. The operating directive
25. Sources

---

## 1. The central conclusion

AI trading analysis should start by investigating unexpected market behavior, using a fixed sequence of questions:

1. What is happening that our current explanation does not predict?
2. Which observation could settle that uncertainty?
3. What exactly are we forecasting, as of when, compared with what baseline, and how will it be scored?

The first two questions come from the Investigation Whitepaper. The third comes from the Forecasting Addendum.

**The priorities, in order:**

1. **Integrity:** the correct asset, data, timestamps and decision cutoff.
2. **The unresolved situation:** what we expected to happen versus what is happening.
3. **Telling explanations apart:** competing explanations and the cheapest test that separates them.
4. **Prediction:** a specific event, horizon, baseline and condition that would prove it wrong.
5. **Usefulness:** a better forecast, better trading economics or lower risk.
6. **Learning:** keep the outcome on record and update the belief it tested.

Novelty is valuable when it leads to a useful question. The system must still be able to recognize an ordinary situation, apply a simple proven rule, or conclude that no opportunity can be detected. Not every decision needs an exciting story behind it.

**What changes now:**

- The investigation protocol becomes the default way Zobiris analyzes markets.
- The addendum's inclusion rule decides what may be added to the system.
- Specific patterns, such as early leaders or selling being absorbed, stay research candidates until they qualify.

---

## 2. What trading changed in our thinking

The record shows a shift from hunting for promising coins to understanding situations. Some of the best ideas came from the owner noticing things a generic indicator report would miss:

- alts weakening while BTC barely moved;
- particular coins resisting a selloff;
- earlier recovery leaders showing up again.

These observations deserve investigation even when the first explanation fails.

| What we believed | What challenged it | What we believe now |
|---|---|---|
| The most oversold coin rebounds most | The flush and rotation tests failed after fees | Tell exhaustion apart from lasting weakness |
| A stable BTC rescues most alts | Laggards stayed weak; CAP moved on its own | Test each coin's own exposure and supply |
| Repeated support makes a floor | The $79,700 BTC floor failed (BTC reached about $76,150 on 30 Oct) | Define the defense *and* the event that breaks it |
| A strong coin is a good buy | CAP's leadership reversed; entry and horizon mattered | Choosing a coin and choosing an entry are separate decisions |
| A convincing forecast makes money | Fees, spreads, missed fills and adverse moves changed outcomes | Measure the net result you could actually have traded separately |
| More model or more indicators help | Model and feature tests didn't improve direction | Complexity must prove it adds value |
| Short-term direction can be read from momentum | Two scored 15- and 30-minute BTC calls on 31 Oct missed (Brier 0.30 and 0.29) while their ranges held | Forecast ranges and barriers; treat direction as a coin flip unless shown otherwise |

**Keep the ingenuity:**

- INJ and UNI were useful clues because they showed real strength against BTC in particular episodes. They inspire a test of recovery behavior; they are not a permanent favored pair.
- HYPE and XMR showed that broad weakness can coexist with demand for a specific coin.
- COMP showed the difference between spotting a move and getting a sensible entry.
- SOL showed the difference between adoption progress and near-term price support.

Failed forecasts are no reason to declare markets unknowable. A model that fails on direction may still help forecast volatility, spot fragile liquidity, rank resilient coins or improve exits. The task is to find out which of those jobs it actually does.

---

## 3. The evidence we have, and what is still missing

Version 1.0 could only report earlier results, because the registry, raw data and code had not been supplied. For this edition, the main results were **checked against the output files in the Zobiris repository** (`docs/research/`, `research/recovery_lab/results/`). They were read, not re-run.

| Result | Status in 2.0 | What still needs reproducing |
|---|---|---|
| Up/down direction: 0 of 21 checks beat the baseline. New 7-day highs: 8 survived multiple-testing correction; new lows: 9 | Checked against the repo output | Event definitions, target distances, test grouping, dependence between events |
| Kronos (an AI price-forecasting model): 9,640 forecasts on 15 coins, no direction skill, rejected | Checked against the repo output | Model version, input timing, comparison baseline |
| 20 BTC drops: alts lagged BTC by 1.69% after fees over 24h (interval −3.48% to −0.37%) | Checked against the repo output | Overlapping events, which coins qualified, how the interval was built |
| Coins nearest their 30-day high did better (holdout t = 3.45) | Checked against the repo output | All variants tried, controls, event clustering, an untouched holdout |
| 80 flush events: most-flushed fifth lagged BTC by 0.53% after maker fees over 6h | Checked against the repo output | Whether fills were feasible, selection timing, maker assumptions |
| BTC dip-bounce: +2.18% in development, −4.54% in validation, −0.24% in holdout | Checked against the repo output | Exact splits and strategy versions |
| Rotation screen: QUALIFIED minus NOT_LAGGING, −1.8% over 30 days; score correlation slightly negative | Checked against the repo output | Same as above |
| Funding rates didn't explain which alts rebounded (correlation +0.002) | Checked against the repo output | Liquidation and open-interest data were not available |
| Test registry: 47 entries | The file exists | Unchangeable timestamps (hashes or commit history) still need auditing |

**The forecast ledger (as of 1 Nov):**

| Forecaster | Scored | Hit rate | Average confidence | Brier score |
|---|---|---|---|---|
| Claude | 7 | 29% | 39% | 0.203 |
| Owner | 3 | 33% | 63% | 0.335 |
| Coin flip | — | — | 50% | 0.250 |

These samples are far too small to rank the forecasters. They do show that confident misses cost more than cautious ones. The proper baseline for each event is its prior-data base rate, not automatically 50%.

**Evidence labels for every future report:**

- **Observed:** directly supported by a timestamped source or measurement.
- **Inferred:** an explanation compatible with the observations.
- **Reported:** from an earlier document or a third party, not reproduced.
- **Checked:** compared with stored outputs, not re-run.
- **Tested:** evaluated from an accessible specification and its outputs.
- **Qualified:** passed the separately declared forecasting, economic and operational requirements.

Different observations, horizons, coins and event counts can't be pooled into one success percentage.

---

## 4. What external research adds

| Research | Finding, within its scope | What it means for Zobiris |
|---|---|---|
| Cont, Kukanov & Stoikov [R1] | In 50 US stocks, short-interval price changes tracked order-flow imbalance, with impact linked to book depth | Study pressure and the response to it. Explaining a move after the fact is not a trading edge. |
| Makarov & Schoar [R2] | Crypto exchanges are fragmented, with recurring price gaps between them | Check whether a divergence is market-wide or one exchange |
| Brunnermeier & Pedersen [R3] | Funding constraints and market liquidity can reinforce each other | Look for amplifiers; don't assume every fall is forced selling |
| Liu, Tsyvinski & Wu [R4] | Market, size and momentum factors explain crypto returns; momentum works over weeks | Relative strength is credible territory, but this doesn't validate a 15-minute rule |
| George & Hwang [R5] | Nearness to the 52-week high carries momentum information in stocks | Test distance from highs; don't copy stock horizons into crypto |
| Campbell & Shiller [R10] | Valuations link to expected dividends and discount rates | Stocks need a cash-flow framework alongside flow analysis |
| Crypto momentum studies [A11, A12] | Mixed: short-term reversal across the broad universe, persistence in some large-coin designs, and documented crash risk | Test relative strength as a bounded hypothesis with crash tests |

**Three distinctions that keep this honest:**

1. A paper describing how prices move *during* an interval doesn't necessarily forecast the *next* interval. The data that explains a completed move may only exist after it.
2. A profitable historical factor portfolio is not the same as a small, long-only account trading after real fees.
3. Evidence from another market or horizon is a reason to test, not a license to copy its numbers.

**Revised market view:** prices reflect changing expectations and the terms on which willing or forced participants can trade. The opportunity often lies in a *change of response*: the same apparent pressure starts producing a different outcome. That is our synthesis, not a proven theorem.

**What the last week added:**

- **Forced flows dominated the moves:**
  - About $1.5–1.7bn of liquidations on 30 Oct (several outlets; secondary).
  - A record $643.33M net outflow from spot BTC ETFs on 30 Oct (confirmed by two outlets citing SoSoValue).
  - A known overhang of stolen tokens after the Binance hack.
- **The market priced known sellers in advance:**
  - Several small coins whose supply the attacker holds in size hit all-time lows before any further selling: SOPH (33.9% of circulating supply), ERA (22.1%) and FUN (5.3%).
  - The attacker's FUN balance was unchanged.

---

## 5. The rule for adding anything to Zobiris

A method, feature, data source or control is added only when all five conditions hold:

1. **Credible source:** official exchange or data-provider documentation, a primary methods source, or recognized research.
2. **Precise question:** timestamp, target, horizon and information cutoff, as known at the time.
3. **Causal implementation:** auditable for leakage, provenance, revisions, missing data and format changes.
4. **Value over a simpler baseline:** tested with chronological or purged evaluation, and with realistic costs for any economic claim.
5. **Declared in advance:** a success criterion recorded in the research ledger, including every alternative tried and the status of the untouched holdout.

An addition is rejected or deferred if it relies on:

- labels assigned in hindsight;
- undocumented data availability;
- unmodeled execution;
- untracked choices made during the research;
- claims beyond the cited evidence.

Improvements to measurement and evaluation qualify even when they don't improve accuracy, because they reduce false discoveries and deployment risk.

---

## 6. The investigation loop

The unit of analysis is **asset + context + sequence + horizon + decision**.

- "RSI is low" leaves out almost all of that.
- "This coin has stopped making new lows during repeated BTC selling, across liquid exchanges, before the next hour begins" is a question that can be investigated.

| Step | What it must produce | Stop or redirect when |
|---|---|---|
| Set the expectation | A baseline using only information available beforehand | The expectation is hindsight |
| Detect the departure | Size, timing, persistence, measurement quality | The "anomaly" is stale data or trivial |
| Generate rivals | Two to four different explanations, including a data error | All explanations predict the same thing |
| Choose evidence | The observation that would change their ranking | More data wouldn't change any decision |
| Freeze the call | Event, deadline, basis, what would prove it wrong, comparison baseline | The evidence can't support a bounded call |
| Resolve and learn | Outcome, execution, counter-evidence, belief update | The record is incomplete: mark it unresolved |

**Before every data request, ask:** what uncertainty am I resolving, which observation would separate the explanations, and what would change if I had it?

For example, when a token rises against BTC, another oscillator adds little. Checking whether buyers also improved on a second exchange could separate real demand from one isolated quote.

**Every investigation ends with one of four products:**

1. a forecast;
2. a research test;
3. a risk or execution adjustment;
4. a justified finding that the evidence is insufficient, naming the exact obstacle.

"Anything could happen" is not a result.

---

## 7. Verification before interpretation

**Identity and clocks.**

- Record the instrument, contract or issuer, exchange, quote currency, product type and trading session. A shared ticker is not a shared identity.
- A futures signal and a spot order are related, but they are not the same market.
- Keep separate timestamps for the event, its publication, when we first saw it, when it entered our data and the decision. A later article about an earlier event can't be treated as known at the earlier time.

**Example from this week.** A wallet address we were given as "the hacker" turned out to be **jaredfromsubway.eth**, a well-known automated "sandwich" trading bot that holds no inventory. Checking the identity on Etherscan prevented a wrong conclusion.

**Provenance (from the addendum).** Every external observation keeps:

- publisher, endpoint and retrieval time;
- release or availability time and the period it covers;
- value, the original string and its unit;
- transformation, time zone and revision vintage;
- parser version, checksum and quality flags.

Two further rules:

- **Revisions:** keep an as-known-then view separate from the latest revised view. FRED release dates are not guaranteed availability times, so use a conservative cutoff.
- **Surprises:** a macro "surprise" requires a recorded pre-release expectation. Without one, the value is only a level or a change.

**Data quality can itself explain the anomaly.** Check for:

- stale last trades;
- thin order books;
- mismatched candles;
- stablecoin quote moves;
- splits and dividends;
- token migrations;
- changed circulating supply.

Missing observations must never become zeros or confident neutral signals.

**A resolved source conflict.** Version 1.0 treated the Binance incident as provisional because a direct retrieval redirected. By 1 November, several independent sources agreed on its outline:

- Binance's own statements, as reported by several outlets;
- the attacker entity tracked by Arkham;
- on-chain holdings;
- ETF flow data.

Details still vary by source: about $6.3bn stolen, about $2.8–3bn frozen, and about 90% replenished according to Binance. Repeated articles quoting one statement still count as one source.

**Stocks:** SEC filings and their structured data (XBRL) are primary records, but a reporting-period date is not an availability date. Save the retrieved filing and its retrieval time, and never use a later restatement in an earlier forecast.

**Kraken's limits:** its OHLC endpoint returns at most 720 recent candles, including the current unfinished one. Its archives omit intervals with no trades, and those must not be confused with gaps in the feed.

---

## 8. Relative strength as a research question

"Up while BTC is down" is an observation with several possible explanations:

- low sensitivity to BTC;
- new demand for the coin itself;
- a sector move;
- a stale quote hiding a decline;
- futures moving before spot.

Each implies a different next outcome.

**Measure the departure against the coin's own expectation.** Excess return = actual return − the return predicted by an exposure model fitted only on earlier data (BTC for crypto, plus a justified sector factor; the market plus the sector for stocks). Use the same interval for every asset, and report how unstable the exposure estimate is. An excess return is a statistical description, not proof of independent buying and not proof of a hedge.

**Example from this week:**

- Over 30 days, CAP's hourly correlation with BTC was −0.06. But its hourly volatility was 3.09% against BTC's 0.35%, about 9 times higher, and it fell 39% between 25 and 28 Oct.
- XMR's correlation was 0.29, and it fell about half as much as BTC in hours when BTC fell.
- **Moving independently of BTC is not the same as hedging it.**

| Observation | Rival explanation | Evidence that separates them |
|---|---|---|
| XMR resists a BTC decline | It just had lower BTC exposure | Excess return against its prior sensitivity |
| A token jumps on one exchange | Thin liquidity or a stale comparison | Fresh synchronized quotes and executable spreads |
| Former leaders improve first | A sector rally or repeated high-beta behavior | Controls for sector, beta, volatility and momentum |
| A coin sits high in its daily range | The range is narrow or the low is stale | Range width, quote freshness, volume |

**Keep three output layers:**

1. **Selection:** which coins show unusual strength?
2. **Entry:** can a realistic entry avoid giving away the benefit?
3. **Risk:** how does the coin change the portfolio's exposure?

**Status of the research family (from the addendum):**

- Test BTC-relative strength over 7, 30 and 90 days, with forward horizons of 1, 7 and 30 days.
- Use point-in-time age, size, liquidity and tradability screens.
- Evaluate equal-weighted and liquidity-weighted versions separately, with turnover and worst-period reporting.
- Distance from highs is the strongest result in the repository (holdout t = 3.45), but it stays exploratory until it adds value beyond ordinary momentum and volatility.

---

## 9. The response to pressure

A promising question: **when does heavy selling stop producing big drops?** A changing response may reveal a turn earlier than a lagging trend indicator. It may also be noise.

**What to measure:**

- executed aggressive selling;
- changes in bid and ask depth;
- the spread;
- order additions and cancellations;
- the price response that follows.

Total candle volume does not identify aggressive sellers. Compare episodes matched on size, starting depth, spread, volatility and session. Then ask whether the current downside is unusually small *relative to expected impact estimated from earlier data*.

| Sequence | Possible meaning | What would weaken it |
|---|---|---|
| Selling continues, bids refill, price holds | Supply being absorbed | Refills stop and the next selling wave breaks price |
| Modest selling, bids vanish, price falls hard | Fragile liquidity | The effect disappears after controlling for starting depth |
| Buying continues, asks refill, little advance | A supply overhang | Offers clear and the price rise holds across exchanges |
| A short burst moves price, then fully reverses | Temporary displacement | Follow-through survives the burst |

**What order-book data can't certify:**

- Aggregated depth (L2) doesn't reveal intent, hidden inventory or queue position.
- Kraken's checksum verifies that the book is consistent, not why it changed.
- Capture snapshots and updates, verify checksums, mark gaps and restart invalid books.
- Historical candles can't recreate a historical order book.

**Observed this week:** XMR's book showed a sell wall at about $595.6–596.7 that later moved down to $595.38, while buyers built a floor of about 155 XMR at $588.5–589.3. Price stayed between the two levels. Large weekend orders move, so this is a snapshot, not evidence of absorption.

---

## 10. Derivatives and supply without false certainty

**Check the units before telling the story.** An earlier CAP account read "price down about 17.9%, open interest down about 18%" as a flush of leveraged longs. But if both figures measure dollar open interest over the same interval, the quantity of contracts barely changed: 0.82 / 0.821 = 0.9988, a decline of only about 0.12%. Almost all of the "decline" in open interest could just be the lower price.

**The 31 Oct CoinGlass data fit that correction:**

- CAP's 24-hour liquidations were only $37.8K: $30.8K of shorts and $7K of longs.
- Futures open interest was $36.4M, which is 27% of its market cap.
- Futures money was flowing out (−$517K over 8 hours) while spot buyers were still adding (+$101K).

The rally was led by spot buying, not a squeeze, and the heavy leverage made it fragile.

Even a genuine fall in contract quantity doesn't show which side closed: every contract has a long and a short. Back any liquidation story with exchange liquidation records, trade direction, basis, funding and the spot response.

| Combination | Competing explanations | Next useful measurement |
|---|---|---|
| Price falls, contract quantity falls | Positions closed, liquidations, hedges removed | Liquidation records, spot response |
| Price rises, open interest rises | New risk, hedged activity, leveraged bets | Spot participation, basis, persistence |
| Futures lead, spot barely moves | Temporary leverage demand, or information arriving | Synchronized exchange sequence |
| Funding is elevated | Demand for carry, or crowded exposure | Funding interval, realized payments, unwind |

**Positioning maps show where the fuel is, not which way price goes.**

- On 31 Oct, Hyperliquid showed about $197M of long positions within 5% below the price against $61M of shorts above, with the largest cluster at $75.1–76.2k.
- Its most profitable wallets were heavily short BTC and SOL while ordinary traders were long. But large profitable wallets are often market makers hedging, so this is not a direction signal.
- Never label a liquidation heatmap as observed orders without documenting how it is built.

**Supply is a sequence, not a headline:** scheduled eligibility → actual release → wallet transfer → exchange deposit → executed sale. A deposit suggests intent to sell; it doesn't prove a sale. An expected overhang can hit other holders before the source sells anything. FUN on 31 Oct showed this: the pool fell 48% in six hours while the attacker's balance stayed at 580.77M FUN.

---

## 11. A separate investigation for stocks

Stocks need a view of the business and of the expectations built into the price. Liquidity explains part of how prices move trade by trade; it doesn't replace analysis of cash flows, financing, dilution or discount rates.

| Investigation | Main inputs | Decision it improves |
|---|---|---|
| Business change | Filings, segments, guidance, how profit turns into cash | Whether the long-term thesis got stronger |
| Expectations built into the price | Reverse DCF, margins, reinvestment, discount rate | Whether the price requires an implausible path |
| Event response | Exact release time, liquid-session prices, market and sector | Whether weakness is company-specific or shared |
| Supply and demand | Share issuance, lockups, index changes, borrow costs | Whether predictable trading should change timing |
| Entry and exposure | Spreads, liquidity, position overlap, event gaps | Enter, wait, trim or investigate further |

- **What the price already assumes** (reverse DCF, 9% discount rate): about 9.5% a year of free-cash-flow growth for MSFT, 10% for TSM, and about 15% for NVDA, which is demanding.
- **Valuation describes what is fragile, not when it breaks.** The 30 Oct AI sell-off fits the finding that the cushion in AI valuations was thin, but valuation could not have timed it.
- **Defensive history is a starting point.** Past resilience in CB or BRK.B starts a stress analysis; it doesn't guarantee protection.
- **Earnings surprises need a dated consensus.** Without an archived pre-release consensus, don't call a result a measured surprise.

---

## 12. Three investigations worked through

### CAP: a strong token turns weak while BTC stabilizes

**The rivals:**

- **A, leverage closing:** predicts large verified long liquidations and a falling quantity-adjusted open interest.
- **B, supply or demand deteriorating:** predicts supply events or persistent spot selling.
- **C, a measurement or exchange effect:** predicts inconsistent timing or a local price gap.

**Update:** CoinGlass data weaken A. Liquidations were tiny, and the open-interest change is mostly price. B and C remain open. CAP's unlock overhang is real (84% of supply is not yet circulating), and its cUSD deposits are reported down 27% from August.

**Bounded test:** after a pre-declared transition in how CAP responds to pressure, forecast the next six hours of excess return and maximum adverse move, scored against a momentum-and-volatility baseline. No current CAP trade follows from this example.

### A stock falls after a headline earnings beat

On 30 Oct, Intel fell about 29% and the Nasdaq-100 fell 3.5%, with commentators describing a "beat" that lost a third of its value. Details are secondary-source and unverified.

**The rivals:**

- **A:** expectations were higher than the headline suggested. Check dated consensus and guidance.
- **B:** the whole sector repriced. Compare with market and sector returns.
- **C:** temporary trading pressure. Look for normalization.

**What separates them:** if the weakness relative to the market persists into the next liquid session while expected cash flows worsen, temporary displacement loses support.

### FUN: a known overhang

**The observation:** the pool price fell 48% in six hours on 31 Oct.

**The rivals:**

- **A:** the attacker is selling again.
- **B:** other holders are getting out ahead of the attacker.
- **C:** the pool is catching down to other exchanges' prices.

**What separated them:** the attacker's FUN balance (unchanged at 580.77M) ruled out A. The remaining question is B versus C, which needs a comparison with other exchanges' prices over time. One wallet lookup changed the conclusion more than any chart would have.

---

## 13. Forecast the event that matters

Keep separate scorecards. A high touch rate presented as a high chance of profit is misleading.

| Forecast | What exactly happens | How to score it |
|---|---|---|
| Direction | The close at exactly horizon H is above a reference | Brier or log loss vs the prior-data base rate |
| Triple barrier | Upper barrier, lower barrier or deadline: whichever comes first | Probability score; record t0, t1, distances, the tie rule |
| Relative strength | The coin beats a benchmark over the same interval | Excess return, rank or event probability |
| Risk | Decline, adverse move or range exceeds a threshold | Interval score, coverage, severity |
| Execution | A specified order fills under stated rules | Fill rate, partial fills, delay, slippage |
| Economic | Net payoff under frozen entry and exit rules | Net return, uncertainty, drawdown |

**Triple-barrier labels (from the addendum).** When the real question is "which level is reached first", a first-touch label fits better than the sign of the return at a fixed time. That is support for the method, not proof it gives better crypto accuracy. Two rules:

- Barriers scaled to volatility must use only past data.
- If one candle touches both barriers, use finer data or a tie rule fixed in advance; otherwise mark the label ambiguous.

**A mathematical illustration, not a market forecast.** For a price with no drift, the chance of *touching* a barrier one standard deviation away before time T is about 31.7%. The chance of *finishing* beyond it is about 15.9%. Both follow from a model with no directional edge. So touching and closing are different tasks, and a target hit after the stop is not a winning trade.

**Calibration (from the addendum):**

- Keep raw and calibrated probabilities.
- Report reliability diagrams with counts and uncertainty, log loss, Brier score, mean forecast against the observed rate, and calibration-in-the-large.
- Fit any calibrator only on data independent of the model fit, using the same purge rules.
- Sigmoid calibration is more constrained; isotonic is more flexible but can overfit. Choose before the final test.
- Monitor calibration over time, because drift makes a fixed calibrator stale.
- A subjective probability is allowed if it is labeled as judgment and scored later. Never turn a 48-hour touch rate into a 6-hour fill probability.

**Prediction markets are the baseline to beat.** Polymarket moved a $76k BTC dip from 64% to 25% within a day, and by 1 Nov priced both an $80k touch (79.5%) and a $75k dip (69%) in November. A Zobiris forecast deserves action only if it beats such odds on the same events.

---

## 14. Regimes and change detection

**Accepted as a benchmark, not as truth (from the addendum):**

- Use a two-state Markov-switching model with **filtered** probabilities only, the ones computable in real time. Never use smoothed probabilities, which use future data.
- Add Bayesian online changepoint detection as a separate alarm, with its settings fixed in advance and its delay and false-alarm trade-off measured.
- Compare volatility models (state-specific, EWMA/GARCH, constant) using rolling-origin losses, and keep complexity only if the gains are material and stable.
- Start with two states, a minimum persistence and a cooldown on alarms.
- State probabilities are inputs. Hidden states are statistical constructs, not confirmed economic regimes.

---

## 15. Testing without teaching the model the answer

Discovery can be adaptive; final evaluation must respect the decisions made during discovery. A threshold changed after a failure creates a new hypothesis version; it doesn't erase the failed attempt.

**Splits:**

- Use development folds, then a later locked validation period, then one untouched final holdout in time order.
- Purge every training event whose label interval overlaps the evaluation period.
- Add an embargo sized from the longest forward dependence: label horizon, feature lookback, publication delay and execution window. There is no universal percentage.
- Generic time-series splitters keep the order but don't purge.

**Reject a run automatically if:**

- training timestamps are not strictly earlier;
- any feature is newer than its cutoff;
- overlapping labels were not purged;
- the embargo is missing or too short;
- any preprocessing, selection, tuning or calibration saw future folds;
- correlated records cross folds;
- the final holdout was touched before the gate was locked.

**Dependence:** many coins hit by one BTC shock are not independent events. Use block or event-level uncertainty, and record every variant tried under one research family. Harvey, Liu & Zhu show why searching many factors needs stronger evidence. The Deflated Sharpe Ratio and the probability of backtest overfitting can be used with thresholds declared locally, because no source gives a universal cutoff. Dwork and colleagues show that reusing a holdout overfits it; renaming a dataset "holdout" does nothing.

**Promotion requires:**

- a pre-declared minimum improvement;
- an uncertainty method;
- a multiple-testing policy;
- a cost stress test;
- a stopping rule;
- a locked validation decision;
- one untouched holdout;
- a second review, recorded as an immutable promotion or rejection event.

Rejected ideas stay searchable with their failure reasons.

---

## 16. AI's special advantage and special failure mode

AI helps generate rival explanations, extract claims from filings, find comparable episodes, draft tests and catch contradictions. Its value is measured by better questions and decisions, not by how many plausible stories it can produce.

**Leakage risk.** Pretrained language models can carry future information into supposedly historical analysis [R9]. Role-playing an old trading day is not clean evidence. Some chronologically consistent models showed modest leakage in specific tasks [R12], so the risk depends on the model and the use.

**The practical rule:** freeze the model and the prompt, issue forecasts now and resolve them later. That is exactly what the Zobiris call ledger does.

| Part | Responsibility |
|---|---|
| Language model | Questions, rival hypotheses, document extraction, synthesis |
| Deterministic code | Returns, timestamps, open-interest conversions, costs, scoring |
| Versioned research store | Raw evidence, history, specifications, forecasts, outcomes |
| Controlled evaluation | Tests on later data, baselines, uncertainty |
| The human | Objectives, risk limits, authority to trade |

**This week's AI errors, kept on record:**

- mislabeling CAP's sector;
- saying "no real threat" to XMR at $570 the day after it reached $572.49;
- a squeeze story that the liquidation data contradicted;
- overreading the most profitable wallets' shorts;
- assuming a bot's wallet was the hacker's.

Each was caught by a primary-data check. The strongest AI result may be faster rejection of a false mechanism.

---

## 17. Memory and records

Store each episode with its original information cutoff, not just a later summary. A retrospective explanation can generate a hypothesis; it can't count as evidence that the hypothesis predicted its own discovery example.

**Episode record:**

| Group | Fields |
|---|---|
| Identity | Episode ID, asset ID, instrument, exchange, eligible universe |
| Time | Event, publication, first seen, ingestion, decision, resolution |
| Context | Session, market state, volatility, spread, exposure |
| Observation | Expected behavior, anomaly, sequence, quality flags |
| Explanation | Leading account, rivals, support, contradictions, missing evidence |
| Test | Version, trigger, outcome, horizon, baseline, what would prove it wrong |
| Decision | Forecast, probability type, action, execution and risk assumptions |
| Resolution | Outcome, adverse move, fills, costs, errors, belief update |
| Provenance | Raw-data hash, source URL, code, prompt and model version |

**Forecast, feature and execution records (from the addendum):**

- **Forecast row:** `forecast_id`, entity, exchange, product, `forecast_time`, `information_cutoff`, label type, `t0`/`t1`, target version, horizon, barriers, tie rule, raw and calibrated probability, calibrator, model and feature-set versions.
- **Feature row:** name and version, value and original string, unit, transform, publisher, endpoint, observation, release and retrieval times, availability cutoff, vintage and revision link, missing/estimated/imputed flags, payload checksum.
- **Execution row:** order intent, book snapshot and sequence, spread, levels used, VWAP from walking the book against the mid, fee version, fill probability, filled quantity, partial-fill flag, acknowledgement, fill and cancel times, fallback, implementation shortfall, missed-opportunity flag.

**Rules for the records:**

- **Retrieve by situation, before the outcome.** Match past episodes on what was observable at their decision time, and include failures and non-events. "Leadership memory" is a candidate feature; if current momentum, beta and volatility explain it, keep the simpler feature.
- **Learn without rewriting history.** Records are append-only. Keep unfilled orders, missed signals, rejected candidates and data outages.
- **Five entries after every resolution:** what was expected, what happened, where they differed, which belief changes, and the next test.

---

## 18. Data sources that are actually reachable

The addendum ranked Binance's public feeds first. **That needs revising.** From this research environment:

- Binance futures returned "restricted location" (HTTP 451).
- Bybit was blocked by country (403).
- Direct requests to OKX, Gate, MEXC, Bitget, CoinGecko, DexScreener, public Ethereum RPC endpoints and Kalshi were refused by the environment's network proxy.
- CoinDesk's monthly quota was exhausted.

Binance.com and Bybit also exclude US users. So the stack must lead with sources that are both legally and technically reachable.

| Priority | Source | Use | Note |
|---|---|---|---|
| 1 | Kraken spot (REST, WebSocket) | Prices, trades, order book, checksums | Works; 720-candle limit; use archives for history |
| 2 | Coinbase Exchange (public) | Independent spot check, level-2/3 order data | To be verified from this environment |
| 3 | Hyperliquid via Coinversa | Positioning, liquidation maps, open interest | Works; positioning shows fuel, not direction |
| 4 | CoinGlass pages | Exchange open interest, liquidations, long/short, flows | Reachable by scraping; document how numbers are built |
| 5 | CoinGecko / CoinMarketCap | Supply, market cap, volume, metadata | Via connector or scraper; record the timestamp |
| 6 | Polymarket gamma API | Crowd odds baseline | Works through the scraper |
| 7 | Arkham, Etherscan | Wallet identity and balances | Verify labels; check identity before telling a story |
| 8 | FRED/ALFRED, Treasury, FOMC/BLS/BEA calendars | Macro levels, vintages, release times | Keep vintages; no expectation recorded means no "surprise" |
| 9 | SEC EDGAR / XBRL, Yahoo | Filings, prices, fundamentals | Availability time is not the period date |
| Deferred | Binance, Bybit, OKX, Kalshi, CoinCap | Derivatives depth, event odds | Only where legally and technically accessible |

**Collector rules:**

- Use WebSocket for live capture and REST for bootstrapping and repairing gaps.
- Store raw payloads, sequence numbers, event and receive times, gap events, status codes, rate-limit headers and the parser version.
- Never fill missing data with zeros.
- Standardize symbol, exchange, product, contract unit, quote and settlement assets, funding interval and time zone before building features.

---

## 19. Research contracts A to F

These are proposed specifications, not validated strategies. Freeze all parameters, power targets and the eligible sample before any decisive evaluation.

**A. Relationship inversion.** Does unexpected strength during BTC weakness predict continued relative performance?
- **Trigger:** BTC's 15-minute return in the bottom tenth of its 60-day history, while the coin's excess return (beta from the prior 30 days) is in its top tenth.
- **Outcome:** coin minus BTC over the next 4 hours, entering at the next executable quote. One event per coin per 4 hours.
- **Comparisons:** matched shocks; momentum, volatility and spread; and simply choosing the strongest raw-return coins.
- **Fails if:** there is no improvement on later data, the result depends on one episode, or it can't be executed.

**B. Early leadership before a BTC recovery.** Do some coins strengthen before BTC turns?
- **Signal:** the breadth of positive excess momentum during a pre-declared BTC weakness state.
- **Outcome:** BTC's next completed 1-hour return is positive, scored against a model that uses BTC data only.
- **Timing:** enforce a delay between signal and decision, and report false alarms and usable lead time.

**C. Pressure-response transition.** Does a smaller-than-expected drop under heavy selling predict a recovery?
- **Data:** verified order-book updates and trades (BTC, SOL and a few liquid markets).
- **Trigger:** aggressive selling in the top quarter of its history, combined with impact in the bottom quarter after adjusting for depth, spread and volatility.
- **Outcome:** the 30-minute mid-price move against matched episodes; executable results reported separately.

**D. Spot and derivatives disagreement.**
- **Classify** episodes by whether spot or futures leads, and whether contract quantity is growing or shrinking.
- **Outcome:** the next 1-hour return, plus range as a separate outcome.
- **Fails if:** open-interest units can't be reconciled or one exchange drives the effect. If only range survives, report a volatility model.

**E. Leadership memory.**
- **Rank** coins by their excess responses in earlier recoveries, shrunk toward the average where history is sparse.
- **Outcome:** the next 4 hours of excess return, compared with current momentum, distance from highs, liquidity and beta.
- **Proof against it:** memory adds nothing once current characteristics are included. That would mean the INJ/UNI observation reflected current strength, not remembered identity.

**F. Equity expectation failure.**
- **Data:** earnings events from a point-in-time liquid universe, with archived pre-release consensus where available, guidance and the first full liquid-session response.
- **Outcome:** the next 5 sessions of sector-adjusted return, compared with surprise, guidance, momentum and size.
- **If no dated consensus exists:** narrow the question and drop the surprise claims.

Don't optimize all six at once on the same small sample.

---

## 20. Execution and the whole account

Forecast skill, order quality and portfolio benefit are separate. Each investigation must say which one it is trying to improve.

**Model the order that could actually exist:**

- Specify type, arrival time, size, price, expiry, partial fills and cancellations.
- A candle touching a price shows a fill was *possible*, not that it happened.
- For market orders, walk the book to get the volume-weighted price. For passive orders, estimate fill probability from distance, the visible queue, aggressive volume, cancellations and volatility.
- Aggregated depth can't reveal queue position, so be conservative.
- Report fill rate, partial fills, implementation shortfall and missed opportunities.

**Net payoff includes** fees, spread crossing, slippage, funding or borrow costs, and real exit behavior. Example: a 0.60% gross round trip with 0.80% in fees is about −0.20% before other frictions. The repository's first ledger booked about 14.5% for a small-cap round trip, against real Kraken spreads of 0.03–0.36%. That one setting turned every signal into a loss until a single measured cost schedule replaced it.

**Lessons from this weekend's order plan:**

1. Many of the take-profit levels were set at the owner's cost basis, not where the market trades. Their 48-hour fill odds were about 0–9%.
2. The planned $509 of proceeds depended on several unfilled limit orders. Expected proceeds are not available cash.
3. A stop and a take-profit can't both reserve the same coins unless the exchange links them. On Kraken, a take-profit or stop-loss attached to an order usually becomes a conditional close: an opposite-side order placed after the first fills. Attached to a sell, it could set up a buy-back.
4. A review deadline (Sunday, before CME futures reopen) prevents drift, but it doesn't protect against price falls.

**The whole account.** A 34% stock allocation falling 70% loses 23.8% of the account, which leaves almost no room within the 24% loss limit. That is stress arithmetic, not a cap. Include crypto and other correlated holdings that share the account; the owner's crypto account was about 78% crypto on 31 Oct. A near-zero correlation over a short period does not establish crash protection. Risk limits stay fixed while research proceeds: discovery changes beliefs, never authority.

---

## 21. Test the method itself

The investigation process must meet the standard it imposes on signals. It could produce richer stories without better decisions.

**A prospective comparison:**

- At fixed times, give the same timestamped evidence packet to two workflows: a simple indicator-and-context report, and the investigation protocol.
- Use the same model, retrieval budget and forecast targets for both.
- Archive both outputs before the outcome is known.
- Include quiet periods and non-events.

| Dimension | Measure |
|---|---|
| Evidence integrity | Unsupported claims, wrong units, stale data, timing errors |
| Forecasting | Paired Brier differences against the same baseline |
| Selection | Benchmark-adjusted results of the ranked candidates |
| Risk | Adverse-move forecasts, missed failure conditions |
| Execution | Net simulated outcomes under identical fill and cost rules |
| Efficiency | Retrieval cost and useful belief updates per episode |

**Rules for the comparison:**

- Choose one primary endpoint, for example the paired Brier improvement on a fixed 4-hour event.
- Report coverage, so that declining to forecast hard cases can't inflate accuracy.
- A 30-day pilot is an engineering milestone, not statistical sufficiency.

**Success** means fewer factual errors and better forward-looking decisions at acceptable cost. **An informative failure** means more elaborate stories with no gain; then simplify the workflow.

---

## 22. Rejected and deferred ideas

| Idea | Decision | Reason |
|---|---|---|
| Directional narratives as evidence | Reject | A narrative is not a defined, scored event |
| Triple-barrier labels or event sampling as universally better | Defer | They clarify the question; they don't prove accuracy |
| Random K-fold, unpurged calibration, smoothed regimes | Reject | They leak future information |
| Automatic adoption of regime models or changepoint alarms | Defer | Must beat simple baselines across rolling origins |
| Unconditional BTC-relative momentum strategy | Defer | Evidence is conditional and includes reversals and crashes |
| Distance from highs as an established predictor | Defer | Strongest repository result, still exploratory |
| Mid-price or full-fill backtests | Reject | They ignore spread, depth, partial fills and missed fills |
| Queue position inferred from aggregated depth | Reject | The data can't reveal it |
| One generic API quota, or silent filling of missing data | Reject | Limits vary by endpoint; keep missing data visible |
| A macro "surprise" without an expectation snapshot | Reject | The surprise can't be measured |
| A universal Sharpe, t-statistic or overfitting cutoff | Reject | Gates are set locally and in advance |
| Buying the flush | Reject (tested) | −0.53% after maker fees at 6 hours; interval below zero |
| The rotation score as a ranking for new money | Reject (tested) | Failed its registered test; correlation leaned negative |
| "Fast recoverers lead" | Reject (tested) | Past recovery speed didn't predict the next |
| Funding level as the rebound driver | Reject (tested) | Correlation +0.002 |
| Autonomous trading because forecasts look good | Reject | Forecast quality doesn't grant economic fitness or authority |

---

## 23. Implementation order and current status

Status markers: **■** exists in the repository · **◐** partial · **□** not started · **?** not yet verified.

| Phase | Deliverable | Status |
|---|---|---|
| 0. Governance | Research ledger, test registry, Brier scoring, single cost schedule | ◐ The ledger, 47-entry registry, cost schedule and call scoring exist. Immutable hashes and a split-audit test suite are still needed. |
| 1. Causal baseline data | Kraken capture with a second spot source; raw payloads and gap metadata; price-and-volume baseline; no-trade benchmark | ◐ Kraken pulls exist; raw archiving and the second source are not done |
| 2. Targets and evaluation | Fixed-horizon and triple-barrier event table; purged and embargoed folds; reliability diagrams; untouched holdout | ◐ Event studies use holdouts; purging, embargo and the event table: ? |
| 3. Provenance and macro | Vintage-aware FRED/ALFRED; expectation snapshots; availability cutoffs | □ |
| 4. Probability and state | Fold-safe calibration; filtered two-state regime model; changepoint alarm | □ |
| 5. Cross-sectional hypotheses | BTC-relative strength family with point-in-time screens; contracts A, B and E | ◐ Panel and event studies exist; frozen contracts do not |
| 6. Execution realism | Book-walk VWAP, fill and partial-fill simulator, reservation accounting | □ (the measured Kraken half-spread cost is ■) |
| 7. Pressure and derivatives data | Small order-book capture with checksums (contract C); reconciled open-interest units (D) | □ |
| 8. Method evaluation | Paired forward comparison of the two workflows | □ |
| 9. Decision-support release | Locked candidate with an evidence pack and monitoring | □ No autonomous trading by default |

**Infrastructure follows the question.** The existing Node and SQLite stack can hold a modest ledger. High-frequency order-book capture needs separate sizing. Deterministic jobs validate and score; the AI reads bounded evidence packets and writes structured records. Halt only the analyses that need a failed feed.

**Source hierarchy:**

- stocks: filings and issuer releases;
- exchange mechanics: official API documentation;
- on-chain claims: exact transactions and verified identities;
- methods: original research.

News can raise questions; causal claims need their own evidence.

---

## 24. The operating directive

**Default instruction for Zobiris market analysis:**

1. **Start with the decision.** Begin with the owner's decision and horizon, and resolve the asset's identity and the information cutoff.
2. **State the gap.** Say what would ordinarily be expected and what is actually happening. If there is no meaningful anomaly, say so and use the baseline.
3. **Generate rivals.** For a material departure, propose a few genuinely different explanations, including measurement or selection error. Name what supports each, what contradicts it, and which observation would separate them.
4. **Measure with purpose.** Choose measurements because they answer that question. Use indicators, valuation, news, derivatives and order-book data when relevant, never as an automatic checklist.
5. **Compare fairly.** Retrieve comparable past situations using only what was knowable at their decision time, including failures and non-events.
6. **Make a bounded call:** event, horizon, evidence, strongest rival, what would prove it wrong, and how it resolves. Label subjective probabilities. Keep direction, relative strength, barrier touches, fill probability and net payoff separate.
7. **Keep the records:** provenance, timestamps, units, and model and code versions. Resolve the forecast, update the belief, and report errors directly.

**A compact report for the owner:**

1. **Distinctive now:** one situation-specific observation.
2. **Best explanation and rival:** why each fits, and the unresolved contradiction.
3. **Next discriminator:** the observation that would change the assessment.
4. **Bounded outlook:** event, horizon, invalidation, and the basis for confidence.
5. **Decision value:** what this changes for selection, entry, exit or risk, if anything.
6. **What we learned:** the explicit update since the last report.

**Novelty earns investigation; later evidence decides reliance.** Seek the unusual, test the explanation, score the forecast, and become more precise about what should happen next.

---

## 25. Sources

**Internal sources**
- **[I1]** Zobiris Synthesis Whitepaper (1 Nov 2026) and the Zobiris whitepaper "What Zobiris Taught Us About How Markets Move" (1 Nov 2026).
- **[I2]** Zobiris: Anomaly-Driven Market Discovery and Learning Protocol (supplied text).
- **[I3]** Conversation history, including the CAP and XMR analyses, order plans and scored calls, 29 Oct to 1 Nov.
- **[I4]** Zobiris repository, branch `claude/optimistic-gauss-7g9579`:
  - `docs/research/` (event studies, rotation replay, panel study, live engine review, registry);
  - `research/recovery_lab/results/`;
  - `docs/market-memory/` (daily notes, call ledger).

**Market structure and evaluation**
- **[R1]** Cont, Kukanov & Stoikov (2014), "The Price Impact of Order Book Events," *J. Financial Econometrics* 12(1).
- **[R2]** Makarov & Schoar (2020), "Trading and Arbitrage in Cryptocurrency Markets," *JFE* 135(2).
- **[R3]** Brunnermeier & Pedersen (2009), "Market Liquidity and Funding Liquidity," *RFS* 22(6).
- **[R4]** Liu, Tsyvinski & Wu (2022), "Common Risk Factors in Cryptocurrency," *J. Finance* 77(2).
- **[R5]** George & Hwang (2004), "The 52-Week High and Momentum Investing," *J. Finance* 59(5).
- **[R6]** Harvey, Liu & Zhu (2016), "…and the Cross-Section of Expected Returns," *RFS* 29(1).
- **[R7]** Bailey & López de Prado (2014), "The Deflated Sharpe Ratio," *JPM* 40(5).
- **[R8]** Dwork et al. (2015), "The reusable holdout," *Science* 349(6248).

**AI and valuation**
- **[R9]** Sarkar & Vafa (2024), "Lookahead Bias in Pretrained Language Models," working paper.
- **[R10]** Campbell & Shiller (1988), "The Dividend-Price Ratio and Expectations…," *RFS* 1(3).
- **[R11]** Gneiting & Raftery (2007), "Strictly Proper Scoring Rules, Prediction, and Estimation," *JASA* 102(477).
- **[R12]** He, Lv, Manela & Wu (2026), "Chronologically consistent large language models," *JFE* 185.

**Official data documentation**
- **[R13–R15]** Kraken: OHLC API, WebSocket book checksum v2, historical OHLCVT data.
- **[R16–R17]** SEC: EDGAR APIs; Webmaster FAQ on timestamps.
- **[R18]** Binance, "Security Incident Update #2 (2026-10-30)," support page (originally a qualified retrieval; outline now corroborated by several outlets).

**Forecasting addendum references**
- **[A1–A3]** López de Prado: lecture material on purging and embargoing, and triple-barrier labeling; scikit-learn probability calibration.
- **[A5]** Hamilton (1989), Markov-switching model.
- **[A6]** Adams & MacKay (2007), Bayesian online changepoint detection.
- **[A7]** Regime-switching GARCH volatility studies.
- **[A8]** scikit-learn TimeSeriesSplit.
- **[A10–A12]** Cryptocurrency momentum; the cross-section of cryptocurrency returns; crypto momentum and crashes.
- **[A13–A15]** Kraken WebSocket v2 book; level-3 market data; queue-reactive limit-order-book models.
- **[A16–A18]** FRED API, ALFRED, FRED release dates.
- **[A19–A31]** Exchange API documentation: Binance, Coinbase, Kraken, OKX, Bybit.
- **[A32–A38]** CoinGecko, CoinPaprika, DefiLlama documentation.
- **[A39–A43]** Treasury rates and yield-curve methodology; FOMC, BLS and BEA calendars.
- **[A45–A47]** Probability of backtest overfitting (two papers); CoinCap documentation.

**Market events cited, all secondary**
- ETF flows: cryptotimes.io and Investing.com (citing SoSoValue), 31 Oct–1 Nov 2026.
- Attacker holdings: Arkham, "Binance Hacker" entity page, 31 Oct 2026.
- CAP derivatives: CoinGlass CAP page, 31 Oct 2026.
- Positioning: Coinversa (Hyperliquid), 31 Oct 2026.
- Crowd odds: Polymarket gamma API, 30 Oct–1 Nov 2026.
- Stock market moves: Reuters, Seeking Alpha and Yahoo Finance coverage of the 30 Oct session.

*This edition is a synthesis and specification. Repository results were checked against stored outputs, not re-run. No new trading dataset was analyzed for this document, and nothing in it is an order or a recommendation to trade.*
