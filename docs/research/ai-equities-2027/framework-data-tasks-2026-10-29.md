# Framework Data Tasks: Populated (29 Oct 2026)
Research only.

## Task 1: Reverse DCF at an 11% discount rate
Source: `dcf_sensitivity.py`. The table shows the 10-year FCF growth rate (*g*) each price implies.

| Company | Implied *g* at r = 9%, terminal 3% | Implied *g* at r = 11%, terminal 3% | Within the 12% gate at 11%? |
|---|---|---|---|
| MSFT | 9.5% | 13.9% | No |
| GOOGL (~$292) | 9.6% | 14.0% | No |
| TSM | 10.0% | 14.5% | No |

**Finding:** all three pass the 12% gate at a 9% discount rate and fail it at 11%. The equity sleeve is therefore rate-conditional: if required returns rise to about 11%, current prices look full.

## Task 2: Defensive candidates, weekly adjusted closes (Yahoo)
DD is the worst peak-to-trough drawdown inside the window, and R is the return over the window.

| | 2007–09 | 2020 | 2022 | Total return since Oct 2011 |
|---|---|---|---|---|
| JNJ | DD −32 / R +4 | DD −21 / R +11 | DD −12 / R +4 | +532% |
| PEP | DD −38 / R −12 | DD −29 / R +13 | DD −12 / R +7 | +231% |
| WMT | DD −25 / R +23 | DD −10 / R +26 | DD −25 / R −1 | +738% |
| PG | DD −37 / R −9 | DD −19 / R +15 | DD −23 / R −5 | +276% |
| MET | DD −82 / R −47 | DD −53 / R −6 | DD −17 / R +11 | +392% |
| AIG | DD −99 / R −98 | DD −64 / R −24 | DD −25 / R +6 | +308% |
| CB (ACE before 2016) | DD −50 / R −15 | DD −39 / R +5 | DD −17 / R +11 | +554% |
| BRK-B | DD −53 / R −18 | DD −26 / R +2 | DD −26 / R −3 | +576% |
| SPY | DD −55 / R −25 | DD −32 / R +17 | DD −22 / R −17 | +680% |

**Pass rule:** a smaller drawdown than SPY in all three windows.
- **Passes:** JNJ and PEP.
- **Near misses** (worse than SPY in 2022 only): WMT and PG.
- **Fails:** CB (2020) and BRK-B (2022) each fail one window. MET and AIG fail outright.

## Task 3: 40-week SMA check
The latest bar is the week of 26 Oct, which is still in progress, so the rule uses completed weeks.

| Holding | Close | 40-week SMA | Gap | State |
|---|---|---|---|---|
| MSFT | 531.01 | 437.20 | +21.5% | above |
| TSM | 439.51 | 401.96 | +9.3% | above |
| GOOGL | 324.89 (~292 after earnings) | 340.78 | −4.7% (~−14%) | **below for 2 weeks: rule state is "half"** |
| NVDA | 215.38 | 204.42 | +5.4% | above |
| CB | 355.50 | 335.54 | +5.9% | above |
| BRK-B | 540.34 | 496.92 | +8.7% | above |

## Opportunity cost
At the owner's 4% savings rate (not 4.5%), $330 × (10% − 4%) ≈ **$19.80 a year** of foregone return, under the illustrative 10% equity assumption.
