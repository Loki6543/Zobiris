import { describe, expect, it } from "vitest";
import { parseSpotBookMessage } from "../strategy21/prediction/krakenSpotFeed.js";

describe("Kraken spot v2 book messages", () => {
  it("preserves price and quantity precision and rejects non-book messages", () => {
    const event = parseSpotBookMessage('{"channel":"book","type":"snapshot","data":[{"symbol":"SOL/USD","timestamp":"2026-09-26T09:00:00Z","bids":[{"price":100.01000000,"qty":0.00100000}],"asks":[{"price":100.02000000,"qty":1.00000000}],"checksum":1}]}');
    expect(event?.bids).toEqual([["100.01000000", "0.00100000"]]);
    expect(event?.asks).toEqual([["100.02000000", "1.00000000"]]);
    expect(parseSpotBookMessage('{"channel":"heartbeat"}')).toBeNull();
  });
});
