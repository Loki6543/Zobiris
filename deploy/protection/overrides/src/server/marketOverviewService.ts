// Public market data for the Portfolio, Market Today and Watchlist pages. Free, keyless sources only:
//   CoinGecko markets (shared with Strategy v2) + /global, alternative.me Fear & Greed, Kraken daily OHLC.
import { fetchCoinGeckoGlobal, fetchFearGreed, fetchCoinGeckoTop500, fetchKrakenDailyCandles, type Candle, type FetchLike, type MarketCoin } from "../strategyV2/feed.js";
import { technicalRead } from "../strategyV2/indicators.js";
import { getKrakenPairs, getLatestBtcCandles, getLatestMarket, krakenSlot } from "./strategyV2Service.js";

const FAST_TTL_MS = 15 * 60_000;
const HISTORY_TTL_MS = 6 * 3_600_000;
const MAX_SYMBOLS = 80;
const MAX_HISTORY_SYMBOLS = 25;

interface Cached<T> { value: T; at: number }
let globalStats: Cached<Awaited<ReturnType<typeof fetchCoinGeckoGlobal>>> | null = null;
let fearGreed: Cached<Awaited<ReturnType<typeof fetchFearGreed>>> | null = null;
let ownMarket: Cached<MarketCoin[]> | null = null;
const coinCandles = new Map<string, Cached<Candle[]>>();
const inflight = new Map<string, Promise<Candle[] | null>>();
const fresh = <T>(c: Cached<T> | null | undefined, ttl: number, now = Date.now()): c is Cached<T> => Boolean(c && now - c.at < ttl);
const defaultFetch = fetch as unknown as FetchLike;

export function parseSymbols(raw: string | null | undefined): string[] {
  return [...new Set(String(raw ?? "").split(",").map((s) => s.trim().toUpperCase()).filter((s) => /^[A-Z0-9]{1,15}$/.test(s)))].slice(0, MAX_SYMBOLS);
}

async function market(fetcher: FetchLike): Promise<MarketCoin[]> {
  const shared = getLatestMarket();
  if (fresh(shared, FAST_TTL_MS)) return shared.value;
  if (!fresh(ownMarket, FAST_TTL_MS)) ownMarket = { value: await fetchCoinGeckoTop500(fetcher), at: Date.now() };
  return ownMarket.value;
}

/** Daily candles for one symbol from Kraken (cached 6h, de-duplicated, rate-limited). */
async function candlesFor(symbol: string, fetcher: FetchLike): Promise<Candle[] | null> {
  if (symbol === "BTC") { const b = getLatestBtcCandles(); if (fresh(b, HISTORY_TTL_MS)) return b.value; }
  const cached = coinCandles.get(symbol);
  if (fresh(cached, HISTORY_TTL_MS)) return cached.value;
  const running = inflight.get(symbol);
  if (running) return running;
  const job = (async () => {
    const pair = (await getKrakenPairs(fetcher)).get(symbol);
    if (!pair) return null;
    await krakenSlot();
    const value = await fetchKrakenDailyCandles(fetcher, pair);
    coinCandles.set(symbol, { value, at: Date.now() });
    return value;
  })().catch(() => coinCandles.get(symbol)?.value ?? null).finally(() => inflight.delete(symbol));
  inflight.set(symbol, job);
  return job;
}

const quote = (c: MarketCoin) => ({
  symbol: c.symbol, name: c.name, rank: c.rank, priceUsd: c.priceUsd, change24hPct: c.change24hPct, change7dPct: c.change7dPct, change30dPct: c.change30dPct,
  marketCapUsd: c.marketCapUsd, volume24hUsd: c.volume24hUsd, circulatingSupply: c.circulatingSupply, maxSupply: c.maxSupply, athChangePct: c.athChangePct, sparkline7d: c.sparkline7d,
});
export type Quote = ReturnType<typeof quote>;

/** Quotes for the requested symbols (best-ranked coin per ticker), plus BTC/ETH/SOL headline cards. */
export async function getMarketOverview(symbolsRaw: string | null, fetcher: FetchLike = defaultFetch) {
  const coins = await market(fetcher);
  const bySymbol = new Map<string, MarketCoin>();
  for (const c of coins) { const prev = bySymbol.get(c.symbol); if (!prev || (c.rank ?? 1e9) < (prev.rank ?? 1e9)) bySymbol.set(c.symbol, c); }
  const wanted = new Set([...parseSymbols(symbolsRaw), "BTC", "ETH", "SOL"]);
  const quotes: Record<string, Quote> = {};
  for (const s of wanted) { const c = bySymbol.get(s); if (c) quotes[s] = quote(c); }

  if (!fresh(globalStats, FAST_TTL_MS)) { try { globalStats = { value: await fetchCoinGeckoGlobal(fetcher), at: Date.now() }; } catch { /* keep last */ } }
  if (!fresh(fearGreed, FAST_TTL_MS)) { try { fearGreed = { value: await fetchFearGreed(fetcher), at: Date.now() }; } catch { /* keep last */ } }
  const btc = (await candlesFor("BTC", fetcher)) ?? [];
  const closes = btc.map((c) => c.close);
  return {
    asOf: new Date().toISOString(),
    quotes,
    global: globalStats?.value ?? null,
    fearGreed: fearGreed?.value ?? [],
    btc: { candles: btc.slice(-365).map((c) => ({ t: c.time, o: c.open, h: c.high, l: c.low, c: c.close, v: c.volume })), technicals: technicalRead(closes) },
    sources: ["CoinGecko /coins/markets + /global", "alternative.me Fear & Greed", "Kraken public daily OHLC"],
  };
}

/** Daily closes (up to 720 days) for each requested symbol, for valuing current holdings over time. */
export async function getPriceHistory(symbolsRaw: string | null, fetcher: FetchLike = defaultFetch) {
  const symbols = parseSymbols(symbolsRaw).slice(0, MAX_HISTORY_SYMBOLS);
  const series: Record<string, Array<[number, number]>> = {};
  const missing: string[] = [];
  for (const s of symbols) {
    if (s === "USD" || s === "USDC" || s === "USDT") continue; // cash-like: constant $1
    const candles = await candlesFor(s, fetcher);
    if (candles?.length) series[s] = candles.map((c) => [c.time, c.close]);
    else missing.push(s);
  }
  return { asOf: new Date().toISOString(), series, missing, source: "Kraken public daily OHLC (USD pairs)" };
}
