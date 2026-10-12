# Where Actionable Crypto Market-Moving Information First Appears (signal sources, lead time, access) — as of Oct 2026

Research note: Firecrawl search was rate-limited (HTTP 429) and two Exa searches (Bybit/OKX announcement APIs; security-alert timing/PeckShield/Rekt) were denied by the user, so those areas have thin or no sourcing — see Gaps.

## 1. Exchange announcement feeds (Binance, Coinbase, Upbit, Bithumb, OKX, Bybit) — what they signal, lead time, access

### Takeaway
Exchange notices are the most measurable, highest-impact event signal: Upbit spot listings and Binance delistings/Monitoring Tags have the largest median moves, but most of the move happens in the first minutes to an hour. Binance and Upbit notices can be polled keyless through unofficial JSON endpoints the sites use themselves; official push feeds of notices do not exist (third-party WebSocket relays cost money).

### Cited Findings
- **Binance (keyless, unofficial):** bots poll `https://www.binance.com/bapi/composite/v1/public/cms/article/list/query?type=1&catalogId=48&pageNo=1&pageSize=20`; catalogId 48 = New Cryptocurrency Listing; one open-source bot watches catalogs 48, 49, 50, 161, 157 and polls every 1 s, de-duplicating by article id — [cex-trader/exchangeNotices](https://github.com/cex-trader/exchangeNotices/blob/main/binanceNotices.php); [fabius8/binanceAlert](https://github.com/fabius8/binanceAlert/blob/main/binanceAlert.py)
- Variant endpoints exist (`.../cms/article/catalog/list/query`, `bapi/apex/v1/public/apex/cms/article/list/query`); sending a browser User-Agent is recommended to avoid 403/HTML anti-bot replies — [rickstaa/crypto-listings-sniper](https://github.com/rickstaa/crypto-listings-sniper/commit/a1ad0d27393feaa2b9ab77d89324d743aef965d0); [cv-cat/BinanceApis](https://github.com/cv-cat/BinanceApis); [kizzy899 blog, Feb 2026](https://kizzy899.github.io/2026/02/08/%E7%88%AC%E8%99%AB%E5%AD%A6%E4%B9%A0/index.html)
- **Upbit (keyless, unofficial):** `https://api-manager.upbit.com/api/v1/notices?page=1&per_page=…&thread_name=general`; listing titles follow a fixed Korean format such as "[거래] KRW, BTC 마켓 디지털 자산 추가 (…)", which can be parsed for tickers — [paragraph.com/@dfarm](https://paragraph.com/@dfarm/2-upbit)
- Upbit's own market WebSocket does not carry notices; most trackers poll the REST notice endpoint (anywhere from every 30 min down to every 60 s). A paid relay (CryptoListing.ws, API key) pushes Upbit/Bithumb listings, delistings and 유의종목 (caution) changes over WebSocket from Seoul — [cryptolisting.ws](https://cryptolisting.ws/upbit-delisting-alert/)
- **Measured impact (2,608 announcements, 3,797 coin-events, Aug 2022–Oct 2026, measured from the official publish time):** Median 24 h moves: Binance delisting −15.5% (1h −12.4%, 7d −22.7%; 26% fell >30% within a day, n=164); Upbit spot listing +13.9% at 1h, +7.2% at 24h, +1.9% at 7d (n=231); Binance perp listing +3.9%; Bybit spot +1.9%; Binance spot +1.3%; OKX spot −0.3%; Upbit delisting −8.0%; OKX delisting −5.6%; Bybit delisting −3.8%; Upbit caution tag −3.1% — [CoinSight exchange announcement study](https://getcoinsight.com/en/research/exchange-announcement-study)
- The same study warns that the publish-time price is "often out of reach — a fast listing can move tens of percent before any feed shows it." For the few events its feed caught live within 15 min, all-exchange spot listings showed +2.4% at 1h but −9.4% at 24h (n=8, too small to rely on) — [CoinSight new-listing pumps](https://getcoinsight.com/en/research/new-listing-pump-by-exchange)
- **Peak and trough moves (since Apr 2026, from detection vs last trade before):** median 24h peaks: Upbit spot listing +32.6% (n=62, median time to peak 49 min), Bithumb listing +22.7% (4.5 h), Binance futures listing +39.7% (n=18). Median 24h lows: Binance spot delisting −27.7% (n=32), Binance Monitoring Tag −15.8% (n=29, 97% moved ≥10%, time to trough 3.9 h). These are extremes, not achievable returns — [cryptolisting.ws listing price reaction](https://cryptolisting.ws/listing-price-reaction/)
- Older academic evidence: information leaks before listings (significant CAAR in the −3 to −1 window), and post-listing (+1 to +3) returns are negative for Binance (−6.3%) and Upbit — [Blockchain Research Lab working paper (2019)](https://www.blockchainresearchlab.org/wp-content/uploads/2019/10/Exploring-Market-Reactions-to-Exchange-Listings-of-Cryptocurrencies-BRL-working-paper3.pdf)
- Korean research: pre-listing Binance data plus community social sentiment help predict Upbit post-listing surges and kimchi premium — [KCI journal](https://journal.kci.go.kr/jksci/archive/articleView?artiId=ART003305943)
- **Coinbase:** listings first appear on the @CoinbaseMarkets X account (previously @CoinbaseAssets) and the public listing roadmap. Trading follows with a phased launch (transfer-only → limit-only auction → full). Approvals slowed sharply: 2 assets in Jul 2026 and 3 in Aug 2026, against 110 spot listings in 2025 — [Cryptonews](https://cryptonews.com/cryptocurrency/new-coinbase-listings/); [Cryptonews on listing guide](https://cryptonews.com/news/coinbase-releases-public-guide-to-digital-asset-listing-process-amid-transparency-push/)
- Coinbase effect example: SHIB rose +11% in 1h and +38% in a day on its Coinbase listing (Sep 2021), then retraced within weeks; the roadmap was introduced partly to limit front-running — [Decrypt](https://decrypt.co/97548/coinbase-increasing-transparency-for-new-listings-with-q2-asset-roadmap)
- OKX public REST endpoints need no key (e.g. `/api/v5/public/instruments`) — [OKX API](https://www.okx.com/en-us/okx-api)

### Inferences
- Rank for a keyless engine: poll the Binance bapi and Upbit notice endpoints every few seconds (with a UA header and backoff). A server poller cannot win the first-minute race against co-located bots, so treat notices as (a) a regime or risk filter (exit or avoid coins that get delisting or Monitoring Tags; these keep falling over 7 days) and (b) fade or confirm signals, not first-minute chase entries.
- Delisting and Monitoring Tag notices look more exploitable than listings for a slow engine: the drift continues (−12.4% at 1h → −22.7% at 7d on Binance), and the median time to trough is hours.
- New-coin diffing (e.g. Coinbase products list, OKX instruments) is a free fallback detector that needs no notice scraping.

### Gaps
- Official Bybit (`/v5/announcements/index`) and OKX (`/api/v5/support/announcements`) announcement endpoint details and rate limits were not verified (the search was denied). The CoinSight study does use Bybit/OKX "public feeds."
- Bithumb notice endpoint not found.
- No rate limit is published for the unofficial Binance and Upbit endpoints; they may change or be geo-blocked at any time.

## 2. Unlock calendars (Tokenomist, CryptoRank, DefiLlama)

### Takeaway
Unlocks are known weeks or months ahead (the longest lead time of any signal here), but structured unlock APIs are paid. DefiLlama's emissions endpoints are Pro-only; Tokenomist's free tier is web-only and very limited.

### Cited Findings
- Tokenomist: Free plan shows limited unlock events (3 historical, 1 future) with 3 alerts. Pro is $69–99/mo with 300–1,000 API calls/mo; Standard API is $249.95–749.95/mo with 50k calls; Elite is $449.95–999.95/mo with 500k calls. Rate limit 120 req/min on all plans. Data is for non-commercial, non-redistribution use; a free trial is available on request — [Tokenomist pricing](https://tokenomist.ai/pricing?plan=api-plan); [Tokenomist API docs](https://docs.tokenomist.ai/api-documents/introduction)
- CryptoRank v3: `upcoming-token-unlocks` (filters for days ahead up to 365, min USD value, min % of market cap) and vesting/allocation endpoints are "Available from: Pro," at 1 credit per request, using an X-Api-Key header — [CryptoRank docs](https://docs.cryptorank.io/api-reference/vesting-&-token-unlocks/upcoming-token-unlocks); [CryptoRank unlock API](https://cryptorank.io/public-api/token-unlocks)
- DefiLlama: emissions/unlocks endpoints are marked Pro (🔐) in the SDK. The API plan is $300/mo or $3,000/yr (one 2026 source cites $250/mo). The 31 free endpoints (TVL, prices, etc.) are keyless with no rate limit for normal traffic — [DefiLlama SDK](https://github.com/DefiLlama/api-sdk); [DefiLlama pricing](https://docs.llama.fi/pro-api); [Eco summary, Aug 2026](https://eco.com/support/en/articles/14800367-defillama-free-tvl-and-defi-analytics)

### Inferences
- Cheapest viable path: CryptoRank Pro or Tokenomist Pro for a daily calendar pull (300–1,000 calls/mo is enough for one daily snapshot), cached server-side. A keyless engine can only get unlock data by scraping web pages, which risks breaking the terms of service.

### Gaps
- No primary 2025–26 quantitative study of pre-unlock price drift was retrieved. Do not assert specific drift numbers.
- CryptoRank Pro dollar price not captured.

## 3. On-chain alerts (Whale Alert, Arkham, Lookonchain, Nansen)

### Takeaway
On-chain whale flows show up minutes after the block, but structured APIs are paid. Whale Alert has no free API tier, and Arkham offers trial credits. Lookonchain is X/Telegram posts (no API found).

### Cited Findings
- Whale Alert: real-time WebSocket API is $29.95/mo with a 7-day free trial; Enterprise REST API is 500 calls/min (1,000+ on Enterprise Big). A third-party survey puts pricing at $29.95–$699/mo with no free tier (verified Jul 2026) — [Whale Alert](https://whale-alert.io/alerts.html); [Whale Alert docs](https://developer.whale-alert.io/api-account/documentation); [DeepBlueAlpha](https://deepbluealpha.io/research/whale-alert-api-pricing-free-alternatives-2026)
- Arkham API: free trial of 100k credits (individual) or 1M (org), with API paused at the cap; usage-based paid plans. Rate limits are 20 req/s standard and 1 req/s for heavy endpoints. Label lookups are capped at 10k per period on trial and 1M on individual paid plans. Some endpoints cost 0 credits (`/chains`, `/networks/status`) — [Arkham rate limits](https://arkm.com/llms/guides/rate-limits.md); [Arkham credit pricing](https://arkm.com/llms/guides/credit-pricing.md)

### Inferences
- A keyless alternative is to watch exchange hot-wallet flows yourself through free RPCs and explorers, but that needs label data (Arkham's value). For a small engine, whale data is low priority relative to its cost.

### Gaps
- Nansen API pricing, Lookonchain access, and lead-time or price-impact evidence for whale alerts were not researched (tool-call budget).

## 4. Security alerts (PeckShield, CertiK, Rekt)

### Takeaway
Not researched: the search was denied by the user.

### Cited Findings
- None.

### Inferences
- (Unsourced, general knowledge) These alerts appear first as X posts from security firms; DefiLlama's hacks dashboard and Rekt are after-the-fact databases.

### Gaps
- Lead time, API availability and price impact of exploit alerts are all unsourced.

## 5. Regulators (SEC, CFTC)

### Takeaway
Not researched within budget.

### Cited Findings
- None.

### Gaps
- SEC and CFTC press-release RSS feeds and EDGAR filings (e.g. ETF S-1/19b-4) are known to be free and keyless, but this was not verified here. EDGAR requires a declared User-Agent (general knowledge, unsourced).

## 6. Mindshare (CoinGecko/CMC trending, LunarCrush, Santiment, Kaito)

### Takeaway
CoinGecko `/search/trending` is the only effectively free mindshare signal (free Demo key; top 15 coins by searches over 24 h). LunarCrush and Santiment real-time social data are paid, with heavily restricted free tiers.

### Cited Findings
- CoinGecko `/search/trending` returns the top 15 trending coins by search popularity (24 h), 7 NFTs and 5 categories; the Demo plan header is `x-cg-demo-api-key`. Demo plan: free, 100 calls/min, 10k calls/mo, data freshness from 60 s. Basic plan: $29/mo (yearly), 300/min, 100k calls/mo. `/coins/top_gainers_losers` is not available on Demo — [CoinGecko trending](https://docs.coingecko.com/demo/reference/trending-search); [CoinGecko pricing](https://www.coingecko.com/en/api/pricing); [CoinGecko market research docs](https://docs.coingecko.com/docs/market-research)
- LunarCrush: the free Hobby tier covers only market-data endpoints, at 4 req/min and 100/day; social endpoints need Individual ($90/mo, 10/min, 2k/day), Builder ($300/mo) or Scale ($900/mo). No free trial on paid plans. One older product page claims a "500 requests/day" free tier, which conflicts with the current docs — [LunarCrush API docs](https://lunarcrush.com/en/developers/api); [LunarCrush pricing](https://lunarcrush.com/pricing); conflicting: [LunarCrush API page](https://lunarcrush.com/products/lunarcrush-api)
- Santiment: the free tier has a 30-day data lag and hides the top 3 trending coins. Pro is $49/mo; Max ($249/mo) is the minimum for real-time API data with no lag — [Sanbase pricing](https://app.santiment.net/pricing)

### Inferences
- For a keyless or near-keyless engine: snapshot CoinGecko trending every ~10 min. At 144 calls/day it fits inside the Demo plan's 10k/mo, but the free key is still needed. Track rank changes (new entrants) as a retail-attention proxy.

### Gaps
- Kaito API access and pricing, and CMC trending endpoint limits, were not verified.
- No sourced study on the lead time of trending rank vs price was found.

## 7. Derivatives data (Coinglass, Binance and Hyperliquid public funding/OI APIs)

### Takeaway
Exchange-native public APIs give free, keyless funding and open-interest data. Hyperliquid returns funding and OI for every perp in one POST call. Coinglass's cross-exchange aggregation starts at $29/mo.

### Cited Findings
- Hyperliquid: `POST https://api.hyperliquid.xyz/info` with `{"type":"metaAndAssetCtxs"}` returns every perp's funding, openInterest, markPx, oraclePx, premium, dayNtlVlm and prevDayPx in one call. Also offers `fundingHistory` and a "perps at open interest caps" query. No key needed — [Hyperliquid docs](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/info-endpoint/perpetuals); [Chainstack](https://docs.chainstack.com/reference/hyperliquid-info-meta-and-asset-ctxs)
- The public Hyperliquid limit is 1,200 weight/min per IP (per a third-party provider selling an unlimited mirror) — [GoldRush](https://goldrush.dev/docs/goldrush-hyperliquid/overview/)
- Coinglass API plans: Hobbyist $29/mo (30 req/min, 80+ endpoints, non-commercial), Startup $79 (80/min), Standard $299 (300/min, commercial license), Professional $699 (1,200/min). Data updates ≤1 min. The official pricing page shows 80/300/1,200 per minute for the upper tiers — [Coinglass pricing](https://www.coinglass.com/pricing); [dev.to review 2026](https://dev.to/great-time-flies/coinglass-api-review-2026-is-it-worth-it-for-crypto-quant-traders-2bcf)

### Inferences
- Best keyless stack: Hyperliquid metaAndAssetCtxs (one call per minute covers everything), plus Binance USD-M public endpoints (`/fapi/v1/premiumIndex` for all symbols' funding, `/fapi/v1/openInterest` per symbol). Binance endpoints and weights are from general knowledge, not verified in this session. Compute cross-venue funding extremes and OI-change z-scores yourself rather than paying Coinglass.

### Gaps
- Binance futures rate limits and weights were not re-verified in 2026 sources. Binance may geo-block US server IPs (unverified here).
- No sourced lead-time evidence for funding or OI extremes was retrieved in this session.

## Summary: best options for a keyless server engine (inference)
- **Free and keyless:** Binance bapi announcements (catalogs 48/161 etc.), Upbit api-manager notices, Hyperliquid /info, Binance/OKX public market endpoints, DefiLlama free endpoints.
- **Free with a key:** CoinGecko Demo (trending).
- **Cheap paid:** Coinglass Hobbyist ($29), Whale Alert ($29.95), Tokenomist Pro ($69–99) or CryptoRank Pro.
- **Expensive:** LunarCrush (social at $90+), Santiment real-time ($249), DefiLlama API ($300), Arkham (usage-based).
