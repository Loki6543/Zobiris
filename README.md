# Zobiris live prediction panel

Updated 2026-10-26 04:37 UTC. Current model `panel-logit-v3`, refit every run on each coin's own Kraken history. Research only: no trading authority.

180 predictions logged; 225 windows scored.

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
| panel-logit-v3 | 1d | 1d | closes higher | 15 | 0.241 | 0.228 | -0.056 |
| panel-logit-v3 | 1d | 1d | beats BTC | 15 | 0.239 | 0.240 | +0.004 |
| panel-logit-v3 | 1d | 1d | new 7-day high | 15 | 0.006 | 0.027 | +0.767 |
| panel-logit-v3 | 1d | 1d | new 7-day low | 15 | 0.143 | 0.154 | +0.074 |
| panel-logit-v3 | 1d | 1d | range widens | 15 | 0.238 | 0.237 | -0.002 |
| panel-logit-v3 | 1d | 1d | shape | 15 | 0.600 | 0.592 | -0.013 |
| panel-logit-v3 | 1d | 1d | volume rises | 15 | 0.234 | 0.240 | +0.026 |
| panel-logit-v3 | 4h | 24h | closes higher | 60 | 0.247 | 0.250 | +0.009 |
| panel-logit-v3 | 4h | 24h | beats BTC | 60 | 0.281 | 0.252 | -0.118 |
| panel-logit-v3 | 4h | 24h | new 7-day high | 60 | 0.003 | 0.036 | +0.907 |
| panel-logit-v3 | 4h | 24h | new 7-day low | 60 | 0.231 | 0.256 | +0.097 |
| panel-logit-v3 | 4h | 24h | range widens | 60 | 0.204 | 0.249 | +0.182 |
| panel-logit-v3 | 4h | 24h | shape | 60 | 0.739 | 0.730 | -0.013 |
| panel-logit-v3 | 4h | 24h | volume rises | 60 | 0.211 | 0.245 | +0.139 |
| panel-logit-v3 | 4h | 4h | closes higher | 105 | 0.257 | 0.252 | -0.021 |
| panel-logit-v3 | 4h | 4h | beats BTC | 105 | 0.266 | 0.255 | -0.045 |
| panel-logit-v3 | 4h | 4h | new 7-day high | 105 | 0.000 | 0.005 | +0.927 |
| panel-logit-v3 | 4h | 4h | new 7-day low | 105 | 0.123 | 0.132 | +0.067 |
| panel-logit-v3 | 4h | 4h | range widens | 105 | 0.188 | 0.251 | +0.250 |
| panel-logit-v3 | 4h | 4h | shape | 105 | 0.709 | 0.723 | +0.020 |
| panel-logit-v3 | 4h | 4h | volume rises | 105 | 0.210 | 0.250 | +0.160 |

## Latest 4h chart, 24h ahead

| Coin | Candle (UTC) | Close | New high | New low | Range widens | Volume rises | Up* | Beats BTC* | Likeliest shape* |
|---|---|---:|---:|---:|---:|---:|---:|---:|---|
| ADA | 10-26 00:00 | 0.201474 | 7% | 64% | 54% | 69% | 56% | 53% | trend up 26% |
| AVAX | 10-26 00:00 | 8.794 | 3% | 66% | 48% | 57% | 43% | 35% | range 43% |
| COMP | 10-26 00:00 | 20.91 | 7% | 77% | 59% | 16% | 46% | 60% | breakdown 32% |
| DOGE | 10-26 00:00 | 0.0761617 | 2% | 37% | 53% | 41% | 54% | 48% | range 50% |
| DOT | 10-26 00:00 | 1.0153 | 2% | 50% | 47% | 54% | 56% | 46% | range 34% |
| ETH | 10-26 00:00 | 2299.93 | 2% | 25% | 52% | 56% | 69% | 43% | range 41% |
| HBAR | 10-26 00:00 | 0.07648 | 1% | 64% | 46% | 40% | 41% | 43% | breakdown 28% |
| LINK | 10-26 00:00 | 11.3123 | 2% | 36% | 57% | 53% | 50% | 42% | range 44% |
| LTC | 10-26 00:00 | 56.13 | 3% | 35% | 45% | 40% | 47% | 43% | range 35% |
| NEAR | 10-26 00:00 | 4.4543 | 3% | 29% | 61% | 59% | 53% | 49% | range 37% |
| SOL | 10-26 00:00 | 100.06 | 2% | 53% | 67% | 65% | 58% | 45% | range 52% |
| SUI | 10-26 00:00 | 0.9033 | 4% | 62% | 46% | 46% | 59% | 55% | range 27% |
| TON | 10-26 00:00 | 1.23 | 1% | 13% | 35% | 48% | 44% | 53% | range 76% |
| XRP | 10-26 00:00 | 1.27598 | 2% | 46% | 61% | 70% | 50% | 43% | range 31% |
| ZEC | 10-26 00:00 | 1185.05 | 4% | 30% | 52% | 59% | 48% | 51% | trend down 28% |

## Latest 1d chart, 7d ahead

| Coin | Candle (UTC) | Close | New high | New low | Range widens | Volume rises | Up* | Beats BTC* | Likeliest shape* |
|---|---|---:|---:|---:|---:|---:|---:|---:|---|
| ADA | 10-25 00:00 | 0.204022 | 29% | 73% | 66% | 60% | 57% | 45% | breakdown 30% |
| AVAX | 10-25 00:00 | 8.918 | 31% | 57% | 68% | 67% | 57% | 51% | breakout up 25% |
| COMP | 10-25 00:00 | 21.01 | 7% | 78% | 25% | 23% | 28% | 26% | breakdown 32% |
| DOGE | 10-25 00:00 | 0.0768086 | 20% | 65% | 54% | 61% | 45% | 29% | range 29% |
| DOT | 10-25 00:00 | 1.0274 | 15% | 78% | 46% | 30% | 47% | 30% | breakdown 29% |
| ETH | 10-25 00:00 | 2326.5 | 31% | 64% | 72% | 64% | 51% | 49% | breakdown 22% |
| HBAR | 10-25 00:00 | 0.07741 | 12% | 88% | 49% | 28% | 31% | 13% | breakdown 38% |
| LINK | 10-25 00:00 | 11.4397 | 32% | 76% | 74% | 59% | 62% | 53% | breakdown 23% |
| LTC | 10-25 00:00 | 56.68 | 28% | 61% | 51% | 53% | 52% | 46% | range 25% |
| NEAR | 10-25 00:00 | 4.5882 | 23% | 65% | 40% | 26% | 34% | 29% | breakdown 32% |
| SOL | 10-25 00:00 | 101.25 | 39% | 67% | 78% | 72% | 41% | 34% | breakdown 34% |
| SUI | 10-25 00:00 | 0.919 | 23% | 73% | 68% | 57% | 48% | 43% | breakdown 30% |
| TON | 10-25 00:00 | 1.251 | 23% | 58% | 53% | 48% | 38% | 40% | range 35% |
| XRP | 10-25 00:00 | 1.29489 | 42% | 66% | 71% | 70% | 53% | 36% | range 21% |
| ZEC | 10-25 00:00 | 1211.5 | 50% | 47% | 64% | 57% | 54% | 56% | breakout up 25% |

\* No proven skill yet: logged so the scorecard can test it, not to act on.

Earlier study: up/down and beat-BTC did not beat the base rate; new highs and lows did (docs/research/MULTI_TARGET_PANEL_2026-10-24.md). This page checks that out of sample, live.
