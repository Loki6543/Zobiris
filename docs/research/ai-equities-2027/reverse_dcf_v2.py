"""Corrected reverse DCF (v2), 5 Nov 2026. Replaces the mixed method in reverse_dcf.py.

WHAT WAS WRONG (v1): free cash flow measured *after* interest was discounted at one 9% rate and
then net debt was also subtracted (interest counted twice for indebted firms; interest income on
cash counted twice for cash-rich firms), and the same 9% served as both cost of equity and WACC.

V2 DEFINITIONS (all $bn, trailing four quarters; TSM converted from TWD at 32.52):
  FCFE  = OCF - capex - SBC                      (shareholder cash flow; OCF is after interest)
  FCFF  = FCFE + (interest expense - interest income) * (1 - tax)   (whole-company cash flow)
  "steady" basis replaces capex with D&A (capex falls to maintenance); "reported" uses actual capex.
  FCFE is discounted at the cost of equity ke; equity = PV. Debt is held constant (no net borrowing).
  FCFF is discounted at WACC; equity = EV + cash & short-term investments - debt - preferred - minority.
  ke = rf + adjusted beta * ERP, rf 4.9% (10-year, 4 Nov), ERP 4.0%, adjusted beta = 0.67*raw + 0.33.
  WACC = E/(E+D)*ke + D/(E+D)*kd*(1-t), kd 5.5% pre-tax, D = financial debt excluding leases.
  Horizon: 10 years at constant g, then a Gordon terminal value at tg (2% or 3%).
  Reinvestment: base case assumes no reinvestment beyond the capex already in the cash flow.
  Value-driver variant: FCFF_t = NOPAT_t * (1 - g/RONIC), NOPAT proxy = steady FCFF; RONIC 15% / 25%.
Prices: regular-session closes on 4 Nov 2026 (FMP profile). Shares: latest diluted weighted average.
ESTIMATED inputs (flagged): META Q3 interest (FMP blank, Q2 used); TSM Q3 interest expense (3.0bn TWD);
AVGO fiscal Q4-2025 capex, SBC, interest and full-year interest income and tax rate (10-Q / release
give 9-month figures; Yahoo gives TTM OCF). AVGO steady basis = reported (capex below depreciation).
Not deducted: NVDA guarantees, purchase commitments. Finance-lease principal is not in FCF; leases are
a sensitivity, not the base.
"""
FX = 32.52
#        price,  shares, beta,  OCF,     capex,   D&A,     SBC,    intInc, intExp, tax,   cash,    debt,    leases, pref+minority
D = {
 'MSFT': (555.80, 7.446, 1.044, 195.878, 135.921, 42.131, 12.556, 3.069, 3.223, 0.197, 64.643, 35.481, 98.450, 0.0),
 'GOOGL':(288.93, 12.368,1.226, 179.551, 159.804, 27.995, 30.409, 5.788, 3.076, 0.180, 265.098,125.102, 16.815, 18.023),
 'AMZN': (266.03, 10.929,1.495, 168.300, 215.192, 79.353, 19.873, 4.747, 4.484, 0.224, 114.226,173.125, 98.824, 0.0),
 'META': (630.00, 2.573, 1.278, 133.088, 104.438, 24.920, 26.943, 3.620, 2.836, 0.170, 82.449, 80.922, 31.173, 0.0),
 'NVDA': (200.13, 24.285,2.216, 134.360, 7.354,   3.687,  7.242,  2.229, 0.463, 0.160, 99.369, 33.366, 5.494,  0.0),
 'AVGO': (325.48, 4.774, 1.504, 40.653,  1.250,   1.250,  8.600,  0.700, 3.150, 0.150, 23.975, 61.079, 0.0,    0.0),
 'TSM':  (395.75, 5.186, 1.443, 3159.610/FX, 1653.730/FX, 746.184/FX, 0.410/FX, 120.057/FX, 11.850/FX, 0.172,
          4007.955/FX, 981.304/FX, 0.0, 45.224/FX),
}
OLD_PUBLISHED = {'MSFT': (9.5, 10.1), 'GOOGL': (9.6, 9.5), 'AMZN': (15.0, 15.4), 'META': (5.0, 5.4),
                 'NVDA': (15.1, 14.3), 'AVGO': (15.5, 14.8), 'TSM': (10.0, 8.6)}   # (28 Oct, 4 Nov) at 9%
RF, ERP, KD = 0.049, 0.040, 0.055

def pv(cf, g, r, tg, n=10, R=None):
    """PV of cf growing at g for n years then tg. With R (RONIC), cash = NOPAT*(1-g/R)."""
    v, x = 0.0, cf
    for t in range(1, n+1):
        x *= 1+g
        v += x*(1-g/R if R else 1)/(1+r)**t
    term = x*(1+tg)*(1-tg/R if R else 1)/(r-tg)
    return v + term/(1+r)**n

def solve(cf, target, r, tg, R=None):
    if R is None:
        if cf <= 0: return None
        lo, hi = -0.5, 1.0
        for _ in range(200):
            m = (lo+hi)/2
            lo, hi = (m, hi) if pv(cf, m, r, tg) < target else (lo, m)
        return m
    if cf <= 0: return None
    prev = None
    for i in range(-300, 601):                       # scan g from -30% to +60%
        g = i/1000
        if g >= R and R < 1: break
        v = pv(cf, g, r, tg, R=R)
        if v >= target: return g
    return 'unreachable'

def parts(k, ke_shift=0.0, sbc=True, basis='steady', leases=False, tg=0.03, ke_flat=None):
    p, sh, b, ocf, capex, da, s, ii, ie, t, cash, debt, lease, pm = D[k]
    E = p*sh
    beta = 0.67*b+0.33
    ke = (ke_flat if ke_flat is not None else RF + beta*ERP) + ke_shift
    debt_v = debt + (lease if leases else 0)
    wacc = E/(E+debt_v)*ke + debt_v/(E+debt_v)*KD*(1-t)
    inv = capex if basis == 'reported' else da
    fcfe = ocf - inv - (s if sbc else 0)
    fcff = fcfe + (ie-ii)*(1-t)
    claims = cash - debt_v - pm
    return dict(E=E, ke=ke, wacc=wacc, fcfe=fcfe, fcff=fcff, claims=claims, tg=tg, sh=sh)

def implied(k, method='FCFF', R=None, **kw):
    q = parts(k, **kw)
    if method == 'FCFE':
        return solve(q['fcfe'], q['E'], q['ke'], q['tg'], R)
    return solve(q['fcff'], q['E']-q['claims'], q['wacc'], q['tg'], R)

def old_method(k, r=0.09, tg=0.03):
    """v1 replicated on v2 inputs: steady FCF after interest, 9%, plus net cash (double count)."""
    p, sh, b, ocf, capex, da, s, ii, ie, t, cash, debt, lease, pm = D[k]
    return solve(ocf-da-s, p*sh-(cash-debt), r, tg)

def ceiling(k, g=0.10, **kw):
    q = parts(k, **kw)
    return (pv(q['fcff'], g, q['wacc'], q['tg']) + q['claims'])/q['sh']

f = lambda x: 'n/a' if x is None else ('unreach.' if x == 'unreachable' else f"{x*100:+.1f}%")
if __name__ == '__main__':
    print("Discount rates")
    for k in D:
        q = parts(k)
        print(f"  {k:5} adj beta {0.67*D[k][2]+0.33:.2f}  ke {q['ke']*100:.2f}%  WACC {q['wacc']*100:.2f}%  "
              f"FCFE(steady) {q['fcfe']:.1f}  FCFF(steady) {q['fcff']:.1f}  cash-debt-pref {q['claims']:+.1f}  mcap {q['E']:.0f}")
    print("\nImplied 10-year growth (tg 3%)")
    print(f"  {'':5} {'v1 28Oct':>8} {'v1 4Nov':>8} {'v1 on v2 in':>11} | {'FCFF flat9':>10} {'FCFE flat9':>10} | {'FCFF@WACC':>9} {'FCFE@ke':>8} | {'reported':>8} | {'RONIC40':>8} {'RONIC25':>8} {'RONIC15':>8}")
    for k in D:
        o = OLD_PUBLISHED[k]
        print(f"  {k:5} {o[0]:7.1f}% {o[1]:7.1f}% {f(old_method(k)):>11} | {f(implied(k, ke_flat=0.09)):>10} {f(implied(k,'FCFE', ke_flat=0.09)):>10} | {f(implied(k)):>9} {f(implied(k,'FCFE')):>8} | "
              f"{f(implied(k, basis='reported')):>8} | {f(implied(k, R=0.40)):>8} {f(implied(k, R=0.25)):>8} {f(implied(k, R=0.15)):>8}")
    print("\nSensitivity range, FCFF@WACC steady basis: ke -1/0/+1pt x tg 2/3% x SBC in/out x leases in/out")
    for k in D:
        vals = []
        for ks in (-0.01, 0, 0.01):
            for tg in (0.02, 0.03):
                for sbc in (True, False):
                    for le in (False, True):
                        x = implied(k, ke_shift=ks, tg=tg, sbc=sbc, leases=le)
                        if isinstance(x, float): vals.append(x)
        noSBC = implied(k, sbc=False); withL = implied(k, leases=True)
        print(f"  {k:5} {min(vals)*100:+.1f}% to {max(vals)*100:+.1f}%   (base {f(implied(k))}; SBC excluded {f(noSBC)}; leases deducted {f(withL)})")
    print("\nTSM ceiling: price where FCFF@WACC implied growth = 10%")
    base = ceiling('TSM')
    cs = [ceiling('TSM', ke_shift=ks, tg=tg, leases=False) for ks in (-0.01, 0, 0.01) for tg in (0.02, 0.03)]
    print(f"  base ${base:.0f}  (range ${min(cs):.0f}-${max(cs):.0f} over ke +/-1pt, tg 2-3%);  v1 published $439")
    print(f"  flat ke 9% (isolates the definition fix): ${ceiling('TSM', ke_flat=0.09):.0f}; tg 2%: ${ceiling('TSM', ke_flat=0.09, tg=0.02):.0f}")
    print(f"  SBC excluded, beta ke: ${ceiling('TSM', sbc=False):.0f}; reported basis: ${ceiling('TSM', basis='reported'):.0f}")
    for g in (0.08, 0.12):
        print(f"  price for g={g*100:.0f}%: beta ke ${ceiling('TSM', g=g):.0f}; flat 9% ${ceiling('TSM', g=g, ke_flat=0.09):.0f}")
