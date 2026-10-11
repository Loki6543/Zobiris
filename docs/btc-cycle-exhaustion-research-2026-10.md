# Bitcoin cycle pivot/exhaustion research — evidence and implementation contract

**Status:** RESEARCH ONLY / no trading authority. Adopted idea; **not** an implementation of Cosmic_Whale's unavailable proprietary indicators.

## Attribution / inputs

User-provided **Cosmic_Whale's 5-Indicator System — A Methodology Revealed** (Zobiris Research Team, dated August 11, 2026; 14 pages). It describes an alleged Oct 30, 2023 social screenshot of five TradingView indicators attributed to @Cosmic_Whale888:
1. **2x SLIT:** shock zones.
2. **0xTime:** shock zones using candle-close timing.
3. **Double Slit:** potential exhaustion/pivot diamond markers.
4. **0xTimeless:** pinch + exhaustion pivot zones.
5. **OldPNAR+Timeless:** a variation on pinch/exhaustion pivot zones.

**Source-quality limitations:** the supplied PDF has *no embedded screenshot/image* and does not supply source code, executable rules, contemporaneous indicator outputs, immutable signal history or an independently run backtest. Independent web searching did not establish authoritative source-code access or reproduce those five scripts. Different TradingView creators with the word “Cosmic” in their name are **not** proof of this claimed author's indicator set. Do not state these five have been installed, executed, verified or replicated.

The paper is internally inconsistent about the description of “2x SLIT” (section 2 versus appendix source transcription). It asserts post-2023 methodology explained 2022 forecasts, but cannot prove the 2022 forecasts came from those tools as they were then. Its “95% → 97% credibility” uses subjective weights, not calibrated forecast accuracy. Historical pivot irreversibility is knowable only retrospectively; no certain pivot should be identified in real time. Its 2026/2027 price ranges are **author-attributed scenarios**, not verified outputs or probability bands.

## Forecast claims retained for verification (NOT adopted)

The document attributes the following date/price scenarios to Cosmic_Whale or its V5.3.2 discussion. These are *claimed forecasts*, not observations from running the original five indicators and not ZOBIRIS targets:

| Attributed scenario | Claimed window | Claimed BTC USD range | Status |
| --- | --- | --- | --- |
| Intermediate cycle bottom | July 14–November 16, 2026 | $30,000–$56,000 | Unverified forecast; evaluate only against pre-registered definition of a bottom |
| Document appendix Q4 first bottom | October–December 2026 | $45,000–$50,000 | Unverified scenario |
| Subsequent “true bottom” | Q1–Q2 2027 (appendix says April–June) | $30,000–$40,000 | Unverified future scenario |
| Recovery rally between lows | January–February 2027 | $65,000–$75,000 | Unverified scenario |

Record the specific original post time, prospective price and date before resolving the outcome. Do not retrospectively relabel a temporary low as a permanent pivot or count 5 correlated indicators as 5 independent confirmations. Their predicted ranges are not entry/exit prices or probabilistic intervals.

## What ZOBIRIS implements (independent transparent proxy)

`deploy/protection/overrides/src/server/bitcoinCycleResearch.ts` derives one research-only observation from the **existing, completed daily BTC market brief**. It does not fetch new provider data or change the decision engine.

- **Weekly price expansion:** absolute 7-day close-to-close change ≥ max(5%, 2 × current ATR%).
- **RSI exhaustion:** RSI(14) ≤ 30 (seller stress) or ≥ 70 (buyer extension).
- **Trend reference:** close below EMA50 for potential seller exhaustion; above EMA50 for potential buyer exhaustion.
- All three conditions must align to emit a **watch** label. Otherwise `NO_CONFLUENCE`; incomplete/invalid evidence -> `EVIDENCE_UNAVAILABLE`.
- The completed daily candle is a **bar-close input**, not proof the ensuing market reversal is confirmed.
- Inputs reuse the BTC close, RSI, ATR, EMA and 7-day momentum of the existing Kraken brief. There is no 1h/6h indicator and no claim to have run the five original scripts.
- The thresholds are **illustrative**, frozen at v0.1 and uncalibrated, and cannot be interpreted as calibrated odds of profitable trades.
- All observations report `pivotConfirmed:false`, `validatedSuccessProbability:null`, `originalIndicatorStatus:NOT_RUN` and `status:RESEARCH_ONLY_NO_TRADE_AUTHORITY`.

**Authority restrictions:** No impact on `integrateStrategy21`, `portfolioGate`, positions, entries/exits, requested order size, Kelly sizing, live signals, or other market/coin scores. Research labels cannot increase admission, sizing or capital authority. Data gaps must not silently convert to affirmative pivot signals.

## Evidence upgrades before strategy weighting

1. Obtain and archive the actual Oct 2023 original post, indicator access/immutable code, settings, version history, and pre-2022 time-stamped signals if available. Distinguish verified access from claims in research PDFs.
2. Pre-register the exact signal construction, timestamps, applicable market/timeframes, control strategy, benchmarks, exit horizon, cost assumptions, and untouched future evaluation.
3. Backtest using only information available at each historical *decision close*. Assess repainting, signal revisions, correlated indicators and how many signals appeared for false pivots, not just three selected historic lows.
4. Report turn-point precision/recall, lead time, missed reversals, trade P&L net of fees and slippage, confidence intervals, and comparisons against basic RSI + ATR + EMA baselines.
5. Preserve research/oos/vault separation; no reuse of a viewed holdout to tune filters. Record all attempted candidate specifications and false positives.
6. Only with actual measurable incremental forward edge may an independent governance process consider adjustments, but never via this research module itself.

External context reviewed: general bar-close research methodologies from other TradingView authors are illustrative of what can be measured, **not corroboration of Cosmic_Whale**. Neither private access nor 97% predictive performance has been authenticated.

This source is a conceptual hypothesis, not financial advice.
