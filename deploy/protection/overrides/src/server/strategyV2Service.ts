// Builds and caches the Strategy v2 report from free, keyless public APIs.
// Refreshes in the background; requests always get the last good report (or a clear warming-up error).
import { fetchCoinGeckoTop500, fetchKrakenDailyCandles, fetchKrakenDailyCloses, fetchKrakenUsdPairs, fetchPaprikaFirstSeen, type Candle, type FetchLike, type MarketCoin } from "../strategyV2/feed.js";
import { buildStrategyReport, smallCapInputFor, tierFor, type FeedStatus, type ReportInputs, type StrategyReport } from "../strategyV2/report.js";
import { screenSmallCap } from "../strategyV2/smallCapScreen.js";
import { getDiligence, holderMapsConfigured } from "./diligenceService.js";
import { ledgerStatus, recordReport } from "./ledgerService.js";
import { CMC_WATCHLIST } from "../strategyV2/watchlist.js";
import { SMALL_CAP_RULES } from "../strategyV2/smallCapScreen.js";
import { parseStablecoinSupply } from "../strategyV2/altGate.js";
import { fetchCoinGeckoCategoryIds, fetchCoinGeckoRanks501to1000, fetchCoinGeckoTrending, fetchFearGreed, fetchJson } from "../strategyV2/feed.js";
import { parseStablePools, type StablePool } from "../strategyV2/stableYield.js";
import { parseAiWatchlist, type AiWatchlist } from "../strategyV2/aiWatchlist.js";
import { scoreOpenings, shortlistForDiligence } from "../strategyV2/openings.js";
import { recordMarketDay, volumeHistory, marketHistoryStatus } from "./marketHistoryService.js";
import { recentRegimes } from "./ledgerService.js";
import { parseBinanceNotices, parseUpbitNotices, type ExchangeNotice } from "../strategyV2/exchangeNotices.js";

const HOUR_MS = 3_600_000;
/** Where the daily Claude review publishes its watchlist (a data-only branch, so it never triggers a deploy). */
export const AI_WATCHLIST_URL = process.env.ZOBIRIS_AI_WATCHLIST_URL ?? "https://raw.githubusercontent.com/Loki6543/Zobiris/ai-watchlist/ai-watchlist.json";

/** Side feeds for the Valley Forge section: each keeps its last good value and retries after its TTL. */
const side = new Map<string, Cached<unknown>>();
async function sideFeed<T>(key: string, ttlMs: number, now: number, load: () => Promise<T>): Promise<Cached<T> | null> {
  const hit = side.get(key) as Cached<T> | undefined;
  if (hit && now - hit.at < ttlMs) return hit;
  const failedAt = side.get(`${key}:failed`)?.at ?? 0;
  if (now - failedAt < Math.min(ttlMs, 30 * 60_000)) return hit ?? null; // back off after a failure
  try { const value = await load(); const c = { value, at: now }; side.set(key, c); return c; }
  catch { side.set(`${key}:failed`, { value: null, at: now }); return hit ?? null; }
}

const REPORT_TTL_MS = 15 * 60_000;
const SLOW_TTL_MS = 6 * 3_600_000; // AssetPairs, CoinPaprika ages, per-coin daily closes
const KRAKEN_SPACING_MS = 1_100; // Kraken public API: ~1 request/second
const MAX_COIN_HISTORIES = 120;

interface Cached<T> { value: T; at: number }
let report: Cached<StrategyReport> | null = null;
let lastError: string | null = null;
let inflight: Promise<StrategyReport> | null = null;
let pairs: Cached<Map<string, string>> | null = null;
let stables: Cached<{ supplyUsd: number; change30dPct: number | null }> | null = null;
let ages: Cached<Map<string, { firstDataAt: string; rank: number; name: string }>> | null = null;
const histories = new Map<string, Cached<number[]>>();

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
let krakenChain: Promise<void> = Promise.resolve();
/** Every Kraken public request in the server waits its turn here (~1 request/second shared). */
export function krakenSlot(): Promise<void> {
  const turn = krakenChain.then(() => sleep(KRAKEN_SPACING_MS));
  krakenChain = turn.catch(() => {});
  return turn;
}
let latestMarket: Cached<MarketCoin[]> | null = null;
let latestBtc: Cached<Candle[]> | null = null;
export const getLatestMarket = () => latestMarket;
export const getLatestBtcCandles = () => latestBtc;
let pairsJob: Promise<Map<string, string>> | null = null;
let pairsFailedAt = 0;
/** Kraken USD pairs (cached 6h, one shared request at a time). A failed refresh keeps the last list and waits 5 minutes. */
export async function getKrakenPairs(fetcher: FetchLike = fetch as unknown as FetchLike, now = Date.now()): Promise<Map<string, string>> {
  if (fresh(pairs, SLOW_TTL_MS, now) || (pairs && now - pairsFailedAt < 5 * 60_000)) return pairs.value;
  pairsJob ??= (async () => { await krakenSlot(); pairs = { value: await fetchKrakenUsdPairs(fetcher), at: Date.now() }; return pairs.value; })()
    .catch((e) => { pairsFailedAt = Date.now(); if (pairs) return pairs.value; throw e; })
    .finally(() => { pairsJob = null; });
  return pairsJob;
}
const fresh = <T>(c: Cached<T> | null, ttl: number, now: number): c is Cached<T> => Boolean(c && now - c.at < ttl);

/** Coins worth spending a Kraken history request on: rank 101-500, Kraken-listed, liquid. */
export function historyCandidates(market: MarketCoin[], krakenPairs: Map<string, string>): MarketCoin[] {
  return market.filter((c) => {
    if (tierFor(c.rank) !== "RANK_101_500" || !krakenPairs.has(c.symbol)) return false;
    if (c.volume24hUsd == null || c.marketCapUsd == null || c.marketCapUsd <= 0) return false;
    if (c.priceUsd != null && c.priceUsd > 0.9 && c.priceUsd < 1.2 && Math.abs(c.change30dPct ?? 99) < 3) return false; // stablecoins
    const t = c.volume24hUsd / c.marketCapUsd;
    return c.volume24hUsd >= SMALL_CAP_RULES.minVolume24hUsd && t >= SMALL_CAP_RULES.minTurnover && t <= SMALL_CAP_RULES.maxTurnover;
  }).slice(0, MAX_COIN_HISTORIES);
}

export async function refreshStrategyReport(fetcher: FetchLike = fetch as unknown as FetchLike, now = Date.now()): Promise<StrategyReport> {
  const market = await fetchCoinGeckoTop500(fetcher);
  await getKrakenPairs(fetcher, now);
  if (!pairs) throw new Error("Kraken pairs unavailable");
  if (!fresh(ages, SLOW_TTL_MS, now)) {
    try { ages = { value: await fetchPaprikaFirstSeen(fetcher), at: now }; }
    catch { ages = ages ?? { value: new Map(), at: 0 }; } // age unknown => screen fails closed on age
  }
  if (!fresh(stables, SLOW_TTL_MS, now)) {
    try {
      const r = await fetcher("https://stablecoins.llama.fi/stablecoincharts/all", { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(20_000) });
      if (!r.ok) throw new Error(`DefiLlama HTTP ${r.status}`);
      stables = { value: parseStablecoinSupply(await r.json()), at: now };
    } catch { /* unknown stablecoin flow never blocks; keep last value */ }
  }
  const btcPair = pairs.value.get("BTC") ?? "XXBTZUSD";
  await krakenSlot();
  const btcCandles = await fetchKrakenDailyCandles(fetcher, btcPair);
  const btcDailyCloses = btcCandles.map((c) => c.close);
  latestMarket = { value: market, at: now };
  latestBtc = { value: btcCandles, at: now };
  const coinDailyCloses = new Map<string, number[]>();
  const wanted = historyCandidates(market, pairs.value);
  for (const coin of wanted) {
    const cached = histories.get(coin.symbol);
    if (fresh(cached ?? null, SLOW_TTL_MS, now)) { coinDailyCloses.set(coin.symbol, cached!.value); continue; }
    await krakenSlot();
    try {
      const closes = await fetchKrakenDailyCloses(fetcher, pairs.value.get(coin.symbol)!);
      histories.set(coin.symbol, { value: closes, at: now });
      coinDailyCloses.set(coin.symbol, closes);
    } catch { /* missing history => screen rejects PRICE_HISTORY_INCOMPLETE */ }
  }
  const iso = (t: number) => new Date(t).toISOString();
  const lastBtc = btcCandles[btcCandles.length - 1];
  const stableNow = stables && now - stables.at < 48 * 3_600_000 ? stables.value : null; // older data is treated as unknown
  const feeds: FeedStatus[] = [
    { name: "CoinGecko markets", ok: market.length >= 400, detail: `${market.length} coins ranked`, at: iso(now) },
    { name: "Kraken BTC daily", ok: btcCandles.length >= 221, detail: `${btcCandles.length} daily closes`, at: lastBtc ? iso(lastBtc.time * 1000) : null },
    { name: "Kraken pairs", ok: pairs.value.size > 100, detail: `${pairs.value.size} USD markets`, at: iso(pairs.at) },
    { name: "Coin histories", ok: wanted.length === 0 || coinDailyCloses.size / wanted.length >= 0.8, detail: `${coinDailyCloses.size} of ${wanted.length} small caps`, at: iso(now) },
    { name: "DefiLlama stablecoins", ok: Boolean(stableNow), detail: stableNow ? `$${(stableNow.supplyUsd / 1e9).toFixed(0)}B supply` : stables ? "stale over 48h — gate check skipped" : "unavailable — gate check skipped", at: stables ? iso(stables.at) : null },
    { name: "CoinPaprika ages", ok: ages.value.size > 0, detail: ages.value.size ? `${ages.value.size} coins dated` : "unavailable — age check fails closed", at: ages.at ? iso(ages.at) : null },
  ];
  // Valley Forge side feeds (all keyless; each failure leaves the section working with less data).
  const spec = await sideFeed("spec", HOUR_MS, now, () => fetchCoinGeckoRanks501to1000(fetcher));
  const trending = await sideFeed("trending", HOUR_MS, now, () => fetchCoinGeckoTrending(fetcher));
  const aiCat = await sideFeed("aiCategory", 6 * HOUR_MS, now, () => fetchCoinGeckoCategoryIds(fetcher, "artificial-intelligence"));
  const fng = await sideFeed("fng", HOUR_MS, now, async () => (await fetchFearGreed(fetcher)).at(-1)?.value ?? null); // oldest first: the last row is today
  const pools = await sideFeed<StablePool[]>("yields", 6 * HOUR_MS, now, async () => parseStablePools(await fetchJson(fetcher, "https://yields.llama.fi/pools")));
  const aiList = await sideFeed<AiWatchlist>("aiWatchlist", HOUR_MS, now, async () => parseAiWatchlist(await fetchJson(fetcher, AI_WATCHLIST_URL)));
  const BN = (cat: number) => `https://www.binance.com/bapi/composite/v1/public/cms/article/list/query?type=1&catalogId=${cat}&pageNo=1&pageSize=30`;
  const binance = await sideFeed<ExchangeNotice[]>("binanceNotices", 15 * 60_000, now, async () => [48, 161, 49].reduce<Promise<ExchangeNotice[]>>(async (acc, cat) => [...(await acc), ...parseBinanceNotices(await fetchJson(fetcher, BN(cat)))], Promise.resolve([])));
  const upbit = await sideFeed<ExchangeNotice[]>("upbitNotices", 15 * 60_000, now, async () => parseUpbitNotices(await fetchJson(fetcher, "https://api-manager.upbit.com/api/v1/announcements?os=web&page=1&per_page=40&category=all")));
  const allCoins = [...market, ...(spec?.value ?? []).filter((c) => (c.rank ?? 0) > 500)];
  if (process.env.ZOBIRIS_LEDGER !== "0") recordMarketDay(allCoins, now);
  const hist = marketHistoryStatus();
  const today = iso(now).slice(0, 10);
  const forge = {
    fearGreed: fng?.value ?? null, recentRegimes: recentRegimes(30), coreFeedsOk: market.length >= 400 && btcCandles.length >= 221,
    specMarket: spec?.value ?? [], volumeHistory: volumeHistory(today), trending: trending?.value ?? new Map<string, number>(), aiCategory: aiCat?.value ?? new Set<string>(),
    stablePools: pools?.value ?? [], notices: [...(binance?.value ?? []), ...(upbit?.value ?? [])], aiWatchlist: { generatedAt: aiList?.value.generatedAt ?? null, items: aiList?.value.items ?? [] },
  };
  feeds.push(
    { name: "Speculative universe (501-1000)", ok: (spec?.value.length ?? 0) >= 300, detail: spec ? `${spec.value.length} coins` : "unavailable", at: spec ? iso(spec.at) : null },
    { name: "Mindshare (CoinGecko trending)", ok: Boolean(trending?.value.size), detail: trending ? `${trending.value.size} trending coins` : "unavailable", at: trending ? iso(trending.at) : null },
    { name: "Exchange notices (Binance + Upbit)", ok: Boolean(binance && upbit), detail: `Binance ${binance ? binance.value.length + " notices" : "unavailable (region-blocked?)"} · Upbit ${upbit ? upbit.value.length + " notices" : "unavailable"}`, at: binance ? iso(binance.at) : null },
    { name: "Fear & Greed", ok: fng?.value != null, detail: fng?.value != null ? String(fng.value) : "unavailable", at: fng ? iso(fng.at) : null },
    { name: "Stablecoin yields (DefiLlama)", ok: Boolean(pools?.value.length), detail: pools ? `${pools.value.length} pools pass the filters` : "unavailable", at: pools ? iso(pools.at) : null },
    { name: "Volume history", ok: hist.days >= 7, detail: hist.error ? `not writable: ${hist.error}` : `${hist.days} day${hist.days === 1 ? "" : "s"} recorded${hist.days < 7 ? " (cross-section until 7)" : ""}`, at: hist.lastDay ? `${hist.lastDay}T00:00:00.000Z` : null },
    { name: "AI review (daily Claude)", ok: Boolean(aiList && now - Date.parse(aiList.value.generatedAt) < 48 * HOUR_MS), detail: aiList ? `${aiList.value.items.length} coins reviewed` : "not published yet", at: aiList ? aiList.value.generatedAt : null },
  );
  const inputs: ReportInputs = { now, btcDailyCloses, btcDailyTimes: btcCandles.map((c) => c.time), market, krakenPairs: pairs.value, firstSeen: ages.value, coinDailyCloses, watchlist: CMC_WATCHLIST, feeds, stablecoins: stableNow, forge };
  // Pass 1 decides which small caps reach diligence: those whose only blockers (if any) are the market gates.
  const firstPass = buildStrategyReport(inputs);
  const btc30 = market.find((c) => c.symbol === "BTC")?.change30dPct ?? null;
  const gatesOnly = (r: string) => r.startsWith("BTC_REGIME_") || r.startsWith("ALT_GATE_");
  const forDiligence = market.filter((c) => tierFor(c.rank) === "RANK_101_500")
    .filter((c) => screenSmallCap(smallCapInputFor(c, inputs, btc30), firstPass.regime).rejections.every(gatesOnly))
    .map((c) => c.geckoId);
  // Openings worth a legitimacy scan (pre-scored without legitimacy); small-cap screen candidates go first in the queue.
  const preOpenings = scoreOpenings({ now, market: allCoins, btc7dPct: market.find((c) => c.symbol === "BTC")?.change7dPct ?? null, btc30dPct: btc30, btcCloses: btcDailyCloses,
    closesBySymbol: coinDailyCloses, volumeHistory: forge.volumeHistory, trending: forge.trending, aiCategory: forge.aiCategory, diligence: new Map(), firstSeen: ages.value,
    krakenPairs: pairs.value, aiWatchlist: forge.aiWatchlist.items, allowNewBuys: true });
  const openingIds = shortlistForDiligence(preOpenings).filter((id) => !forDiligence.includes(id));
  let diligence = new Map<string, import("../strategyV2/diligence.js").Diligence>();
  try { diligence = await getDiligence([...forDiligence, ...openingIds], fetcher, now); } catch { /* scans unavailable: contract tokens fail closed */ }
  const scanned = forDiligence.map((id) => diligence.get(id)).filter((d): d is NonNullable<typeof d> => Boolean(d));
  const legit = openingIds.filter((id) => diligence.has(id)).length;
  feeds.push({ name: "Legitimacy scans", ok: legit >= openingIds.length, detail: `${legit} of ${openingIds.length} openings scanned (24h cache, 20 per refresh)`, at: iso(now) });
  feeds.push({ name: "Contract scans", ok: scanned.every((d) => d.security.status !== "UNCHECKED") && scanned.length >= forDiligence.length,
    detail: `${scanned.length} of ${forDiligence.length} candidates · ${scanned.filter((d) => d.security.status === "FAIL").length} failed`, at: iso(now) });
  const mapped = [...diligence.values()].filter((d) => d.holders).length;
  // An unconfigured optional feed does not exist as far as the dashboard is concerned: only list it once it can run.
  if (holderMapsConfigured()) feeds.push({ name: "Bubblemaps holder maps", ok: mapped > 0 || diligence.size === 0, detail: `${mapped} of ${diligence.size} scanned coins mapped`, at: iso(now) });
  const value = buildStrategyReport({ ...inputs, diligence });
  report = { value, at: now };
  // The ledger keeps one report per UTC day, so it waits for a report whose key feeds are healthy; after 12:00 UTC it
  // records whatever it has so the day is never skipped.
  const KEY_FEEDS = ["CoinGecko markets", "Kraken BTC daily", "DefiLlama stablecoins", "Contract scans"];
  const degraded = value.feeds.some((f) => KEY_FEEDS.includes(f.name) && !f.ok);
  if (process.env.ZOBIRIS_LEDGER !== "0") {
    if (!degraded || new Date(now).getUTCHours() >= 12) recordReport(value);
    const st = ledgerStatus();
    value.feeds.push({ name: "Decision ledger", ok: !st.error, detail: st.error ? `not writable: ${st.error}` : `${st.summary.days} day${st.summary.days === 1 ? "" : "s"} recorded`, at: st.summary.lastDay ? `${st.summary.lastDay}T00:00:00.000Z` : null });
  }
  lastError = null;
  return value;
}

/** Last good report; triggers a background refresh when stale. */
export async function getStrategyReport(): Promise<StrategyReport> {
  const now = Date.now();
  if (!fresh(report, REPORT_TTL_MS, now) && !inflight) {
    inflight = refreshStrategyReport().catch((e) => { lastError = String(e instanceof Error ? e.message : e); throw e; }).finally(() => { inflight = null; });
    inflight.catch(() => {}); // a failed background refresh must never become an unhandled rejection (Node exits on those)
  }
  if (report) return report.value;
  // Cold start: the first build can take several minutes (Kraken histories, contract scans). Answer within 45s with a
  // clear message instead of holding the request open; the build keeps going and the page retries.
  if (inflight) {
    // The timer resolves (never rejects) so a lost race cannot become an unhandled rejection.
    const first = await Promise.race([inflight, new Promise<null>((r) => setTimeout(() => r(null), 45_000).unref?.())]);
    if (first) return first;
    throw new Error("Strategy report is still being built after a restart; it usually takes 3-5 minutes. Retrying automatically.");
  }
  throw new Error(lastError ?? "Strategy report unavailable");
}

export function startStrategyV2Timer(onClose: (stop: () => void) => void) {
  if (process.env.ZOBIRIS_STRATEGY_V2_FEED === "0") return;
  const tick = () => { if (!inflight) { inflight = refreshStrategyReport().catch((e) => { lastError = String(e); throw e; }).finally(() => { inflight = null; }); inflight.catch(() => {}); } };
  const timer = setInterval(tick, REPORT_TTL_MS);
  timer.unref();
  tick();
  onClose(() => clearInterval(timer));
}
