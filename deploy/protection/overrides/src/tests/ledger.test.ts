import { afterEach, describe, expect, it } from "vitest";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { FEE_PER_SIDE, slippageFor, summarizeLedger, type LedgerRow } from "../strategyV2/ledger";
import { recordReport, resetLedgerCache } from "../server/ledgerService";

const day = (n: number) => new Date(Date.UTC(2026, 0, 1 + n)).toISOString().slice(0, 10);
const snap = (n: number, btc: number): LedgerRow => ({ kind: "snapshot", day: day(n), at: day(n) + "T01:00:00Z", regime: "RISK_ON", score: 5, altGate: "ROTATION_OPEN", dominancePct: 59, stablecoinChange30dPct: 1, breadth30dPositive: 0.6, btcPriceUsd: btc });
const dec = (n: number, symbol: string, group: any, price: number | null, extra: object = {}): LedgerRow => ({ kind: "decision", day: day(n), symbol, name: symbol, rank: 150, source: "watchlist", group, signal: group, priceUsd: price, limitPriceUsd: null, convexityScore: null, ...extra });

describe("decision ledger scoring", () => {
  it("counts a run of the same signal once and scores it net of fees and tiered slippage", () => {
    const rows: LedgerRow[] = [];
    for (let n = 0; n <= 40; n++) { rows.push(snap(n, 100)); rows.push(dec(n, "AAA", n < 5 ? "bet" : "wait", 10 + n)); }
    const s = summarizeLedger(rows, day(40));
    const bet = s.groups.find((g) => g.group === "bet")!;
    expect(bet.events).toBe(1); // 5 days in a row = one event
    const cost = FEE_PER_SIDE + slippageFor("AAA", 150);
    expect(bet.horizons["7d"]!.avgNetPct).toBeCloseTo(((17 * (1 - cost)) / (10 * (1 + cost)) - 1) * 100, 6);
    expect(bet.horizons["30d"]!.avgVsBtcPct).toBeCloseTo(bet.horizons["30d"]!.avgNetPct!, 6); // BTC flat
    expect(bet.horizons["90d"]!.pending).toBe(1);
  });
  it("only scores buy zones whose limit price was reached within 14 days, from the limit", () => {
    const rows: LedgerRow[] = [];
    for (let n = 0; n <= 40; n++) {
      rows.push(snap(n, 100));
      rows.push(dec(n, "HIT", n === 0 ? "buy" : "wait", n === 3 ? 9 : 10, n === 0 ? { limitPriceUsd: 9.5 } : {}));
      rows.push(dec(n, "MISS", n === 0 ? "buy" : "wait", 10, n === 0 ? { limitPriceUsd: 5 } : {}));
    }
    const buy = summarizeLedger(rows, day(40)).groups.find((g) => g.group === "buy")!;
    expect([buy.events, buy.filled, buy.horizons["7d"]!.n]).toEqual([2, 1, 1]);
    const cost = FEE_PER_SIDE + slippageFor("HIT", 150);
    expect(buy.horizons["7d"]!.avgNetPct).toBeCloseTo(((10 * (1 - cost)) / (9.5 * (1 + cost)) - 1) * 100, 6);
  });
  it("reports coins that vanish from the data as lost coverage instead of dropping them", () => {
    const rows: LedgerRow[] = [snap(0, 100), dec(0, "GONE", "bet", 1)];
    for (let n = 1; n <= 10; n++) rows.push(snap(n, 100));
    const bet = summarizeLedger(rows, day(10)).groups.find((g) => g.group === "bet")!;
    expect([bet.horizons["7d"]!.n, bet.horizons["7d"]!.lostCoverage]).toEqual([0, 1]);
  });
});

describe("ledger persistence", () => {
  let dir = "";
  afterEach(() => { if (dir) rmSync(dir, { recursive: true, force: true }); resetLedgerCache(); });
  it("appends once per UTC day and never rewrites", () => {
    dir = mkdtempSync(join(tmpdir(), "ledger-"));
    const path = join(dir, "d.jsonl");
    const report: any = { asOf: "2026-10-12T01:00:00Z", regime: { state: "RISK_ON", score: 5, close: 1 }, altGate: null, marketSmallCapCandidates: [],
      watchlist: [{ symbol: "BTC", name: "Bitcoin", rank: 1, tier: "TOP_100", priceUsd: 1, signal: "Benchmark", rotation: null, smallCap: null }] };
    expect(recordReport(report, path)).toBe(true);
    expect(recordReport({ ...report, asOf: "2026-10-12T05:00:00Z" }, path)).toBe(false);
    expect(recordReport({ ...report, asOf: "2026-10-13T01:00:00Z" }, path)).toBe(true);
    expect(readFileSync(path, "utf8").trim().split("\n")).toHaveLength(4);
  });
});
