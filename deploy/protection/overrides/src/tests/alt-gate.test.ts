import { describe, expect, it } from "vitest";
import { breadth30d, computeAltGate, dominanceTrend, parseStablecoinSupply } from "../strategyV2/altGate";
import type { MarketCoin } from "../strategyV2/feed";

const coin = (symbol: string, rank: number, mcap: number, ch30: number, price = 10): MarketCoin => ({
  geckoId: symbol.toLowerCase(), symbol, name: symbol, rank, priceUsd: price, marketCapUsd: mcap, fdvUsd: mcap, volume24hUsd: mcap / 20,
  circulatingSupply: 1, totalSupply: 1, maxSupply: null, athChangePct: -50, change24hPct: 0, change7dPct: 0, change30dPct: ch30,
  change200dPct: 0, change1yPct: 0, lastUpdated: null, sparkline7d: [],
});
const market = (btc30: number, alt30: number) => [coin("BTC", 1, 600, btc30), ...Array.from({ length: 60 }, (_, i) => coin("A" + i, i + 2, 400 / 60, alt30))];

describe("altcoin gate", () => {
  it("estimates the 30-day change in BTC's top-100 share", () => {
    const flat = dominanceTrend(market(10, 10));
    expect(flat.now).toBeCloseTo(60);
    expect(flat.change30dPts).toBeCloseTo(0, 6);
    expect(dominanceTrend(market(20, 0)).change30dPts!).toBeGreaterThan(1);
  });
  it("measures breadth without stablecoins", () => {
    const m = [...market(5, 5), coin("USDT", 3, 50, 0.1, 1)];
    expect(breadth30d(m)).toBe(1);
  });
  it("reads DefiLlama total USD stablecoin supply and its 30-day change", () => {
    const rows = Array.from({ length: 40 }, (_, i) => ({ date: String(1_000_000 + i * 86400), totalCirculatingUSD: { peggedUSD: 100 + i } }));
    const s = parseStablecoinSupply(rows);
    expect(s.supplyUsd).toBe(139);
    expect(s.change30dPct).toBeCloseTo((139 / 109 - 1) * 100);
  });
  it("opens only when every known check passes; unknown inputs never block", () => {
    expect(computeAltGate({ btcAbove200d: true, market: market(10, 10), stablecoins: { supplyUsd: 1, change30dPct: 1 } }).state).toBe("ROTATION_OPEN");
    expect(computeAltGate({ btcAbove200d: true, market: market(25, 0), stablecoins: null }).state).toBe("BTC_CONCENTRATING");
    expect(computeAltGate({ btcAbove200d: true, market: market(10, 10), stablecoins: { supplyUsd: 1, change30dPct: -2 } }).state).toBe("DEFENSIVE_CASH");
    expect(computeAltGate({ btcAbove200d: true, market: market(-5, -5), stablecoins: null }).state).toBe("BREADTH_WEAK");
    expect(computeAltGate({ btcAbove200d: false, market: market(10, 10), stablecoins: null }).state).toBe("BTC_DOWNTREND");
    const unknown = computeAltGate({ btcAbove200d: null, market: [], stablecoins: null });
    expect([unknown.state, unknown.allowAltEntries]).toEqual(["ROTATION_OPEN", true]);
  });
});
