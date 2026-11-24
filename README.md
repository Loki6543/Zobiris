# Zobiris live prediction panel

Updated 2026-11-24 02:53 UTC. Current model `panel-logit-v3`, refit every run on each coin's own Kraken history. Research only: no trading authority.

1830 predictions logged; 3495 windows scored.

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
| panel-logit-v3 | 4h | 24h | closes higher | 1305 | 0.276 | 0.247 | -0.116 |
| panel-logit-v3 | 4h | 24h | beats BTC | 1305 | 0.268 | 0.246 | -0.092 |
| panel-logit-v3 | 4h | 24h | new 7-day high | 1305 | 0.022 | 0.044 | +0.495 |
| panel-logit-v3 | 4h | 24h | new 7-day low | 1305 | 0.208 | 0.258 | +0.191 |
| panel-logit-v3 | 4h | 24h | range widens | 1305 | 0.231 | 0.252 | +0.083 |
| panel-logit-v3 | 4h | 24h | shape | 1305 | 0.728 | 0.737 | +0.013 |
| panel-logit-v3 | 4h | 24h | volume rises | 1305 | 0.233 | 0.251 | +0.072 |
| panel-logit-v3 | 4h | 4h | closes higher | 1320 | 0.263 | 0.250 | -0.050 |
| panel-logit-v3 | 4h | 4h | beats BTC | 1320 | 0.257 | 0.249 | -0.030 |
| panel-logit-v3 | 4h | 4h | new 7-day high | 1320 | 0.006 | 0.010 | +0.362 |
| panel-logit-v3 | 4h | 4h | new 7-day low | 1320 | 0.095 | 0.125 | +0.240 |
| panel-logit-v3 | 4h | 4h | range widens | 1320 | 0.229 | 0.251 | +0.086 |
| panel-logit-v3 | 4h | 4h | shape | 1320 | 0.660 | 0.686 | +0.038 |
| panel-logit-v3 | 4h | 4h | volume rises | 1320 | 0.232 | 0.251 | +0.076 |

## Latest 4h chart, 24h ahead

| Coin | Candle (UTC) | Close | New high | New low | Range widens | Volume rises | Up* | Beats BTC* | Likeliest shape* |
|---|---|---:|---:|---:|---:|---:|---:|---:|---|
| ADA | 11-23 20:00 | 0.148402 | 8% | 7% | 46% | 44% | 45% | 49% | range 59% |
| AVAX | 11-23 20:00 | 6.783 | 8% | 8% | 45% | 28% | 46% | 50% | range 46% |
| COMP | 11-23 20:00 | 17.33 | 8% | 10% | 56% | 57% | 49% | 44% | range 53% |
| DOGE | 11-23 20:00 | 0.0563273 | 5% | 10% | 45% | 44% | 36% | 35% | range 57% |
| DOT | 11-23 20:00 | 0.6759 | 8% | 16% | 44% | 46% | 47% | 50% | range 64% |
| ETH | 11-23 20:00 | 1708.64 | 3% | 15% | 45% | 53% | 55% | 63% | range 63% |
| HBAR | 11-23 20:00 | 0.05246 | 7% | 12% | 37% | 33% | 32% | 34% | range 42% |
| LINK | 11-23 20:00 | 9.00142 | 11% | 10% | 40% | 35% | 42% | 45% | range 53% |
| LTC | 11-23 20:00 | 41.44 | 5% | 17% | 50% | 42% | 38% | 33% | range 39% |
| NEAR | 11-23 20:00 | 2.9843 | 4% | 21% | 44% | 39% | 60% | 61% | range 43% |
| SOL | 11-23 20:00 | 71.95 | 7% | 11% | 39% | 45% | 42% | 37% | range 47% |
| SUI | 11-23 20:00 | 0.6734 | 5% | 9% | 33% | 23% | 44% | 50% | range 60% |
| TON | 11-23 20:00 | 0.988 | 6% | 15% | 54% | 62% | 37% | 38% | range 43% |
| XRP | 11-23 20:00 | 0.93951 | 7% | 12% | 53% | 58% | 48% | 51% | range 60% |
| ZEC | 11-23 20:00 | 776.46 | 4% | 26% | 52% | 45% | 65% | 63% | range 58% |

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
