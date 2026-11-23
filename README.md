# Zobiris live prediction panel

Updated 2026-11-23 00:47 UTC. Current model `panel-logit-v3`, refit every run on each coin's own Kraken history. Research only: no trading authority.

1785 predictions logged; 3390 windows scored.

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
| panel-logit-v3 | 1d | 1d | closes higher | 435 | 0.244 | 0.244 | +0.001 |
| panel-logit-v3 | 1d | 1d | beats BTC | 435 | 0.247 | 0.247 | +0.001 |
| panel-logit-v3 | 1d | 1d | new 7-day high | 435 | 0.017 | 0.035 | +0.514 |
| panel-logit-v3 | 1d | 1d | new 7-day low | 435 | 0.204 | 0.278 | +0.265 |
| panel-logit-v3 | 1d | 1d | range widens | 435 | 0.213 | 0.250 | +0.147 |
| panel-logit-v3 | 1d | 1d | shape | 435 | 0.752 | 0.758 | +0.007 |
| panel-logit-v3 | 1d | 1d | volume rises | 435 | 0.211 | 0.251 | +0.158 |
| panel-logit-v3 | 1d | 7d | closes higher | 345 | 0.237 | 0.189 | -0.257 |
| panel-logit-v3 | 1d | 7d | beats BTC | 345 | 0.230 | 0.236 | +0.026 |
| panel-logit-v3 | 1d | 7d | new 7-day high | 345 | 0.118 | 0.179 | +0.339 |
| panel-logit-v3 | 1d | 7d | new 7-day low | 345 | 0.152 | 0.256 | +0.404 |
| panel-logit-v3 | 1d | 7d | range widens | 345 | 0.229 | 0.257 | +0.108 |
| panel-logit-v3 | 1d | 7d | shape | 345 | 0.805 | 0.803 | -0.003 |
| panel-logit-v3 | 1d | 7d | volume rises | 345 | 0.218 | 0.253 | +0.136 |
| panel-logit-v3 | 4h | 24h | closes higher | 1260 | 0.270 | 0.246 | -0.099 |
| panel-logit-v3 | 4h | 24h | beats BTC | 1260 | 0.267 | 0.245 | -0.091 |
| panel-logit-v3 | 4h | 24h | new 7-day high | 1260 | 0.019 | 0.041 | +0.546 |
| panel-logit-v3 | 4h | 24h | new 7-day low | 1260 | 0.215 | 0.265 | +0.190 |
| panel-logit-v3 | 4h | 24h | range widens | 1260 | 0.231 | 0.252 | +0.083 |
| panel-logit-v3 | 4h | 24h | shape | 1260 | 0.724 | 0.738 | +0.018 |
| panel-logit-v3 | 4h | 24h | volume rises | 1260 | 0.233 | 0.251 | +0.074 |
| panel-logit-v3 | 4h | 4h | closes higher | 1290 | 0.262 | 0.250 | -0.048 |
| panel-logit-v3 | 4h | 4h | beats BTC | 1290 | 0.256 | 0.249 | -0.027 |
| panel-logit-v3 | 4h | 4h | new 7-day high | 1290 | 0.004 | 0.008 | +0.467 |
| panel-logit-v3 | 4h | 4h | new 7-day low | 1290 | 0.097 | 0.128 | +0.240 |
| panel-logit-v3 | 4h | 4h | range widens | 1290 | 0.230 | 0.250 | +0.079 |
| panel-logit-v3 | 4h | 4h | shape | 1290 | 0.659 | 0.687 | +0.041 |
| panel-logit-v3 | 4h | 4h | volume rises | 1290 | 0.232 | 0.251 | +0.073 |

## Latest 4h chart, 24h ahead

| Coin | Candle (UTC) | Close | New high | New low | Range widens | Volume rises | Up* | Beats BTC* | Likeliest shape* |
|---|---|---:|---:|---:|---:|---:|---:|---:|---|
| ADA | 11-22 20:00 | 0.144583 | 6% | 12% | 63% | 61% | 33% | 47% | range 75% |
| AVAX | 11-22 20:00 | 6.673 | 10% | 7% | 50% | 29% | 39% | 45% | range 62% |
| COMP | 11-22 20:00 | 17.16 | 11% | 6% | 48% | 63% | 47% | 55% | range 60% |
| DOGE | 11-22 20:00 | 0.0552489 | 8% | 12% | 59% | 54% | 30% | 40% | range 61% |
| DOT | 11-22 20:00 | 0.6612 | 12% | 25% | 50% | 61% | 32% | 41% | range 71% |
| ETH | 11-22 20:00 | 1721.45 | 10% | 7% | 73% | 71% | 32% | 39% | range 56% |
| HBAR | 11-22 20:00 | 0.05164 | 8% | 14% | 62% | 58% | 33% | 38% | range 45% |
| LINK | 11-22 20:00 | 8.80399 | 6% | 9% | 51% | 52% | 31% | 34% | range 67% |
| LTC | 11-22 20:00 | 40.15 | 5% | 11% | 56% | 58% | 34% | 31% | range 65% |
| NEAR | 11-22 20:00 | 2.981 | 7% | 17% | 52% | 57% | 46% | 45% | range 42% |
| SOL | 11-22 20:00 | 70.62 | 15% | 10% | 69% | 75% | 39% | 28% | range 50% |
| SUI | 11-22 20:00 | 0.6555 | 7% | 15% | 58% | 48% | 36% | 44% | range 62% |
| TON | 11-22 20:00 | 0.978 | 6% | 12% | 61% | 66% | 36% | 36% | range 46% |
| XRP | 11-22 20:00 | 0.92751 | 5% | 13% | 68% | 71% | 34% | 45% | range 60% |
| ZEC | 11-22 20:00 | 797.5 | 15% | 10% | 57% | 67% | 52% | 45% | range 62% |

## Latest 1d chart, 7d ahead

| Coin | Candle (UTC) | Close | New high | New low | Range widens | Volume rises | Up* | Beats BTC* | Likeliest shape* |
|---|---|---:|---:|---:|---:|---:|---:|---:|---|
| ADA | 11-22 00:00 | 0.144583 | 28% | 40% | 39% | 40% | 48% | 44% | range 25% |
| AVAX | 11-22 00:00 | 6.673 | 31% | 36% | 47% | 53% | 51% | 50% | range 41% |
| COMP | 11-22 00:00 | 17.16 | 63% | 28% | 72% | 61% | 63% | 72% | trend up 32% |
| DOGE | 11-22 00:00 | 0.0552489 | 13% | 48% | 39% | 32% | 32% | 23% | range 44% |
| DOT | 11-22 00:00 | 0.6612 | 32% | 52% | 52% | 42% | 52% | 36% | range 28% |
| ETH | 11-22 00:00 | 1721.45 | 26% | 33% | 27% | 30% | 32% | 47% | range 39% |
| HBAR | 11-22 00:00 | 0.05164 | 19% | 55% | 47% | 33% | 63% | 37% | range 33% |
| LINK | 11-22 00:00 | 8.80399 | 33% | 35% | 41% | 34% | 45% | 52% | range 32% |
| LTC | 11-22 00:00 | 40.15 | 11% | 45% | 32% | 31% | 46% | 52% | range 40% |
| NEAR | 11-22 00:00 | 2.981 | 35% | 49% | 54% | 36% | 47% | 47% | range 35% |
| SOL | 11-22 00:00 | 70.62 | 39% | 39% | 45% | 49% | 41% | 53% | range 34% |
| SUI | 11-22 00:00 | 0.6555 | 15% | 47% | 45% | 38% | 45% | 42% | range 50% |
| TON | 11-22 00:00 | 0.978 | 29% | 50% | 42% | 46% | 45% | 46% | range 38% |
| XRP | 11-22 00:00 | 0.92751 | 23% | 44% | 38% | 38% | 42% | 49% | range 36% |
| ZEC | 11-22 00:00 | 797.5 | 32% | 49% | 51% | 27% | 50% | 51% | range 24% |

\* No proven skill yet: logged so the scorecard can test it, not to act on.

Earlier study: up/down and beat-BTC did not beat the base rate; new highs and lows did (docs/research/MULTI_TARGET_PANEL_2026-10-24.md). This page checks that out of sample, live.
