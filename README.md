# Zobiris live prediction panel

Updated 2026-11-13 01:01 UTC. Current model `panel-logit-v3`, refit every run on each coin's own Kraken history. Research only: no trading authority.

1230 predictions logged; 2280 windows scored.

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
| panel-logit-v3 | 1d | 1d | closes higher | 285 | 0.246 | 0.244 | -0.007 |
| panel-logit-v3 | 1d | 1d | beats BTC | 285 | 0.243 | 0.243 | +0.002 |
| panel-logit-v3 | 1d | 1d | new 7-day high | 285 | 0.024 | 0.040 | +0.392 |
| panel-logit-v3 | 1d | 1d | new 7-day low | 285 | 0.209 | 0.251 | +0.169 |
| panel-logit-v3 | 1d | 1d | range widens | 285 | 0.216 | 0.249 | +0.134 |
| panel-logit-v3 | 1d | 1d | shape | 285 | 0.738 | 0.729 | -0.012 |
| panel-logit-v3 | 1d | 1d | volume rises | 285 | 0.199 | 0.251 | +0.206 |
| panel-logit-v3 | 1d | 7d | closes higher | 195 | 0.238 | 0.191 | -0.247 |
| panel-logit-v3 | 1d | 7d | beats BTC | 195 | 0.204 | 0.199 | -0.023 |
| panel-logit-v3 | 1d | 7d | new 7-day high | 195 | 0.143 | 0.183 | +0.220 |
| panel-logit-v3 | 1d | 7d | new 7-day low | 195 | 0.174 | 0.258 | +0.326 |
| panel-logit-v3 | 1d | 7d | range widens | 195 | 0.225 | 0.257 | +0.125 |
| panel-logit-v3 | 1d | 7d | shape | 195 | 0.796 | 0.792 | -0.005 |
| panel-logit-v3 | 1d | 7d | volume rises | 195 | 0.206 | 0.250 | +0.178 |
| panel-logit-v3 | 4h | 24h | closes higher | 855 | 0.274 | 0.248 | -0.104 |
| panel-logit-v3 | 4h | 24h | beats BTC | 855 | 0.261 | 0.240 | -0.085 |
| panel-logit-v3 | 4h | 24h | new 7-day high | 855 | 0.026 | 0.047 | +0.437 |
| panel-logit-v3 | 4h | 24h | new 7-day low | 855 | 0.218 | 0.237 | +0.080 |
| panel-logit-v3 | 4h | 24h | range widens | 855 | 0.216 | 0.252 | +0.143 |
| panel-logit-v3 | 4h | 24h | shape | 855 | 0.707 | 0.724 | +0.024 |
| panel-logit-v3 | 4h | 24h | volume rises | 855 | 0.208 | 0.251 | +0.170 |
| panel-logit-v3 | 4h | 4h | closes higher | 885 | 0.257 | 0.250 | -0.029 |
| panel-logit-v3 | 4h | 4h | beats BTC | 885 | 0.254 | 0.248 | -0.024 |
| panel-logit-v3 | 4h | 4h | new 7-day high | 885 | 0.006 | 0.009 | +0.380 |
| panel-logit-v3 | 4h | 4h | new 7-day low | 885 | 0.092 | 0.099 | +0.072 |
| panel-logit-v3 | 4h | 4h | range widens | 885 | 0.227 | 0.251 | +0.095 |
| panel-logit-v3 | 4h | 4h | shape | 885 | 0.633 | 0.670 | +0.055 |
| panel-logit-v3 | 4h | 4h | volume rises | 885 | 0.222 | 0.251 | +0.114 |

## Latest 4h chart, 24h ahead

| Coin | Candle (UTC) | Close | New high | New low | Range widens | Volume rises | Up* | Beats BTC* | Likeliest shape* |
|---|---|---:|---:|---:|---:|---:|---:|---:|---|
| ADA | 11-12 20:00 | 0.174116 | 12% | 39% | 50% | 52% | 31% | 33% | range 26% |
| AVAX | 11-12 20:00 | 8.354 | 4% | 23% | 48% | 51% | 46% | 43% | range 49% |
| COMP | 11-12 20:00 | 19.95 | 7% | 9% | 54% | 46% | 34% | 41% | range 37% |
| DOGE | 11-12 20:00 | 0.0664175 | 4% | 44% | 45% | 32% | 58% | 54% | range 38% |
| DOT | 11-12 20:00 | 0.8334 | 2% | 46% | 39% | 30% | 31% | 24% | range 35% |
| ETH | 11-12 20:00 | 2017.15 | 3% | 35% | 52% | 39% | 73% | 54% | range 32% |
| HBAR | 11-12 20:00 | 0.06372 | 2% | 58% | 32% | 30% | 34% | 34% | range 47% |
| LINK | 11-12 20:00 | 10.1378 | 11% | 25% | 50% | 49% | 70% | 63% | range 36% |
| LTC | 11-12 20:00 | 50 | 7% | 26% | 46% | 42% | 51% | 47% | range 40% |
| NEAR | 11-12 20:00 | 3.4189 | 4% | 55% | 48% | 35% | 63% | 61% | range 33% |
| SOL | 11-12 20:00 | 81.62 | 2% | 45% | 50% | 39% | 60% | 47% | range 44% |
| SUI | 11-12 20:00 | 0.8045 | 3% | 34% | 44% | 34% | 58% | 49% | range 36% |
| TON | 11-12 20:00 | 1.139 | 16% | 6% | 8% | 20% | 78% | 74% | range 45% |
| XRP | 11-12 20:00 | 1.04003 | 2% | 48% | 30% | 30% | 52% | 43% | range 43% |
| ZEC | 11-12 20:00 | 956.97 | 4% | 49% | 46% | 32% | 41% | 46% | range 31% |

## Latest 1d chart, 7d ahead

| Coin | Candle (UTC) | Close | New high | New low | Range widens | Volume rises | Up* | Beats BTC* | Likeliest shape* |
|---|---|---:|---:|---:|---:|---:|---:|---:|---|
| ADA | 11-12 00:00 | 0.174116 | 26% | 61% | 50% | 61% | 36% | 34% | trend down 27% |
| AVAX | 11-12 00:00 | 8.354 | 38% | 64% | 64% | 46% | 52% | 58% | breakdown 28% |
| COMP | 11-12 00:00 | 19.95 | 49% | 55% | 52% | 53% | 34% | 31% | failed breakout 33% |
| DOGE | 11-12 00:00 | 0.0664175 | 10% | 69% | 40% | 46% | 42% | 32% | range 38% |
| DOT | 11-12 00:00 | 0.8334 | 20% | 75% | 48% | 40% | 44% | 24% | failed breakout 25% |
| ETH | 11-12 00:00 | 2017.15 | 15% | 70% | 50% | 43% | 38% | 46% | range 25% |
| HBAR | 11-12 00:00 | 0.06372 | 36% | 71% | 58% | 56% | 58% | 50% | failed breakout 36% |
| LINK | 11-12 00:00 | 10.1378 | 18% | 70% | 53% | 42% | 44% | 45% | breakdown 26% |
| LTC | 11-12 00:00 | 50 | 28% | 59% | 53% | 55% | 49% | 45% | range 23% |
| NEAR | 11-12 00:00 | 3.4189 | 20% | 73% | 49% | 33% | 47% | 38% | range 28% |
| SOL | 11-12 00:00 | 81.62 | 17% | 78% | 64% | 55% | 46% | 36% | breakdown 35% |
| SUI | 11-12 00:00 | 0.8045 | 24% | 65% | 55% | 40% | 52% | 36% | range 27% |
| TON | 11-12 00:00 | 1.139 | 17% | 41% | 32% | 25% | 34% | 32% | range 37% |
| XRP | 11-12 00:00 | 1.04003 | 26% | 73% | 63% | 59% | 61% | 50% | range 24% |
| ZEC | 11-12 00:00 | 956.97 | 19% | 82% | 53% | 32% | 62% | 59% | failed breakout 23% |

\* No proven skill yet: logged so the scorecard can test it, not to act on.

Earlier study: up/down and beat-BTC did not beat the base rate; new highs and lows did (docs/research/MULTI_TARGET_PANEL_2026-10-24.md). This page checks that out of sample, live.
