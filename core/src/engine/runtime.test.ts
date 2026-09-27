import { describe,expect,it } from "vitest";
import { openDatabase } from "../db/client.js";
import { migrate } from "../db/migrate.js";
import { ZOBIRIS_POLICY } from "../policy/config.js";
import { EngineRuntime, type EngineRuntimeDeps } from "./runtime.js";

function tickerMap(pairs:string[],quotes:any[]) {
  return new Map(pairs.map(pair=>{
    const symbol=pair.split("/")[0]!;
    const quote=quotes.find(q=>q.symbol===symbol);
    const p=quote?.priceUsd ?? 100;
    return [pair,{pairKey:pair,bid:p*0.999,ask:p*1.001,last:p,volumeTodayBase:1,volume24hBase:10,volume24hUsd:p*10}];
  }));
}

describe("EngineRuntime",()=>{
  it("ranks all watchlist rows, samples plausible rotations and creates one policy-tagged episode",async()=>{
    const db=openDatabase(":memory:");migrate(db);
    const watchlist=[{symbol:"BTC",name:"Bitcoin",cmcId:"1"},{symbol:"AAVE",name:"Aave",cmcId:"7278"},{symbol:"SOL",name:"Solana",cmcId:"5426"}];
    const quotes:any[]=[
      {cmcId:"1",symbol:"BTC",name:"Bitcoin",priceUsd:85000,change1hPct:0,change24hPct:1,change7dPct:4,change30dPct:10,change60dPct:20,change90dPct:40,marketCapUsd:1,volume24hUsd:1,volumeChange24hPct:0,lastUpdated:"2026-09-27T01:00:00Z"},
      {cmcId:"7278",symbol:"AAVE",name:"Aave",priceUsd:145,change1hPct:0,change24hPct:-1,change7dPct:5,change30dPct:-10,change60dPct:-15,change90dPct:-28,marketCapUsd:1,volume24hUsd:1,volumeChange24hPct:0,lastUpdated:"2026-09-27T01:00:00Z"},
      {cmcId:"5426",symbol:"SOL",name:"Solana",priceUsd:120,change1hPct:0,change24hPct:2,change7dPct:20,change30dPct:30,change60dPct:35,change90dPct:60,marketCapUsd:1,volume24hUsd:1,volumeChange24hPct:0,lastUpdated:"2026-09-27T01:00:00Z"},
    ];
    let bookCalls=0,mono=0;
    const deps:EngineRuntimeDeps={
      fetchQuotes:async()=>quotes,
      fetchMetadata:async()=>watchlist.map(a=>({cmcId:a.cmcId,symbol:a.symbol,name:a.name,category:"coin",tags:[],logo:null})),
      fetchInstruments:async()=>new Map(watchlist.map(a=>[a.symbol,{symbol:a.symbol,pairKey:`${a.symbol}/USD`,altname:`${a.symbol}USD`,wsname:`${a.symbol}/USD`,status:"online",online:true,orderMin:null,costMinUsd:null,tickSize:null,pairDecimals:null,lotDecimals:null}])),
      fetchTickers:async(pairs)=>tickerMap(pairs,quotes),
      fetchBook:async(pair)=>{bookCalls++;return {pair,observedAt:"2026-09-27T01:00:00Z",bids:[{price:99.9,qty:100}],asks:[{price:100.1,qty:100}]};},
      fetchCandles:async()=>[],
      now:()=>new Date("2026-09-27T01:00:00Z"),
      monotonicNow:()=>mono++,
      sleep:async()=>{},
    };
    const runtime=new EngineRuntime(db,undefined,{watchlist,availableCashUsd:600},deps);
    const snap=await runtime.refresh();
    expect(snap.rows).toHaveLength(3);
    expect(bookCalls).toBe(1);
    expect(snap.authority.newBuyEnabled).toBe(true);
    expect(snap.rows.find(r=>r.symbol==="AAVE")?.qualifiesForNewCapital).toBe(true);
    expect(snap.rows.find(r=>r.symbol==="AAVE")?.setupQualified).toBe(true);
    expect(snap.rows.find(r=>r.symbol==="SOL")?.qualifiesForNewCapital).toBe(false);
    expect((db.prepare("SELECT COUNT(*) n FROM execution_snapshots").get() as any).n).toBeGreaterThan(0);
    const episode=db.prepare("SELECT policy_version,policy_hash FROM strategy_episodes WHERE symbol='AAVE'").get() as any;
    expect(episode.policy_version).toBe(ZOBIRIS_POLICY.version);
    expect(episode.policy_hash).toMatch(/^[a-f0-9]{64}$/);
    db.close();
  });
});

describe("EngineRuntime execution rotation",()=>{
  it("rotates limited execution sampling and keeps recent results cached",async()=>{
    const db=openDatabase(":memory:");migrate(db);
    const watchlist=[
      {symbol:"BTC",name:"Bitcoin",cmcId:"1"},
      {symbol:"AAVE",name:"Aave",cmcId:"2"},
      {symbol:"LINK",name:"Chainlink",cmcId:"3"},
      {symbol:"COMP",name:"Compound",cmcId:"4"},
    ];
    const mk=(symbol:string,id:string,change30dPct:number,change90dPct:number)=>({
      cmcId:id,symbol,name:symbol,priceUsd:100,change1hPct:0,change24hPct:0,
      change7dPct:5,change30dPct,change60dPct:-10,change90dPct,
      marketCapUsd:1,volume24hUsd:1,volumeChange24hPct:0,lastUpdated:new Date(nowMs).toISOString()
    });
    let nowMs=Date.parse("2026-09-27T01:00:00Z"),mono=0;
    const quotes:any[]=[
      {...mk("BTC","1",10,40),priceUsd:85000,change7dPct:4},
      mk("AAVE","2",-20,-40),mk("LINK","3",1,-30),mk("COMP","4",2,-20),
    ];
    const calls:string[]=[];
    const deps:EngineRuntimeDeps={
      fetchQuotes:async()=>{for(const q of quotes) q.lastUpdated=new Date(nowMs).toISOString();return quotes;},
      fetchMetadata:async()=>watchlist.map(a=>({cmcId:a.cmcId,symbol:a.symbol,name:a.name,category:"coin",tags:[],logo:null})),
      fetchInstruments:async()=>new Map(watchlist.map(a=>[a.symbol,{symbol:a.symbol,pairKey:`${a.symbol}/USD`,altname:`${a.symbol}USD`,wsname:`${a.symbol}/USD`,status:"online",online:true,orderMin:null,costMinUsd:null,tickSize:null,pairDecimals:null,lotDecimals:null}])),
      fetchTickers:async(pairs)=>tickerMap(pairs,quotes),
      fetchBook:async(pair)=>{calls.push(pair);return {pair,observedAt:new Date(nowMs).toISOString(),bids:[{price:99.9,qty:100}],asks:[{price:100.1,qty:100}]};},
      fetchCandles:async()=>[],
      now:()=>new Date(nowMs),
      monotonicNow:()=>mono++,
      sleep:async()=>{},
    };
    const runtime=new EngineRuntime(db,undefined,{watchlist,availableCashUsd:600,executionSampleLimit:1},deps);
    const first=await runtime.refresh();
    nowMs+=5*60_000;
    const second=await runtime.refresh();
    nowMs+=5*60_000;
    const third=await runtime.refresh();

    expect(new Set(calls).size).toBe(3);
    expect(first.health.executionSampled).toBe(1);
    expect(second.health.executionSampled).toBe(2);
    expect(third.health.executionSampled).toBe(3);
    expect(third.rows.filter(r=>["AAVE","LINK","COMP"].includes(r.symbol)).every(r=>r.state!=="EXECUTION_WARMUP")).toBe(true);
    db.close();
  });
});

describe("EngineRuntime provider degradation",()=>{
  it("uses a fresh cached quote snapshot after a transient failure, then disables new buys once stale",async()=>{
    const db=openDatabase(":memory:");migrate(db);
    const watchlist=[{symbol:"BTC",name:"Bitcoin",cmcId:"1"},{symbol:"AAVE",name:"Aave",cmcId:"2"}];
    let nowMs=Date.parse("2026-09-27T01:00:00Z"),mono=0,failQuotes=false;
    const quotes:any[]=[
      {cmcId:"1",symbol:"BTC",name:"Bitcoin",priceUsd:85000,change1hPct:0,change24hPct:1,change7dPct:4,change30dPct:10,change60dPct:20,change90dPct:40,marketCapUsd:1,volume24hUsd:1,volumeChange24hPct:0,lastUpdated:new Date(nowMs).toISOString()},
      {cmcId:"2",symbol:"AAVE",name:"Aave",priceUsd:145,change1hPct:0,change24hPct:-1,change7dPct:5,change30dPct:-10,change60dPct:-15,change90dPct:-28,marketCapUsd:1,volume24hUsd:1,volumeChange24hPct:0,lastUpdated:new Date(nowMs).toISOString()},
    ];
    let bookCalls=0;
    const deps:EngineRuntimeDeps={
      fetchQuotes:async()=>{if(failQuotes) throw new Error("CMC down"); return quotes;},
      fetchMetadata:async()=>watchlist.map(a=>({cmcId:a.cmcId,symbol:a.symbol,name:a.name,category:"coin",tags:[],logo:null})),
      fetchInstruments:async()=>new Map(watchlist.map(a=>[a.symbol,{symbol:a.symbol,pairKey:`${a.symbol}/USD`,altname:`${a.symbol}USD`,wsname:`${a.symbol}/USD`,status:"online",online:true,orderMin:null,costMinUsd:null,tickSize:null,pairDecimals:null,lotDecimals:null}])),
      fetchTickers:async(pairs)=>tickerMap(pairs,quotes),
      fetchBook:async(pair)=>{bookCalls++;return {pair,observedAt:new Date(nowMs).toISOString(),bids:[{price:99.9,qty:100}],asks:[{price:100.1,qty:100}]};},
      fetchCandles:async()=>[],
      now:()=>new Date(nowMs),
      monotonicNow:()=>mono++,
      sleep:async()=>{},
    };
    const runtime=new EngineRuntime(db,undefined,{watchlist,availableCashUsd:600},deps);
    await runtime.refresh();

    failQuotes=true;
    nowMs+=5*60_000;
    const degraded=await runtime.refresh();
    expect(degraded.health.providers.cmcQuotes.status).toBe("DEGRADED");
    expect(degraded.authority.newBuyEnabled).toBe(true);

    const callsBeforeStale=bookCalls;
    nowMs+=ZOBIRIS_POLICY.providerFreshness.cmcQuotesMs+1;
    const stale=await runtime.refresh();
    expect(stale.health.providers.cmcQuotes.status).toBe("STALE");
    expect(stale.authority.newBuyEnabled).toBe(false);
    expect(stale.rows.find(r=>r.symbol==="AAVE")?.maxNewOrderUsd).toBe(0);
    expect(bookCalls).toBe(callsBeforeStale);
    db.close();
  });
});
