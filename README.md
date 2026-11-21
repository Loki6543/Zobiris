# Zobiris live prediction panel

Updated 2026-11-21 01:26 UTC. Current model `panel-logit-v3`, refit every run on each coin's own Kraken history. Research only: no trading authority.

1680 predictions logged; 3180 windows scored.

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
| panel-logit-v3 | 1d | 1d | closes higher | 405 | 0.240 | 0.243 | +0.009 |
| panel-logit-v3 | 1d | 1d | beats BTC | 405 | 0.246 | 0.249 | +0.010 |
| panel-logit-v3 | 1d | 1d | new 7-day high | 405 | 0.018 | 0.036 | +0.492 |
| panel-logit-v3 | 1d | 1d | new 7-day low | 405 | 0.212 | 0.273 | +0.223 |
| panel-logit-v3 | 1d | 1d | range widens | 405 | 0.216 | 0.250 | +0.136 |
| panel-logit-v3 | 1d | 1d | shape | 405 | 0.753 | 0.757 | +0.005 |
| panel-logit-v3 | 1d | 1d | volume rises | 405 | 0.217 | 0.251 | +0.137 |
| panel-logit-v3 | 1d | 7d | closes higher | 315 | 0.238 | 0.189 | -0.259 |
| panel-logit-v3 | 1d | 7d | beats BTC | 315 | 0.228 | 0.235 | +0.031 |
| panel-logit-v3 | 1d | 7d | new 7-day high | 315 | 0.127 | 0.181 | +0.299 |
| panel-logit-v3 | 1d | 7d | new 7-day low | 315 | 0.154 | 0.256 | +0.400 |
| panel-logit-v3 | 1d | 7d | range widens | 315 | 0.233 | 0.259 | +0.102 |
| panel-logit-v3 | 1d | 7d | shape | 315 | 0.802 | 0.799 | -0.004 |
| panel-logit-v3 | 1d | 7d | volume rises | 315 | 0.219 | 0.255 | +0.140 |
| panel-logit-v3 | 4h | 24h | closes higher | 1185 | 0.271 | 0.245 | -0.106 |
| panel-logit-v3 | 4h | 24h | beats BTC | 1185 | 0.267 | 0.245 | -0.089 |
| panel-logit-v3 | 4h | 24h | new 7-day high | 1185 | 0.020 | 0.042 | +0.532 |
| panel-logit-v3 | 4h | 24h | new 7-day low | 1185 | 0.219 | 0.257 | +0.147 |
| panel-logit-v3 | 4h | 24h | range widens | 1185 | 0.232 | 0.252 | +0.079 |
| panel-logit-v3 | 4h | 24h | shape | 1185 | 0.715 | 0.729 | +0.019 |
| panel-logit-v3 | 4h | 24h | volume rises | 1185 | 0.231 | 0.251 | +0.080 |
| panel-logit-v3 | 4h | 4h | closes higher | 1215 | 0.263 | 0.250 | -0.053 |
| panel-logit-v3 | 4h | 4h | beats BTC | 1215 | 0.254 | 0.249 | -0.019 |
| panel-logit-v3 | 4h | 4h | new 7-day high | 1215 | 0.004 | 0.008 | +0.455 |
| panel-logit-v3 | 4h | 4h | new 7-day low | 1215 | 0.096 | 0.125 | +0.231 |
| panel-logit-v3 | 4h | 4h | range widens | 1215 | 0.224 | 0.250 | +0.104 |
| panel-logit-v3 | 4h | 4h | shape | 1215 | 0.664 | 0.687 | +0.033 |
| panel-logit-v3 | 4h | 4h | volume rises | 1215 | 0.229 | 0.251 | +0.088 |

## Latest 4h chart, 24h ahead

| Coin | Candle (UTC) | Close | New high | New low | Range widens | Volume rises | Up* | Beats BTC* | Likeliest shape* |
|---|---|---:|---:|---:|---:|---:|---:|---:|---|
| ADA | 11-20 20:00 | 0.142886 | 3% | 61% | 24% | 34% | 51% | 63% | range 42% |
| AVAX | 11-20 20:00 | 6.508 | 1% | 47% | 24% | 24% | 45% | 53% | range 70% |
| COMP | 11-20 20:00 | 16.91 | 1% | 44% | 34% | 35% | 58% | 58% | range 54% |
| DOGE | 11-20 20:00 | 0.0542612 | 2% | 59% | 32% | 15% | 47% | 67% | range 52% |
| DOT | 11-20 20:00 | 0.661 | 1% | 52% | 45% | 24% | 46% | 64% | range 52% |
| ETH | 11-20 20:00 | 1619.32 | 1% | 64% | 23% | 19% | 48% | 75% | range 58% |
| HBAR | 11-20 20:00 | 0.05155 | 2% | 58% | 23% | 24% | 32% | 46% | range 42% |
| LINK | 11-20 20:00 | 8.52974 | 2% | 56% | 33% | 34% | 50% | 62% | range 50% |
| LTC | 11-20 20:00 | 40.57 | 1% | 71% | 23% | 17% | 41% | 37% | range 46% |
| NEAR | 11-20 20:00 | 2.8437 | 1% | 72% | 29% | 12% | 70% | 72% | range 41% |
| SOL | 11-20 20:00 | 68.72 | 1% | 54% | 28% | 21% | 36% | 42% | range 47% |
| SUI | 11-20 20:00 | 0.6501 | 2% | 51% | 24% | 17% | 74% | 82% | range 46% |
| TON | 11-20 20:00 | 0.979 | 1% | 70% | 39% | 30% | 53% | 64% | range 30% |
| XRP | 11-20 20:00 | 0.90871 | 1% | 49% | 31% | 36% | 49% | 66% | range 57% |
| ZEC | 11-20 20:00 | 758.26 | 2% | 68% | 41% | 20% | 53% | 58% | range 27% |

## Latest 1d chart, 7d ahead

| Coin | Candle (UTC) | Close | New high | New low | Range widens | Volume rises | Up* | Beats BTC* | Likeliest shape* |
|---|---|---:|---:|---:|---:|---:|---:|---:|---|
| ADA | 11-20 00:00 | 0.142886 | 9% | 68% | 31% | 48% | 41% | 46% | failed breakout 24% |
| AVAX | 11-20 00:00 | 6.508 | 7% | 79% | 50% | 40% | 57% | 62% | range 31% |
| COMP | 11-20 00:00 | 16.91 | 36% | 56% | 76% | 60% | 63% | 71% | trend up 30% |
| DOGE | 11-20 00:00 | 0.0542612 | 3% | 80% | 36% | 41% | 46% | 37% | range 33% |
| DOT | 11-20 00:00 | 0.661 | 8% | 80% | 50% | 36% | 44% | 30% | breakdown 28% |
| ETH | 11-20 00:00 | 1619.32 | 4% | 74% | 24% | 38% | 43% | 49% | range 23% |
| HBAR | 11-20 00:00 | 0.05155 | 25% | 76% | 53% | 59% | 60% | 68% | failed breakout 42% |
| LINK | 11-20 00:00 | 8.52974 | 8% | 75% | 39% | 39% | 48% | 62% | failed breakout 23% |
| LTC | 11-20 00:00 | 40.57 | 4% | 75% | 41% | 36% | 50% | 54% | range 30% |
| NEAR | 11-20 00:00 | 2.8437 | 8% | 84% | 42% | 25% | 44% | 41% | range 34% |
| SOL | 11-20 00:00 | 68.72 | 12% | 72% | 51% | 60% | 46% | 49% | range 26% |
| SUI | 11-20 00:00 | 0.6501 | 3% | 73% | 42% | 26% | 47% | 38% | range 40% |
| TON | 11-20 00:00 | 0.979 | 9% | 85% | 49% | 51% | 47% | 47% | breakdown 28% |
| XRP | 11-20 00:00 | 0.90871 | 16% | 70% | 43% | 58% | 48% | 57% | breakdown 24% |
| ZEC | 11-20 00:00 | 758.26 | 11% | 74% | 37% | 27% | 52% | 56% | range 36% |

\* No proven skill yet: logged so the scorecard can test it, not to act on.

Earlier study: up/down and beat-BTC did not beat the base rate; new highs and lows did (docs/research/MULTI_TARGET_PANEL_2026-10-24.md). This page checks that out of sample, live.
