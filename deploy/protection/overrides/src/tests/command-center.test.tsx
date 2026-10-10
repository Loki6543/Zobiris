// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CommandCenter } from "../ui/CommandCenter";

const daily = Array.from({ length: 90 }, (_, i) => ({
  time: Math.floor(Date.UTC(2026, 6, 1) / 1000) + i * 86400,
  close: 70000 + i * 130,
}));
const props = {
  refreshKey: 1,
  snapshotAsOf: Date.now(),
  snapshotFresh: true,
  regime: "Defensive / recovering",
  accountSynced: true,
  accountAsOf: new Date().toISOString(),
  portfolioValue: 1000,
  cash: 250,
  freeCash: 200,
  reservedBuys: 50,
  orders: [{ symbol: "LINK", side: "BUY" as const, targetPriceUsd: 12.59, amountUsd: 50 }],
  watch: [{ symbol: "LINK", move: "Review existing limit", reason: "Existing order; do not duplicate", ready: false }],
  trades: [{ id: "1", symbol: "APE", side: "SELL" as const, at: new Date().toISOString(), source: "Kraken trades export" }],
  onNavigate: vi.fn(),
  onAnalyze: vi.fn(),
};
beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({
    asOf: new Date().toISOString(),
    chart: daily, close: daily[daily.length - 1]!.close,
    lower: 70500, upper: 82200, bias: "MIXED / RANGE",
    market: "Uneven participation",
    daily: { rsi14: 49, ema50: 79000, trend: "MIXED" },
  }), { status: 200, headers: { "content-type": "application/json" } })));
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.clearAllMocks(); });

describe("read-only command center", () => {
  it("shows honest 90-day derived timeframes, not a fabricated yearly chart", async () => {
    render(<CommandCenter {...props} />);
    expect(await screen.findByText(/Kraken daily candles through/)).toBeTruthy();
    expect(screen.getByRole("region", { name: "Zobiris command center" })).toBeTruthy();
    expect(screen.getByText("Daily")).toBeTruthy();
    expect(screen.getByText("Weekly")).toBeTruthy();
    expect(screen.getByText("Monthly")).toBeTruthy();
    expect(screen.getByText("Yearly")).toBeTruthy();
    expect(screen.getByText("Awaiting verified historical candles")).toBeTruthy();
    expect(screen.getByText("365-day historical feed not connected")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Full analysis ↗" }));
    expect(props.onNavigate).toHaveBeenCalledWith("market");
    fireEvent.click(screen.getByRole("button", { name: "Analyze LINK" }));
    expect(props.onAnalyze).toHaveBeenCalledWith("LINK");
  });

  it("never discloses private balances, orders, or trades when account sync is locked", async () => {
    render(<CommandCenter {...props}
      accountSynced={false}
      cash={123.45}
      freeCash={123.45}
      portfolioValue={987.65}
      reservedBuys={0}
      orders={[{ symbol: "SECRET", side: "SELL", targetPriceUsd: 999, amountUsd: 350 }]}
      trades={[{ id: "private", symbol: "SECRET", side: "BUY", at: new Date().toISOString(), source: "private" }]}
    />);
    expect(await screen.findByText(/Kraken daily candles through/)).toBeTruthy();
    expect(screen.queryByText("$123.45")).toBeNull();
    expect(screen.queryByText("$987.65")).toBeNull();
    expect(screen.queryByText(/SELL SECRET/)).toBeNull();
    expect(screen.queryByText(/BUY SECRET/)).toBeNull();
    expect(screen.getByText(/Private account locked/)).toBeTruthy();
  });

  it("fails closed when the market brief is unavailable", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("Unavailable", { status: 503 })));
    render(<CommandCenter {...props} snapshotFresh={false} />);
    expect(await screen.findByText(/Verified BTC daily history is unavailable/)).toBeTruthy();
    expect(screen.getByText("Market snapshot stale / unavailable")).toBeTruthy();
    expect(screen.getByText("Wait · stale market")).toBeTruthy();
    expect(screen.queryByText("Daily")).toBeNull();
  });
});
