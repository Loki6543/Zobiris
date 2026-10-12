# Bitcoin liquidations, on-chain metrics and positioning as predictors of BTC's next 1-7 days

## (1) Long vs short liquidation spikes: what follows over 1-7 days?

### Takeaway
I found no peer-reviewed study that measures BTC returns 1-7 days after long- or short-liquidation spikes. The evidence is event studies of cascade mechanics plus anecdotal practitioner commentary. The common view is that a long flush "resets" leverage and often marks a local low, and that a short squeeze extends a rally. Glassnode-cited coverage itself warns that long-liquidation spikes do not reliably mark bottoms.

### Cited Findings
- Glassnode defines Futures Long Liquidations Dominance as long liquidations / (long + short). Above 50% means longs dominate. It read 67.5% on 5 Mar 2026. — [Glassnode Studio](https://studio.glassnode.com/charts/derivatives.FuturesLiquidatedVolumeLongRelative?a=BTC)
- Jan 2022: long-liquidation dominance hit 69%, the highest since the May 2021 deleveraging. The article notes that long-liquidation spikes do not always mark local bottoms. — [Cointelegraph](https://cointelegraph.com/markets/bitcoin-batters-longs-as-liquidations-copy-may-2021-run-to-30k)
- Glassnode commentary (via CoinGlass data) says large long deleveraging "can reset market positioning and reduce the immediate risk of further cascading declines". This is opinion, not a backtest. — [KuCoin news](https://www.kucoin.com/news/flash/24-hour-crypto-liquidations-reach-967m-long-positions-dominate)
- Glassnode analysts flagged possible short liquidations amid extreme leverage, which frames the squeeze as positioning-driven. — [ForkLog](https://forklog.com/en/glassnode-analysts-flag-potential-short-liquidations-amid-extreme-leverage/)
- arXiv 2607.27070 studies seven BTC-perpetual liquidation cascades (2022-2025), including the record ~$19B event on 10 Oct 2025, using minute-level price and 5-minute leverage and order-flow data. No early-warning variable holds across all events, so the signals are event-heterogeneous. — [arXiv](https://arxiv.org/pdf/2607.27070)
- arXiv 2608.03616 uses an on-chain fill log and finds the Oct 2025 crash was "deeply subcritical", with a branching ratio of about 0.1-0.2: each liquidation triggered few follow-on liquidations. — [IDEAS/RePEc](https://ideas.repec.org/p/arx/papers/2608.03616.html)
- On Hyperliquid after 10 Oct 2025, spreads recovered to within 1.2x of pre-event levels, but depth stayed at 66-79% of pre-event for 4 of 5 contracts over 23 days. Liquidity stays fragile for weeks after a flush. — [JFDA, Lim](https://journals.lincoln.ac.nz/index.php/JFDA/article/view/1395)
- Estimates put longs at about 80-90% of the 10-11 Oct 2025 liquidations. Totals conflict: about $19B across venues vs $2.3B single-day in Amberdata. — [investingLive](https://investinglive.com/cryptocurrency/one-year-after-crypto-s-20-billion-liquidation-day-the-lesson-for-bitcoin-traders/); [Amberdata](https://blog.amberdata.io/leverage-liquidations-the-31b-deleveraging)
- Media regularly label short-dominated liquidation days "short squeezes" (e.g. $485M of $609M were shorts as BTC tested $75K in Mar 2026). These are descriptive, not predictive. — [Cointelegraph](https://cointelegraph.com/markets/bitcoin-liquidations-top-dollar283m-after-short-squeeze-sends-btc-price-above-dollar75k)
- A prolonged negative funding stretch (67 consecutive days of negative 30-day average funding) was argued by some analysts to signal a bottom. This is opinion. — [The Block](https://www.theblock.co/post/400302/bitcoin-whales-hyperliquid-net-long-positions-2026-high)

### Inferences
- Treat liquidation imbalance as a conditioning or regime feature, not a stand-alone directional signal. A plausible hypothesis to test is mean reversion after extreme long-dominance days when funding turns negative and open interest drops sharply, versus continuation after short squeezes while OI rebuilds. Neither is established in the literature I found.
- Volatility predictability after cascades is stronger than direction predictability: depth stays thin, so expect elevated 1-7 day realized volatility.
- Liquidation data is venue-partial. Binance's stream sends at most one liquidation per symbol per second, so totals are undercounts. Normalize by OI or volume, and use z-scores or percentiles rather than raw dollars.

### Gaps
- No academic forward-return table (1d/3d/7d) conditional on long or short liquidation spikes was found. The user's own backtest is needed.
- I did not verify whether Coinglass or CryptoQuant have published such conditional-return studies.

## (2) On-chain valuation and cycle metrics: evidence and horizons

### Takeaway
On-chain valuation metrics (MVRV / MVRV-Z, NUPL, realized price, Mayer multiple, LTH supply) are cycle-scale tools, useful over months. They have little demonstrated power at 1-7 days. The best academic support is for cycle timing (Grobys et al.) and for exchange-reserve changes predicting returns and volatility (Hoang & Baur). Most threshold claims (e.g. MVRV > 3.5 overheated, < 1 undervalued) are practitioner heuristics.

### Cited Findings
- Grobys, Näsman & Sandretto test on-chain indicators, including MVRV Z-score, for predicting BTC price cycles over 2013-2025 (three cycles). Indicator strategies beat buy-and-hold and Monte Carlo random-entry benchmarks. This is a fixed-sample cycle study, not clearly out-of-sample. — [Univ. of Vaasa repository](https://osuva.uwasa.fi/items/48a4f9df-03ca-4b96-9072-07b462b14dfa/full)
- A related Vaasa thesis reports that NUPL and MVRV-Z long signals produced cumulative returns above 326,000% in the best cases. This is an in-sample backtest, so treat it with caution. — [Univ. of Vaasa](https://osuva.uwasa.fi/handle/11111/4562)
- Hoang & Baur: changes in exchange reserves are negatively related to contemporaneous and future BTC returns, and positively related to volatility. Long-term returns are associated only with decreasing reserves; short-term returns respond to both increases and decreases. — [Quantpedia summary](https://quantpedia.com/bitcoin-returns-and-volatility-predicted-by-bitcoin-exchange-reserves/)
- Exchange-flow data is noisy because of wallet labelling, internal transfers and OTC flows. — [BIT Knowledge Hub](https://www.bit.com/insights/knowledge-hub/exchange-net-flow)
- SOPR was proposed by Renato Shirakashi in 2019. It is value sold / value paid for coins moved on-chain: above 1 means profit-taking, below 1 means loss-taking. MVRV = market cap / realized cap (aggregate cost basis). — [ForkLog](https://forklog.com/en/wp-json/wp/v2/posts/37780); [LuxAlgo](https://www.luxalgo.com/library/concept/sopr.md)
- MVRV captures unrealized profit and SOPR captures realized profit. A divergence (large unrealized profit, little realization) is read as a regime signal. — [LuxAlgo](https://www.luxalgo.com/library/concept/sopr.md)
- Thresholds such as MVRV > 3.5 overheated and < 1 buy zone come from unsourced blog guides. — [DEV Community](https://dev.to/shaktitiwari715-ai/bitcoin-on-chain-metrics-that-actually-predict-price-mvrv-nupl-sopr-explained-2026-guide-4551)
- For comparison, technical-indicator predictability of BTC returns is statistically significant out-of-sample but tiny (out-of-sample R² up to about 0.52%). — [Liu 2019, Physica A](https://ideas.repec.org/a/eee/phsmap/v533y2019ics0378437119311380.html)

### Inferences
- Horizons: MVRV, realized price, the Mayer multiple (price / 200-day MA) and LTH supply move slowly (weeks to months). For a daily model, use them as regime priors (e.g. scale the base rate or volatility), not as day-to-day signals. SOPR (especially the short-term-holder version) resetting to 1 and exchange-netflow shocks are the only on-chain metrics with plausible days-scale relevance.
- The extreme zones (MVRV < 1, price below realized price) have occurred only a handful of times since 2017, so sample sizes are tiny and overfitting risk is high.

### Gaps
- I found no rigorous out-of-sample academic test of SOPR, LTH supply or the Mayer multiple at 1-7 day horizons.
- The Hoang & Baur effect size and horizon details were not verified in the primary paper (only the Quantpedia summary).

## (3) Building and evaluating a daily BTC forecast honestly; realistic accuracy

### Takeaway
In properly held-out tests, daily BTC direction accuracy is only slightly above 50%. Typical credible results are about 50-58%, and best-practice hourly studies report AUC around 0.51. Claims above 60-65% (let alone 99%) usually reflect leakage or in-sample evaluation. Benchmark against a random walk / climatology baseline, and score probabilities with the Brier score and calibration.

### Cited Findings
- A 2021 study found about 4% misclassification in-sample vs about 41% out-of-sample for BTC return direction, which illustrates severe overfitting. — [Model Assisted Statistics & Applications](https://content.iospress.com/articles/model-assisted-statistics-and-applications/mas210530)
- A 2023 daily-direction study (logistic regression, random forest, SVM; 90/10 split) reports a best test accuracy of 58.18% (random forest). — [CRORR](https://ojs.srce.hr/crorr/article/view/27587)
- A 2026 preprint: AUC consistently above 0.50 on unseen data is a non-trivial departure from the random walk. Its best 3-hour model reached AUC 0.5084. It warns that high F1 claims often stem from leakage through overlapping train/test windows. — [arXiv 2607.23370](https://arxiv.org/pdf/2607.23370)
- A practitioner walk-forward XGBoost study on daily BTC: only 1 of 40 windows had positive R². (Unverified secondary source.) — [DEV Community](https://dev.to/shaktitiwari715-ai/the-honest-guide-to-btc-trading-strategies-with-xgboost-ml-what-works-what-overfits-2026-19na)
- A paper claiming 99.2% daily-direction accuracy is a red flag for leakage. — [Gazi Univ.](https://avesis.gazi.edu.tr/yayin/dc987843-0331-45fa-966d-1336f40ff368/bitcoin-price-direction-prediction-using-machine-learning-on-a-very-small-dataset)

### Inferences
Recommended protocol (methodological synthesis, not from a single source):
- **Baselines.** Random walk (zero expected return), and climatology: P(up) = trailing share of up days, about 52-53% for BTC in bull-skewed samples. Always report accuracy against "always up", because drift alone can produce about 53%.
- **Evaluation.** Walk-forward or expanding-window training, with a purge/embargo gap equal to the forecast horizon (essential for overlapping 7-day targets). Use only point-in-time data, since on-chain metrics such as LTH supply and exchange labels are revised. Use timestamp-aligned features: daily close in UTC, with no use of same-day on-chain data unavailable at decision time.
- **Metrics.** Directional accuracy with a binomial confidence interval (with about 250 test days, ±6 points at 95%, so 55% is not distinguishable from 50%). Also report the Brier score and Brier skill score vs climatology, log loss, a reliability diagram / calibration (ECE), and Diebold-Mariano tests vs the random walk for magnitude forecasts.
- **Realistic targets.** About 51-55% direction, a Brier skill score of a few percent at best, and better skill in volatility than direction.

### Gaps
- No single primary study comparing many daily BTC models against a random walk with Brier scores was found.

## (4) Free / keyless data sources

### Takeaway
Keyless options: the Binance futures public WebSocket (`!forceOrder@arr`) for live liquidations (you must log your own history), the Coin Metrics Community API (no key; 10 requests per 6 s) for on-chain basics, and the blockchain.com charts and mempool.space APIs. Coinglass's API requires a key (paid plans from about $29/month). Its free access is dashboard-only.

### Cited Findings
- Binance USDⓈ-M `<symbol>@forceOrder` and `!forceOrder@arr` streams push at most the latest liquidation per symbol per 1000 ms, and send nothing if none occurred. The payload carries symbol, side, quantity and price. Community tools connect at `wss://fstream.binance.com/ws/!forceOrder@arr`. — [Binance docs](https://developers.binance.com/docs/derivatives/usds-margined-futures/websocket-market-streams/All-Market-Liquidation-Order-Streams); [crypto-liquidations-mcp](https://glama.ai/mcp/servers/@kukapay/crypto-liquidations-mcp/blob/d9a02cda38bdb0f3556fe9a112997f29c82e1900/README.md)
- A COIN-M equivalent stream exists. — [Binance COIN-M docs](https://developers.binance.com/docs/derivatives/coin-margined-futures/websocket-market-streams/All-Market-Liquidation-Order-Streams)
- Coin Metrics Community API: `https://community-api.coinmetrics.io/v4`, no API key, 10 requests per 6 s per IP. It offers a free subset of network data; MVRV free-float and active-supply market-cap metrics were added in 2024. Check `/catalog/asset-metrics` for exact availability of fields such as CapMVRVCur and SplyAct1yr. — [Coin Metrics docs](https://docs.coinmetrics.io/packages/coin-metrics-community-data); [Coin Metrics blog](https://coinmetrics.io/?p=8064); [Supply metrics](https://docs.coinmetrics.io/network-data/network-data-overview/supply)
- Coinglass API: a key is required. The Hobbyist plan is $29/month (30 requests/min), and plans go up to $699. Commercial use starts at the Standard tier. Some liquidation features and real-time streams need Startup+. The website dashboards are free to view with limited history. — [NexusFi](https://nexusfi.com/d/data-providers/coinglass/); [coinglass-mcp](https://glama.ai/mcp/servers/forgequant/coinglass-mcp); [cryptoticker review](https://cryptoticker.io/en/coinglass/reviews/)
- Glassnode's public chart pages show some metric values (e.g. long-liquidation dominance), but API access is paid. — [Glassnode Studio](https://studio.glassnode.com/charts/derivatives.FuturesLiquidatedVolumeLongRelative?a=BTC)

### Inferences
- blockchain.com Charts API (`api.blockchain.info/charts/...`, e.g. market-price, hash-rate, n-transactions) and the mempool.space REST API (fees, mempool, blocks, difficulty) are keyless. They are well known but I did not re-verify them this session: [blockchain.com charts API](https://www.blockchain.com/explorer/api/charts_api), [mempool.space API](https://mempool.space/docs/api). They cover network activity and fees, not MVRV or SOPR.
- Binance REST public endpoints for funding rate, open interest history and long/short ratios (`/fapi/v1/fundingRate`, `/futures/data/openInterestHist`, `/futures/data/globalLongShortAccountRatio`) are keyless and are useful positioning complements. They were not re-verified here; the openInterestHist and ratio endpoints historically keep only about 30 days, so archive them daily.
- Since keyless liquidation history is not available, start logging the Binance stream now. History reconstruction would otherwise require paid Coinglass.

### Gaps
- Exact list of community-tier Coin Metrics metrics (CapMVRVCur, SplyAct1yr, SOPR availability) not confirmed.
- Whether any Coinglass endpoint works without a key is unconfirmed (the evidence suggests not).
