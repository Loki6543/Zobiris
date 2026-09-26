import { afterEach, describe, expect, it, vi } from "vitest";
import { compareDaily } from "../compareLab/compare.js";

describe("Compare Lab data boundary", () => {
  afterEach(() => vi.unstubAllGlobals());
  it("accepts only completed real aligned daily Kraken candles", async () => {
    const today = Math.floor(Date.now() / 86400000) * 86400;
    vi.stubGlobal("fetch", vi.fn(async (url: string) => {
      const multiplier = url.includes("XBTUSD") ? 1 : 2;
      const rows = Array.from({ length: 9 }, (_, i) =>
        [today - (8 - i) * 86400, "0", "0", "0", String((100 + i) * multiplier), "0", "0", "0"]);
      return { ok: true, json: async () => ({ error: [], result: { XXBTZUSD: rows, last: 0 } }) };
    }));
    const result = await compareDaily(["BTC", "ETH"], 7);
    expect(result.provenance).toBe("real-completed-daily");
    expect(result.observedDays).toBe(7);
    expect(result.series.every(s => s.points.every(p => p.time < today))).toBe(true);
  });
  it("rejects unsupported or too few coins before querying a provider", async () => {
    const fetcher = vi.fn(); vi.stubGlobal("fetch", fetcher);
    await expect(compareDaily(["BTC", "FAKE"], 30)).rejects.toThrow(RangeError);
    await expect(compareDaily(["BTC"], 30)).rejects.toThrow(RangeError);
    expect(fetcher).not.toHaveBeenCalled();
  });
});
