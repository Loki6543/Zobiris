# Zobiris live prediction panel

Updated 2026-10-28 21:00 UTC. Current model `panel-logit-v3`, refit every run on each coin's own Kraken history. Research only: no trading authority.

330 predictions logged; 510 windows scored.

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
| panel-logit-v3 | 1d | 1d | closes higher | 45 | 0.242 | 0.242 | +0.001 |
| panel-logit-v3 | 1d | 1d | beats BTC | 45 | 0.245 | 0.245 | +0.002 |
| panel-logit-v3 | 1d | 1d | new 7-day high | 45 | 0.005 | 0.027 | +0.801 |
| panel-logit-v3 | 1d | 1d | new 7-day low | 45 | 0.142 | 0.142 | +0.000 |
| panel-logit-v3 | 1d | 1d | range widens | 45 | 0.207 | 0.249 | +0.169 |
| panel-logit-v3 | 1d | 1d | shape | 45 | 0.647 | 0.614 | -0.054 |
| panel-logit-v3 | 1d | 1d | volume rises | 45 | 0.244 | 0.247 | +0.014 |
| panel-logit-v3 | 4h | 24h | closes higher | 195 | 0.259 | 0.249 | -0.037 |
| panel-logit-v3 | 4h | 24h | beats BTC | 195 | 0.270 | 0.254 | -0.062 |
| panel-logit-v3 | 4h | 24h | new 7-day high | 195 | 0.006 | 0.034 | +0.838 |
| panel-logit-v3 | 4h | 24h | new 7-day low | 195 | 0.181 | 0.168 | -0.073 |
| panel-logit-v3 | 4h | 24h | range widens | 195 | 0.241 | 0.250 | +0.036 |
| panel-logit-v3 | 4h | 24h | shape | 195 | 0.745 | 0.710 | -0.050 |
| panel-logit-v3 | 4h | 24h | volume rises | 195 | 0.232 | 0.248 | +0.066 |
| panel-logit-v3 | 4h | 4h | closes higher | 225 | 0.255 | 0.252 | -0.011 |
| panel-logit-v3 | 4h | 4h | beats BTC | 225 | 0.266 | 0.256 | -0.041 |
| panel-logit-v3 | 4h | 4h | new 7-day high | 225 | 0.001 | 0.005 | +0.845 |
| panel-logit-v3 | 4h | 4h | new 7-day low | 225 | 0.073 | 0.083 | +0.115 |
| panel-logit-v3 | 4h | 4h | range widens | 225 | 0.215 | 0.251 | +0.142 |
| panel-logit-v3 | 4h | 4h | shape | 225 | 0.689 | 0.705 | +0.023 |
| panel-logit-v3 | 4h | 4h | volume rises | 225 | 0.206 | 0.251 | +0.179 |

## Latest 4h chart, 24h ahead

| Coin | Candle (UTC) | Close | New high | New low | Range widens | Volume rises | Up* | Beats BTC* | Likeliest shape* |
|---|---|---:|---:|---:|---:|---:|---:|---:|---|
| ADA | 10-28 16:00 | 0.206887 | 25% | 21% | 52% | 67% | 45% | 44% | range 26% |
| AVAX | 10-28 16:00 | 9.03 | 6% | 22% | 51% | 62% | 42% | 50% | range 41% |
| COMP | 10-28 16:00 | 21.68 | 8% | 17% | 38% | 58% | 52% | 65% | range 61% |
| DOGE | 10-28 16:00 | 0.0800881 | 14% | 7% | 43% | 44% | 38% | 36% | trend down 34% |
| DOT | 10-28 16:00 | 1.0286 | 9% | 27% | 46% | 38% | 46% | 42% | trend up 40% |
| ETH | 10-28 16:00 | 2369.31 | 17% | 7% | 55% | 68% | 44% | 42% | range 37% |
| HBAR | 10-28 16:00 | 0.07606 | 7% | 40% | 43% | 30% | 40% | 34% | range 27% |
| LINK | 10-28 16:00 | 11.8423 | 20% | 10% | 43% | 48% | 52% | 57% | range 32% |
| LTC | 10-28 16:00 | 59.49 | 54% | 7% | 35% | 45% | 60% | 55% | failed breakout 30% |
| NEAR | 10-28 16:00 | 4.7432 | 11% | 8% | 51% | 60% | 38% | 38% | range 40% |
| SOL | 10-28 16:00 | 102.96 | 24% | 7% | 57% | 55% | 49% | 33% | range 42% |
| SUI | 10-28 16:00 | 0.9506 | 21% | 8% | 40% | 41% | 51% | 44% | range 37% |
| TON | 10-28 16:00 | 1.248 | 7% | 7% | 59% | 63% | 45% | 44% | range 36% |
| XRP | 10-28 16:00 | 1.33399 | 25% | 14% | 58% | 64% | 42% | 47% | trend down 29% |
| ZEC | 10-28 16:00 | 1298.84 | 38% | 9% | 46% | 68% | 56% | 49% | range 33% |

## Latest 1d chart, 7d ahead

| Coin | Candle (UTC) | Close | New high | New low | Range widens | Volume rises | Up* | Beats BTC* | Likeliest shape* |
|---|---|---:|---:|---:|---:|---:|---:|---:|---|
| ADA | 10-27 00:00 | 0.20571 | 34% | 71% | 70% | 58% | 49% | 36% | breakdown 34% |
| AVAX | 10-27 00:00 | 8.954 | 36% | 52% | 73% | 78% | 47% | 43% | breakout up 22% |
| COMP | 10-27 00:00 | 21.32 | 15% | 80% | 34% | 12% | 53% | 59% | range 40% |
| DOGE | 10-27 00:00 | 0.0789763 | 40% | 53% | 68% | 64% | 39% | 31% | range 31% |
| DOT | 10-27 00:00 | 1.0003 | 24% | 74% | 62% | 47% | 52% | 30% | breakdown 26% |
| ETH | 10-27 00:00 | 2347.34 | 43% | 58% | 76% | 67% | 45% | 48% | breakdown 24% |
| HBAR | 10-27 00:00 | 0.07599 | 16% | 89% | 56% | 43% | 44% | 16% | breakdown 34% |
| LINK | 10-27 00:00 | 11.5674 | 44% | 73% | 80% | 64% | 55% | 43% | breakdown 30% |
| LTC | 10-27 00:00 | 57.16 | 42% | 58% | 67% | 69% | 57% | 47% | range 20% |
| NEAR | 10-27 00:00 | 4.677 | 38% | 60% | 51% | 34% | 33% | 29% | breakdown 38% |
| SOL | 10-27 00:00 | 101.22 | 46% | 67% | 75% | 69% | 49% | 41% | breakdown 32% |
| SUI | 10-27 00:00 | 0.9324 | 47% | 66% | 75% | 66% | 56% | 47% | breakdown 32% |
| TON | 10-27 00:00 | 1.23 | 26% | 54% | 56% | 63% | 37% | 34% | range 31% |
| XRP | 10-27 00:00 | 1.32994 | 59% | 42% | 67% | 71% | 59% | 46% | range 25% |
| ZEC | 10-27 00:00 | 1308.82 | 64% | 31% | 58% | 65% | 45% | 46% | failed breakout 26% |

\* No proven skill yet: logged so the scorecard can test it, not to act on.

Earlier study: up/down and beat-BTC did not beat the base rate; new highs and lows did (docs/research/MULTI_TARGET_PANEL_2026-10-24.md). This page checks that out of sample, live.
