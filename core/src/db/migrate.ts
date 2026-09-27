import type Database from "better-sqlite3";

const MIGRATIONS = [
  {
    id: 1,
    sql: `
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id INTEGER PRIMARY KEY,
        applied_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS app_metadata (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `,
  },
  {
    id: 2,
    sql: `
      CREATE TABLE IF NOT EXISTS assets (
        symbol TEXT PRIMARY KEY,
        asset_class TEXT NOT NULL,
        classification_reason TEXT,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS watchlist (
        symbol TEXT PRIMARY KEY REFERENCES assets(symbol) ON DELETE CASCADE,
        enabled INTEGER NOT NULL DEFAULT 1 CHECK(enabled IN (0,1)),
        added_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS kraken_instruments (
        symbol TEXT PRIMARY KEY REFERENCES assets(symbol) ON DELETE CASCADE,
        pair_key TEXT NOT NULL,
        altname TEXT,
        wsname TEXT,
        status TEXT NOT NULL,
        online INTEGER NOT NULL CHECK(online IN (0,1)),
        order_min REAL,
        cost_min_usd REAL,
        tick_size REAL,
        pair_decimals INTEGER,
        lot_decimals INTEGER,
        observed_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS book_samples (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        symbol TEXT NOT NULL REFERENCES assets(symbol) ON DELETE CASCADE,
        observed_at TEXT NOT NULL,
        midpoint REAL NOT NULL,
        spread_bps REAL NOT NULL,
        microprice REAL,
        queue_imbalance REAL,
        bid_depth_50_bps_usd REAL,
        ask_depth_50_bps_usd REAL,
        bid_depth_100_bps_usd REAL,
        ask_depth_100_bps_usd REAL,
        UNIQUE(symbol, observed_at)
      );

      CREATE TABLE IF NOT EXISTS execution_snapshots (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        symbol TEXT NOT NULL REFERENCES assets(symbol) ON DELETE CASCADE,
        observed_at TEXT NOT NULL,
        side TEXT NOT NULL CHECK(side IN ('buy','sell')),
        notional_usd REAL NOT NULL,
        complete INTEGER NOT NULL CHECK(complete IN (0,1)),
        impact_bps REAL,
        vwap REAL,
        worst_price REAL,
        personal_gate INTEGER NOT NULL DEFAULT 0 CHECK(personal_gate IN (0,1)),
        UNIQUE(symbol, observed_at, side, notional_usd)
      );

      CREATE TABLE IF NOT EXISTS strategy_episodes (
        episode_id TEXT PRIMARY KEY,
        symbol TEXT NOT NULL REFERENCES assets(symbol) ON DELETE CASCADE,
        strategy_tag TEXT NOT NULL,
        strategy_version TEXT NOT NULL,
        from_state TEXT,
        to_state TEXT NOT NULL,
        signal_at TEXT NOT NULL,
        signal_price REAL NOT NULL,
        btc_signal_price REAL,
        control_symbol TEXT,
        control_signal_price REAL,
        intended_limit REAL,
        recommended_size_usd REAL,
        status TEXT NOT NULL CHECK(status IN ('OPEN','CLOSED','INVALIDATED')),
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_strategy_episodes_symbol_signal
        ON strategy_episodes(symbol, signal_at);

      CREATE TABLE IF NOT EXISTS episode_outcomes (
        episode_id TEXT NOT NULL REFERENCES strategy_episodes(episode_id) ON DELETE CASCADE,
        horizon TEXT NOT NULL,
        due_at TEXT NOT NULL,
        evaluated_at TEXT,
        asset_price REAL,
        btc_price REAL,
        control_price REAL,
        return_pct REAL,
        excess_btc_pct REAL,
        excess_control_pct REAL,
        max_favorable_pct REAL,
        max_adverse_pct REAL,
        PRIMARY KEY(episode_id, horizon)
      );
    `,
  },
  {
    id: 3,
    sql: `
      CREATE TABLE IF NOT EXISTS market_candles (
        symbol TEXT NOT NULL REFERENCES assets(symbol) ON DELETE CASCADE,
        interval_minutes INTEGER NOT NULL,
        open_time TEXT NOT NULL,
        open REAL NOT NULL,
        high REAL NOT NULL,
        low REAL NOT NULL,
        close REAL NOT NULL,
        volume REAL,
        committed INTEGER NOT NULL DEFAULT 1 CHECK(committed IN (0,1)),
        PRIMARY KEY(symbol, interval_minutes, open_time)
      );

      CREATE INDEX IF NOT EXISTS idx_market_candles_lookup
        ON market_candles(symbol, interval_minutes, open_time);
    `,
  },
  {
    id: 4,
    sql: `
      ALTER TABLE strategy_episodes ADD COLUMN policy_version TEXT;
      ALTER TABLE strategy_episodes ADD COLUMN policy_hash TEXT;

      CREATE TABLE IF NOT EXISTS policy_versions (
        policy_hash TEXT PRIMARY KEY,
        policy_version TEXT NOT NULL,
        canonical_json TEXT NOT NULL,
        first_seen_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS provider_health (
        provider TEXT PRIMARY KEY,
        status TEXT NOT NULL,
        last_attempt_at TEXT NOT NULL,
        last_success_at TEXT,
        data_as_of TEXT,
        error TEXT,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS refresh_runs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        started_at TEXT NOT NULL,
        completed_at TEXT NOT NULL,
        duration_ms REAL NOT NULL,
        success INTEGER NOT NULL CHECK(success IN (0,1)),
        clock_state TEXT NOT NULL,
        new_buy_authority INTEGER NOT NULL CHECK(new_buy_authority IN (0,1)),
        policy_version TEXT NOT NULL,
        policy_hash TEXT NOT NULL,
        error TEXT
      );
    `,
  },
] as const;

export function migrate(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id INTEGER PRIMARY KEY,
      applied_at TEXT NOT NULL
    );
  `);

  const has = db.prepare("SELECT 1 FROM schema_migrations WHERE id = ?");
  const record = db.prepare("INSERT INTO schema_migrations (id, applied_at) VALUES (?, ?)");

  db.transaction(() => {
    for (const migration of MIGRATIONS) {
      if (has.get(migration.id)) continue;
      db.exec(migration.sql);
      record.run(migration.id, new Date().toISOString());
    }
  })();

  return MIGRATIONS.length;
}
