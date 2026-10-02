import { useEffect, useState } from 'react';

type Path={symbol:string;current:number;peak:number;drawdownPct:number;maxDrawdownPct:number;recoveryPct:number;returnSinceTrackingPct:number;pnlPct:number|null;peakPnlPct:number|null;profitGivebackPoints:number|null;profitGivebackPct:number|null;scenarioProfitFloor:number|null;scenarioDrawdownFloor:number;recoveryLock:boolean;startedAt:string;updatedAt:string;samples:number;state:string;stale:boolean;priceAvailable:boolean;context:{daily?:{asOf:string;atr14:number;atrPct:number;trend:string;mode:string;momentum7dPct:number;volume7dVsPrior30d:number|null;rsi14:number}|null;setupScore?:number|null}};
type Tracking={status:string;rewards?:{symbol:string;quantity:number;source:string}[];marketAt?:string;missingPrices:string[];positions:Path[];portfolio:Path|null;limitations:string[];policy:{harvestLadder:{gainPct:number;originalPositionPct:number}[]}};
const usd=(n:number|null)=>n==null?'Unavailable':n.toLocaleString('en-US',{style:'currency',currency:'USD',maximumFractionDigits:n<1?6:2});
const pct=(n:number|null)=>n==null?'Unavailable':n.toFixed(2)+'%';
const card={maxWidth:1280,margin:'0 auto 16px',padding:18,background:'#111e36',border:'1px solid #35476d',borderRadius:14};
function Datum({label,value}:{label:string;value:string}){return <div><div className="protection-label">{label}</div><strong>{value}</strong></div>;}
export function ProfitProtection(){
 const [data,setData]=useState<Tracking|null>(null),[error,setError]=useState(false);
 useEffect(()=>{const controller=new AbortController();let active=true;const load=async()=>{try{const r=await fetch('/api/profit-protection',{signal:controller.signal});if(!r.ok)throw new Error();const d=await r.json();if(!d||!Array.isArray(d.positions)||!Array.isArray(d.missingPrices))throw new Error();if(active){setData(d);setError(false);}}catch{if(active)setError(true);}};void load();const timer=setInterval(()=>void load(),60000);return()=>{active=false;controller.abort();clearInterval(timer);};},[]);
 const p=data?.portfolio;
 return <section aria-label="Profit protection" style={card}>
  <div className="protection-heading"><div><h2 style={{fontSize:18,fontWeight:700}}>Profit protection</h2><p className="protection-label">Peak → drawdown → recovery · observed history, separate from entry quality</p></div><span className="protection-badge">{error?'UNAVAILABLE':data?.status?.replaceAll('_',' ')??'LOADING'}</span></div>
  {error?<p role="status" className="protection-label">Tracking cannot be refreshed. Previously observed values may be stale.</p>:null}
  {data?.rewards?.length?<p className="protection-label">Kraken rewards: {data.rewards.map(r=>`${r.quantity} ${r.symbol}`).join(", ")} · balance preserved, excluded from intentional investment performance. Reward valuation unavailable; this panel is not complete account NAV.</p>:null}
  {p?<div className="protection-grid"><Datum label="Observed investment peak" value={usd(p.peak)}/><Datum label="Below peak" value={pct(p.drawdownPct)}/><Datum label="Largest observed drawdown" value={pct(p.maxDrawdownPct)}/><Datum label="Recovery from trough" value={pct(p.recoveryPct)}/><Datum label="Recovery lock scenario" value={p.recoveryLock?'Active':'Not triggered'}/></div>:<p className="protection-label">{data?.missingPrices.length?`Investment tracking is waiting for fresh prices: ${data.missingPrices.join(', ')}. Priced positions are tracked below.`:'Collecting a fresh account and market snapshot. History starts when valid observations arrive.'}</p>}
  {p?<p className="protection-label">Comparable segment since {new Date(p.startedAt).toLocaleString()} · {p.samples} market observations. Cash or holding changes start a new segment.</p>:null}
  <details className="protection-details"><summary>Position tracking & protection scenarios{data?` · ${data.positions.length} assets`:''}</summary>
   <p className="protection-label">Observed peaks begin with this tracker, not your original purchase. P/L uses the account’s reported average cost, which may be incomplete. These scenarios do not replace the existing order plan.</p>
   {data?.positions.map(row=>{
    const daily=row.context.daily;const dailyFresh=daily&&Date.now()-Date.parse(daily.asOf)<=3*86400000;
    const multiple=row.pnlPct==null||row.pnlPct<0?null:row.pnlPct<25?3:row.pnlPct<50?2.75:row.pnlPct<100?2.5:row.pnlPct<200?2:1.75;
    const trail=dailyFresh&&multiple!=null?Math.max(0,row.peak-daily.atr14*multiple):null;
    return <article key={row.symbol} className="protection-position"><div className="protection-heading"><strong>{row.symbol}</strong><span className="protection-badge">{row.stale||!row.priceAvailable?'STALE / VERIFY':row.state}</span></div>
     <div className="protection-grid"><Datum label="Current / observed peak" value={`${usd(row.current)} / ${usd(row.peak)}`}/><Datum label="P/L / observed peak P/L" value={`${pct(row.pnlPct)} / ${pct(row.peakPnlPct)}`}/><Datum label="Price drawdown / maximum" value={`${pct(row.drawdownPct)} / ${pct(row.maxDrawdownPct)}`}/><Datum label="Profit giveback" value={row.profitGivebackPoints==null?'Unknown cost basis':`${row.profitGivebackPoints.toFixed(2)} pp · ${pct(row.profitGivebackPct)} of peak profit`}/><Datum label="Recovery from trough" value={pct(row.recoveryPct)}/><Datum label="Current setup score" value={row.context.setupScore==null?'Unavailable':String(row.context.setupScore)}/></div>
     <div className="protection-grid"><Datum label="Daily trend / mode" value={dailyFresh?`${daily.trend} / ${daily.mode}`:'Unavailable'}/><Datum label="Daily ATR / 7-day momentum" value={dailyFresh?`${pct(daily.atrPct)} / ${pct(daily.momentum7dPct)}`:'Unavailable'}/><Datum label="Volume: 7d / preceding 30d" value={dailyFresh&&daily.volume7dVsPrior30d!=null?daily.volume7dVsPrior30d.toFixed(2)+'×':'Unavailable'}/><Datum label="30% profit-giveback floor · scenario" value={usd(row.scenarioProfitFloor)}/><Datum label="ATR trail reference · scenario" value={trail!=null?`${usd(trail)} (${multiple}× daily ATR)`:'Unavailable'}/><Datum label="Exit pressure score" value="Uncalibrated — no score"/></div>
     <p className="protection-label">{row.samples} observations · market price {new Date(row.updatedAt).toLocaleString()}{dailyFresh?` · daily candle ${new Date(daily.asOf).toLocaleDateString()}`:''}. A trail reference is not a submitted stop or guaranteed fill.</p>
    </article>;
   })}
   <details className="protection-details"><summary>Research rules & validation status</summary>
    <p className="protection-label">Gain determines how aggressively to review protection; it does not automatically trigger a sale. Trend, volatility, momentum, volume and market regime must be evaluated together. Daily mode labels are descriptive heuristics, not validated signals; SuperTrend confirmation is unavailable.</p>
    <p className="protection-label">Recovery-lock candidate: first observe at least a 10% drawdown, then a rebound to 90% of the prior peak. Review drawdown scenarios at 5%, 8%, 12% and 15%; the 8% reference floor is {p?usd(p.scenarioDrawdownFloor):'unavailable for the complete portfolio'}. These are untested parameters, not recommended stops.</p>
    <div className="protection-ladder">{data?.policy.harvestLadder.map(step=><span key={step.gainPct}>+{step.gainPct}% gain → {step.originalPositionPct}% of original quantity</span>)}</div>
    <p className="protection-label">The baseline ladder totals 85%, leaving a 15% runner. Ladder execution, previously harvested quantity and repeated-trigger prevention require reconciled fills; no ladder orders are authorized here. Losing-position reductions, trend overrides and minimum useful order size must be validated together.</p>
    <p className="protection-label">Backtest status: awaiting reconciled historical holdings, cash flows, fills, fees and slippage. Compare partial reductions of 5–25% and drawdown scenarios against holding, including upside retained and maximum drawdown. No claimed win rate or optimal threshold.</p>
    {data?.limitations.map(s=><p className="protection-label" key={s}>{s}</p>)}
   </details>
  </details>
 </section>;
}
