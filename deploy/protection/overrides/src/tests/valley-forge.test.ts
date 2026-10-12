import { afterEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { BASE_MIX, POSTURE_MIX, SLEEVES, currentMix, detectPosture, firstTranchePct, planAllocation, type PostureInput } from "../strategyV2/valleyForge";
import { classifyVolume, volumeShock } from "../strategyV2/volumeShock";
import { legitimacyScore } from "../strategyV2/legitimacy";
import { parseCoinDetail, type Diligence } from "../strategyV2/diligence";
import { scoreOpenings, valueFactor, type OpeningsInput } from "../strategyV2/openings";
import { parseStablePools } from "../strategyV2/stableYield";
import { parseAiWatchlist } from "../strategyV2/aiWatchlist";
import { halfRecoveryUpsidePct, cvar95Pct, betaToBtc } from "../strategyV2/riskMetrics";
import { summarizeSignals, type LedgerRow } from "../strategyV2/ledger";
import { recordMarketDay, resetMarketHistoryCache, volumeHistory } from "../server/marketHistoryService";
import type { BtcRegime } from "../strategyV2/btcRegime";
import type { MarketCoin } from "../strategyV2/feed";

const regime = (over: Partial<BtcRegime> = {}): BtcRegime => ({
  state: "RISK_ON", score: 4, close: 100, sma50: 95, sma200: 80, sma140: 85, mayerMultiple: 1.25, sma200Rising: true, realizedVolAnnualPct: 45,
  drawdownFrom365dHighPct: -10, exposureMultiplier: 1, allowTop100Rotation: true, allowSmallCapBets: true, capitulationWatch: false, reasons: [], ...over,
});
const gate = (over: Record<string, unknown> = {}) => ({ state: "ROTATION_OPEN", allowAltEntries: true, dominanceNowPct: 60, dominanceChange30dPts: 0.2, stablecoinSupplyUsd: 3e11, stablecoinChange30dPct: 1, breadth30dPositive: 0.6, checks: [], ...over }) as any;
const input = (over: Partial<PostureInput> = {}): PostureInput => ({ regime: regime(), altGate: gate(), fearGreed: 55, stablePrices: [{ symbol: "USDT", priceUsd: 1 }, { symbol: "USDC", priceUsd: 1 }], recentRegimes: ["RISK_ON", "RISK_ON"], coreFeedsOk: true, ...over });

describe("Valley Forge allocation", () => {
  it("keeps every posture's mix at 100% with cash inside the 10-60% band and some exposure in every phase", () => {
    for (const mix of Object.values(POSTURE_MIX)) {
      expect(SLEEVES.reduce((s, k) => s + mix[k], 0)).toBe(100);
      expect(mix.cash).toBeGreaterThanOrEqual(10);
      expect(mix.cash).toBeLessThanOrEqual(60);
      expect(mix.top100 + mix.rank101_200 + mix.rank201_500 + mix.speculative).toBeGreaterThan(30);
    }
    expect(BASE_MIX).toEqual({ cash: 30, stableYield: 8, top100: 27, rank101_200: 20, rank201_500: 10, speculative: 5 });
  });
  it("maps market phases to the protocol's postures", () => {
    expect(detectPosture(input()).posture).toBe("RECOVERY");
    expect(detectPosture(input({ fearGreed: 85 })).posture).toBe("EUPHORIA");
    expect(detectPosture(input({ regime: regime({ mayerMultiple: 2.2 }) })).posture).toBe("EUPHORIA");
    expect(detectPosture(input({ regime: regime({ state: "RISK_OFF", score: -4, capitulationWatch: true, drawdownFrom365dHighPct: -55 }), fearGreed: 10 })).posture).toBe("CAPITULATION");
    expect(detectPosture(input({ regime: regime({ state: "RISK_OFF", score: -3 }), fearGreed: 35 })).posture).toBe("DETERIORATION");
    expect(detectPosture(input({ recentRegimes: ["RISK_OFF", "NEUTRAL", "RISK_ON"] })).posture).toBe("TRANSITION");
    expect(detectPosture(input({ regime: regime({ state: "NEUTRAL", score: 1 }) })).posture).toBe("EXPLORATION");
    const depeg = detectPosture(input({ stablePrices: [{ symbol: "USDT", priceUsd: 0.95 }] }));
    expect([depeg.posture, depeg.allowNewBuys]).toEqual(["INTEGRITY", false]);
    // capitulation needs the stablecoin base intact; money fleeing is an integrity problem instead
    expect(detectPosture(input({ regime: regime({ state: "RISK_OFF", capitulationWatch: true }), altGate: gate({ stablecoinChange30dPct: -6 }) })).posture).toBe("INTEGRITY");
  });
  it("turns holdings into a mix and plans trades only outside the drift band", () => {
    const mix = currentMix([{ symbol: "BTC", rank: 1, valueUsd: 500, isStable: false }, { symbol: "XYZ", rank: 150, valueUsd: 100, isStable: false }, { symbol: "USDC", rank: 5, valueUsd: 100, isStable: true }], 300)!;
    expect(mix.cash).toBeCloseTo(40);
    expect(mix.top100).toBeCloseTo(50);
    const plan = planAllocation(detectPosture(input()), mix);
    const row = (s: string) => plan.rows.find((r) => r.sleeve === s)!;
    expect(row("top100").action).toMatch(/^Trim about 23\.0 pts/);
    expect(row("rank101_200").action).toMatch(/^Add about 10\.0 pts in 3 tranches/);
    expect(row("speculative").minPositions).toBe(7);
    expect(firstTranchePct("speculative", "X")).toBe(0.25);
    expect(firstTranchePct("top100", "BTC")).toBe(5);
  });
});

describe("volume shocks", () => {
  it("classifies by the price response to unusual volume", () => {
    expect(classifyVolume(4, 12, 20)).toBe("BREAKOUT");
    expect(classifyVolume(2.5, 1, 3)).toBe("ACCUMULATION");
    expect(classifyVolume(3.5, -15, -20)).toBe("CAPITULATION_FLUSH");
    expect(classifyVolume(2.2, -6, 40)).toBe("DISTRIBUTION");
    expect(classifyVolume(0.3, -2, -8)).toBe("VOLUME_COLLAPSE");
    expect(classifyVolume(0.3, 1, 2)).toBe("NEGLECTED");
  });
  it("uses the coin's own history once 7 days exist, else a damped cross-section", () => {
    const h = volumeShock(3e6, [1e6, 1e6, 1e6, 1e6, 1e6, 1e6, 1e6], 0.3, 0.1, 1, 2);
    expect([h.source, h.ratio, h.class]).toEqual(["history", 3, "ACCUMULATION"]);
    const x = volumeShock(3e6, [1e6], 0.3, 0.1, 1, 2);
    expect(x.source).toBe("cross-section");
    expect(x.ratio).toBeCloseTo(2.2);
  });
});

const bonkDetail = { id: "bonk", asset_platform_id: "solana", platforms: { solana: "Dez" }, categories: ["Meme", "Solana Ecosystem"],
  public_notice: "BonkDAO treasury was drained of ~$20M via a passed malicious governance proposal. <a href=\"https://x.com\">this post</a>",
  links: { homepage: ["https://www.bonkcoin.com/"], whitepaper: "https://bonkcoin.com/BONK-Paper.pdf", chat_url: ["https://discord.gg/abc"], twitter_screen_name: "bonk_inu", telegram_channel_identifier: "", repos_url: { github: [] } },
  sentiment_votes_up_percentage: 50, watchlist_portfolio_users: 209913, genesis_date: null };
const dil = (over: Partial<Diligence> = {}): Diligence => ({ geckoId: "bonk", security: { status: "PASS", vetoes: [], warnings: [], top10HolderPct: 20, chain: "solana", dexLiquidityUsd: 5e6, lpLockedPct: null }, commits12w: null, repo: null, checkedAt: "", profile: parseCoinDetail(bonkDetail).profile, ...over });

describe("legitimacy", () => {
  it("reads the public profile and strips markup from CoinGecko notices", () => {
    const p = parseCoinDetail(bonkDetail).profile;
    expect([p.whitepaper, p.twitter, p.discord, p.watchers]).toEqual(["https://bonkcoin.com/BONK-Paper.pdf", "bonk_inu", "https://discord.gg/abc", 209913]);
    expect(p.publicNotice).not.toContain("<a");
  });
  it("scores checkable facts and deducts for a public notice; a contract failure caps the score", () => {
    const l = legitimacyScore({ diligence: dil(), ageDays: 900, krakenListed: true, volume24hUsd: 5e7, now: Date.UTC(2026, 9, 12) });
    expect(l.score).toBe(15 + 10 + 10 + 5 + 10 + 15 + 10 + 10 - 25);
    expect(l.redFlags).toContain("PUBLIC_NOTICE");
    const fail = legitimacyScore({ diligence: dil({ security: { status: "FAIL", vetoes: ["HONEYPOT"], warnings: [], top10HolderPct: 10, chain: "ethereum" } }), ageDays: 900, krakenListed: true, volume24hUsd: 5e7 });
    expect(fail.score).toBeLessThanOrEqual(10);
    expect(legitimacyScore({ diligence: null, ageDays: null, krakenListed: false, volume24hUsd: 0 }).grade).toBe("UNVERIFIED");
  });
});

const mk = (id: string, rank: number, over: Partial<MarketCoin> = {}): MarketCoin => ({
  geckoId: id, symbol: id.toUpperCase(), name: id, rank, priceUsd: 1, marketCapUsd: 200e6, fdvUsd: 220e6, volume24hUsd: 20e6, circulatingSupply: 1, totalSupply: 1, maxSupply: null,
  athChangePct: -75, change24hPct: 1, change7dPct: 6, change30dPct: -10, change200dPct: -40, change1yPct: -50, lastUpdated: null, sparkline7d: [], ...over,
});
const openingsInput = (market: MarketCoin[], over: Partial<OpeningsInput> = {}): OpeningsInput => ({
  now: Date.UTC(2026, 9, 12), market, btc7dPct: 1, btc30dPct: 2, btcCloses: [], closesBySymbol: new Map(), volumeHistory: new Map(), trending: new Map(), aiCategory: new Set(),
  diligence: new Map(), firstSeen: new Map(), krakenPairs: new Map(), aiWatchlist: [], allowNewBuys: true, ...over,
});

describe("openings", () => {
  it("skips stablecoins, wrapped tokens, thin volume and wash trading; tiers by rank", () => {
    const out = scoreOpenings(openingsInput([
      mk("good", 150), mk("stable", 160, { priceUsd: 1, change30dPct: 0.1, change7dPct: 0.1 }), mk("wrapped", 170, { name: "Wrapped Thing" }),
      mk("thin", 180, { volume24hUsd: 1e5 }), mk("wash", 190, { volume24hUsd: 400e6 }), mk("spec", 700, { volume24hUsd: 1e6, marketCapUsd: 20e6, fdvUsd: 20e6 }), mk("big", 50),
    ]));
    expect(out.map((o) => [o.symbol, o.tier])).toEqual(expect.arrayContaining([["GOOD", "rank101_200"], ["SPEC", "speculative"]]));
    expect(out.map((o) => o.symbol)).not.toEqual(expect.arrayContaining(["STABLE", "WRAPPED", "THIN", "WASH", "BIG"]));
  });
  it("needs a verified legitimacy scan to CONSIDER, and a contract failure or AI veto means AVOID", () => {
    const m = [mk("good", 150), mk("bad", 151), mk("veto", 152)];
    const diligence = new Map<string, Diligence>([
      ["good", dil({ geckoId: "good", profile: { ...parseCoinDetail(bonkDetail).profile, publicNotice: null } })],
      ["bad", dil({ geckoId: "bad", security: { status: "FAIL", vetoes: ["HONEYPOT"], warnings: [], top10HolderPct: 10, chain: "ethereum" } })],
      ["veto", dil({ geckoId: "veto", profile: { ...parseCoinDetail(bonkDetail).profile, publicNotice: null } })],
    ]);
    const unverified = scoreOpenings(openingsInput(m)).find((o) => o.symbol === "GOOD")!;
    expect(unverified.verdict).toBe("WATCH");
    const aiWatchlist = [{ symbol: "VETO", geckoId: "veto", name: "veto", verdict: "AVOID" as const, aiScore: 10, socialScore: 5, mindshareTrend: "FALLING" as const, narrative: null, thesis: "bot-driven socials", greenFlags: [], redFlags: ["paid shills"], sources: [] }];
    const out = scoreOpenings(openingsInput(m, { diligence, aiWatchlist, firstSeen: new Map([["GOOD", { firstDataAt: "2023-01-01T00:00:00Z" }]]) }));
    const by = (s: string) => out.find((o) => o.symbol === s)!;
    expect(by("GOOD").verdict).toBe("CONSIDER");
    expect(by("BAD").verdict).toBe("AVOID");
    expect(by("VETO").reasons).toContain("AI_REVIEW_AVOID");
    expect(scoreOpenings(openingsInput(m, { diligence, allowNewBuys: false })).find((o) => o.symbol === "GOOD")!.verdict).toBe("WATCH");
  });
  it("treats 97%+ below the ATH as dead rather than cheap", () => {
    expect(valueFactor(-75)).toBeGreaterThan(valueFactor(-99));
    expect(halfRecoveryUpsidePct(-80)).toBeCloseTo(200); // 0.2 -> 0.6 of the ATH
    expect(halfRecoveryUpsidePct(-20)).toBeCloseTo(12.5);
  });
});

describe("risk metrics", () => {
  it("computes tail loss and beta from closes", () => {
    const btc = Array.from({ length: 200 }, (_, i) => 100 * (1 + 0.01 * Math.sin(i)));
    const alt = btc.map((p, i) => p * (1 + 0.02 * Math.sin(i)));
    expect(cvar95Pct(alt)!).toBeLessThan(0);
    expect(betaToBtc(alt, btc)!).toBeGreaterThan(1);
  });
});

describe("stablecoin yield", () => {
  it("keeps large single-asset stablecoin pools and ranks by risk-adjusted APY", () => {
    const pool = (over: Record<string, unknown>) => ({ pool: "aaaaaaaa-1", project: "aave-v3", chain: "Ethereum", symbol: "USDC", tvlUsd: 5e8, apy: 5, apyBase: 5, apyReward: 0, apyMean30d: 5, sigma: 0.2, stablecoin: true, exposure: "single", ilRisk: "no", outlier: false, ...over });
    const out = parseStablePools({ data: [
      pool({}), pool({ pool: "bbbbbbbb-2", project: "yearn-finance", apy: 8, apyMean30d: 7.5 }), pool({ pool: "c", symbol: "USDC-ETH", exposure: "multi" }),
      pool({ pool: "d", tvlUsd: 1e6 }), pool({ pool: "e", apy: 80, apyMean30d: 70 }), pool({ pool: "f", project: "farm", apy: 9, apyBase: 1, apyReward: 8, apyMean30d: 9 }),
    ] });
    expect(out.map((p) => p.pool).sort()).toEqual(["aaaaaaaa-1", "bbbbbbbb-2", "f"]); // multi-asset, small and outlier-APY pools dropped
    expect(out[0]!.project).toBe("yearn-finance");
    expect(out[0]!.optimizer).toBe(true);
    expect(out.find((p) => p.project === "farm")!.riskAdjApy).toBeLessThan(out[0]!.riskAdjApy); // reward emissions are haircut
    expect(out.some((p) => p.tvlUsd < 25e6 || p.apy > 30)).toBe(false);
  });
});

describe("AI watchlist", () => {
  it("validates and sanitises the routine's file", () => {
    const w = parseAiWatchlist({ version: 1, generatedAt: "2026-10-12T06:00:00Z", items: [
      { symbol: "fet", geckoId: "fetch-ai", name: "<b>Fetch</b>", verdict: "CONSIDER", aiScore: 140, thesis: "AI agents <script>x</script>", sources: ["https://ok.example/a", "javascript:alert(1)", "http://insecure"], mindshareTrend: "rising" },
      { symbol: "BAD!", verdict: "CONSIDER", aiScore: 50 }, { symbol: "X", verdict: "BUY", aiScore: 50 },
    ] });
    expect(w.items).toHaveLength(1);
    expect(w.items[0]).toMatchObject({ symbol: "FET", aiScore: 100, mindshareTrend: "RISING", sources: ["https://ok.example/a"] });
    expect(w.items[0]!.thesis).not.toMatch(/[<>]/);
    expect(() => parseAiWatchlist({ version: 2, items: [] })).toThrow();
  });
});

describe("market history and the volume-class forward test", () => {
  let dir = "";
  afterEach(() => { if (dir) rmSync(dir, { recursive: true, force: true }); resetMarketHistoryCache(); });
  it("records one day at a time and returns prior days only", () => {
    dir = mkdtempSync(join(tmpdir(), "mh-"));
    const path = join(dir, "h.json");
    const coins = Array.from({ length: 120 }, (_, i) => mk(`c${i}`, i + 1, { volume24hUsd: 1000 + i }));
    expect(recordMarketDay(coins, Date.UTC(2026, 9, 10), path)).toBe(true);
    expect(recordMarketDay(coins, Date.UTC(2026, 9, 10, 12), path)).toBe(false);
    expect(recordMarketDay(coins.slice(0, 50), Date.UTC(2026, 9, 11), path)).toBe(false); // broken feed is not a day
    recordMarketDay(coins, Date.UTC(2026, 9, 11), path);
    resetMarketHistoryCache();
    expect(volumeHistory("2026-10-11", path).get("c0")).toEqual([1000]);
    expect(volumeHistory("2026-10-12", path).get("c5")).toEqual([1005, 1005]);
  });
  it("scores 7-day outcomes per volume class from recorded prices only", () => {
    const day = (n: number) => new Date(Date.UTC(2026, 0, 1 + n)).toISOString().slice(0, 10);
    const rows: LedgerRow[] = [];
    for (let n = 0; n <= 10; n++) {
      rows.push({ kind: "snapshot", day: day(n), at: day(n), regime: "RISK_ON", score: 4, altGate: "ROTATION_OPEN", dominancePct: 60, stablecoinChange30dPct: 1, breadth30dPositive: 0.6, btcPriceUsd: 100 });
      rows.push({ kind: "signal", day: day(n), symbol: "ACC", geckoId: "acc", rank: 300, tier: "rank201_500", volumeClass: n === 0 ? "ACCUMULATION" : "NORMAL", score: 60, verdict: "WATCH", priceUsd: n < 7 ? 1 : 2 });
    }
    const s = summarizeSignals(rows, day(10));
    const acc = s.byClass.find((c) => c.key === "ACCUMULATION")!;
    expect(acc.events).toBe(1);
    expect(acc.horizons["7d"]!.avgNetPct!).toBeCloseTo(((2 * (1 - 0.0726)) / (1 * 1.0726) - 1) * 100, 6); // doubled, minus 7% slippage + fees per side
  });
});
