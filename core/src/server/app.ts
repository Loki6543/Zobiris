import express from "express";
import type Database from "better-sqlite3";
import type { EngineRuntime } from "../engine/runtime.js";
import { databaseIntegrity } from "../db/maintenance.js";
import { ZOBIRIS_POLICY,ZOBIRIS_POLICY_HASH } from "../policy/config.js";
import { EngineApiSuccessSchema,HealthResponseSchema } from "../engine/types.js";
import { createSessionGuard, securityHeaders } from "./auth.js";
import { registerRoutes } from "./routes.js";

export interface AppOptions {
  sessionSecret?:string;
}

export function createApp(db: Database.Database, engine?: EngineRuntime, options:AppOptions={}) {
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
          database:{ok:integrity.ok,result:integrity.result,estimatedBytes:integrity.estimatedBytes},
          policy:{version:ZOBIRIS_POLICY.version,hash:ZOBIRIS_POLICY_HASH},
        });
        res.status(integrity.ok?200:503).json(body);
      },
    },
    {
      method:"get",
      path:"/api/engine",
      access:"public",
      handler:(_req,res)=>{
        const snapshot=engine?.current() ?? null;
        if(!snapshot) return res.status(503).json({ok:false,state:"WARMUP",message:"Engine snapshot not ready"});
        return res.json(EngineApiSuccessSchema.parse({ok:true,snapshot}));
      },
    },
  ],authGuard);

  app.use("/api", (_req, res) => res.status(404).json({ ok:false, error:"API_NOT_FOUND" }));
  app.use((error:unknown,_req:express.Request,res:express.Response,_next:express.NextFunction)=>{
    const message=error instanceof Error?error.message:String(error);
    res.status(500).json({ok:false,error:"INTERNAL_ERROR",message});
  });

  return app;
}
