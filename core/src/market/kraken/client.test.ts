import { describe, expect, it } from "vitest";
import { parseTicker } from "./client.js";

describe("Kraken ticker parsing", () => {
  it("uses v[1] as rolling 24h volume rather than v[0] since-midnight volume", () => {
    const ticker=parseTicker("BTC/USD",{
      a:["100.1","1","1"], b:["99.9","1","1"], c:["100","0.1"],
      v:["206","1042"],
    });
    expect(ticker.volumeTodayBase).toBe(206);
    expect(ticker.volume24hBase).toBe(1042);
    expect(ticker.volume24hUsd).toBe(104200);
  });
});
