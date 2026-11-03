# Zobiris live prediction panel

Updated 2026-11-03 19:28 UTC. Current model `panel-logit-v3`, refit every run on each coin's own Kraken history. Research only: no trading authority.

690 predictions logged; 1200 windows scored.

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
| panel-logit-v3 | 1d | 1d | closes higher | 135 | 0.242 | 0.244 | +0.008 |
| panel-logit-v3 | 1d | 1d | beats BTC | 135 | 0.237 | 0.242 | +0.017 |
| panel-logit-v3 | 1d | 1d | new 7-day high | 135 | 0.014 | 0.031 | +0.534 |
| panel-logit-v3 | 1d | 1d | new 7-day low | 135 | 0.163 | 0.210 | +0.223 |
| panel-logit-v3 | 1d | 1d | range widens | 135 | 0.209 | 0.249 | +0.161 |
| panel-logit-v3 | 1d | 1d | shape | 135 | 0.714 | 0.709 | -0.007 |
| panel-logit-v3 | 1d | 1d | volume rises | 135 | 0.195 | 0.251 | +0.222 |
| panel-logit-v3 | 1d | 7d | closes higher | 45 | 0.206 | 0.191 | -0.083 |
| panel-logit-v3 | 1d | 7d | beats BTC | 45 | 0.203 | 0.217 | +0.068 |
| panel-logit-v3 | 1d | 7d | new 7-day high | 45 | 0.093 | 0.169 | +0.449 |
| panel-logit-v3 | 1d | 7d | new 7-day low | 45 | 0.120 | 0.252 | +0.524 |
| panel-logit-v3 | 1d | 7d | range widens | 45 | 0.267 | 0.251 | -0.063 |
| panel-logit-v3 | 1d | 7d | shape | 45 | 0.795 | 0.784 | -0.014 |
| panel-logit-v3 | 1d | 7d | volume rises | 45 | 0.200 | 0.242 | +0.172 |
| panel-logit-v3 | 4h | 24h | closes higher | 465 | 0.259 | 0.249 | -0.041 |
| panel-logit-v3 | 4h | 24h | beats BTC | 465 | 0.259 | 0.244 | -0.061 |
| panel-logit-v3 | 4h | 24h | new 7-day high | 465 | 0.017 | 0.040 | +0.575 |
| panel-logit-v3 | 4h | 24h | new 7-day low | 465 | 0.176 | 0.184 | +0.042 |
| panel-logit-v3 | 4h | 24h | range widens | 465 | 0.229 | 0.252 | +0.090 |
| panel-logit-v3 | 4h | 24h | shape | 465 | 0.670 | 0.685 | +0.023 |
| panel-logit-v3 | 4h | 24h | volume rises | 465 | 0.222 | 0.251 | +0.115 |
| panel-logit-v3 | 4h | 4h | closes higher | 495 | 0.250 | 0.250 | -0.000 |
| panel-logit-v3 | 4h | 4h | beats BTC | 495 | 0.259 | 0.251 | -0.031 |
| panel-logit-v3 | 4h | 4h | new 7-day high | 495 | 0.003 | 0.006 | +0.589 |
| panel-logit-v3 | 4h | 4h | new 7-day low | 495 | 0.065 | 0.070 | +0.081 |
| panel-logit-v3 | 4h | 4h | range widens | 495 | 0.225 | 0.251 | +0.104 |
| panel-logit-v3 | 4h | 4h | shape | 495 | 0.630 | 0.668 | +0.056 |
| panel-logit-v3 | 4h | 4h | volume rises | 495 | 0.219 | 0.250 | +0.125 |

## Latest 4h chart, 24h ahead

| Coin | Candle (UTC) | Close | New high | New low | Range widens | Volume rises | Up* | Beats BTC* | Likeliest shape* |
|---|---|---:|---:|---:|---:|---:|---:|---:|---|
| ADA | 11-03 12:00 | 0.190734 | 18% | 38% | 66% | 76% | 33% | 30% | trend down 30% |
| AVAX | 11-03 12:00 | 8.572 | 5% | 34% | 61% | 69% | 26% | 35% | range 40% |
| COMP | 11-03 12:00 | 19.79 | 6% | 31% | 43% | 36% | 37% | 63% | range 35% |
| DOGE | 11-03 12:00 | 0.0754338 | 9% | 18% | 64% | 71% | 44% | 49% | range 32% |
| DOT | 11-03 12:00 | 0.9413 | 2% | 45% | 70% | 58% | 29% | 21% | trend down 31% |
| ETH | 11-03 12:00 | 2296.13 | 21% | 7% | 65% | 78% | 42% | 42% | trend down 35% |
| HBAR | 11-03 12:00 | 0.06996 | 8% | 52% | 68% | 72% | 28% | 26% | trend down 35% |
| LINK | 11-03 12:00 | 11.1439 | 7% | 17% | 53% | 57% | 45% | 38% | range 34% |
| LTC | 11-03 12:00 | 54.28 | 3% | 30% | 51% | 53% | 40% | 36% | range 29% |
| NEAR | 11-03 12:00 | 3.8532 | 3% | 50% | 55% | 49% | 49% | 46% | range 27% |
| SOL | 11-03 12:00 | 93.61 | 9% | 23% | 65% | 65% | 49% | 30% | range 46% |
| SUI | 11-03 12:00 | 0.8977 | 12% | 16% | 66% | 65% | 41% | 35% | trend down 34% |
| TON | 11-03 12:00 | 1.176 | 2% | 12% | 47% | 55% | 30% | 30% | trend down 49% |
| XRP | 11-03 12:00 | 1.27871 | 37% | 21% | 60% | 68% | 48% | 59% | trend up 24% |
| ZEC | 11-03 12:00 | 1202.45 | 16% | 17% | 40% | 70% | 50% | 48% | range 36% |

## Latest 1d chart, 7d ahead

| Coin | Candle (UTC) | Close | New high | New low | Range widens | Volume rises | Up* | Beats BTC* | Likeliest shape* |
|---|---|---:|---:|---:|---:|---:|---:|---:|---|
| ADA | 11-02 00:00 | 0.188354 | 27% | 69% | 60% | 59% | 52% | 40% | breakdown 28% |
| AVAX | 11-02 00:00 | 8.379 | 32% | 68% | 63% | 57% | 49% | 46% | breakdown 21% |
| COMP | 11-02 00:00 | 19.96 | 24% | 66% | 50% | 42% | 44% | 43% | breakdown 28% |
| DOGE | 11-02 00:00 | 0.0741056 | 17% | 70% | 49% | 58% | 49% | 33% | range 30% |
| DOT | 11-02 00:00 | 0.9361 | 20% | 75% | 60% | 53% | 34% | 26% | breakdown 32% |
| ETH | 11-02 00:00 | 2249.46 | 26% | 59% | 61% | 51% | 46% | 42% | trend down 27% |
| HBAR | 11-02 00:00 | 0.06961 | 35% | 62% | 57% | 55% | 70% | 52% | failed breakout 51% |
| LINK | 11-02 00:00 | 11.1022 | 28% | 50% | 43% | 32% | 46% | 34% | range 26% |
| LTC | 11-02 00:00 | 53.65 | 25% | 66% | 58% | 55% | 61% | 50% | range 35% |
| NEAR | 11-02 00:00 | 3.86 | 11% | 79% | 32% | 20% | 41% | 30% | range 28% |
| SOL | 11-02 00:00 | 91.83 | 22% | 72% | 48% | 58% | 57% | 50% | failed breakout 30% |
| SUI | 11-02 00:00 | 0.8715 | 33% | 55% | 63% | 49% | 63% | 53% | range 30% |
| TON | 11-02 00:00 | 1.188 | 29% | 65% | 62% | 60% | 34% | 28% | breakdown 24% |
| XRP | 11-02 00:00 | 1.24803 | 35% | 60% | 64% | 64% | 52% | 44% | trend down 22% |
| ZEC | 11-02 00:00 | 1133.23 | 19% | 74% | 42% | 48% | 44% | 47% | breakdown 24% |

\* No proven skill yet: logged so the scorecard can test it, not to act on.

Earlier study: up/down and beat-BTC did not beat the base rate; new highs and lows did (docs/research/MULTI_TARGET_PANEL_2026-10-24.md). This page checks that out of sample, live.
