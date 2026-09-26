import test from 'node:test';
import assert from 'node:assert/strict';
import { selectCollectionSymbols } from '../collectorSelection.js';

test('the 59-coin watchlist is covered within two five-minute collector cycles', () => {
  const watchlist = ['BTC','SOL','ONDO','KAS','NEAR','TAO','RENDER','HBAR','SUI',
    ...Array.from({ length: 50 }, (_, index) => 'COIN' + index)];
  const first = selectCollectionSymbols(watchlist, 0, 36, 9);
  const second = selectCollectionSymbols(watchlist, first.nextCursor, 36, 9);
  assert.equal(first.symbols.length, 36);
  assert.equal(second.symbols.length, 36);
  assert.deepEqual(new Set([...first.symbols, ...second.symbols]), new Set(watchlist));
  assert.equal(first.symbols.includes('BTC') && second.symbols.includes('BTC'), true);
});
