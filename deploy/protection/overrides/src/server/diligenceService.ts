// Fetches small-cap diligence (CoinGecko coin detail -> GoPlus security, GitHub activity), cached 24h.
// Only called for the few coins that already pass the cheap hygiene screen, spaced to respect free rate limits.
import { evaluateEvmSecurity, evaluateSolanaSecurity, goPlusPath, parseCoinDetail, parseGithubParticipation, type Diligence } from "../strategyV2/diligence.js";
import type { FetchLike } from "../strategyV2/feed.js";
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { bubblemapsChain, bubblemapsMetricsUrl, parseHolderMap, type HolderMap } from "../strategyV2/bubblemaps.js";

const TTL_MS = 24 * 3_600_000;
const FAIL_TTL_MS = 30 * 60_000; // retry failed checks after 30 minutes
const MAX_PER_REFRESH = 20;
/** Bubblemaps holder maps (paid, 25 credits each): at most this many new tokens per refresh keeps a 100k-credit plan under ~30k/month. */
const MAX_HOLDER_MAPS_PER_REFRESH = 8;
let holderMapsThisRefresh = 0;
export const holderMapsConfigured = () => Boolean(process.env.BUBBLEMAPS_API_KEY);

/** Bubblemaps token metrics for one contract; null when the feed is not configured, the chain is not covered, or the call fails. */
async function fetchHolderMap(fetcher: FetchLike, platform: string, contract: string): Promise<HolderMap | null> {
  const key = process.env.BUBBLEMAPS_API_KEY, chain = bubblemapsChain(platform);
  if (!key || !chain || holderMapsThisRefresh >= MAX_HOLDER_MAPS_PER_REFRESH) return null;
  holderMapsThisRefresh++;
  try {
    const res = await fetcher(bubblemapsMetricsUrl(chain, contract), { headers: { Accept: "application/json", "X-ApiKey": key }, signal: AbortSignal.timeout(20_000) });
    if (!res.ok) return null;
    return parseHolderMap(await res.json(), chain, contract);
  } catch { return null; }
}
const cache = new Map<string, { value: Diligence; at: number; ttl: number }>();

// The cache is saved on the data volume so a deploy or restart does not wipe a day of scans: rebuilding it at 20 coins
// per refresh takes over an hour, and until then openings show "awaiting legitimacy scan". Entries keep their own expiry.
export function diligenceCachePath(): string {
  return process.env.ZOBIRIS_DILIGENCE_CACHE_PATH ?? join(dirname(process.env.ZOBIRIS_DB_PATH ?? "/data/zobiris.sqlite"), "zobiris-diligence-cache.json");
}
// Off under the test runner unless a test points the cache at its own file.
const persist = () => process.env.ZOBIRIS_LEDGER !== "0" && (!process.env.VITEST || Boolean(process.env.ZOBIRIS_DILIGENCE_CACHE_PATH));
let loaded = false;
function loadCache(now: number) {
  if (loaded || !persist()) return;
  loaded = true;
  try {
    const path = diligenceCachePath();
    if (!existsSync(path)) return;
    const rows = JSON.parse(readFileSync(path, "utf8"));
    for (const r of Array.isArray(rows) ? rows : []) {
      if (typeof r?.id === "string" && r.value && Number.isFinite(r.at) && Number.isFinite(r.ttl) && now - r.at < r.ttl) cache.set(r.id, { value: r.value, at: r.at, ttl: r.ttl });
    }
  } catch { /* unreadable or torn file: start empty, scans rebuild it */ }
}
function saveCache(now: number) {
  if (!persist()) return;
  try {
    const path = diligenceCachePath(), tmp = `${path}.tmp`;
    const rows = [...cache.entries()].filter(([, e]) => now - e.at < e.ttl).map(([id, e]) => ({ id, ...e }));
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(tmp, JSON.stringify(rows));
    renameSync(tmp, path); // atomic replace: a crash mid-write never leaves a half file
  } catch { /* read-only volume: the in-memory cache still works */ }
}
/** Test hook: forget the in-memory cache and reload from disk on next use. */
export function resetDiligenceCache() { cache.clear(); loaded = false; }
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

async function getJson(fetcher: FetchLike, url: string): Promise<{ status: number; body: unknown }> {
  const res = await fetcher(url, { headers: { Accept: "application/json", "User-Agent": "ZOBIRIS/2 research" }, signal: AbortSignal.timeout(20_000) });
  if (!res.ok) return { status: res.status, body: null };
  try { return { status: res.status, body: await res.json() }; } catch { return { status: res.status, body: null }; } // HTML or truncated body
}

export async function checkCoin(geckoId: string, fetcher: FetchLike, now = Date.now()): Promise<Diligence> {
  const checkedAt = new Date(now).toISOString();
  const detailRes = await getJson(fetcher, `https://api.coingecko.com/api/v3/coins/${encodeURIComponent(geckoId)}?localization=false&tickers=false&market_data=false&community_data=false&developer_data=false&sparkline=false`);
  if (!detailRes.body) return { geckoId, security: { status: "UNCHECKED", vetoes: [], warnings: [`COINGECKO_HTTP_${detailRes.status}`], top10HolderPct: null, chain: null }, commits12w: null, repo: null, checkedAt };
  const detail = parseCoinDetail(detailRes.body);
  let security: Diligence["security"];
  if (!detail.assetPlatformId || !detail.contract) security = { status: "NATIVE", vetoes: [], warnings: [], top10HolderPct: null, chain: null };
  else {
    const path = goPlusPath(detail.assetPlatformId);
    if (!path) security = { status: "UNSUPPORTED_CHAIN", vetoes: [], warnings: [`NO_SECURITY_SCAN_FOR_${detail.assetPlatformId.toUpperCase()}`], top10HolderPct: null, chain: detail.assetPlatformId };
    else {
      await sleep(2_000);
      const sec = await getJson(fetcher, `https://api.gopluslabs.io${path}?contract_addresses=${encodeURIComponent(detail.contract)}`);
      security = !sec.body ? { status: "UNCHECKED", vetoes: [], warnings: [`GOPLUS_HTTP_${sec.status}`], top10HolderPct: null, chain: detail.assetPlatformId }
        : detail.assetPlatformId === "solana" ? evaluateSolanaSecurity(sec.body, detail.contract) : evaluateEvmSecurity(sec.body, detail.contract, detail.assetPlatformId);
    }
  }
  let commits12w: number | null = null;
  const repo = detail.githubRepos[0] ?? null;
  if (repo) {
    const m = /^https:\/\/github\.com\/([^/]+)\/([^/#?]+)/.exec(repo);
    if (m) {
      await sleep(1_000);
      try { const gh = await getJson(fetcher, `https://api.github.com/repos/${m[1]}/${m[2]}/stats/participation`); commits12w = parseGithubParticipation(gh.body); } catch { /* optional */ }
    }
  }
  const holders = detail.assetPlatformId && detail.contract ? await fetchHolderMap(fetcher, detail.assetPlatformId, detail.contract) : null;
  return { geckoId, security, commits12w, repo, checkedAt, profile: detail.profile, contract: detail.contract, holders };
}

/** Diligence for the given CoinGecko ids, using the cache and fetching at most MAX_PER_REFRESH new ones. */
export async function getDiligence(geckoIds: string[], fetcher: FetchLike = fetch as unknown as FetchLike, now = Date.now()): Promise<Map<string, Diligence>> {
  const out = new Map<string, Diligence>();
  let fetched = 0;
  holderMapsThisRefresh = 0;
  loadCache(now);
  for (const id of [...new Set(geckoIds)]) {
    const hit = cache.get(id);
    if (hit && now - hit.at < hit.ttl) { out.set(id, hit.value); continue; }
    if (fetched >= MAX_PER_REFRESH) continue;
    if (fetched > 0) await sleep(6_500); // CoinGecko keyless: ~10 requests per minute
    fetched++;
    try {
      const value = await checkCoin(id, fetcher, now);
      cache.set(id, { value, at: now, ttl: value.security.status === "UNCHECKED" ? FAIL_TTL_MS : TTL_MS });
      out.set(id, value);
    } catch (error) {
      // Remember the failure for FAIL_TTL so a broken response is not re-fetched on every refresh; the screen fails closed.
      const value: Diligence = { geckoId: id, security: { status: "UNCHECKED", vetoes: [], warnings: [`CHECK_FAILED: ${String((error as Error)?.message ?? error).slice(0, 80)}`], top10HolderPct: null, chain: null }, commits12w: null, repo: null, checkedAt: new Date(now).toISOString() };
      cache.set(id, { value, at: now, ttl: FAIL_TTL_MS });
      out.set(id, value);
    }
  }
  if (fetched) saveCache(now);
  return out;
}
