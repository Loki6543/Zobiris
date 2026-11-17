# Zobiris live prediction panel

Updated 2026-11-17 13:11 UTC. Current model `panel-logit-v3`, refit every run on each coin's own Kraken history. Research only: no trading authority.

1485 predictions logged; 2790 windows scored.

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
| panel-logit-v3 | 4h | 24h | closes higher | 1050 | 0.278 | 0.246 | -0.131 |
| panel-logit-v3 | 4h | 24h | beats BTC | 1050 | 0.265 | 0.243 | -0.092 |
| panel-logit-v3 | 4h | 24h | new 7-day high | 1050 | 0.022 | 0.044 | +0.506 |
| panel-logit-v3 | 4h | 24h | new 7-day low | 1050 | 0.219 | 0.267 | +0.180 |
| panel-logit-v3 | 4h | 24h | range widens | 1050 | 0.232 | 0.252 | +0.081 |
| panel-logit-v3 | 4h | 24h | shape | 1050 | 0.726 | 0.736 | +0.014 |
| panel-logit-v3 | 4h | 24h | volume rises | 1050 | 0.228 | 0.251 | +0.095 |
| panel-logit-v3 | 4h | 4h | closes higher | 1080 | 0.264 | 0.250 | -0.057 |
| panel-logit-v3 | 4h | 4h | beats BTC | 1080 | 0.257 | 0.249 | -0.034 |
| panel-logit-v3 | 4h | 4h | new 7-day high | 1080 | 0.005 | 0.008 | +0.429 |
| panel-logit-v3 | 4h | 4h | new 7-day low | 1080 | 0.100 | 0.122 | +0.181 |
| panel-logit-v3 | 4h | 4h | range widens | 1080 | 0.227 | 0.251 | +0.093 |
| panel-logit-v3 | 4h | 4h | shape | 1080 | 0.655 | 0.682 | +0.040 |
| panel-logit-v3 | 4h | 4h | volume rises | 1080 | 0.227 | 0.250 | +0.095 |

## Latest 4h chart, 24h ahead

| Coin | Candle (UTC) | Close | New high | New low | Range widens | Volume rises | Up* | Beats BTC* | Likeliest shape* |
|---|---|---:|---:|---:|---:|---:|---:|---:|---|
| ADA | 11-17 08:00 | 0.154555 | 5% | 23% | 64% | 76% | 25% | 32% | range 56% |
| AVAX | 11-17 08:00 | 7.24 | 3% | 29% | 68% | 53% | 32% | 33% | range 52% |
| COMP | 11-17 08:00 | 17.89 | 3% | 20% | 52% | 71% | 34% | 46% | range 38% |
| DOGE | 11-17 08:00 | 0.0593081 | 2% | 40% | 56% | 62% | 30% | 38% | range 58% |
| DOT | 11-17 08:00 | 0.7359 | 6% | 57% | 55% | 65% | 23% | 32% | range 51% |
| ETH | 11-17 08:00 | 1820.73 | 3% | 26% | 54% | 76% | 46% | 51% | range 49% |
| HBAR | 11-17 08:00 | 0.05776 | 8% | 25% | 57% | 57% | 29% | 40% | range 40% |
| LINK | 11-17 08:00 | 9.25467 | 3% | 33% | 62% | 65% | 33% | 40% | range 53% |
| LTC | 11-17 08:00 | 45.06 | 4% | 19% | 54% | 73% | 36% | 36% | range 50% |
| NEAR | 11-17 08:00 | 3.2842 | 10% | 27% | 64% | 74% | 37% | 38% | range 38% |
| SOL | 11-17 08:00 | 73.46 | 7% | 24% | 60% | 67% | 23% | 18% | range 42% |
| SUI | 11-17 08:00 | 0.735 | 4% | 27% | 70% | 64% | 28% | 36% | range 50% |
| TON | 11-17 08:00 | 1.03 | 4% | 47% | 66% | 77% | 32% | 40% | range 28% |
| XRP | 11-17 08:00 | 0.9703 | 4% | 14% | 59% | 67% | 23% | 30% | range 57% |
| ZEC | 11-17 08:00 | 948.81 | 15% | 13% | 43% | 67% | 31% | 38% | range 43% |

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
