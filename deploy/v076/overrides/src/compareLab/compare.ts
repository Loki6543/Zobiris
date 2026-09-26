/** Compare Lab uses only completed Kraken OHLC candles. No synthetic display bars. */
const PAIRS: Record<string, string> = {
  BTC: "XBTUSD", ETH: "ETHUSD", SOL: "SOLUSD", XRP: "XRPUSD",
  LINK: "LINKUSD", AAVE: "AAVEUSD", HBAR: "HBARUSD",
  COMP: "COMPUSD", ONDO: "ONDOUSD", TAO: "TAOUSD",
  RAY: "RAYUSD", AVAX: "AVAXUSD", JUP: "JUPUSD",
  DOGE: "DOGEUSD", ADA: "ADAUSD",
};
export const compareSymbols = Object.keys(PAIRS);
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
  if (times.length < Math.min(days + 1, 8))
    throw new Error("Insufficient overlapping completed Kraken candles.");
  const series: Series[] = histories.map(({ symbol, candles }) => {
    const byTime = new Map(candles.map(c => [c.time, c.close]));
    return { symbol, points: times.map(time => ({ time, close: byTime.get(time)! })) };
  });
  return { source: "Kraken public OHLC", provenance: "real-completed-daily",
    requestedDays: days, observedDays: times.length - 1,
    asOf: new Date(times[times.length - 1]! * 1000).toISOString(), series };
}

