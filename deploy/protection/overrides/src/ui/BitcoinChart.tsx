import {useState} from 'react';
type Point={time:number;close:number};
const usd=(n:number)=>n.toLocaleString('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0});
const day=(n:number)=>new Date(n*1000).toISOString().slice(0,10);
export function BitcoinChart({points,lower,upper,ema50}:{points:Point[];lower:number;upper:number;ema50:number}) {
 const [window,setWindow]=useState(30),[selected,setSelected]=useState<number|null>(null);
 const visible=points.slice(-window), active=visible.find(p=>p.time===selected)??visible.at(-1)!;
 const values=[...visible.map(p=>p.close),lower,upper,ema50];
 const lo=Math.min(...values),hi=Math.max(...values),pad=Math.max((hi-lo)*.12,hi*.005),min=lo-pad,max=hi+pad;
 const x=(i:number)=>66+i*650/Math.max(1,visible.length-1),y=(n:number)=>26+(max-n)/(max-min)*260;
 const line=visible.map((p,i)=>`${x(i)},${y(p.close)}`).join(' ');
 return <section className="btc-chart-panel" aria-label="Bitcoin technical chart">
  <div className="visual-title"><div><span className="visual-kicker">BTC / USD · DAILY CLOSE</span><h2>Read the range, then the trend</h2></div><div className="btc-windows">{[30,90].map(n=><button key={n} aria-pressed={window===n} onClick={()=>{setWindow(n);setSelected(null);}}>{n} days</button>)}</div></div>
  <p className="btc-chart-readout" aria-live="polite">{day(active.time)} UTC · Close <strong>{usd(active.close)}</strong></p>
  <div className="btc-chart-scroll" tabIndex={0} aria-label="Scrollable Bitcoin price chart"><svg viewBox="0 0 800 330" role="img" aria-label="Bitcoin daily closing price with 20-day closing range and latest 50-day EMA reference">
   <title>Bitcoin daily closing prices. Range and EMA are latest reference values, not historical indicator lines.</title>
   {[0,1,2,3,4].map(i=>{const v=max-(max-min)*i/4;return <g key={i}><line x1="66" x2="716" y1={y(v)} y2={y(v)} stroke="#263c46"/><text x="6" y={y(v)+4} fill="#a8bec7" fontSize="11">{usd(v)}</text></g>;})}
   <rect x="66" y={y(upper)} width="650" height={Math.max(1,y(lower)-y(upper))} fill="#75eed6" opacity=".045"/>
   {[{value:upper,label:'Range high',color:'#b8a2ff'},{value:lower,label:'Range low',color:'#ffad9c'},{value:ema50,label:'EMA 50*',color:'#e6be73'}].map(r=><g key={r.label}><line x1="66" x2="716" y1={y(r.value)} y2={y(r.value)} stroke={r.color} strokeDasharray="5 5"/><text x="722" y={y(r.value)+4} fill={r.color} fontSize="10">{r.label}</text></g>)}
   <polyline points={line} fill="none" stroke="#75eed6" strokeWidth="2.8" strokeLinejoin="round"/>
   {visible.map((p,i)=><circle key={p.time} cx={x(i)} cy={y(p.close)} r={p.time===active.time?5:9} fill={p.time===active.time?'#eafff9':'transparent'} onMouseEnter={()=>setSelected(p.time)} onClick={()=>setSelected(p.time)}><title>{day(p.time)}: {usd(p.close)}</title></circle>)}
   {[0,Math.floor((visible.length-1)/2),visible.length-1].map(i=><text key={i} x={x(i)} y="312" textAnchor={i===0?'start':i===visible.length-1?'end':'middle'} fill="#a8bec7" fontSize="11">{day(visible[i]!.time)}</text>)}
  </svg></div>
  <label className="btc-day-picker">Inspect a daily close <input aria-label="Inspect Bitcoin daily close" type="range" min="0" max={visible.length-1} value={visible.indexOf(active)} onChange={e=>setSelected(visible[Number(e.target.value)]!.time)}/></label>
  <div className="btc-chart-legend"><span>Mint: completed daily close</span><span>Violet: 20-day closing high {usd(upper)}</span><span>Coral: 20-day closing low {usd(lower)}</span><span>Gold: latest 50-day EMA {usd(ema50)}</span></div>
  <p className="visual-footnote">*The EMA line shows its latest level across the chart, not its historical path. The range uses closing prices, not intraday highs/lows. These are reference levels, not orders or price targets.</p>
 </section>;
}
