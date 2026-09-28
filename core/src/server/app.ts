import express from "express";
import type Database from "better-sqlite3";
import { databaseIntegrity } from "../db/maintenance.js";
import type { EngineRuntime } from "../engine/runtime.js";
import {
  EngineApiSuccessSchema,
  EngineApiWarmupSchema,
  EngineSnapshotSchema,
  HealthResponseSchema,
  MetricsResponseSchema,
  MinimumEvidenceResponseSchema,
} from "../engine/types.js";
import { assessMinimumEvidence } from "../policy/minimumEvidence.js";
import { ZOBIRIS_POLICY, ZOBIRIS_POLICY_HASH } from "../policy/config.js";
import { createSessionGuard, securityHeaders } from "./auth.js";
import { registerRoutes } from "./routes.js";

function operationalMetrics(db:Database.Database,engine?:EngineRuntime) {
  const now=new Date();
  const cutoff=new Date(now.getTime()-24*60*60_000).toISOString();
  const refresh=db.prepare(`
    SELECT COUNT(*) AS total,
      SUM(CASE WHEN success=0 THEN 1 ELSE 0 END) AS failed
    FROM refresh_runs WHERE started_at>=?
  `).get(cutoff) as {total:number;failed:number|null};
  const openEpisodes=(db.prepare("SELECT COUNT(*) AS n FROM strategy_episodes WHERE status='OPEN'").get() as {n:number}).n;
  const overdue=(db.prepare(`
    SELECT COUNT(*) AS n FROM episode_outcomes
    WHERE evaluated_at IS NULL AND due_at<=?
  `).get(now.toISOString()) as {n:number}).n;
  const snapshot=engine?.current() ?? null;
  const integrity=databaseIntegrity(db);
  const providerStatuses=Object.fromEntries(
    snapshot
      ? Object.entries(snapshot.health.providers).map(([name,health])=>[name,health.status])
      : []
  );
  return MetricsResponseSchema.parse({
    ok:true,
    now:now.toISOString(),
    refreshes24h:{total:refresh.total,failed:refresh.failed ?? 0},
    openEpisodes,
    overdueOutcomes:overdue,
    databaseBytes:integrity.estimatedBytes,
    authorityEnabled:snapshot?.authority.newBuyEnabled ?? false,
    providerStatuses,
    clockState:snapshot?.health.clock.state ?? "HEALTHY",
    policy:{version:ZOBIRIS_POLICY.version,hash:ZOBIRIS_POLICY_HASH},
  });
}

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
        const snapshot=engine?.current() ?? null;
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
          engine:snapshot ? {
            authorityEnabled:snapshot.authority.newBuyEnabled,
            lastRefreshSuccessAt:snapshot.health.lastRefreshSuccessAt,
            providers:snapshot.health.providers,
            clock:snapshot.health.clock,
          } : null,
        });
        res.status(body.ok?200:503).json(body);
      },
    },
    {
      method:"get",
      path:"/api/metrics",
      access:"public",
      handler:(_req,res)=>res.json(operationalMetrics(db,engine)),
    },
    {
      method:"get",
      path:"/api/learning/evidence/:horizon",
      access:"public",
      handler:(req,res)=>{
        const horizon=String(req.params.horizon ?? "").toUpperCase();
        const evidence=assessMinimumEvidence(db,horizon);
        return res.json(MinimumEvidenceResponseSchema.parse({ok:true,evidence}));
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
