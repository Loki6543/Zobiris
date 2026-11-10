# Zobiris live prediction panel

Updated 2026-11-10 21:47 UTC. Current model `panel-logit-v3`, refit every run on each coin's own Kraken history. Research only: no trading authority.

1095 predictions logged; 2010 windows scored.

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
| panel-logit-v3 | 1d | 1d | closes higher | 240 | 0.246 | 0.247 | +0.003 |
| panel-logit-v3 | 1d | 1d | beats BTC | 240 | 0.239 | 0.240 | +0.003 |
| panel-logit-v3 | 1d | 1d | new 7-day high | 240 | 0.022 | 0.037 | +0.399 |
| panel-logit-v3 | 1d | 1d | new 7-day low | 240 | 0.193 | 0.224 | +0.141 |
| panel-logit-v3 | 1d | 1d | range widens | 240 | 0.213 | 0.249 | +0.143 |
| panel-logit-v3 | 1d | 1d | shape | 240 | 0.745 | 0.741 | -0.006 |
| panel-logit-v3 | 1d | 1d | volume rises | 240 | 0.192 | 0.251 | +0.235 |
| panel-logit-v3 | 1d | 7d | closes higher | 150 | 0.239 | 0.189 | -0.267 |
| panel-logit-v3 | 1d | 7d | beats BTC | 150 | 0.196 | 0.190 | -0.034 |
| panel-logit-v3 | 1d | 7d | new 7-day high | 150 | 0.135 | 0.182 | +0.258 |
| panel-logit-v3 | 1d | 7d | new 7-day low | 150 | 0.159 | 0.258 | +0.384 |
| panel-logit-v3 | 1d | 7d | range widens | 150 | 0.228 | 0.257 | +0.113 |
| panel-logit-v3 | 1d | 7d | shape | 150 | 0.802 | 0.797 | -0.007 |
| panel-logit-v3 | 1d | 7d | volume rises | 150 | 0.196 | 0.256 | +0.236 |
| panel-logit-v3 | 4h | 24h | closes higher | 765 | 0.278 | 0.249 | -0.117 |
| panel-logit-v3 | 4h | 24h | beats BTC | 765 | 0.259 | 0.239 | -0.083 |
| panel-logit-v3 | 4h | 24h | new 7-day high | 765 | 0.026 | 0.043 | +0.403 |
| panel-logit-v3 | 4h | 24h | new 7-day low | 765 | 0.212 | 0.221 | +0.040 |
| panel-logit-v3 | 4h | 24h | range widens | 765 | 0.218 | 0.252 | +0.135 |
| panel-logit-v3 | 4h | 24h | shape | 765 | 0.698 | 0.718 | +0.027 |
| panel-logit-v3 | 4h | 24h | volume rises | 765 | 0.211 | 0.251 | +0.159 |
| panel-logit-v3 | 4h | 4h | closes higher | 795 | 0.258 | 0.250 | -0.030 |
| panel-logit-v3 | 4h | 4h | beats BTC | 795 | 0.256 | 0.248 | -0.031 |
| panel-logit-v3 | 4h | 4h | new 7-day high | 795 | 0.006 | 0.009 | +0.350 |
| panel-logit-v3 | 4h | 4h | new 7-day low | 795 | 0.093 | 0.101 | +0.073 |
| panel-logit-v3 | 4h | 4h | range widens | 795 | 0.228 | 0.252 | +0.096 |
| panel-logit-v3 | 4h | 4h | shape | 795 | 0.637 | 0.676 | +0.057 |
| panel-logit-v3 | 4h | 4h | volume rises | 795 | 0.224 | 0.251 | +0.108 |

## Latest 4h chart, 24h ahead

| Coin | Candle (UTC) | Close | New high | New low | Range widens | Volume rises | Up* | Beats BTC* | Likeliest shape* |
|---|---|---:|---:|---:|---:|---:|---:|---:|---|
| ADA | 11-10 16:00 | 0.173758 | 5% | 32% | 37% | 47% | 48% | 41% | range 38% |
| AVAX | 11-10 16:00 | 8.254 | 2% | 11% | 24% | 31% | 42% | 32% | range 68% |
| COMP | 11-10 16:00 | 19.84 | 5% | 18% | 66% | 55% | 44% | 45% | range 32% |
| DOGE | 11-10 16:00 | 0.0673838 | 2% | 46% | 33% | 40% | 70% | 63% | range 43% |
| DOT | 11-10 16:00 | 0.836 | 1% | 58% | 40% | 39% | 38% | 28% | range 39% |
| ETH | 11-10 16:00 | 2042.5 | 2% | 31% | 32% | 43% | 68% | 56% | range 47% |
| HBAR | 11-10 16:00 | 0.06596 | 6% | 37% | 44% | 42% | 37% | 33% | range 38% |
| LINK | 11-10 16:00 | 10.3037 | 3% | 41% | 44% | 50% | 52% | 47% | range 44% |
| LTC | 11-10 16:00 | 50.3 | 2% | 44% | 41% | 45% | 44% | 31% | range 39% |
| NEAR | 11-10 16:00 | 3.575 | 4% | 45% | 40% | 47% | 45% | 42% | range 41% |
| SOL | 11-10 16:00 | 82.86 | 2% | 58% | 40% | 37% | 59% | 33% | range 39% |
| SUI | 11-10 16:00 | 0.8173 | 3% | 31% | 40% | 26% | 56% | 50% | range 44% |
| TON | 11-10 16:00 | 1.103 | 13% | 6% | 40% | 56% | 35% | 20% | range 42% |
| XRP | 11-10 16:00 | 1.06476 | 5% | 68% | 35% | 42% | 66% | 60% | failed breakout 32% |
| ZEC | 11-10 16:00 | 1032.25 | 2% | 66% | 29% | 33% | 73% | 71% | trend up 43% |

## Latest 1d chart, 7d ahead

| Coin | Candle (UTC) | Close | New high | New low | Range widens | Volume rises | Up* | Beats BTC* | Likeliest shape* |
|---|---|---:|---:|---:|---:|---:|---:|---:|---|
| ADA | 11-09 00:00 | 0.17736 | 35% | 58% | 60% | 59% | 54% | 45% | breakdown 22% |
| AVAX | 11-09 00:00 | 8.645 | 54% | 30% | 59% | 70% | 41% | 41% | failed breakout 21% |
| COMP | 11-09 00:00 | 20.01 | 53% | 50% | 58% | 58% | 41% | 36% | failed breakout 25% |
| DOGE | 11-09 00:00 | 0.0699705 | 20% | 57% | 48% | 47% | 42% | 28% | range 36% |
| DOT | 11-09 00:00 | 0.8563 | 24% | 80% | 64% | 56% | 46% | 31% | breakdown 26% |
| ETH | 11-09 00:00 | 2132.65 | 20% | 62% | 48% | 44% | 34% | 34% | range 25% |
| HBAR | 11-09 00:00 | 0.06679 | 26% | 65% | 46% | 35% | 56% | 40% | failed breakout 29% |
| LINK | 11-09 00:00 | 10.6426 | 32% | 55% | 58% | 46% | 42% | 42% | range 25% |
| LTC | 11-09 00:00 | 51.37 | 39% | 47% | 54% | 51% | 55% | 48% | range 33% |
| NEAR | 11-09 00:00 | 3.6262 | 24% | 60% | 48% | 31% | 39% | 34% | range 31% |
| SOL | 11-09 00:00 | 86.61 | 25% | 67% | 52% | 55% | 46% | 45% | breakdown 27% |
| SUI | 11-09 00:00 | 0.8443 | 34% | 53% | 56% | 48% | 47% | 43% | range 36% |
| TON | 11-09 00:00 | 1.039 | 15% | 60% | 43% | 58% | 40% | 38% | range 37% |
| XRP | 11-09 00:00 | 1.0976 | 27% | 66% | 59% | 52% | 62% | 57% | range 25% |
| ZEC | 11-09 00:00 | 1163.44 | 22% | 65% | 38% | 40% | 42% | 44% | range 24% |

\* No proven skill yet: logged so the scorecard can test it, not to act on.

Earlier study: up/down and beat-BTC did not beat the base rate; new highs and lows did (docs/research/MULTI_TARGET_PANEL_2026-10-24.md). This page checks that out of sample, live.
