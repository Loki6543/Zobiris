# Zobiris live prediction panel

Updated 2026-11-01 15:00 UTC. Current model `panel-logit-v3`, refit every run on each coin's own Kraken history. Research only: no trading authority.

570 predictions logged; 945 windows scored.

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
| panel-logit-v3 | 4h | 24h | closes higher | 360 | 0.250 | 0.250 | +0.001 |
| panel-logit-v3 | 4h | 24h | beats BTC | 360 | 0.259 | 0.249 | -0.041 |
| panel-logit-v3 | 4h | 24h | new 7-day high | 360 | 0.019 | 0.042 | +0.551 |
| panel-logit-v3 | 4h | 24h | new 7-day low | 360 | 0.199 | 0.208 | +0.041 |
| panel-logit-v3 | 4h | 24h | range widens | 360 | 0.230 | 0.251 | +0.084 |
| panel-logit-v3 | 4h | 24h | shape | 360 | 0.704 | 0.701 | -0.004 |
| panel-logit-v3 | 4h | 24h | volume rises | 360 | 0.225 | 0.251 | +0.105 |
| panel-logit-v3 | 4h | 4h | closes higher | 405 | 0.252 | 0.251 | -0.005 |
| panel-logit-v3 | 4h | 4h | beats BTC | 405 | 0.263 | 0.253 | -0.038 |
| panel-logit-v3 | 4h | 4h | new 7-day high | 405 | 0.003 | 0.007 | +0.546 |
| panel-logit-v3 | 4h | 4h | new 7-day low | 405 | 0.070 | 0.074 | +0.062 |
| panel-logit-v3 | 4h | 4h | range widens | 405 | 0.224 | 0.250 | +0.106 |
| panel-logit-v3 | 4h | 4h | shape | 405 | 0.636 | 0.670 | +0.051 |
| panel-logit-v3 | 4h | 4h | volume rises | 405 | 0.216 | 0.250 | +0.138 |

## Latest 4h chart, 24h ahead

| Coin | Candle (UTC) | Close | New high | New low | Range widens | Volume rises | Up* | Beats BTC* | Likeliest shape* |
|---|---|---:|---:|---:|---:|---:|---:|---:|---|
| ADA | 11-01 08:00 | 0.193102 | 9% | 13% | 60% | 65% | 52% | 48% | range 62% |
| AVAX | 11-01 08:00 | 8.771 | 7% | 10% | 44% | 34% | 42% | 43% | range 60% |
| COMP | 11-01 08:00 | 20.61 | 10% | 19% | 48% | 66% | 52% | 50% | range 59% |
| DOGE | 11-01 08:00 | 0.0756777 | 5% | 8% | 52% | 46% | 46% | 46% | range 73% |
| DOT | 11-01 08:00 | 0.949 | 2% | 36% | 32% | 36% | 35% | 28% | range 70% |
| ETH | 11-01 08:00 | 2266.82 | 7% | 6% | 73% | 71% | 67% | 58% | range 59% |
| HBAR | 11-01 08:00 | 0.07167 | 5% | 12% | 32% | 34% | 59% | 56% | range 67% |
| LINK | 11-01 08:00 | 11.7215 | 4% | 5% | 25% | 23% | 68% | 43% | range 76% |
| LTC | 11-01 08:00 | 55.99 | 9% | 9% | 53% | 51% | 44% | 52% | range 62% |
| NEAR | 11-01 08:00 | 4.3687 | 8% | 6% | 53% | 50% | 57% | 55% | range 63% |
| SOL | 11-01 08:00 | 95.16 | 3% | 20% | 62% | 60% | 44% | 37% | range 66% |
| SUI | 11-01 08:00 | 0.9032 | 8% | 16% | 55% | 50% | 59% | 60% | range 60% |
| TON | 11-01 08:00 | 1.226 | 8% | 1% | 54% | 57% | 26% | 29% | range 50% |
| XRP | 11-01 08:00 | 1.25279 | 4% | 11% | 66% | 64% | 50% | 38% | range 58% |
| ZEC | 11-01 08:00 | 1241.51 | 7% | 8% | 64% | 62% | 72% | 65% | range 55% |

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
