import express from "express";
import type Database from "better-sqlite3";
import type { EngineRuntime } from "../engine/runtime.js";
import { databaseIntegrity } from "../db/maintenance.js";
import { ZOBIRIS_POLICY,ZOBIRIS_POLICY_HASH } from "../policy/config.js";
import { EngineApiSuccessSchema,HealthResponseSchema,MetricsResponseSchema,MinimumEvidenceResponseSchema } from "../engine/types.js";
import { assessMinimumEvidence } from "../policy/minimumEvidence.js";
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
          engine:engine?.current()?{
            authorityEnabled:engine.current()!.authority.newBuyEnabled,
            lastRefreshSuccessAt:engine.current()!.health.lastRefreshSuccessAt,
            providers:engine.current()!.health.providers,
            clock:engine.current()!.health.clock,
          }:null,
        });
        res.status(integrity.ok?200:503).json(body);
      },
    },
    {
      method:"get",
      path:"/api/metrics",
      access:"public",
      handler:(_req,res)=>{
        const now=new Date();
        const since=new Date(now.getTime()-24*60*60_000).toISOString();
        const refresh=db.prepare(`SELECT COUNT(*) total,SUM(CASE WHEN success=0 THEN 1 ELSE 0 END) failed
          FROM refresh_runs WHERE started_at>=?`).get(since) as {total:number;failed:number|null};
        const openEpisodes=Number((db.prepare("SELECT COUNT(*) n FROM strategy_episodes WHERE status='OPEN'").get() as any).n ?? 0);
        const overdueOutcomes=Number((db.prepare("SELECT COUNT(*) n FROM episode_outcomes WHERE evaluated_at IS NULL AND due_at<?").get(now.toISOString()) as any).n ?? 0);
        const integrity=databaseIntegrity(db);
        const snapshot=engine?.current() ?? null;
        const body=MetricsResponseSchema.parse({
          ok:true,
          now:now.toISOString(),
          refreshes24h:{total:Number(refresh.total??0),failed:Number(refresh.failed??0)},
          openEpisodes,
          overdueOutcomes,
          databaseBytes:integrity.estimatedBytes,
          authorityEnabled:snapshot?.authority.newBuyEnabled ?? false,
          providerStatuses:snapshot?Object.fromEntries(Object.entries(snapshot.health.providers).map(([name,health])=>[name,health.status])):{},
          clockState:snapshot?.health.clock.state ?? "HEALTHY",
          policy:{version:ZOBIRIS_POLICY.version,hash:ZOBIRIS_POLICY_HASH},
        });
        res.json(body);
      },
    },
    {
      method:"get",
      path:"/api/learning/evidence/7D",
      access:"public",
      handler:(_req,res)=>{
        const evidence=assessMinimumEvidence(db,"7D");
        return res.json(MinimumEvidenceResponseSchema.parse({ok:true,evidence}));
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
