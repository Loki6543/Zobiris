# Zobiris live prediction panel

Updated 2026-11-07 20:11 UTC. Current model `panel-logit-v3`, refit every run on each coin's own Kraken history. Research only: no trading authority.

930 predictions logged; 1680 windows scored.

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
| panel-logit-v3 | 1d | 1d | closes higher | 195 | 0.245 | 0.248 | +0.014 |
| panel-logit-v3 | 1d | 1d | beats BTC | 195 | 0.241 | 0.243 | +0.009 |
| panel-logit-v3 | 1d | 1d | new 7-day high | 195 | 0.027 | 0.040 | +0.328 |
| panel-logit-v3 | 1d | 1d | new 7-day low | 195 | 0.183 | 0.205 | +0.109 |
| panel-logit-v3 | 1d | 1d | range widens | 195 | 0.214 | 0.249 | +0.140 |
| panel-logit-v3 | 1d | 1d | shape | 195 | 0.742 | 0.741 | -0.000 |
| panel-logit-v3 | 1d | 1d | volume rises | 195 | 0.193 | 0.250 | +0.228 |
| panel-logit-v3 | 1d | 7d | closes higher | 105 | 0.228 | 0.189 | -0.206 |
| panel-logit-v3 | 1d | 7d | beats BTC | 105 | 0.194 | 0.201 | +0.031 |
| panel-logit-v3 | 1d | 7d | new 7-day high | 105 | 0.130 | 0.179 | +0.273 |
| panel-logit-v3 | 1d | 7d | new 7-day low | 105 | 0.143 | 0.258 | +0.444 |
| panel-logit-v3 | 1d | 7d | range widens | 105 | 0.232 | 0.256 | +0.091 |
| panel-logit-v3 | 1d | 7d | shape | 105 | 0.792 | 0.796 | +0.005 |
| panel-logit-v3 | 1d | 7d | volume rises | 105 | 0.189 | 0.258 | +0.266 |
| panel-logit-v3 | 4h | 24h | closes higher | 645 | 0.273 | 0.249 | -0.096 |
| panel-logit-v3 | 4h | 24h | beats BTC | 645 | 0.257 | 0.241 | -0.067 |
| panel-logit-v3 | 4h | 24h | new 7-day high | 645 | 0.029 | 0.046 | +0.363 |
| panel-logit-v3 | 4h | 24h | new 7-day low | 645 | 0.186 | 0.191 | +0.028 |
| panel-logit-v3 | 4h | 24h | range widens | 645 | 0.213 | 0.252 | +0.154 |
| panel-logit-v3 | 4h | 24h | shape | 645 | 0.694 | 0.716 | +0.031 |
| panel-logit-v3 | 4h | 24h | volume rises | 645 | 0.212 | 0.252 | +0.157 |
| panel-logit-v3 | 4h | 4h | closes higher | 675 | 0.256 | 0.251 | -0.023 |
| panel-logit-v3 | 4h | 4h | beats BTC | 675 | 0.258 | 0.249 | -0.033 |
| panel-logit-v3 | 4h | 4h | new 7-day high | 675 | 0.006 | 0.010 | +0.332 |
| panel-logit-v3 | 4h | 4h | new 7-day low | 675 | 0.074 | 0.080 | +0.074 |
| panel-logit-v3 | 4h | 4h | range widens | 675 | 0.225 | 0.251 | +0.106 |
| panel-logit-v3 | 4h | 4h | shape | 675 | 0.627 | 0.669 | +0.062 |
| panel-logit-v3 | 4h | 4h | volume rises | 675 | 0.220 | 0.250 | +0.121 |

## Latest 4h chart, 24h ahead

| Coin | Candle (UTC) | Close | New high | New low | Range widens | Volume rises | Up* | Beats BTC* | Likeliest shape* |
|---|---|---:|---:|---:|---:|---:|---:|---:|---|
| ADA | 11-07 16:00 | 0.181194 | 1% | 22% | 48% | 51% | 45% | 34% | range 76% |
| AVAX | 11-07 16:00 | 8.201 | 3% | 19% | 53% | 51% | 57% | 50% | range 71% |
| COMP | 11-07 16:00 | 19.91 | 7% | 10% | 42% | 50% | 59% | 56% | range 44% |
| DOGE | 11-07 16:00 | 0.071686 | 4% | 16% | 61% | 57% | 49% | 45% | range 74% |
| DOT | 11-07 16:00 | 0.8965 | 1% | 28% | 42% | 39% | 25% | 24% | range 66% |
| ETH | 11-07 16:00 | 2232.3 | 2% | 7% | 36% | 54% | 73% | 64% | range 84% |
| HBAR | 11-07 16:00 | 0.06722 | 2% | 12% | 54% | 61% | 50% | 40% | range 76% |
| LINK | 11-07 16:00 | 10.8289 | 1% | 20% | 57% | 62% | 51% | 46% | range 62% |
| LTC | 11-07 16:00 | 52.18 | 4% | 16% | 42% | 53% | 48% | 38% | range 61% |
| NEAR | 11-07 16:00 | 3.6465 | 2% | 30% | 56% | 54% | 61% | 59% | range 55% |
| SOL | 11-07 16:00 | 89.53 | 2% | 21% | 69% | 70% | 41% | 34% | range 63% |
| SUI | 11-07 16:00 | 0.8584 | 2% | 19% | 72% | 60% | 50% | 47% | range 72% |
| TON | 11-07 16:00 | 1.092 | 1% | 18% | 48% | 56% | 49% | 54% | range 67% |
| XRP | 11-07 16:00 | 1.16069 | 2% | 28% | 41% | 42% | 58% | 46% | range 72% |
| ZEC | 11-07 16:00 | 1266.14 | 15% | 8% | 66% | 46% | 66% | 68% | range 54% |

## Latest 1d chart, 7d ahead

| Coin | Candle (UTC) | Close | New high | New low | Range widens | Volume rises | Up* | Beats BTC* | Likeliest shape* |
|---|---|---:|---:|---:|---:|---:|---:|---:|---|
| ADA | 11-06 00:00 | 0.183859 | 36% | 61% | 57% | 61% | 56% | 48% | failed breakout 25% |
| AVAX | 11-06 00:00 | 8.329 | 40% | 68% | 77% | 68% | 48% | 57% | failed breakout 28% |
| COMP | 11-06 00:00 | 19.97 | 39% | 54% | 45% | 43% | 37% | 31% | failed breakout 37% |
| DOGE | 11-06 00:00 | 0.0723164 | 20% | 62% | 45% | 42% | 48% | 37% | range 34% |
| DOT | 11-06 00:00 | 0.9119 | 18% | 86% | 61% | 39% | 36% | 21% | breakdown 36% |
| ETH | 11-06 00:00 | 2235.43 | 26% | 63% | 51% | 46% | 34% | 32% | breakdown 26% |
| HBAR | 11-06 00:00 | 0.06753 | 16% | 76% | 43% | 28% | 54% | 42% | failed breakout 30% |
| LINK | 11-06 00:00 | 10.8375 | 32% | 58% | 57% | 47% | 46% | 44% | range 26% |
| LTC | 11-06 00:00 | 52.55 | 38% | 56% | 59% | 52% | 57% | 50% | range 27% |
| NEAR | 11-06 00:00 | 3.7086 | 16% | 74% | 45% | 27% | 44% | 35% | range 36% |
| SOL | 11-06 00:00 | 90.02 | 28% | 66% | 55% | 57% | 49% | 46% | failed breakout 25% |
| SUI | 11-06 00:00 | 0.868 | 42% | 61% | 66% | 49% | 52% | 40% | breakdown 24% |
| TON | 11-06 00:00 | 1.1 | 16% | 73% | 55% | 62% | 44% | 36% | range 28% |
| XRP | 11-06 00:00 | 1.17748 | 20% | 75% | 52% | 55% | 51% | 42% | range 27% |
| ZEC | 11-06 00:00 | 1321.24 | 57% | 33% | 35% | 59% | 39% | 41% | failed breakout 28% |

\* No proven skill yet: logged so the scorecard can test it, not to act on.

Earlier study: up/down and beat-BTC did not beat the base rate; new highs and lows did (docs/research/MULTI_TARGET_PANEL_2026-10-24.md). This page checks that out of sample, live.
