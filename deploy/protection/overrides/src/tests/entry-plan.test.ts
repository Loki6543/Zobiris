import {it,expect} from 'vitest';
import {entryReference,validateEntry} from '../shared/entryPlan.js';
import {parseEntryRules} from '../server/entryRules.js';
const now=Date.parse('2026-10-02T00:00:00Z');
const rules={symbol:'ABC',pair:'ABCUSD',tickSize:0.05,lotDecimals:3,orderMin:0.1,costMin:5,status:'online',observedAt:new Date(now).toISOString()};
it('shares the pilot prior with a capped re-entry adjustment and no missing prior fallback',()=>{
 expect(entryReference(100,5,false)).toBe(95);expect(entryReference(100,8,true)).toBe(90);
 expect(entryReference(100,null,false)).toBeNull();expect(entryReference(NaN,5,false)).toBeNull();
});
it('rounds price and quantity down within a cash cap',()=>{
 const p=validateEntry(9.999,37,rules,now);expect(p.valid).toBe(true);expect(p.limit).toBe(9.95);expect(p.quantity).toBe(3.718);expect(p.notional).toBeLessThanOrEqual(37);
});
it('blocks missing, stale and inactive metadata and orders below minimums',()=>{
 for(const r of [null,{...rules,status:'cancel_only'},{...rules,observedAt:new Date(now-3600000).toISOString()}])expect(validateEntry(10,37,r,now).valid).toBe(false);
 expect(validateEntry(10,4,rules,now).valid).toBe(false);expect(validateEntry(10,37,{...rules,orderMin:4},now).valid).toBe(false);
});
it('resolves explicit USD pairs, normalizes XBT and rejects ambiguous symbols',()=>{
 const row={wsname:'XBT/USD',tick_size:'0.1',lot_decimals:8,ordermin:'0.00005',costmin:'0.5',status:'online'};
 expect(parseEntryRules({XXBTZUSD:row},now).BTC?.pair).toBe('XXBTZUSD');
 expect(parseEntryRules({a:row,b:row},now).BTC).toBeUndefined();
 expect(parseEntryRules({a:{...row,wsname:'XBT/USDT'}},now).BTC).toBeUndefined();
});
