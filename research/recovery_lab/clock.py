"""Clock-boundary activity in raw trades (an independent venue check of Kim & Hansen 2026). Research only.

Kim & Hansen report, for six Binance USDT perpetuals in 2021-2024, roughly 26% more trades, 32% more dollar volume and 26% larger
absolute returns in the first 10 seconds of quarter-hour minutes than in ordinary minutes, and an edge of about 0.5 bp per boundary
that they describe as an execution input, not a standalone strategy. This module measures the same contrasts on any trade list.

trades: iterable of (unix_seconds, price, base_volume, side) with side 'b' (taker buy) or 's' (taker sell).
"""
import math
import random
import statistics as st


def minute_kind(minute_index):
    m = minute_index % 60
    return 'QH' if m % 15 == 0 else 'M5' if m % 5 == 0 else 'ORD'


def _slots(trades):
    """Per minute: six 10-second slots of [count, usd, signed_usd, last_price]."""
    by = {}
    for ts, p, v, side in trades:
        m = int(ts // 60)
        s = min(5, int(ts - m * 60) // 10)
        d = by.setdefault(m, [[0, 0.0, 0.0, None] for _ in range(6)])[s]
        d[0] += 1
        d[1] += p * v
        d[2] += p * v * (1 if side == 'b' else -1)
        d[3] = p
    return by


def quarter_hour_profile(trades, iters=300, seed=11):
    trades = sorted(trades, key=lambda x: x[0])
    t0 = math.ceil(trades[0][0] / 900) * 900
    t1 = math.floor(trades[-1][0] / 900) * 900
    trades = [x for x in trades if t0 <= x[0] < t1]
    by = _slots(trades)
    minutes = range(t0 // 60, t1 // 60)
    last, end_px = None, {}
    for m in minutes:
        for s in range(6):
            if m in by and by[m][s][3] is not None:
                last = by[m][s][3]
        end_px[m] = last

    def slot_end(m, s):
        for k in range(s, -1, -1):
            if m in by and by[m][k][3] is not None:
                return by[m][k][3]
        return end_px.get(m - 1)

    rows = []
    for m in minutes:
        for s in (0, 1):
            d = by.get(m, [[0, 0.0, 0.0, None]] * 6)[s]
            start = end_px.get(m - 1) if s == 0 else slot_end(m, s - 1)
            end = slot_end(m, s)
            rows.append({'kind': minute_kind(m), 'slot': s, 'n': d[0], 'usd': d[1],
                         'absret_bp': abs(math.log(end / start)) * 1e4 if start and end else None,
                         'day': (m * 60) // 86400})

    def excess(rs, kind, slot, field):
        a = [r[field] for r in rs if r['kind'] == kind and r['slot'] == slot and r[field] is not None]
        b = [r[field] for r in rs if r['kind'] == 'ORD' and r['slot'] == slot and r[field] is not None]
        return st.mean(a) / st.mean(b) - 1 if a and b and st.mean(b) else float('nan')

    rng = random.Random(seed)
    days = sorted({r['day'] for r in rows})
    by_day = {}
    for r in rows:
        by_day.setdefault(r['day'], []).append(r)
    result = {'trades': len(trades), 'hours': round((t1 - t0) / 3600, 1), 'contrasts': {}}
    for kind in ('QH', 'M5'):
        for slot in (0, 1):
            for field in ('n', 'usd', 'absret_bp'):
                point = excess(rows, kind, slot, field)
                boots = sorted(excess([r for d in rng.choices(days, k=len(days)) for r in by_day[d]], kind, slot, field) for _ in range(iters))
                result['contrasts'][f'{kind}_sec{10 * slot}-{10 * slot + 10}_{field}'] = {
                    'excess_pct': round(100 * point, 1),
                    'ci95_pct': [round(100 * boots[int(0.025 * iters)], 1), round(100 * boots[int(0.975 * iters)], 1)]}
    # does signed flow in a quarter-hour's first minute predict the remaining 14 minutes?
    xs, ys = [], []
    for q in range(t0 // 900, t1 // 900):
        m0 = q * 15
        flow = sum(by[m0][s][2] for s in range(6)) if m0 in by else 0.0
        p0, p1 = end_px.get(m0), end_px.get(m0 + 14)
        if p0 and p1:
            xs.append(flow)
            ys.append(1e4 * math.log(p1 / p0))
    pairs = [(x, y) for x, y in zip(xs, ys) if x * y != 0]
    result['first_minute_flow'] = {
        'quarters': len(xs),
        'corr_with_next_14m_return': round(st.correlation(xs, ys), 3) if len(xs) > 10 else None,
        'same_sign_pct': round(100 * sum(1 for x, y in pairs if x * y > 0) / len(pairs), 1) if pairs else None}
    return result
