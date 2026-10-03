import {it,expect} from 'vitest';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {updateOutcomeMemory,readOutcomeMemory,updateOutcomeObservations} from '../server/outcomeMemory.js';
import {collectOutcomeTick} from '../server/outcomeCollector.js';
const t='2026-10-03T00:00:00Z';
function seed(symbol='QNT'){return {asOf:t,rankedAssets:[{symbol,strategy21:{researchIntegrity:{outcomeSeed:{outcomeId:symbol, symbol,generatedAt:t,priceObservedAt:t,referencePriceUsd:100,thesisId:symbol,horizons:[{horizon:'1H' as const,dueAt:'2026-10-03T01:00:00Z'}]}}}}]};}
it('collects a pending symbol outside the watchlist and resolves without creating episodes',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'follow-'));const path=join(dir,'o.json');
 try{await updateOutcomeMemory(path,seed());let requested:string[]=[];
 await collectOutcomeTick({path,now:()=>Date.parse('2026-10-03T01:06:00Z'),fetchQuotes:async symbols=>{requested=symbols;return [{symbol:'QNT',priceUsd:110,observedAt:'2026-10-03T01:05:00Z'}];}});
 expect(requested).toEqual(['QNT','BTC']);const m=await readOutcomeMemory(path);expect(m.records).toHaveLength(1);expect(m.records[0]!.evaluations[0]!.returnPct).toBeCloseTo(10);
 }finally{await rm(dir,{recursive:true,force:true});}
});
it('serializes new decisions and followups; rejects future and pre-horizon observations',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'follow-'));const path=join(dir,'o.json');
 try{await updateOutcomeMemory(path,seed());await Promise.all([updateOutcomeMemory(path,seed('SOL')),updateOutcomeObservations(path,[{symbol:'QNT',priceUsd:110,observedAt:'2026-10-03T01:10:00Z'}],'2026-10-03T01:06:00Z')]);
 let m=await readOutcomeMemory(path);expect(m.records).toHaveLength(2);expect(m.records.find(r=>r.symbol==='QNT')!.evaluations[0]!.returnPct).toBeNull();
 await updateOutcomeObservations(path,[{symbol:'QNT',priceUsd:110,observedAt:'2026-10-03T00:59:00Z'}],'2026-10-03T01:06:00Z');
 m=await readOutcomeMemory(path);expect(m.records[0]!.evaluations[0]!.returnPct).toBeNull();
 }finally{await rm(dir,{recursive:true,force:true});}
});
it('does not overlap ticks and sanitizes provider failures',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'follow-'));const path=join(dir,'o.json');
 try{await updateOutcomeMemory(path,seed());let release!:()=>void;const wait=new Promise<void>(r=>release=r);const opts={path,now:()=>Date.parse('2026-10-03T01:06:00Z'),fetchQuotes:async()=>{await wait;throw Error('SECRET');}};
 const first=collectOutcomeTick(opts);expect((await collectOutcomeTick(opts)).status).toBe('SKIPPED');release();const result=await first;expect(result.error).toBe('QUOTE_FETCH_FAILED');expect(JSON.stringify(result)).not.toContain('SECRET');
 }finally{await rm(dir,{recursive:true,force:true});}
});
