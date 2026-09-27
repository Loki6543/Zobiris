import express from "express";
import type Database from "better-sqlite3";

export function createApp(db: Database.Database) {
  const app = express();
  app.disable("x-powered-by");
  app.use(express.json({ limit: "256kb" }));

  app.get("/api/health", (_req, res) => {
    const migration = db.prepare("SELECT MAX(id) AS id FROM schema_migrations").get() as { id: number | null };
    res.json({
      ok: true,
      service: "zobiris-core",
      schemaVersion: migration.id ?? 0,
      now: new Date().toISOString(),
    });
  });

  return app;
}
