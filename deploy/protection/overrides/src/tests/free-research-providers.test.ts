import { describe, expect, it, vi } from "vitest";
import { freeResearchStatus, requestFreeResearch } from "../server/freeResearchProviders.js";
import type { SwarmShadow, SwarmSpecialistId } from "../strategy21/swarm.js";

const when = "2026-10-24T10:00:00.000Z", clock = Date.parse(when) + 60_000;
const ids: SwarmSpecialistId[] = [
  "regime","entry","liquidity","relative","sentiment","onchainWhale","portfolioRisk","critic",
];
function fixture(): SwarmShadow {
  return {
    version: "ZOBIRIS_SWARM_V1", authority: "SHADOW_ONLY_NO_TRADING_AUTHORITY", symbol: "SOL",
    integrity: { status: "PASS", criticalIssues: [], unknownSpecialists: [], portfolioRecommendationAllowed: true },
    specialists: Object.fromEntries(ids.map(id => [id,{
      id, state: "KNOWN", score: 0.75, reliability: 0.8, baseWeight: 0.125,
      independenceFactor: 0.85, effectiveWeight: 0.08, evidenceFamily: "price",
      reasons: ["Persisted historical signal."],
    }])) as SwarmShadow["specialists"],
    consensus: {
      score: 70, confidencePct: 79, coveragePct: 100, disagreementPct: 4,
      reliabilityPct: 80, regimeAdjustmentPctPoints: 0, correlationDiscountPct: 10,
    },
    entryQuality: {shadowDeltaPctPoints:2,productionScoreChanged:false},
    ranking: {shadowScore:70,productionRankChanged:false},
    executionBoundary: {
      mayIncreaseOrderSize:false,mayBypassEligibility:false,
      mayBypassLiquidity:false,mayBypassSecurity:false,positionAuthorityEffectUsd:0,
    },
  };
}
const roles = ["btcRegime","altRecovery","macroNews","contrarian","risk"];
function sampleOutput() {
  return JSON.stringify({analyses:roles.map(role=>({
    role,stance:"BULLISH",thesis:"Evidence is constructive.",
    counterargument:"There is price risk.",limitation:"No independently verified news.",
    evidenceRefs:[role + ":0","fake:99"],
  }))});
}
function fakeResponse(content=sampleOutput(), status=200) {
  return new Response(JSON.stringify({choices:[{message:{content}}]}),{status});
}
const env = (provider: string, name: string, key = "secret") => ({
  ZOBIRIS_FREE_RESEARCH_ENABLED:"1",
  ZOBIRIS_FREE_RESEARCH_PROVIDER:provider,
  [name]:key,
}) as NodeJS.ProcessEnv;
describe("opt-in no-paid-fallback research adapters",()=>{
  it("disables network use absent explicit flag, even if key exists",async()=>{
    const fake=vi.fn(async()=>fakeResponse()) as unknown as typeof fetch;
    await expect(requestFreeResearch(fixture(),when,{
      env:{GEMINI_API_KEY:"SECRET"},fetcher:fake,now:clock,
    })).rejects.toMatchObject({message:"FREE_RESEARCH_DISABLED"});
    expect(fake).not.toHaveBeenCalled();
    const s=freeResearchStatus({GEMINI_API_KEY:"SECRET"});
    expect(s.enabled).toBe(false);
    expect(JSON.stringify(s)).not.toContain("SECRET");
  });
  it.each([
    ["gemini","GEMINI_API_KEY","generativelanguage.googleapis.com","gemini-3.1-flash-lite"],
    ["groq","GROQ_API_KEY","api.groq.com","openai/gpt-oss-20b"],
    ["openrouter","OPENROUTER_API_KEY","openrouter.ai","openrouter/free"],
  ])("routes to fixed free model for %s",async(provider,key,domain,model)=>{
    const fetcher=vi.fn(async(_u:string,_opts:RequestInit)=>fakeResponse());
    const out=await requestFreeResearch(fixture(),when,{
      env:env(provider,key),fetcher:fetcher as unknown as typeof fetch,now:clock,
    });
    expect(out.analyses).toHaveLength(5);
    expect(out.provider).toBe(provider);
    expect(out.model).toBe(model);
    expect(out.analyses.find(x=>x.role==="macroNews")?.stance).toBe("UNKNOWN");
    expect(out.analyses.find(x=>x.role==="btcRegime")?.evidenceRefs).toEqual(["btcRegime:0"]);
    expect(out.productionScoreChanged).toBe(false);
    expect(out.executionAuthorityUsd).toBe(0);
    const args=fetcher.mock.calls[0] as [string,RequestInit];
    expect(args[0]).toContain(domain);
    const sent=JSON.parse(String(args[1].body));
    expect(sent.model).toBe(model);
    expect(sent.messages[1].content).not.toContain("secret");
    expect(JSON.stringify(args[1].headers)).toContain("secret");
  });
  it("auto-selects provider with valid key, never falls back to paid models",()=>{
    const s=freeResearchStatus({
      ZOBIRIS_FREE_RESEARCH_ENABLED:"1",ZOBIRIS_FREE_RESEARCH_PROVIDER:"auto",
      GROQ_API_KEY:"x",OPENROUTER_API_KEY:"y",
    });
    expect(s.selected).toBe("groq");
    expect(s.providers.find(x=>x.id==="openrouter")?.model).toBe("openrouter/free");
    expect(freeResearchStatus({ZOBIRIS_FREE_RESEARCH_ENABLED:"1",ZOBIRIS_FREE_RESEARCH_PROVIDER:"gemini"}).selected).toBeNull();
  });
  it("supports local Ollama only when explicitly enabled",async()=>{
    const fetcher=vi.fn(async(_u:string,_opts:RequestInit)=>fakeResponse());
    const options={env:{
      ZOBIRIS_FREE_RESEARCH_ENABLED:"1",ZOBIRIS_FREE_RESEARCH_PROVIDER:"ollama",
      ZOBIRIS_FREE_RESEARCH_ALLOW_LOCAL:"1",
    },fetcher:fetcher as unknown as typeof fetch,now:clock};
    const out=await requestFreeResearch(fixture(),when,options);
    expect(out.provider).toBe("ollama");
    expect(fetcher.mock.calls[0][0]).toBe("http://127.0.0.1:11434/v1/chat/completions");
  });
  it("cannot cite another role or claim direction without its own references",async()=>{
    const responses=roles.map(role=>({
      role, stance:"BULLISH", thesis:"One-sided optimism",
      counterargument:"Risk", limitation:"Evidence uncertainty",
      evidenceRefs: role === "risk" ? ["btcRegime:0"] : [role + ":0"],
    }));
    const result=await requestFreeResearch(fixture(),when,{
      env:env("groq","GROQ_API_KEY"),now:clock,
      fetcher:(async()=>fakeResponse(JSON.stringify({analyses:responses}))) as unknown as typeof fetch,
    });
    const risk=result.analyses.find(x=>x.role==="risk");
    expect(risk?.stance).toBe("UNKNOWN");
    expect(risk?.evidenceRefs).toEqual([]);
  });
  it("rejects stale or fail-closed source without a network request",async()=>{
    const fetcher=vi.fn(async()=>fakeResponse());
    await expect(requestFreeResearch(fixture(),when,{
      env:env("groq","GROQ_API_KEY"),
      fetcher:fetcher as unknown as typeof fetch,now:clock+4*3600000,
    })).rejects.toMatchObject({status:409,message:"RECORDED_EVIDENCE_STALE"});
    const s=fixture();s.integrity.status="FAIL_CLOSED";
    await expect(requestFreeResearch(s,when,{
      env:env("groq","GROQ_API_KEY"),
      fetcher:fetcher as unknown as typeof fetch,now:clock,
    })).rejects.toMatchObject({status:409,message:"RECORDED_EVIDENCE_FAIL_CLOSED"});
    expect(fetcher).not.toHaveBeenCalled();
  });
  it("rejects invalid model JSON, provider 429, and network errors safely",async()=>{
    const options={env:env("groq","GROQ_API_KEY"),now:clock};
    await expect(requestFreeResearch(fixture(),when,{...options,
      fetcher:(async()=>fakeResponse("not json")) as unknown as typeof fetch,
    })).rejects.toMatchObject({status:502,message:"MODEL_OUTPUT_NOT_JSON"});
    await expect(requestFreeResearch(fixture(),when,{...options,
      fetcher:(async()=>fakeResponse("",429)) as unknown as typeof fetch,
    })).rejects.toMatchObject({status:429,message:"PROVIDER_RATE_LIMITED"});
    await expect(requestFreeResearch(fixture(),when,{...options,
      fetcher:(async()=>{throw Error("secret token: ABC");}) as unknown as typeof fetch,
    })).rejects.toMatchObject({status:503,message:"FREE_RESEARCH_NETWORK_UNAVAILABLE"});
  });
});
