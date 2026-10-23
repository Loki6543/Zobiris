# Market notes, 22–23 October 2026

**Authority:** `SHADOW_ONLY_NO_TRADING_AUTHORITY`. Research record. Prices are Kraken spot unless stated.
Structured data: [market-notes-2026-10-22-23.jsonl](./market-notes-2026-10-22-23.jsonl).

## BTC

- BTC pulled back from $84,840 (3-day high) to about $81,600, -3.7% from its 48h high, short of the 5% drop rule.
- The Oct 15 floor of **$79,709 held** for the second time (Kevin's call). Kevin's floor call is logged at 85% through
  Oct 29; Claude's at 45% (random-walk touch odds from 14-day hourly volatility).

## Who led

| Window | Leaders vs BTC | Laggards vs BTC |
|---|---|---|
| Oct 21 17:30 → Oct 22 17:30 (BTC -3.8%) | ATOM +1.2, XDC +1.1, SKY +0.7, KAS 0.0 (only 4 of 44 beat BTC) | ZRO -12.5, ZEC -7.6, FIL -7.3, STX -7.0, ENA -6.4, TIA -6.1 |
| Oct 17 00:00 → Oct 23 06:00 (BTC +0.3%) | CVX +29, DASH +11, COMP +10, ZEC +7, PENGU +4, KAS +4, ZBCN +4 | TIA -19, PYTH -16, STX -16, FIL -15, TEL -14, ZRO -13 |
| Oct 18 20:00 (BTC turn) → Oct 23 06:00 (BTC +1.2%) | CVX +30, COMP +17, DASH +16, ZEC +15, ENA +13, ZBCN +12, PENGU +11, DOT +11 | TIA -7, STX -7, SAND -6, TEL -3, HBAR -3; 38 of 46 beat BTC |

**Reported reasons for the Oct 22 leaders (news, after the fact):** XDC: MoneyGram joined as an institutional validator;
SBI and Shinhan Card signed a blockchain-payments MoU. ATOM: no same-day news; Wells Fargo building tokenized deposits on
Cosmos (Oct 13) and price already near its lows. SKY: stablecoin revenue (~$611M projected 2026), 7.37M SKY burned
Oct 14, $100M anchor in a Securitize fund. Common thread: institutional stablecoin and payments use.

**Correction (Kevin):** ZEC's -11% from its high was a pullback inside an uptrend (+17% from the Oct 18 low), not a
give-back. One day cannot separate the two; judge leaders on more than one window.

## Volume at the BTC turn (exploratory, Oct 18)

BTC's turn was Oct 18 20:00 UTC (low $80,568). Median Kraken relative volume vs each coin's prior week:

| | 12 week leaders | 8 laggards |
|---|---|---|
| 24h before the turn | 1.2× | 1.1× |
| 3h before to 1h after | **1.7×** | 1.0× |
| 24h after | 1.4× | 0.9× |
| Price, 24h after | +5.5% | +1.3% |

Both groups fell alike into the turn; buyers showed up in the leaders at the low. Exceptions: HBAR 3.8× with no gain
(volume can be selling). Individual pumps of +8% came 4h (ZEC, ENA) to 44h (KAS) after the turn. Registered as
`volume-at-btc-turn-forward-v1` for the next turn.

## Scored today

- Oct 21 rotation buckets: FAIL (LEAD -3.5% vs BTC, FOLLOWING -1.7%). Claude Brier 0.20.
- TIA above 0.6464 twice: MISS (best close 0.6285). Claude Brier 0.09.

## Open calls

| Call | Kevin | Claude | Resolves |
|---|---|---|---|
| Strong basket beats weak basket | 65% | 55% | Oct 25 13:52 |
| BTC holds $79,709 | 85% | 45% | Oct 29 23:38 |
| CVX, COMP, DASH, ZEC beat BTC | — | 45% | Oct 30 |

## Engine

Cost-schedule fix and calibration change merged to `main` (0c9cb4f), CI green; the Railway service had not redeployed
by Oct 22 14:30 UTC and needs a manual deploy.

## Context beyond price (23 Oct)

| Driver | Reading | Source |
|---|---|---|
| US stocks | Nasdaq -2.58% to 26,008.86 on Oct 22 (steepest drop since June, AI doubts after earnings); S&P 500 -1.19%; oil up | Reuters, Yahoo via shattered.io |
| Nasdaq base rate | After a Nasdaq -2.5% close (2021-26, n=37), BTC traded 5%+ lower within 7 days 59% of the time vs 42% for any week; ending the week lower was a coin flip (49% vs 48%) | Arxion Labs chart shared by Kevin |
| Spot BTC ETFs | Oct 19: +$526.6M net, IBIT +$665.2M (its biggest day of 2026), after about -$910M over the prior two weeks on hot inflation and rate-hike bets; ETH ETFs -$320M last week | SoSoValue via Yahoo, 247wallst |
| BlackRock | Filed for a "buffer" Bitcoin ETF (PBIT) | Yahoo/Decrypt |
| Strategy (MSTR) | Bought only 267 BTC ($22.1M, avg $82,900) Oct 12-18; holds 848,517 BTC; spent ~3x more on its own buybacks than on BTC over 5 weeks; STRC buyback raised to $3B; MSTR fell ~10% on Oct 16 | The Block, SEC 8-K, 247wallst, Stocktwits |
| Geopolitics | One outlet ties recent ETF inflows to "Operation Epic Fury" and a $5T drawdown in traditional markets; not yet verified against a primary source | cryptoticker.io |
| Fed | Expected to hold at the upcoming FOMC, with a hike priced for December; minutes and hot September CPI (Oct 14) point to more tightening under Chair Warsh; Polymarket's modal end-2027 rate is 4.5% (38%) | Seeking Alpha preview, Yahoo Finance, Polymarket |
| Jobs | September payrolls +29,000 vs ~84,000 expected; unemployment up to 4.2% (Oct 2) | BLS via CNBC, Yahoo |
| AI stocks | Oct 22: AMD -8%, Micron -6%, Nvidia -4% on datacenter and chip-cost worries after earnings; non-AI stocks held up; oil higher | TheStreet, Guardian/AP, Barron's |
| Liquidations | No free historical feed reached this session; next step is a positioning source (Coinglass or Hyperliquid) | — |

**Read:** A weak labour market alongside hot inflation and a hawkish Fed is a stagflation mix, which has historically weighed on risk assets including BTC. Bitcoin's main marginal buyer right now is ETFs led by IBIT, not Strategy, and stock-market risk (AI-led
Nasdaq selloff) is the near-term headwind. The Nasdaq base rate leans toward a deeper week, which weighs against the
$79,709 floor holding (Kevin 85%, Claude 45%).

## Prediction markets (23 Oct, ~19:50 UTC)

| Market | Odds |
|---|---|
| Polymarket: BTC dips to $80,000 by Oct 25 | 25.5% (to $78,000: 4.5%) |
| Polymarket: BTC dips to $77,500 in October | 30.5% (to $75,000: 12.5%); up to $87,500: 14.5% |
| Polymarket: BTC above $80,000 on Oct 29 | 69%; above $82,000: 42.5% |
| Kalshi: BTC above $79,500 at Oct 30 5pm EDT | ~73% |
| Polymarket: BTC hits $100k by Dec 31, 2026 / by mid-2027 | 21.5% / 53.5% |
| Polymarket: 2026 low below $70,000 | 34.5% |

**Read:** The crowd puts the chance of touching $79,709 by Oct 29 at roughly 35–40%, so a hold at about 60–65%.
That sits between Kevin (85%) and Claude (45%, updated 35%). Daily checks now record these odds.

## Liquidation map (Hyperliquid, 23 Oct 21:27 UTC, BTC $81,429)

| Below price (longs liquidated) | $M | Above price (shorts liquidated) | $M |
|---|---|---|---|
| 80.3–80.9k | 42 | 82.0–83.1k | 34 |
| **79.8–80.3k** | **81** | 83.6–84.1k | 14 |
| **79.3–79.8k** | **94** | 84.7–85.2k | 18 |
| 78.2–79.3k | 67 | 87.9–88.5k | 23 |
| 76.5–77.6k | 133 | | |
| **74.4–74.9k** (largest) | **99** | | |

Within ±10%: **$621M of longs vs $147M of shorts** at risk. About $175M of long liquidations sit right at the $79,709 floor,
so a touch there could cascade toward $77k. Positioning: the most profitable wallet tier (Apex) is net short by notional
(-0.34) while most other tiers, including the crowd, are net long. Last 7 days: $116M of BTC liquidated, split evenly
long/short, peaking Oct 20–21. Hyperliquid only; Binance and Bybit maps are larger and not included.
