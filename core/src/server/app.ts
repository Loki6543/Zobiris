import express from "express";
import type Database from "better-sqlite3";
import type { EngineRuntime } from "../engine/runtime.js";

export function createApp(db: Database.Database, engine?: EngineRuntime) {
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

  app.get("/api/engine", (_req, res) => {
    const snapshot=engine?.current() ?? null;
    if(!snapshot) return res.status(503).json({ ok:false, state:"WARMUP", message:"Engine snapshot not ready" });
    return res.json({ ok:true, snapshot });
  });

  app.use("/api", (_req, res) => res.status(404).json({ ok:false, error:"API_NOT_FOUND" }));

  return app;
}
