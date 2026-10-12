import { describe, expect, it } from "vitest";
import { classifyBinanceTitle, noticesBySymbol, parseBinanceNotices, parseUpbitNotices, tickersIn } from "../strategyV2/exchangeNotices";
import { leverageFlag, parseHyperliquidCtxs } from "../strategyV2/leverage";
import { scoreOpenings } from "../strategyV2/openings";

describe("exchange notices", () => {
  it("classifies Binance titles and extracts tickers", () => {
    expect(classifyBinanceTitle("Binance Will Delist AKRO, BLZ, WRX on 2026-10-20")).toBe("DELIST");
    expect(classifyBinanceTitle("Notice of Removal of Spot Trading Pairs - 2026-10-14")).toBeNull();
    expect(classifyBinanceTitle("Binance Will Delist ABC Perpetual Futures")).toBeNull();
    expect(classifyBinanceTitle("Binance Will Extend the Monitoring Tag to Include ALPACA and PDA")).toBe("MONITORING_TAG");
    expect(classifyBinanceTitle("Binance Announced the Removal of Monitoring Tag for XYZ")).toBeNull();
    expect(tickersIn("Binance Will Delist AKRO, BLZ, WRX on 2026-10-20")).toEqual(["AKRO", "BLZ", "WRX"]);
    expect(tickersIn("Binance Will List Foo (FOO) with Seed Tag")).toEqual(["FOO"]);
  });
  it("parses both feeds and keeps the riskiest recent notice per symbol", () => {
    const now = Date.UTC(2026, 9, 12);
    const b = parseBinanceNotices({ data: { catalogs: [{ articles: [{ title: "Binance Will Delist AKRO, BLZ on 2026-10-20", releaseDate: now - 86_400_000 }, { title: "Binance Will List Foo (FOO)", releaseDate: now - 3_600_000 }] }] } });
    const u = parseUpbitNotices({ data: { list: [{ title: "[거래] 아크로폴리스(AKRO) 거래지원 종료 안내", created_at: "2026-10-11T10:00:00+09:00" }, { title: "[주의] 블루젤리(BLZ) 유의 종목 지정 해제", created_at: "2026-10-11T10:00:00+09:00" }] } });
    expect(u.map((n) => [n.kind, n.symbols])).toEqual([["DELIST", ["AKRO"]]]);
    const by = noticesBySymbol([...b, ...u], now);
    expect([by.get("AKRO")?.kind, by.get("FOO")?.kind, by.get("BLZ")?.kind]).toEqual(["DELIST", "LISTING", "DELIST"]);
  });
  it("reads Hyperliquid funding/OI and flags crowded leverage", () => {
    const p = parseHyperliquidCtxs([{ universe: [{ name: "ABC" }, { name: "kPEPE" }] }, [{ funding: "0.0000125", openInterest: "1000000", markPx: "2", dayNtlVlm: "5e6" }, { funding: "0.0001", openInterest: "10", markPx: "1" }]]);
    expect(p.get("ABC")!.fundingAprPct).toBeCloseTo(10.95, 1);
    expect(p.has("PEPE")).toBe(true);
    expect(leverageFlag(p.get("PEPE"), 1e9)).toBe("CROWDED_LONG"); // ~88% APR
    expect(leverageFlag(p.get("ABC"), 10e6)).toBe("CROWDED_LONG"); // OI 20% of mcap with positive funding
    expect(leverageFlag(p.get("ABC"), 1e9)).toBeNull();
  });
  it("vetoes coins with a delisting and halves the first tranche on crowded leverage", () => {
    const now = Date.UTC(2026, 9, 12);
    const coin = (id: string, rank: number) => ({ geckoId: id, symbol: id.toUpperCase(), name: id, rank, priceUsd: 1, marketCapUsd: 200e6, fdvUsd: 220e6, volume24hUsd: 20e6, circulatingSupply: 1, totalSupply: 1, maxSupply: null, athChangePct: -75, change24hPct: 1, change7dPct: 6, change30dPct: -10, change200dPct: -40, change1yPct: -50, lastUpdated: null, sparkline7d: [] });
    const notices = noticesBySymbol([{ kind: "DELIST", exchange: "Binance", symbols: ["DEAD"], title: "x", at: new Date(now - 86_400_000).toISOString() }], now);
    const perps = new Map([["HOT", { fundingAprPct: 80, openInterestUsd: 1e6, dayVolumeUsd: 1e6 }]]);
    const out = scoreOpenings({ now, market: [coin("dead", 150), coin("hot", 160)], btc7dPct: 1, btc30dPct: 2, btcCloses: [], closesBySymbol: new Map(), volumeHistory: new Map(), trending: new Map(), aiCategory: new Set(), diligence: new Map(), firstSeen: new Map(), krakenPairs: new Map(), aiWatchlist: [], allowNewBuys: true, notices, perps });
    const by = (s: string) => out.find((o) => o.symbol === s)!;
    expect([by("DEAD").verdict, by("DEAD").reasons]).toEqual(["AVOID", expect.arrayContaining(["BINANCE_DELIST"])]);
    expect(by("HOT").labels).toContain("CROWDED_LONG");
    expect(by("HOT").firstTranchePct).toBeCloseTo(2.5 / 3 / 2, 3);
  });
});
