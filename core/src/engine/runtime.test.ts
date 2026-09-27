import { describe,expect,it } from "vitest";
import { openDatabase } from "../db/client.js";
import { migrate } from "../db/migrate.js";
import { EngineRuntime, type EngineRuntimeDeps } from "./runtime.js";

describe("EngineRuntime",()=>{
  it("ranks all watchlist rows and samples execution only for plausible delayed rotations",async()=>{
    const db=openDatabase(":memory:");migrate(db);
    const watchlist=[{symbol:"BTC",name:"Bitcoin",cmcId:"1"},{symbol:"AAVE",name:"Aave",cmcId:"7278"},{symbol:"SOL",name:"Solana",cmcId:"5426"}];
    const quotes:any[]=[
      {cmcId:"1",symbol:"BTC",name:"Bitcoin",priceUsd:85000,change1hPct:0,change24hPct:1,change7dPct:4,change30dPct:10,change60dPct:20,change90dPct:40,marketCapUsd:1,volume24hUsd:1,volumeChange24hPct:0,lastUpdated:null},
      {cmcId:"7278",symbol:"AAVE",name:"Aave",priceUsd:145,change1hPct:0,change24hPct:-1,change7dPct:5,change30dPct:-10,change60dPct:-15,change90dPct:-28,marketCapUsd:1,volume24hUsd:1,volumeChange24hPct:0,lastUpdated:null},
      {cmcId:"5426",symbol:"SOL",name:"Solana",priceUsd:120,change1hPct:0,change24hPct:2,change7dPct:20,change30dPct:30,change60dPct:35,change90dPct:60,marketCapUsd:1,volume24hUsd:1,volumeChange24hPct:0,lastUpdated:null},
    ];
    let bookCalls=0;
    const deps:EngineRuntimeDeps={
      fetchQuotes:async()=>quotes,
      fetchMetadata:async()=>watchlist.map(a=>({cmcId:a.cmcId,symbol:a.symbol,name:a.name,category:"coin",tags:[],logo:null})),
      fetchInstruments:async()=>new Map(watchlist.map(a=>[a.symbol,{symbol:a.symbol,pairKey:`${a.symbol}/USD`,altname:`${a.symbol}USD`,wsname:`${a.symbol}/USD`,status:"online",online:true,orderMin:null,costMinUsd:null,tickSize:null,pairDecimals:null,lotDecimals:null}])),
      fetchBook:async(pair)=>{bookCalls++;return {pair,observedAt:"2026-09-27T01:00:00Z",bids:[{price:99.9,qty:100}],asks:[{price:100.1,qty:100}]};},
      now:()=>new Date("2026-09-27T01:00:00Z"),
      sleep:async()=>{},
    };
    const runtime=new EngineRuntime(db,undefined,{watchlist,availableCashUsd:600},deps);
    const snap=await runtime.refresh();
    expect(snap.rows).toHaveLength(3);
    expect(bookCalls).toBe(1);
    expect(snap.rows.find(r=>r.symbol==="AAVE")?.qualifiesForNewCapital).toBe(true);
    expect(snap.rows.find(r=>r.symbol==="SOL")?.qualifiesForNewCapital).toBe(false);
    expect((db.prepare("SELECT COUNT(*) n FROM execution_snapshots").get() as any).n).toBeGreaterThan(0);
    db.close();
  });
});
