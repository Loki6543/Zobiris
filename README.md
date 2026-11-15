# Zobiris live prediction panel

Updated 2026-11-15 06:16 UTC. Current model `panel-logit-v3`, refit every run on each coin's own Kraken history. Research only: no trading authority.

1365 predictions logged; 2535 windows scored.

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
| panel-logit-v3 | 1d | 1d | closes higher | 315 | 0.245 | 0.242 | -0.011 |
| panel-logit-v3 | 1d | 1d | beats BTC | 315 | 0.245 | 0.244 | -0.003 |
| panel-logit-v3 | 1d | 1d | new 7-day high | 315 | 0.022 | 0.039 | +0.425 |
| panel-logit-v3 | 1d | 1d | new 7-day low | 315 | 0.221 | 0.284 | +0.222 |
| panel-logit-v3 | 1d | 1d | range widens | 315 | 0.224 | 0.250 | +0.106 |
| panel-logit-v3 | 1d | 1d | shape | 315 | 0.753 | 0.751 | -0.002 |
| panel-logit-v3 | 1d | 1d | volume rises | 315 | 0.213 | 0.251 | +0.153 |
| panel-logit-v3 | 1d | 7d | closes higher | 225 | 0.237 | 0.190 | -0.251 |
| panel-logit-v3 | 1d | 7d | beats BTC | 225 | 0.207 | 0.207 | +0.002 |
| panel-logit-v3 | 1d | 7d | new 7-day high | 225 | 0.142 | 0.183 | +0.227 |
| panel-logit-v3 | 1d | 7d | new 7-day low | 225 | 0.169 | 0.257 | +0.342 |
| panel-logit-v3 | 1d | 7d | range widens | 225 | 0.229 | 0.258 | +0.113 |
| panel-logit-v3 | 1d | 7d | shape | 225 | 0.799 | 0.793 | -0.007 |
| panel-logit-v3 | 1d | 7d | volume rises | 225 | 0.209 | 0.250 | +0.161 |
| panel-logit-v3 | 4h | 24h | closes higher | 945 | 0.278 | 0.247 | -0.125 |
| panel-logit-v3 | 4h | 24h | beats BTC | 945 | 0.265 | 0.242 | -0.098 |
| panel-logit-v3 | 4h | 24h | new 7-day high | 945 | 0.024 | 0.046 | +0.477 |
| panel-logit-v3 | 4h | 24h | new 7-day low | 945 | 0.225 | 0.265 | +0.151 |
| panel-logit-v3 | 4h | 24h | range widens | 945 | 0.234 | 0.252 | +0.072 |
| panel-logit-v3 | 4h | 24h | shape | 945 | 0.738 | 0.747 | +0.013 |
| panel-logit-v3 | 4h | 24h | volume rises | 945 | 0.218 | 0.251 | +0.132 |
| panel-logit-v3 | 4h | 4h | closes higher | 990 | 0.263 | 0.250 | -0.052 |
| panel-logit-v3 | 4h | 4h | beats BTC | 990 | 0.258 | 0.248 | -0.037 |
| panel-logit-v3 | 4h | 4h | new 7-day high | 990 | 0.005 | 0.009 | +0.408 |
| panel-logit-v3 | 4h | 4h | new 7-day low | 990 | 0.108 | 0.132 | +0.186 |
| panel-logit-v3 | 4h | 4h | range widens | 990 | 0.232 | 0.251 | +0.075 |
| panel-logit-v3 | 4h | 4h | shape | 990 | 0.658 | 0.689 | +0.044 |
| panel-logit-v3 | 4h | 4h | volume rises | 990 | 0.230 | 0.251 | +0.083 |

## Latest 4h chart, 24h ahead

| Coin | Candle (UTC) | Close | New high | New low | Range widens | Volume rises | Up* | Beats BTC* | Likeliest shape* |
|---|---|---:|---:|---:|---:|---:|---:|---:|---|
| ADA | 11-15 00:00 | 0.15045 | 2% | 54% | 11% | 28% | 64% | 71% | failed breakout 38% |
| AVAX | 11-15 00:00 | 7.15 | 1% | 37% | 25% | 22% | 62% | 49% | range 50% |
| COMP | 11-15 00:00 | 18.26 | 2% | 27% | 44% | 20% | 46% | 61% | range 42% |
| DOGE | 11-15 00:00 | 0.0588304 | 2% | 62% | 8% | 9% | 46% | 64% | range 60% |
| DOT | 11-15 00:00 | 0.7204 | 1% | 67% | 30% | 24% | 44% | 51% | range 52% |
| ETH | 11-15 00:00 | 1818.02 | 2% | 49% | 13% | 27% | 43% | 56% | range 43% |
| HBAR | 11-15 00:00 | 0.05758 | 4% | 31% | 24% | 34% | 46% | 50% | range 58% |
| LINK | 11-15 00:00 | 9.11692 | 2% | 54% | 16% | 19% | 46% | 49% | range 48% |
| LTC | 11-15 00:00 | 44.9 | 0% | 47% | 9% | 6% | 53% | 44% | range 64% |
| NEAR | 11-15 00:00 | 3.1343 | 4% | 56% | 40% | 30% | 65% | 66% | range 35% |
| SOL | 11-15 00:00 | 71.32 | 1% | 56% | 12% | 10% | 31% | 19% | range 55% |
| SUI | 11-15 00:00 | 0.7211 | 2% | 51% | 11% | 16% | 71% | 78% | range 43% |
| TON | 11-15 00:00 | 1.047 | 3% | 11% | 22% | 21% | 42% | 52% | range 53% |
| XRP | 11-15 00:00 | 0.96662 | 3% | 42% | 20% | 30% | 40% | 45% | range 55% |
| ZEC | 11-15 00:00 | 912.73 | 6% | 40% | 28% | 56% | 35% | 51% | range 31% |

## Latest 1d chart, 7d ahead

| Coin | Candle (UTC) | Close | New high | New low | Range widens | Volume rises | Up* | Beats BTC* | Likeliest shape* |
|---|---|---:|---:|---:|---:|---:|---:|---:|---|
| ADA | 11-14 00:00 | 0.14758 | 3% | 70% | 18% | 35% | 49% | 52% | failed breakout 27% |
| AVAX | 11-14 00:00 | 7.103 | 6% | 87% | 45% | 29% | 53% | 72% | failed breakout 29% |
| COMP | 11-14 00:00 | 17.92 | 19% | 80% | 63% | 51% | 45% | 36% | failed breakout 32% |
| DOGE | 11-14 00:00 | 0.057328 | 1% | 78% | 20% | 32% | 60% | 48% | range 36% |
| DOT | 11-14 00:00 | 0.7063 | 3% | 76% | 21% | 19% | 41% | 28% | range 49% |
| ETH | 11-14 00:00 | 1768.03 | 2% | 81% | 24% | 24% | 43% | 48% | failed breakout 26% |
| HBAR | 11-14 00:00 | 0.05627 | 17% | 79% | 46% | 51% | 65% | 70% | failed breakout 52% |
| LINK | 11-14 00:00 | 8.88095 | 4% | 81% | 30% | 34% | 50% | 68% | failed breakout 29% |
| LTC | 11-14 00:00 | 44.49 | 4% | 82% | 37% | 32% | 50% | 48% | range 33% |
| NEAR | 11-14 00:00 | 3.031 | 4% | 77% | 23% | 20% | 35% | 28% | range 36% |
| SOL | 11-14 00:00 | 70.24 | 2% | 84% | 39% | 42% | 54% | 45% | failed breakout 36% |
| SUI | 11-14 00:00 | 0.7005 | 2% | 77% | 40% | 13% | 44% | 30% | range 33% |
| TON | 11-14 00:00 | 1.042 | 6% | 77% | 33% | 28% | 52% | 49% | range 32% |
| XRP | 11-14 00:00 | 0.91397 | 15% | 80% | 56% | 64% | 71% | 69% | failed breakout 45% |
| ZEC | 11-14 00:00 | 863.4 | 11% | 77% | 45% | 30% | 55% | 54% | failed breakout 41% |

\* No proven skill yet: logged so the scorecard can test it, not to act on.

Earlier study: up/down and beat-BTC did not beat the base rate; new highs and lows did (docs/research/MULTI_TARGET_PANEL_2026-10-24.md). This page checks that out of sample, live.
