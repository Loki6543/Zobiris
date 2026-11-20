# Zobiris live prediction panel

Updated 2026-11-20 07:02 UTC. Current model `panel-logit-v3`, refit every run on each coin's own Kraken history. Research only: no trading authority.

1635 predictions logged; 3090 windows scored.

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
| panel-logit-v1 | 1d | 7d | closes higher | 15 | 0.177 | 0.189 | +0.063 |
| panel-logit-v1 | 1d | 7d | beats BTC | 15 | 0.203 | 0.232 | +0.128 |
| panel-logit-v1 | 1d | 7d | new 7-day high | 15 | 0.083 | 0.171 | +0.514 |
| panel-logit-v1 | 1d | 7d | new 7-day low | 15 | 0.099 | 0.255 | +0.612 |
| panel-logit-v1 | 1d | 7d | range widens | 15 | 0.187 | 0.259 | +0.281 |
| panel-logit-v1 | 1d | 7d | shape | 15 | 0.893 | 0.836 | -0.069 |
| panel-logit-v1 | 1d | 7d | volume rises | 15 | 0.190 | 0.248 | +0.234 |
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
| panel-logit-v3 | 1d | 1d | closes higher | 390 | 0.242 | 0.243 | +0.007 |
| panel-logit-v3 | 1d | 1d | beats BTC | 390 | 0.248 | 0.250 | +0.008 |
| panel-logit-v3 | 1d | 1d | new 7-day high | 390 | 0.019 | 0.036 | +0.480 |
| panel-logit-v3 | 1d | 1d | new 7-day low | 390 | 0.204 | 0.258 | +0.210 |
| panel-logit-v3 | 1d | 1d | range widens | 390 | 0.216 | 0.250 | +0.135 |
| panel-logit-v3 | 1d | 1d | shape | 390 | 0.745 | 0.749 | +0.005 |
| panel-logit-v3 | 1d | 1d | volume rises | 390 | 0.213 | 0.251 | +0.152 |
| panel-logit-v3 | 1d | 7d | closes higher | 300 | 0.238 | 0.189 | -0.260 |
| panel-logit-v3 | 1d | 7d | beats BTC | 300 | 0.228 | 0.236 | +0.032 |
| panel-logit-v3 | 1d | 7d | new 7-day high | 300 | 0.132 | 0.182 | +0.277 |
| panel-logit-v3 | 1d | 7d | new 7-day low | 300 | 0.158 | 0.257 | +0.385 |
| panel-logit-v3 | 1d | 7d | range widens | 300 | 0.230 | 0.259 | +0.111 |
| panel-logit-v3 | 1d | 7d | shape | 300 | 0.804 | 0.800 | -0.005 |
| panel-logit-v3 | 1d | 7d | volume rises | 300 | 0.218 | 0.254 | +0.142 |
| panel-logit-v3 | 4h | 24h | closes higher | 1155 | 0.275 | 0.246 | -0.117 |
| panel-logit-v3 | 4h | 24h | beats BTC | 1155 | 0.268 | 0.246 | -0.091 |
| panel-logit-v3 | 4h | 24h | new 7-day high | 1155 | 0.020 | 0.043 | +0.527 |
| panel-logit-v3 | 4h | 24h | new 7-day low | 1155 | 0.217 | 0.253 | +0.140 |
| panel-logit-v3 | 4h | 24h | range widens | 1155 | 0.233 | 0.252 | +0.074 |
| panel-logit-v3 | 4h | 24h | shape | 1155 | 0.711 | 0.723 | +0.016 |
| panel-logit-v3 | 4h | 24h | volume rises | 1155 | 0.231 | 0.251 | +0.082 |
| panel-logit-v3 | 4h | 4h | closes higher | 1185 | 0.263 | 0.250 | -0.050 |
| panel-logit-v3 | 4h | 4h | beats BTC | 1185 | 0.255 | 0.249 | -0.026 |
| panel-logit-v3 | 4h | 4h | new 7-day high | 1185 | 0.004 | 0.008 | +0.449 |
| panel-logit-v3 | 4h | 4h | new 7-day low | 1185 | 0.095 | 0.116 | +0.175 |
| panel-logit-v3 | 4h | 4h | range widens | 1185 | 0.228 | 0.251 | +0.093 |
| panel-logit-v3 | 4h | 4h | shape | 1185 | 0.663 | 0.685 | +0.032 |
| panel-logit-v3 | 4h | 4h | volume rises | 1185 | 0.227 | 0.251 | +0.093 |

## Latest 4h chart, 24h ahead

| Coin | Candle (UTC) | Close | New high | New low | Range widens | Volume rises | Up* | Beats BTC* | Likeliest shape* |
|---|---|---:|---:|---:|---:|---:|---:|---:|---|
| ADA | 11-20 00:00 | 0.149388 | 3% | 68% | 56% | 55% | 40% | 51% | range 33% |
| AVAX | 11-20 00:00 | 6.903 | 2% | 40% | 48% | 37% | 47% | 59% | range 54% |
| COMP | 11-20 00:00 | 17.49 | 1% | 42% | 40% | 45% | 44% | 59% | range 58% |
| DOGE | 11-20 00:00 | 0.0574152 | 2% | 47% | 44% | 32% | 44% | 53% | range 42% |
| DOT | 11-20 00:00 | 0.699 | 1% | 59% | 48% | 28% | 34% | 51% | range 42% |
| ETH | 11-20 00:00 | 1744.07 | 2% | 26% | 40% | 38% | 53% | 69% | range 61% |
| HBAR | 11-20 00:00 | 0.05309 | 2% | 73% | 38% | 43% | 34% | 48% | breakdown 30% |
| LINK | 11-20 00:00 | 8.88027 | 2% | 52% | 42% | 42% | 46% | 61% | range 45% |
| LTC | 11-20 00:00 | 41.8 | 1% | 74% | 33% | 23% | 43% | 58% | range 45% |
| NEAR | 11-20 00:00 | 3.0469 | 1% | 68% | 42% | 24% | 55% | 65% | range 49% |
| SOL | 11-20 00:00 | 72.84 | 4% | 32% | 39% | 33% | 39% | 47% | range 56% |
| SUI | 11-20 00:00 | 0.6989 | 2% | 48% | 45% | 34% | 52% | 63% | range 47% |
| TON | 11-20 00:00 | 1.023 | 0% | 51% | 59% | 49% | 34% | 37% | range 43% |
| XRP | 11-20 00:00 | 0.96226 | 2% | 16% | 48% | 52% | 42% | 58% | range 60% |
| ZEC | 11-20 00:00 | 865 | 3% | 42% | 43% | 30% | 53% | 55% | range 39% |

## Latest 1d chart, 7d ahead

| Coin | Candle (UTC) | Close | New high | New low | Range widens | Volume rises | Up* | Beats BTC* | Likeliest shape* |
|---|---|---:|---:|---:|---:|---:|---:|---:|---|
| ADA | 11-19 00:00 | 0.151751 | 24% | 59% | 49% | 60% | 54% | 53% | breakdown 24% |
| AVAX | 11-19 00:00 | 6.984 | 16% | 63% | 62% | 59% | 62% | 64% | range 38% |
| COMP | 11-19 00:00 | 17.59 | 48% | 56% | 79% | 57% | 67% | 73% | trend up 24% |
| DOGE | 11-19 00:00 | 0.0581411 | 8% | 69% | 38% | 38% | 46% | 33% | range 41% |
| DOT | 11-19 00:00 | 0.7135 | 20% | 75% | 62% | 44% | 46% | 28% | breakdown 33% |
| ETH | 11-19 00:00 | 1755.29 | 12% | 60% | 35% | 36% | 44% | 55% | range 26% |
| HBAR | 11-19 00:00 | 0.05371 | 24% | 76% | 54% | 55% | 67% | 62% | failed breakout 38% |
| LINK | 11-19 00:00 | 8.99121 | 16% | 64% | 50% | 43% | 54% | 60% | range 24% |
| LTC | 11-19 00:00 | 42.28 | 7% | 68% | 42% | 39% | 55% | 57% | range 36% |
| NEAR | 11-19 00:00 | 3.2035 | 26% | 61% | 50% | 35% | 49% | 48% | range 32% |
| SOL | 11-19 00:00 | 73.07 | 23% | 57% | 53% | 56% | 44% | 46% | range 24% |
| SUI | 11-19 00:00 | 0.7097 | 12% | 58% | 50% | 32% | 55% | 42% | range 40% |
| TON | 11-19 00:00 | 1.015 | 12% | 85% | 49% | 45% | 42% | 36% | breakdown 34% |
| XRP | 11-19 00:00 | 0.95904 | 27% | 52% | 46% | 58% | 47% | 46% | range 24% |
| ZEC | 11-19 00:00 | 893.68 | 33% | 48% | 44% | 40% | 50% | 53% | failed breakout 31% |

\* No proven skill yet: logged so the scorecard can test it, not to act on.

Earlier study: up/down and beat-BTC did not beat the base rate; new highs and lows did (docs/research/MULTI_TARGET_PANEL_2026-10-24.md). This page checks that out of sample, live.
