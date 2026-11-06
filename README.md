# Zobiris live prediction panel

Updated 2026-11-06 21:28 UTC. Current model `panel-logit-v3`, refit every run on each coin's own Kraken history. Research only: no trading authority.

870 predictions logged; 1560 windows scored.

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
| panel-logit-v3 | 1d | 1d | closes higher | 180 | 0.245 | 0.247 | +0.006 |
| panel-logit-v3 | 1d | 1d | beats BTC | 180 | 0.238 | 0.238 | -0.002 |
| panel-logit-v3 | 1d | 1d | new 7-day high | 180 | 0.025 | 0.037 | +0.331 |
| panel-logit-v3 | 1d | 1d | new 7-day low | 180 | 0.180 | 0.212 | +0.154 |
| panel-logit-v3 | 1d | 1d | range widens | 180 | 0.220 | 0.250 | +0.122 |
| panel-logit-v3 | 1d | 1d | shape | 180 | 0.740 | 0.740 | -0.000 |
| panel-logit-v3 | 1d | 1d | volume rises | 180 | 0.200 | 0.251 | +0.203 |
| panel-logit-v3 | 1d | 7d | closes higher | 90 | 0.232 | 0.190 | -0.218 |
| panel-logit-v3 | 1d | 7d | beats BTC | 90 | 0.196 | 0.208 | +0.054 |
| panel-logit-v3 | 1d | 7d | new 7-day high | 90 | 0.124 | 0.176 | +0.295 |
| panel-logit-v3 | 1d | 7d | new 7-day low | 90 | 0.131 | 0.257 | +0.491 |
| panel-logit-v3 | 1d | 7d | range widens | 90 | 0.229 | 0.258 | +0.110 |
| panel-logit-v3 | 1d | 7d | shape | 90 | 0.784 | 0.796 | +0.015 |
| panel-logit-v3 | 1d | 7d | volume rises | 90 | 0.187 | 0.258 | +0.275 |
| panel-logit-v3 | 4h | 24h | closes higher | 600 | 0.261 | 0.249 | -0.047 |
| panel-logit-v3 | 4h | 24h | beats BTC | 600 | 0.253 | 0.242 | -0.045 |
| panel-logit-v3 | 4h | 24h | new 7-day high | 600 | 0.029 | 0.045 | +0.367 |
| panel-logit-v3 | 4h | 24h | new 7-day low | 600 | 0.191 | 0.196 | +0.027 |
| panel-logit-v3 | 4h | 24h | range widens | 600 | 0.223 | 0.252 | +0.116 |
| panel-logit-v3 | 4h | 24h | shape | 600 | 0.712 | 0.727 | +0.020 |
| panel-logit-v3 | 4h | 24h | volume rises | 600 | 0.221 | 0.251 | +0.121 |
| panel-logit-v3 | 4h | 4h | closes higher | 630 | 0.255 | 0.251 | -0.017 |
| panel-logit-v3 | 4h | 4h | beats BTC | 630 | 0.257 | 0.250 | -0.028 |
| panel-logit-v3 | 4h | 4h | new 7-day high | 630 | 0.007 | 0.010 | +0.314 |
| panel-logit-v3 | 4h | 4h | new 7-day low | 630 | 0.078 | 0.084 | +0.075 |
| panel-logit-v3 | 4h | 4h | range widens | 630 | 0.223 | 0.252 | +0.112 |
| panel-logit-v3 | 4h | 4h | shape | 630 | 0.643 | 0.680 | +0.055 |
| panel-logit-v3 | 4h | 4h | volume rises | 630 | 0.217 | 0.251 | +0.134 |

## Latest 4h chart, 24h ahead

| Coin | Candle (UTC) | Close | New high | New low | Range widens | Volume rises | Up* | Beats BTC* | Likeliest shape* |
|---|---|---:|---:|---:|---:|---:|---:|---:|---|
| ADA | 11-06 16:00 | 0.186481 | 4% | 16% | 42% | 48% | 72% | 55% | range 59% |
| AVAX | 11-06 16:00 | 8.389 | 7% | 20% | 50% | 51% | 61% | 47% | range 65% |
| COMP | 11-06 16:00 | 20.13 | 10% | 4% | 33% | 40% | 74% | 59% | range 61% |
| DOGE | 11-06 16:00 | 0.0727992 | 8% | 15% | 28% | 32% | 70% | 67% | range 61% |
| DOT | 11-06 16:00 | 0.9183 | 4% | 12% | 39% | 35% | 60% | 61% | range 49% |
| ETH | 11-06 16:00 | 2232.5 | 3% | 9% | 15% | 19% | 80% | 62% | range 83% |
| HBAR | 11-06 16:00 | 0.06846 | 3% | 16% | 15% | 31% | 68% | 44% | range 75% |
| LINK | 11-06 16:00 | 10.8514 | 5% | 24% | 32% | 49% | 81% | 65% | range 53% |
| LTC | 11-06 16:00 | 52.7 | 4% | 38% | 42% | 26% | 62% | 49% | range 44% |
| NEAR | 11-06 16:00 | 3.7302 | 5% | 45% | 41% | 33% | 82% | 78% | range 43% |
| SOL | 11-06 16:00 | 90.05 | 3% | 31% | 28% | 34% | 59% | 40% | range 45% |
| SUI | 11-06 16:00 | 0.8739 | 8% | 7% | 35% | 27% | 73% | 57% | range 64% |
| TON | 11-06 16:00 | 1.096 | 1% | 41% | 37% | 33% | 79% | 72% | range 37% |
| XRP | 11-06 16:00 | 1.1842 | 1% | 36% | 19% | 26% | 77% | 60% | range 66% |
| ZEC | 11-06 16:00 | 1345.53 | 27% | 2% | 36% | 38% | 64% | 64% | range 49% |

## Latest 1d chart, 7d ahead

| Coin | Candle (UTC) | Close | New high | New low | Range widens | Volume rises | Up* | Beats BTC* | Likeliest shape* |
|---|---|---:|---:|---:|---:|---:|---:|---:|---|
| ADA | 11-05 00:00 | 0.180497 | 16% | 67% | 40% | 48% | 47% | 40% | failed breakout 26% |
| AVAX | 11-05 00:00 | 8.166 | 25% | 75% | 63% | 61% | 46% | 52% | breakdown 28% |
| COMP | 11-05 00:00 | 19.36 | 19% | 68% | 41% | 39% | 40% | 36% | failed breakout 31% |
| DOGE | 11-05 00:00 | 0.0710252 | 10% | 78% | 44% | 55% | 52% | 41% | range 27% |
| DOT | 11-05 00:00 | 0.9073 | 23% | 70% | 51% | 46% | 36% | 25% | breakdown 30% |
| ETH | 11-05 00:00 | 2235.01 | 20% | 69% | 45% | 58% | 44% | 29% | range 24% |
| HBAR | 11-05 00:00 | 0.06744 | 34% | 68% | 53% | 62% | 59% | 59% | failed breakout 43% |
| LINK | 11-05 00:00 | 10.6603 | 26% | 68% | 48% | 42% | 49% | 46% | range 25% |
| LTC | 11-05 00:00 | 51.56 | 20% | 72% | 58% | 51% | 62% | 50% | range 35% |
| NEAR | 11-05 00:00 | 3.6547 | 14% | 80% | 38% | 25% | 42% | 32% | range 31% |
| SOL | 11-05 00:00 | 89.22 | 20% | 74% | 50% | 59% | 54% | 46% | failed breakout 31% |
| SUI | 11-05 00:00 | 0.8407 | 20% | 70% | 59% | 46% | 60% | 42% | failed breakout 26% |
| TON | 11-05 00:00 | 1.099 | 12% | 80% | 58% | 66% | 49% | 38% | failed breakout 33% |
| XRP | 11-05 00:00 | 1.2056 | 22% | 74% | 52% | 58% | 56% | 48% | range 28% |
| ZEC | 11-05 00:00 | 1278.96 | 59% | 32% | 40% | 53% | 43% | 44% | failed breakout 33% |

\* No proven skill yet: logged so the scorecard can test it, not to act on.

Earlier study: up/down and beat-BTC did not beat the base rate; new highs and lows did (docs/research/MULTI_TARGET_PANEL_2026-10-24.md). This page checks that out of sample, live.
