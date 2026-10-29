# Calendarise FY EPS consensus (FMP pull 29 Oct 2026, from valuation_capex.md) to CY.
fy = {  # fiscal-year EPS: first, second, third listed years
 'NVDA': (9.29, 15.81, 21.38), 'MSFT': (17.00, 19.79, 23.63), 'AAPL': (8.84, 9.57, 10.61),
 'GOOGL': (20.60, 15.35, 18.41), 'AMZN': (12.87, 10.66, 14.10), 'META': (29.21, 34.14, 40.03), 'TSLA': (1.68, 2.04, 2.88)}
def cal(a, b, c, w, ext_seasonal=None):
    d = c * (c / b)  # missing 4th FY: extrapolate last growth rate (assumption)
    return (w*a+(1-w)*b, w*b+(1-w)*c, w*c+(1-w)*d)
rows = {}
for k,(a,b,c) in fy.items():
    if k == 'MSFT': rows[k] = cal(a,b,c,0.5)      # FY Jun: CY = 1/2 FY(n) + 1/2 FY(n+1)
    elif k == 'AAPL': rows[k] = cal(a,b,c,0.75)   # FY Sep: CY = 3/4 FY(n) + 1/4 FY(n+1)
    else: rows[k] = (a,b,c)                       # NVDA FY Jan ~ CY (1-month offset); others CY
g = {k:(v[1]/v[0]-1, v[2]/v[1]-1) for k,v in rows.items()}
mean = lambda ks,i: sum(g[k][i] for k in ks)/len(ks)
allk = list(g); exn = [k for k in allk if k!='NVDA']; exga = [k for k in allk if k not in('GOOGL','AMZN')]
for k in allk: print(f"{k:5} CY26 {rows[k][0]:6.3f} CY27 {rows[k][1]:6.3f} CY28 {rows[k][2]:6.3f}  g27 {g[k][0]*100:6.2f}%  g28 {g[k][1]*100:6.2f}%")
for name,ks in (('all 7',allk),('ex NVDA',exn),('ex GOOGL/AMZN',exga),('ex NVDA,GOOGL,AMZN',[k for k in exga if k!='NVDA'])):
    print(f"{name:20} mean g27 {mean(ks,0)*100:6.2f}%  g28 {mean(ks,1)*100:6.2f}%")
# AAPL seasonal variant: Dec quarter ~30% of FY EPS
a,b,c = fy['AAPL']; s=(0.7*a+0.3*b, 0.7*b+0.3*c); print('AAPL seasonal g27 %.2f%%' % ((s[1]/s[0]-1)*100))
# MSFT without extrapolated FY29: CY28 unavailable
