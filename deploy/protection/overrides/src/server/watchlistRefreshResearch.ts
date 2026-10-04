import { createHash } from "node:crypto";
import type { EvidenceRepo } from "./researchEvidence.js";
import { evaluateReassessment, type Review } from "./reassessment.js";
import type {
  ResearchAdapter,
  ResearchAsset,
  ResearchCollectionStatus,
} from "./researchCollection.js";

export type RefreshResearchCoverage =
  | "COMPLETE"
  | "COMPLETE_WITH_GAPS"
  | "EVIDENCE_INCOMPLETE";

export type RefreshResearchAsset = {
  symbol: string;
  assetId: string;
  evaluatedAt: string;
  coverage: RefreshResearchCoverage;
  reviewStatus: Review["status"];
  newsStatus: "AVAILABLE" | "STALE" | "UNAVAILABLE";
  socialStatus: "AVAILABLE" | "STALE" | "UNAVAILABLE";
  providersAttempted: string[];
  providersNotConfigured: string[];
  providerFailures: string[];
  evidenceCount: number;
  currentEvidenceCount: number;
  falsifiers: string[];
  authority: "RESEARCH_ONLY_DEMOTE_OR_FLAG";
  canPromote: false;
  mayAffectSizing: false;
  mayWriteExchange: false;
};

export type RefreshResearchSweep = {
  version: "WATCHLIST_REFRESH_RESEARCH_V1";
  evaluatedAt: string;
  requestedAssets: number;
  assessedAssets: number;
  providerStatuses: ResearchCollectionStatus[];
  assets: RefreshResearchAsset[];
  trial: { count: number; previousHash: string | null; chainHead: string };
  authority: "RESEARCH_ONLY_DEMOTE_OR_FLAG";
  canPromote: false;
  mayAffectSizing: false;
  mayWriteExchange: false;
};

type CoverageState = {
  status: "AVAILABLE" | "UNAVAILABLE" | "NOT_CONFIGURED";
  attemptedAt: string;
  lastSuccessAt: string | null;
  records: number;
  error?: string;
};

const RSS_FEEDS = [
  { id: "rss-cointelegraph", url: "https://cointelegraph.com/rss" },
  { id: "rss-decrypt", url: "https://decrypt.co/feed" },
  { id: "rss-bitcoinmagazine", url: "https://bitcoinmagazine.com/feed" },
] as const;
const RSS_HOSTS = new Set(["cointelegraph.com", "decrypt.co", "bitcoinmagazine.com"]);

function safeRssUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password && !url.port && RSS_HOSTS.has(url.hostname.toLowerCase());
  } catch {
    return false;
  }
}

async function fetchText(url: string, signal: AbortSignal, fetcher: typeof fetch): Promise<string> {
  if (!safeRssUrl(url)) throw new Error("PUBLIC_RSS_HOST_REJECTED");
  const response = await fetcher(url, {
    redirect: "error",
    signal,
    headers: { Accept: "application/rss+xml, application/xml, text/xml" },
  });
  if (!response.ok) throw new Error("PUBLIC_RSS_UNAVAILABLE");
  const declared = Number(response.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > 512 * 1024) throw new Error("PUBLIC_RSS_TOO_LARGE");
  const text = await response.text();
  if (Buffer.byteLength(text) > 512 * 1024) throw new Error("PUBLIC_RSS_TOO_LARGE");
  return text;
}

function decodeEntities(value: string): string {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_m, digits) => String.fromCharCode(Number(digits)))
    .replace(/&amp;/g, "&");
}

type FeedItem = { title: string; link: string; publishedAt: string | null; description: string };

export function parseRefreshRss(xml: string, limit = 100): FeedItem[] {
  const blocks = xml.match(/<(item|entry)\b[\s\S]*?<\/\1>/gi) ?? [];
  const tag = (block: string, name: string): string => {
    const match = block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)<\\/${name}>`, "i"));
    if (!match) return "";
    return decodeEntities(match[1]!.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").replace(/<[^>]+>/g, "").trim());
  };
  const rows: FeedItem[] = [];
  for (const block of blocks) {
    const title = tag(block, "title");
    if (!title) continue;
    const link = tag(block, "link") || block.match(/<link[^>]*href="([^"]+)"/i)?.[1] || "";
    const rawDate = tag(block, "pubDate") || tag(block, "published") || tag(block, "updated");
    const ms = Date.parse(rawDate);
    rows.push({
      title,
      link,
      publishedAt: Number.isFinite(ms) ? new Date(ms).toISOString() : null,
      description: tag(block, "description") || tag(block, "summary"),
    });
    if (rows.length >= limit) break;
  }
  return rows;
}

function wholeWord(text: string, value: string): boolean {
  const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`\\b${escaped}\\b`, "i").test(text);
}

function mentions(asset: ResearchAsset, text: string): boolean {
  const symbol = asset.symbol.toUpperCase();
  const name = asset.name.trim();
  if (name.length >= 3 && wholeWord(text, name)) return true;
  if (new RegExp(`\\$${symbol}\\b`, "i").test(text)) return true;
  if (symbol.length >= 4 && wholeWord(text, symbol)) return true;
  return ["BTC", "ETH", "SOL", "XRP", "ADA"].includes(symbol) && wholeWord(text, symbol);
}

export function publicRssResearchAdapter(fetcher: typeof fetch = fetch): ResearchAdapter {
  let cache: Promise<Array<{ feed: (typeof RSS_FEEDS)[number]; items: FeedItem[] }>> | null = null;
  return {
    id: "public-rss-news",
    configured: () => true,
    fetch: async (assets, signal) => {
      cache ??= Promise.allSettled(
        RSS_FEEDS.map(async (feed) => ({ feed, items: parseRefreshRss(await fetchText(feed.url, signal, fetcher)) })),
      ).then((results) => {
        const good = results.flatMap((result) => result.status === "fulfilled" ? [result.value] : []);
        if (!good.length) throw new Error("PUBLIC_RSS_UNAVAILABLE");
        return good;
      });
      const feeds = await cache;
      const retrievedAt = new Date().toISOString();
      const rows: unknown[] = [];
      for (const asset of assets) {
        for (const { feed, items } of feeds) {
          for (const item of items) {
            if (!mentions(asset, `${item.title} ${item.description}`)) continue;
            if (!/^https:\/\//i.test(item.link)) continue;
            rows.push({
              canonicalAssetId: asset.id,
              symbol: asset.symbol,
              provider: feed.id,
              sourceUrl: item.link,
              publishedAt: item.publishedAt,
              retrievedAt,
              expiresAt: new Date(Date.parse(retrievedAt) + 24 * 3600000).toISOString(),
              kind: "NEWS",
              lineageId: createHash("sha256").update(`${feed.id}|${item.link || item.title}`).digest("hex"),
              summary: item.title.slice(0, 1000),
              claim: item.title.slice(0, 2000),
              relevance: "Credential-free public RSS match; token impact remains unverified.",
              verification: "UNVERIFIED",
              verificationSourceUrl: null,
              polarity: "MIXED",
              material: false,
              dataMode: "LIVE",
            });
          }
        }
      }
      return rows;
    },
  };
}

function chunk<T>(values: T[], size: number): T[][] {
  const output: T[][] = [];
  for (let index = 0; index < values.length; index += size) output.push(values.slice(index, index + size));
  return output;
}

function evidenceStatus(evidence: any[], now: number, kind: "news" | "social") {
  const relevant = evidence.filter((item) => kind === "social" ? item.kind === "SOCIAL_ACTIVITY" : item.kind !== "SOCIAL_ACTIVITY");
  if (relevant.some((item) => Date.parse(item.retrievedAt) <= now && Date.parse(item.expiresAt) > now)) return "AVAILABLE" as const;
  return relevant.length ? "STALE" as const : "UNAVAILABLE" as const;
}

function falsifiers(review: Review): string[] {
  return review.status === "THESIS_RISK"
    ? ["Adverse evidence is retracted, superseded, or shown not to apply to the token.", review.nextReviewCondition]
    : ["A current material negative or contradictory finding appears from an independent source.", review.nextReviewCondition];
}

function advanceTrial(repo: EvidenceRepo, now: number, assets: ResearchAsset[], providers: ResearchCollectionStatus[]) {
  const prior = repo.getState("refresh-research-ledger") as { count?: number; head?: string } | null;
  const previousHash = typeof prior?.head === "string" && prior.head ? prior.head : null;
  const count = Math.max(0, Number(prior?.count ?? 0) || 0) + 1;
  const payload = JSON.stringify({ previousHash, count, evaluatedAt: new Date(now).toISOString(), assets: assets.map((a) => a.id).sort(), providers: providers.map((p) => ({ id: p.provider, status: p.status, covered: [...p.coveredAssets].sort(), records: p.records })) });
  const chainHead = createHash("sha256").update(payload).digest("hex");
  repo.setState("refresh-research-ledger", { count, head: chainHead, previousHash, evaluatedAt: new Date(now).toISOString() });
  return { count, previousHash, chainHead };
}

export async function collectFullWatchlistResearch(
  repo: EvidenceRepo,
  adapters: ResearchAdapter[],
  assets: ResearchAsset[],
  now = Date.now(),
): Promise<RefreshResearchSweep> {
  const unique = [...new Map(assets.map((asset) => [asset.id, { ...asset, symbol: asset.symbol.toUpperCase() }])).values()];
  const statuses: ResearchCollectionStatus[] = [];
  for (const adapter of adapters) {
    const old = repo.getState(`provider:${adapter.id}`) as ResearchCollectionStatus | null;
    const status: ResearchCollectionStatus = { provider: adapter.id, status: "NOT_CONFIGURED", attemptedAt: new Date(now).toISOString(), lastSuccessAt: old?.lastSuccessAt ?? null, cursor: 0, failures: old?.failures ?? 0, retryAt: 0, coveredAssets: [], records: 0 };
    if (!adapter.configured()) {
      for (const asset of unique) repo.setState(`coverage:${adapter.id}:${asset.id}`, { status: "NOT_CONFIGURED", attemptedAt: status.attemptedAt, lastSuccessAt: status.lastSuccessAt, records: 0 } satisfies CoverageState);
      repo.setState(`provider:${adapter.id}`, status);
      statuses.push(status);
      continue;
    }
    const batches = adapter.id === "public-rss-news" ? [unique] : chunk(unique, 5);
    const succeeded = new Set<string>();
    const failed = new Set<string>();
    let records = 0;
    let lastSuccessAt = status.lastSuccessAt;
    for (const batch of batches) {
      const attemptedAt = new Date().toISOString();
      try {
        const raw = await adapter.fetch(batch, AbortSignal.timeout(12_000));
        const received = Date.now();
        const appended = repo.append(raw, Math.max(now, received));
        records += appended.length;
        lastSuccessAt = new Date(received).toISOString();
        for (const asset of batch) {
          succeeded.add(asset.id);
          repo.setState(`coverage:${adapter.id}:${asset.id}`, { status: "AVAILABLE", attemptedAt, lastSuccessAt, records: appended.filter((row) => row.canonicalAssetId === asset.id).length } satisfies CoverageState);
        }
      } catch (error) {
        for (const asset of batch) {
          failed.add(asset.id);
          repo.setState(`coverage:${adapter.id}:${asset.id}`, { status: "UNAVAILABLE", attemptedAt, lastSuccessAt, records: 0, error: error instanceof Error ? error.message : String(error) } satisfies CoverageState);
        }
      }
    }
    status.coveredAssets = [...succeeded];
    status.records = records;
    status.lastSuccessAt = lastSuccessAt;
    status.failures = failed.size ? (old?.failures ?? 0) + 1 : 0;
    status.status = succeeded.size === unique.length ? "AVAILABLE" : succeeded.size > 0 ? "PARTIAL" : "UNAVAILABLE";
    if (failed.size) status.error = `PROVIDER_INCOMPLETE_FOR_${failed.size}_ASSETS`;
    repo.setState(`provider:${adapter.id}`, status);
    statuses.push(status);
  }

  const rows = unique.map((asset): RefreshResearchAsset => {
    const evidence = repo.list(asset.id);
    const current = evidence.filter((item) => Date.parse(item.retrievedAt) <= now && Date.parse(item.expiresAt) > now);
    const providerStates = statuses.map((provider) => ({ provider: provider.provider, value: repo.getState(`coverage:${provider.provider}:${asset.id}`) as CoverageState | null }));
    const providersAttempted = providerStates.filter(({ value }) => value?.status === "AVAILABLE").map(({ provider }) => provider);
    const providersNotConfigured = providerStates.filter(({ value }) => value?.status === "NOT_CONFIGURED").map(({ provider }) => provider);
    const providerFailures = providerStates.filter(({ value }) => value?.status === "UNAVAILABLE").map(({ provider }) => provider);
    const review = evaluateReassessment(repo.readReview(asset.id), evidence, now, asset.id);
    repo.saveReview(review);
    const newsStatus = evidenceStatus(evidence, now, "news");
    const socialStatus = evidenceStatus(evidence, now, "social");
    const coverage: RefreshResearchCoverage = providersAttempted.length === 0
      ? "EVIDENCE_INCOMPLETE"
      : providersNotConfigured.length || providerFailures.length || newsStatus !== "AVAILABLE" || socialStatus !== "AVAILABLE"
        ? "COMPLETE_WITH_GAPS"
        : "COMPLETE";
    return { symbol: asset.symbol, assetId: asset.id, evaluatedAt: new Date(now).toISOString(), coverage, reviewStatus: review.status, newsStatus, socialStatus, providersAttempted, providersNotConfigured, providerFailures, evidenceCount: evidence.length, currentEvidenceCount: current.length, falsifiers: falsifiers(review), authority: "RESEARCH_ONLY_DEMOTE_OR_FLAG", canPromote: false, mayAffectSizing: false, mayWriteExchange: false };
  });

  const sweep: RefreshResearchSweep = { version: "WATCHLIST_REFRESH_RESEARCH_V1", evaluatedAt: new Date(now).toISOString(), requestedAssets: unique.length, assessedAssets: rows.length, providerStatuses: statuses, assets: rows, trial: advanceTrial(repo, now, unique, statuses), authority: "RESEARCH_ONLY_DEMOTE_OR_FLAG", canPromote: false, mayAffectSizing: false, mayWriteExchange: false };
  repo.setState("last-full-watchlist-refresh", sweep);
  return sweep;
}

export function readLatestFullWatchlistResearch(repo: EvidenceRepo): RefreshResearchSweep | null {
  const value = repo.getState("last-full-watchlist-refresh") as RefreshResearchSweep | null;
  return value?.version === "WATCHLIST_REFRESH_RESEARCH_V1" ? value : null;
}
