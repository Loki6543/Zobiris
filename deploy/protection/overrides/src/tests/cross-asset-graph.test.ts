import { describe, expect, it } from "vitest";
import { buildCrossAssetGraph } from "../server/crossAssetGraph.js";

const catchUpRows = [
  { symbol: "ETH", change24hPct: 0, change7dPct: 5, change30dPct: 10, change90dPct: 20 },
  { symbol: "BTC", change24hPct: 4, change7dPct: 7, change30dPct: 10.3, change90dPct: 20.4 },
  { symbol: "SOL", change24hPct: 5, change7dPct: 7.5, change30dPct: 9.8, change90dPct: 19.7 },
  { symbol: "XRP", change24hPct: 4.5, change7dPct: 6.8, change30dPct: 10.5, change90dPct: 20.6 },
  { symbol: "LINK", change24hPct: 3.8, change7dPct: 7.2, change30dPct: 9.6, change90dPct: 19.5 },
  { symbol: "AAVE", change24hPct: -2, change7dPct: -5, change30dPct: -20, change90dPct: -35 },
  { symbol: "ADA", change24hPct: 1, change7dPct: 0, change30dPct: 35, change90dPct: 55 },
  { symbol: "DOGE", change24hPct: -4, change7dPct: -10, change30dPct: -40, change90dPct: -60 },
  { symbol: "HBAR", change24hPct: 2, change7dPct: 3, change30dPct: 45, change90dPct: 70 },
  { symbol: "COMP", change24hPct: -1, change7dPct: -3, change30dPct: -30, change90dPct: -50 },
];

describe("cross-asset graph shadow", () => {
  it("detects a lagging target from connected peer movement", () => {
    const eth = buildCrossAssetGraph(catchUpRows).get("ETH")!;
    expect(eth.available).toBe(true);
    expect(eth.state).toBe("CATCH_UP_CANDIDATE");
    expect(eth.residual24hPct).toBeGreaterThan(3);
    expect(eth.residual7dPct).toBeGreaterThan(0);
    expect(eth.confidence).toBeGreaterThan(0.4);
    expect(eth.authority).toBe("SHADOW_ONLY_NO_ENTRY_SCORE_CHANGE");
    expect(eth.entryPullbackAdjustmentPct).toBe(0);
  });

  it("turns relative overextension into a deeper shadow pullback only", () => {
    const rows = catchUpRows.map((row) => ({ ...row }));
    rows[0] = { ...rows[0]!, change24hPct: 10, change7dPct: 10 };
    const eth = buildCrossAssetGraph(rows).get("ETH")!;
    expect(eth.state).toBe("OVEREXTENDED");
    expect(eth.residual24hPct).toBeLessThan(-3);
    expect(eth.entryPullbackAdjustmentPct).toBeGreaterThan(0);
    expect(eth.entryPullbackAdjustmentPct).toBeLessThanOrEqual(2);
  });

  it("fails closed when the usable cross-section is too small", () => {
    const result = buildCrossAssetGraph([
      catchUpRows[0]!,
      catchUpRows[1]!,
      { ...catchUpRows[2]!, change90dPct: null },
    ]);
    expect(result.get("ETH")?.available).toBe(false);
    expect(result.get("ETH")?.state).toBe("INSUFFICIENT");
    expect(result.get("ETH")?.networkImplied24hPct).toBeNull();
  });

  it("marks explicit ecosystem parent edges without making them trade authority", () => {
    const rows = catchUpRows.map((row) =>
      row.symbol === "ETH" ? { ...row, symbol: "RAY" } : { ...row },
    );
    const ray = buildCrossAssetGraph(rows).get("RAY")!;
    const sol = ray.neighbors.find((neighbor) => neighbor.symbol === "SOL");
    expect(sol).toBeTruthy();
    expect(sol?.ecosystemEdge).toBe(true);
    expect(ray.authority).toBe("SHADOW_ONLY_NO_ENTRY_SCORE_CHANGE");
  });
});
