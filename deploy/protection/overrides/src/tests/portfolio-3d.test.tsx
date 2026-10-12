// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen, fireEvent } from "@testing-library/react";
import { Portfolio3D, layoutBars } from "../ui/Portfolio3D";

const rows = [
  { symbol: "BTC", quantity: 0.005, livePrice: 80000, value: 400, upl: 8, avgPriceUsd: 74000, action: "L3 CORE HOLD" },
  { symbol: "ETH", quantity: 0.08, livePrice: 2500, value: 200, upl: -3, avgPriceUsd: 2580 },
  { symbol: "DUST", quantity: 1, livePrice: 0, value: 0, upl: 0 },
];

describe("Portfolio3D", () => {
  afterEach(cleanup);
  it("puts the largest position in the centre and scales height by value", () => {
    const bars = layoutBars(rows, 100);
    expect(bars.map((b) => b.symbol)).toEqual(["BTC", "ETH", "CASH"]);
    expect(bars[0]!.h).toBeGreaterThan(bars[1]!.h);
    expect(Math.hypot(bars[0]!.x, bars[0]!.y)).toBeLessThanOrEqual(Math.hypot(bars[1]!.x, bars[1]!.y));
  });
  it("stays private while the account is locked", () => {
    render(<Portfolio3D rows={rows} cash={100} accountSynced={false} />);
    expect(screen.getByText(/Unlock your private portfolio/)).toBeTruthy();
    expect(screen.queryByText("$400.00")).toBeNull();
  });
  it("shows details for a holding picked from the legend", () => {
    render(<Portfolio3D rows={rows} cash={100} accountSynced />);
    fireEvent.click(screen.getByRole("button", { name: /ETH/ }));
    expect(screen.getByText("-3.0%")).toBeTruthy();
    expect(screen.getByText("$2,580.00")).toBeTruthy();
  });
});
