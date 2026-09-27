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
