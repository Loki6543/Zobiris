# ZOBIRIS Strategy v2 — research and implementation plan (Oct 2026)

Margin trading has been removed from ZOBIRIS. The app now focuses on three things, in this order:

1. **Bitcoin market direction.** A regime gate that every other decision obeys.
2. **Top-100 delayed rotation.** Entry points for established coins that lag BTC and start to recover.
3. **Ranks 101–500 asymmetric bets.** Small, equal, survivable bets on mid/low caps, sized with Taleb's barbell.

The code for the gate, the small-cap screen and the barbell sizing is in
`deploy/protection/overrides/src/strategyV2/`, with tests in `src/tests/strategy-v2.test.ts`.

---

## 1. What the research says

| Topic | Finding | Consequence for ZOBIRIS |
|---|---|---|
| BTC cycle indicators | A 2026 preprint finds MVRV, Mayer, Puell, Pi Cycle and the 200-week MA have degraded each cycle: "precise, then early, then silent". The 200W MA failed both ways (2018 bottom above it, 2022 broke 34% below). | Don't gate on cycle indicators. Show them as context only. |
| BTC trend + vol scaling | Trend rules on BTC reduce drawdowns versus buy-and-hold. One practitioner test (2017–mid-2025) shows −15% max DD with volatility scaling versus −80% without it, so the scaling does much of the work. Return gains mostly did not hold out of sample. | Use simple SMA trend rules for **direction** and scale size by realized volatility. Don't expect the gate to add return; it is a drawdown and ruin control. |
| Macro drivers | M2 links to BTC weakly month to month but materially at 6–24 months, and the link weakened in 2025–26. Spot-ETF flows are now the main transmission channel. The DXY relationship is unstable in sign. | Macro data is low-weight context, never a gate. ETF flows are the best next data source to add. |
| Crypto factors | Liu, Tsyvinski & Wu (J. Finance 2022): market, size and momentum explain cross-sectional crypto returns. **Momentum is not significant in below-median-size coins.** Time-series momentum works at 1–8 weeks. | Top 100: momentum and relative strength are valid. Ranks 101–500: don't rely on momentum; filter for survival and rank on asymmetry. |
| Survivorship | 3,904 coins 2014–2021: **39.5% delist, 76% of those are total losses.** Survivorship bias is about 62% per year for equal-weighted portfolios. | Small caps are option-like. Assume any single bet can go to zero. Any backtest must include dead coins. |
| Dilution | Low-float launches (10–20% circulating) often bleed as unlocks hit. FDV/MC > ~5 is a common danger heuristic (unvalidated). | Hard filters: market cap/FDV ≥ 0.4 and no unlock > 5% of supply within 60 days. Unknown unlocks fail closed. |
| Fake volume | Volume far out of line with spread and depth suggests wash trading, and small caps are easier to manipulate. | Turnover band: 1%–100% of market cap per day. Require a Kraken listing (real execution venue). |
| Rotation breadth | "Altseason" = 75% of top coins outperforming BTC over 90d (practitioner rule). BTC dominance trend matters more than level. In Oct 2026 the market is BTC-led (ASI about 30–35). | `rotationBreadth()` labels the phase. BTC-led means smaller rotation sizes. |
| Taleb, fat tails | Under fat tails, ruin comes from one extreme event, not an accumulation of small ones. Payoff shape matters more than probability: be wrong often at low cost if you are convex. Time averages ≠ ensemble averages (ergodicity). | No leverage, no averaging down, a hard cap per bet, many small equal bets, and profit ladders that keep the right tail. |

## 2. The strategy

### 2.1 BTC regime (`computeBtcRegime`)
Inputs: ≥221 completed daily BTC closes (Kraken OHLC provides 720).
Score −5…+5: price vs 200D (±2), 50D vs 200D (±1), 200D slope over 20d (±1), price vs 20-week/140D (±1).

| State | Rule | Top-100 rotation | Small-cap bets | Exposure |
|---|---|---|---|---|
| RISK_ON | score ≥ 3 | yes | yes (unless capitulation) | vol-scaled × 1.0 |
| NEUTRAL | −1…2 | yes, half size | no | vol-scaled × 0.5 |
| RISK_OFF | ≤ −2 | no new entries | no | 0 |
| UNKNOWN | bad or short data | no | no | 0 |

Vol scaling is `min(1, max(0.25, 50% / realized 30d vol))`. The capitulation watch fires at a drawdown of at least 35% from the 365d high with Mayer < 0.8. It allows review of core BTC accumulation only.

### 2.2 Top-100 delayed rotation (existing engine, now gated)
Keep `delayedRotation.ts` (30d/90d laggards with a fresh 7d recovery, pullback limit entry, Kraken liquidity gates). Changes:
- Replace its BTC "market bullish" check with `computeBtcRegime().allowTop100Rotation`, and multiply order size by `exposureMultiplier`.
- Add `rotationBreadth()`. In the BITCOIN_LED phase, cap new rotation entries at one at a time.

### 2.3 Ranks 101–500 (`screenSmallCap`)
**Hard filters (all must pass, unknown = reject):** rank 101–500; Kraken-listed; 24h volume ≥ $1M; turnover 1–100%; market cap/FDV ≥ 0.4; unlocks ≤ 5% in 60 days; age ≥ 180 days; complete price history; BTC regime RISK_ON.

**Convexity ranking (0–100, a prior, not a probability):**
- Re-rating room: a deep drawdown from ATH (≥60%) means more asymmetry.
- Selling exhausted: price above the 50D, and 30d return better than 90d.
- Relative strength versus BTC over 30d.
- Liquidity health: turnover within the band.

Coins already up more than 100% in 30d are marked down 40% (chase risk).

### 2.4 Antifragile sizing (`planBarbell`, `ladderDecision`)
- **Barbell:** at least 90% of capital in the safe end (cash, BTC, top-100 rotation). At most **10%** in the speculative sleeve.
- **Per bet:** at most **1.5% of the portfolio** × regime exposure, at least the $8 minimum useful order, and at most **8 open bets**.
- **Committed capital is counted at cost:** a losing sleeve can't be refilled until positions are closed, and winners don't block new bets.
- **No stop-losses on small caps.** The stake is the stop, because illiquid books gap through stops. Exit fully only on a broken thesis (delisting, exploit, team exit, surprise unlock).
- **Profit ladder:** at 2× sell 50% (stake recovered, free roll); at 5× sell 25% of the original; at 10× sell 15%; keep a 10% runner. Tiers fire in order even if price gaps.
- **Dead money:** after 180 days below 1.5× and under the 50D, review and recycle the slot.
- **Never average down. Never use leverage.**

Example with the current ~$930 portfolio: the sleeve is about $93 and each bet about $14 in RISK_ON (about $7 in NEUTRAL, which is below the minimum order, so no bet). That's 6 or 7 bets.

## 3. Implementation status

| Piece | Status |
|---|---|
| Margin trading removed (UI, `/api/tactical`, service, tests) | ✅ done |
| `computeBtcRegime`, `rotationBreadth` | ✅ built and tested |
| `screenSmallCap` (plus the supply-proxy unlock check and the stablecoin filter) | ✅ built and tested |
| `planBarbell`, `ladderDecision` | ✅ built and tested |
| Top-100 delayed rotation on free data (`strategyV2/rotation.ts`) | ✅ built and tested |
| Free data feed (`strategyV2/feed.ts`, `server/strategyV2Service.ts`) and `GET /api/strategy-v2` | ✅ built and tested; dry-run on recorded live responses from 12 Oct 2026 |
| Owner's CoinMarketCap watchlist "Coins" (79 coins) in `strategyV2/watchlist.ts` | ✅ |
| UI: **Opportunities** page (BTC direction, regime rules, barbell sleeve, watchlist signals, market candidates); cards on mobile | ✅ |
| Wire the regime into the legacy `delayedRotation` engine | ⏳ optional; the new page uses `rotation.ts` |
| Validation: forward paper ledger of every screened coin, **including the ones that later delist**, compared against equal-weight rank 101–500 and BTC | ⏳ next |

### 3.1 Free data sources (no API keys)

| Need | Source | Notes |
|---|---|---|
| Rank, price, market cap, FDV, 24h volume, circulating/total/max supply, % from ATH, 7d/30d/200d/1y change | CoinGecko `GET /api/v3/coins/markets?vs_currency=usd&per_page=250&page=1..2&price_change_percentage=7d,30d,200d,1y` | 2 calls = top 500. Keyless tier is about 5–15 calls/min, so the report refreshes every 15 min. |
| Coin age (first trading data) | CoinPaprika `GET /v1/tickers` | One call, cached for 6 hours. If it fails, age is unknown and the screen rejects (fails closed). |
| Tradable on Kraken in USD | Kraken `GET /0/public/AssetPairs` | Cached for 6 hours. Aliases XBT→BTC and XDG→DOGE. |
| BTC regime (400+ daily closes) and the coin's 50-day average | Kraken `GET /0/public/OHLC?pair=…&interval=1440` | Requests spaced 1.1 s apart. Only for liquid, Kraken-listed rank 101–500 coins (at most 120), cached for 6 hours. The still-forming candle is dropped. |

**Why not CoinMarketCap's API:** the CMC MCP connector works inside Claude, but the deployed server would need its own CMC API key and its monthly credit budget. CoinGecko returns the fields this strategy uses without a key. The CMC watchlist was imported once from the owner's public watchlist page. It is a static list: edit `strategyV2/watchlist.ts` to change it.

**Unlock schedules:** DefiLlama's emissions API is paid (HTTP 402), and Tokenomist is paid. The free proxy is **circulating ÷ minted (total) supply ≥ 75%**. If at least three quarters of the minted supply already circulates, a 60-day unlock cannot exceed about 5–8% of float. Together with market cap/FDV ≥ 0.4, this rejects the heavy-unlock names. Unmined emission (e.g. DASH) is not treated as an unlock.

**Verified unlocks (`strategyV2/unlockOverrides.ts`):** for watchlist candidates, unlock schedules were checked by hand on 12 Oct 2026 against Tokenomist, Blockworks, Kresmion and project docs. Next-60-day new supply: TIA about 1.7%, PENGU about 1.6% (CoinGecko's PENGU circulating supply is stale; on-chain team and company releases are about 520M a month), CHZ about 1.2% (protocol inflation only), and 0% for APE, BONK and COMP (fully vested). A fresh entry replaces the supply proxy. After 45 days it expires, and the screen falls back to the proxy until the entry is re-checked.

**Matching CMC symbols to CoinGecko:** exact ticker first. A ticker held by a different coin whose rank is more than 150 places away is refused (e.g. UNT). Duplicate tickers are resolved by name, then by nearest rank. Coins outside CoinGecko's top 500 show "No free data", and coins ranked above 500 show "Outside strategy".

Set `ZOBIRIS_STRATEGY_V2_FEED=0` to turn the background feed off.

## 4. Honest limits
- None of this predicts price. The regime gate limits drawdowns, the screen removes likely failures, and the barbell caps the damage. Returns come from a few large winners, which won't appear in every period.
- The thresholds (0.4 float, 5% unlock, 1–100% turnover, 180 days) are reasoned defaults from the sources above, not optimised parameters. Validate them forward before trusting them.
- Small samples: with 6–8 bets, results will be dominated by luck for a long time. Judge the process (rule adherence, losses kept small), not short-term P/L.

## Sources
- Bitcoin indicator decay: https://arxiv.org/html/2607.26188v1
- On-chain valuation 2026: https://blog.amberdata.io/onchain-valuation-what-bitcoins-realized-price-says-about-2026
- Liu, Tsyvinski & Wu, Common Risk Factors in Cryptocurrency (NBER WP): https://www.nber.org/system/files/working_papers/w25882/w25882.pdf · J. Finance: https://onlinelibrary.wiley.com/doi/abs/10.1111/jofi.13119
- Survivorship and delisting bias in crypto: https://www.sebastianstoeckl.com/publications/wp2022_liebi_survivorship/
- Dead coins (CoinGecko): https://www.coingecko.com/research/publications/how-many-cryptocurrencies-failed
- Trend following in BTC (practitioner test): https://summitward.com/learn/crypto-trend-following · Quantpedia: https://quantpedia.com/trend-following-and-mean-reversion-in-bitcoin/
- M2 and Bitcoin: https://www.cfbenchmarks.com/blog/the-m2-bitcoin-relationship-what-the-data-actually-shows · https://onrampbitcoin.com/research/bitcoins-macro-liquidity-cycle
- FDV and unlock dilution: https://defi-intel.com/guides/fdv-dilution-risk-defi-2026-guide/ · https://tokenomist.ai/learn/glossary-term/market-cap-vs-fdv
- Altcoin season index: https://stealthex.io/blog/altcoin-season-index-guide-current-value/ · https://nexo.com/blog/bitcoin-dominance-altcoin-season-signals
- Taleb, Statistical Consequences of Fat Tails: https://www.alphaxiv.org/abs/2001.10488 · https://fooledbyrandomness.com/DarwinCollege.pdf
- Barbell and Kelly background: https://en.wikipedia.org/wiki/Kelly_criterion · https://jackmeson1.github.io/finance/2025/10/11/taleb-barbell-strategy/
