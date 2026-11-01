# What Zobiris Taught Us About How Markets Move

**A research whitepaper, 1 November 2026**
Covers early October to 1 November 2026. Research only: nothing here authorizes a trade.

---

## Abstract

Zobiris began as a crypto research app that tried to call which coins would recover after a sell-off. It ran event studies on exchange data, registered its tests before seeing the results, scored every call with a probability and charged realistic fees.

Three conclusions survived:

1. **Direction is close to unpredictable over hours and days. Levels are not.** Whether a coin will test its weekly high or low can be forecast; whether it will close up or down could not.
2. **Prices move where forced money must go:** liquidations, stolen supply, unlocks, delistings. News and narratives mostly arrive afterwards to explain the move.
3. **Most promising edges disappear after fees or on fresh data.** The ones that remain are about **which coins to hold and how to size**, not when to jump in.

These findings changed my view of the market. I now see it less as a system that rewards being right about the future and more as one that rewards correct sizing, correct exits and not paying too much to trade.

---

## 1. How the work was done

- **Data:** Kraken spot and futures candles; Hyperliquid positioning (Coinversa); CoinGlass, CoinMarketCap and CoinGecko for derivatives and supply; Polymarket for crowd odds; Arkham for on-chain wallets; Yahoo Finance and company filings for stocks.
- **Registered before results:** each test was written into a registry (47 entries) before the outcome was seen, so the goalposts could not move.
- **Development, validation and holdout splits:** a result had to hold on data it had never seen.
- **Fees included:** maker and taker fees, plus measured spreads.
- **Brier scoring:** every call is logged with a probability and scored. A coin flip scores 0.25; lower is better.

---

## 2. Findings that held up

### 2.1 Direction is a coin flip; levels are forecastable

| Test | Result |
|---|---|
| Multi-target panel (COMP, HBAR, SOL; 21 checks per target) | **Up or down: 0 of 21 beat the base rate.** New 7-day high: 8 survived a strict multiple-testing check. New 7-day low: 9 survived. |
| Kronos (a published AI price-forecasting model), 9,640 forecasts on 15 coins | **Rejected.** No skill on direction. |
| My own 15- and 30-minute BTC calls on 31 Oct | Direction wrong both times (Brier 0.30 and 0.29); both price ranges held. |

**What drives the forecastable part:** where price sits in its 7-day and 24-hour range, and the volume ratio. Together they account for more than half the predictive weight. Chart-pattern names added almost nothing.

### 2.2 After a BTC drop, alts keep losing to BTC

Event study of 20 BTC drops of 5% or more:

- **Alts underperformed BTC by 1.69% on average over 24 hours after fees** (95% interval −3.48% to −0.37%). High-beta alts did worse.
- **Relative strength persisted.** Coins that had fallen least from their 30-day high kept doing better than the others. This passed the holdout (t = 3.45).
- **Deep laggards stayed weak.** Coins down 35% or more over 90 days lost a median 5.2% to BTC over the following 30 days.

### 2.3 Buying the flush does not pay

- **80 hourly "flush" events, buying the most-flushed fifth of alts:** −0.53% against BTC after maker fees at 6 hours, with the interval entirely below zero. At 24 and 72 hours, no difference from zero.
- **The extra return from buying flushes is about 0.16 points at 24 hours,** less than half of one maker fee.
- **"Fast recoverers lead" was not supported.** A coin's past recovery speed did not predict its next one.
- **Funding rates did not explain which coins rebounded** (correlation +0.002).

### 2.4 Costs decide whether an edge exists

- The app's first forward ledger booked a small-cap round trip at about 14.5% in costs, against real Kraken spreads of 0.03–0.36%. That one setting turned every signal into a loss. It was replaced with a single measured cost schedule.
- **Rule:** an edge smaller than about two taker fees (roughly 0.8% round trip) is not an edge for a small account.

### 2.5 Promising edges decay on fresh data

| Idea | Development | Validation | Holdout |
|---|---|---|---|
| BTC dip-bounce, alts over 3 days vs BTC | **+2.18%** | **−4.54%** | −0.24% |
| Rotation screen (QUALIFIED vs rejected coins, 30 days) | — | — | **−1.8%** (the screen lost) |

The rotation score's correlation with later returns was slightly negative in every non-overlapping period tested.

---

## 3. How the market actually works: what changed my mind

### 3.1 Crypto is mostly one trade, with leverage on top

- Bitcoin moves with the Nasdaq. On 30 Oct, the Nasdaq-100 fell 3.5% after Amazon and Intel results, and crypto fell with it.
- Most alts act as leveraged BTC. Holding six alts is often one bet in six wrappers.
- **Genuinely different coins exist, but they bring their own risks:**
  - Over 30 days of hourly data, XMR moved with BTC only loosely (correlation 0.29) and CAP not at all (−0.06).
  - But CAP swung about nine times as much as BTC per hour, and fell 39% in three days in late October.
  - **Moving independently of BTC is not the same as hedging BTC.**

### 3.2 Forced money moves prices more than news does

- **Liquidations:**
  - About $1.5bn of leveraged positions were liquidated in 24 hours on 30 Oct.
  - On 31 Oct, Hyperliquid showed about $197M of long positions within 5% below BTC's price, against $61M of shorts above, with the biggest cluster at $75–76k.
  - These clusters act like magnets for price.
- **Stolen supply:** after the $6.3bn Binance hack, Arkham showed the attacker holding large shares of small coins:
  - SOPH: 33.9% of circulating supply.
  - ERA: 22.1%.
  - FUN: 5.3% (580.77M tokens).

  Several of these coins hit all-time lows *before* any further selling, as other holders got out ahead of the attacker.
- **The market prices known sellers in advance.** Once an overhang is public, much of its damage happens before the selling itself.

### 3.3 Volume and headlines mislead

- "IBIT traded $5.2 billion" describes trading volume, not money coming in; on a down day much of it is selling.
- Commentators' "final leg down" calls and unverified ETF outflow figures are stories, not evidence, until checked against primary data.

### 3.4 Positioning data is a fuel map, not a compass

- It shows **where** forced buying or selling would happen, not **which way** price goes next.
- **Example 1:** on Hyperliquid, the most profitable wallets were heavily short BTC and SOL while ordinary traders were long. That looks like "smart money" betting down, but many such wallets are market makers hedging, so the signal is weaker than it looks.
- **Example 2:** I first read CAP's rally as a short squeeze. CoinGlass showed only $31K of shorts had been forced out; the rally was driven by spot buying while futures traders took money off. **Check the data before telling the story.**

### 3.5 Prediction markets are the baseline to beat

- Polymarket repriced a BTC dip to $76k from 64% to 25% within a day as the market stabilized.
- These odds are fast and reasonably calibrated. A Zobiris forecast is worth acting on only if it beats them, and so far none has been shown to.

### 3.6 Calibration beats conviction

| Forecaster | Calls scored | Hit rate | Average confidence | Brier score |
|---|---|---|---|---|
| Claude | 7 | 29% | 39% | **0.203** |
| Owner | 3 | 33% | 63% | **0.335** |
| Coin flip | — | — | 50% | 0.250 |

Both of us were right about a third of the time. The difference in score comes almost entirely from confidence: confident wrong calls cost more than cautious ones. The samples are far too small to rank either forecaster. What they show is that stating a probability, and keeping it modest, matters.

### 3.7 Stocks: valuation is a gate, not a timer

- A reverse discounted-cash-flow model asks what free-cash-flow growth today's price assumes.
  - At a 9% discount rate: about 9.5% a year for Microsoft and 10% for TSMC.
  - About 15% for Nvidia, which is demanding.
- The 30 Oct sell-off in AI stocks, on worries about cash spent on AI, fits the earlier finding that the cushion in AI valuations was thin. Valuation said *what* was fragile; it could not say *when* it would break.
- **Practical rule:** buy with limit orders at prices that pass the valuation gate, and size so a severe stress scenario stays within the 24% loss limit.

---

## 4. What I got wrong, and what each mistake taught

| Error | Correction | Lesson |
|---|---|---|
| Called CAP "privacy infrastructure" | It is an on-chain lending protocol | Check the project's own documents before labeling it |
| Said XMR had "no real threat" of falling to $570 | It had reached $572.49 the day before | Check recent extremes before using absolute words |
| Read CAP's rally as a short squeeze | It was spot-led | Look at liquidation data before naming the cause |
| Treated the most profitable wallets' shorts as a bet on price | They may be hedges | Positioning shows where the fuel is, not who is right |
| Called CAP "the play" for the next hour | It slipped | Order-book pressure is momentary |
| Said the FUN dump looked like the hacker selling again | The hacker's FUN balance was unchanged | Check the wallet balance, not the chart |
| Short-term direction calls on BTC | Missed twice | Forecast ranges, not direction |

---

## 5. Operating rules that follow

1. **Trade levels, not direction.** Use limit orders, take-profits and failure-level stops at prices the market has actually traded, not at your cost basis.
2. **In a BTC drop, sell the weakest alts first and keep the relative-strength survivors.**
3. **Never buy a flush** without evidence that the bounce clears two taker fees.
4. **Size for stress, not for forecasts:** a 24% maximum loss, no leverage.
5. **Before buying a dip, look for a forced seller:** an attacker's stash, an unlock, a delisting or a liquidation cluster below the price.
6. **Log every call with a probability** and keep confidence modest unless there is a measured edge.
7. **Register tests before looking, and require a holdout.** Treat any in-sample-only result as a story.
8. **Use time stops:** decide by a set time (for example before CME futures reopen on Sunday) instead of hoping.
9. **Verify headlines with primary data** and mark anything unverified as such.

---

## 6. Open questions

- A 15-minute replication of the flush study, held to the same fee hurdle.
- Historical liquidation and open-interest data (Coinversa, CoinGlass or a paid feed) to test forced-flow signals properly.
- Adding prediction-market odds and macro data to the forecasting panel.
- The registered backtest of the 40-week moving-average exit for the stock sleeve.
- Many more scored calls: with 10, nothing about forecaster skill is settled.

## 7. Limits

- **One period:** almost everything comes from a falling alt market in autumn 2026; results may differ in a bull market.
- **Small samples:** 20 BTC drops, 80 flushes, 10 scored calls.
- **One venue:** volume and order-book readings differ by exchange.
- **Patchy data:** some sources (Binance and Bybit futures APIs, Kalshi) were blocked, and several news figures are secondary.

**Sources in the repository:**
- `docs/research/`: event studies, rotation replay, panel study, live engine review.
- `research/recovery_lab/results/`: raw outputs.
- `docs/market-memory/`: daily notes and the call ledger.
- `docs/research/ai-equities-2027/`: stock valuation work.
