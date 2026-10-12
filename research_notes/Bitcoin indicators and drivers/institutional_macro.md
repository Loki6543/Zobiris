# Institutional Flows and Macro Drivers of BTC Price (2020–Oct 2026)

## 1. Spot BTC ETF net flows: do they lead or lag price?

### Takeaway
The evidence favors a feedback loop in which flows mostly follow price. The only Granger test found (on futures ETFs) shows BTC price leading ETF prices and not the other way round. For spot ETFs there is only a levels cointegration result (weak, 10% significance). Daily flow prints are noisy and get revised. Rolling multi-day or weekly sums are the usable signal.

### Cited Findings
- 2021–2024 GARCH plus Granger study of BTC vs BTC futures ETFs: past BTC prices predict ETF prices, with no evidence of the reverse. Futures lead ETFs. — [vjol.info.vn](https://vjol.info.vn/due/article/view/125157)
- Cointegration between spot ETF net assets and BTC price, daily data Jan 2024–May 2025: long-run link confirmed only at the 10% level. The paper frames flows as both driving prices and chasing returns. — [Ledger (Pitt)](https://ledger.pitt.edu/ojs/ledger/article/view/393)
- FalconX ran a preliminary statistical look at flows vs price, but the excerpt seen was descriptive only. — [FalconX](https://falconx.io/newsroom/what-can-spot-etf-flows-tell-us-about-the-trajectory-of-bitcoin-prices-a-preliminary-statistical-investigation)
- 2026 status:
  - YTD flows were about –$2.91B as of late August 2026.
  - September 2026 had +$2.65B of inflows, making Q3 the strongest quarter of 2026.
  - Oct 1–2 net inflow was +$134.4M, with IBIT leading. One source flags that fund-level tables were still incomplete. — [IDNFinancials](https://www.idnfinancials.com/digital-asset/69849/bitcoin-etfs-absorb-us134-4-million-in-early-october)
  - Oct 6, 2026: +$118.8M, month-to-date +$321.4M, BTC around $86k. — [KuCoin/CoinDesk data](https://www.kucoin.com/news/flash/bitcoin-etfs-see-118-8m-net-inflow-on-october-6-2026)
- Sources disagree on which day the +$102.7M print belongs to (Oct 1 vs Thursday). This shows that same-day data is unreliable. — [TFTC tracker](https://www.tftc.io/bitcoin-etf-flows/october-2026)

### Inferences
- Use flows as a confirmation or sentiment gauge, such as a 5-day sum and the sign of a weekly streak. Do not treat them as a leading predictor.
- Farside publishes T+1 after US close. Use it as a lagged input, never as a same-day signal.

### Gaps
- No peer-reviewed Granger or VAR study of spot ETF daily flows vs next-day returns was found. No reliable effect size (for example, % move per $1B) was found either.

## 2. Strategy (MSTR) and corporate treasuries

### Takeaway
Strategy's buying, once a steady bid, has largely stalled in 2026. Its mNAV is about 1.0 (vs 3.29 peak in Nov 2024), and funding has shifted to preferreds (STRC). It made its first BTC sale ever in May 2026. Its buy announcements are now a weak driver. The bigger tail risk is forced or optional selling if mNAV stays below about 1.2.

### Cited Findings
- Aug 17, 2026 snapshot:
  - Holdings: 840,447 BTC, at an average cost of $75,385 (about $63.4B total).
  - That week it bought no BTC and sold $334M of MSTR stock.
  - It has a $4.8B USD reserve.
  - Enterprise mNAV was 1.04.
  — [The Block](https://theblock.co/news/business/2026-08-17-michael-saylor-strategy-btc-411942)
- Other 2026 points:
  - mNAV was 1.03 on Jun 25, 2026, vs a 3.29 peak on Nov 20, 2024.
  - It sold 32 BTC in late May 2026, its first sale ever.
  - Preferred issuance reached about $15.5B by June.
  - It booked a roughly $14.5B unrealized loss in Q1 2026.
  — [KuCoin blog](https://kucoin.com/blog/tr-strategy-death-spiral-debunked-why-mstr-s-crypto-flywheel-paused-as-strc-preferred-stock-hits-75-amid-bitcoin-slump?x=tr_TR); [BitMEX recap](https://www.bitmex.com/es/blog/strategy-earning-recap)
- Management reportedly cited an mNAV threshold of about 1.22x. Below it, selling BTC to fund dividends beats issuing equity. The date of this claim is unconfirmed. — [BitMEX](https://www.bitmex.com/es/blog/strategy-earning-recap)

### Inferences
- mNAV is the key monitorable. Above 1.5 means the buy flywheel is active. Near or below 1.0 means a supply-overhang risk.
- BTC around $86k in Oct 2026 is only about 14% above Strategy's cost basis.

### Gaps
- No study was found that quantifies the price impact of Strategy's weekly Monday 8-K buys. Anecdotally the impact is small. The 8-Ks are on SEC EDGAR, and the next one has not been checked.

## 3. Bank and institutional adoption news

### Takeaway
Adoption has advanced steadily, but each headline is a slow, structural driver rather than a measurable daily price factor. Treat individual adoption headlines as noise for daily signals.

### Cited Findings
- JPMorgan:
  - May 2025: it let clients buy BTC, without offering custody. — [ETF.com](https://www.etf.com/sections/news/jpmorgan-vanguard-bitcoin-etf-crypto-trading)
  - Late 2025: it launched leveraged notes tied to IBIT.
- Morgan Stanley planned spot BTC/ETH/SOL trading on E*Trade for 1H 2026. The launch is unconfirmed.
- Bank of America suggests a 1–4% crypto allocation.
- Vanguard's status is conflicting (reversal of its ban in late 2025 vs still planning).
- Sources for the three items above: [Sherlock](https://sherlock.xyz/post/institutional-crypto-adoption-in-2026-whos-actually-moving-in); [Banking Exchange](https://m.bankingexchange.com/news-feed/item/10383-the-majority-of-the-us-s-largest-banks-have-embraced-crypto-services)

### Gaps
- No event study was found measuring price reaction to bank-adoption announcements.

## 4. Macro: equities, the dollar, real yields, the Fed, CPI and liquidity

### Takeaway
BTC trades as a liquidity-sensitive, high-beta tech factor. Its correlation with the Nasdaq-100 ran +0.35 to +0.6 in 2025 and early 2026, and it tightens under stress. Its correlation with the dollar fell from about –0.4 (2022–23) to about 0. Rising yields and a firmer dollar hurt it, as in Feb 2026. Global M2 is claimed to lead BTC by about 8–10 weeks (r=0.94 over 2013–2024), but that is an in-sample industry fit. FOMC and CPI days move BTC mainly on surprises versus expectations.

### Cited Findings
- Correlations and yields:
  - CME: crypto vs Nasdaq-100 correlation was +0.35 to +0.6 in 2025 and early 2026.
  - The dollar and gold correlations are near 0 now, vs a dollar correlation of about –0.4 in 2022–23.
  - In Feb 2026 the 10-year rose from 4.0% to 4.3% with a firmer dollar, alongside a BTC sell-off.
  — [Interactive Brokers/CME](https://www.interactivebrokers.com/campus/?p=238789); [MEXC summary](https://www.mexc.com/news/729347)
- A 25-day rolling BTC–Nasdaq correlation was about 0 on May 11, 2026. This shows how unstable short windows are. — [Sharpe.ai](https://www.sharpe.ai/correlation/bitcoin-vs-nasdaq)
- M2 and liquidity:
  - Industry analyses put the lag at about 10 weeks, or 56–60 days on other fits.
  - The rate of change in M2 matters more than its level.
  - Morgan Stanley: monthly BTC returns averaged +3% higher when M2 accelerated (2011–2022).
  - Alden/Callahan: r=0.94 between BTC and global M2 (May 2013–Jul 2024).
  — [Bitcoin Magazine](https://bitcoinmagazine.com/markets/global-liquidity-fuels-bitcoin-price); [Newhedge](https://newhedge.io/bitcoin/bitcoin-vs-m2-10-week-lead); [LookIntoBitcoin](https://www.lookintobitcoin.com/bitcoin-research/the-global-liquidity-influence-on-bitcoin/)
- CPI and FOMC examples:
  - In-line CPI (Sept 2025) left BTC flat at about $114k.
  - Soft CPI spiked BTC to $112k.
  - A priced-in Fed hold drew a small reaction.
  — [The Block](https://www.theblock.co/post/370335/bitcoin-holds-114k-markets-september-rate-cuts-cpi-expectations); [Cointelegraph](https://cointelegraph.com/news/bitcoin-spikes-112k-soft-us-cpi-data-sp-500-hits-record-high); [The Block](https://www.theblock.co/amp/post/308525/bitcoin-posts-slight-gain-after-fed-holds-rates-steady-citing-further-progress-toward-2-inflation-target)

### Inferences
- Useful daily features:
  - 30- and 90-day rolling correlation with QQQ.
  - DXY change.
  - The 10-year real yield (DFII10) change.
  - Fed balance sheet minus TGA minus RRP (net liquidity), as weekly data.
  - M2 YoY rate of change lagged 8–10 weeks.
- Flag CPI and FOMC days as volatility events, not directional ones.
- Noise: correlation windows under 30 days, and M2 levels.

### Gaps
- No coverage was found of the Sept 2026 FOMC decision or the 2026 CPI prints and BTC's reaction. No peer-reviewed out-of-sample test of the M2 lead was found.

## 5. Geopolitical shocks

### Takeaway
Wars typically cause a sharp 1–2 day drop with high intraday range, then a quick recovery within days to weeks. The medium-term path is set by macro, not the event. The average 90-day return after major shocks since 2020 is about +11%, with wide dispersion. Shocks are a volatility signal, not a directional one.

### Cited Findings
- US/Israel strikes on Iran, Feb 28, 2026: BTC fell 1.8% on the day, with a 7.4% intraday range (about half the range on the Ukraine invasion day). It briefly hit about $64k before recovering support. — [Analysis](https://san-1510.aid.brainsum.com/news/analysis/bitcoin-wartime-tale-two-shocks); [FN News](https://en.fnnews.com/news/202603021726349176)
- Russia–Ukraine, Feb 2022: BTC was +11% at 7 days and +16% at 30 days, then –23% at 90 days and –44% at 180 days, as Fed tightening dominated. — [same analysis](https://san-1510.aid.brainsum.com/news/analysis/bitcoin-wartime-tale-two-shocks)
- Shocks since 2020: average 90-day return of about +11%, with no reliable directional signal. — [Revisiting the data](https://san-1510.aid.brainsum.com/news/analysis/bitcoin-and-geopolitical-shocks-revisiting-data)
- Late May 2026: BTC rebounded from a 7-week low on hopes of an Iran truce. This was syndicated low-quality reporting. — [link](https://careerservice.npust.edu.tw/expert-time/Bitcoin-Bounces-Back-from-SevenWeek-Trough-as-Iran-Truce-Hopes-Rise-29-1359)

### Inferences
- A rule of thumb for a server: on a shock headline, expect a drawdown of about 2–8% that is often retraced within 1–2 weeks. Do not de-risk on the headline alone unless macro (yields, dollar) confirms it.
- The analysis site's domain looks like a mirror, so treat its numbers as indicative.

### Gaps
- No systematic dataset of recovery days per event was found.

## Free keyless data sources a server could pull daily

### Takeaway
Almost everything needed is free. FRED needs a free API key, but its fredgraph.csv download needs no key.

### Cited Findings and notes
- ETF flows:
  - Farside (farside.co.uk/btc), HTML table, T+1. It may block bots, so scrape gently.
  - TFTC monthly flow pages. — [TFTC](https://www.tftc.io/bitcoin-etf-flows/october-2026)
- Macro, via FRED `https://fred.stlouisfed.org/graph/fredgraph.csv?id=SERIES`, which needs no key:
  - Money supply: M2SL (monthly).
  - Fed balance sheet and liquidity: WALCL (weekly Fed assets), WTREGEN (TGA), RRPONTSYD (reverse repo).
  - Real yield and dollar: DFII10 (10-year real yield), DTWEXBGS (broad dollar).
  - Fed funds: DFF.
  - Inflation: CPIAUCSL.
  - Equities: SP500, NASDAQCOM.
- Prices: the unofficial Yahoo Finance chart endpoint (query1.finance.yahoo.com/v8/finance/chart/{BTC-USD, QQQ, DX-Y.NYB, IBIT, MSTR}). It needs no key but has rate limits and can break.
- Strategy buys: SEC EDGAR 8-K filings via data.sec.gov/submissions/CIK0001050446.json. No key is needed, but a User-Agent header with contact info is required. The mNAV and holdings tracker is strategy.com.
- Events: the FOMC calendar on federalreserve.gov and the CPI schedule on bls.gov, both static pages.
- Fund flows: CoinShares weekly fund-flow reports, published Mondays as blog/PDF.

### Gaps
- These endpoint URLs come from general knowledge, and their availability was not live-tested in this session.
