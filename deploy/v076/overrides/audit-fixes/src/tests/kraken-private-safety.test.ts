import { describe, expect, it } from "vitest";
import { dangerousPermissions } from "../server/krakenPrivate.js";

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
