import { describe, expect, it } from "vitest";
import { dangerousPermissions, getKrakenAccountState, krakenPairIdentity } from "../server/krakenPrivate.js";

describe("Kraken private API safety boundary", () => {
  it("accepts read-only scopes", () => {
    const permissions = [
      "Query Funds",
      "Query Open Orders & Trades",
      "Query Closed Orders & Trades",
      "Query Ledger Entries",
      "Access WebSockets API",
    ];
    expect(dangerousPermissions(permissions)).toEqual([]);
  });

  it("preserves quote identity instead of labeling non-USD pairs as USD", () => {
    expect(krakenPairIdentity("XETHZEUR")).toEqual({
      symbol: "ETH",
      quoteCurrency: "EUR",
      pair: "ETH/EUR",
      pairVerified: true,
    });
    expect(krakenPairIdentity("SOL/USD")).toEqual({
      symbol: "SOL",
      quoteCurrency: "USD",
      pair: "SOL/USD",
      pairVerified: true,
    });
  });

  it("keeps fallback trade provenance distinct from the private API", () => {
    const account = getKrakenAccountState();
    expect(account.privateAccountSynced).toBe(false);
    expect(account.trades.some((trade) => trade.source === "Kraken trades export")).toBe(true);
    expect(account.trades.every((trade) => trade.source !== "Kraken private API")).toBe(true);
    expect(account.openOrders.every((order) => order.quoteCurrency === "USD" && order.pairVerified === false)).toBe(true);
  });

  it("detects write-capable scopes fail-closed", () => {
    const permissions = [
      "Query Funds",
      "Modify Orders",
      "Cancel/Close Orders",
      "Withdraw Funds",
    ];
    const blocked = dangerousPermissions(permissions);
    expect(blocked).toContain("Modify Orders");
    expect(blocked).toContain("Cancel/Close Orders");
    expect(blocked).toContain("Withdraw Funds");
  });
});
