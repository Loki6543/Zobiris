import test from 'node:test';
import assert from 'node:assert/strict';
import {
  alignReturns,
  currentPortfolioContextForAsset,
  calculateBeta,
  calculatePortfolioDependency,
  pearsonCorrelation,
  type DailyCloseSeries,
  type PortfolioDependencyInput,
} from '../engine/portfolioDependency.js';

function series(symbol: string, returns: number[], start = '2026-01-01'): DailyCloseSeries {
  const startMs = Date.parse(`${start}T00:00:00.000Z`);
  let close = 100;
  const closes = [{ day: new Date(startMs).toISOString().slice(0, 10), close }];
  returns.forEach((r, i) => {
    close *= 1 + r;
    closes.push({ day: new Date(startMs + (i + 1) * 86400000).toISOString().slice(0, 10), close });
  });
  return { symbol, closes };
}

function baseInput(overrides: Partial<PortfolioDependencyInput> = {}): PortfolioDependencyInput {
  return {
    asOf: '2026-09-07T12:00:00.000Z',
    positions: [
      { symbol: 'TAO', currentExposureUsd: 100, openBuyCommitmentUsd: 20 },
      { symbol: 'RENDER', currentExposureUsd: 80, openBuyCommitmentUsd: 20 },
    ],
    metadata: [
      { symbol: 'TAO', themes: ['AI'], ecosystems: ['BITTENSOR'], functions: ['COMPUTE'], venues: ['KRAKEN_USD'] },
      { symbol: 'RENDER', themes: ['AI'], ecosystems: ['SOLANA'], functions: ['COMPUTE'], venues: ['KRAKEN_USD'] },
    ],
    histories: [],
    ...overrides,
  };
}

const patterned = Array.from({ length: 90 }, (_, i) => ((i % 7) - 3) * 0.004 + (i % 2 ? 0.001 : -0.001));

test('identical return series have correlation 1', () => {
  const a = patterned.slice(0, 30);
  assert.ok(Math.abs(pearsonCorrelation(a, a)! - 1) < 1e-12);
});

test('inverse return series have correlation near -1', () => {
  const a = patterned.slice(0, 30);
  const b = a.map((x) => -x);
  assert.ok((pearsonCorrelation(a, b) ?? 0) < -0.999999);
});

test('alignment uses UTC day intersection and never forward fills', () => {
  const a = series('A', [0.01, 0.02, 0.03, 0.04]);
  const b = series('B', [0.01, 0.02, 0.03, 0.04]);
  b.closes.splice(2, 1);
  const aligned = alignReturns(a, b);
  assert.equal(aligned.days.includes('2026-01-03'), false);
  assert.equal(aligned.days.includes('2026-01-04'), false);
  assert.equal(aligned.days.length, 2);
});

test('insufficient 30d and 90d samples return null instead of zero', () => {
  const input = baseInput({ histories: [series('TAO', patterned.slice(0, 10)), series('RENDER', patterned.slice(0, 10))] });
  const result = calculatePortfolioDependency(input);
  assert.equal(result.pairMetrics[0]?.correlation30d, null);
  assert.equal(result.pairMetrics[0]?.correlation90d, null);
});

test('downside correlation uses only days where either member is negative', () => {
  const a = patterned.slice(0, 30);
  const b = a.map((r, i) => i < 15 ? r : -r);
  const input = baseInput({ histories: [series('TAO', a), series('RENDER', b)] });
  const result = calculatePortfolioDependency(input);
  const pair = result.pairMetrics[0]!;
  assert.notEqual(pair.downsideCorrelation, pair.correlation30d);
});

test('BTC beta matches a known 2x return fixture', () => {
  const btc = patterned.slice(0, 30);
  const asset = btc.map((r) => r * 2);
  const aligned = alignReturns(series('ASSET', asset), series('BTC', btc));
  const beta = calculateBeta(aligned.a, aligned.b, 20);
  assert.ok(Math.abs((beta ?? 0) - 2) < 1e-9);
});

test('static overlap fallback requires at least two independent dependency classes', () => {
  const oneClass = calculatePortfolioDependency(baseInput({
    metadata: [
      { symbol:'TAO', themes:['AI'], ecosystems:['BITTENSOR'], functions:['COMPUTE'], venues:['KRAKEN_USD'] },
      { symbol:'RENDER', themes:['AI'], ecosystems:['SOLANA'], functions:['RENDERING'], venues:['COINBASE_USD'] },
    ],
  }));
  const twoClass = calculatePortfolioDependency(baseInput());
  assert.equal(oneClass.assets.find(a => a.symbol === 'TAO')!.strongestDependencyPeers.length, 0);
  assert.deepEqual(twoClass.assets.find(a => a.symbol === 'TAO')!.strongestDependencyPeers, ['RENDER']);
});



test('static fallback remains available when empirical evidence is partial rather than complete', () => {
  const a = Array.from({ length: 90 }, (_, i) => 0.002 + (i % 5) * 0.0004);
  const b = Array.from({ length: 90 }, (_, i) => 0.004 - (i % 5) * 0.0004);
  const result = calculatePortfolioDependency(baseInput({ histories: [series('TAO', a), series('RENDER', b)] }));
  const pair = result.pairMetrics[0]!;
  assert.notEqual(pair.correlation90d, null);
  assert.equal(pair.downsideCorrelation, null);
  assert.deepEqual(result.assets.find(x => x.symbol === 'TAO')!.strongestDependencyPeers, ['RENDER']);
});

test('disconnected assets remain separate clusters', () => {
  const result = calculatePortfolioDependency(baseInput({
    positions: [
      { symbol:'A', currentExposureUsd:100 },
      { symbol:'B', currentExposureUsd:100 },
    ],
    metadata: [
      { symbol:'A', themes:['AI'], ecosystems:['X'], functions:['COMPUTE'], venues:['KRAKEN'] },
      { symbol:'B', themes:['RWA'], ecosystems:['Y'], functions:['LENDING'], venues:['COINBASE'] },
    ],
  }));
  assert.equal(result.assets.find(a => a.symbol === 'A')!.clusterExposureUsd, 100);
  assert.equal(result.assets.find(a => a.symbol === 'B')!.clusterExposureUsd, 100);
});

test('transitive edges form one connected dependency component', () => {
  const result = calculatePortfolioDependency(baseInput({
    positions: [
      { symbol:'A', currentExposureUsd:50 },
      { symbol:'B', currentExposureUsd:60 },
      { symbol:'C', currentExposureUsd:70 },
    ],
    metadata: [
      { symbol:'A', themes:['AI'], ecosystems:['X'], functions:['COMPUTE'], venues:['KRAKEN'] },
      { symbol:'B', themes:['AI'], ecosystems:['X'], functions:['LENDING'], venues:['COINBASE'] },
      { symbol:'C', themes:['RWA'], ecosystems:['X'], functions:['LENDING'], venues:['KRAKEN'] },
    ],
  }));
  assert.equal(result.assets.find(a => a.symbol === 'A')!.clusterExposureUsd, 180);
  assert.equal(result.assets.find(a => a.symbol === 'C')!.clusterExposureUsd, 180);
});

test('post-fill exposure includes open buys', () => {
  const result = calculatePortfolioDependency(baseInput());
  assert.equal(result.assets.find(a => a.symbol === 'TAO')!.postFillExposureUsd, 120);
});

test('open sells reduce but never increase post-fill exposure', () => {
  const result = calculatePortfolioDependency(baseInput({ positions: [{ symbol:'TAO', currentExposureUsd:100, openSellCommitmentUsd:30 }] }));
  assert.equal(result.assets.find(a => a.symbol === 'TAO')!.postFillExposureUsd, 70);
});

test('cluster exposure is calculated from post-fill exposure of all members', () => {
  const result = calculatePortfolioDependency(baseInput());
  assert.equal(result.assets.find(a => a.symbol === 'TAO')!.clusterExposureUsd, 220);
});

test('asset risk reports current cluster exposure and marginal impact of its own open order', () => {
  const result = calculatePortfolioDependency(baseInput());
  const tao = result.assets.find(a => a.symbol === 'TAO')!;
  assert.equal(tao.currentClusterExposureUsd, 180);
  assert.equal(tao.marginalClusterImpactUsd, 20);
});

test('READY requires benchmark history as well as positioned-asset history and metadata', () => {
  const noBenchmarks = calculatePortfolioDependency(baseInput({
    histories: [series('TAO', patterned), series('RENDER', patterned.map(x => x * 0.8))],
  }));
  assert.equal(noBenchmarks.readiness, 'PARTIAL');
  const ready = calculatePortfolioDependency(baseInput({
    histories: [
      series('TAO', patterned),
      series('RENDER', patterned.map(x => x * 0.8)),
      series('BTC', patterned.map(x => x * 0.7)),
      series('ETH', patterned.map(x => x * 0.9)),
    ],
  }));
  assert.equal(ready.readiness, 'READY');
});


test('cluster cap breach makes covariance unacceptable', () => {
  const result = calculatePortfolioDependency(baseInput(), { capitalBaseUsd: 800 });
  assert.equal(result.assets.find(a => a.symbol === 'TAO')!.covarianceAcceptable, false);
});

test('unknown portfolio evidence gives covariance null rather than true', () => {
  const result = calculatePortfolioDependency({ asOf:'2026-09-07T12:00:00Z', positions:[], metadata:[], histories:[] });
  assert.equal(result.readiness, 'UNKNOWN');
  assert.equal(result.assets.length, 0);
});

test('no supplied position input never infers exposure from metadata or history', () => {
  const result = calculatePortfolioDependency({
    asOf:'2026-09-07T12:00:00Z',
    positions:[],
    metadata:[{ symbol:'TAO', themes:['AI'], ecosystems:['BITTENSOR'], functions:['COMPUTE'], venues:['KRAKEN'] }],
    histories:[series('TAO', patterned.slice(0,30))],
  });
  assert.equal(result.grossCurrentExposureUsd, 0);
  assert.equal(result.grossPostFillExposureUsd, 0);
});

test('unfilled buys consume sizing capacity while contingent sells cannot free it', () => {
  const input = {
    asOf: '2026-09-25T20:00:00Z', metadata: [], histories: [],
    positions: [
      {symbol:'SOL',currentExposureUsd:100,openBuyCommitmentUsd:40,openSellCommitmentUsd:80},
      {symbol:'DOGE',currentExposureUsd:10,openBuyCommitmentUsd:20},
    ],
  };
  const summary = calculatePortfolioDependency(input);
  const context = currentPortfolioContextForAsset(input, summary, 'SOL', new Set(['DOGE']));
  assert.equal(context.assetExposureUsd, 140);
  assert.equal(context.grossExposureUsd, 170);
  assert.equal(context.memeExposureUsd, 30);
});
