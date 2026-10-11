import {useEffect,useState} from 'react';
import {ADVISORY_CATEGORIES,calculateGrossStress,type AdvisoryCategory} from './advisoryModel';

type NavigateView='market'|'watchlist'|'compare'|'tactical'|'outlook';
type Brief={asOf:string;close:number;bias:string;daily:{rsi14:number;ema50:number;atrPct:number};
  returns:{symbol:string;week:number}[];cycleResearch?:{watch:string}};
type Tactical={lastSuccess:number|null;paused:boolean;pauseReason?:string|null;counts?:{closed:number;complete:number}};
const usd=(n:number)=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:2}).format(n);
const ts=(n:number|string)=>new Date(n).toLocaleString();

export function AdvisoryDesk({onNavigate}:{onNavigate:(view:NavigateView)=>void}){
 const [category,setCategory]=useState<AdvisoryCategory>('signal');
 const [brief,setBrief]=useState<Brief|null>(null);
 const [tactical,setTactical]=useState<Tactical|null>(null);
 const [capital,setCapital]=useState(300);
 const [leverage,setLeverage]=useState(1);
 useEffect(()=>{
  const controller=new AbortController();
  const load=async()=>{
   const [market,paper]=await Promise.allSettled([
    fetch('/api/market-brief',{signal:controller.signal}).then(async r=>{if(!r.ok)throw Error('market unavailable');return r.json();}),
    fetch('/api/tactical',{signal:controller.signal}).then(async r=>{if(!r.ok)throw Error('paper unavailable');return r.json();}),
   ]);
   if(controller.signal.aborted)return;
   const m=market.status==='fulfilled'?market.value:null;
   const mt=Date.parse(String(m?.asOf??''));
   setBrief(m && Number.isFinite(mt) && mt<=Date.now()
      && Date.now()-mt<=36*3600_000 && Number.isFinite(m.close)&&m.close>0
      && Number.isFinite(m.daily?.rsi14)&&Number.isFinite(m.daily?.ema50)
      && Number.isFinite(m.daily?.atrPct)&&Array.isArray(m.returns)?m:null);
   const t=paper.status==='fulfilled'?paper.value:null;
   setTactical(t && Number.isFinite(t.lastSuccess) && t.lastSuccess<=Date.now()
      && Date.now()-t.lastSuccess<180_000 && typeof t.paused==='boolean'
      && Number.isFinite(t.counts?.closed) && Number.isFinite(t.counts?.complete)?t:null);
  };
  void load();const timer=setInterval(()=>void load(),60_000);
  return()=>{controller.abort();clearInterval(timer);};
 },[]);
 const btc7d=brief?.returns.find(r=>r.symbol==='BTC')?.week;
 const stressRows=[-5,-10,-20].map(shock=>({shock,result:calculateGrossStress(capital,leverage,shock)}));
 return <main className="advisor-desk" aria-label="Advisory research desk">
  <header className="advisor-hero">
   <div><span className="advisor-eyebrow">ZOBIRIS / INTELLIGENCE WORKSPACE</span><h1>Advisory Research</h1>
    <p>Spot opportunity, margin limitations and risk validation in one place. Explore ideas without conflating a model observation with permission to trade.</p>
   </div>
   <div className="advisor-provenance"><strong>RESEARCH / PAPER ONLY</strong><span>No order permissions · no implied execution</span><small>All results require source and freshness checks</small></div>
  </header>

  <div className="advisor-shortcuts" aria-label="Existing analysis workspaces">
   <button type="button" onClick={()=>onNavigate('watchlist')}><strong>Spot watchlist ↗</strong><small>Current prices · rotation research</small></button>
   <button type="button" onClick={()=>onNavigate('watchlist')}><strong>Delayed-entry review ↗</strong><small>See strategy evidence on each asset</small></button>
   <button type="button" onClick={()=>onNavigate('tactical')}><strong>Paper margin terminal ↗</strong><small>Quote coverage · experimental ceiling</small></button>
   <button type="button" onClick={()=>onNavigate('compare')}><strong>Compare Lab ↗</strong><small>Deep-dive and counterarguments</small></button>
  </div>

  <section className="advisor-section">
   <div className="advisor-section-title"><span className="advisor-eyebrow">ANALYSIS CATEGORIES</span><h2>Research before capital</h2></div>
   <div className="advisor-categories">
    {ADVISORY_CATEGORIES.map((item,index)=><button key={item.id} type="button" onClick={()=>setCategory(item.id)} aria-pressed={category===item.id} className={category===item.id?'advisor-category advisor-category-active':'advisor-category'}>
     <span className="advisor-num">{String(index+1).padStart(2,'0')}</span><strong>{item.label}</strong><small>{item.detail}</small>
    </button>)}
   </div>
  </section>

  <section className="advisor-analysis" aria-live="polite">
   {category==='signal'? <>
    <div className="advisor-panel-head"><div><span className="advisor-eyebrow">PRIMARY SIGNAL / EVIDENCE</span><h2>Market structure &amp; hypothesis confidence</h2></div><span className="advisor-status">UNVALIDATED MODEL</span></div>
    {brief?<div className="advisor-readouts">
      <article><small>BTC daily bias</small><strong>{brief.bias}</strong><span>Technical classification, not success probability</span></article>
      <article><small>RSI(14)</small><strong>{brief.daily.rsi14.toFixed(1)}</strong><span>Current completed daily reading</span></article>
      <article><small>BTC 7-day return</small><strong>{typeof btc7d==='number'&&Number.isFinite(btc7d)?(btc7d>=0?'+':'')+btc7d.toFixed(2)+'%':'Unavailable'}</strong><span>Observed move, not momentum certainty</span></article>
      <article><small>Pivot research watch</small><strong>{brief.cycleResearch?.watch?.replaceAll('_',' ')??'Unavailable'}</strong><span>Original TradingView scripts not run</span></article>
     </div>:<p className="advisor-empty" role="status">Fresh completed Bitcoin research is unavailable. No directional probability is displayed.</p>}
    <p className="advisor-note">Meta-labeling, triple-barrier target-hit probabilities, DSR and PBO need independently scored and time-aligned out-of-sample records. They are uncalibrated in this workspace; no fictitious win rate or p_meta is shown.</p>
    <button className="advisor-link" onClick={()=>onNavigate('market')}>Open Bitcoin analysis ↗</button>
   </>:null}
   {category==='margin'? <>
    <div className="advisor-panel-head"><div><span className="advisor-eyebrow">MARGIN / OBSERVATION</span><h2>Funding, collateral and drawdown safeguards</h2></div><span className="advisor-status">PAPER ONLY</span></div>
    <div className="advisor-readouts">
     <article><small>Research leverage ceiling</small><strong>1–1.5×</strong><span>2× / 3× and live trading remain locked</span></article>
     <article><small>Paper outcomes</small><strong>{tactical?`${tactical.counts!.closed} closed`:'Unavailable'}</strong><span>{tactical?`${tactical.counts!.complete} continuous-coverage records`:'No fresh verified paper feed'}</span></article>
     <article><small>Research observer</small><strong>{!tactical?'Unverified':tactical.paused?'Paused':'Monitoring'}</strong><span>{tactical?`Last collected ${ts(tactical.lastSuccess!)}`:'Data may be missing or stale'}</span></article>
     <article><small>Exchange liquidation buffer</small><strong>Unavailable</strong><span>Account collateral, margin health and borrowing permissions unverified</span></article>
    </div>
    <p className="advisor-note">Do not treat the reference HTML’s 5× caps, 40%/50% labels, fee assumptions or fixed liquidation prices as verified Kraken eligibility or trading thresholds. Margin calls and liquidations depend on exchange rules, exposure, collateral and open positions.</p>
    <button className="advisor-link" onClick={()=>onNavigate('tactical')}>Inspect paper margin constraints ↗</button>
   </>:null}
   {category==='funding'? <>
    <div className="advisor-panel-head"><div><span className="advisor-eyebrow">FUNDING / CASH-AND-CARRY</span><h2>Basis research readiness</h2></div><span className="advisor-status">DATA INCOMPLETE</span></div>
    <div className="advisor-empty"><strong>Not connected</strong><p>No live funding rate, executable perp bid/ask, margin collateral specification or net annualized basis series is connected to this panel.</p></div>
    <div className="advisor-checks">
     <div><span>Perpetual funding &amp; settlement schedule</span><strong>UNAVAILABLE</strong></div>
     <div><span>Spot / derivative matched liquidity</span><strong>UNAVAILABLE</strong></div>
     <div><span>Borrow and settlement costs</span><strong>UNAVAILABLE</strong></div>
     <div><span>Net execution edge after fees and slippage</span><strong>NOT CALCULATED</strong></div>
    </div>
    <p className="advisor-note">A spot-long/perpetual-short trade is not automatically zero-risk or zero-exposure: basis moves, funding reversals, liquidation and exchange failures can produce losses. No yield estimate or arbitrage order is authorized here.</p>
   </>:null}
   {category==='stress'? <>
    <div className="advisor-panel-head"><div><span className="advisor-eyebrow">EXECUTION / DOWNSIDE</span><h2>Shock &amp; exposure explorer</h2></div><span className="advisor-status">ILLUSTRATION ONLY</span></div>
    <div className="advisor-controls">
     <label>Reference capital (USD)<input type="number" min="1" max="1000000000" value={capital} onChange={e=>setCapital(Number(e.target.value))}/></label>
     <label>Exposure multiple<select value={leverage} onChange={e=>setLeverage(Number(e.target.value))}><option value={1}>1× spot equivalent</option><option value={1.25}>1.25× research scenario</option><option value={1.5}>1.5× paper ceiling</option></select></label>
    </div>
    <p className="advisor-note">Scenario P/L is gross only; it excludes spread, slippage, borrow fees, funding, stop execution, collateral changes, and liquidation. It is not an order-size recommendation.</p>
    <div className="advisor-stress-table"><table><thead><tr><th>Underlying shock</th><th>Illustrative notional</th><th>Gross P/L</th><th>Capital impact</th></tr></thead><tbody>
      {stressRows.map(({shock,result})=><tr key={shock}><td>{shock}%</td><td>{result?usd(result.exposure):'Invalid'}</td><td className="advisor-loss">{result?usd(result.grossPnl):'Invalid'}</td><td>{result?result.returnOnCapitalPct.toFixed(2)+'%':'Invalid'}</td></tr>)}
    </tbody></table></div>
    <button className="advisor-link" onClick={()=>onNavigate('tactical')}>Open detailed paper scenario ↗</button>
   </>:null}
  </section>
  <p className="advisor-footer">Market feeds, strategy heuristics, validated signals and actual exchange executions are separate evidence categories. This page only reads research; it does not submit orders or modify portfolio policy.</p>
 </main>;
}
