# Zobiris live prediction panel

Updated 2026-11-13 12:07 UTC. Current model `panel-logit-v3`, refit every run on each coin's own Kraken history. Research only: no trading authority.

1245 predictions logged; 2310 windows scored.

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
| panel-logit-v3 | 1d | 1d | closes higher | 285 | 0.246 | 0.244 | -0.007 |
| panel-logit-v3 | 1d | 1d | beats BTC | 285 | 0.243 | 0.243 | +0.002 |
| panel-logit-v3 | 1d | 1d | new 7-day high | 285 | 0.024 | 0.040 | +0.392 |
| panel-logit-v3 | 1d | 1d | new 7-day low | 285 | 0.209 | 0.251 | +0.169 |
| panel-logit-v3 | 1d | 1d | range widens | 285 | 0.216 | 0.249 | +0.134 |
| panel-logit-v3 | 1d | 1d | shape | 285 | 0.738 | 0.729 | -0.012 |
| panel-logit-v3 | 1d | 1d | volume rises | 285 | 0.199 | 0.251 | +0.206 |
| panel-logit-v3 | 1d | 7d | closes higher | 195 | 0.238 | 0.191 | -0.247 |
| panel-logit-v3 | 1d | 7d | beats BTC | 195 | 0.204 | 0.199 | -0.023 |
| panel-logit-v3 | 1d | 7d | new 7-day high | 195 | 0.143 | 0.183 | +0.220 |
| panel-logit-v3 | 1d | 7d | new 7-day low | 195 | 0.174 | 0.258 | +0.326 |
| panel-logit-v3 | 1d | 7d | range widens | 195 | 0.225 | 0.257 | +0.125 |
| panel-logit-v3 | 1d | 7d | shape | 195 | 0.796 | 0.792 | -0.005 |
| panel-logit-v3 | 1d | 7d | volume rises | 195 | 0.206 | 0.250 | +0.178 |
| panel-logit-v3 | 4h | 24h | closes higher | 870 | 0.273 | 0.248 | -0.102 |
| panel-logit-v3 | 4h | 24h | beats BTC | 870 | 0.262 | 0.241 | -0.085 |
| panel-logit-v3 | 4h | 24h | new 7-day high | 870 | 0.026 | 0.047 | +0.448 |
| panel-logit-v3 | 4h | 24h | new 7-day low | 870 | 0.218 | 0.241 | +0.097 |
| panel-logit-v3 | 4h | 24h | range widens | 870 | 0.217 | 0.252 | +0.137 |
| panel-logit-v3 | 4h | 24h | shape | 870 | 0.712 | 0.730 | +0.025 |
| panel-logit-v3 | 4h | 24h | volume rises | 870 | 0.210 | 0.251 | +0.164 |
| panel-logit-v3 | 4h | 4h | closes higher | 900 | 0.257 | 0.250 | -0.029 |
| panel-logit-v3 | 4h | 4h | beats BTC | 900 | 0.254 | 0.248 | -0.025 |
| panel-logit-v3 | 4h | 4h | new 7-day high | 900 | 0.006 | 0.009 | +0.384 |
| panel-logit-v3 | 4h | 4h | new 7-day low | 900 | 0.101 | 0.109 | +0.074 |
| panel-logit-v3 | 4h | 4h | range widens | 900 | 0.228 | 0.251 | +0.095 |
| panel-logit-v3 | 4h | 4h | shape | 900 | 0.641 | 0.678 | +0.054 |
| panel-logit-v3 | 4h | 4h | volume rises | 900 | 0.223 | 0.251 | +0.111 |

## Latest 4h chart, 24h ahead

| Coin | Candle (UTC) | Close | New high | New low | Range widens | Volume rises | Up* | Beats BTC* | Likeliest shape* |
|---|---|---:|---:|---:|---:|---:|---:|---:|---|
| ADA | 11-13 08:00 | 0.17153 | 5% | 44% | 19% | 30% | 48% | 44% | range 51% |
| AVAX | 11-13 08:00 | 8.385 | 9% | 18% | 30% | 42% | 50% | 53% | range 59% |
| COMP | 11-13 08:00 | 19.83 | 3% | 9% | 34% | 28% | 50% | 53% | range 61% |
| DOGE | 11-13 08:00 | 0.0652415 | 5% | 41% | 24% | 19% | 64% | 63% | range 57% |
| DOT | 11-13 08:00 | 0.8296 | 3% | 34% | 31% | 32% | 44% | 40% | range 44% |
| ETH | 11-13 08:00 | 1957.61 | 3% | 37% | 28% | 23% | 74% | 63% | range 50% |
| HBAR | 11-13 08:00 | 0.06278 | 5% | 42% | 16% | 17% | 47% | 41% | range 59% |
| LINK | 11-13 08:00 | 9.99895 | 9% | 27% | 19% | 20% | 78% | 71% | range 50% |
| LTC | 11-13 08:00 | 49.15 | 4% | 30% | 26% | 19% | 54% | 42% | range 56% |
| NEAR | 11-13 08:00 | 3.5501 | 14% | 41% | 24% | 35% | 59% | 54% | range 54% |
| SOL | 11-13 08:00 | 80.59 | 2% | 32% | 16% | 14% | 56% | 44% | range 67% |
| SUI | 11-13 08:00 | 0.8017 | 6% | 20% | 22% | 25% | 74% | 60% | range 59% |
| TON | 11-13 08:00 | 1.151 | 12% | 7% | 12% | 19% | 77% | 69% | range 54% |
| XRP | 11-13 08:00 | 1.02265 | 1% | 51% | 12% | 14% | 56% | 46% | range 63% |
| ZEC | 11-13 08:00 | 956.26 | 5% | 36% | 36% | 27% | 43% | 54% | range 36% |

## Latest 1d chart, 7d ahead

| Coin | Candle (UTC) | Close | New high | New low | Range widens | Volume rises | Up* | Beats BTC* | Likeliest shape* |
|---|---|---:|---:|---:|---:|---:|---:|---:|---|
| ADA | 11-12 00:00 | 0.174116 | 26% | 61% | 50% | 61% | 36% | 34% | trend down 27% |
| AVAX | 11-12 00:00 | 8.354 | 38% | 64% | 64% | 46% | 52% | 58% | breakdown 28% |
| COMP | 11-12 00:00 | 19.95 | 49% | 55% | 52% | 53% | 34% | 31% | failed breakout 33% |
| DOGE | 11-12 00:00 | 0.0664175 | 10% | 69% | 40% | 46% | 42% | 32% | range 38% |
| DOT | 11-12 00:00 | 0.8334 | 20% | 75% | 48% | 40% | 44% | 24% | failed breakout 25% |
| ETH | 11-12 00:00 | 2017.15 | 15% | 70% | 50% | 43% | 38% | 46% | range 25% |
| HBAR | 11-12 00:00 | 0.06372 | 36% | 71% | 58% | 56% | 58% | 50% | failed breakout 36% |
| LINK | 11-12 00:00 | 10.1378 | 18% | 70% | 53% | 42% | 44% | 45% | breakdown 26% |
| LTC | 11-12 00:00 | 50 | 28% | 59% | 53% | 55% | 49% | 45% | range 23% |
| NEAR | 11-12 00:00 | 3.4189 | 20% | 73% | 49% | 33% | 47% | 38% | range 28% |
| SOL | 11-12 00:00 | 81.62 | 17% | 78% | 64% | 55% | 46% | 36% | breakdown 35% |
| SUI | 11-12 00:00 | 0.8045 | 24% | 65% | 55% | 40% | 52% | 36% | range 27% |
| TON | 11-12 00:00 | 1.139 | 17% | 41% | 32% | 25% | 34% | 32% | range 37% |
| XRP | 11-12 00:00 | 1.04003 | 26% | 73% | 63% | 59% | 61% | 50% | range 24% |
| ZEC | 11-12 00:00 | 956.97 | 19% | 82% | 53% | 32% | 62% | 59% | failed breakout 23% |

\* No proven skill yet: logged so the scorecard can test it, not to act on.

Earlier study: up/down and beat-BTC did not beat the base rate; new highs and lows did (docs/research/MULTI_TARGET_PANEL_2026-10-24.md). This page checks that out of sample, live.
