import { expect, it } from 'vitest';
import { integrateStrategy21 } from '../strategy21/integration.js';
import { buildLiquidityProfile } from '../strategy21/engine/liquidity.js';

it('per-asset evidence loading preserves the complete eager decision output', () => {
  const asOf = '2026-09-29T12:00:00.000Z';
  const asset = (symbol: string) => ({ symbol, canonicalAssetId: symbol, mappingStatus: 'verified', asOf,
    opportunity: { adjusted: 75, raw: 75, evidenceGapPenalty: 0, factorScores: [] }, confidence: { pct: 80 },
    riskGates: [], targetWeight: { pct: 0 }, action: 'HOLD', risk: 'Moderate', evidenceCoverage: 0.8 });
  const profile = buildLiquidityProfile({ dailyCredibleNotionalUsd: Array(14).fill(5e6), snapshots: Array.from({ length: 14 }, (_, i) => ({
    pair: 'BTC/USD', observedAt: new Date(Date.parse(asOf) - i * 86400000).toISOString(), activeMinute: true, tradeNotional1m: 1000,
    bids: [{ price: 99.95, size: 1000 }, { price: 99.5, size: 1000 }], asks: [{ price: 100.05, size: 1000 }, { price: 100.5, size: 1000 }],
  })) });
  const books = new Map(['BTC', 'ETH'].map(symbol => [symbol, { pair: `${symbol}/USD`, profile, takerFeeBpsPerSide: 10, estimatedGrossExpectedReturnBps: 1000 }]));
  const common = { snapshot: { asOf, policyVersion: '0.7.6', regime: 'legacy', regimeConfidence: 80, rankedAssets: ['BTC', 'ETH'].map(asset) },
    canonicalAssets: new Map(['BTC', 'ETH'].map(symbol => [symbol, { id: symbol, symbol, name: symbol, mappingStatus: 'verified' }])), evidenceClaims: [] };
  const eager = integrateStrategy21({ ...common, liquidityBySymbol: books });
  const lazy = integrateStrategy21({ ...common, liquidityForSymbol: (symbol: string) => books.get(symbol) } as any);
  expect(lazy).toEqual(eager);
});
