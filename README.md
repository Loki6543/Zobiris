# Zobiris live prediction panel

Updated 2026-10-24 22:26 UTC. Current model `panel-logit-v3`, refit every run on each coin's own Kraken history. Research only: no trading authority.

75 predictions logged; 45 windows scored.

## Scorecard

Skill above 0 means the panel beat the base rate (how often the event happened in training). Below 20 scored windows a row is noise.

| Model | Chart | Horizon | Target | Scored | Brier | Base Brier | Skill |
|---|---|---|---|---:|---:|---:|---:|
| panel-logit-v1 | 4h | 4h | closes higher | 15 | 0.267 | 0.253 | -0.057 |
| panel-logit-v1 | 4h | 4h | beats BTC | 15 | 0.255 | 0.237 | -0.073 |
| panel-logit-v1 | 4h | 4h | new 7-day high | 15 | 0.000 | 0.005 | +0.971 |
| panel-logit-v1 | 4h | 4h | new 7-day low | 15 | 0.008 | 0.002 | -2.312 |
| panel-logit-v1 | 4h | 4h | range widens | 15 | 0.251 | 0.237 | -0.056 |
| panel-logit-v1 | 4h | 4h | shape | 15 | 0.703 | 0.679 | -0.035 |
| panel-logit-v1 | 4h | 4h | volume rises | 15 | 0.254 | 0.243 | -0.042 |
| panel-logit-v3 | 4h | 4h | closes higher | 30 | 0.241 | 0.251 | +0.040 |
| panel-logit-v3 | 4h | 4h | beats BTC | 30 | 0.254 | 0.251 | -0.011 |
| panel-logit-v3 | 4h | 4h | new 7-day high | 30 | 0.000 | 0.005 | +0.990 |
| panel-logit-v3 | 4h | 4h | new 7-day low | 30 | 0.360 | 0.396 | +0.091 |
| panel-logit-v3 | 4h | 4h | range widens | 30 | 0.183 | 0.251 | +0.270 |
| panel-logit-v3 | 4h | 4h | shape | 30 | 0.831 | 0.879 | +0.055 |
| panel-logit-v3 | 4h | 4h | volume rises | 30 | 0.229 | 0.251 | +0.088 |

## Latest 4h chart, 24h ahead

| Coin | Candle (UTC) | Close | New high | New low | Range widens | Volume rises | Up* | Beats BTC* | Likeliest shape* |
|---|---|---:|---:|---:|---:|---:|---:|---:|---|
| ADA | 10-24 16:00 | 0.206143 | 17% | 54% | 48% | 65% | 67% | 70% | trend up 30% |
| AVAX | 10-24 16:00 | 8.905 | 6% | 50% | 56% | 67% | 59% | 48% | range 43% |
| COMP | 10-24 16:00 | 23.5 | 9% | 17% | 58% | 37% | 38% | 39% | trend up 33% |
| DOGE | 10-24 16:00 | 0.0770495 | 7% | 16% | 30% | 26% | 65% | 65% | range 56% |
| DOT | 10-24 16:00 | 1.041 | 2% | 23% | 40% | 42% | 67% | 66% | range 64% |
| ETH | 10-24 16:00 | 2336.67 | 4% | 8% | 42% | 46% | 72% | 53% | range 63% |
| HBAR | 10-24 16:00 | 0.07756 | 4% | 43% | 50% | 46% | 42% | 32% | range 31% |
| LINK | 10-24 16:00 | 11.5276 | 4% | 24% | 49% | 37% | 70% | 62% | range 47% |
| LTC | 10-24 16:00 | 56.6 | 6% | 28% | 54% | 46% | 54% | 40% | range 36% |
| NEAR | 10-24 16:00 | 4.4578 | 2% | 21% | 41% | 32% | 55% | 44% | range 44% |
| SOL | 10-24 16:00 | 101.03 | 8% | 25% | 42% | 35% | 74% | 54% | range 46% |
| SUI | 10-24 16:00 | 0.9347 | 8% | 30% | 38% | 32% | 72% | 62% | range 46% |
| TON | 10-24 16:00 | 1.254 | 5% | 5% | 25% | 44% | 57% | 52% | range 71% |
| XRP | 10-24 16:00 | 1.28714 | 8% | 20% | 49% | 53% | 62% | 55% | range 41% |
| ZEC | 10-24 16:00 | 1188.6 | 12% | 8% | 49% | 57% | 60% | 56% | range 53% |

## Latest 1d chart, 7d ahead

| Coin | Candle (UTC) | Close | New high | New low | Range widens | Volume rises | Up* | Beats BTC* | Likeliest shape* |
|---|---|---:|---:|---:|---:|---:|---:|---:|---|
| ADA | 10-23 00:00 | 0.210652 | 30% | 77% | 63% | 55% | 49% | 41% | breakdown 32% |
| AVAX | 10-23 00:00 | 9.05 | 24% | 73% | 71% | 54% | 47% | 44% | failed breakout 25% |
| COMP | 10-23 00:00 | 24.05 | 24% | 55% | 34% | 24% | 32% | 36% | failed breakout 25% |
| DOGE | 10-23 00:00 | 0.0785192 | 27% | 63% | 55% | 55% | 44% | 42% | range 30% |
| DOT | 10-23 00:00 | 1.0849 | 18% | 76% | 44% | 42% | 34% | 26% | breakdown 29% |
| ETH | 10-23 00:00 | 2384.52 | 38% | 56% | 66% | 58% | 48% | 46% | breakdown 24% |
| HBAR | 10-23 00:00 | 0.07739 | 15% | 90% | 44% | 38% | 25% | 18% | breakdown 52% |
| LINK | 10-23 00:00 | 11.8183 | 31% | 75% | 66% | 53% | 55% | 52% | breakdown 28% |
| LTC | 10-23 00:00 | 57.22 | 17% | 77% | 51% | 39% | 36% | 36% | breakdown 30% |
| NEAR | 10-23 00:00 | 4.6848 | 16% | 79% | 40% | 21% | 31% | 27% | breakdown 34% |
| SOL | 10-23 00:00 | 102.71 | 30% | 72% | 66% | 57% | 40% | 30% | breakdown 32% |
| SUI | 10-23 00:00 | 0.9597 | 28% | 79% | 71% | 47% | 42% | 39% | breakdown 36% |
| TON | 10-23 00:00 | 1.22 | 16% | 71% | 53% | 49% | 43% | 42% | range 31% |
| XRP | 10-23 00:00 | 1.29326 | 32% | 66% | 60% | 58% | 47% | 36% | range 25% |
| ZEC | 10-23 00:00 | 1180.86 | 44% | 52% | 54% | 58% | 54% | 55% | failed breakout 23% |

\* No proven skill yet: logged so the scorecard can test it, not to act on.

Earlier study: up/down and beat-BTC did not beat the base rate; new highs and lows did (docs/research/MULTI_TARGET_PANEL_2026-10-24.md). This page checks that out of sample, live.
