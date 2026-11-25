# Zobiris live prediction panel

Updated 2026-11-25 14:12 UTC. Current model `panel-logit-v3`, refit every run on each coin's own Kraken history. Research only: no trading authority.

1890 predictions logged; 3615 windows scored.

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
| panel-logit-v3 | 4h | 24h | closes higher | 1350 | 0.274 | 0.247 | -0.111 |
| panel-logit-v3 | 4h | 24h | beats BTC | 1350 | 0.269 | 0.246 | -0.093 |
| panel-logit-v3 | 4h | 24h | new 7-day high | 1350 | 0.023 | 0.045 | +0.479 |
| panel-logit-v3 | 4h | 24h | new 7-day low | 1350 | 0.203 | 0.251 | +0.191 |
| panel-logit-v3 | 4h | 24h | range widens | 1350 | 0.231 | 0.252 | +0.085 |
| panel-logit-v3 | 4h | 24h | shape | 1350 | 0.726 | 0.735 | +0.012 |
| panel-logit-v3 | 4h | 24h | volume rises | 1350 | 0.233 | 0.252 | +0.074 |
| panel-logit-v3 | 4h | 4h | closes higher | 1365 | 0.262 | 0.250 | -0.047 |
| panel-logit-v3 | 4h | 4h | beats BTC | 1365 | 0.257 | 0.250 | -0.030 |
| panel-logit-v3 | 4h | 4h | new 7-day high | 1365 | 0.006 | 0.009 | +0.369 |
| panel-logit-v3 | 4h | 4h | new 7-day low | 1365 | 0.092 | 0.121 | +0.239 |
| panel-logit-v3 | 4h | 4h | range widens | 1365 | 0.230 | 0.251 | +0.085 |
| panel-logit-v3 | 4h | 4h | shape | 1365 | 0.658 | 0.684 | +0.038 |
| panel-logit-v3 | 4h | 4h | volume rises | 1365 | 0.232 | 0.251 | +0.076 |

## Latest 4h chart, 24h ahead

| Coin | Candle (UTC) | Close | New high | New low | Range widens | Volume rises | Up* | Beats BTC* | Likeliest shape* |
|---|---|---:|---:|---:|---:|---:|---:|---:|---|
| ADA | 11-25 08:00 | 0.139769 | 1% | 54% | 49% | 57% | 58% | 50% | range 32% |
| AVAX | 11-25 08:00 | 6.395 | 2% | 37% | 46% | 52% | 53% | 46% | range 41% |
| COMP | 11-25 08:00 | 17.18 | 3% | 27% | 46% | 47% | 41% | 52% | range 39% |
| DOGE | 11-25 08:00 | 0.0535188 | 1% | 50% | 56% | 44% | 44% | 46% | range 33% |
| DOT | 11-25 08:00 | 0.6355 | 1% | 45% | 46% | 40% | 39% | 40% | range 52% |
| ETH | 11-25 08:00 | 1636.25 | 2% | 40% | 59% | 51% | 54% | 71% | range 35% |
| HBAR | 11-25 08:00 | 0.04938 | 1% | 71% | 37% | 45% | 19% | 20% | breakdown 33% |
| LINK | 11-25 08:00 | 8.59315 | 3% | 43% | 53% | 55% | 52% | 55% | range 43% |
| LTC | 11-25 08:00 | 40.11 | 2% | 52% | 46% | 47% | 30% | 28% | range 30% |
| NEAR | 11-25 08:00 | 2.8109 | 1% | 63% | 66% | 55% | 52% | 54% | range 30% |
| SOL | 11-25 08:00 | 67.46 | 2% | 53% | 55% | 51% | 42% | 46% | range 28% |
| SUI | 11-25 08:00 | 0.6274 | 1% | 44% | 56% | 37% | 50% | 55% | range 56% |
| TON | 11-25 08:00 | 0.923 | 1% | 60% | 63% | 50% | 60% | 53% | trend down 27% |
| XRP | 11-25 08:00 | 0.90776 | 2% | 55% | 52% | 61% | 38% | 49% | range 35% |
| ZEC | 11-25 08:00 | 718.34 | 2% | 51% | 68% | 63% | 46% | 48% | range 31% |

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
