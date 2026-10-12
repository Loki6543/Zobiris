// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { momentumScores, trendLabel } from "../ui/DashboardPage";
import { CoinSearch, DailyEdge, markDailyEdge, readDailyEdge } from "../ui/DashboardChrome";
import { parseCoinGeckoSectors } from "../strategyV2/feed";

afterEach(cleanup);

describe("dashboard scoring", () => {
  it("ranks momentum as a 0-100 percentile of 60% 30d + 40% 7d", () => {
    const m = momentumScores([{ symbol: "A", change7dPct: 10, change30dPct: 40 }, { symbol: "B", change7dPct: 0, change30dPct: 0 }, { symbol: "C", change7dPct: -5, change30dPct: -20 }, { symbol: "D", change7dPct: null, change30dPct: 5 }]);
    expect([m.get("A"), m.get("B"), m.get("C"), m.has("D")]).toEqual([100, 50, 0, false]);
  });
  it("labels trend from 7d and 30d agreement", () => {
    expect(trendLabel({ change7dPct: 2, change30dPct: 5 })).toBe("BULLISH");
    expect(trendLabel({ change7dPct: -2, change30dPct: -5 })).toBe("BEARISH");
    expect(trendLabel({ change7dPct: 2, change30dPct: -5 })).toBe("MIXED");
  });
  it("marks a sector move above 25% as unreliable (membership change)", () => {
    const s = parseCoinGeckoSectors([{ id: "artificial-intelligence", market_cap: 1, market_cap_change_24h: 6.4 }, { id: "real-world-assets-rwa", market_cap: 1, market_cap_change_24h: -31.2 }, { id: "other", market_cap: 1 }]);
    expect(s.map((x) => [x.label, x.reliable])).toEqual([["AI", true], ["RWA", false]]);
  });
});

describe("dashboard chrome", () => {
  it("ticks the daily edge routine for pages visited today", () => {
    localStorage.clear();
    markDailyEdge("market"); markDailyEdge("market"); markDailyEdge("compare");
    expect(readDailyEdge()).toEqual(["market"]);
    render(<DailyEdge done={readDailyEdge()} onOpen={() => {}} />);
    expect(screen.getByRole("img", { name: "1 of 5 done today" })).toBeTruthy();
  });
  it("searches coins by symbol or name and opens the pick", () => {
    let picked = "";
    render(<CoinSearch coins={[{ symbol: "LINK", name: "Chainlink" }, { symbol: "SOL", name: "Solana" }]} onPick={(s) => { picked = s; }} />);
    fireEvent.change(screen.getByRole("combobox", { name: "Search your coins" }), { target: { value: "chain" } });
    fireEvent.click(screen.getByRole("button", { name: /LINK/ }));
    expect(picked).toBe("LINK");
  });
});
