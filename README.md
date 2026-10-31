# Zobiris live prediction panel

Updated 2026-10-31 14:30 UTC. Current model `panel-logit-v3`, refit every run on each coin's own Kraken history. Research only: no trading authority.

495 predictions logged; 810 windows scored.

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
| panel-logit-v3 | 1d | 1d | closes higher | 90 | 0.239 | 0.247 | +0.032 |
| panel-logit-v3 | 1d | 1d | beats BTC | 90 | 0.237 | 0.250 | +0.050 |
| panel-logit-v3 | 1d | 1d | new 7-day high | 90 | 0.016 | 0.033 | +0.530 |
| panel-logit-v3 | 1d | 1d | new 7-day low | 90 | 0.203 | 0.275 | +0.260 |
| panel-logit-v3 | 1d | 1d | range widens | 90 | 0.209 | 0.251 | +0.168 |
| panel-logit-v3 | 1d | 1d | shape | 90 | 0.751 | 0.751 | -0.000 |
| panel-logit-v3 | 1d | 1d | volume rises | 90 | 0.227 | 0.251 | +0.097 |
| panel-logit-v3 | 4h | 24h | closes higher | 315 | 0.251 | 0.249 | -0.008 |
| panel-logit-v3 | 4h | 24h | beats BTC | 315 | 0.252 | 0.249 | -0.010 |
| panel-logit-v3 | 4h | 24h | new 7-day high | 315 | 0.020 | 0.043 | +0.529 |
| panel-logit-v3 | 4h | 24h | new 7-day low | 315 | 0.217 | 0.233 | +0.068 |
| panel-logit-v3 | 4h | 24h | range widens | 315 | 0.247 | 0.252 | +0.018 |
| panel-logit-v3 | 4h | 24h | shape | 315 | 0.747 | 0.727 | -0.027 |
| panel-logit-v3 | 4h | 24h | volume rises | 315 | 0.245 | 0.251 | +0.027 |
| panel-logit-v3 | 4h | 4h | closes higher | 345 | 0.255 | 0.251 | -0.014 |
| panel-logit-v3 | 4h | 4h | beats BTC | 345 | 0.264 | 0.253 | -0.043 |
| panel-logit-v3 | 4h | 4h | new 7-day high | 345 | 0.003 | 0.007 | +0.524 |
| panel-logit-v3 | 4h | 4h | new 7-day low | 345 | 0.081 | 0.086 | +0.060 |
| panel-logit-v3 | 4h | 4h | range widens | 345 | 0.222 | 0.250 | +0.110 |
| panel-logit-v3 | 4h | 4h | shape | 345 | 0.680 | 0.699 | +0.027 |
| panel-logit-v3 | 4h | 4h | volume rises | 345 | 0.217 | 0.250 | +0.131 |

## Latest 4h chart, 24h ahead

| Coin | Candle (UTC) | Close | New high | New low | Range widens | Volume rises | Up* | Beats BTC* | Likeliest shape* |
|---|---|---:|---:|---:|---:|---:|---:|---:|---|
| ADA | 10-31 08:00 | 0.192355 | 2% | 20% | 25% | 39% | 85% | 75% | range 65% |
| AVAX | 10-31 08:00 | 8.438 | 9% | 28% | 22% | 34% | 57% | 47% | range 79% |
| COMP | 10-31 08:00 | 20.24 | 5% | 27% | 36% | 52% | 71% | 57% | range 63% |
| DOGE | 10-31 08:00 | 0.0751757 | 6% | 16% | 37% | 24% | 69% | 75% | range 61% |
| DOT | 10-31 08:00 | 0.9532 | 2% | 21% | 31% | 31% | 79% | 56% | range 59% |
| ETH | 10-31 08:00 | 2245.37 | 8% | 11% | 41% | 38% | 76% | 67% | range 60% |
| HBAR | 10-31 08:00 | 0.07222 | 9% | 14% | 16% | 23% | 69% | 56% | range 59% |
| LINK | 10-31 08:00 | 11.4838 | 12% | 18% | 20% | 30% | 70% | 55% | range 57% |
| LTC | 10-31 08:00 | 54.84 | 2% | 35% | 31% | 27% | 52% | 46% | range 58% |
| NEAR | 10-31 08:00 | 4.3328 | 4% | 3% | 34% | 17% | 90% | 82% | range 63% |
| SOL | 10-31 08:00 | 95.73 | 4% | 16% | 16% | 22% | 72% | 44% | range 64% |
| SUI | 10-31 08:00 | 0.8954 | 7% | 14% | 41% | 31% | 83% | 80% | range 51% |
| TON | 10-31 08:00 | 1.182 | 1% | 11% | 38% | 23% | 35% | 31% | range 68% |
| XRP | 10-31 08:00 | 1.24756 | 1% | 7% | 22% | 21% | 83% | 61% | range 75% |
| ZEC | 10-31 08:00 | 1280.57 | 34% | 1% | 46% | 38% | 88% | 82% | range 54% |

## Latest 1d chart, 7d ahead

| Coin | Candle (UTC) | Close | New high | New low | Range widens | Volume rises | Up* | Beats BTC* | Likeliest shape* |
|---|---|---:|---:|---:|---:|---:|---:|---:|---|
| ADA | 10-30 00:00 | 0.195041 | 34% | 54% | 52% | 65% | 42% | 38% | failed breakout 26% |
| AVAX | 10-30 00:00 | 8.528 | 39% | 46% | 60% | 75% | 41% | 42% | failed breakout 33% |
| COMP | 10-30 00:00 | 20.52 | 15% | 64% | 42% | 36% | 37% | 43% | range 25% |
| DOGE | 10-30 00:00 | 0.0758849 | 19% | 53% | 41% | 57% | 41% | 34% | range 33% |
| DOT | 10-30 00:00 | 0.973 | 34% | 48% | 45% | 51% | 34% | 20% | range 30% |
| ETH | 10-30 00:00 | 2241.37 | 17% | 60% | 45% | 47% | 42% | 40% | trend down 24% |
| HBAR | 10-30 00:00 | 0.07227 | 57% | 38% | 64% | 63% | 71% | 63% | failed breakout 40% |
| LINK | 10-30 00:00 | 11.4283 | 53% | 30% | 43% | 67% | 39% | 38% | failed breakout 33% |
| LTC | 10-30 00:00 | 55.9 | 34% | 41% | 45% | 64% | 53% | 48% | range 22% |
| NEAR | 10-30 00:00 | 4.286 | 22% | 66% | 41% | 29% | 31% | 23% | range 30% |
| SOL | 10-30 00:00 | 96.17 | 27% | 58% | 47% | 60% | 48% | 42% | failed breakout 30% |
| SUI | 10-30 00:00 | 0.9038 | 31% | 50% | 60% | 50% | 41% | 30% | failed breakout 26% |
| TON | 10-30 00:00 | 1.175 | 28% | 56% | 57% | 68% | 41% | 33% | range 25% |
| XRP | 10-30 00:00 | 1.25445 | 34% | 51% | 52% | 66% | 52% | 47% | range 27% |
| ZEC | 10-30 00:00 | 1268.01 | 57% | 41% | 52% | 64% | 44% | 47% | failed breakout 30% |

\* No proven skill yet: logged so the scorecard can test it, not to act on.

Earlier study: up/down and beat-BTC did not beat the base rate; new highs and lows did (docs/research/MULTI_TARGET_PANEL_2026-10-24.md). This page checks that out of sample, live.
