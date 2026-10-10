import {describe,it,expect,vi} from 'vitest';
import {sizeTrade,netPnl,maintenance,candleExit,signal} from '../tactical/risk';
import {parseBars,TacticalService} from '../tactical/service';
import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
const input={equity:300,entry:100,stop:95,side:'long' as const,leverage:1,hours:24,step:.000001,minQuantity:0,minCost:0,riskFraction:.01};
describe('tactical authority and economic boundaries',()=>{
 it('sizes before leverage and reserves full exposure costs',()=>{const a=sizeTrade(input),b=sizeTrade({...input,leverage:1.5});expect(a.notional).toBeLessThan(60);expect(a.risk).toBeLessThanOrEqual(3);expect(b.notional).toBe(a.notional);expect(b.collateral).toBeCloseTo(a.collateral/1.5);});
 it('rejects locked leverage and invalid inputs',()=>{for(const leverage of [2,3,NaN,0])expect(()=>sizeTrade({...input,leverage})).toThrow();expect(()=>sizeTrade({...input,stop:105})).toThrow();expect(()=>sizeTrade({...input,step:0})).toThrow();});
 it('rejects whole contracts too large for risk budget',()=>expect(sizeTrade({...input,entry:60000,stop:57000,step:.01,minQuantity:.01}).eligible).toBe(false));
 it('never clips short losses to starting capital',()=>expect(netPnl('short',3,100,300,24).net).toBeLessThan(-300));
 it('charges margin on full exposure and completed four-hour periods',()=>{expect(netPnl('long',1,100,100,4).costs-netPnl('long',1,100,100,3.99).costs).toBeCloseTo(.03);expect(netPnl('long',1,100,100,24).net).toBeLessThan(netPnl('long',1,100,100,24,false).net);});
 it('uses stop first and respects adverse gap fills',()=>{expect(candleExit('long',{time:0,open:90,high:120,low:85,close:110,volume:1},95,110)).toEqual({price:90,reason:'stop'});expect(candleExit('short',{time:0,open:120,high:125,low:80,close:90,volume:1},105,90)?.price).toBe(120);});
 it('handles Chicago daylight and standard time windows',()=>{expect(maintenance(Date.parse('2026-10-09T22:00:00Z'))).toBe(true);expect(maintenance(Date.parse('2026-10-10T00:00:00Z'))).toBe(false);expect(maintenance(Date.parse('2026-12-11T23:00:00Z'))).toBe(true);});
 it('excludes unfinished candles and rejects stale history',()=>{const now=Date.parse('2026-10-10T12:30:00Z');const rows=Array.from({length:101},(_,i)=>[(Date.parse('2026-10-10T12:00:00Z')-(100-i)*3600000)/1000,100,102,98,100,100,1]);expect(parseBars(rows,now)).toHaveLength(100);expect(()=>parseBars(rows,now+7200000)).toThrow();rows[20]![2]=90;expect(()=>parseBars(rows,now)).toThrow();});
 it('stays cash for flat prices',()=>expect(signal(Array.from({length:60},(_,i)=>({time:i,open:100,high:101,low:99,close:100,volume:1}))).side).toBe(null));
 it('persists a pause and always denies live authority',()=>{const dir=fs.mkdtempSync(path.join(os.tmpdir(),'tactical-'));try{const file=path.join(dir,'ledger.json');new TacticalService(file).pause();const s=new TacticalService(file).status();expect(s.paused).toBe(true);expect(s.liveEnabled).toBe(false);expect(s.counts.closed).toBe(0);}finally{fs.rmSync(dir,{recursive:true});}});
 it('does not overwrite a corrupt ledger on collection',async()=>{const dir=fs.mkdtempSync(path.join(os.tmpdir(),'tactical-'));try{const file=path.join(dir,'ledger.json');fs.writeFileSync(file,'broken');const s=new TacticalService(file);await s.tick();expect(s.status().paused).toBe(true);expect(fs.readFileSync(file,'utf8')).toBe('broken');}finally{fs.rmSync(dir,{recursive:true});}});
});


describe('public observer lifecycle',()=>{
 it('records real-time proposals once per candle and fails closed on disconnection',async()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'tactical-feed-'));
  const now=Date.now(),hour=Math.floor(now/3600000)*3600000;
  const rows=Array.from({length:120},(_,i)=>[(hour-(120-i)*3600000)/1000,100,102,98,100,100,1]);
  const pairs=Object.fromEntries(['BTC','ETH','SOL'].map(symbol=>[symbol+'USD',{wsname:symbol+'/USD',pair_decimals:2,lot_decimals:6,ordermin:0.000001,costmin:1,status:'online'}]));
  const mock=vi.fn(async(input:any)=>{const u=String(input);return {ok:true,json:async()=>({error:[],result:u.includes('SystemStatus')?{status:'online'}:u.includes('AssetPairs')?pairs:u.includes('OHLC')?{PAIR:rows,last:1}:{PAIR:{bids:[['100','5',1]],asks:[['100.01','5',1]]}}})} as Response;});
  vi.stubGlobal('fetch',mock);
  try{const file=path.join(dir,'ledger.json'),service=new TacticalService(file);await service.tick();expect(service.status().error).toBe(null);expect(service.status().counts.proposals).toBe(9);expect(service.status().counts.open).toBe(0);await service.tick();expect(service.status().counts.proposals).toBe(9);mock.mockRejectedValue(new Error('offline'));await service.tick();expect(service.status().error).toBe('offline');expect(service.status().counts.open).toBe(0);expect(new TacticalService(file).status().counts.proposals).toBe(9);}finally{vi.unstubAllGlobals();fs.rmSync(dir,{recursive:true});}
 });
});
