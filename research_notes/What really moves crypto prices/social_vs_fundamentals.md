# Social Attention/Mindshare vs Fundamentals as Predictors of Crypto (Altcoin, Memecoin) Returns

## (a) Do social/attention signals predict returns, at short and medium horizons, and do attention pumps reverse?

### Takeaway
Attention predicts returns, but mostly over short horizons. Abnormal attention (Google searches, Twitter ticker mentions) goes with positive same-day and next-day returns and more volatility. Extreme spikes, especially in small caps, tend to mark local tops and then reverse. The best evidence for reversal comes from vendors and student theses, not peer-reviewed cross-sectional tests.

### Cited Findings
- Liu & Tsyvinski (NBER w24877, 2018): crypto returns do not load on stock or macro factors, but "proxies for investor attention strongly forecast cryptocurrency returns," along with strong time-series momentum. Press coverage described the attention measure as Google search data. — [NBER](https://www.nber.org/system/files/working_papers/w24877/w24877.pdf); [CoinDesk](https://coindesk.com/markets/2018/08/10/google-search-can-predict-bitcoin-price-increases-study-finds)
- Liu, Tsyvinski & Wu (Journal of Finance 2022): three factors (crypto market, size, momentum) explain the cross-section. They tested 25 candidate factors on coins with market cap above $1M, from 109 coins in 2014 to 1,583 by end-2018. The 9–10 profitable long-short strategies are all explained by the 3-factor model. — [NBER w25882](https://www.nber.org/papers/w25882.pdf); [Cowles](https://cowles.yale.edu/sites/default/files/2022-10/LiuTsyvinskiWu2019%20COMMON%20RISK%20FACTORS.pdf)
- Hoang & Vo (2024): coins with higher abnormal Google search volume subsequently show higher returns, volatility and volume. — [IDEAS/RePEc](https://ideas.repec.org/a/eee/beexfi/v44y2024ics2214635024001060.html)
- Maître, Pugachyov & Weigert (Journal of Banking & Finance vol. 178, 2025): abnormal Twitter attention is the log daily post count minus its 30-day average. It is positively linked to same-day and one-day-ahead returns, which is continuation, not reversal. The predictability comes from investors' ticker-tweets, not from projects' official accounts. — [CFR WP 25-02](https://cfr-cologne.de/download/workingpaper/cfr-25-02.pdf); [IDEAS](https://ideas.repec.org/a/eee/jbfina/v178y2025ics0378426625001384.html)
- A 2023 Bilkent thesis built an attention index from Twitter, Reddit and Google Trends. The index does not explain returns, but returns strongly drive later attention (reverse causality). — [Bilkent](https://repository.bilkent.edu.tr/items/475a58c7-f85a-457c-8cb9-a64eb02583da)
- A 2021 Erasmus thesis found that lagged Reddit sentiment drives daily returns for the three coins studied, while the Twitter effect held only for BTC. — [EUR thesis](https://thesis.eur.nl/pub/61895/Hurjui-R-466956.pdf)
- Santiment, a vendor, makes the reversal claim: extreme social-volume spikes during rallies "often" mark local tops, especially in mid and low caps. Its "Peak Hype" study reports that after a coin reaches the top 3 of its Emerging Trends list, price falls an average of 8.2% over the next 12 days. One example: AVAX fell 41% over a month after a roughly 300% social-volume spike. Santiment concedes it is "not always." I found no independent replication. — [Santiment Academy case study](https://academy.santiment.net/education-and-use-cases/case-study-social-volume/); [Santiment insight](https://insights.santiment.net/read/want-to-know-when-the-pump-is-over-skip-this-study-at-your-own-risk-santiment-weekly-brief-5849?_wc=1)

### Inferences
- Attention looks like a fast-decaying momentum signal over hours to days. Once a spike is extreme and public (trending lists, top social volume), it works better as a contrarian exit signal than as a reason to buy.
- Much of the "attention predicts price" correlation may run the other way: price moves create attention. Signals should therefore be measured as abnormal attention that comes before the price move.

### Gaps
- I found no peer-reviewed numbers for LunarCrush Galaxy Score/AltRank or for CoinGecko/CMC trending-list entries, though Santiment's vendor figure is a proxy. Medium-horizon (1–3 month) reversal after attention spikes has not been tested in a peer-reviewed cross-section, as far as I found.

## (b) Pump-and-dump studies (Telegram groups, detection)

### Takeaway
Telegram and Discord pumps are common, last minutes, cluster on small coins on a few exchanges, and reverse almost completely. They can be detected within seconds and partly predicted before they happen.

### Cited Findings
- Kamps & Kleinberg (Crime Science 2018) define crypto pump-and-dumps (P&Ds) as minutes-to-hours events organized through public or private groups, unlike traditional schemes that run for days or weeks. Their anomaly detection on trading data works, and the fraud clusters on specific exchanges and coins. A later method (HD Pump) reports 84.3% recall and 56.8% precision against their 75.0% and 50.1%. — [Crime Science](https://crimesciencejournal.biomedcentral.com/track/pdf/10.1186/s40163-018-0093-5); [UCL](https://discovery.ucl.ac.uk/id/eprint/10069142/)
- Xu & Livshits (USENIX Security 2019) studied 412 Telegram-run P&Ds from mid-2018 to early 2019. A model predicting which listed coin gets pumped reportedly returned up to 60% in about 2.5 months in simulation; the arXiv v1 draft reported 220 events and up to 80% in about 3 weeks. Features include market cap, volume, returns and prior pumps, with only four exchanges covered. — [USENIX](https://www.usenix.org/conference/usenixsecurity19/presentation/xu-jiahua); [arXiv v1](https://arxiv.org/pdf/1811.10109v1); [Quantpedia](https://vvv.quantpedia.com/?p=12814)
- La Morgia et al. ("The Doge of Wall Street," ACM TOIT 2023, extending the ICCCN 2020 paper): over 3 years of monitoring and about 900 events, they also cover "crowd pumps" such as the Reddit-driven DOGE and XRP episodes. Their model detects a P&D within 25 seconds of the start, with 94.5% F1. — [arXiv 2105.00733](https://arxiv.org/abs/2105.00733v2); [arXiv 2005.06610](https://arxiv.org/html/2005.06610v2)
- Ardia & Bluteau (2023): Twitter draws attention to P&Ds, producing abnormal returns before the event. — via search summary; [arXiv 2306.02148](https://arxiv.org/abs/2306.02148)
- Pump.fun memecoins: fewer than 1% "graduate" to a DEX. The peak was 1.67% (Nov 2024), or 2.1% in Jun 2024 per The Block, with 0.7–0.8% in Jul–Aug 2025. A vendor blog reports about 0.26% in mid-June 2026. — [Cointelegraph](https://cointelegraph.com/news/pump-fun-memecoins-are-dying-at-record-rates-less-than-1-survive); [The Block](https://www.theblock.co/post/343742/pump-fun-rapid-decline-graduating-tokens-memecoin-frenzy-fizzles-out); [DEXTools](https://www.dextools.io/news/pump-fun-graduation-collapse-solana-fees-2026)

### Inferences
- For a buyer who reacts to the social signal, expected return on a pumped coin is strongly negative. The edge goes to organizers and to anyone who front-runs pump candidates, such as low-cap coins with past pumps on specific exchanges.
- Signs that a pump is under way: a sudden volume spike several times normal on a thin small-cap, a pump on one exchange only, and coordinated cashtag bursts.

### Gaps
- I found no quantified average post-pump drawdown in the snippets. The papers report one, but I did not extract it. Memecoin loss rates beyond graduation proxies are not in my sources.

## (c) Do fundamentals (GitHub, TVL, revenue/fees, active addresses) predict returns, and why do good-use-case coins stagnate?

### Takeaway
Evidence for fundamentals is weak to mixed. User adoption (new users, active addresses relative to value) shows the most support, with a few percentage points of explained variation or weekly spread. TVL/market cap does not predict returns. GitHub activity has only weak or vendor-backed support. Results for fees and revenue are practitioner-level only.

### Cited Findings
- Liu, Tsyvinski & Wu (2021), per a 2025 survey: on-chain user adoption (new-user growth) has a significant effect on prices and explains about 8% of return variation. — [arXiv 2510.14435](https://arxiv.org/pdf/2510.14435)
- A St. Gallen study of 652 cryptoassets: the ratio of active addresses to network value is a common risk factor. High-ratio coins earn 2.1 percentage points more per week than low-ratio coins of similar size. — [Alexandria UNISG](https://alexandria.unisg.ch/handle/20.500.14171/111544)
- DeFiX (arXiv 2022): TVL/market cap as a valuation ratio does not predict returns. A 2024 HAL paper using TVL-to-market in a Fama-French-style model finds no factor significantly priced. An Algorand-sponsored long-short test on more than 300 tokens (top vs bottom quartile, weekly) also found that TVL does not predict returns. — [arXiv 2204.00251](https://arxiv.org/abs/2204.00251v1); [HAL](https://hal-cstb.archives-ouvertes.fr/LJK-MAD-CASC/hal-04507930v1); [Algorand blog](https://algorand.co/blog/the-surprising-irrelevance-of-total-value-locked-tvl-on-cryptocurrency-returns)
- A Greenfield Capital practitioner model: revenue edges out fees by about 1.7 percentage points over the last six windows, they tie over twelve, and fees lead over the full history. The model has underperformed recently. — [Greenfield](https://greenfieldcapital.com/?p=4397)
- GitHub: Ortu et al. (EPJ Data Science 2020) find that developer emotions Granger-cause BTC and ETH prices and lower LSTM prediction error. A March 2026 CryptoScores test on 274 of the top 300 coins reports a 30-day correlation of +0.58 to +0.60 for its best three-indicator combo including GitHub, with the top quartile at +10.8% versus a +1.0% median. That test uses proprietary scores, is not peer reviewed and covers a short window. — [EPJ](https://epjdatascience.springeropen.com/track/pdf/10.1140/epjds/s13688-020-00239-6); [CryptoScores](https://www.cryptoscores.com/blog/fundamental-signals-cryptocurrency-performance)

### Inferences
- Why "good use case" coins stagnate:
  - Cross-sectional returns are dominated by market beta, size and momentum, not by valuation (Liu, Tsyvinski & Wu).
  - TVL and fees often do not flow to token holders.
  - Supply unlocks and emissions dilute holders. This is my inference; I found no source in this pass.
  - Attention, not use, drives the marginal buyer.
- Fundamentals work best as a filter for survival and quality, and as a slow tilt toward adoption-per-dollar, not as a timing signal.

### Gaps
- I found no peer-reviewed price-to-fees cross-sectional test. Token Terminal, Messari and the Electric Capital developer report were not retrieved, so I have no figures from them.

## (d) Bot and paid-shill distortion; judging whether social activity is genuine

### Takeaway
A large share of crypto social activity comes from bots, and bot-driven hype predicts worse long-run returns. Genuine signal comes from organic, investor-originated discussion, not from official or bot accounts.

### Cited Findings
- More than 56% of Twitter accounts sharing Telegram or Discord invite links were bots or suspended. 93% of the links shared by bots pointed to P&D channels. — [arXiv 2001.10289](https://ar5iv.arxiv.org/html/2001.10289)
- In a 2019 P&D study, most highly active users in crypto tweets were bots, especially during pumps. — [arXiv 1902.03110](https://arxiv.org/pdf/1902.03110.pdf)
- A Yale study of more than 1M tweets about 48 coins (2019–2021): coins with more bot posts had lower long-term returns. NCRI (2023) analyzed more than 3M tweets on 18 coins and found bot activity tied to price effects in about half of them. — via search summary of [Blockworks](https://blockworks.com/news/crypto-twitter-bots-returns) and other coverage; [arXiv 2306.02148](https://arxiv.org/abs/2306.02148)
- Predictability comes from investors' ticker-tweets, not official channels (Maître et al. 2025, above).

### Inferences
- Legitimacy checks:
  - Share of unique, aged accounts in the discussion
  - Bot score of the top posters
  - Ratio of discussion to holders
  - Whether attention spreads across platforms (Reddit, GitHub, search) or sits only on X and Telegram
  - Whether search and on-chain new users rise along with mentions
- Mentions without matching growth in holders or users suggest paid shilling.

### Gaps
- I could not open Blockworks to get exact effect sizes from the Yale study. I found no figures on how widespread paid KOL shilling is.
