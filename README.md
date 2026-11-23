# Zobiris live prediction panel

Updated 2026-11-23 14:29 UTC. Current model `panel-logit-v3`, refit every run on each coin's own Kraken history. Research only: no trading authority.

1800 predictions logged; 3420 windows scored.

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
| panel-logit-v3 | 4h | 24h | closes higher | 1275 | 0.272 | 0.246 | -0.105 |
| panel-logit-v3 | 4h | 24h | beats BTC | 1275 | 0.267 | 0.244 | -0.090 |
| panel-logit-v3 | 4h | 24h | new 7-day high | 1275 | 0.018 | 0.041 | +0.549 |
| panel-logit-v3 | 4h | 24h | new 7-day low | 1275 | 0.213 | 0.263 | +0.189 |
| panel-logit-v3 | 4h | 24h | range widens | 1275 | 0.232 | 0.252 | +0.079 |
| panel-logit-v3 | 4h | 24h | shape | 1275 | 0.725 | 0.738 | +0.017 |
| panel-logit-v3 | 4h | 24h | volume rises | 1275 | 0.234 | 0.252 | +0.071 |
| panel-logit-v3 | 4h | 4h | closes higher | 1305 | 0.262 | 0.250 | -0.048 |
| panel-logit-v3 | 4h | 4h | beats BTC | 1305 | 0.256 | 0.249 | -0.027 |
| panel-logit-v3 | 4h | 4h | new 7-day high | 1305 | 0.004 | 0.008 | +0.467 |
| panel-logit-v3 | 4h | 4h | new 7-day low | 1305 | 0.096 | 0.127 | +0.240 |
| panel-logit-v3 | 4h | 4h | range widens | 1305 | 0.229 | 0.250 | +0.084 |
| panel-logit-v3 | 4h | 4h | shape | 1305 | 0.655 | 0.684 | +0.043 |
| panel-logit-v3 | 4h | 4h | volume rises | 1305 | 0.232 | 0.251 | +0.074 |

## Latest 4h chart, 24h ahead

| Coin | Candle (UTC) | Close | New high | New low | Range widens | Volume rises | Up* | Beats BTC* | Likeliest shape* |
|---|---|---:|---:|---:|---:|---:|---:|---:|---|
| ADA | 11-23 08:00 | 0.145855 | 7% | 8% | 69% | 63% | 33% | 43% | range 69% |
| AVAX | 11-23 08:00 | 6.744 | 8% | 6% | 53% | 40% | 38% | 40% | range 62% |
| COMP | 11-23 08:00 | 17.46 | 15% | 5% | 55% | 75% | 48% | 40% | range 48% |
| DOGE | 11-23 08:00 | 0.0556864 | 8% | 10% | 60% | 59% | 31% | 36% | range 58% |
| DOT | 11-23 08:00 | 0.6767 | 27% | 14% | 56% | 70% | 51% | 54% | range 52% |
| ETH | 11-23 08:00 | 1723.72 | 4% | 10% | 59% | 63% | 41% | 50% | range 65% |
| HBAR | 11-23 08:00 | 0.05204 | 8% | 11% | 56% | 47% | 31% | 34% | range 48% |
| LINK | 11-23 08:00 | 8.95213 | 9% | 7% | 57% | 57% | 36% | 38% | range 57% |
| LTC | 11-23 08:00 | 40.89 | 7% | 9% | 59% | 68% | 35% | 25% | range 53% |
| NEAR | 11-23 08:00 | 3.0029 | 5% | 17% | 61% | 68% | 49% | 48% | range 42% |
| SOL | 11-23 08:00 | 72.45 | 18% | 6% | 69% | 76% | 35% | 25% | range 40% |
| SUI | 11-23 08:00 | 0.6719 | 10% | 8% | 59% | 53% | 38% | 39% | range 61% |
| TON | 11-23 08:00 | 0.989 | 6% | 14% | 65% | 75% | 26% | 31% | range 41% |
| XRP | 11-23 08:00 | 0.94073 | 5% | 7% | 68% | 63% | 29% | 27% | range 64% |
| ZEC | 11-23 08:00 | 794.43 | 6% | 14% | 66% | 62% | 46% | 47% | range 59% |

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
