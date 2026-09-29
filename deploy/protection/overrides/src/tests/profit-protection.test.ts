import { it, expect } from 'vitest';
import Database from 'better-sqlite3';
import { advancePath, pathMetrics, sampleProtection, readProtection, initializeProtection } from '../server/profitProtection.js';
it('tracks drawdown and recovery without activating at an untouched high',()=>{
 let p=advancePath(null,390,'a');p=advancePath(p,420,'b');expect(p.recoveryLock).toBe(false);
 p=advancePath(p,360,'c');expect(p.recoveryLock).toBe(false);p=advancePath(p,412,'d');
 const m=pathMetrics(p,null);expect(m.returnSinceTrackingPct).toBeCloseTo(5.641);expect(m.maxDrawdownPct).toBeCloseTo(14.2857);expect(m.recoveryPct).toBeCloseTo(14.4444);expect(m.drawdownPct).toBeCloseTo(1.9048);expect(p.recoveryLock).toBe(true);expect(m.pnlPct).toBeNull();
});
it('separates percentage-point giveback from price drawdown and profit fraction',()=>{
 let p=advancePath(null,100,'a');p=advancePath(p,191,'b');p=advancePath(p,164,'c');const m=pathMetrics(p,100);
 expect(m.profitGivebackPoints).toBeCloseTo(27);expect(m.profitGivebackPct).toBeCloseTo(27/91*100);expect(m.drawdownPct).toBeCloseTo(27/191*100);
});
const now=Date.parse('2026-09-29T15:00:00Z');
const account=(cash=100,qty=2)=>({privateAccountSynced:true,capturedAt:new Date(now).toISOString(),cashUsd:cash,holdings:[{symbol:'BTC',quantity:qty,avgPriceUsd:100}],lastError:null});
const snap=(price=110,at=now)=>({asOf:new Date(at).toISOString(),regime:'Reconnaissance',rankedAssets:[{symbol:'BTC',mappingStatus:'verified',strategy21:{explanation:{observations:[{observedAt:new Date(at).toISOString(),expiresAt:new Date(at+3600000).toISOString(),claim:{priceUsd:price}}]}}}]});
it('persists and deduplicates samples; deposits and quantity changes reset comparable paths',()=>{
 const db=new Database(':memory:');initializeProtection(db);sampleProtection(db,account(),snap(),now);sampleProtection(db,account(),snap(),now);
 expect(readProtection(db,now).portfolio?.samples).toBe(1);sampleProtection(db,account(300),snap(),now);
 expect(readProtection(db,now).portfolio?.returnSinceTrackingPct).toBe(0);expect(readProtection(db,now).portfolio?.current).toBe(520);
 sampleProtection(db,account(300,1),snap(),now);expect(readProtection(db,now).positions[0]?.samples).toBe(1);db.close();
});
it('rejects stale and future data; missing assets do not become zero-dollar valuations',()=>{
 const db=new Database(':memory:');initializeProtection(db);sampleProtection(db,account(),snap(110,now-7*3600000),now);expect(readProtection(db,now).portfolio).toBeNull();
 sampleProtection(db,account(),snap(110,now+60000),now);expect(readProtection(db,now).portfolio).toBeNull();
 sampleProtection(db,{...account(),holdings:[...account().holdings,{symbol:'ETH',quantity:1,avgPriceUsd:null}]},snap(),now);
 const r=readProtection(db,now);expect(r.portfolio).toBeNull();expect(r.positions).toHaveLength(1);expect(r.missingPrices).toEqual(['ETH']);db.close();
});
it('locks a direct recovery to a new high after a real drawdown',()=>{
 let p=advancePath(null,420,'a');p=advancePath(p,360,'b');p=advancePath(p,435,'c');expect(p.recoveryLock).toBe(true);expect(p.peak).toBe(435);
});
it('never carries a closed position peak into a reopened position',()=>{
 const db=new Database(':memory:');initializeProtection(db);sampleProtection(db,account(),snap(150),now);
 sampleProtection(db,{...account(),holdings:[]},snap(),now);sampleProtection(db,account(),snap(110),now);
 expect(readProtection(db,now).positions[0]?.peak).toBe(110);db.close();
});
it('recognizes the exact 10% drawdown boundary',()=>{
 let p=advancePath(null,100,'a');p=advancePath(p,90,'b');p=advancePath(p,95,'c');expect(p.recoveryLock).toBe(true);
});
it('records constituent updates even beneath an unchanged maximum timestamp',()=>{
 const db=new Database(':memory:');initializeProtection(db);
 const a={...account(),holdings:[...account().holdings,{symbol:'ETH',quantity:1,avgPriceUsd:null}]};
 const make=(ethTime:number,price:number)=>{const s=snap();const eth=snap(price,ethTime).rankedAssets[0]!;return {...s,rankedAssets:[...s.rankedAssets,{...eth,symbol:'ETH'}]};};
 sampleProtection(db,a,make(now-120000,50),now);sampleProtection(db,a,make(now-60000,60),now);
 const p=readProtection(db,now).portfolio;expect(p?.samples).toBe(2);expect(p?.current).toBe(380);db.close();
});
it('closes segments on fresh account changes even while market prices are stale',()=>{
 const db=new Database(':memory:');initializeProtection(db);sampleProtection(db,account(),snap(150),now);
 sampleProtection(db,{...account(),holdings:[]},snap(110,now-7*3600000),now);
 sampleProtection(db,account(),snap(110),now);
 const r=readProtection(db,now);expect(r.positions[0]?.peak).toBe(110);expect(r.portfolio?.peak).toBe(320);db.close();
});
