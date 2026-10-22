# Alts in the days after BTC drops and recoveries

**Authority:** `SHADOW_ONLY_NO_TRADING_AUTHORITY`. Research only; no production change.

**Question (owner's hypothesis, 22 Oct).** A pattern that averages out over a year may still hold in the few days after a
sharp BTC drop or recovery. Do alts beat BTC in those windows, and which alts?

**Registration.** `btc-event-conditional-alt-study-v1`, registered 2026-10-22 06:49 UTC before any event list or outcome was seen.

## Design

| Item | Choice |
|---|---|
| BTC drop | BTC close ≤ 95% of its highest close in the prior 48h; one event per 7 days |
| BTC recovery | BTC's 7-day low is ≥ 7% under the prior 14-day high, at most 72h old, and BTC closes ≥ 4% above it; one per 7 days |
| Data | 1h snapshot, BTC + 36 alts (XMR excluded), Oct 2025 → Oct 2026 |
| Outcome | Alt minus BTC, next open → +24h / +72h / +120h, minus 0.40% maker round trip |
| Features | Fall vs BTC during the drop (drop beta), distance from 30-day high, bounce since the BTC low, 24h range position, 90d return vs BTC, delayed-rotation score |
| Pass | 72h, same-sign IC in the first 60% and last 40% of events, holdout \|t\| ≥ 2 |

## Results

20 drops and 20 recoveries.

| Window | Average alt minus BTC, after fees (95% CI) |
|---|---|
| After a drop, 24h | **−1.69%** (−3.48 to −0.37) |
| After a drop, 72h | −1.37% (−2.99 to +0.07) |
| After a drop, 120h | **−1.93%** (−3.72 to −0.18) |
| After a recovery, 72h | −1.18% (−3.16 to +1.47) |
| High-beta fifth after a recovery, 72h | −0.74% (−3.71 to +3.17) |

**One feature passed:** after a BTC drop, alts closest to their 30-day high did better over the next 72 hours.

| Distance from 30-day high, after drops | Value |
|---|---|
| IC, first 12 events / last 8 events | +0.137 / +0.125 (t 2.34) |
| IC, all 20 events | +0.132 (t 3.07; the bar for 36 looks is ~3.2) |
| Same IC on ordinary hours | +0.036 |
| Least-fallen fifth minus most-fallen fifth, 72h | +1.17% (−1.44 to +3.31) |
| Least-fallen fifth minus BTC, 72h | −0.97% |

Nothing else passed: not the drop beta, range position, 90-day lag or rotation score, and nothing at all after recoveries.

## What it means

1. **After a sharp BTC drop, alts keep losing to BTC for several days.** Buying alts into a BTC drop has been a losing trade on average.
2. **If you hold alts through a drop, the ones that held up best keep holding up.** Relative strength is about four times
   stronger after drops than on ordinary days. Even so, the strongest alts still trailed BTC after fees, so this is a rule for
   *which* alts to keep, not a reason to buy.
3. **After BTC recovers, alts don't catch up within five days on average.** No feature predicted which ones would. High-beta
   alts did not lead.
4. Oct 18 type rebounds happen, but they aren't the typical outcome after either event type.

A forward test, `post-btc-drop-relative-strength-forward-v1`, now scores the relative-strength spread on each new BTC drop.

## Limits

20 events per type is small; 12/8 splits give wide intervals. Hourly USD candles, no volume, survivor universe.

## Reproduce

```sh
python3 -m research.recovery_lab.btc_event_study --out /tmp/zobiris_btc_events
```

## Live monitor

`python3 -m research.recovery_lab.drop_monitor` pulls closed Kraken 1h candles, applies the drop rule, and writes each new
drop (with the ranking at the event hour) to `docs/market-memory/post-btc-drop-forward.jsonl`, then scores it after 72 hours.
First scan, 22 Oct 05:00 UTC bar: BTC $82,737, −2.4% from its 48h high, no drop in the window.
