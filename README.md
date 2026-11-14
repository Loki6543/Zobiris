# Zobiris live prediction panel

Updated 2026-11-14 11:24 UTC. Current model `panel-logit-v3`, refit every run on each coin's own Kraken history. Research only: no trading authority.

1305 predictions logged; 2415 windows scored.

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
| panel-logit-v3 | 1d | 1d | closes higher | 300 | 0.245 | 0.243 | -0.007 |
| panel-logit-v3 | 1d | 1d | beats BTC | 300 | 0.246 | 0.246 | +0.002 |
| panel-logit-v3 | 1d | 1d | new 7-day high | 300 | 0.023 | 0.039 | +0.408 |
| panel-logit-v3 | 1d | 1d | new 7-day low | 300 | 0.218 | 0.267 | +0.184 |
| panel-logit-v3 | 1d | 1d | range widens | 300 | 0.217 | 0.250 | +0.130 |
| panel-logit-v3 | 1d | 1d | shape | 300 | 0.743 | 0.735 | -0.010 |
| panel-logit-v3 | 1d | 1d | volume rises | 300 | 0.205 | 0.251 | +0.183 |
| panel-logit-v3 | 1d | 7d | closes higher | 210 | 0.237 | 0.190 | -0.244 |
| panel-logit-v3 | 1d | 7d | beats BTC | 210 | 0.208 | 0.207 | -0.006 |
| panel-logit-v3 | 1d | 7d | new 7-day high | 210 | 0.143 | 0.183 | +0.219 |
| panel-logit-v3 | 1d | 7d | new 7-day low | 210 | 0.172 | 0.258 | +0.333 |
| panel-logit-v3 | 1d | 7d | range widens | 210 | 0.227 | 0.257 | +0.115 |
| panel-logit-v3 | 1d | 7d | shape | 210 | 0.797 | 0.793 | -0.005 |
| panel-logit-v3 | 1d | 7d | volume rises | 210 | 0.206 | 0.249 | +0.171 |
| panel-logit-v3 | 4h | 24h | closes higher | 900 | 0.274 | 0.248 | -0.105 |
| panel-logit-v3 | 4h | 24h | beats BTC | 900 | 0.262 | 0.243 | -0.079 |
| panel-logit-v3 | 4h | 24h | new 7-day high | 900 | 0.025 | 0.047 | +0.466 |
| panel-logit-v3 | 4h | 24h | new 7-day low | 900 | 0.220 | 0.252 | +0.126 |
| panel-logit-v3 | 4h | 24h | range widens | 900 | 0.219 | 0.252 | +0.131 |
| panel-logit-v3 | 4h | 24h | shape | 900 | 0.716 | 0.733 | +0.023 |
| panel-logit-v3 | 4h | 24h | volume rises | 900 | 0.214 | 0.251 | +0.147 |
| panel-logit-v3 | 4h | 4h | closes higher | 945 | 0.259 | 0.250 | -0.035 |
| panel-logit-v3 | 4h | 4h | beats BTC | 945 | 0.255 | 0.248 | -0.026 |
| panel-logit-v3 | 4h | 4h | new 7-day high | 945 | 0.005 | 0.009 | +0.396 |
| panel-logit-v3 | 4h | 4h | new 7-day low | 945 | 0.103 | 0.112 | +0.084 |
| panel-logit-v3 | 4h | 4h | range widens | 945 | 0.231 | 0.252 | +0.082 |
| panel-logit-v3 | 4h | 4h | shape | 945 | 0.648 | 0.681 | +0.048 |
| panel-logit-v3 | 4h | 4h | volume rises | 945 | 0.223 | 0.251 | +0.109 |

## Latest 4h chart, 24h ahead

| Coin | Candle (UTC) | Close | New high | New low | Range widens | Volume rises | Up* | Beats BTC* | Likeliest shape* |
|---|---|---:|---:|---:|---:|---:|---:|---:|---|
| ADA | 11-14 04:00 | 0.162671 | 2% | 65% | 21% | 33% | 54% | 56% | range 54% |
| AVAX | 11-14 04:00 | 8 | 4% | 28% | 30% | 31% | 64% | 69% | range 64% |
| COMP | 11-14 04:00 | 19.03 | 2% | 24% | 41% | 28% | 42% | 57% | range 63% |
| DOGE | 11-14 04:00 | 0.0625709 | 2% | 58% | 25% | 21% | 62% | 68% | range 71% |
| DOT | 11-14 04:00 | 0.7824 | 1% | 64% | 39% | 25% | 43% | 46% | range 50% |
| ETH | 11-14 04:00 | 1896.92 | 2% | 45% | 26% | 28% | 71% | 73% | range 45% |
| HBAR | 11-14 04:00 | 0.05966 | 2% | 56% | 15% | 23% | 47% | 52% | range 60% |
| LINK | 11-14 04:00 | 9.57079 | 2% | 62% | 21% | 20% | 67% | 60% | range 64% |
| LTC | 11-14 04:00 | 48.23 | 2% | 43% | 20% | 18% | 47% | 50% | range 54% |
| NEAR | 11-14 04:00 | 3.3162 | 3% | 63% | 47% | 36% | 79% | 80% | range 48% |
| SOL | 11-14 04:00 | 75.18 | 0% | 62% | 17% | 13% | 46% | 42% | range 67% |
| SUI | 11-14 04:00 | 0.7695 | 2% | 43% | 20% | 21% | 66% | 66% | range 58% |
| TON | 11-14 04:00 | 1.082 | 2% | 13% | 19% | 15% | 72% | 66% | range 60% |
| XRP | 11-14 04:00 | 0.98219 | 0% | 74% | 15% | 25% | 65% | 61% | range 50% |
| ZEC | 11-14 04:00 | 909.2 | 3% | 61% | 47% | 36% | 54% | 70% | range 30% |

## Latest 1d chart, 7d ahead

| Coin | Candle (UTC) | Close | New high | New low | Range widens | Volume rises | Up* | Beats BTC* | Likeliest shape* |
|---|---|---:|---:|---:|---:|---:|---:|---:|---|
| ADA | 11-13 00:00 | 0.168325 | 16% | 72% | 41% | 59% | 43% | 40% | failed breakout 31% |
| AVAX | 11-13 00:00 | 8.228 | 27% | 67% | 57% | 47% | 50% | 56% | breakdown 28% |
| COMP | 11-13 00:00 | 19.18 | 25% | 80% | 58% | 46% | 39% | 33% | failed breakout 32% |
| DOGE | 11-13 00:00 | 0.0644614 | 7% | 75% | 36% | 49% | 48% | 36% | range 34% |
| DOT | 11-13 00:00 | 0.8178 | 13% | 77% | 40% | 31% | 36% | 18% | failed breakout 27% |
| ETH | 11-13 00:00 | 1927.29 | 8% | 78% | 42% | 43% | 38% | 41% | trend down 24% |
| HBAR | 11-13 00:00 | 0.06149 | 29% | 76% | 56% | 54% | 57% | 58% | failed breakout 40% |
| LINK | 11-13 00:00 | 9.84733 | 14% | 79% | 47% | 48% | 47% | 54% | breakdown 25% |
| LTC | 11-13 00:00 | 49.34 | 19% | 68% | 48% | 50% | 43% | 38% | breakdown 22% |
| NEAR | 11-13 00:00 | 3.4379 | 15% | 68% | 41% | 35% | 40% | 33% | range 27% |
| SOL | 11-13 00:00 | 78.09 | 10% | 81% | 54% | 55% | 49% | 39% | failed breakout 29% |
| SUI | 11-13 00:00 | 0.7953 | 11% | 66% | 50% | 25% | 42% | 29% | range 27% |
| TON | 11-13 00:00 | 1.092 | 11% | 68% | 36% | 26% | 45% | 43% | range 31% |
| XRP | 11-13 00:00 | 1.00975 | 24% | 76% | 62% | 69% | 63% | 52% | failed breakout 31% |
| ZEC | 11-13 00:00 | 933.6 | 16% | 78% | 49% | 33% | 59% | 57% | failed breakout 33% |

\* No proven skill yet: logged so the scorecard can test it, not to act on.

Earlier study: up/down and beat-BTC did not beat the base rate; new highs and lows did (docs/research/MULTI_TARGET_PANEL_2026-10-24.md). This page checks that out of sample, live.
