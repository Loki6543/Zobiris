# Zobiris live prediction panel

Updated 2026-11-18 17:12 UTC. Current model `panel-logit-v3`, refit every run on each coin's own Kraken history. Research only: no trading authority.

1545 predictions logged; 2910 windows scored.

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
| panel-logit-v3 | 1d | 1d | closes higher | 360 | 0.245 | 0.245 | -0.004 |
| panel-logit-v3 | 1d | 1d | beats BTC | 360 | 0.245 | 0.248 | +0.012 |
| panel-logit-v3 | 1d | 1d | new 7-day high | 360 | 0.020 | 0.037 | +0.469 |
| panel-logit-v3 | 1d | 1d | new 7-day low | 360 | 0.212 | 0.270 | +0.216 |
| panel-logit-v3 | 1d | 1d | range widens | 360 | 0.214 | 0.250 | +0.142 |
| panel-logit-v3 | 1d | 1d | shape | 360 | 0.749 | 0.754 | +0.006 |
| panel-logit-v3 | 1d | 1d | volume rises | 360 | 0.210 | 0.251 | +0.165 |
| panel-logit-v3 | 1d | 7d | closes higher | 270 | 0.237 | 0.190 | -0.244 |
| panel-logit-v3 | 1d | 7d | beats BTC | 270 | 0.218 | 0.224 | +0.029 |
| panel-logit-v3 | 1d | 7d | new 7-day high | 270 | 0.137 | 0.183 | +0.254 |
| panel-logit-v3 | 1d | 7d | new 7-day low | 270 | 0.163 | 0.257 | +0.364 |
| panel-logit-v3 | 1d | 7d | range widens | 270 | 0.231 | 0.259 | +0.109 |
| panel-logit-v3 | 1d | 7d | shape | 270 | 0.803 | 0.800 | -0.004 |
| panel-logit-v3 | 1d | 7d | volume rises | 270 | 0.215 | 0.253 | +0.150 |
| panel-logit-v3 | 4h | 24h | closes higher | 1095 | 0.279 | 0.246 | -0.134 |
| panel-logit-v3 | 4h | 24h | beats BTC | 1095 | 0.268 | 0.245 | -0.096 |
| panel-logit-v3 | 4h | 24h | new 7-day high | 1095 | 0.021 | 0.043 | +0.515 |
| panel-logit-v3 | 4h | 24h | new 7-day low | 1095 | 0.219 | 0.261 | +0.163 |
| panel-logit-v3 | 4h | 24h | range widens | 1095 | 0.230 | 0.252 | +0.085 |
| panel-logit-v3 | 4h | 24h | shape | 1095 | 0.720 | 0.732 | +0.016 |
| panel-logit-v3 | 4h | 24h | volume rises | 1095 | 0.228 | 0.251 | +0.094 |
| panel-logit-v3 | 4h | 4h | closes higher | 1125 | 0.264 | 0.250 | -0.054 |
| panel-logit-v3 | 4h | 4h | beats BTC | 1125 | 0.256 | 0.249 | -0.030 |
| panel-logit-v3 | 4h | 4h | new 7-day high | 1125 | 0.005 | 0.008 | +0.437 |
| panel-logit-v3 | 4h | 4h | new 7-day low | 1125 | 0.097 | 0.118 | +0.178 |
| panel-logit-v3 | 4h | 4h | range widens | 1125 | 0.228 | 0.251 | +0.090 |
| panel-logit-v3 | 4h | 4h | shape | 1125 | 0.661 | 0.685 | +0.035 |
| panel-logit-v3 | 4h | 4h | volume rises | 1125 | 0.227 | 0.250 | +0.095 |

## Latest 4h chart, 24h ahead

| Coin | Candle (UTC) | Close | New high | New low | Range widens | Volume rises | Up* | Beats BTC* | Likeliest shape* |
|---|---|---:|---:|---:|---:|---:|---:|---:|---|
| ADA | 11-18 12:00 | 0.150675 | 3% | 67% | 66% | 66% | 35% | 53% | range 35% |
| AVAX | 11-18 12:00 | 6.974 | 2% | 60% | 68% | 54% | 48% | 61% | range 36% |
| COMP | 11-18 12:00 | 17.91 | 3% | 42% | 47% | 53% | 39% | 49% | range 35% |
| DOGE | 11-18 12:00 | 0.0586759 | 2% | 62% | 75% | 61% | 35% | 42% | range 40% |
| DOT | 11-18 12:00 | 0.717 | 1% | 70% | 72% | 58% | 29% | 43% | range 30% |
| ETH | 11-18 12:00 | 1767.04 | 2% | 43% | 66% | 78% | 44% | 56% | range 35% |
| HBAR | 11-18 12:00 | 0.05624 | 2% | 55% | 52% | 53% | 25% | 44% | range 40% |
| LINK | 11-18 12:00 | 9.03209 | 3% | 62% | 66% | 70% | 46% | 61% | range 41% |
| LTC | 11-18 12:00 | 43.74 | 2% | 61% | 53% | 63% | 53% | 60% | range 32% |
| NEAR | 11-18 12:00 | 3.2104 | 4% | 65% | 56% | 54% | 50% | 55% | range 32% |
| SOL | 11-18 12:00 | 73.41 | 2% | 49% | 56% | 63% | 26% | 29% | range 30% |
| SUI | 11-18 12:00 | 0.7121 | 1% | 52% | 66% | 59% | 51% | 64% | range 36% |
| TON | 11-18 12:00 | 1.017 | 2% | 74% | 69% | 76% | 48% | 63% | range 26% |
| XRP | 11-18 12:00 | 0.97644 | 2% | 24% | 65% | 68% | 34% | 41% | range 29% |
| ZEC | 11-18 12:00 | 927.19 | 8% | 18% | 61% | 49% | 45% | 54% | trend up 31% |

## Latest 1d chart, 7d ahead

| Coin | Candle (UTC) | Close | New high | New low | Range widens | Volume rises | Up* | Beats BTC* | Likeliest shape* |
|---|---|---:|---:|---:|---:|---:|---:|---:|---|
| ADA | 11-17 00:00 | 0.15517 | 27% | 36% | 37% | 40% | 46% | 35% | range 27% |
| AVAX | 11-17 00:00 | 7.286 | 29% | 45% | 56% | 55% | 57% | 58% | range 39% |
| COMP | 11-17 00:00 | 17.97 | 54% | 52% | 70% | 59% | 59% | 56% | breakdown 23% |
| DOGE | 11-17 00:00 | 0.060075 | 13% | 40% | 31% | 32% | 38% | 19% | range 50% |
| DOT | 11-17 00:00 | 0.7428 | 31% | 44% | 52% | 43% | 52% | 30% | range 29% |
| ETH | 11-17 00:00 | 1822.9 | 12% | 37% | 19% | 27% | 36% | 42% | range 36% |
| HBAR | 11-17 00:00 | 0.05834 | 44% | 46% | 50% | 48% | 64% | 55% | range 29% |
| LINK | 11-17 00:00 | 9.31175 | 21% | 44% | 36% | 34% | 46% | 44% | range 34% |
| LTC | 11-17 00:00 | 45.33 | 19% | 42% | 37% | 41% | 53% | 52% | range 42% |
| NEAR | 11-17 00:00 | 3.3929 | 50% | 32% | 53% | 47% | 44% | 43% | range 41% |
| SOL | 11-17 00:00 | 75.11 | 44% | 30% | 35% | 49% | 54% | 54% | failed breakout 26% |
| SUI | 11-17 00:00 | 0.7384 | 22% | 44% | 45% | 40% | 49% | 37% | range 42% |
| TON | 11-17 00:00 | 1.078 | 21% | 56% | 41% | 49% | 38% | 37% | range 34% |
| XRP | 11-17 00:00 | 0.9826 | 46% | 26% | 40% | 58% | 56% | 55% | range 24% |
| ZEC | 11-17 00:00 | 966.96 | 50% | 28% | 44% | 41% | 40% | 42% | failed breakout 37% |

\* No proven skill yet: logged so the scorecard can test it, not to act on.

Earlier study: up/down and beat-BTC did not beat the base rate; new highs and lows did (docs/research/MULTI_TARGET_PANEL_2026-10-24.md). This page checks that out of sample, live.
