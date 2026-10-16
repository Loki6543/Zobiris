// Openings: undervalued or newly-turning coins outside the top 100, scored inside their own rank band.
//
// Seven factors, each 0..1, weighted into a 0-100 Opening score:
//   value 18%       depth below the all-time high (best 60-90% down; 97%+ down reads as dead, not cheap)
//   dilution 12%    market cap / fully diluted value (little supply left to unlock)
//   turn 20%        7-day strength vs BTC while the 30-day is still weak (the early turn, not the chase)
//   liquidity 10%   healthy turnover (3-40% of market cap a day; above 150% looks like wash trading)
//   volume 15%      the volume-shock class (accumulation and breakouts up, distribution and collapse down)
//   attention 10%   CoinGecko trending, else watchers per $1M of market cap (mindshare per dollar)
//   legitimacy 15%  the legitimacy score (unscanned coins get a low neutral value)
// The daily Claude review can move the score by at most 10% of its weight and can veto (AVOID), never promote past a
// failed check. Verdicts: CONSIDER needs score >= 60 and verified legitimacy >= 50; contract failures, public
// notices, distribution, collapsing liquidity and chasing (>150% in 30 days) are AVOID.
import type { MarketCoin } from "./feed";
import type { Diligence } from "./diligence";
import { legitimacyScore, type Legitimacy } from "./legitimacy";
import { normName, type Exploit } from "./exploits";
import { volumeShock, median, VOLUME_CLASS_TILT, type VolumeShock } from "./volumeShock";
import { riskProfile, halfRecoveryUpsidePct, type RiskProfile } from "./riskMetrics";
import { firstTranchePct, sleeveForRank, type TierOfRank } from "./valleyForge";
import type { AiWatchItem } from "./aiWatchlist";
import type { ExchangeNotice } from "./exchangeNotices";
import type { HolderMap } from "./bubblemaps";
import { verifiedUnlockShare } from "./unlockOverrides";

export type OpeningTier = Exclude<TierOfRank, "top100">;
export type Verdict = "CONSIDER" | "WATCH" | "AVOID";

export interface OpeningCandidate {
  geckoId: string; symbol: string; name: string; rank: number; tier: OpeningTier;
  priceUsd: number; marketCapUsd: number; volume24hUsd: number;
  change24hPct: number | null; change7dPct: number | null; change30dPct: number | null; athChangePct: number | null;
  score: number;
  factors: { value: number; dilution: number; turn: number; liquidity: number; volume: number; attention: number; legitimacy: number };
  volume: VolumeShock;
  legitimacy: Legitimacy;
  risk: RiskProfile | null;
  upsideHalfAthPct: number | null;
  labels: string[];
  verdict: Verdict;
  reasons: string[];
  firstTranchePct: number;
  krakenListed: boolean;
  ai: AiWatchItem | null;
  /** Latest exchange notice (Binance/Upbit) in the last 30 days. */
  notice?: ExchangeNotice | null;
  /** Bubblemaps holder clusters when the optional feed is configured. */
  holders?: HolderMap | null;
}

export interface OpeningsInput {
  now: number;
  market: MarketCoin[];
  btc7dPct: number | null;
  btc30dPct: number | null;
  btcCloses: number[];
  closesBySymbol: Map<string, number[]>;
  volumeHistory: Map<string, number[]>;
  trending: Map<string, number>; // geckoId -> trending position (0 = top)
  aiCategory: Set<string>;
  diligence: Map<string, Diligence>;
  firstSeen: Map<string, { firstDataAt: string }>;
  krakenPairs: Map<string, string>;
  aiWatchlist: AiWatchItem[];
  allowNewBuys: boolean;
  notices?: Map<string, ExchangeNotice>;
  /** DefiLlama exploits by normalised project name (90 days, >= $1M). */
  exploits?: Map<string, Exploit>;
}

export const OPENING_WEIGHTS = { value: 0.18, dilution: 0.12, turn: 0.2, liquidity: 0.1, volume: 0.15, attention: 0.1, legitimacy: 0.15 } as const;
const MIN_VOLUME: Record<OpeningTier, number> = { rank101_200: 1_000_000, rank201_500: 500_000, speculative: 250_000 };
const MIN_AGE_DAYS: Record<OpeningTier, number> = { rank101_200: 90, rank201_500: 60, speculative: 30 };

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const sigmoid = (x: number) => 1 / (1 + Math.exp(-x));
const DERIVATIVE = /\b(wrapped|staked|bridged|restaked|liquid staking|tokenized|xstock|synthetic|pegged|lp token|vault)\b/i;
const TOKENIZED = /\b(gold|silver|treasury|t-bill|ondo us|xaut|paxg)\b/i;
const isStable = (c: MarketCoin) => c.priceUsd != null && c.priceUsd > 0.9 && c.priceUsd < 1.2 && Math.abs(c.change30dPct ?? 99) < 3 && Math.abs(c.change7dPct ?? 99) < 2;

export function valueFactor(athChangePct: number | null): number {
  if (athChangePct == null || !Number.isFinite(athChangePct)) return 0.4;
  const dd = Math.max(0, -athChangePct);
  if (dd < 30) return (dd / 30) * 0.3;
  if (dd <= 85) return 0.3 + (0.7 * (dd - 30)) / 55;
  if (dd <= 97) return 1 - ((dd - 85) / 12) * 0.7;
  return 0.1;
}
export function liquidityFactor(turnover: number | null): number {
  if (turnover == null || !Number.isFinite(turnover)) return 0;
  if (turnover < 0.005) return 0;
  if (turnover < 0.03) return (turnover - 0.005) / 0.025;
  if (turnover <= 0.4) return 1;
  if (turnover <= 1.5) return 1 - ((turnover - 0.4) / 1.1) * 0.8;
  return 0;
}
export function turnFactor(rel7: number | null, rel30: number | null, change30: number | null): number {
  if (rel7 == null) return 0.4;
  let f = sigmoid(rel7 / 8);
  if (rel30 != null && rel30 >= rel7) f *= 0.7; // already strong for a month: less of an opening
  if (change30 != null && change30 > 100) f *= 0.4; // chasing
  return clamp01(f);
}

/** Percentile (0..1) of each value within its own list; nulls get null. */
function percentiles(values: Array<number | null>): Array<number | null> {
  const v = values.map((x, i) => ({ x, i })).filter((e): e is { x: number; i: number } => e.x != null && Number.isFinite(e.x)).sort((a, b) => a.x - b.x);
  const out: Array<number | null> = values.map(() => null);
  v.forEach((e, k) => { out[e.i] = v.length > 1 ? k / (v.length - 1) : 0.5; });
  return out;
}

export function scoreOpenings(i: OpeningsInput): OpeningCandidate[] {
  const aiBy = new Map<string, AiWatchItem>();
  for (const a of i.aiWatchlist) { if (a.geckoId) aiBy.set(`id:${a.geckoId}`, a); aiBy.set(`sym:${a.symbol}`, a); }
  // Highest-ranked coin owns a ticker (symbol-keyed data like Kraken closes belongs to it).
  const owner = new Map<string, MarketCoin>();
  for (const c of i.market) { const o = owner.get(c.symbol); if (!o || (c.rank ?? 1e9) < (o.rank ?? 1e9)) owner.set(c.symbol, c); }

  type Row = { c: MarketCoin; tier: OpeningTier; turnover: number; ageDays: number | null };
  const rows: Row[] = [];
  for (const c of i.market) {
    const tier = sleeveForRank(c.rank);
    if (!tier || tier === "top100") continue;
    if (c.priceUsd == null || !(c.priceUsd > 0) || c.marketCapUsd == null || !(c.marketCapUsd > 0) || c.volume24hUsd == null) continue;
    if (isStable(c) || DERIVATIVE.test(c.name) || TOKENIZED.test(c.name)) continue;
    if (c.volume24hUsd < MIN_VOLUME[tier]) continue;
    const turnover = c.volume24hUsd / c.marketCapUsd;
    if (turnover > 1.5) continue;
    const first = owner.get(c.symbol) === c ? i.firstSeen.get(c.symbol) : undefined;
    const ageDays = first ? Math.floor((i.now - Date.parse(first.firstDataAt)) / 86_400_000) : null;
    if (ageDays != null && ageDays < MIN_AGE_DAYS[tier]) continue;
    rows.push({ c, tier, turnover, ageDays });
  }

  const out: OpeningCandidate[] = [];
  for (const tier of ["rank101_200", "rank201_500", "speculative"] as OpeningTier[]) {
    const band = rows.filter((r) => r.tier === tier);
    if (!band.length) continue;
    const bandTurnover = median(band.map((r) => r.turnover));
    const attentionPct = percentiles(band.map((r) => { const w = i.diligence.get(r.c.geckoId)?.profile?.watchers; return w != null ? w / (r.c.marketCapUsd! / 1e6) : null; }));
    band.forEach((r, k) => {
      const c = r.c;
      const own = owner.get(c.symbol) === c;
      const krakenListed = own && i.krakenPairs.has(c.symbol);
      const dil = i.diligence.get(c.geckoId);
      const legit = legitimacyScore({ diligence: dil, ageDays: r.ageDays, krakenListed, volume24hUsd: c.volume24hUsd, now: i.now, exploit: own ? i.exploits?.get(normName(c.name)) ?? null : null });
      const vol = volumeShock(c.volume24hUsd, i.volumeHistory.get(c.geckoId) ?? [], r.turnover, bandTurnover, c.change24hPct, c.change7dPct);
      const rel7 = c.change7dPct != null && i.btc7dPct != null ? c.change7dPct - i.btc7dPct : null;
      const rel30 = c.change30dPct != null && i.btc30dPct != null ? c.change30dPct - i.btc30dPct : null;
      const trendPos = i.trending.get(c.geckoId);
      const volumeF = vol.class === "CAPITULATION_FLUSH" && legit.score < 50 ? 0.2 : clamp01((VOLUME_CLASS_TILT[vol.class] + 1) / 2);
      const factors = {
        value: valueFactor(c.athChangePct),
        dilution: c.fdvUsd && c.fdvUsd > 0 ? clamp01(c.marketCapUsd! / c.fdvUsd) : 0.5,
        turn: turnFactor(rel7, rel30, c.change30dPct),
        liquidity: liquidityFactor(r.turnover),
        volume: volumeF,
        attention: trendPos != null ? clamp01(1 - trendPos / 30) : attentionPct[k] ?? 0.4,
        legitimacy: legit.grade === "UNVERIFIED" ? 0.35 : legit.score / 100,
      };
      let score = (Object.keys(OPENING_WEIGHTS) as Array<keyof typeof OPENING_WEIGHTS>).reduce((s, f) => s + OPENING_WEIGHTS[f] * factors[f], 0) * 100;
      const ai = aiBy.get(`id:${c.geckoId}`) ?? (own ? aiBy.get(`sym:${c.symbol}`) : undefined) ?? null;
      if (ai) score = score * 0.9 + ai.aiScore * 0.1;
      score = Math.round(score * 10) / 10;

      const labels: string[] = [];
      const isAi = i.aiCategory.has(c.geckoId) || Boolean(dil?.profile?.categories.some((x) => /artificial intelligence|\bAI\b|ai agents/i.test(x)));
      if (isAi) labels.push("AI");
      if (trendPos != null) labels.push("TRENDING");
      if (factors.value >= 0.6 && factors.dilution >= 0.6 && factors.attention >= 0.6) labels.push("UNDERVALUED");
      if (rel7 != null && rel7 > 3 && rel30 != null && rel30 < 0) labels.push("EARLY_TURN");
      if (vol.class !== "NORMAL") labels.push(vol.class);

      const reasons: string[] = [];
      if (dil?.security.status === "FAIL") reasons.push(...dil.security.vetoes.map((v) => `CONTRACT_${v}`));
      if (legit.redFlags.includes("PUBLIC_NOTICE")) reasons.push("PUBLIC_NOTICE");
      if (vol.class === "DISTRIBUTION" || vol.class === "VOLUME_COLLAPSE") reasons.push(vol.class);
      if (c.change30dPct != null && c.change30dPct > 150) reasons.push("CHASING_150PCT_30D");
      if (ai?.verdict === "AVOID") reasons.push("AI_REVIEW_AVOID");
      // Research-backed hard vetoes: exchange risk notices and large verified unlocks ahead.
      const notice = own ? i.notices?.get(c.symbol) ?? null : null;
      if (notice && notice.kind !== "LISTING") reasons.push(`${notice.exchange.toUpperCase()}_${notice.kind}`);
      const unlock = own ? verifiedUnlockShare(c.symbol, i.now) : null;
      if (unlock && unlock.share60d > 0.05) reasons.push("LARGE_UNLOCK_60D");
      let verdict: Verdict = reasons.length ? "AVOID" : "WATCH";
      if (verdict === "WATCH" && score >= 60 && legit.grade !== "UNVERIFIED" && legit.score >= 50) verdict = i.allowNewBuys ? "CONSIDER" : "WATCH";
      if (verdict === "WATCH" && legit.grade === "UNVERIFIED") reasons.push("AWAITING_LEGITIMACY_SCAN");
      // Fresh listings pop then reverse from day 2: never a CONSIDER inside the first 3 days.
      if (notice?.kind === "LISTING" && i.now - Date.parse(notice.at) < 3 * 86_400_000) { labels.push("FRESH_LISTING"); if (verdict === "CONSIDER") verdict = "WATCH"; reasons.push("FRESH_LISTING_FADE"); }


      const closes = own ? i.closesBySymbol.get(c.symbol) ?? null : null;
      out.push({
        geckoId: c.geckoId, symbol: c.symbol, name: c.name, rank: c.rank!, tier, priceUsd: c.priceUsd!, marketCapUsd: c.marketCapUsd!, volume24hUsd: c.volume24hUsd!,
        change24hPct: c.change24hPct, change7dPct: c.change7dPct, change30dPct: c.change30dPct, athChangePct: c.athChangePct,
        score, factors, volume: vol, legitimacy: legit, risk: riskProfile(closes, i.btcCloses), upsideHalfAthPct: halfRecoveryUpsidePct(c.athChangePct),
        labels, verdict, reasons, firstTranchePct: firstTranchePct(tier, c.symbol), krakenListed, ai, notice, holders: dil?.holders ?? null,
      });
    });
  }
  return out.sort((a, b) => b.score - a.score);
}

/** The few per tier worth a legitimacy scan this refresh (cheap pre-score: everything except legitimacy). */
export function shortlistForDiligence(all: OpeningCandidate[], perTier = 12): string[] {
  const ids: string[] = [];
  for (const tier of ["rank101_200", "rank201_500", "speculative"] as OpeningTier[]) {
    ids.push(...all.filter((c) => c.tier === tier && c.verdict !== "AVOID").slice(0, perTier).map((c) => c.geckoId));
  }
  return ids;
}
