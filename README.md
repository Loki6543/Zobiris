# Zobiris live prediction panel

Updated 2026-10-24 12:38 UTC. Current model `panel-logit-v3`, refit every run on each coin's own Kraken history. Research only: no trading authority.

45 predictions logged; 15 windows scored.

## Scorecard

Skill above 0 means the panel beat the base rate (how often the event happened in training). Below 20 scored windows a row is noise.

| Model | Chart | Horizon | Target | Scored | Brier | Base Brier | Skill |
|---|---|---|---|---:|---:|---:|---:|
| panel-logit-v1 | 4h | 4h | closes higher | 15 | 0.267 | 0.253 | -0.057 |
| panel-logit-v1 | 4h | 4h | beats BTC | 15 | 0.255 | 0.237 | -0.073 |
| panel-logit-v1 | 4h | 4h | new 7-day high | 15 | 0.000 | 0.005 | +0.971 |
| panel-logit-v1 | 4h | 4h | new 7-day low | 15 | 0.008 | 0.002 | -2.312 |
| panel-logit-v1 | 4h | 4h | range widens | 15 | 0.251 | 0.237 | -0.056 |
| panel-logit-v1 | 4h | 4h | shape | 15 | 0.703 | 0.679 | -0.035 |
| panel-logit-v1 | 4h | 4h | volume rises | 15 | 0.254 | 0.243 | -0.042 |

## Latest 4h chart, 24h ahead

| Coin | Candle (UTC) | Close | New high | New low | Range widens | Volume rises | Up* | Beats BTC* | Likeliest shape* |
|---|---|---:|---:|---:|---:|---:|---:|---:|---|
| ADA | 10-24 08:00 | 0.20811 | 7% | 62% | 50% | 52% | 62% | 62% | trend up 30% |
| AVAX | 10-24 08:00 | 8.907 | 3% | 55% | 56% | 57% | 60% | 42% | range 46% |
| COMP | 10-24 08:00 | 23.46 | 5% | 24% | 51% | 33% | 41% | 49% | range 36% |
| DOGE | 10-24 08:00 | 0.0774972 | 3% | 24% | 39% | 28% | 65% | 55% | range 48% |
| DOT | 10-24 08:00 | 1.0609 | 1% | 26% | 40% | 37% | 53% | 47% | range 60% |
| ETH | 10-24 08:00 | 2362.56 | 2% | 8% | 47% | 48% | 78% | 61% | range 57% |
| HBAR | 10-24 08:00 | 0.07682 | 2% | 64% | 52% | 43% | 46% | 39% | breakdown 34% |
| LINK | 10-24 08:00 | 11.5852 | 2% | 34% | 55% | 41% | 63% | 57% | range 48% |
| LTC | 10-24 08:00 | 56.3 | 2% | 47% | 53% | 40% | 58% | 52% | range 31% |
| NEAR | 10-24 08:00 | 4.493 | 1% | 24% | 42% | 31% | 58% | 50% | range 46% |
| SOL | 10-24 08:00 | 101.39 | 3% | 40% | 61% | 48% | 72% | 57% | range 39% |
| SUI | 10-24 08:00 | 0.9471 | 4% | 47% | 48% | 35% | 61% | 56% | range 44% |
| TON | 10-24 08:00 | 1.247 | 4% | 8% | 20% | 33% | 70% | 52% | range 66% |
| XRP | 10-24 08:00 | 1.27996 | 2% | 27% | 59% | 55% | 63% | 48% | range 42% |
| ZEC | 10-24 08:00 | 1154.02 | 4% | 31% | 51% | 44% | 63% | 58% | range 40% |

## Latest 1d chart, 7d ahead

| Coin | Candle (UTC) | Close | New high | New low | Range widens | Volume rises | Up* | Beats BTC* | Likeliest shape* |
|---|---|---:|---:|---:|---:|---:|---:|---:|---|
| ADA | 10-23 00:00 | 0.210652 | 30% | 77% | 63% | 55% | 49% | 41% | breakdown 32% |
| AVAX | 10-23 00:00 | 9.05 | 24% | 73% | 71% | 54% | 47% | 44% | failed breakout 25% |
| COMP | 10-23 00:00 | 24.05 | 24% | 55% | 34% | 24% | 32% | 36% | failed breakout 25% |
| DOGE | 10-23 00:00 | 0.0785192 | 27% | 63% | 55% | 55% | 44% | 42% | range 30% |
| DOT | 10-23 00:00 | 1.0849 | 18% | 76% | 44% | 42% | 34% | 26% | breakdown 29% |
| ETH | 10-23 00:00 | 2384.52 | 38% | 56% | 66% | 58% | 48% | 46% | breakdown 24% |
| HBAR | 10-23 00:00 | 0.07739 | 15% | 90% | 44% | 38% | 25% | 18% | breakdown 52% |
| LINK | 10-23 00:00 | 11.8183 | 31% | 75% | 66% | 53% | 55% | 52% | breakdown 28% |
| LTC | 10-23 00:00 | 57.22 | 17% | 77% | 51% | 39% | 36% | 36% | breakdown 30% |
| NEAR | 10-23 00:00 | 4.6848 | 16% | 79% | 40% | 21% | 31% | 27% | breakdown 34% |
| SOL | 10-23 00:00 | 102.71 | 30% | 72% | 66% | 57% | 40% | 30% | breakdown 32% |
| SUI | 10-23 00:00 | 0.9597 | 28% | 79% | 71% | 47% | 42% | 39% | breakdown 36% |
| TON | 10-23 00:00 | 1.22 | 16% | 71% | 53% | 49% | 43% | 42% | range 31% |
| XRP | 10-23 00:00 | 1.29326 | 32% | 66% | 60% | 58% | 47% | 36% | range 25% |
| ZEC | 10-23 00:00 | 1180.86 | 44% | 52% | 54% | 58% | 54% | 55% | failed breakout 23% |

\* No proven skill yet: logged so the scorecard can test it, not to act on.

Earlier study: up/down and beat-BTC did not beat the base rate; new highs and lows did (docs/research/MULTI_TARGET_PANEL_2026-10-24.md). This page checks that out of sample, live.
