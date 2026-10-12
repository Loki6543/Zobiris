// Coin tags for the watchlist filters: coin type and ecosystem (CoinGecko category membership, top 250 per category),
// Kraken spot availability (Kraken USD pairs) and DEX availability (token lives on a DEX-traded chain). Cached 6h.
import { fetchJson, parseCoinGeckoMarkets, type FetchLike } from "../strategyV2/feed.js";
import { getKrakenPairs } from "./strategyV2Service.js";

export const COIN_TYPES: Array<[string, string]> = [
  ["layer-1", "Layer 1"], ["layer-2", "Layer 2"], ["decentralized-finance-defi", "DeFi"], ["meme-token", "Meme"], ["artificial-intelligence", "AI"],
  ["gaming", "Gaming"], ["real-world-assets-rwa", "RWA"], ["depin", "DePIN"], ["oracle", "Oracle"], ["privacy-coins", "Privacy"],
  ["exchange-based-tokens", "Exchange token"], ["stablecoins", "Stablecoin"],
];
export const ECOSYSTEMS: Array<[string, string]> = [
  ["ethereum-ecosystem", "Ethereum"], ["solana-ecosystem", "Solana"], ["binance-smart-chain", "BNB Chain"], ["base-ecosystem", "Base"],
  ["arbitrum-ecosystem", "Arbitrum"], ["cosmos-ecosystem", "Cosmos"], ["polkadot-ecosystem", "Polkadot"], ["sui-ecosystem", "Sui"], ["ton-ecosystem", "TON"],
];
const DEX_CHAINS = new Set(["Ethereum", "Solana", "BNB Chain", "Base", "Arbitrum", "Sui", "TON"]);
export interface CoinMeta { types: string[]; ecosystems: string[]; kraken: boolean; dex: boolean }
let cache: { at: number; byId: Map<string, { types: string[]; ecosystems: string[] }>; bySym: Map<string, string> } | null = null;
let job: Promise<void> | null = null;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function refresh(fetcher: FetchLike) {
  const byId = new Map<string, { types: string[]; ecosystems: string[] }>(), bySym = new Map<string, string>();
  for (const [list, key] of [[COIN_TYPES, "types"], [ECOSYSTEMS, "ecosystems"]] as const) {
    for (const [cat, label] of list) {
      try {
        const rows = parseCoinGeckoMarkets(await fetchJson(fetcher, `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&category=${cat}&order=market_cap_desc&per_page=250&page=1&sparkline=false`));
        for (const r of rows) {
          const e = byId.get(r.geckoId) ?? { types: [], ecosystems: [] }; e[key].push(label); byId.set(r.geckoId, e);
          const prev = bySym.get(r.symbol); if (!prev) bySym.set(r.symbol, r.geckoId);
        }
      } catch { /* one category missing only narrows the tags */ }
      await sleep(2500); // CoinGecko keyless pacing
    }
  }
  if (byId.size) cache = { at: Date.now(), byId, bySym };
}

/** Tags for the given tickers (best-ranked CoinGecko id per ticker). Starts a background refresh when stale. */
export async function getCoinMeta(symbols: string[], fetcher: FetchLike = fetch as unknown as FetchLike): Promise<{ ready: boolean; meta: Record<string, CoinMeta>; types: string[]; ecosystems: string[] }> {
  if ((!cache || Date.now() - cache.at > 6 * 3_600_000) && !job) { job = refresh(fetcher).finally(() => { job = null; }); job.catch(() => {}); }
  let pairs = new Map<string, string>();
  try { pairs = await getKrakenPairs(fetcher); } catch { /* unknown venue */ }
  const meta: Record<string, CoinMeta> = {};
  for (const s of symbols) {
    const id = cache?.bySym.get(s); const t = id ? cache!.byId.get(id) : undefined;
    const ecosystems = t?.ecosystems ?? [];
    meta[s] = { types: t?.types ?? [], ecosystems, kraken: pairs.has(s), dex: ecosystems.some((e) => DEX_CHAINS.has(e)) };
  }
  return { ready: Boolean(cache), meta, types: COIN_TYPES.map((x) => x[1]), ecosystems: ECOSYSTEMS.map((x) => x[1]) };
}
