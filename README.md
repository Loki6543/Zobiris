# Zobiris live prediction panel

Updated 2026-11-22 16:13 UTC. Current model `panel-logit-v3`, refit every run on each coin's own Kraken history. Research only: no trading authority.

1755 predictions logged; 3330 windows scored.

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
| panel-logit-v3 | 1d | 1d | closes higher | 420 | 0.242 | 0.243 | +0.005 |
| panel-logit-v3 | 1d | 1d | beats BTC | 420 | 0.247 | 0.248 | +0.002 |
| panel-logit-v3 | 1d | 1d | new 7-day high | 420 | 0.017 | 0.035 | +0.505 |
| panel-logit-v3 | 1d | 1d | new 7-day low | 420 | 0.211 | 0.286 | +0.263 |
| panel-logit-v3 | 1d | 1d | range widens | 420 | 0.217 | 0.250 | +0.133 |
| panel-logit-v3 | 1d | 1d | shape | 420 | 0.759 | 0.764 | +0.007 |
| panel-logit-v3 | 1d | 1d | volume rises | 420 | 0.215 | 0.251 | +0.145 |
| panel-logit-v3 | 1d | 7d | closes higher | 330 | 0.238 | 0.189 | -0.259 |
| panel-logit-v3 | 1d | 7d | beats BTC | 330 | 0.230 | 0.237 | +0.028 |
| panel-logit-v3 | 1d | 7d | new 7-day high | 330 | 0.121 | 0.180 | +0.325 |
| panel-logit-v3 | 1d | 7d | new 7-day low | 330 | 0.149 | 0.256 | +0.419 |
| panel-logit-v3 | 1d | 7d | range widens | 330 | 0.231 | 0.258 | +0.104 |
| panel-logit-v3 | 1d | 7d | shape | 330 | 0.803 | 0.800 | -0.003 |
| panel-logit-v3 | 1d | 7d | volume rises | 330 | 0.222 | 0.255 | +0.129 |
| panel-logit-v3 | 4h | 24h | closes higher | 1245 | 0.270 | 0.246 | -0.099 |
| panel-logit-v3 | 4h | 24h | beats BTC | 1245 | 0.268 | 0.245 | -0.094 |
| panel-logit-v3 | 4h | 24h | new 7-day high | 1245 | 0.019 | 0.041 | +0.545 |
| panel-logit-v3 | 4h | 24h | new 7-day low | 1245 | 0.217 | 0.268 | +0.190 |
| panel-logit-v3 | 4h | 24h | range widens | 1245 | 0.231 | 0.252 | +0.082 |
| panel-logit-v3 | 4h | 24h | shape | 1245 | 0.729 | 0.741 | +0.016 |
| panel-logit-v3 | 4h | 24h | volume rises | 1245 | 0.233 | 0.251 | +0.071 |
| panel-logit-v3 | 4h | 4h | closes higher | 1275 | 0.262 | 0.250 | -0.050 |
| panel-logit-v3 | 4h | 4h | beats BTC | 1275 | 0.255 | 0.249 | -0.025 |
| panel-logit-v3 | 4h | 4h | new 7-day high | 1275 | 0.004 | 0.008 | +0.465 |
| panel-logit-v3 | 4h | 4h | new 7-day low | 1275 | 0.099 | 0.130 | +0.240 |
| panel-logit-v3 | 4h | 4h | range widens | 1275 | 0.229 | 0.250 | +0.084 |
| panel-logit-v3 | 4h | 4h | shape | 1275 | 0.663 | 0.690 | +0.039 |
| panel-logit-v3 | 4h | 4h | volume rises | 1275 | 0.233 | 0.251 | +0.072 |

## Latest 4h chart, 24h ahead

| Coin | Candle (UTC) | Close | New high | New low | Range widens | Volume rises | Up* | Beats BTC* | Likeliest shape* |
|---|---|---:|---:|---:|---:|---:|---:|---:|---|
| ADA | 11-22 12:00 | 0.14459 | 4% | 11% | 71% | 62% | 26% | 45% | range 74% |
| AVAX | 11-22 12:00 | 6.672 | 8% | 7% | 45% | 26% | 27% | 44% | range 66% |
| COMP | 11-22 12:00 | 17.19 | 10% | 7% | 60% | 73% | 43% | 56% | range 47% |
| DOGE | 11-22 12:00 | 0.0552073 | 5% | 11% | 56% | 55% | 23% | 34% | range 68% |
| DOT | 11-22 12:00 | 0.6606 | 8% | 29% | 54% | 70% | 23% | 32% | range 62% |
| ETH | 11-22 12:00 | 1716.07 | 7% | 7% | 66% | 71% | 28% | 36% | range 63% |
| HBAR | 11-22 12:00 | 0.05129 | 5% | 15% | 52% | 56% | 28% | 43% | range 51% |
| LINK | 11-22 12:00 | 8.80628 | 9% | 9% | 49% | 49% | 28% | 36% | range 59% |
| LTC | 11-22 12:00 | 39.81 | 3% | 18% | 55% | 60% | 29% | 33% | range 58% |
| NEAR | 11-22 12:00 | 2.9952 | 10% | 21% | 51% | 66% | 26% | 25% | range 45% |
| SOL | 11-22 12:00 | 70.22 | 6% | 12% | 64% | 71% | 27% | 24% | range 55% |
| SUI | 11-22 12:00 | 0.6564 | 4% | 9% | 57% | 55% | 30% | 38% | range 73% |
| TON | 11-22 12:00 | 0.983 | 5% | 16% | 68% | 70% | 18% | 18% | range 42% |
| XRP | 11-22 12:00 | 0.92356 | 2% | 13% | 66% | 67% | 30% | 37% | range 64% |
| ZEC | 11-22 12:00 | 793.21 | 8% | 7% | 60% | 50% | 52% | 55% | range 68% |

## Latest 1d chart, 7d ahead

| Coin | Candle (UTC) | Close | New high | New low | Range widens | Volume rises | Up* | Beats BTC* | Likeliest shape* |
|---|---|---:|---:|---:|---:|---:|---:|---:|---|
| ADA | 11-21 00:00 | 0.144136 | 20% | 37% | 26% | 44% | 30% | 37% | trend down 35% |
| AVAX | 11-21 00:00 | 6.571 | 16% | 34% | 31% | 43% | 35% | 42% | range 45% |
| COMP | 11-21 00:00 | 17.07 | 55% | 28% | 70% | 60% | 60% | 73% | trend up 39% |
| DOGE | 11-21 00:00 | 0.0551859 | 10% | 43% | 34% | 40% | 26% | 23% | range 43% |
| DOT | 11-21 00:00 | 0.653 | 22% | 57% | 45% | 36% | 41% | 30% | range 32% |
| ETH | 11-21 00:00 | 1682.27 | 14% | 33% | 14% | 29% | 32% | 40% | range 36% |
| HBAR | 11-21 00:00 | 0.05152 | 41% | 47% | 49% | 59% | 54% | 57% | failed breakout 31% |
| LINK | 11-21 00:00 | 8.59295 | 16% | 45% | 30% | 37% | 37% | 51% | range 28% |
| LTC | 11-21 00:00 | 39.74 | 6% | 49% | 31% | 34% | 44% | 53% | range 36% |
| NEAR | 11-21 00:00 | 2.886 | 16% | 57% | 45% | 26% | 33% | 35% | range 34% |
| SOL | 11-21 00:00 | 70.17 | 35% | 34% | 34% | 57% | 34% | 46% | range 30% |
| SUI | 11-21 00:00 | 0.6474 | 8% | 49% | 37% | 37% | 33% | 29% | range 40% |
| TON | 11-21 00:00 | 0.954 | 15% | 62% | 40% | 49% | 45% | 52% | range 35% |
| XRP | 11-21 00:00 | 0.93015 | 27% | 29% | 31% | 53% | 36% | 50% | range 33% |
| ZEC | 11-21 00:00 | 778.59 | 25% | 38% | 40% | 26% | 53% | 58% | range 27% |

\* No proven skill yet: logged so the scorecard can test it, not to act on.

Earlier study: up/down and beat-BTC did not beat the base rate; new highs and lows did (docs/research/MULTI_TARGET_PANEL_2026-10-24.md). This page checks that out of sample, live.
