# Zobiris live prediction panel

Updated 2026-11-03 11:51 UTC. Current model `panel-logit-v3`, refit every run on each coin's own Kraken history. Research only: no trading authority.

675 predictions logged; 1170 windows scored.

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
| panel-logit-v3 | 4h | 24h | closes higher | 450 | 0.260 | 0.249 | -0.044 |
| panel-logit-v3 | 4h | 24h | beats BTC | 450 | 0.259 | 0.243 | -0.063 |
| panel-logit-v3 | 4h | 24h | new 7-day high | 450 | 0.017 | 0.040 | +0.566 |
| panel-logit-v3 | 4h | 24h | new 7-day low | 450 | 0.174 | 0.182 | +0.048 |
| panel-logit-v3 | 4h | 24h | range widens | 450 | 0.230 | 0.252 | +0.087 |
| panel-logit-v3 | 4h | 24h | shape | 450 | 0.669 | 0.686 | +0.024 |
| panel-logit-v3 | 4h | 24h | volume rises | 450 | 0.223 | 0.251 | +0.112 |
| panel-logit-v3 | 4h | 4h | closes higher | 480 | 0.250 | 0.250 | -0.001 |
| panel-logit-v3 | 4h | 4h | beats BTC | 480 | 0.259 | 0.251 | -0.032 |
| panel-logit-v3 | 4h | 4h | new 7-day high | 480 | 0.003 | 0.006 | +0.580 |
| panel-logit-v3 | 4h | 4h | new 7-day low | 480 | 0.065 | 0.071 | +0.075 |
| panel-logit-v3 | 4h | 4h | range widens | 480 | 0.225 | 0.251 | +0.105 |
| panel-logit-v3 | 4h | 4h | shape | 480 | 0.627 | 0.663 | +0.054 |
| panel-logit-v3 | 4h | 4h | volume rises | 480 | 0.219 | 0.250 | +0.125 |

## Latest 4h chart, 24h ahead

| Coin | Candle (UTC) | Close | New high | New low | Range widens | Volume rises | Up* | Beats BTC* | Likeliest shape* |
|---|---|---:|---:|---:|---:|---:|---:|---:|---|
| ADA | 11-03 04:00 | 0.187264 | 5% | 65% | 49% | 59% | 44% | 33% | trend down 26% |
| AVAX | 11-03 04:00 | 8.334 | 2% | 48% | 56% | 62% | 36% | 30% | range 40% |
| COMP | 11-03 04:00 | 19.76 | 4% | 45% | 45% | 33% | 46% | 48% | range 35% |
| DOGE | 11-03 04:00 | 0.0739248 | 3% | 31% | 44% | 40% | 56% | 50% | range 37% |
| DOT | 11-03 04:00 | 0.9317 | 1% | 43% | 55% | 16% | 39% | 25% | trend up 28% |
| ETH | 11-03 04:00 | 2254.43 | 7% | 14% | 51% | 57% | 56% | 55% | range 41% |
| HBAR | 11-03 04:00 | 0.06931 | 3% | 77% | 59% | 62% | 26% | 21% | breakdown 35% |
| LINK | 11-03 04:00 | 11.0789 | 6% | 25% | 58% | 53% | 53% | 39% | range 31% |
| LTC | 11-03 04:00 | 53.79 | 1% | 56% | 43% | 34% | 41% | 36% | range 32% |
| NEAR | 11-03 04:00 | 3.779 | 1% | 68% | 39% | 23% | 55% | 50% | range 29% |
| SOL | 11-03 04:00 | 91.95 | 2% | 43% | 39% | 28% | 53% | 37% | range 51% |
| SUI | 11-03 04:00 | 0.8647 | 2% | 58% | 56% | 42% | 45% | 38% | range 27% |
| TON | 11-03 04:00 | 1.163 | 1% | 32% | 54% | 64% | 39% | 35% | trend down 45% |
| XRP | 11-03 04:00 | 1.25138 | 10% | 28% | 59% | 63% | 44% | 46% | trend up 27% |
| ZEC | 11-03 04:00 | 1137.2 | 5% | 43% | 43% | 30% | 64% | 65% | range 34% |

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
