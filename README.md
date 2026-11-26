# Zobiris live prediction panel

Updated 2026-11-26 00:14 UTC. Current model `panel-logit-v3`, refit every run on each coin's own Kraken history. Research only: no trading authority.

1920 predictions logged; 3675 windows scored.

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
| panel-logit-v3 | 1d | 1d | closes higher | 480 | 0.249 | 0.246 | -0.012 |
| panel-logit-v3 | 1d | 1d | beats BTC | 480 | 0.249 | 0.249 | +0.002 |
| panel-logit-v3 | 1d | 1d | new 7-day high | 480 | 0.021 | 0.038 | +0.445 |
| panel-logit-v3 | 1d | 1d | new 7-day low | 480 | 0.190 | 0.257 | +0.261 |
| panel-logit-v3 | 1d | 1d | range widens | 480 | 0.207 | 0.250 | +0.171 |
| panel-logit-v3 | 1d | 1d | shape | 480 | 0.745 | 0.751 | +0.008 |
| panel-logit-v3 | 1d | 1d | volume rises | 480 | 0.207 | 0.251 | +0.174 |
| panel-logit-v3 | 1d | 7d | closes higher | 390 | 0.240 | 0.188 | -0.279 |
| panel-logit-v3 | 1d | 7d | beats BTC | 390 | 0.230 | 0.237 | +0.030 |
| panel-logit-v3 | 1d | 7d | new 7-day high | 390 | 0.112 | 0.177 | +0.366 |
| panel-logit-v3 | 1d | 7d | new 7-day low | 390 | 0.161 | 0.255 | +0.368 |
| panel-logit-v3 | 1d | 7d | range widens | 390 | 0.231 | 0.255 | +0.094 |
| panel-logit-v3 | 1d | 7d | shape | 390 | 0.807 | 0.806 | -0.002 |
| panel-logit-v3 | 1d | 7d | volume rises | 390 | 0.218 | 0.250 | +0.126 |
| panel-logit-v3 | 4h | 24h | closes higher | 1365 | 0.275 | 0.247 | -0.112 |
| panel-logit-v3 | 4h | 24h | beats BTC | 1365 | 0.269 | 0.246 | -0.092 |
| panel-logit-v3 | 4h | 24h | new 7-day high | 1365 | 0.023 | 0.045 | +0.482 |
| panel-logit-v3 | 4h | 24h | new 7-day low | 1365 | 0.202 | 0.249 | +0.189 |
| panel-logit-v3 | 4h | 24h | range widens | 1365 | 0.230 | 0.252 | +0.085 |
| panel-logit-v3 | 4h | 24h | shape | 1365 | 0.725 | 0.734 | +0.012 |
| panel-logit-v3 | 4h | 24h | volume rises | 1365 | 0.233 | 0.251 | +0.074 |
| panel-logit-v3 | 4h | 4h | closes higher | 1380 | 0.262 | 0.250 | -0.047 |
| panel-logit-v3 | 4h | 4h | beats BTC | 1380 | 0.257 | 0.250 | -0.031 |
| panel-logit-v3 | 4h | 4h | new 7-day high | 1380 | 0.006 | 0.009 | +0.372 |
| panel-logit-v3 | 4h | 4h | new 7-day low | 1380 | 0.092 | 0.121 | +0.235 |
| panel-logit-v3 | 4h | 4h | range widens | 1380 | 0.230 | 0.251 | +0.086 |
| panel-logit-v3 | 4h | 4h | shape | 1380 | 0.657 | 0.682 | +0.038 |
| panel-logit-v3 | 4h | 4h | volume rises | 1380 | 0.232 | 0.251 | +0.076 |

## Latest 4h chart, 24h ahead

| Coin | Candle (UTC) | Close | New high | New low | Range widens | Volume rises | Up* | Beats BTC* | Likeliest shape* |
|---|---|---:|---:|---:|---:|---:|---:|---:|---|
| ADA | 11-25 20:00 | 0.145803 | 8% | 12% | 70% | 60% | 37% | 44% | range 42% |
| AVAX | 11-25 20:00 | 6.624 | 4% | 8% | 60% | 54% | 34% | 48% | range 44% |
| COMP | 11-25 20:00 | 17.86 | 19% | 5% | 55% | 59% | 43% | 63% | range 41% |
| DOGE | 11-25 20:00 | 0.0559849 | 7% | 10% | 65% | 57% | 31% | 41% | range 39% |
| DOT | 11-25 20:00 | 0.6583 | 5% | 20% | 56% | 67% | 36% | 46% | range 48% |
| ETH | 11-25 20:00 | 1690.58 | 11% | 10% | 74% | 74% | 29% | 50% | range 39% |
| HBAR | 11-25 20:00 | 0.05202 | 10% | 10% | 60% | 42% | 19% | 23% | trend down 49% |
| LINK | 11-25 20:00 | 9.0449 | 17% | 8% | 60% | 57% | 40% | 56% | range 39% |
| LTC | 11-25 20:00 | 42.74 | 19% | 9% | 64% | 60% | 36% | 34% | range 35% |
| NEAR | 11-25 20:00 | 3.05 | 11% | 13% | 53% | 73% | 26% | 29% | range 43% |
| SOL | 11-25 20:00 | 70.39 | 18% | 13% | 63% | 57% | 31% | 36% | range 30% |
| SUI | 11-25 20:00 | 0.6665 | 7% | 9% | 71% | 54% | 33% | 35% | range 43% |
| TON | 11-25 20:00 | 0.965 | 13% | 12% | 68% | 68% | 34% | 27% | trend down 39% |
| XRP | 11-25 20:00 | 0.93652 | 12% | 12% | 58% | 47% | 32% | 48% | range 44% |
| ZEC | 11-25 20:00 | 770.23 | 10% | 8% | 27% | 48% | 36% | 41% | range 68% |

## Latest 1d chart, 7d ahead

| Coin | Candle (UTC) | Close | New high | New low | Range widens | Volume rises | Up* | Beats BTC* | Likeliest shape* |
|---|---|---:|---:|---:|---:|---:|---:|---:|---|
| ADA | 11-25 00:00 | 0.145803 | 30% | 42% | 41% | 47% | 32% | 39% | range 29% |
| AVAX | 11-25 00:00 | 6.624 | 28% | 36% | 41% | 49% | 39% | 44% | range 40% |
| COMP | 11-25 00:00 | 17.86 | 77% | 26% | 72% | 63% | 45% | 45% | range 28% |
| DOGE | 11-25 00:00 | 0.0559849 | 18% | 44% | 45% | 41% | 23% | 23% | range 43% |
| DOT | 11-25 00:00 | 0.6583 | 26% | 52% | 51% | 44% | 37% | 24% | range 28% |
| ETH | 11-25 00:00 | 1690.58 | 28% | 41% | 33% | 45% | 34% | 49% | range 29% |
| HBAR | 11-25 00:00 | 0.05202 | 48% | 45% | 55% | 56% | 49% | 42% | range 23% |
| LINK | 11-25 00:00 | 9.0449 | 40% | 38% | 40% | 37% | 35% | 40% | range 30% |
| LTC | 11-25 00:00 | 42.74 | 40% | 32% | 42% | 54% | 34% | 41% | range 30% |
| NEAR | 11-25 00:00 | 3.05 | 31% | 47% | 56% | 35% | 33% | 33% | range 41% |
| SOL | 11-25 00:00 | 70.39 | 35% | 48% | 44% | 52% | 35% | 42% | range 28% |
| SUI | 11-25 00:00 | 0.6665 | 28% | 45% | 45% | 46% | 41% | 32% | range 35% |
| TON | 11-25 00:00 | 0.965 | 37% | 56% | 55% | 62% | 37% | 37% | range 30% |
| XRP | 11-25 00:00 | 0.93652 | 31% | 45% | 43% | 52% | 38% | 50% | range 37% |
| ZEC | 11-25 00:00 | 770.23 | 34% | 42% | 48% | 31% | 53% | 57% | failed breakout 26% |

\* No proven skill yet: logged so the scorecard can test it, not to act on.

Earlier study: up/down and beat-BTC did not beat the base rate; new highs and lows did (docs/research/MULTI_TARGET_PANEL_2026-10-24.md). This page checks that out of sample, live.
