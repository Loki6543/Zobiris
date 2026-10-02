/** Existing pilot prior only. Structural/ATR/cost optimisation has no live authority. */
export function entryReference(price:number,pullbackPct:number|null|undefined,reentry=false):number|null {
 if(!Number.isFinite(price)||price<=0||typeof pullbackPct!=='number'||!Number.isFinite(pullbackPct)||pullbackPct<4||pullbackPct>8)return null;
 return price*(1-Math.min(10,pullbackPct+(reentry?2:0))/100);
}
export type EntryRules={symbol:string;pair:string;tickSize:number;lotDecimals:number;orderMin:number;costMin:number;status:string;observedAt:string};
export type ValidatedEntry={valid:boolean;reason:string;limit:number|null;quantity:number;notional:number};
const blocked=(reason:string):ValidatedEntry=>({valid:false,reason,limit:null,quantity:0,notional:0});
function floorStep(value:number,step:number){const raw=Math.floor(value/step)*step;const rounded=Number(raw.toPrecision(15));return rounded<=value?rounded:Number((raw-step).toPrecision(15));}
export function validateEntry(reference:number|null,budget:number,rules:EntryRules|null|undefined,now=Date.now()):ValidatedEntry {
 if(reference==null||!Number.isFinite(reference)||reference<=0)return blocked('Valid pilot pullback reference unavailable');
 if(!Number.isFinite(budget)||budget<=0)return blocked('No available buy capacity');
 if(!rules)return blocked('Kraken instrument rules unavailable or ambiguous');
 const age=now-Date.parse(rules.observedAt);
 if(!Number.isFinite(age)||age<0||age>30*60000)return blocked('Kraken instrument rules are stale');
 if(rules.status!=='online')return blocked('Kraken pair is not online');
 if(!Number.isFinite(rules.tickSize)||rules.tickSize<=0||!Number.isInteger(rules.lotDecimals)||rules.lotDecimals<0||rules.lotDecimals>12||!Number.isFinite(rules.orderMin)||rules.orderMin<=0||!Number.isFinite(rules.costMin)||rules.costMin<=0)return blocked('Incomplete Kraken instrument rules');
 const limit=floorStep(reference,rules.tickSize);
 if(limit<=0)return blocked('Reference is below the Kraken price tick');
 const quantity=floorStep(budget/limit,10**(-rules.lotDecimals));
 const notional=quantity*limit;
 if(quantity<rules.orderMin||notional<rules.costMin||notional>budget)return blocked('Rounded order is below Kraken minimums or exceeds the cash cap');
 return {valid:true,reason:'Kraken tick, quantity and minimums checked; fees need separate cash reserve',limit,quantity,notional};
}
