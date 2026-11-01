# Zobiris live prediction panel

Updated 2026-11-01 20:28 UTC. Current model `panel-logit-v3`, refit every run on each coin's own Kraken history. Research only: no trading authority.

585 predictions logged; 990 windows scored.

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
| panel-logit-v3 | 1d | 1d | closes higher | 105 | 0.243 | 0.245 | +0.011 |
| panel-logit-v3 | 1d | 1d | beats BTC | 105 | 0.241 | 0.246 | +0.023 |
| panel-logit-v3 | 1d | 1d | new 7-day high | 105 | 0.016 | 0.032 | +0.497 |
| panel-logit-v3 | 1d | 1d | new 7-day low | 105 | 0.177 | 0.241 | +0.263 |
| panel-logit-v3 | 1d | 1d | range widens | 105 | 0.195 | 0.249 | +0.218 |
| panel-logit-v3 | 1d | 1d | shape | 105 | 0.727 | 0.721 | -0.009 |
| panel-logit-v3 | 1d | 1d | volume rises | 105 | 0.208 | 0.249 | +0.165 |
| panel-logit-v3 | 1d | 7d | closes higher | 15 | 0.168 | 0.194 | +0.137 |
| panel-logit-v3 | 1d | 7d | beats BTC | 15 | 0.234 | 0.242 | +0.034 |
| panel-logit-v3 | 1d | 7d | new 7-day high | 15 | 0.087 | 0.170 | +0.488 |
| panel-logit-v3 | 1d | 7d | new 7-day low | 15 | 0.136 | 0.253 | +0.464 |
| panel-logit-v3 | 1d | 7d | range widens | 15 | 0.253 | 0.244 | -0.037 |
| panel-logit-v3 | 1d | 7d | shape | 15 | 0.831 | 0.803 | -0.034 |
| panel-logit-v3 | 1d | 7d | volume rises | 15 | 0.230 | 0.224 | -0.027 |
| panel-logit-v3 | 4h | 24h | closes higher | 390 | 0.260 | 0.250 | -0.043 |
| panel-logit-v3 | 4h | 24h | beats BTC | 390 | 0.264 | 0.247 | -0.068 |
| panel-logit-v3 | 4h | 24h | new 7-day high | 390 | 0.019 | 0.041 | +0.546 |
| panel-logit-v3 | 4h | 24h | new 7-day low | 390 | 0.186 | 0.195 | +0.046 |
| panel-logit-v3 | 4h | 24h | range widens | 390 | 0.229 | 0.251 | +0.090 |
| panel-logit-v3 | 4h | 24h | shape | 390 | 0.671 | 0.686 | +0.022 |
| panel-logit-v3 | 4h | 24h | volume rises | 390 | 0.225 | 0.251 | +0.102 |
| panel-logit-v3 | 4h | 4h | closes higher | 420 | 0.253 | 0.251 | -0.011 |
| panel-logit-v3 | 4h | 4h | beats BTC | 420 | 0.262 | 0.252 | -0.039 |
| panel-logit-v3 | 4h | 4h | new 7-day high | 420 | 0.003 | 0.007 | +0.555 |
| panel-logit-v3 | 4h | 4h | new 7-day low | 420 | 0.067 | 0.071 | +0.062 |
| panel-logit-v3 | 4h | 4h | range widens | 420 | 0.223 | 0.250 | +0.109 |
| panel-logit-v3 | 4h | 4h | shape | 420 | 0.621 | 0.662 | +0.062 |
| panel-logit-v3 | 4h | 4h | volume rises | 420 | 0.214 | 0.251 | +0.147 |

## Latest 4h chart, 24h ahead

| Coin | Candle (UTC) | Close | New high | New low | Range widens | Volume rises | Up* | Beats BTC* | Likeliest shape* |
|---|---|---:|---:|---:|---:|---:|---:|---:|---|
| ADA | 11-01 16:00 | 0.191248 | 6% | 20% | 47% | 60% | 58% | 54% | range 62% |
| AVAX | 11-01 16:00 | 8.639 | 4% | 15% | 43% | 34% | 52% | 51% | range 67% |
| COMP | 11-01 16:00 | 20.33 | 8% | 23% | 50% | 55% | 50% | 44% | range 48% |
| DOGE | 11-01 16:00 | 0.0749864 | 4% | 13% | 49% | 40% | 55% | 55% | range 70% |
| DOT | 11-01 16:00 | 0.9471 | 7% | 31% | 39% | 57% | 50% | 46% | range 59% |
| ETH | 11-01 16:00 | 2256.51 | 6% | 8% | 70% | 67% | 64% | 55% | range 64% |
| HBAR | 11-01 16:00 | 0.07138 | 5% | 13% | 34% | 39% | 58% | 54% | range 66% |
| LINK | 11-01 16:00 | 11.3676 | 2% | 22% | 46% | 37% | 58% | 42% | range 71% |
| LTC | 11-01 16:00 | 55.14 | 4% | 17% | 46% | 49% | 50% | 56% | range 63% |
| NEAR | 11-01 16:00 | 4.2569 | 4% | 10% | 53% | 48% | 62% | 63% | range 67% |
| SOL | 11-01 16:00 | 93.83 | 3% | 30% | 59% | 52% | 54% | 41% | range 54% |
| SUI | 11-01 16:00 | 0.8903 | 6% | 26% | 48% | 35% | 55% | 61% | range 60% |
| TON | 11-01 16:00 | 1.219 | 4% | 3% | 49% | 56% | 28% | 30% | range 57% |
| XRP | 11-01 16:00 | 1.24469 | 4% | 20% | 62% | 67% | 53% | 48% | range 55% |
| ZEC | 11-01 16:00 | 1216.17 | 7% | 18% | 50% | 52% | 76% | 65% | range 43% |

## Latest 1d chart, 7d ahead

| Coin | Candle (UTC) | Close | New high | New low | Range widens | Volume rises | Up* | Beats BTC* | Likeliest shape* |
|---|---|---:|---:|---:|---:|---:|---:|---:|---|
| ADA | 10-31 00:00 | 0.192775 | 30% | 60% | 66% | 57% | 61% | 58% | breakdown 22% |
| AVAX | 10-31 00:00 | 8.551 | 43% | 53% | 65% | 69% | 44% | 43% | failed breakout 23% |
| COMP | 10-31 00:00 | 20.4 | 36% | 57% | 51% | 25% | 78% | 84% | failed breakout 39% |
| DOGE | 10-31 00:00 | 0.0755442 | 16% | 56% | 40% | 42% | 46% | 35% | range 47% |
| DOT | 10-31 00:00 | 0.9452 | 20% | 72% | 47% | 30% | 47% | 30% | failed breakout 29% |
| ETH | 10-31 00:00 | 2252.5 | 28% | 52% | 62% | 49% | 51% | 54% | breakdown 22% |
| HBAR | 10-31 00:00 | 0.07174 | 42% | 53% | 55% | 51% | 71% | 56% | failed breakout 47% |
| LINK | 10-31 00:00 | 11.6328 | 46% | 31% | 44% | 45% | 44% | 39% | range 23% |
| LTC | 10-31 00:00 | 55.7 | 28% | 45% | 40% | 51% | 53% | 52% | range 32% |
| NEAR | 10-31 00:00 | 4.428 | 30% | 52% | 42% | 22% | 36% | 30% | range 27% |
| SOL | 10-31 00:00 | 95.31 | 33% | 65% | 62% | 62% | 58% | 50% | failed breakout 29% |
| SUI | 10-31 00:00 | 0.8979 | 37% | 48% | 61% | 46% | 55% | 51% | range 31% |
| TON | 10-31 00:00 | 1.209 | 35% | 45% | 45% | 52% | 38% | 31% | range 36% |
| XRP | 10-31 00:00 | 1.24948 | 29% | 65% | 61% | 52% | 55% | 37% | range 30% |
| ZEC | 10-31 00:00 | 1251.1 | 37% | 62% | 53% | 56% | 36% | 39% | breakdown 28% |

\* No proven skill yet: logged so the scorecard can test it, not to act on.

Earlier study: up/down and beat-BTC did not beat the base rate; new highs and lows did (docs/research/MULTI_TARGET_PANEL_2026-10-24.md). This page checks that out of sample, live.
