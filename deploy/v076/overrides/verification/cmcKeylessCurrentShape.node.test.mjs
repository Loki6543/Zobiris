import test from 'node:test';
import assert from 'node:assert/strict';
import { fetchCmcTop100Snapshot } from '../src/strategy21/attentionLedger/live/cmcKeyless.ts';

function response(body, status = 200) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  });
}

test('CMC keyless v3 parser accepts current quote array shape and string success code', async () => {
  const snapshot = await fetchCmcTop100Snapshot(async () => response({
    status: { timestamp: '2026-09-24T19:00:00.000Z', error_code: '0', error_message: null },
    data: [
      { id: 1, symbol: 'BTC', cmc_rank: 1, last_updated: '2026-09-24T19:00:00.000Z', quote: [{ id: 2781, symbol: 'USD', price: 85000, market_cap: 1700000000000, volume_24h: 20000000000, last_updated: '2026-09-24T19:00:00.000Z' }] },
      { id: 5426, symbol: 'SOL', cmc_rank: 7, last_updated: '2026-09-24T19:00:00.000Z', quote: [{ id: 2781, symbol: 'USD', price: 115, market_cap: 60000000000, volume_24h: 2000000000, last_updated: '2026-09-24T19:00:00.000Z' }] },
    ],
  }), Date.parse('2026-09-24T19:00:05.000Z'));

  assert.equal(snapshot.btcPriceUsd, 85000);
  assert.deepEqual(snapshot.assets.map((row) => [row.symbol, row.priceUsd]), [['BTC', 85000], ['SOL', 115]]);
});
