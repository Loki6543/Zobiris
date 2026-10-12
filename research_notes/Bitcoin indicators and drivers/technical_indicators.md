# Technical Indicators with Measured Predictive Value for Bitcoin (by timeframe)

Research note. Constraint: 2015–2026 evidence, fees and sample periods noted where found. Caveat: several primary sources (CXO Advisory, Quantpedia, IDEAS/RePEc, ar5iv) could not be fetched directly from this environment (DNS failures), so many figures come from abstracts or search summaries and are labelled as such.

## 1. Which indicators have the best evidence for BTC (top ~5)?

### Takeaway
The most consistently supported signal family for BTC is **trend/momentum: price vs. moving average (and MA crossovers) and breakout-at-N-day-high (Donchian-style)**, mainly on daily data. Oscillators (RSI, MACD) and Bollinger Bands have thin, mixed or non-robust academic support. Even the best rules lose much of their edge out of sample (Hudson & Urquhart found no out-of-sample BTC predictability).

### Cited Findings
- Detzel, Liu, Strauss, Zhou & Zhu, "Learning and predictability via technical analysis: Evidence from bitcoin and stocks with hard-to-value fundamentals" (Financial Management, 2021, DOI 10.1111/fima.12310): ratios of price to its moving average forecast **daily** BTC returns in and out of sample. Trading on those ratios gave economically significant alpha and Sharpe gains vs. buy-and-hold. Per a CXO Advisory summary, the rule tested 5/10/20/50/100-day SMAs (long BTC above the SMA, T-bills below). An earlier 2018 working-paper title was "Bitcoin: Predictability and Profitability Via Technical Analysis" — [IDEAS/RePEc record](https://ideas.repec.org/a/bla/finmgt/v50y2021i1p107-137.html); [WUSTL profile](https://profiles.wustl.edu/en/publications/learning-and-predictability-via-technical-analysis-evidence-from-/); [CXO summary](https://www.cxoadvisory.com/currency-trading/timing-bitcoin-with-smas/) (secondary; exact Sharpe/drawdown figures not retrieved).
- Hudson & Urquhart, "Technical trading and cryptocurrencies" (Annals of Operations Research, 2021, 297:191–220): tested about 15,000 rules from five classes (MA, filter, support/resistance/breakout, channel breakout, on-balance volume) with data-snooping-robust multiple-hypothesis tests. They found in-sample predictability and profitability in every class, with breakeven transaction costs well above typical crypto fees. However, **Bitcoin showed no predictability in the out-of-sample period**, although other cryptocurrencies did — [Hull repository full text](https://hull-repository.worktribe.com/OutputFile/2639834); [record](https://hull-repository.worktribe.com/output/2328042).
- Corbet, Eraslan, Lucey & Sensoy, "The effectiveness of technical trading rules in cryptocurrency markets" (Finance Research Letters 31, 2019, 32–37): tested MA-oscillator and trading-range-breakout rules on **high-frequency (1-minute)** BTC data. MA strategies were favoured, the **variable-length moving average rule** performed best, and buy signals earned more than sell signals — [IDEAS](https://ideas.repec.org/a/eee/finlet/v31y2019icp32-37.html); [Bilkent repository](https://repository.bilkent.edu.tr/items/dc8e15f8-5083-44db-8f69-5bb278a8d093); 1-minute data detail from [crypto trading survey, arXiv 2003.11352](https://arxiv.org/pdf/2003.11352). The cost treatment was not verified.
- Padyšák & Vojtko, "Seasonality, Trend-following, and Mean Reversion in Bitcoin" (SSRN, April 2022): when BTC closes at a 10–50-day **maximum** (a Donchian-style breakout), next-day returns are higher with lower risk, which reads as momentum. Shorter lookbacks (10-day) worked best. Behaviour at the minimum differs (mean-reversion-like) — [Quantpedia](https://quantpedia.com/trend-following-and-mean-reversion-in-bitcoin/); [CXO](https://cxoadvisory.com/currency-trading/patterns-in-short-term-bitcoin-returns) (secondary summaries).
- Quantpedia's follow-ups cite Beluská & Vojtko (2024), which says these BTC trend strategies stayed viable across regimes through August 2024. A Donchian rotation between QQQ and BTC (2019–2026) reports Sharpe up to 1.69, Calmar above 2.2, and max drawdown cut by 50–79% vs. buy-and-hold allocations. This is a multi-asset strategy, not BTC alone — [Quantpedia](https://quantpedia.com/silicon-vs-satoshi-tactical-asset-rotation-between-nasdaq-100-and-bitcoin/) (search snippet; not fetched).
- Quantpedia's multi-timeframe BTC trend example: a daily trend filter improved max drawdown from −23.9% to −12.4% and Sharpe from 0.33 to 0.80. The sample period was not visible in the snippet — [Quantpedia](https://quantpedia.com/how-to-design-a-simple-multi-timeframe-trend-strategy-on-bitcoin/).
- A Glasgow PhD thesis found most rules (especially MA rules) beat buy-and-hold on crypto, but says the profitability may come from data-snooping bias — [Glasgow theses](https://theses.gla.ac.uk/82986).
- "Are simple technical trading rules profitable in bitcoin markets?" (International Review of Economics & Finance, vol. 93, 2024, pp. 858–874; attributed to Deprez & Frömmel per a search summary): rules were selected from 75,360 candidates, combined into portfolios, and tested out of sample after "realistic" costs. A summary says they can still significantly outperform buy-and-hold out of sample, mainly on a risk-adjusted basis — [IDEAS](https://ideas.repec.org/a/eee/reveco/v93y2024ipbp858-874.html) (not fetched; treat as unverified).
- Volume/OBV: OBV is one of the five rule classes in Hudson & Urquhart (above). No BTC-specific evidence that it ranks above MA rules was found.

### Inferences
- Tentative evidence ranking for BTC: (1) price vs. MA / MA crossover on daily bars (Detzel et al.; Corbet et al. intraday); (2) N-day high breakout / Donchian (Padyšák & Vojtko; Hudson & Urquhart's channel-breakout class); (3) time-series momentum / trend filters for drawdown control (Quantpedia); (4) OBV/volume (tested but not shown superior); (5) RSI/MACD (weak or untested in rigorous studies).
- The main value of trend rules on BTC appears to be **drawdown reduction and better Sharpe**, not higher raw return than buy-and-hold in strong bull markets.

### Gaps
- No rigorous, published ranking of VWAP or ATR as standalone BTC predictors was found. ATR shows up mainly as a volatility-sizing or stop component.
- Exact Sharpe, drawdown and win-rate tables from Detzel et al. and Hudson & Urquhart could not be extracted (full-text fetch failed).

## 2. SuperTrend and Bollinger Bands vs. the above

### Takeaway
**No peer-reviewed or out-of-sample academic study of SuperTrend on BTC was found**; the evidence consists of TradingView and QuantConnect backtests, which are often fee-free or optimized. Bollinger Bands have one small journal study on BTC futures (Day et al. 2023) plus a student thesis, with unclear cost treatment. Neither indicator has better-documented evidence than simple MA or breakout rules.

### Cited Findings
- Day, Cheng, Huang & Ni (2023), "The profitability of Bollinger Bands trading bitcoin futures," Applied Economics Letters 30(11): 1437–1443. They report an average holding-period return above 20% using Bollinger Band trading signals, and above 50% when the MA length goes from 20 to 60 days. A longer, trend-like setting helps. Whether transaction costs were modelled is not stated in the available abstract — [IDEAS](https://ideas.repec.org/a/taf/apeclt/v30y2023i11p1437-1443.html).
- A 2025 Finnish bachelor's thesis (2020–2025 data, with fees) found a Bollinger strategy beat both momentum and HODL. This is low-authority evidence — [Theseus](https://www.theseus.fi/handle/10024/902903).
- SuperTrend: the search returned only scripts and blogs. One TradingView author says their volume-confirmed SuperTrend was not formally backtested — [TradingView](https://cn.tradingview.com/script/WvCVRGU1-SuperTrend); [TradingView post](https://tr.tradingview.com/chart/DOGEUSDT/tEnkRzmD-A-nice-SuperTrend-strategy-on-the-test).
- Warning examples from platform backtests: one QuantConnect run shows 10,001 trades, Sharpe 45.7 and $0 fees, which is clearly an unrealistic model. A TradingView BB+RSI script reports Sharpe 7.5 (2.5 with stop loss/take profit) after optimizing for Sharpe on one year of data, which is classic overfitting — [QuantConnect](https://www.quantconnect.com/terminal/cache/embedded_backtest_6f9d52c7d250a4570ab127ed8b1b0541.html); [TradingView](https://www.tradingview.com/script/i3Uc79fF/).

### Inferences
- SuperTrend is mechanically an ATR-band trend follower (trailing stop around a mid-price), so its behaviour should resemble MA/breakout trend rules. Expect similar drawdown reduction and whipsaw costs in ranges, but no independent evidence of an edge.
- Bollinger mean-reversion (fade the bands) runs against the documented BTC momentum-at-highs effect. Bollinger *breakout* use, or long MA lengths, is more consistent with the evidence.

### Gaps
- No credible source gives win rate, Sharpe or drawdown after fees for SuperTrend or BB by timeframe (1h/4h/8h/12h/1D/1W). A head-to-head comparison would require an original backtest with walk-forward validation.

## 3. Timeframe vs. forecast horizon; default vs. tuned; overfitting

### Takeaway
The strongest evidence is on **daily bars forecasting next-day to multi-week returns** (MA ratios, 10–50-day highs). Intraday (1-minute to 5-minute) rule profits exist in-sample but are unstable, have decayed since about 2017, and often vanish after costs. No rigorous studies were found specifically for 4h/8h/12h bars. Tuning across large rule sets inflates in-sample results, and the out-of-sample BTC edge is weak.

### Cited Findings
- Bakker (Erasmus thesis, 2018) tested 3,312 intraday rules on 5-minute BTC/USD from January 2013 to July 2017. Many stayed significantly profitable after data-snooping corrections and costs, but **profitability is highly unstable and declines over time** — [Erasmus](https://thesis.eur.nl/pub/41546/Bakker.pdf).
- An NCCU thesis on 1-minute intraday range-breakout found effectiveness decreased after 2017 and **does not beat buy-and-hold after transaction costs** — [NCCU](https://thesis.lib.nccu.edu.tw/detail/5ee3a21ae846b1c833ff57e17695599b/).
- Daily MA ratios forecast **daily (next-day)** returns out of sample — [Detzel et al.](https://ideas.repec.org/a/bla/finmgt/v50y2021i1p107-137.html).
- Daily 10-day-high breakouts predict **next-day** returns, and shorter lookbacks worked better — [Quantpedia](https://quantpedia.com/trend-following-and-mean-reversion-in-bitcoin/).
- Out-of-sample decay: no BTC predictability out of sample across about 15,000 rules — [Hudson & Urquhart](https://hull-repository.worktribe.com/OutputFile/2639834). Profits may reflect data snooping — [Glasgow](https://theses.gla.ac.uk/82986).
- Tuning sensitivity: changing the Bollinger MA from 20 to 60 days moved returns from about 20% to above 50% — [Day et al.](https://ideas.repec.org/a/taf/apeclt/v30y2023i11p1437-1443.html). That parameter sensitivity is a sign of overfitting risk.
- A decade-long crypto trend-following study (arXiv 2009.12155) optimizes lookbacks for Sharpe and looks at drawdown and exposure. Results were not retrieved — [arXiv](https://arxiv.org/abs/2009.12155).

### Inferences
- Rough mapping, partly inferential:
  - Next 1 day: daily bars (price/SMA ratio, 10–20-day high).
  - Next 3–7 days: daily bars with 10–50-day lookbacks.
  - Next 30 days: daily or weekly trend filters (50/100/200-day SMA or weekly MA).
  - 1h/4h signals have an unproven edge after fees and should serve only for execution timing.
- Prefer default or round, lightly tuned parameters checked over many lookbacks (a plateau, not a peak). Use walk-forward or out-of-sample splits and model fees plus slippage of about 0.1% per side or more.

### Gaps
- No credible study was found for 4h, 8h or 12h BTC bars specifically.
- No study gave forecast accuracy explicitly for 3-day, 7-day and 30-day horizons.
- The 200-day MA on BTC appears only in non-rigorous blogs. No 2015–2026 academic 200D backtest with drawdowns was found.
