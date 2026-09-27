export interface CmcMarketQuote {
  cmcId:string;
  symbol:string;
  name:string;
  priceUsd:number|null;
  change1hPct:number|null;
  change24hPct:number|null;
  change7dPct:number|null;
  change30dPct:number|null;
  change60dPct:number|null;
  change90dPct:number|null;
  marketCapUsd:number|null;
  volume24hUsd:number|null;
  volumeChange24hPct:number|null;
  lastUpdated:string|null;
}

type FetchLike=typeof fetch;
const num=(v:unknown)=>{const n=Number(v);return Number.isFinite(n)?n:null;};

function records(data:unknown):any[] {
  if(Array.isArray(data)) return data.flatMap(x=>Array.isArray(x)?x:[x]);
  if(data && typeof data==="object") return Object.values(data as Record<string,unknown>).flatMap(x=>Array.isArray(x)?x:[x]);
  return [];
}
function usdQuote(entry:any):any {
  const q=entry?.quote;
  if(Array.isArray(q)) return q.find(x=>String(x?.symbol ?? x?.name ?? "").toUpperCase()==="USD") ?? q[0] ?? null;
  return q?.USD ?? q?.usd ?? null;
}

export function parseCmcQuotes(raw:any):CmcMarketQuote[] {
  return records(raw?.data).flatMap(entry=>{
    const symbol=String(entry?.symbol ?? "").toUpperCase();
    const id=String(entry?.id ?? "");
    const q=usdQuote(entry);
    if(!symbol||!id) return [];
    return [{
      cmcId:id,symbol,name:String(entry?.name ?? symbol),
      priceUsd:num(q?.price),
      change1hPct:num(q?.percent_change_1h),
      change24hPct:num(q?.percent_change_24h),
      change7dPct:num(q?.percent_change_7d),
      change30dPct:num(q?.percent_change_30d),
      change60dPct:num(q?.percent_change_60d),
      change90dPct:num(q?.percent_change_90d),
      marketCapUsd:num(q?.market_cap),
      volume24hUsd:num(q?.volume_24h),
      volumeChange24hPct:num(q?.volume_change_24h),
      lastUpdated:typeof q?.last_updated==="string"?q.last_updated:null,
    }];
  });
}

export async function fetchCmcQuotes(ids:string[],args:{apiKey?:string;fetchImpl?:FetchLike}={}):Promise<CmcMarketQuote[]> {
  const fetchImpl=args.fetchImpl ?? fetch;
  const unique=[...new Set(ids.filter(Boolean))];
  if(!unique.length) return [];
  const base=args.apiKey
    ? "https://pro-api.coinmarketcap.com/v3/cryptocurrency/quotes/latest"
    : "https://pro-api.coinmarketcap.com/public-api/v3/cryptocurrency/quotes/latest";
  const url=new URL(base);
  url.searchParams.set("id",unique.join(","));
  url.searchParams.set("convert","USD");
  url.searchParams.set("skip_invalid","true");
  const response=await fetchImpl(url,{headers:args.apiKey?{"X-CMC_PRO_API_KEY":args.apiKey,Accept:"application/json"}:{Accept:"application/json"},signal:AbortSignal.timeout(12_000)});
  if(!response.ok) throw new Error(`CMC HTTP ${response.status}`);
  const raw=await response.json();
  const status=(raw as any)?.status;
  if(status?.error_code && Number(status.error_code)!==0) throw new Error(`CMC: ${status.error_message ?? status.error_code}`);
  return parseCmcQuotes(raw);
}


export interface CmcMetadata {
  cmcId:string;
  symbol:string;
  name:string;
  category:string|null;
  tags:string[];
  logo:string|null;
}

export function parseCmcMetadata(raw:any):CmcMetadata[] {
  return records(raw?.data).flatMap(entry=>{
    const symbol=String(entry?.symbol ?? "").toUpperCase();
    const id=String(entry?.id ?? "");
    if(!symbol||!id) return [];
    const tags=Array.isArray(entry?.tags)
      ? entry.tags.map((tag:any)=>typeof tag==="string"?tag:String(tag?.name ?? tag?.slug ?? "")).filter(Boolean)
      : [];
    return [{
      cmcId:id,symbol,name:String(entry?.name ?? symbol),
      category:typeof entry?.category==="string"?entry.category:null,
      tags,
      logo:typeof entry?.logo==="string"?entry.logo:null,
    }];
  });
}

export async function fetchCmcMetadata(ids:string[],args:{apiKey?:string;fetchImpl?:FetchLike}={}):Promise<CmcMetadata[]> {
  const fetchImpl=args.fetchImpl ?? fetch;
  const unique=[...new Set(ids.filter(Boolean))];
  if(!unique.length) return [];
  const base=args.apiKey
    ? "https://pro-api.coinmarketcap.com/v2/cryptocurrency/info"
    : "https://pro-api.coinmarketcap.com/public-api/v2/cryptocurrency/info";
  const url=new URL(base);
  url.searchParams.set("id",unique.join(","));
  const response=await fetchImpl(url,{headers:args.apiKey?{"X-CMC_PRO_API_KEY":args.apiKey,Accept:"application/json"}:{Accept:"application/json"},signal:AbortSignal.timeout(12_000)});
  if(!response.ok) throw new Error(`CMC metadata HTTP ${response.status}`);
  const raw=await response.json();
  const status=(raw as any)?.status;
  if(status?.error_code && Number(status.error_code)!==0) throw new Error(`CMC metadata: ${status.error_message ?? status.error_code}`);
  return parseCmcMetadata(raw);
}
