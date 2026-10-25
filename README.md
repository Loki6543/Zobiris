# Zobiris live prediction panel

Updated 2026-10-25 04:32 UTC. Current model `panel-logit-v3`, refit every run on each coin's own Kraken history. Research only: no trading authority.

105 predictions logged; 90 windows scored.

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
| panel-logit-v3 | 4h | 4h | closes higher | 45 | 0.245 | 0.253 | +0.029 |
| panel-logit-v3 | 4h | 4h | beats BTC | 45 | 0.259 | 0.255 | -0.015 |
| panel-logit-v3 | 4h | 4h | new 7-day high | 45 | 0.000 | 0.005 | +0.955 |
| panel-logit-v3 | 4h | 4h | new 7-day low | 45 | 0.242 | 0.265 | +0.086 |
| panel-logit-v3 | 4h | 4h | range widens | 45 | 0.162 | 0.245 | +0.339 |
| panel-logit-v3 | 4h | 4h | shape | 45 | 0.792 | 0.837 | +0.053 |
| panel-logit-v3 | 4h | 4h | volume rises | 45 | 0.222 | 0.249 | +0.108 |

## Latest 4h chart, 24h ahead

| Coin | Candle (UTC) | Close | New high | New low | Range widens | Volume rises | Up* | Beats BTC* | Likeliest shape* |
|---|---|---:|---:|---:|---:|---:|---:|---:|---|
| ADA | 10-25 00:00 | 0.207599 | 9% | 48% | 48% | 55% | 59% | 54% | range 28% |
| AVAX | 10-25 00:00 | 8.959 | 4% | 49% | 56% | 64% | 36% | 31% | range 54% |
| COMP | 10-25 00:00 | 23.46 | 10% | 18% | 53% | 39% | 34% | 36% | range 33% |
| DOGE | 10-25 00:00 | 0.0777707 | 6% | 13% | 30% | 19% | 48% | 52% | range 60% |
| DOT | 10-25 00:00 | 1.0396 | 1% | 30% | 48% | 42% | 62% | 56% | range 62% |
| ETH | 10-25 00:00 | 2359.61 | 4% | 8% | 37% | 44% | 66% | 52% | range 54% |
| HBAR | 10-25 00:00 | 0.07848 | 5% | 30% | 58% | 47% | 43% | 40% | range 33% |
| LINK | 10-25 00:00 | 11.5702 | 3% | 23% | 53% | 37% | 62% | 53% | range 50% |
| LTC | 10-25 00:00 | 56.96 | 7% | 25% | 65% | 45% | 44% | 31% | range 32% |
| NEAR | 10-25 00:00 | 4.4792 | 2% | 23% | 56% | 46% | 48% | 36% | range 30% |
| SOL | 10-25 00:00 | 102.31 | 6% | 18% | 29% | 22% | 57% | 47% | range 60% |
| SUI | 10-25 00:00 | 0.9359 | 7% | 38% | 46% | 41% | 63% | 57% | range 34% |
| TON | 10-25 00:00 | 1.247 | 3% | 6% | 30% | 37% | 50% | 44% | range 74% |
| XRP | 10-25 00:00 | 1.30962 | 16% | 13% | 50% | 55% | 45% | 43% | range 43% |
| ZEC | 10-25 00:00 | 1211.45 | 13% | 6% | 65% | 66% | 41% | 44% | trend down 36% |

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
