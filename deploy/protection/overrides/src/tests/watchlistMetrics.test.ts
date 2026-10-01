import {describe,it,expect} from 'vitest';
import {watchlistMetrics} from '../ui/watchlistMetrics';
const now=Date.now();const asset=(claim:object,age=0)=>({strategy21:{explanation:{observations:[{claim:JSON.stringify(claim),observedAt:new Date(now-age).toISOString(),expiresAt:new Date(now+3600000).toISOString()}]}}});
describe('watchlist CMC metrics',()=>{
 it('preserves all performance horizons and real zero returns',()=>{const r=watchlistMetrics(asset({cmcId:1,priceUsd:83000,change24hPct:0,change7dPct:2,change30dPct:-4,change90dPct:-10}),now);expect([r.change24hPct,r.change7dPct,r.change30dPct,r.change90dPct]).toEqual([0,2,-4,-10]);});
 it('does not turn null values into zeros',()=>{expect(watchlistMetrics(asset({cmcId:1,change30dPct:null}),now).change30dPct).toBeNull();});
 it('rejects stale and non-CMC observations',()=>{expect(watchlistMetrics(asset({cmcId:1,priceUsd:4},7*3600000),now).stale).toBe(true);expect(watchlistMetrics(asset({priceUsd:4}),now).priceUsd).toBeNull();});
});
