# Zobiris live prediction panel

Updated 2026-11-11 22:40 UTC. Current model `panel-logit-v3`, refit every run on each coin's own Kraken history. Research only: no trading authority.

1155 predictions logged; 2130 windows scored.

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
| panel-logit-v3 | 1d | 1d | closes higher | 255 | 0.245 | 0.246 | +0.000 |
| panel-logit-v3 | 1d | 1d | beats BTC | 255 | 0.240 | 0.241 | +0.003 |
| panel-logit-v3 | 1d | 1d | new 7-day high | 255 | 0.021 | 0.036 | +0.408 |
| panel-logit-v3 | 1d | 1d | new 7-day low | 255 | 0.203 | 0.235 | +0.138 |
| panel-logit-v3 | 1d | 1d | range widens | 255 | 0.214 | 0.249 | +0.141 |
| panel-logit-v3 | 1d | 1d | shape | 255 | 0.745 | 0.742 | -0.004 |
| panel-logit-v3 | 1d | 1d | volume rises | 255 | 0.193 | 0.251 | +0.231 |
| panel-logit-v3 | 1d | 7d | closes higher | 165 | 0.242 | 0.189 | -0.279 |
| panel-logit-v3 | 1d | 7d | beats BTC | 165 | 0.200 | 0.191 | -0.049 |
| panel-logit-v3 | 1d | 7d | new 7-day high | 165 | 0.138 | 0.183 | +0.245 |
| panel-logit-v3 | 1d | 7d | new 7-day low | 165 | 0.161 | 0.258 | +0.376 |
| panel-logit-v3 | 1d | 7d | range widens | 165 | 0.223 | 0.258 | +0.135 |
| panel-logit-v3 | 1d | 7d | shape | 165 | 0.799 | 0.794 | -0.006 |
| panel-logit-v3 | 1d | 7d | volume rises | 165 | 0.197 | 0.255 | +0.229 |
| panel-logit-v3 | 4h | 24h | closes higher | 810 | 0.278 | 0.249 | -0.116 |
| panel-logit-v3 | 4h | 24h | beats BTC | 810 | 0.262 | 0.240 | -0.090 |
| panel-logit-v3 | 4h | 24h | new 7-day high | 810 | 0.027 | 0.045 | +0.402 |
| panel-logit-v3 | 4h | 24h | new 7-day low | 810 | 0.213 | 0.226 | +0.056 |
| panel-logit-v3 | 4h | 24h | range widens | 810 | 0.217 | 0.252 | +0.138 |
| panel-logit-v3 | 4h | 24h | shape | 810 | 0.702 | 0.717 | +0.022 |
| panel-logit-v3 | 4h | 24h | volume rises | 810 | 0.210 | 0.251 | +0.163 |
| panel-logit-v3 | 4h | 4h | closes higher | 840 | 0.257 | 0.250 | -0.026 |
| panel-logit-v3 | 4h | 4h | beats BTC | 840 | 0.254 | 0.248 | -0.025 |
| panel-logit-v3 | 4h | 4h | new 7-day high | 840 | 0.005 | 0.009 | +0.353 |
| panel-logit-v3 | 4h | 4h | new 7-day low | 840 | 0.091 | 0.098 | +0.073 |
| panel-logit-v3 | 4h | 4h | range widens | 840 | 0.226 | 0.251 | +0.100 |
| panel-logit-v3 | 4h | 4h | shape | 840 | 0.632 | 0.672 | +0.059 |
| panel-logit-v3 | 4h | 4h | volume rises | 840 | 0.223 | 0.251 | +0.109 |

## Latest 4h chart, 24h ahead

| Coin | Candle (UTC) | Close | New high | New low | Range widens | Volume rises | Up* | Beats BTC* | Likeliest shape* |
|---|---|---:|---:|---:|---:|---:|---:|---:|---|
| ADA | 11-11 16:00 | 0.177549 | 9% | 34% | 63% | 66% | 40% | 37% | range 29% |
| AVAX | 11-11 16:00 | 8.588 | 5% | 5% | 37% | 37% | 21% | 19% | range 56% |
| COMP | 11-11 16:00 | 20.07 | 12% | 10% | 58% | 54% | 42% | 48% | range 36% |
| DOGE | 11-11 16:00 | 0.0684531 | 3% | 43% | 68% | 64% | 48% | 46% | range 42% |
| DOT | 11-11 16:00 | 0.8539 | 4% | 48% | 51% | 60% | 32% | 32% | range 35% |
| ETH | 11-11 16:00 | 2075.24 | 4% | 20% | 62% | 62% | 55% | 38% | range 38% |
| HBAR | 11-11 16:00 | 0.06635 | 10% | 29% | 52% | 60% | 36% | 34% | range 31% |
| LINK | 11-11 16:00 | 10.4625 | 4% | 32% | 60% | 59% | 43% | 41% | range 38% |
| LTC | 11-11 16:00 | 50.94 | 4% | 32% | 57% | 67% | 48% | 44% | range 32% |
| NEAR | 11-11 16:00 | 3.7176 | 10% | 30% | 56% | 61% | 33% | 36% | range 35% |
| SOL | 11-11 16:00 | 84.77 | 4% | 38% | 71% | 74% | 30% | 20% | range 34% |
| SUI | 11-11 16:00 | 0.8367 | 4% | 16% | 61% | 51% | 43% | 41% | range 35% |
| TON | 11-11 16:00 | 1.21 | 82% | 2% | 21% | 63% | 53% | 42% | trend up 25% |
| XRP | 11-11 16:00 | 1.05862 | 2% | 73% | 54% | 58% | 46% | 48% | breakdown 22% |
| ZEC | 11-11 16:00 | 999.33 | 5% | 46% | 53% | 60% | 48% | 43% | trend up 22% |

## Latest 1d chart, 7d ahead

| Coin | Candle (UTC) | Close | New high | New low | Range widens | Volume rises | Up* | Beats BTC* | Likeliest shape* |
|---|---|---:|---:|---:|---:|---:|---:|---:|---|
| ADA | 11-10 00:00 | 0.173741 | 26% | 70% | 60% | 60% | 50% | 40% | breakdown 30% |
| AVAX | 11-10 00:00 | 8.369 | 31% | 58% | 57% | 55% | 42% | 46% | breakdown 25% |
| COMP | 11-10 00:00 | 20 | 48% | 56% | 55% | 56% | 38% | 35% | failed breakout 27% |
| DOGE | 11-10 00:00 | 0.0679702 | 11% | 75% | 49% | 52% | 47% | 32% | range 34% |
| DOT | 11-10 00:00 | 0.8418 | 21% | 79% | 60% | 52% | 49% | 30% | breakdown 27% |
| ETH | 11-10 00:00 | 2051 | 11% | 72% | 44% | 47% | 38% | 41% | range 26% |
| HBAR | 11-10 00:00 | 0.06556 | 42% | 68% | 61% | 62% | 62% | 49% | failed breakout 40% |
| LINK | 11-10 00:00 | 10.2844 | 19% | 74% | 57% | 41% | 53% | 52% | range 27% |
| LTC | 11-10 00:00 | 50.73 | 25% | 61% | 56% | 51% | 56% | 48% | range 28% |
| NEAR | 11-10 00:00 | 3.5829 | 20% | 63% | 46% | 34% | 48% | 43% | range 31% |
| SOL | 11-10 00:00 | 83.24 | 17% | 75% | 55% | 54% | 51% | 43% | breakdown 26% |
| SUI | 11-10 00:00 | 0.8231 | 21% | 67% | 56% | 45% | 50% | 39% | range 32% |
| TON | 11-10 00:00 | 1.14 | 37% | 38% | 45% | 57% | 33% | 35% | range 36% |
| XRP | 11-10 00:00 | 1.05509 | 25% | 74% | 63% | 53% | 70% | 63% | range 26% |
| ZEC | 11-10 00:00 | 1043.82 | 14% | 71% | 37% | 34% | 51% | 52% | range 32% |

\* No proven skill yet: logged so the scorecard can test it, not to act on.

Earlier study: up/down and beat-BTC did not beat the base rate; new highs and lows did (docs/research/MULTI_TARGET_PANEL_2026-10-24.md). This page checks that out of sample, live.
