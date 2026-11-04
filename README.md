# Zobiris live prediction panel

Updated 2026-11-04 19:42 UTC. Current model `panel-logit-v3`, refit every run on each coin's own Kraken history. Research only: no trading authority.

750 predictions logged; 1320 windows scored.

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
| panel-logit-v3 | 1d | 1d | closes higher | 150 | 0.243 | 0.246 | +0.009 |
| panel-logit-v3 | 1d | 1d | beats BTC | 150 | 0.239 | 0.242 | +0.014 |
| panel-logit-v3 | 1d | 1d | new 7-day high | 150 | 0.013 | 0.030 | +0.567 |
| panel-logit-v3 | 1d | 1d | new 7-day low | 150 | 0.162 | 0.205 | +0.209 |
| panel-logit-v3 | 1d | 1d | range widens | 150 | 0.217 | 0.249 | +0.126 |
| panel-logit-v3 | 1d | 1d | shape | 150 | 0.713 | 0.704 | -0.012 |
| panel-logit-v3 | 1d | 1d | volume rises | 150 | 0.197 | 0.251 | +0.214 |
| panel-logit-v3 | 1d | 7d | closes higher | 60 | 0.214 | 0.190 | -0.124 |
| panel-logit-v3 | 1d | 7d | beats BTC | 60 | 0.197 | 0.213 | +0.073 |
| panel-logit-v3 | 1d | 7d | new 7-day high | 60 | 0.107 | 0.169 | +0.369 |
| panel-logit-v3 | 1d | 7d | new 7-day low | 60 | 0.131 | 0.255 | +0.485 |
| panel-logit-v3 | 1d | 7d | range widens | 60 | 0.257 | 0.255 | -0.006 |
| panel-logit-v3 | 1d | 7d | shape | 60 | 0.779 | 0.791 | +0.015 |
| panel-logit-v3 | 1d | 7d | volume rises | 60 | 0.188 | 0.251 | +0.253 |
| panel-logit-v3 | 4h | 24h | closes higher | 510 | 0.263 | 0.250 | -0.052 |
| panel-logit-v3 | 4h | 24h | beats BTC | 510 | 0.259 | 0.244 | -0.059 |
| panel-logit-v3 | 4h | 24h | new 7-day high | 510 | 0.019 | 0.042 | +0.548 |
| panel-logit-v3 | 4h | 24h | new 7-day low | 510 | 0.179 | 0.187 | +0.039 |
| panel-logit-v3 | 4h | 24h | range widens | 510 | 0.229 | 0.252 | +0.091 |
| panel-logit-v3 | 4h | 24h | shape | 510 | 0.687 | 0.702 | +0.020 |
| panel-logit-v3 | 4h | 24h | volume rises | 510 | 0.220 | 0.251 | +0.123 |
| panel-logit-v3 | 4h | 4h | closes higher | 540 | 0.251 | 0.250 | -0.002 |
| panel-logit-v3 | 4h | 4h | beats BTC | 540 | 0.257 | 0.250 | -0.027 |
| panel-logit-v3 | 4h | 4h | new 7-day high | 540 | 0.006 | 0.009 | +0.395 |
| panel-logit-v3 | 4h | 4h | new 7-day low | 540 | 0.066 | 0.071 | +0.077 |
| panel-logit-v3 | 4h | 4h | range widens | 540 | 0.224 | 0.252 | +0.110 |
| panel-logit-v3 | 4h | 4h | shape | 540 | 0.637 | 0.677 | +0.059 |
| panel-logit-v3 | 4h | 4h | volume rises | 540 | 0.220 | 0.251 | +0.122 |

## Latest 4h chart, 24h ahead

| Coin | Candle (UTC) | Close | New high | New low | Range widens | Volume rises | Up* | Beats BTC* | Likeliest shape* |
|---|---|---:|---:|---:|---:|---:|---:|---:|---|
| ADA | 11-04 12:00 | 0.197682 | 40% | 7% | 58% | 73% | 45% | 47% | trend down 28% |
| AVAX | 11-04 12:00 | 8.932 | 30% | 9% | 43% | 62% | 40% | 56% | trend down 31% |
| COMP | 11-04 12:00 | 20.63 | 24% | 12% | 49% | 60% | 41% | 49% | range 41% |
| DOGE | 11-04 12:00 | 0.0772 | 21% | 5% | 35% | 52% | 37% | 47% | range 45% |
| DOT | 11-04 12:00 | 0.9677 | 12% | 12% | 63% | 57% | 43% | 39% | range 33% |
| ETH | 11-04 12:00 | 2423.99 | 73% | 1% | 32% | 43% | 37% | 32% | breakout up 35% |
| HBAR | 11-04 12:00 | 0.07286 | 22% | 5% | 30% | 50% | 36% | 63% | trend down 73% |
| LINK | 11-04 12:00 | 11.5806 | 23% | 4% | 37% | 57% | 35% | 39% | range 31% |
| LTC | 11-04 12:00 | 56.27 | 16% | 10% | 49% | 52% | 40% | 32% | range 26% |
| NEAR | 11-04 12:00 | 4.1373 | 17% | 13% | 38% | 58% | 34% | 32% | range 36% |
| SOL | 11-04 12:00 | 96.56 | 35% | 6% | 55% | 59% | 34% | 19% | range 38% |
| SUI | 11-04 12:00 | 0.9415 | 46% | 2% | 36% | 44% | 61% | 60% | trend up 32% |
| TON | 11-04 12:00 | 1.196 | 9% | 5% | 42% | 55% | 32% | 27% | trend down 44% |
| XRP | 11-04 12:00 | 1.31467 | 52% | 9% | 64% | 67% | 45% | 62% | trend down 24% |
| ZEC | 11-04 12:00 | 1305.82 | 50% | 4% | 26% | 68% | 53% | 45% | range 30% |

## Latest 1d chart, 7d ahead

| Coin | Candle (UTC) | Close | New high | New low | Range widens | Volume rises | Up* | Beats BTC* | Likeliest shape* |
|---|---|---:|---:|---:|---:|---:|---:|---:|---|
| ADA | 11-03 00:00 | 0.189715 | 36% | 62% | 67% | 64% | 54% | 44% | breakdown 27% |
| AVAX | 11-03 00:00 | 8.516 | 45% | 51% | 67% | 69% | 46% | 46% | breakout up 22% |
| COMP | 11-03 00:00 | 19.9 | 26% | 51% | 43% | 41% | 38% | 40% | range 34% |
| DOGE | 11-03 00:00 | 0.0751051 | 28% | 63% | 62% | 63% | 45% | 33% | range 32% |
| DOT | 11-03 00:00 | 0.9372 | 30% | 75% | 72% | 51% | 40% | 24% | breakdown 37% |
| ETH | 11-03 00:00 | 2271.45 | 43% | 56% | 70% | 63% | 43% | 47% | trend down 23% |
| HBAR | 11-03 00:00 | 0.06947 | 43% | 54% | 57% | 59% | 73% | 55% | failed breakout 45% |
| LINK | 11-03 00:00 | 11.016 | 33% | 53% | 58% | 40% | 53% | 45% | range 26% |
| LTC | 11-03 00:00 | 54.26 | 41% | 54% | 65% | 64% | 63% | 54% | range 28% |
| NEAR | 11-03 00:00 | 3.8261 | 13% | 80% | 47% | 20% | 41% | 31% | range 34% |
| SOL | 11-03 00:00 | 92.71 | 34% | 67% | 59% | 61% | 56% | 49% | breakdown 28% |
| SUI | 11-03 00:00 | 0.8927 | 56% | 50% | 69% | 64% | 59% | 51% | range 25% |
| TON | 11-03 00:00 | 1.177 | 28% | 64% | 62% | 63% | 33% | 27% | trend down 27% |
| XRP | 11-03 00:00 | 1.27496 | 54% | 46% | 66% | 71% | 56% | 50% | range 22% |
| ZEC | 11-03 00:00 | 1216.52 | 44% | 53% | 52% | 63% | 40% | 44% | failed breakout 22% |

\* No proven skill yet: logged so the scorecard can test it, not to act on.

Earlier study: up/down and beat-BTC did not beat the base rate; new highs and lows did (docs/research/MULTI_TARGET_PANEL_2026-10-24.md). This page checks that out of sample, live.
