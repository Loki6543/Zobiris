# Delayed-rotation screen: one-year replay

**Authority:** `SHADOW_ONLY_NO_TRADING_AUTHORITY`. This brief can demote or flag. It changes no production code or settings.

**Question.** The live engine's main screen, `DELAYED_ROTATION_PILOT_V1`, labels each coin QUALIFIED, NEAR_ROTATION, EXTENDED,
TOO_EARLY, NOT_LAGGING or STRUCTURALLY_WEAK, and gives it a 0–100 score. Over the past year, would those labels and that
score have picked coins that beat BTC after fees?

**Registration.** Test `delayed-rotation-replay-daily-v1` was registered at 2026-10-22 04:42 UTC, before any replay output.

## Design

| Item | Choice |
|---|---|
| Rules | Status ladder, market gate and score copied from `deploy/protection/overrides/src/strategy21/engine/delayedRotation.ts` at `f7f869c` |
| Data | The year-study snapshot: BTC + 36 alts (XMR excluded, stale feed), 1h closes |
| Decisions | Every 7 days at 00:00 UTC, Nov 2025 → Oct 2026 (47 dates; the gate was on for 11) |
| Outcome | Coin minus BTC log return, next 1h open → close 7d or 30d later, minus 0.40% maker round trip |
| Not replicable | Turnover (needs market cap and volume): treated as passing. Volume acceleration: left out, as the engine does when volume history is missing |
| Pass | QUALIFIED beats NOT_LAGGING with a 95% CI above zero, and the score's rank correlation (IC) with outcome has t ≥ 2 |

## Results

| 30d after fees | Gate on (11 dates) | All dates (47) |
|---|---|---|
| QUALIFIED | n 21, mean +12.0%, median +2.0% | n 24, mean +9.7%, median +1.7% |
| NEAR_ROTATION | n 13, mean +34.2%, median +7.7% | n 16, mean +28.3%, median +7.6% |
| EXTENDED | n 4, median +22.8% | n 4, median +22.8% |
| TOO_EARLY | n 21, median +15.8% | n 69, median −3.1% |
| NOT_LAGGING | n 185, median +4.1% | n 968, median −3.3% |
| STRUCTURALLY_WEAK | n 8, median +5.2% | n 467, median −5.2% |
| **QUALIFIED − NOT_LAGGING, same dates** | **−1.8% (−14.2 to +9.6)** | **−1.8% (−10.0 to +6.1)** |

| Score IC with excess return | 7d | 30d |
|---|---|---|
| All dates | −0.034 (t −1.05, 46 dates) | −0.08; on non-overlapping 35-day subsets −0.05 to −0.10 (t −0.7 to −2.4) |

## Decisions

1. **The screen fails its registered test.** QUALIFIED coins did not beat coins the screen rejects as NOT_LAGGING.
2. **The score has no positive skill and leans the wrong way.** Higher scores went with slightly worse 30-day results in every
   non-overlapping subset. Keep it as a description, never as a ranking for new capital.
3. **The market gate is rarely open.** It was on for 11 of 47 weeks, so the screen spends most of the year saying MARKET_NOT_BULLISH.
4. **Deep laggards stay weak outside bull gates.** STRUCTURALLY_WEAK coins (90d ≤ −35%) lost a median 5.2% to BTC over 30 days
   across all dates. The structural floor is the one rule with support here.
5. **NEAR_ROTATION and EXTENDED look strong but are tiny (16 and 4 cases)**, which is the same pattern seen in the live outcome
   memory with the opposite sign. Neither sample can support a rule.

## Limits

- No turnover filter, so illiquid coins the engine would have marked TOO_EARLY are in other buckets here.
- Changes are computed from Twelve Data closes, not CoinMarketCap's 24h/7d/30d/90d fields the engine reads.
- The universe is 36 liquid survivors, not the engine's 59-name watchlist.

## Reproduce

```sh
python3 -m research.recovery_lab.rotation_study --out /tmp/zobiris_rotation
```
