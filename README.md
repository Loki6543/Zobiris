# Zobiris live prediction panel

Updated 2026-11-12 16:46 UTC. Current model `panel-logit-v3`, refit every run on each coin's own Kraken history. Research only: no trading authority.

1200 predictions logged; 2220 windows scored.

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
| panel-logit-v3 | 1d | 1d | closes higher | 270 | 0.246 | 0.245 | -0.005 |
| panel-logit-v3 | 1d | 1d | beats BTC | 270 | 0.241 | 0.240 | -0.003 |
| panel-logit-v3 | 1d | 1d | new 7-day high | 270 | 0.023 | 0.038 | +0.403 |
| panel-logit-v3 | 1d | 1d | new 7-day low | 270 | 0.203 | 0.236 | +0.141 |
| panel-logit-v3 | 1d | 1d | range widens | 270 | 0.213 | 0.249 | +0.144 |
| panel-logit-v3 | 1d | 1d | shape | 270 | 0.741 | 0.731 | -0.014 |
| panel-logit-v3 | 1d | 1d | volume rises | 270 | 0.196 | 0.251 | +0.220 |
| panel-logit-v3 | 1d | 7d | closes higher | 180 | 0.236 | 0.189 | -0.249 |
| panel-logit-v3 | 1d | 7d | beats BTC | 180 | 0.202 | 0.192 | -0.052 |
| panel-logit-v3 | 1d | 7d | new 7-day high | 180 | 0.146 | 0.183 | +0.202 |
| panel-logit-v3 | 1d | 7d | new 7-day low | 180 | 0.178 | 0.258 | +0.311 |
| panel-logit-v3 | 1d | 7d | range widens | 180 | 0.224 | 0.258 | +0.132 |
| panel-logit-v3 | 1d | 7d | shape | 180 | 0.800 | 0.793 | -0.008 |
| panel-logit-v3 | 1d | 7d | volume rises | 180 | 0.202 | 0.253 | +0.202 |
| panel-logit-v3 | 4h | 24h | closes higher | 840 | 0.276 | 0.249 | -0.109 |
| panel-logit-v3 | 4h | 24h | beats BTC | 840 | 0.260 | 0.239 | -0.087 |
| panel-logit-v3 | 4h | 24h | new 7-day high | 840 | 0.027 | 0.046 | +0.422 |
| panel-logit-v3 | 4h | 24h | new 7-day low | 840 | 0.215 | 0.231 | +0.069 |
| panel-logit-v3 | 4h | 24h | range widens | 840 | 0.217 | 0.252 | +0.140 |
| panel-logit-v3 | 4h | 24h | shape | 840 | 0.705 | 0.722 | +0.023 |
| panel-logit-v3 | 4h | 24h | volume rises | 840 | 0.209 | 0.251 | +0.168 |
| panel-logit-v3 | 4h | 4h | closes higher | 870 | 0.258 | 0.250 | -0.030 |
| panel-logit-v3 | 4h | 4h | beats BTC | 870 | 0.254 | 0.248 | -0.026 |
| panel-logit-v3 | 4h | 4h | new 7-day high | 870 | 0.005 | 0.008 | +0.341 |
| panel-logit-v3 | 4h | 4h | new 7-day low | 870 | 0.092 | 0.099 | +0.071 |
| panel-logit-v3 | 4h | 4h | range widens | 870 | 0.229 | 0.251 | +0.090 |
| panel-logit-v3 | 4h | 4h | shape | 870 | 0.632 | 0.670 | +0.056 |
| panel-logit-v3 | 4h | 4h | volume rises | 870 | 0.225 | 0.251 | +0.103 |

## Latest 4h chart, 24h ahead

| Coin | Candle (UTC) | Close | New high | New low | Range widens | Volume rises | Up* | Beats BTC* | Likeliest shape* |
|---|---|---:|---:|---:|---:|---:|---:|---:|---|
| ADA | 11-12 12:00 | 0.170399 | 4% | 56% | 33% | 34% | 48% | 48% | range 28% |
| AVAX | 11-12 12:00 | 8.374 | 2% | 10% | 21% | 22% | 41% | 30% | range 68% |
| COMP | 11-12 12:00 | 19.87 | 4% | 10% | 53% | 51% | 36% | 46% | range 37% |
| DOGE | 11-12 12:00 | 0.0655288 | 2% | 53% | 26% | 26% | 73% | 69% | range 30% |
| DOT | 11-12 12:00 | 0.8263 | 2% | 55% | 41% | 34% | 37% | 35% | range 35% |
| ETH | 11-12 12:00 | 2006.67 | 2% | 36% | 41% | 32% | 73% | 47% | trend up 33% |
| HBAR | 11-12 12:00 | 0.06358 | 4% | 48% | 25% | 25% | 49% | 45% | range 49% |
| LINK | 11-12 12:00 | 9.96509 | 4% | 38% | 36% | 41% | 67% | 57% | range 43% |
| LTC | 11-12 12:00 | 49.03 | 3% | 44% | 34% | 35% | 60% | 55% | range 45% |
| NEAR | 11-12 12:00 | 3.3998 | 4% | 66% | 45% | 42% | 64% | 61% | range 29% |
| SOL | 11-12 12:00 | 81.61 | 1% | 47% | 44% | 42% | 56% | 45% | range 44% |
| SUI | 11-12 12:00 | 0.7939 | 2% | 40% | 34% | 32% | 65% | 62% | range 38% |
| TON | 11-12 12:00 | 1.269 | 86% | 1% | 24% | 52% | 69% | 48% | trend up 39% |
| XRP | 11-12 12:00 | 1.02592 | 1% | 80% | 27% | 33% | 55% | 47% | failed breakout 35% |
| ZEC | 11-12 12:00 | 960.29 | 3% | 55% | 38% | 30% | 40% | 46% | trend up 31% |

## Latest 1d chart, 7d ahead

| Coin | Candle (UTC) | Close | New high | New low | Range widens | Volume rises | Up* | Beats BTC* | Likeliest shape* |
|---|---|---:|---:|---:|---:|---:|---:|---:|---|
| ADA | 11-11 00:00 | 0.174408 | 32% | 68% | 65% | 67% | 58% | 50% | breakdown 27% |
| AVAX | 11-11 00:00 | 8.515 | 53% | 47% | 70% | 64% | 51% | 53% | breakdown 21% |
| COMP | 11-11 00:00 | 19.88 | 45% | 61% | 56% | 51% | 40% | 38% | breakdown 26% |
| DOGE | 11-11 00:00 | 0.0674406 | 12% | 74% | 46% | 42% | 47% | 35% | range 44% |
| DOT | 11-11 00:00 | 0.8396 | 18% | 76% | 54% | 43% | 48% | 28% | breakdown 24% |
| ETH | 11-11 00:00 | 2053.48 | 16% | 64% | 54% | 40% | 45% | 52% | range 31% |
| HBAR | 11-11 00:00 | 0.06539 | 30% | 68% | 55% | 50% | 63% | 42% | failed breakout 30% |
| LINK | 11-11 00:00 | 10.1862 | 16% | 71% | 62% | 43% | 55% | 56% | range 28% |
| LTC | 11-11 00:00 | 50.19 | 25% | 63% | 57% | 52% | 62% | 53% | range 29% |
| NEAR | 11-11 00:00 | 3.5816 | 23% | 61% | 50% | 38% | 57% | 48% | range 30% |
| SOL | 11-11 00:00 | 83.19 | 17% | 74% | 60% | 50% | 51% | 45% | breakdown 35% |
| SUI | 11-11 00:00 | 0.822 | 24% | 61% | 60% | 39% | 55% | 42% | range 36% |
| TON | 11-11 00:00 | 1.174 | 33% | 32% | 39% | 35% | 32% | 30% | range 38% |
| XRP | 11-11 00:00 | 1.05104 | 28% | 76% | 68% | 55% | 68% | 55% | range 24% |
| ZEC | 11-11 00:00 | 962.28 | 11% | 84% | 46% | 32% | 53% | 54% | range 26% |

\* No proven skill yet: logged so the scorecard can test it, not to act on.

Earlier study: up/down and beat-BTC did not beat the base rate; new highs and lows did (docs/research/MULTI_TARGET_PANEL_2026-10-24.md). This page checks that out of sample, live.
