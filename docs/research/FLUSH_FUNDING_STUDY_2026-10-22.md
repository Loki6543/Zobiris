# Do funding rates explain which alts rebound after a flush?

**Authority:** `SHADOW_ONLY_NO_TRADING_AUTHORITY`. Research only.

**Idea.** A flush driven by crowded shorts (funding turning negative) should rebound harder, because shorts must buy back.
Registered as `flush-funding-positioning-v1` (2026-10-22 13:23 UTC) before any outcome was seen.

**Data.** Kraken Futures hourly funding for 35 alt perpetuals (Oct 2025 → Oct 2026, fetched via Firecrawl), joined to the
70 flushes from the year study that fall in that window. Only funding stamped at or before the flush hour is used.

| Test | Result |
|---|---|
| Funding level vs 24h return vs BTC (primary) | IC +0.002 (t 0.11): no link |
| Funding change vs 24h return (primary) | IC −0.003 (t −0.15): no link |
| Funding level vs 6h return | Holdout −0.049 (t −2.3) but discovery −0.007; overall t −1.04. Not credible |
| Flushes where funding fell most vs least, 24h, most-flushed fifth minus BTC | −0.43% vs +0.26%: the opposite of the idea, both intervals span zero |

**Takeaway.** Funding alone doesn't show who is forced to buy back. The missing pieces are liquidation size and open-interest
change, which show forced selling directly. Kraken's public API has neither historically; they need a paid or
derivatives-native source (Coinglass, Hyperliquid via Coinversa, or CoinDesk with more quota).

```sh
python3 -m research.recovery_lab.funding_study --out /tmp/zobiris_funding
```
