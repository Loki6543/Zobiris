// Fetches small-cap diligence (CoinGecko coin detail -> GoPlus security, GitHub activity), cached 24h.
// Only called for the few coins that already pass the cheap hygiene screen, spaced to respect free rate limits.
import { evaluateEvmSecurity, evaluateSolanaSecurity, goPlusPath, parseCoinDetail, parseGithubParticipation, type Diligence } from "../strategyV2/diligence.js";
import type { FetchLike } from "../strategyV2/feed.js";

const TTL_MS = 24 * 3_600_000;
const FAIL_TTL_MS = 30 * 60_000; // retry failed checks after 30 minutes
const MAX_PER_REFRESH = 20;
const cache = new Map<string, { value: Diligence; at: number; ttl: number }>();
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
  return { geckoId, security, commits12w, repo, checkedAt, profile: detail.profile };
}

/** Diligence for the given CoinGecko ids, using the cache and fetching at most MAX_PER_REFRESH new ones. */
export async function getDiligence(geckoIds: string[], fetcher: FetchLike = fetch as unknown as FetchLike, now = Date.now()): Promise<Map<string, Diligence>> {
  const out = new Map<string, Diligence>();
  let fetched = 0;
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
  return out;
}
