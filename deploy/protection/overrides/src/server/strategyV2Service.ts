// Builds and caches the Strategy v2 report from free, keyless public APIs.
// Refreshes in the background; requests always get the last good report (or a clear warming-up error).
import { fetchCoinGeckoTop500, fetchKrakenDailyCandles, fetchKrakenDailyCloses, fetchKrakenUsdPairs, fetchPaprikaFirstSeen, type Candle, type FetchLike, type MarketCoin } from "../strategyV2/feed.js";
import { buildStrategyReport, smallCapInputFor, tierFor, type FeedStatus, type ReportInputs, type StrategyReport } from "../strategyV2/report.js";
import { screenSmallCap } from "../strategyV2/smallCapScreen.js";
import { getDiligence } from "./diligenceService.js";
import { ledgerStatus, recordReport } from "./ledgerService.js";
import { CMC_WATCHLIST } from "../strategyV2/watchlist.js";
import { SMALL_CAP_RULES } from "../strategyV2/smallCapScreen.js";
import { parseStablecoinSupply } from "../strategyV2/altGate.js";

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
  const inputs: ReportInputs = { now, btcDailyCloses, btcDailyTimes: btcCandles.map((c) => c.time), market, krakenPairs: pairs.value, firstSeen: ages.value, coinDailyCloses, watchlist: CMC_WATCHLIST, feeds, stablecoins: stableNow };
  // Pass 1 decides which small caps reach diligence: those whose only blockers (if any) are the market gates.
  const firstPass = buildStrategyReport(inputs);
  const btc30 = market.find((c) => c.symbol === "BTC")?.change30dPct ?? null;
  const gatesOnly = (r: string) => r.startsWith("BTC_REGIME_") || r.startsWith("ALT_GATE_");
  const forDiligence = market.filter((c) => tierFor(c.rank) === "RANK_101_500")
    .filter((c) => screenSmallCap(smallCapInputFor(c, inputs, btc30), firstPass.regime).rejections.every(gatesOnly))
    .map((c) => c.geckoId);
  let diligence = new Map<string, import("../strategyV2/diligence.js").Diligence>();
  try { diligence = await getDiligence(forDiligence, fetcher, now); } catch { /* scans unavailable: contract tokens fail closed */ }
  const scanned = [...diligence.values()];
  feeds.push({ name: "Contract scans", ok: scanned.every((d) => d.security.status !== "UNCHECKED") && scanned.length >= forDiligence.length,
    detail: `${scanned.length} of ${forDiligence.length} candidates · ${scanned.filter((d) => d.security.status === "FAIL").length} failed`, at: iso(now) });
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
