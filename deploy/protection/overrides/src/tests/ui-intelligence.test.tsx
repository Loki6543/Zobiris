// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "../ui/App";
import { CASH_USD, HOLDINGS, OPEN_ORDERS, PORTFOLIO_CAPTURED_AT, TRADE_MEMORY } from "../ui/simplePortfolioData";

const rankedAssets = [
  {
    symbol: "SOL",
    mappingStatus: "verified",
    action: "REDUCE",
    confidence: { pct: 52 },
    opportunity: { adjusted: 15.5 },
    strategy21: {
      eligibility: {status: "WATCH_ONLY", maximumOrderUsd: 0, failureReasons: ["Kraken execution history warming up"]},
      positionAuthority: {maxNextOrderUsd: 0},
      researchScore: 49.2,
      explanation: { observations: [{ observedAt: new Date().toISOString(), expiresAt: new Date(Date.now()+3600000).toISOString(), claim: JSON.stringify({ priceUsd: 117.5 }) }] }
    }
  },
  {
    symbol: "QNT",
    mappingStatus: "verified",
    action: "HOLD",
    confidence: { pct: 58 },
    opportunity: { adjusted: 22 },
    strategy21: {
      researchScore: 61,
      explanation: { observations: [{ observedAt: new Date().toISOString(), expiresAt: new Date(Date.now()+3600000).toISOString(), claim: JSON.stringify({ priceUsd: 90 }) }] }
    }
  },
  {
    symbol: "AVAX",
    mappingStatus: "verified",
    action: "HOLD",
    confidence: { pct: 82 },
    opportunity: { adjusted: 20 },
    strategy21: {
      researchScore: 64,
      explanation: { observations: [{ observedAt: new Date().toISOString(), expiresAt: new Date(Date.now()+3600000).toISOString(), claim: JSON.stringify({ priceUsd: 10 }) }] }
    }
  },
  {
    symbol: "ATOM",
    mappingStatus: "verified",
    action: "HOLD",
    confidence: { pct: 78 },
    opportunity: { adjusted: 24 },
    strategy21: {
      eligibility: { status: "ACTIVE_ELIGIBLE", maximumOrderUsd: 42.5, failureReasons: [] },
      positionAuthority: { maxNextOrderUsd: 42.5 },
      researchScore: 62,
      delayedRotation: {
        mode: "DELAYED_ROTATION_PILOT_V1",
        status: "QUALIFIED",
        qualifiesForNewCapital: true,
        score: 84,
        change24hPct: -1,
        change7dPct: 5,
        change30dPct: -8,
        change90dPct: -24,
        recommendedPullbackPct: 5,
      },
      explanation: { observations: [{ observedAt: new Date().toISOString(), expiresAt: new Date(Date.now()+3600000).toISOString(), claim: JSON.stringify({ priceUsd: 2.5 }) }] }
    }
  },
  {
    symbol: "KAS",
    mappingStatus: "verified",
    action: "HOLD",
    confidence: { pct: 58 },
    opportunity: { adjusted: 20 },
    strategy21: {
      eligibility: { status: "WATCH_ONLY", maximumOrderUsd: 0, failureReasons: ["Kraken execution history warming up"] },
      positionAuthority: { maxNextOrderUsd: 0 },
      researchScore: 50,
      explanation: { observations: [{ observedAt: new Date().toISOString(), expiresAt: new Date(Date.now()+3600000).toISOString(), claim: JSON.stringify({ priceUsd: 0.0423 }) }] }
    }
  }
];

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  sessionStorage.setItem("zobiris.operatorToken.v1", "test-refresh-token");
  globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.includes("/api/snapshot/latest")) {
      return new Response(JSON.stringify({
        snapshot: {
          asOf: Date.now(),
          regime: "Regime Break",
          regimeConfidence: 42,
          rankedAssets: JSON.stringify(rankedAssets)
        }
      }), { status: 200, headers: { "content-type": "application/json" } });
    }
    if(url.includes('/api/entry-rules'))return new Response(JSON.stringify({rules:{ATOM:{symbol:'ATOM',pair:'ATOMUSD',tickSize:0.001,lotDecimals:8,orderMin:0.1,costMin:0.5,status:'online',observedAt:new Date().toISOString()}}}),{status:200});
    if (url.includes("/api/watchlist")) {
      return new Response(JSON.stringify({ watchlist: [{ symbol: "BTC" }, { symbol: "ETH" }, ...rankedAssets.map(asset => ({symbol: asset.symbol}))] }), { status: 200, headers: { "content-type": "application/json" } });
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
    if (url.includes("/api/asset/SOL")) {
      return new Response(JSON.stringify({
        caseFile: {
          decisionBoundary: { nearestFlip: "HOLD requires higher opportunity score." }
        },
        strategy21: {
          eligibility: { status: "WATCH_ONLY", failureReasons: ["Kraken execution history warming up"] },
          positionAuthority: { maxNextOrderUsd: 0 }
        }
      }), { status: 200, headers: { "content-type": "application/json" } });
    }
    if (url.includes("/api/asset/AVAX")) {
      return new Response(JSON.stringify({
        strategy21: {
          eligibility: { status: "WATCH_ONLY", failureReasons: ["Kraken weak-day volume/turnover gate failed"] },
          positionAuthority: { maxNextOrderUsd: 0 }
        }
      }), { status: 200, headers: { "content-type": "application/json" } });
    }
    if (url.includes("/api/asset/ATOM")) {
      return new Response(JSON.stringify({
        strategy21: {
          eligibility: { status: "ACTIVE_ELIGIBLE", maximumOrderUsd: 42.5, failureReasons: [] },
          positionAuthority: { maxNextOrderUsd: 42.5 }
        }
      }), { status: 200, headers: { "content-type": "application/json" } });
    }
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "content-type": "application/json" } });
  }) as typeof fetch;
});

describe("simplified Zobiris Core", () => {
  it("keeps decision making across primary screens and the horizon policy", async () => {
    render(<App />);
    expect(await screen.findByText("Current positions")).toBeTruthy();
    expect(screen.getByText("Open orders")).toBeTruthy();
    expect(within(screen.getByRole("region", { name: "Portfolio overview" })).getByText("$713.74")).toBeTruthy();
    const solRow = screen.getByRole("button", { name: "Open SOL order analysis" }).closest("tr");
    expect(solRow).toBeTruthy();
    expect(within(solRow as HTMLElement).getByText("L3 CORE HOLD")).toBeTruthy();
    const harvestCandidate = screen.getByText("Best harvest candidate").parentElement;
    expect(harvestCandidate?.textContent ?? "").not.toContain("SOL ");
    expect(screen.getAllByText("SELL SOL — REVIEW / CORE HOLD").length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("button", { name: "Open KAS order analysis" }));
    expect(await screen.findByText(/TRIM 50% AT/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Close KAS order analysis" }));

    fireEvent.click(screen.getByRole("button", { name: "Open SOL order analysis" }));
    expect(await screen.findByText("BEST FIRST COURSE OF ACTION")).toBeTruthy();
    expect(screen.getByText("CORE HOLD — REVIEW EXISTING SELL ORDER")).toBeTruthy();
    expect(screen.queryByText(/next planned trim/i)).toBeNull();
    expect(screen.getByText("Existing sell orders from the synchronized Kraken account")).toBeTruthy();
    expect(screen.getByText("LONG-TERM EXIT GATE")).toBeTruthy();
    expect(screen.getByText("DOWNGRADE REQUIRED")).toBeTruthy();
    expect(screen.queryByText("SELL / HARVEST LADDER")).toBeNull();
    expect(screen.queryByText("DEFENSIVE REDUCTION")).toBeNull();
    expect(screen.getByText("BUY / RE-ENTRY RANGE")).toBeTruthy();
    expect(screen.getByText("WAIT — research range only")).toBeTruthy();
    expect(screen.getByText(/Why Zobiris learned this:/)).toBeTruthy();
    expect(screen.getByText(/First add:/)).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Market Today" }));
    expect(await screen.findByText("New positions to consider")).toBeTruthy();
    expect((await screen.findAllByText("ATOM")).length).toBeGreaterThan(0);
    expect(await screen.findByText("Kraken execution gate passed · rotation qualified · max next order $42.50")).toBeTruthy();
    expect(screen.queryByText("Research thesis + falsifiers")).toBeNull();
    expect(screen.queryByText(/Break conditions:/)).toBeNull();
    expect(screen.queryByText(/Not yet measured:/)).toBeNull();
    expect(screen.getByText("LIMIT CANDIDATE · $37.00")).toBeTruthy();
    expect(screen.getByText("$2.375")).toBeTruthy();
    expect(screen.getByText("AVAX")).toBeTruthy();
    expect(screen.getByText("Watchlist ranking")).toBeTruthy();
    const ranking = screen.getByText("Watchlist ranking").closest("section");
    expect(ranking?.querySelector("tbody tr td:nth-child(2)")?.textContent).toBe("ATOM");
    expect(screen.getByText("QNT")).toBeTruthy();
    expect(screen.getAllByText(/PAUSE/).length).toBeGreaterThan(0);
    expect(screen.getByText("Rules learned from you")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Time Outlook" }));
    expect(await screen.findByText("Investment horizons")).toBeTruthy();
    expect(screen.getByText("L3 PROTECTION ACTIVE")).toBeTruthy();
    expect(screen.getByText("L3 — Long-Term Core")).toBeTruthy();
    expect(screen.getByText("P2 — Position")).toBeTruthy();
    expect(screen.getByText("T1 — Tactical")).toBeTruthy();
    expect(screen.getByText("BTC")).toBeTruthy();
    expect(screen.getByText("ETH")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "History / Learning" }));
    expect(await screen.findByText("Trade memory")).toBeTruthy();
    expect(screen.getByText("What Zobiris has learned")).toBeTruthy();
  });
});

afterEach(() => cleanup());
it("shows refresh failures instead of silently presenting old data as refreshed", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) =>
    String(input) === "/api/refresh"
      ? new Response(JSON.stringify({error:"Rate limit exceeded"}), {status:429})
      : originalFetch(input, init)) as typeof fetch;
  render(<App />);
  await screen.findByText("Current positions");
  fireEvent.click(screen.getByRole("button", {name:"Refresh market"}));
  expect(await screen.findByRole("alert")).toBeTruthy();
});
it("holding snapshot authority cannot be replaced by independently fetched detail", async () => {
 const originalFetch = globalThis.fetch;
 globalThis.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
   if (String(input) === "/api/asset/SOL") return new Response(JSON.stringify({strategy21:{
     eligibility:{status:"BLOCKED", maximumOrderUsd:20, failureReasons:["depth failed"]},
     positionAuthority:{maxNextOrderUsd:20}
   }}));
   return originalFetch(input, init);
 }) as typeof fetch;
 render(<App />);
 await screen.findByText("Current positions");
 fireEvent.click(screen.getByRole("button", {name:"Open SOL order analysis"}));
 expect(await screen.findByText("WAIT — research range only")).toBeTruthy();
 expect(screen.queryByText("Eligible for staged limit")).toBeNull();
});

it("labels fallback prices and does not present them as live order instructions", async () => {
 render(<App />);
 await screen.findByText("Current positions");
 fireEvent.click(screen.getByRole("button", {name:"Open EGLD order analysis"}));
 expect(await screen.findByText("VERIFY CURRENT PRICE FIRST")).toBeTruthy();
 expect(screen.queryByText(/\$4.47 live/)).toBeNull();
});

it("expires quote-derived actions while an otherwise fresh page remains open", async () => {
 vi.useFakeTimers({toFake:["setInterval", "clearInterval", "Date"]});
 render(<App />);
 await screen.findByText("Current positions");
 fireEvent.click(screen.getByRole("button", {name:"Open SOL order analysis"}));
 expect(await screen.findByText("BEST FIRST COURSE OF ACTION")).toBeTruthy();
 try {
   vi.setSystemTime(Date.now() + 2 * 3600000);
   await act(async () => { await vi.advanceTimersByTimeAsync(60000); });
   expect(screen.queryByText("VERIFY CURRENT PRICE FIRST")).toBeTruthy();
 } finally { vi.useRealTimers(); }
});




it("keeps the screenshot-inspired sidebar connected to real pages and quote-based movers", async () => {
  render(<App />);
  await screen.findByText("Current positions");
  const navigation = screen.getByRole("navigation", {name: "Dashboard"});
  expect(navigation.querySelector(".dashboard-sidebar-brand")?.textContent).toContain("ZOBIRIS");
  expect(screen.getByRole("heading", {name: "Portfolio"})).toBeTruthy();
  expect(within(navigation).getByRole("button", {name: "Portfolio"}).getAttribute("aria-current")).toBe("page");
  fireEvent.click(within(navigation).getByRole("button", {name: "Market Today"}));
  expect(screen.getByRole("heading", {name: "Market Today"})).toBeTruthy();
  fireEvent.click(within(navigation).getByRole("button", {name: "Watchlist"}));
  expect(screen.getByRole("heading", {name: "Watchlist"})).toBeTruthy();
  expect(screen.getByRole("region", {name: "Verified top watchlist movers"})).toBeTruthy();
  expect(within(navigation).getByRole("button", {name: "Watchlist"}).getAttribute("aria-current")).toBe("page");
});
