import {describe,expect,it} from 'vitest';
import {filterWatchlistCategory} from '../ui/watchlistCategories';

const base={symbol:'BTC',ready:false,asset:{strategy21:{}},metrics:{stale:false,priceUsd:50000}};
describe('watchlist evidence-backed categories',()=>{
 it('hides entry-review classification when the market snapshot is stale',()=>{
  const rows=[{...base,symbol:'BTC',ready:true}];
  expect(filterWatchlistCategory(rows,'entry',false)).toHaveLength(0);
  expect(filterWatchlistCategory(rows,'entry',true)).toHaveLength(1);
 });
 it('shows delayed research only when the strategy supplies that assessment',()=>{
  const rows=[base,{...base,symbol:'ETH',asset:{strategy21:{delayedRotation:{status:'WAIT'}}}}];
  expect(filterWatchlistCategory(rows,'delayed',true).map(r=>r.symbol)).toEqual(['ETH']);
 });
 it('distinguishes missing data from live quotes and does not promote them',()=>{
  const rows=[base,{...base,symbol:'SOL',ready:true,metrics:{stale:true,priceUsd:null}}];
  expect(filterWatchlistCategory(rows,'missing',true).map(r=>r.symbol)).toEqual(['SOL']);
  expect(filterWatchlistCategory(rows,'entry',true)).toHaveLength(0);
  expect(filterWatchlistCategory(rows,'all',false)).toHaveLength(2);
 });
});