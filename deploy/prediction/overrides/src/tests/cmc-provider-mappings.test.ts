import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const mappings = JSON.parse(readFileSync(resolve(process.cwd(), "src/fixtures/canonical-mappings.json"), "utf8")) as Array<{
  symbol: string;
  mappingStatus: string;
  providerIds: { cmcNumericId?: string; coingeckoId?: string; krakenPair?: string };
}>;
const watchlist = JSON.parse(readFileSync(resolve(process.cwd(), "src/fixtures/watchlist.json"), "utf8")) as Array<{ symbol: string }>;

describe("current watchlist provider identities", () => {
  it("matches every member to one verified CMC and CoinGecko identity", () => {
    expect(mappings).toHaveLength(watchlist.length);
    expect(new Set(mappings.map((entry) => entry.symbol))).toEqual(new Set(watchlist.map((entry) => entry.symbol)));
    for (const entry of mappings) {
      expect(entry.mappingStatus, entry.symbol).toBe("verified");
      expect(entry.providerIds.cmcNumericId, entry.symbol).toBeTruthy();
      expect(entry.providerIds.coingeckoId, entry.symbol).toBeTruthy();
    }
  });

  it("pins exact identities for TRX, ATOM, XDC, and the ambiguous KITE ticker", () => {
    for (const [symbol, cmcNumericId, coingeckoId, krakenPair] of [
      ["TRX", "1958", "tron", "TRXUSD"],
      ["ATOM", "3794", "cosmos", "ATOMUSD"],
      ["XDC", "2634", "xdce-crowd-sale", "XDCUSD"],
      ["KITE", "38828", "kite-2", undefined],
    ]) {
      const entry = mappings.find((item) => item.symbol === symbol);
      expect(entry?.providerIds.cmcNumericId).toBe(cmcNumericId);
      expect(entry?.providerIds.coingeckoId).toBe(coingeckoId);
      expect(entry?.providerIds.krakenPair).toBe(krakenPair);
    }
  });
});
