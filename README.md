# Zobiris live prediction panel

Updated 2026-10-26 21:00 UTC. Current model `panel-logit-v3`, refit every run on each coin's own Kraken history. Research only: no trading authority.

210 predictions logged; 300 windows scored.

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
| panel-logit-v3 | 1d | 1d | closes higher | 15 | 0.241 | 0.228 | -0.056 |
| panel-logit-v3 | 1d | 1d | beats BTC | 15 | 0.239 | 0.240 | +0.004 |
| panel-logit-v3 | 1d | 1d | new 7-day high | 15 | 0.006 | 0.027 | +0.767 |
| panel-logit-v3 | 1d | 1d | new 7-day low | 15 | 0.143 | 0.154 | +0.074 |
| panel-logit-v3 | 1d | 1d | range widens | 15 | 0.238 | 0.237 | -0.002 |
| panel-logit-v3 | 1d | 1d | shape | 15 | 0.600 | 0.592 | -0.013 |
| panel-logit-v3 | 1d | 1d | volume rises | 15 | 0.234 | 0.240 | +0.026 |
| panel-logit-v3 | 4h | 24h | closes higher | 105 | 0.252 | 0.247 | -0.018 |
| panel-logit-v3 | 4h | 24h | beats BTC | 105 | 0.279 | 0.257 | -0.086 |
| panel-logit-v3 | 4h | 24h | new 7-day high | 105 | 0.004 | 0.035 | +0.884 |
| panel-logit-v3 | 4h | 24h | new 7-day low | 105 | 0.204 | 0.210 | +0.028 |
| panel-logit-v3 | 4h | 24h | range widens | 105 | 0.233 | 0.249 | +0.065 |
| panel-logit-v3 | 4h | 24h | shape | 105 | 0.724 | 0.689 | -0.052 |
| panel-logit-v3 | 4h | 24h | volume rises | 105 | 0.223 | 0.246 | +0.092 |
| panel-logit-v3 | 4h | 4h | closes higher | 135 | 0.255 | 0.252 | -0.011 |
| panel-logit-v3 | 4h | 4h | beats BTC | 135 | 0.267 | 0.253 | -0.054 |
| panel-logit-v3 | 4h | 4h | new 7-day high | 135 | 0.000 | 0.005 | +0.926 |
| panel-logit-v3 | 4h | 4h | new 7-day low | 135 | 0.104 | 0.110 | +0.058 |
| panel-logit-v3 | 4h | 4h | range widens | 135 | 0.198 | 0.250 | +0.210 |
| panel-logit-v3 | 4h | 4h | shape | 135 | 0.698 | 0.705 | +0.010 |
| panel-logit-v3 | 4h | 4h | volume rises | 135 | 0.206 | 0.252 | +0.183 |

## Latest 4h chart, 24h ahead

| Coin | Candle (UTC) | Close | New high | New low | Range widens | Volume rises | Up* | Beats BTC* | Likeliest shape* |
|---|---|---:|---:|---:|---:|---:|---:|---:|---|
| ADA | 10-26 16:00 | 0.204823 | 17% | 40% | 54% | 63% | 51% | 51% | trend up 20% |
| AVAX | 10-26 16:00 | 8.91 | 3% | 49% | 52% | 55% | 38% | 39% | range 47% |
| COMP | 10-26 16:00 | 21.57 | 15% | 27% | 48% | 48% | 32% | 40% | trend up 26% |
| DOGE | 10-26 16:00 | 0.0771319 | 3% | 27% | 65% | 57% | 47% | 42% | range 46% |
| DOT | 10-26 16:00 | 1.007 | 2% | 62% | 56% | 57% | 50% | 49% | trend up 30% |
| ETH | 10-26 16:00 | 2314.33 | 3% | 16% | 52% | 60% | 60% | 42% | range 42% |
| HBAR | 10-26 16:00 | 0.07671 | 3% | 57% | 53% | 49% | 45% | 44% | breakdown 26% |
| LINK | 10-26 16:00 | 11.366 | 3% | 25% | 59% | 57% | 47% | 43% | range 48% |
| LTC | 10-26 16:00 | 56.32 | 4% | 30% | 46% | 49% | 48% | 51% | range 40% |
| NEAR | 10-26 16:00 | 4.4744 | 4% | 31% | 60% | 63% | 53% | 50% | range 39% |
| SOL | 10-26 16:00 | 100.32 | 3% | 42% | 59% | 60% | 58% | 48% | range 51% |
| SUI | 10-26 16:00 | 0.911 | 6% | 57% | 52% | 55% | 48% | 47% | range 24% |
| TON | 10-26 16:00 | 1.215 | 2% | 13% | 38% | 49% | 53% | 58% | range 73% |
| XRP | 10-26 16:00 | 1.29127 | 11% | 37% | 59% | 66% | 51% | 50% | range 27% |
| ZEC | 10-26 16:00 | 1226.18 | 11% | 11% | 37% | 56% | 43% | 45% | trend down 35% |

## Latest 1d chart, 7d ahead

| Coin | Candle (UTC) | Close | New high | New low | Range widens | Volume rises | Up* | Beats BTC* | Likeliest shape* |
|---|---|---:|---:|---:|---:|---:|---:|---:|---|
| ADA | 10-25 00:00 | 0.204022 | 29% | 73% | 66% | 60% | 57% | 45% | breakdown 30% |
| AVAX | 10-25 00:00 | 8.918 | 31% | 57% | 68% | 67% | 57% | 51% | breakout up 25% |
| COMP | 10-25 00:00 | 21.01 | 7% | 78% | 25% | 23% | 28% | 26% | breakdown 32% |
| DOGE | 10-25 00:00 | 0.0768086 | 20% | 65% | 54% | 61% | 45% | 29% | range 29% |
| DOT | 10-25 00:00 | 1.0274 | 15% | 78% | 46% | 30% | 47% | 30% | breakdown 29% |
| ETH | 10-25 00:00 | 2326.5 | 31% | 64% | 72% | 64% | 51% | 49% | breakdown 22% |
| HBAR | 10-25 00:00 | 0.07741 | 12% | 88% | 49% | 28% | 31% | 13% | breakdown 38% |
| LINK | 10-25 00:00 | 11.4397 | 32% | 76% | 74% | 59% | 62% | 53% | breakdown 23% |
| LTC | 10-25 00:00 | 56.68 | 28% | 61% | 51% | 53% | 52% | 46% | range 25% |
| NEAR | 10-25 00:00 | 4.5882 | 23% | 65% | 40% | 26% | 34% | 29% | breakdown 32% |
| SOL | 10-25 00:00 | 101.25 | 39% | 67% | 78% | 72% | 41% | 34% | breakdown 34% |
| SUI | 10-25 00:00 | 0.919 | 23% | 73% | 68% | 57% | 48% | 43% | breakdown 30% |
| TON | 10-25 00:00 | 1.251 | 23% | 58% | 53% | 48% | 38% | 40% | range 35% |
| XRP | 10-25 00:00 | 1.29489 | 42% | 66% | 71% | 70% | 53% | 36% | range 21% |
| ZEC | 10-25 00:00 | 1211.5 | 50% | 47% | 64% | 57% | 54% | 56% | breakout up 25% |

\* No proven skill yet: logged so the scorecard can test it, not to act on.

Earlier study: up/down and beat-BTC did not beat the base rate; new highs and lows did (docs/research/MULTI_TARGET_PANEL_2026-10-24.md). This page checks that out of sample, live.
