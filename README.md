# Zobiris live prediction panel

Updated 2026-11-09 18:42 UTC. Current model `panel-logit-v3`, refit every run on each coin's own Kraken history. Research only: no trading authority.

1035 predictions logged; 1890 windows scored.

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
| panel-logit-v3 | 1d | 1d | closes higher | 225 | 0.245 | 0.246 | +0.004 |
| panel-logit-v3 | 1d | 1d | beats BTC | 225 | 0.236 | 0.238 | +0.006 |
| panel-logit-v3 | 1d | 1d | new 7-day high | 225 | 0.024 | 0.038 | +0.374 |
| panel-logit-v3 | 1d | 1d | new 7-day low | 225 | 0.194 | 0.229 | +0.151 |
| panel-logit-v3 | 1d | 1d | range widens | 225 | 0.212 | 0.249 | +0.149 |
| panel-logit-v3 | 1d | 1d | shape | 225 | 0.747 | 0.740 | -0.009 |
| panel-logit-v3 | 1d | 1d | volume rises | 225 | 0.189 | 0.250 | +0.246 |
| panel-logit-v3 | 1d | 7d | closes higher | 135 | 0.236 | 0.188 | -0.257 |
| panel-logit-v3 | 1d | 7d | beats BTC | 135 | 0.197 | 0.191 | -0.027 |
| panel-logit-v3 | 1d | 7d | new 7-day high | 135 | 0.137 | 0.182 | +0.246 |
| panel-logit-v3 | 1d | 7d | new 7-day low | 135 | 0.163 | 0.258 | +0.369 |
| panel-logit-v3 | 1d | 7d | range widens | 135 | 0.231 | 0.256 | +0.097 |
| panel-logit-v3 | 1d | 7d | shape | 135 | 0.804 | 0.799 | -0.007 |
| panel-logit-v3 | 1d | 7d | volume rises | 135 | 0.193 | 0.256 | +0.248 |
| panel-logit-v3 | 4h | 24h | closes higher | 720 | 0.278 | 0.248 | -0.120 |
| panel-logit-v3 | 4h | 24h | beats BTC | 720 | 0.257 | 0.238 | -0.080 |
| panel-logit-v3 | 4h | 24h | new 7-day high | 720 | 0.027 | 0.044 | +0.399 |
| panel-logit-v3 | 4h | 24h | new 7-day low | 720 | 0.203 | 0.211 | +0.036 |
| panel-logit-v3 | 4h | 24h | range widens | 720 | 0.215 | 0.252 | +0.145 |
| panel-logit-v3 | 4h | 24h | shape | 720 | 0.686 | 0.710 | +0.033 |
| panel-logit-v3 | 4h | 24h | volume rises | 720 | 0.211 | 0.252 | +0.162 |
| panel-logit-v3 | 4h | 4h | closes higher | 750 | 0.255 | 0.250 | -0.020 |
| panel-logit-v3 | 4h | 4h | beats BTC | 750 | 0.256 | 0.248 | -0.029 |
| panel-logit-v3 | 4h | 4h | new 7-day high | 750 | 0.006 | 0.009 | +0.360 |
| panel-logit-v3 | 4h | 4h | new 7-day low | 750 | 0.090 | 0.096 | +0.065 |
| panel-logit-v3 | 4h | 4h | range widens | 750 | 0.229 | 0.252 | +0.092 |
| panel-logit-v3 | 4h | 4h | shape | 750 | 0.627 | 0.668 | +0.061 |
| panel-logit-v3 | 4h | 4h | volume rises | 750 | 0.223 | 0.251 | +0.112 |

## Latest 4h chart, 24h ahead

| Coin | Candle (UTC) | Close | New high | New low | Range widens | Volume rises | Up* | Beats BTC* | Likeliest shape* |
|---|---|---:|---:|---:|---:|---:|---:|---:|---|
| ADA | 11-09 12:00 | 0.182428 | 18% | 11% | 61% | 69% | 29% | 27% | range 42% |
| AVAX | 11-09 12:00 | 8.988 | 59% | 1% | 9% | 65% | 43% | 60% | trend down 29% |
| COMP | 11-09 12:00 | 20.42 | 20% | 7% | 66% | 58% | 39% | 36% | range 35% |
| DOGE | 11-09 12:00 | 0.0707633 | 12% | 15% | 42% | 42% | 52% | 45% | range 53% |
| DOT | 11-09 12:00 | 0.8904 | 11% | 26% | 41% | 43% | 44% | 34% | range 28% |
| ETH | 11-09 12:00 | 2145.02 | 4% | 14% | 41% | 51% | 59% | 51% | range 48% |
| HBAR | 11-09 12:00 | 0.06843 | 24% | 12% | 51% | 58% | 41% | 36% | trend down 36% |
| LINK | 11-09 12:00 | 10.7795 | 14% | 10% | 40% | 45% | 52% | 54% | range 34% |
| LTC | 11-09 12:00 | 52.2 | 8% | 12% | 52% | 62% | 40% | 22% | range 40% |
| NEAR | 11-09 12:00 | 3.6736 | 5% | 27% | 38% | 53% | 45% | 40% | range 58% |
| SOL | 11-09 12:00 | 87.83 | 7% | 29% | 39% | 36% | 57% | 30% | range 51% |
| SUI | 11-09 12:00 | 0.867 | 17% | 7% | 42% | 59% | 53% | 43% | range 47% |
| TON | 11-09 12:00 | 1.048 | 2% | 29% | 39% | 45% | 42% | 38% | range 43% |
| XRP | 11-09 12:00 | 1.11357 | 10% | 53% | 43% | 41% | 70% | 70% | failed breakout 45% |
| ZEC | 11-09 12:00 | 1224.8 | 10% | 15% | 59% | 68% | 51% | 50% | range 43% |

## Latest 1d chart, 7d ahead

| Coin | Candle (UTC) | Close | New high | New low | Range widens | Volume rises | Up* | Beats BTC* | Likeliest shape* |
|---|---|---:|---:|---:|---:|---:|---:|---:|---|
| ADA | 11-08 00:00 | 0.174899 | 21% | 71% | 52% | 46% | 45% | 35% | breakdown 29% |
| AVAX | 11-08 00:00 | 7.929 | 23% | 76% | 67% | 53% | 51% | 54% | breakdown 26% |
| COMP | 11-08 00:00 | 19.52 | 32% | 56% | 47% | 44% | 36% | 32% | range 28% |
| DOGE | 11-08 00:00 | 0.0688901 | 10% | 67% | 38% | 42% | 43% | 28% | range 39% |
| DOT | 11-08 00:00 | 0.8607 | 19% | 83% | 66% | 53% | 42% | 27% | breakdown 38% |
| ETH | 11-08 00:00 | 2124.05 | 12% | 68% | 38% | 41% | 35% | 28% | range 33% |
| HBAR | 11-08 00:00 | 0.06546 | 19% | 69% | 42% | 30% | 53% | 40% | failed breakout 30% |
| LINK | 11-08 00:00 | 10.3927 | 18% | 71% | 45% | 28% | 40% | 36% | range 28% |
| LTC | 11-08 00:00 | 50.05 | 20% | 68% | 52% | 44% | 57% | 50% | range 39% |
| NEAR | 11-08 00:00 | 3.5803 | 14% | 75% | 45% | 24% | 38% | 29% | breakdown 26% |
| SOL | 11-08 00:00 | 86.44 | 23% | 70% | 49% | 55% | 49% | 45% | range 27% |
| SUI | 11-08 00:00 | 0.8198 | 22% | 66% | 56% | 42% | 53% | 44% | range 32% |
| TON | 11-08 00:00 | 1.018 | 8% | 76% | 45% | 54% | 46% | 43% | range 33% |
| XRP | 11-08 00:00 | 1.11176 | 22% | 70% | 54% | 50% | 58% | 55% | range 26% |
| ZEC | 11-08 00:00 | 1211.07 | 30% | 56% | 39% | 41% | 40% | 44% | range 22% |

\* No proven skill yet: logged so the scorecard can test it, not to act on.

Earlier study: up/down and beat-BTC did not beat the base rate; new highs and lows did (docs/research/MULTI_TARGET_PANEL_2026-10-24.md). This page checks that out of sample, live.
