"""Valuation-gate refresh, 4 Nov 2026. Same model as reverse_dcf.py (10y FCF growth g, then 3%,
discounted at r; equity = PV + net cash). Market caps are the 28 Oct figures scaled by price:
28 Oct regular-session close vs 4 Nov intraday, both from Kraken xStock hourly/ticker data.
AMZN cash flows refreshed to Q3 2026 (FMP quarterly cash-flow statements); AMZN net cash is an
estimate (Q2 figure minus Q3 cash change and net debt issuance, plus net investment purchases)."""
# name: (mcap 28 Oct $bn, net cash, reported FCF - SBC TTM, steady FCF TTM, close 28 Oct, price 4 Nov)
D = {
 'MSFT':  (3943, 76.8-128.8, 47.401, 141.191, 529.90, 552.76),
 'GOOGL': (3973, 242.5-120.8, -10.662, 121.147, 325.03, 289.53),
 'AMZN':  (2746, -186.0, 168.300-215.192-19.873, 168.300-79.353-19.873, 254.33, 266.66),
 'META':  (1594, 82.4-114.8, 1.707, 81.225, 612.02, 628.71),
 'NVDA':  (5201, 62.5-38.9, 119.764, 119.764, 215.26, 202.04),
 'AVGO':  (1679, 24.0-59.4, 38.5, 38.5, 351.75, 332.72),
 'TSM':   (2280, (4017-818)/32.52, (3159.6-1653.7)/32.52, (3159.6-746.2)/32.52, 439.59, 394.99),
}
def value(f0, g, r, tg=0.03, n=10):
    pv, f = 0.0, f0
    for t in range(1, n+1):
        f *= 1+g; pv += f/(1+r)**t
    return pv + f*(1+tg)/(r-tg)/(1+r)**n
def implied(f0, target, r):
    if f0 <= 0: return None
    lo, hi = -0.5, 1.0
    for _ in range(200):
        m = (lo+hi)/2
        lo, hi = (m, hi) if value(f0, m, r) < target else (lo, m)
    return m
print(f"{'':6}{'mcap now':>9}  implied g at 8/9/10%     price for g=10% / 12% (r=9%)")
for k, (mc, nc, rep, st, p0, p) in D.items():
    sh = mc/p0; m = sh*p
    gs = [implied(st, m-nc, r) for r in (0.08, 0.09, 0.10)]
    px = [(value(st, g, 0.09)+nc)/sh for g in (0.10, 0.12)]
    print(f"{k:6}{m:9.0f}  " + " ".join(f"{g*100:5.1f}%" for g in gs) + f"     ${px[0]:.0f} / ${px[1]:.0f}")
# AMD (new, FMP Q4 2025-Q3 2026): OCF 9.123, capex 2.067, SBC 1.999 -> FCF-SBC 5.06; shares ~1.63bn (unverified)
print("AMD   implied g on FCF-SBC 5.06 at $483.20:", " ".join(f"{implied(5.06, 1.63*483.20, r)*100:.1f}%" for r in (0.08, 0.09, 0.10)))
