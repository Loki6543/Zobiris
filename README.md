# Zobiris live prediction panel

Updated 2026-10-24 07:36 UTC. Current model `panel-logit-v2`, refit every run on each coin's own Kraken history. Research only: no trading authority.

30 predictions logged; 0 windows scored.

## Scorecard

Skill above 0 means the panel beat the base rate (how often the event happened in training). Below 20 scored windows a row is noise.

| Model | Chart | Horizon | Target | Scored | Brier | Base Brier | Skill |
|---|---|---|---|---:|---:|---:|---:|

## Latest 4h chart, 24h ahead

| Coin | Candle (UTC) | Close | New high | New low | Range widens | Volume rises | Up* | Beats BTC* | Likeliest shape* |
|---|---|---:|---:|---:|---:|---:|---:|---:|---|
| ADA | 10-24 00:00 | 0.211362 | 11% | 48% | 54% | 59% | 64% | 62% | trend up 29% |
| AVAX | 10-24 00:00 | 9.037 | 3% | 47% | 49% | 58% | 55% | 44% | range 54% |
| COMP | 10-24 00:00 | 23.77 | 7% | 16% | 50% | 40% | 42% | 44% | range 38% |
| DOGE | 10-24 00:00 | 0.0787024 | 5% | 19% | 49% | 32% | 56% | 48% | range 51% |
| DOT | 10-24 00:00 | 1.0874 | 2% | 20% | 41% | 36% | 57% | 53% | range 55% |
| ETH | 10-24 00:00 | 2379.78 | 4% | 6% | 49% | 50% | 73% | 55% | range 56% |
| HBAR | 10-24 00:00 | 0.07784 | 2% | 50% | 45% | 42% | 45% | 42% | range 37% |
| LINK | 10-24 00:00 | 11.8494 | 4% | 18% | 56% | 50% | 64% | 58% | range 50% |
| LTC | 10-24 00:00 | 57.12 | 4% | 29% | 51% | 38% | 58% | 54% | range 39% |
| NEAR | 10-24 00:00 | 4.6317 | 2% | 12% | 53% | 43% | 56% | 49% | range 53% |
| SOL | 10-24 00:00 | 102.55 | 4% | 29% | 57% | 46% | 66% | 56% | range 50% |
| SUI | 10-24 00:00 | 0.962 | 5% | 32% | 48% | 42% | 65% | 60% | range 46% |
| TON | 10-24 00:00 | 1.236 | 4% | 8% | 17% | 31% | 66% | 54% | range 71% |
| XRP | 10-24 00:00 | 1.28909 | 3% | 26% | 51% | 49% | 61% | 48% | range 46% |
| ZEC | 10-24 00:00 | 1171.06 | 6% | 21% | 49% | 43% | 62% | 59% | range 45% |

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
