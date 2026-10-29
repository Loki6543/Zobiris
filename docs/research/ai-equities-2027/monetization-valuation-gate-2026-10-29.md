# Monetization and Valuation Gate (Annex to v5.1)

**Prepared:** 29 Oct 2026, from prices at the 28 Oct close.
**Scope:** This is research qualification only. It does not authorise orders, position sizes or Zobiris gates; the owner decides any change.
**Reproduce:** `reverse_dcf.py` in this folder.

## 1. Method

**Reverse DCF.** The question is what 10-year annual free-cash-flow (FCF) growth today's price requires.
- FCF grows at that rate for 10 years, then at 3% forever.
- It is discounted at 9%: the 10-year Treasury at about 5.0%, plus a 4-point equity premium. Sensitivity runs use 8% and 10%.
- Equity value is the present value of FCF plus net cash.
- **Not deducted:** leases, Nvidia's guarantees and Meta's preferred stock. Each result is therefore slightly flattering.

**Two cash bases**, both after deducting stock compensation as a real cost:
- **Reported FCF:** operating cash flow (OCF) minus capex minus stock compensation, trailing four quarters. It is depressed while the buildout continues.
- **Steady-state FCF:** OCF minus depreciation minus stock compensation. This is what FCF would be if capex fell to depreciation. It is an upper bound on near-term cash, because capex is still rising.

The truth for 2027 is somewhere between the two bases.

**Sources.**
- FMP quarterly cash-flow statements (most recent quarter in brackets): MSFT [Sep 26], GOOGL [Sep 26], AMZN [Jun 26], META [Sep 26], NVDA [Jul 26], TSM [Sep 26, TWD converted at 32.52].
- Broadcom's statements are not on this FMP plan. For AVGO, Yahoo's trailing OCF was used, and stock compensation is *not* deducted (unavailable), so its result is optimistic.
- Market caps and net cash are from Yahoo. Some balance-sheet dates lag a quarter.

## 2. What each price requires

Implied growth of steady-state FCF over the next 10 years:

| Company | Market cap ($bn) | Reported FCF minus SBC ($bn) | Steady-state FCF ($bn) | At 8% | At 9% | At 10% |
|---|---|---|---|---|---|---|
| MSFT | 3,943 | 47.4 | 141.2 | 7.0% | **9.5%** | 11.8% |
| GOOGL (28 Oct close) | 3,973 | −10.7 | 121.1 | 8.5% | 11.1% | 13.4% |
| GOOGL (~$292 after earnings) | ~3,570 | −10.7 | 121.1 | 7.1% | **9.6%** | 11.9% |
| AMZN | 2,746 | −30.9 | 66.9 | 12.3% | **15.0%** | 17.5% |
| META | 1,594 | 1.7 | 81.2 | 2.6% | **5.0%** | 7.2% |
| NVDA | 5,201 | 119.8 | 119.8 | 12.4% | **15.1%** | 17.5% |
| AVGO (optimistic) | 1,679 | 38.5 | 38.5 | 12.8% | **15.5%** | 17.9% |
| TSM | 2,280 | 46.3 | 74.2 | 7.5% | **10.0%** | 12.3% |

**On reported FCF:**
- MSFT would need 24% a year, and META 60%.
- GOOGL and AMZN can't be valued this way: their reported FCF after stock compensation is negative.

**Reading:**
- **Undemanding (5–10%) if spending normalises:** META, MSFT, GOOGL after earnings, TSM. They require FCF to roughly double over 10 years, but only *if* capex eventually falls back toward depreciation.
- **Demanding (about 15%) from today's level:** NVDA, AVGO, AMZN. NVDA and AVGO start from what may be peak-cycle cash, so sustained 15% growth for a decade from a peak is a high bar. AMZN starts from a low base: its retail margins are thin and AWS investment is heavy.

## 3. Monetization evidence (the §1 criteria in v5.1)

| Test | MSFT | GOOGL | AMZN | META |
|---|---|---|---|---|
| AI revenue disclosed? | Proxy only: Azure $33.2bn, +48% | Proxy only: Google Cloud $30.7bn, +103% (includes TPU sales) | Proxy only: AWS $42.2bn, +37% (Q2) | None; ads only |
| Operating leverage: is operating income growing faster than revenue? | **Yes:** +21% against +19% | **Yes:** +30% against +25% | Q3 due 29 Oct after the close | **No:** +11% ex-charge against +26% |
| Depreciation trend | $11.7bn a quarter, +45% year on year | $8.4bn, up 39% since Q4 2025 | $20.0bn, +19% year on year | $7.2bn, up 32% since Q4 2025 |
| Contracted demand | Commercial RPO $677bn, +73% (concentration in AI labs not disclosed) | Cloud backlog not checked | Not checked | n/a |
| Reported FCF minus SBC, trailing year | +$47.4bn | −$10.7bn (2 negative quarters) | −$30.9bn | +$1.7bn |
| Funding | Self-funded, still buying back stock | Debt and equity raised; buybacks stopped | Net debt issuance about $76bn over 4 quarters | $37.5bn equity raise, plus debt |

**Suppliers:**

| Test | NVDA | AVGO | TSM |
|---|---|---|---|
| Growth | Data centre $89bn a quarter, +106% | Revenue +86% | US-dollar revenue +41% |
| Quality of cash | Receivables rose $22.3bn and inventory $5.8bn in one quarter (Q2), a collection and timing flag | Net debt about $35bn; stock compensation unknown | Net cash about $98bn |
| Customer financing exposure | Up to $105bn of guarantees, plus $36bn of backstops for smaller cloud providers | Concentrated custom-chip customers (not quantified) | Broad customer base; Taiwan exposure |
| Cycle position | Margins at a record: mid-cycle unknown | Same | Gross margin 66.4% against 65–67% guidance |

## 4. Where the capex × monetization grid stands now
**Capex is still rising. Monetization is mixed:**
- **Strong:** the cloud platforms. MSFT and GOOGL both show operating leverage.
- **Weak:** META, where margins are shrinking even though revenue is growing.

**What that favours:** suppliers and cloud-heavy platforms. It does not favour ad-funded spending without a cloud business to recoup it.

**The flag to watch:** if cloud growth slows while capex guidance keeps rising, the grid moves into the "suppliers gain, platforms suffer" cell.

## 5. Research qualification status
These are research tiers, not orders. Any weight is a ceiling inside the v5.1 sleeves; anything not qualified stays in cash.

| Company | Status | Why | What would change it |
|---|---|---|---|
| **MSFT** | **Provisionally qualified** | Operating leverage is positive, FCF is self-funded, and the price requires about 9.5% | Azure growth below 30%, or operating income growing slower than revenue for 2 quarters |
| **GOOGL** | **Conditional, half weight** | Strong cloud and operating leverage; the post-earnings price requires about 9.6%. But FCF is negative and capex is funded externally | Reported FCF turning positive again, or dilution capped |
| **AMZN** | **Not yet** | FCF is negative and the price requires 15% | Q3 results (29 Oct): AWS growth, operating leverage, capex guidance |
| **META** | **Not yet** | The cheapest by valuation (about 5%) but fails operating leverage, discloses no AI revenue, and is diluting | Two quarters of operating income growing faster than revenue |
| **TSM** | **Provisionally qualified** | Net cash, diversified customers, and the price requires about 10% | A Taiwan escalation, or gross margin below 60% |
| **NVDA** | **Conditional, small** | Strong cash, but the price requires 15% from a possible peak; receivables jumped; guarantees | Receivables normalising, and Q3 (17 Nov) guidance |
| **AVGO** | **Not yet** | No stock-compensation data; net debt; the price requires 15% even on optimistic cash | Full statements obtained |

**If the owner chose to act on these tiers,** within the v5.1 ceilings (23% platforms, 11% suppliers):
- Platforms: MSFT up to 8% and GOOGL up to 4%, about 12% of the 23%.
- Suppliers: TSM up to 6% and NVDA up to 3%, about 9% of the 11%.
- Everything else stays in cash until it qualifies.

That puts roughly 21% in AI names. This is an illustration, not a recommendation to buy.

## 6. Limits
- These are trailing cash flows, not forecasts. The model is very sensitive to the discount rate: moving it by 1 point shifts implied growth by about 2.3–2.5 points.
- Leases, guarantees, preferred stock and the timing of Meta's raise are not deducted. Each makes the affected stock slightly more expensive than shown.
- Amazon reports Q3 today after the close, and Nvidia on 17 Nov. Both tiers should be rerun then.
- "Steady-state FCF" assumes capex can fall to depreciation without losing competitive position. That is the core uncertainty of the whole AI thesis.
