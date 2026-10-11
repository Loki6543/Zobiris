export type IntegrityStatus = "PASS" | "WATCH" | "FAIL" | "UNKNOWN";

export interface StatisticalMetric {
  status: IntegrityStatus;
  value: number | null;
  sampleCount: number;
  threshold: string;
  reasons: string[];
}

export interface DsrSummaryInput {
  observedSharpe: number;
  skew: number;
  kurtosis: number;
  nObservations: number;
  trialSharpes: number[];
  effectiveTrialCount?: number | null;
}

export interface DsrDiagnostics {
  dsr: number;
  observedSharpe: number;
  deflatedBenchmarkSharpe: number;
  expectedMaxZ: number;
  varianceSharpe: number;
  nTrials: number;
  nObservations: number;
  skew: number;
  kurtosis: number;
}

export interface PboMatrixRow {
  splitId: string;
  candidateId: string;
  role: "IN_SAMPLE" | "OUT_OF_SAMPLE";
  value: number;
}

export interface PboDiagnostics {
  pbo: number;
  logits: number[];
  validSplits: number;
  droppedSplits: number;
}

export interface CpcvDiagnostics {
  positivePathRate: number | null;
  medianPathMetric: number | null;
  pathCount: number;
}

const SQRT_2 = Math.sqrt(2);
const EULER_GAMMA = 0.5772156649015329;

function erf(x: number): number {
  // Abramowitz-Stegun 7.1.26. More than adequate for research-gate probabilities.
  const sign = x < 0 ? -1 : 1;
  const ax = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * ax);
  const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-ax * ax);
  return sign * y;
}

export function normalCdf(z: number): number {
  if (z === Infinity) return 1;
  if (z === -Infinity) return 0;
  if (!Number.isFinite(z)) return Number.NaN;
  return 0.5 * (1 + erf(z / SQRT_2));
}

/** Peter J. Acklam's inverse-normal approximation. */
export function inverseNormalCdf(p: number): number {
  if (!(p > 0 && p < 1)) {
    if (p === 0) return -Infinity;
    if (p === 1) return Infinity;
    return Number.NaN;
  }
  const a = [-39.6968302866538, 220.946098424521, -275.928510446969, 138.357751867269, -30.6647980661472, 2.50662827745924];
  const b = [-54.4760987982241, 161.585836858041, -155.698979859887, 66.8013118877197, -13.2806815528857];
  const c = [-0.00778489400243029, -0.322396458041136, -2.40075827716184, -2.54973253934373, 4.37466414146497, 2.93816398269878];
  const d = [0.00778469570904146, 0.32246712907004, 2.445134137143, 3.75440866190742];
  const plow = 0.02425;
  const phigh = 1 - plow;
  if (p < plow) {
    const q = Math.sqrt(-2 * Math.log(p));
    return (((((c[0]! * q + c[1]!) * q + c[2]!) * q + c[3]!) * q + c[4]!) * q + c[5]!) /
      ((((d[0]! * q + d[1]!) * q + d[2]!) * q + d[3]!) * q + 1);
  }
  if (p > phigh) {
    const q = Math.sqrt(-2 * Math.log(1 - p));
    return -(((((c[0]! * q + c[1]!) * q + c[2]!) * q + c[3]!) * q + c[4]!) * q + c[5]!) /
      ((((d[0]! * q + d[1]!) * q + d[2]!) * q + d[3]!) * q + 1);
  }
  const q = p - 0.5;
  const r = q * q;
  return (((((a[0]! * r + a[1]!) * r + a[2]!) * r + a[3]!) * r + a[4]!) * r + a[5]!) * q /
    (((((b[0]! * r + b[1]!) * r + b[2]!) * r + b[3]!) * r + b[4]!) * r + 1);
}

export function bonferroniCriticalZ(nCells: number, alpha = 0.05): number {
  if (!Number.isInteger(nCells) || nCells < 1 || !(alpha > 0 && alpha < 1)) return Infinity;
  return inverseNormalCdf(1 - alpha / (2 * nCells));
}

function sampleVariance(values: number[]): number {
  if (values.length <= 1) return 0;
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  return values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (values.length - 1);
}

function expectedMaxZ(nTrials: number): number {
  if (nTrials <= 1) return 0;
  return (1 - EULER_GAMMA) * inverseNormalCdf(1 - 1 / nTrials)
    + EULER_GAMMA * inverseNormalCdf(1 - 1 / (nTrials * Math.E));
}

export function deflatedSharpeFromSummary(input: DsrSummaryInput): DsrDiagnostics | null {
  const sharpes = input.trialSharpes.filter(Number.isFinite);
  if (
    !Number.isFinite(input.observedSharpe)
    || !Number.isFinite(input.skew)
    || !Number.isFinite(input.kurtosis)
    || !Number.isInteger(input.nObservations)
    || input.nObservations < 2
    || sharpes.length < 1
    // The Bailey/Lopez-de-Prado PSR denominator uses ordinary (non-excess)
    // kurtosis. A value below 1 is a strong signal that the stored statistic is
    // in a different convention, so fail closed rather than silently relabel it.
    || input.kurtosis < 1
  ) return null;

  const effective = input.effectiveTrialCount == null ? sharpes.length : input.effectiveTrialCount;
  if (!Number.isFinite(effective) || effective < 1) return null;
  const nTrials = Math.max(1, Math.ceil(effective));
  const varianceSharpe = sampleVariance(sharpes);
  const maxZ = expectedMaxZ(nTrials);
  const srStar = Math.sqrt(varianceSharpe) * maxZ;
  const denominatorSq = 1
    - input.skew * input.observedSharpe
    + ((input.kurtosis - 1) / 4) * input.observedSharpe ** 2;
  if (!Number.isFinite(denominatorSq) || denominatorSq <= 0) return null;
  const z = (input.observedSharpe - srStar) * Math.sqrt(input.nObservations - 1) / Math.sqrt(denominatorSq);
  const dsr = normalCdf(z);
  if (!Number.isFinite(dsr)) return null;
  return {
    dsr,
    observedSharpe: input.observedSharpe,
    deflatedBenchmarkSharpe: srStar,
    expectedMaxZ: maxZ,
    varianceSharpe,
    nTrials,
    nObservations: input.nObservations,
    skew: input.skew,
    kurtosis: input.kurtosis,
  };
}

function averageRankAscending(values: Array<{ candidateId: string; value: number }>, targetId: string): number | null {
  const sorted = [...values].sort((a, b) => a.value - b.value || a.candidateId.localeCompare(b.candidateId));
  const target = sorted.find((item) => item.candidateId === targetId);
  if (!target) return null;
  const same = sorted.map((item, index) => ({ ...item, rank: index + 1 })).filter((item) => item.value === target.value);
  return same.reduce((sum, item) => sum + item.rank, 0) / same.length;
}

/**
 * Compute PBO from already-materialized CSCV split results.
 *
 * Every split must contain paired IN_SAMPLE/OUT_OF_SAMPLE values for at least
 * two candidates. The in-sample winner is ranked out of sample; PBO is the
 * fraction of valid splits where its relative OOS rank falls below the median.
 */
export function pboFromSplitMatrix(rows: PboMatrixRow[], expectedCandidateCount?: number): PboDiagnostics | null {
  const bySplit = new Map<string, PboMatrixRow[]>();
  for (const row of rows) {
    if (!row.splitId || !row.candidateId || !Number.isFinite(row.value)) continue;
    const current = bySplit.get(row.splitId) ?? [];
    current.push(row);
    bySplit.set(row.splitId, current);
  }
  const logits: number[] = [];
  let droppedSplits = 0;
  for (const splitRows of bySplit.values()) {
    const isMap = new Map(splitRows.filter((row) => row.role === "IN_SAMPLE").map((row) => [row.candidateId, row.value]));
    const oosMap = new Map(splitRows.filter((row) => row.role === "OUT_OF_SAMPLE").map((row) => [row.candidateId, row.value]));
    const candidates = [...isMap.keys()].filter((candidateId) => oosMap.has(candidateId));
    if (candidates.length < 2 || (expectedCandidateCount != null && candidates.length !== expectedCandidateCount)) { droppedSplits += 1; continue; }
    let bestId = candidates[0]!;
    for (const candidateId of candidates.slice(1)) {
      const current = isMap.get(candidateId)!;
      const best = isMap.get(bestId)!;
      if (current > best || (current === best && candidateId < bestId)) bestId = candidateId;
    }
    const oos = candidates.map((candidateId) => ({ candidateId, value: oosMap.get(candidateId)! }));
    const rank = averageRankAscending(oos, bestId);
    if (rank == null) { droppedSplits += 1; continue; }
    const omega = rank / (candidates.length + 1);
    if (!(omega > 0 && omega < 1)) { droppedSplits += 1; continue; }
    logits.push(Math.log(omega / (1 - omega)));
  }
  if (!logits.length) return null;
  return {
    pbo: logits.filter((value) => value <= 0).length / logits.length,
    logits,
    validSplits: logits.length,
    droppedSplits,
  };
}

export function cpcvDiagnostics(pathMetrics: number[]): CpcvDiagnostics {
  const finite = pathMetrics.filter(Number.isFinite).sort((a, b) => a - b);
  if (!finite.length) return { positivePathRate: null, medianPathMetric: null, pathCount: 0 };
  const middle = Math.floor(finite.length / 2);
  const medianPathMetric = finite.length % 2
    ? finite[middle]!
    : (finite[middle - 1]! + finite[middle]!) / 2;
  return {
    positivePathRate: finite.filter((value) => value > 0).length / finite.length,
    medianPathMetric,
    pathCount: finite.length,
  };
}
