"""Illustrative 1-year Monte Carlo of the owner's full target (34% equities, 66% savings at 4%).
Assumptions are stated, not estimated: annual means/vols are rough priors, fat tails via a
Student-t (df=4) common shock. Outputs are scenario frequencies, not forecasts."""
import numpy as np
rng = np.random.default_rng(20261029)
names = ['MSFT','GOOGL','TSM','NVDA','CB','BRK','ENERGY','AXP']
w     = np.array([8,4,6,3,4,4,3,2])/100
mu    = np.array([.10,.10,.10,.10,.08,.08,.05,.09])
vol   = np.array([.30,.33,.40,.50,.22,.20,.32,.30])
ai = [0,1,2,3]; de = [4,5,7]; en = [6]
C = np.full((8,8), .45)
for g in (ai, de):
    for i in g:
        for j in g: C[i,j] = .70 if g is ai else .55
for i in ai:
    for j in de: C[i,j] = C[j,i] = .45
for i in range(8): C[i,6] = C[6,i] = .30
np.fill_diagonal(C, 1)
L = np.linalg.cholesky(C)
N = 200_000; df = 4
z = rng.standard_normal((N, 8)) @ L.T
s = np.sqrt(df / rng.chisquare(df, (N, 1))) / np.sqrt(df/(df-2))   # common fat-tail scale
r = np.clip(mu + vol * z * s, -1, None)                           # simple returns, floored at -100%
port = r @ w + 0.66 * 0.04
cash = 0.04
print(f"median {np.median(port)*100:.1f}%  mean {port.mean()*100:.1f}%")
print(f"P(beat all-cash 4%)   {np.mean(port > cash)*100:.0f}%")
print(f"P(loss)               {np.mean(port < 0)*100:.1f}%")
print(f"P(loss > 10%)         {np.mean(port < -.10)*100:.2f}%")
print(f"P(loss > 20%)         {np.mean(port < -.20)*100:.3f}%")
print(f"P(loss > 24%)         {np.mean(port < -.24)*100:.3f}%")
print(f"1st / 5th percentile  {np.percentile(port,1)*100:.1f}% / {np.percentile(port,5)*100:.1f}%")
