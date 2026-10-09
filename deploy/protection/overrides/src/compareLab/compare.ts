import { entryRules } from "../server/entryRules.js";
import { loadWatchlist } from "../scripts/_watchlist.js";
import { isVisibleAsset } from "../shared/assetUniverse.js";
/** Compare Lab uses only completed Kraken OHLC candles. No synthetic display bars. */
const PAIRS: Record<string, string> = {
  BTC: "XBTUSD", ETH: "ETHUSD", SOL: "SOLUSD", XRP: "XRPUSD",
  LINK: "LINKUSD", AAVE: "AAVEUSD", HBAR: "HBARUSD",
  COMP: "COMPUSD", ONDO: "ONDOUSD", TAO: "TAOUSD",
  RAY: "RAYUSD", AVAX: "AVAXUSD", JUP: "JUPUSD",
  DOGE: "DOGEUSD", ADA: "ADAUSD",
};
export const compareSymbols = Object.keys(PAIRS);
let universeCache: { expires: number; symbols: string[] } | null = null;
export async function compareUniverse(): Promise<string[]> {
  if (universeCache && universeCache.expires > Date.now()) return universeCache.symbols;
  const response = await fetch("https://api.kraken.com/0/public/AssetPairs", {
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error("Kraken pair list unavailable");
  const payload = await response.json() as {
    error?: string[]; result?: Record<string, { altname?: string; status?: string }>;
  };
  if (payload.error?.length || !payload.result) throw new Error("Kraken pair list unavailable");
  const listed = new Set(Object.values(payload.result)
    .filter(pair => !pair.status || pair.status === "online")
    .map(pair => pair.altname));
  const symbols = compareSymbols.filter(symbol => listed.has(PAIRS[symbol]));
  if (symbols.length < 2) throw new Error("No comparable Kraken USD pairs available");
  universeCache = { expires: Date.now() + 1800000, symbols };
  return symbols;
}
export type Series = { symbol: string; points: { time: number; close: number }[] };
type Candle = { time: number; close: number; high:number; low:number; volume:number };
const cache = new Map<string, { expires: number; candles: Candle[] }>();

async function daily(symbol: string): Promise<Candle[]> {
  const cached = cache.get(symbol);
  if (cached && cached.expires > Date.now()) return cached.candles;
  let pair = PAIRS[symbol];
  if (!pair) {
    const rule = (await entryRules())[symbol];
    if (!rule || rule.status !== 'online') throw new Error(`${symbol} is on the watchlist; completed Kraken USD history is unavailable.`);
    pair = rule.pair;
  }
  const response = await fetch("https://api.kraken.com/0/public/OHLC?pair=" +
    encodeURIComponent(pair) + "&interval=1440", { signal: AbortSignal.timeout(10000) });
  if (!response.ok) throw new Error("Kraken HTTP " + response.status);
  const payload = await response.json() as {
    error?: string[]; result?: Record<string, unknown>;
  };
  if (payload.error?.length || !payload.result) throw new Error(payload.error?.join(", ") || "Kraken candles unavailable");
  const rows = Object.entries(payload.result).find(([key, value]) => key !== "last" && Array.isArray(value))?.[1];
  if (!Array.isArray(rows)) throw new Error("Kraken candles unavailable for " + symbol);
  const todayUtc = Math.floor(Date.now() / 86400000) * 86400;
  const candles = rows.map((row: unknown) => {
    const values = row as unknown[];
    return { time: Number(values?.[0]), close: Number(values?.[4]), high:Number(values?.[2]), low:Number(values?.[3]), volume:Number(values?.[6]) };
  }).filter((row: Candle) => Number.isFinite(row.time) && row.time < todayUtc &&
    Number.isFinite(row.close) && row.close > 0).sort((a: Candle, b: Candle) => a.time - b.time);
  if (candles.length < 8) throw new Error("Insufficient real daily candles for " + symbol);
  cache.set(symbol, { expires: Date.now() + 300000, candles });
  return candles;
}
export async function compareDaily(rawSymbols: string[], days: number) {
  const symbols = [...new Set(rawSymbols.map(s => s.trim().toUpperCase()))];
  const allowed = new Set([...compareSymbols, ...(await loadWatchlist()).map(a => a.symbol)]);
  if (symbols.length < 2 || symbols.length > 5 ||
      symbols.some(s => !isVisibleAsset(s) || !allowed.has(s)) ||
      ![7, 30, 90, 180].includes(days))
    throw new RangeError("Choose 2–5 supported coins and a 7, 30, 90 or 180 day window.");
  const histories = await Promise.all(symbols.map(async symbol => ({
    symbol, candles: await daily(symbol),
  })));
  const common = histories.reduce<Set<number>>((set, history, i) => {
    const times = new Set(history.candles.map(c => c.time));
    return i === 0 ? times : new Set([...set].filter(t => times.has(t)));
  }, new Set());
  const times = [...common].sort((a, b) => a - b).slice(-(days + 1));
  if (times.length < days + 1)
    throw new Error("Insufficient overlapping completed Kraken candles.");
  if (times.some((time, index) => index > 0 && time - times[index - 1]! !== 86400))
    throw new Error("Missing daily Kraken candles in the selected window.");
  const series: Series[] = histories.map(({ symbol, candles }) => {
    const byTime = new Map(candles.map(c => [c.time, c.close]));
    return { symbol, points: times.map(time => ({ time, close: byTime.get(time)! })) };
  });
  return { source: "Kraken public OHLC", provenance: "real-completed-daily",
    requestedDays: days, observedDays: times.length - 1,
    asOf: new Date(times[times.length - 1]! * 1000).toISOString(), series };
}

/** Historical analogues, evaluated only after their forward seven days completed. */
export async function sidewaysHistory(rawSymbols: string[], thresholdPct = 2) {
  const symbols = [...new Set(rawSymbols.map(s => s.trim().toUpperCase()))];
  const allowed = new Set([...compareSymbols, ...(await loadWatchlist()).map(a => a.symbol)]);
  if (symbols[0] !== "BTC" || symbols.length < 2 || symbols.length > 5 ||
      symbols.some(s => !isVisibleAsset(s) || !allowed.has(s)) || ![1, 2, 3].includes(thresholdPct))
    throw new RangeError("Choose BTC plus 1–4 supported coins and a 1%, 2% or 3% threshold.");
  const histories = await Promise.all(symbols.map(async symbol => ({ symbol, candles: await daily(symbol) })));
  const common = histories.reduce<Set<number>>((set, history, i) => {
    const times = new Set(history.candles.map(c => c.time));
    return i === 0 ? times : new Set([...set].filter(t => times.has(t)));
  }, new Set());
  const times = [...common].sort((a, b) => a - b).slice(-380);
  const prices = histories.map(history => {
    const byTime = new Map(history.candles.map(c => [c.time, c.close]));
    return times.map(time => byTime.get(time)!);
  });
  const matches: { start: string; end: string; btcPriorPct: number; forwardPct: Record<string, number> }[] = [];
  let lastSelectedStart = Infinity;
  for (let i = times.length - 15; i >= 0; i--) {
    // Complete, consecutive seven-day condition and forward windows are required.
    if (times[i + 14]! - times[i]! !== 14 * 86400 || lastSelectedStart - i < 14) continue;
    const btcPriorPct = (prices[0]![i + 7]! / prices[0]![i]! - 1) * 100;
    if (Math.abs(btcPriorPct) > thresholdPct) continue;
    const forwardPct = Object.fromEntries(symbols.map((symbol, j) =>
      [symbol, (prices[j]![i + 14]! / prices[j]![i + 7]! - 1) * 100]));
    matches.push({ start: new Date(times[i]! * 1000).toISOString().slice(0, 10),
      end: new Date(times[i + 7]! * 1000).toISOString().slice(0, 10), btcPriorPct, forwardPct });
    lastSelectedStart = i;
  }
  const median = (values: number[]) => {
    const sorted = [...values].sort((a, b) => a - b);
    return sorted.length ? (sorted[Math.floor((sorted.length - 1) / 2)]! + sorted[Math.floor(sorted.length / 2)]!) / 2 : null;
  };
  const summary = symbols.map(symbol => {
    const values = matches.map(m => m.forwardPct[symbol]!);
    return { symbol, count: values.length, medianForwardPct: median(values),
      positiveCount: values.filter(v => v > 0).length,
      beatBtcCount: matches.filter(m => m.forwardPct[symbol]! > m.forwardPct.BTC!).length,
      worstForwardPct: values.length ? Math.min(...values) : null };
  });
  return { source: "Kraken public OHLC", provenance: "real-completed-daily",
    condition: { btcDays: 7, maxAbsoluteReturnPct: thresholdPct, forwardDays: 7,
      nonOverlapping: true }, asOf: times.length ? new Date(times.at(-1)! * 1000).toISOString() : null,
    sampleCount: matches.length, summary, matches: matches.slice(0, 12) };
}


/** Descriptive daily exit inputs. No trade authorization or calibrated exit score. */
export async function exitMarketContext(symbol:string){
 if(!isVisibleAsset(symbol))return null;
 if(!Object.hasOwn(PAIRS,symbol)&&!(await loadWatchlist()).some(a=>a.symbol===symbol))return null;
 const candles=await daily(symbol);
 if(candles.length<201||candles.slice(-201).some((c,i,a)=>(i>0&&c.time-a[i-1]!.time!==86400)||!Number.isFinite(c.high)||!Number.isFinite(c.low)||c.high<c.close||c.low>c.close||c.low<=0||!Number.isFinite(c.volume)||c.volume<0))return null;
 const last=candles.at(-1)!;
 if(Date.now()/1000-last.time>3*86400)return null;
 const ema=(period:number)=>{let value=candles[0]!.close;const k=2/(period+1);for(const c of candles.slice(1))value=c.close*k+value*(1-k);return value;};
 const ema50=ema(50),ema200=ema(200);
 const changes=candles.slice(-15).slice(1).map((c,i)=>c.close-candles.slice(-15)[i]!.close);
 const gains=changes.reduce((s,n)=>s+Math.max(0,n),0)/14,losses=changes.reduce((s,n)=>s+Math.max(0,-n),0)/14;
 const rsi14=losses===0?(gains===0?50:100):100-100/(1+gains/losses);
 const atr14=candles.slice(-14).reduce((s,c,i)=>{const prev=candles[candles.length-15+i]!;return s+Math.max(c.high-c.low,Math.abs(c.high-prev.close),Math.abs(c.low-prev.close));},0)/14;
 const recentVol=candles.slice(-7).reduce((s,c)=>s+c.volume,0)/7;
 const priorVol=candles.slice(-37,-7).reduce((s,c)=>s+c.volume,0)/30;
 const momentum7dPct=(last.close/candles.at(-8)!.close-1)*100;
 const trend=last.close>ema50&&ema50>ema200?'STRONG':last.close<ema50&&ema50<ema200?'WEAK':'MIXED';
 const mode=trend==='WEAK'&&momentum7dPct<0?'EXIT REVIEW':rsi14>75&&momentum7dPct>0?'DISTRIBUTION WATCH':trend==='STRONG'&&momentum7dPct>0?'TREND':'MIXED';
 return {source:'Kraken completed daily candles',asOf:new Date(last.time*1000).toISOString(),atr14,atrPct:atr14/last.close*100,ema50,ema200,rsi14,momentum7dPct,volume7dVsPrior30d:priorVol>0?recentVol/priorVol:null,trend,mode,superTrend:null,method:'ATR and RSI use simple 14-day averages; mode is an unvalidated descriptive heuristic.'};
}

