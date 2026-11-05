# Zobiris live prediction panel

Updated 2026-11-05 21:57 UTC. Current model `panel-logit-v3`, refit every run on each coin's own Kraken history. Research only: no trading authority.

810 predictions logged; 1440 windows scored.

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
| panel-logit-v3 | 1d | 1d | closes higher | 165 | 0.247 | 0.248 | +0.006 |
| panel-logit-v3 | 1d | 1d | beats BTC | 165 | 0.238 | 0.240 | +0.010 |
| panel-logit-v3 | 1d | 1d | new 7-day high | 165 | 0.023 | 0.038 | +0.402 |
| panel-logit-v3 | 1d | 1d | new 7-day low | 165 | 0.165 | 0.205 | +0.198 |
| panel-logit-v3 | 1d | 1d | range widens | 165 | 0.214 | 0.250 | +0.144 |
| panel-logit-v3 | 1d | 1d | shape | 165 | 0.730 | 0.725 | -0.006 |
| panel-logit-v3 | 1d | 1d | volume rises | 165 | 0.196 | 0.252 | +0.224 |
| panel-logit-v3 | 1d | 7d | closes higher | 75 | 0.221 | 0.190 | -0.160 |
| panel-logit-v3 | 1d | 7d | beats BTC | 75 | 0.192 | 0.203 | +0.053 |
| panel-logit-v3 | 1d | 7d | new 7-day high | 75 | 0.126 | 0.173 | +0.272 |
| panel-logit-v3 | 1d | 7d | new 7-day low | 75 | 0.144 | 0.256 | +0.436 |
| panel-logit-v3 | 1d | 7d | range widens | 75 | 0.232 | 0.258 | +0.098 |
| panel-logit-v3 | 1d | 7d | shape | 75 | 0.790 | 0.798 | +0.009 |
| panel-logit-v3 | 1d | 7d | volume rises | 75 | 0.191 | 0.257 | +0.258 |
| panel-logit-v3 | 4h | 24h | closes higher | 555 | 0.266 | 0.250 | -0.065 |
| panel-logit-v3 | 4h | 24h | beats BTC | 555 | 0.255 | 0.242 | -0.053 |
| panel-logit-v3 | 4h | 24h | new 7-day high | 555 | 0.027 | 0.046 | +0.418 |
| panel-logit-v3 | 4h | 24h | new 7-day low | 555 | 0.180 | 0.186 | +0.030 |
| panel-logit-v3 | 4h | 24h | range widens | 555 | 0.227 | 0.252 | +0.098 |
| panel-logit-v3 | 4h | 24h | shape | 555 | 0.702 | 0.716 | +0.019 |
| panel-logit-v3 | 4h | 24h | volume rises | 555 | 0.220 | 0.251 | +0.126 |
| panel-logit-v3 | 4h | 4h | closes higher | 585 | 0.251 | 0.250 | -0.004 |
| panel-logit-v3 | 4h | 4h | beats BTC | 585 | 0.257 | 0.250 | -0.029 |
| panel-logit-v3 | 4h | 4h | new 7-day high | 585 | 0.006 | 0.009 | +0.354 |
| panel-logit-v3 | 4h | 4h | new 7-day low | 585 | 0.070 | 0.075 | +0.065 |
| panel-logit-v3 | 4h | 4h | range widens | 585 | 0.218 | 0.251 | +0.134 |
| panel-logit-v3 | 4h | 4h | shape | 585 | 0.646 | 0.686 | +0.058 |
| panel-logit-v3 | 4h | 4h | volume rises | 585 | 0.218 | 0.251 | +0.132 |

## Latest 4h chart, 24h ahead

| Coin | Candle (UTC) | Close | New high | New low | Range widens | Volume rises | Up* | Beats BTC* | Likeliest shape* |
|---|---|---:|---:|---:|---:|---:|---:|---:|---|
| ADA | 11-05 16:00 | 0.185187 | 4% | 14% | 27% | 43% | 73% | 68% | range 48% |
| AVAX | 11-05 16:00 | 8.392 | 8% | 32% | 26% | 47% | 72% | 61% | range 50% |
| COMP | 11-05 16:00 | 19.69 | 4% | 18% | 34% | 33% | 72% | 50% | range 48% |
| DOGE | 11-05 16:00 | 0.0724954 | 6% | 22% | 17% | 18% | 78% | 74% | range 60% |
| DOT | 11-05 16:00 | 0.9319 | 12% | 5% | 39% | 41% | 66% | 54% | trend up 42% |
| ETH | 11-05 16:00 | 2258.08 | 2% | 14% | 10% | 11% | 83% | 73% | range 78% |
| HBAR | 11-05 16:00 | 0.06835 | 5% | 29% | 10% | 9% | 56% | 46% | range 64% |
| LINK | 11-05 16:00 | 10.8379 | 6% | 34% | 31% | 45% | 77% | 66% | range 44% |
| LTC | 11-05 16:00 | 52.6 | 2% | 45% | 31% | 24% | 65% | 40% | range 49% |
| NEAR | 11-05 16:00 | 3.7087 | 5% | 47% | 41% | 31% | 84% | 82% | range 43% |
| SOL | 11-05 16:00 | 89.99 | 1% | 36% | 15% | 17% | 51% | 33% | range 73% |
| SUI | 11-05 16:00 | 0.8594 | 3% | 12% | 20% | 14% | 80% | 72% | range 62% |
| TON | 11-05 16:00 | 1.119 | 1% | 40% | 20% | 32% | 77% | 71% | range 45% |
| XRP | 11-05 16:00 | 1.243 | 1% | 14% | 13% | 21% | 66% | 50% | range 77% |
| ZEC | 11-05 16:00 | 1245.55 | 8% | 8% | 28% | 38% | 75% | 71% | range 56% |

## Latest 1d chart, 7d ahead

| Coin | Candle (UTC) | Close | New high | New low | Range widens | Volume rises | Up* | Beats BTC* | Likeliest shape* |
|---|---|---:|---:|---:|---:|---:|---:|---:|---|
| ADA | 11-04 00:00 | 0.19716 | 52% | 38% | 61% | 62% | 41% | 40% | trend down 21% |
| AVAX | 11-04 00:00 | 8.73 | 43% | 36% | 60% | 67% | 38% | 38% | trend down 24% |
| COMP | 11-04 00:00 | 20.5 | 39% | 48% | 44% | 41% | 36% | 36% | range 38% |
| DOGE | 11-04 00:00 | 0.0770138 | 37% | 46% | 58% | 59% | 34% | 33% | range 34% |
| DOT | 11-04 00:00 | 0.9538 | 35% | 55% | 61% | 55% | 33% | 24% | breakdown 26% |
| ETH | 11-04 00:00 | 2423.16 | 62% | 20% | 34% | 61% | 38% | 38% | range 25% |
| HBAR | 11-04 00:00 | 0.07263 | 23% | 53% | 22% | 46% | 34% | 45% | range 31% |
| LINK | 11-04 00:00 | 11.4332 | 48% | 30% | 46% | 48% | 41% | 37% | range 30% |
| LTC | 11-04 00:00 | 56.22 | 53% | 32% | 60% | 70% | 57% | 52% | range 29% |
| NEAR | 11-04 00:00 | 4.0061 | 21% | 59% | 43% | 28% | 40% | 30% | range 37% |
| SOL | 11-04 00:00 | 95.53 | 46% | 46% | 50% | 58% | 48% | 46% | failed breakout 23% |
| SUI | 11-04 00:00 | 0.9283 | 61% | 36% | 60% | 67% | 46% | 41% | breakdown 21% |
| TON | 11-04 00:00 | 1.179 | 30% | 58% | 58% | 60% | 33% | 26% | range 25% |
| XRP | 11-04 00:00 | 1.30409 | 56% | 26% | 54% | 61% | 47% | 46% | range 35% |
| ZEC | 11-04 00:00 | 1294.86 | 50% | 31% | 42% | 57% | 36% | 40% | failed breakout 19% |

\* No proven skill yet: logged so the scorecard can test it, not to act on.

Earlier study: up/down and beat-BTC did not beat the base rate; new highs and lows did (docs/research/MULTI_TARGET_PANEL_2026-10-24.md). This page checks that out of sample, live.
