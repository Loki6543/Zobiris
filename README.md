# Zobiris live prediction panel

Updated 2026-10-27 14:23 UTC. Current model `panel-logit-v3`, refit every run on each coin's own Kraken history. Research only: no trading authority.

255 predictions logged; 375 windows scored.

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
| panel-logit-v3 | 1d | 1d | closes higher | 30 | 0.241 | 0.239 | -0.008 |
| panel-logit-v3 | 1d | 1d | beats BTC | 30 | 0.243 | 0.243 | +0.001 |
| panel-logit-v3 | 1d | 1d | new 7-day high | 30 | 0.004 | 0.027 | +0.837 |
| panel-logit-v3 | 1d | 1d | new 7-day low | 30 | 0.142 | 0.134 | -0.059 |
| panel-logit-v3 | 1d | 1d | range widens | 30 | 0.223 | 0.244 | +0.085 |
| panel-logit-v3 | 1d | 1d | shape | 30 | 0.592 | 0.553 | -0.070 |
| panel-logit-v3 | 1d | 1d | volume rises | 30 | 0.208 | 0.248 | +0.164 |
| panel-logit-v3 | 4h | 24h | closes higher | 135 | 0.248 | 0.247 | -0.001 |
| panel-logit-v3 | 4h | 24h | beats BTC | 135 | 0.266 | 0.254 | -0.047 |
| panel-logit-v3 | 4h | 24h | new 7-day high | 135 | 0.004 | 0.035 | +0.882 |
| panel-logit-v3 | 4h | 24h | new 7-day low | 135 | 0.205 | 0.190 | -0.076 |
| panel-logit-v3 | 4h | 24h | range widens | 135 | 0.243 | 0.250 | +0.028 |
| panel-logit-v3 | 4h | 24h | shape | 135 | 0.719 | 0.682 | -0.054 |
| panel-logit-v3 | 4h | 24h | volume rises | 135 | 0.218 | 0.245 | +0.110 |
| panel-logit-v3 | 4h | 4h | closes higher | 165 | 0.253 | 0.253 | +0.000 |
| panel-logit-v3 | 4h | 4h | beats BTC | 165 | 0.266 | 0.256 | -0.040 |
| panel-logit-v3 | 4h | 4h | new 7-day high | 165 | 0.000 | 0.005 | +0.931 |
| panel-logit-v3 | 4h | 4h | new 7-day low | 165 | 0.096 | 0.107 | +0.100 |
| panel-logit-v3 | 4h | 4h | range widens | 165 | 0.208 | 0.248 | +0.164 |
| panel-logit-v3 | 4h | 4h | shape | 165 | 0.694 | 0.700 | +0.009 |
| panel-logit-v3 | 4h | 4h | volume rises | 165 | 0.198 | 0.251 | +0.210 |

## Latest 4h chart, 24h ahead

| Coin | Candle (UTC) | Close | New high | New low | Range widens | Volume rises | Up* | Beats BTC* | Likeliest shape* |
|---|---|---:|---:|---:|---:|---:|---:|---:|---|
| ADA | 10-27 08:00 | 0.203017 | 10% | 40% | 66% | 69% | 51% | 53% | trend down 24% |
| AVAX | 10-27 08:00 | 8.753 | 2% | 51% | 52% | 55% | 42% | 39% | range 51% |
| COMP | 10-27 08:00 | 21.28 | 8% | 30% | 43% | 48% | 44% | 43% | range 43% |
| DOGE | 10-27 08:00 | 0.0771216 | 2% | 24% | 63% | 55% | 44% | 40% | range 46% |
| DOT | 10-27 08:00 | 0.983 | 1% | 72% | 60% | 49% | 45% | 44% | breakdown 34% |
| ETH | 10-27 08:00 | 2311.89 | 3% | 16% | 53% | 66% | 59% | 44% | range 44% |
| HBAR | 10-27 08:00 | 0.07563 | 2% | 65% | 45% | 40% | 38% | 38% | breakdown 31% |
| LINK | 10-27 08:00 | 11.3105 | 3% | 30% | 66% | 58% | 45% | 39% | range 46% |
| LTC | 10-27 08:00 | 56.14 | 4% | 30% | 39% | 53% | 48% | 51% | range 44% |
| NEAR | 10-27 08:00 | 4.4726 | 4% | 15% | 52% | 45% | 50% | 46% | range 38% |
| SOL | 10-27 08:00 | 99.96 | 4% | 33% | 56% | 54% | 54% | 37% | range 55% |
| SUI | 10-27 08:00 | 0.9094 | 4% | 45% | 52% | 46% | 36% | 36% | range 31% |
| TON | 10-27 08:00 | 1.221 | 2% | 16% | 58% | 62% | 44% | 43% | range 46% |
| XRP | 10-27 08:00 | 1.30063 | 11% | 20% | 53% | 60% | 38% | 39% | range 31% |
| ZEC | 10-27 08:00 | 1247 | 19% | 7% | 50% | 67% | 43% | 46% | trend down 37% |

## Latest 1d chart, 7d ahead

| Coin | Candle (UTC) | Close | New high | New low | Range widens | Volume rises | Up* | Beats BTC* | Likeliest shape* |
|---|---|---:|---:|---:|---:|---:|---:|---:|---|
| ADA | 10-26 00:00 | 0.206361 | 43% | 67% | 70% | 65% | 53% | 40% | breakdown 33% |
| AVAX | 10-26 00:00 | 8.962 | 38% | 57% | 76% | 79% | 50% | 46% | breakout up 26% |
| COMP | 10-26 00:00 | 22.27 | 28% | 62% | 40% | 38% | 30% | 26% | breakdown 26% |
| DOGE | 10-26 00:00 | 0.0776204 | 28% | 58% | 61% | 63% | 43% | 30% | range 30% |
| DOT | 10-26 00:00 | 1.0092 | 18% | 76% | 50% | 38% | 51% | 33% | range 26% |
| ETH | 10-26 00:00 | 2320.45 | 31% | 64% | 72% | 63% | 47% | 48% | breakdown 23% |
| HBAR | 10-26 00:00 | 0.07721 | 11% | 87% | 50% | 26% | 31% | 10% | breakdown 40% |
| LINK | 10-26 00:00 | 11.3866 | 34% | 76% | 80% | 63% | 64% | 59% | breakdown 26% |
| LTC | 10-26 00:00 | 56.71 | 33% | 60% | 59% | 58% | 54% | 47% | range 22% |
| NEAR | 10-26 00:00 | 4.5025 | 26% | 72% | 45% | 28% | 39% | 33% | breakdown 34% |
| SOL | 10-26 00:00 | 100.76 | 40% | 69% | 71% | 70% | 49% | 45% | breakdown 29% |
| SUI | 10-26 00:00 | 0.9165 | 25% | 71% | 70% | 55% | 47% | 42% | breakdown 32% |
| TON | 10-26 00:00 | 1.209 | 15% | 72% | 56% | 56% | 41% | 38% | range 27% |
| XRP | 10-26 00:00 | 1.30674 | 48% | 54% | 66% | 71% | 53% | 43% | range 24% |
| ZEC | 10-26 00:00 | 1230.88 | 53% | 38% | 61% | 58% | 55% | 56% | breakout up 23% |

\* No proven skill yet: logged so the scorecard can test it, not to act on.

Earlier study: up/down and beat-BTC did not beat the base rate; new highs and lows did (docs/research/MULTI_TARGET_PANEL_2026-10-24.md). This page checks that out of sample, live.
