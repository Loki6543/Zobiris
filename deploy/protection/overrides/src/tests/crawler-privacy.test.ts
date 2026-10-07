import { describe, expect, it } from "vitest";
import {
  ROBOTS_TXT,
  SEARCH_PRIVACY_HEADER,
  isBlockedCrawlerUserAgent,
} from "../server/crawlerPrivacy.js";

describe("crawler privacy boundary", () => {
  it("disallows all compliant crawlers", () => {
    expect(ROBOTS_TXT).toContain("User-agent: *\nDisallow: /");
    expect(ROBOTS_TXT).toContain("User-agent: GPTBot\nDisallow: /");
    expect(ROBOTS_TXT).toContain("User-agent: OAI-SearchBot\nDisallow: /");
    expect(ROBOTS_TXT).toContain("User-agent: ClaudeBot\nDisallow: /");
    expect(ROBOTS_TXT).toContain("User-agent: PerplexityBot\nDisallow: /");
  });

  it("marks every response as non-indexable", () => {
    expect(SEARCH_PRIVACY_HEADER).toContain("noindex");
    expect(SEARCH_PRIVACY_HEADER).toContain("nofollow");
    expect(SEARCH_PRIVACY_HEADER).toContain("noarchive");
    expect(SEARCH_PRIVACY_HEADER).toContain("nosnippet");
  });

  it.each([
    "Googlebot/2.1",
    "bingbot/2.0",
    "GPTBot/1.2",
    "OAI-SearchBot/1.0",
    "ChatGPT-User/1.0",
    "ClaudeBot/1.0",
    "Claude-SearchBot/1.0",
    "PerplexityBot/1.0",
    "CCBot/2.0",
    "Bytespider",
    "SomeUnknownCrawler/1.0",
  ])("actively blocks crawler UA %s", (ua) => {
    expect(isBlockedCrawlerUserAgent(ua)).toBe(true);
  });

  it("does not block an ordinary browser user agent", () => {
    expect(
      isBlockedCrawlerUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/140 Safari/537.36",
      ),
    ).toBe(false);
  });
});
