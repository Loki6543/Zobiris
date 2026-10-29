# Zobiris live prediction panel

Updated 2026-10-29 15:12 UTC. Current model `panel-logit-v3`, refit every run on each coin's own Kraken history. Research only: no trading authority.

375 predictions logged; 585 windows scored.

## Scorecard

Skill above 0 means the panel beat the base rate (how often the event happened in training). Below 20 scored windows a row is noise.

| Model | Chart | Horizon | Target | Scored | Brier | Base Brier | Skill |
|---|---|---|---|---:|---:|---:|---:|
| panel-logit-v1 | 1d | 1d | closes higher | 15 | 0.252 | 0.236 | -0.069 |
| panel-logit-v1 | 1d | 1d | beats BTC | 15 | 0.228 | 0.226 | -0.008 |
| panel-logit-v1 | 1d | 1d | new 7-day high | 15 | 0.003 | 0.027 | +0.899 |
| panel-logit-v1 | 1d | 1d | new 7-day low | 15 | 0.367 | 0.539 | +0.318 |
| panel-logit-v1 | 1d | 1d | range widens | 15 | 0.249 | 0.242 | -0.030 |
| panel-logit-v1 | 1d | 1d | shape | 15 | 0.729 | 0.698 | -0.044 |
| panel-logit-v1 | 1d | 1d | volume rises | 15 | 0.217 | 0.250 | +0.131 |
| panel-logit-v1 | 4h | 24h | closes higher | 15 | 0.312 | 0.256 | -0.222 |
| panel-logit-v1 | 4h | 24h | beats BTC | 15 | 0.274 | 0.239 | -0.147 |
| panel-logit-v1 | 4h | 24h | new 7-day high | 15 | 0.002 | 0.038 | +0.939 |
| panel-logit-v1 | 4h | 24h | new 7-day low | 15 | 0.435 | 0.581 | +0.250 |
| panel-logit-v1 | 4h | 24h | range widens | 15 | 0.219 | 0.247 | +0.115 |
| panel-logit-v1 | 4h | 24h | shape | 15 | 0.782 | 0.735 | -0.064 |
| panel-logit-v1 | 4h | 24h | volume rises | 15 | 0.237 | 0.250 | +0.054 |
| panel-logit-v1 | 4h | 4h | closes higher | 15 | 0.267 | 0.253 | -0.057 |
| panel-logit-v1 | 4h | 4h | beats BTC | 15 | 0.255 | 0.237 | -0.073 |
| panel-logit-v1 | 4h | 4h | new 7-day high | 15 | 0.000 | 0.005 | +0.971 |
| panel-logit-v1 | 4h | 4h | new 7-day low | 15 | 0.008 | 0.002 | -2.312 |
| panel-logit-v1 | 4h | 4h | range widens | 15 | 0.251 | 0.237 | -0.056 |
| panel-logit-v1 | 4h | 4h | shape | 15 | 0.703 | 0.679 | -0.035 |
| panel-logit-v1 | 4h | 4h | volume rises | 15 | 0.254 | 0.243 | -0.042 |
| panel-logit-v3 | 1d | 1d | closes higher | 60 | 0.245 | 0.246 | +0.004 |
| panel-logit-v3 | 1d | 1d | beats BTC | 60 | 0.245 | 0.250 | +0.022 |
| panel-logit-v3 | 1d | 1d | new 7-day high | 60 | 0.009 | 0.027 | +0.645 |
| panel-logit-v3 | 1d | 1d | new 7-day low | 60 | 0.123 | 0.124 | +0.010 |
| panel-logit-v3 | 1d | 1d | range widens | 60 | 0.205 | 0.250 | +0.180 |
| panel-logit-v3 | 1d | 1d | shape | 60 | 0.641 | 0.612 | -0.048 |
| panel-logit-v3 | 1d | 1d | volume rises | 60 | 0.215 | 0.249 | +0.136 |
| panel-logit-v3 | 4h | 24h | closes higher | 225 | 0.244 | 0.248 | +0.016 |
| panel-logit-v3 | 4h | 24h | beats BTC | 225 | 0.256 | 0.249 | -0.028 |
| panel-logit-v3 | 4h | 24h | new 7-day high | 225 | 0.008 | 0.034 | +0.763 |
| panel-logit-v3 | 4h | 24h | new 7-day low | 225 | 0.177 | 0.177 | -0.002 |
| panel-logit-v3 | 4h | 24h | range widens | 225 | 0.236 | 0.251 | +0.060 |
| panel-logit-v3 | 4h | 24h | shape | 225 | 0.733 | 0.726 | -0.010 |
| panel-logit-v3 | 4h | 24h | volume rises | 225 | 0.228 | 0.250 | +0.091 |
| panel-logit-v3 | 4h | 4h | closes higher | 255 | 0.252 | 0.251 | -0.001 |
| panel-logit-v3 | 4h | 4h | beats BTC | 255 | 0.261 | 0.254 | -0.026 |
| panel-logit-v3 | 4h | 4h | new 7-day high | 255 | 0.001 | 0.005 | +0.770 |
| panel-logit-v3 | 4h | 4h | new 7-day low | 255 | 0.067 | 0.073 | +0.086 |
| panel-logit-v3 | 4h | 4h | range widens | 255 | 0.202 | 0.249 | +0.189 |
| panel-logit-v3 | 4h | 4h | shape | 255 | 0.679 | 0.693 | +0.020 |
| panel-logit-v3 | 4h | 4h | volume rises | 255 | 0.202 | 0.250 | +0.193 |

## Latest 4h chart, 24h ahead

| Coin | Candle (UTC) | Close | New high | New low | Range widens | Volume rises | Up* | Beats BTC* | Likeliest shape* |
|---|---|---:|---:|---:|---:|---:|---:|---:|---|
| ADA | 10-29 08:00 | 0.2008 | 10% | 23% | 32% | 42% | 63% | 63% | range 39% |
| AVAX | 10-29 08:00 | 8.772 | 6% | 36% | 25% | 38% | 52% | 53% | range 55% |
| COMP | 10-29 08:00 | 21.54 | 7% | 22% | 39% | 51% | 55% | 56% | range 51% |
| DOGE | 10-29 08:00 | 0.0785651 | 7% | 8% | 40% | 22% | 43% | 56% | range 51% |
| DOT | 10-29 08:00 | 0.9824 | 2% | 46% | 52% | 58% | 55% | 42% | trend up 36% |
| ETH | 10-29 08:00 | 2322.07 | 4% | 8% | 33% | 33% | 53% | 49% | range 52% |
| HBAR | 10-29 08:00 | 0.07344 | 2% | 71% | 18% | 18% | 42% | 38% | range 28% |
| LINK | 10-29 08:00 | 11.6136 | 10% | 21% | 44% | 38% | 62% | 62% | range 44% |
| LTC | 10-29 08:00 | 57.96 | 20% | 12% | 26% | 18% | 60% | 55% | range 44% |
| NEAR | 10-29 08:00 | 4.413 | 3% | 15% | 35% | 24% | 58% | 56% | range 53% |
| SOL | 10-29 08:00 | 100.24 | 5% | 18% | 37% | 32% | 57% | 49% | range 53% |
| SUI | 10-29 08:00 | 0.9211 | 6% | 13% | 36% | 19% | 65% | 60% | range 56% |
| TON | 10-29 08:00 | 1.217 | 1% | 18% | 44% | 44% | 46% | 47% | range 44% |
| XRP | 10-29 08:00 | 1.28991 | 3% | 25% | 35% | 31% | 56% | 53% | range 44% |
| ZEC | 10-29 08:00 | 1272.58 | 27% | 5% | 34% | 41% | 66% | 60% | range 49% |

## Latest 1d chart, 7d ahead

| Coin | Candle (UTC) | Close | New high | New low | Range widens | Volume rises | Up* | Beats BTC* | Likeliest shape* |
|---|---|---:|---:|---:|---:|---:|---:|---:|---|
| ADA | 10-28 00:00 | 0.205623 | 38% | 71% | 72% | 67% | 52% | 43% | breakdown 30% |
| AVAX | 10-28 00:00 | 8.998 | 44% | 54% | 77% | 82% | 46% | 42% | breakout up 23% |
| COMP | 10-28 00:00 | 21.94 | 32% | 66% | 42% | 25% | 43% | 47% | range 32% |
| DOGE | 10-28 00:00 | 0.0795985 | 47% | 48% | 61% | 60% | 47% | 37% | range 26% |
| DOT | 10-28 00:00 | 1.01 | 12% | 75% | 50% | 53% | 34% | 26% | breakdown 27% |
| ETH | 10-28 00:00 | 2357.22 | 44% | 55% | 72% | 65% | 48% | 48% | breakdown 22% |
| HBAR | 10-28 00:00 | 0.07487 | 40% | 71% | 64% | 63% | 76% | 50% | failed breakout 53% |
| LINK | 10-28 00:00 | 11.8081 | 55% | 56% | 78% | 68% | 53% | 43% | breakdown 24% |
| LTC | 10-28 00:00 | 59.19 | 66% | 40% | 68% | 79% | 56% | 44% | failed breakout 20% |
| NEAR | 10-28 00:00 | 4.7311 | 33% | 65% | 56% | 28% | 35% | 27% | breakdown 36% |
| SOL | 10-28 00:00 | 102.33 | 58% | 60% | 75% | 72% | 52% | 44% | breakdown 32% |
| SUI | 10-28 00:00 | 0.9423 | 40% | 59% | 67% | 59% | 50% | 41% | breakdown 27% |
| TON | 10-28 00:00 | 1.241 | 29% | 60% | 59% | 59% | 35% | 29% | range 31% |
| XRP | 10-28 00:00 | 1.32536 | 50% | 45% | 65% | 64% | 54% | 40% | range 30% |
| ZEC | 10-28 00:00 | 1309.7 | 62% | 32% | 63% | 58% | 46% | 45% | breakout up 22% |

\* No proven skill yet: logged so the scorecard can test it, not to act on.

Earlier study: up/down and beat-BTC did not beat the base rate; new highs and lows did (docs/research/MULTI_TARGET_PANEL_2026-10-24.md). This page checks that out of sample, live.
