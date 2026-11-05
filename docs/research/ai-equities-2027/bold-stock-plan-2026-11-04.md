# Zobiris Bold Stock Plan, 4 Nov 2026

**Brief.** Use everything Zobiris has learned, and be creative rather than overly conservative.

**Boundaries.** This is research only. No leverage. Sizes are options for the owner to choose; nothing here places an order.

**Prices.** Kraken xStocks around 16:00–17:00Z on 4 Nov.

## Correction, 5 Nov 2026 (after owner review)

- **UNH and MU are moved to *pending research*.**
  - UNH rested on one FMP metric set plus election news.
  - MU had no valuation data.
  - Neither gets limit-price backing until a full company check is done.
- **PYPL is added as an investigated candidate.**
  - Its price implies free cash flow falling about 2% a year, at a 9% discount rate (FMP TTM: FCF yield 12.5%, EV/FCF 9.0).
  - Q3 release: buybacks reduced the share count by about 11% over the trailing year. Branded checkout grew only 1–2%. A downgrade on 4 Nov set a $63 target.
- **Chubb is not listed as a Kraken xStock.** BRK-B is the tradable diversifier there.
- **Every "entry level" below the current price is a resting limit order, not a purchase.**
- **Stress figures are conditional scenarios, not loss limits.** Assumed declines by asset class:

| Asset class | AI-centred bust | Rate / valuation shock | Harsher stress |
|---|---|---|---|
| Platforms | −45% | −25% | −60% |
| Suppliers | −60% | −35% | −75% |
| Other equities | −25% | −15% | −40% |
| Gold | 0% | −10% | 0% |
| Crypto | −70% | −45% | −80% |
| Cash | 0% | +3% | 0% |

  Correlations can rise in a crash, so actual losses can exceed these.
- **AI concentration.** MSFT, TSM, GOOGL and MU share AI-investment risk, and CRM partly. Count them together against the 40% look-through cap.
- **Selling order of alts.** The order is not established by an unrealised loss. The only forward test of the relative-strength rule (30 Oct event) went against it. Reducing crypto is the reason to sell, not which coin is down most.

### Second correction, 5 Nov 2026

**Venue.**
- Kraken lists traditional US stocks, including CB, for eligible US clients. xStocks are a separate tokenized product that is unavailable to US users.
- The 177-token list therefore does not define the account's stock universe. Account eligibility must be confirmed in the app.
- BRK-B is an alternative to Chubb, not a required replacement.
- Zero trades on a tokenized market say nothing about liquidity in the ordinary shares. xStock prices are used here only as price proxies; they matched Reuters to within 1%.

**PYPL cash-flow definition.**
- FMP's 12.5% yield is *ordinary* free cash flow: operating cash flow minus capex over the trailing four quarters, $6.30bn, measured on a stale market cap.
- That is not PayPal's *adjusted* FCF, which excludes the timing of buy-now-pay-later loan receivables. Q3 adjusted FCF was $2.05bn, against $1.43bn ordinary.
- At $60.55 with 849M shares (30 Sep), market cap is about $51.4bn:
  - ordinary FCF yield: 12.3%;
  - FCF minus stock compensation ($5.32bn): 10.4%.

**PYPL sensitivity.**
- The range covers 16 combinations: discount rate 8–11%, terminal growth 2–3%, FCF with or without stock compensation, and net debt measured as $6.3bn (cash only) or as $1.6bn net cash (including investments).
- Implied 10-year growth runs from −9.3% to +1.4% a year.
- The conclusion "the price assumes roughly flat-to-shrinking cash flow" holds across the grid. Any single figure, such as −2%, depends on the assumptions chosen.

**Alt funding order (method recorded 5 Nov).**

*Data and method:*
- Kraken public daily OHLC, UTC closes, up to the last complete bar (4 Nov). The in-progress day is excluded.
- Daily log returns over 90- and 180-day windows.
- Two covariance estimators: sample (n−1) and EWMA with λ = 0.94 and zero mean.
- Risk contribution = wᵢ·cov(rᵢ, r_p)/var(r_p) within the crypto sleeve, using static current weights. The owner's weights are not recorded here.

*Weight-independent statistics:*

| Coin | Correlation with SOL | Beta to BTC | Annualised volatility |
|---|---|---|---|
| NEAR | 0.52–0.76 | 1.24–2.23 | 117–128% |
| COMP | 0.45–0.50 | 0.94–1.10 | 69–88% |
| ATOM | 0.44–0.61 | 0.84–1.17 | 69–77% |

*Risk contribution per unit of weight:*
- NEAR: 1.56–2.01.
- COMP: 0.79–0.92.
- ATOM: 0.79–1.00.

*Reading:*
- NEAR ranks first on every window and estimator. Under the tested settings, reducing NEAR would reduce estimated portfolio risk and overlap with SOL. This is a risk-budget decision, not a prediction of which coin performs worst.
- COMP and ATOM are not separable. Recent-weighted (EWMA) data put ATOM slightly ahead.
- Catalysts and fundamentals were not checked.

**PYPL model specification.**
- **Horizon and growth:** a 10-year explicit horizon at constant growth from the trailing four-quarter base, followed by a Gordon terminal value at 2% or 3%.
- **Reinvestment:** growth is assumed to need no reinvestment beyond the capex already deducted. That is an optimistic simplification.
- **Debt and interest, two consistent versions:**
  - **(A) FCFE.** Ordinary FCF ($6.299bn, after interest) minus stock compensation ($0.977bn: 210 + 259 + 275 + 233m) is discounted as equity value, with no debt adjustment. At 9%, implied growth is −3.6% / −4.6% (terminal 2% / 3%).
  - **(B) FCFF.** Adds back after-tax interest ($0.426bn TTM at 21% tax = $0.337bn), discounts to enterprise value, then subtracts net debt of $6.31bn (cash only). At 9%: −2.9% / −3.9%. Subtracting net cash of $1.6bn instead (including investments) gives −4.9% / −5.9%.
- **Range:** −7.9% to +0.5% across 8–11% discount rates.
- **Discount-rate pairing (added 5 Nov).**
  - FCFE should be discounted at the cost of equity (ke), and FCFF at WACC.
  - Inputs: equity $51.4bn; debt $13.5bn; pre-tax cost of debt 3.2% (interest paid ÷ debt) or an assumed 5.5%; tax 21%.
  - With ke from 9% to 12%, WACC runs from 7.65% to 10.41%.
  - Implied growth: FCFE at ke from −4.6% to +1.2%; FCFF at WACC from −6.8% to −0.5%.
  - The PYPL beta was not fetched, so ke is an assumption.
- **Scoped conclusion.** Under these assumptions, the price is consistent with roughly flat or shrinking cash flow. That supports investigating PYPL as a value candidate. The assumed required returns and the reinvestment treatment still matter.
- **Known limitation:** the original `reverse_dcf.py` mixes after-interest FCF with a net-debt deduction. That is small for net-cash firms but should be fixed before the gate is reused.

**ANET entry check.**
- A weekly close above $170 alone is not a fresh breakout:
  - closes were 172.37 (23 Oct) and 168.86 (30 Oct);
  - 4 Nov's earnings spike reached $188.53, then faded to $178.48.
- **Proposed entry condition:** a weekly close above $188.53 by 4 Dec 2026, *and* a valuation check. Statements for ANET are not available on the current data plan.
- **Until then:** not actionable.

**Proposed rules (not protective levels).** Each needs a horizon and is scored afterwards. A stop can fill below its level when the price gaps.
- **PYPL:** two consecutive daily closes below $55 before the Q4 report (about early Feb 2027) trigger a thesis review, not an automatic sale.
- **ANET:** superseded by the entry check above.
- **MSFT:** reserve limits at $530 and $510, reviewed on 31 Dec 2026.

### Third correction, 5 Nov 2026

- **Chubb.** CB (ordinary shares) is an eligible option on Kraken for eligible US clients. BRK-B remains the owner's chosen diversifier.
- **Cash interest.** The +3% applies only over a 12-month holding period. For an immediate shock, cash is 0%.
- **TSM second tranche.** One strategy is chosen: confirmation, not the $390 limit.
  - The trigger is a Friday close above $412, followed by a limit buy the next session, by 31 Dec 2026.
  - Reason: the first tranche already buys weakness. A $390 limit would probably fill on the same day, which would remove the staging.
- **BRK-B limits.** Two steps at $560 and $545, valid to 31 Dec 2026. They sit near the 2–3 Nov highs and the 28–30 Oct range.
  - BRK-B closed at $579.09 on 4 Nov (+4%), after rising about 16% from its 30 Sep close of $497.95.
- **Fill check against exchange data (Twelve Data).**
  - MSFT's 4 Nov regular-session low was $542.30, so a $530 limit would not have filled. The $530 print appeared only on the 24/7 tokenized market.
  - TSM closed at $395.75 on 4 Nov, after a low of $391.61.

### Decision record, 5 Nov 2026: TSM second tranche (conditional)

- **Signal.** A weekly close above $412 on the regular US session.
  - "Weekly close" means the last trading day of the week.
  - The week of 21–25 Dec closes on Thu 24 Dec, an early close at 1 p.m. Eastern (11 a.m. Arizona, 18:00 UTC). Fri 25 Dec is a market holiday.
  - That 24 Dec close is the **last eligible signal**: a fill is still possible in the 28–31 Dec sessions.
- **Maximum price.** It is set fresh after the signal, not as a buy at the next open. The limit is the lower of:
  - the signal-week close +2%;
  - $439, the reverse-DCF price at which implied growth is 10% (r = 9%, `reverse_dcf_2026-11-04.py`).

  The **$439 ceiling is provisional** until the corrected valuation model (consistent debt and interest treatment, with FCFE at the cost of equity or FCFF at WACC) supports it.
- **Order life.** The limit lasts the following week only. If unfilled, it is not chased; a later signal starts a new attempt.
- **Deadline.** The signal and the fill must both happen by 31 Dec 2026. Otherwise the tranche stays in cash and is reviewed.
- **Execution note.** A buy limit fills at the limit or lower; it does not guarantee any particular price.
  - Earlier "≈$386" figures were 24/7 tokenized-market prices, not exchange premarket quotes.
  - Actual fills are confirmed from brokerage order history.

## 1. The short version

This morning's re-evaluation left most of the stock budget in cash. This version puts the budget to work, in four roles:

**TSM ($395): AI core**

- **Why:** the only AI supplier that passes the valuation gate (it needs 8.6% growth a year). It is at a 30-day low after the election scare.
- **Entry:** half near $390; half after a weekly close above about $412.
- **Failure:** weekly close below $360.

**UNH ($408): election winner**

- **Why:** insurers rose 4–6% on the sweep. It is the cheapest cash generator screened: the price needs only **4.3%** growth a year, on a 6.3% FCF yield. Trend +13% above its 40-week average.
- **Entry:** $395–408.
- **Failure:** close below $366 (30-day low).

**GLD, gold ($370): hedge**

- **Why:** gold is back above $4,000 and the dollar is at a 1-month low. It pays off if AI busts or the Fed and dollar wobble. Liquid on Kraken.
- **Entry:** $360–370.
- **Failure:** close below $353.

**MU ($808): contrarian ticket**

- **Why:** a test of the "known overhang is priced before it bites" pattern. Memory fell 37% from its high on regulation fear that analysts doubt can stop construction.
- **Entry:** near $800 (90-day low).
- **Failure:** close below $720.

**GOOGL ($290): contrarian**

- **Why:** cheaper than on 28 Oct (needs 9.5% growth). The selling was driven by its financing worries, which are now public.
- **Entry:** $275–280.
- **Failure:** close below $265.

**BRK-B ($556): anchor**

- **Why:** the diversifier the plan chose. Steady buys; no dip needed.

**MSFT ($553): add on weakness**

- **Why:** still qualified, but up 6% today.
- **Entry:** $530, then $510.

**Still avoid:** AMZN (borrowing to fund $77bn a quarter of capex), AMD (the price needs about 33% growth), AVGO, META (margins), defence, oil, and Tesla/SpaceX (merger scrutiny).

## 2. Why these, in Zobiris' own lessons

1. **Look for the forced seller before buying a dip** (whitepaper rule 5).
   - The forced or scared sellers this week were hedge funds cutting AI exposure and traders pricing regulation.
   - The regulation risk is now public and largely priced: Nasdaq-100 futures fell 2.4% before recovering, and memory and equipment stocks are 37–48% off their highs.
   - That is the CP_KB pattern in a stock setting. MU and TSM are the cleanest tests of it.
2. **Keep the stocks holding up best** (rule 2).
   - Health care is at record highs, up 19% this year, and the election added fuel.
   - UNH, TMO, LLY and V all sit 13–30% above their 40-week averages.
   - Of these, UNH is chosen because it is also the cheapest.
3. **Valuation is a gate, not a timer** (§3.7).
   - TSM, UNH and GOOGL pass the gate.
   - MU and BRK-B are not modelled: data on this plan is missing for MU, and Berkshire is an anchor holding. They are labelled as such.
4. **Trade levels, not direction** (rule 1). Every entry is a price the market has actually traded in the last 30–90 days, and every name has a failure level.
5. **Calibrate** (rule 6). The calls below carry modest probabilities and will be scored.

## 3. What you might have missed (Creative Percent 0.25)

**2018 rhymes.**

- In November 2018, Democrats took the House while the Fed was raising rates into year-end. The S&P 500 then fell about 20%, from 2,930 in September to 2,351 on 24 Dec 2018.
- It still finished higher a year after the midterm, in line with the 19-out-of-19 record since 1950 (reported).
- Today has the same mix: a divided government plus an expected Fed hike by year-end (Reuters).
- **Lesson:** stay bold on *what* to own, but **stage the buying over 4–8 weeks**, so a 2018-style drop becomes the cheaper second half rather than a loss on the whole position.
- *Confidence 0.5. Inferred from known history plus reported rate expectations.*

**Other lenses:**

- **Watcher (against the plan):** health care's record high means part of the election trade is already priced. Medicare Advantage scrutiny is a real risk for UNH.
- **Librarian (against MU):** Zobiris found that buying flushes did not pay in crypto. MU is sized as a small ticket for that reason.
- **Oracle:** gold and Europe gain when the dollar weakens. But the Europe ETFs on Kraken (VGK, VXUS) barely trade, so gold is the practical non-dollar hedge.

## 4. Calls to score (resolve 4 Feb 2027, Kraken xStock close)

| Call | Probability |
|---|---|
| TSM above $395 | 0.60 |
| UNH beats SPY over 3 months | 0.55 |
| MU above $800 | 0.50 |
| The five new names, equal-weighted, beat SPY | 0.52 |
| SPY higher on 4 Nov 2027 than today | 0.75 |


## Sources

- Kraken public API, tokenized assets: tickers and daily OHLC for 177 xStocks, 4 Nov 2026.
- FMP: UNH TTM key metrics (FCF yield 6.28%, EV/FCF 18.0). Quarterly cash flows for AMZN and AMD.
- Investing.com, "Which sectors will benefit most and face pressure after Democratic sweep?", 4 Nov 2026: https://www.investing.com/news/stock-market-news/which-sectors-will-benefit-most-and-face-pressure-after-democratic-sweep-93CH-4999088
- The Independent / Reuters, sectors bracing for a shift, 3 Nov 2026: https://www.independent.co.uk/news/world/americas/us-politics/us-midterm-elections-stocks-sectors-corporate-america-b3078635.html
- CNBC, midterms and sectors, 2 Nov 2026: https://www.cnbc.com/2026/11/02/midterm-election-stocks-defense-healthcare-crypto-ai.html
- BNY Investments, US Midterms 2026: https://www.bny.com/assets/investments/im/documents/manual/perspectives/us-midterms-2026-key-policy-and-market-considerations.pdf
- Reuters Morning Bid (Fed hike expectations), 4 Nov 2026: https://www.investing.com/news/commodities-news/morning-bid-tangled-up-in-blue-4998558
- Earlier work: `stock-reevaluation-2026-11-04.md`, `ZOBIRIS_WHITEPAPER_2026-11-01.md`, `.claude/skills/zobiris-creative-percent/CP_KB.md`.
- Stress shocks follow the v5.1 scenarios: platforms, suppliers, other equities, crypto. Gold is assumed 0% in the AI bust and −10% in the rate shock.
