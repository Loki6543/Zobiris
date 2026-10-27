# Zobiris live prediction panel

Updated 2026-10-27 04:54 UTC. Current model `panel-logit-v3`, refit every run on each coin's own Kraken history. Research only: no trading authority.

240 predictions logged; 345 windows scored.

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
| panel-logit-v3 | 4h | 24h | closes higher | 120 | 0.249 | 0.247 | -0.009 |
| panel-logit-v3 | 4h | 24h | beats BTC | 120 | 0.273 | 0.256 | -0.068 |
| panel-logit-v3 | 4h | 24h | new 7-day high | 120 | 0.004 | 0.035 | +0.893 |
| panel-logit-v3 | 4h | 24h | new 7-day low | 120 | 0.209 | 0.193 | -0.082 |
| panel-logit-v3 | 4h | 24h | range widens | 120 | 0.240 | 0.250 | +0.038 |
| panel-logit-v3 | 4h | 24h | shape | 120 | 0.718 | 0.683 | -0.051 |
| panel-logit-v3 | 4h | 24h | volume rises | 120 | 0.220 | 0.245 | +0.103 |
| panel-logit-v3 | 4h | 4h | closes higher | 150 | 0.254 | 0.252 | -0.005 |
| panel-logit-v3 | 4h | 4h | beats BTC | 150 | 0.267 | 0.255 | -0.046 |
| panel-logit-v3 | 4h | 4h | new 7-day high | 150 | 0.000 | 0.005 | +0.927 |
| panel-logit-v3 | 4h | 4h | new 7-day low | 150 | 0.098 | 0.105 | +0.071 |
| panel-logit-v3 | 4h | 4h | range widens | 150 | 0.201 | 0.249 | +0.193 |
| panel-logit-v3 | 4h | 4h | shape | 150 | 0.695 | 0.707 | +0.017 |
| panel-logit-v3 | 4h | 4h | volume rises | 150 | 0.199 | 0.250 | +0.204 |

## Latest 4h chart, 24h ahead

| Coin | Candle (UTC) | Close | New high | New low | Range widens | Volume rises | Up* | Beats BTC* | Likeliest shape* |
|---|---|---:|---:|---:|---:|---:|---:|---:|---|
| ADA | 10-27 00:00 | 0.20377 | 5% | 42% | 54% | 51% | 49% | 45% | trend down 27% |
| AVAX | 10-27 00:00 | 8.781 | 2% | 55% | 51% | 49% | 44% | 44% | range 44% |
| COMP | 10-27 00:00 | 21.64 | 13% | 20% | 37% | 42% | 38% | 40% | range 39% |
| DOGE | 10-27 00:00 | 0.0773577 | 2% | 23% | 63% | 53% | 40% | 38% | range 44% |
| DOT | 10-27 00:00 | 0.9899 | 1% | 70% | 63% | 53% | 50% | 48% | trend up 35% |
| ETH | 10-27 00:00 | 2311.02 | 2% | 16% | 43% | 60% | 65% | 50% | range 39% |
| HBAR | 10-27 00:00 | 0.07631 | 2% | 59% | 47% | 42% | 37% | 38% | breakdown 27% |
| LINK | 10-27 00:00 | 11.3207 | 3% | 30% | 65% | 60% | 43% | 39% | range 45% |
| LTC | 10-27 00:00 | 56.35 | 4% | 27% | 40% | 51% | 49% | 50% | range 42% |
| NEAR | 10-27 00:00 | 4.423 | 4% | 29% | 58% | 55% | 52% | 49% | range 35% |
| SOL | 10-27 00:00 | 100.02 | 2% | 40% | 57% | 57% | 47% | 39% | range 54% |
| SUI | 10-27 00:00 | 0.9083 | 3% | 52% | 56% | 48% | 43% | 44% | range 26% |
| TON | 10-27 00:00 | 1.193 | 1% | 21% | 43% | 61% | 58% | 65% | range 63% |
| XRP | 10-27 00:00 | 1.29791 | 11% | 28% | 51% | 62% | 38% | 41% | range 27% |
| ZEC | 10-27 00:00 | 1219.57 | 11% | 13% | 45% | 52% | 43% | 49% | trend down 35% |

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
