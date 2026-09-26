import test from "node:test";
import assert from "node:assert/strict";
import { dangerousPermissions } from "../server/krakenPrivate.js";

test("Kraken read-only scopes are accepted", () => {
  const permissions = [
    "Query Funds",
    "Query Open Orders & Trades",
    "Query Closed Orders & Trades",
    "Query Ledger Entries",
    "Access WebSockets API",
  ];
  assert.deepEqual(dangerousPermissions(permissions), []);
});

test("Kraken write-capable scopes are detected fail-closed", () => {
  const permissions = [
    "Query Funds",
    "Modify Orders",
    "Cancel/Close Orders",
    "Withdraw Funds",
  ];
  const blocked = dangerousPermissions(permissions);
  assert.ok(blocked.includes("Modify Orders"));
  assert.ok(blocked.includes("Cancel/Close Orders"));
  assert.ok(blocked.includes("Withdraw Funds"));
});
