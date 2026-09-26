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
type Candle = { time: number; close: number };
const cache = new Map<string, { expires: number; candles: Candle[] }>();

async function daily(symbol: string): Promise<Candle[]> {
  const cached = cache.get(symbol);
  if (cached && cached.expires > Date.now()) return cached.candles;
  const response = await fetch("https://api.kraken.com/0/public/OHLC?pair=" +
    encodeURIComponent(PAIRS[symbol]!) + "&interval=1440", { signal: AbortSignal.timeout(10000) });
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
    return { time: Number(values?.[0]), close: Number(values?.[4]) };
  }).filter((row: Candle) => Number.isFinite(row.time) && row.time < todayUtc &&
    Number.isFinite(row.close) && row.close > 0).sort((a: Candle, b: Candle) => a.time - b.time);
  if (candles.length < 8) throw new Error("Insufficient real daily candles for " + symbol);
  cache.set(symbol, { expires: Date.now() + 300000, candles });
  return candles;
}
export async function compareDaily(rawSymbols: string[], days: number) {
  const symbols = [...new Set(rawSymbols.map(s => s.trim().toUpperCase()))];
  if (symbols.length < 2 || symbols.length > 5 ||
      symbols.some(s => !Object.hasOwn(PAIRS, s)) ||
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
  if (symbols[0] !== "BTC" || symbols.length < 2 || symbols.length > 5 ||
      symbols.some(s => !Object.hasOwn(PAIRS, s)) || ![1, 2, 3].includes(thresholdPct))
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
