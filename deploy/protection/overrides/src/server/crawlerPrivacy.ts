import type { ServerResponse } from "node:http";

export const SEARCH_PRIVACY_HEADER =
  "noindex, nofollow, noarchive, nosnippet, noimageindex";

const BLOCKED_CRAWLER_PATTERNS = [
  /\bgooglebot\b/i,
  /\bbingbot\b/i,
  /\bduckduckbot\b/i,
  /\bbaiduspider\b/i,
  /\byandex(?:bot|images)\b/i,
  /\bapplebot(?:-extended)?\b/i,
  /\bpetalbot\b/i,
  /\bslurp\b/i,
  /\bfacebookexternalhit\b/i,
  /\bmeta-external(?:agent|fetcher)\b/i,
  /\bgptbot\b/i,
  /\boai-searchbot\b/i,
  /\bchatgpt-user\b/i,
  /\bclaudebot\b/i,
  /\bclaude-searchbot\b/i,
  /\bclaude-user\b/i,
  /\bperplexitybot\b/i,
  /\bccbot\b/i,
  /\bbytespider\b/i,
  /\bamazonbot\b/i,
  /\bcohere-ai\b/i,
  /\bdiffbot\b/i,
  /\byoubot\b/i,
  /\btimpibot\b/i,
  /\bomgili(?:bot)?\b/i,
  /\bimagesiftbot\b/i,
  /\bgoogle-extended\b/i,
  /(?:bot|crawler|spider|scrapy)/i,
] as const;

export const ROBOTS_TXT = [
  "# ZOBIRIS is a private decision-support application.",
  "# Indexing, archival, model-training and automated discovery are not authorized.",
  "User-agent: *",
  "Disallow: /",
  "",
  "User-agent: GPTBot",
  "Disallow: /",
  "User-agent: OAI-SearchBot",
  "Disallow: /",
  "User-agent: ChatGPT-User",
  "Disallow: /",
  "User-agent: ClaudeBot",
  "Disallow: /",
  "User-agent: Claude-SearchBot",
  "Disallow: /",
  "User-agent: Claude-User",
  "Disallow: /",
  "User-agent: PerplexityBot",
  "Disallow: /",
  "User-agent: Google-Extended",
  "Disallow: /",
  "User-agent: Applebot-Extended",
  "Disallow: /",
  "User-agent: CCBot",
  "Disallow: /",
  "User-agent: Bytespider",
  "Disallow: /",
  "",
].join("\n");

export function isBlockedCrawlerUserAgent(
  userAgent: string | string[] | undefined,
): boolean {
  const value = Array.isArray(userAgent) ? userAgent.join(" ") : String(userAgent ?? "");
  if (!value.trim()) return false;
  return BLOCKED_CRAWLER_PATTERNS.some((pattern) => pattern.test(value));
}

export function applySearchPrivacyHeaders(res: ServerResponse): void {
  res.setHeader("X-Robots-Tag", SEARCH_PRIVACY_HEADER);
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("X-Content-Type-Options", "nosniff");
}

export function sendRobotsTxt(res: ServerResponse): void {
  const body = ROBOTS_TXT;
  res.writeHead(200, {
    "Content-Type": "text/plain; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
    "Cache-Control": "public, max-age=300",
    "X-Robots-Tag": SEARCH_PRIVACY_HEADER,
  });
  res.end(body);
}

export function sendCrawlerBlocked(res: ServerResponse): void {
  const body = "Automated crawler access is disabled for this ZOBIRIS deployment.\n";
  res.writeHead(403, {
    "Content-Type": "text/plain; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
    "Cache-Control": "no-store",
    "X-Robots-Tag": SEARCH_PRIVACY_HEADER,
  });
  res.end(body);
}
