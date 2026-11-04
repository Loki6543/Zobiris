# Stock Re-evaluation, 4 Nov 2026

**Scope.** This is research qualification only. It does not authorise orders or sizes; the owner decides. It applies the v5.1 rules (34% equity ceiling, 10% single-name cap, cash as the default) and the 29 Oct valuation gate to today's prices.

**Prices.** Kraken xStocks around 15:30–16:00Z on 4 Nov. They match Reuters' premarket prints (NVDA $202.88, AMD $486.18) to within 1%.

**Reproduce.** `reverse_dcf_2026-11-04.py` in this folder.

## 1. Bottom line

| Rank | Stock | Today | Verdict |
|---|---|---|---|
| 1 | **TSM** | $394.99 | **Best fit for "buy what dipped"**: provisionally qualified, now *under* its valuation gate, net cash. Stage in. |
| 2 | **MSFT** | $552.76 | Still qualified, but up about 6% today. Add only on a pullback to about $530 or lower. |
| 3 | **BRK-B** | $556.45 | Diversifier, not a dip buy. Available on Kraken (Chubb is not). |
| 4 | GOOGL | $289.53 | Cheaper than on 28 Oct, but cash flow is negative and the trend is broken. Watch. |
| — | NVDA | $202.04 | Wait for earnings (17 Nov per v5.1, to verify). Even $170 needs 12% a year. |
| — | META | $628.71 | Cheapest on paper (5.4%) but still fails operating leverage. Not yet. |
| — | AMZN | $266.66 | **Downgraded.** Q3 cash flow is worse. No. |
| — | AVGO | $332.72 | Not yet: data gaps and a broken trend. |
| — | AMD | $483.20 | New screen: fails. The price needs about 33% FCF growth a year. |
| — | CRM | $227.85 | Hold, no add. No fresh statement data. Results due early December (to verify). |

Money not placed stays in cash. A Fed hike by year-end is expected (Reuters), so cash earns more while it waits.

## 2. What changed since the 28 Oct gate

- **Midterms (3 Nov).** Democrats won the House and Senate (CNBC, Reuters).
  - Futures first fell; Nasdaq-100 futures were down as much as 2.4%. They then rallied after Trump accepted the result.
  - **Rallied:** MSFT, AMZN and AAPL were each up more than 6%, GOOGL up 4%.
  - **Fell:** NVDA −2%, AVGO −2%, MU −6%, Tesla/SpaceX −4%, defence stocks −4 to −6%.
  - **Reason given:** tighter AI and data-centre regulation would hurt chip demand. *Reported.*
- **Rates.** Job openings jumped in September. Reuters says that reinforces expectations of another Fed hike by year-end. *Reported.*
- **Oil** fell about 2%, after Trump linked the Republican losses to the Iran war. *Reported.*
- **Amazon Q3 (FMP, observed).**
  - Capex was $77.3bn in one quarter, against $35.1bn a year earlier.
  - Free cash flow was −$34.8bn, funded by $48.9bn of net new debt.
  - Trailing FCF minus stock compensation is −$66.8bn.
- **AMD Q3.** It beat and raised its outlook through 2027 (reported). Its cash quality is weak (observed):
  - operating cash flow was only $1.2bn;
  - inventory rose $3.0bn and receivables $1.9bn;
  - it took on $3.85bn of new debt.
- **Chips since 28 Oct:** TSM −10.1%, NVDA −6.1%, AVGO −5.4%. GOOGL is −10.9% after its results and funding news.

## 3. Valuation gate at today's prices

Implied growth is the 10-year annual growth in steady-state FCF that today's price requires, at a 9% discount rate. Lower means cheaper. The gate treats 10% or less as undemanding.

| Stock | 28 Oct | Today | Price for 10% | Price for 12% |
|---|---|---|---|---|
| META | 5.0% | **5.4%** | $902 | $1,053 |
| TSM | 10.0% | **8.6%** | $439 | $508 |
| GOOGL | 11.1% | **9.5%** | $301 | $349 |
| MSFT | 9.5% | **10.1%** | $549 | $641 |
| NVDA | 15.1% | **14.3%** | $146 | $170 |
| AVGO (optimistic) | 15.5% | **14.8%** | $229 | $268 |
| AMZN (Q3 refresh) | 15.0% | **15.4%** | $170 | $201 |
| AMD (reported FCF) | — | **≈33%** | — | — |

At an 8% or 10% discount rate, every figure shifts by about 2.3–2.5 points. The ranking holds.

## 4. Trend check (v5.1 §7: 40-week average)

| Stock | vs 40-week average | Last three weekly closes vs that average | Reading |
|---|---|---|---|
| MSFT | +26% | +21 / +21 / +20% | Strong |
| BRK-B | +12% | +9 / +11 / +8% | Strong, near its high |
| CRM | +16% | +23 / +26 / +19% | Above, but −15% from its high |
| AMZN | +9% | +2 / +2 / −1% | One week below, now back above |
| META | +0.4% | +13 / +2 / −2% | On the line |
| NVDA | −1% | +6 / +5 / +1% | Sliding toward it |
| TSM* | −4% | +1 / +1 / −1% | One week just below |
| AVGO | −10% | −10 / −12 / −11% | Broken |
| GOOGL | −15% | +1 / −6 / −17% | **Broken (two weeks below)** |

\*TSM's Kraken history starts in March, so its average covers 33 weeks, not 40.

## 5. Per-name reasoning

**TSM: top candidate.**
- **Status:** provisionally qualified.
- **Why now:** it is now below the 10% gate price ($439). It holds about $98bn of net cash and has a broad customer base.
- **Risks:**
  - The new political risk to chip demand.
  - Taiwan.
  - One weekly close slightly below its average.
  - The Kraken spread is wider than for the big platforms (0.29%).
- **Approach:** stage in rather than buy all at once: part now, the rest after Nvidia's results or a weekly close back above about $412.
- **What would remove it:** a Taiwan escalation, or gross margin below 60%.

**MSFT: qualified, but not at today's spike.**
- It is self-funded with positive operating leverage, and today's price needs 10.1%.
- It gained about 6% in one session on the election. Buying a gap-up runs against the dip-buying plan.
- **Where valuation improves:** about $530 (9.5%, the 28 Oct level), and more so toward $500.

**BRK-B: the diversifier.**
- It is the v5.1 replacement for IDV and does not depend on the AI capex cycle.
- It held up best in the 2020 crash.
- It is near its high, so this is a slow, regular buy rather than a dip buy.
- Chubb, the other chosen diversifier, is not listed on Kraken.

**GOOGL: watch.**
- **For:** valuation has improved (9.5%).
- **Against:** reported FCF after stock compensation is still negative; spending is funded with new debt and equity; and two weekly closes below the 40-week average. Under §7 that is the opposite of an entry signal.
- **What would change it:** FCF turning positive, or two weekly closes back above about $340.

**NVDA: wait.**
- Today's price needs 14.3%. Even $170 needs 12%.
- Wait for earnings (17 Nov per v5.1, to verify) and a clearer view on regulation.

**META: not yet.** It is the cheapest name, but operating income is still growing more slowly than revenue.

**AMZN: no.**
- Spending is accelerating faster than its cash flow can carry, and it is borrowing to pay for it.
- Today's +6.5% is an election move, not a change in fundamentals.

**AVGO: not yet.** It has net debt, stock-compensation data is missing, and the trend is broken.

**AMD: no.** The beat is real, but the price already assumes far more than the beat delivers.

**CRM: hold, no add.**
- The months-long thesis is unchanged.
- Re-check it after the December results, with full cash-flow data.

## 6. What you might have missed (Creative Percent)

**The election may flip the capex grid.**
- The 29 Oct gate warned of a "suppliers gain, platforms suffer" cell.
- If regulators or states slow data-centre building:
  - hyperscalers would spend less, which brings their actual FCF closer to the steady-state assumption — good for MSFT and GOOGL;
  - suppliers would sell less — bad for NVDA, AVGO and AMD.
- Today's moves already price this: platforms +4–6%, MU −6%.
- TSM sits in between, because it supplies every chip designer.
- *Confidence 0.45. The idea is reported (CNBC commentary); the price moves are observed.*

## 7. Limits

- Cash flows are trailing figures, not forecasts. AMZN net cash is an estimate. AMD's share count (about 1.63bn) is unverified.
- xStock prices are intraday on an election-reaction day, so they can move several percent by the close.
- This plan's FMP tier could not supply CRM or AVGO statements.
- The base rate that stocks usually rise in the 12 months after a midterm (AP, reported) supports staying invested. It does not justify buying today's gap.

## Sources

- Kraken public API, tokenized assets (ticker, daily and hourly OHLC), about 16:00Z on 4 Nov 2026.
- FMP quarterly cash-flow statements: AMZN Q4 2025–Q3 2026, AMD Q4 2025–Q3 2026.
- CNBC, "A blue wave sends futures into the green", 4 Nov 2026: https://www.cnbc.com/2026/11/04/a-blue-wave-sends-futures-into-the-green.html
- Reuters via USA Today, 4 Nov 2026: https://www.usatoday.com/story/money/markets/2026/11/04/stocks-wednesday-democrats-midterms/92607023007/
- Investopedia live, 4 Nov 2026: https://www.investopedia.com/stock-market-today-dow-jones-s-and-p-500-nasdaq-11042026-12234321
- Reuters Morning Bid, 4 Nov 2026: https://www.investing.com/news/commodities-news/morning-bid-tangled-up-in-blue-4998558
- Reuters, 3 Nov 2026 close: https://www.reuters.com/business/retail-consumer/us-stock-futures-mixed-apple-slides-midterms-loom-2026-11-03/
- AP, 4 Nov 2026: https://apnews.com/article/stock-markets-ai-earnings-oil-4d12764c0b3ce38ffde3077712811182
- Prior gate: `monetization-valuation-gate-2026-10-29.md`. Diversifiers: `diversifier-drawdowns-2026-10-29.md`.
