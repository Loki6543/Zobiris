import { describe, expect, it } from "vitest";
import { classifyBinanceTitle, noticesBySymbol, parseBinanceNotices, parseUpbitNotices, tickersIn } from "../strategyV2/exchangeNotices";
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
    // current endpoint (api/v1/announcements): data.notices with English titles and listed_at
    const en = parseUpbitNotices({ data: { notices: [{ title: "Market Support for Reserve Rights(RSR) (KRW, USDT Market)", listed_at: "2026-10-12T13:54:09+09:00" }, { title: "End of Trading Support for Foo(FOO)", listed_at: "2026-10-12T10:00:00+09:00" }, { title: "Temporary Suspension of FIL Deposits and Withdrawals", listed_at: "2026-10-12T11:00:00+09:00" }] } });
    expect(en.map((n) => [n.kind, n.symbols])).toEqual([["LISTING", ["RSR"]], ["DELIST", ["FOO"]]]);
    expect(classifyBinanceTitle("Binance Alpha Will Remove SUP, CUDIS (2026-10-09)")).toBeNull();
    const by = noticesBySymbol([...b, ...u], now);
    expect([by.get("AKRO")?.kind, by.get("FOO")?.kind, by.get("BLZ")?.kind]).toEqual(["DELIST", "LISTING", "DELIST"]);
  });
  it("vetoes coins with a delisting", () => {
    const now = Date.UTC(2026, 9, 12);
    const coin = (id: string, rank: number) => ({ geckoId: id, symbol: id.toUpperCase(), name: id, rank, priceUsd: 1, marketCapUsd: 200e6, fdvUsd: 220e6, volume24hUsd: 20e6, circulatingSupply: 1, totalSupply: 1, maxSupply: null, athChangePct: -75, change24hPct: 1, change7dPct: 6, change30dPct: -10, change200dPct: -40, change1yPct: -50, lastUpdated: null, sparkline7d: [] });
    const notices = noticesBySymbol([{ kind: "DELIST", exchange: "Binance", symbols: ["DEAD"], title: "x", at: new Date(now - 86_400_000).toISOString() }], now);
    const out = scoreOpenings({ now, market: [coin("dead", 150), coin("hot", 160)], btc7dPct: 1, btc30dPct: 2, btcCloses: [], closesBySymbol: new Map(), volumeHistory: new Map(), trending: new Map(), aiCategory: new Set(), diligence: new Map(), firstSeen: new Map(), krakenPairs: new Map(), aiWatchlist: [], allowNewBuys: true, notices });
    const by = (s: string) => out.find((o) => o.symbol === s)!;
    expect([by("DEAD").verdict, by("DEAD").reasons]).toEqual(["AVOID", expect.arrayContaining(["BINANCE_DELIST"])]);
  });
});
