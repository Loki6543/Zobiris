# Zobiris live prediction panel

Updated 2026-11-18 07:15 UTC. Current model `panel-logit-v3`, refit every run on each coin's own Kraken history. Research only: no trading authority.

1530 predictions logged; 2880 windows scored.

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
| panel-logit-v3 | 1d | 1d | closes higher | 360 | 0.245 | 0.245 | -0.004 |
| panel-logit-v3 | 1d | 1d | beats BTC | 360 | 0.245 | 0.248 | +0.012 |
| panel-logit-v3 | 1d | 1d | new 7-day high | 360 | 0.020 | 0.037 | +0.469 |
| panel-logit-v3 | 1d | 1d | new 7-day low | 360 | 0.212 | 0.270 | +0.216 |
| panel-logit-v3 | 1d | 1d | range widens | 360 | 0.214 | 0.250 | +0.142 |
| panel-logit-v3 | 1d | 1d | shape | 360 | 0.749 | 0.754 | +0.006 |
| panel-logit-v3 | 1d | 1d | volume rises | 360 | 0.210 | 0.251 | +0.165 |
| panel-logit-v3 | 1d | 7d | closes higher | 270 | 0.237 | 0.190 | -0.244 |
| panel-logit-v3 | 1d | 7d | beats BTC | 270 | 0.218 | 0.224 | +0.029 |
| panel-logit-v3 | 1d | 7d | new 7-day high | 270 | 0.137 | 0.183 | +0.254 |
| panel-logit-v3 | 1d | 7d | new 7-day low | 270 | 0.163 | 0.257 | +0.364 |
| panel-logit-v3 | 1d | 7d | range widens | 270 | 0.231 | 0.259 | +0.109 |
| panel-logit-v3 | 1d | 7d | shape | 270 | 0.803 | 0.800 | -0.004 |
| panel-logit-v3 | 1d | 7d | volume rises | 270 | 0.215 | 0.253 | +0.150 |
| panel-logit-v3 | 4h | 24h | closes higher | 1080 | 0.280 | 0.246 | -0.137 |
| panel-logit-v3 | 4h | 24h | beats BTC | 1080 | 0.267 | 0.244 | -0.094 |
| panel-logit-v3 | 4h | 24h | new 7-day high | 1080 | 0.021 | 0.044 | +0.513 |
| panel-logit-v3 | 4h | 24h | new 7-day low | 1080 | 0.220 | 0.263 | +0.165 |
| panel-logit-v3 | 4h | 24h | range widens | 1080 | 0.231 | 0.252 | +0.081 |
| panel-logit-v3 | 4h | 24h | shape | 1080 | 0.724 | 0.734 | +0.014 |
| panel-logit-v3 | 4h | 24h | volume rises | 1080 | 0.228 | 0.251 | +0.093 |
| panel-logit-v3 | 4h | 4h | closes higher | 1110 | 0.263 | 0.250 | -0.053 |
| panel-logit-v3 | 4h | 4h | beats BTC | 1110 | 0.257 | 0.249 | -0.032 |
| panel-logit-v3 | 4h | 4h | new 7-day high | 1110 | 0.005 | 0.008 | +0.434 |
| panel-logit-v3 | 4h | 4h | new 7-day low | 1110 | 0.099 | 0.120 | +0.179 |
| panel-logit-v3 | 4h | 4h | range widens | 1110 | 0.228 | 0.251 | +0.092 |
| panel-logit-v3 | 4h | 4h | shape | 1110 | 0.662 | 0.687 | +0.035 |
| panel-logit-v3 | 4h | 4h | volume rises | 1110 | 0.226 | 0.251 | +0.097 |

## Latest 4h chart, 24h ahead

| Coin | Candle (UTC) | Close | New high | New low | Range widens | Volume rises | Up* | Beats BTC* | Likeliest shape* |
|---|---|---:|---:|---:|---:|---:|---:|---:|---|
| ADA | 11-18 00:00 | 0.15335 | 3% | 44% | 63% | 57% | 28% | 37% | range 52% |
| AVAX | 11-18 00:00 | 7.146 | 2% | 42% | 66% | 45% | 36% | 54% | range 41% |
| COMP | 11-18 00:00 | 18.15 | 5% | 18% | 51% | 68% | 32% | 45% | range 39% |
| DOGE | 11-18 00:00 | 0.0592815 | 1% | 42% | 64% | 50% | 25% | 31% | range 59% |
| DOT | 11-18 00:00 | 0.732 | 2% | 56% | 56% | 51% | 25% | 38% | range 44% |
| ETH | 11-18 00:00 | 1803.21 | 3% | 29% | 54% | 70% | 43% | 52% | range 44% |
| HBAR | 11-18 00:00 | 0.05742 | 3% | 37% | 48% | 44% | 25% | 40% | range 40% |
| LINK | 11-18 00:00 | 9.21448 | 4% | 44% | 63% | 64% | 41% | 55% | range 40% |
| LTC | 11-18 00:00 | 44.67 | 3% | 43% | 56% | 64% | 45% | 61% | range 35% |
| NEAR | 11-18 00:00 | 3.3831 | 11% | 32% | 54% | 57% | 34% | 36% | range 32% |
| SOL | 11-18 00:00 | 74.71 | 7% | 25% | 60% | 64% | 21% | 23% | range 32% |
| SUI | 11-18 00:00 | 0.7297 | 2% | 34% | 65% | 50% | 37% | 49% | range 47% |
| TON | 11-18 00:00 | 1.083 | 19% | 30% | 67% | 77% | 42% | 36% | trend down 30% |
| XRP | 11-18 00:00 | 0.97631 | 2% | 17% | 49% | 42% | 26% | 26% | range 52% |
| ZEC | 11-18 00:00 | 949.51 | 13% | 12% | 44% | 46% | 38% | 44% | range 33% |

## Latest 1d chart, 7d ahead

| Coin | Candle (UTC) | Close | New high | New low | Range widens | Volume rises | Up* | Beats BTC* | Likeliest shape* |
|---|---|---:|---:|---:|---:|---:|---:|---:|---|
| ADA | 11-17 00:00 | 0.15517 | 27% | 36% | 37% | 40% | 46% | 35% | range 27% |
| AVAX | 11-17 00:00 | 7.286 | 29% | 45% | 56% | 55% | 57% | 58% | range 39% |
| COMP | 11-17 00:00 | 17.97 | 54% | 52% | 70% | 59% | 59% | 56% | breakdown 23% |
| DOGE | 11-17 00:00 | 0.060075 | 13% | 40% | 31% | 32% | 38% | 19% | range 50% |
| DOT | 11-17 00:00 | 0.7428 | 31% | 44% | 52% | 43% | 52% | 30% | range 29% |
| ETH | 11-17 00:00 | 1822.9 | 12% | 37% | 19% | 27% | 36% | 42% | range 36% |
| HBAR | 11-17 00:00 | 0.05834 | 44% | 46% | 50% | 48% | 64% | 55% | range 29% |
| LINK | 11-17 00:00 | 9.31175 | 21% | 44% | 36% | 34% | 46% | 44% | range 34% |
| LTC | 11-17 00:00 | 45.33 | 19% | 42% | 37% | 41% | 53% | 52% | range 42% |
| NEAR | 11-17 00:00 | 3.3929 | 50% | 32% | 53% | 47% | 44% | 43% | range 41% |
| SOL | 11-17 00:00 | 75.11 | 44% | 30% | 35% | 49% | 54% | 54% | failed breakout 26% |
| SUI | 11-17 00:00 | 0.7384 | 22% | 44% | 45% | 40% | 49% | 37% | range 42% |
| TON | 11-17 00:00 | 1.078 | 21% | 56% | 41% | 49% | 38% | 37% | range 34% |
| XRP | 11-17 00:00 | 0.9826 | 46% | 26% | 40% | 58% | 56% | 55% | range 24% |
| ZEC | 11-17 00:00 | 966.96 | 50% | 28% | 44% | 41% | 40% | 42% | failed breakout 37% |

\* No proven skill yet: logged so the scorecard can test it, not to act on.

Earlier study: up/down and beat-BTC did not beat the base rate; new highs and lows did (docs/research/MULTI_TARGET_PANEL_2026-10-24.md). This page checks that out of sample, live.
