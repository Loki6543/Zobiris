import { afterEach, expect, it, vi } from "vitest";

afterEach(() => { vi.unstubAllGlobals(); vi.resetModules(); });
it("uses separate, complete historical windows and observes only forward outcomes", async () => {
  const today = Math.floor(Date.now() / 86400000) * 86400;
  vi.stubGlobal("fetch", vi.fn(async (url: string) => {
    const sol = url.includes("SOLUSD");
    const rows = Array.from({ length: 45 }, (_, i) =>
      [today - (45 - i) * 86400, "0", "0", "0", String(sol ? 100 + i : 100), "0", "0", "0"]);
    return { ok: true, json: async () => ({ error: [], result: { pair: rows, last: 0 } }) };
  }));
  const { sidewaysHistory } = await import("../compareLab/compare.js");
  const result = await sidewaysHistory(["BTC", "SOL"], 2);
  expect(result.provenance).toBe("real-completed-daily");
  expect(result.sampleCount).toBe(3);
  expect(result.summary.find(s => s.symbol === "SOL")?.positiveCount).toBe(3);
  expect(result.matches.every(m => m.forwardPct.SOL! > m.forwardPct.BTC!)).toBe(true);
  expect(result.matches.map(m => m.start).length).toBe(new Set(result.matches.map(m => m.start)).size);
});
it("rejects non-BTC baselines and invalid thresholds before fetch", async () => {
  const fetcher = vi.fn(); vi.stubGlobal("fetch", fetcher);
  const { sidewaysHistory } = await import("../compareLab/compare.js");
  await expect(sidewaysHistory(["SOL", "BTC"], 2)).rejects.toThrow(RangeError);
  await expect(sidewaysHistory(["BTC", "SOL"], 20)).rejects.toThrow(RangeError);
  expect(fetcher).not.toHaveBeenCalled();
});
