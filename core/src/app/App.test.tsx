// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";
import { App } from "./App";

const policyHash="a".repeat(64);
const provider={
  status:"LIVE" as const,
  lastAttemptAt:"2026-10-07T01:00:00.000Z",
  lastSuccessAt:"2026-10-07T01:00:00.000Z",
  dataAsOf:"2026-10-07T01:00:00.000Z",
  ageMs:1000,
  error:null,
  mode:"test",
};

const snapshot={
  version:"1.0" as const,
  generatedAt:"2026-10-07T01:00:00.000Z",
  policy:{version:"2.2.0",hash:policyHash},
  authority:{newBuyEnabled:true,reasons:[] as string[]},
  market:{
    state:"BULLISH" as const,
    btcPriceUsd:90000,
    btc7dPct:3,
    btc30dPct:8,
    btc90dPct:12,
    breadth7dPositive:0.62,
    breadth30dPositive:0.57,
  },
  health:{
    cmc:"LIVE" as const,
    krakenInstruments:"LIVE" as const,
    executionSampled:1,
    watchlistCount:1,
    lastRefreshAttemptAt:"2026-10-07T01:00:00.000Z",
    lastRefreshSuccessAt:"2026-10-07T01:00:00.000Z",
    refreshDurationMs:1500,
    lastError:null,
    providers:{
      cmcQuotes:provider,
      cmcMetadata:provider,
      krakenInstruments:provider,
      krakenTicker:provider,
    },
    clock:{
      state:"HEALTHY" as const,
      wallMonotonicDriftMs:0,
      futureProviderTimestampCount:0,
      reasons:[] as string[],
    },
    stages:[],
  },
  qualifiedCount:0,
  nearRotationCount:1,
  rows:[{
    rank:1,
    symbol:"SOL",
    name:"Solana",
    cmcRank:6,
    state:"WAIT_FOR_PULLBACK" as const,
    priceUsd:120,
    intendedLimitPrice:114,
    change7dPct:5,
    change30dPct:-12,
    change90dPct:-24,
    relative30dVsBtcPct:-20,
    relative90dVsBtcPct:-36,
    catchUpQuality:82,
    entryQuality:76,
    marketDepthGrade:"NORMAL" as const,
    personalExecutionPass:true,
    krakenPair:"SOLUSD",
    setupQualified:true,
    maxNewOrderUsd:37,
    qualifiesForNewCapital:true,
    reasonCodes:["wait_for_pullback"],
  }],
};

function json(value:unknown) {
  return new Response(JSON.stringify(value),{
    status:200,
    headers:{"content-type":"application/json"},
  });
}

afterEach(()=>{
  cleanup();
  vi.restoreAllMocks();
});

describe("Core workspace navigation",()=>{
  test("renders live compare, portfolio and learning workspaces",async()=>{
    const fetchMock=vi.fn(async(input:RequestInfo|URL)=>{
      const url=String(input);
      if(url.includes("/api/learning/evidence/")){
        const horizon=url.split("/").at(-1) ?? "1H";
        return json({
          ok:true,
          evidence:{
            policyVersion:"2.2.0",
            policyHash,
            horizon,
            qualifiedEpisodes:2,
            controlEpisodes:3,
            independentMarketEpisodes:1,
            maxMarketEpisodeShare:0.25,
            promotable:false,
            reasons:["qualified_episodes_2_below_30"],
          },
        });
      }
      return json({ok:true,snapshot});
    });
    vi.stubGlobal("fetch",fetchMock);

    render(<App/>);
    expect(await screen.findByText("Watchlist Rankings")).toBeTruthy();

    fireEvent.click(screen.getByRole("button",{name:"COMPARE"}));
    expect(screen.getByText("Side-by-Side Opportunity Compare")).toBeTruthy();
    expect(screen.getByText("ZOBIRIS ENTRY")).toBeTruthy();

    fireEvent.click(screen.getByRole("button",{name:"PORTFOLIO"}));
    expect(screen.getByText("Portfolio & Execution Readiness")).toBeTruthy();
    expect(screen.getByText("NEW-BUY AUTHORITY ON")).toBeTruthy();

    fireEvent.click(screen.getByRole("button",{name:"LEARNING"}));
    expect(await screen.findByText("Learning Evidence Ledger")).toBeTruthy();
    expect((await screen.findAllByText("EVIDENCE BUILDING")).length).toBe(7);
    expect(fetchMock).toHaveBeenCalledWith("/api/learning/evidence/30D",{cache:"no-store"});
  });
});
