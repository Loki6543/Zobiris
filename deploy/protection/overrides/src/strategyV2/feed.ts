// Free, keyless market data for Strategy v2.
//   CoinGecko  /api/v3/coins/markets   rank, market cap, FDV, volume, supply, ATH distance, 7d/30d/200d/1y
//   CoinPaprika /v1/tickers            first_data_at (coin age)
//   Kraken     /0/public/AssetPairs     which coins are tradable in USD on Kraken
//   Kraken     /0/public/OHLC           completed daily closes (BTC regime, coin 50-day average)
// Parsers are pure so they can be tested on recorded responses; the fetchers take an injectable fetch.

export interface MarketCoin {
  geckoId: string;
  symbol: string;
  name: string;
  rank: number | null;
  priceUsd: number | null;
  marketCapUsd: number | null;
  fdvUsd: number | null;
  volume24hUsd: number | null;
  circulatingSupply: number | null;
  totalSupply: number | null;
  maxSupply: number | null;
  athChangePct: number | null;
  change24hPct: number | null;
  change7dPct: number | null;
  change30dPct: number | null;
  change200dPct: number | null;
  change1yPct: number | null;
  lastUpdated: string | null;
}

const num = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null);

export function parseCoinGeckoMarkets(raw: unknown): MarketCoin[] {
  if (!Array.isArray(raw)) throw new Error("CoinGecko markets: expected an array");
  return raw.filter((r) => r && typeof r === "object" && typeof r.id === "string" && typeof r.symbol === "string").map((r: any) => ({
    geckoId: r.id,
    symbol: String(r.symbol).toUpperCase(),
    name: String(r.name ?? r.id),
    rank: num(r.market_cap_rank),
    priceUsd: num(r.current_price),
    marketCapUsd: num(r.market_cap),
    fdvUsd: num(r.fully_diluted_valuation),
    volume24hUsd: num(r.total_volume),
    circulatingSupply: num(r.circulating_supply),
    totalSupply: num(r.total_supply),
    maxSupply: num(r.max_supply),
    athChangePct: num(r.ath_change_percentage),
    change24hPct: num(r.price_change_percentage_24h),
    change7dPct: num(r.price_change_percentage_7d_in_currency),
    change30dPct: num(r.price_change_percentage_30d_in_currency),
    change200dPct: num(r.price_change_percentage_200d_in_currency),
    change1yPct: num(r.price_change_percentage_1y_in_currency),
    lastUpdated: typeof r.last_updated === "string" ? r.last_updated : null,
  }));
}

/** symbol (upper) -> first_data_at ISO. When symbols collide, keep the best-ranked coin. */
export function parsePaprikaFirstSeen(raw: unknown): Map<string, { firstDataAt: string; rank: number; name: string }> {
  if (!Array.isArray(raw)) throw new Error("CoinPaprika tickers: expected an array");
  const out = new Map<string, { firstDataAt: string; rank: number; name: string }>();
  for (const t of raw as any[]) {
    if (!t || typeof t.symbol !== "string" || typeof t.first_data_at !== "string") continue;
    const sym = t.symbol.toUpperCase();
    const rank = typeof t.rank === "number" && t.rank > 0 ? t.rank : Number.MAX_SAFE_INTEGER;
    const prev = out.get(sym);
    if (!prev || rank < prev.rank) out.set(sym, { firstDataAt: t.first_data_at, rank, name: String(t.name ?? "") });
  }
  return out;
}

const KRAKEN_ALIASES: Record<string, string> = { XBT: "BTC", XDG: "DOGE" };

/** Set of base symbols with an online USD spot pair on Kraken, plus the pair name to query OHLC with. */
export function parseKrakenUsdPairs(raw: unknown): Map<string, string> {
  const result = (raw as any)?.result;
  if (!result || typeof result !== "object") throw new Error("Kraken AssetPairs: missing result");
  const out = new Map<string, string>();
  for (const [pair, info] of Object.entries<any>(result)) {
    const ws: unknown = info?.wsname;
    if (typeof ws !== "string" || info?.status && info.status !== "online") continue;
    const [base, quote] = ws.split("/");
    if (!base || quote !== "USD") continue;
    out.set(KRAKEN_ALIASES[base] ?? base, pair);
  }
  return out;
}

/** Completed daily candles (unix seconds, close), oldest first. Kraken's last row is still forming and is dropped. */
export function parseKrakenDailyCandles(raw: unknown): Array<{ time: number; close: number }> {
  const result = (raw as any)?.result;
  if (!result || typeof result !== "object") throw new Error("Kraken OHLC: missing result");
  const key = Object.keys(result).find((k) => k !== "last");
  const rows: unknown = key ? result[key] : null;
  if (!Array.isArray(rows) || rows.length < 2) throw new Error("Kraken OHLC: no candles");
  return rows.slice(0, -1).map((r: any) => ({ time: Number(r[0]), close: Number(r[4]) })).filter((c) => Number.isFinite(c.time) && Number.isFinite(c.close) && c.close > 0);
}

/** Completed daily closes, oldest first. */
export function parseKrakenDailyCloses(raw: unknown): number[] {
  return parseKrakenDailyCandles(raw).map((c) => c.close);
}

export type FetchLike = (url: string, init?: { headers?: Record<string, string>; signal?: AbortSignal }) => Promise<{ ok: boolean; status: number; json(): Promise<unknown> }>;

async function getJson(fetcher: FetchLike, url: string): Promise<unknown> {
  const res = await fetcher(url, { headers: { Accept: "application/json", "User-Agent": "ZOBIRIS/2 research" }, signal: AbortSignal.timeout(20_000) });
  if (!res.ok) throw new Error(`${new URL(url).host} HTTP ${res.status}`);
  return res.json();
}

export const fetchCoinGeckoTop500 = async (fetcher: FetchLike): Promise<MarketCoin[]> => {
  const page = (n: number) => `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page=${n}&price_change_percentage=7d,30d,200d,1y`;
  const [a, b] = [parseCoinGeckoMarkets(await getJson(fetcher, page(1))), parseCoinGeckoMarkets(await getJson(fetcher, page(2)))];
  return [...a, ...b];
};
export const fetchPaprikaFirstSeen = async (fetcher: FetchLike) => parsePaprikaFirstSeen(await getJson(fetcher, "https://api.coinpaprika.com/v1/tickers"));
export const fetchKrakenUsdPairs = async (fetcher: FetchLike) => parseKrakenUsdPairs(await getJson(fetcher, "https://api.kraken.com/0/public/AssetPairs"));
export const fetchKrakenDailyCandles = async (fetcher: FetchLike, pair: string) => parseKrakenDailyCandles(await getJson(fetcher, `https://api.kraken.com/0/public/OHLC?pair=${encodeURIComponent(pair)}&interval=1440`));
export const fetchKrakenDailyCloses = async (fetcher: FetchLike, pair: string) => parseKrakenDailyCloses(await getJson(fetcher, `https://api.kraken.com/0/public/OHLC?pair=${encodeURIComponent(pair)}&interval=1440`));
