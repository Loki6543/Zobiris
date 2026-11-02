# Zobiris live prediction panel

Updated 2026-11-02 05:53 UTC. Current model `panel-logit-v3`, refit every run on each coin's own Kraken history. Research only: no trading authority.

615 predictions logged; 1050 windows scored.

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
| panel-logit-v3 | 4h | 24h | closes higher | 405 | 0.260 | 0.250 | -0.041 |
| panel-logit-v3 | 4h | 24h | beats BTC | 405 | 0.263 | 0.246 | -0.068 |
| panel-logit-v3 | 4h | 24h | new 7-day high | 405 | 0.018 | 0.041 | +0.554 |
| panel-logit-v3 | 4h | 24h | new 7-day low | 405 | 0.179 | 0.189 | +0.048 |
| panel-logit-v3 | 4h | 24h | range widens | 405 | 0.229 | 0.251 | +0.090 |
| panel-logit-v3 | 4h | 24h | shape | 405 | 0.655 | 0.680 | +0.037 |
| panel-logit-v3 | 4h | 24h | volume rises | 405 | 0.225 | 0.251 | +0.104 |
| panel-logit-v3 | 4h | 4h | closes higher | 435 | 0.251 | 0.250 | -0.003 |
| panel-logit-v3 | 4h | 4h | beats BTC | 435 | 0.262 | 0.252 | -0.039 |
| panel-logit-v3 | 4h | 4h | new 7-day high | 435 | 0.003 | 0.006 | +0.564 |
| panel-logit-v3 | 4h | 4h | new 7-day low | 435 | 0.065 | 0.069 | +0.062 |
| panel-logit-v3 | 4h | 4h | range widens | 435 | 0.224 | 0.251 | +0.107 |
| panel-logit-v3 | 4h | 4h | shape | 435 | 0.614 | 0.657 | +0.066 |
| panel-logit-v3 | 4h | 4h | volume rises | 435 | 0.214 | 0.251 | +0.144 |

## Latest 4h chart, 24h ahead

| Coin | Candle (UTC) | Close | New high | New low | Range widens | Volume rises | Up* | Beats BTC* | Likeliest shape* |
|---|---|---:|---:|---:|---:|---:|---:|---:|---|
| ADA | 11-02 00:00 | 0.193823 | 19% | 11% | 54% | 69% | 51% | 44% | range 49% |
| AVAX | 11-02 00:00 | 8.683 | 4% | 11% | 54% | 50% | 43% | 31% | range 69% |
| COMP | 11-02 00:00 | 20.48 | 13% | 18% | 54% | 62% | 39% | 35% | range 42% |
| DOGE | 11-02 00:00 | 0.076092 | 9% | 6% | 46% | 54% | 48% | 49% | range 54% |
| DOT | 11-02 00:00 | 0.9621 | 10% | 19% | 38% | 63% | 49% | 38% | range 62% |
| ETH | 11-02 00:00 | 2306.14 | 24% | 4% | 70% | 78% | 52% | 45% | range 47% |
| HBAR | 11-02 00:00 | 0.07169 | 9% | 15% | 56% | 56% | 52% | 40% | range 52% |
| LINK | 11-02 00:00 | 11.3403 | 3% | 17% | 50% | 43% | 49% | 32% | range 69% |
| LTC | 11-02 00:00 | 56.02 | 12% | 9% | 49% | 60% | 45% | 35% | range 61% |
| NEAR | 11-02 00:00 | 4.293 | 6% | 7% | 59% | 56% | 55% | 53% | range 52% |
| SOL | 11-02 00:00 | 95.45 | 9% | 10% | 57% | 60% | 47% | 30% | range 68% |
| SUI | 11-02 00:00 | 0.9043 | 10% | 12% | 60% | 51% | 46% | 42% | range 54% |
| TON | 11-02 00:00 | 1.209 | 3% | 4% | 49% | 64% | 25% | 23% | range 58% |
| XRP | 11-02 00:00 | 1.25959 | 22% | 13% | 58% | 70% | 55% | 54% | range 37% |
| ZEC | 11-02 00:00 | 1276.82 | 30% | 3% | 43% | 70% | 55% | 52% | range 57% |

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
