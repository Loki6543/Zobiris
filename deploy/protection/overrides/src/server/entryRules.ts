import type {EntryRules} from '../shared/entryPlan.js';
export function parseEntryRules(result:Record<string,any>,now=Date.now()):Record<string,EntryRules>{
 const rows=new Map<string,EntryRules[]>();
 for(const [pair,r] of Object.entries(result)){
  const parts=String(r?.wsname??'').split('/');if(parts.length!==2||parts[1]!=='USD'||pair.endsWith('.d'))continue;
  const symbol=parts[0]==='XBT'?'BTC':parts[0]==='XDG'?'DOGE':parts[0]!;
  const tickSize=r.tick_size==null?(Number.isInteger(r.pair_decimals)?10**(-r.pair_decimals):NaN):Number(r.tick_size);
  const rule={symbol,pair,wsPair:`${symbol}/USD`,tickSize,lotDecimals:r.lot_decimals,orderMin:Number(r.ordermin),costMin:Number(r.costmin),status:String(r.status??'unknown'),observedAt:new Date(now).toISOString()};
  rows.set(symbol,[...(rows.get(symbol)??[]),rule]);
 }
 return Object.fromEntries([...rows].filter(([,v])=>v.length===1).map(([s,v])=>[s,v[0]!]));
}
let cache:{at:number;rules:Record<string,EntryRules>}|null=null;
let inflight:Promise<Record<string,EntryRules>>|null=null;
export async function entryRules():Promise<Record<string,EntryRules>>{
 if(cache&&Date.now()-cache.at<15*60000)return cache.rules;
 if(inflight)return inflight;
 inflight=(async()=>{const r=await fetch('https://api.kraken.com/0/public/AssetPairs',{signal:AbortSignal.timeout(10000)});if(!r.ok)throw new Error('Kraken instrument metadata unavailable');const body=await r.json() as any;if(body.error?.length||!body.result)throw new Error('Kraken instrument metadata rejected');const now=Date.now();const rules=parseEntryRules(body.result,now);if(!Object.keys(rules).length)throw new Error('No USD instrument metadata');cache={at:now,rules};return rules;})();
 try{return await inflight;}finally{inflight=null;}
}
