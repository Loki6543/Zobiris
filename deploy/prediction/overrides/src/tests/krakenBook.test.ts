import { describe, expect, it } from "vitest";
import { applyBookEvent, bookChecksum, bookValidity } from "../strategy21/prediction/krakenBook.js";

describe("public Kraken L2 state", () => {
  it("applies in-order deltas and requires resnapshot after a sequence gap", () => {
    const first = applyBookEvent(null, { kind: "snapshot", pair: "SOL/USD", sequence: 10, observedAt: "2026-09-26T09:00:00Z", bids: [[100, 2]], asks: [[101, 3]] });
    const next = applyBookEvent(first, { kind: "delta", pair: "SOL/USD", sequence: 11, observedAt: "2026-09-26T09:00:01Z", bids: [[100, 0], [99, 4]], asks: [[101, 2]] });
    expect(next.bids).toEqual([["99", "4"]]);
    expect(bookValidity(next, "2026-09-26T09:00:02Z").valid).toBe(true);
    const gap = applyBookEvent(next, { kind: "delta", pair: "SOL/USD", sequence: 13, observedAt: "2026-09-26T09:00:03Z", bids: [[98, 1]], asks: [] });
    expect(bookValidity(gap, "2026-09-26T09:00:03Z").reason).toBe("sequence_gap");
  });

  it("uses spot book checksums to invalidate a corrupted update", () => {
    const first = applyBookEvent(null, { kind: "snapshot", pair: "SOL/USD", observedAt: "2026-09-26T09:00:00Z", bids: [["100.0", "2.00"]], asks: [["101.0", "3.00"]] });
    const valid = applyBookEvent(first, { kind: "delta", pair: "SOL/USD", observedAt: "2026-09-26T09:00:01Z", bids: [["100.0", "2.50"]], asks: [], checksum: bookChecksum({ bids: [["100.0", "2.50"]], asks: [["101.0", "3.00"]] }) });
    expect(bookValidity(valid, "2026-09-26T09:00:02Z").valid).toBe(true);
    const corrupted = applyBookEvent(valid, { kind: "delta", pair: "SOL/USD", observedAt: "2026-09-26T09:00:03Z", bids: [], asks: [["101.0", "9.00"]], checksum: 42 });
    expect(bookValidity(corrupted, "2026-09-26T09:00:04Z").reason).toBe("sequence_gap");
  });

  it("matches Kraken's published spot v2 checksum fixture", () => {
    const asks = [
      ["45285.2","0.00100000"],["45286.4","1.54571953"],["45286.6","1.54571109"],
      ["45289.6","1.54560911"],["45290.2","0.15890660"],["45291.8","1.54553491"],
      ["45294.7","0.04454749"],["45296.1","0.35380000"],["45297.5","0.09945542"],["45299.5","0.18772827"],
    ] as const;
    const bids = [
      ["45283.5","0.10000000"],["45283.4","1.54582015"],["45282.1","0.10000000"],
      ["45281.0","0.10000000"],["45280.3","1.54592586"],["45279.0","0.07990000"],
      ["45277.6","0.03310103"],["45277.5","0.30000000"],["45277.3","1.54602737"],["45276.6","0.15445238"],
    ] as const;
    expect(bookChecksum({ bids: [...bids], asks: [...asks] })).toBe(3310070434);
  });

  it("rejects crossed, stale, and unmapped books", () => {
    const crossed = applyBookEvent(null, { kind: "snapshot", pair: "UNKNOWN/USD", sequence: 1, observedAt: "2026-09-26T09:00:00Z", bids: [[102, 1]], asks: [[101, 1]] });
    expect(bookValidity(crossed, "2026-09-26T09:00:01Z").reason).toBe("crossed");
    const good = applyBookEvent(null, { kind: "snapshot", pair: "SOL/USD", sequence: 1, observedAt: "2026-09-26T09:00:00Z", bids: [[100, 1]], asks: [[101, 1]] });
    expect(bookValidity(good, "2026-09-26T09:01:00Z").reason).toBe("stale");
    expect(bookValidity({ ...good, mapped: false }, "2026-09-26T09:00:01Z").reason).toBe("unmapped");
  });
});
