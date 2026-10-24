# Multi-target prediction panel: COMP vs HBAR vs SOL

**Authority:** `SHADOW_ONLY_NO_TRADING_AUTHORITY`. Research only.

**Question (owner, 24 Oct).** Instead of single calls, predict many kinds of movement at once (direction, volume, range,
new highs and lows, chart shape) at several horizons, and let the scores show which inputs deserve the most weight.

**Registration.** `multi-target-panel-baseline-v1`, 24 Oct 04:42 UTC, before any model was fit.

## Design

| Item | Choice |
|---|---|
| Coins | COMP, HBAR, SOL; BTC as anchor |
| Data | Kraken daily with volume (~2 years; HBAR from Jul 2025); 14 months of hourly prices; Kraken 4h with volume (120 days); Kraken Futures funding |
| Targets | Up/down; beat BTC; range widens; volume rises; new 7-day high; new 7-day low; shape (trend up, trend down, breakout, breakdown, failed breakout, range) |
| Horizons | 2h, 4h, 24h (hourly); 4h, 24h (4h with volume); 1d, 7d (daily) |
| Inputs | ~25: returns of coin and BTC, range position, drawdown, volatility, volume ratio and trend, BTC correlation and its change, beta, BTC drop state, day and hour, funding |
| Test | First 70% of decisions to fit a simple logistic model; last 30% scored once against the base rate; block-bootstrap intervals; Holm correction over 138 looks |

## Results

| Target | Predictable (of looks) | After Holm | What drives it |
|---|---|---|---|
| Up or down | 0 / 21 | 0 | Nothing beat the base rate |
| Beat BTC | 1 / 21 | 0 | Nothing reliable |
| New 7-day high | 10 / 21 | 8 | Where price sits in its 7-day and 24h range |
| New 7-day low | 16 / 21 | 9 | Same, plus drawdown and volatility |
| Range widens | 3 / 21 | 2 | Volume ratio, realized volatility (SOL) |
| Volume rises | 3 / 12 | 2 | Volume ratio: high volume now means lower volume next |
| Chart shape | 3 / 21 | 1 | Weak; range position, volatility trend |

Typical skill: new highs and lows 0.25–0.45 better than the base rate on Brier score at 2h–24h. Direction stays a coin flip at every horizon.

**Where the weight belongs (share of importance across all predictable targets):** 7-day range position 21.5%,
volume ratio 16.6%, 24h range position 15.0%, volume trend 5.1%, realized volatility 3.6%; returns, BTC moves,
BTC correlation and funding each 1.7–3.3%.

## What it means

1. **Zobiris can predict *where* price will travel, not *which way* it will close.** How close a coin sits to its weekly
   high or low strongly predicts whether that level gets tested. That supports level-based planning (limit orders,
   stops, take-profits) rather than direction calls.
2. **Volume is the second pillar.** Its main use is predicting the next window's activity and range, and volume
   spikes tend to fade.
3. **Chart-pattern names add little.** Shape classes were barely predictable beyond their base frequencies.
4. The same inputs ranked first on all three coins and all horizons, so this is a market-wide pattern, not a COMP quirk.

## Limits

The 4h-with-volume set has only 120 days and overfit on HBAR. HBAR daily starts July 2025. Hourly data has no volume.
No macro or prediction-market inputs yet; they enter the live panel next.

```sh
python3 -m research.recovery_lab.panel_study --out /tmp/zobiris_panel
```

## Addendum: path efficiency from MarketLab (registry `kama-efficiency-panel-input-v1`)

Four inputs ported from the owner's MarketLab 1.2 upload: the Kaufman efficiency ratio over 10 and 30 bars, distance from
KAMA(10,2,30) and KAMA slope. On a purged 70/30 split over the live panel's 15 coins, they improved 10 of 16 proven cells,
meeting the pre-set rule. The gain is concentrated in 4h-ahead new highs (+0.018 skill, better on 12 of 15 coins) and new lows
(+0.029, 14 of 15). Daily-chart changes were within ±0.006, and direction stayed below the base rate. The live model is now
`panel-logit-v2`. MarketLab's candle checks also run on every Kraken pull: a coin with an invalid, out-of-order or
duplicate candle, or with more than 1% of candles missing, is skipped rather than predicted.
