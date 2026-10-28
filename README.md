# Zobiris live prediction panel

Updated 2026-10-28 15:04 UTC. Current model `panel-logit-v3`, refit every run on each coin's own Kraken history. Research only: no trading authority.

315 predictions logged; 480 windows scored.

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
| panel-logit-v3 | 4h | 24h | closes higher | 180 | 0.253 | 0.249 | -0.018 |
| panel-logit-v3 | 4h | 24h | beats BTC | 180 | 0.266 | 0.252 | -0.056 |
| panel-logit-v3 | 4h | 24h | new 7-day high | 180 | 0.004 | 0.034 | +0.876 |
| panel-logit-v3 | 4h | 24h | new 7-day low | 180 | 0.189 | 0.177 | -0.067 |
| panel-logit-v3 | 4h | 24h | range widens | 180 | 0.243 | 0.249 | +0.023 |
| panel-logit-v3 | 4h | 24h | shape | 180 | 0.740 | 0.710 | -0.042 |
| panel-logit-v3 | 4h | 24h | volume rises | 180 | 0.230 | 0.247 | +0.070 |
| panel-logit-v3 | 4h | 4h | closes higher | 210 | 0.254 | 0.252 | -0.006 |
| panel-logit-v3 | 4h | 4h | beats BTC | 210 | 0.267 | 0.257 | -0.041 |
| panel-logit-v3 | 4h | 4h | new 7-day high | 210 | 0.001 | 0.005 | +0.850 |
| panel-logit-v3 | 4h | 4h | new 7-day low | 210 | 0.078 | 0.089 | +0.117 |
| panel-logit-v3 | 4h | 4h | range widens | 210 | 0.217 | 0.250 | +0.132 |
| panel-logit-v3 | 4h | 4h | shape | 210 | 0.689 | 0.699 | +0.014 |
| panel-logit-v3 | 4h | 4h | volume rises | 210 | 0.203 | 0.250 | +0.187 |

## Latest 4h chart, 24h ahead

| Coin | Candle (UTC) | Close | New high | New low | Range widens | Volume rises | Up* | Beats BTC* | Likeliest shape* |
|---|---|---:|---:|---:|---:|---:|---:|---:|---|
| ADA | 10-28 08:00 | 0.206219 | 14% | 38% | 68% | 69% | 40% | 37% | trend down 31% |
| AVAX | 10-28 08:00 | 8.977 | 3% | 37% | 62% | 58% | 25% | 36% | range 48% |
| COMP | 10-28 08:00 | 21.56 | 10% | 22% | 49% | 71% | 42% | 43% | range 50% |
| DOGE | 10-28 08:00 | 0.0800416 | 9% | 10% | 66% | 50% | 30% | 27% | trend down 52% |
| DOT | 10-28 08:00 | 1.0191 | 8% | 48% | 72% | 55% | 47% | 42% | trend up 45% |
| ETH | 10-28 08:00 | 2359.01 | 8% | 11% | 72% | 69% | 46% | 42% | trend up 36% |
| HBAR | 10-28 08:00 | 0.07613 | 5% | 54% | 49% | 41% | 36% | 38% | trend down 31% |
| LINK | 10-28 08:00 | 11.7517 | 10% | 15% | 54% | 45% | 46% | 44% | range 30% |
| LTC | 10-28 08:00 | 57.76 | 17% | 15% | 52% | 56% | 54% | 54% | range 30% |
| NEAR | 10-28 08:00 | 4.6581 | 8% | 18% | 55% | 56% | 31% | 31% | trend down 34% |
| SOL | 10-28 08:00 | 102.6 | 14% | 12% | 71% | 66% | 38% | 35% | trend down 31% |
| SUI | 10-28 08:00 | 0.9389 | 8% | 16% | 63% | 56% | 42% | 37% | trend down 33% |
| TON | 10-28 08:00 | 1.24 | 4% | 15% | 67% | 63% | 45% | 45% | trend down 34% |
| XRP | 10-28 08:00 | 1.32295 | 11% | 25% | 64% | 62% | 33% | 43% | trend down 36% |
| ZEC | 10-28 08:00 | 1298.55 | 25% | 10% | 51% | 62% | 40% | 43% | trend down 42% |

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
