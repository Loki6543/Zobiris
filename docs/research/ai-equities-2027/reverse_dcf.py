"""Reverse DCF: what 10-year annual FCF growth does today's price require?
Inputs are TTM cash flows (FMP quarterly statements; AVGO from Yahoo TTM) and 28 Oct 2026
closes (Yahoo). $bn. Model: FCF grows at g for 10 years, then 3% forever; discounted at r.
Equity value = PV(FCF) + net cash. Leases, guarantees and preferred claims are NOT deducted."""
# name: (market cap, net cash, reported FCF - SBC, steady-state FCF, note)
D = {
 'MSFT': (3943, 76.8-128.8, 59.957-12.556, 195.878-42.131-12.556, 'steady = OCF - D&A - SBC'),
 'GOOGL': (3973, 242.5-120.8, 19.747-30.409, 179.551-27.995-30.409, 'cash/debt Yahoo, Jun qtr'),
 'GOOGL post-earnings': (3570, 242.5-120.8, 19.747-30.409, 179.551-27.995-30.409, 'pre-market ~$292 on 29 Oct'),
 'AMZN': (2746, 123.0-251.6, -11.625-19.314, 161.403-75.2-19.314, 'TTM to Q2 2026'),
 'META': (1594, 82.4-114.8, 28.65-26.943, 133.088-24.92-26.943, 'before $37.5bn equity raise'),
 'NVDA': (5201, 62.5-38.9, 134.36-7.354-7.242, 134.36-7.354-7.242, 'capex used for D&A; OCF after $30.7bn WC build'),
 'AVGO': (1679, 24.0-59.4, 38.5, 38.5, 'FCF before SBC (SBC not available): optimistic'),
 'TSM': (2280, (4017-818)/32.52, (3159.6-1653.7)/32.52, (3159.6-746.2)/32.52, 'TWD at 32.52/USD'),
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
print(f"{'':20}{'mcap':>6}{'FCF-SBC':>9}{'steady':>8}  implied 10y growth of steady FCF at r = 8% / 9% / 10%   | reported FCF-SBC at 9%")
for k,(mc,nc,rep,st,note) in D.items():
    tgt = mc - nc
    gs = [implied(st, tgt, r) for r in (0.08,0.09,0.10)]
    gr = implied(rep, tgt, 0.09)
    print(f"{k:20}{mc:6.0f}{rep:9.1f}{st:8.1f}  " + "  ".join(f"{g*100:6.1f}%" for g in gs) + f"   | {'n/a (negative)' if gr is None else f'{gr*100:.1f}%'}   [{note}]")
