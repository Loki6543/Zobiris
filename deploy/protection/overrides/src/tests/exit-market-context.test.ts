import { it, expect, vi, afterEach } from 'vitest';
afterEach(()=>{vi.unstubAllGlobals();vi.restoreAllMocks();});
it('derives daily ATR and momentum from complete OHLC and refuses unsupported coins',async()=>{
 vi.resetModules();const now=Date.UTC(2026,8,29);vi.spyOn(Date,'now').mockReturnValue(now);
 const rows=Array.from({length:220},(_,i)=>[(now/1000)-(220-i)*86400,'100','102','98','100','100','10',20]);
 vi.stubGlobal('fetch',vi.fn(async()=>({ok:true,json:async()=>({result:{XXBTZUSD:rows},error:[]})})));
 const {exitMarketContext}=await import('../compareLab/compare.js');const c=await exitMarketContext('BTC');
 expect(c?.atr14).toBe(4);expect(c?.atrPct).toBe(4);expect(c?.momentum7dPct).toBe(0);expect(c?.rsi14).toBe(50);expect(c?.volume7dVsPrior30d).toBe(1);expect(c?.mode).toBe('MIXED');expect(await exitMarketContext('UNSUPPORTED')).toBeNull();
});
it('does not manufacture ATR from close-only or gapped candles',async()=>{
 vi.resetModules();const now=Date.UTC(2026,8,29);vi.spyOn(Date,'now').mockReturnValue(now);
 const rows=Array.from({length:220},(_,i)=>[(now/1000)-(220-i)*86400,'100',null,null,'100','100','10',20]);
 vi.stubGlobal('fetch',vi.fn(async()=>({ok:true,json:async()=>({result:{XXBTZUSD:rows},error:[]})})));
 const {exitMarketContext}=await import('../compareLab/compare.js');expect(await exitMarketContext('BTC')).toBeNull();
});
