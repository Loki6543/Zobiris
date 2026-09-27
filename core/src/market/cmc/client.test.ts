import { describe,expect,it } from "vitest";
import { parseCmcQuotes } from "./client.js";

describe("CMC quote parsing",()=>{
  it("parses object keyed response shapes",()=>{
    const rows=parseCmcQuotes({data:{"1":{id:1,name:"Bitcoin",symbol:"BTC",quote:{USD:{price:85000,percent_change_7d:4,percent_change_30d:10,percent_change_90d:40,market_cap:1,volume_24h:2,last_updated:"2026-09-27T00:00:00Z"}}}}});
    expect(rows[0]).toMatchObject({cmcId:"1",symbol:"BTC",priceUsd:85000,change7dPct:4,change30dPct:10,change90dPct:40});
  });

  it("parses array-oriented v3 quote forms too",()=>{
    const rows=parseCmcQuotes({data:[{id:7278,name:"Aave",symbol:"AAVE",quote:[{symbol:"USD",price:145,percent_change_7d:5,percent_change_30d:-10,percent_change_90d:-28}]}]});
    expect(rows[0]).toMatchObject({cmcId:"7278",symbol:"AAVE",priceUsd:145,change7dPct:5,change30dPct:-10,change90dPct:-28});
  });
});
