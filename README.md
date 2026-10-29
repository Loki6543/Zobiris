# Zobiris live prediction panel

Updated 2026-10-29 05:38 UTC. Current model `panel-logit-v3`, refit every run on each coin's own Kraken history. Research only: no trading authority.

360 predictions logged; 555 windows scored.

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
| panel-logit-v3 | 1d | 1d | closes higher | 60 | 0.245 | 0.246 | +0.004 |
| panel-logit-v3 | 1d | 1d | beats BTC | 60 | 0.245 | 0.250 | +0.022 |
| panel-logit-v3 | 1d | 1d | new 7-day high | 60 | 0.009 | 0.027 | +0.645 |
| panel-logit-v3 | 1d | 1d | new 7-day low | 60 | 0.123 | 0.124 | +0.010 |
| panel-logit-v3 | 1d | 1d | range widens | 60 | 0.205 | 0.250 | +0.180 |
| panel-logit-v3 | 1d | 1d | shape | 60 | 0.641 | 0.612 | -0.048 |
| panel-logit-v3 | 1d | 1d | volume rises | 60 | 0.215 | 0.249 | +0.136 |
| panel-logit-v3 | 4h | 24h | closes higher | 210 | 0.251 | 0.249 | -0.008 |
| panel-logit-v3 | 4h | 24h | beats BTC | 210 | 0.262 | 0.251 | -0.043 |
| panel-logit-v3 | 4h | 24h | new 7-day high | 210 | 0.008 | 0.034 | +0.776 |
| panel-logit-v3 | 4h | 24h | new 7-day low | 210 | 0.179 | 0.173 | -0.037 |
| panel-logit-v3 | 4h | 24h | range widens | 210 | 0.238 | 0.250 | +0.049 |
| panel-logit-v3 | 4h | 24h | shape | 210 | 0.742 | 0.720 | -0.030 |
| panel-logit-v3 | 4h | 24h | volume rises | 210 | 0.230 | 0.249 | +0.076 |
| panel-logit-v3 | 4h | 4h | closes higher | 240 | 0.254 | 0.252 | -0.009 |
| panel-logit-v3 | 4h | 4h | beats BTC | 240 | 0.263 | 0.254 | -0.035 |
| panel-logit-v3 | 4h | 4h | new 7-day high | 240 | 0.001 | 0.005 | +0.756 |
| panel-logit-v3 | 4h | 4h | new 7-day low | 240 | 0.069 | 0.078 | +0.116 |
| panel-logit-v3 | 4h | 4h | range widens | 240 | 0.212 | 0.250 | +0.153 |
| panel-logit-v3 | 4h | 4h | shape | 240 | 0.690 | 0.708 | +0.026 |
| panel-logit-v3 | 4h | 4h | volume rises | 240 | 0.209 | 0.251 | +0.166 |

## Latest 4h chart, 24h ahead

| Coin | Candle (UTC) | Close | New high | New low | Range widens | Volume rises | Up* | Beats BTC* | Likeliest shape* |
|---|---|---:|---:|---:|---:|---:|---:|---:|---|
| ADA | 10-29 00:00 | 0.197344 | 4% | 44% | 20% | 26% | 77% | 69% | trend up 38% |
| AVAX | 10-29 00:00 | 8.586 | 3% | 58% | 25% | 18% | 69% | 71% | range 41% |
| COMP | 10-29 00:00 | 21.16 | 3% | 40% | 28% | 41% | 60% | 66% | range 56% |
| DOGE | 10-29 00:00 | 0.0777194 | 3% | 16% | 26% | 11% | 50% | 54% | range 51% |
| DOT | 10-29 00:00 | 0.9697 | 1% | 53% | 51% | 42% | 66% | 62% | trend up 51% |
| ETH | 10-29 00:00 | 2306.33 | 2% | 14% | 28% | 25% | 60% | 47% | range 46% |
| HBAR | 10-29 00:00 | 0.07325 | 2% | 70% | 17% | 13% | 46% | 40% | range 29% |
| LINK | 10-29 00:00 | 11.3882 | 2% | 51% | 28% | 21% | 62% | 60% | range 33% |
| LTC | 10-29 00:00 | 57.22 | 7% | 33% | 17% | 12% | 70% | 77% | range 40% |
| NEAR | 10-29 00:00 | 4.42 | 2% | 28% | 43% | 30% | 57% | 59% | range 51% |
| SOL | 10-29 00:00 | 99.58 | 2% | 37% | 23% | 22% | 52% | 49% | range 53% |
| SUI | 10-29 00:00 | 0.9041 | 4% | 31% | 23% | 11% | 74% | 75% | range 39% |
| TON | 10-29 00:00 | 1.215 | 1% | 28% | 35% | 39% | 50% | 50% | range 43% |
| XRP | 10-29 00:00 | 1.28884 | 2% | 36% | 27% | 32% | 49% | 47% | range 41% |
| ZEC | 10-29 00:00 | 1238.03 | 7% | 22% | 28% | 29% | 69% | 68% | range 32% |

## Latest 1d chart, 7d ahead

| Coin | Candle (UTC) | Close | New high | New low | Range widens | Volume rises | Up* | Beats BTC* | Likeliest shape* |
|---|---|---:|---:|---:|---:|---:|---:|---:|---|
| ADA | 10-28 00:00 | 0.205623 | 38% | 71% | 72% | 67% | 52% | 43% | breakdown 30% |
| AVAX | 10-28 00:00 | 8.998 | 44% | 54% | 77% | 82% | 46% | 42% | breakout up 23% |
| COMP | 10-28 00:00 | 21.94 | 32% | 66% | 42% | 25% | 43% | 47% | range 32% |
| DOGE | 10-28 00:00 | 0.0795985 | 47% | 48% | 61% | 60% | 47% | 37% | range 26% |
| DOT | 10-28 00:00 | 1.01 | 12% | 75% | 50% | 53% | 34% | 26% | breakdown 27% |
| ETH | 10-28 00:00 | 2357.22 | 44% | 55% | 72% | 65% | 48% | 48% | breakdown 22% |
| HBAR | 10-28 00:00 | 0.07487 | 40% | 71% | 64% | 63% | 76% | 50% | failed breakout 53% |
| LINK | 10-28 00:00 | 11.8081 | 55% | 56% | 78% | 68% | 53% | 43% | breakdown 24% |
| LTC | 10-28 00:00 | 59.19 | 66% | 40% | 68% | 79% | 56% | 44% | failed breakout 20% |
| NEAR | 10-28 00:00 | 4.7311 | 33% | 65% | 56% | 28% | 35% | 27% | breakdown 36% |
| SOL | 10-28 00:00 | 102.33 | 58% | 60% | 75% | 72% | 52% | 44% | breakdown 32% |
| SUI | 10-28 00:00 | 0.9423 | 40% | 59% | 67% | 59% | 50% | 41% | breakdown 27% |
| TON | 10-28 00:00 | 1.241 | 29% | 60% | 59% | 59% | 35% | 29% | range 31% |
| XRP | 10-28 00:00 | 1.32536 | 50% | 45% | 65% | 64% | 54% | 40% | range 30% |
| ZEC | 10-28 00:00 | 1309.7 | 62% | 32% | 63% | 58% | 46% | 45% | breakout up 22% |

\* No proven skill yet: logged so the scorecard can test it, not to act on.

Earlier study: up/down and beat-BTC did not beat the base rate; new highs and lows did (docs/research/MULTI_TARGET_PANEL_2026-10-24.md). This page checks that out of sample, live.
