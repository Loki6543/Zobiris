export interface PortfolioPositionInput {
  symbol: string;
  currentExposureUsd: number;
  openBuyCommitmentUsd?: number;
  openSellCommitmentUsd?: number;
}

export interface AssetDependencyMetadata {
  symbol: string;
  themes: string[];
  ecosystems: string[];
  functions: string[];
  venues: string[];
}

export interface DailyCloseSeries {
  symbol: string;
  closes: Array<{ day: string; close: number }>;
}

export interface PortfolioDependencyInput {
  asOf: string;
  positions: PortfolioPositionInput[];
  metadata: AssetDependencyMetadata[];
  histories: DailyCloseSeries[];
  btcSymbol?: string;
  ethSymbol?: string;
}

export type DependencyReadiness = 'READY' | 'PARTIAL' | 'UNKNOWN';

export interface PairDependencyMetrics {
  a: string;
  b: string;
  correlation30d: number | null;
  correlation90d: number | null;
  downsideCorrelation: number | null;
  btcStressCorrelation: number | null;
  sharedThemes: string[];
  sharedEcosystems: string[];
  sharedFunctions: string[];
  sharedVenues: string[];
}

export interface AssetPortfolioRisk {
  symbol: string;
  currentExposureUsd: number;
  postFillExposureUsd: number;
  btcBeta: number | null;
  ethBeta: number | null;
  strongestDependencyPeers: string[];
  currentClusterExposureUsd: number | null;
  clusterExposureUsd: number | null;
  marginalClusterImpactUsd: number;
  covarianceAcceptable: boolean | null;
  reasons: string[];
}

export interface PortfolioDependencySummary {
  readiness: DependencyReadiness;
  grossCurrentExposureUsd: number;
  grossPostFillExposureUsd: number;
  concentrationByTheme: Record<string, number>;
  concentrationByEcosystem: Record<string, number>;
  concentrationByFunction: Record<string, number>;
  pairMetrics: PairDependencyMetrics[];
  assets: AssetPortfolioRisk[];
  warnings: string[];
  productionAuthority: 'DESCRIPTIVE_ONLY_AND_RISK_CAPS_ONLY';
}

export interface PortfolioDependencyPolicy {
  minCorrelation30d: number;
  minCorrelation90d: number;
  minDownside: number;
  minBtcStress: number;
  minBeta: number;
  downsideEdge: number;
  correlation90dEdge: number;
  staticOverlapClasses: number;
  clusterCapPct: number;
  capitalBaseUsd: number;
}

export const DEFAULT_PORTFOLIO_DEPENDENCY_POLICY: PortfolioDependencyPolicy = {
  minCorrelation30d: 20,
  minCorrelation90d: 60,
  minDownside: 10,
  minBtcStress: 5,
  minBeta: 20,
  downsideEdge: 0.70,
  correlation90dEdge: 0.80,
  staticOverlapClasses: 2,
  clusterCapPct: 0.25,
  capitalBaseUsd: 1850,
};

interface ReturnSeries {
  symbol: string;
  returns: Map<string, number>;
}

export interface AlignedReturns {
  days: string[];
  a: number[];
  b: number[];
}

function normSymbol(symbol: string): string {
  return symbol.trim().toUpperCase();
}

function finiteNonNegative(value: number | undefined): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, value) : 0;
}

function utcDay(day: string): string | null {
  const t = Date.parse(day.length === 10 ? `${day}T00:00:00.000Z` : day);
  return Number.isFinite(t) ? new Date(t).toISOString().slice(0, 10) : null;
}

function dayBefore(day: string): string {
  return new Date(Date.parse(`${day}T00:00:00.000Z`) - 86400000).toISOString().slice(0, 10);
}

function simpleReturns(series: DailyCloseSeries): ReturnSeries {
  const closes = new Map<string, number>();
  for (const point of series.closes) {
    const day = utcDay(point.day);
    if (!day || !Number.isFinite(point.close) || point.close <= 0) continue;
    closes.set(day, point.close);
  }
  const returns = new Map<string, number>();
  for (const [day, close] of closes) {
    const previous = closes.get(dayBefore(day));
    if (previous === undefined || previous <= 0) continue;
    returns.set(day, close / previous - 1);
  }
  return { symbol: normSymbol(series.symbol), returns };
}

export function alignReturns(aSeries: DailyCloseSeries, bSeries: DailyCloseSeries): AlignedReturns {
  return alignReturnMaps(simpleReturns(aSeries).returns, simpleReturns(bSeries).returns);
}

function alignReturnMaps(aMap: Map<string, number>, bMap: Map<string, number>, allowedDays?: Set<string>): AlignedReturns {
  const days = [...aMap.keys()]
    .filter((day) => bMap.has(day) && (!allowedDays || allowedDays.has(day)))
    .sort();
  return {
    days,
    a: days.map((d) => aMap.get(d)!),
    b: days.map((d) => bMap.get(d)!),
  };
}

function tail<T>(values: T[], n: number): T[] {
  return values.slice(Math.max(0, values.length - n));
}

export function pearsonCorrelation(a: number[], b: number[], minimum = 2): number | null {
  if (a.length !== b.length || a.length < minimum) return null;
  const meanA = a.reduce((s, x) => s + x, 0) / a.length;
  const meanB = b.reduce((s, x) => s + x, 0) / b.length;
  let cov = 0;
  let varA = 0;
  let varB = 0;
  for (let i = 0; i < a.length; i++) {
    const da = a[i]! - meanA;
    const db = b[i]! - meanB;
    cov += da * db;
    varA += da * da;
    varB += db * db;
  }
  if (varA <= 0 || varB <= 0) return null;
  return Math.max(-1, Math.min(1, cov / Math.sqrt(varA * varB)));
}

export function calculateBeta(assetReturns: number[], benchmarkReturns: number[], minimum = 20): number | null {
  if (assetReturns.length !== benchmarkReturns.length || assetReturns.length < minimum) return null;
  const meanA = assetReturns.reduce((s, x) => s + x, 0) / assetReturns.length;
  const meanB = benchmarkReturns.reduce((s, x) => s + x, 0) / benchmarkReturns.length;
  let cov = 0;
  let variance = 0;
  for (let i = 0; i < assetReturns.length; i++) {
    cov += (assetReturns[i]! - meanA) * (benchmarkReturns[i]! - meanB);
    variance += (benchmarkReturns[i]! - meanB) ** 2;
  }
  return variance > 0 ? cov / variance : null;
}

function shared(a: string[] | undefined, b: string[] | undefined): string[] {
  if (!a || !b) return [];
  const bs = new Set(b.map((x) => x.toUpperCase()));
  return [...new Set(a.map((x) => x.toUpperCase()).filter((x) => bs.has(x)))].sort();
}

function concentration(
  positions: Map<string, { current: number; postFill: number }>,
  metadata: Map<string, AssetDependencyMetadata>,
  field: 'themes' | 'ecosystems' | 'functions',
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [symbol, exposure] of positions) {
    const tags = metadata.get(symbol)?.[field] ?? [];
    for (const tag of new Set(tags.map((x) => x.toUpperCase()))) {
      out[tag] = Math.round(((out[tag] ?? 0) + exposure.postFill) * 100) / 100;
    }
  }
  return Object.fromEntries(Object.entries(out).sort(([a], [b]) => a.localeCompare(b)));
}

function connectedComponents(symbols: string[], edges: Map<string, Set<string>>): Map<string, string[]> {
  const result = new Map<string, string[]>();
  const seen = new Set<string>();
  for (const start of symbols) {
    if (seen.has(start)) continue;
    const stack = [start];
    const component: string[] = [];
    seen.add(start);
    while (stack.length) {
      const current = stack.pop()!;
      component.push(current);
      for (const peer of edges.get(current) ?? []) {
        if (!seen.has(peer)) {
          seen.add(peer);
          stack.push(peer);
        }
      }
    }
    component.sort();
    for (const symbol of component) result.set(symbol, component);
  }
  return result;
}

function empiricalEvidenceComplete(pair: PairDependencyMetrics): boolean {
  return pair.correlation90d !== null && pair.downsideCorrelation !== null;
}

function staticEvidenceKnown(a: AssetDependencyMetadata | undefined, b: AssetDependencyMetadata | undefined): boolean {
  return Boolean(a && b);
}

function pairHasEdge(pair: PairDependencyMetrics, policy: PortfolioDependencyPolicy, staticFallbackAllowed: boolean): boolean {
  if (pair.downsideCorrelation !== null && pair.downsideCorrelation >= policy.downsideEdge) return true;
  if (pair.correlation90d !== null && pair.correlation90d >= policy.correlation90dEdge) return true;
  if (!staticFallbackAllowed) return false;
  const classes = [pair.sharedThemes, pair.sharedEcosystems, pair.sharedFunctions, pair.sharedVenues].filter((x) => x.length > 0).length;
  return classes >= policy.staticOverlapClasses;
}

function pairKey(a: string, b: string): string {
  return [a, b].sort().join('|');
}

export function calculatePortfolioDependency(
  input: PortfolioDependencyInput,
  overrides: Partial<PortfolioDependencyPolicy> = {},
): PortfolioDependencySummary {
  const policy = { ...DEFAULT_PORTFOLIO_DEPENDENCY_POLICY, ...overrides };
  const positions = new Map<string, { current: number; postFill: number }>();
  for (const position of input.positions) {
    const symbol = normSymbol(position.symbol);
    const current = finiteNonNegative(position.currentExposureUsd);
    const buys = finiteNonNegative(position.openBuyCommitmentUsd);
    const sells = finiteNonNegative(position.openSellCommitmentUsd);
    positions.set(symbol, { current, postFill: Math.max(0, current + buys - sells) });
  }

  const grossCurrentExposureUsd = [...positions.values()].reduce((s, x) => s + x.current, 0);
  const grossPostFillExposureUsd = [...positions.values()].reduce((s, x) => s + x.postFill, 0);
  if (positions.size === 0) {
    return {
      readiness: 'UNKNOWN',
      grossCurrentExposureUsd: 0,
      grossPostFillExposureUsd: 0,
      concentrationByTheme: {},
      concentrationByEcosystem: {},
      concentrationByFunction: {},
      pairMetrics: [],
      assets: [],
      warnings: ['portfolio positions were not supplied; exposure was not inferred'],
      productionAuthority: 'DESCRIPTIVE_ONLY_AND_RISK_CAPS_ONLY',
    };
  }

  const metadata = new Map(input.metadata.map((m) => [normSymbol(m.symbol), { ...m, symbol: normSymbol(m.symbol) }]));
  const histories = new Map(input.histories.map((h) => [normSymbol(h.symbol), simpleReturns(h)]));
  const symbols = [...positions.keys()].sort();
  const btcSymbol = normSymbol(input.btcSymbol ?? 'BTC');
  const ethSymbol = normSymbol(input.ethSymbol ?? 'ETH');
  const btcReturns = histories.get(btcSymbol)?.returns;
  const ethReturns = histories.get(ethSymbol)?.returns;
  const btcStressDays = btcReturns
    ? new Set([...btcReturns.entries()].filter(([, r]) => r <= -0.03).map(([day]) => day))
    : new Set<string>();

  const pairMetrics: PairDependencyMetrics[] = [];
  const pairEvidence = new Map<string, boolean>();
  const edges = new Map(symbols.map((s) => [s, new Set<string>()]));
  for (let i = 0; i < symbols.length; i++) {
    for (let j = i + 1; j < symbols.length; j++) {
      const a = symbols[i]!;
      const b = symbols[j]!;
      const ar = histories.get(a)?.returns;
      const br = histories.get(b)?.returns;
      const aligned = ar && br ? alignReturnMaps(ar, br) : { days: [], a: [], b: [] };
      const last30a = tail(aligned.a, 30);
      const last30b = tail(aligned.b, 30);
      const last90a = tail(aligned.a, 90);
      const last90b = tail(aligned.b, 90);
      const downIndexes = aligned.a.map((x, idx) => (x < 0 || aligned.b[idx]! < 0 ? idx : -1)).filter((x) => x >= 0);
      const downA = downIndexes.map((idx) => aligned.a[idx]!);
      const downB = downIndexes.map((idx) => aligned.b[idx]!);
      const stress = ar && br && btcStressDays.size ? alignReturnMaps(ar, br, btcStressDays) : { days: [], a: [], b: [] };
      const ma = metadata.get(a);
      const mb = metadata.get(b);
      const pair: PairDependencyMetrics = {
        a,
        b,
        correlation30d: pearsonCorrelation(last30a, last30b, policy.minCorrelation30d),
        correlation90d: pearsonCorrelation(last90a, last90b, policy.minCorrelation90d),
        downsideCorrelation: pearsonCorrelation(downA, downB, policy.minDownside),
        btcStressCorrelation: pearsonCorrelation(stress.a, stress.b, policy.minBtcStress),
        sharedThemes: shared(ma?.themes, mb?.themes),
        sharedEcosystems: shared(ma?.ecosystems, mb?.ecosystems),
        sharedFunctions: shared(ma?.functions, mb?.functions),
        sharedVenues: shared(ma?.venues, mb?.venues),
      };
      const empiricalComplete = empiricalEvidenceComplete(pair);
      const staticKnown = staticEvidenceKnown(ma, mb);
      const evidenceKnown = empiricalComplete || staticKnown;
      pairEvidence.set(pairKey(a, b), evidenceKnown);
      const edge = pairHasEdge(pair, policy, !empiricalComplete && staticKnown);
      if (edge) {
        edges.get(a)!.add(b);
        edges.get(b)!.add(a);
      }
      pairMetrics.push(pair);
    }
  }

  const components = connectedComponents(symbols, edges);
  const capUsd = policy.capitalBaseUsd * policy.clusterCapPct;
  const assets: AssetPortfolioRisk[] = symbols.map((symbol) => {
    const exposure = positions.get(symbol)!;
    const component = components.get(symbol) ?? [symbol];
    const peers = [...(edges.get(symbol) ?? [])].sort();
    const currentClusterExposureUsd = component.reduce((s, x) => s + (positions.get(x)?.current ?? 0), 0);
    const clusterExposureUsd = component.reduce((s, x) => s + (positions.get(x)?.postFill ?? 0), 0);
    const marginalClusterImpactUsd = exposure.postFill - exposure.current;
    const unresolvedPeers = symbols.filter((peer) => peer !== symbol && pairEvidence.get(pairKey(symbol, peer)) !== true);
    const assetReturns = histories.get(symbol)?.returns;
    let btcBeta: number | null = null;
    let ethBeta: number | null = null;
    if (assetReturns && btcReturns) {
      const aligned = alignReturnMaps(assetReturns, btcReturns);
      btcBeta = calculateBeta(aligned.a, aligned.b, policy.minBeta);
    }
    if (assetReturns && ethReturns) {
      const aligned = alignReturnMaps(assetReturns, ethReturns);
      ethBeta = calculateBeta(aligned.a, aligned.b, policy.minBeta);
    }
    const reasons: string[] = [];
    let covarianceAcceptable: boolean | null;
    if (unresolvedPeers.length > 0) {
      covarianceAcceptable = null;
      reasons.push(`dependency evidence unresolved versus: ${unresolvedPeers.join(', ')}`);
    } else if (clusterExposureUsd > capUsd + 1e-9) {
      covarianceAcceptable = false;
      reasons.push(`post-fill dependency cluster ${clusterExposureUsd.toFixed(2)} exceeds ${(policy.clusterCapPct * 100).toFixed(0)}% cap ${capUsd.toFixed(2)}`);
    } else {
      covarianceAcceptable = true;
      reasons.push(`post-fill dependency cluster ${clusterExposureUsd.toFixed(2)} is within cap ${capUsd.toFixed(2)}`);
    }
    return {
      symbol,
      currentExposureUsd: exposure.current,
      postFillExposureUsd: exposure.postFill,
      btcBeta,
      ethBeta,
      strongestDependencyPeers: peers,
      currentClusterExposureUsd,
      clusterExposureUsd,
      marginalClusterImpactUsd,
      covarianceAcceptable,
      reasons,
    };
  });

  const allHaveMetadata = symbols.every((s) => metadata.has(s));
  const allHaveLongHistory = symbols.every((s) => (histories.get(s)?.returns.size ?? 0) >= policy.minCorrelation90d);
  const benchmarkHistoryReady = (histories.get(btcSymbol)?.returns.size ?? 0) >= policy.minBeta
    && (histories.get(ethSymbol)?.returns.size ?? 0) >= policy.minBeta;
  const readiness: DependencyReadiness = allHaveMetadata && allHaveLongHistory && benchmarkHistoryReady ? 'READY' : 'PARTIAL';
  const warnings: string[] = [];
  if (readiness !== 'READY') warnings.push('portfolio dependency evidence is partial; missing metrics remain null');
  for (const asset of assets) {
    if (asset.covarianceAcceptable === false) warnings.push(`${asset.symbol}: dependency cluster cap breached`);
    if (asset.covarianceAcceptable === null) warnings.push(`${asset.symbol}: covariance decision unavailable`);
  }

  return {
    readiness,
    grossCurrentExposureUsd: Math.round(grossCurrentExposureUsd * 100) / 100,
    grossPostFillExposureUsd: Math.round(grossPostFillExposureUsd * 100) / 100,
    concentrationByTheme: concentration(positions, metadata, 'themes'),
    concentrationByEcosystem: concentration(positions, metadata, 'ecosystems'),
    concentrationByFunction: concentration(positions, metadata, 'functions'),
    pairMetrics,
    assets,
    warnings: [...new Set(warnings)],
    productionAuthority: 'DESCRIPTIVE_ONLY_AND_RISK_CAPS_ONLY',
  };
}

export function currentPortfolioContextForAsset(
  input: PortfolioDependencyInput,
  summary: PortfolioDependencySummary,
  symbolInput: string,
  memeSymbols: ReadonlySet<string>,
): { grossExposureUsd: number; assetExposureUsd: number; clusterExposureUsd: number; memeExposureUsd: number } {
  const symbol = normSymbol(symbolInput);
  const positionMap = new Map(input.positions.map((p) => [normSymbol(p.symbol), finiteNonNegative(p.currentExposureUsd) + finiteNonNegative(p.openBuyCommitmentUsd)]));
  const asset = summary.assets.find((a) => a.symbol === symbol);
  const adjacency = new Map(summary.assets.map((a) => [a.symbol, new Set(a.strongestDependencyPeers)]));
  const component = new Set<string>([symbol]);
  const stack = [symbol];
  while (stack.length) {
    const current = stack.pop()!;
    for (const peer of adjacency.get(current) ?? []) {
      if (!component.has(peer)) {
        component.add(peer);
        stack.push(peer);
      }
    }
  }
  const clusterExposureUsd = asset
    ? [...component].reduce((s, x) => s + (positionMap.get(x) ?? 0), 0)
    : 0;
  const memeExposureUsd = [...positionMap.entries()].reduce((s, [smb, exp]) => s + (memeSymbols.has(smb) ? exp : 0), 0);
  return {
    grossExposureUsd: [...positionMap.values()].reduce((sum, value) => sum + value, 0),
    assetExposureUsd: positionMap.get(symbol) ?? 0,
    clusterExposureUsd,
    memeExposureUsd,
  };
}
