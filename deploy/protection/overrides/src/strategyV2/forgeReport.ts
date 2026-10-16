// Valley Forge section of the strategy report: posture, elastic target mix, openings per rank band, volume shocks,
// AI speculative coins, stablecoin yield and the AI watchlist status. Pure: every input is passed in.
import type { BtcRegime } from "./btcRegime";
import type { AltGate } from "./altGate";
import type { MarketCoin } from "./feed";
import type { Diligence } from "./diligence";
import { detectPosture, planAllocation, type AllocationPlan } from "./valleyForge";
import { scoreOpenings, type OpeningCandidate } from "./openings";
import type { StablePool } from "./stableYield";
import type { AiWatchItem } from "./aiWatchlist";
import { noticesBySymbol, type ExchangeNotice } from "./exchangeNotices";
import { exploitsByName, type Exploit } from "./exploits";
import { matchGovernance, type GovernanceVote } from "./marketContext";

export interface ForgeInputs {
  fearGreed: number | null;
  recentRegimes: string[];
  coreFeedsOk: boolean;
  /** Ranks 501-1000 (the top 500 comes from the main market list). */
  specMarket: MarketCoin[];
  volumeHistory: Map<string, number[]>;
  trending: Map<string, number>;
  aiCategory: Set<string>;
  stablePools: StablePool[];
  aiWatchlist: { generatedAt: string | null; items: AiWatchItem[] };
  notices?: ExchangeNotice[];
  exploits?: Exploit[];
  /** Raw Snapshot active-proposals response (matched to the market list here). */
  governanceRaw?: unknown;
}

export interface ForgeReport {
  allocation: AllocationPlan;
  openings: OpeningCandidate[];
  volumeShocks: Array<Pick<OpeningCandidate, "symbol" | "name" | "rank" | "tier" | "change24hPct" | "change7dPct" | "volume24hUsd" | "verdict"> & { class: string; ratio: number | null; source: string }>;
  aiSpeculative: OpeningCandidate[];
  stableYield: StablePool[];
  aiWatchlist: { generatedAt: string | null; ageHours: number | null; stale: boolean; items: AiWatchItem[] };
  universe: { scored: number; byTier: Record<string, number>; historyDays: number };
  /** Binance/Upbit delistings, Monitoring Tags, caution designations and listings (30 days) for coins in the market list. */
  exchangeAlerts: Array<{ symbol: string; geckoId: string; rank: number | null; priceUsd: number | null; kind: string; exchange: string; title: string; at: string }>;
  /** Active Snapshot governance votes for coins in the market list (information only). */
  governance: GovernanceVote[];
}

export function buildForge(args: {
  now: number; regime: BtcRegime; altGate: AltGate; market: MarketCoin[]; btcCloses: number[]; closesBySymbol: Map<string, number[]>;
  diligence: Map<string, Diligence>; firstSeen: Map<string, { firstDataAt: string }>; krakenPairs: Map<string, string>; forge: ForgeInputs;
}): ForgeReport {
  const f = args.forge;
  const all = [...args.market, ...f.specMarket.filter((c) => (c.rank ?? 0) > 500)];
  const stablePrices = ["USDT", "USDC"].map((s) => ({ symbol: s, priceUsd: args.market.find((c) => c.symbol === s && (c.rank ?? 99) <= 20)?.priceUsd ?? null }));
  const posture = detectPosture({ regime: args.regime, altGate: args.altGate, fearGreed: f.fearGreed, stablePrices, recentRegimes: f.recentRegimes, coreFeedsOk: f.coreFeedsOk });
  const btc = args.market.find((c) => c.geckoId === "bitcoin") ?? args.market.find((c) => c.symbol === "BTC");
  const scored = scoreOpenings({
    now: args.now, market: all, btc7dPct: btc?.change7dPct ?? null, btc30dPct: btc?.change30dPct ?? null, btcCloses: args.btcCloses,
    closesBySymbol: args.closesBySymbol, volumeHistory: f.volumeHistory, trending: f.trending, aiCategory: f.aiCategory, diligence: args.diligence,
    firstSeen: args.firstSeen, krakenPairs: args.krakenPairs, aiWatchlist: f.aiWatchlist.items, allowNewBuys: posture.allowNewBuys,
    notices: noticesBySymbol(f.notices ?? [], args.now), exploits: exploitsByName(f.exploits ?? []),
  });
  const top = (tier: string, n: number) => scored.filter((c) => c.tier === tier).slice(0, n);
  const openings = [...top("rank101_200", 15), ...top("rank201_500", 15), ...top("speculative", 15)];
  const volumeShocks = scored.filter((c) => c.volume.class !== "NORMAL" && c.volume.ratio != null)
    .sort((a, b) => Math.abs(Math.log(b.volume.ratio!)) - Math.abs(Math.log(a.volume.ratio!))).slice(0, 24)
    .map((c) => ({ symbol: c.symbol, name: c.name, rank: c.rank, tier: c.tier, change24hPct: c.change24hPct, change7dPct: c.change7dPct, volume24hUsd: c.volume24hUsd, verdict: c.verdict, class: c.volume.class, ratio: c.volume.ratio, source: c.volume.source }));
  const aiSpeculative = scored.filter((c) => c.labels.includes("AI")).slice(0, 15);
  const gen = f.aiWatchlist.generatedAt;
  const ageHours = gen ? Math.max(0, (args.now - Date.parse(gen)) / 3_600_000) : null;
  const byTier: Record<string, number> = {};
  for (const c of scored) byTier[c.tier] = (byTier[c.tier] ?? 0) + 1;
  const historyDays = Math.max(0, ...[...f.volumeHistory.values()].slice(0, 50).map((v) => v.length));
  return {
    allocation: planAllocation(posture, null), openings, volumeShocks, aiSpeculative, stableYield: f.stablePools,
    aiWatchlist: { generatedAt: gen, ageHours: ageHours == null ? null : Math.round(ageHours * 10) / 10, stale: ageHours == null || ageHours > 48, items: f.aiWatchlist.items },
    universe: { scored: scored.length, byTier, historyDays },
    governance: (() => { try { return f.governanceRaw ? matchGovernance(f.governanceRaw, all, args.now).slice(0, 20) : []; } catch { return []; } })(),
    exchangeAlerts: (() => {
      const owner = new Map<string, MarketCoin>();
      for (const c of all) { const o = owner.get(c.symbol); if (!o || (c.rank ?? 1e9) < (o.rank ?? 1e9)) owner.set(c.symbol, c); }
      return [...noticesBySymbol(f.notices ?? [], args.now).entries()].flatMap(([s, n]) => { const c = owner.get(s); return c ? [{ symbol: s, geckoId: c.geckoId, rank: c.rank, priceUsd: c.priceUsd, kind: n.kind, exchange: n.exchange, title: n.title, at: n.at }] : []; })
        .sort((a, b) => b.at.localeCompare(a.at)).slice(0, 30);
    })(),
  };
}
