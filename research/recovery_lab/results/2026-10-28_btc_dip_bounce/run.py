"""btc-dip-alt-bounce-tradable-v1, as pre-registered 2026-10-28T08:35Z. Research only."""
import json, urllib.request, time, random, numpy as np, sys
def get(u):
    for k in range(5):
        try: return json.load(urllib.request.urlopen(u, timeout=30))
        except Exception: time.sleep(2 ** k)
    return None
pairs = get('https://api.kraken.com/0/public/AssetPairs')['result']
EXCL = {'USDT','USDC','DAI','PYUSD','USDG','RLUSD','USDS','TUSD','USDE','FDUSD','USD1','EURC','EUR','GBP','AUD','CAD','CHF','JPY','USDQ','EURQ','EUROP','USDD','GHO','FRAX','LUSD','UST','USTC','RLUSD',
        'PAXG','XAUT','WBTC','TBTC','CBBTC','LSETH','METH','CMETH','STETH','WSTETH','WETH','BETH','ETH2','ETH2.S','SOLV','LBTC','FBTC','KBTC'}
usd = {}
for k, v in pairs.items():
    ws = v.get('wsname', '')
    if v.get('quote') == 'ZUSD' and ws.endswith('/USD') and not k.endswith('.d'):
        base = ws.split('/')[0]
        if base not in EXCL and not base.endswith('.S') and not base.endswith('.M') and not base.endswith('.F'): usd[base] = k
def daily(p):
    r = get(f'https://api.kraken.com/0/public/OHLC?pair={p}&interval=1440')
    if not r or r.get('error'): return None
    r = [v for k, v in r['result'].items() if k != 'last'][0]
    return {int(x[0]): (float(x[1]), float(x[4]), float(x[5]) * float(x[6])) for x in r}   # open, close, usd volume
B = daily('XXBTZUSD'); ts = sorted(B)
D = {}
for b, p in usd.items():
    if b in ('XBT', 'BTC'): continue
    d = daily(p)
    if d: D[b] = d
    time.sleep(0.25)
json.dump({'btc': B, 'alts': D}, open('daily.json', 'w'))
DAY = 86400
bc = np.array([B[t][1] for t in ts])
trig = [i for i in range(7, len(ts)) if bc[i] <= 0.94 * bc[i-7:i].max()]
events = []
for i in trig:
    if not events or i - events[-1] > 5: events.append(i)
def window(i, H):
    t0, t1 = ts[i] + DAY, ts[i] + DAY * (1 + H)
    return t0, t1
def eligible(b, t):
    d = D[b]; before = [x for x in d if x < t]
    if len(before) < 45: return False
    last30 = sorted(before)[-30:]
    return np.median([d[x][2] for x in last30]) >= 1e6
def outcome(i, H, cost):
    t0, t1 = window(i, H)
    if t0 not in B or t1 not in B: return None
    btc = B[t1][0] / B[t0][0] - 1
    rets = [D[b][t1][0] / D[b][t0][0] - 1 - cost for b in D if t0 in D[b] and t1 in D[b] and eligible(b, ts[i] + DAY)]
    if not rets: return None
    return 100 * (np.mean(rets) - btc), len(rets), 100 * (np.mean(rets) + cost)
COSTS = {'C1': 0.008, 'C2': 0.012, 'C3': 0.020}
random.seed(0)
ev_days = set(events)
def baseline(i, H, cost):
    pool = [j for j in range(max(7, i - 30), min(len(ts) - 1 - H - 1, i + 30) + 1) if all(abs(j - e) > 5 for e in events)]
    pick = [random.choice(pool) for _ in range(20)] if pool else []
    vals = [o[0] for o in (outcome(j, H, cost) for j in pick) if o]
    return np.mean(vals) if vals else None
res = {}
for H in (3, 1, 7):
    rows = []
    for i in events:
        o = outcome(i, H, COSTS['C1'])
        if not o: continue
        rows.append({'i': i, 'date': time.strftime('%Y-%m-%d', time.gmtime(ts[i])), 'excess_C1': o[0], 'n_alts': o[1], 'abs_alt_gross': o[2],
                     'excess_C2': outcome(i, H, COSTS['C2'])[0], 'excess_C3': outcome(i, H, COSTS['C3'])[0], 'baseline_C1': baseline(i, H, COSTS['C1'])})
    res[H] = rows
def split(rows, H):
    n = len(rows); a, b = int(n * 0.5), int(n * 0.7)
    parts = {'development': rows[:a], 'validation': rows[a:b], 'holdout': rows[b:]}
    # 72h embargo: drop earlier-part events whose exit is within 72h of the next part's first entry
    for p, q in (('development', 'validation'), ('validation', 'holdout')):
        if parts[q]:
            bnd = ts[parts[q][0]['i']] + DAY
            parts[p] = [r for r in parts[p] if ts[r['i']] + DAY * (1 + H) <= bnd - 3 * DAY]
    return parts
def boot(x, n=10000):
    x = np.array(x); rng = np.random.default_rng(0)
    m = rng.choice(x, (n, len(x))).mean(1); return float(np.percentile(m, 2.5)), float(np.percentile(m, 97.5))
out = {'events_total': len(events), 'triggers': len(trig), 'alts_fetched': len(D), 'first_day': time.strftime('%Y-%m-%d', time.gmtime(ts[0])), 'by_holding': {}}
for H, rows in res.items():
    parts = split(rows, H); summ = {}
    for name, pr in parts.items():
        if not pr: summ[name] = {'n': 0}; continue
        ex = [r['excess_C1'] for r in pr]; diff = [r['excess_C1'] - r['baseline_C1'] for r in pr if r['baseline_C1'] is not None]
        summ[name] = {'n': len(pr), 'dates': [pr[0]['date'], pr[-1]['date']], 'mean_excess_C1': round(float(np.mean(ex)), 2), 'ci_C1': [round(v, 2) for v in boot(ex)],
                      'mean_excess_C2': round(float(np.mean([r['excess_C2'] for r in pr])), 2), 'mean_excess_C3': round(float(np.mean([r['excess_C3'] for r in pr])), 2),
                      'mean_vs_random_days': round(float(np.mean(diff)), 2) if diff else None, 'ci_vs_random': [round(v, 2) for v in boot(diff)] if len(diff) > 1 else None,
                      'beat_btc_share': round(float(np.mean(np.array(ex) > 0)), 2), 'mean_abs_alt_gross': round(float(np.mean([r['abs_alt_gross'] for r in pr])), 2), 'median_n_alts': int(np.median([r['n_alts'] for r in pr]))}
    out['by_holding'][f'H{H}'] = summ
h = out['by_holding']['H3']['holdout']
ok = h.get('n', 0) >= 10 and h['ci_C1'][0] > 0 and h['ci_vs_random'] and h['ci_vs_random'][0] > 0 and h['mean_excess_C2'] > 0
out['verdict'] = 'SUPPORTED' if ok else ('INCONCLUSIVE (CI spans 0)' if h.get('n', 0) >= 10 and h['ci_C1'][0] <= 0 <= h['ci_C1'][1] else 'NOT SUPPORTED')
out['event_rows_H3'] = res[3]
json.dump(out, open('result.json', 'w'), indent=1)
print(json.dumps({k: v for k, v in out.items() if k != 'event_rows_H3'}, indent=1))
