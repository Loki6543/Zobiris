import { describe, expect, it } from "vitest";
import { providerHealth, requiredProvidersPermitNewBuy } from "./providerHealth.js";

describe("provider health",()=>{
  it("marks a failed but still-fresh optional provider degraded",()=>{
    const h=providerHealth({
      now:"2026-09-28T14:00:00Z",requiredForNewBuy:false,success:false,
      lastSuccessAt:"2026-09-28T13:58:00Z",maxAgeMs:10*60_000,error:"timeout"
    });
    expect(h.state).toBe("DEGRADED");
  });

  it("blocks new-buy authority when a required provider is not live",()=>{
    expect(requiredProvidersPermitNewBuy({
      quotes:providerHealth({now:"2026-09-28T14:00:00Z",requiredForNewBuy:true,success:false,lastSuccessAt:null,maxAgeMs:10,error:"down"})
    })).toBe(false);
  });
});
