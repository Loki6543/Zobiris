import { afterEach, expect, it, vi } from "vitest";

afterEach(() => { vi.unstubAllGlobals(); vi.resetModules(); });
it("rejects a comparison that spans missing daily candles rather than mislabeling its duration", async () => {
  const today = Math.floor(Date.now() / 86400000) * 86400;
  vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => ({ error: [], result: {
    pair: [9, 8, 7, 6, 5, 4, 3, 1].map(daysAgo =>
      [today - daysAgo * 86400, "0", "0", "0", "100", "0", "0", "0"]), last: 0,
  } }) })));
  const { compareDaily } = await import("../compareLab/compare.js");
  await expect(compareDaily(["BTC", "SOL"], 7)).rejects.toThrow("Missing daily Kraken candles");
});
