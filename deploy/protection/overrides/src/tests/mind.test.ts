import { describe, expect, it } from "vitest";
import { beliefDimmed, disagreements, forecastMisses, postureTriggers, radarLayout } from "../strategyV2/mind";
import { parseHolderMap, bubblemapsChain } from "../strategyV2/bubblemaps";
import { legitimacyScore } from "../strategyV2/legitimacy";
import type { OpeningCandidate } from "../strategyV2/openings";
import type { Diligence } from "../strategyV2/diligence";

const cand = (over: Partial<OpeningCandidate>): OpeningCandidate => ({
  geckoId: "x", symbol: "X", name: "X", rank: 150, tier: "rank101_200", priceUsd: 1, marketCapUsd: 5e8, volume24hUsd: 1e7, change24hPct: 0, change7dPct: 0, change30dPct: 0, athChangePct: -50,
  score: 50, factors: { value: .5, dilution: .5, turn: .5, liquidity: .5, volume: .5, attention: .5, legitimacy: .5 },
  volume: { class: "NORMAL", ratio: 1, source: "history", historyDays: 30 } as any, legitimacy: { score: 60, grade: "MODERATE", points: [], redFlags: [] },
  risk: null, upsideHalfAthPct: 50, labels: [], verdict: "WATCH", reasons: [], firstTranchePct: 1, krakenListed: true, ai: null, ...over,
});

describe("mind: posture triggers", () => {
  const base = { posture: "RECOVERY" as const, fearGreed: 62, mayerMultiple: 1.16, drawdownFrom365dHighPct: -12, btcClose: 83_675, sma200: 71_980, stablecoinChange30dPct: 0.83, breadth30dPositive: 0.86 };
  it("names each threshold with the distance left and flags the near ones", () => {
    const t = postureTriggers(base);
    const eu = t.find((x) => x.to === "EUPHORIA" && x.condition.includes("Fear"))!;
    expect(eu.distance).toBe("18 points away (now 62)");
    expect(eu.near).toBe(false);
    const det = t.find((x) => x.to === "DETERIORATION")!;
    expect(det.distance).toMatch(/\$71,980 · 16\.2% below now/);
    expect(t.find((x) => x.to === "INTEGRITY")!.distance).toBe("5.8 pts of supply left");
    expect(postureTriggers({ ...base, fearGreed: 74 }).find((x) => x.condition.includes("Fear"))!.near).toBe(true);
  });
  it("sorts near triggers first and skips thresholds without data", () => {
    const t = postureTriggers({ ...base, fearGreed: null, btcClose: 73_000 });
    expect(t[0]!.to).toBe("DETERIORATION");
    expect(t.some((x) => x.to === "EUPHORIA" && x.condition.includes("Fear"))).toBe(false);
  });
});

describe("mind: attention radar", () => {
  it("pulls strong openings to the centre, pins vetoes on the rim and keeps each tier in its sector", () => {
    const dots = radarLayout([cand({ symbol: "A", geckoId: "a", score: 90 }), cand({ symbol: "B", geckoId: "b", score: 20 }), cand({ symbol: "C", geckoId: "c", verdict: "AVOID", score: 95, tier: "speculative", rank: 700 })]);
    const r = (s: string) => { const d = dots.find((x) => x.symbol === s)!; return Math.hypot(d.x, d.y); };
    expect(r("A")).toBeLessThan(r("B"));
    expect(dots.filter((d) => d.labelled).map((d) => d.symbol).sort()).toEqual(["A", "B", "C"]);
    expect(radarLayout(Array.from({ length: 10 }, (_, k) => cand({ symbol: `S${k}`, geckoId: `s${k}`, score: 80 - k })), 3).filter((d) => d.labelled)).toHaveLength(3);
    expect(r("C")).toBeCloseTo(0.97, 2);
    const c = dots.find((x) => x.symbol === "C")!;
    expect(c.vetoed).toBe(true);
    expect((Math.atan2(c.y, c.x) * 180 / Math.PI + 360) % 360).toBeGreaterThanOrEqual(150 - 1e-9); // speculative sector 150°..270°
    for (const d of dots) { expect(Math.abs(d.x)).toBeLessThanOrEqual(1); expect(Math.abs(d.y)).toBeLessThanOrEqual(1); }
  });
});

describe("mind: counsel and mirror", () => {
  it("lists only the coins where Claude and the engine disagree", () => {
    const ai = (verdict: string, aiScore = 70) => ({ symbol: "X", geckoId: "x", name: "X", verdict, aiScore, socialScore: 50, thesis: "t", redFlags: [], sources: [] }) as any;
    const d = disagreements([cand({ symbol: "AGREE", verdict: "WATCH", ai: ai("WATCH") }), cand({ symbol: "SPLIT", verdict: "AVOID", ai: ai("CONSIDER") }), cand({ symbol: "NONE" })]);
    expect(d.map((x) => x.symbol)).toEqual(["SPLIT"]);
  });
  it("reports direction misses within the window and dims beliefs that do not beat a coin flip", () => {
    const recent = [{ day: "2026-10-10", pUp: 0.58, up: false, close: 100, exit: 97 }, { day: "2026-10-09", pUp: 0.56, up: true, close: 100, exit: 102 }, { day: "2026-09-20", pUp: 0.6, up: false, close: 100, exit: 90 }];
    const m = forecastMisses(recent, "2026-10-12", 7);
    expect(m).toEqual([{ day: "2026-10-10", said: "58% up", happened: "fell 3.0%", pUp: 0.58 }]);
    expect(beliefDimmed(0.26, 12)).toBe(true);
    expect(beliefDimmed(0.26, 5)).toBe(false);
    expect(beliefDimmed(0.21, 40)).toBe(false);
  });
});

describe("bubblemaps holder map", () => {
  const raw = { supply_stats: { cexs: 0.12, dexs: 0.03, contracts: 0.2, fresh_wallets: 0.22, top_10_adjusted: 0.31, bundles: 0.27 }, scores: { bubblemaps_score: 41, gini_index: 0.9, herfindahl_hirschman_index: 0.05, nakamoto_coefficient: 6 } };
  it("parses metrics into percentages and raises the sniper/insider flags", () => {
    const h = parseHolderMap(raw, "eth", "0xabc")!;
    expect([h.top10AdjustedPct, h.bundlesPct, h.freshWalletsPct, h.cexPct, h.nakamoto, h.score]).toEqual([31, 27, 22, 12, 6, 41]);
    expect(h.flags).toEqual(["BUNDLED_SUPPLY", "FRESH_WALLET_SUPPLY"]);
    expect(h.url).toBe("https://app.bubblemaps.io/eth/token/0xabc");
    expect(parseHolderMap({ detail: "Not found" }, "eth", "0xabc")).toBeNull();
    expect([bubblemapsChain("binance-smart-chain"), bubblemapsChain("optimistic-ethereum"), bubblemapsChain(null)]).toEqual(["bsc", null, null]);
  });
  it("feeds the legitimacy score: clustered top-10 replaces the raw figure and bundles deduct", () => {
    const base: Diligence = { geckoId: "x", security: { status: "PASS", vetoes: [], warnings: [], top10HolderPct: 20, chain: "ethereum", dexLiquidityUsd: 2e6 }, commits12w: 5, repo: "https://github.com/a/b", checkedAt: "2026-10-12T00:00:00Z",
      profile: { whitepaper: "w", homepage: "h", twitter: "t", telegram: null, discord: null, categories: [], genesisDate: null, watchers: null, sentimentUpPct: null, publicNotice: null } as any };
    const plain = legitimacyScore({ diligence: base, ageDays: 900, krakenListed: false, volume24hUsd: 1e6 });
    const mapped = legitimacyScore({ diligence: { ...base, holders: parseHolderMap(raw, "eth", "0xabc") }, ageDays: 900, krakenListed: false, volume24hUsd: 1e6 });
    expect(plain.score - mapped.score).toBe(10 - 5 + 15 + 10); // 25% raw top-10 (+10) becomes 31% clustered (+5); bundles -15; fresh wallets -10
    expect(mapped.redFlags).toEqual(expect.arrayContaining(["BUNDLED_SUPPLY", "FRESH_WALLET_SUPPLY"]));
    const clean = legitimacyScore({ diligence: { ...base, holders: parseHolderMap({ ...raw, supply_stats: { ...raw.supply_stats, bundles: 0.05, fresh_wallets: 0.02 }, scores: { ...raw.scores, bubblemaps_score: 72 } }, "eth", "0xabc") }, ageDays: 900, krakenListed: false, volume24hUsd: 1e6 });
    expect(clean.score - plain.score).toBe(-5 + 5); // clustered 31% (+5 instead of +10) and decentralization score 72 (+5)
  });
});
