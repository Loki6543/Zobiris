import { releaseResearchBundle } from "./researchImportBundle.js";
import { applyResearchBundle } from "./researchRuntime.js";
import {openResearchEvidence} from './researchEvidence.js';
import {collectResearchTick,importResearchEvidence,researchAdapters,type ResearchAsset} from './researchCollection.js';
import {researchView,startResearchTimers,snapshotFreshness,fetchOutcomeQuotes} from './researchRuntime.js';
import {collectOutcomeTick} from './outcomeCollector.js';
import {entryRules} from './entryRules.js';
import {buildZobirisWatchlist} from './zobirisWatchlist.js';
import { readSwarmLedger, summarizeSwarmCalibration, updateSwarmLedger, type SwarmOutcomeHorizon } from "./swarmLedger.js";
import { collectHyperliquidPositioning, readHyperliquidPositioningHistory, readLatestHyperliquidPositioning, type HyperliquidPositioningSummary } from "./hyperliquidPositioning.js";
import { marketBrief } from './marketBrief.js';
import { openProtection, sampleProtection, readProtection } from "./profitProtection.js";
import { exitMarketContext } from "../compareLab/compare.js";
import { accountCapital, accountProvenance, accountMappings, buildAccountDependency, getAccountView, refreshAccountContextFromKraken, startAccountContextSync } from "./accountContext.js";
/**
 * Zobiris HTTP API + static SPA server.
 *
 * Endpoints:
 *   GET  /api/health             — liveness
 *   GET  /api/snapshot/latest    — most recent snapshot (the portfolio decision)
 *   GET  /api/snapshot/:id       — specific snapshot
 *   GET  /api/snapshots?limit=N  — recent snapshots (summary only)
 *   GET  /api/watchlist          — canonical CoinMarketCap watchlist universe
 *   GET  /api/asset/:symbol      — per-asset case file (latest snapshot + evidence + observations)
 *   GET  /api/providers          — provider health + circuit-breaker state
 *   GET  /api/audit?limit=N      — recent audit events
 *   GET  /api/db-info            — table counts + mapping status
 *   POST /api/refresh            — trigger a refresh (uses default fixture mode unless ZOBIRIS_LIVE=1)
 *   GET  /api/regime             — current regime + confidence
 *   GET  /*                      — static SPA from public/
 *
 * No external dependencies (uses node:http + node:fs).
 */

import { createServer, IncomingMessage, ServerResponse } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { resolve, join, extname, normalize, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

import { openStorage } from "../storage/client.js";
import { compareDaily, compareUniverse, sidewaysHistory } from "../compareLab/compare.js";
import {
  getRecentSnapshots,
  getSnapshotById,
  getSessionById,
  listProviderHealth,
  listAuditEvents,
  getDbInfo,
  getEvidenceForSymbol,
  getObservationsForSymbol,
  getCanonicalBySymbol,
  listAllCanonical,
  jget,
} from "../storage/repository.js";
import { runRefresh } from "../runtime/refresh.js";
import { DEFAULT_SCORING_CONFIG } from "../domain/scoring.js";
import { buildAdapters } from "../scripts/_adapters.js";
import { loadWatchlist as loadCmcWatchlist } from "../scripts/_watchlist.js";
import { HOLDINGS, OPEN_ORDERS } from "../ui/simplePortfolioData.js";
async function loadWatchlist() {
  const assets = new Map((await loadCmcWatchlist()).map(a => [a.symbol, a]));
  const account = getAccountView();
  for (const asset of [...HOLDINGS, ...OPEN_ORDERS, ...account.holdings, ...account.openOrders]) {
    if (!assets.has(asset.symbol)) assets.set(asset.symbol, {symbol: asset.symbol, name: asset.name});
  }
  return [...assets.values()];
}
import { buildCaseFile } from "../portfolio/caseFile.js";
import { orchestrate } from "../specialists/orchestrator.js";
import {
  loadSecurityConfig,
  isAuthenticated,
  isRefreshAuthorized,
  isRefreshActive,
  checkRateLimit,
  startRefreshSession,
  endRefreshSession,
  resolveCorsOrigin,
  clientIpFrom,
  isSafeStaticPath,
  send401,
  send429,
  sendJson,
} from "./security.js";
import { randomUUID } from "node:crypto";
import { persistRefresh } from "../storage/integration.js";
import { config as loadEnv } from "dotenv";
import { challengeEvidence } from "../agents/challenger.js";
import { collectStrategy21Kraken } from "../strategy21/collector.js";
import { loadStrategyLiquidity, saveStrategyMarketState } from "../strategy21/storage.js";
import { buildIntelligenceOverview } from "../strategy21/intelligenceVNext/index.js";
import { CAPABILITY_MANIFEST, NARRATIVE_RESEARCH_POLICY } from "../strategy21/research/researchIntegrity.js";
import { readOutcomeMemory, summarizeOutcomeMemory, updateOutcomeMemory, pilotScorecard } from "./outcomeMemory.js";
import { buildOutcomeValidationLab, isOutcomeHorizon } from "./strategyValidationReport.js";
import { startKrakenBookShadow } from "../strategy21/prediction/bookCollector.js";
import { createShadowFeatureHandler } from "./shadowRuntime.js";
import { readShadowForecasts } from "./predictionOutcomes.js";
import { P0_VERSION, openResearchProvenance, readResearchProvenance } from "./researchProvenance.js";
import { createAttentionLedgerRepository, getAttentionLedgerStatus, runLiveAttentionCollection, type AttentionFetcher, type StocktwitsFirestreamFetcher } from "../strategy21/attentionLedger/index.js";
import {
  challengerRequestSchema,
  ledgerClaimSchema,
} from "../agents/contracts.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, "..", "..");
loadEnv({
  path: resolve(PROJECT_ROOT, ".env.local"),
  override: false,
  quiet: true,
});
const PUBLIC_DIR = resolve(PROJECT_ROOT, "public");
const DEFAULT_DB =
  process.env.ZOBIRIS_DB_PATH ?? resolve(PROJECT_ROOT, "zobiris.db");
const OUTCOME_MEMORY_PATH =
  process.env.ZOBIRIS_OUTCOME_MEMORY_PATH ?? resolve(dirname(DEFAULT_DB), "zobiris-outcome-memory.json");
const SWARM_LEDGER_PATH =
  process.env.ZOBIRIS_SWARM_LEDGER_PATH ?? resolve(dirname(DEFAULT_DB), "zobiris-swarm-ledger.json");
const HYPERLIQUID_POSITIONING_PATH =
  process.env.ZOBIRIS_HYPERLIQUID_POSITIONING_PATH ??
  resolve(dirname(DEFAULT_DB), "zobiris-hyperliquid-positioning.json");
const RESEARCH_DB = resolve(dirname(DEFAULT_DB), 'zobiris-research-evidence.sqlite');
function researchAssets():ResearchAsset[]{
 const storage=openStorage({path:DEFAULT_DB});
 try{return listAllCanonical(storage.db).filter(a=>a.mappingStatus==='verified'&&a.mappingConfidence>=0.8).map(a=>({id:a.id,symbol:a.symbol,name:a.name,cmcId:(typeof a.providerIds==='string'?JSON.parse(a.providerIds):a.providerIds)?.cmcNumericId}));}finally{storage.close();}
}
function researchRepository(assets=researchAssets()){return openResearchEvidence(RESEARCH_DB,new Map(assets.map(a=>[a.symbol,a.id])));}
function currentResearch(symbol?:string){const assets=researchAssets().filter(a=>!symbol||a.symbol===symbol);const repo=researchRepository(assets);try{return researchView(repo,assets);}finally{repo.close();}}
const WATCHLIST_SOURCE_URL =
  "https://coinmarketcap.com/?type=coins&tableRankBy=watchlist&watchListId=6a9a95c387e5a45cc1f40d5e";

/**
 * v0.4.4 audit fix (P0 #4): load the HTTP security policy from env.
 * Anonymous Refresh is allowed ONLY in dev unless explicitly enabled.
 */
const SECURITY = loadSecurityConfig();

function jsonResponse(
  res: ServerResponse,
  status: number,
  body: unknown,
): void {
  const text = JSON.stringify(body, null, 2);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(text),
    "Cache-Control": "no-store",
  });
  res.end(text);
}

function notFound(res: ServerResponse, msg = "not found"): void {
  jsonResponse(res, 404, { error: msg });
}

function errorResponse(res: ServerResponse, status: number, e: unknown): void {
  const message = e instanceof Error ? e.message : String(e);
  jsonResponse(res, status, { error: message });
}

async function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolveBody, reject) => {
    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
      if (Buffer.byteLength(data) > 64 * 1024)
        reject(new Error("request body exceeds 64KB"));
    });
    req.on("end", () => resolveBody(data));
    req.on("error", reject);
  });
}

async function runChallengeHandler(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  if (!isAuthenticated(req, SECURITY))
    return send401(res, "challenger requires Bearer auth");
  const rl = checkRateLimit(
    `agent:${clientIpFrom(req)}`,
    Date.now(),
    SECURITY.refreshRateLimitPerHour,
  );
  if (!rl.allowed) return send429(res, rl.retryAfterSec);
  if (!process.env.OPENAI_API_KEY)
    return jsonResponse(res, 503, {
      error: "OpenAI challenger is not configured",
    });

  const rawBody = await readBody(req);
  let raw: unknown;
  try {
    raw = JSON.parse(rawBody);
  } catch {
    return jsonResponse(res, 400, { error: "invalid JSON body" });
  }
  const parsed = challengerRequestSchema.safeParse(raw);
  if (!parsed.success)
    return jsonResponse(res, 400, {
      error: "invalid challenger request",
      details: parsed.error.issues,
    });

  const activeWatchlist = await loadWatchlist();
  if (
    !activeWatchlist.some(
      (entry) => entry.symbol.toUpperCase() === parsed.data.symbol.toUpperCase(),
    )
  ) {
    return jsonResponse(res, 404, {
      error: `${parsed.data.symbol.toUpperCase()} is not in the active watchlist`,
    });
  }

  const storage = openStorage({ path: DEFAULT_DB });
  let claims;
  try {
    claims = getEvidenceForSymbol(storage.db, parsed.data.symbol, 100).map(
      (row) =>
        ledgerClaimSchema.parse({
          id: row.id,
          symbol: row.symbol,
          factorFamily: row.factorFamily,
          claim: row.claim,
          source: row.source,
          epistemicState: row.epistemicState,
          evidenceConfidence: row.evidenceConfidence,
          freshness: row.freshness,
          dataMode: row.dataMode,
          claimOrigin: row.claimOrigin,
          parentClaimIds: jget<string[]>(row.parentClaimIds, []),
        }),
    );
  } finally {
    storage.close();
  }
  if (!claims.some((claim) => claim.id === parsed.data.claimId)) {
    return jsonResponse(res, 404, {
      error: "target claim not found in this symbol ledger",
    });
  }
  const output = await challengeEvidence({ ...parsed.data, claims });
  jsonResponse(res, 200, {
    worker: "zobiris-challenger",
    authority: "advisory-read-only",
    deterministicOutputsChanged: false,
    output,
  });
}

async function serveStatic(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  // Default to index.html
  const url = new URL(req.url ?? "/", "http://localhost");
  let rel = decodeURIComponent(url.pathname);
  if (rel === "/" || rel === "") rel = "/index.html";
  // Prevent directory traversal
  const safe = normalize(rel).replace(/^([/\\])+/, "");
  if (safe.includes("..")) return notFound(res);
  const fullPath = join(PUBLIC_DIR, safe);
  if (!fullPath.startsWith(PUBLIC_DIR + sep) && fullPath !== PUBLIC_DIR)
    return notFound(res);
  try {
    const s = await stat(fullPath);
    if (!s.isFile()) return notFound(res);
    const ext = extname(fullPath).toLowerCase();
    const mime: Record<string, string> = {
      ".html": "text/html; charset=utf-8",
      ".js": "application/javascript; charset=utf-8",
      ".mjs": "application/javascript; charset=utf-8",
      ".css": "text/css; charset=utf-8",
      ".json": "application/json; charset=utf-8",
      ".svg": "image/svg+xml",
      ".png": "image/png",
      ".ico": "image/x-icon",
      ".txt": "text/plain; charset=utf-8",
    };
    const buf = await readFile(fullPath);
    res.writeHead(200, {
      "Content-Type": mime[ext] ?? "application/octet-stream",
      "Content-Length": buf.byteLength,
      "Cache-Control": ext === ".html" ? "no-cache" : "public, max-age=300",
    });
    res.end(buf);
  } catch {
    // SPA fallback: try index.html for unknown routes
    if (extname(safe) === "") {
      try {
        const idx = await readFile(join(PUBLIC_DIR, "index.html"));
        res.writeHead(200, {
          "Content-Type": "text/html; charset=utf-8",
          "Content-Length": idx.byteLength,
          "Cache-Control": "no-cache",
        });
        res.end(idx);
        return;
      } catch {
        /* fall through */
      }
    }
    notFound(res);
  }
}

const attentionCmcFetcher: AttentionFetcher = async (url, init) => {
  const response = await fetch(url, { headers: { Accept: "application/json" }, signal: init?.signal });
  return { ok: response.ok, status: response.status, json: () => response.json() };
};

const attentionStocktwitsFetcher: StocktwitsFirestreamFetcher = async (url, init) => {
  const response = await fetch(url, { headers: init.headers, redirect: "follow", signal: init.signal });
  return { ok: response.ok, status: response.status, json: () => response.json() };
};

async function collectAttentionShadowOnRefresh(): Promise<unknown> {
  if (process.env.ZOBIRIS_ATTENTION_COLLECT_ON_REFRESH !== "1") return { status: "DISABLED" };
  const storage = openStorage({ path: DEFAULT_DB });
  try {
    const now = Date.now();
    const hour = 60 * 60 * 1000;
    const scheduledFor = Math.floor(now / hour) * hour;
    return await runLiveAttentionCollection({
      repo: createAttentionLedgerRepository(storage.sqlite as any),
      scheduledFor,
      startedAt: now,
      declaredUniverseSize: 100,
      cmcFetcher: attentionCmcFetcher,
      stocktwitsFetcher: attentionStocktwitsFetcher,
      env: process.env,
      fetchTimeoutMs: 10_000,
    });
  } catch (error) {
    return { status: "FAILED", diagnostic: error instanceof Error ? error.message : String(error) };
  } finally {
    storage.close();
  }
}

async function runRefreshHandler(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  // v0.4.4 audit fix (P0 #4): HTTP security gates BEFORE any
  // provider work runs. Three gates, in order:
  //   1. Auth: Bearer token (or explicit anonymous opt-in)
  //   2. Rate limit: per-IP, default 12/hour
  //   3. Single-flight: only one Refresh at a time
  //
  // v0.4.4 audit fix (P0 #5): live mode is server-controlled,
  // NOT caller-controlled. The ?live=1 query param is REJECTED
  // if the server is not configured to allow it. The runtime
  // policy is read from ZOBIRIS_ALLOW_LIVE_PROVIDERS.
  const url = new URL(req.url ?? "/", "http://localhost");
  const allowLive = process.env.ZOBIRIS_ALLOW_LIVE_PROVIDERS === "1";
  // Even when the server allows live mode, the query string is
  // ignored — the policy env is the only authority. This closes
  // the audit's "?live=1 cannot elevate policy" requirement.
  const live = allowLive;
  if (!isRefreshAuthorized(req, SECURITY)) {
    return send401(res, "refresh requires Bearer auth");
  }
  const ip = clientIpFrom(req);
  const rl = checkRateLimit(ip, Date.now(), SECURITY.refreshRateLimitPerHour);
  if (!rl.allowed) {
    return send429(res, rl.retryAfterSec);
  }
  const sessionId = `refresh-${randomUUID()}`;
  const lock = startRefreshSession(sessionId);
  if (!lock.ok) {
    // Single-flight: return 202 with the in-flight sessionId.
    return sendJson(res, 202, {
      status: "already_running",
      sessionId: lock.activeSessionId,
      startedAt: new Date(lock.startedAt).toISOString(),
    });
  }
  try {
    const stale = Number(url.searchParams.get("stale") ?? "0") || 0;
    const adapters = buildAdapters({ staleSeconds: stale, live });
    await refreshAccountContextFromKraken();
    const watchlist = await loadWatchlist();
    const startedAt = Date.now();
    const result = await runRefresh({
      mode: "deep",
      watchlist,
      policy: DEFAULT_SCORING_CONFIG,
      portfolioDependencyBuilder: buildAccountDependency,
      capitalLedger: accountCapital,
      supplementalMappings: accountMappings,
      adapters,
      dbPath: DEFAULT_DB,
    });
    result.session.stages = result.session.stages.map((stage) =>
      stage.index === 18
        ? {
            ...stage,
            status: "succeeded" as const,
            notes: "snapshot, stages, evidence and outbox committed atomically",
          }
        : stage,
    );
    const storage = openStorage({ path: DEFAULT_DB });
    let persisted;
    try {
      persisted = persistRefresh({
        db: storage.db,
        sessionId: result.session.id,
        watchlist,
        observations: result.observations,
        evidenceClaims: result.evidenceClaims,
        snapshot: result.snapshot,
        canonicalMap: result.canonicalMap,
        providerHealthUpdates: result.providerHealthUpdates,
        sessionMode: result.session.mode === "deep" ? "deep" : "delta",
        stages: result.session.stages,
      });
    } finally {
      storage.close();
    }
    const firstStrategy = (result.snapshot.rankedAssets as unknown as Array<{ strategy21?: { marketState?: string; marketEnteredAt?: string; minimumDwellUntil?: string } }>).find((a) => a.strategy21)?.strategy21;
    if (firstStrategy?.marketState && firstStrategy.marketEnteredAt && firstStrategy.minimumDwellUntil) {
      try {
        saveStrategyMarketState(DEFAULT_DB, {
          state: firstStrategy.marketState as any,
          enteredAt: firstStrategy.marketEnteredAt,
          minimumDwellUntil: firstStrategy.minimumDwellUntil,
        });
      } catch {
        // Strategy state continuity may degrade, but the persisted refresh remains valid.
      }
    }
    try {
      await updateOutcomeMemory(OUTCOME_MEMORY_PATH, result.snapshot as any);
    } catch (error) {
      console.warn("Outcome memory update failed:", error instanceof Error ? error.message : String(error));
    }
    try {
      const swarmRules = await entryRules().catch(() => ({}));
      let swarmSocial = new Map<string, any>();
      let swarmPositioning = new Map<string, HyperliquidPositioningSummary>();
      try {
        const research = currentResearch();
        swarmSocial = new Map(
          research.assets.map((asset) => [asset.symbol, asset.socialIntelligence]),
        );
      } catch {
        // Social evidence is noncritical for the swarm and must remain UNKNOWN on failure.
      }
      if (live) {
        try {
          swarmPositioning = await collectHyperliquidPositioning(
            HYPERLIQUID_POSITIONING_PATH,
            watchlist.map((asset) => asset.symbol),
          );
        } catch {
          // A provider outage must not invalidate the production strategy snapshot.
          // Fall back only to a recent persisted aggregate positioning snapshot.
          try {
            swarmPositioning = await readLatestHyperliquidPositioning(
              HYPERLIQUID_POSITIONING_PATH,
              { symbols: watchlist.map((asset) => asset.symbol) },
            );
          } catch {
            swarmPositioning = new Map();
          }
        }
      } else {
        try {
          swarmPositioning = await readLatestHyperliquidPositioning(
            HYPERLIQUID_POSITIONING_PATH,
            { symbols: watchlist.map((asset) => asset.symbol) },
          );
        } catch {
          swarmPositioning = new Map();
        }
      }
      const swarmDecision = buildZobirisWatchlist({
        snapshot: result.snapshot,
        watchlist,
        account: getAccountView(),
        rules: swarmRules,
        socialIntelligence: swarmSocial,
        perpPositioning: swarmPositioning,
      });
      if (swarmDecision.asOf) {
        await updateSwarmLedger(
          SWARM_LEDGER_PATH,
          swarmDecision.asOf,
          swarmDecision.assets.map((asset) => ({
            symbol: asset.symbol,
            price: asset.price,
            swarmShadow: asset.swarmShadow,
          })),
        );
      }
    } catch (error) {
      console.warn("Swarm shadow ledger update failed:", error instanceof Error ? error.message : String(error));
    }
    const attentionCollection = await collectAttentionShadowOnRefresh();
    const elapsedMs = Date.now() - startedAt;
    jsonResponse(res, 200, {
      sessionId: result.session.id,
      regime: result.snapshot.regime,
      regimeConfidence: result.snapshot.regimeConfidence,
      topAssets: result.snapshot.rankedAssets.slice(0, 10).map((a) => ({
        symbol: a.symbol,
        opportunityRank: a.opportunityRank,
        allocationRank: a.allocationRank,
        role: a.role,
        action: a.action,
        score: a.opportunity.adjusted,
        confidence: a.confidence.pct,
        targetWeightPct: a.targetWeight.pct,
        strategy21: (a as unknown as { strategy21?: unknown }).strategy21,
      })),
      observationCount: result.observations.length,
      evidenceClaimCount: result.evidenceClaims.length,
      snapshotId: persisted.snapshotId,
      outboxIds: persisted.outboxIds,
      providerHealth: result.providerHealthUpdates,
      attentionCollection,
      elapsedMs,
      live,
    });
  } finally {
    endRefreshSession(sessionId);
  }
}

interface ApiRouter {
  [methodAndPath: string]: (
    req: IncomingMessage,
    res: ServerResponse,
  ) => Promise<void> | void;
}

const API: ApiRouter = {
  "GET /api/compare/sideways": async (req, res) => {
    const url = new URL(req.url ?? "/", "http://localhost");
    try {
      const symbols = (url.searchParams.get("symbols") ?? "").split(",");
      const threshold = Number(url.searchParams.get("threshold") ?? "2");
      jsonResponse(res, 200, await sidewaysHistory(symbols, threshold));
    } catch (error) {
      jsonResponse(res, error instanceof RangeError ? 400 : 503, {
        error: error instanceof Error ? error.message : "Patterns unavailable",
      });
    }
  },
  "GET /api/compare/universe": async (_req, res) => {
    try { jsonResponse(res, 200, { symbols: await compareUniverse(), source: "Kraken public AssetPairs" }); }
    catch { jsonResponse(res, 503, { error: "Kraken coin list unavailable" }); }
  },
  "GET /api/compare/daily": async (req, res) => {
    const url = new URL(req.url ?? "/", "http://localhost");
    try {
      const symbols = (url.searchParams.get("symbols") ?? "").split(",");
      const days = Number(url.searchParams.get("days") ?? "30");
      jsonResponse(res, 200, await compareDaily(symbols, days));
    } catch (error) {
      jsonResponse(res, error instanceof RangeError ? 400 : 503, {
        error: error instanceof Error ? error.message : "Comparison unavailable",
      });
    }
  },
  "GET /api/health": (_req, res) => {
    const account = getAccountView();
    let researchStatus: string = 'DEGRADED';
    try { researchStatus = readResearchProvenance(DEFAULT_DB).evidence.status; }
    catch { /* Research availability must not take down portfolio liveness. */ }
    jsonResponse(res, 200, {
      status: "ok",
      researchProvenance: { version: P0_VERSION, status: researchStatus },
      db: DEFAULT_DB,
      time: new Date().toISOString(),
      krakenAccount: {
        privateAccountSynced: account.privateAccountSynced,
        capturedAt: account.capturedAt,
        syncMode: account.syncMode,
        websocketConnected: account.websocketConnected,
        lastError: account.lastError,
        dangerousPermissionCount: account.dangerousPermissionsDetected.length,
      },
    });
  },
  "GET /api/entry-rules": async (_req,res)=>{
    try{jsonResponse(res,200,{rules:await entryRules(),executionEnabled:false});}catch(e){errorResponse(res,503,e);}
  },
  "GET /api/swarm/calibration": async (req,res)=>{
    if (!isAuthenticated(req, SECURITY))
      return send401(res, "swarm calibration requires Bearer auth");
    try {
      const url = new URL(req.url ?? "/", "http://localhost");
      const horizon = url.searchParams.get("horizon") ?? "1d";
      if (!["30m","2h","8h","12h","1d","3d","7d"].includes(horizon))
        return jsonResponse(res, 400, { error: "invalid swarm calibration horizon" });
      const symbol = url.searchParams.get("symbol")?.toUpperCase();
      jsonResponse(
        res,
        200,
        await summarizeSwarmCalibration(SWARM_LEDGER_PATH, {
          horizon: horizon as SwarmOutcomeHorizon,
          symbol,
        }),
      );
    } catch (error) {
      errorResponse(res, 503, error);
    }
  },
  "GET /api/swarm/positioning": async (req,res)=>{
    if (!isAuthenticated(req, SECURITY))
      return send401(res, "swarm positioning diagnostics require Bearer auth");
    try {
      const url = new URL(req.url ?? "/", "http://localhost");
      const symbol = url.searchParams.get("symbol")?.toUpperCase();
      const limit = Number(url.searchParams.get("limit") ?? "100");
      jsonResponse(
        res,
        200,
        await readHyperliquidPositioningHistory(
          HYPERLIQUID_POSITIONING_PATH,
          { symbol, limit },
        ),
      );
    } catch (error) {
      errorResponse(res, 503, error);
    }
  },
  "GET /api/swarm/outcomes": async (req,res)=>{
    if (!isAuthenticated(req, SECURITY))
      return send401(res, "swarm outcome calibration requires Bearer auth");
    try {
      const url = new URL(req.url ?? "/", "http://localhost");
      const symbol = url.searchParams.get("symbol")?.toUpperCase();
      const limit = Number(url.searchParams.get("limit") ?? "100");
      jsonResponse(res, 200, await readSwarmLedger(SWARM_LEDGER_PATH, { symbol, limit }));
    } catch (error) {
      errorResponse(res, 503, error);
    }
  },
  "GET /api/zobiris/watchlist": async (_req,res)=>{
    res.setHeader('Cache-Control','no-store');
    const storage=openStorage({path:DEFAULT_DB});
    try {
      const latest=getRecentSnapshots(storage.db,1)[0];
      const snapshot=latest?getSnapshotById(storage.db,latest.id):null;
      const watchlist=await loadWatchlist();
      const rules=await entryRules().catch(()=>({}));
      let rewardRemaining:number|null=null;
      let protection:ReturnType<typeof openProtection>|undefined;
      try {protection=openProtection(DEFAULT_DB);rewardRemaining=readProtection(protection).rewardRemaining??null;}
      catch { /* Missing reward classification must not hide a balance. */ }
      finally {protection?.close();}
      // Cached account context only: this GET cannot trade or change the strategy snapshot.
      // CryptoBERT remains shadow-only: it is exposed beside the entry plan but cannot alter
      // qualification, score, order size or reference limit until outcome calibration promotes it.
      let socialIntelligence = new Map<string, any>();
      let perpPositioning = new Map<string, HyperliquidPositioningSummary>();
      try {
        const research = currentResearch();
        socialIntelligence = new Map(
          research.assets.map((asset) => [asset.symbol, asset.socialIntelligence]),
        );
      } catch {
        // Research enrichment must never take down the decision-state feed.
      }
      try {
        perpPositioning = await readLatestHyperliquidPositioning(
          HYPERLIQUID_POSITIONING_PATH,
          { symbols: watchlist.map((asset) => asset.symbol) },
        );
      } catch {
        // Positioning enrichment is shadow-only and must never take down this feed.
      }
      jsonResponse(res,200,buildZobirisWatchlist({snapshot,watchlist,account:getAccountView(),rules,rewardRemaining,socialIntelligence,perpPositioning}));
    } catch { jsonResponse(res,503,{error:'Zobiris decision-state feed unavailable'}); }
    finally {storage.close();}
  },
  "GET /api/research/evidence": (req,res) => {
    try{const symbol=new URL(req.url??'/', 'http://localhost').searchParams.get('symbol')?.toUpperCase();jsonResponse(res,200,currentResearch(symbol));}catch{jsonResponse(res,503,{error:'Research evidence unavailable'});}
  },
  "GET /api/research/reassessment": (req,res) => {
    try{const symbol=new URL(req.url??'/', 'http://localhost').searchParams.get('symbol')?.toUpperCase();const data=currentResearch(symbol);jsonResponse(res,200,{...data,assets:data.assets.map(({evidence,...a})=>a)});}catch{jsonResponse(res,503,{error:'Reassessment unavailable'});}
  },
  "POST /api/research/evidence/import": async(req,res) => {
    if(!isAuthenticated(req,SECURITY))return send401(res,'operator token required');
    if(!checkRateLimit('research-import:'+clientIpFrom(req),10,60000).allowed)return send429(res,60);
    let repo:ReturnType<typeof researchRepository>|undefined;
    try{const body=JSON.parse(await readBody(req));repo=researchRepository();jsonResponse(res,200,importResearchEvidence(repo,body.records,true));}catch{jsonResponse(res,400,{error:'Invalid research import: check identities, dates, source URLs and record limits (64KB HTTP body).'});}finally{repo?.close();}
  },
  "GET /api/market-brief": async (_req, res) => {
    try { jsonResponse(res, 200, await marketBrief()); }
    catch(e) { errorResponse(res, 503, e); }
  },
  "GET /api/profit-protection": (_req, res) => {
    let db: ReturnType<typeof openProtection> | undefined;
    try { db = openProtection(DEFAULT_DB); jsonResponse(res, 200, readProtection(db)); }
    catch (e) { errorResponse(res, 503, e); }
    finally { db?.close(); }
  },
  "GET /api/account": async (_req, res) => {
    try {
      await refreshAccountContextFromKraken();
      jsonResponse(res, 200, { account: getAccountView() });
    } catch (e) {
      errorResponse(res, 500, e);
    }
  },
  "GET /api/integrity": (_req, res) => {
    const storage = openStorage({ path: DEFAULT_DB });
    try {
      const recent = getRecentSnapshots(storage.db, 1);
      const latest = recent[0] ?? null;
      const snapshotAsOfRaw = latest?.asOf ?? null;
      const snapshotMs = typeof snapshotAsOfRaw === "number"
        ? snapshotAsOfRaw
        : snapshotAsOfRaw ? Date.parse(String(snapshotAsOfRaw)) : Number.NaN;
      const ageSeconds = Number.isFinite(snapshotMs) ? Math.max(0, Math.round((Date.now() - snapshotMs) / 1000)) : null;
      const providers = listProviderHealth(storage.db);
      const healthyProviders = providers.filter((provider: any) => provider.status === "connected" || provider.status === "snapshot").length;
      let attention: ReturnType<typeof getAttentionLedgerStatus> | null = null;
      try {
        attention = getAttentionLedgerStatus(createAttentionLedgerRepository(storage.sqlite as any));
      } catch {
        attention = null;
      }
      const latestRunStatus = attention?.latestRun?.status ?? null;
      const snapshotStatus = snapshotFreshness(Number.isFinite(snapshotMs)?snapshotMs:null);
      const attentionFailed = latestRunStatus === "FAILED";
      const providerDegraded = providers.length > 0 && healthyProviders < providers.length;
      const status = latest == null || attentionFailed
        ? "failed"
        : snapshotStatus === "stale" || providerDegraded
          ? "degraded"
          : "healthy";
      jsonResponse(res, 200, {
        version: "0.7.6",
        research: (()=>{try{const r=currentResearch();return {asOf:r.asOf,providers:r.providers,outcomeCollection:r.outcomeCollection,lastImportAt:r.lastImportAt};}catch{return {status:"UNAVAILABLE"};}})(),
        status,
        checkedAt: new Date().toISOString(),
        refresh: { active: isRefreshActive() },
        snapshot: {
          id: latest?.id ?? null,
          asOf: snapshotAsOfRaw == null ? null : (typeof snapshotAsOfRaw === "number" ? new Date(snapshotAsOfRaw).toISOString() : String(snapshotAsOfRaw)),
          ageSeconds,
          status: snapshotStatus,
        },
        providers: { healthy: healthyProviders, total: providers.length, degraded: Math.max(0, providers.length - healthyProviders) },
        attention: {
          latestRunStatus,
          eligibleUniverseCount: attention?.latestRun?.eligibleUniverseCount ?? 0,
          dueOutcomes: attention?.unresolvedOutcomeBacklog.due ?? 0,
          providerCount: Object.keys(attention?.providerCoverage ?? {}).length,
        },
        policy: {
          liveProvidersEnabled: process.env.ZOBIRIS_ALLOW_LIVE_PROVIDERS === "1",
          sameOriginRefreshEnabled: SECURITY.allowSameOriginRefresh,
        },
      });
    } catch (e) {
      errorResponse(res, 500, e);
    } finally {
      storage.close();
    }
  },
  "GET /api/watchlist": async (_req, res) => {
    const watchlist = await loadWatchlist();
    jsonResponse(res, 200, {
      source: WATCHLIST_SOURCE_URL,
      watchlist: watchlist.map((entry, index) => ({
        rank: index + 1,
        symbol: entry.symbol,
        name: entry.name,
      })),
    });
  },
  "GET /api/snapshot/latest": (_req, res) => {
    const storage = openStorage({ path: DEFAULT_DB });
    try {
      const recent = getRecentSnapshots(storage.db, 1);
      if (recent.length === 0)
        return jsonResponse(res, 404, { error: "no snapshots yet" });
      const snap = getSnapshotById(storage.db, recent[0]!.id);
      const session = snap ? getSessionById(storage.db, snap.sessionId) : null;
      jsonResponse(res, 200, { snapshot: snap, session });
    } finally {
      storage.close();
    }
  },
  "GET /api/snapshot/:id": (req, res) => {
    const url = new URL(req.url ?? "/", "http://localhost");
    const id = url.pathname.split("/").pop()!;
    const storage = openStorage({ path: DEFAULT_DB });
    try {
      const snap = getSnapshotById(storage.db, id);
      if (!snap) return notFound(res, "snapshot not found");
      const session = getSessionById(storage.db, snap.sessionId);
      jsonResponse(res, 200, { snapshot: snap, session });
    } finally {
      storage.close();
    }
  },
  "GET /api/snapshots": (_req, res) => {
    const url = new URL(_req.url ?? "/", "http://localhost");
    const limit = Math.min(Number(url.searchParams.get("limit") ?? "20"), 100);
    const storage = openStorage({ path: DEFAULT_DB });
    try {
      const rows = getRecentSnapshots(storage.db, limit);
      jsonResponse(res, 200, { snapshots: rows });
    } finally {
      storage.close();
    }
  },
  "GET /api/asset/:symbol": async (req, res) => {
    const url = new URL(req.url ?? "/", "http://localhost");
    const symbol = decodeURIComponent(
      url.pathname.split("/").pop()!,
    ).toUpperCase();
    const activeWatchlist = await loadWatchlist();
    if (
      !activeWatchlist.some(
        (entry) => entry.symbol.toUpperCase() === symbol,
      )
    ) {
      return notFound(res, `${symbol} is not in the active watchlist`);
    }
    const storage = openStorage({ path: DEFAULT_DB });
    try {
      const canonical = getCanonicalBySymbol(storage.db, symbol);
      const recent = getRecentSnapshots(storage.db, 1);
      if (recent.length === 0)
        return jsonResponse(res, 404, { error: "no snapshots yet" });
      const snap = getSnapshotById(storage.db, recent[0]!.id);
      const ranked = snap?.rankedAssets ? JSON.parse(snap.rankedAssets) : [];
      const assetAnalysis =
        ranked.find((a: { symbol: string }) => a.symbol === symbol) ?? null;
      const evidence = getEvidenceForSymbol(storage.db, symbol, 50);
      const observations = getObservationsForSymbol(storage.db, symbol, 50);
      if (!assetAnalysis && !canonical)
        return notFound(res, `no data for ${symbol}`);

      // v0.4.0: build a richer case file with specialist reconciliation
      const recentHistory = getRecentSnapshots(storage.db, 6)
        .filter((s) => s.id !== snap?.id)
        .slice(0, 5)
        .map((s) => {
          const s2 = getSnapshotById(storage.db, s.id);
          return {
            asOf:
              typeof s.asOf === "number"
                ? new Date(s.asOf).toISOString()
                : s.asOf,
            rankedAssets: s2?.rankedAssets ? JSON.parse(s2.rankedAssets) : [],
          };
        });
      // Map DB row → domain CanonicalAsset (providerIds is a JSON string in DB)
      const canonicalDomain = canonical
        ? {
            id: canonical.id,
            symbol: canonical.symbol,
            name: canonical.name,
            chainId: canonical.chainId ?? undefined,
            contractAddress: canonical.contractAddress ?? undefined,
            providerIds:
              typeof canonical.providerIds === "string"
                ? JSON.parse(canonical.providerIds)
                : canonical.providerIds,
            mappingStatus: canonical.mappingStatus as
              "verified" | "ambiguous" | "unmapped" | "quarantined",
            mappingConfidence: canonical.mappingConfidence,
            // v0.4.4 audit fix (P0 #5): read the persisted identityProvenance
            // (the "where did this id come from" stamp). When the row
            // predates v0.4.4 the column is null; default to "persistence-rehydrated"
            // so the runtime knows this is a legacy row.
            identityProvenance: ((canonical as any).identityProvenance ??
              "persistence-rehydrated") as
              | "uuidv4-initial"
              | "uuidv4-persisted"
              | "persistence-rehydrated"
              | "fallback",
            updatedAt:
              typeof canonical.updatedAt === "number"
                ? new Date(canonical.updatedAt).toISOString()
                : canonical.updatedAt,
          }
        : null;
      // Map DB row → domain NormalizedObservation (DB has different field set)
      // v0.4.4 audit fix: do NOT hard-code quarantineState: "verified".
      // Read the persisted value (which may be ambiguous / quarantined)
      // and the identityMatchMethod so the rehydration path preserves
      // provenance. The case file / on-demand specialist can then see
      // "excluded evidence requiring identity resolution".
      const observationsDomain = observations.map((o) => {
        const norm = (v: unknown): string | undefined =>
          typeof v === "number"
            ? new Date(v).toISOString()
            : ((v as string | null) ?? undefined);
        return {
          id: o.id,
          idempotencyKey: o.idempotencyKey,
          provider: o.provider,
          providerEventId: o.providerEventId ?? undefined,
          eventType: o.eventType,
          schemaVersion: o.schemaVersion,
          canonicalAssetId: o.canonicalAssetId,
          quarantineState: (o.quarantineState ?? "verified") as
            "verified" | "ambiguous" | "unmapped" | "quarantined",
          identityMatchMethod: (o.identityMatchMethod ?? null) as
            | "id"
            | "provider-id"
            | "provider-slug"
            | "contract"
            | "chain+symbol"
            | "symbol-only"
            | "fallback"
            | "persistence-symbol-fallback"
            | null,
          dataMode: (o.dataMode ?? "live") as "live" | "snapshot" | "fallback",
          providerEndpoint: o.providerEndpoint ?? undefined,
          requestedSymbol: o.requestedSymbol ?? undefined,
          requestedExchange: o.requestedExchange ?? undefined,
          providerGeneratedAt: norm(o.providerGeneratedAt),
          fallbackReason: o.fallbackReason ?? undefined,
          upstreamFailure: jget(o.upstreamFailure, undefined),
          payloadHash: o.payloadHash ?? undefined,
          sourceTimestamp: norm(o.sourceTimestamp),
          occurredAt: norm(o.occurredAt) ?? new Date().toISOString(),
          receivedAt: norm(o.receivedAt) ?? new Date().toISOString(),
          retrievedAt: norm(o.receivedAt) ?? new Date().toISOString(),
          normalizerVersion: o.normalizerVersion,
          payload: jget(o.payload, {}),
          epistemicState: (o.epistemicState ?? "UNKNOWN") as
            | "KNOWN"
            | "INFERRED"
            | "UNCERTAIN"
            | "CONFLICTED"
            | "UNKNOWN"
            | "STALE",
          evidenceConfidence:
            ((o as Record<string, unknown>).evidenceConfidence as number) ??
            0.5,
          licenseClass: o.licenseClass,
        };
      });

      // v0.4.0: run specialist orchestrator on-the-fly for this asset
      let specialistResult = null;
      if (canonicalDomain) {
        try {
          specialistResult = await orchestrate({
            canonicalAsset: canonicalDomain,
            observations: observationsDomain,
            metadata: {
              watchlistRank: ranked.findIndex((asset: { symbol: string }) => asset.symbol === symbol) + 1,
              watchlistSize: ranked.length,
            },
            seed: 42,
          });
        } catch {
          specialistResult = null;
        }
      }
      const caseFile = buildCaseFile({
        symbol,
        assetAnalysis,
        canonical: canonicalDomain,
        observations: observationsDomain,
        evidenceClaims: evidence.map((claim) => ({
          id: claim.id,
          claim: claim.claim,
          source: claim.source,
          factorFamily: claim.factorFamily,
          epistemicState: claim.epistemicState,
          freshness: claim.freshness,
          dataMode: claim.dataMode,
        })),
        specialistResult,
        recentHistory,
      });
      jsonResponse(res, 200, {
        symbol,
        canonical,
        assetAnalysis,
        evidence,
        observations,
        snapshotAsOf: snap?.asOf,
        caseFile,
      });
    } catch (e) {
      errorResponse(res, 500, e);
    } finally {
      storage.close();
    }
  },
  "GET /api/prediction/shadow": (req, res) => {
    if (!isAuthenticated(req, SECURITY)) return send401(res, "operator token required");
    const url = new URL(req.url ?? "/", "http://localhost");
    const symbol = (url.searchParams.get("symbol") ?? "").toUpperCase();
    if (!/^[A-Z0-9]{2,15}$/.test(symbol)) return jsonResponse(res, 400, { error: "valid symbol required" });
    jsonResponse(res, 200, { mode: "SHADOW", authority: "ABSTAIN", forecasts: readShadowForecasts(DEFAULT_DB, `${symbol}/USD`, 100) });
  },
  "GET /api/strategy21": (_req, res) => {
    const storage = openStorage({ path: DEFAULT_DB });
    try {
      const recent = getRecentSnapshots(storage.db, 1);
      if (recent.length === 0) return jsonResponse(res, 404, { error: "no snapshots yet" });
      const snap = getSnapshotById(storage.db, recent[0]!.id);
      if (!snap) return jsonResponse(res, 404, { error: "snapshot not found" });
      const ranked = snap.rankedAssets ? JSON.parse(snap.rankedAssets) : [];
      const strategy21 = ranked.find((a: any) => a?.strategy21)?.strategy21;
      jsonResponse(res, 200, {
        asOf: typeof snap.asOf === "number" ? new Date(snap.asOf).toISOString() : snap.asOf,
        regime: snap.regime,
        regimeConfidence: snap.regimeConfidence,
        strategy21: strategy21 ? {
          version: "2.1",
          marketState: strategy21.marketState,
          doctrine: strategy21.doctrine,
          enteredAt: strategy21.marketEnteredAt,
          minimumDwellUntil: strategy21.minimumDwellUntil,
          maneuverCapitalUsd: accountCapital.maneuverNavUsd,
          ...accountProvenance,
          strategicReserveTargetUsd: 1800,
          eventualPortfolioTargetUsd: 3000,
          nextDollarReadyAssets: ranked.filter((a: any) => a?.strategy21?.nextDollarRank != null).length,
          portfolioDependency: snap.portfolioDependency ? JSON.parse(snap.portfolioDependency) : null,
          researchIntegrityVersion: "1.0",
          capabilityManifest: CAPABILITY_MANIFEST,
          narrativeResearchPolicy: NARRATIVE_RESEARCH_POLICY,
          recommendationMode: strategy21.recommendationMode ?? "LEGACY",
          delayedRotationCalibration: strategy21.delayedRotationCalibration ?? null,
        } : null,
        assets: ranked.map((a: any) => ({ symbol: a.symbol, strategy21: a.strategy21 ?? null })),
        warmup: strategy21 ? undefined : "Strategy 2.1 data will appear after the next v0.6.0 refresh",
      });
    } finally { storage.close(); }
  },
  "GET /api/strategy21/liquidity/:symbol": (req, res) => {
    const url = new URL(req.url ?? "/", "http://localhost");
    const symbol = decodeURIComponent(url.pathname.split("/").pop()!).toUpperCase();
    const liq = loadStrategyLiquidity(DEFAULT_DB, [symbol]).get(symbol);
    if (!liq) return jsonResponse(res, 200, { symbol, status: "KRAKEN_WARMUP", profile: null });
    jsonResponse(res, 200, { symbol, status: liq.profile.coverageDays >= 14 ? "HISTORY_READY" : "KRAKEN_WARMUP", pair: liq.pair, profile: liq.profile });
  },
  "POST /api/strategy21/collect": async (req, res) => {
    if (!isAuthenticated(req, SECURITY)) return send401(res, "collector requires Bearer auth");
    const ip = clientIpFrom(req);
    const rl = checkRateLimit(ip, Date.now(), SECURITY.refreshRateLimitPerHour);
    if (!rl.allowed) return send429(res, rl.retryAfterSec);
    const watchlist = await loadWatchlist();
    const results = await collectStrategy21Kraken({ dbPath: DEFAULT_DB, watchlist: watchlist.map((w) => w.symbol) });
    jsonResponse(res, 200, { collectedAt: new Date().toISOString(), ok: results.filter((r) => r.ok).length, failed: results.filter((r) => !r.ok).length, results });
  },
  "GET /api/intelligence/overview": (_req, res) => {
    const overview = buildIntelligenceOverview();
    const research = readResearchProvenance(DEFAULT_DB);
    jsonResponse(res, 200, { ...overview, researchIntegrity: research.assessment, researchEvidence: research.evidence,
      provenance: { ...overview.provenance, note: 'Research Integrity uses persisted P0 evidence; other panels remain explicitly labeled research fixtures with no trading authority.' } });
  },
  "GET /api/intelligence/research-integrity": (_req, res) => {
    const research = readResearchProvenance(DEFAULT_DB);
    jsonResponse(res, 200, { authority: research.evidence.authority, asOf: new Date().toISOString(),
      provenance: { source: research.evidence.source, dataMode: 'persisted', note: 'P0 engine evidence only; statistical evaluators and automatic promotion are not implemented.' },
      researchIntegrity: research.assessment, researchEvidence: research.evidence });
  },
  "GET /api/research/provenance": (req, res) => {
    if (!isAuthenticated(req, SECURITY)) return send401(res, "research diagnostics require Bearer auth");
    jsonResponse(res, 200, readResearchProvenance(DEFAULT_DB));
  },
  "GET /api/intelligence/relative-opportunity": (_req, res) => {
    const overview = buildIntelligenceOverview();
    jsonResponse(res, 200, { authority: overview.authority, asOf: overview.asOf, provenance: overview.provenance, relativeOpportunity: overview.relativeOpportunity });
  },
  "GET /api/intelligence/ecosystem-graph": (_req, res) => {
    const overview = buildIntelligenceOverview();
    jsonResponse(res, 200, { authority: overview.authority, asOf: overview.asOf, provenance: overview.provenance, ecosystemEdges: overview.ecosystemEdges });
  },
  "GET /api/intelligence/execution-readiness": (_req, res) => {
    const overview = buildIntelligenceOverview();
    jsonResponse(res, 200, { authority: overview.authority, asOf: overview.asOf, provenance: overview.provenance, executionReadiness: overview.executionReadiness });
  },
  "GET /api/intelligence/attention-ignition": (_req, res) => {
    try{const {assets,...data}=currentResearch();jsonResponse(res,200,data);}catch{jsonResponse(res,503,{error:"Live attention evidence unavailable"});}
  },
  "GET /api/intelligence/ownership-risk": (_req, res) => {
    const overview = buildIntelligenceOverview();
    jsonResponse(res, 200, { authority: overview.authority, asOf: overview.asOf, provenance: overview.provenance, ownershipRisk: overview.ownershipRisk });
  },
  "GET /api/providers": (_req, res) => {
    const storage = openStorage({ path: DEFAULT_DB });
    try {
      jsonResponse(res, 200, { providers: listProviderHealth(storage.db) });
    } finally {
      storage.close();
    }
  },
  "GET /api/audit": (_req, res) => {
    const url = new URL(_req.url ?? "/", "http://localhost");
    const limit = Math.min(Number(url.searchParams.get("limit") ?? "50"), 200);
    const storage = openStorage({ path: DEFAULT_DB });
    try {
      jsonResponse(res, 200, {
        events: listAuditEvents(storage.db, { limit }),
      });
    } finally {
      storage.close();
    }
  },
  "GET /api/db-info": (_req, res) => {
    const storage = openStorage({ path: DEFAULT_DB });
    try {
      jsonResponse(res, 200, getDbInfo(storage.db, DEFAULT_DB));
    } finally {
      storage.close();
    }
  },
  "GET /api/pilot-scorecard": async (_req,res)=>{
    try{jsonResponse(res,200,pilotScorecard(await readOutcomeMemory(OUTCOME_MEMORY_PATH)));}catch(e){errorResponse(res,503,e);}
  },
  "GET /api/strategy-validation": async (_req, res) => {
    try {
      const url = new URL(_req.url ?? "/", "http://localhost");
      const rawHorizon = (url.searchParams.get("horizon") ?? "7D").toUpperCase();
      if (!isOutcomeHorizon(rawHorizon)) return jsonResponse(res, 400, { error: "horizon must be one of 1H, 4H, 1D, 3D, 7D" });
      const symbol = url.searchParams.get("symbol")?.trim().toUpperCase() || undefined;
      if (symbol && !/^[A-Z0-9]{2,15}$/.test(symbol)) return jsonResponse(res, 400, { error: "valid symbol required" });
      const strategyTag = url.searchParams.get("strategyTag")?.trim() || undefined;
      const memory = await readOutcomeMemory(OUTCOME_MEMORY_PATH, symbol);
      jsonResponse(res, 200, buildOutcomeValidationLab(memory.records, { horizon: rawHorizon, symbol, strategyTag }));
    } catch (e) {
      errorResponse(res, 503, e);
    }
  },
  "GET /api/outcomes": async (_req, res) => {
    try {
      const url = new URL(_req.url ?? "/", "http://localhost");
      const symbol = url.searchParams.get("symbol")?.trim().toUpperCase() || undefined;
      const memory = await readOutcomeMemory(OUTCOME_MEMORY_PATH, symbol);
      const limit = Math.max(1, Math.min(Number(url.searchParams.get("limit") ?? "100"), 500));
      const records = memory.records.slice(-limit).reverse();
      jsonResponse(res, 200, {
        version: memory.version,
        updatedAt: memory.updatedAt,
        symbol: symbol ?? null,
        summary: summarizeOutcomeMemory(memory.records),
        records,
      });
    } catch (e) {
      errorResponse(res, 500, e);
    }
  },
  "GET /api/calibration": async (_req, res) => {
    // v0.4.0: in-process forecast ledger report. Empty in production
    // unless forecasts are actively being recorded during refresh.
    try {
      const { ForecastLedger } = await import("../learning/forecastLedger.js");
      const ledger = new ForecastLedger();
      const report = ledger.report();
      jsonResponse(res, 200, {
        report,
        note: "Forecast ledger is in-process; persistent storage is deferred to slice 6+.",
      });
    } catch (e) {
      errorResponse(res, 500, e);
    }
  },
  "GET /api/regime": (_req, res) => {
    const storage = openStorage({ path: DEFAULT_DB });
    try {
      const recent = getRecentSnapshots(storage.db, 1);
      if (recent.length === 0)
        return jsonResponse(res, 404, { error: "no snapshots yet" });
      const snap = recent[0]!;
      jsonResponse(res, 200, {
        regime: snap.regime,
        regimeConfidence: snap.regimeConfidence,
        asOf: snap.asOf,
        policyVersion: snap.policyVersion,
        totalAllocatedPct: snap.totalAllocatedPct,
        reservePct: snap.reservePct,
        unallocatedPct: snap.unallocatedPct,
      });
    } finally {
      storage.close();
    }
  },
  "GET /api/specialists/summary": async (_req, res) => {
    const storage = openStorage({ path: DEFAULT_DB });
    try {
      const recent = getRecentSnapshots(storage.db, 1);
      if (recent.length === 0)
        return jsonResponse(res, 404, { error: "no snapshots yet" });
      const recentSnap = recent[0]!;
      const snap = getSnapshotById(storage.db, recentSnap.id);
      if (!snap) return jsonResponse(res, 404, { error: "snapshot not found" });
      const ranked = JSON.parse(snap.rankedAssets);
      // Run orchestrator per ranked asset (limited to top 25 for performance)
      const { orchestrate, aggregateAcrossAssets } =
        await import("../specialists/orchestrator.js");
      const results = [];
      for (const a of ranked.slice(0, 25)) {
        const canonical = getCanonicalBySymbol(storage.db, a.symbol);
        if (!canonical) continue;
        const canonicalDomain = {
          id: canonical.id,
          symbol: canonical.symbol,
          name: canonical.name,
          chainId: canonical.chainId ?? undefined,
          contractAddress: canonical.contractAddress ?? undefined,
          providerIds:
            typeof canonical.providerIds === "string"
              ? JSON.parse(canonical.providerIds)
              : canonical.providerIds,
          mappingStatus: canonical.mappingStatus as
            "verified" | "ambiguous" | "unmapped" | "quarantined",
          mappingConfidence: canonical.mappingConfidence,
          // v0.4.4 audit fix (P0 #5): read the persisted identityProvenance
          // (the "where did this id come from" stamp). When the row
          // predates v0.4.4 the column is null; default to "persistence-rehydrated"
          // so the runtime knows this is a legacy row.
          identityProvenance: ((canonical as any).identityProvenance ??
            "persistence-rehydrated") as
            | "uuidv4-initial"
            | "uuidv4-persisted"
            | "persistence-rehydrated"
            | "fallback",
          updatedAt:
            typeof canonical.updatedAt === "number"
              ? new Date(canonical.updatedAt).toISOString()
              : canonical.updatedAt,
        };
        const obs = getObservationsForSymbol(storage.db, a.symbol, 30).map(
          (o) => {
            const norm = (v: unknown): string | undefined =>
              typeof v === "number"
                ? new Date(v).toISOString()
                : ((v as string | null) ?? undefined);
            return {
              id: o.id,
              idempotencyKey: o.idempotencyKey,
              provider: o.provider,
              providerEventId: o.providerEventId ?? undefined,
              eventType: o.eventType,
              schemaVersion: o.schemaVersion,
              canonicalAssetId: o.canonicalAssetId,
              // v0.4.4 audit fix: read quarantineState from the persisted
              // row, do NOT hard-code "verified". The on-demand specialist
              // path must respect the eligibility policy.
              quarantineState: (o.quarantineState ?? "verified") as
                "verified" | "ambiguous" | "unmapped" | "quarantined",
              identityMatchMethod: (o.identityMatchMethod ?? null) as
                | "id"
                | "provider-id"
                | "provider-slug"
                | "contract"
                | "chain+symbol"
                | "symbol-only"
                | "fallback"
                | "persistence-symbol-fallback"
                | null,
              dataMode: (o.dataMode ?? "live") as
                "live" | "snapshot" | "fallback",
              providerEndpoint: o.providerEndpoint ?? undefined,
              requestedSymbol: o.requestedSymbol ?? undefined,
              requestedExchange: o.requestedExchange ?? undefined,
              providerGeneratedAt: norm(o.providerGeneratedAt),
              fallbackReason: o.fallbackReason ?? undefined,
              upstreamFailure: jget(o.upstreamFailure, undefined),
              payloadHash: o.payloadHash ?? undefined,
              sourceTimestamp: norm(o.sourceTimestamp),
              occurredAt: norm(o.occurredAt) ?? new Date().toISOString(),
              receivedAt: norm(o.receivedAt) ?? new Date().toISOString(),
              retrievedAt: norm(o.receivedAt) ?? new Date().toISOString(),
              normalizerVersion: o.normalizerVersion,
              payload: jget(o.payload, {}),
              epistemicState: (o.epistemicState ?? "UNKNOWN") as
                | "KNOWN"
                | "INFERRED"
                | "UNCERTAIN"
                | "CONFLICTED"
                | "UNKNOWN"
                | "STALE",
              evidenceConfidence:
                ((o as Record<string, unknown>).evidenceConfidence as number) ??
                0.5,
              licenseClass: o.licenseClass,
            };
          },
        );
        const result = await orchestrate({
          canonicalAsset: canonicalDomain,
          observations: obs,
          metadata: {
            watchlistRank: ranked.indexOf(a) + 1,
            watchlistSize: ranked.length,
          },
          seed: 42,
        });
        results.push(result);
      }
      const agg = aggregateAcrossAssets(results);
      jsonResponse(res, 200, {
        asOf: snap.asOf,
        totalAssets: ranked.length,
        orchestratedAssets: results.length,
        aggregate: agg,
        results: results.map((r) => ({
          symbol: r.symbol,
          reconciled: r.reconciled,
          allocation: r.allocation,
          vetoed: r.vetoed,
          openChallengeCount: r.openChallenges.length,
          opinionCount: r.opinions.length,
        })),
      });
    } catch (e) {
      errorResponse(res, 500, e);
    } finally {
      storage.close();
    }
  },
  "POST /api/refresh": runRefreshHandler,
  "POST /api/agents/challenge": runChallengeHandler,
};

function findRoute(
  method: string,
  pathname: string,
):
  ((req: IncomingMessage, res: ServerResponse) => Promise<void> | void) | null {
  // Exact match
  const exact = API[`${method} ${pathname}`];
  if (exact) return exact;
  // Param match for /api/snapshot/:id and /api/asset/:symbol
  if (method === "GET") {
    if (/^\/api\/snapshot\/[^/]+$/.test(pathname))
      return API["GET /api/snapshot/:id"]!;
    if (/^\/api\/asset\/[^/]+$/.test(pathname))
      return API["GET /api/asset/:symbol"]!;
    if (/^\/api\/strategy21\/liquidity\/[^/]+$/.test(pathname))
      return API["GET /api/strategy21/liquidity/:symbol"]!;
  }
  return null;
}

const PORT = Number(process.env.PORT ?? "4273");
const HOST = process.env.HOST ?? "127.0.0.1";

export function createZobirisServer() {
  // Validate the independent research schema before accepting requests.
  openResearchProvenance(DEFAULT_DB).close();
  return createServer(async (req, res) => {
    const url = new URL(req.url ?? "/", "http://localhost");
    const pathname = url.pathname;
    // v0.4.4 audit fix (P0 #4): CORS is an explicit allow-list, NOT
    // a wildcard. When no origins are configured, no
    // Access-Control-Allow-Origin header is sent — the browser
    // then blocks cross-origin requests.
    const corsOrigin = resolveCorsOrigin(req, SECURITY);
    if (corsOrigin) {
      res.setHeader("Access-Control-Allow-Origin", corsOrigin);
      res.setHeader("Vary", "Origin");
      res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
      res.setHeader(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization",
      );
      res.setHeader("Access-Control-Max-Age", "600");
    }
    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }
    try {
      if (pathname.startsWith("/api/")) {
        const method = req.method ?? "GET";
        const handler = findRoute(method, pathname);
        if (!handler)
          return notFound(res, `no route for ${method} ${pathname}`);

        // v0.6.3: centralized fail-closed mutation guard. The only route
        // allowed to use the development-only anonymous exception is refresh.
        if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
          const authorized = pathname === "/api/refresh"
            ? isRefreshAuthorized(req, SECURITY)
            : isAuthenticated(req, SECURITY);
          if (!authorized) return send401(res, "mutation requires Bearer auth");
        }

        await handler(req, res);
      } else {
        // v0.4.4 audit fix (P0 #4): reject path-traversal BEFORE the
        // static handler. Defense in depth on top of the existing
        // normalize+startsWith check inside serveStatic.
        const rel = decodeURIComponent(pathname);
        const staticRelativePath = rel.replace(/^\/+/, "");
        if (rel !== "/" && !isSafeStaticPath(staticRelativePath)) {
          return notFound(res);
        }
        await serveStatic(req, res);
      }
    } catch (e) {
      errorResponse(res, 500, e);
    }
  });
}

export function startZobirisServer(port = PORT, host = HOST) {
  const server = createZobirisServer();
  startAccountContextSync();
  const stopResearch=startResearchTimers(async()=>{
    const assets=researchAssets();const repo=researchRepository(assets);
    try{
      applyResearchBundle(repo,releaseResearchBundle);
      if(process.env.ZOBIRIS_ALLOW_LIVE_PROVIDERS==='1'){
        const outcome=await collectOutcomeTick({path:OUTCOME_MEMORY_PATH,now:Date.now,fetchQuotes:symbols=>fetchOutcomeQuotes(symbols,assets,process.env)});
        const previous=repo.getState('outcomes') as {lastSuccessAt?:string}|null;
        repo.setState('outcomes',{...outcome,lastSuccessAt:outcome.lastSuccessAt??previous?.lastSuccessAt??null});
        const active=new Set((await loadWatchlist()).map(a=>a.symbol));
        await collectResearchTick(repo,researchAdapters(process.env),assets.filter(a=>active.has(a.symbol)),Date.now());
      }else repo.setState('outcomes',{status:'NOT_CONFIGURED',lastSuccessAt:null});
    }finally{repo.close();}
  });
  server.on('close',stopResearch);
  // Independent read-only account/market observer: never submits exchange orders.
  let protectionRunning = false;
  let nextDailyContext = 0;
  const collectProtection = async () => {
    if (protectionRunning) return;
    protectionRunning = true;
    let storage: ReturnType<typeof openStorage> | undefined;
    let protection: ReturnType<typeof openProtection> | undefined;
    try {
      storage = openStorage({ path: DEFAULT_DB, migrate: false });
      const latest = getRecentSnapshots(storage.db, 1)[0];
      const snapshot = latest ? getSnapshotById(storage.db, latest.id) : null;
      storage.close(); storage = undefined;
      const account = getAccountView();
      protection = openProtection(DEFAULT_DB);
      sampleProtection(protection, account, snapshot);
      if (account.privateAccountSynced && Date.now() >= nextDailyContext) {
        nextDailyContext = Date.now() + 15 * 60_000;
        for (const holding of account.holdings.filter(h => h.quantity > 0).slice(0, 50)) {
          try {
            const context = await exitMarketContext(holding.symbol);
            protection.prepare('INSERT OR REPLACE INTO protection_context VALUES(?,?)').run(holding.symbol, JSON.stringify(context));
          } catch { protection.prepare('INSERT OR REPLACE INTO protection_context VALUES(?,?)').run(holding.symbol, 'null'); }
        }
      }
    } catch (error) { console.warn('Profit protection tracker unavailable:', error instanceof Error ? error.message : String(error)); }
    finally { storage?.close(); protection?.close(); protectionRunning = false; }
  };
  const protectionTimer = setInterval(() => { void collectProtection(); }, 60_000);
  protectionTimer.unref();
  server.on('close', () => clearInterval(protectionTimer));
  void collectProtection();
  if (process.env.ZOBIRIS_PREDICTION_SHADOW === "1") {
    const configured = (process.env.ZOBIRIS_PREDICTION_PAIRS ?? "BTC/USD,SOL/USD").split(",").map((pair) => pair.trim().toUpperCase());
    const ingest = createShadowFeatureHandler(DEFAULT_DB);
    const coveredPairs = new Set<string>();
    const stop = startKrakenBookShadow(configured, (feature) => {
      try {
        ingest(feature);
        if (!coveredPairs.has(feature.pair)) {
          coveredPairs.add(feature.pair);
          console.log(`Prediction shadow book coverage: ${feature.pair}`);
        }
      }
      catch (error) { console.warn("Prediction shadow storage degraded:", error instanceof Error ? error.message : String(error)); }
    });
    server.on("close", stop);
  }

  // Strategy 2.1 execution-liquidity warm-up. This only samples Kraken public
  // market data; it never submits orders or uses private exchange endpoints.
  // Disabled by default so operators opt in to background network traffic.
  if (process.env.ZOBIRIS_STRATEGY21_AUTO_COLLECT === "1") {
    const configured = Number(process.env.ZOBIRIS_STRATEGY21_COLLECT_INTERVAL_MS ?? "300000");
    const intervalMs = Number.isFinite(configured) ? Math.max(60_000, configured) : 300_000;
    let collecting = false;
    const collect = async () => {
      if (collecting) return;
      collecting = true;
      try {
        const watchlist = await loadWatchlist();
        const results = await collectStrategy21Kraken({
          dbPath: DEFAULT_DB,
          watchlist: watchlist.map((item) => item.symbol),
        });
        const ok = results.filter((result) => result.ok).length;
        // eslint-disable-next-line no-console
        console.log(`Strategy 2.1 Kraken collector: ${ok}/${results.length} symbols sampled`);
      } catch (error) {
        // Collector failure must never crash the decision-support server.
        // eslint-disable-next-line no-console
        console.warn(`Strategy 2.1 Kraken collector degraded: ${error instanceof Error ? error.message : String(error)}`);
      } finally {
        collecting = false;
      }
    };
    const timer = setInterval(() => { void collect(); }, intervalMs);
    timer.unref();
    void collect();
  }

  server.listen(port, host, () => {
    // eslint-disable-next-line no-console
    console.log(`Zobiris server: http://${host}:${port}`);
    console.log(`DB: ${DEFAULT_DB}`);
    console.log(`SPA: ${PUBLIC_DIR}`);
    console.log(`Endpoints:`);
    console.log(`  GET  /api/health`);
    console.log(`  GET  /api/account`);
    console.log(`  GET  /api/outcomes?symbol=BTC&limit=100`);
    console.log(`  GET  /api/strategy-validation?horizon=7D&symbol=SOL`);
    console.log(`  GET  /api/snapshot/latest`);
    console.log(`  GET  /api/snapshot/:id`);
    console.log(`  GET  /api/snapshots?limit=20`);
    console.log(`  GET  /api/watchlist`);
    console.log(`  GET  /api/asset/:symbol`);
    console.log(`  GET  /api/providers`);
    console.log(`  GET  /api/audit?limit=50`);
    console.log(`  GET  /api/db-info`);
    console.log(`  GET  /api/regime`);
    console.log(`  GET  /api/strategy21`);
    console.log(`  GET  /api/prediction/shadow?symbol=BTC (operator token)`);
    console.log(`  GET  /api/strategy21/liquidity/:symbol`);
    console.log(`  POST /api/strategy21/collect`);
    console.log(`  POST /api/refresh?live=1`);
    console.log(`  POST /api/agents/challenge`);
  });
  return server;
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : null;
if (invokedPath === fileURLToPath(import.meta.url)) {
  startZobirisServer();
}
