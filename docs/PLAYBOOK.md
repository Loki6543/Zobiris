# Zobiris Playbook

Rules backed by tested evidence (Kraken fees included, rules written before results). Research guidance, not order authority.

| # | Rule | Evidence | Source |
|---|---|---|---|
| 1 | **Only take trades worth more than the fee.** A Kraken round trip costs 0.4% (maker) to 0.8% (taker). Hold for days, not minutes, and use limit orders. | Every intraday BTC pattern tested moves the next 10–60 min by < 0.05% on average. | `RECOVERY_RESEARCH_VERIFICATION_2026-10-22.md` |
| 2 | **Don't buy alts while BTC is dropping.** After BTC falls 5% in 48h, alts keep trailing it. | 20 drops: alts −1.7% vs BTC next day, −1.9% over 5 days, after fees. | `BTC_EVENT_CONDITIONAL_STUDY_2026-10-22.md` |
| 3 | **In a drop, keep the strongest alts and cut the weakest.** Strength = closest to the 30-day high. | Passed holdout: rank correlation +0.13, four times ordinary days. Live monitor runs daily. | same |
| 4 | **Avoid coins down 35%+ over 90 days.** | 467 cases: median −5.2% vs BTC over the next 30 days. | `DELAYED_ROTATION_REPLAY_2026-10-22.md` |
| 5 | **Treat a flush as context, not an entry.** Buying the most-flushed alts lost to BTC after fees; Oct 18 was a rare outlier. | 80 flushes over 14 months: −0.5% at 6h, no edge at 24–72h. | `ALT_FLUSH_EVENT_STUDY_2026-10-22.md` |
| 6 | **Don't trust a score until it's been scored.** Rotation score and opportunity score showed no positive skill; QUALIFIED didn't beat rejected coins. | 47 weekly replays; live outcome memory. | `DELAYED_ROTATION_REPLAY_2026-10-22.md`, `LIVE_ENGINE_REVIEW_2026-10-22.md` |

## Useful context (not triggers)

- Quarter-hour marks bring bursts of trading and bigger moves on Kraken; avoid market orders in the first seconds.
- A BTC level that has sat untouched for hours is slightly more likely to break (+5–9 points), far from "almost definitely".
- Relative volume differs by exchange; judge it on Kraken.

## Where the next edge is likely

Information charts don't show: futures positioning and liquidations, scheduled events (unlocks, upgrades, listings), and
the owner's own calls, scored the same way as the models.
