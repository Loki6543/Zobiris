import { describe, expect, it } from 'vitest';
import { fileURLToPath } from 'node:url';
import { loadRegistry, bindDecision, assertBound, stampEpisode, portfolioPolicyFromRegistry } from '../server/policy/zobirisPolicyBinding.js';
import { evaluatePortfolioGate } from '../server/policy/portfolioGate.js';

const registryPath=fileURLToPath(new URL('../server/policy/zobiris-policy-registry-v3.1.json', import.meta.url));

describe('v3.1 policy binding',()=>{
  const h=loadRegistry(registryPath);
  it('binds decisions and rejects unbound records',()=>{
    const bound=bindDecision(h,{decision:'WAIT'});
    expect(()=>assertBound(bound)).not.toThrow();
    expect(()=>assertBound({decision:'WAIT'})).toThrow(/UNBOUND_DECISION/);
  });
  it('stamps honest episode metadata and leaves unknown tags UNKNOWN',()=>{
    const episode=stampEpisode(h,{decisionTime:'2026-10-03T12:00:00.000Z',id:'x'},{
      evidenceClass:'QUOTE_OUTCOME_ONLY',
      feeScheduleVersion:h.registry.feeSchedule.scheduleId,
      accountFeeTierAssumption:h.registry.feeSchedule.sidecarPolicyProposed.accountFeeTierAssumption,
      makerTakerPath:'MAKER_TAKER',
    });
    expect(episode.policyHash).toMatch(/^[0-9a-f]{64}$/);
    expect(episode.setupFamily).toBe('UNKNOWN');
    expect(episode.metadataProvenance).toBe('LIVE');
  });
  it('registry portfolio policy matches the intended hard limits',()=>{
    const p=portfolioPolicyFromRegistry(h);
    expect(p.intentionalHoldingsMax).toBe(7);
    expect(p.typicalProbeUsd).toBe(37);
    expect(p.meaningfulActionFloorUsd).toBe(8);
  });
});

describe('v3.1 portfolio gate',()=>{
  const h=loadRegistry(registryPath);
  const p=portfolioPolicyFromRegistry(h);
  it('never increases requested size and blocks stale account state',()=>{
    const stale=evaluatePortfolioGate({
      asOf:'2026-10-01T00:00:00.000Z',cashUsd:100,cashBasis:'TOTAL',holdings:[],openOrders:[]
    },{symbol:'SOL',action:'NEW_BUY',requestedUsd:37},p,Date.parse('2026-10-03T00:00:00.000Z'));
    expect(stale.decision).toBe('BLOCK');
    expect(stale.allowedUsd).toBe(0);
  });
  it('reduces an oversized buy rather than raising it',()=>{
    const r=evaluatePortfolioGate({
      asOf:'2026-10-03T00:00:00.000Z',cashUsd:100,cashBasis:'TOTAL',holdings:[],openOrders:[]
    },{symbol:'SOL',action:'NEW_BUY',requestedUsd:46.25},p,Date.parse('2026-10-03T00:05:00.000Z'));
    expect(r.allowedUsd).toBeLessThanOrEqual(46.25);
    expect(r.allowedUsd).toBe(37);
    expect(r.decision).toBe('REDUCE');
  });
});
