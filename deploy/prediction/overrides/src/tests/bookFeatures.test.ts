import { describe, expect, it } from "vitest";
import { applyBookEvent } from "../strategy21/prediction/krakenBook.js";
import { extractBookFeatures } from "../strategy21/prediction/bookFeatures.js";

describe("book features", () => {
  it("uses only a valid book at or before its cutoff", () => {
    const state = applyBookEvent(null, { kind: "snapshot", pair: "SOL/USD", observedAt: "2026-09-26T09:00:00Z", bids: [[100, 2], [99, 1]], asks: [[101, 1], [102, 2]] });
    const features = extractBookFeatures(state, "2026-09-26T09:00:01Z");
    expect(features?.midpoint).toBe(100.5);
    expect(features?.microprice).toBeCloseTo((101 * 2 + 100 * 1) / 3);
    expect(features?.queueImbalance).toBeCloseTo(1 / 3);
    expect(features?.spreadBps).toBeCloseTo(10000 / 100.5);
    expect(extractBookFeatures(state, "2026-09-26T08:59:59Z")).toBeNull();
    expect(extractBookFeatures(state, "2026-09-26T09:01:00Z")).toBeNull();
  });
});
