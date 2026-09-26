import { openStorage } from "../storage/client.js";
import type { BookFeatures } from "../strategy21/prediction/bookFeatures.js";

const SQL = `CREATE TABLE IF NOT EXISTS prediction_book_features (
  pair TEXT NOT NULL, sample_minute INTEGER NOT NULL, observed_at INTEGER NOT NULL,
  payload_json TEXT NOT NULL, PRIMARY KEY(pair, sample_minute)
);
CREATE INDEX IF NOT EXISTS prediction_book_time ON prediction_book_features(pair, observed_at);`;

export function appendBookFeatures(path: string, feature: BookFeatures): void {
  const at = Date.parse(feature.observedAt);
  if (!Number.isFinite(at) || !Number.isFinite(feature.midpoint) || feature.midpoint <= 0) return;
  const storage = openStorage({ path });
  try {
    storage.sqlite.exec(SQL);
    storage.sqlite.prepare(`INSERT INTO prediction_book_features(pair,sample_minute,observed_at,payload_json)
      VALUES(?,?,?,?) ON CONFLICT(pair,sample_minute) DO NOTHING`).run(feature.pair, Math.floor(at / 60_000), at, JSON.stringify(feature));
    storage.sqlite.prepare("DELETE FROM prediction_book_features WHERE observed_at < ?").run(at - 16 * 24 * 60 * 60_000);
  } finally { storage.close(); }
}

export function readBookFeatures(path: string, pair: string, asOf: string, limit = 512): BookFeatures[] {
  const at = Date.parse(asOf);
  if (!Number.isFinite(at)) return [];
  const storage = openStorage({ path });
  try {
    storage.sqlite.exec(SQL);
    const rows = storage.sqlite.prepare(`SELECT payload_json FROM prediction_book_features
      WHERE pair=? AND observed_at<=? ORDER BY observed_at DESC LIMIT ?`).all(pair, at, Math.max(1, Math.min(5000, limit))) as Array<{ payload_json: string }>;
    return rows.map((row) => JSON.parse(row.payload_json) as BookFeatures).reverse();
  } finally { storage.close(); }
}
