import { describe, expect, it } from "vitest";
import { buildUsdInstrumentRegistry, resolveWatchlistInstruments, snapBuyLimitToTick } from "./instruments.js";

describe("Kraken instrument registry", () => {
  it("resolves legacy BTC/ETH/XRP/DOGE names through pair metadata", () => {
    const registry = buildUsdInstrumentRegistry({
      XXBTZUSD: { altname: "XBTUSD", wsname: "XBT/USD", base: "XXBT", quote: "ZUSD", status: "online" },
      XETHZUSD: { altname: "ETHUSD", wsname: "ETH/USD", base: "XETH", quote: "ZUSD", status: "online" },
      XXRPZUSD: { altname: "XRPUSD", wsname: "XRP/USD", base: "XXRP", quote: "ZUSD", status: "online" },
      XDGUSD: { altname: "XDGUSD", wsname: "XDG/USD", base: "XXDG", quote: "ZUSD", status: "online" },
    });
    expect(registry.get("BTC")?.pairKey).toBe("XXBTZUSD");
    expect(registry.get("ETH")?.pairKey).toBe("XETHZUSD");
    expect(registry.get("XRP")?.pairKey).toBe("XXRPZUSD");
    expect(registry.get("DOGE")?.pairKey).toBe("XDGUSD");
  });

  it("resolves legacy base/quote codes even when wsname is absent", () => {
    const registry = buildUsdInstrumentRegistry({
      XXBTZUSD: { altname: "XBTUSD", base: "XXBT", quote: "ZUSD", status: "online" },
    });
    expect(registry.get("BTC")?.pairKey).toBe("XXBTZUSD");
  });

  it("also accepts Kraken display-name responses", () => {
    const registry = buildUsdInstrumentRegistry({
      "BTC/USD": { altname: "XBTUSD", wsname: "XBT/USD", base: "BTC", quote: "USD", status: "online", ordermin: "0.0001", costmin: "0.5", tick_size: "0.1" },
    });
    expect(registry.get("BTC")).toMatchObject({ online: true, orderMin: 0.0001, costMinUsd: 0.5, tickSize: 0.1 });
  });

  it("keeps unavailable and non-online watchlist assets visible with explicit states", () => {
    const registry = buildUsdInstrumentRegistry({
      "ATOM/USD": { wsname: "ATOM/USD", base: "ATOM", quote: "USD", status: "cancel_only" },
    });
    expect(resolveWatchlistInstruments(["ATOM", "FAKE"], registry).map(x => x.state))
      .toEqual(["KRAKEN_MARKET_NOT_ONLINE", "NO_KRAKEN_USD_MARKET"]);
  });
});


describe("Kraken tick-size limits", () => {
  it("rounds buy limits down to the nearest valid tick", () => {
    expect(snapBuyLimitToTick(138.437,0.1)).toBe(138.4);
    expect(snapBuyLimitToTick(0.123456,0.0001)).toBe(0.1234);
  });
});
