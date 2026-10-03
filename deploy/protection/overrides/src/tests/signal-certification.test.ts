import { describe, expect, it } from "vitest";
import { certifyEntrySignal } from "../server/signalCertification.js";

const eligibility={status:"ACTIVE_ELIGIBLE",entryImpactP95Bps:5,exitImpactP95Bps:5,spreadP95Bps:6};
function records(n:number,end=105){
 const start=Date.parse("2025-01-01T00:00:00Z");
 return Array.from({length:n},(_,i)=>{
  const g=start+i*8*86400000,d=g+7*86400000,o=d+60000;
  return {measurementVersion:"episodes-v2",outcomeId:"e"+i,symbol:"ETH",generatedAt:new Date(g).toISOString(),action:"HOLD",assetState:"QUALIFIED",referencePriceUsd:100,proposedLimitUsd:95,sampledTouchAt:new Date(g+86400000).toISOString(),actualFill:null,opportunityScore:70,researchScore:60,evidenceQuality:.8,thesisId:"t"+i,strategyStatus:"QUALIFIED",recommendedPullbackPct:5,maxFavorablePct:8,maxAdversePct:-7,evaluations:[{status:"RESOLVED",horizon:"7D",dueAt:new Date(d).toISOString(),evaluatedAt:new Date(o+60000).toISOString(),priceObservedAt:new Date(o).toISOString(),priceUsd:end,returnPct:end-100}]};
 });
}
describe("signal certification",()=>{
 it("fails closed on small samples",()=>{
  const r=certifyEntrySignal({symbol:"ETH",baselinePullbackPct:5,pilotState:"QUALIFIED",eligibility,records:records(8) as any});
  expect(r.status).toBe("INSUFFICIENT_SAMPLE");expect(r.promotionEligible).toBe(false);
 });
 it("keeps a robust sample shadow-only",()=>{
  const r=certifyEntrySignal({symbol:"ETH",baselinePullbackPct:5,marketState:"RISK_ON",pilotState:"QUALIFIED",eligibility,records:records(40) as any});
  expect(r.status).toBe("STABLE_SHADOW");expect(r.authority).toBe("SHADOW_ONLY_NO_ENTRY_SCORE_CHANGE");expect(r.execution.knownRoundTripCostBps).toBe(10);
 });
 it("does not treat missing execution impact as zero",()=>{
  const r=certifyEntrySignal({symbol:"ETH",baselinePullbackPct:5,pilotState:"QUALIFIED",eligibility:{...eligibility,entryImpactP95Bps:null},records:records(40) as any});
  expect(r.execution.entryImpactP95Bps).toBeNull();expect(r.status).toBe("INSUFFICIENT_SAMPLE");
 });
 it("rejects feature timestamps after the decision",()=>{
  const sample=records(1) as any[];sample[0].referencePriceObservedAt=new Date(Date.parse(sample[0].generatedAt)+60000).toISOString();
  const r=certifyEntrySignal({symbol:"ETH",baselinePullbackPct:5,pilotState:"QUALIFIED",eligibility,records:sample as any});
  expect(r.pointInTimeAudit.acceptedEpisodes).toBe(0);expect(r.pointInTimeAudit.rejectedEpisodes).toBe(1);
 });
 it("perturbs the actual effective pullback geometry",()=>{
  const r=certifyEntrySignal({symbol:"ETH",baselinePullbackPct:5,effectivePullbackPct:7,pilotState:"QUALIFIED",eligibility,records:records(40) as any});
  expect(r.perturbation.currentPullbackPct).toBe(7);
 });
 it("detects parameter fragility",()=>{
  const r=certifyEntrySignal({symbol:"ETH",baselinePullbackPct:5,pilotState:"QUALIFIED",eligibility,records:records(40,95.5) as any});
  expect(r.perturbation.fragile).toBe(true);expect(r.status).toBe("FRAGILE");
 });
});
