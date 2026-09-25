import test from 'node:test';
import assert from 'node:assert/strict';
import { integrateStrategy21 } from '../integration.js';
import { buildLiquidityProfile, type OrderBookSnapshot } from '../engine/liquidity.js';

function legacyAsset(symbol: string, score: number, confidence = 80) {
  return {
    symbol,
    canonicalAssetId: `${symbol}-id`,
    mappingStatus: 'verified',
    asOf: '2026-09-04T12:00:00.000Z',
    opportunity: { adjusted: score, raw: score, evidenceGapPenalty: 0, factorScores: [
      { family: 'marketTechnical', raw: score, adjusted: score, evidenceClaimIds: [] },
      { family: 'fundamentalTokenomics', raw: 65, adjusted: 65, evidenceClaimIds: [] },
      { family: 'liquidityMarketStructure', raw: 70, adjusted: 70, evidenceClaimIds: [] },
      { family: 'socialAttention', raw: 55, adjusted: 55, evidenceClaimIds: [] },
      { family: 'derivativesLeverage', raw: 70, adjusted: 70, evidenceClaimIds: [] },
      { family: 'catalystsNarrative', raw: 60, adjusted: 60, evidenceClaimIds: [] },
    ]},
    confidence: { pct: confidence },
    riskGates: [],
    targetWeight: { pct: 0 },
    action: score >= 60 ? 'ACCUMULATE' : 'HOLD',
    risk: 'Moderate',
    evidenceCoverage: 0.8,
  };
}

function snapshots14(): OrderBookSnapshot[] {
  const end = Date.parse('2026-09-04T12:00:00.000Z');
  return Array.from({ length: 14 }, (_, i) => ({
    pair: 'ONDOUSD', observedAt: new Date(end - (13-i)*24*60*60*1000).toISOString(), activeMinute: true, tradeNotional1m: 1000,
    bids: [{ price: 99.95, size: 1000 }, { price: 99.5, size: 1000 }, { price: 98, size: 1000 }],
    asks: [{ price: 100.05, size: 1000 }, { price: 100.5, size: 1000 }, { price: 102, size: 1000 }],
  }));
}

test('strategy integration adds separate research and next-dollar ranks without using legacy target weight', () => {
  const snapshot = {
    asOf: '2026-09-04T12:00:00.000Z', policyVersion: '0.4.13', regime: 'legacy', regimeConfidence: 80,
    rankedAssets: [legacyAsset('BTC', 70), legacyAsset('ONDO', 78), legacyAsset('BONK', 72)],
  };
  const profile = buildLiquidityProfile({ snapshots: snapshots14(), dailyCredibleNotionalUsd: Array(14).fill(5_000_000) });
  const result = integrateStrategy21({
    snapshot,
    canonicalAssets: new Map([
      ['BTC', { id:'BTC-id', symbol:'BTC', name:'Bitcoin', mappingStatus:'verified' }],
      ['ONDO', { id:'ONDO-id', symbol:'ONDO', name:'Ondo', mappingStatus:'verified' }],
      ['BONK', { id:'BONK-id', symbol:'BONK', name:'Bonk', mappingStatus:'verified' }],
    ]),
    evidenceClaims: [],
    liquidityBySymbol: new Map([['ONDO', { pair:'ONDOUSD', profile, takerFeeBpsPerSide:10, estimatedGrossExpectedReturnBps:1000 }]]),
  });
  const ondo = result.rankedAssets.find(a => a.symbol === 'ONDO')!;
  assert.ok(ondo.strategy21);
  assert.ok(ondo.strategy21.researchRank > 0);
  assert.ok(ondo.strategy21.nextDollarRank !== null);
  assert.ok(ondo.strategy21.positionAuthority.maxNextOrderUsd > 0);
  assert.equal(ondo.targetWeight?.pct, 0);
});

test('asset without 14-day execution history remains research-ranked but has no next-dollar rank', () => {
  const snapshot = {
    asOf: '2026-09-04T12:00:00.000Z', policyVersion: '0.4.13', regime: 'legacy', regimeConfidence: 80,
    rankedAssets: [legacyAsset('BTC', 70), legacyAsset('NEAR', 74)],
  };
  const result = integrateStrategy21({
    snapshot,
    canonicalAssets: new Map([
      ['BTC', { id:'BTC-id', symbol:'BTC', name:'Bitcoin', mappingStatus:'verified' }],
      ['NEAR', { id:'NEAR-id', symbol:'NEAR', name:'Near', mappingStatus:'verified' }],
    ]),
    evidenceClaims: [],
    liquidityBySymbol: new Map(),
  });
  const near = result.rankedAssets.find(a => a.symbol === 'NEAR')!;
  assert.ok(near.strategy21.researchRank > 0);
  assert.equal(near.strategy21.nextDollarRank, null);
  assert.equal(near.strategy21.eligibility.status, 'WATCH_ONLY');
});

test('behavioral personality is surfaced when supplied but does not alter executable next-dollar score', () => {
  const snapshot = {
    asOf: '2026-09-04T12:00:00.000Z', policyVersion: '0.4.13', regime: 'legacy', regimeConfidence: 80,
    rankedAssets: [legacyAsset('BTC', 70), legacyAsset('ONDO', 78)],
  };
  const liquidity = buildLiquidityProfile({ snapshots: snapshots14(), dailyCredibleNotionalUsd: Array(14).fill(5_000_000) });
  const common = {
    snapshot,
    canonicalAssets: new Map([
      ['BTC', { id:'BTC-id', symbol:'BTC', name:'Bitcoin', mappingStatus:'verified' }],
      ['ONDO', { id:'ONDO-id', symbol:'ONDO', name:'Ondo', mappingStatus:'verified' }],
    ]),
    evidenceClaims: [],
    liquidityBySymbol: new Map([['ONDO', { pair:'ONDOUSD', profile: liquidity, takerFeeBpsPerSide:10 }]]),
  };
  const baseline = integrateStrategy21(common);
  const enriched = integrateStrategy21({
    ...common,
    personalityBySymbol: new Map([['ONDO', {
      btcCorrelation: 0.4,
      btcBeta: 0.8,
      relativeStrengthOnBtcDown: 0.85,
      supportHoldRateOnBtcDown: 0.82,
      spotPersistenceOnBtcDown: 0.78,
      fundingCrowding: 0.2,
      oiCrowding: 0.2,
      breakoutFollowThroughRate: 0.75,
      falseBreakoutRate: 0.15,
      dipRecoveryRate: 0.7,
      medianRecoveryHours: 32,
      compressionBreakoutRate: 0.7,
      trendPersistence: 0.72,
      narrativeSensitivity: 0.35,
      postPumpLiquidityDecay: 0.1,
      capitulationBounceRate: 0.5,
      similarSetupCount: 20,
    }]]),
  });
  const before = baseline.rankedAssets.find(a => a.symbol === 'ONDO')!.strategy21;
  const after = enriched.rankedAssets.find(a => a.symbol === 'ONDO')!.strategy21;
  assert.equal(after.personality?.primary, 'INDEPENDENT_LEADER');
  assert.equal(after.personality?.productionAuthority, 'DESCRIPTIVE_ONLY');
  assert.equal(after.nextDollarScore, before.nextDollarScore);
});


test("strategy metadata declares descriptive research, heuristic ranking, and risk-cap-only sizing authorities", () => {
  const snapshot = {
    asOf: '2026-09-04T12:00:00.000Z', policyVersion: '0.4.13', regime: 'legacy', regimeConfidence: 80,
    rankedAssets: [legacyAsset('BTC', 70), legacyAsset('ONDO', 78)],
  };
  const profile = buildLiquidityProfile({ snapshots: snapshots14(), dailyCredibleNotionalUsd: Array(14).fill(5_000_000) });
  const result = integrateStrategy21({
    snapshot,
    canonicalAssets: new Map([
      ['BTC', { id:'BTC-id', symbol:'BTC', name:'Bitcoin', mappingStatus:'verified' }],
      ['ONDO', { id:'ONDO-id', symbol:'ONDO', name:'Ondo', mappingStatus:'verified' }],
    ]),
    evidenceClaims: [],
    liquidityBySymbol: new Map([['ONDO', { pair:'ONDOUSD', profile, takerFeeBpsPerSide:10, estimatedGrossExpectedReturnBps:1000 }]]),
  });
  assert.equal(result.strategy21.researchAuthority, 'DESCRIPTIVE_ONLY');
  assert.equal(result.strategy21.rankingAuthority, 'OPPORTUNITY_HEURISTIC_V1');
  assert.equal(result.strategy21.positionSizingAuthority, 'RISK_CAPS_ONLY');
  assert.equal(result.strategy21.maneuverCapitalUsd, 1850);
  assert.equal(result.strategy21.deploymentAuthorityUsd, 1572.5);
});

function dailySeries(symbol: string, count: number, scale = 1) {
  const start = Date.parse('2026-05-01T00:00:00.000Z');
  let close = 100;
  const closes = [{ day: new Date(start).toISOString().slice(0,10), close }];
  for (let i = 0; i < count; i++) {
    const r = ((((i % 7) - 3) * 0.004) + (i % 2 ? 0.001 : -0.001)) * scale;
    close *= 1 + r;
    closes.push({ day: new Date(start + (i+1)*86400000).toISOString().slice(0,10), close });
  }
  return { symbol, closes };
}

function verifiedCanonical(symbols: string[]) {
  return new Map(symbols.map((symbol) => [symbol, { id:`${symbol}-id`, symbol, name:symbol, mappingStatus:'verified' }]));
}

test('portfolio dependency input replaces zero exposure placeholders and surfaces summary', () => {
  const snapshot = {
    asOf: '2026-09-04T12:00:00.000Z', policyVersion: '0.4.13', regime: 'legacy', regimeConfidence: 80,
    rankedAssets: [legacyAsset('BTC', 70), legacyAsset('ONDO', 78)],
  };
  const profile = buildLiquidityProfile({ snapshots: snapshots14(), dailyCredibleNotionalUsd: Array(14).fill(5_000_000) });
  const result = integrateStrategy21({
    snapshot,
    canonicalAssets: verifiedCanonical(['BTC','ONDO']),
    evidenceClaims: [],
    liquidityBySymbol: new Map([['ONDO', { pair:'ONDOUSD', profile, takerFeeBpsPerSide:10, estimatedGrossExpectedReturnBps:1000 }]]),
    portfolioDependency: {
      asOf: snapshot.asOf,
      positions: [{ symbol:'ONDO', currentExposureUsd:100 }],
      metadata: [{ symbol:'ONDO', themes:['RWA'], ecosystems:['ETHEREUM'], functions:['RWA'], venues:['KRAKEN_USD'] }],
      histories: [dailySeries('ONDO', 90), dailySeries('BTC', 90), dailySeries('ETH', 90, 0.8)],
    },
  });
  const ondo = result.rankedAssets.find(a => a.symbol === 'ONDO')!.strategy21;
  assert.equal(result.strategy21.portfolioDependency.grossCurrentExposureUsd, 100);
  assert.equal(ondo.assetState, 'CONFIRMED_TREND');
  assert.ok(ondo.positionAuthority.maxPositionUsd >= 100);
});

test('portfolio dependency metrics cannot change research score or rank', () => {
  const snapshot = {
    asOf: '2026-09-04T12:00:00.000Z', policyVersion: '0.4.13', regime: 'legacy', regimeConfidence: 80,
    rankedAssets: [legacyAsset('BTC', 70), legacyAsset('ONDO', 78), legacyAsset('RENDER', 76)],
  };
  const canonicalAssets = verifiedCanonical(['BTC','ONDO','RENDER']);
  const baseline = integrateStrategy21({ snapshot, canonicalAssets, evidenceClaims: [], liquidityBySymbol:new Map() });
  const enriched = integrateStrategy21({
    snapshot, canonicalAssets, evidenceClaims: [], liquidityBySymbol:new Map(),
    portfolioDependency: {
      asOf:snapshot.asOf,
      positions:[{symbol:'ONDO',currentExposureUsd:50},{symbol:'RENDER',currentExposureUsd:50}],
      metadata:[
        {symbol:'ONDO',themes:['AI'],ecosystems:['ETHEREUM'],functions:['COMPUTE'],venues:['KRAKEN_USD']},
        {symbol:'RENDER',themes:['AI'],ecosystems:['SOLANA'],functions:['COMPUTE'],venues:['KRAKEN_USD']},
      ],
      histories:[],
    },
  });
  for (const symbol of ['BTC','ONDO','RENDER']) {
    const before = baseline.rankedAssets.find(a => a.symbol === symbol)!.strategy21;
    const after = enriched.rankedAssets.find(a => a.symbol === symbol)!.strategy21;
    assert.equal(after.researchScore, before.researchScore);
    assert.equal(after.researchRank, before.researchRank);
  }
});

test('cluster pressure can reduce position authority but never increase it', () => {
  const snapshot = {
    asOf: '2026-09-04T12:00:00.000Z', policyVersion: '0.4.13', regime: 'legacy', regimeConfidence: 80,
    rankedAssets: [legacyAsset('BTC', 70), legacyAsset('ONDO', 78), legacyAsset('RENDER', 76)],
  };
  const profile = buildLiquidityProfile({ snapshots: snapshots14(), dailyCredibleNotionalUsd: Array(14).fill(5_000_000) });
  const common = {
    snapshot,
    canonicalAssets: verifiedCanonical(['BTC','ONDO','RENDER']),
    evidenceClaims: [],
    liquidityBySymbol: new Map([['ONDO', { pair:'ONDOUSD', profile, takerFeeBpsPerSide:10, estimatedGrossExpectedReturnBps:1000 }]]),
  };
  const baseline = integrateStrategy21(common);
  const constrained = integrateStrategy21({
    ...common,
    portfolioDependency: {
      asOf:snapshot.asOf,
      positions:[{symbol:'ONDO',currentExposureUsd:0},{symbol:'RENDER',currentExposureUsd:355}],
      metadata:[
        {symbol:'ONDO',themes:['AI'],ecosystems:['SOLANA'],functions:['COMPUTE'],venues:['KRAKEN_USD']},
        {symbol:'RENDER',themes:['AI'],ecosystems:['SOLANA'],functions:['COMPUTE'],venues:['KRAKEN_USD']},
      ],
      histories:[],
    },
  });
  const before = baseline.rankedAssets.find(a => a.symbol === 'ONDO')!.strategy21.positionAuthority;
  const after = constrained.rankedAssets.find(a => a.symbol === 'ONDO')!.strategy21.positionAuthority;
  assert.ok(after.maxPositionUsd < before.maxPositionUsd);
  assert.ok(after.maxNextOrderUsd <= before.maxNextOrderUsd);
});

test('line 3 fails closed when covariance evidence is unresolved while line 1 and 2 policy remains unchanged', () => {
  const snapshot = {
    asOf: '2026-09-04T12:00:00.000Z', policyVersion: '0.4.13', regime: 'legacy', regimeConfidence: 80,
    rankedAssets: [legacyAsset('BTC', 70), legacyAsset('ONDO', 78), legacyAsset('RENDER', 76)],
  };
  const profile = buildLiquidityProfile({ snapshots: snapshots14(), dailyCredibleNotionalUsd: Array(14).fill(5_000_000) });
  const result = integrateStrategy21({
    snapshot,
    canonicalAssets: verifiedCanonical(['BTC','ONDO','RENDER']),
    evidenceClaims: [],
    liquidityBySymbol: new Map([['ONDO', { pair:'ONDOUSD', profile, takerFeeBpsPerSide:10, estimatedGrossExpectedReturnBps:1000 }]]),
    portfolioDependency: {
      asOf:snapshot.asOf,
      positions:[{symbol:'ONDO',currentExposureUsd:30},{symbol:'RENDER',currentExposureUsd:30}],
      metadata:[], histories:[],
    },
  });
  const ondo = result.rankedAssets.find(a => a.symbol === 'ONDO')!.strategy21;
  assert.equal(ondo.assetState, 'CONFIRMED_TREND');
  const line1 = ondo.stagedExecution.lines.find(x => x.line === 1)!;
  const line2 = ondo.stagedExecution.lines.find(x => x.line === 2)!;
  const line3 = ondo.stagedExecution.lines.find(x => x.line === 3)!;
  assert.equal(line1.authorized, true);
  assert.equal(line2.authorized, true);
  assert.equal(line3.authorized, false);
  assert.match(line3.reason, /covariance|cluster/i);
});

test('missing portfolio dependency input keeps research snapshot working and line-3 covariance is not silently true', () => {
  const snapshot = {
    asOf: '2026-09-04T12:00:00.000Z', policyVersion: '0.4.13', regime: 'legacy', regimeConfidence: 80,
    rankedAssets: [legacyAsset('BTC', 70), legacyAsset('ONDO', 78)],
  };
  const result = integrateStrategy21({ snapshot, canonicalAssets:verifiedCanonical(['BTC','ONDO']), evidenceClaims:[], liquidityBySymbol:new Map() });
  assert.equal(result.strategy21.portfolioDependency.readiness, 'UNKNOWN');
  assert.ok(result.rankedAssets.find(a => a.symbol === 'ONDO')!.strategy21.researchRank > 0);
});

function conditionalSnapshots(): OrderBookSnapshot[] {
  const end = Date.parse('2026-09-04T12:00:00.000Z');
  return Array.from({ length: 14 }, (_, i) => {
    const current = i === 13;
    const spreadHalf = (current ? 8 : 35) / 20_000;
    return {
      pair: 'SUSHIUSD', observedAt: new Date(end - (13-i)*24*60*60*1000).toISOString(), activeMinute: true, tradeNotional1m: 1000,
      bids: [{ price: 100*(1-spreadHalf), size: 1000 }, { price: 99.5, size: 1000 }, { price: 98, size: 1000 }],
      asks: [{ price: 100*(1+spreadHalf), size: 1000 }, { price: 100.5, size: 1000 }, { price: 102, size: 1000 }],
    };
  });
}

test('conditional candidate receives bounded next-dollar authority and descriptive liquidity acceleration', () => {
  const snapshot = {
    asOf: '2026-09-04T12:00:00.000Z', policyVersion: '0.4.13', regime: 'legacy', regimeConfidence: 80,
    rankedAssets: [legacyAsset('BTC', 70), legacyAsset('SUSHI', 78)],
  };
  const profile = buildLiquidityProfile({ snapshots: conditionalSnapshots(), dailyCredibleNotionalUsd: Array(14).fill(238_000) });
  const result = integrateStrategy21({
    snapshot,
    canonicalAssets: verifiedCanonical(['BTC','SUSHI']),
    evidenceClaims: [],
    liquidityBySymbol: new Map([['SUSHI', {
      pair:'SUSHIUSD', profile, takerFeeBpsPerSide:10, estimatedGrossExpectedReturnBps:1000,
      currentTradeCount24h:1248,
      priorCompletedDayTradeCounts24h:[500,520,510,530,515,525,505],
    }]]),
  });
  const sushi = result.rankedAssets.find(a => a.symbol === 'SUSHI')!.strategy21;
  assert.equal(sushi.eligibility.status, 'CONDITIONAL_PROBE_ELIGIBLE');
  assert.equal(sushi.positionAuthority.maxPositionUsd, 25);
  assert.equal(sushi.positionAuthority.maxNextOrderUsd, 25);
  assert.equal(sushi.liquidityAcceleration.status, 'ACCELERATING');
  assert.ok(sushi.nextDollarRank !== null);
});

test('evidence horizons reflect the decision horizon of each factor family', async () => {
  const { evidenceTimingForFamily } = await import('../integration.js');
  assert.deepEqual(evidenceTimingForFamily('marketTechnical'), { horizon: 'HOURS', ttlMs: 6 * 60 * 60 * 1000 });
  assert.deepEqual(evidenceTimingForFamily('socialAttention'), { horizon: 'HOURS', ttlMs: 12 * 60 * 60 * 1000 });
  assert.deepEqual(evidenceTimingForFamily('onchainPositioning'), { horizon: 'DAYS', ttlMs: 3 * 24 * 60 * 60 * 1000 });
  assert.deepEqual(evidenceTimingForFamily('catalystsNarrative'), { horizon: 'WEEKS', ttlMs: 28 * 24 * 60 * 60 * 1000 });
  assert.deepEqual(evidenceTimingForFamily('fundamentalTokenomics'), { horizon: 'MONTHS', ttlMs: 90 * 24 * 60 * 60 * 1000 });
});

test('refresh cannot renew expired or fallback price evidence', () => {
  const asOf = '2026-09-25T20:00:00Z';
  const result = integrateStrategy21({
    snapshot: {asOf,policyVersion:'test',regime:'legacy',regimeConfidence:80,rankedAssets:[legacyAsset('BTC',70)]},
    canonicalAssets: new Map([['BTC',{id:'BTC-id',symbol:'BTC',name:'Bitcoin',mappingStatus:'verified'}]]),
    evidenceClaims: [
      {id:'expired',symbol:'BTC',factorFamily:'marketTechnical',claim:'{"priceUsd":1}',observedAt:'2026-09-24T20:00:00Z',receivedAt:asOf},
      {id:'fresh',symbol:'BTC',factorFamily:'marketTechnical',claim:'{"priceUsd":85000}',observedAt:asOf,receivedAt:asOf},
    ],
  });
  const observations = result.rankedAssets[0]!.strategy21.explanation.observations;
  assert.ok(!observations.some(o => o.id === 'expired'));
  assert.ok(observations.some(o => o.id === 'fresh'));
});
