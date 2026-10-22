# ZOBIRIS Market Memory — BTC floor defence and alt rotation, October 18–21, 2026

**Status:** four forecasts scored, one open. **Authority:** `SHADOW_ONLY_NO_TRADING_AUTHORITY`. This is a research log with a
companion JSONL ledger. It cannot size, buy, sell or bypass liquidity and portfolio controls.

## What happened (exchange-verified)

| Evidence | Time (UTC) | Value | Source |
|---|---|---|---|
| BTC 7-day floor anchor | Oct 15 13:00 | $79,709 low | Kraken XBTUSD 1h |
| Alt-flush trigger | Oct 18 19:45 | Alts −1.33% median over 30m while BTC −0.21%; 95% of alts down; volume 5.8× | Kraken 15m, 39 alts |
| Entry-state table | Oct 18 21:00 | INJ 3.2% / UNI 6.5% of their 24h range; 6h later +8.29% / +6.57% vs BTC +2.17% | Kraken 15m |
| User trades | Oct 18–19 | INJ bought $7.889, take-profit $8.692 (+10.2% gross); UNI bought $6.87, open | User screenshot |
| September analog | Sep 15→20 | UNI +33.3%, INJ +24.1%, ZEC +27.7% vs BTC +3.6% | Kraken 4h |
| COMP event | Oct 20 17:10 → Oct 21 17:30 | $29.12 peak, $24.97 trough, $26.03 close; 25.5% of the drop recovered | Kraken 5m |
| BTC at forecast deadline | Oct 21 20:00 | Low since forecast $80,568; close $84,622 | Kraken 1h |

## Lessons kept

- **Low range position was not a disqualifier.** The coins at the bottom of their 24h range (INJ, UNI, ZEC, ZRO) beat the
  range leaders (CVX, KAS) over the next six hours. Capitulation recovery and continuation leadership need separate models.
- **The user's September memory was real.** UNI and INJ led the Sep 15–20 BTC advance by 6–9× BTC's move. That is one analog,
  not a fitted beta. Store it as episode memory that decays and can be outvoted by current evidence.
- **Freeze event anchors.** COMP's 24h return flipped from +21% to −0.4% partly because its peak expired from the rolling window.
- **Relative volume is venue-specific.** On Oct 21, MNT read 2.86× on Binance futures but 0.06× on Kraken spot. Judge
  participation on the venue the user can trade.

## Forecast record

| Forecast | Made | Outcome | Brier |
|---|---|---|---|
| BTC holds $79,709 and is higher by Oct 21 20:10 | Oct 18 20:10 | PASS | user 0.00 (p=1.0), Claude 0.20 (p=0.55) |
| High-beta coins (ZRO NEAR ENA ZEC SUI INJ) beat leaders (XMR KAS) and BTC over 72h | Oct 18 20:55 | PASS: +16.4% vs +9.1% vs +4.6% | Claude 0.30 (p=0.45) |
| Next flush firing: cohort > +2% at 6h and beats BTC | Oct 19 03:45 | OPEN, no firing yet | — |
| Oct 21 rotation buckets: LEAD beats FOLLOWING and NEEDS_CONFIRMATION over 24h | Oct 22 ~01:15 | FAIL: vs BTC LEAD -3.53%, FOLLOWING -1.66%, NEEDS_CONF -4.85% (BTC -3.8%) | Claude 0.20 (p=0.45) |
| TIA two consecutive 1h closes above 0.6464 by Oct 22 17:30 | Oct 22 ~01:15 | MISS: best 1h close 0.6285 | Claude 0.09 (p=0.30) |

Disclosure: a routine 00:45 UTC scan showed QNT (LEAD) at −1.2% over 30 minutes before the Oct 21 tests were registered; no
group or 24h return was viewed.

Both scored forecasts went the user's way, and Claude's probabilities were too cautious on both. Two outcomes from one regime
are not calibration evidence; keep scoring.

**Structured data:** [event ledger](./recovery-rotation-2026-10-18-21.jsonl), twelve events. Verification of the related
21 Oct master research document: [evidence brief](../research/RECOVERY_RESEARCH_VERIFICATION_2026-10-22.md).
