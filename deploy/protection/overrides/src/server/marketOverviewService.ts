// Public market data for the Portfolio, Market Today and Watchlist pages. Free, keyless sources only:
//   CoinGecko markets (shared with Strategy v2) + /global, alternative.me Fear & Greed, Kraken daily OHLC.
import { fetchCoinGeckoGlobal, fetchCoinGeckoSectors, fetchFearGreed, fetchCoinGeckoTop500, fetchKrakenDailyCandles, type Candle, type FetchLike, type MarketCoin } from "../strategyV2/feed.js";
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
let sectors: Cached<Awaited<ReturnType<typeof fetchCoinGeckoSectors>>> | null = null;
const coinCandles = new Map<string, Cached<Candle[]>>();
const candleFailedAt = new Map<string, number>();
const inflight = new Map<string, Promise<Candle[] | null>>();
const sideFailedAt = new Map<string, number>();
const fresh = <T>(c: Cached<T> | null | undefined, ttl: number, now = Date.now()): c is Cached<T> => Boolean(c && now - c.at < ttl);
const defaultFetch = fetch as unknown as FetchLike;

export function parseSymbols(raw: string | null | undefined): string[] {
  return [...new Set(String(raw ?? "").split(",").map((s) => s.trim().toUpperCase()).filter((s) => /^[A-Z0-9]{1,15}$/.test(s)))].slice(0, MAX_SYMBOLS);
}

const RETRY_AFTER_FAIL_MS = 5 * 60_000;
let marketJob: Promise<MarketCoin[]> | null = null;
let marketFailedAt = 0;
async function market(fetcher: FetchLike): Promise<MarketCoin[]> {
  const shared = getLatestMarket();
  const copies = [ownMarket, shared].filter((c): c is Cached<MarketCoin[]> => c != null); // before the type-narrowing checks below
  // The shared copy is replaced every 15 minutes once a Strategy v2 refresh finishes; allow it 30 so a running
  // refresh does not trigger a second top-500 download.
  if (fresh(shared, 2 * FAST_TTL_MS)) return shared.value;
  if (fresh(ownMarket, FAST_TTL_MS)) return ownMarket.value;
  const stale = copies.sort((a, b) => b.at - a.at)[0] ?? null;
  if (stale && Date.now() - marketFailedAt < RETRY_AFTER_FAIL_MS) return stale.value;
  marketJob ??= fetchCoinGeckoTop500(fetcher).then((value) => { ownMarket = { value, at: Date.now() }; return value; })
    .catch((e) => { marketFailedAt = Date.now(); if (stale) return stale.value; throw e; })
    .finally(() => { marketJob = null; });
  return marketJob;
}

/** Daily candles for one symbol from Kraken (cached 6h, de-duplicated, rate-limited). */
async function candlesFor(symbol: string, fetcher: FetchLike): Promise<Candle[] | null> {
  if (symbol === "BTC") { const b = getLatestBtcCandles(); if (fresh(b, HISTORY_TTL_MS)) return b.value; }
  const cached = coinCandles.get(symbol);
  if (fresh(cached, HISTORY_TTL_MS)) return cached.value;
  const running = inflight.get(symbol);
  if (running) return running;
  if (Date.now() - (candleFailedAt.get(symbol) ?? 0) < RETRY_AFTER_FAIL_MS) return coinCandles.get(symbol)?.value ?? null; // last good copy while backing off
  const job = (async () => {
    const pair = (await getKrakenPairs(fetcher)).get(symbol);
    if (!pair) return null;
    await krakenSlot();
    const value = await fetchKrakenDailyCandles(fetcher, pair);
    coinCandles.set(symbol, { value, at: Date.now() });
    return value;
  })().catch(() => { candleFailedAt.set(symbol, Date.now()); return coinCandles.get(symbol)?.value ?? null; }).finally(() => inflight.delete(symbol));
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

  // Side panels load in parallel; a failed source keeps its last value and is not retried for 5 minutes.
  const due = (c: Cached<unknown> | null, key: string) => !fresh(c, FAST_TTL_MS) && Date.now() - (sideFailedAt.get(key) ?? 0) >= RETRY_AFTER_FAIL_MS;
  const load = async (key: string, run: () => Promise<void>) => { try { await run(); } catch { sideFailedAt.set(key, Date.now()); } };
  await Promise.all([
    due(globalStats, "global") ? load("global", async () => { globalStats = { value: await fetchCoinGeckoGlobal(fetcher), at: Date.now() }; }) : null,
    due(fearGreed, "fng") ? load("fng", async () => { fearGreed = { value: await fetchFearGreed(fetcher), at: Date.now() }; }) : null,
    due(sectors, "sectors") ? load("sectors", async () => { sectors = { value: await fetchCoinGeckoSectors(fetcher), at: Date.now() }; }) : null,
  ]);
  const btc = (await candlesFor("BTC", fetcher)) ?? [];
  const closes = btc.map((c) => c.close);
  return {
    asOf: new Date().toISOString(),
    quotes,
    global: globalStats?.value ?? null,
    fearGreed: fearGreed?.value ?? [],
    sectors: sectors?.value ?? [],
    btc: { candles: btc.slice(-365).map((c) => ({ t: c.time, o: c.open, h: c.high, l: c.low, c: c.close, v: c.volume })), technicals: technicalRead(closes) },
    sources: ["CoinGecko /coins/markets + /global + /coins/categories", "alternative.me Fear & Greed", "Kraken public daily OHLC"],
  };
}

/** Daily closes (up to 720 days) for each requested symbol, for valuing current holdings over time. */
export async function getPriceHistory(symbolsRaw: string | null, fetcher: FetchLike = defaultFetch) {
  const symbols = parseSymbols(symbolsRaw).filter((s) => s !== "USD" && s !== "USDC" && s !== "USDT").slice(0, MAX_HISTORY_SYMBOLS); // cash-like: constant $1
  const series: Record<string, Array<[number, number]>> = {};
  const missing: string[] = [], pending: string[] = [];
  // Kraken requests queue one per ~1.1s behind Strategy v2; answer within ~25s with what is ready (the rest keeps
  // loading into the cache and arrives on the next poll).
  const jobs = symbols.map((s) => candlesFor(s, fetcher)); // each waits its turn in the shared Kraken queue
  const timeout = new Promise<"timeout">((r) => setTimeout(() => r("timeout"), 25_000).unref?.());
  const results = await Promise.all(jobs.map((j) => Promise.race([j, timeout])));
  symbols.forEach((s, i) => {
    const r = results[i];
    const candles = r === "timeout" ? coinCandles.get(s)?.value ?? null : r;
    if (candles?.length) series[s] = candles.map((c) => [c.time, c.close]);
    else (r === "timeout" ? pending : missing).push(s);
  });
  return { asOf: new Date().toISOString(), series, missing, pending, source: "Kraken public daily OHLC (USD pairs)" };
}
