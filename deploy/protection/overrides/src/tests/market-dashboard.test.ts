import { describe, expect, it } from "vitest";
import { macd, rsi, sma, technicalRead } from "../strategyV2/indicators";
import { parseCoinGeckoGlobal, parseFearGreed, parseKrakenDailyCandles } from "../strategyV2/feed";
import { valueSeries } from "../ui/PortfolioOverview";
import { equalWeightIndex } from "../ui/WatchlistInsights";
import { parseSymbols } from "../server/marketOverviewService";

describe("technical indicators", () => {
  it("RSI is 100 on a pure uptrend, 0-ish on a pure downtrend, null when short", () => {
    const up = Array.from({ length: 40 }, (_, i) => 100 + i);
    expect(rsi(up)).toBe(100);
    expect(rsi([...up].reverse())!).toBeLessThan(1);
    expect(rsi(up.slice(0, 10))).toBeNull();
  });
  it("MACD is positive in a steady uptrend and null when short", () => {
    const up = Array.from({ length: 120 }, (_, i) => 100 * Math.exp(0.01 * i));
    expect(macd(up)!.macd).toBeGreaterThan(0);
    expect(macd(up.slice(0, 20))).toBeNull();
    expect(technicalRead(up).macdLabel).toMatch(/^Bull/);
    expect(sma([1, 2, 3, 4], 2)).toBe(3.5);
  });
});

describe("new free feeds", () => {
  it("keeps OHLCV and drops the forming candle", () => {
    const c = parseKrakenDailyCandles({ result: { X: [[1, "1", "3", "0.5", "2", "0", "10"], [2, "2", "2", "2", "2", "0", "1"]], last: 2 } });
    expect(c).toEqual([{ time: 1, open: 1, high: 3, low: 0.5, close: 2, volume: 10 }]);
  });
  it("hides a corrupt aggregate volume from CoinGecko /global", () => {
    const g = parseCoinGeckoGlobal({ data: { total_market_cap: { usd: 2.8e12 }, total_volume: { usd: 4.29e14 }, market_cap_percentage: { btc: 59.6 } } });
    expect(g.totalVolumeUsd).toBeNull();
    expect(g.btcDominancePct).toBe(59.6);
  });
  it("returns Fear & Greed oldest first", () => {
    const f = parseFearGreed({ data: [{ value: "69", value_classification: "Greed", timestamp: "200" }, { value: "50", value_classification: "Neutral", timestamp: "100" }] });
    expect(f.map((x) => x.value)).toEqual([50, 69]);
  });
  it("sanitises requested symbols", () => {
    expect(parseSymbols("btc, eth,BTC,../etc,SOL")).toEqual(["BTC", "ETH", "SOL"]);
  });
});

describe("dashboard series", () => {
  it("values current holdings at past closes, starting when every coin has a price", () => {
    const day = 86400;
    const series = { BTC: [[10 * day, 100], [11 * day, 110], [12 * day, 120]] as Array<[number, number]>, ETH: [[11 * day, 10], [12 * day, 12]] as Array<[number, number]> };
    const rows = [{ symbol: "BTC", quantity: 1, value: 120 }, { symbol: "ETH", quantity: 2, value: 24 }, { symbol: "XYZ", quantity: 5, value: 7 }];
    expect(valueSeries(rows, series, 50)).toEqual([[11 * day, 110 + 20 + 7 + 50], [12 * day, 120 + 24 + 7 + 50]]);
  });
  it("builds an equal-weight 7-day index rebased to zero", () => {
    const q = (s: number[]) => ({ symbol: "A", name: "A", rank: 1, priceUsd: 1, change24hPct: 0, change7dPct: 0, marketCapUsd: 1, volume24hUsd: 1, circulatingSupply: 1, maxSupply: null, sparkline7d: s });
    const idx = equalWeightIndex([q(Array.from({ length: 11 }, (_, i) => 100 + i * 10)), q(Array.from({ length: 11 }, () => 5))], 1_000_000);
    expect(idx[0]![1]).toBe(0);
    expect(idx.at(-1)![1]).toBeCloseTo(50);
    expect(idx.at(-1)![0]).toBe(1_000_000);
  });
});
