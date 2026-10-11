import { useId } from 'react';

type Holding = { symbol: string; value: number; priceAvailable: boolean };
const palette = ['#7db5e9', '#75eed6', '#b7a0ec', '#edbd76', '#df96b4', '#72d4eb'];
const money = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

function PrivateState({ children }: { children: string }) {
  return <div className="dashboard-empty">
    <span className="empty-lock" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M7 10V7a5 5 0 0 1 10 0v3M6 10h12v11H6ZM12 14v3" /></svg></span>
    <strong>Private account</strong>{children}
  </div>;
}

export function PortfolioVisuals({ rows, cash, reserved, accountSynced }: { rows: Holding[]; cash: number; reserved: number; accountSynced: boolean }) {
  const gradientId = useId();
  const holdings = (accountSynced ? rows : []).filter(r => Number.isFinite(r.value) && r.value > 0).sort((a, b) => b.value - a.value);
  const invested = holdings.reduce((n, r) => n + r.value, 0), total = Math.max(0, cash) + invested;
  const estimated = rows.some(r => !r.priceAvailable);
  const parts = [{ symbol: 'Cash', value: Math.max(0, cash) }, ...holdings];
  let offset = 0;
  const arcs = parts.map((p, i) => {
    const length = total > 0 ? p.value / total * 100 : 0;
    const arc = { ...p, length, offset, color: i === 0 ? '#75eed6' : palette[(i - 1) % palette.length] };
    offset += length;
    return arc;
  });
  const cashPct = total > 0 ? Math.round(cash / total * 100) : 0;
  return <section className="portfolio-visuals" aria-label="Visual portfolio dashboard">
    <article className="allocation-panel">
      <div className="visual-title"><h2>Capital allocation</h2><span className="visual-tag">{!accountSynced ? 'PRIVATE ACCOUNT' : estimated ? 'ESTIMATED VALUES' : 'CURRENT SNAPSHOT'}</span></div>
      <p className="visual-muted">See how your capital is positioned.</p>
      <div className="allocation-body">
        <div className="allocation-ring">
          <svg viewBox="0 0 160 160" role="img" aria-label={accountSynced ? `Portfolio allocation: ${cashPct}% cash, ${total > 0 ? Math.round(invested / total * 100) : 0}% invested` : 'Portfolio allocation is private'}>
            <defs><linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#77909e" /><stop offset="35%" stopColor="#3c5666" /><stop offset="75%" stopColor="#1c303e" /><stop offset="100%" stopColor="#5c7a8b" /></linearGradient></defs>
            <circle cx="80" cy="83" r="62" fill="none" stroke="#060e16" strokeWidth="20" />
            <circle cx="80" cy="80" r="62" fill="none" stroke={`url(#${gradientId})`} strokeWidth="18" />
            {accountSynced && arcs.map(a => <circle key={a.symbol} cx="80" cy="80" r="62" fill="none" stroke={a.color} strokeWidth="14" pathLength="100" strokeDasharray={`${a.length} ${100 - a.length}`} strokeDashoffset={-a.offset} transform="rotate(-90 80 80)" />)}
            <circle cx="80" cy="80" r="71" fill="none" stroke="#afcad5" strokeOpacity=".45" strokeWidth=".7" />
            <circle cx="80" cy="80" r="53" fill="none" stroke="#b6d8e1" strokeOpacity=".24" strokeWidth=".7" />
          </svg>
          <div className="ring-label"><strong>{accountSynced ? (total>=100000?new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',notation:'compact',maximumFractionDigits:1}).format(total):new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(total)) : '—'}</strong><span>{accountSynced ? `${cashPct}% CASH · TOTAL` : 'PRIVATE'}</span></div>
        </div>
        {accountSynced ? <div className="allocation-stats">
          <div><span><i style={{ background: '#75eed6' }} />Cash balance</span><strong>{money(cash)}</strong></div>
          <div><span><i style={{ background: '#7db5e9' }} />Invested in crypto</span><strong>{money(invested)}</strong></div>
          <div><span><i style={{ background: '#edbd76' }} />Reserved within cash</span><strong>{money(reserved)}</strong></div>
        </div> : <PrivateState>Unlock your portfolio above to view your capital allocation.</PrivateState>}
      </div>
      {accountSynced && <p className="visual-footnote">{estimated ? 'Includes snapshot estimates where a fresh price is unavailable.' : 'Allocation from the latest account and market snapshots.'} Reserved buys are part of cash, not additional capital.</p>}
    </article>
    <article className="holdings-panel">
      <div className="visual-title"><h2>Portfolio concentration</h2><span className="visual-tag">{accountSynced ? `${holdings.length} HOLDINGS` : 'PRIVATE ACCOUNT'}</span></div>
      <p className="visual-muted">Share of invested crypto · cash excluded</p>
      {!accountSynced ? <PrivateState>Unlock your portfolio above to view your largest positions.</PrivateState> : <>
        <div className="holding-bars">{holdings.slice(0, 5).map((r, i) => <div key={r.symbol} className="holding-bar-row">
          <div><strong>{r.symbol}</strong><span>{money(r.value)} · {invested > 0 ? (r.value / invested * 100).toFixed(1) : 0}%</span></div>
          <div className="holding-bar-track"><div style={{ width: `${invested > 0 ? r.value / invested * 100 : 0}%`, background: palette[i % palette.length] }} /></div>
        </div>)}</div>
        {!holdings.length && <p className="visual-muted">Waiting for position values.</p>}
      </>}
    </article>
  </section>;
}
