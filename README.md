# Zobiris live prediction panel

Updated 2026-11-02 18:14 UTC. Current model `panel-logit-v3`, refit every run on each coin's own Kraken history. Research only: no trading authority.

630 predictions logged; 1080 windows scored.

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
| panel-logit-v3 | 1d | 1d | closes higher | 120 | 0.245 | 0.246 | +0.003 |
| panel-logit-v3 | 1d | 1d | beats BTC | 120 | 0.238 | 0.242 | +0.015 |
| panel-logit-v3 | 1d | 1d | new 7-day high | 120 | 0.015 | 0.032 | +0.525 |
| panel-logit-v3 | 1d | 1d | new 7-day low | 120 | 0.165 | 0.215 | +0.234 |
| panel-logit-v3 | 1d | 1d | range widens | 120 | 0.220 | 0.248 | +0.114 |
| panel-logit-v3 | 1d | 1d | shape | 120 | 0.702 | 0.696 | -0.009 |
| panel-logit-v3 | 1d | 1d | volume rises | 120 | 0.206 | 0.250 | +0.176 |
| panel-logit-v3 | 1d | 7d | closes higher | 30 | 0.194 | 0.191 | -0.019 |
| panel-logit-v3 | 1d | 7d | beats BTC | 30 | 0.214 | 0.228 | +0.060 |
| panel-logit-v3 | 1d | 7d | new 7-day high | 30 | 0.086 | 0.169 | +0.492 |
| panel-logit-v3 | 1d | 7d | new 7-day low | 30 | 0.122 | 0.253 | +0.515 |
| panel-logit-v3 | 1d | 7d | range widens | 30 | 0.261 | 0.248 | -0.048 |
| panel-logit-v3 | 1d | 7d | shape | 30 | 0.814 | 0.775 | -0.050 |
| panel-logit-v3 | 1d | 7d | volume rises | 30 | 0.207 | 0.231 | +0.105 |
| panel-logit-v3 | 4h | 24h | closes higher | 420 | 0.259 | 0.249 | -0.039 |
| panel-logit-v3 | 4h | 24h | beats BTC | 420 | 0.261 | 0.245 | -0.065 |
| panel-logit-v3 | 4h | 24h | new 7-day high | 420 | 0.018 | 0.041 | +0.563 |
| panel-logit-v3 | 4h | 24h | new 7-day low | 420 | 0.174 | 0.183 | +0.050 |
| panel-logit-v3 | 4h | 24h | range widens | 420 | 0.229 | 0.251 | +0.087 |
| panel-logit-v3 | 4h | 24h | shape | 420 | 0.651 | 0.677 | +0.038 |
| panel-logit-v3 | 4h | 24h | volume rises | 420 | 0.222 | 0.251 | +0.113 |
| panel-logit-v3 | 4h | 4h | closes higher | 450 | 0.251 | 0.250 | -0.003 |
| panel-logit-v3 | 4h | 4h | beats BTC | 450 | 0.260 | 0.251 | -0.035 |
| panel-logit-v3 | 4h | 4h | new 7-day high | 450 | 0.003 | 0.006 | +0.562 |
| panel-logit-v3 | 4h | 4h | new 7-day low | 450 | 0.063 | 0.067 | +0.062 |
| panel-logit-v3 | 4h | 4h | range widens | 450 | 0.223 | 0.251 | +0.111 |
| panel-logit-v3 | 4h | 4h | shape | 450 | 0.621 | 0.660 | +0.059 |
| panel-logit-v3 | 4h | 4h | volume rises | 450 | 0.214 | 0.250 | +0.143 |

## Latest 4h chart, 24h ahead

| Coin | Candle (UTC) | Close | New high | New low | Range widens | Volume rises | Up* | Beats BTC* | Likeliest shape* |
|---|---|---:|---:|---:|---:|---:|---:|---:|---|
| ADA | 11-02 12:00 | 0.189802 | 8% | 57% | 52% | 66% | 42% | 36% | range 28% |
| AVAX | 11-02 12:00 | 8.485 | 2% | 44% | 62% | 63% | 37% | 29% | range 47% |
| COMP | 11-02 12:00 | 20.29 | 10% | 31% | 46% | 37% | 40% | 34% | trend up 30% |
| DOGE | 11-02 12:00 | 0.0749678 | 3% | 32% | 62% | 58% | 50% | 40% | range 41% |
| DOT | 11-02 12:00 | 0.9343 | 2% | 53% | 60% | 47% | 42% | 28% | range 28% |
| ETH | 11-02 12:00 | 2270.29 | 6% | 11% | 70% | 74% | 56% | 49% | range 44% |
| HBAR | 11-02 12:00 | 0.07045 | 5% | 63% | 59% | 64% | 31% | 30% | breakdown 27% |
| LINK | 11-02 12:00 | 11.2192 | 4% | 25% | 60% | 45% | 49% | 36% | range 42% |
| LTC | 11-02 12:00 | 54.57 | 2% | 40% | 42% | 43% | 45% | 40% | range 35% |
| NEAR | 11-02 12:00 | 4.0089 | 1% | 57% | 45% | 39% | 50% | 44% | range 32% |
| SOL | 11-02 12:00 | 93.42 | 2% | 40% | 66% | 60% | 49% | 35% | range 50% |
| SUI | 11-02 12:00 | 0.8837 | 3% | 44% | 62% | 51% | 39% | 35% | range 35% |
| TON | 11-02 12:00 | 1.191 | 2% | 18% | 53% | 62% | 32% | 32% | trend down 48% |
| XRP | 11-02 12:00 | 1.24752 | 6% | 32% | 57% | 63% | 46% | 48% | trend up 31% |
| ZEC | 11-02 12:00 | 1251.99 | 9% | 10% | 60% | 70% | 47% | 51% | range 31% |

## Latest 1d chart, 7d ahead

| Coin | Candle (UTC) | Close | New high | New low | Range widens | Volume rises | Up* | Beats BTC* | Likeliest shape* |
|---|---|---:|---:|---:|---:|---:|---:|---:|---|
| ADA | 11-01 00:00 | 0.192939 | 43% | 59% | 68% | 64% | 49% | 38% | breakdown 24% |
| AVAX | 11-01 00:00 | 8.688 | 48% | 48% | 69% | 71% | 41% | 38% | breakout up 23% |
| COMP | 11-01 00:00 | 20.32 | 38% | 53% | 51% | 39% | 56% | 56% | failed breakout 29% |
| DOGE | 11-01 00:00 | 0.0754634 | 23% | 54% | 48% | 48% | 40% | 29% | range 40% |
| DOT | 11-01 00:00 | 0.952 | 37% | 65% | 64% | 48% | 42% | 27% | breakdown 27% |
| ETH | 11-01 00:00 | 2272.35 | 40% | 51% | 65% | 55% | 40% | 39% | breakdown 25% |
| HBAR | 11-01 00:00 | 0.07168 | 48% | 42% | 59% | 49% | 67% | 47% | failed breakout 40% |
| LINK | 11-01 00:00 | 11.3762 | 38% | 34% | 40% | 34% | 46% | 33% | range 28% |
| LTC | 11-01 00:00 | 55.58 | 34% | 42% | 44% | 49% | 56% | 52% | range 36% |
| NEAR | 11-01 00:00 | 4.2827 | 24% | 62% | 42% | 22% | 36% | 27% | breakdown 27% |
| SOL | 11-01 00:00 | 94.41 | 35% | 65% | 55% | 60% | 53% | 46% | failed breakout 28% |
| SUI | 11-01 00:00 | 0.9 | 52% | 44% | 66% | 55% | 56% | 50% | breakout up 25% |
| TON | 11-01 00:00 | 1.216 | 44% | 48% | 59% | 57% | 32% | 27% | range 24% |
| XRP | 11-01 00:00 | 1.24916 | 39% | 57% | 67% | 63% | 53% | 41% | range 23% |
| ZEC | 11-01 00:00 | 1232.59 | 36% | 61% | 56% | 53% | 36% | 40% | breakdown 31% |

\* No proven skill yet: logged so the scorecard can test it, not to act on.

Earlier study: up/down and beat-BTC did not beat the base rate; new highs and lows did (docs/research/MULTI_TARGET_PANEL_2026-10-24.md). This page checks that out of sample, live.
