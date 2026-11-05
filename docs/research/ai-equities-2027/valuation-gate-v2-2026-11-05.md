# Valuation Gate v2: Corrected Reverse DCF, 5 Nov 2026

**Scope.** This is research qualification only; it authorises no orders. It replaces the method in `reverse_dcf.py` (v1).

**Reproduce:** `reverse_dcf_v2.py`. Prices are 4 Nov 2026 regular-session closes.

## 1. What changed

**The v1 flaws:**
- **Interest counted twice.** v1 discounted free cash flow measured *after* interest and then also subtracted net debt. Cash-rich firms also had their interest income counted twice.
- **One rate for everything.** v1 used 9% as both the cost of equity and the WACC.

**v2 definitions** (trailing four quarters; full detail in the script header):

| Item | Definition |
|---|---|
| Shareholder cash flow (FCFE) | Operating cash flow − capex − stock compensation. Discounted at the cost of equity. Equity = present value; debt held constant. |
| Whole-company cash flow (FCFF) | FCFE + (interest expense − interest income) × (1 − tax). Discounted at WACC. Equity = enterprise value + cash and short-term investments − debt − preferred − minority interests. |
| Steady basis | Capex replaced by depreciation and amortisation. **Reported basis:** actual capex. |
| Cost of equity | 4.9% risk-free + adjusted beta × 4.0% equity premium. Adjusted beta = 0.67 × raw + 0.33. |
| WACC | Cost of debt 5.5% pre-tax. Debt excludes leases (leases are a sensitivity). |
| Horizon | 10 years at constant growth, then a terminal value at 2% or 3%. |
| Reinvestment | **Base:** none beyond the capex already in the cash flow. **Value-driver variant:** cash = NOPAT × (1 − g / return on new capital), tested at 15%, 25% and 40% returns. |

**Estimated inputs (flagged in the script):**
- Meta's Q3 interest.
- TSMC's Q3 interest expense.
- Broadcom's fiscal Q4-2025 capex, stock compensation and interest; its interest income and tax rate.
- Broadcom's stock compensation is now deducted (about $8.6bn). v1 could not deduct it.

## 2. Old versus corrected: implied 10-year growth (terminal growth 3%)

| Stock | v1 (28 Oct) | v1 (4 Nov) | **Definition fix only** (flat 9%) | **Corrected** (FCFF at WACC) | FCFE at cost of equity | Cost of equity / WACC |
|---|---|---|---|---|---|---|
| META | 5.0% | 5.4% | 4.6% | **6.0%** | 6.4% | 9.65% / 9.40% |
| TSM | 10.0% | 8.6% | 9.0% | **11.4%** | 11.7% | 10.09% / 10.01% |
| MSFT | 9.5% | 10.1% | 9.8% | **9.8%** | 10.0% | 9.02% / 8.98% |
| GOOGL | 9.6% | 9.5% | 9.5% | **10.7%** | 11.3% | 9.51% / 9.34% |
| AMZN | 15.0% | 15.4% | 14.4% | **17.2%** | 17.7% | 10.23% / 9.89% |
| AVGO | 15.5% | 14.8% | 16.2% | **19.2%** | 20.2% | 10.25% / 10.04% |
| NVDA | 15.1% | 14.3% | 13.8% | **20.8%** | 20.9% | 12.16% / 12.11% |

**Reading:**
- The definition fix by itself moves results by less than one point, except Broadcom (stock compensation now deducted).
- The large changes come from using beta-based discount rates: NVDA's adjusted beta is 1.81, AMZN 1.33, AVGO 1.34, TSM 1.30.
- The 10% gate threshold was calibrated under the flat 9% rate. **Choosing the discount-rate convention is therefore a decision, not a computation.**

## 3. Sensitivity

**Corrected method, steady basis.** The grid is cost of equity ±1 point × terminal growth 2–3% × stock compensation in or out × leases in or out.

| Stock | Range | Base | Stock compensation excluded | Leases deducted |
|---|---|---|---|---|
| META | +0.1% to +9.0% | 6.0% | 2.1% | 6.0% |
| MSFT | +6.2% to +13.4% | 9.8% | 8.7% | 9.9% |
| GOOGL | +5.4% to +14.0% | 10.7% | 7.7% | 10.7% |
| TSM | +9.2% to +14.5% | 11.4% | 11.4% | 11.4% |
| AMZN | +11.6% to +20.6% | 17.2% | 13.8% | 17.3% |
| AVGO | +13.7% to +22.5% | 19.2% | 16.0% | 19.2% |
| NVDA | +17.9% to +23.7% | 20.8% | 20.0% | 20.8% |

**Reported capex basis and reinvestment** (implied growth):

| Stock | Reported capex | Return on new capital 40% | 25% | 15% |
|---|---|---|---|---|
| META | 69.8% | 7.7% | 9.2% | 13.9% |
| MSFT | 24.3% | 12.0% | 13.8% | unreachable |
| GOOGL | n/a (negative FCF) | 13.0% | 15.0% | unreachable |
| TSM | 18.1% | 14.1% | 16.4% | unreachable |
| AMZN | n/a (negative FCF) | 20.5% | 23.4% | unreachable |
| AVGO | 19.2% | 22.7% | unreachable | unreachable |
| NVDA | 21.2% | 25.5% | unreachable | unreachable |

"Unreachable" means today's price is above the maximum value the model can produce when new investment earns only that return. The price therefore implies higher returns on new capital.

**Effects of each assumption:**
- **Stock compensation** matters most for GOOGL, META, AMZN and AVGO.
- **Leases** are immaterial at these market values.
- **Reinvestment** is the largest single assumption: requiring growth to be funded raises every hurdle.

## 4. TSMC ceiling (price at which implied growth = 10%)

| Convention | Ceiling |
|---|---|
| v1, as published | $439 |
| Definition fix only, flat 9%, terminal 3% | **$427** (terminal 2%: $386) |
| Corrected, beta-based rates, terminal 3% | **$358** (range $292–$420 over cost of equity ±1 point and terminal 2–3%) |
| Beta-based rates, price for 12% growth | $412 (flat 9%: $494) |
| Reported capex basis | $225 |

**Conclusion:** **$439 is not supported under any v2 convention.**
- The second-tranche rule needs a close above $412. With a beta-based ceiling of $358 it could never fill.
- Under flat 9% it could fill only between $412 and $427.
- The owner chooses the convention, or a different growth threshold.

## 5. Limits

- Trailing cash flows, not forecasts. A constant growth rate, a single terminal value and constant leverage.
- TSMC's Taiwan-dollar cash flows are discounted at US-dollar rates.
- Raw betas are noisy; NVDA's raw beta is 2.22.
- The equity premium (4.0%) and risk-free rate (4.9%) are assumptions.
- Not deducted: Nvidia's customer guarantees, purchase commitments, and the timing of Meta's financing.
- Meta's market value uses diluted shares (2.573bn) because the FMP profile value ($1.395tn) was inconsistent with them.
