import {useEffect,useState} from 'react';
const pct=(v:number|null|undefined)=>v==null?'—':v.toFixed(2)+'%';
export function PilotScorecard(){
 const [data,setData]=useState<any>(null),[error,setError]=useState(false);
 useEffect(()=>{let active=true;const controller=new AbortController();const load=async()=>{try{const r=await fetch('/api/pilot-scorecard',{signal:controller.signal});if(!r.ok)throw new Error();const d=await r.json();if(!d.qualified||!d.nonqualifying||!Array.isArray(d.limitations))throw new Error();if(active){setData(d);setError(false);}}catch{if(active)setError(true);}};void load();const timer=setInterval(()=>void load(),60000);return()=>{active=false;controller.abort();clearInterval(timer);};},[]);
 return <section aria-label="Entry research scorecard" style={{maxWidth:1280,margin:'0 auto 16px',padding:20,background:'#111e36',border:'1px solid #35476d',borderRadius:14,color:'#e5edff'}}>
  <div className="protection-heading"><h2 style={{fontSize:18,fontWeight:700}}>Entry research scorecard</h2><span className="protection-badge">SHADOW · NO VERDICT</span></div>
  <p className="protection-label">Forward evidence for the delayed-rotation prior. Research signals are separate from executable orders and account returns.</p>
  {error?<p role="status">Scorecard unavailable. Refresh later.</p>:!data?<p>Loading evidence…</p>:<>
   <div style={{overflowX:'auto'}}><table style={{width:'100%',textAlign:'left',borderCollapse:'collapse'}}><thead><tr>{['Cohort','Episodes','1d resolved / due','1d return','1d excess vs BTC','7d resolved / due','Sampled touches'].map(h=><th style={{padding:10,fontSize:12,color:'#8ea5c8'}} key={h}>{h}</th>)}</tr></thead><tbody>{[['Qualified',data.qualified],['Nonqualifying',data.nonqualifying],['BTC benchmark',data.benchmark]].map(([name,g]:any)=><tr key={name}>{[name,g.episodes,`${g.horizons['1D'].resolved} / ${g.horizons['1D'].due}`,pct(g.horizons['1D'].averageReturnPct),pct(g.horizons['1D'].averageExcessVsBtcPct),`${g.horizons['7D'].resolved} / ${g.horizons['7D'].due}`,`${g.sampledTouches} / ${g.proposedLimits}`].map((v,i)=><td key={i} style={{padding:10,borderTop:'1px solid #293d60'}}>{v}</td>)}</tr>)}</tbody></table></div>
   <p className="protection-label">Observed update: {data.updatedAt==='1970-01-01T00:00:00.000Z'?'awaiting first refresh':new Date(data.updatedAt).toLocaleString()} · {data.legacyExcluded} legacy records excluded · {data.archivedRecordCount} archived records. Actual fills, calibrated fill probability and missed-fill regret: unavailable.</p>
   {['qualified','nonqualifying'].some(k=>(data[k].horizons['1D'].unresolvedPct??0)>10)?<p style={{color:'#f5be66'}}>Coverage warning: more than 10% of due one-day outcomes are unresolved. Do not infer an edge from the resolved subset.</p>:null}
   <details><summary>Measurement rules & remaining validation</summary>{data.limitations.map((s:string)=><p className="protection-label" key={s}>{s}</p>)}</details>
  </>}
 </section>;
}
