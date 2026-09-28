import express from "express";
import type Database from "better-sqlite3";
import { databaseIntegrity } from "../db/maintenance.js";
import type { EngineRuntime } from "../engine/runtime.js";
import {
  EngineApiSuccessSchema,
  EngineApiWarmupSchema,
  EngineSnapshotSchema,
  HealthResponseSchema,
} from "../engine/types.js";
import { ZOBIRIS_POLICY, ZOBIRIS_POLICY_HASH } from "../policy/config.js";
import { createSessionGuard, securityHeaders } from "./auth.js";
import { registerRoutes } from "./routes.js";

export function createApp(
  db: Database.Database,
  engine?: EngineRuntime,
  options: { sessionSecret?: string } = {},
) {
  const app = express();
  app.disable("x-powered-by");
  app.use(securityHeaders);
  app.use(express.json({ limit: "256kb" }));

  const authGuard=createSessionGuard(options.sessionSecret);

  registerRoutes(app,[
    {
      method:"get",
      path:"/api/health",
      access:"public",
      handler:(_req,res)=>{
        const migration=db.prepare("SELECT MAX(id) AS id FROM schema_migrations").get() as {id:number|null};
        const integrity=databaseIntegrity(db);
        const body=HealthResponseSchema.parse({
          ok:integrity.ok,
          service:"zobiris-core",
          schemaVersion:migration.id ?? 0,
          now:new Date().toISOString(),
          database:{
            ok:integrity.ok,
            result:integrity.result,
            estimatedBytes:integrity.estimatedBytes,
          },
          policy:{version:ZOBIRIS_POLICY.version,hash:ZOBIRIS_POLICY_HASH},
        });
        res.status(body.ok?200:503).json(body);
      },
    },
    {
      method:"get",
      path:"/api/engine",
      access:"public",
      handler:(_req,res)=>{
        const snapshot=engine?.current() ?? null;
        if(!snapshot) {
          return res.status(503).json(EngineApiWarmupSchema.parse({
            ok:false,state:"WARMUP",message:"Engine snapshot not ready"
          }));
        }
        const validated=EngineSnapshotSchema.parse(snapshot);
        return res.json(EngineApiSuccessSchema.parse({ok:true,snapshot:validated}));
      },
    },
  ],authGuard);

  app.use("/api", (_req, res) => res.status(404).json({ ok:false, error:"API_NOT_FOUND" }));

  return app;
}
