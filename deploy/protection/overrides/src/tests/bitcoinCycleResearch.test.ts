import { describe, expect, it } from 'vitest';
import { buildBitcoinCycleResearch, CYCLE_ORIGINAL_INDICATORS } from '../server/bitcoinCycleResearch.js';
import { summarizeMarket } from '../server/marketBrief.js';

const asOf = '2026-10-10T00:00:00.000Z';
const base = {asOf, close:90, weeklyReturnPct:-10, ema50:100, rsi14:28, atrPct:3};

describe('read-only BTC cycle/exhaustion research overlay', () => {
  it('inventories five distinct methodologies but never claims to run the original scripts', () => {
    expect(CYCLE_ORIGINAL_INDICATORS.map(x=>x.name)).toEqual([
      '2x SLIT','0xTime','Double Slit','0xTimeless','OldPNAR+Timeless'
    ]);
    const b=buildBitcoinCycleResearch(base);
    expect(b.originalIndicatorStatus).toBe('NOT_RUN');
    expect(b.calibration).toBe('NOT_BACKTESTED');
    expect(b.validatedSuccessProbability).toBeNull();
    expect(b.pivotConfirmed).toBe(false);
    expect(b.status).toBe('RESEARCH_ONLY_NO_TRADE_AUTHORITY');
    expect(b.intraday1h6h).toBe('NOT_EVALUATED');
  });
  it('flags seller/buyer pressure without claiming a confirmed top/bottom', () => {
    const seller=buildBitcoinCycleResearch(base);
    expect(seller.watch).toBe('POSSIBLE_SELLER_EXHAUSTION');
    expect(seller.shockContext).toBe('DOWNSIDE_EXPANSION');
    expect(seller.explanation).toContain('NOT a confirmed bottom');
    const buyer=buildBitcoinCycleResearch({ ...base, close:110, weeklyReturnPct:10, rsi14:75 });
    expect(buyer.watch).toBe('POSSIBLE_BUYER_EXHAUSTION');
    expect(buyer.explanation).toContain('NOT a confirmed top');
  });
  it('requires multiple conditions and treats invalid inputs as unavailable',()=>{
    expect(buildBitcoinCycleResearch({...base,rsi14:45}).watch).toBe('NO_CONFLUENCE');
    expect(buildBitcoinCycleResearch({...base,weeklyReturnPct:-3}).watch).toBe('NO_CONFLUENCE');
    expect(buildBitcoinCycleResearch({...base,close:100}).watch).toBe('NO_CONFLUENCE');
    for(const bad of [
      {...base,asOf:'invalid'},
      {...base,rsi14:NaN},
      {...base,rsi14:101},
      {...base,atrPct:-1},
      {...base,close:0},
    ]){
      const observation=buildBitcoinCycleResearch(bad);
      expect(observation.watch).toBe('EVIDENCE_UNAVAILABLE');
      expect(observation.validatedSuccessProbability).toBeNull();
      expect(observation.pivotConfirmed).toBe(false);
    }
  });
  it('exposes research metadata in the completed-daily market brief without changing its established bias',()=>{
    const now=Date.UTC(2026,8,30);
    const series=['BTC','ETH','SOL'].map(symbol=>({
      symbol,points:Array.from({length:91},(_,i)=>({time:now/1000-(91-i)*86400,close:100+i}))
    }));
    const daily={source:'test',asOf:new Date(now-86400000).toISOString(),atr14:3,atrPct:2,ema50:170,ema200:120,rsi14:60,
      momentum7dPct:4,volume7dVsPrior30d:1.1,trend:'STRONG',mode:'TREND',superTrend:null,method:'test'};
    const result=summarizeMarket(series,daily,now);
    expect(result.bias).toBe('UPWARD BIAS');
    expect(result.cycleResearch.status).toBe('RESEARCH_ONLY_NO_TRADE_AUTHORITY');
    expect(result.cycleResearch.watch).toBe('NO_CONFLUENCE');
    expect(result.cycleResearch.asOf).toBe(result.asOf);
    expect(result.cycleResearch.pivotConfirmed).toBe(false);
  });
});
