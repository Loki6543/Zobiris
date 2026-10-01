export type WatchMetrics={priceUsd:number|null;change24hPct:number|null;change7dPct:number|null;change30dPct:number|null;change90dPct:number|null;marketCapUsd:number|null;volume24hUsd:number|null;volumeChange24hPct:number|null;observedAt:string|null;stale:boolean};
const fields=['priceUsd','change24hPct','change7dPct','change30dPct','change90dPct','marketCapUsd','volume24hUsd','volumeChange24hPct'] as const;
export function watchlistMetrics(asset:any,now=Date.now()):WatchMetrics{
 const empty:WatchMetrics={priceUsd:null,change24hPct:null,change7dPct:null,change30dPct:null,change90dPct:null,marketCapUsd:null,volume24hUsd:null,volumeChange24hPct:null,observedAt:null,stale:true};
 const observations=[...(asset?.strategy21?.explanation?.observations??[])].sort((a,b)=>Date.parse(b.observedAt)-Date.parse(a.observedAt));
 for(const o of observations){let claim;try{claim=typeof o.claim==='string'?JSON.parse(o.claim):o.claim;}catch{continue;}
  if(!claim||!Number.isFinite(claim.cmcId)||claim.cmcId<=0)continue;
  const time=Date.parse(o.observedAt);if(!Number.isFinite(time)||time>now+60000||now-time>6*3600000||!(Date.parse(o.expiresAt)>now))continue;
  const result={...empty,observedAt:o.observedAt,stale:false};for(const key of fields){const v=claim[key];result[key]=typeof v==='number'&&Number.isFinite(v)&&(!['priceUsd','marketCapUsd','volume24hUsd'].includes(key)||v>=0)?v:null;}return result;
 }return empty;
}
