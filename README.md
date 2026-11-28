# Zobiris live prediction panel

Updated 2026-11-28 07:37 UTC. Current model `panel-logit-v3`, refit every run on each coin's own Kraken history. Research only: no trading authority.

2025 predictions logged; 3870 windows scored.

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
| panel-logit-v3 | 1d | 1d | closes higher | 510 | 0.252 | 0.247 | -0.021 |
| panel-logit-v3 | 1d | 1d | beats BTC | 510 | 0.251 | 0.251 | +0.001 |
| panel-logit-v3 | 1d | 1d | new 7-day high | 510 | 0.025 | 0.044 | +0.422 |
| panel-logit-v3 | 1d | 1d | new 7-day low | 510 | 0.181 | 0.245 | +0.261 |
| panel-logit-v3 | 1d | 1d | range widens | 510 | 0.207 | 0.250 | +0.173 |
| panel-logit-v3 | 1d | 1d | shape | 510 | 0.738 | 0.744 | +0.009 |
| panel-logit-v3 | 1d | 1d | volume rises | 510 | 0.208 | 0.251 | +0.170 |
| panel-logit-v3 | 1d | 7d | closes higher | 420 | 0.240 | 0.194 | -0.238 |
| panel-logit-v3 | 1d | 7d | beats BTC | 420 | 0.229 | 0.240 | +0.046 |
| panel-logit-v3 | 1d | 7d | new 7-day high | 420 | 0.110 | 0.176 | +0.376 |
| panel-logit-v3 | 1d | 7d | new 7-day low | 420 | 0.157 | 0.254 | +0.382 |
| panel-logit-v3 | 1d | 7d | range widens | 420 | 0.236 | 0.254 | +0.070 |
| panel-logit-v3 | 1d | 7d | shape | 420 | 0.805 | 0.804 | -0.002 |
| panel-logit-v3 | 1d | 7d | volume rises | 420 | 0.220 | 0.247 | +0.110 |
| panel-logit-v3 | 4h | 24h | closes higher | 1425 | 0.278 | 0.248 | -0.120 |
| panel-logit-v3 | 4h | 24h | beats BTC | 1425 | 0.270 | 0.248 | -0.091 |
| panel-logit-v3 | 4h | 24h | new 7-day high | 1425 | 0.026 | 0.047 | +0.455 |
| panel-logit-v3 | 4h | 24h | new 7-day low | 1425 | 0.198 | 0.242 | +0.181 |
| panel-logit-v3 | 4h | 24h | range widens | 1425 | 0.233 | 0.252 | +0.074 |
| panel-logit-v3 | 4h | 24h | shape | 1425 | 0.729 | 0.735 | +0.008 |
| panel-logit-v3 | 4h | 24h | volume rises | 1425 | 0.234 | 0.251 | +0.070 |
| panel-logit-v3 | 4h | 4h | closes higher | 1455 | 0.261 | 0.250 | -0.044 |
| panel-logit-v3 | 4h | 4h | beats BTC | 1455 | 0.257 | 0.250 | -0.029 |
| panel-logit-v3 | 4h | 4h | new 7-day high | 1455 | 0.009 | 0.012 | +0.287 |
| panel-logit-v3 | 4h | 4h | new 7-day low | 1455 | 0.088 | 0.115 | +0.235 |
| panel-logit-v3 | 4h | 4h | range widens | 1455 | 0.228 | 0.252 | +0.093 |
| panel-logit-v3 | 4h | 4h | shape | 1455 | 0.658 | 0.683 | +0.036 |
| panel-logit-v3 | 4h | 4h | volume rises | 1455 | 0.230 | 0.252 | +0.084 |

## Latest 4h chart, 24h ahead

| Coin | Candle (UTC) | Close | New high | New low | Range widens | Volume rises | Up* | Beats BTC* | Likeliest shape* |
|---|---|---:|---:|---:|---:|---:|---:|---:|---|
| ADA | 11-28 00:00 | 0.147776 | 2% | 16% | 47% | 33% | 31% | 26% | range 54% |
| AVAX | 11-28 00:00 | 6.602 | 4% | 14% | 51% | 33% | 38% | 41% | range 55% |
| COMP | 11-28 00:00 | 18.09 | 24% | 6% | 50% | 47% | 48% | 46% | range 41% |
| DOGE | 11-28 00:00 | 0.0576558 | 8% | 6% | 38% | 25% | 38% | 28% | range 52% |
| DOT | 11-28 00:00 | 0.6611 | 2% | 24% | 40% | 38% | 31% | 30% | range 53% |
| ETH | 11-28 00:00 | 1664.15 | 2% | 11% | 39% | 33% | 60% | 65% | range 61% |
| HBAR | 11-28 00:00 | 0.05352 | 3% | 15% | 39% | 33% | 39% | 44% | range 54% |
| LINK | 11-28 00:00 | 9.22643 | 12% | 9% | 38% | 29% | 56% | 54% | range 49% |
| LTC | 11-28 00:00 | 44.64 | 23% | 6% | 43% | 42% | 38% | 47% | range 38% |
| NEAR | 11-28 00:00 | 3.0554 | 5% | 9% | 43% | 35% | 34% | 36% | range 51% |
| SOL | 11-28 00:00 | 71.66 | 9% | 15% | 48% | 39% | 45% | 51% | range 50% |
| SUI | 11-28 00:00 | 0.6716 | 3% | 12% | 55% | 44% | 34% | 31% | range 49% |
| TON | 11-28 00:00 | 0.976 | 8% | 11% | 60% | 45% | 28% | 18% | trend down 45% |
| XRP | 11-28 00:00 | 0.94981 | 2% | 9% | 29% | 17% | 43% | 41% | range 64% |
| ZEC | 11-28 00:00 | 750.48 | 5% | 7% | 34% | 31% | 47% | 46% | range 59% |

## Latest 1d chart, 7d ahead

| Coin | Candle (UTC) | Close | New high | New low | Range widens | Volume rises | Up* | Beats BTC* | Likeliest shape* |
|---|---|---:|---:|---:|---:|---:|---:|---:|---|
| ADA | 11-27 00:00 | 0.14825 | 49% | 46% | 51% | 59% | 37% | 42% | failed breakout 24% |
| AVAX | 11-27 00:00 | 6.607 | 35% | 43% | 59% | 64% | 43% | 46% | range 32% |
| COMP | 11-27 00:00 | 18.17 | 81% | 24% | 71% | 66% | 40% | 41% | failed breakout 30% |
| DOGE | 11-27 00:00 | 0.0576808 | 25% | 50% | 36% | 44% | 27% | 28% | breakdown 26% |
| DOT | 11-27 00:00 | 0.6685 | 37% | 46% | 45% | 50% | 37% | 30% | failed breakout 22% |
| ETH | 11-27 00:00 | 1661.03 | 40% | 49% | 43% | 53% | 48% | 46% | range 27% |
| HBAR | 11-27 00:00 | 0.05397 | 46% | 43% | 52% | 41% | 37% | 33% | breakdown 29% |
| LINK | 11-27 00:00 | 9.36803 | 68% | 32% | 47% | 53% | 43% | 45% | breakdown 29% |
| LTC | 11-27 00:00 | 45.16 | 68% | 22% | 46% | 61% | 25% | 37% | range 30% |
| NEAR | 11-27 00:00 | 3.0175 | 47% | 45% | 54% | 36% | 44% | 48% | range 26% |
| SOL | 11-27 00:00 | 71.61 | 57% | 46% | 56% | 66% | 40% | 52% | failed breakout 26% |
| SUI | 11-27 00:00 | 0.6728 | 39% | 39% | 49% | 52% | 44% | 37% | range 32% |
| TON | 11-27 00:00 | 0.977 | 46% | 55% | 61% | 57% | 34% | 37% | range 31% |
| XRP | 11-27 00:00 | 0.94804 | 38% | 38% | 49% | 59% | 33% | 47% | range 30% |
| ZEC | 11-27 00:00 | 734.33 | 42% | 41% | 41% | 33% | 55% | 56% | failed breakout 33% |

\* No proven skill yet: logged so the scorecard can test it, not to act on.

Earlier study: up/down and beat-BTC did not beat the base rate; new highs and lows did (docs/research/MULTI_TARGET_PANEL_2026-10-24.md). This page checks that out of sample, live.
