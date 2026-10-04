// @vitest-environment jsdom
import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "../ui/App";
import { CASH_USD, HOLDINGS, OPEN_ORDERS, PORTFOLIO_CAPTURED_AT, TRADE_MEMORY } from "../ui/simplePortfolioData";

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  sessionStorage.setItem("zobiris.operatorToken.v1", "test-refresh-token");
  globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.includes("/api/snapshot/latest")) {
      return new Response(JSON.stringify({ snapshot: { regime: "Regime Break", regimeConfidence: 40, rankedAssets: "[]" } }), { status: 200, headers: { "content-type": "application/json" } });
    }
    if (url.includes("/api/watchlist")) {
      return new Response(JSON.stringify({ watchlist: [] }), { status: 200, headers: { "content-type": "application/json" } });
    }
    if (url.includes("/api/account")) {
      return new Response(JSON.stringify({ account: {
        privateAccountSynced: true,
        source: "Kraken private API",
        syncMode: "poll",
        capturedAt: PORTFOLIO_CAPTURED_AT,
        cashUsd: CASH_USD,
        freeCashUsd: CASH_USD - OPEN_ORDERS.filter(order => order.side === "BUY").reduce((sum, order) => sum + order.amountUsd, 0),
        holdings: HOLDINGS,
        openOrders: OPEN_ORDERS,
        trades: TRADE_MEMORY,
        rewards: [],
      } }), { status: 200, headers: { "content-type": "application/json" } });
    }
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "content-type": "application/json" } });
  }) as typeof fetch;
});

describe("trade memory seed", () => {
  it("starts from deduplicated economic trades and the current open-order plan", async () => {
    expect(TRADE_MEMORY).toHaveLength(66);
    expect(OPEN_ORDERS.filter((order) => order.side === "BUY").reduce((sum, order) => sum + order.amountUsd, 0)).toBe(102);
    expect(TRADE_MEMORY.some((trade) => trade.id.includes("reward"))).toBe(false);

    render(<App />);
    expect(await screen.findByText("Current positions")).toBeTruthy();
    expect(within(screen.getByRole("region", { name: "Portfolio overview" })).getByText("$102.00")).toBeTruthy();
  });
});

