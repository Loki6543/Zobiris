# Zobiris live prediction panel

Updated 2026-10-27 20:39 UTC. Current model `panel-logit-v3`, refit every run on each coin's own Kraken history. Research only: no trading authority.

270 predictions logged; 405 windows scored.

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
| panel-logit-v3 | 1d | 1d | closes higher | 30 | 0.241 | 0.239 | -0.008 |
| panel-logit-v3 | 1d | 1d | beats BTC | 30 | 0.243 | 0.243 | +0.001 |
| panel-logit-v3 | 1d | 1d | new 7-day high | 30 | 0.004 | 0.027 | +0.837 |
| panel-logit-v3 | 1d | 1d | new 7-day low | 30 | 0.142 | 0.134 | -0.059 |
| panel-logit-v3 | 1d | 1d | range widens | 30 | 0.223 | 0.244 | +0.085 |
| panel-logit-v3 | 1d | 1d | shape | 30 | 0.592 | 0.553 | -0.070 |
| panel-logit-v3 | 1d | 1d | volume rises | 30 | 0.208 | 0.248 | +0.164 |
| panel-logit-v3 | 4h | 24h | closes higher | 150 | 0.246 | 0.246 | +0.002 |
| panel-logit-v3 | 4h | 24h | beats BTC | 150 | 0.264 | 0.251 | -0.052 |
| panel-logit-v3 | 4h | 24h | new 7-day high | 150 | 0.004 | 0.035 | +0.877 |
| panel-logit-v3 | 4h | 24h | new 7-day low | 150 | 0.201 | 0.188 | -0.068 |
| panel-logit-v3 | 4h | 24h | range widens | 150 | 0.245 | 0.250 | +0.019 |
| panel-logit-v3 | 4h | 24h | shape | 150 | 0.715 | 0.682 | -0.048 |
| panel-logit-v3 | 4h | 24h | volume rises | 150 | 0.226 | 0.246 | +0.081 |
| panel-logit-v3 | 4h | 4h | closes higher | 180 | 0.252 | 0.253 | +0.001 |
| panel-logit-v3 | 4h | 4h | beats BTC | 180 | 0.265 | 0.256 | -0.037 |
| panel-logit-v3 | 4h | 4h | new 7-day high | 180 | 0.000 | 0.005 | +0.932 |
| panel-logit-v3 | 4h | 4h | new 7-day low | 180 | 0.090 | 0.103 | +0.122 |
| panel-logit-v3 | 4h | 4h | range widens | 180 | 0.213 | 0.250 | +0.147 |
| panel-logit-v3 | 4h | 4h | shape | 180 | 0.698 | 0.712 | +0.019 |
| panel-logit-v3 | 4h | 4h | volume rises | 180 | 0.202 | 0.251 | +0.194 |

## Latest 4h chart, 24h ahead

| Coin | Candle (UTC) | Close | New high | New low | Range widens | Volume rises | Up* | Beats BTC* | Likeliest shape* |
|---|---|---:|---:|---:|---:|---:|---:|---:|---|
| ADA | 10-27 16:00 | 0.205108 | 19% | 30% | 66% | 69% | 48% | 50% | range 26% |
| AVAX | 10-27 16:00 | 8.884 | 3% | 38% | 58% | 60% | 35% | 39% | range 54% |
| COMP | 10-27 16:00 | 21.41 | 7% | 34% | 51% | 70% | 48% | 56% | range 50% |
| DOGE | 10-27 16:00 | 0.0783141 | 6% | 13% | 60% | 54% | 35% | 36% | range 39% |
| DOT | 10-27 16:00 | 0.9962 | 3% | 62% | 66% | 67% | 39% | 36% | breakdown 32% |
| ETH | 10-27 16:00 | 2344.84 | 7% | 11% | 65% | 74% | 50% | 41% | range 38% |
| HBAR | 10-27 16:00 | 0.07618 | 4% | 47% | 60% | 47% | 38% | 39% | trend down 30% |
| LINK | 10-27 16:00 | 11.48 | 9% | 20% | 65% | 63% | 48% | 47% | range 33% |
| LTC | 10-27 16:00 | 56.71 | 10% | 19% | 49% | 66% | 46% | 45% | range 41% |
| NEAR | 10-27 16:00 | 4.6355 | 12% | 10% | 58% | 73% | 33% | 30% | range 38% |
| SOL | 10-27 16:00 | 101.02 | 11% | 18% | 66% | 68% | 49% | 34% | range 47% |
| SUI | 10-27 16:00 | 0.926 | 8% | 25% | 58% | 57% | 38% | 34% | range 33% |
| TON | 10-27 16:00 | 1.212 | 2% | 20% | 62% | 64% | 44% | 51% | range 48% |
| XRP | 10-27 16:00 | 1.32256 | 27% | 16% | 70% | 74% | 40% | 47% | trend down 27% |
| ZEC | 10-27 16:00 | 1298.38 | 38% | 5% | 43% | 73% | 39% | 37% | trend down 43% |

## Latest 1d chart, 7d ahead

| Coin | Candle (UTC) | Close | New high | New low | Range widens | Volume rises | Up* | Beats BTC* | Likeliest shape* |
|---|---|---:|---:|---:|---:|---:|---:|---:|---|
| ADA | 10-26 00:00 | 0.206361 | 43% | 67% | 70% | 65% | 53% | 40% | breakdown 33% |
| AVAX | 10-26 00:00 | 8.962 | 38% | 57% | 76% | 79% | 50% | 46% | breakout up 26% |
| COMP | 10-26 00:00 | 22.27 | 28% | 62% | 40% | 38% | 30% | 26% | breakdown 26% |
| DOGE | 10-26 00:00 | 0.0776204 | 28% | 58% | 61% | 63% | 43% | 30% | range 30% |
| DOT | 10-26 00:00 | 1.0092 | 18% | 76% | 50% | 38% | 51% | 33% | range 26% |
| ETH | 10-26 00:00 | 2320.45 | 31% | 64% | 72% | 63% | 47% | 48% | breakdown 23% |
| HBAR | 10-26 00:00 | 0.07721 | 11% | 87% | 50% | 26% | 31% | 10% | breakdown 40% |
| LINK | 10-26 00:00 | 11.3866 | 34% | 76% | 80% | 63% | 64% | 59% | breakdown 26% |
| LTC | 10-26 00:00 | 56.71 | 33% | 60% | 59% | 58% | 54% | 47% | range 22% |
| NEAR | 10-26 00:00 | 4.5025 | 26% | 72% | 45% | 28% | 39% | 33% | breakdown 34% |
| SOL | 10-26 00:00 | 100.76 | 40% | 69% | 71% | 70% | 49% | 45% | breakdown 29% |
| SUI | 10-26 00:00 | 0.9165 | 25% | 71% | 70% | 55% | 47% | 42% | breakdown 32% |
| TON | 10-26 00:00 | 1.209 | 15% | 72% | 56% | 56% | 41% | 38% | range 27% |
| XRP | 10-26 00:00 | 1.30674 | 48% | 54% | 66% | 71% | 53% | 43% | range 24% |
| ZEC | 10-26 00:00 | 1230.88 | 53% | 38% | 61% | 58% | 55% | 56% | breakout up 23% |

\* No proven skill yet: logged so the scorecard can test it, not to act on.

Earlier study: up/down and beat-BTC did not beat the base rate; new highs and lows did (docs/research/MULTI_TARGET_PANEL_2026-10-24.md). This page checks that out of sample, live.
