import { describe, expect, it } from "vitest";
import { fetchTickers, parseTicker } from "./client.js";

describe("Kraken ticker parsing", () => {
  it("uses v[1] as rolling 24h volume rather than v[0] since-midnight volume", () => {
    const ticker=parseTicker("BTC/USD",{
      a:["100.1","1","1"], b:["99.9","1","1"], c:["100","0.1"],
      v:["206","1042"],
    });
    expect(ticker.volumeTodayBase).toBe(206);
    expect(ticker.volume24hBase).toBe(1042);
    expect(ticker.volume24hUsd).toBe(104200);
  });
});


describe("bulk Kraken ticker fetch", () => {
  it("parses multiple returned pair keys from one request", async () => {
    const fakeFetch=async()=>({
      ok:true,
      json:async()=>({error:[],result:{
        "XXBTZUSD":{a:["100.1"],b:["99.9"],c:["100"],v:["1","10"]},
        "AAVEUSD":{a:["145.1"],b:["144.9"],c:["145"],v:["2","20"]}
      }})
    }) as any;
    const rows=await fetchTickers(["XXBTZUSD","AAVEUSD"],fakeFetch as any);
    expect(rows.get("XXBTZUSD")?.last).toBe(100);
    expect(rows.get("AAVEUSD")?.volume24hBase).toBe(20);
  });
});
