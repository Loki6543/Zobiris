# Zobiris live prediction panel

Updated 2026-10-25 18:58 UTC. Current model `panel-logit-v3`, refit every run on each coin's own Kraken history. Research only: no trading authority.

135 predictions logged; 150 windows scored.

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
| panel-logit-v3 | 4h | 24h | closes higher | 30 | 0.238 | 0.254 | +0.065 |
| panel-logit-v3 | 4h | 24h | beats BTC | 30 | 0.283 | 0.256 | -0.104 |
| panel-logit-v3 | 4h | 24h | new 7-day high | 30 | 0.001 | 0.037 | +0.970 |
| panel-logit-v3 | 4h | 24h | new 7-day low | 30 | 0.290 | 0.348 | +0.165 |
| panel-logit-v3 | 4h | 24h | range widens | 30 | 0.187 | 0.247 | +0.241 |
| panel-logit-v3 | 4h | 24h | shape | 30 | 0.788 | 0.772 | -0.020 |
| panel-logit-v3 | 4h | 24h | volume rises | 30 | 0.192 | 0.246 | +0.217 |
| panel-logit-v3 | 4h | 4h | closes higher | 75 | 0.258 | 0.252 | -0.023 |
| panel-logit-v3 | 4h | 4h | beats BTC | 75 | 0.258 | 0.252 | -0.022 |
| panel-logit-v3 | 4h | 4h | new 7-day high | 75 | 0.000 | 0.005 | +0.943 |
| panel-logit-v3 | 4h | 4h | new 7-day low | 75 | 0.158 | 0.172 | +0.079 |
| panel-logit-v3 | 4h | 4h | range widens | 75 | 0.181 | 0.248 | +0.269 |
| panel-logit-v3 | 4h | 4h | shape | 75 | 0.756 | 0.775 | +0.023 |
| panel-logit-v3 | 4h | 4h | volume rises | 75 | 0.218 | 0.251 | +0.130 |

## Latest 4h chart, 24h ahead

| Coin | Candle (UTC) | Close | New high | New low | Range widens | Volume rises | Up* | Beats BTC* | Likeliest shape* |
|---|---|---:|---:|---:|---:|---:|---:|---:|---|
| ADA | 10-25 12:00 | 0.205368 | 16% | 50% | 61% | 74% | 53% | 53% | trend up 22% |
| AVAX | 10-25 12:00 | 8.898 | 4% | 50% | 60% | 74% | 40% | 33% | range 55% |
| COMP | 10-25 12:00 | 23.05 | 8% | 20% | 58% | 40% | 24% | 32% | trend down 35% |
| DOGE | 10-25 12:00 | 0.0771454 | 5% | 19% | 53% | 53% | 48% | 45% | range 46% |
| DOT | 10-25 12:00 | 1.039 | 4% | 24% | 49% | 63% | 56% | 44% | range 45% |
| ETH | 10-25 12:00 | 2341.36 | 5% | 11% | 63% | 73% | 64% | 42% | range 50% |
| HBAR | 10-25 12:00 | 0.07707 | 3% | 52% | 67% | 57% | 46% | 43% | breakdown 26% |
| LINK | 10-25 12:00 | 11.4161 | 4% | 27% | 64% | 64% | 49% | 41% | range 42% |
| LTC | 10-25 12:00 | 56.97 | 13% | 14% | 59% | 62% | 39% | 31% | range 37% |
| NEAR | 10-25 12:00 | 4.5427 | 5% | 10% | 66% | 75% | 40% | 31% | range 41% |
| SOL | 10-25 12:00 | 101.49 | 8% | 26% | 70% | 69% | 61% | 44% | range 51% |
| SUI | 10-25 12:00 | 0.9168 | 6% | 51% | 51% | 55% | 53% | 47% | range 30% |
| TON | 10-25 12:00 | 1.26 | 6% | 2% | 44% | 50% | 44% | 45% | range 74% |
| XRP | 10-25 12:00 | 1.29859 | 8% | 14% | 71% | 67% | 46% | 35% | range 36% |
| ZEC | 10-25 12:00 | 1208.51 | 13% | 7% | 58% | 66% | 43% | 42% | trend down 37% |

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
