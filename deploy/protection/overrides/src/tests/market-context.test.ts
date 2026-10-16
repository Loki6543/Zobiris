import { describe, expect, it } from "vitest";
import { matchGovernance, parseCoinMetricsFlows, parseDeribitInstrument, parseDeribitOptions } from "../strategyV2/marketContext";
import { exploitsByName, parseLlamaHacks } from "../strategyV2/exploits";
import { legitimacyScore } from "../strategyV2/legitimacy";

const NOW = Date.UTC(2026, 9, 16, 10);
const day = (d: number) => Math.floor((NOW - d * 86_400_000) / 1000);

describe("DefiLlama exploits", () => {
  const raw = [
    { date: day(10), name: "Shiny Finance", amount: 4_200_000, technique: "Private key compromise" },
    { date: day(20), name: "Shiny Finance", amount: 1_500_000, technique: "Oracle" },
    { date: day(200), name: "Old Protocol", amount: 9e7, technique: "x" },     // outside 90 days
    { date: day(5), name: "Tiny Dex", amount: 300_000, technique: "x" },        // under $1M
    { date: day(5), name: "Ab", amount: 5e6, technique: "x" },                  // name too short to match safely
  ];
  it("keeps material exploits inside the window and the largest per project", () => {
    const list = parseLlamaHacks(raw, NOW);
    expect(list.map((e) => e.name)).toEqual(["Shiny Finance", "Shiny Finance"]);
    expect(exploitsByName(list).get("shinyfinance")!.amountUsd).toBe(4_200_000);
    expect(() => parseLlamaHacks({}, NOW)).toThrow();
  });
  it("lowers legitimacy and raises a red flag, never adds points", () => {
    const dil: any = { profile: { whitepaper: "w", homepage: "h", twitter: "t" }, security: { status: "PASS", vetoes: [], top10HolderPct: 20, dexLiquidityUsd: 2e6 }, repo: null };
    const base = legitimacyScore({ diligence: dil, ageDays: 400, krakenListed: false, volume24hUsd: 1e7, now: NOW });
    const hit = legitimacyScore({ diligence: dil, ageDays: 400, krakenListed: false, volume24hUsd: 1e7, now: NOW, exploit: parseLlamaHacks(raw, NOW)[0] });
    expect(hit.score).toBe(base.score - 20);
    expect(hit.redFlags).toContain("RECENT_EXPLOIT");
  });
});

describe("Deribit options context", () => {
  it("parses instrument names", () => {
    expect(parseDeribitInstrument("BTC-27NOV26-73000-P")).toEqual({ expiry: Date.UTC(2026, 10, 27, 8), strike: 73000, put: true });
    expect(parseDeribitInstrument("BTC-PERPETUAL")).toBeNull();
  });
  it("weights near-money IV by open interest and computes put/call OI over all strikes", () => {
    const u = 82_000, rows = [
      { instrument_name: "BTC-27NOV26-80000-C", open_interest: 300, mark_iv: 40, underlying_price: u },
      { instrument_name: "BTC-27NOV26-84000-P", open_interest: 100, mark_iv: 48, underlying_price: u },
      { instrument_name: "BTC-27NOV26-50000-P", open_interest: 500, mark_iv: 90, underlying_price: u }, // far OTM: ratio only
      { instrument_name: "BTC-18OCT26-82000-C", open_interest: 900, mark_iv: 70, underlying_price: u }, // under 7 days
    ];
    const o = parseDeribitOptions({ result: rows }, NOW);
    expect(o.nearMoneyIvPct).toBe(42);
    expect(o.putCallOiRatio).toBe(0.5);
    expect(() => parseDeribitOptions({ result: [] }, NOW)).toThrow();
  });
});

describe("Coin Metrics flows", () => {
  it("reports the latest day's netflow, the 7-day sum and the preliminary flag", () => {
    const rows = [13, 14, 15].map((d, k) => ({ asset: "btc", time: `2026-10-${d}T00:00:00.000000000Z`, AdrActCnt: String(650_000 + k), FlowInExUSD: String(2e9 + k * 1e8), FlowOutExUSD: "2.05e9", "FlowInExUSD-status": "flash" }));
    const f = parseCoinMetricsFlows({ data: rows });
    expect(f.day).toBe("2026-10-15");
    expect(f.netflowUsd).toBe(150_000_000);
    expect(f.netflow7dUsd).toBe(-50_000_000 + 50_000_000 + 150_000_000);
    expect(f.preliminary).toBe(true);
    expect(f.activeAddresses30dAvg).toBeNull(); // fewer than 20 days
    expect(() => parseCoinMetricsFlows({ data: [] })).toThrow();
  });
});

describe("Snapshot governance matching", () => {
  const market = [{ geckoId: "telcoin", symbol: "TEL", name: "Telcoin" }, { geckoId: "arbitrum", symbol: "ARB", name: "Arbitrum" }, { geckoId: "ethereum", symbol: "ETH", name: "Ethereum" }];
  const end = Math.floor(NOW / 1000) + 86_400;
  const raw = { data: { proposals: [
    { id: "0x1", title: "TELIP 18", end, space: { id: "telcointreasurycouncil.eth", name: "Telcoin Treasury Council", coingecko: "telcoin", symbol: "TcNFT" } },
    { id: "0x2", title: "Adopt USDG", end, space: { id: "arbitrumfoundation.eth", name: "Arbitrum DAO", coingecko: null, symbol: "ARB" } },
    { id: "0x3", title: "Some vote", end, space: { id: "random.eth", name: "Random Club", coingecko: null, symbol: "ETH" } }, // ETH-weighted, not Ethereum
    { id: "0x4", title: "Closed", end: end - 2 * 86_400, space: { id: "telcointreasurycouncil.eth", name: "Telcoin", coingecko: "telcoin", symbol: "TEL" } },
  ] } };
  it("matches by CoinGecko id, or by ticker only when the space is named after the coin", () => {
    const v = matchGovernance(raw, market, NOW);
    expect(v.map((x) => x.symbol)).toEqual(["TEL", "ARB"]);
    expect(v[0]!.url).toContain("telcointreasurycouncil.eth");
    expect(() => matchGovernance({}, market, NOW)).toThrow();
  });
});
