# Zobiris live prediction panel

Updated 2026-10-31 05:27 UTC. Current model `panel-logit-v3`, refit every run on each coin's own Kraken history. Research only: no trading authority.

480 predictions logged; 780 windows scored.

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
| panel-logit-v3 | 1d | 1d | closes higher | 90 | 0.239 | 0.247 | +0.032 |
| panel-logit-v3 | 1d | 1d | beats BTC | 90 | 0.237 | 0.250 | +0.050 |
| panel-logit-v3 | 1d | 1d | new 7-day high | 90 | 0.016 | 0.033 | +0.530 |
| panel-logit-v3 | 1d | 1d | new 7-day low | 90 | 0.203 | 0.275 | +0.260 |
| panel-logit-v3 | 1d | 1d | range widens | 90 | 0.209 | 0.251 | +0.168 |
| panel-logit-v3 | 1d | 1d | shape | 90 | 0.751 | 0.751 | -0.000 |
| panel-logit-v3 | 1d | 1d | volume rises | 90 | 0.227 | 0.251 | +0.097 |
| panel-logit-v3 | 4h | 24h | closes higher | 300 | 0.253 | 0.249 | -0.017 |
| panel-logit-v3 | 4h | 24h | beats BTC | 300 | 0.249 | 0.248 | -0.003 |
| panel-logit-v3 | 4h | 24h | new 7-day high | 300 | 0.021 | 0.044 | +0.517 |
| panel-logit-v3 | 4h | 24h | new 7-day low | 300 | 0.221 | 0.243 | +0.092 |
| panel-logit-v3 | 4h | 24h | range widens | 300 | 0.258 | 0.252 | -0.023 |
| panel-logit-v3 | 4h | 24h | shape | 300 | 0.758 | 0.738 | -0.027 |
| panel-logit-v3 | 4h | 24h | volume rises | 300 | 0.253 | 0.251 | -0.005 |
| panel-logit-v3 | 4h | 4h | closes higher | 330 | 0.250 | 0.251 | +0.004 |
| panel-logit-v3 | 4h | 4h | beats BTC | 330 | 0.260 | 0.254 | -0.023 |
| panel-logit-v3 | 4h | 4h | new 7-day high | 330 | 0.004 | 0.007 | +0.511 |
| panel-logit-v3 | 4h | 4h | new 7-day low | 330 | 0.085 | 0.090 | +0.062 |
| panel-logit-v3 | 4h | 4h | range widens | 330 | 0.221 | 0.251 | +0.119 |
| panel-logit-v3 | 4h | 4h | shape | 330 | 0.697 | 0.709 | +0.018 |
| panel-logit-v3 | 4h | 4h | volume rises | 330 | 0.216 | 0.251 | +0.140 |

## Latest 4h chart, 24h ahead

| Coin | Candle (UTC) | Close | New high | New low | Range widens | Volume rises | Up* | Beats BTC* | Likeliest shape* |
|---|---|---:|---:|---:|---:|---:|---:|---:|---|
| ADA | 10-31 00:00 | 0.193714 | 6% | 21% | 36% | 56% | 86% | 81% | range 42% |
| AVAX | 10-31 00:00 | 8.565 | 18% | 38% | 13% | 22% | 53% | 61% | range 67% |
| COMP | 10-31 00:00 | 20.29 | 4% | 35% | 35% | 48% | 75% | 62% | range 64% |
| DOGE | 10-31 00:00 | 0.0755754 | 6% | 18% | 33% | 20% | 70% | 74% | range 69% |
| DOT | 10-31 00:00 | 0.9622 | 7% | 18% | 33% | 46% | 88% | 76% | trend up 54% |
| ETH | 10-31 00:00 | 2236.51 | 3% | 14% | 17% | 16% | 81% | 78% | range 54% |
| HBAR | 10-31 00:00 | 0.07168 | 6% | 28% | 11% | 18% | 64% | 50% | range 48% |
| LINK | 10-31 00:00 | 11.4642 | 11% | 35% | 19% | 28% | 65% | 48% | range 48% |
| LTC | 10-31 00:00 | 55.28 | 3% | 45% | 39% | 26% | 63% | 61% | range 49% |
| NEAR | 10-31 00:00 | 4.2907 | 8% | 11% | 47% | 31% | 82% | 73% | range 45% |
| SOL | 10-31 00:00 | 96.03 | 2% | 24% | 17% | 26% | 66% | 48% | range 58% |
| SUI | 10-31 00:00 | 0.8991 | 9% | 10% | 28% | 23% | 81% | 78% | range 52% |
| TON | 10-31 00:00 | 1.183 | 1% | 20% | 38% | 24% | 53% | 46% | range 57% |
| XRP | 10-31 00:00 | 1.24831 | 1% | 13% | 19% | 24% | 78% | 64% | range 71% |
| ZEC | 10-31 00:00 | 1263.23 | 17% | 2% | 44% | 41% | 85% | 82% | range 46% |

## Latest 1d chart, 7d ahead

| Coin | Candle (UTC) | Close | New high | New low | Range widens | Volume rises | Up* | Beats BTC* | Likeliest shape* |
|---|---|---:|---:|---:|---:|---:|---:|---:|---|
| ADA | 10-30 00:00 | 0.195041 | 34% | 54% | 52% | 65% | 42% | 38% | failed breakout 26% |
| AVAX | 10-30 00:00 | 8.528 | 39% | 46% | 60% | 75% | 41% | 42% | failed breakout 33% |
| COMP | 10-30 00:00 | 20.52 | 15% | 64% | 42% | 36% | 37% | 43% | range 25% |
| DOGE | 10-30 00:00 | 0.0758849 | 19% | 53% | 41% | 57% | 41% | 34% | range 33% |
| DOT | 10-30 00:00 | 0.973 | 34% | 48% | 45% | 51% | 34% | 20% | range 30% |
| ETH | 10-30 00:00 | 2241.37 | 17% | 60% | 45% | 47% | 42% | 40% | trend down 24% |
| HBAR | 10-30 00:00 | 0.07227 | 57% | 38% | 64% | 63% | 71% | 63% | failed breakout 40% |
| LINK | 10-30 00:00 | 11.4283 | 53% | 30% | 43% | 67% | 39% | 38% | failed breakout 33% |
| LTC | 10-30 00:00 | 55.9 | 34% | 41% | 45% | 64% | 53% | 48% | range 22% |
| NEAR | 10-30 00:00 | 4.286 | 22% | 66% | 41% | 29% | 31% | 23% | range 30% |
| SOL | 10-30 00:00 | 96.17 | 27% | 58% | 47% | 60% | 48% | 42% | failed breakout 30% |
| SUI | 10-30 00:00 | 0.9038 | 31% | 50% | 60% | 50% | 41% | 30% | failed breakout 26% |
| TON | 10-30 00:00 | 1.175 | 28% | 56% | 57% | 68% | 41% | 33% | range 25% |
| XRP | 10-30 00:00 | 1.25445 | 34% | 51% | 52% | 66% | 52% | 47% | range 27% |
| ZEC | 10-30 00:00 | 1268.01 | 57% | 41% | 52% | 64% | 44% | 47% | failed breakout 30% |

\* No proven skill yet: logged so the scorecard can test it, not to act on.

Earlier study: up/down and beat-BTC did not beat the base rate; new highs and lows did (docs/research/MULTI_TARGET_PANEL_2026-10-24.md). This page checks that out of sample, live.
