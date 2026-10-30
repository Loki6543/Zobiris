# Zobiris live prediction panel

Updated 2026-10-30 15:00 UTC. Current model `panel-logit-v3`, refit every run on each coin's own Kraken history. Research only: no trading authority.

435 predictions logged; 690 windows scored.

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
| panel-logit-v3 | 1d | 1d | closes higher | 75 | 0.244 | 0.242 | -0.008 |
| panel-logit-v3 | 1d | 1d | beats BTC | 75 | 0.240 | 0.240 | +0.002 |
| panel-logit-v3 | 1d | 1d | new 7-day high | 75 | 0.019 | 0.035 | +0.462 |
| panel-logit-v3 | 1d | 1d | new 7-day low | 75 | 0.210 | 0.207 | -0.016 |
| panel-logit-v3 | 1d | 1d | range widens | 75 | 0.216 | 0.253 | +0.146 |
| panel-logit-v3 | 1d | 1d | shape | 75 | 0.727 | 0.703 | -0.034 |
| panel-logit-v3 | 1d | 1d | volume rises | 75 | 0.217 | 0.251 | +0.135 |
| panel-logit-v3 | 4h | 24h | closes higher | 270 | 0.253 | 0.248 | -0.020 |
| panel-logit-v3 | 4h | 24h | beats BTC | 270 | 0.255 | 0.244 | -0.047 |
| panel-logit-v3 | 4h | 24h | new 7-day high | 270 | 0.023 | 0.045 | +0.497 |
| panel-logit-v3 | 4h | 24h | new 7-day low | 270 | 0.211 | 0.232 | +0.090 |
| panel-logit-v3 | 4h | 24h | range widens | 270 | 0.263 | 0.252 | -0.046 |
| panel-logit-v3 | 4h | 24h | shape | 270 | 0.768 | 0.747 | -0.029 |
| panel-logit-v3 | 4h | 24h | volume rises | 270 | 0.252 | 0.251 | -0.001 |
| panel-logit-v3 | 4h | 4h | closes higher | 300 | 0.252 | 0.251 | -0.002 |
| panel-logit-v3 | 4h | 4h | beats BTC | 300 | 0.259 | 0.254 | -0.021 |
| panel-logit-v3 | 4h | 4h | new 7-day high | 300 | 0.004 | 0.007 | +0.483 |
| panel-logit-v3 | 4h | 4h | new 7-day low | 300 | 0.091 | 0.099 | +0.081 |
| panel-logit-v3 | 4h | 4h | range widens | 300 | 0.214 | 0.250 | +0.143 |
| panel-logit-v3 | 4h | 4h | shape | 300 | 0.704 | 0.717 | +0.018 |
| panel-logit-v3 | 4h | 4h | volume rises | 300 | 0.211 | 0.251 | +0.159 |

## Latest 4h chart, 24h ahead

| Coin | Candle (UTC) | Close | New high | New low | Range widens | Volume rises | Up* | Beats BTC* | Likeliest shape* |
|---|---|---:|---:|---:|---:|---:|---:|---:|---|
| ADA | 10-30 08:00 | 0.192754 | 7% | 32% | 24% | 44% | 87% | 85% | trend up 56% |
| AVAX | 10-30 08:00 | 8.401 | 12% | 57% | 11% | 13% | 66% | 71% | range 54% |
| COMP | 10-30 08:00 | 20.22 | 4% | 54% | 25% | 16% | 79% | 78% | trend up 54% |
| DOGE | 10-30 08:00 | 0.0757132 | 8% | 14% | 13% | 6% | 78% | 79% | range 62% |
| DOT | 10-30 08:00 | 0.9407 | 4% | 31% | 26% | 28% | 91% | 84% | trend up 67% |
| ETH | 10-30 08:00 | 2232.89 | 3% | 21% | 10% | 5% | 71% | 63% | range 49% |
| HBAR | 10-30 08:00 | 0.07194 | 8% | 35% | 7% | 8% | 53% | 40% | range 41% |
| LINK | 10-30 08:00 | 11.0642 | 4% | 56% | 6% | 6% | 71% | 50% | range 55% |
| LTC | 10-30 08:00 | 55.03 | 3% | 62% | 36% | 17% | 72% | 72% | range 44% |
| NEAR | 10-30 08:00 | 4.3082 | 8% | 21% | 32% | 18% | 76% | 67% | trend up 42% |
| SOL | 10-30 08:00 | 96.4 | 2% | 32% | 4% | 5% | 72% | 52% | range 62% |
| SUI | 10-30 08:00 | 0.8844 | 7% | 15% | 10% | 6% | 84% | 79% | range 51% |
| TON | 10-30 08:00 | 1.164 | 1% | 44% | 24% | 26% | 77% | 65% | range 47% |
| XRP | 10-30 08:00 | 1.24499 | 1% | 33% | 10% | 11% | 80% | 72% | range 53% |
| ZEC | 10-30 08:00 | 1238.28 | 13% | 7% | 27% | 20% | 86% | 84% | range 43% |

## Latest 1d chart, 7d ahead

| Coin | Candle (UTC) | Close | New high | New low | Range widens | Volume rises | Up* | Beats BTC* | Likeliest shape* |
|---|---|---:|---:|---:|---:|---:|---:|---:|---|
| ADA | 10-29 00:00 | 0.190074 | 18% | 79% | 57% | 58% | 52% | 46% | breakdown 28% |
| AVAX | 10-29 00:00 | 8.267 | 20% | 81% | 72% | 71% | 49% | 53% | failed breakout 27% |
| COMP | 10-29 00:00 | 20.98 | 14% | 83% | 41% | 28% | 35% | 38% | breakdown 35% |
| DOGE | 10-29 00:00 | 0.0750898 | 14% | 77% | 46% | 58% | 52% | 43% | range 27% |
| DOT | 10-29 00:00 | 0.9084 | 10% | 77% | 41% | 42% | 47% | 27% | range 32% |
| ETH | 10-29 00:00 | 2249.01 | 17% | 76% | 61% | 65% | 50% | 39% | trend down 28% |
| HBAR | 10-29 00:00 | 0.06887 | 26% | 67% | 57% | 71% | 78% | 66% | failed breakout 59% |
| LINK | 10-29 00:00 | 10.599 | 18% | 74% | 61% | 51% | 60% | 59% | failed breakout 26% |
| LTC | 10-29 00:00 | 54.84 | 21% | 70% | 55% | 59% | 65% | 50% | range 29% |
| NEAR | 10-29 00:00 | 4.0495 | 11% | 86% | 32% | 20% | 41% | 28% | breakdown 27% |
| SOL | 10-29 00:00 | 95.4 | 24% | 78% | 61% | 65% | 60% | 48% | failed breakout 32% |
| SUI | 10-29 00:00 | 0.868 | 14% | 73% | 61% | 44% | 57% | 41% | breakdown 25% |
| TON | 10-29 00:00 | 1.156 | 12% | 83% | 60% | 65% | 50% | 35% | failed breakout 33% |
| XRP | 10-29 00:00 | 1.23455 | 27% | 78% | 62% | 64% | 63% | 50% | range 26% |
| ZEC | 10-29 00:00 | 1219.13 | 39% | 57% | 47% | 60% | 52% | 54% | failed breakout 26% |

\* No proven skill yet: logged so the scorecard can test it, not to act on.

Earlier study: up/down and beat-BTC did not beat the base rate; new highs and lows did (docs/research/MULTI_TARGET_PANEL_2026-10-24.md). This page checks that out of sample, live.
