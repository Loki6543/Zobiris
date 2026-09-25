// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "../ui/App";

const rankedAssets = [
  {
    symbol: "SOL",
    mappingStatus: "verified",
    action: "REDUCE",
    confidence: { pct: 52 },
    opportunity: { adjusted: 15.5 },
    strategy21: {
      researchScore: 49.2,
      explanation: { observations: [{ claim: JSON.stringify({ priceUsd: 117.5 }) }] }
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
      explanation: { observations: [{ claim: JSON.stringify({ priceUsd: 90 }) }] }
    }
  },
  {
    symbol: "AVAX",
    mappingStatus: "verified",
    action: "HOLD",
    confidence: { pct: 55 },
    opportunity: { adjusted: 20 },
    strategy21: {
      researchScore: 54,
      explanation: { observations: [{ claim: JSON.stringify({ priceUsd: 10 }) }] }
    }
  }
];

beforeEach(() => {
  localStorage.clear();
  globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.includes("/api/snapshot/latest")) {
      return new Response(JSON.stringify({
        snapshot: {
          regime: "Regime Break",
          regimeConfidence: 42,
          rankedAssets: JSON.stringify(rankedAssets)
        }
      }), { status: 200, headers: { "content-type": "application/json" } });
    }
    if (url.includes("/api/watchlist")) {
      return new Response(JSON.stringify({ watchlist: [{ symbol: "BTC" }, { symbol: "AVAX" }] }), { status: 200, headers: { "content-type": "application/json" } });
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
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "content-type": "application/json" } });
  }) as typeof fetch;
});

describe("simplified Zobiris Core", () => {
  it("keeps decision making on three primary screens", async () => {
    render(<App />);
    expect(await screen.findByText("Current positions")).toBeTruthy();
    expect(screen.getByText("Open orders")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Open SOL order analysis" }));
    expect(await screen.findByText("BEST FIRST COURSE OF ACTION")).toBeTruthy();
    expect(screen.getByText("SELL / HARVEST LADDER")).toBeTruthy();
    expect(screen.getByText("BUY / RE-ENTRY RANGE")).toBeTruthy();
    expect(screen.getByText("DEFENSIVE REDUCTION")).toBeTruthy();
    expect(screen.getByText("WAIT — research range only")).toBeTruthy();
    expect(screen.getByText(/Why Zobiris learned this:/)).toBeTruthy();
    expect(screen.getByText(/First add:/)).toBeTruthy();
    expect(screen.getAllByText(/reduce .*%/i).length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("button", { name: "Market Today" }));
    expect(await screen.findByText("New positions to consider")).toBeTruthy();
    expect(screen.getByText("Rules learned from you")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "History / Learning" }));
    expect(await screen.findByText("Trade memory")).toBeTruthy();
    expect(screen.getByText("What Zobiris has learned")).toBeTruthy();
  });
});
