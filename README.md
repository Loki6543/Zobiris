# Zobiris live prediction panel

Updated 2026-11-09 06:09 UTC. Current model `panel-logit-v3`, refit every run on each coin's own Kraken history. Research only: no trading authority.

1020 predictions logged; 1860 windows scored.

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
| panel-logit-v3 | 1d | 1d | closes higher | 225 | 0.245 | 0.246 | +0.004 |
| panel-logit-v3 | 1d | 1d | beats BTC | 225 | 0.236 | 0.238 | +0.006 |
| panel-logit-v3 | 1d | 1d | new 7-day high | 225 | 0.024 | 0.038 | +0.374 |
| panel-logit-v3 | 1d | 1d | new 7-day low | 225 | 0.194 | 0.229 | +0.151 |
| panel-logit-v3 | 1d | 1d | range widens | 225 | 0.212 | 0.249 | +0.149 |
| panel-logit-v3 | 1d | 1d | shape | 225 | 0.747 | 0.740 | -0.009 |
| panel-logit-v3 | 1d | 1d | volume rises | 225 | 0.189 | 0.250 | +0.246 |
| panel-logit-v3 | 1d | 7d | closes higher | 135 | 0.236 | 0.188 | -0.257 |
| panel-logit-v3 | 1d | 7d | beats BTC | 135 | 0.197 | 0.191 | -0.027 |
| panel-logit-v3 | 1d | 7d | new 7-day high | 135 | 0.137 | 0.182 | +0.246 |
| panel-logit-v3 | 1d | 7d | new 7-day low | 135 | 0.163 | 0.258 | +0.369 |
| panel-logit-v3 | 1d | 7d | range widens | 135 | 0.231 | 0.256 | +0.097 |
| panel-logit-v3 | 1d | 7d | shape | 135 | 0.804 | 0.799 | -0.007 |
| panel-logit-v3 | 1d | 7d | volume rises | 135 | 0.193 | 0.256 | +0.248 |
| panel-logit-v3 | 4h | 24h | closes higher | 705 | 0.279 | 0.248 | -0.121 |
| panel-logit-v3 | 4h | 24h | beats BTC | 705 | 0.258 | 0.238 | -0.082 |
| panel-logit-v3 | 4h | 24h | new 7-day high | 705 | 0.027 | 0.045 | +0.392 |
| panel-logit-v3 | 4h | 24h | new 7-day low | 705 | 0.195 | 0.203 | +0.037 |
| panel-logit-v3 | 4h | 24h | range widens | 705 | 0.215 | 0.252 | +0.146 |
| panel-logit-v3 | 4h | 24h | shape | 705 | 0.676 | 0.706 | +0.043 |
| panel-logit-v3 | 4h | 24h | volume rises | 705 | 0.211 | 0.252 | +0.160 |
| panel-logit-v3 | 4h | 4h | closes higher | 735 | 0.256 | 0.250 | -0.021 |
| panel-logit-v3 | 4h | 4h | beats BTC | 735 | 0.256 | 0.249 | -0.029 |
| panel-logit-v3 | 4h | 4h | new 7-day high | 735 | 0.006 | 0.009 | +0.354 |
| panel-logit-v3 | 4h | 4h | new 7-day low | 735 | 0.090 | 0.096 | +0.062 |
| panel-logit-v3 | 4h | 4h | range widens | 735 | 0.227 | 0.252 | +0.099 |
| panel-logit-v3 | 4h | 4h | shape | 735 | 0.623 | 0.663 | +0.061 |
| panel-logit-v3 | 4h | 4h | volume rises | 735 | 0.222 | 0.251 | +0.114 |

## Latest 4h chart, 24h ahead

| Coin | Candle (UTC) | Close | New high | New low | Range widens | Volume rises | Up* | Beats BTC* | Likeliest shape* |
|---|---|---:|---:|---:|---:|---:|---:|---:|---|
| ADA | 11-09 00:00 | 0.176206 | 4% | 37% | 55% | 63% | 45% | 36% | range 38% |
| AVAX | 11-09 00:00 | 8.017 | 3% | 33% | 42% | 62% | 50% | 48% | range 43% |
| COMP | 11-09 00:00 | 19.77 | 7% | 20% | 65% | 61% | 33% | 31% | range 32% |
| DOGE | 11-09 00:00 | 0.0694919 | 4% | 30% | 33% | 32% | 61% | 52% | range 42% |
| DOT | 11-09 00:00 | 0.8707 | 2% | 46% | 42% | 41% | 41% | 30% | range 38% |
| ETH | 11-09 00:00 | 2137.94 | 1% | 22% | 51% | 55% | 56% | 56% | range 45% |
| HBAR | 11-09 00:00 | 0.06673 | 9% | 25% | 62% | 70% | 34% | 26% | range 36% |
| LINK | 11-09 00:00 | 10.5669 | 7% | 22% | 54% | 55% | 55% | 50% | range 30% |
| LTC | 11-09 00:00 | 50.93 | 2% | 38% | 48% | 58% | 40% | 23% | range 40% |
| NEAR | 11-09 00:00 | 3.6075 | 2% | 51% | 50% | 54% | 44% | 36% | range 33% |
| SOL | 11-09 00:00 | 87.37 | 3% | 49% | 40% | 37% | 49% | 32% | range 43% |
| SUI | 11-09 00:00 | 0.8326 | 4% | 29% | 41% | 45% | 57% | 46% | range 42% |
| TON | 11-09 00:00 | 0.999 | 0% | 69% | 60% | 61% | 62% | 61% | range 50% |
| XRP | 11-09 00:00 | 1.1098 | 2% | 74% | 54% | 48% | 72% | 67% | failed breakout 38% |
| ZEC | 11-09 00:00 | 1231.96 | 9% | 18% | 56% | 66% | 49% | 50% | trend up 30% |

## Latest 1d chart, 7d ahead

| Coin | Candle (UTC) | Close | New high | New low | Range widens | Volume rises | Up* | Beats BTC* | Likeliest shape* |
|---|---|---:|---:|---:|---:|---:|---:|---:|---|
| ADA | 11-08 00:00 | 0.174899 | 21% | 71% | 52% | 46% | 45% | 35% | breakdown 29% |
| AVAX | 11-08 00:00 | 7.929 | 23% | 76% | 67% | 53% | 51% | 54% | breakdown 26% |
| COMP | 11-08 00:00 | 19.52 | 32% | 56% | 47% | 44% | 36% | 32% | range 28% |
| DOGE | 11-08 00:00 | 0.0688901 | 10% | 67% | 38% | 42% | 43% | 28% | range 39% |
| DOT | 11-08 00:00 | 0.8607 | 19% | 83% | 66% | 53% | 42% | 27% | breakdown 38% |
| ETH | 11-08 00:00 | 2124.05 | 12% | 68% | 38% | 41% | 35% | 28% | range 33% |
| HBAR | 11-08 00:00 | 0.06546 | 19% | 69% | 42% | 30% | 53% | 40% | failed breakout 30% |
| LINK | 11-08 00:00 | 10.3927 | 18% | 71% | 45% | 28% | 40% | 36% | range 28% |
| LTC | 11-08 00:00 | 50.05 | 20% | 68% | 52% | 44% | 57% | 50% | range 39% |
| NEAR | 11-08 00:00 | 3.5803 | 14% | 75% | 45% | 24% | 38% | 29% | breakdown 26% |
| SOL | 11-08 00:00 | 86.44 | 23% | 70% | 49% | 55% | 49% | 45% | range 27% |
| SUI | 11-08 00:00 | 0.8198 | 22% | 66% | 56% | 42% | 53% | 44% | range 32% |
| TON | 11-08 00:00 | 1.018 | 8% | 76% | 45% | 54% | 46% | 43% | range 33% |
| XRP | 11-08 00:00 | 1.11176 | 22% | 70% | 54% | 50% | 58% | 55% | range 26% |
| ZEC | 11-08 00:00 | 1211.07 | 30% | 56% | 39% | 41% | 40% | 44% | range 22% |

\* No proven skill yet: logged so the scorecard can test it, not to act on.

Earlier study: up/down and beat-BTC did not beat the base rate; new highs and lows did (docs/research/MULTI_TARGET_PANEL_2026-10-24.md). This page checks that out of sample, live.
