# Zobiris live prediction panel

Updated 2026-11-17 23:29 UTC. Current model `panel-logit-v3`, refit every run on each coin's own Kraken history. Research only: no trading authority.

1500 predictions logged; 2820 windows scored.

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
| panel-logit-v3 | 1d | 1d | closes higher | 345 | 0.244 | 0.243 | -0.002 |
| panel-logit-v3 | 1d | 1d | beats BTC | 345 | 0.243 | 0.245 | +0.010 |
| panel-logit-v3 | 1d | 1d | new 7-day high | 345 | 0.020 | 0.037 | +0.455 |
| panel-logit-v3 | 1d | 1d | new 7-day low | 345 | 0.214 | 0.277 | +0.226 |
| panel-logit-v3 | 1d | 1d | range widens | 345 | 0.216 | 0.249 | +0.133 |
| panel-logit-v3 | 1d | 1d | shape | 345 | 0.751 | 0.756 | +0.006 |
| panel-logit-v3 | 1d | 1d | volume rises | 345 | 0.210 | 0.251 | +0.165 |
| panel-logit-v3 | 1d | 7d | closes higher | 255 | 0.236 | 0.191 | -0.236 |
| panel-logit-v3 | 1d | 7d | beats BTC | 255 | 0.212 | 0.216 | +0.021 |
| panel-logit-v3 | 1d | 7d | new 7-day high | 255 | 0.140 | 0.183 | +0.238 |
| panel-logit-v3 | 1d | 7d | new 7-day low | 255 | 0.167 | 0.257 | +0.351 |
| panel-logit-v3 | 1d | 7d | range widens | 255 | 0.231 | 0.259 | +0.109 |
| panel-logit-v3 | 1d | 7d | shape | 255 | 0.800 | 0.797 | -0.004 |
| panel-logit-v3 | 1d | 7d | volume rises | 255 | 0.214 | 0.253 | +0.154 |
| panel-logit-v3 | 4h | 24h | closes higher | 1065 | 0.278 | 0.246 | -0.130 |
| panel-logit-v3 | 4h | 24h | beats BTC | 1065 | 0.266 | 0.243 | -0.092 |
| panel-logit-v3 | 4h | 24h | new 7-day high | 1065 | 0.022 | 0.044 | +0.509 |
| panel-logit-v3 | 4h | 24h | new 7-day low | 1065 | 0.220 | 0.265 | +0.171 |
| panel-logit-v3 | 4h | 24h | range widens | 1065 | 0.232 | 0.252 | +0.081 |
| panel-logit-v3 | 4h | 24h | shape | 1065 | 0.723 | 0.734 | +0.015 |
| panel-logit-v3 | 4h | 24h | volume rises | 1065 | 0.228 | 0.251 | +0.093 |
| panel-logit-v3 | 4h | 4h | closes higher | 1095 | 0.263 | 0.250 | -0.052 |
| panel-logit-v3 | 4h | 4h | beats BTC | 1095 | 0.257 | 0.249 | -0.032 |
| panel-logit-v3 | 4h | 4h | new 7-day high | 1095 | 0.005 | 0.008 | +0.431 |
| panel-logit-v3 | 4h | 4h | new 7-day low | 1095 | 0.100 | 0.122 | +0.179 |
| panel-logit-v3 | 4h | 4h | range widens | 1095 | 0.228 | 0.251 | +0.092 |
| panel-logit-v3 | 4h | 4h | shape | 1095 | 0.659 | 0.685 | +0.037 |
| panel-logit-v3 | 4h | 4h | volume rises | 1095 | 0.226 | 0.251 | +0.096 |

## Latest 4h chart, 24h ahead

| Coin | Candle (UTC) | Close | New high | New low | Range widens | Volume rises | Up* | Beats BTC* | Likeliest shape* |
|---|---|---:|---:|---:|---:|---:|---:|---:|---|
| ADA | 11-17 16:00 | 0.1526 | 5% | 28% | 60% | 71% | 32% | 47% | range 54% |
| AVAX | 11-17 16:00 | 7.09 | 3% | 35% | 58% | 42% | 38% | 45% | range 55% |
| COMP | 11-17 16:00 | 17.7 | 3% | 30% | 49% | 64% | 34% | 42% | range 40% |
| DOGE | 11-17 16:00 | 0.0589748 | 2% | 37% | 55% | 55% | 30% | 41% | range 63% |
| DOT | 11-17 16:00 | 0.7293 | 5% | 54% | 56% | 58% | 30% | 37% | range 44% |
| ETH | 11-17 16:00 | 1788.9 | 2% | 37% | 56% | 68% | 46% | 52% | range 46% |
| HBAR | 11-17 16:00 | 0.05649 | 3% | 53% | 53% | 59% | 27% | 36% | range 34% |
| LINK | 11-17 16:00 | 9.10816 | 3% | 41% | 59% | 52% | 38% | 42% | range 56% |
| LTC | 11-17 16:00 | 44.46 | 3% | 31% | 46% | 67% | 42% | 43% | range 50% |
| NEAR | 11-17 16:00 | 3.1912 | 6% | 41% | 66% | 66% | 51% | 53% | range 40% |
| SOL | 11-17 16:00 | 72.76 | 3% | 30% | 56% | 63% | 26% | 25% | range 48% |
| SUI | 11-17 16:00 | 0.72 | 2% | 32% | 55% | 48% | 42% | 52% | range 47% |
| TON | 11-17 16:00 | 1.053 | 8% | 44% | 36% | 65% | 46% | 48% | breakdown 25% |
| XRP | 11-17 16:00 | 0.96439 | 3% | 18% | 51% | 64% | 26% | 31% | range 64% |
| ZEC | 11-17 16:00 | 920.32 | 6% | 26% | 50% | 58% | 41% | 45% | range 28% |

## Latest 1d chart, 7d ahead

| Coin | Candle (UTC) | Close | New high | New low | Range widens | Volume rises | Up* | Beats BTC* | Likeliest shape* |
|---|---|---:|---:|---:|---:|---:|---:|---:|---|
| ADA | 11-16 00:00 | 0.152989 | 13% | 52% | 33% | 35% | 49% | 37% | range 25% |
| AVAX | 11-16 00:00 | 7.112 | 14% | 71% | 51% | 36% | 67% | 69% | range 37% |
| COMP | 11-16 00:00 | 17.76 | 36% | 70% | 73% | 57% | 62% | 53% | breakdown 26% |
| DOGE | 11-16 00:00 | 0.0588956 | 5% | 59% | 26% | 26% | 49% | 24% | range 52% |
| DOT | 11-16 00:00 | 0.7327 | 15% | 62% | 47% | 28% | 57% | 32% | range 35% |
| ETH | 11-16 00:00 | 1819.59 | 7% | 52% | 27% | 21% | 41% | 51% | range 39% |
| HBAR | 11-16 00:00 | 0.05737 | 27% | 70% | 44% | 46% | 70% | 58% | failed breakout 43% |
| LINK | 11-16 00:00 | 9.13468 | 9% | 63% | 35% | 23% | 53% | 54% | range 35% |
| LTC | 11-16 00:00 | 44.47 | 9% | 60% | 36% | 33% | 58% | 57% | range 45% |
| NEAR | 11-16 00:00 | 3.1566 | 14% | 57% | 46% | 24% | 51% | 48% | range 38% |
| SOL | 11-16 00:00 | 71.51 | 10% | 67% | 40% | 37% | 54% | 46% | range 26% |
| SUI | 11-16 00:00 | 0.7192 | 9% | 56% | 43% | 26% | 54% | 41% | range 50% |
| TON | 11-16 00:00 | 1.053 | 11% | 65% | 32% | 28% | 43% | 41% | range 33% |
| XRP | 11-16 00:00 | 0.95446 | 25% | 52% | 46% | 53% | 60% | 57% | range 22% |
| ZEC | 11-16 00:00 | 903.83 | 21% | 51% | 55% | 23% | 48% | 47% | range 26% |

\* No proven skill yet: logged so the scorecard can test it, not to act on.

Earlier study: up/down and beat-BTC did not beat the base rate; new highs and lows did (docs/research/MULTI_TARGET_PANEL_2026-10-24.md). This page checks that out of sample, live.
