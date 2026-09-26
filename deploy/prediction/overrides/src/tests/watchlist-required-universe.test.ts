/**
 * The captured CoinMarketCap watchlist is the only evaluation universe.
 * Membership and order are source-driven; no fixed asset count or
 * chain-specific subset is permitted.
 */

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const WATCHLIST = JSON.parse(
  readFileSync(resolve(process.cwd(), "src/fixtures/watchlist.json"), "utf8"),
) as { symbol: string; name: string }[];

const SOURCE_SNAPSHOT = JSON.parse(
  readFileSync(
    resolve(process.cwd(), "src/fixtures/watchlist-source-snapshot.json"),
    "utf8",
  ),
) as { source: string; orderedMembership: string[] };

describe("canonical user watchlist universe", () => {
  it("uses the selected CoinMarketCap watchlist as its source", () => {
    expect(SOURCE_SNAPSHOT.source).toBe(
      "https://coinmarketcap.com/?type=coins&tableRankBy=watchlist&watchListId=6a9a95c387e5a45cc1f40d5e",
    );
  });

  it("contains at least one uniquely identified asset", () => {
    const symbols = WATCHLIST.map((entry) => entry.symbol);
    expect(symbols.length).toBeGreaterThan(0);
    expect(new Set(symbols).size).toBe(symbols.length);
    expect(WATCHLIST.every((entry) => entry.name.trim().length > 0)).toBe(true);
  });

  it("matches the captured source membership and order exactly", () => {
    expect(WATCHLIST.map((entry) => entry.symbol)).toEqual(
      SOURCE_SNAPSHOT.orderedMembership,
    );
  });
});
