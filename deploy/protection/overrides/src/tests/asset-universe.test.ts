import {it,expect} from 'vitest';
import {visibleAssetData,mergeAssetUniverse} from '../shared/assetUniverse.js';
it('excludes removed assets from nested, serialized and keyed API surfaces without changing source records',()=>{
 const source={holdings:[{symbol:'BTC'},{symbol:'BABY'}],rewards:[{symbol:'BABY'}],snapshot:{rankedAssets:JSON.stringify([{symbol:'BABY'},{symbol:'ETH'}])},symbols:['BTC','BABY'],rules:{BABY:{},BTC:{}}};
 const result=visibleAssetData(source);
 expect(JSON.stringify(result)).not.toContain('BABY');
 expect(source.holdings).toHaveLength(2);
 expect(JSON.parse(result.snapshot.rankedAssets)).toEqual([{symbol:'ETH'}]);
});
it('preserves every canonical coin, including unevaluated coins, and excludes off-list evaluations',()=>{
 const rows=mergeAssetUniverse([{symbol:'BTC'},{symbol:'QNT'},{symbol:'BABY'}],[{symbol:'BTC',action:'HOLD'},{symbol:'OLD',action:'BUY'}]);
 expect(rows.map(a=>a.symbol)).toEqual(['BTC','QNT']);
 expect(rows[1]).toMatchObject({action:'Awaiting evaluation',mappingStatus:'unresolved'});
});
