# Zobiris live prediction panel

Updated 2026-10-29 21:03 UTC. Current model `panel-logit-v3`, refit every run on each coin's own Kraken history. Research only: no trading authority.

390 predictions logged; 615 windows scored.

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
| panel-logit-v3 | 4h | 24h | closes higher | 240 | 0.243 | 0.248 | +0.022 |
| panel-logit-v3 | 4h | 24h | beats BTC | 240 | 0.252 | 0.247 | -0.022 |
| panel-logit-v3 | 4h | 24h | new 7-day high | 240 | 0.012 | 0.036 | +0.671 |
| panel-logit-v3 | 4h | 24h | new 7-day low | 240 | 0.179 | 0.180 | +0.008 |
| panel-logit-v3 | 4h | 24h | range widens | 240 | 0.237 | 0.251 | +0.057 |
| panel-logit-v3 | 4h | 24h | shape | 240 | 0.736 | 0.733 | -0.004 |
| panel-logit-v3 | 4h | 24h | volume rises | 240 | 0.225 | 0.251 | +0.101 |
| panel-logit-v3 | 4h | 4h | closes higher | 270 | 0.250 | 0.251 | +0.004 |
| panel-logit-v3 | 4h | 4h | beats BTC | 270 | 0.260 | 0.254 | -0.020 |
| panel-logit-v3 | 4h | 4h | new 7-day high | 270 | 0.004 | 0.008 | +0.456 |
| panel-logit-v3 | 4h | 4h | new 7-day low | 270 | 0.064 | 0.070 | +0.082 |
| panel-logit-v3 | 4h | 4h | range widens | 270 | 0.208 | 0.250 | +0.167 |
| panel-logit-v3 | 4h | 4h | shape | 270 | 0.689 | 0.702 | +0.019 |
| panel-logit-v3 | 4h | 4h | volume rises | 270 | 0.202 | 0.251 | +0.193 |

## Latest 4h chart, 24h ahead

| Coin | Candle (UTC) | Close | New high | New low | Range widens | Volume rises | Up* | Beats BTC* | Likeliest shape* |
|---|---|---:|---:|---:|---:|---:|---:|---:|---|
| ADA | 10-29 16:00 | 0.201951 | 6% | 19% | 39% | 34% | 65% | 61% | range 42% |
| AVAX | 10-29 16:00 | 8.841 | 5% | 28% | 30% | 26% | 46% | 44% | range 55% |
| COMP | 10-29 16:00 | 21.64 | 9% | 21% | 39% | 54% | 57% | 62% | range 57% |
| DOGE | 10-29 16:00 | 0.0791694 | 5% | 9% | 49% | 28% | 42% | 49% | range 48% |
| DOT | 10-29 16:00 | 0.984 | 2% | 42% | 43% | 50% | 63% | 55% | trend up 35% |
| ETH | 10-29 16:00 | 2334.59 | 4% | 8% | 26% | 24% | 48% | 44% | range 45% |
| HBAR | 10-29 16:00 | 0.07306 | 3% | 54% | 23% | 20% | 47% | 41% | range 39% |
| LINK | 10-29 16:00 | 11.6753 | 6% | 24% | 40% | 33% | 57% | 57% | range 36% |
| LTC | 10-29 16:00 | 57.92 | 13% | 14% | 39% | 34% | 62% | 64% | range 47% |
| NEAR | 10-29 16:00 | 4.3985 | 2% | 21% | 29% | 18% | 50% | 51% | range 57% |
| SOL | 10-29 16:00 | 99.72 | 2% | 27% | 25% | 22% | 50% | 51% | range 51% |
| SUI | 10-29 16:00 | 0.9283 | 6% | 13% | 38% | 21% | 66% | 68% | range 48% |
| TON | 10-29 16:00 | 1.21 | 1% | 25% | 45% | 50% | 48% | 50% | range 44% |
| XRP | 10-29 16:00 | 1.28081 | 2% | 39% | 32% | 35% | 54% | 53% | range 38% |
| ZEC | 10-29 16:00 | 1325.1 | 24% | 3% | 21% | 35% | 60% | 58% | range 34% |

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
