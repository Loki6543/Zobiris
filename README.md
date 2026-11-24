# Zobiris live prediction panel

Updated 2026-11-24 14:46 UTC. Current model `panel-logit-v3`, refit every run on each coin's own Kraken history. Research only: no trading authority.

1845 predictions logged; 3525 windows scored.

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
| panel-logit-v3 | 1d | 1d | closes higher | 450 | 0.246 | 0.245 | -0.002 |
| panel-logit-v3 | 1d | 1d | beats BTC | 450 | 0.248 | 0.249 | +0.001 |
| panel-logit-v3 | 1d | 1d | new 7-day high | 450 | 0.022 | 0.039 | +0.430 |
| panel-logit-v3 | 1d | 1d | new 7-day low | 450 | 0.198 | 0.270 | +0.266 |
| panel-logit-v3 | 1d | 1d | range widens | 450 | 0.210 | 0.250 | +0.159 |
| panel-logit-v3 | 1d | 1d | shape | 450 | 0.749 | 0.755 | +0.008 |
| panel-logit-v3 | 1d | 1d | volume rises | 450 | 0.208 | 0.251 | +0.170 |
| panel-logit-v3 | 1d | 7d | closes higher | 360 | 0.239 | 0.188 | -0.271 |
| panel-logit-v3 | 1d | 7d | beats BTC | 360 | 0.231 | 0.238 | +0.029 |
| panel-logit-v3 | 1d | 7d | new 7-day high | 360 | 0.115 | 0.178 | +0.357 |
| panel-logit-v3 | 1d | 7d | new 7-day low | 360 | 0.153 | 0.255 | +0.401 |
| panel-logit-v3 | 1d | 7d | range widens | 360 | 0.229 | 0.256 | +0.106 |
| panel-logit-v3 | 1d | 7d | shape | 360 | 0.804 | 0.804 | -0.001 |
| panel-logit-v3 | 1d | 7d | volume rises | 360 | 0.217 | 0.252 | +0.138 |
| panel-logit-v3 | 4h | 24h | closes higher | 1320 | 0.276 | 0.247 | -0.115 |
| panel-logit-v3 | 4h | 24h | beats BTC | 1320 | 0.269 | 0.246 | -0.092 |
| panel-logit-v3 | 4h | 24h | new 7-day high | 1320 | 0.024 | 0.045 | +0.474 |
| panel-logit-v3 | 4h | 24h | new 7-day low | 1320 | 0.206 | 0.255 | +0.192 |
| panel-logit-v3 | 4h | 24h | range widens | 1320 | 0.230 | 0.252 | +0.086 |
| panel-logit-v3 | 4h | 24h | shape | 1320 | 0.725 | 0.735 | +0.014 |
| panel-logit-v3 | 4h | 24h | volume rises | 1320 | 0.233 | 0.251 | +0.073 |
| panel-logit-v3 | 4h | 4h | closes higher | 1335 | 0.262 | 0.250 | -0.049 |
| panel-logit-v3 | 4h | 4h | beats BTC | 1335 | 0.258 | 0.250 | -0.031 |
| panel-logit-v3 | 4h | 4h | new 7-day high | 1335 | 0.006 | 0.009 | +0.364 |
| panel-logit-v3 | 4h | 4h | new 7-day low | 1335 | 0.094 | 0.124 | +0.240 |
| panel-logit-v3 | 4h | 4h | range widens | 1335 | 0.229 | 0.251 | +0.086 |
| panel-logit-v3 | 4h | 4h | shape | 1335 | 0.657 | 0.684 | +0.039 |
| panel-logit-v3 | 4h | 4h | volume rises | 1335 | 0.232 | 0.251 | +0.075 |

## Latest 4h chart, 24h ahead

| Coin | Candle (UTC) | Close | New high | New low | Range widens | Volume rises | Up* | Beats BTC* | Likeliest shape* |
|---|---|---:|---:|---:|---:|---:|---:|---:|---|
| ADA | 11-24 08:00 | 0.147056 | 4% | 15% | 56% | 58% | 47% | 53% | range 50% |
| AVAX | 11-24 08:00 | 6.745 | 4% | 15% | 55% | 44% | 44% | 45% | range 47% |
| COMP | 11-24 08:00 | 17.37 | 5% | 17% | 57% | 53% | 42% | 52% | range 43% |
| DOGE | 11-24 08:00 | 0.0558706 | 2% | 22% | 62% | 51% | 33% | 34% | range 53% |
| DOT | 11-24 08:00 | 0.6708 | 2% | 28% | 53% | 52% | 35% | 39% | range 56% |
| ETH | 11-24 08:00 | 1700.53 | 3% | 21% | 54% | 64% | 48% | 68% | range 58% |
| HBAR | 11-24 08:00 | 0.05144 | 2% | 29% | 36% | 34% | 23% | 31% | range 48% |
| LINK | 11-24 08:00 | 9.01012 | 13% | 19% | 56% | 56% | 44% | 53% | range 37% |
| LTC | 11-24 08:00 | 41.24 | 2% | 29% | 57% | 58% | 40% | 34% | range 31% |
| NEAR | 11-24 08:00 | 2.9383 | 2% | 31% | 55% | 43% | 60% | 63% | range 44% |
| SOL | 11-24 08:00 | 70.81 | 4% | 24% | 45% | 42% | 50% | 51% | range 47% |
| SUI | 11-24 08:00 | 0.6606 | 2% | 22% | 50% | 31% | 44% | 57% | range 57% |
| TON | 11-24 08:00 | 0.969 | 2% | 40% | 63% | 68% | 28% | 31% | trend down 38% |
| XRP | 11-24 08:00 | 0.93282 | 4% | 22% | 51% | 56% | 45% | 50% | range 53% |
| ZEC | 11-24 08:00 | 742 | 2% | 51% | 66% | 57% | 57% | 61% | range 40% |

## Latest 1d chart, 7d ahead

| Coin | Candle (UTC) | Close | New high | New low | Range widens | Volume rises | Up* | Beats BTC* | Likeliest shape* |
|---|---|---:|---:|---:|---:|---:|---:|---:|---|
| ADA | 11-23 00:00 | 0.148402 | 47% | 26% | 39% | 50% | 48% | 45% | range 24% |
| AVAX | 11-23 00:00 | 6.783 | 28% | 27% | 47% | 54% | 49% | 44% | range 43% |
| COMP | 11-23 00:00 | 17.33 | 63% | 32% | 66% | 60% | 56% | 63% | range 22% |
| DOGE | 11-23 00:00 | 0.0563273 | 20% | 39% | 32% | 36% | 32% | 25% | range 35% |
| DOT | 11-23 00:00 | 0.6759 | 21% | 40% | 39% | 40% | 35% | 28% | range 25% |
| ETH | 11-23 00:00 | 1708.64 | 26% | 35% | 23% | 29% | 51% | 40% | range 47% |
| HBAR | 11-23 00:00 | 0.05246 | 37% | 60% | 42% | 48% | 47% | 48% | failed breakout 30% |
| LINK | 11-23 00:00 | 9.00142 | 39% | 32% | 38% | 41% | 41% | 48% | range 31% |
| LTC | 11-23 00:00 | 41.44 | 22% | 24% | 30% | 36% | 43% | 55% | range 38% |
| NEAR | 11-23 00:00 | 2.9843 | 35% | 40% | 45% | 35% | 51% | 54% | range 31% |
| SOL | 11-23 00:00 | 71.95 | 44% | 27% | 30% | 53% | 47% | 62% | range 39% |
| SUI | 11-23 00:00 | 0.6734 | 14% | 28% | 33% | 32% | 43% | 40% | range 50% |
| TON | 11-23 00:00 | 0.988 | 32% | 51% | 49% | 47% | 40% | 40% | range 38% |
| XRP | 11-23 00:00 | 0.93951 | 29% | 26% | 31% | 43% | 43% | 56% | range 36% |
| ZEC | 11-23 00:00 | 776.46 | 23% | 40% | 40% | 27% | 59% | 62% | range 31% |

\* No proven skill yet: logged so the scorecard can test it, not to act on.

Earlier study: up/down and beat-BTC did not beat the base rate; new highs and lows did (docs/research/MULTI_TARGET_PANEL_2026-10-24.md). This page checks that out of sample, live.
