import { describe, expect, it } from "vitest";
import { reportShadowEntryPlans } from "../server/evidenceServiceClient.js";

describe("evidence sidecar bridge", () => {
  it("does nothing when the sidecar is not configured", async () => {
    const result = await reportShadowEntryPlans(
      { decisionId: "snap-1", decisionTime: "2026-10-03T18:00:00Z", assets: [] },
      { configured: () => false, registerShadowOrder: async () => { throw new Error("should not be called"); } },
    );
    expect(result).toEqual({ configured: false, attempted: 0, registered: 0, failures: [] });
  });

  it("reports only fully unblocked qualified entry plans with verified Kraken v2 pairs", async () => {
    const calls: any[] = [];
    const result = await reportShadowEntryPlans(
      {
        decisionId: "snap-2",
        decisionTime: "2026-10-03T18:00:00Z",
        regime: "ACCUMULATION",
        assets: [
          { symbol: "ETH", state: "QUALIFIED", blockedReason: null, krakenWsPair: "ETH/USD", entry: { referenceLimit: 9.41, requestedNotionalUsd: 36.99 } },
          { symbol: "SOL", state: "QUALIFIED", blockedReason: "No buy capacity", krakenWsPair: "SOL/USD", entry: { referenceLimit: null, requestedNotionalUsd: null } },
          { symbol: "XRP", state: "QUALIFIED", blockedReason: null, krakenWsPair: null, entry: { referenceLimit: 1.1, requestedNotionalUsd: 20 } },
        ],
      },
      {
        configured: () => true,
        registerShadowOrder: async (order: any) => { calls.push(order); return { ok: true, shadowOrderId: "so-1", finalizeAt: "2026-10-03T22:00:00Z" }; },
      },
    );
    expect(result).toEqual({ configured: true, attempted: 1, registered: 1, failures: [] });
    expect(calls).toHaveLength(1);
    expect(calls[0]).toMatchObject({ source: "zobiris:production-entry-plan", decisionId: "snap-2:ETH", symbol: "ETH/USD", side: "buy", requestedNotionalUsd: 36.99, orderType: "resting_limit", limitPrice: 9.41, regime: "ACCUMULATION" });
  });

  it("captures sidecar failures without throwing into the production refresh path", async () => {
    const result = await reportShadowEntryPlans(
      { decisionId: "snap-3", decisionTime: "2026-10-03T18:00:00Z", assets: [{ symbol: "ETH", state: "QUALIFIED", blockedReason: null, krakenWsPair: "ETH/USD", entry: { referenceLimit: 9.41, requestedNotionalUsd: 36.99 } }] },
      { configured: () => true, registerShadowOrder: async () => { throw new Error("sidecar unavailable"); } },
    );
    expect(result.attempted).toBe(1);
    expect(result.registered).toBe(0);
    expect(result.failures).toEqual([{ symbol: "ETH", error: "sidecar unavailable" }]);
  });
});
