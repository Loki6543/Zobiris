# Zobiris live prediction panel

Updated 2026-11-14 17:57 UTC. Current model `panel-logit-v3`, refit every run on each coin's own Kraken history. Research only: no trading authority.

1320 predictions logged; 2460 windows scored.

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
| panel-logit-v3 | 1d | 1d | closes higher | 300 | 0.245 | 0.243 | -0.007 |
| panel-logit-v3 | 1d | 1d | beats BTC | 300 | 0.246 | 0.246 | +0.002 |
| panel-logit-v3 | 1d | 1d | new 7-day high | 300 | 0.023 | 0.039 | +0.408 |
| panel-logit-v3 | 1d | 1d | new 7-day low | 300 | 0.218 | 0.267 | +0.184 |
| panel-logit-v3 | 1d | 1d | range widens | 300 | 0.217 | 0.250 | +0.130 |
| panel-logit-v3 | 1d | 1d | shape | 300 | 0.743 | 0.735 | -0.010 |
| panel-logit-v3 | 1d | 1d | volume rises | 300 | 0.205 | 0.251 | +0.183 |
| panel-logit-v3 | 1d | 7d | closes higher | 210 | 0.237 | 0.190 | -0.244 |
| panel-logit-v3 | 1d | 7d | beats BTC | 210 | 0.208 | 0.207 | -0.006 |
| panel-logit-v3 | 1d | 7d | new 7-day high | 210 | 0.143 | 0.183 | +0.219 |
| panel-logit-v3 | 1d | 7d | new 7-day low | 210 | 0.172 | 0.258 | +0.333 |
| panel-logit-v3 | 1d | 7d | range widens | 210 | 0.227 | 0.257 | +0.115 |
| panel-logit-v3 | 1d | 7d | shape | 210 | 0.797 | 0.793 | -0.005 |
| panel-logit-v3 | 1d | 7d | volume rises | 210 | 0.206 | 0.249 | +0.171 |
| panel-logit-v3 | 4h | 24h | closes higher | 930 | 0.276 | 0.247 | -0.118 |
| panel-logit-v3 | 4h | 24h | beats BTC | 930 | 0.264 | 0.242 | -0.090 |
| panel-logit-v3 | 4h | 24h | new 7-day high | 930 | 0.025 | 0.047 | +0.473 |
| panel-logit-v3 | 4h | 24h | new 7-day low | 930 | 0.225 | 0.260 | +0.136 |
| panel-logit-v3 | 4h | 24h | range widens | 930 | 0.228 | 0.252 | +0.095 |
| panel-logit-v3 | 4h | 24h | shape | 930 | 0.731 | 0.742 | +0.016 |
| panel-logit-v3 | 4h | 24h | volume rises | 930 | 0.214 | 0.251 | +0.149 |
| panel-logit-v3 | 4h | 4h | closes higher | 960 | 0.258 | 0.250 | -0.030 |
| panel-logit-v3 | 4h | 4h | beats BTC | 960 | 0.254 | 0.249 | -0.022 |
| panel-logit-v3 | 4h | 4h | new 7-day high | 960 | 0.005 | 0.009 | +0.400 |
| panel-logit-v3 | 4h | 4h | new 7-day low | 960 | 0.102 | 0.111 | +0.078 |
| panel-logit-v3 | 4h | 4h | range widens | 960 | 0.230 | 0.251 | +0.085 |
| panel-logit-v3 | 4h | 4h | shape | 960 | 0.646 | 0.679 | +0.049 |
| panel-logit-v3 | 4h | 4h | volume rises | 960 | 0.223 | 0.251 | +0.110 |

## Latest 4h chart, 24h ahead

| Coin | Candle (UTC) | Close | New high | New low | Range widens | Volume rises | Up* | Beats BTC* | Likeliest shape* |
|---|---|---:|---:|---:|---:|---:|---:|---:|---|
| ADA | 11-14 12:00 | 0.15711 | 1% | 79% | 16% | 26% | 71% | 74% | failed breakout 42% |
| AVAX | 11-14 12:00 | 7.673 | 2% | 51% | 37% | 34% | 79% | 79% | range 45% |
| COMP | 11-14 12:00 | 18.74 | 1% | 40% | 36% | 23% | 52% | 66% | range 48% |
| DOGE | 11-14 12:00 | 0.0610804 | 1% | 77% | 16% | 14% | 70% | 75% | range 38% |
| DOT | 11-14 12:00 | 0.7637 | 1% | 74% | 40% | 20% | 52% | 62% | range 34% |
| ETH | 11-14 12:00 | 1839.76 | 1% | 68% | 25% | 32% | 66% | 66% | range 38% |
| HBAR | 11-14 12:00 | 0.05874 | 2% | 53% | 12% | 18% | 57% | 64% | range 60% |
| LINK | 11-14 12:00 | 9.26871 | 2% | 80% | 20% | 24% | 73% | 72% | range 38% |
| LTC | 11-14 12:00 | 46.09 | 1% | 66% | 12% | 15% | 74% | 78% | range 45% |
| NEAR | 11-14 12:00 | 3.2154 | 2% | 76% | 48% | 40% | 81% | 82% | range 34% |
| SOL | 11-14 12:00 | 73.84 | 0% | 74% | 16% | 14% | 49% | 46% | range 58% |
| SUI | 11-14 12:00 | 0.7405 | 1% | 74% | 21% | 25% | 81% | 85% | range 35% |
| TON | 11-14 12:00 | 1.062 | 1% | 24% | 19% | 17% | 56% | 63% | range 50% |
| XRP | 11-14 12:00 | 0.97106 | 0% | 83% | 19% | 33% | 56% | 54% | range 41% |
| ZEC | 11-14 12:00 | 882.54 | 2% | 76% | 38% | 32% | 48% | 67% | trend up 38% |

## Latest 1d chart, 7d ahead

| Coin | Candle (UTC) | Close | New high | New low | Range widens | Volume rises | Up* | Beats BTC* | Likeliest shape* |
|---|---|---:|---:|---:|---:|---:|---:|---:|---|
| ADA | 11-13 00:00 | 0.168325 | 16% | 72% | 41% | 59% | 43% | 40% | failed breakout 31% |
| AVAX | 11-13 00:00 | 8.228 | 27% | 67% | 57% | 47% | 50% | 56% | breakdown 28% |
| COMP | 11-13 00:00 | 19.18 | 25% | 80% | 58% | 46% | 39% | 33% | failed breakout 32% |
| DOGE | 11-13 00:00 | 0.0644614 | 7% | 75% | 36% | 49% | 48% | 36% | range 34% |
| DOT | 11-13 00:00 | 0.8178 | 13% | 77% | 40% | 31% | 36% | 18% | failed breakout 27% |
| ETH | 11-13 00:00 | 1927.29 | 8% | 78% | 42% | 43% | 38% | 41% | trend down 24% |
| HBAR | 11-13 00:00 | 0.06149 | 29% | 76% | 56% | 54% | 57% | 58% | failed breakout 40% |
| LINK | 11-13 00:00 | 9.84733 | 14% | 79% | 47% | 48% | 47% | 54% | breakdown 25% |
| LTC | 11-13 00:00 | 49.34 | 19% | 68% | 48% | 50% | 43% | 38% | breakdown 22% |
| NEAR | 11-13 00:00 | 3.4379 | 15% | 68% | 41% | 35% | 40% | 33% | range 27% |
| SOL | 11-13 00:00 | 78.09 | 10% | 81% | 54% | 55% | 49% | 39% | failed breakout 29% |
| SUI | 11-13 00:00 | 0.7953 | 11% | 66% | 50% | 25% | 42% | 29% | range 27% |
| TON | 11-13 00:00 | 1.092 | 11% | 68% | 36% | 26% | 45% | 43% | range 31% |
| XRP | 11-13 00:00 | 1.00975 | 24% | 76% | 62% | 69% | 63% | 52% | failed breakout 31% |
| ZEC | 11-13 00:00 | 933.6 | 16% | 78% | 49% | 33% | 59% | 57% | failed breakout 33% |

\* No proven skill yet: logged so the scorecard can test it, not to act on.

Earlier study: up/down and beat-BTC did not beat the base rate; new highs and lows did (docs/research/MULTI_TARGET_PANEL_2026-10-24.md). This page checks that out of sample, live.
