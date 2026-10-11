import {BitcoinChart} from "./BitcoinChart";
import {useEffect,useState} from 'react';
import type {summarizeMarket} from '../server/marketBrief';
type Brief=ReturnType<typeof summarizeMarket>;
const usd=(n:number)=>n.toLocaleString('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0});
const pct=(n:number)=>(n>=0?'+':'')+n.toFixed(1)+'%';
export function MarketBrief({refreshKey}:{refreshKey:number}){
 const [data,setData]=useState<Brief|null>(null),[error,setError]=useState(false);
 useEffect(()=>{const controller=new AbortController();const load=()=>fetch('/api/market-brief',{signal:controller.signal}).then(r=>{if(!r.ok)throw new Error();return r.json();}).then(d=>{if(!Array.isArray(d.chart)||d.chart.length<2||!Array.isArray(d.returns)||!d.daily||!Number.isFinite(d.close)||!Number.isFinite(Date.parse(d.asOf)))throw new Error();setData(d);setError(false);}).catch(()=>{if(!controller.signal.aborted){setData(null);setError(true);}});void load();const timer=setInterval(load,60000);return()=>{controller.abort();clearInterval(timer);};},[refreshKey]);
 if(!data)return <section className="daily-brief" aria-label="Zobiris daily signal"><span className="visual-kicker">ZOBIRIS DAILY SIGNAL</span><h1>Market & Bitcoin outlook</h1><p>{error?'Current daily evidence is unavailable. The outlook is withheld until fresh Kraken history returns.':'Loading the latest completed daily market evidence…'}</p></section>;
 return <section className="daily-brief" aria-label="Zobiris daily signal">
  <div className="visual-title"><span className="visual-kicker">ZOBIRIS DAILY SIGNAL</span><span className="visual-tag">DAILY TECHNICAL VIEW · 3–7 DAYS</span></div>
  <h1>Market & Bitcoin outlook</h1><p className="visual-muted">Completed daily data through {new Date(data.asOf).toLocaleString()} · Kraken · refreshes automatically</p>
  <div className="market-ticker-strip" aria-label="Verified major cryptocurrency performance">
   {data.returns.map(r=><article key={r.symbol} className="market-ticker-card">
     <div className="market-ticker-top"><span className={'market-coin-badge market-coin-'+r.symbol.toLowerCase()} aria-hidden="true">{r.symbol==='BTC'?'₿':r.symbol==='ETH'?'Ξ':'S'}</span><strong>{r.symbol==='BTC'?'Bitcoin':r.symbol==='ETH'?'Ethereum':r.symbol==='SOL'?'Solana':r.symbol}</strong><small>{r.symbol}</small></div>
     <div className="market-ticker-value">{r.symbol==='BTC'?usd(data.close):pct(r.week)}</div>
     <div className={r.week>=0?'market-ticker-change is-gain':'market-ticker-change is-loss'}>{pct(r.week)} / 7d</div>
     <small className="market-ticker-foot">{r.symbol==='BTC'?'Last completed daily BTC close':'7-day return · spot close price unavailable in this feed'}</small>
   </article>)}
  </div>
  <div className="market-detail-layout">
    <BitcoinChart points={data.chart} lower={data.lower} upper={data.upper} ema50={data.daily.ema50}/>
    <aside className="market-key-panel" aria-label="Bitcoin market key indicators">
      <h2>Key indicators</h2>
      <p>Latest completed daily candle · Kraken</p>
      <div><span>RSI (14)</span><strong>{data.daily.rsi14.toFixed(1)}</strong></div>
      <div><span>Daily ATR</span><strong>{data.daily.atrPct.toFixed(2)}%</strong></div>
      <div><span>EMA (50)</span><strong>{usd(data.daily.ema50)}</strong></div>
      <div><span>EMA (200)</span><strong>{usd(data.daily.ema200)}</strong></div>
      <div><span>20d close low</span><strong>{usd(data.lower)}</strong></div>
      <div><span>20d close high</span><strong>{usd(data.upper)}</strong></div>
      <p className="market-key-foot">Observed daily reference levels, not intraday candles, support/resistance promises, or entry signals.</p>
    </aside>
  </div>
  <div className="brief-grid"><article><span className="brief-number">01 / MARKET CONDITION</span><h2>{data.returns.filter(r=>r.week>0).length===3?'Recovery across the majors':data.returns.every(r=>r.week<=0)?'Risk appetite is weak':'Uneven participation'}</h2><p>{data.market}</p><div className="brief-returns">{data.returns.map(r=><div key={r.symbol}><strong>{r.symbol}</strong><span className={r.week>=0?'brief-positive':'brief-negative'}>{pct(r.week)} / 7d</span></div>)}</div><p className="visual-footnote">Three-coin sample, not total-market breadth.</p></article>
  <article><span className="brief-number">02 / WHERE BITCOIN LEANS</span><h2>{data.bias}</h2><p>{data.outlook}</p><p>{data.caveat} {data.volume}</p><strong>Last daily close {usd(data.close)}</strong></article>
  <article><span className="brief-number">03 / WHAT COULD PROVE IT WRONG</span><h2>The opposing case</h2><p>{data.counter}</p><div className="brief-levels"><div><span>20-day closing range low</span><strong>{usd(data.lower)}</strong></div><div><span>20-day closing range high</span><strong>{usd(data.upper)}</strong></div><div><span>50-day EMA</span><strong>{usd(data.daily.ema50)}</strong></div></div><p className="visual-footnote">A daily close above the range high strengthens a breakout case; below the range low strengthens a breakdown case. These are observed reference levels, not price targets.</p></article></div>
  <section className="btc-cycle-research" aria-label="Bitcoin cycle turning-point research">
    <span className="visual-kicker">CYCLE PIVOT &amp; EXHAUSTION · RESEARCH ONLY</span>
    <h2>{data.cycleResearch.watch==='POSSIBLE_SELLER_EXHAUSTION'?'Potential seller exhaustion watch':data.cycleResearch.watch==='POSSIBLE_BUYER_EXHAUSTION'?'Potential buyer exhaustion watch':data.cycleResearch.watch==='EVIDENCE_UNAVAILABLE'?'Cycle evidence unavailable':'No clustered exhaustion observation'}</h2>
    <p>{data.cycleResearch.explanation}</p>
    <div className="btc-cycle-facts">
      <span>Weekly move: <strong>{pct(data.returns.find(r=>r.symbol==='BTC')!.week)}</strong></span>
      <span>RSI(14): <strong>{data.daily.rsi14.toFixed(1)}</strong></span>
      <span>Shock proxy threshold: <strong>{data.cycleResearch.thresholds.weeklyAbsPct===null?'unavailable':data.cycleResearch.thresholds.weeklyAbsPct.toFixed(1)+'%'}</strong></span>
      <span>Candle: <strong>completed daily</strong></span>
    </div>
    <p className="visual-footnote">This is an independently defined, uncalibrated proxy using completed daily closes, RSI and ATR — NOT an output from Cosmic_Whale's TradingView scripts. An exhaustion watch does not establish a reversal, price target or trade.</p>
    <details><summary>Five-indicator research context and limitations</summary>
      <p>The supplied methodology describes 2x SLIT (shock zones), 0xTime (close-based timing), Double Slit (potential pivot markers), 0xTimeless (pinch/exhaustion zones), and OldPNAR+Timeless (variant pivot zones). All five original scripts are <strong>not run</strong>; 1-hour and 6-hour signals are not evaluated in this daily view.</p>
      <p>The document's 97% credibility score, claimed 2022 attribution and projected 2026–2027 bottoms are unverified hypotheses, not calibrated probabilities. Pivot permanence cannot be known at signal time. There is no added order, entry-price or position-sizing authority.</p>
    </details>
  </section>
  <div className="btc-indicators">
   <article><span className="visual-kicker">TREND</span><h3>{data.daily.trend}</h3><p>Close is {data.close>=data.daily.ema50?'above':'below'} the 50-day EMA and {data.close>=data.daily.ema200?'above':'below'} the 200-day EMA ({usd(data.daily.ema200)}). Agreement between price and both averages gives a clearer trend; disagreement suggests transition.</p></article>
   <article><span className="visual-kicker">MOMENTUM</span><h3>RSI {data.daily.rsi14.toFixed(1)} / 100</h3><p>{data.caveat} RSI above 70 is stretched; below 30 is depressed. Neither alone signals a reversal.</p></article>
   <article><span className="visual-kicker">VOLATILITY & VOLUME</span><h3>Daily ATR {data.daily.atrPct.toFixed(1)}%</h3><p>Average true range describes recent daily movement, including gaps; it is not a forecast band. {data.volume} {data.daily.volume7dVsPrior30d==null?'':`Volume ratio: ${data.daily.volume7dVsPrior30d.toFixed(2)}×.`}</p></article>
  </div>
  <details className="protection-details"><summary>Evidence, horizons & limits</summary><div className="table-wrap"><table><thead><tr><th>Asset</th><th>1d</th><th>7d</th><th>30d</th><th>90d</th></tr></thead><tbody>{data.returns.map(r=><tr key={r.symbol}><td>{r.symbol}</td><td>{pct(r.day)}</td><td>{pct(r.week)}</td><td>{pct(r.month)}</td><td>{pct(r.quarter)}</td></tr>)}</tbody></table></div><p>Bitcoin daily trend: {data.daily.trend}. Simple RSI(14): {data.daily.rsi14.toFixed(1)}. ATR(14): {data.daily.atrPct.toFixed(1)}%. Volume: {data.daily.volume7dVsPrior30d?.toFixed(2)??'unavailable'}× (7-day average / preceding 30-day average).</p><p>Directional bias is an unvalidated rule using daily EMA structure and weekly momentum, not a calibrated probability or an order instruction. This technical calculation does not incorporate news, ETF flows, macro releases, funding, or liquidation positioning. Available research appears separately when evidence exists; missing inputs can overturn the technical view.</p></details>
 </section>;
}

