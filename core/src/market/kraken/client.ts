import { buildUsdInstrumentRegistry, type KrakenPairRaw } from "./instruments.js";
import type { NormalizedBook } from "./execution.js";

export interface KrakenTicker {
  pairKey: string;
  bid: number | null;
  ask: number | null;
  last: number | null;
  volumeTodayBase: number | null;
  volume24hBase: number | null;
  volume24hUsd: number | null;
}

type FetchLike = typeof fetch;

async function krakenJson(url: URL, fetchImpl: FetchLike) {
  const response = await fetchImpl(url, { signal: AbortSignal.timeout(12_000) });
  if (!response.ok) throw new Error(`Kraken HTTP ${response.status}`);
  const payload = await response.json() as { error?: string[]; result?: Record<string, any> };
  if (payload.error?.length) throw new Error(`Kraken: ${payload.error.join(", ")}`);
  if (!payload.result) throw new Error("Kraken result missing");
  return payload.result;
}

export async function fetchUsdInstrumentRegistry(fetchImpl: FetchLike = fetch) {
  const url = new URL("https://api.kraken.com/0/public/AssetPairs");
  const result = await krakenJson(url, fetchImpl);
  return buildUsdInstrumentRegistry(result as Record<string, KrakenPairRaw>);
}

export function parseTicker(pairKey: string, row: any): KrakenTicker {
  const num=(value:unknown) => {
    const n=Number(value);
    return Number.isFinite(n) ? n : null;
  };
  const bid=num(row?.b?.[0]);
  const ask=num(row?.a?.[0]);
  const last=num(row?.c?.[0]);
  const today=num(row?.v?.[0]);
  const rolling=num(row?.v?.[1]);
  const reference=last ?? (bid != null && ask != null ? (bid+ask)/2 : null);
  return {
    pairKey,bid,ask,last,
    volumeTodayBase:today,
    volume24hBase:rolling,
    volume24hUsd:rolling != null && reference != null ? rolling*reference : null,
  };
}

export async function fetchTickers(pairs: string[], fetchImpl: FetchLike = fetch): Promise<Map<string,KrakenTicker>> {
  const unique=[...new Set(pairs.filter(Boolean))];
  if(!unique.length) return new Map();
  const url=new URL("https://api.kraken.com/0/public/Ticker");
  url.searchParams.set("pair",unique.join(","));
  const result=await krakenJson(url,fetchImpl);
  return new Map(Object.entries(result).map(([pairKey,row])=>[pairKey,parseTicker(pairKey,row)]));
}

export async function fetchTicker(pair: string, fetchImpl: FetchLike = fetch): Promise<KrakenTicker> {
  const result=await fetchTickers([pair],fetchImpl);
  const first=result.values().next().value as KrakenTicker|undefined;
  if(!first) throw new Error("Kraken ticker missing");
  return first;
}

export async function fetchOrderBook(pair: string, fetchImpl: FetchLike = fetch): Promise<NormalizedBook> {
  const url=new URL("https://api.kraken.com/0/public/Depth");
  url.searchParams.set("pair",pair);
  url.searchParams.set("count","500");
  const result=await krakenJson(url,fetchImpl);
  const entry=Object.entries(result)[0];
  if(!entry) throw new Error("Kraken order book missing");
  const row=entry[1] as { bids?: unknown[][]; asks?: unknown[][] };
  const normalize=(levels:unknown[][]|undefined) => (levels ?? []).map(level=>({
    price:Number(level[0]),qty:Number(level[1]),
  })).filter(level=>Number.isFinite(level.price)&&level.price>0&&Number.isFinite(level.qty)&&level.qty>0);
  return {
    pair:entry[0],
    observedAt:new Date().toISOString(),
    bids:normalize(row.bids),
    asks:normalize(row.asks),
  };
}
