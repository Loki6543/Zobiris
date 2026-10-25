# Zobiris live prediction panel

Updated 2026-10-25 22:30 UTC. Current model `panel-logit-v3`, refit every run on each coin's own Kraken history. Research only: no trading authority.

150 predictions logged; 180 windows scored.

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
| panel-logit-v3 | 4h | 24h | closes higher | 45 | 0.241 | 0.253 | +0.044 |
| panel-logit-v3 | 4h | 24h | beats BTC | 45 | 0.287 | 0.261 | -0.100 |
| panel-logit-v3 | 4h | 24h | new 7-day high | 45 | 0.003 | 0.037 | +0.928 |
| panel-logit-v3 | 4h | 24h | new 7-day low | 45 | 0.256 | 0.287 | +0.107 |
| panel-logit-v3 | 4h | 24h | range widens | 45 | 0.191 | 0.248 | +0.232 |
| panel-logit-v3 | 4h | 24h | shape | 45 | 0.670 | 0.691 | +0.030 |
| panel-logit-v3 | 4h | 24h | volume rises | 45 | 0.204 | 0.246 | +0.168 |
| panel-logit-v3 | 4h | 4h | closes higher | 90 | 0.260 | 0.253 | -0.028 |
| panel-logit-v3 | 4h | 4h | beats BTC | 90 | 0.265 | 0.255 | -0.042 |
| panel-logit-v3 | 4h | 4h | new 7-day high | 90 | 0.000 | 0.005 | +0.931 |
| panel-logit-v3 | 4h | 4h | new 7-day low | 90 | 0.143 | 0.154 | +0.073 |
| panel-logit-v3 | 4h | 4h | range widens | 90 | 0.189 | 0.248 | +0.239 |
| panel-logit-v3 | 4h | 4h | shape | 90 | 0.714 | 0.737 | +0.031 |
| panel-logit-v3 | 4h | 4h | volume rises | 90 | 0.219 | 0.249 | +0.122 |

## Latest 4h chart, 24h ahead

| Coin | Candle (UTC) | Close | New high | New low | Range widens | Volume rises | Up* | Beats BTC* | Likeliest shape* |
|---|---|---:|---:|---:|---:|---:|---:|---:|---|
| ADA | 10-25 16:00 | 0.205521 | 12% | 46% | 59% | 70% | 50% | 48% | range 24% |
| AVAX | 10-25 16:00 | 8.929 | 4% | 47% | 57% | 69% | 37% | 32% | range 60% |
| COMP | 10-25 16:00 | 21.65 | 2% | 66% | 7% | 10% | 52% | 88% | trend up 46% |
| DOGE | 10-25 16:00 | 0.0771939 | 4% | 20% | 59% | 51% | 48% | 42% | range 48% |
| DOT | 10-25 16:00 | 1.0365 | 3% | 28% | 51% | 57% | 51% | 41% | range 46% |
| ETH | 10-25 16:00 | 2348.08 | 4% | 9% | 68% | 76% | 62% | 42% | range 51% |
| HBAR | 10-25 16:00 | 0.07774 | 4% | 37% | 64% | 57% | 45% | 43% | range 32% |
| LINK | 10-25 16:00 | 11.4797 | 5% | 20% | 64% | 60% | 50% | 41% | range 44% |
| LTC | 10-25 16:00 | 57.02 | 11% | 17% | 60% | 51% | 39% | 32% | range 36% |
| NEAR | 10-25 16:00 | 4.5717 | 6% | 12% | 65% | 70% | 38% | 28% | range 34% |
| SOL | 10-25 16:00 | 101.66 | 6% | 25% | 73% | 70% | 59% | 47% | range 53% |
| SUI | 10-25 16:00 | 0.9271 | 9% | 28% | 49% | 62% | 54% | 44% | range 40% |
| TON | 10-25 16:00 | 1.263 | 5% | 3% | 44% | 48% | 47% | 48% | range 72% |
| XRP | 10-25 16:00 | 1.29866 | 5% | 20% | 72% | 68% | 40% | 34% | range 37% |
| ZEC | 10-25 16:00 | 1216.6 | 12% | 6% | 59% | 69% | 41% | 42% | trend down 42% |

## Latest 1d chart, 7d ahead

| Coin | Candle (UTC) | Close | New high | New low | Range widens | Volume rises | Up* | Beats BTC* | Likeliest shape* |
|---|---|---:|---:|---:|---:|---:|---:|---:|---|
| ADA | 10-24 00:00 | 0.207852 | 29% | 69% | 56% | 56% | 44% | 38% | breakdown 26% |
| AVAX | 10-24 00:00 | 8.987 | 29% | 52% | 57% | 59% | 49% | 43% | range 24% |
| COMP | 10-24 00:00 | 23.79 | 28% | 50% | 28% | 17% | 31% | 35% | range 24% |
| DOGE | 10-24 00:00 | 0.0775786 | 22% | 57% | 49% | 61% | 38% | 30% | range 31% |
| DOT | 10-24 00:00 | 1.0473 | 18% | 74% | 42% | 34% | 43% | 34% | range 26% |
| ETH | 10-24 00:00 | 2355.56 | 31% | 60% | 61% | 60% | 43% | 41% | range 23% |
| HBAR | 10-24 00:00 | 0.07781 | 17% | 86% | 47% | 36% | 25% | 17% | breakdown 44% |
| LINK | 10-24 00:00 | 11.6117 | 30% | 73% | 65% | 51% | 52% | 48% | breakdown 24% |
| LTC | 10-24 00:00 | 56.98 | 26% | 56% | 52% | 54% | 48% | 46% | range 24% |
| NEAR | 10-24 00:00 | 4.4954 | 17% | 76% | 39% | 19% | 32% | 26% | breakdown 30% |
| SOL | 10-24 00:00 | 102.24 | 36% | 68% | 66% | 64% | 34% | 29% | breakdown 25% |
| SUI | 10-24 00:00 | 0.9376 | 24% | 77% | 69% | 53% | 38% | 38% | breakdown 32% |
| TON | 10-24 00:00 | 1.257 | 33% | 55% | 51% | 55% | 38% | 42% | range 30% |
| XRP | 10-24 00:00 | 1.29783 | 38% | 56% | 63% | 67% | 48% | 38% | range 26% |
| ZEC | 10-24 00:00 | 1207.31 | 53% | 38% | 60% | 54% | 53% | 54% | failed breakout 22% |

\* No proven skill yet: logged so the scorecard can test it, not to act on.

Earlier study: up/down and beat-BTC did not beat the base rate; new highs and lows did (docs/research/MULTI_TARGET_PANEL_2026-10-24.md). This page checks that out of sample, live.
