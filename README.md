# Zobiris live prediction panel

Updated 2026-11-07 05:51 UTC. Current model `panel-logit-v3`, refit every run on each coin's own Kraken history. Research only: no trading authority.

900 predictions logged; 1620 windows scored.

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
| panel-logit-v3 | 1d | 1d | closes higher | 195 | 0.245 | 0.248 | +0.014 |
| panel-logit-v3 | 1d | 1d | beats BTC | 195 | 0.241 | 0.243 | +0.009 |
| panel-logit-v3 | 1d | 1d | new 7-day high | 195 | 0.027 | 0.040 | +0.328 |
| panel-logit-v3 | 1d | 1d | new 7-day low | 195 | 0.183 | 0.205 | +0.109 |
| panel-logit-v3 | 1d | 1d | range widens | 195 | 0.214 | 0.249 | +0.140 |
| panel-logit-v3 | 1d | 1d | shape | 195 | 0.742 | 0.741 | -0.000 |
| panel-logit-v3 | 1d | 1d | volume rises | 195 | 0.193 | 0.250 | +0.228 |
| panel-logit-v3 | 1d | 7d | closes higher | 105 | 0.228 | 0.189 | -0.206 |
| panel-logit-v3 | 1d | 7d | beats BTC | 105 | 0.194 | 0.201 | +0.031 |
| panel-logit-v3 | 1d | 7d | new 7-day high | 105 | 0.130 | 0.179 | +0.273 |
| panel-logit-v3 | 1d | 7d | new 7-day low | 105 | 0.143 | 0.258 | +0.444 |
| panel-logit-v3 | 1d | 7d | range widens | 105 | 0.232 | 0.256 | +0.091 |
| panel-logit-v3 | 1d | 7d | shape | 105 | 0.792 | 0.796 | +0.005 |
| panel-logit-v3 | 1d | 7d | volume rises | 105 | 0.189 | 0.258 | +0.266 |
| panel-logit-v3 | 4h | 24h | closes higher | 615 | 0.262 | 0.249 | -0.051 |
| panel-logit-v3 | 4h | 24h | beats BTC | 615 | 0.253 | 0.242 | -0.046 |
| panel-logit-v3 | 4h | 24h | new 7-day high | 615 | 0.029 | 0.046 | +0.359 |
| panel-logit-v3 | 4h | 24h | new 7-day low | 615 | 0.190 | 0.195 | +0.028 |
| panel-logit-v3 | 4h | 24h | range widens | 615 | 0.219 | 0.252 | +0.130 |
| panel-logit-v3 | 4h | 24h | shape | 615 | 0.706 | 0.723 | +0.023 |
| panel-logit-v3 | 4h | 24h | volume rises | 615 | 0.217 | 0.252 | +0.135 |
| panel-logit-v3 | 4h | 4h | closes higher | 645 | 0.257 | 0.250 | -0.024 |
| panel-logit-v3 | 4h | 4h | beats BTC | 645 | 0.258 | 0.249 | -0.034 |
| panel-logit-v3 | 4h | 4h | new 7-day high | 645 | 0.007 | 0.010 | +0.319 |
| panel-logit-v3 | 4h | 4h | new 7-day low | 645 | 0.077 | 0.084 | +0.077 |
| panel-logit-v3 | 4h | 4h | range widens | 645 | 0.223 | 0.251 | +0.112 |
| panel-logit-v3 | 4h | 4h | shape | 645 | 0.638 | 0.676 | +0.056 |
| panel-logit-v3 | 4h | 4h | volume rises | 645 | 0.218 | 0.251 | +0.128 |

## Latest 4h chart, 24h ahead

| Coin | Candle (UTC) | Close | New high | New low | Range widens | Volume rises | Up* | Beats BTC* | Likeliest shape* |
|---|---|---:|---:|---:|---:|---:|---:|---:|---|
| ADA | 11-07 00:00 | 0.183946 | 3% | 16% | 34% | 47% | 73% | 60% | range 69% |
| AVAX | 11-07 00:00 | 8.299 | 6% | 22% | 48% | 45% | 70% | 53% | range 66% |
| COMP | 11-07 00:00 | 19.91 | 8% | 7% | 32% | 35% | 76% | 59% | range 57% |
| DOGE | 11-07 00:00 | 0.0719028 | 5% | 19% | 33% | 29% | 72% | 70% | range 73% |
| DOT | 11-07 00:00 | 0.9022 | 2% | 21% | 38% | 32% | 57% | 55% | range 62% |
| ETH | 11-07 00:00 | 2242.28 | 3% | 6% | 20% | 28% | 79% | 61% | range 80% |
| HBAR | 11-07 00:00 | 0.06705 | 2% | 18% | 18% | 32% | 66% | 47% | range 76% |
| LINK | 11-07 00:00 | 10.7832 | 2% | 24% | 29% | 43% | 79% | 62% | range 66% |
| LTC | 11-07 00:00 | 52.29 | 2% | 35% | 33% | 24% | 62% | 48% | range 55% |
| NEAR | 11-07 00:00 | 3.7455 | 6% | 25% | 41% | 35% | 84% | 80% | range 54% |
| SOL | 11-07 00:00 | 89.95 | 2% | 27% | 28% | 31% | 59% | 40% | range 52% |
| SUI | 11-07 00:00 | 0.8642 | 2% | 12% | 37% | 29% | 80% | 70% | range 66% |
| TON | 11-07 00:00 | 1.092 | 1% | 34% | 36% | 31% | 74% | 65% | range 49% |
| XRP | 11-07 00:00 | 1.159 | 1% | 47% | 21% | 31% | 82% | 67% | range 52% |
| ZEC | 11-07 00:00 | 1327.67 | 26% | 2% | 53% | 46% | 69% | 70% | range 52% |

## Latest 1d chart, 7d ahead

| Coin | Candle (UTC) | Close | New high | New low | Range widens | Volume rises | Up* | Beats BTC* | Likeliest shape* |
|---|---|---:|---:|---:|---:|---:|---:|---:|---|
| ADA | 11-06 00:00 | 0.183859 | 36% | 61% | 57% | 61% | 56% | 48% | failed breakout 25% |
| AVAX | 11-06 00:00 | 8.329 | 40% | 68% | 77% | 68% | 48% | 57% | failed breakout 28% |
| COMP | 11-06 00:00 | 19.97 | 39% | 54% | 45% | 43% | 37% | 31% | failed breakout 37% |
| DOGE | 11-06 00:00 | 0.0723164 | 20% | 62% | 45% | 42% | 48% | 37% | range 34% |
| DOT | 11-06 00:00 | 0.9119 | 18% | 86% | 61% | 39% | 36% | 21% | breakdown 36% |
| ETH | 11-06 00:00 | 2235.43 | 26% | 63% | 51% | 46% | 34% | 32% | breakdown 26% |
| HBAR | 11-06 00:00 | 0.06753 | 16% | 76% | 43% | 28% | 54% | 42% | failed breakout 30% |
| LINK | 11-06 00:00 | 10.8375 | 32% | 58% | 57% | 47% | 46% | 44% | range 26% |
| LTC | 11-06 00:00 | 52.55 | 38% | 56% | 59% | 52% | 57% | 50% | range 27% |
| NEAR | 11-06 00:00 | 3.7086 | 16% | 74% | 45% | 27% | 44% | 35% | range 36% |
| SOL | 11-06 00:00 | 90.02 | 28% | 66% | 55% | 57% | 49% | 46% | failed breakout 25% |
| SUI | 11-06 00:00 | 0.868 | 42% | 61% | 66% | 49% | 52% | 40% | breakdown 24% |
| TON | 11-06 00:00 | 1.1 | 16% | 73% | 55% | 62% | 44% | 36% | range 28% |
| XRP | 11-06 00:00 | 1.17748 | 20% | 75% | 52% | 55% | 51% | 42% | range 27% |
| ZEC | 11-06 00:00 | 1321.24 | 57% | 33% | 35% | 59% | 39% | 41% | failed breakout 28% |

\* No proven skill yet: logged so the scorecard can test it, not to act on.

Earlier study: up/down and beat-BTC did not beat the base rate; new highs and lows did (docs/research/MULTI_TARGET_PANEL_2026-10-24.md). This page checks that out of sample, live.
