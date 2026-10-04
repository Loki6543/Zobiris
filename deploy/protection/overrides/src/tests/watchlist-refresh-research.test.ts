import { describe, expect, it } from "vitest";
import { openResearchEvidence } from "../server/researchEvidence.js";
import {
  collectFullWatchlistResearch,
  publicRssResearchAdapter,
  readLatestFullWatchlistResearch,
} from "../server/watchlistRefreshResearch.js";

const now = Date.parse("2026-10-04T12:00:00Z");

function newsRecord(asset: { id: string; symbol: string }) {
  return {
    canonicalAssetId: asset.id,
    symbol: asset.symbol,
    provider: "fake-news",
    sourceUrl: "https://example.com/" + asset.symbol.toLowerCase(),
    publishedAt: new Date(now - 60_000).toISOString(),
    retrievedAt: new Date(now).toISOString(),
    expiresAt: new Date(now + 86_400_000).toISOString(),
    kind: "NEWS",
    lineageId: "fake:" + asset.symbol,
    summary: asset.symbol + " current news",
    claim: asset.symbol + " has a current research observation.",
    relevance: "Test evidence only.",
    verification: "UNVERIFIED",
    verificationSourceUrl: null,
    polarity: "MIXED",
    material: false,
    dataMode: "LIVE",
  };
}

describe("full-watchlist refresh research", () => {
  it("produces an explicit assessment for every requested watchlist asset", async () => {
    const assets = [
      { id: "sol", symbol: "SOL", name: "Solana" },
      { id: "comp", symbol: "COMP", name: "Compound" },
    ];
    const repo = openResearchEvidence(
      ":memory:",
      new Map(assets.map((asset) => [asset.symbol, asset.id])),
    );
    try {
      const sweep = await collectFullWatchlistResearch(
        repo,
        [
          {
            id: "fake-news",
            configured: () => true,
            fetch: async (batch) => batch.map(newsRecord),
          },
          {
            id: "unconfigured-social",
            configured: () => false,
            fetch: async () => [],
          },
        ],
        assets,
        now,
      );
      expect(sweep.requestedAssets).toBe(2);
      expect(sweep.assessedAssets).toBe(2);
      expect(sweep.assets.map((asset) => asset.symbol).sort()).toEqual([
        "COMP",
        "SOL",
      ]);
      expect(sweep.assets.every((asset) => asset.coverage === "COMPLETE_WITH_GAPS")).toBe(true);
      expect(sweep.assets.every((asset) => asset.providersNotConfigured.includes("unconfigured-social"))).toBe(true);
      expect(sweep.assets.every((asset) => asset.authority === "RESEARCH_ONLY_DEMOTE_OR_FLAG")).toBe(true);
      expect(sweep.assets.every((asset) => asset.canPromote === false && asset.mayAffectSizing === false && asset.mayWriteExchange === false)).toBe(true);
      expect(readLatestFullWatchlistResearch(repo)?.trial.count).toBe(1);

      const second = await collectFullWatchlistResearch(
        repo,
        [],
        assets,
        now + 60_000,
      );
      expect(second.trial.count).toBe(2);
      expect(second.trial.previousHash).toBe(sweep.trial.chainHead);
    } finally {
      repo.close();
    }
  });

  it("uses credential-free RSS without confusing unrelated common-word tickers", async () => {
    const xml =
      '<rss><channel><item><title>Solana network update</title><link>https://cointelegraph.com/news/solana-network-update</link><pubDate>Sun, 04 Oct 2026 11:00:00 GMT</pubDate><description>Solana validators discussed a network change.</description></item><item><title>One person changes careers</title><link>https://cointelegraph.com/news/career</link><pubDate>Sun, 04 Oct 2026 11:00:00 GMT</pubDate><description>One worker found a job.</description></item></channel></rss>';
    const adapter = publicRssResearchAdapter(async () =>
      new Response(xml, { status: 200, headers: { "content-type": "application/rss+xml" } }),
    );
    const rows = await adapter.fetch(
      [
        { id: "sol", symbol: "SOL", name: "Solana" },
        { id: "one", symbol: "ONE", name: "Harmony" },
      ],
      AbortSignal.timeout(1000),
    ) as any[];
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((row) => row.symbol === "SOL")).toBe(true);
  });
});
