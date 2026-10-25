# Zobiris live prediction panel

Updated 2026-10-25 13:10 UTC. Current model `panel-logit-v3`, refit every run on each coin's own Kraken history. Research only: no trading authority.

120 predictions logged; 120 windows scored.

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
| panel-logit-v3 | 4h | 24h | closes higher | 15 | 0.323 | 0.255 | -0.268 |
| panel-logit-v3 | 4h | 24h | beats BTC | 15 | 0.280 | 0.243 | -0.151 |
| panel-logit-v3 | 4h | 24h | new 7-day high | 15 | 0.001 | 0.037 | +0.967 |
| panel-logit-v3 | 4h | 24h | new 7-day low | 15 | 0.339 | 0.579 | +0.414 |
| panel-logit-v3 | 4h | 24h | range widens | 15 | 0.220 | 0.247 | +0.109 |
| panel-logit-v3 | 4h | 24h | shape | 15 | 0.826 | 0.796 | -0.037 |
| panel-logit-v3 | 4h | 24h | volume rises | 15 | 0.263 | 0.250 | -0.052 |
| panel-logit-v3 | 4h | 4h | closes higher | 60 | 0.252 | 0.251 | -0.006 |
| panel-logit-v3 | 4h | 4h | beats BTC | 60 | 0.252 | 0.248 | -0.016 |
| panel-logit-v3 | 4h | 4h | new 7-day high | 60 | 0.000 | 0.005 | +0.949 |
| panel-logit-v3 | 4h | 4h | new 7-day low | 60 | 0.196 | 0.214 | +0.084 |
| panel-logit-v3 | 4h | 4h | range widens | 60 | 0.163 | 0.250 | +0.350 |
| panel-logit-v3 | 4h | 4h | shape | 60 | 0.807 | 0.827 | +0.024 |
| panel-logit-v3 | 4h | 4h | volume rises | 60 | 0.232 | 0.249 | +0.071 |

## Latest 4h chart, 24h ahead

| Coin | Candle (UTC) | Close | New high | New low | Range widens | Volume rises | Up* | Beats BTC* | Likeliest shape* |
|---|---|---:|---:|---:|---:|---:|---:|---:|---|
| ADA | 10-25 08:00 | 0.2048 | 9% | 60% | 48% | 64% | 56% | 54% | trend up 24% |
| AVAX | 10-25 08:00 | 8.837 | 2% | 59% | 57% | 71% | 39% | 26% | range 52% |
| COMP | 10-25 08:00 | 22.95 | 5% | 26% | 54% | 36% | 31% | 38% | range 40% |
| DOGE | 10-25 08:00 | 0.0767021 | 3% | 26% | 40% | 41% | 54% | 46% | range 46% |
| DOT | 10-25 08:00 | 1.0244 | 2% | 36% | 45% | 53% | 62% | 59% | range 54% |
| ETH | 10-25 08:00 | 2337.02 | 4% | 14% | 53% | 62% | 69% | 49% | range 51% |
| HBAR | 10-25 08:00 | 0.07688 | 2% | 62% | 57% | 51% | 46% | 40% | breakdown 31% |
| LINK | 10-25 08:00 | 11.3979 | 2% | 32% | 56% | 61% | 55% | 45% | range 45% |
| LTC | 10-25 08:00 | 56.3 | 4% | 36% | 61% | 58% | 37% | 34% | range 39% |
| NEAR | 10-25 08:00 | 4.4789 | 3% | 14% | 64% | 70% | 44% | 33% | range 38% |
| SOL | 10-25 08:00 | 101.2 | 6% | 36% | 55% | 52% | 63% | 43% | range 54% |
| SUI | 10-25 08:00 | 0.9189 | 7% | 48% | 40% | 46% | 56% | 48% | range 31% |
| TON | 10-25 08:00 | 1.251 | 4% | 4% | 34% | 44% | 48% | 47% | range 76% |
| XRP | 10-25 08:00 | 1.29839 | 8% | 18% | 64% | 64% | 48% | 39% | range 38% |
| ZEC | 10-25 08:00 | 1216.61 | 16% | 5% | 63% | 65% | 44% | 47% | range 35% |

## Latest 1d chart, 7d ahead

| Coin | Candle (UTC) | Close | New high | New low | Range widens | Volume rises | Up* | Beats BTC* | Likeliest shape* |
|---|---|---:|---:|---:|---:|---:|---:|---:|---|
| ADA | 10-24 00:00 | 0.207852 | 29% | 69% | 56% | 56% | 44% | 38% | breakdown 26% |
| AVAX | 10-24 00:00 | 8.987 | 29% | 52% | 57% | 59% | 49% | 43% | range 24% |
| COMP | 10-24 00:00 | 23.79 | 28% | 50% | 28% | 17% | 31% | 35% | range 24% |
| DOGE | 10-24 00:00 | 0.0775786 | 22% | 57% | 49% | 61% | 38% | 30% | range 31% |
| DOT | 10-24 00:00 | 1.0473 | 18% | 74% | 42% | 34% | 43% | 34% | range 26% |
| ETH | 10-24 00:00 | 2355.56 | 31% | 60% | 61% | 60% | 43% | 41% | range 23% |
| HBAR | 10-24 00:00 | 0.07781 | 17% | 86% | 47% | 36% | 25% | 17% | breakdown 44% |
| LINK | 10-24 00:00 | 11.6117 | 30% | 73% | 65% | 51% | 52% | 48% | breakdown 24% |
| LTC | 10-24 00:00 | 56.98 | 26% | 56% | 52% | 54% | 48% | 46% | range 24% |
| NEAR | 10-24 00:00 | 4.4954 | 17% | 76% | 39% | 19% | 32% | 26% | breakdown 30% |
| SOL | 10-24 00:00 | 102.24 | 36% | 68% | 66% | 64% | 34% | 29% | breakdown 25% |
| SUI | 10-24 00:00 | 0.9376 | 24% | 77% | 69% | 53% | 38% | 38% | breakdown 32% |
| TON | 10-24 00:00 | 1.257 | 33% | 55% | 51% | 55% | 38% | 42% | range 30% |
| XRP | 10-24 00:00 | 1.29783 | 38% | 56% | 63% | 67% | 48% | 38% | range 26% |
| ZEC | 10-24 00:00 | 1207.31 | 53% | 38% | 60% | 54% | 53% | 54% | failed breakout 22% |

\* No proven skill yet: logged so the scorecard can test it, not to act on.

Earlier study: up/down and beat-BTC did not beat the base rate; new highs and lows did (docs/research/MULTI_TARGET_PANEL_2026-10-24.md). This page checks that out of sample, live.
