import { openStorage } from "../storage/client.js";
import type { BookFeatures } from "../strategy21/prediction/bookFeatures.js";
import type { ForecastRecord, PredictionHorizon } from "../strategy21/prediction/forecast.js";

const SQL = `CREATE TABLE IF NOT EXISTS prediction_shadow_forecasts (
  id TEXT PRIMARY KEY, pair TEXT NOT NULL, horizon TEXT NOT NULL, as_of INTEGER NOT NULL,
  due_at INTEGER NOT NULL, base_price REAL, forecast_json TEXT NOT NULL,
  outcome_status TEXT NOT NULL DEFAULT 'pending', evaluated_at INTEGER, outcome_return_pct REAL, evaluation_lag_ms INTEGER
);
CREATE INDEX IF NOT EXISTS prediction_shadow_due ON prediction_shadow_forecasts(pair,outcome_status,due_at);`;
const DURATION: Record<PredictionHorizon, number> = { "1H": 3600_000, "4H": 4 * 3600_000, "1D": 24 * 3600_000, "3D": 72 * 3600_000, "7D": 168 * 3600_000 };

export interface StoredShadowForecast extends ForecastRecord {
  dueAt: string;
  outcomeStatus: "pending" | "evaluated" | "missing_window";
  evaluatedAt: string | null;
  outcomeReturnPct: number | null;
  evaluationLagMs: number | null;
}

export function saveShadowForecasts(path: string, forecasts: ForecastRecord[], basePrice?: number): void {
  const storage = openStorage({ path });
  try {
    storage.sqlite.exec(SQL);
    const insert = storage.sqlite.prepare(`INSERT OR IGNORE INTO prediction_shadow_forecasts
      (id,pair,horizon,as_of,due_at,base_price,forecast_json) VALUES(?,?,?,?,?,?,?)`);
    for (const forecast of forecasts) {
      const at = Date.parse(forecast.asOf);
      if (!Number.isFinite(at)) continue;
      insert.run(forecast.forecastId, forecast.pair, forecast.horizon, at, at + DURATION[forecast.horizon], basePrice ?? null, JSON.stringify(forecast));
    }
  } finally { storage.close(); }
}

export function settleShadowForecasts(path: string, feature: BookFeatures): void {
  const at = Date.parse(feature.receivedAt ?? feature.observedAt);
  if (!Number.isFinite(at) || !(feature.midpoint > 0)) return;
  const storage = openStorage({ path });
  try {
    storage.sqlite.exec(SQL);
    const pending = storage.sqlite.prepare(`SELECT id,due_at,base_price FROM prediction_shadow_forecasts
      WHERE pair=? AND outcome_status='pending' AND due_at<=?`).all(feature.pair, at) as Array<{ id: string; due_at: number; base_price: number | null }>;
    const update = storage.sqlite.prepare(`UPDATE prediction_shadow_forecasts SET outcome_status=?,evaluated_at=?,outcome_return_pct=?,evaluation_lag_ms=? WHERE id=?`);
    for (const row of pending) {
      const lag = at - row.due_at;
      const valid = lag <= 5 * 60_000 && row.base_price != null && row.base_price > 0;
      update.run(valid ? "evaluated" : "missing_window", at, valid ? (feature.midpoint / row.base_price! - 1) * 100 : null, lag, row.id);
    }
    storage.sqlite.prepare("DELETE FROM prediction_shadow_forecasts WHERE as_of < ?").run(at - 30 * 24 * 3600_000);
  } finally { storage.close(); }
}

export function readShadowForecasts(path: string, pair: string, limit = 100): StoredShadowForecast[] {
  const storage = openStorage({ path });
  try {
    storage.sqlite.exec(SQL);
    const rows = storage.sqlite.prepare(`SELECT * FROM prediction_shadow_forecasts
      WHERE pair=? ORDER BY as_of DESC LIMIT ?`).all(pair, Math.max(1, Math.min(1000, limit))) as Array<Record<string, unknown>>;
    return rows.map((row) => ({
      ...JSON.parse(String(row.forecast_json)) as ForecastRecord,
      dueAt: new Date(Number(row.due_at)).toISOString(),
      outcomeStatus: String(row.outcome_status) as StoredShadowForecast["outcomeStatus"],
      evaluatedAt: row.evaluated_at == null ? null : new Date(Number(row.evaluated_at)).toISOString(),
      outcomeReturnPct: row.outcome_return_pct == null ? null : Number(row.outcome_return_pct),
      evaluationLagMs: row.evaluation_lag_ms == null ? null : Number(row.evaluation_lag_ms),
    }));
  } finally { storage.close(); }
}
