import {describe,expect,it} from 'vitest';
import {evaluatePortfolioGate} from '../server/policy/portfolioGate.js';

const policy={intentionalHoldingsTarget:[3,5] as [number,number],intentionalHoldingsMax:7,meaningfulActionFloorUsd:8,cashBufferDivisor:2,typicalProbeUsd:37,maxAccountDataAgeMin:30};
const now=Date.parse('2026-10-11T12:00:00.000Z');
const state=(holdings:{symbol:string;valueUsd:number|null;intentional?:boolean}[])=>({asOf:new Date(now).toISOString(),cashUsd:100,cashBasis:'NET_OF_OPEN_ORDERS' as const,holdings,openOrders:[]});
const candidate={symbol:'SOL',action:'NEW_BUY' as const,requestedUsd:37};

describe('audit critical regression guards',()=>{
 it('allows an unrelated conservative buy when an intentional holding has no trustworthy USD mark',()=>{
  const r=evaluatePortfolioGate(state([{symbol:'BTC',valueUsd:40},{symbol:'UNPRICED',valueUsd:null}]),candidate,policy,now);
  expect(r.decision).toBe('ALLOW');
  expect(r.slots.current).toBe(2);
  expect(r.slots.afterAction).toBe(3);
  expect(r.warnings).toContain('HOLDING_VALUE_UNKNOWN');
  expect(r.allowedUsd).toBeLessThanOrEqual(candidate.requestedUsd);
 });
 it('unknown holdings consume slots; values cannot bypass maximum holdings or allow a sell',()=>{
  const holdings=Array.from({length:7},(_,i)=>({symbol:'COIN'+i,valueUsd:i===0?null:20}));
  const r=evaluatePortfolioGate(state(holdings),candidate,policy,now);
  expect(r.decision).toBe('BLOCK');expect(r.reasons).toContain('HOLDINGS_MAX_REACHED');
  const exit=evaluatePortfolioGate(state([{symbol:'UNPRICED',valueUsd:null}]),{symbol:'UNPRICED',action:'FULL_EXIT',requestedUsd:12},policy,now);
  expect(exit.decision).toBe('BLOCK');expect(exit.reasons).toContain('HOLDING_VALUE_UNKNOWN_FOR_SELL');
 });
 it('unpriced reward dust does not block buys, while negative valuations still block',()=>{
  const r=evaluatePortfolioGate(state([{symbol:'BABY',valueUsd:null,intentional:false}]),candidate,policy,now);
  expect(r.decision).toBe('ALLOW');expect(r.slots.current).toBe(0);
  const corrupt=evaluatePortfolioGate(state([{symbol:'BTC',valueUsd:-1}]),candidate,policy,now);
  expect(corrupt.decision).toBe('BLOCK');expect(corrupt.reasons).toContain('POSITION_DATA_INVALID');
 });
});