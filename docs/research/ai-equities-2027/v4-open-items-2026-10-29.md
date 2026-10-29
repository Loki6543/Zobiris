# AI equity argument v4: the four open items (29 Oct 2026)

Research only. Nothing here changes holdings, orders or Zobiris gates.

## 1. Trend rule registered
`equity-sleeve-40w-sma-half-exit-v1` was appended to `docs/research/registry/tests_registry.jsonl` at 2026-10-29T08:59Z. No price history had been downloaded and no results had been seen.

**Rule.** Two completed weekly closes below the 40-week SMA cut the sleeve to half. Two completed weekly closes above it restore the full sleeve. Trades execute at the next session's open.

**Benchmarks.**
- Primary: QQQ and SMH.
- Secondary: SPY, RSP and EFA.
- The single-stock basket is reported separately and is hindsight-labelled.

**Variants.** Exit to zero, and execution delayed by 1 or 2 weeks.

**Costs.** Three cost levels: 0.05%, 0.10% and 0.25% per side.

**Splits.**
- Development: up to 2012.
- Validation: 2013–2018.
- Holdout: 2019 onward.

The holdout is computed only after development and validation results are written.

**Decision rule.** The rule is supported only if all three hold on both QQQ and SMH, at a cost of 0.10% per side:
- max drawdown is at least 25% smaller, in development and in holdout separately;
- the CAGR shortfall is no worse than 1.5 pp a year;
- the 1-week-delay variant also meets the drawdown test.

**Known bias.** The registrant already knows the shape of past crashes, and the 40-week average is famous partly because of them. That is why the holdout carries the weight.

## 2. Calendarised consensus EPS
**Inputs.** The same FMP consensus figures as `valuation_capex.md`, pulled on 29 Oct.
- Alpha Vantage gives MSFT FY27 as 19.76 and FY28 as 23.70, which agrees with FMP to within 0.2%.
- Quarterly estimates only reach two quarters ahead, so exact quarter alignment is not possible from these sources.

**Method.** The formulas and assumptions are below; the script is `calendarise_eps.py`.

| Company | Year end | Blend | Assumption |
|---|---|---|---|
| MSFT | June | CY = ½ FY(n) + ½ FY(n+1) | Equal quarters |
| AAPL | September | CY = ¾ FY(n) + ¼ FY(n+1) | Equal quarters. A seasonal variant gives the December quarter 30% of the year. |
| NVDA | January | FY taken as CY | 1-month offset |
| Others | December | Already calendar years | — |

For MSFT and AAPL, CY28 needs a fourth fiscal year that consensus doesn't provide. It is extrapolated at the last fiscal growth rate; this is an assumption, not consensus.

**CY2027/CY2026 growth by company:**

| Company | Raw table | Calendarised |
|---|---|---|
| MSFT | 16.41% | 18.02% |
| AAPL | 8.26% | 8.95% (seasonal variant 9.08%) |
| NVDA | 70.18% | unchanged |
| GOOGL | −25.49% | unchanged |
| AMZN | −17.17% | unchanged |
| META | 16.88% | unchanged |
| TSLA | 21.43% | unchanged |

**Simple means of company growth rates.** These are not portfolio EPS and not forecasts.

| Set | CY27/CY26 | CY28/CY27 |
|---|---|---|
| All 7 | 13.26% | 25.16% |
| Excluding NVDA | 3.77% | 23.48% |
| Excluding GOOGL and AMZN | 27.09% | 24.79% |
| Excluding NVDA, GOOGL and AMZN | 16.32% | 22.17% |

**Findings.**
- Calendarisation barely changes the result: 12.93% becomes 13.26%.
- The low CY2027 mean comes almost entirely from GOOGL and AMZN, whose 2026 EPS includes investment gains. Without those two, the mean is about 27%.
- The 3–4% figure excluding NVDA is an artefact of the same distortion, not a sign of operating weakness.
- A proper fix needs operating EPS that excludes investment gains. That is not available from these free endpoints.

## 3. Treasury yields
10-year constant maturity, from Alpha Vantage (Treasury/FRED series):

| Date | 10-year yield |
|---|---|
| 27 Oct 2026 | 4.99% |
| 5 Oct 2026 | 5.31% (October high) |
| End-2025 | 4.18% |

From the 27 Oct macro notes:
- 2-year: 4.70%
- 30-year: 5.30%
- 10-year TIPS real yield: 2.64%
- ACM term premium: 0.94% (23 Oct)

## 4. Alphabet trailing-year free cash flow
From FMP quarterly cash-flow statements, as operating cash flow minus purchases of property and equipment. Figures are in $bn.

| Quarter | Operating cash flow | Capex | Free cash flow |
|---|---|---|---|
| Q4 2025 | 52.402 | 27.851 | 24.551 |
| Q1 2026 | 45.790 | 35.674 | 10.116 |
| Q2 2026 | 39.069 | 44.924 | −5.855 |
| Q3 2026 | 42.290 | 51.355 | −9.065 |

The four quarters sum to **+$19.747bn**, which confirms v4's figure.

Two further points from the same statements:
- **The trend:** free cash flow fell for three quarters in a row and has been negative for two.
- **2026 financing:** about $76bn of net debt issuance, $42.9bn of common stock issuance (Q2 and Q3) and $19.1bn of preferred stock (Q2). This is relevant to the per-share and dilution checks the argument requires. Labels are as given by FMP and have not been checked against the 10-Q.
