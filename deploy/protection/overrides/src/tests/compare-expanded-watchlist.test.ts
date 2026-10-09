import {afterEach,it,expect,vi} from 'vitest';
afterEach(()=>{vi.unstubAllGlobals();vi.resetModules();});
it('loads a watchlist coin beyond the former 15-coin list using verified Kraken pair metadata',async()=>{
 const today=Math.floor(Date.now()/86400000)*86400;
 const fetcher=vi.fn(async(url:string)=>({ok:true,json:async()=>url.includes('AssetPairs')?{result:{QNTUSD:{wsname:'QNT/USD',status:'online'}}}:{result:{candles:Array.from({length:9},(_,i)=>[today-(8-i)*86400,0,0,0,100+i,0,0]),last:0}}}));
 vi.stubGlobal('fetch',fetcher);
 const {compareDaily}=await import('../compareLab/compare.js');
 const data=await compareDaily(['BTC','QNT'],7);
 expect(data.series.map(s=>s.symbol)).toEqual(['BTC','QNT']);
 expect(fetcher.mock.calls.some(([url])=>url.includes('pair=QNTUSD'))).toBe(true);
});
it('keeps missing history explicit and refuses a removed symbol',async()=>{
 vi.stubGlobal('fetch',vi.fn(async()=>({ok:true,json:async()=>({result:{OTHER:{wsname:'OTHER/USD',status:'online'}}})})));
 const {compareDaily}=await import('../compareLab/compare.js');
 await expect(compareDaily(['BTC','BABY'],7)).rejects.toThrow(RangeError);
 await expect(compareDaily(['QNT','ZEC'],7)).rejects.toThrow(/on the watchlist/);
});
