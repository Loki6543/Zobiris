import { randomUUID } from 'node:crypto';
import { openStorage } from '../storage/client.js';
import { buildLiquidityProfile, type OrderBookSnapshot } from './engine/liquidity.js';
import type { PreviousMarketState } from './engine/marketState.js';
import type { StrategyLiquidityInput } from './integration.js';
import { INTELLIGENCE_SHADOW_SQL, buildShadowDecisionRecord, serializeAuditPayload, type ShadowDecisionRecordInput } from './intelligence/shadowStore.js';
import { createAttentionLedgerRepository, type AttentionLedgerDb, type AttentionLedgerRepository } from './attentionLedger/index.js';

const STRATEGY_SQL = `
CREATE TABLE IF NOT EXISTS strategy21_book_snapshots (
  id TEXT PRIMARY KEY,
  symbol TEXT NOT NULL,
  pair TEXT NOT NULL,
  observed_at INTEGER NOT NULL,
  bids_json TEXT NOT NULL,
  asks_json TEXT NOT NULL,
  active_minute INTEGER NOT NULL DEFAULT 0,
  trade_notional_1m REAL NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS strategy21_book_symbol_time_idx ON strategy21_book_snapshots(symbol, observed_at);
CREATE TABLE IF NOT EXISTS strategy21_daily_notional (
  symbol TEXT NOT NULL,
  day TEXT NOT NULL,
  notional_usd REAL NOT NULL,
  observed_at INTEGER NOT NULL,
  PRIMARY KEY(symbol, day)
);
CREATE TABLE IF NOT EXISTS strategy21_daily_activity (
  symbol TEXT NOT NULL,
  day TEXT NOT NULL,
  trade_count_24h INTEGER NOT NULL,
  observed_at INTEGER NOT NULL,
  PRIMARY KEY(symbol, day)
);
CREATE TABLE IF NOT EXISTS strategy21_market_state (
  id TEXT PRIMARY KEY CHECK(id='current'),
  state TEXT NOT NULL,
  entered_at TEXT NOT NULL,
  minimum_dwell_until TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS strategy21_collector_state (
  id TEXT PRIMARY KEY CHECK(id='current'),
  rotation_cursor INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL
);
${INTELLIGENCE_SHADOW_SQL}
`;

export function ensureStrategy21Storage(dbPath?: string): void {
  const storage = openStorage({ path: dbPath });
  try { storage.sqlite.exec(STRATEGY_SQL); } finally { storage.close(); }
}

export function saveStrategyBookSnapshot(dbPath: string | undefined, symbol: string, snapshot: OrderBookSnapshot, dailyNotionalUsd: number, tradeCount24h?: number): void {
  const storage = openStorage({ path: dbPath });
  try {
    storage.sqlite.exec(STRATEGY_SQL);
    storage.sqlite.prepare(`INSERT INTO strategy21_book_snapshots
      (id,symbol,pair,observed_at,bids_json,asks_json,active_minute,trade_notional_1m)
      VALUES (?,?,?,?,?,?,?,?)`).run(
      randomUUID(), symbol.toUpperCase(), snapshot.pair, Date.parse(snapshot.observedAt), JSON.stringify(snapshot.bids), JSON.stringify(snapshot.asks), snapshot.activeMinute ? 1 : 0, snapshot.tradeNotional1m,
    );
    const day = snapshot.observedAt.slice(0,10);
    storage.sqlite.prepare(`INSERT INTO strategy21_daily_notional(symbol,day,notional_usd,observed_at)
      VALUES (?,?,?,?) ON CONFLICT(symbol,day) DO UPDATE SET notional_usd=excluded.notional_usd, observed_at=excluded.observed_at`).run(
      symbol.toUpperCase(), day, dailyNotionalUsd, Date.parse(snapshot.observedAt),
    );
    if (Number.isFinite(tradeCount24h)) {
      storage.sqlite.prepare(`INSERT INTO strategy21_daily_activity(symbol,day,trade_count_24h,observed_at)
        VALUES (?,?,?,?) ON CONFLICT(symbol,day) DO UPDATE SET trade_count_24h=excluded.trade_count_24h, observed_at=excluded.observed_at`).run(
        symbol.toUpperCase(), day, Math.max(0, Math.trunc(tradeCount24h ?? 0)), Date.parse(snapshot.observedAt),
      );
    }
    const cutoff = Date.now() - 16*24*60*60*1000;
    storage.sqlite.prepare('DELETE FROM strategy21_book_snapshots WHERE observed_at < ?').run(cutoff);
  } finally { storage.close(); }
}

export function loadStrategyLiquidity(dbPath: string | undefined, symbols: string[]): Map<string, StrategyLiquidityInput> {
  const storage = openStorage({ path: dbPath });
  const out = new Map<string, StrategyLiquidityInput>();
  try {
    storage.sqlite.exec(STRATEGY_SQL);
    return storage.sqlite.transaction(() => {
    const cutoff = Date.now() - 15*24*60*60*1000;
    // Raw JSON expands substantially into JS objects, then profiles retain books
    // for every symbol. Bound the whole refresh before materializing any rows.
    // Do not sample/truncate and then present partial history as certification.
    const perSymbolBytes = 64 * 1024 * 1024;
    const totalBytes = 64 * 1024 * 1024;
    let retainedBytes = 0;
    const budgetStmt = storage.sqlite.prepare(`SELECT count(*) AS rows,
      COALESCE(sum(length(CAST(bids_json AS BLOB)) + length(CAST(asks_json AS BLOB))),0) AS bytes
      FROM strategy21_book_snapshots WHERE symbol=? AND observed_at>=?`);
    const bookStmt = storage.sqlite.prepare(`SELECT * FROM strategy21_book_snapshots WHERE symbol=? AND observed_at>=? ORDER BY observed_at ASC`);
    const notionalStmt = storage.sqlite.prepare(`SELECT day,notional_usd FROM strategy21_daily_notional WHERE symbol=? ORDER BY day DESC LIMIT 14`);
    const activityStmt = storage.sqlite.prepare(`SELECT day,trade_count_24h,observed_at FROM strategy21_daily_activity WHERE symbol=? ORDER BY day DESC LIMIT 15`);
    for (const rawSymbol of new Set(symbols.map(s => s.toUpperCase()))) {
      const symbol = rawSymbol.toUpperCase();
      const budget = budgetStmt.get(symbol, cutoff) as { rows: number; bytes: number };
      if (budget.rows > 12000 || budget.bytes > perSymbolBytes || retainedBytes + budget.bytes > totalBytes) {
        console.warn('LIQUIDITY_HISTORY_BUDGET_EXCEEDED: evidence retained on disk; asset remains WATCH_ONLY', { symbol, rows: budget.rows, bytes: budget.bytes });
        continue;
      }
      retainedBytes += budget.bytes;
      const rows = bookStmt.all(symbol, cutoff) as Array<Record<string, unknown>>;
      if (!rows.length) continue;
      const snapshots: OrderBookSnapshot[] = rows.map((r) => ({
        pair: String(r.pair), observedAt: new Date(Number(r.observed_at)).toISOString(),
        bids: JSON.parse(String(r.bids_json)), asks: JSON.parse(String(r.asks_json)),
        activeMinute: Number(r.active_minute) === 1, tradeNotional1m: Number(r.trade_notional_1m),
      }));
      const daily = (notionalStmt.all(symbol) as Array<{notional_usd:number}>).map((r) => Number(r.notional_usd)).reverse();
      const activity = activityStmt.all(symbol) as Array<{day:string;trade_count_24h:number;observed_at:number}>;
      const latestActivity = activity[0];
      const priorCompletedDayTradeCounts24h = activity.slice(1).map((r) => Number(r.trade_count_24h)).filter(Number.isFinite).reverse();
      const pair = snapshots.at(-1)!.pair;
      out.set(symbol, {
        pair,
        profile: buildLiquidityProfile({ snapshots, dailyCredibleNotionalUsd: daily }),
        takerFeeBpsPerSide: Number(process.env.ZOBIRIS_KRAKEN_FEE_BPS ?? '80'),
        currentTradeCount24h: latestActivity ? Number(latestActivity.trade_count_24h) : undefined,
        priorCompletedDayTradeCounts24h,
      });
    }
    return out;
    })();
  } finally { storage.close(); }
}

export function saveStrategyMarketState(dbPath: string | undefined, state: PreviousMarketState): void {
  const storage = openStorage({ path: dbPath });
  try {
    storage.sqlite.exec(STRATEGY_SQL);
    storage.sqlite.prepare(`INSERT INTO strategy21_market_state(id,state,entered_at,minimum_dwell_until,updated_at)
      VALUES ('current',?,?,?,?) ON CONFLICT(id) DO UPDATE SET state=excluded.state,entered_at=excluded.entered_at,minimum_dwell_until=excluded.minimum_dwell_until,updated_at=excluded.updated_at`)
      .run(state.state, state.enteredAt, state.minimumDwellUntil, Date.now());
  } finally { storage.close(); }
}

export function loadStrategyMarketState(dbPath?: string): PreviousMarketState | undefined {
  const storage = openStorage({ path: dbPath });
  try {
    storage.sqlite.exec(STRATEGY_SQL);
    const row = storage.sqlite.prepare('SELECT state,entered_at,minimum_dwell_until FROM strategy21_market_state WHERE id=\'current\'').get() as {state:string;entered_at:string;minimum_dwell_until:string}|undefined;
    if (!row) return undefined;
    return { state: row.state as PreviousMarketState['state'], enteredAt: row.entered_at, minimumDwellUntil: row.minimum_dwell_until };
  } finally { storage.close(); }
}

export function readCollectorCursor(dbPath?: string): number {
  const storage = openStorage({ path: dbPath });
  try {
    storage.sqlite.exec(STRATEGY_SQL);
    const row = storage.sqlite.prepare("SELECT rotation_cursor FROM strategy21_collector_state WHERE id='current'").get() as {rotation_cursor:number}|undefined;
    return Number(row?.rotation_cursor ?? 0);
  } finally { storage.close(); }
}

export function writeCollectorCursor(dbPath: string | undefined, cursor: number): void {
  const storage = openStorage({ path: dbPath });
  try {
    storage.sqlite.exec(STRATEGY_SQL);
    storage.sqlite.prepare(`INSERT INTO strategy21_collector_state(id,rotation_cursor,updated_at) VALUES('current',?,?)
      ON CONFLICT(id) DO UPDATE SET rotation_cursor=excluded.rotation_cursor,updated_at=excluded.updated_at`).run(cursor, Date.now());
  } finally { storage.close(); }
}


export interface IntelligenceObservationRecordInput {
  observedAt: string;
  source: string;
  kind: string;
  payload: unknown;
}

export function saveIntelligenceObservation(dbPath:string|undefined,input:IntelligenceObservationRecordInput):string {
  const storage=openStorage({path:dbPath});
  const id=randomUUID();
  try {
    storage.sqlite.exec(STRATEGY_SQL);
    storage.sqlite.prepare(`INSERT INTO intelligence_observations(id,observed_at,source,kind,payload_json,created_at) VALUES(?,?,?,?,?,?)`)
      .run(id,Date.parse(input.observedAt),input.source,input.kind,serializeAuditPayload(input.payload),Date.now());
    return id;
  } finally { storage.close(); }
}

export function saveIntelligenceForecast(dbPath:string|undefined,forecast:{id?:string;workerId:string;source:string;target:string;asOf:string;horizonEnd:string;modelVersion:string;payload:unknown}):string {
  const storage=openStorage({path:dbPath});
  const id=forecast.id ?? randomUUID();
  try {
    storage.sqlite.exec(STRATEGY_SQL);
    storage.sqlite.prepare(`INSERT INTO intelligence_forecasts(id,worker_id,source,target,as_of,horizon_end,model_version,payload_json,created_at) VALUES(?,?,?,?,?,?,?,?,?)`)
      .run(id,forecast.workerId,forecast.source,forecast.target,Date.parse(forecast.asOf),Date.parse(forecast.horizonEnd),forecast.modelVersion,serializeAuditPayload(forecast.payload),Date.now());
    return id;
  } finally { storage.close(); }
}

export function saveIntelligenceOutcome(dbPath:string|undefined,input:{forecastId:string;resolvedAt:string;payload:unknown}):string {
  const storage=openStorage({path:dbPath}); const id=randomUUID();
  try {
    storage.sqlite.exec(STRATEGY_SQL);
    storage.sqlite.prepare(`INSERT INTO intelligence_outcomes(id,forecast_id,resolved_at,payload_json,created_at) VALUES(?,?,?,?,?)`)
      .run(id,input.forecastId,Date.parse(input.resolvedAt),serializeAuditPayload(input.payload),Date.now());
    return id;
  } finally { storage.close(); }
}

export function saveWorkerPerformanceWindow(dbPath:string|undefined,input:{workerId:string;target:string;windowEnd:string;sampleCount:number;payload:unknown}):string {
  const storage=openStorage({path:dbPath}); const id=randomUUID();
  try {
    storage.sqlite.exec(STRATEGY_SQL);
    storage.sqlite.prepare(`INSERT INTO worker_performance_windows(id,worker_id,target,window_end,sample_count,payload_json,created_at) VALUES(?,?,?,?,?,?,?)`)
      .run(id,input.workerId,input.target,Date.parse(input.windowEnd),Math.max(0,Math.trunc(input.sampleCount)),serializeAuditPayload(input.payload),Date.now());
    return id;
  } finally { storage.close(); }
}

export function saveShadowDecision(dbPath:string|undefined,input:ShadowDecisionRecordInput):string {
  const record=buildShadowDecisionRecord(input);
  const storage=openStorage({path:dbPath});
  try {
    storage.sqlite.exec(STRATEGY_SQL);
    storage.sqlite.prepare(`INSERT INTO shadow_decisions(id,as_of,authority,policy_version,model_version,production_action,shadow_action,difference_reason,payload_json,created_at) VALUES(?,?,?,?,?,?,?,?,?,?)`)
      .run(record.id,Date.parse(record.asOf),record.authority,record.policyVersion,record.modelVersion,record.productionAction,record.shadowAction,record.differenceReason,record.payloadJson,Date.now());
    return record.id;
  } finally { storage.close(); }
}

export function saveAlloraObservation(dbPath:string|undefined,input:{topicId?:number;target:string;sourceTimestamp:string;receivedAt:string;payload:unknown}):string {
  const storage=openStorage({path:dbPath}); const id=randomUUID();
  try {
    storage.sqlite.exec(STRATEGY_SQL);
    storage.sqlite.prepare(`INSERT INTO allora_observations(id,topic_id,target,source_timestamp,received_at,payload_json,created_at) VALUES(?,?,?,?,?,?,?)`)
      .run(id,input.topicId ?? null,input.target,Date.parse(input.sourceTimestamp),Date.parse(input.receivedAt),serializeAuditPayload(input.payload),Date.now());
    return id;
  } finally { storage.close(); }
}


export function withAttentionLedger<T>(
  dbPath: string | undefined,
  fn: (repo: AttentionLedgerRepository) => T,
): T {
  const storage = openStorage({ path: dbPath });
  try {
    const repo = createAttentionLedgerRepository(storage.sqlite as unknown as AttentionLedgerDb);
    return fn(repo);
  } finally {
    storage.close();
  }
}
