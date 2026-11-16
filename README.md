# Zobiris live prediction panel

Updated 2026-11-16 06:14 UTC. Current model `panel-logit-v3`, refit every run on each coin's own Kraken history. Research only: no trading authority.

1425 predictions logged; 2670 windows scored.

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
| panel-logit-v3 | 1d | 1d | closes higher | 330 | 0.243 | 0.244 | +0.002 |
| panel-logit-v3 | 1d | 1d | beats BTC | 330 | 0.243 | 0.247 | +0.015 |
| panel-logit-v3 | 1d | 1d | new 7-day high | 330 | 0.021 | 0.038 | +0.442 |
| panel-logit-v3 | 1d | 1d | new 7-day low | 330 | 0.223 | 0.288 | +0.226 |
| panel-logit-v3 | 1d | 1d | range widens | 330 | 0.219 | 0.250 | +0.122 |
| panel-logit-v3 | 1d | 1d | shape | 330 | 0.755 | 0.763 | +0.011 |
| panel-logit-v3 | 1d | 1d | volume rises | 330 | 0.209 | 0.251 | +0.168 |
| panel-logit-v3 | 1d | 7d | closes higher | 240 | 0.236 | 0.190 | -0.242 |
| panel-logit-v3 | 1d | 7d | beats BTC | 240 | 0.211 | 0.214 | +0.015 |
| panel-logit-v3 | 1d | 7d | new 7-day high | 240 | 0.139 | 0.183 | +0.241 |
| panel-logit-v3 | 1d | 7d | new 7-day low | 240 | 0.165 | 0.257 | +0.359 |
| panel-logit-v3 | 1d | 7d | range widens | 240 | 0.230 | 0.258 | +0.109 |
| panel-logit-v3 | 1d | 7d | shape | 240 | 0.801 | 0.798 | -0.004 |
| panel-logit-v3 | 1d | 7d | volume rises | 240 | 0.213 | 0.251 | +0.152 |
| panel-logit-v3 | 4h | 24h | closes higher | 1005 | 0.280 | 0.246 | -0.138 |
| panel-logit-v3 | 4h | 24h | beats BTC | 1005 | 0.267 | 0.243 | -0.097 |
| panel-logit-v3 | 4h | 24h | new 7-day high | 1005 | 0.023 | 0.045 | +0.495 |
| panel-logit-v3 | 4h | 24h | new 7-day low | 1005 | 0.221 | 0.277 | +0.201 |
| panel-logit-v3 | 4h | 24h | range widens | 1005 | 0.234 | 0.252 | +0.071 |
| panel-logit-v3 | 4h | 24h | shape | 1005 | 0.744 | 0.747 | +0.003 |
| panel-logit-v3 | 4h | 24h | volume rises | 1005 | 0.229 | 0.251 | +0.089 |
| panel-logit-v3 | 4h | 4h | closes higher | 1035 | 0.264 | 0.250 | -0.056 |
| panel-logit-v3 | 4h | 4h | beats BTC | 1035 | 0.257 | 0.249 | -0.035 |
| panel-logit-v3 | 4h | 4h | new 7-day high | 1035 | 0.005 | 0.009 | +0.418 |
| panel-logit-v3 | 4h | 4h | new 7-day low | 1035 | 0.103 | 0.127 | +0.183 |
| panel-logit-v3 | 4h | 4h | range widens | 1035 | 0.228 | 0.251 | +0.089 |
| panel-logit-v3 | 4h | 4h | shape | 1035 | 0.660 | 0.686 | +0.038 |
| panel-logit-v3 | 4h | 4h | volume rises | 1035 | 0.227 | 0.251 | +0.093 |

## Latest 4h chart, 24h ahead

| Coin | Candle (UTC) | Close | New high | New low | Range widens | Volume rises | Up* | Beats BTC* | Likeliest shape* |
|---|---|---:|---:|---:|---:|---:|---:|---:|---|
| ADA | 11-16 00:00 | 0.15393 | 3% | 24% | 49% | 63% | 38% | 38% | range 62% |
| AVAX | 11-16 00:00 | 7.226 | 3% | 33% | 60% | 45% | 41% | 40% | range 48% |
| COMP | 11-16 00:00 | 17.83 | 4% | 24% | 39% | 49% | 46% | 49% | range 42% |
| DOGE | 11-16 00:00 | 0.0590132 | 2% | 47% | 40% | 42% | 29% | 43% | range 62% |
| DOT | 11-16 00:00 | 0.7291 | 5% | 65% | 48% | 61% | 36% | 46% | range 55% |
| ETH | 11-16 00:00 | 1826.26 | 2% | 37% | 46% | 68% | 44% | 50% | range 56% |
| HBAR | 11-16 00:00 | 0.05896 | 9% | 19% | 41% | 42% | 37% | 44% | range 48% |
| LINK | 11-16 00:00 | 9.2023 | 3% | 48% | 45% | 50% | 39% | 41% | range 56% |
| LTC | 11-16 00:00 | 44.89 | 2% | 39% | 44% | 59% | 48% | 47% | range 42% |
| NEAR | 11-16 00:00 | 3.2005 | 6% | 38% | 72% | 66% | 51% | 54% | range 42% |
| SOL | 11-16 00:00 | 72.11 | 2% | 43% | 42% | 58% | 19% | 15% | range 54% |
| SUI | 11-16 00:00 | 0.7296 | 3% | 37% | 46% | 43% | 40% | 49% | range 54% |
| TON | 11-16 00:00 | 1.061 | 7% | 21% | 71% | 68% | 20% | 27% | trend down 55% |
| XRP | 11-16 00:00 | 0.96284 | 1% | 35% | 55% | 59% | 25% | 34% | range 58% |
| ZEC | 11-16 00:00 | 897.3 | 4% | 54% | 64% | 63% | 42% | 56% | range 36% |

## Latest 1d chart, 7d ahead

| Coin | Candle (UTC) | Close | New high | New low | Range widens | Volume rises | Up* | Beats BTC* | Likeliest shape* |
|---|---|---:|---:|---:|---:|---:|---:|---:|---|
| ADA | 11-15 00:00 | 0.155422 | 19% | 44% | 31% | 42% | 42% | 39% | trend down 25% |
| AVAX | 11-15 00:00 | 7.305 | 20% | 59% | 48% | 45% | 47% | 61% | range 32% |
| COMP | 11-15 00:00 | 18.17 | 42% | 65% | 71% | 56% | 53% | 47% | failed breakout 22% |
| DOGE | 11-15 00:00 | 0.0598571 | 7% | 48% | 28% | 32% | 42% | 27% | range 47% |
| DOT | 11-15 00:00 | 0.7364 | 18% | 52% | 39% | 32% | 49% | 31% | range 41% |
| ETH | 11-15 00:00 | 1834.31 | 7% | 51% | 23% | 25% | 31% | 45% | range 28% |
| HBAR | 11-15 00:00 | 0.0593 | 42% | 49% | 49% | 49% | 65% | 63% | failed breakout 34% |
| LINK | 11-15 00:00 | 9.29805 | 13% | 56% | 33% | 36% | 40% | 50% | trend down 25% |
| LTC | 11-15 00:00 | 45.56 | 12% | 49% | 35% | 41% | 47% | 50% | range 34% |
| NEAR | 11-15 00:00 | 3.2183 | 14% | 51% | 41% | 28% | 35% | 31% | range 44% |
| SOL | 11-15 00:00 | 72.75 | 12% | 56% | 32% | 40% | 47% | 45% | failed breakout 29% |
| SUI | 11-15 00:00 | 0.7376 | 11% | 54% | 39% | 26% | 36% | 29% | range 41% |
| TON | 11-15 00:00 | 1.072 | 16% | 51% | 26% | 25% | 46% | 46% | range 36% |
| XRP | 11-15 00:00 | 0.97387 | 36% | 39% | 46% | 64% | 58% | 59% | failed breakout 35% |
| ZEC | 11-15 00:00 | 915.69 | 22% | 58% | 50% | 36% | 48% | 48% | failed breakout 32% |

\* No proven skill yet: logged so the scorecard can test it, not to act on.

Earlier study: up/down and beat-BTC did not beat the base rate; new highs and lows did (docs/research/MULTI_TARGET_PANEL_2026-10-24.md). This page checks that out of sample, live.
