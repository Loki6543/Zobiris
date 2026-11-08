# Zobiris live prediction panel

Updated 2026-11-08 05:53 UTC. Current model `panel-logit-v3`, refit every run on each coin's own Kraken history. Research only: no trading authority.

960 predictions logged; 1740 windows scored.

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
| panel-logit-v3 | 1d | 1d | closes higher | 210 | 0.245 | 0.247 | +0.007 |
| panel-logit-v3 | 1d | 1d | beats BTC | 210 | 0.240 | 0.240 | +0.002 |
| panel-logit-v3 | 1d | 1d | new 7-day high | 210 | 0.025 | 0.038 | +0.347 |
| panel-logit-v3 | 1d | 1d | new 7-day low | 210 | 0.180 | 0.204 | +0.121 |
| panel-logit-v3 | 1d | 1d | range widens | 210 | 0.220 | 0.248 | +0.116 |
| panel-logit-v3 | 1d | 1d | shape | 210 | 0.728 | 0.729 | +0.001 |
| panel-logit-v3 | 1d | 1d | volume rises | 210 | 0.197 | 0.250 | +0.210 |
| panel-logit-v3 | 1d | 7d | closes higher | 120 | 0.237 | 0.188 | -0.258 |
| panel-logit-v3 | 1d | 7d | beats BTC | 120 | 0.200 | 0.195 | -0.025 |
| panel-logit-v3 | 1d | 7d | new 7-day high | 120 | 0.133 | 0.180 | +0.264 |
| panel-logit-v3 | 1d | 7d | new 7-day low | 120 | 0.154 | 0.259 | +0.405 |
| panel-logit-v3 | 1d | 7d | range widens | 120 | 0.235 | 0.255 | +0.077 |
| panel-logit-v3 | 1d | 7d | shape | 120 | 0.801 | 0.801 | +0.001 |
| panel-logit-v3 | 1d | 7d | volume rises | 120 | 0.189 | 0.257 | +0.265 |
| panel-logit-v3 | 4h | 24h | closes higher | 660 | 0.278 | 0.249 | -0.116 |
| panel-logit-v3 | 4h | 24h | beats BTC | 660 | 0.259 | 0.240 | -0.078 |
| panel-logit-v3 | 4h | 24h | new 7-day high | 660 | 0.029 | 0.046 | +0.369 |
| panel-logit-v3 | 4h | 24h | new 7-day low | 660 | 0.186 | 0.193 | +0.032 |
| panel-logit-v3 | 4h | 24h | range widens | 660 | 0.212 | 0.252 | +0.158 |
| panel-logit-v3 | 4h | 24h | shape | 660 | 0.688 | 0.714 | +0.036 |
| panel-logit-v3 | 4h | 24h | volume rises | 660 | 0.211 | 0.252 | +0.163 |
| panel-logit-v3 | 4h | 4h | closes higher | 690 | 0.256 | 0.251 | -0.024 |
| panel-logit-v3 | 4h | 4h | beats BTC | 690 | 0.258 | 0.249 | -0.034 |
| panel-logit-v3 | 4h | 4h | new 7-day high | 690 | 0.006 | 0.009 | +0.338 |
| panel-logit-v3 | 4h | 4h | new 7-day low | 690 | 0.078 | 0.084 | +0.070 |
| panel-logit-v3 | 4h | 4h | range widens | 690 | 0.223 | 0.252 | +0.112 |
| panel-logit-v3 | 4h | 4h | shape | 690 | 0.625 | 0.668 | +0.065 |
| panel-logit-v3 | 4h | 4h | volume rises | 690 | 0.218 | 0.251 | +0.128 |

## Latest 4h chart, 24h ahead

| Coin | Candle (UTC) | Close | New high | New low | Range widens | Volume rises | Up* | Beats BTC* | Likeliest shape* |
|---|---|---:|---:|---:|---:|---:|---:|---:|---|
| ADA | 11-08 00:00 | 0.180326 | 2% | 19% | 52% | 62% | 52% | 40% | range 72% |
| AVAX | 11-08 00:00 | 8.184 | 3% | 18% | 55% | 60% | 62% | 44% | range 57% |
| COMP | 11-08 00:00 | 19.8 | 7% | 12% | 47% | 55% | 48% | 47% | range 45% |
| DOGE | 11-08 00:00 | 0.0711677 | 3% | 16% | 50% | 54% | 58% | 46% | range 66% |
| DOT | 11-08 00:00 | 0.8929 | 3% | 34% | 40% | 47% | 40% | 39% | range 68% |
| ETH | 11-08 00:00 | 2234.65 | 2% | 7% | 40% | 64% | 74% | 66% | range 79% |
| HBAR | 11-08 00:00 | 0.06663 | 1% | 13% | 54% | 67% | 40% | 30% | range 75% |
| LINK | 11-08 00:00 | 10.7665 | 1% | 20% | 54% | 64% | 49% | 42% | range 68% |
| LTC | 11-08 00:00 | 52.14 | 3% | 23% | 47% | 55% | 44% | 35% | range 55% |
| NEAR | 11-08 00:00 | 3.6939 | 2% | 28% | 54% | 60% | 52% | 49% | range 59% |
| SOL | 11-08 00:00 | 89.21 | 2% | 28% | 65% | 63% | 48% | 32% | range 55% |
| SUI | 11-08 00:00 | 0.8512 | 2% | 32% | 62% | 48% | 47% | 47% | range 63% |
| TON | 11-08 00:00 | 1.053 | 1% | 34% | 48% | 61% | 57% | 63% | range 65% |
| XRP | 11-08 00:00 | 1.1606 | 2% | 26% | 55% | 56% | 61% | 43% | range 65% |
| ZEC | 11-08 00:00 | 1262.29 | 14% | 8% | 64% | 42% | 65% | 65% | range 47% |

## Latest 1d chart, 7d ahead

| Coin | Candle (UTC) | Close | New high | New low | Range widens | Volume rises | Up* | Beats BTC* | Likeliest shape* |
|---|---|---:|---:|---:|---:|---:|---:|---:|---|
| ADA | 11-07 00:00 | 0.181584 | 22% | 68% | 54% | 44% | 47% | 42% | breakdown 26% |
| AVAX | 11-07 00:00 | 8.223 | 37% | 71% | 71% | 51% | 68% | 74% | breakout up 42% |
| COMP | 11-07 00:00 | 19.88 | 34% | 50% | 45% | 40% | 39% | 36% | range 28% |
| DOGE | 11-07 00:00 | 0.0715509 | 10% | 66% | 31% | 25% | 43% | 33% | range 53% |
| DOT | 11-07 00:00 | 0.8972 | 30% | 83% | 67% | 48% | 41% | 24% | breakdown 35% |
| ETH | 11-07 00:00 | 2236.88 | 23% | 62% | 55% | 37% | 35% | 37% | range 30% |
| HBAR | 11-07 00:00 | 0.06708 | 9% | 76% | 32% | 16% | 51% | 34% | range 26% |
| LINK | 11-07 00:00 | 10.8208 | 19% | 52% | 46% | 21% | 50% | 46% | range 36% |
| LTC | 11-07 00:00 | 52.15 | 26% | 63% | 45% | 44% | 56% | 51% | range 36% |
| NEAR | 11-07 00:00 | 3.7312 | 11% | 72% | 45% | 17% | 40% | 31% | range 33% |
| SOL | 11-07 00:00 | 89.68 | 21% | 69% | 57% | 50% | 42% | 36% | breakdown 28% |
| SUI | 11-07 00:00 | 0.8557 | 48% | 52% | 64% | 47% | 74% | 66% | range 34% |
| TON | 11-07 00:00 | 1.068 | 10% | 71% | 36% | 41% | 48% | 42% | range 38% |
| XRP | 11-07 00:00 | 1.16244 | 18% | 72% | 49% | 44% | 49% | 40% | range 30% |
| ZEC | 11-07 00:00 | 1259.91 | 38% | 46% | 41% | 47% | 39% | 41% | range 22% |

\* No proven skill yet: logged so the scorecard can test it, not to act on.

Earlier study: up/down and beat-BTC did not beat the base rate; new highs and lows did (docs/research/MULTI_TARGET_PANEL_2026-10-24.md). This page checks that out of sample, live.
