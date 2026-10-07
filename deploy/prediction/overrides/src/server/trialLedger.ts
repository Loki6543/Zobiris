import { openStorage } from "../storage/client.js";

export const TIER1_ROUND_TRIP_BPS = {
  MAKER_MAKER: 80,
  MAKER_TAKER: 120,
  TAKER_TAKER: 160,
} as const;

export type FeePath = keyof typeof TIER1_ROUND_TRIP_BPS;
export const VALIDATION_FEE_PATH: FeePath = "MAKER_TAKER";
export const VALIDATION_ROUND_TRIP_BPS = TIER1_ROUND_TRIP_BPS[VALIDATION_FEE_PATH];

export type TrialStatus = "passed" | "failed" | "inconclusive" | "invalid";
export type InvalidReason =
  | "chain_broken"
  | "data_snapshot_moved"
  | "registry_version_changed"
  | "required_criterion_skipped"
  | "family_size_unknown";

export interface TrialCell {
  featureSetId: string;
  horizon: string;
  regime: string;
}

export interface StrategyTrialInput {
  id: string;
  modelVersion: string;
  features: string[];
  trainEnd: string;
  testStart: string;
  testEnd: string;
  status: TrialStatus;
  invalidReason?: InvalidReason;
  /** Net percentage points AFTER the declared execution-cost path. */
  netReturnPct: number;
  feePath?: FeePath;
  /** Family-wise test statistic used by the multiple-testing gate. */
  zScore?: number;
  alpha?: number;
  /** Explicit evaluated cells. The stored family size is derived from these. */
  testedCells?: TrialCell[];
}

export interface StrategyTrial extends StrategyTrialInput {
  nCellsEvaluated: number;
  bonferroniCriticalZ: number | null;
}

function cellKey(cell: TrialCell): string {
  return `${cell.featureSetId.trim()}\u0000${cell.horizon.trim()}\u0000${cell.regime.trim()}`;
}

export function deriveCellsEvaluated(cells: TrialCell[] | undefined): number {
  if (!Array.isArray(cells)) return 0;
  const keys = new Set<string>();
  for (const cell of cells) {
    if (!cell || !cell.featureSetId?.trim() || !cell.horizon?.trim() || !cell.regime?.trim()) continue;
    keys.add(cellKey(cell));
  }
  return keys.size;
}

/** Peter J. Acklam inverse-normal approximation. */
function inverseNormalCdf(p: number): number {
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

export function requiredZ(nCells: number, alpha = 0.05): number {
  if (!Number.isInteger(nCells) || nCells < 1 || !(alpha > 0 && alpha < 1)) return Infinity;
  return inverseNormalCdf(1 - alpha / (2 * nCells));
}

export function bpsToPct(bps: number): number {
  if (!Number.isFinite(bps)) return Number.NaN;
  return bps / 100;
}

export function feePathMeetsValidation(path: FeePath | undefined): boolean {
  return path != null && TIER1_ROUND_TRIP_BPS[path] >= VALIDATION_ROUND_TRIP_BPS;
}

export function mayPass(trial: StrategyTrialInput): { ok: boolean; reasons: string[]; nCellsEvaluated: number; criticalZ: number } {
  const reasons: string[] = [];
  const nCellsEvaluated = deriveCellsEvaluated(trial.testedCells);
  const alpha = trial.alpha ?? 0.05;
  const criticalZ = requiredZ(nCellsEvaluated, alpha);

  // netReturnPct is already net of execution cost. Charging 120 bps again here
  // would double-count the validation path and would also mix bps with pct units.
  if (!(trial.netReturnPct > 0)) reasons.push("net return after declared execution costs must be positive");
  if (!feePathMeetsValidation(trial.feePath)) reasons.push(`fee path must be ${VALIDATION_FEE_PATH} or stricter`);
  if (nCellsEvaluated < 1) reasons.push("family_size_unknown");
  if (!Number.isFinite(trial.zScore)) reasons.push("z_score_missing");
  else if (!(trial.zScore! > criticalZ)) reasons.push(`z ${trial.zScore} does not exceed Bonferroni critical z ${criticalZ.toFixed(3)} for ${nCellsEvaluated} cells`);
  return { ok: reasons.length === 0, reasons, nCellsEvaluated, criticalZ };
}

function validateTrial(trial: StrategyTrialInput): string[] {
  const problems: string[] = [];
  if (!trial.id) problems.push("missing id");
  if (!trial.modelVersion) problems.push("missing modelVersion");
  if (!Number.isFinite(trial.netReturnPct)) problems.push("non-finite result");
  if (!(Date.parse(trial.trainEnd) < Date.parse(trial.testStart))) problems.push("trainEnd must precede testStart");
  if (!(Date.parse(trial.testStart) < Date.parse(trial.testEnd))) problems.push("testStart must precede testEnd");
  if (trial.status === "invalid" && !trial.invalidReason) problems.push("invalid trial must carry invalidReason");
  if (trial.status !== "invalid" && trial.invalidReason) problems.push("invalidReason is only valid on an invalid trial");
  if (trial.status === "passed") {
    const gate = mayPass(trial);
    problems.push(...gate.reasons.map((reason) => `passed trial gate: ${reason}`));
  }
  return problems;
}

function normalizeTrial(trial: StrategyTrialInput | StrategyTrial): StrategyTrial {
  const nCellsEvaluated = deriveCellsEvaluated(trial.testedCells);
  const criticalZ = nCellsEvaluated > 0 ? requiredZ(nCellsEvaluated, trial.alpha ?? 0.05) : null;
  return { ...trial, nCellsEvaluated, bonferroniCriticalZ: criticalZ };
}

const SQL = `CREATE TABLE IF NOT EXISTS prediction_strategy_trials (
  id TEXT PRIMARY KEY, created_at INTEGER NOT NULL, payload_json TEXT NOT NULL
);`;

export function recordTrial(path: string, trial: StrategyTrialInput): void {
  const problems = validateTrial(trial);
  if (problems.length) throw new Error(`invalid trial: ${problems.join("; ")}`);
  const stored = normalizeTrial(trial);
  const storage = openStorage({ path });
  try {
    storage.sqlite.exec(SQL);
    storage.sqlite.prepare("INSERT INTO prediction_strategy_trials(id,created_at,payload_json) VALUES(?,?,?)")
      .run(stored.id, Date.now(), JSON.stringify(stored));
  } finally { storage.close(); }
}

export function readTrials(path: string, limit = 1000): StrategyTrial[] {
  const storage = openStorage({ path });
  try {
    storage.sqlite.exec(SQL);
    return (storage.sqlite.prepare("SELECT payload_json FROM prediction_strategy_trials ORDER BY created_at DESC LIMIT ?")
      .all(Math.max(1, Math.min(10000, limit))) as Array<{ payload_json: string }>).map((row) => normalizeTrial(JSON.parse(row.payload_json) as StrategyTrialInput));
  } finally { storage.close(); }
}

export interface TrialConfig {
  trainEnd: number;
  testStart: number;
  testEnd: number;
  /** Legacy symmetric per-side fee. Mutually exclusive with feePath. */
  feeBpsPerSide?: number;
  /** Exact Tier-1 round-trip path. Prefer MAKER_TAKER for validation. */
  feePath?: FeePath;
  /** Additional round-trip spread assumption in basis points. */
  spreadBps: number;
  /** Additional round-trip market-impact assumption in basis points. */
  impactBps: number;
}

export interface TimedObservation { observedAt: number; availableAt: number; returnPct: number }

export interface WalkForwardResult {
  count: number;
  grossReturnPct: number;
  netReturnPct: number;
  noTradeReturnPct: 0;
  roundTripCostBpsPerObservation: number;
  feePath: FeePath | "LEGACY_SYMMETRIC";
}

export function evaluateWalkForward(config: TrialConfig, observations: TimedObservation[]): WalkForwardResult {
  if (!(config.trainEnd < config.testStart && config.testStart < config.testEnd)
      || ![config.spreadBps, config.impactBps].every((value) => Number.isFinite(value) && value >= 0)) {
    throw new Error("invalid chronological split or cost");
  }
  if (config.feePath != null && config.feeBpsPerSide != null) throw new Error("feePath and feeBpsPerSide are mutually exclusive");
  if (config.feePath == null && !(Number.isFinite(config.feeBpsPerSide) && (config.feeBpsPerSide ?? -1) >= 0)) {
    throw new Error("feePath or non-negative feeBpsPerSide is required");
  }
  const eligible = observations.filter((row) => row.observedAt >= config.testStart && row.observedAt <= config.testEnd);
  if (eligible.some((row) => row.availableAt > row.observedAt || !Number.isFinite(row.returnPct))) throw new Error("lookahead or invalid observation");
  const feeRoundTripBps = config.feePath != null
    ? TIER1_ROUND_TRIP_BPS[config.feePath]
    : 2 * (config.feeBpsPerSide ?? 0);
  const roundTripCostBps = feeRoundTripBps + config.spreadBps + config.impactBps;
  const costPct = bpsToPct(roundTripCostBps);
  const grossReturnPct = eligible.reduce((sum, row) => sum + row.returnPct, 0);
  return {
    count: eligible.length,
    grossReturnPct,
    netReturnPct: eligible.reduce((sum, row) => sum + row.returnPct - costPct, 0),
    noTradeReturnPct: 0,
    roundTripCostBpsPerObservation: roundTripCostBps,
    feePath: config.feePath ?? "LEGACY_SYMMETRIC",
  };
}
