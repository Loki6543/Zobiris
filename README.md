# Zobiris live prediction panel

Updated 2026-10-24 18:45 UTC. Current model `panel-logit-v3`, refit every run on each coin's own Kraken history. Research only: no trading authority.

60 predictions logged; 30 windows scored.

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
| panel-logit-v3 | 4h | 4h | closes higher | 15 | 0.263 | 0.245 | -0.074 |
| panel-logit-v3 | 4h | 4h | beats BTC | 15 | 0.255 | 0.233 | -0.091 |
| panel-logit-v3 | 4h | 4h | new 7-day high | 15 | 0.000 | 0.005 | +0.983 |
| panel-logit-v3 | 4h | 4h | new 7-day low | 15 | 0.628 | 0.729 | +0.139 |
| panel-logit-v3 | 4h | 4h | range widens | 15 | 0.289 | 0.267 | -0.082 |
| panel-logit-v3 | 4h | 4h | shape | 15 | 0.907 | 0.885 | -0.025 |
| panel-logit-v3 | 4h | 4h | volume rises | 15 | 0.354 | 0.265 | -0.339 |

## Latest 4h chart, 24h ahead

| Coin | Candle (UTC) | Close | New high | New low | Range widens | Volume rises | Up* | Beats BTC* | Likeliest shape* |
|---|---|---:|---:|---:|---:|---:|---:|---:|---|
| ADA | 10-24 12:00 | 0.203432 | 6% | 70% | 38% | 49% | 74% | 72% | trend up 34% |
| AVAX | 10-24 12:00 | 8.79 | 4% | 64% | 47% | 48% | 63% | 47% | range 35% |
| COMP | 10-24 12:00 | 23.31 | 5% | 27% | 53% | 31% | 43% | 46% | trend up 36% |
| DOGE | 10-24 12:00 | 0.0756647 | 2% | 34% | 16% | 12% | 75% | 67% | range 48% |
| DOT | 10-24 12:00 | 1.0376 | 1% | 27% | 40% | 38% | 68% | 64% | range 50% |
| ETH | 10-24 12:00 | 2303.3 | 1% | 16% | 38% | 27% | 80% | 52% | range 48% |
| HBAR | 10-24 12:00 | 0.07616 | 2% | 69% | 44% | 40% | 43% | 32% | breakdown 34% |
| LINK | 10-24 12:00 | 11.3813 | 2% | 43% | 39% | 29% | 67% | 58% | range 38% |
| LTC | 10-24 12:00 | 55.7 | 2% | 55% | 46% | 30% | 62% | 50% | range 29% |
| NEAR | 10-24 12:00 | 4.4019 | 1% | 30% | 38% | 31% | 58% | 45% | range 36% |
| SOL | 10-24 12:00 | 99.66 | 2% | 52% | 36% | 28% | 77% | 60% | range 36% |
| SUI | 10-24 12:00 | 0.925 | 4% | 41% | 25% | 26% | 78% | 74% | range 36% |
| TON | 10-24 12:00 | 1.224 | 2% | 16% | 12% | 28% | 77% | 64% | range 65% |
| XRP | 10-24 12:00 | 1.2669 | 2% | 43% | 44% | 48% | 69% | 56% | range 33% |
| ZEC | 10-24 12:00 | 1143.32 | 4% | 31% | 49% | 36% | 64% | 61% | range 33% |

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
