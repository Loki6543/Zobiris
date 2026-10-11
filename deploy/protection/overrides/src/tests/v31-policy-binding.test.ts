import { describe, expect, it } from 'vitest';
import { fileURLToPath } from 'node:url';
import { loadRegistry, bindDecision, assertBound, stampEpisode, portfolioPolicyFromRegistry, mayAffect } from '../server/policy/zobirisPolicyBinding.js';
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
  it('keeps P1B statistical diagnostics shadow-only with zero capital authority',()=>{
    const scope=h.registry.authorityScopes.find((item:any)=>item.featureId==='sidecar_trial_registry_dsr_pbo');
    expect(scope).toMatchObject({
      status:'SHADOW_ONLY',
      mayAffectQualification:false,
      mayAffectReferenceLimit:false,
      mayAffectSizing:false,
      mayAffectOrderRecommendation:false,
      mayWriteExchange:false,
    });
    expect(mayAffect(h,'sidecar_trial_registry_dsr_pbo','mayAffectQualification')).toBe(false);
    expect(mayAffect(h,'sidecar_trial_registry_dsr_pbo','mayAffectReferenceLimit')).toBe(false);
    expect(mayAffect(h,'sidecar_trial_registry_dsr_pbo','mayAffectSizing')).toBe(false);
    expect(mayAffect(h,'sidecar_trial_registry_dsr_pbo','mayAffectOrderRecommendation')).toBe(false);
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
  it('fails closed on corrupt policy caps, cash basis and unrecognized actions',()=>{
    const state={asOf:'2026-10-03T00:00:00.000Z',cashUsd:100,cashBasis:'TOTAL' as const,
      holdings:[],openOrders:[]};
    const candidate={symbol:'SOL',action:'NEW_BUY' as const,requestedUsd:25};
    const now=Date.parse('2026-10-03T00:01:00.000Z');
    const badCap=evaluatePortfolioGate(state,candidate,{...p,typicalProbeUsd:NaN},now);
    expect(badCap).toMatchObject({decision:'BLOCK',allowedUsd:0});
    expect(badCap.reasons).toContain('PORTFOLIO_POLICY_INVALID');
    const badDivisor=evaluatePortfolioGate(state,candidate,{...p,cashBufferDivisor:0},now);
    expect(badDivisor.decision).toBe('BLOCK');
    const badBasis=evaluatePortfolioGate({...state,cashBasis:'UNVERIFIED' as any},candidate,p,now);
    expect(badBasis.reasons).toContain('CASH_BASIS_INVALID');
    const invalidAction=evaluatePortfolioGate(state,{...candidate,action:'EXECUTE' as any},p,now);
    expect(invalidAction.decision).toBe('BLOCK');
    expect(evaluatePortfolioGate(state,candidate,p,Number.NaN).decision).toBe('BLOCK');
  });
  it('recognizes held assets regardless of case and does not create a new slot',()=>{
    const now=Date.parse('2026-10-03T00:05:00.000Z');
    const state={asOf:'2026-10-03T00:00:00.000Z',cashUsd:100,cashBasis:'TOTAL' as const,
      holdings:[{symbol:'btc',valueUsd:30}],openOrders:[]};
    const r=evaluatePortfolioGate(state,{symbol:' BTC ',action:'ADD',requestedUsd:20},p,now);
    expect(r.decision).not.toBe('BLOCK');
    expect(r.slots.current).toBe(1);
    expect(r.slots.afterAction).toBe(1);
    expect(r.allowedUsd).toBeLessThanOrEqual(20);
  });

});
