import {describe,it,expect} from 'vitest';
import {summarizeMarket} from '../server/marketBrief.js';
describe('daily market brief',()=>{
 const now=Date.UTC(2026,8,30);const series=['BTC','ETH','SOL'].map(symbol=>({symbol,points:Array.from({length:91},(_,i)=>({time:now/1000-(91-i)*86400,close:100+i}))}));
 const daily={source:'test',asOf:new Date(now-86400000).toISOString(),atr14:3,atrPct:2,ema50:170,ema200:120,rsi14:60,momentum7dPct:4,volume7dVsPrior30d:1.1,trend:'STRONG',mode:'TREND',superTrend:null,method:'test'};
 it('uses aligned trend and momentum, with contrary case',()=>{const b=summarizeMarket(series,daily,now);expect(b.bias).toBe('UPWARD BIAS');expect(b.counter).toContain('weaken');expect(b.returns).toHaveLength(3);expect(b.lower).toBe(171);expect(b.upper).toBe(190);});
 it('withholds a view when daily evidence is missing or stale',()=>{expect(()=>summarizeMarket(series,null,now)).toThrow();expect(()=>summarizeMarket(series,daily,now+3*86400000)).toThrow();});
 it('rejects mismatched indicators and incomplete major-coin evidence',()=>{expect(()=>summarizeMarket(series,{...daily,asOf:new Date(now-3*86400000).toISOString()},now)).toThrow();expect(()=>summarizeMarket(series.slice(0,2),daily,now)).toThrow();expect(()=>summarizeMarket(series.map(s=>s.symbol==='ETH'?{...s,points:s.points.slice(1)}:s),daily,now)).toThrow();});
 it('rejects an unfinished current candle',()=>{expect(()=>summarizeMarket(series,daily,now-3600000)).toThrow();});
 it('does not turn mixed structure into a bullish forecast',()=>{expect(summarizeMarket(series,{...daily,trend:'MIXED'},now).bias).toBe('MIXED / RANGE');});
});
