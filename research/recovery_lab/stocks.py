"""Coin-versus-stocks correlation inputs (QQQ as the Nasdaq-100 proxy), ported from MarketLab 1.2's changing-correlation
diagnostic. Research only. Tested 24 Oct 2026 (registry btc-stocks-correlation-panel-input-v1) and rejected: not in the live model.

A US trading day's close counts as known from 21:00 UTC that day (after the 20:00 UTC close in summer, 21:00 in winter).
For each QQQ day the coin's price is its last candle closed by that time, so every pair uses information available then.
"""
import json
import urllib.request

import numpy as np

KNOWN_AFTER = 21 * 3600


def parse_twelve_data(text):
    """'datetime;open;high;low;close;volume' rows (newest first) -> {day_start_epoch: close}."""
    from datetime import datetime, timezone
    out = {}
    for line in text.strip().splitlines()[1:]:
        f = line.split(';')
        out[int(datetime.strptime(f[0], '%Y-%m-%d').replace(tzinfo=timezone.utc).timestamp())] = float(f[4])
    return out


def fetch_yahoo(symbol='QQQ', rng='2y'):
    """Daily closes from Yahoo's public chart endpoint as {day_start_epoch: close}."""
    req = urllib.request.Request(f'https://query1.finance.yahoo.com/v8/finance/chart/{symbol}?interval=1d&range={rng}',
                                 headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req, timeout=30) as r:
        res = json.load(r)['chart']['result'][0]
    closes = res['indicators']['quote'][0]['close']
    return {int(t) // 86400 * 86400: float(c) for t, c in zip(res['timestamp'], closes) if c is not None}


def _corr(x, y):
    if len(x) < 3 or np.std(x) == 0 or np.std(y) == 0:
        return np.nan
    return float(np.corrcoef(x, y)[0, 1])


def features(ts, c, step, stock, n=30):
    """Inputs at each bar (open times ts, closes c, bar length step seconds): correlation of the last n paired daily returns,
    its change versus the preceding n, and the stock's 5-day log return. NaN until enough paired history exists."""
    days = sorted(stock)
    known = np.array([d + KNOWN_AFTER for d in days])
    close_t = np.asarray(ts) + step
    # coin price at each stock close: last coin candle closed by then
    j = np.searchsorted(close_t, known, side='right') - 1
    ok = j >= 0
    sd, sc, cc = np.array(days)[ok], np.array([stock[d] for d in days])[ok], np.asarray(c)[j[ok]]
    kn = known[ok]
    rs, rc = np.diff(np.log(sc)), np.diff(np.log(cc))
    per_day = []   # (known_time, corr, change, ret5)
    for k in range(len(rs)):
        cur = _corr(rc[max(0, k - n + 1):k + 1], rs[max(0, k - n + 1):k + 1]) if k + 1 >= n else np.nan
        prv = _corr(rc[k - 2 * n + 1:k - n + 1], rs[k - 2 * n + 1:k - n + 1]) if k + 1 >= 2 * n else np.nan
        r5 = float(np.log(sc[k + 1] / sc[k - 4])) if k >= 4 else np.nan
        per_day.append((kn[k + 1], cur, cur - prv, r5))
    out = {'qqq_corr_30': np.full(len(ts), np.nan), 'qqq_corr_change': np.full(len(ts), np.nan), 'qqq_ret_5d': np.full(len(ts), np.nan)}
    if not per_day:
        return out
    kt = np.array([p[0] for p in per_day])
    idx = np.searchsorted(kt, close_t, side='right') - 1
    for i, k in enumerate(idx):
        if k >= 0:
            _, out['qqq_corr_30'][i], out['qqq_corr_change'][i], out['qqq_ret_5d'][i] = per_day[k]
    return out
