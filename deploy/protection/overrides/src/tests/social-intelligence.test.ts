import { describe, expect, it } from "vitest";
import {
  cryptoBertStocktwitsAdapter,
  parseCryptoBertScores,
  priceSentimentShadow,
  summarizeSocialIntelligence,
} from "../server/socialIntelligence.js";

describe("CryptoBERT social intelligence", () => {
  it("maps CryptoBERT labels into a normalized signed sentiment vector", () => {
    expect(
      parseCryptoBertScores([
        { label: "Bearish", score: 0.1 },
        { label: "Neutral", score: 0.2 },
        { label: "Bullish", score: 0.7 },
      ]),
    ).toEqual({
      model: "ElKulako/cryptobert",
      bearish: 0.1,
      neutral: 0.2,
      bullish: 0.7,
      net: 0.6,
      confidence: 0.7,
    });
    expect(() => parseCryptoBertScores([{ label: "unknown", score: 1 }])).toThrow();
  });

  it("requires both the HF inference token and Firestream credentials", () => {
    expect(
      cryptoBertStocktwitsAdapter({
        STOCKTWITS_FIRESTREAM_USERNAME: "u",
        STOCKTWITS_FIRESTREAM_PASSWORD: "p",
      }).configured(),
    ).toBe(false);
    expect(
      cryptoBertStocktwitsAdapter({
        HUGGINGFACE_API_TOKEN: "hf_test",
        STOCKTWITS_FIRESTREAM_USERNAME: "u",
        STOCKTWITS_FIRESTREAM_PASSWORD: "p",
      }).configured(),
    ).toBe(true);
  });

  it("classifies raw Stocktwits text without persisting the raw post body", async () => {
    const createdAt = new Date(Date.now() - 1000).toISOString();
    const stream = {
      object: "Message",
      action: "create",
      data: {
        id: 123,
        body: "Bitcoin breakout looks strong from here",
        created_at: createdAt,
        symbols: [{ symbol: "BTC" }],
      },
    };
    const fetcher = (async (url: any) => {
      const value = String(url);
      if (value.includes("firestream.stocktwits.com"))
        return new Response(JSON.stringify(stream) + "\n", { status: 200 });
      if (value.includes("router.huggingface.co"))
        return new Response(
          JSON.stringify([
            [
              { label: "Bearish", score: 0.05 },
              { label: "Neutral", score: 0.15 },
              { label: "Bullish", score: 0.8 },
            ],
          ]),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      throw new Error("unexpected URL");
    }) as typeof fetch;

    const adapter = cryptoBertStocktwitsAdapter(
      {
        HUGGINGFACE_API_TOKEN: "hf_test",
        STOCKTWITS_FIRESTREAM_USERNAME: "u",
        STOCKTWITS_FIRESTREAM_PASSWORD: "p",
      },
      fetcher,
    );
    const rows = (await adapter.fetch(
      [{ id: "btc-id", symbol: "BTC", name: "Bitcoin" }],
      AbortSignal.timeout(2000),
    )) as any[];

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      canonicalAssetId: "btc-id",
      provider: "cryptobert-stocktwits",
      kind: "SOCIAL_ACTIVITY",
      material: false,
      sentiment: {
        model: "ElKulako/cryptobert",
        bullish: 0.8,
        bearish: 0.05,
        net: 0.75,
      },
    });
    expect(JSON.stringify(rows[0])).not.toContain(stream.data.body);
  });

  it("aggregates the requested horizons and keeps entry interpretation shadow-only", () => {
    const now = Date.parse("2026-10-03T10:00:00Z");
    const row = (hoursAgo: number, net: number): any => ({
      provider: "cryptobert-stocktwits",
      publishedAt: new Date(now - hoursAgo * 3600000).toISOString(),
      retrievedAt: new Date(now - hoursAgo * 3600000).toISOString(),
      sentiment: {
        model: "ElKulako/cryptobert",
        bearish: Math.max(0, 0.2 - net / 2),
        neutral: 0.2,
        bullish: Math.max(0, 0.2 + net / 2),
        net,
        confidence: 0.8,
      },
    });
    const summary = summarizeSocialIntelligence(
      [row(0.2, 0.7), row(1, 0.6), row(2, 0.65), row(10, 0.1)],
      now,
    );
    expect(summary.horizons["30m"]?.samples).toBe(1);
    expect(summary.horizons["1.5h"]?.samples).toBe(2);
    expect(summary.horizons["8h"]?.samples).toBe(3);
    expect(summary.horizons["8h"]?.crowding).toBe("BULLISH");

    const shadow = priceSentimentShadow(summary, 6);
    expect(shadow.state).toBe("BULLISH_CROWDING_PULLBACK_RISK");
    expect(shadow.authority).toBe("SHADOW_ONLY_NO_ENTRY_SCORE_CHANGE");
  });
});
