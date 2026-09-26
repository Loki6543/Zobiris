import { fetchKrakenOrderBook, fetchKrakenTicker } from './providers/krakenExecution.js';
import { readCollectorCursor, saveStrategyBookSnapshot, writeCollectorCursor } from './storage.js';
import { selectCollectionSymbols } from './collectorSelection.js';
const ALIASES: Record<string,string> = { XBT:'BTC', XDG:'DOGE' };


export async function fetchKrakenUsdPairMap(): Promise<Map<string,string>> {
  const response = await fetch('https://api.kraken.com/0/public/AssetPairs');
  if (!response.ok) throw new Error(`Kraken AssetPairs HTTP ${response.status}`);
  const payload = await response.json() as {error?:unknown[];result?:Record<string,{altname?:string;wsname?:string;quote?:string}>};
  if ((payload.error ?? []).filter(Boolean).length) throw new Error(`Kraken AssetPairs error: ${(payload.error ?? []).join(', ')}`);
  const map = new Map<string,string>();
  for (const [key,pair] of Object.entries(payload.result ?? {})) {
    const ws = pair.wsname;
    if (!ws?.endsWith('/USD')) continue;
    let symbol = ws.split('/')[0]!.toUpperCase();
    symbol = ALIASES[symbol] ?? symbol;
    map.set(symbol, pair.altname ?? key);
  }
  return map;
}

export async function fetchKrakenOneMinuteNotional(pair: string, nowMs = Date.now()): Promise<number> {
  const sinceNs = Math.max(0, nowMs - 60_000) * 1_000_000;
  const response = await fetch(`https://api.kraken.com/0/public/Trades?pair=${encodeURIComponent(pair)}&since=${sinceNs}`);
  if (!response.ok) throw new Error(`Kraken Trades HTTP ${response.status}`);
  const payload = await response.json() as {error?:unknown[];result?:Record<string,unknown>};
  if ((payload.error ?? []).filter(Boolean).length) throw new Error(`Kraken Trades error: ${(payload.error ?? []).join(', ')}`);
  const result = payload.result ?? {};
  const key = Object.keys(result).find((k)=>k !== 'last');
  const rows = key ? result[key] : undefined;
  if (!Array.isArray(rows)) return 0;
  let notional = 0;
  for (const row of rows) {
    if (!Array.isArray(row) || row.length < 3) continue;
    const price=Number(row[0]), volume=Number(row[1]), timeSec=Number(row[2]);
    if (Number.isFinite(price)&&Number.isFinite(volume)&&Number.isFinite(timeSec)&&timeSec*1000>=nowMs-60_000) notional += price*volume;
  }
  return notional;
}

const pause = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export async function collectStrategy21Kraken(input: { dbPath?:string; watchlist:string[]; totalSlots?:number; prioritySlots?:number }): Promise<Array<{symbol:string;pair?:string;ok:boolean;error?:string}>> {
  const cursor = readCollectorCursor(input.dbPath);
  const selection = selectCollectionSymbols(input.watchlist,cursor,input.totalSlots ?? 36,input.prioritySlots ?? 9);
  const pairMap = await fetchKrakenUsdPairMap();
  const results: Array<{symbol:string;pair?:string;ok:boolean;error?:string}> = [];
  for (const symbol of selection.symbols) {
    const pair = pairMap.get(symbol);
    if (!pair) { results.push({symbol,ok:false,error:'no verified Kraken USD pair'}); continue; }
    try {
      // Keep public REST calls spaced so wider watchlist coverage does not burst Kraken's rate limit.
      const book = await fetchKrakenOrderBook(pair);
      await pause(1100);
      const ticker = await fetchKrakenTicker(pair);
      await pause(1100);
      const notional1m = await fetchKrakenOneMinuteNotional(pair);
      await pause(1100);
      const snapshot = {...book, activeMinute:notional1m>0, tradeNotional1m:notional1m};
      saveStrategyBookSnapshot(input.dbPath,symbol,snapshot,ticker.notional24hUsd,ticker.tradeCount24h);
      results.push({symbol,pair,ok:true});
    } catch (error) {
      results.push({symbol,pair,ok:false,error:error instanceof Error?error.message:String(error)});
    }
  }
  writeCollectorCursor(input.dbPath,selection.nextCursor);
  return results;
}
