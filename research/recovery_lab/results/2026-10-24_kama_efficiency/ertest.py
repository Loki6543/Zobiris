import pickle, sys, json, numpy as np
sys.path.insert(0, '/home/user/zobiris')
from research.recovery_lab import live_panel as lp, panel_study as ps, efficiency as ef
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
data=pickle.load(open('/tmp/claude-0/-home-user/fb608053-5006-55a1-ad06-6df71e181160/scratchpad/kdata.pkl','rb'))
res={}
def fitp(Xtr,ytr,Xte):
    med=np.nanmedian(Xtr,0); med=np.where(np.isnan(med),0,med)
    Xtr=np.where(np.isnan(Xtr),med,Xtr); Xte=np.where(np.isnan(Xte),med,Xte)
    sc=StandardScaler().fit(Xtr)
    return LogisticRegression(C=0.01,max_iter=2000).fit(sc.transform(Xtr),ytr).predict_proba(sc.transform(Xte))[:,1]
for chart,C in lp.CHARTS.items():
  for coin in lp.COINS:
    if coin not in data[chart]: continue
    ts,a,b=ps.align(data[chart],coin)
    if len(ts)<200: continue
    F=ps.features(ts,a,b,C['spec']); M0=np.column_stack(list(F.values()))
    E=ef.features(a[:,3]); M1=np.column_stack([M0]+list(E.values()))
    for h,hz in C['horizons'].items():
      rows=[(i,t) for i in range(len(ts)) if np.isnan(M0[i]).sum()<=len(F)//3 for t in [ps.targets(a,b,i,hz,C['spec'],True)] if t]
      idx=np.array([i for i,_ in rows]); n=len(rows); cut=int(n*.7)
      for tn in lp.BINARY:
        y=np.array([t[tn] for _,t in rows]); ytr,yte=y[:cut-hz],y[cut:]
        if len(set(ytr))<2: continue
        bb=((ytr.mean()-yte)**2).sum()
        for name,M in (('base',M0),('ext',M1)):
          X=M[idx]; p=fitp(X[:cut-hz],ytr,X[cut:])
          res.setdefault((chart,h,tn),{}).setdefault(name,[]).append(((p-yte)**2).sum())
        res[(chart,h,tn)].setdefault('bb',[]).append(bb)
proven=('new_high','new_low','range_widen','vol_up'); wins=0; worst=0; out=[]
for k,v in sorted(res.items()):
    bb=sum(v['bb']); s0=1-sum(v['base'])/bb; s1=1-sum(v['ext'])/bb
    coins=sum(e<b for e,b in zip(v['ext'],v['base']))
    out.append((k,round(s0,4),round(s1,4),round(s1-s0,4),f"{coins}/{len(v['ext'])}"))
    print(k,'base %+.3f ext %+.3f diff %+.4f coins better %s'%(s0,s1,s1-s0,out[-1][-1]))
    if k[2] in proven:
        wins+= s1>s0; worst=min(worst,s1-s0)
print('proven cells improved',wins,'/16; worst change',round(worst,4),'ADOPT' if wins>=10 and worst>=-0.01 else 'REJECT')
json.dump({'cells':[[list(k),s0,s1,d,c] for k,s0,s1,d,c in out],'proven_improved':int(wins),'worst':float(worst)},open('/tmp/claude-0/-home-user/fb608053-5006-55a1-ad06-6df71e181160/scratchpad/ertest.json','w'))
