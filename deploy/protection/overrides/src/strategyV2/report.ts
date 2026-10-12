// Strategy v2 report: one pure function that turns free market data into decisions for the watchlist.
import { computeBtcRegime, rotationBreadth, type BtcRegime } from "./btcRegime";
import { evaluateRotation, type RotationResult } from "./rotation";
import { screenSmallCap, type SmallCapScreenResult } from "./smallCapScreen";
import { planBarbell, type BarbellPlan, type SpeculativePosition } from "./barbell";
import type { MarketCoin } from "./feed";
import type { WatchlistEntry } from "./watchlist";

export type Tier = "TOP_100" | "RANK_101_500" | "OUTSIDE_STRATEGY";

export interface WatchlistDecision {
  symbol: string;
  name: string;
  rank: number | null;
  tier: Tier;
  priceUsd: number | null;
  change7dPct: number | null;
  change30dPct: number | null;
  athChangePct: number | null;
  krakenListed: boolean;
  /** One plain-English label for the table. */
  signal: string;
  rotation: RotationResult | null;
  smallCap: SmallCapScreenResult | null;
  matchNote: string | null;
}

export interface StrategyReport {
  asOf: string;
  regime: BtcRegime;
  breadth: ReturnType<typeof rotationBreadth>;
  barbell: BarbellPlan | null;
  watchlist: WatchlistDecision[];
  /** Best-ranked eligible rank 101-500 coins from the whole market, not just the watchlist. */
  marketSmallCapCandidates: Array<{ symbol: string; name: string; rank: number | null; convexityScore: number; notes: string[] }>;
  sources: string[];
}

export interface ReportInputs {
  now: number;
  btcDailyCloses: number[];
  market: MarketCoin[];
  krakenPairs: Map<string, string>;
  firstSeen: Map<string, { firstDataAt: string; rank: number; name: string }>;
  /** symbol -> completed daily closes (only fetched for coins that pass the cheap filters). */
  coinDailyCloses: Map<string, number[]>;
  watchlist: WatchlistEntry[];
  portfolioUsd?: number | null;
  speculativePositions?: SpeculativePosition[];
}

const sma = (xs: number[], n: number) => (xs.length >= n ? xs.slice(-n).reduce((a, b) => a + b, 0) / n : null);

export function tierFor(rank: number | null): Tier {
  if (rank == null) return "OUTSIDE_STRATEGY";
  return rank <= 100 ? "TOP_100" : rank <= 500 ? "RANK_101_500" : "OUTSIDE_STRATEGY";
}

/** Match a watchlist entry to a CoinGecko coin: exact symbol, prefer same name, then nearest rank. */
export function matchCoin(entry: WatchlistEntry, market: MarketCoin[]): { coin: MarketCoin | null; note: string | null } {
  const sym = entry.symbol.toUpperCase();
  const candidates = market.filter((c) => c.symbol === sym);
  if (!candidates.length) {
    const byName = market.find((c) => c.name.toLowerCase() === entry.name.toLowerCase());
    return byName ? { coin: byName, note: "MATCHED_BY_NAME" } : { coin: null, note: "NOT_IN_TOP_500_FEED" };
  }
  const sameName = (c: MarketCoin) => c.name.toLowerCase() === entry.name.toLowerCase();
  const rankGap = (c: MarketCoin) => Math.abs((c.rank ?? 1e9) - entry.cmcRankAtImport);
  // A ticker shared by an unrelated coin (different name, far-off rank) is not a match.
  if (candidates.length === 1) return sameName(candidates[0]!) || rankGap(candidates[0]!) <= 150 ? { coin: candidates[0]!, note: null } : { coin: null, note: "SYMBOL_COLLISION_DIFFERENT_COIN" };
  const named = candidates.find((c) => c.name.toLowerCase() === entry.name.toLowerCase());
  if (named) return { coin: named, note: null };
  const nearest = [...candidates].sort((a, b) => Math.abs((a.rank ?? 1e9) - entry.cmcRankAtImport) - Math.abs((b.rank ?? 1e9) - entry.cmcRankAtImport))[0]!;
  return { coin: nearest, note: "AMBIGUOUS_SYMBOL_MATCHED_BY_RANK" };
}

export function smallCapInputFor(c: MarketCoin, inputs: ReportInputs, btc30: number | null) {
  const closes = inputs.coinDailyCloses.get(c.symbol) ?? null;
  const s50 = closes ? sma(closes, 50) : null;
  const first = inputs.firstSeen.get(c.symbol);
  const ageDays = first ? Math.floor((inputs.now - Date.parse(first.firstDataAt)) / 86_400_000) : null;
  const supplyCap = Math.max(c.totalSupply ?? 0, c.maxSupply ?? 0);
  // Unlock proxy uses supply already minted (total): unmined emission (e.g. DASH) is not a vesting unlock.
  const minted = c.totalSupply != null && c.totalSupply > 0 ? c.totalSupply : supplyCap;
  return {
    symbol: c.symbol, cmcRank: c.rank, marketCapUsd: c.marketCapUsd, fullyDilutedValueUsd: c.fdvUsd ?? (supplyCap > 0 && c.priceUsd != null ? c.priceUsd * supplyCap : null),
    volume24hUsd: c.volume24hUsd, ageDays: ageDays != null && Number.isFinite(ageDays) ? ageDays : null,
    krakenListed: inputs.krakenPairs.has(c.symbol), change30dPct: c.change30dPct, change90dPct: c.change200dPct,
    btcChange30dPct: btc30, drawdownFromAthPct: c.athChangePct,
    priceAboveSma50: closes && s50 != null ? closes[closes.length - 1]! > s50 : null,
    unlockShareNext60d: null,
    unlockedSupplyShare: c.circulatingSupply != null && minted > 0 ? Math.min(1, c.circulatingSupply / minted) : null,
    priceUsd: c.priceUsd, change7dPct: c.change7dPct,
  };
}

const ROTATION_LABEL: Record<string, string> = {
  QUALIFIED: "Buy zone — pullback limit", NEAR_ROTATION: "Watch — recovery forming", TOO_EARLY: "Wait — still lagging",
  EXTENDED: "Wait — don't chase", NOT_LAGGING: "Hold / no entry edge", STRUCTURALLY_WEAK: "Avoid — value trap risk",
  REGIME_BLOCKED: "Wait — BTC regime", DATA_INSUFFICIENT: "Data missing",
};

export function buildStrategyReport(inputs: ReportInputs): StrategyReport {
  const regime = computeBtcRegime(inputs.btcDailyCloses);
  const btc = inputs.market.find((c) => c.geckoId === "bitcoin") ?? inputs.market.find((c) => c.symbol === "BTC") ?? null;
  const top100 = inputs.market.filter((c) => c.rank != null && c.rank <= 100);
  // 200d is the closest free horizon to the 90d breadth rule; label is kept honest in the UI.
  const breadth = rotationBreadth(top100.map((c) => ({ symbol: c.symbol, change90dPct: c.change200dPct })), btc?.change200dPct ?? null);

  const watchlist = inputs.watchlist.map((entry): WatchlistDecision => {
    const { coin, note } = matchCoin(entry, inputs.market);
    const rank = coin?.rank ?? null;
    const tier = coin ? tierFor(rank) : tierFor(entry.cmcRankAtImport);
    const base = {
      symbol: entry.symbol, name: entry.name, rank: rank ?? entry.cmcRankAtImport, tier, priceUsd: coin?.priceUsd ?? null,
      change7dPct: coin?.change7dPct ?? null, change30dPct: coin?.change30dPct ?? null, athChangePct: coin?.athChangePct ?? null,
      krakenListed: inputs.krakenPairs.has(entry.symbol.toUpperCase()), matchNote: note,
    };
    if (!coin && tier !== "OUTSIDE_STRATEGY") return { ...base, signal: "No free data (outside CoinGecko top 500)", rotation: null, smallCap: null };
    if (!coin || tier === "OUTSIDE_STRATEGY") return { ...base, signal: "Outside strategy (rank > 500)", rotation: null, smallCap: null };
    if (entry.symbol === "BTC") return { ...base, signal: `Benchmark · regime ${regime.state.replace("_", " ")}`, rotation: null, smallCap: null };
    if (tier === "TOP_100") {
      const rotation = evaluateRotation({
        symbol: coin.symbol, rank, priceUsd: coin.priceUsd, change7dPct: coin.change7dPct, change30dPct: coin.change30dPct, change200dPct: coin.change200dPct,
        btcChange7dPct: btc?.change7dPct ?? null, btcChange30dPct: btc?.change30dPct ?? null, btcChange200dPct: btc?.change200dPct ?? null,
      }, regime);
      return { ...base, signal: ROTATION_LABEL[rotation.status] ?? rotation.status, rotation, smallCap: null };
    }
    const smallCap = screenSmallCap(smallCapInputFor(coin, inputs, btc?.change30dPct ?? null), regime);
    const signal = smallCap.eligible ? `Small bet candidate · score ${smallCap.convexityScore}` : `Filtered: ${smallCap.rejections[0]?.toLowerCase().replaceAll("_", " ")}`;
    return { ...base, signal, rotation: null, smallCap };
  });

  const marketSmallCapCandidates = inputs.market
    .filter((c) => tierFor(c.rank) === "RANK_101_500")
    .map((c) => ({ c, r: screenSmallCap(smallCapInputFor(c, inputs, btc?.change30dPct ?? null), regime) }))
    .filter(({ r }) => r.eligible)
    .sort((a, b) => b.r.convexityScore - a.r.convexityScore)
    .slice(0, 15)
    .map(({ c, r }) => ({ symbol: c.symbol, name: c.name, rank: c.rank, convexityScore: r.convexityScore, notes: r.notes }));

  const barbell = inputs.portfolioUsd != null && inputs.portfolioUsd > 0
    ? planBarbell(inputs.portfolioUsd, inputs.speculativePositions ?? [], regime.exposureMultiplier)
    : null;

  return {
    asOf: new Date(inputs.now).toISOString(), regime, breadth, barbell, watchlist, marketSmallCapCandidates,
    sources: ["CoinGecko /coins/markets (keyless)", "CoinPaprika /v1/tickers (keyless)", "Kraken public AssetPairs + daily OHLC"],
  };
}
