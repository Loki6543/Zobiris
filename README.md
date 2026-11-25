# Zobiris live prediction panel

Updated 2026-11-25 00:35 UTC. Current model `panel-logit-v3`, refit every run on each coin's own Kraken history. Research only: no trading authority.

1875 predictions logged; 3585 windows scored.

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
| panel-logit-v3 | 1d | 1d | closes higher | 465 | 0.246 | 0.245 | -0.004 |
| panel-logit-v3 | 1d | 1d | beats BTC | 465 | 0.248 | 0.248 | +0.001 |
| panel-logit-v3 | 1d | 1d | new 7-day high | 465 | 0.022 | 0.039 | +0.436 |
| panel-logit-v3 | 1d | 1d | new 7-day low | 465 | 0.192 | 0.263 | +0.267 |
| panel-logit-v3 | 1d | 1d | range widens | 465 | 0.208 | 0.250 | +0.168 |
| panel-logit-v3 | 1d | 1d | shape | 465 | 0.746 | 0.753 | +0.009 |
| panel-logit-v3 | 1d | 1d | volume rises | 465 | 0.207 | 0.251 | +0.176 |
| panel-logit-v3 | 1d | 7d | closes higher | 375 | 0.240 | 0.188 | -0.274 |
| panel-logit-v3 | 1d | 7d | beats BTC | 375 | 0.230 | 0.237 | +0.030 |
| panel-logit-v3 | 1d | 7d | new 7-day high | 375 | 0.115 | 0.177 | +0.352 |
| panel-logit-v3 | 1d | 7d | new 7-day low | 375 | 0.161 | 0.255 | +0.368 |
| panel-logit-v3 | 1d | 7d | range widens | 375 | 0.228 | 0.255 | +0.106 |
| panel-logit-v3 | 1d | 7d | shape | 375 | 0.809 | 0.806 | -0.003 |
| panel-logit-v3 | 1d | 7d | volume rises | 375 | 0.218 | 0.251 | +0.130 |
| panel-logit-v3 | 4h | 24h | closes higher | 1335 | 0.275 | 0.247 | -0.114 |
| panel-logit-v3 | 4h | 24h | beats BTC | 1335 | 0.269 | 0.246 | -0.092 |
| panel-logit-v3 | 4h | 24h | new 7-day high | 1335 | 0.024 | 0.045 | +0.476 |
| panel-logit-v3 | 4h | 24h | new 7-day low | 1335 | 0.204 | 0.253 | +0.193 |
| panel-logit-v3 | 4h | 24h | range widens | 1335 | 0.230 | 0.252 | +0.088 |
| panel-logit-v3 | 4h | 24h | shape | 1335 | 0.725 | 0.734 | +0.013 |
| panel-logit-v3 | 4h | 24h | volume rises | 1335 | 0.232 | 0.251 | +0.076 |
| panel-logit-v3 | 4h | 4h | closes higher | 1350 | 0.262 | 0.250 | -0.047 |
| panel-logit-v3 | 4h | 4h | beats BTC | 1350 | 0.257 | 0.250 | -0.030 |
| panel-logit-v3 | 4h | 4h | new 7-day high | 1350 | 0.006 | 0.009 | +0.367 |
| panel-logit-v3 | 4h | 4h | new 7-day low | 1350 | 0.093 | 0.123 | +0.240 |
| panel-logit-v3 | 4h | 4h | range widens | 1350 | 0.230 | 0.251 | +0.085 |
| panel-logit-v3 | 4h | 4h | shape | 1350 | 0.659 | 0.685 | +0.038 |
| panel-logit-v3 | 4h | 4h | volume rises | 1350 | 0.232 | 0.251 | +0.075 |

## Latest 4h chart, 24h ahead

| Coin | Candle (UTC) | Close | New high | New low | Range widens | Volume rises | Up* | Beats BTC* | Likeliest shape* |
|---|---|---:|---:|---:|---:|---:|---:|---:|---|
| ADA | 11-24 20:00 | 0.144385 | 3% | 20% | 53% | 58% | 44% | 48% | range 49% |
| AVAX | 11-24 20:00 | 6.568 | 2% | 21% | 45% | 44% | 45% | 46% | range 54% |
| COMP | 11-24 20:00 | 17.31 | 4% | 22% | 57% | 53% | 37% | 46% | range 36% |
| DOGE | 11-24 20:00 | 0.0552366 | 2% | 24% | 63% | 49% | 33% | 39% | range 55% |
| DOT | 11-24 20:00 | 0.6518 | 1% | 41% | 51% | 49% | 33% | 34% | range 56% |
| ETH | 11-24 20:00 | 1677.69 | 3% | 25% | 61% | 65% | 47% | 68% | range 47% |
| HBAR | 11-24 20:00 | 0.0503 | 2% | 38% | 38% | 36% | 22% | 25% | range 48% |
| LINK | 11-24 20:00 | 8.84038 | 10% | 25% | 57% | 53% | 51% | 62% | range 45% |
| LTC | 11-24 20:00 | 40.84 | 3% | 31% | 51% | 50% | 32% | 24% | range 39% |
| NEAR | 11-24 20:00 | 2.8844 | 2% | 28% | 61% | 52% | 61% | 62% | range 40% |
| SOL | 11-24 20:00 | 69.59 | 4% | 31% | 47% | 47% | 45% | 45% | range 41% |
| SUI | 11-24 20:00 | 0.6477 | 2% | 25% | 50% | 38% | 48% | 55% | range 55% |
| TON | 11-24 20:00 | 0.933 | 1% | 63% | 62% | 59% | 55% | 56% | range 26% |
| XRP | 11-24 20:00 | 0.92391 | 4% | 22% | 49% | 54% | 44% | 48% | range 58% |
| ZEC | 11-24 20:00 | 738.42 | 3% | 25% | 63% | 62% | 52% | 62% | range 47% |

## Latest 1d chart, 7d ahead

| Coin | Candle (UTC) | Close | New high | New low | Range widens | Volume rises | Up* | Beats BTC* | Likeliest shape* |
|---|---|---:|---:|---:|---:|---:|---:|---:|---|
| ADA | 11-24 00:00 | 0.144385 | 29% | 57% | 50% | 43% | 43% | 40% | breakdown 29% |
| AVAX | 11-24 00:00 | 6.568 | 23% | 56% | 53% | 45% | 54% | 53% | range 33% |
| COMP | 11-24 00:00 | 17.31 | 57% | 51% | 70% | 59% | 44% | 43% | breakdown 27% |
| DOGE | 11-24 00:00 | 0.0552366 | 14% | 63% | 47% | 31% | 34% | 28% | range 32% |
| DOT | 11-24 00:00 | 0.6518 | 13% | 69% | 53% | 40% | 40% | 28% | breakdown 34% |
| ETH | 11-24 00:00 | 1677.69 | 25% | 56% | 46% | 44% | 36% | 47% | range 31% |
| HBAR | 11-24 00:00 | 0.0503 | 23% | 74% | 47% | 48% | 51% | 45% | failed breakout 31% |
| LINK | 11-24 00:00 | 8.84038 | 34% | 57% | 45% | 35% | 40% | 43% | breakdown 28% |
| LTC | 11-24 00:00 | 40.84 | 16% | 51% | 43% | 36% | 41% | 48% | range 31% |
| NEAR | 11-24 00:00 | 2.8844 | 21% | 65% | 52% | 31% | 42% | 42% | range 36% |
| SOL | 11-24 00:00 | 69.59 | 28% | 60% | 49% | 53% | 47% | 54% | range 32% |
| SUI | 11-24 00:00 | 0.6477 | 12% | 56% | 40% | 31% | 46% | 36% | range 44% |
| TON | 11-24 00:00 | 0.933 | 14% | 78% | 52% | 47% | 47% | 43% | range 32% |
| XRP | 11-24 00:00 | 0.92391 | 23% | 59% | 43% | 46% | 40% | 49% | range 31% |
| ZEC | 11-24 00:00 | 738.42 | 19% | 65% | 49% | 26% | 54% | 59% | range 25% |

\* No proven skill yet: logged so the scorecard can test it, not to act on.

Earlier study: up/down and beat-BTC did not beat the base rate; new highs and lows did (docs/research/MULTI_TARGET_PANEL_2026-10-24.md). This page checks that out of sample, live.
