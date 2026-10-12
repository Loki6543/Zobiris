import { describe, expect, it } from "vitest";
import { parseCoinGeckoMarkets, parseKrakenDailyCloses, parseKrakenUsdPairs, parsePaprikaFirstSeen, type MarketCoin } from "../strategyV2/feed";
import { evaluateRotation } from "../strategyV2/rotation";
import { buildStrategyReport, matchCoin, tierFor } from "../strategyV2/report";
import { screenSmallCap } from "../strategyV2/smallCapScreen";
import { historyCandidates } from "../server/strategyV2Service";
import { CMC_WATCHLIST } from "../strategyV2/watchlist";
import { verifiedUnlockShare } from "../strategyV2/unlockOverrides";

const coin = (o: Partial<MarketCoin> & { symbol: string; rank: number }): MarketCoin => ({
  geckoId: o.symbol.toLowerCase(), name: o.symbol, priceUsd: 2, marketCapUsd: 300e6, fdvUsd: 330e6, volume24hUsd: 15e6,
  circulatingSupply: 150e6, totalSupply: 165e6, maxSupply: null, athChangePct: -85, change24hPct: 1, change7dPct: 4,
  change30dPct: 6, change200dPct: -30, change1yPct: -50, lastUpdated: null, sparkline7d: [], ...o,
});
const regimeOn = { allowTop100Rotation: true, allowSmallCapBets: true, state: "RISK_ON" as const, realizedVolAnnualPct: 40 };

describe("free feed parsers", () => {
  it("parses CoinGecko markets and keeps nulls honest", () => {
    const [c] = parseCoinGeckoMarkets([{ id: "celestia", symbol: "tia", name: "Celestia", market_cap_rank: 112, current_price: 1.5, market_cap: 1e9,
      fully_diluted_valuation: null, total_volume: 5e7, price_change_percentage_7d_in_currency: 3.2, ath_change_percentage: -92 }, { bad: true }]);
    expect(c).toMatchObject({ symbol: "TIA", rank: 112, fdvUsd: null, change7dPct: 3.2, athChangePct: -92, change30dPct: null });
    expect(() => parseCoinGeckoMarkets({ status: { error_code: 429 } })).toThrow();
  });
  it("keeps the best-ranked CoinPaprika coin for a shared ticker", () => {
    const m = parsePaprikaFirstSeen([{ symbol: "UNI", rank: 900, first_data_at: "2024-01-01T00:00:00Z", name: "Other" },
      { symbol: "UNI", rank: 30, first_data_at: "2020-09-17T00:00:00Z", name: "Uniswap" }, { symbol: "X", rank: 0 }]);
    expect(m.get("UNI")?.name).toBe("Uniswap");
    expect(m.has("X")).toBe(false);
  });
  it("maps Kraken USD pairs with XBT/XDG aliases and skips non-USD or offline pairs", () => {
    const m = parseKrakenUsdPairs({ error: [], result: {
      XXBTZUSD: { wsname: "XBT/USD", status: "online" }, XDGUSD: { wsname: "XDG/USD" }, TIAEUR: { wsname: "TIA/EUR" },
      TIAUSD: { wsname: "TIA/USD", status: "online" }, OLDUSD: { wsname: "OLD/USD", status: "delisted" } } });
    expect([...m.entries()]).toEqual([["BTC", "XXBTZUSD"], ["DOGE", "XDGUSD"], ["TIA", "TIAUSD"]]);
  });
  it("drops Kraken's still-forming last daily candle", () => {
    const rows = [[1, "1", "1", "1", "10"], [2, "1", "1", "1", "11"], [3, "1", "1", "1", "99"]];
    expect(parseKrakenDailyCloses({ error: [], result: { TIAUSD: rows, last: 3 } })).toEqual([10, 11]);
    expect(() => parseKrakenDailyCloses({ error: ["EQuery:Unknown asset pair"] })).toThrow();
  });
});

describe("top-100 delayed rotation", () => {
  const btc = { btcChange7dPct: 1, btcChange30dPct: 5, btcChange200dPct: 20 };
  const base = { symbol: "DOT", rank: 40, priceUsd: 4, change7dPct: 6, change30dPct: -2, change200dPct: -25, ...btc };
  it("qualifies a laggard that just started recovering and sets a pullback limit", () => {
    const r = evaluateRotation(base, regimeOn);
    expect(r.status).toBe("QUALIFIED");
    expect(r.pullbackPct).toBe(4);
    expect(r.limitPriceUsd).toBeCloseTo(3.84);
  });
  it("waits on still-lagging, chasing, and leaders; avoids value traps", () => {
    expect(evaluateRotation({ ...base, change7dPct: 0 }, regimeOn).status).toBe("TOO_EARLY");
    expect(evaluateRotation({ ...base, change7dPct: 30 }, regimeOn).status).toBe("EXTENDED");
    expect(evaluateRotation({ ...base, change30dPct: 10, change200dPct: 25 }, regimeOn).status).toBe("NOT_LAGGING");
    expect(evaluateRotation({ ...base, change200dPct: -80 }, regimeOn).status).toBe("STRUCTURALLY_WEAK");
    expect(evaluateRotation({ ...base, change7dPct: null }, regimeOn).status).toBe("DATA_INSUFFICIENT");
  });
  it("is blocked by a RISK OFF regime", () => {
    const r = evaluateRotation(base, { ...regimeOn, allowTop100Rotation: false, state: "RISK_OFF" });
    expect(r.status).toBe("REGIME_BLOCKED");
    expect(r.limitPriceUsd).toBeNull();
  });
});

describe("small-cap free-data proxies", () => {
  const input = { symbol: "TIA", cmcRank: 112, marketCapUsd: 300e6, fullyDilutedValueUsd: 330e6, volume24hUsd: 15e6, ageDays: 900, krakenListed: true,
    change30dPct: 6, change90dPct: -30, btcChange30dPct: 5, drawdownFromAthPct: -85, priceAboveSma50: true, unlockShareNext60d: null };
  it("uses circulating/minted supply when no unlock schedule exists", () => {
    expect(screenSmallCap({ ...input, unlockedSupplyShare: 0.9 }, regimeOn).notes).toContain("UNLOCK_RISK_FROM_SUPPLY_PROXY");
    expect(screenSmallCap({ ...input, unlockedSupplyShare: 0.5 }, regimeOn).rejections).toContain("UNLOCK_RISK_TOO_MUCH_SUPPLY_LOCKED");
    expect(screenSmallCap(input, regimeOn).rejections).toContain("UNLOCK_SCHEDULE_UNKNOWN");
  });
  it("prefers a fresh verified unlock schedule and expires stale ones", () => {
    const now = Date.parse("2026-10-20T00:00:00Z");
    expect(verifiedUnlockShare("tia", now)?.share60d).toBe(0.017);
    expect(verifiedUnlockShare("TIA", Date.parse("2027-01-15T00:00:00Z"))).toBeNull();
    expect(verifiedUnlockShare("NOPE", now)).toBeNull();
    expect(screenSmallCap({ ...input, unlockShareNext60d: 0.017 }, regimeOn).notes).toContain("UNLOCK_SCHEDULE_VERIFIED");
    expect(screenSmallCap({ ...input, unlockShareNext60d: 0.09 }, regimeOn).rejections).toContain("LARGE_UNLOCK_WITHIN_60D");
  });
  it("rejects stablecoins", () => {
    const r = screenSmallCap({ ...input, unlockedSupplyShare: 1, priceUsd: 1.0, change7dPct: 0.1, change30dPct: 0.2 }, regimeOn);
    expect(r.rejections).toContain("STABLECOIN_OR_PEGGED_ASSET");
  });
});

describe("watchlist matching and report", () => {
  it("tiers by rank", () => {
    expect([tierFor(1), tierFor(100), tierFor(101), tierFor(500), tierFor(501), tierFor(null)]).toEqual(["TOP_100", "TOP_100", "RANK_101_500", "RANK_101_500", "OUTSIDE_STRATEGY", "OUTSIDE_STRATEGY"]);
  });
  it("refuses a ticker collision with an unrelated, far-ranked coin", () => {
    const market = [coin({ symbol: "UNT", name: "Unit Protocol", rank: 480 })];
    expect(matchCoin({ symbol: "UNT", name: "Universal Token", cmcRankAtImport: 40 }, market)).toEqual({ coin: null, note: "SYMBOL_COLLISION_DIFFERENT_COIN" });
  });
  it("prefers same name, then nearest rank, among duplicate tickers", () => {
    const market = [coin({ symbol: "ACU", name: "Acurast", rank: 300 }), coin({ symbol: "ACU", name: "Other", rank: 120 })];
    expect(matchCoin({ symbol: "ACU", name: "Acurast", cmcRankAtImport: 130 }, market).coin?.rank).toBe(300);
    expect(matchCoin({ symbol: "ACU", name: "Nope", cmcRankAtImport: 130 }, market)).toMatchObject({ note: "AMBIGUOUS_SYMBOL_MATCHED_BY_RANK" });
  });
  it("only spends Kraken history requests on liquid, listed, non-stable rank 101-500 coins", () => {
    const pairs = new Map([["TIA", "TIAUSD"], ["USDX", "USDXUSD"], ["ETH", "XETHZUSD"]]);
    const got = historyCandidates([coin({ symbol: "ETH", rank: 2 }), coin({ symbol: "TIA", rank: 112 }), coin({ symbol: "NOPE", rank: 150 }),
      coin({ symbol: "USDX", rank: 130, priceUsd: 1, change30dPct: 0.1 })], pairs);
    expect(got.map((c) => c.symbol)).toEqual(["TIA"]);
  });
  it("builds decisions for the imported CMC watchlist", () => {
    const closes = Array.from({ length: 400 }, (_, i) => 30000 * Math.exp(0.003 * i + 0.03 * (i % 2 ? 1 : -1) * 0.1));
    const market = [coin({ symbol: "BTC", geckoId: "bitcoin", name: "Bitcoin", rank: 1, change7dPct: 1, change30dPct: 5, change200dPct: 20 }),
      coin({ symbol: "DOT", name: "Polkadot", rank: 40, change7dPct: 6, change30dPct: -2, change200dPct: -25 }),
      coin({ symbol: "TIA", name: "Celestia", rank: 112 })];
    const r = buildStrategyReport({ now: Date.parse("2026-10-12T00:00:00Z"), btcDailyCloses: closes, market,
      krakenPairs: new Map([["BTC", "XXBTZUSD"], ["DOT", "DOTUSD"], ["TIA", "TIAUSD"]]),
      firstSeen: new Map([["TIA", { firstDataAt: "2023-10-31T00:00:00Z", rank: 112, name: "Celestia" }]]),
      coinDailyCloses: new Map([["TIA", Array.from({ length: 60 }, (_, i) => 1 + i / 100)]]),
      watchlist: [{ symbol: "BTC", name: "Bitcoin", cmcRankAtImport: 1 }, { symbol: "DOT", name: "Polkadot", cmcRankAtImport: 40 },
        { symbol: "TIA", name: "Celestia", cmcRankAtImport: 112 }, { symbol: "ZZZ", name: "Tiny", cmcRankAtImport: 900 }] });
    expect(r.regime.state).toBe("RISK_ON");
    const by = Object.fromEntries(r.watchlist.map((w) => [w.symbol, w]));
    expect(by.BTC!.signal).toMatch(/^Benchmark/);
    expect(by.DOT!.rotation?.status).toBe("QUALIFIED");
    expect(by.TIA!.smallCap?.eligible).toBe(true);
    expect(by.ZZZ!.signal).toBe("Outside strategy (rank > 500)");
    expect(r.marketSmallCapCandidates.map((c) => c.symbol)).toEqual(["TIA"]);
    expect(r.btcSeries).toHaveLength(365);
    expect(r.btcSeries.at(-1)!.sma200).not.toBeNull();
    expect(r.regimeComponents.reduce((s, c) => s + c.points, 0)).toBe(r.regime.score);
    expect(r.rotationMap.map((p) => p.symbol)).toEqual(["DOT"]);
    expect(r.screenFunnel[0]).toEqual({ stage: "Ranked 101–500", remaining: 1 });
    expect(r.screenFunnel.at(-1)!.remaining).toBe(1);
    expect(r.screenFunnel.every((s, i, a) => i === 0 || s.remaining <= a[i - 1]!.remaining)).toBe(true);
  });
  it("ships the owner's CoinMarketCap watchlist", () => {
    expect(CMC_WATCHLIST.length).toBe(79);
    expect(new Set(CMC_WATCHLIST.map((w) => w.symbol + w.name)).size).toBe(79);
  });
});
