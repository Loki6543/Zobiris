# Zobiris live prediction panel

Updated 2026-10-30 20:43 UTC. Current model `panel-logit-v3`, refit every run on each coin's own Kraken history. Research only: no trading authority.

450 predictions logged; 720 windows scored.

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
| panel-logit-v3 | 4h | 24h | closes higher | 285 | 0.255 | 0.248 | -0.031 |
| panel-logit-v3 | 4h | 24h | beats BTC | 285 | 0.255 | 0.246 | -0.035 |
| panel-logit-v3 | 4h | 24h | new 7-day high | 285 | 0.022 | 0.045 | +0.508 |
| panel-logit-v3 | 4h | 24h | new 7-day low | 285 | 0.229 | 0.254 | +0.099 |
| panel-logit-v3 | 4h | 24h | range widens | 285 | 0.270 | 0.252 | -0.075 |
| panel-logit-v3 | 4h | 24h | shape | 285 | 0.775 | 0.749 | -0.035 |
| panel-logit-v3 | 4h | 24h | volume rises | 285 | 0.262 | 0.252 | -0.041 |
| panel-logit-v3 | 4h | 4h | closes higher | 315 | 0.252 | 0.251 | -0.001 |
| panel-logit-v3 | 4h | 4h | beats BTC | 315 | 0.262 | 0.254 | -0.031 |
| panel-logit-v3 | 4h | 4h | new 7-day high | 315 | 0.004 | 0.007 | +0.498 |
| panel-logit-v3 | 4h | 4h | new 7-day low | 315 | 0.088 | 0.094 | +0.067 |
| panel-logit-v3 | 4h | 4h | range widens | 315 | 0.221 | 0.251 | +0.117 |
| panel-logit-v3 | 4h | 4h | shape | 315 | 0.696 | 0.710 | +0.020 |
| panel-logit-v3 | 4h | 4h | volume rises | 315 | 0.219 | 0.251 | +0.128 |

## Latest 4h chart, 24h ahead

| Coin | Candle (UTC) | Close | New high | New low | Range widens | Volume rises | Up* | Beats BTC* | Likeliest shape* |
|---|---|---:|---:|---:|---:|---:|---:|---:|---|
| ADA | 10-30 16:00 | 0.192924 | 6% | 25% | 24% | 42% | 87% | 83% | trend up 53% |
| AVAX | 10-30 16:00 | 8.419 | 15% | 56% | 9% | 13% | 69% | 74% | range 54% |
| COMP | 10-30 16:00 | 20.19 | 4% | 50% | 27% | 19% | 84% | 78% | trend up 50% |
| DOGE | 10-30 16:00 | 0.0752793 | 6% | 19% | 15% | 9% | 81% | 78% | range 55% |
| DOT | 10-30 16:00 | 0.9742 | 12% | 12% | 27% | 42% | 90% | 83% | trend up 69% |
| ETH | 10-30 16:00 | 2235.81 | 3% | 23% | 29% | 19% | 72% | 59% | range 54% |
| HBAR | 10-30 16:00 | 0.07154 | 5% | 39% | 8% | 10% | 60% | 41% | range 49% |
| LINK | 10-30 16:00 | 11.1061 | 6% | 58% | 13% | 13% | 71% | 52% | range 54% |
| LTC | 10-30 16:00 | 55.36 | 4% | 50% | 36% | 22% | 67% | 61% | range 48% |
| NEAR | 10-30 16:00 | 4.3323 | 9% | 16% | 43% | 35% | 76% | 68% | trend up 43% |
| SOL | 10-30 16:00 | 94.57 | 1% | 43% | 8% | 12% | 80% | 52% | range 60% |
| SUI | 10-30 16:00 | 0.8898 | 7% | 14% | 14% | 10% | 80% | 77% | range 51% |
| TON | 10-30 16:00 | 1.165 | 1% | 40% | 23% | 24% | 72% | 60% | range 53% |
| XRP | 10-30 16:00 | 1.24874 | 2% | 16% | 11% | 15% | 78% | 64% | range 62% |
| ZEC | 10-30 16:00 | 1227.32 | 11% | 6% | 35% | 25% | 88% | 84% | range 49% |

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
