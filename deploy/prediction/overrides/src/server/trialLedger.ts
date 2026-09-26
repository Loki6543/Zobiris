import { openStorage } from "../storage/client.js";

export interface StrategyTrial {
  id: string;
  modelVersion: string;
  features: string[];
  trainEnd: string;
  testStart: string;
  testEnd: string;
  status: "passed" | "failed" | "inconclusive";
  netReturnPct: number;
}
const SQL = `CREATE TABLE IF NOT EXISTS prediction_strategy_trials (
  id TEXT PRIMARY KEY, created_at INTEGER NOT NULL, payload_json TEXT NOT NULL
);`;
export function recordTrial(path: string, trial: StrategyTrial): void {
  if (!trial.id || !trial.modelVersion || !(Date.parse(trial.trainEnd) < Date.parse(trial.testStart)) ||
      !(Date.parse(trial.testStart) < Date.parse(trial.testEnd)) || !Number.isFinite(trial.netReturnPct)) throw new Error("invalid trial window or result");
  const storage = openStorage({ path });
  try {
    storage.sqlite.exec(SQL);
    storage.sqlite.prepare("INSERT INTO prediction_strategy_trials(id,created_at,payload_json) VALUES(?,?,?)")
      .run(trial.id, Date.now(), JSON.stringify(trial));
  } finally { storage.close(); }
}
export function readTrials(path: string, limit = 1000): StrategyTrial[] {
  const storage = openStorage({ path });
  try {
    storage.sqlite.exec(SQL);
    return (storage.sqlite.prepare("SELECT payload_json FROM prediction_strategy_trials ORDER BY created_at DESC LIMIT ?")
      .all(Math.max(1, Math.min(10000, limit))) as Array<{ payload_json: string }>).map((row) => JSON.parse(row.payload_json) as StrategyTrial);
  } finally { storage.close(); }
}
export interface TrialConfig {
  trainEnd: number;
  testStart: number;
  testEnd: number;
  feeBpsPerSide: number;
  spreadBps: number;
  impactBps: number;
}
export interface TimedObservation { observedAt: number; availableAt: number; returnPct: number }
export function evaluateWalkForward(config: TrialConfig, observations: TimedObservation[]): { count: number; netReturnPct: number; noTradeReturnPct: 0 } {
  if (!(config.trainEnd < config.testStart && config.testStart < config.testEnd) ||
      ![config.feeBpsPerSide, config.spreadBps, config.impactBps].every((value) => Number.isFinite(value) && value >= 0)) throw new Error("invalid chronological split or cost");
  const eligible = observations.filter((row) => row.observedAt >= config.testStart && row.observedAt <= config.testEnd);
  if (eligible.some((row) => row.availableAt > row.observedAt || !Number.isFinite(row.returnPct))) throw new Error("lookahead or invalid observation");
  const costPct = (2 * config.feeBpsPerSide + config.spreadBps + config.impactBps) / 100;
  return { count: eligible.length, netReturnPct: eligible.reduce((sum, row) => sum + row.returnPct - costPct, 0), noTradeReturnPct: 0 };
}
