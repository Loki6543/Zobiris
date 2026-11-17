# Zobiris live prediction panel

Updated 2026-11-17 02:54 UTC. Current model `panel-logit-v3`, refit every run on each coin's own Kraken history. Research only: no trading authority.

1470 predictions logged; 2760 windows scored.

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
| panel-logit-v3 | 4h | 24h | closes higher | 1035 | 0.278 | 0.246 | -0.130 |
| panel-logit-v3 | 4h | 24h | beats BTC | 1035 | 0.265 | 0.243 | -0.092 |
| panel-logit-v3 | 4h | 24h | new 7-day high | 1035 | 0.022 | 0.045 | +0.502 |
| panel-logit-v3 | 4h | 24h | new 7-day low | 1035 | 0.220 | 0.270 | +0.186 |
| panel-logit-v3 | 4h | 24h | range widens | 1035 | 0.231 | 0.252 | +0.081 |
| panel-logit-v3 | 4h | 24h | shape | 1035 | 0.731 | 0.739 | +0.011 |
| panel-logit-v3 | 4h | 24h | volume rises | 1035 | 0.228 | 0.252 | +0.094 |
| panel-logit-v3 | 4h | 4h | closes higher | 1065 | 0.264 | 0.250 | -0.056 |
| panel-logit-v3 | 4h | 4h | beats BTC | 1065 | 0.257 | 0.248 | -0.034 |
| panel-logit-v3 | 4h | 4h | new 7-day high | 1065 | 0.005 | 0.008 | +0.425 |
| panel-logit-v3 | 4h | 4h | new 7-day low | 1065 | 0.101 | 0.123 | +0.181 |
| panel-logit-v3 | 4h | 4h | range widens | 1065 | 0.227 | 0.250 | +0.093 |
| panel-logit-v3 | 4h | 4h | shape | 1065 | 0.654 | 0.682 | +0.040 |
| panel-logit-v3 | 4h | 4h | volume rises | 1065 | 0.227 | 0.251 | +0.095 |

## Latest 4h chart, 24h ahead

| Coin | Candle (UTC) | Close | New high | New low | Range widens | Volume rises | Up* | Beats BTC* | Likeliest shape* |
|---|---|---:|---:|---:|---:|---:|---:|---:|---|
| ADA | 11-16 20:00 | 0.152989 | 4% | 29% | 53% | 67% | 34% | 41% | range 61% |
| AVAX | 11-16 20:00 | 7.112 | 2% | 43% | 56% | 41% | 42% | 42% | range 50% |
| COMP | 11-16 20:00 | 17.76 | 4% | 25% | 44% | 61% | 41% | 43% | range 40% |
| DOGE | 11-16 20:00 | 0.0588956 | 1% | 43% | 48% | 50% | 32% | 45% | range 63% |
| DOT | 11-16 20:00 | 0.7327 | 5% | 59% | 52% | 65% | 25% | 34% | range 53% |
| ETH | 11-16 20:00 | 1819.59 | 2% | 32% | 61% | 72% | 40% | 43% | range 46% |
| HBAR | 11-16 20:00 | 0.05737 | 5% | 34% | 48% | 47% | 39% | 55% | range 46% |
| LINK | 11-16 20:00 | 9.13468 | 2% | 46% | 51% | 52% | 38% | 41% | range 61% |
| LTC | 11-16 20:00 | 44.47 | 2% | 32% | 45% | 61% | 43% | 46% | range 46% |
| NEAR | 11-16 20:00 | 3.1566 | 5% | 56% | 66% | 67% | 45% | 49% | range 39% |
| SOL | 11-16 20:00 | 71.51 | 1% | 43% | 56% | 67% | 18% | 17% | range 56% |
| SUI | 11-16 20:00 | 0.7192 | 2% | 47% | 58% | 56% | 35% | 50% | range 49% |
| TON | 11-16 20:00 | 1.053 | 6% | 23% | 57% | 64% | 25% | 32% | trend down 38% |
| XRP | 11-16 20:00 | 0.95446 | 2% | 36% | 51% | 55% | 24% | 32% | range 62% |
| ZEC | 11-16 20:00 | 903.83 | 5% | 31% | 52% | 60% | 31% | 37% | range 42% |

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
