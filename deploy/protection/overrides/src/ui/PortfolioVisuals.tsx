type Holding={symbol:string;value:number;priceAvailable:boolean};
const palette=['#8e7dff','#38d6bd','#60b7ff','#f3b85b','#ee86bd','#72d4eb'];
const money=(n:number)=>n.toLocaleString('en-US',{style:'currency',currency:'USD'});
export function PortfolioVisuals({rows,cash,reserved,accountSynced}:{rows:Holding[];cash:number;reserved:number;accountSynced:boolean}){
 const holdings=rows.filter(r=>Number.isFinite(r.value)&&r.value>0).sort((a,b)=>b.value-a.value);
 const invested=holdings.reduce((n,r)=>n+r.value,0),total=Math.max(0,cash)+invested;
 const estimated=!accountSynced||rows.some(r=>!r.priceAvailable);
 const parts=[{symbol:'Cash',value:Math.max(0,cash)},...holdings];let offset=0;
 const arcs=parts.map((p,i)=>{const length=total>0?p.value/total*100:0;const arc={...p,length,offset,color:i===0?'#38d6bd':palette[(i-1)%palette.length]};offset+=length;return arc;});
 return <section className="portfolio-visuals" aria-label="Visual portfolio dashboard">
  <article className="allocation-panel"><div className="visual-title"><span className="visual-kicker">CAPITAL OVERVIEW</span><span className="visual-tag">{estimated?'ESTIMATED VALUES':'CURRENT SNAPSHOT'}</span></div><h2>Room to maneuver.</h2><p className="visual-muted">See how your capital is positioned.</p>
   <div className="allocation-body"><div className="allocation-ring"><svg viewBox="0 0 160 160" role="img" aria-label={`Portfolio allocation: ${total>0?Math.round(cash/total*100):0}% cash, ${total>0?Math.round(invested/total*100):0}% invested`}><circle cx="80" cy="80" r="62" fill="none" stroke="#28344c" strokeWidth="14"/>{arcs.map(a=><circle key={a.symbol} cx="80" cy="80" r="62" fill="none" stroke={a.color} strokeWidth="14" pathLength="100" strokeDasharray={`${a.length} ${100-a.length}`} strokeDashoffset={-a.offset} transform="rotate(-90 80 80)"/>)}</svg><div className="ring-label"><strong>{total>0?Math.round(cash/total*100):0}%</strong><span>IN CASH</span></div></div>
    <div className="allocation-stats"><div><span><i style={{background:'#38d6bd'}}/>Cash balance</span><strong>{money(cash)}</strong></div><div><span><i style={{background:'#8e7dff'}}/>Invested in crypto</span><strong>{money(invested)}</strong></div><div><span><i style={{background:'#f3b85b'}}/>Reserved within cash</span><strong>{money(reserved)}</strong></div></div></div>
   <p className="visual-footnote">{estimated?'Includes snapshot estimates where a fresh price is unavailable.':'Allocation from the latest account and market snapshots.'} Reserved buys are part of cash, not additional capital.</p>
  </article>
  <article className="holdings-panel"><div className="visual-title"><span className="visual-kicker">POSITION MIX</span><span className="visual-tag">{holdings.length} HOLDINGS</span></div><h2>Your largest positions</h2><p className="visual-muted">Share of invested crypto · cash excluded</p><div className="holding-bars">{holdings.slice(0,5).map((r,i)=><div key={r.symbol} className="holding-bar-row"><div><strong>{r.symbol}</strong><span>{money(r.value)} · {invested>0?(r.value/invested*100).toFixed(1):0}%</span></div><div className="holding-bar-track"><div style={{width:`${invested>0?r.value/invested*100:0}%`,background:palette[i%palette.length]}}/></div></div>)}</div>{!holdings.length?<p className="visual-muted">Waiting for position values.</p>:null}</article>
 </section>;
}
