import { describe, expect, it } from "vitest";
import { consumeSpotBook } from "../strategy21/prediction/bookCollector.js";
import { bookChecksum } from "../strategy21/prediction/krakenBook.js";

describe("spot book collector", () => {
  it("accepts checked book states and refuses an invalid checksum", () => {
    const bids: [string, string][] = [["100.0", "2.00"]];
    const asks: [string, string][] = [["101.0", "1.00"]];
    const checksum = bookChecksum({ bids, asks });
    const raw = JSON.stringify({ channel: "book", type: "snapshot", data: [{ symbol: "SOL/USD", timestamp: "2026-09-26T09:00:00Z", bids: [{ price: "100.0", qty: "2.00" }], asks: [{ price: "101.0", qty: "1.00" }], checksum }] });
    const accepted = consumeSpotBook(null, raw, ["SOL/USD"], "2026-09-26T09:00:01Z");
    expect(accepted.features?.pair).toBe("SOL/USD");
    const bad = consumeSpotBook(accepted.state, raw.replace(String(checksum), "42"), ["SOL/USD"], "2026-09-26T09:00:02Z");
    expect(bad.features).toBeNull();
    expect(bad.resubscribe).toBe(true);
  });
});
