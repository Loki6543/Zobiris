# Measured Price Impact of Discrete News/Event Types on Crypto (esp. small-cap altcoins), 2017–2026

Source-quality note: academic event studies (Ante; Ante & Meyer; Saggu; NY Fed; Jakobs et al.) use market-model abnormal returns (ARs). Most industry studies (Keyrock, RockawayX, HTX, Tokenomist, Messari) use raw or BTC-adjusted returns, and many have no control group. Treat them as descriptive. Several figures (the 2024 Binance listing decay series, delisting −25–30%) were found only through secondary aggregators. These are flagged where they appear.

## 1. Exchange listings and delistings: abnormal returns from day −7 to +30, and do gains reverse?

### Takeaway
Listings produce a significant but short-lived positive AR. It is about +5–7% on day 0 and +9–10% over [−3,+3] in the 2017–2019 academic samples. A sizeable part arrives before the listing (leakage), and it reverses from day +2 onward. Studies of 2024–2025 show the "listing effect" decaying to zero within about 30 days and turning sharply negative over 1–6 months. First-day buyers on Binance, Upbit and Bithumb lost about 70% on average by early 2026. Korean listings (Upbit and Bithumb) still produce the largest intraday pops. Delistings are a durable negative.

### Cited Findings
- **Ante (2019, Blockchain Research Lab working paper):** significant average AR of +5.7% on listing day and +9.2% over [−3,+3]. Abnormal buy-and-hold returns were about 48% over the first 30 trading days (as cited by Ante & Meyer). Only some exchanges produced significant positive ARs (up to +25.5% on day 0). Others showed none or negative effects, and some showed positive pre-event ARs, "suggest[ing] that information about listing events likely leak[s]." Exchange-level results: Binance N=44, 70% positive on day 0, significant. Coinbase N=7, insignificant on day 0, significantly negative on day +1. — [BRL working paper](https://www.blockchainresearchlab.org/wp-content/uploads/2019/10/Exploring-Market-Reactions-to-Exchange-Listings-of-Cryptocurrencies-BRL-working-paper3.pdf)
- **Ante & Meyer (2021, Decisions in Economics and Finance), ICO-token cross-listings:**
  - Day-0 AR is +6.51% (+6.73% under an alternative model), with 56–59% of events positive. CAAR is +8.7% for [−1,+1], +9.12% for [−2,+2] and +9.97% for [−3,+3].
  - Pre-event leakage: [−3,−1] CAAR is +4.97% (p<0.01).
  - Reversal: AAR on day +2 is −1.21% to −1.7%, and [+2,+3] CAAR is −1.4%. In that window Binance was −6.8%, Bithumb −5.4% and KuCoin −4.3%. CAAR is "negative for virtually all post-listing windows."
  - Over the full window, Binance listings gave +20.3% CAAR. Individual exchanges ranged up to +34% on day 0.
  - — [Springer](https://link.springer.com/article/10.1007/s10203-021-00323-0)
- **Messari (2021, via CoinDesk/Yahoo), 5-day returns after listing:** Coinbase listings had the highest average return, +91%, with a range from −32% to +645%. The ranking held after removing outliers. In the Cardano example, ADA rose 36% in two days after the Coinbase *announcement*, and part of the gain reversed when trading began. — [Yahoo/CoinDesk](https://finance.yahoo.com/news/coinbase-effect-means-average-91-161123386.html)
- **RockawayX (2024 listings on Binance, Bybit and MEXC; staggered difference-in-differences plus pre/post comparison):**
  - At 7 days, Binance and Bybit listings were significantly bullish, but confidence intervals were wide.
  - At 30 and 60 days, the regressions were not statistically significant, while the pre/post comparison was bearish. Binance tokens pumped for a few days, then "gradually sells off back down to no ROI over 30 days." Bybit tokens had a pre-listing run-up in the prior week, consistent with leakage. MEXC (mostly small caps; only about 3.6% of its listings were above $500M) drifted down steadily.
  - Binance tokens under $100M market cap looked most bullish at 7 days, but the sample was small.
  - Conclusion: "All listing effects are short term and all gains tend to sell off after several days."
  - — [RockawayX](https://www.rockawayx.com/insights/bullish-or-bearish-what-really-happens-when-tokens-list-on-a-cex)
- **Conflicting industry figures cited by RockawayX:** CoinDesk (2023) reported a +41% Binance listing spike. Animoca Research (2024) reported a −49% average drop after CEX listings, with large variation by exchange. — [RockawayX](https://www.rockawayx.com/insights/bullish-or-bearish-what-really-happens-when-tokens-list-on-a-cex)
- **2024 Binance listing decay series (secondary source only):** the average return was +2.78% the day after listing, +0.40% at 1 week, −1.76% at 1 month, −22.66% at 3 months and −37.64% at 6 months. The same source states that the 2023 "Binance effect" was +41% the day after listing and +24% by day 3. The primary source was not verified. — [Bitbase blog](https://www.bitbase.com/blog/crypto-market-catalysts)
- **Binance listings in early 2025 (analyst post on X, relayed by Binance Square):** only 3 of 27 tokens listed in early 2025 were positive, and the other 24 averaged −44%. This is anecdotal: there is no benchmark and the window is short. — [Binance Square](https://www.binance.com/en/square/post/22373674038210)
- **HTX Research (all 2025 KRW listings, held from first-day close to 11 Mar 2026):**
  - Upbit (N=59): portfolio fell to 31% of the initial investment (−69.5%), median −80.9%. Only 2 tokens were profitable (KITE +232.8%, BARD +9.3%).
  - Bithumb (N=144): −69.1%, median −82.1%, 8 tokens profitable.
  - Binance (N=92): −71.7%.
  - Tokens listed on both Upbit and Bithumb (N=50) returned −69.4%, versus −68.9% for Bithumb-only tokens. Multiple listings gave no protection.
  - Not benchmark-adjusted, and 2025 was a down-market.
  - — [HTX](https://www.htx.com/news/2025-korean-cex-listing-review-investing-in-new-tokens-70-lo-9ye26cVT/?+Analysis=&category=Research+&categoryTitle=Indepth+Research)
- **Korean listing pump magnitudes:**
  - DataMaxi+ (a vendor selling a low-latency announcement feed, so possibly biased) reported maximum expected returns after 2025 listings of 51.9% for Upbit and 108.9% for Bithumb, with top intraday moves above 800% from listing price. — [DataMaxi+ Medium](https://medium.com/@datamaxiplus/the-rise-of-korean-exchange-listing-alpha-capturing-upbit-and-bithumb-listing-pumps-9c9055388f15)
  - Klein Labs (2024, via NFT Evening) ranked Bithumb second among CEXs for post-listing performance, with +9.05% average and +5.3% median over 30 days. — [NFT Evening](https://nftevening.com/upbit-bithumb-the-new-hope/)
  - Example: on an Upbit listing, RAY jumped +34.3% within minutes and was +11.3% a few hours later. — [BeInCrypto](https://beincrypto.com/upbit-listing-new-tokens/)
  - Kaiko describes Upbit and Bithumb announcement "listing pumps" as a recognized phenomenon; Upbit and Bithumb hold about 96% of Korean volume. — [Kaiko](https://www.kaiko.com/resources/the-state-of-the-korean-crypto-market)
- **Delistings:**
  - Binance's European delisting of Monero (Feb 2024), synthetic-control study: a significant negative price effect "with no immediate recovery." — [Renwick & Gleasure](https://exa.ai/library/publication/gcqcc02tc4c)
  - Secondary source: prices typically fall 25–30% within hours of a delisting announcement and volume collapses by up to 90% within a day. The primary source was not verified. — [Bitbase](https://www.bitbase.com/blog/crypto-market-catalysts)

### Inferences
- Across 2017–2025, the short-window listing AR shrank (roughly +6% on day 0 and +41–91% headline pops in 2017–2021, versus a few percent in 2024 on Binance). The longer-horizon reversal grew. Listing announcements now look like a "sell-the-news" liquidity event for low-float, newly launched tokens, many of which list at TGE.
- Leakage is consistent across studies: positive [−3,−1] CAAR of about +5% (Ante & Meyer), Bybit pre-listing run-ups (RockawayX), and Ante's statement that information likely leaks. The tradeable window is mostly from the announcement to day +1. Reversal starts around day +2.
- For tokens ranked below the top 100, Korean KRW listings and Binance listings under $100M market cap appear to give the largest immediate pops. They also show the same 70–80% median long-run loss.

### Gaps
- No rigorous study was found that separates announcement-time from trading-start ARs for Robinhood or OKX listings specifically.
- No benchmark-adjusted 30-day CAR study of Upbit or Bithumb listings was found. Industry numbers are raw returns.
- Binance "Monitoring Tag" announcements: no quantified study was found.

## 2. Hacks/exploits, regulatory actions, ETF approvals

### Takeaway
Hacks cause large, fast negative returns: about −27% over 24h for the affected DeFi governance token. Prices fall hours before public disclosure, so on-chain information leaks before the announcement. When the SEC names a token as a security, the token's CAR falls to about −17% over 30 days, with pre-announcement volume effects. Across the broader 2017–2026 sample of SEC and CFTC enforcement actions, BTC's AR is positive and altcoins show none. The spot BTC ETF approval gave positive ARs for BTC, ETH and LTC; the ETH ETF approval had a more modest effect.

### Cited Findings
- **NY Fed Staff Report 1153 (DeFi hacks):** the total negative impact on the protocol's governance token averages about −27% over 24 hours. CARs are "already substantially negative and statistically significant many hours before the announcement," which indicates that on-chain observers trade ahead of public disclosure. — [NY Fed SR1153](https://www.newyorkfed.org/medialibrary/media/research/staff_reports/sr1153.pdf)
- **HICSS (Univ. of Hawaii) paper on blockchain security breaches:** breaches cause negative ARs on the event day, prices "stay at low level" afterwards, and volatility increases. Tokens within the same ecosystem also show negative ARs (spillover). Exact magnitudes were not extracted. — [ScholarSpace](https://scholarspace.manoa.hawaii.edu/server/api/core/bitstreams/d9f34d2c-5da7-42eb-8b38-536b04104e89/content)
- **Saggu (SEC classifications of named crypto assets as securities):**
  - CARs: −5.2% [0,2], −12.2% [0,6], −13.5% [0,13], −17.2% [0,30]. The impact deepens and persists for a month rather than reversing.
  - In one subpanel the CAR peaks at −22.6% [0,13] after a pre-event run-up of +2.5% [−7,−1]. Another subpanel shows a −3.9% AR on day −1, which hints at leaks.
  - More volatile and more illiquid assets react worse.
  - Volume falls significantly in the week before announcements, consistent with informed trading.
  - — [SEC CTF input / Saggu](https://www.sec.gov/files/ctf-input-arte-2025-02-19.pdf)
- **Jakobs, Clapham & Muntermann (2026, SSRN; N=266 SEC/CFTC enforcement actions, Jan 2017–Aug 2026):**
  - BTC earns significantly *positive* ARs around enforcement announcements, read by investors as a sign of better market integrity. Other major crypto assets show "no robust reaction."
  - The effect is concentrated in fraud cases and concluded proceedings. Registration-only complaints show lower ARs. The effect is strongest in bear markets (flight to quality from altcoins into BTC) and is attenuated after the January 2025 executive order.
  - Severity and media salience are not significant.
  - — [SSRN 6900460](https://papers.ssrn.com/sol3/Delivery.cfm/6900460.pdf?abstractid=6900460&mirid=1)
  - **Conflict with Saggu:** Saggu measures the *named* token, where the effect is strongly negative. Jakobs et al. measure the market, where BTC is positive and altcoins are flat. The two are consistent once the target is distinguished from the market.
- **SEC v. Binance (5 Jun 2023), intraday study of BTC, ETH, XRP, ADA and LTC:** volatility surged and price responses were mixed. — [Mehdian et al.](https://ideas.repec.org/a/eme/sefpps/sef-08-2024-0521.html)
- **"Shockwaves" (Finance Research Letters 2026; window [−3,+3]):** regulatory events frequently produce significant ARs. About 60% of *predictable* events show significant pre-event ARs, versus about 11% of unpredictable events (10 events in that category). — [ScienceDirect](https://www.sciencedirect.com/science/article/pii/S1544612326009293)
- **ETFs:**
  - Babalos, Bouri & Gupta (2025; data 2017–Mar 2024): the spot BTC ETF introduction had a significant positive return effect for BTC, ETH and LTC around the event date, and lowered BTC and XRP volatility. — [IDEAS](https://ideas.repec.org/a/eee/quaeco/v102y2025ics106297692500047x.html)
  - Mehdian, Gherghina & Stoica (intraday, 9 large caps): spot BTC ETF approval produced significant positive ARs and higher volatility. Spot ETH ETF approval had "more modest effects." — [EconStor](https://www.econstor.eu/handle/10419/340651?locale=en)

### Inferences
- Hacks are the clearest "information leaks on-chain first" event. A monitoring system that watches exploit-related on-chain flows has an edge measured in hours.
- Regulatory news is asymmetric: negative for the named small-cap token, neutral to positive for BTC. Illiquid altcoins suffer most and do not recover within 30 days.
- ETF approvals were widely anticipated, so the measured ARs are concentrated in large caps. No evidence was found that they lifted tokens below the top 100.

### Gaps
- No large-N study of hack ARs specifically for tokens ranked below the top 100 was found, and no study of recovery beyond 30 days.
- The exact CAR magnitudes for the ETF event windows were not extracted from either ETF paper.

## 3. Token unlocks and vesting cliffs: size of effect, by recipient type

### Takeaway
Unlocks are the most consistently negative scheduled event. Keyrock (16,000+ events) finds 90% create negative price pressure, and larger unlocks hit harder. Team unlocks are worst at about −25%. Investor unlocks have controlled, minimal declines, often hedged in advance. Ecosystem-development unlocks are least damaging. Pressure starts about 30 days before the unlock date. A small 2026 SSRN study finds 88.5% negative within 72 hours, with a mean of −17%.

### Cited Findings
- **Keyrock (Dec 2024, 16,000+ unlocks):**
  - 90% of unlocks create negative price pressure "regardless of size or type." Bigger unlocks lead to sharper drops (2.4x) and more volatility.
  - Team unlocks trigger the worst crashes, about −25%. Their decline is roughly linear and starts more than 30 days before the unlock date.
  - Investor unlocks (106 events) show "controlled price performances" with slow, minimal declines. Many investors pre-hedge with futures.
  - Ecosystem-development unlocks are the least damaging. Investor and public/community unlocks have moderate impact.
  - Case study: APE fell 77% over 7 months after a team unlock.
  - — [Keyrock](https://keyrock.com/from-locked-to-liquidity-what-16000-token-unlocks-teach-us/)
- **Kim (SSRN, Apr 2026; N=52 major unlocks of Binance-listed tokens, 2023–2025):**
  - 46 of 52 events (88.5%) were negative within 72 hours, mean −16.97% (binomial p=2.2e−9). The same share underperformed BTC.
  - The effect does not vary significantly across BTC market regimes (ANOVA p=0.24).
  - In OLS, unlock size is an independent driver (β=−0.0089, p=0.006).
  - Post-hoc observation: all 14 events within about 60 days of the 1-year post-listing anniversary were negative. The author flags this as needing replication.
  - — [SSRN 6632838](https://papers.ssrn.com/sol3/papers.cfm?abstract_id=6632838); [GitHub replication readme](https://github.com/gameworkerkim/vibe-investing/blob/main/01.Trading%20Strategy/Token%20unlock%2072h%20shock%20analysis%20/readme.MD)

### Inferences
- Because team-unlock declines begin about 30 days before the date, a short or avoid signal is most valuable from roughly day −30 to day +3. The 72-hour concentration suggests most of the post-unlock damage is fast.
- Keyrock appears to measure raw price change rather than ARs, so part of the "90% negative" figure may be general bear-market drift. Kim's BTC-relative test supports a genuine effect, but with N=52.

### Gaps
- No Keyrock figures for magnitude by unlock size as a percentage of circulating supply were extracted beyond "2.4x."
- No The Tie or Tokenomist unlock event studies were found in this pass. Searches were rate-limited.

## 4. Partnerships, mainnet launches and upgrades, airdrops, buybacks and burns: signal or noise?

### Takeaway
Mostly noise, or sell-the-news.
- **Airdrops:** 88% of 2024 airdrop tokens declined within months, most within 15 days.
- **Buyback and burn announcements:** a modest 7-day pop that fades. Only 2 of 10 announcements beat BTC at 30 days, and both had real supply cuts or real revenue behind them.
- **Mainnets and hard forks:** anticipation is priced in. Hard forks have no minute-level return effect on BTC, and the distribution of forked coins lowers the parent's price.
- **Partnerships:** no crypto-token-level event study was found. The evidence for stocks is small (+0.30% on day 0).

### Cited Findings
- **Keyrock, 2024 airdrops (62 airdrops per secondary sources):** 88% of tokens declined within months despite initial spikes. About an 11% "success rate." — [Keyrock](https://keyrock.com/airdrops-in-the-barren-desert/); "most crash within 15 days" — [ChainCatcher](https://www.chaincatcher.com/en/article/2145167)
- **OAK Research, 2025 airdrops:** 15 tokens gained and 15 lost after their airdrops. A more mixed picture than 2024. — [OAK Research](https://oakresearch.io/en/analyses/investigations/airdrops-2025-end-or-renewal)
- **Tokenomist (Jul 2026; 10 buyback/burn announcements, 2024–2026, BTC-adjusted):**
  - At 7 days, about half beat BTC. At 30 days, only OKB (+318.7% vs BTC after a one-time ~$3B burn) and AAVE (+29.1%) clearly beat it.
  - Others underperformed: UNI fee switch −21.5%, JUP burn vote −22.7%, PENDLE −10.6%, HYPE −13.0%.
  - Only BNB and RAY are net-deflationary once unlocks are netted. HYPE supply still grows about 47% a year despite its buyback.
  - The study itself notes the small N and no controls.
  - — [Tokenomist](https://tokenomist.ai/research/buyback-and-burn-explained-what-they-are-who-is-doing-them-and-whether-they-actually-work)
- **Hard forks:**
  - Over 52 BTC hard forks (2017–2018), there was no significant minute-level return or volatility effect, only higher volume.
  - Liebi (2021) found −4.65% immediately and a −12.29% 5-day CAAR for the parent after the forked coin was distributed, with no effect on the announcement day.
  - — [Economics Letters 2025](https://www.sciencedirect.com/science/article/pii/S0165176525005099)
- **Mainnet "sell the news":** SUI sold off to a new all-time low around its mainnet launch. This is a secondary, anecdotal source. — [Bitbase](https://www.bitbase.com/blog/crypto-market-catalysts)
- **Partnerships (proxy evidence from stocks):**
  - 175 corporate blockchain announcements: +0.30% AR on day 0, reversed slightly on days +1 and +2. — [POMS](https://sage.cnpereading.com/doi/10.1111/poms.13609)
  - 114 US firms (2016–2019): +7.26% to +7.43% mean on day 0, with median about 0%, so the mean is driven by outliers. — [Financial Innovation](https://link.springer.com/article/10.1186/s40854-023-00456-8)

### Inferences
- The more scheduled and pre-announced an event is (mainnet, upgrade, airdrop/TGE), the more its return is front-run and the more likely a sell-off on the day it happens. "Shockwaves" found that about 60% of predictable events show pre-event ARs, versus about 11% of unpredictable ones.
- Buybacks are signal only when they cut net supply, which requires netting against unlocks, or are funded by real recurring revenue.

### Gaps
- No rigorous event study of partnership announcements on crypto token prices was found. That category remains unquantified.
- No large-N event study of mainnet or upgrade ARs for altcoins was found.

## 5. Macro (FOMC, CPI)

### Takeaway
FOMC and CPI releases sharply raise BTC volatility and volume, a phenomenon only since 2021. Directional effects are weak and partly reversing: the initial FOMC move tends to reverse within about 4 hours. Unexpected rate hikes are moderately negative, but not significant in a 57-event sample. Over 2017–2022 the NY Fed found BTC largely orthogonal to macro surprises; only CPI and the FOMC "path" surprises were significant, at 5%.

### Cited Findings
- **Johansson & Vilhelmsson (2023, SSRN):** FOMC and CPI announcements have a "massive impact" on BTC realized volatility and volume, but only since inflation rose in 2021. There are large ARs on FOMC days, and the initial price reaction tends to reverse over the next 4 hours. — [SSRN 4478184](https://papers.ssrn.com/sol3/papers.cfm?abstract_id=4478184)
- **Yang & Wang (Finance Research Letters 2026; 41 FOMC statements, 2021–Jan 2026, hourly data):** in the first post-statement hour, mean absolute return rises from 0.66% to 1.25% for BTC and from 0.85% to 1.50% for ETH. Volume rises 2.54x for BTC and 2.81x for ETH. — [IDEAS](https://ideas.repec.org/a/eee/finlet/v101y2026ics1544612326006021.html)
- **NY Fed SR1052 (BTC 2017–2022, 30-minute windows):** BTC is "orthogonal to monetary and macroeconomic news." The FOMC path surprise is negative and significant at 5%. CPI is the only significant macro release, at 5%, with R² up to 16% for core CPI. — [NY Fed SR1052](https://www.newyorkfed.org/medialibrary/media/research/staff_reports/sr1052.pdf?sc_lang=en)
- **Queiró (Nova thesis; 57 Fed events, 2018–Sep 2024, Bernanke–Kuttner method):** the unexpected component of rate changes has a moderate negative effect on the crypto market, not statistically significant. Hikes appear more negative than cuts are positive. — [RUN UNL](https://run.unl.pt/server/api/core/bitstreams/a28b97c5-2eea-4448-96bb-db7526af22ed/content)
- **Annals of Finance (2023):** BTC reacts to Fed and ECB shocks, but the sign and size of the reaction change over time. — [Springer](https://link.springer.com/article/10.1007/s10436-023-00432-3)

### Inferences
- For altcoins, macro events are mainly volatility events transmitted through BTC beta, not a directional signal. Position sizing and risk limits around FOMC and CPI hours matter more than direction.

### Gaps
- No study was found that measures FOMC or CPI responses specifically for small-cap altcoins. Searches were rate-limited (HTTP 429) and evidence for this category is thin.
