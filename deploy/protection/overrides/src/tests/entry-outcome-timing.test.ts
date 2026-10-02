import {it,expect} from 'vitest';
import {buildResearchIntegrity} from '../strategy21/research/researchIntegrity.js';
it('requires original observation timestamps for outcome prices, not ledger fallbacks',()=>{
 const input={assetId:'btc',symbol:'BTC',asOf:'2026-10-02T00:00:00Z',action:'HOLD',assetState:'CONFIRMED_TREND',researchScore:70,opportunityScore:0.7,opportunityConfidence:0.8,eligibilityStatus:'ACTIVE_ELIGIBLE',dataReadiness:'READY',evidenceCoverage:1,factors:{fundamental:70,execution:70,flow:70,discovery:70,resilience:70},activeRiskGates:[]};
 for(const observedAt of [undefined,'invalid']){
 const r=buildResearchIntegrity({...input,evidenceClaims:[{id:'q',symbol:'BTC',claim:'{"priceUsd":100}',observedAt,receivedAt:input.asOf,source:'Kraken',factorFamily:'marketTechnical'}]});
 expect(r.outcomeSeed.referencePriceUsd).toBeNull();expect(r.outcomeSeed.priceObservedAt).toBeNull();
 }
});
