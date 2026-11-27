# Zobiris live prediction panel

Updated 2026-11-27 00:32 UTC. Current model `panel-logit-v3`, refit every run on each coin's own Kraken history. Research only: no trading authority.

1965 predictions logged; 3765 windows scored.

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
| panel-logit-v3 | 1d | 1d | closes higher | 495 | 0.251 | 0.247 | -0.018 |
| panel-logit-v3 | 1d | 1d | beats BTC | 495 | 0.250 | 0.250 | -0.000 |
| panel-logit-v3 | 1d | 1d | new 7-day high | 495 | 0.022 | 0.039 | +0.443 |
| panel-logit-v3 | 1d | 1d | new 7-day low | 495 | 0.186 | 0.252 | +0.261 |
| panel-logit-v3 | 1d | 1d | range widens | 495 | 0.207 | 0.250 | +0.170 |
| panel-logit-v3 | 1d | 1d | shape | 495 | 0.744 | 0.749 | +0.006 |
| panel-logit-v3 | 1d | 1d | volume rises | 495 | 0.207 | 0.251 | +0.173 |
| panel-logit-v3 | 1d | 7d | closes higher | 405 | 0.239 | 0.189 | -0.265 |
| panel-logit-v3 | 1d | 7d | beats BTC | 405 | 0.229 | 0.237 | +0.037 |
| panel-logit-v3 | 1d | 7d | new 7-day high | 405 | 0.110 | 0.176 | +0.376 |
| panel-logit-v3 | 1d | 7d | new 7-day low | 405 | 0.160 | 0.255 | +0.370 |
| panel-logit-v3 | 1d | 7d | range widens | 405 | 0.233 | 0.254 | +0.083 |
| panel-logit-v3 | 1d | 7d | shape | 405 | 0.806 | 0.804 | -0.003 |
| panel-logit-v3 | 1d | 7d | volume rises | 405 | 0.221 | 0.249 | +0.114 |
| panel-logit-v3 | 4h | 24h | closes higher | 1395 | 0.276 | 0.248 | -0.113 |
| panel-logit-v3 | 4h | 24h | beats BTC | 1395 | 0.269 | 0.247 | -0.089 |
| panel-logit-v3 | 4h | 24h | new 7-day high | 1395 | 0.023 | 0.045 | +0.479 |
| panel-logit-v3 | 4h | 24h | new 7-day low | 1395 | 0.201 | 0.245 | +0.181 |
| panel-logit-v3 | 4h | 24h | range widens | 1395 | 0.232 | 0.252 | +0.078 |
| panel-logit-v3 | 4h | 24h | shape | 1395 | 0.727 | 0.735 | +0.011 |
| panel-logit-v3 | 4h | 24h | volume rises | 1395 | 0.234 | 0.251 | +0.069 |
| panel-logit-v3 | 4h | 4h | closes higher | 1410 | 0.262 | 0.250 | -0.047 |
| panel-logit-v3 | 4h | 4h | beats BTC | 1410 | 0.257 | 0.250 | -0.030 |
| panel-logit-v3 | 4h | 4h | new 7-day high | 1410 | 0.006 | 0.010 | +0.344 |
| panel-logit-v3 | 4h | 4h | new 7-day low | 1410 | 0.091 | 0.119 | +0.234 |
| panel-logit-v3 | 4h | 4h | range widens | 1410 | 0.229 | 0.252 | +0.092 |
| panel-logit-v3 | 4h | 4h | shape | 1410 | 0.655 | 0.681 | +0.038 |
| panel-logit-v3 | 4h | 4h | volume rises | 1410 | 0.231 | 0.251 | +0.082 |

## Latest 4h chart, 24h ahead

| Coin | Candle (UTC) | Close | New high | New low | Range widens | Volume rises | Up* | Beats BTC* | Likeliest shape* |
|---|---|---:|---:|---:|---:|---:|---:|---:|---|
| ADA | 11-26 20:00 | 0.148469 | 6% | 23% | 72% | 61% | 36% | 40% | range 36% |
| AVAX | 11-26 20:00 | 6.584 | 3% | 18% | 65% | 47% | 34% | 42% | trend down 40% |
| COMP | 11-26 20:00 | 17.99 | 20% | 5% | 56% | 61% | 47% | 58% | range 42% |
| DOGE | 11-26 20:00 | 0.0564043 | 5% | 17% | 69% | 62% | 34% | 37% | trend down 43% |
| DOT | 11-26 20:00 | 0.6721 | 7% | 17% | 60% | 68% | 36% | 42% | range 40% |
| ETH | 11-26 20:00 | 1687.76 | 6% | 13% | 76% | 63% | 39% | 48% | trend down 42% |
| HBAR | 11-26 20:00 | 0.05392 | 12% | 12% | 58% | 62% | 28% | 30% | trend down 42% |
| LINK | 11-26 20:00 | 9.26939 | 30% | 5% | 51% | 52% | 45% | 49% | range 33% |
| LTC | 11-26 20:00 | 43.77 | 30% | 7% | 65% | 64% | 43% | 47% | range 26% |
| NEAR | 11-26 20:00 | 3.0466 | 6% | 26% | 62% | 62% | 26% | 30% | trend down 31% |
| SOL | 11-26 20:00 | 70.93 | 18% | 22% | 79% | 76% | 37% | 45% | trend down 34% |
| SUI | 11-26 20:00 | 0.6676 | 4% | 17% | 72% | 60% | 36% | 37% | range 38% |
| TON | 11-26 20:00 | 0.96 | 4% | 19% | 73% | 71% | 31% | 30% | trend down 50% |
| XRP | 11-26 20:00 | 0.94276 | 4% | 19% | 64% | 60% | 33% | 45% | trend down 38% |
| ZEC | 11-26 20:00 | 681.89 | 1% | 71% | 52% | 44% | 51% | 56% | range 46% |

## Latest 1d chart, 7d ahead

| Coin | Candle (UTC) | Close | New high | New low | Range widens | Volume rises | Up* | Beats BTC* | Likeliest shape* |
|---|---|---:|---:|---:|---:|---:|---:|---:|---|
| ADA | 11-26 00:00 | 0.148469 | 61% | 48% | 66% | 63% | 42% | 47% | breakdown 28% |
| AVAX | 11-26 00:00 | 6.584 | 31% | 50% | 58% | 56% | 48% | 53% | range 37% |
| COMP | 11-26 00:00 | 17.99 | 77% | 25% | 68% | 63% | 39% | 41% | range 29% |
| DOGE | 11-26 00:00 | 0.0564043 | 30% | 53% | 56% | 44% | 34% | 30% | range 35% |
| DOT | 11-26 00:00 | 0.6721 | 50% | 48% | 62% | 59% | 48% | 35% | breakdown 24% |
| ETH | 11-26 00:00 | 1687.76 | 41% | 43% | 49% | 48% | 47% | 58% | range 32% |
| HBAR | 11-26 00:00 | 0.05392 | 55% | 43% | 56% | 48% | 45% | 39% | breakdown 26% |
| LINK | 11-26 00:00 | 9.26939 | 71% | 34% | 54% | 52% | 44% | 47% | breakdown 23% |
| LTC | 11-26 00:00 | 43.77 | 64% | 26% | 52% | 56% | 36% | 44% | range 34% |
| NEAR | 11-26 00:00 | 3.0466 | 42% | 53% | 62% | 33% | 44% | 44% | range 32% |
| SOL | 11-26 00:00 | 70.93 | 48% | 55% | 67% | 58% | 43% | 49% | breakdown 26% |
| SUI | 11-26 00:00 | 0.6676 | 33% | 46% | 52% | 46% | 47% | 38% | range 37% |
| TON | 11-26 00:00 | 0.96 | 30% | 60% | 55% | 49% | 37% | 35% | range 37% |
| XRP | 11-26 00:00 | 0.94276 | 37% | 56% | 57% | 53% | 37% | 44% | range 34% |
| ZEC | 11-26 00:00 | 681.89 | 13% | 74% | 46% | 21% | 54% | 56% | range 32% |

\* No proven skill yet: logged so the scorecard can test it, not to act on.

Earlier study: up/down and beat-BTC did not beat the base rate; new highs and lows did (docs/research/MULTI_TARGET_PANEL_2026-10-24.md). This page checks that out of sample, live.
