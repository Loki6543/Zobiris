import { createHash } from "node:crypto";
import type { EvidenceRepo } from "./researchEvidence.js";
import { evaluateReassessment, type Review } from "./reassessment.js";
import type {
  ResearchAdapter,
  ResearchAsset,
  ResearchCollectionStatus,
} from "./researchCollection.js";

export type RefreshResearchCoverageState =
  | "COMPLETE"
  | "COMPLETE_WITH_GAPS"
  | "EVIDENCE_INCOMPLETE";

export type RefreshResearchAssetAssessment = {
  symbol: string;
  assetId: string;
  evaluatedAt: string;
  coverage: RefreshResearchCoverageState;
  reviewStatus: Review["status"];
  newsStatus: "AVAILABLE" | "STALE" | "UNAVAILABLE";
  socialStatus: "AVAILABLE" | "STALE" | "UNAVAILABLE";
  providersAttempted: string[];
  providersUnavailable: string[];
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
  version: "watchlist-refresh-research-v1";
  evaluatedAt: string;
  requestedAssets: number;
  assessedAssets: number;
  providerStatuses: ResearchCollectionStatus[];
  assets: RefreshResearchAssetAssessment[];
  trial: {
    count: number;
    previousHash: string | null;
    chainHead: string;
  };
  authority: "RESEARCH_ONLY_DEMOTE_OR_FLAG";
  canPromote: false;
  mayAffectSizing: false;
  mayWriteExchange: false;
};

type ProviderCoverage = {
  status: "AVAILABLE" | "UNAVAILABLE" | "NOT_CONFIGURED";
  attemptedAt: string;
  lastSuccessAt: string | null;
  records: number;
  error?: string;
};

const PUBLIC_RSS_FEEDS = [
  { id: "rss-cointelegraph", url: "https://cointelegraph.com/rss" },
  { id: "rss-decrypt", url: "https://decrypt.co/feed" },
  { id: "rss-bitcoinmagazine", url: "https://bitcoinmagazine.com/feed" },
] as const;

const PUBLIC_HOSTS = new Set([
  "cointelegraph.com",
  "decrypt.co",
  "bitcoinmagazine.com",
  "api.stocktwits.com",
]);

function providerUrlAllowed(value: string): boolean {
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      !url.username &&
      !url.password &&
      !url.port &&
      PUBLIC_HOSTS.has(url.hostname.toLowerCase())
    );
  } catch {
    return false;
  }
}

async function safeText(
  url: string,
  signal: AbortSignal,
  fetcher: typeof fetch,
  maxBytes = 512 * 1024,
): Promise<string> {
  if (!providerUrlAllowed(url)) throw new Error("PUBLIC_RESEARCH_HOST_REJECTED");
  const response = await fetcher(url, {
    redirect: "error",
    signal,
    headers: { Accept: "application/rss+xml, application/xml, text/xml, text/plain" },
  });
  if (!response.ok) throw new Error("PUBLIC_RESEARCH_PROVIDER_UNAVAILABLE");
  const declared = Number(response.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > maxBytes)
    throw new Error("PUBLIC_RESEARCH_RESPONSE_TOO_LARGE");
  const text = await response.text();
  if (Buffer.byteLength(text) > maxBytes)
    throw new Error("PUBLIC_RESEARCH_RESPONSE_TOO_LARGE");
  return text;
}

async function safeJson(
  url: string,
  signal: AbortSignal,
  fetcher: typeof fetch,
  maxBytes = 1024 * 1024,
): Promise<any> {
  if (!providerUrlAllowed(url)) throw new Error("PUBLIC_RESEARCH_HOST_REJECTED");
  const response = await fetcher(url, {
    redirect: "error",
    signal,
    headers: { Accept: "application/json" },
  });
  if (!response.ok) throw new Error("PUBLIC_RESEARCH_PROVIDER_UNAVAILABLE");
  const declared = Number(response.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > maxBytes)
    throw new Error("PUBLIC_RESEARCH_RESPONSE_TOO_LARGE");
  const text = await response.text();
  if (Buffer.byteLength(text) > maxBytes)
    throw new Error("PUBLIC_RESEARCH_RESPONSE_TOO_LARGE");
  return JSON.parse(text);
}

function decodeEntities(value: string): string {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_match, digits) =>
      String.fromCharCode(Number(digits)),
    )
    .replace(/&amp;/g, "&");
}

type RssItem = {
  title: string;
  link: string;
  publishedAt: string | null;
  description: string;
};

export function parseRefreshResearchRss(
  xml: string,
  limit = 80,
): RssItem[] {
  const blocks = xml.match(/<(item|entry)\b[\s\S]*?<\/\1>/gi) ?? [];
  const rows: RssItem[] = [];
  const tag = (block: string, name: string): string => {
    const match = block.match(
      new RegExp(`<${name}[^>]*>([\\s\\S]*?)<\\/${name}>`, "i"),
    );
    if (!match) return "";
    return decodeEntities(
      match[1]!
        .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
        .replace(/<[^>]+>/g, "")
        .trim(),
    );
  };
  for (const block of blocks) {
    const title = tag(block, "title");
    if (!title) continue;
    const link =
      tag(block, "link") ||
      block.match(/<link[^>]*href="([^"]+)"/i)?.[1] ||
      "";
    const rawDate =
      tag(block, "pubDate") ||
      tag(block, "published") ||
      tag(block, "updated") ||
      "";
    const time = Date.parse(rawDate);
    rows.push({
      title,
      link,
      publishedAt: Number.isFinite(time)
        ? new Date(time).toISOString()
        : null,
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

function assetMentioned(asset: ResearchAsset, text: string): boolean {
  const symbol = asset.symbol.toUpperCase();
  const name = asset.name.trim();
  if (name.length >= 3 && wholeWord(text, name)) return true;
  if (new RegExp(`\\$${symbol}\\b`, "i").test(text)) return true;
  if (symbol.length >= 4 && wholeWord(text, symbol)) return true;
  return ["BTC", "ETH", "SOL", "XRP", "ADA"].includes(symbol) &&
    wholeWord(text, symbol);
}

function publicRssAdapter(fetcher: typeof fetch): ResearchAdapter {
  let cached:
    | Promise<Array<{ feed: (typeof PUBLIC_RSS_FEEDS)[number]; rows: RssItem[] }>>
    | null = null;
  return {
    id: "public-rss-news",
    configured: () => true,
    fetch: async (assets, signal) => {
      cached ??= Promise.allSettled(
        PUBLIC_RSS_FEEDS.map(async (feed) => ({
          feed,
          rows: parseRefreshResearchRss(
            await safeText(feed.url, signal, fetcher),
          ),
        })),
      ).then((results) => {
        const feeds = results.flatMap((result) =>
          result.status === "fulfilled" ? [result.value] : [],
        );
        if (!feeds.length) throw new Error("PUBLIC_RSS_UNAVAILABLE");
        return feeds;
      });
      const feeds = await cached;
      const retrievedAt = new Date().toISOString();
      const output: unknown[] = [];
      for (const asset of assets) {
        for (const { feed, rows } of feeds) {
          for (const row of rows) {
            const text = `${row.title} ${row.description}`;
            if (!assetMentioned(asset, text)) continue;
            if (!row.link || !/^https:\/\//i.test(row.link)) continue;
            output.push({
              canonicalAssetId: asset.id,
              symbol: asset.symbol,
              provider: feed.id,
              sourceUrl: row.link,
              publishedAt: row.p²È="25µÈì¡üèÍÑÉ¥¹ô(ð¹Õ±°ì(½¹ÍÐÁÉÙ¥½ÕÍ!Í ô(ÑåÁ½ÁÉ¥½Èü¹¡ôôôÍÑÉ¥¹ÁÉ¥½È¹¡üÁÉ¥½È¹¡è¹Õ±°ì(½¹ÍÐ½Õ¹Ðô5Ñ ¹µà À°9ÕµÈ¡ÁÉ¥½Èü¹½Õ¹ÐüüÀ¤ñðÀ¤¬Äì(½¹ÍÐÁå±½ô)M=8¹ÍÑÉ¥¹¥ä¡ì(ÁÉÙ¥½ÕÍ!Í °(½Õ¹Ð°(Ù±ÕÑÐè¹ÜÑ¡¹½Ü¤¹Ñ½%M=MÑÉ¥¹ ¤°(ÍÍÑÌèÍÍÑÌ¹µÀ ¡ÍÍÐ¤ôøÍÍÐ¹¥¤¹Í½ÉÐ ¤°(ÁÉ½Ù¥ÉÌèÍÑÑÕÍÌ¹µÀ ¡ÍÑÑÕÌ¤ôø¡ì(ÁÉ½Ù¥ÈèÍÑÑÕÌ¹ÁÉ½Ù¥È°(ÍÑÑÕÌèÍÑÑÕÌ¹ÍÑÑÕÌ°(½ÙÉÍÍÑÌèl¸¸¹ÍÑÑÕÌ¹½ÙÉÍÍÑÍt¹Í½ÉÐ ¤°(É½ÉÌèÍÑÑÕÌ¹É½ÉÌ°(ô¤¤°(ô¤ì(½¹ÍÐ¡¥¹!ôÉÑ!Í  Í¡ÈÔØ¤¹ÕÁÑ¡Áå±½¤¹¥ÍÐ ¡à¤ì(ÉÁ¼¹ÍÑMÑÑ ÉÉÍ µÉÍÉ µ±È°ì(½Õ¹Ð°(¡è¡¥¹!°(ÁÉÙ¥½ÕÍ!Í °(Ù±ÕÑÐè¹ÜÑ¡¹½Ü¤¹Ñ½%M=MÑÉ¥¹ ¤°(ô¤ì(ÉÑÕÉ¸ì½Õ¹Ð°ÁÉÙ¥½ÕÍ!Í °¡¥¹!ôì)ô()áÁ½ÉÐÍå¹Õ¹Ñ¥½¸½±±ÑÕ±±]Ñ¡±¥ÍÑIÍÉ  (ÉÁ¼èÙ¥¹IÁ¼°(ÁÑÉÌèIÍÉ¡ÁÑÉmt°(ÍÍÑÌèIÍÉ¡ÍÍÑmt°(¹½ÜôÑ¹¹½Ü ¤°(¤èAÉ½µ¥ÍñIÉÍ¡IÍÉ¡MÝÀøì(½¹ÍÐÕ¹¥ÅÕôl(¸¸¹¹Ü5À (ÍÍÑÌ¹µÀ ¡ÍÍÐ¤ôømÍÍÐ¹¥°ì¸¸¹ÍÍÐ°Íåµ½°èÍÍÐ¹Íåµ½°¹Ñ½UÁÁÉÍ ¤õt¤°(¤¹Ù±ÕÌ ¤°(tì(½¹ÍÐÍÑÑÕÍÌèIÍÉ¡½±±Ñ¥½¹MÑÑÕÍmtômtì((½È¡½¹ÍÐÁÑÈ½ÁÑÉÌ¤ì(½¹ÍÐ½±ôÉÁ¼¹ÑMÑÑ (ÁÉ½Ù¥Èè¬ÁÑÈ¹¥°(¤ÌIÍÉ¡½±±Ñ¥½¹MÑÑÕÌð¹Õ±°ì(½¹ÍÐÍÑÑÕÌèIÍÉ¡½±±Ñ¥½¹MÑÑÕÌôì(ÁÉ½Ù¥ÈèÁÑÈ¹¥°(ÍÑÑÕÌè9=Q}=9%UI°(ÑÑµÁÑÐè¹ÜÑ¡¹½Ü¤¹Ñ½%M=MÑÉ¥¹ ¤°(±ÍÑMÕÍÍÐè½±ü¹±ÍÑMÕÍÍÐüü¹Õ±°°(ÕÉÍ½ÈèÀ°(¥±ÕÉÌè½±ü¹¥±ÕÉÌüüÀ°(ÉÑÉåÐèÀ°(½ÙÉÍÍÑÌèmt°(É½ÉÌèÀ°(ôì(¥ ÁÑÈ¹½¹¥ÕÉ ¤¤ì(½È¡½¹ÍÐÍÍÐ½Õ¹¥ÅÕ¤(ÉÁ¼¹ÍÑMÑÑ¡½ÙÉèíÁÑÈ¹¥ôèíÍÍÐ¹¥õ°ì(ÍÑÑÕÌè9=Q}=9%UI°(ÑÑµÁÑÐèÍÑÑÕÌ¹ÑÑµÁÑÐ°(±ÍÑMÕÍÍÐèÍÑÑÕÌ¹±ÍÑMÕÍÍÐ°(É½ÉÌèÀ°(ôÍÑ¥Í¥ÌAÉ½Ù¥É½ÙÉ¤ì(ÉÁ¼¹ÍÑMÑÑ ÁÉ½Ù¥Èè¬ÁÑÈ¹¥°ÍÑÑÕÌ¤ì(ÍÑÑÕÍÌ¹ÁÕÍ ¡ÍÑÑÕÌ¤ì(½¹Ñ¥¹Õì(ô((½¹ÍÐÍÕô¹ÜMÐñÍÑÉ¥¹ø ¤ì(½¹ÍÐ¥±ô¹ÜMÐñÍÑÉ¥¹ø ¤ì(±Ð±ÍÑMÕÍÍÐèÍÑÉ¥¹ð¹Õ±°ôÍÑÑÕÌ¹±ÍÑMÕÍÍÐì(±ÐÉ½ÉÌôÀì(½¹ÍÐÑ¡M¥éô(ÁÑÈ¹¥ôôôÍÑ½­ÑÝ¥ÑÌµÁÕ±¥ñðÁÑÈ¹¥ôôôÁÉ±±°µ¹ÝÌ(üÄ(èÁÑÈ¹¥ôôôÁÕ±¥µÉÍÌµ¹ÝÌ(ü5Ñ ¹µà Ä°Õ¹¥ÅÕ¹±¹Ñ ¤(èÔì(½¹ÍÐÑ¡Ìô¡Õ¹¬¡Õ¹¥ÅÕ°Ñ¡M¥é¤ì(Ý¥ÐÉÕ¹	Ñ¡Ì¡Ñ¡Ì°Ì°Íå¹¡Ñ ¤ôøì(½¹ÍÐÑÑµÁÑÐô¹ÜÑ ¤¹Ñ½%M=MÑÉ¥¹ ¤ì(ÑÉäì(½¹ÍÐÉÜôÝ¥ÐÁÑÈ¹Ñ  (Ñ °(½ÉÑM¥¹°¹Ñ¥µ½ÕÐ ÄÉ|ÀÀÀ¤°(¤ì(½¹ÍÐÉ¥ÙôÑ¹¹½Ü ¤ì(½¹ÍÐÁÁ¹ôÉÁ¼¹ÁÁ¹¡ÉÜ°5Ñ ¹µà¡¹½Ü°É¥Ù¤¤ì(É½ÉÌ¬ôÁÁ¹¹±¹Ñ ì(±ÍÑMÕÍÍÐô¹ÜÑ¡É¥Ù¤¹Ñ½%M=MÑÉ¥¹ ¤ì(½È¡½¹ÍÐÍÍÐ½Ñ ¤ì(ÍÕ¹¡ÍÍÐ¹¥¤ì(ÉÁ¼¹ÍÑMÑÑ¡½ÙÉèíÁÑÈ¹¥ôèíÍÍÐ¹¥õ°ì(ÍÑÑÕÌèY%1	1°(ÑÑµÁÑÐ°(±ÍÑMÕÍÍÐ°(É½ÉÌèÁÁ¹¹¥±ÑÈ (¡É½Ü¤ôøÉ½Ü¹¹½¹¥±ÍÍÑ%ôôôÍÍÐ¹¥°(¤¹±¹Ñ °(ôÍÑ¥Í¥ÌAÉ½Ù¥É½ÙÉ¤ì(ÉÁ¼¹ÍÙIÙ¥Ü (Ù±ÕÑIÍÍÍÍµ¹Ð (ÉÁ¼¹ÉIÙ¥Ü¡ÍÍÐ¹¥¤°(ÉÁ¼¹±¥ÍÐ¡ÍÍÐ¹¥¤°(5Ñ ¹µà¡¹½Ü°É¥Ù¤°(ÍÍÐ¹¥°(¤°(¤ì(ô(ôÑ ¡ÉÉ½È¤ì(½È¡½¹ÍÐÍÍÐ½Ñ ¤ì(¥±¹¡ÍÍÐ¹¥¤ì(ÉÁ¼¹ÍÑMÑÑ¡½ÙÉèíÁÑÈ¹¥ôèíÍÍÐ¹¥õ°ì(ÍÑÑÕÌèU9Y%1	1°(ÑÑµÁÑÐ°(±ÍÑMÕÍÍÐ°(É½ÉÌèÀ°(ÉÉ½ÈèÉÉ½È¥¹ÍÑ¹½ÉÉ½ÈüÉÉ½È¹µÍÍèMÑÉ¥¹¡ÉÉ½È¤°(ôÍÑ¥Í¥ÌAÉ½Ù¥É½ÙÉ¤ì(ô(ô(ô¤ì((ÍÑÑÕÌ¹½ÙÉÍÍÑÌôl¸¸¹ÍÕtì(ÍÑÑÕÌ¹É½ÉÌôÉ½ÉÌì(ÍÑÑÕÌ¹±ÍÑMÕÍÍÐô±ÍÑMÕÍÍÐì(ÍÑÑÕÌ¹¥±ÕÉÌô¥±¹Í¥éü¡½±ü¹¥±ÕÉÌüüÀ¤¬ÄèÀì(ÍÑÑÕÌ¹ÍÑÑÕÌô(ÍÕ¹Í¥éôôôÕ¹¥ÅÕ¹±¹Ñ (üY%1	1(èÍÕ¹Í¥éøÀ(üAIQ%0(èU9Y%1	1ì(¥¡¥±¹Í¥é¤(ÍÑÑÕÌ¹ÉÉ½ÈôAI=Y%I}%9=5A1Q}=I|í¥±¹Í¥éõ}MMQMì(ÉÁ¼¹ÍÑMÑÑ ÁÉ½Ù¥Èè¬ÁÑÈ¹¥°ÍÑÑÕÌ¤ì(ÍÑÑÕÍÌ¹ÁÕÍ ¡ÍÑÑÕÌ¤ì(ô((½È¡½¹ÍÐÍÍÐ½Õ¹¥ÅÕ¤(ÉÁ¼¹ÍÙIÙ¥Ü (Ù±ÕÑIÍÍÍÍµ¹Ð¡ÉÁ¼¹ÉIÙ¥Ü¡ÍÍÐ¹¥¤°ÉÁ¼¹±¥ÍÐ¡ÍÍÐ¹¥¤°¹½Ü°ÍÍÐ¹¥¤°(¤ì((½¹ÍÐÍÍÑI½ÝÌôÕ¹¥ÅÕ¹µÀ ¡ÍÍÐ¤èIÉÍ¡IÍÉ¡ÍÍÑÍÍÍÍµ¹Ðôøì(½¹ÍÐÙ¥¹ôÉÁ¼¹±¥ÍÐ¡ÍÍÐ¹¥¤ì(½¹ÍÐÕÉÉ¹ÐôÙ¥¹¹¥±ÑÈ (¡¥Ñ´¤ôø(Ñ¹ÁÉÍ¡¥Ñ´¹ÉÑÉ¥ÙÐ¤ðô¹½Ü(Ñ¹ÁÉÍ¡¥Ñ´¹áÁ¥ÉÍÐ¤ø¹½Ü°(¤ì(½¹ÍÐÁÉ½Ù¥ÉMÑÑÌôÍÑÑÕÍÌ¹µÀ ¡ÁÉ½Ù¥È¤ôøì(½¹ÍÐÙ±ÕôÉÁ¼¹ÑMÑÑ (½ÙÉèíÁÉ½Ù¥È¹ÁÉ½Ù¥ÉôèíÍÍÐ¹¥õ°(¤ÌAÉ½Ù¥É½ÙÉð¹Õ±°ì(ÉÑÕÉ¸ìÁÉ½Ù¥ÈèÁÉ½Ù¥È¹ÁÉ½Ù¥È°Ù±Õôì(ô¤ì(½¹ÍÐÑÑµÁÑôÁÉ½Ù¥ÉMÑÑÌ(¹¥±ÑÈ ¡ìÙ±Õô¤ôøÙ±Õü¹ÍÑÑÕÌôôôY%1	1¤(¹µÀ ¡ìÁÉ½Ù¥Èô¤ôøÁÉ½Ù¥È¤ì(½¹ÍÐÕ¹Ù¥±±ôÁÉ½Ù¥ÉMÑÑÌ(¹¥±ÑÈ ¡ìÙ±Õô¤ôøÙ±Õü¹ÍÑÑÕÌôôô9=Q}=9%UI¤(¹µÀ ¡ìÁÉ½Ù¥Èô¤ôøÁÉ½Ù¥È¤ì(½¹ÍÐ¥±ÕÉÌôÁÉ½Ù¥ÉMÑÑÌ(¹¥±ÑÈ ¡ìÙ±Õô¤ôøÙ±Õü¹ÍÑÑÕÌôôôU9Y%1	1¤(¹µÀ ¡ìÁÉ½Ù¥Èô¤ôøÁÉ½Ù¥È¤ì(½¹ÍÐÉÙ¥Üô(ÉÁ¼¹ÉIÙ¥Ü¡ÍÍÐ¹¥¤üü(Ù±ÕÑIÍÍÍÍµ¹Ð¡¹Õ±°°Ù¥¹°¹½Ü°ÍÍÐ¹¥¤ì(½¹ÍÐ¹ÝÍMÑÑÕÌôÕÉÉ¹ÑMÑÑÕÌ¡Ù¥¹°¹½Ü°¹ÝÌ¤ì(½¹ÍÐÍ½¥±MÑÑÕÌôÕÉÉ¹ÑMÑÑÕÌ¡Ù¥¹°¹½Ü°Í½¥°¤ì(½¹ÍÐ½ÙÉèIÉÍ¡IÍÉ¡½ÙÉMÑÑô(ÑÑµÁÑ¹±¹Ñ ôôôÀ(üY%9}%9=5A1Q(èÕ¹Ù¥±±¹±¹Ñ ñð¥±ÕÉÌ¹±¹Ñ ñð(¹ÝÍMÑÑÕÌôôY%1	1ñð(Í½¥±MÑÑÕÌôôY%1	1(ü=5A1Q}]%Q!}AL(è=5A1Qì(ÉÑÕÉ¸ì(Íåµ½°èÍÍÐ¹Íåµ½°°(ÍÍÑ%èÍÍÐ¹¥°(Ù±ÕÑÐè¹ÜÑ¡¹½Ü¤¹Ñ½%M=MÑÉ¥¹ ¤°(½ÙÉ°(ÉÙ¥ÝMÑÑÕÌèÉÙ¥Ü¹ÍÑÑÕÌ°(¹ÝÍMÑÑÕÌ°(Í½¥±MÑÑÕÌ°(ÁÉ½Ù¥ÉÍÑÑµÁÑèÑÑµÁÑ°(ÁÉ½Ù¥ÉÍU¹Ù¥±±èÕ¹Ù¥±±°(ÁÉ½Ù¥É¥±ÕÉÌè¥±ÕÉÌ°(Ù¥¹½Õ¹ÐèÙ¥¹¹±¹Ñ °(ÕÉÉ¹ÑÙ¥¹½Õ¹ÐèÕÉÉ¹Ð¹±¹Ñ °(±Í¥¥ÉÌè±Í¥¥ÉÌ¡ÉÙ¥Ü¤°(ÕÑ¡½É¥ÑäèIMI!}=91e}5=Q}=I}1°(¹AÉ½µ½Ñè±Í°(µåÑM¥é¥¹è±Í°(µå]É¥Ñá¡¹è±Í°(ôì(ô¤ì((½¹ÍÐÉÍÕ±ÐèIÉÍ¡IÍÉ¡MÝÀôì(ÙÉÍ¥½¸èÝÑ¡±¥ÍÐµÉÉÍ µÉÍÉ µØÄ°(Ù±ÕÑÐè¹ÜÑ¡¹½Ü¤¹Ñ½%M=MÑÉ¥¹ ¤°(ÉÅÕÍÑÍÍÑÌèÕ¹¥ÅÕ¹±¹Ñ °(ÍÍÍÍÍÍÑÌèÍÍÑI½ÝÌ¹±¹Ñ °(ÁÉ½Ù¥ÉMÑÑÕÍÌèÍÑÑÕÍÌ°(ÍÍÑÌèÍÍÑI½ÝÌ°(ÑÉ¥°èÙ¹QÉ¥°¡ÉÁ¼°¹½Ü°Õ¹¥ÅÕ°ÍÑÑÕÍÌ¤°(ÕÑ¡½É¥ÑäèIMI!}=91e}5=Q}=I}1°(¹AÉ½µ½Ñè±Í°(µåÑM¥é¥¹è±Í°(µå]É¥Ñá¡¹è±Í°(ôì(ÉÁ¼¹ÍÑMÑÑ ±ÍÐµÕ±°µÝÑ¡±¥ÍÐµÉÉÍ °ÉÍÕ±Ð¤ì(ÉÑÕÉ¸ÉÍÕ±Ðì)ô()áÁ½ÉÐÕ¹Ñ¥½¸É1ÑÍÑÕ±±]Ñ¡±¥ÍÑIÍÉ  (ÉÁ¼èÙ¥¹IÁ¼°(¤èIÉÍ¡IÍÉ¡MÝÀð¹Õ±°ì(½¹ÍÐÙ±ÕôÉÁ¼¹ÑMÑÑ ±ÍÐµÕ±°µÝÑ¡±¥ÍÐµÉÉÍ ¤Ì(ðIÉÍ¡IÍÉ¡MÝÀ(ð¹Õ±°ì(ÉÑÕÉ¸Ù±Õü¹ÙÉÍ¥½¸ôôôÝÑ¡±¥ÍÐµÉÉÍ µÉÍÉ µØÄüÙ±Õè¹Õ±°ì)ô(