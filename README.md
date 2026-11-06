# Zobiris live prediction panel

Updated 2026-11-06 15:53 UTC. Current model `panel-logit-v3`, refit every run on each coin's own Kraken history. Research only: no trading authority.

855 predictions logged; 1530 windows scored.

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
| panel-logit-v3 | 4h | 24h | closes higher | 585 | 0.262 | 0.249 | -0.049 |
| panel-logit-v3 | 4h | 24h | beats BTC | 585 | 0.253 | 0.241 | -0.049 |
| panel-logit-v3 | 4h | 24h | new 7-day high | 585 | 0.028 | 0.045 | +0.376 |
| panel-logit-v3 | 4h | 24h | new 7-day low | 585 | 0.189 | 0.192 | +0.019 |
| panel-logit-v3 | 4h | 24h | range widens | 585 | 0.226 | 0.252 | +0.103 |
| panel-logit-v3 | 4h | 24h | shape | 585 | 0.709 | 0.726 | +0.024 |
| panel-logit-v3 | 4h | 24h | volume rises | 585 | 0.222 | 0.251 | +0.116 |
| panel-logit-v3 | 4h | 4h | closes higher | 615 | 0.256 | 0.250 | -0.022 |
| panel-logit-v3 | 4h | 4h | beats BTC | 615 | 0.259 | 0.249 | -0.037 |
| panel-logit-v3 | 4h | 4h | new 7-day high | 615 | 0.005 | 0.009 | +0.368 |
| panel-logit-v3 | 4h | 4h | new 7-day low | 615 | 0.077 | 0.083 | +0.074 |
| panel-logit-v3 | 4h | 4h | range widens | 615 | 0.221 | 0.251 | +0.118 |
| panel-logit-v3 | 4h | 4h | shape | 615 | 0.651 | 0.685 | +0.050 |
| panel-logit-v3 | 4h | 4h | volume rises | 615 | 0.216 | 0.250 | +0.135 |

## Latest 4h chart, 24h ahead

| Coin | Candle (UTC) | Close | New high | New low | Range widens | Volume rises | Up* | Beats BTC* | Likeliest shape* |
|---|---|---:|---:|---:|---:|---:|---:|---:|---|
| ADA | 11-06 08:00 | 0.186401 | 4% | 11% | 30% | 43% | 71% | 64% | range 63% |
| AVAX | 11-06 08:00 | 8.38 | 8% | 30% | 36% | 50% | 72% | 55% | range 60% |
| COMP | 11-06 08:00 | 20.01 | 8% | 7% | 32% | 25% | 78% | 54% | range 48% |
| DOGE | 11-06 08:00 | 0.0725511 | 8% | 15% | 18% | 12% | 71% | 72% | range 74% |
| DOT | 11-06 08:00 | 0.9295 | 4% | 6% | 31% | 26% | 57% | 48% | range 60% |
| ETH | 11-06 08:00 | 2240.35 | 1% | 13% | 10% | 9% | 85% | 75% | range 87% |
| HBAR | 11-06 08:00 | 0.06862 | 0% | 16% | 1% | 2% | 80% | 76% | range 91% |
| LINK | 11-06 08:00 | 10.8609 | 5% | 23% | 29% | 36% | 86% | 71% | range 55% |
| LTC | 11-06 08:00 | 53 | 5% | 28% | 34% | 22% | 62% | 40% | range 56% |
| NEAR | 11-06 08:00 | 3.7322 | 4% | 45% | 36% | 24% | 82% | 82% | range 54% |
| SOL | 11-06 08:00 | 90.3 | 2% | 27% | 15% | 14% | 63% | 46% | range 72% |
| SUI | 11-06 08:00 | 0.8665 | 6% | 13% | 27% | 17% | 80% | 65% | range 70% |
| TON | 11-06 08:00 | 1.096 | 0% | 41% | 24% | 29% | 85% | 71% | range 39% |
| XRP | 11-06 08:00 | 1.19628 | 1% | 30% | 9% | 13% | 81% | 67% | range 75% |
| ZEC | 11-06 08:00 | 1289.38 | 18% | 3% | 27% | 24% | 71% | 69% | range 67% |

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
