# Zobiris live prediction panel

Updated 2026-11-10 12:31 UTC. Current model `panel-logit-v3`, refit every run on each coin's own Kraken history. Research only: no trading authority.

1080 predictions logged; 1980 windows scored.

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
| panel-logit-v3 | 4h | 24h | closes higher | 750 | 0.279 | 0.249 | -0.119 |
| panel-logit-v3 | 4h | 24h | beats BTC | 750 | 0.260 | 0.239 | -0.084 |
| panel-logit-v3 | 4h | 24h | new 7-day high | 750 | 0.026 | 0.044 | +0.413 |
| panel-logit-v3 | 4h | 24h | new 7-day low | 750 | 0.208 | 0.217 | +0.042 |
| panel-logit-v3 | 4h | 24h | range widens | 750 | 0.216 | 0.252 | +0.142 |
| panel-logit-v3 | 4h | 24h | shape | 750 | 0.692 | 0.712 | +0.027 |
| panel-logit-v3 | 4h | 24h | volume rises | 750 | 0.211 | 0.251 | +0.161 |
| panel-logit-v3 | 4h | 4h | closes higher | 780 | 0.257 | 0.250 | -0.025 |
| panel-logit-v3 | 4h | 4h | beats BTC | 780 | 0.256 | 0.248 | -0.028 |
| panel-logit-v3 | 4h | 4h | new 7-day high | 780 | 0.006 | 0.009 | +0.345 |
| panel-logit-v3 | 4h | 4h | new 7-day low | 780 | 0.086 | 0.092 | +0.064 |
| panel-logit-v3 | 4h | 4h | range widens | 780 | 0.227 | 0.252 | +0.099 |
| panel-logit-v3 | 4h | 4h | shape | 780 | 0.631 | 0.670 | +0.059 |
| panel-logit-v3 | 4h | 4h | volume rises | 780 | 0.222 | 0.251 | +0.115 |

## Latest 4h chart, 24h ahead

| Coin | Candle (UTC) | Close | New high | New low | Range widens | Volume rises | Up* | Beats BTC* | Likeliest shape* |
|---|---|---:|---:|---:|---:|---:|---:|---:|---|
| ADA | 11-10 08:00 | 0.17796 | 5% | 30% | 57% | 56% | 43% | 32% | range 40% |
| AVAX | 11-10 08:00 | 8.301 | 3% | 10% | 21% | 17% | 40% | 41% | range 55% |
| COMP | 11-10 08:00 | 20.14 | 11% | 11% | 74% | 66% | 40% | 37% | range 33% |
| DOGE | 11-10 08:00 | 0.0693391 | 3% | 40% | 65% | 62% | 58% | 48% | range 35% |
| DOT | 11-10 08:00 | 0.8545 | 2% | 55% | 46% | 48% | 35% | 26% | range 44% |
| ETH | 11-10 08:00 | 2091.4 | 2% | 22% | 47% | 58% | 70% | 55% | range 42% |
| HBAR | 11-10 08:00 | 0.06643 | 3% | 38% | 48% | 47% | 37% | 36% | range 42% |
| LINK | 11-10 08:00 | 10.4457 | 2% | 38% | 53% | 52% | 50% | 46% | range 44% |
| LTC | 11-10 08:00 | 51.25 | 3% | 36% | 54% | 61% | 47% | 34% | range 35% |
| NEAR | 11-10 08:00 | 3.6051 | 2% | 34% | 61% | 55% | 54% | 49% | range 49% |
| SOL | 11-10 08:00 | 84.6 | 1% | 62% | 62% | 62% | 58% | 34% | range 29% |
| SUI | 11-10 08:00 | 0.8318 | 4% | 26% | 57% | 42% | 57% | 55% | trend up 34% |
| TON | 11-10 08:00 | 1.085 | 6% | 14% | 55% | 55% | 27% | 20% | range 39% |
| XRP | 11-10 08:00 | 1.07773 | 2% | 81% | 54% | 62% | 69% | 62% | failed breakout 38% |
| ZEC | 11-10 08:00 | 1149.17 | 6% | 36% | 62% | 53% | 57% | 54% | trend up 37% |

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
