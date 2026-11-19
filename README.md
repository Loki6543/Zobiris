# Zobiris live prediction panel

Updated 2026-11-19 23:01 UTC. Current model `panel-logit-v3`, refit every run on each coin's own Kraken history. Research only: no trading authority.

1605 predictions logged; 3030 windows scored.

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
| panel-logit-v3 | 1d | 1d | closes higher | 375 | 0.244 | 0.244 | +0.001 |
| panel-logit-v3 | 1d | 1d | beats BTC | 375 | 0.246 | 0.249 | +0.009 |
| panel-logit-v3 | 1d | 1d | new 7-day high | 375 | 0.019 | 0.036 | +0.467 |
| panel-logit-v3 | 1d | 1d | new 7-day low | 375 | 0.206 | 0.263 | +0.216 |
| panel-logit-v3 | 1d | 1d | range widens | 375 | 0.215 | 0.250 | +0.140 |
| panel-logit-v3 | 1d | 1d | shape | 375 | 0.749 | 0.755 | +0.008 |
| panel-logit-v3 | 1d | 1d | volume rises | 375 | 0.211 | 0.251 | +0.160 |
| panel-logit-v3 | 1d | 7d | closes higher | 285 | 0.239 | 0.190 | -0.260 |
| panel-logit-v3 | 1d | 7d | beats BTC | 285 | 0.223 | 0.232 | +0.039 |
| panel-logit-v3 | 1d | 7d | new 7-day high | 285 | 0.135 | 0.183 | +0.264 |
| panel-logit-v3 | 1d | 7d | new 7-day low | 285 | 0.161 | 0.257 | +0.375 |
| panel-logit-v3 | 1d | 7d | range widens | 285 | 0.230 | 0.259 | +0.111 |
| panel-logit-v3 | 1d | 7d | shape | 285 | 0.803 | 0.800 | -0.004 |
| panel-logit-v3 | 1d | 7d | volume rises | 285 | 0.218 | 0.254 | +0.141 |
| panel-logit-v3 | 4h | 24h | closes higher | 1140 | 0.276 | 0.246 | -0.122 |
| panel-logit-v3 | 4h | 24h | beats BTC | 1140 | 0.268 | 0.245 | -0.095 |
| panel-logit-v3 | 4h | 24h | new 7-day high | 1140 | 0.020 | 0.043 | +0.524 |
| panel-logit-v3 | 4h | 24h | new 7-day low | 1140 | 0.217 | 0.254 | +0.145 |
| panel-logit-v3 | 4h | 24h | range widens | 1140 | 0.233 | 0.252 | +0.077 |
| panel-logit-v3 | 4h | 24h | shape | 1140 | 0.713 | 0.724 | +0.016 |
| panel-logit-v3 | 4h | 24h | volume rises | 1140 | 0.230 | 0.251 | +0.084 |
| panel-logit-v3 | 4h | 4h | closes higher | 1170 | 0.263 | 0.250 | -0.053 |
| panel-logit-v3 | 4h | 4h | beats BTC | 1170 | 0.256 | 0.249 | -0.027 |
| panel-logit-v3 | 4h | 4h | new 7-day high | 1170 | 0.004 | 0.008 | +0.446 |
| panel-logit-v3 | 4h | 4h | new 7-day low | 1170 | 0.095 | 0.115 | +0.173 |
| panel-logit-v3 | 4h | 4h | range widens | 1170 | 0.228 | 0.251 | +0.091 |
| panel-logit-v3 | 4h | 4h | shape | 1170 | 0.663 | 0.685 | +0.032 |
| panel-logit-v3 | 4h | 4h | volume rises | 1170 | 0.227 | 0.251 | +0.095 |

## Latest 4h chart, 24h ahead

| Coin | Candle (UTC) | Close | New high | New low | Range widens | Volume rises | Up* | Beats BTC* | Likeliest shape* |
|---|---|---:|---:|---:|---:|---:|---:|---:|---|
| ADA | 11-19 16:00 | 0.152648 | 6% | 54% | 71% | 61% | 29% | 49% | range 29% |
| AVAX | 11-19 16:00 | 7.008 | 3% | 35% | 59% | 57% | 36% | 58% | range 55% |
| COMP | 11-19 16:00 | 17.74 | 1% | 38% | 46% | 58% | 38% | 57% | range 52% |
| DOGE | 11-19 16:00 | 0.0585663 | 3% | 45% | 62% | 54% | 31% | 42% | range 44% |
| DOT | 11-19 16:00 | 0.7178 | 4% | 40% | 61% | 43% | 34% | 47% | range 31% |
| ETH | 11-19 16:00 | 1768.71 | 3% | 23% | 58% | 60% | 45% | 60% | range 51% |
| HBAR | 11-19 16:00 | 0.05483 | 2% | 73% | 52% | 61% | 23% | 36% | breakdown 35% |
| LINK | 11-19 16:00 | 9.02231 | 3% | 50% | 53% | 57% | 37% | 55% | range 38% |
| LTC | 11-19 16:00 | 42.9 | 1% | 76% | 42% | 38% | 46% | 55% | range 32% |
| NEAR | 11-19 16:00 | 3.2768 | 6% | 33% | 58% | 44% | 50% | 52% | range 37% |
| SOL | 11-19 16:00 | 73.47 | 3% | 40% | 45% | 49% | 28% | 36% | range 39% |
| SUI | 11-19 16:00 | 0.7149 | 2% | 35% | 55% | 46% | 39% | 49% | range 45% |
| TON | 11-19 16:00 | 1.021 | 1% | 62% | 68% | 65% | 57% | 58% | trend down 25% |
| XRP | 11-19 16:00 | 0.96646 | 2% | 17% | 58% | 60% | 39% | 52% | range 51% |
| ZEC | 11-19 16:00 | 902.99 | 7% | 26% | 52% | 43% | 46% | 51% | range 32% |

## Latest 1d chart, 7d ahead

| Coin | Candle (UTC) | Close | New high | New low | Range widens | Volume rises | Up* | Beats BTC* | Likeliest shape* |
|---|---|---:|---:|---:|---:|---:|---:|---:|---|
| ADA | 11-18 00:00 | 0.151293 | 14% | 54% | 36% | 37% | 46% | 39% | range 29% |
| AVAX | 11-18 00:00 | 7.023 | 15% | 70% | 58% | 46% | 63% | 66% | range 35% |
| COMP | 11-18 00:00 | 17.99 | 44% | 66% | 73% | 58% | 53% | 49% | breakdown 28% |
| DOGE | 11-18 00:00 | 0.0586978 | 6% | 63% | 28% | 27% | 44% | 26% | range 48% |
| DOT | 11-18 00:00 | 0.7187 | 16% | 67% | 54% | 36% | 47% | 26% | range 27% |
| ETH | 11-18 00:00 | 1774.77 | 9% | 57% | 27% | 32% | 38% | 48% | range 32% |
| HBAR | 11-18 00:00 | 0.05603 | 18% | 71% | 45% | 38% | 65% | 54% | range 28% |
| LINK | 11-18 00:00 | 9.07393 | 14% | 66% | 36% | 31% | 49% | 47% | range 28% |
| LTC | 11-18 00:00 | 44.04 | 10% | 64% | 42% | 40% | 56% | 54% | range 39% |
| NEAR | 11-18 00:00 | 3.3033 | 27% | 55% | 54% | 32% | 40% | 38% | range 33% |
| SOL | 11-18 00:00 | 73.55 | 21% | 55% | 46% | 50% | 50% | 45% | range 27% |
| SUI | 11-18 00:00 | 0.7193 | 12% | 57% | 43% | 30% | 55% | 39% | range 41% |
| TON | 11-18 00:00 | 1.021 | 8% | 85% | 44% | 41% | 44% | 38% | breakdown 36% |
| XRP | 11-18 00:00 | 0.96649 | 25% | 48% | 39% | 49% | 50% | 47% | range 27% |
| ZEC | 11-18 00:00 | 912.04 | 30% | 47% | 42% | 33% | 43% | 47% | failed breakout 35% |

\* No proven skill yet: logged so the scorecard can test it, not to act on.

Earlier study: up/down and beat-BTC did not beat the base rate; new highs and lows did (docs/research/MULTI_TARGET_PANEL_2026-10-24.md). This page checks that out of sample, live.
