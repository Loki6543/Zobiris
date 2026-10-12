// Bubblemaps Data API (https://docs.bubblemaps.io, v0): holder-cluster metrics for one token.
// Why: GoPlus lists raw top holders, but Bubblemaps clusters wallets that move together, strips CEX/DEX/contract
// supply, and flags bundled launches and fresh wallets: the holder picture a human analyst would draw by hand.
// The API is paid (credits per call; token metrics = 25 credits), so it is optional: without BUBBLEMAPS_API_KEY
// everything here is skipped and legitimacy falls back to the GoPlus top-10 figure.
export interface HolderMap {
  /** Bubblemaps decentralization score 0 (concentrated) .. 100 (decentralized); null when not applicable. */
  score: number | null;
  giniIndex: number | null;
  hhi: number | null;
  /** Independent entities needed to reach 50% of supply. */
  nakamoto: number | null;
  /** Supply shares in percent (0..100). */
  cexPct: number | null; dexPct: number | null; contractsPct: number | null; freshWalletsPct: number | null;
  /** Top-10 entities after clustering, CEX/DEX excluded. */
  top10AdjustedPct: number | null;
  /** Top-10 clusters (bundles), CEX/DEX excluded. */
  bundlesPct: number | null;
  flags: HolderFlag[];
  chain: string; address: string;
  /** Public map for a human to look at. */
  url: string;
}
export type HolderFlag = "BUNDLED_SUPPLY" | "FRESH_WALLET_SUPPLY" | "CLUSTERED_TOP10" | "LOW_NAKAMOTO" | "CONCENTRATED_SCORE";

/** Thresholds: bundles >= 25% or fresh wallets >= 20% of supply are the sniper/insider patterns Bubblemaps was built to show. */
export const HOLDER_FLAG_RULES = { bundlesPct: 25, freshWalletsPct: 20, top10AdjustedPct: 40, nakamoto: 3, score: 35 } as const;

/** CoinGecko asset_platform id -> Bubblemaps chain id (only chains both cover). */
const CHAIN: Record<string, string> = {
  ethereum: "eth", base: "base", solana: "solana", tron: "tron", "binance-smart-chain": "bsc", sonic: "sonic", "the-open-network": "ton",
  avalanche: "avalanche", "polygon-pos": "polygon", monad: "monad", hyperevm: "hyperevm", "arbitrum-one": "arbitrum",
};
export function bubblemapsChain(assetPlatformId: string | null | undefined): string | null {
  return assetPlatformId ? CHAIN[assetPlatformId] ?? null : null;
}
export function bubblemapsUrl(chain: string, address: string): string {
  return `https://app.bubblemaps.io/${encodeURIComponent(chain)}/token/${encodeURIComponent(address)}`;
}
export function bubblemapsMetricsUrl(chain: string, address: string): string {
  return `https://api.bubblemaps.io/v0/tokens/metrics/${encodeURIComponent(chain)}/${encodeURIComponent(address)}`;
}

const num = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null);
const pct = (v: unknown): number | null => { const n = num(v); return n == null ? null : Math.round(Math.max(0, Math.min(1, n)) * 1000) / 10; };

/** Parse GET /v0/tokens/metrics/{chain}/{address}; null when the body is not a metrics object. */
export function parseHolderMap(raw: unknown, chain: string, address: string): HolderMap | null {
  const r = raw as any;
  if (!r || typeof r !== "object" || !r.supply_stats || !r.scores) return null;
  const s = r.supply_stats, sc = r.scores;
  const out: HolderMap = {
    score: num(sc.bubblemaps_score), giniIndex: num(sc.gini_index), hhi: num(sc.herfindahl_hirschman_index), nakamoto: num(sc.nakamoto_coefficient),
    cexPct: pct(s.cexs), dexPct: pct(s.dexs), contractsPct: pct(s.contracts), freshWalletsPct: pct(s.fresh_wallets),
    top10AdjustedPct: pct(s.top_10_adjusted), bundlesPct: pct(s.bundles), flags: [], chain, address, url: bubblemapsUrl(chain, address),
  };
  const R = HOLDER_FLAG_RULES;
  if (out.bundlesPct != null && out.bundlesPct >= R.bundlesPct) out.flags.push("BUNDLED_SUPPLY");
  if (out.freshWalletsPct != null && out.freshWalletsPct >= R.freshWalletsPct) out.flags.push("FRESH_WALLET_SUPPLY");
  if (out.top10AdjustedPct != null && out.top10AdjustedPct >= R.top10AdjustedPct) out.flags.push("CLUSTERED_TOP10");
  if (out.nakamoto != null && out.nakamoto <= R.nakamoto) out.flags.push("LOW_NAKAMOTO");
  if (out.score != null && out.score < R.score) out.flags.push("CONCENTRATED_SCORE");
  return out;
}
