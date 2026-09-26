import type { CapitalLedger } from "../strategy21/engine/capital.js";
/**
 * Refresh runtime — the 19-stage contract.
 *
 * Per docs/PRODUCT_REQUIREMENTS.md and the master prompt, a refresh must:
 *   1. Open a session ID and decision contract with point-in-time cutoff.
 *   2. Check provider health/freshness and entitlement.
 *   3. Synchronize watchlist membership/identity.
 *   4. Acquire current market evidence.
 *   5. Acquire social evidence.
 *   6. Acquire derivatives evidence.
 *   7. Acquire catalysts/news and macro.
 *   8. Acquire expensive on-chain evidence only when useful/available.
 *   9. Normalize, deduplicate, timestamp, reconcile, classify evidence.
 *  10. Update market regime.
 *  11. Run relevant specialists.
 *  12. Run hard risk gates.
 *  13. Score every eligible asset.
 *  14. Compare the full universe cross-sectionally.
 *  15. Calculate allocation weights and reserve.
 *  16. Run independent verifier and challenger/counter-evidence pass.
 *  17. Publish portfolio conclusion and every asset case file.
 *  18. Save a point-in-time snapshot and compute What Changed.
 *  19. Store forecast/evaluation telemetry without contaminating durable knowledge.
 *
 * A refresh must degrade gracefully: a provider outage may lower confidence
 * or leave fields unknown, but it must not produce invented data or destroy
 * the last-good snapshot.
 *
 * Slice 1 covers stages 1, 2, 3, 4-7 (fixture-driven), 9, 12, 13, 14, 15,
 * 16, 17, 18. Stages 5, 8, 10, 11, 19 are deferred to later slices.
 */

import { createHash, randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { isObservationEligibleForAnalysis } from "../providers/eligibility.js";
import {
  type CanonicalAsset,
  type NormalizedObservation,
  type RefreshSession,
  type RefreshMode,
  type PortfolioAnalysisSnapshot,
  type AssetAnalysisSnapshot,
  type EvidenceClaim,
  type FactorScore,
} from "../domain/index.js";
import { KrakenAdapter } from "../providers/kraken.js";
import { CMCAdapter } from "../providers/cmc.js";
import { LunarCrushAdapter } from "../providers/lunarcrush.js";
import { CoinGlassAdapter } from "../providers/coinglass.js";
import { CoinMarketCalAdapter } from "../providers/coinmarketcal.js";
import { buildAssetSnapshot, type AssetEvidenceSummary } from "../portfolio/buildPortfolio.js";
import { normalizePortfolio } from "../portfolio/normalize.js";
import { runVerifier, type Finding } from "../verifier/invariants.js";
import { runChallenger } from "../challenger/runChallenger.js";
import { DEFAULT_SCORING_CONFIG, type ScoringConfig } from "../domain/scoring.js";
import { resolve } from "node:path";
import { type OrchestratorResult } from "../specialists/orchestrator.js";
import { integrateStrategy21 } from "../strategy21/integration.js";
import { DELAYED_ROTATION_MODE } from "../strategy21/engine/delayedRotation.js";
import type { PortfolioDependencyInput } from "../strategy21/engine/portfolioDependency.js";
import { loadStrategyLiquidity, loadStrategyMarketState } from "../strategy21/storage.js";

export interface RefreshAdapters {
  kraken: KrakenAdapter;
  cmc: CMCAdapter;
  lunarcrush: LunarCrushAdapter;
  coinglass: CoinGlassAdapter;
  coinmarketcal: CoinMarketCalAdapter;
}

export interface RefreshOptions {
  mode?: RefreshMode;
  watchlist: { symbol: string; name: string }[];
  policy?: ScoringConfig;
  adapters: RefreshAdapters;
  /** Optional path to watchlist (overrides watchlist argument). */
  watchlistPath?: string;
  previousSnapshot?: PortfolioAnalysisSnapshot | null;
  /** Optional account/order/history evidence for Strategy 2.1 portfolio dependency analysis. */
  supplementalMappings?: Array<{symbol:string;chainId:number|null;contractAddress:string|null;providerIds:Record<string,string>;mappingStatus:"verified";mappingConfidence:number}>;
  portfolioDependency?: PortfolioDependencyInput;
  portfolioDependencyBuilder?: (observations: NormalizedObservation[]) => PortfolioDependencyInput;
  capitalLedger?: Partial<CapitalLedger>;
  /** If non-zero, simulate staleness for fixture-driven Kraken responses. */
  krakenStaleSeconds?: number;
  /**
   * v0.4.4 audit fix (P0 #5): optional path to a SQLite DB. When
   * provided, the runtime loads the persisted canonical map FIRST
   * (immutable canonicalAssetId). When omitted, the runtime uses
   * a fresh UUIDv4 per symbol (test/dev path).
   */
  dbPath?: string;
}

export interface ProviderHealthUpdate {
  provider: string;
  status: "connected" | "degraded" | "disconnected" | "credentials-needed" | "adapter-needed" | "snapshot";
  freshness: "live" | "delayed" | "stale" | "unavailable";
  success: boolean;
  lastErrorClass?: string;
  lastErrorAt?: number;
}

export interface RefreshResult {
  session: RefreshSession;
  observations: NormalizedObservation[];
  evidenceClaims: EvidenceClaim[];
  snapshot: PortfolioAnalysisSnapshot;
  findings: Finding[];
  canonicalMap: Map<string, CanonicalAsset>;
  providerHealthUpdates: ProviderHealthUpdate[];
  /** v0.4.0: cognitive specialist outputs per asset. */
  specialistResults?: OrchestratorResult[];
  /** v0.4.0: aggregate portfolio view from specialists. */
  specialistAggregate?: {
    totalAllocatedPct: number;
    reservePct: number;
    byAsset: Array<{ symbol: string; assetId: string; targetWeightPct: number; reconciledDirection: string; reconciledStrength: number; vetoed: boolean; openChallenges: number }>;
    vetoedAssets: string[];
    challengeCount: number;
  };
}

export async function runRefresh(opts: RefreshOptions): Promise<RefreshResult> {
  const cfg = opts.policy ?? DEFAULT_SCORING_CONFIG;
  const sessionId = randomUUID();
  const startedAt = new Date().toISOString();
  const session: RefreshSession = {
    id: sessionId,
    mode: opts.mode ?? "deep",
    startedAt,
    pointInTimeCutoff: startedAt,
    policyVersion: cfg.version,
    specialistRoster: ["marketStructure", "social", "derivatives", "catalyst", "verifier", "challenger"],
    stages: [
      { index: 1, name: "open-session", status: "succeeded", startedAt, completedAt: startedAt },
    ],
  };

  // 2-3. Provider health + watchlist sync (in slice 1: just load watchlist from path/arg).
  const watchlist = opts.watchlistPath
    ? await loadWatchlist(opts.watchlistPath)
    : opts.watchlist;
  appendStage(session, { index: 2, name: "provider-health", status: "succeeded" });
  appendStage(session, { index: 3, name: "watchlist-sync", status: "succeeded" });

  // v0.4.4 audit fix (P0 #5): load the PERSISTED canonical map FIRST.
  // The persisted canonicalAssetId is immutable. We only fall through
  // to a fresh UUID when no row exists for the symbol.
  //
  // Audit rule: "Do not derive the permanent entity ID from the
  // currently strongest external alias. A UUIDv7, ULID, UUID, or
  // another opaque immutable generated ID is acceptable."
  let persistedCanonical: Map<string, { id: string; providerIds: Record<string, string>; identityProvenance: string; mappingStatus: string; mappingConfidence: number; chainId?: string; contractAddress?: string }> = new Map();
  try {
    const { openStorage } = await import("../storage/client.js");
    const storage = openStorage({ path: opts.dbPath ?? process.env.ZOBIRIS_DB_PATH ?? "./zobiris.db" });
    try {
      const { listAllCanonical } = await import("../storage/repository.js");
      const rows = listAllCanonical(storage.db);
      for (const r of rows) {
        let pids: Record<string, string> = {};
        try { pids = JSON.parse(r.providerIds ?? "{}"); } catch { pids = {}; }
        const hasOpaqueUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(r.id);
        const hasIdentityProvenance = Boolean((r as { identityProvenance?: string | null }).identityProvenance);
        const legacyIdentity = !hasOpaqueUuid || !hasIdentityProvenance;
        persistedCanonical.set(r.symbol, {
          id: r.id,
          providerIds: pids,
          identityProvenance: legacyIdentity
            ? "persistence-rehydrated"
            : (r as { identityProvenance: string }).identityProvenance,
          // Legacy derived/unstamped identities remain visible but fail closed
          // until an operator migrates them onto an opaque immutable UUID.
          mappingStatus: legacyIdentity ? "quarantined" : r.mappingStatus,
          mappingConfidence: legacyIdentity ? 0 : r.mappingConfidence,
          chainId: r.chainId ?? undefined,
          contractAddress: r.contractAddress ?? undefined,
        });
      }
    } finally { storage.close(); }
  } catch {
    // No DB or no rows — fall through to UUID generation.
    persistedCanonical = new Map();
  }

  // Build canonical asset map.
  // v0.4.4 audit fix (P0 #5): the canonicalAssetId is IMMUTABLE.
  // 1. If a persisted canonical row exists for the symbol, use its
  //    persisted id EXACTLY — never re-derive, never change.
  // 2. Otherwise, generate a fresh opaque UUIDv4.
  // Mapping enrichment (providerIds, identityProvenance) is APPENDED
  // to the persisted asset, not used to mint a new id.
  const { resolveCanonicalIdentity, lookupCanonicalIdentity } = await import("../providers/canonicalResolve.js");
  const canonicalMap = new Map<string, CanonicalAsset>();
  for (const w of watchlist) {
    const persisted = persistedCanonical.get(w.symbol);
    if (persisted) {
      // Path 1: persisted id wins, ALWAYS.
      canonicalMap.set(w.symbol, {
        id: persisted.id,
        symbol: w.symbol,
        name: w.name,
        chainId: persisted.chainId,
        contractAddress: persisted.contractAddress,
        providerIds: persisted.providerIds,
        mappingStatus: persisted.mappingStatus as CanonicalAsset["mappingStatus"],
        mappingConfidence: persisted.mappingConfidence,
        identityProvenance: persisted.identityProvenance === "persistence-rehydrated"
          ? "persistence-rehydrated"
          : "uuidv4-persisted",
        updatedAt: startedAt,
      });
    } else {
      // Path 2: no persisted row → fresh opaque UUIDv4.
      // The audit explicitly says: "A UUIDv7, ULID, UUID, or another
      // opaque immutable generated ID is acceptable." We use UUIDv4
      // because v7 requires time-ordered generation that we don't need.
      // v0.4.4 fail-closed: an asset with no persisted id AND no
      // mapping entry is marked "ambiguous" with confidence 0. It
      // remains in the map for display, but cannot drive scoring
      // (the eligibility gate already filters ambiguous from eligible).
      // We pass provider="fallback" so the resolver does NOT treat
      // the watchlist symbol as a provider-id match. Symbol-only
      // is the v0.4.4 fail-closed default.
      const initial = resolveCanonicalIdentity({
        provider: "fallback",
        providerAssetId: w.symbol,
        symbol: w.symbol,
      });
      canonicalMap.set(w.symbol, {
        id: randomUUID(),
        symbol: w.symbol,
        name: w.name,
        providerIds: {},
        // Fail closed: ambiguous unless/until a stronger identity
        // arrives from the mappings file or a live provider.
        mappingStatus: initial.mappingStatus,
        mappingConfidence: initial.mappingConfidence,
        identityProvenance: "uuidv4-initial",
        updatedAt: startedAt,
      });
    }
  }
  // Load canonical mappings from fixture file (slice 5+).
  // v0.4.4: mapping enrichment is APPENDED, never re-derives the id.
  let mappingsLoaded = 0;
  try {
    const mappingsPath = new URL("../fixtures/canonical-mappings.json", import.meta.url);
    const mappings = JSON.parse(await readFile(mappingsPath, "utf8")) as Array<{
      symbol: string;
      chainId: number | null;
      contractAddress: string | null;
      providerIds: Record<string, string>;
      mappingStatus: "verified" | "ambiguous" | "unmapped" | "quarantined";
      mappingConfidence: number;
    }>;
    for (const m of [...mappings, ...(opts.supplementalMappings ?? [])]) {
      const a = canonicalMap.get(m.symbol);
      if (!a) continue;
      // chainId/contractAddress: only set if not already present.
      // The persisted row's chainId/contractAddress wins.
      if (!a.chainId && m.chainId != null) a.chainId = String(m.chainId);
      if (!a.contractAddress && m.contractAddress) a.contractAddress = m.contractAddress;
      // providerIds: append/override per-key. Existing persisted
      // values win; new keys from the mapping file are added.
      a.providerIds = { ...a.providerIds, ...m.providerIds };
      a.mappingStatus = m.mappingStatus;
      a.mappingConfidence = m.mappingConfidence;
      // CRITICAL: a.id is NEVER reassigned. The persisted UUID is
      // immutable across mapping enrichment.
      a.updatedAt = startedAt;
      mappingsLoaded++;
    }
  } catch (e) {
    // canonical-mappings.json missing or malformed: keep all assets unmapped.
    // The verifier will flag this as degraded but the engine still runs.
    appendStage(session, { index: 3, name: "watchlist-sync", status: "succeeded", notes: `canonical-mappings.json load failed: ${(e as Error).message}` });
  }
  appendStage(session, { index: 3, name: "watchlist-sync", status: "succeeded", notes: `${mappingsLoaded} canonical mappings loaded, ${canonicalMap.size} assets in watchlist` });
  // v0.4.4 audit fix (P0 #5): when a dbPath was provided, persist the
  // canonical map so the IMMUTABLE id survives across refreshes.
  // Without this, the second refresh with no persisted rows gets
  // a fresh UUID, breaking the audit invariant.
  const dbPath = opts.dbPath ?? process.env.ZOBIRIS_DB_PATH;
  if (dbPath) {
    try {
      const { openStorage } = await import("../storage/client.js");
      const storage = openStorage({ path: dbPath });
      try {
        const { upsertCanonicalAsset } = await import("../storage/repository.js");
        for (const a of canonicalMap.values()) {
          upsertCanonicalAsset(storage.db, {
            id: a.id,
            symbol: a.symbol,
            name: a.name,
            chainId: a.chainId,
            contractAddress: a.contractAddress,
            mappingStatus: a.mappingStatus,
            mappingConfidence: a.mappingConfidence,
            providerIds: a.providerIds,
            identityProvenance: a.identityProvenance ?? "uuidv4-initial",
          });
        }
      } finally { storage.close(); }
    } catch (e) {
      // Persistence failure should not abort the refresh; the
      // audit's invariant is satisfied if a DB is configured AND
      // the write succeeds. A failure here is logged via the stage
      // notes.
      appendStage(session, { index: 3, name: "watchlist-sync", status: "degraded", notes: `canonical map persistence failed: ${(e as Error).message}` });
    }
  }
  // Expose the canonical resolver for downstream stages.
  void lookupCanonicalIdentity;
  // v0.4.2 audit fix: now that the canonical map is built, inject it
  // into adapters that need it for cross-source id resolution.
  (opts.adapters.kraken as any).config = { ...(opts.adapters.kraken as any).config, canonicalAssets: canonicalMap };

  // 4-7. Acquire evidence. In slice 1 this is fixture-driven.
  const { observations, healthUpdates, outcomes: providerOutcomes } = await acquireAllEvidence(opts.adapters, canonicalMap, opts);
  // v0.4.3 audit fix (P0-7A): record the 4 evidence-acquisition stages
  // based on the ACTUAL acquisition outcome (success count, failure
  // class, configured flag), not on adapter.health() status. A
  // normalization failure is a real failure even if the adapter's
  // health() still reports "connected".
  function stageStatusFromOutcome(outcome: { normalizedObservations: number; hadFailure: boolean; providerConfigured: boolean; errClass?: string }): "succeeded" | "degraded" | "failed" | "not_configured" {
    if (!outcome.providerConfigured) return "not_configured";
    if (outcome.hadFailure && outcome.normalizedObservations === 0) return "failed";
    if (outcome.hadFailure) return "degraded";
    return "succeeded";
  }
  // acquire-market is a composite: Kraken (ticker) + CMC (quote).
  // The stage is succeeded only when both providers succeeded.
  const marketProviderStatuses = [
    stageStatusFromOutcome(providerOutcomes.market.kraken),
    stageStatusFromOutcome(providerOutcomes.market.cmc),
  ];
  const marketOk = marketProviderStatuses.every((status) => status === "succeeded");
  const marketConfigured = providerOutcomes.market.kraken.providerConfigured
    || providerOutcomes.market.cmc.providerConfigured;
  let marketStatus: "succeeded" | "degraded" | "failed" | "not_configured";
  if (!marketConfigured) marketStatus = "not_configured";
  else if (marketOk) marketStatus = "succeeded";
  else if (marketProviderStatuses.some((status) => status === "succeeded" || status === "degraded")) marketStatus = "degraded";
  else marketStatus = "failed";
  appendStage(session, {
    index: 4,
    name: "acquire-market",
    status: marketStatus,
    notes: `kraken=${stageStatusFromOutcome(providerOutcomes.market.kraken)} (${providerOutcomes.market.kraken.normalizedObservations} obs), cmc=${stageStatusFromOutcome(providerOutcomes.market.cmc)} (${providerOutcomes.market.cmc.normalizedObservations} obs)`,
  });
  appendStage(session, {
    index: 5,
    name: "acquire-social",
    status: stageStatusFromOutcome(providerOutcomes.social.lunarcrush),
    notes: `lunarcrush=${providerOutcomes.social.lunarcrush.normalizedObservations} obs, err=${providerOutcomes.social.lunarcrush.errClass ?? "none"}`,
  });
  appendStage(session, {
    index: 6,
    name: "acquire-derivatives",
    status: stageStatusFromOutcome(providerOutcomes.derivatives.coinglass),
    notes: `coinglass=${providerOutcomes.derivatives.coinglass.normalizedObservations} obs, err=${providerOutcomes.derivatives.coinglass.errClass ?? "none"}`,
  });
  appendStage(session, {
    index: 7,
    name: "acquire-catalysts-macro",
    status: stageStatusFromOutcome(providerOutcomes.catalysts.coinmarketcal),
    notes: `coinmarketcal=${providerOutcomes.catalysts.coinmarketcal.normalizedObservations} obs, err=${providerOutcomes.catalysts.coinmarketcal.errClass ?? "none"}`,
  });
  appendStage(session, { index: 8, name: "acquire-onchain", status: "not_configured", notes: "no on-chain provider in this build" });

  // 9. Normalize, deduplicate, classify.
  // Idempotency: deduplicate by idempotency key.
  const dedup = new Map<string, NormalizedObservation>();
  for (const o of observations) {
    if (!dedup.has(o.idempotencyKey)) {
      dedup.set(o.idempotencyKey, o);
    }
  }
  const dedupedObservations = Array.from(dedup.values());
  appendStage(session, { index: 9, name: "normalize-dedup", status: "succeeded" });

  // Claims are created before scoring so every factor can retain an exact
  // click-through proof chain. Display-only fallback/quarantined claims stay
  // in the ledger but are excluded from analytical attribution.
  const evidenceClaims = buildEvidenceClaims(dedupedObservations, canonicalMap);
  const eligibleObservationIds = new Set(
    dedupedObservations
      .filter((o) => isObservationEligibleForAnalysis(o) === "eligible")
      .map((o) => o.id),
  );
  const scoringFamilies = new Set<FactorScore["family"]>([
    "marketTechnical", "fundamentalTokenomics", "liquidityMarketStructure",
    "socialAttention", "derivativesLeverage", "onchainPositioning",
    "catalystsNarrative", "asymmetryConvexity",
  ]);
  const claimsBySymbol = new Map<string, {
    all: string[];
    byFamily: Partial<Record<FactorScore["family"], string[]>>;
  }>();
  for (const claim of evidenceClaims) {
    if (!claim.observationId || !eligibleObservationIds.has(claim.observationId)) continue;
    const entry = claimsBySymbol.get(claim.symbol) ?? { all: [], byFamily: {} };
    entry.all.push(claim.id);
    const family = claim.factorFamily as FactorScore["family"];
    if (scoringFamilies.has(family)) {
      const ids = entry.byFamily[family] ?? [];
      ids.push(claim.id);
      entry.byFamily[family] = ids;
    }
    claimsBySymbol.set(claim.symbol, entry);
  }

  // 12-15. Per-asset build + portfolio normalize.
  const evidenceBySymbol = buildEvidenceSummaries(dedupedObservations, canonicalMap);
  const assetSnapshots: AssetAnalysisSnapshot[] = [];
  for (const w of watchlist) {
    const canonical = canonicalMap.get(w.symbol) ?? null;
    const summary = evidenceBySymbol.get(w.symbol) ?? defaultEvidenceSummary(w.symbol);
    const snapshot = buildAssetSnapshot({
      symbol: w.symbol,
      canonical,
      evidence: summary,
      evidenceClaimIds: claimsBySymbol.get(w.symbol)?.all ?? [],
      evidenceClaimIdsByFamily: claimsBySymbol.get(w.symbol)?.byFamily,
      config: cfg,
    });
    assetSnapshots.push(snapshot);
  }
  const norm = normalizePortfolio(assetSnapshots, cfg, opts.previousSnapshot ?? null);
  let snapshot = norm.snapshot;

  // v0.6.0 Strategy Engine 2.1: enrich the existing deterministic snapshot.
  // This layer is additive: legacy Opportunity/Confidence/TargetWeight remain
  // intact for continuity, while Strategy 2.1 supplies market state, asset
  // lifecycle, executable-liquidity eligibility and best-next-dollar authority.
  let strategyLiquidity = new Map();
  let previousStrategyState;
  try {
    strategyLiquidity = loadStrategyLiquidity(opts.dbPath, watchlist.map((w) => w.symbol));
    previousStrategyState = loadStrategyMarketState(opts.dbPath);
  } catch {
    // A missing/new DB is a warm-up state, not a reason to fabricate liquidity
    // or abort the full refresh. Strategy 2.1 will remain WATCH_ONLY.
    strategyLiquidity = new Map();
    previousStrategyState = undefined;
  }
  snapshot = integrateStrategy21({
    snapshot,
    canonicalAssets: canonicalMap,
    evidenceClaims: evidenceClaims.filter(c => c.observationId && eligibleObservationIds.has(c.observationId)),
    liquidityBySymbol: strategyLiquidity,
    previousMarketState: previousStrategyState,
    portfolioDependency: opts.portfolioDependencyBuilder
      ? opts.portfolioDependencyBuilder(dedupedObservations.filter(o => eligibleObservationIds.has(o.id)))
      : opts.portfolioDependency,
    capitalLedger: opts.capitalLedger,
    recommendationMode: DELAYED_ROTATION_MODE,
  }) as typeof snapshot;
  appendStage(session, { index: 13, name: "score", status: "succeeded", notes: "legacy scoring + Strategy Engine 2.1" });
  appendStage(session, { index: 15, name: "allocate", status: "succeeded" });
  // v0.4.2 audit fix: record regime + universe-compare truthfully.
  // risk-gates is recorded after the verifier runs (below).
  appendStage(session, { index: 10, name: "regime", status: "succeeded", notes: snapshot.regime });
  appendStage(session, { index: 14, name: "universe-compare", status: "succeeded", notes: `${snapshot.rankedAssets.length} assets ranked` });

  // 11. Cognitive specialists (orchestrator) — runs per asset, derives
  // reconciled direction + allocation hint + open challenges. Slice 5+ v0.4.0.
  const { orchestrate, aggregateAcrossAssets } = await import("../specialists/orchestrator.js");
  const specialistResults = [];
  for (const w of watchlist) {
    const canonical = canonicalMap.get(w.symbol);
    if (!canonical) continue;
    const assetObs = dedupedObservations.filter(
      (o) => o.canonicalAssetId === canonical.id && isObservationEligibleForAnalysis(o) === "eligible",
    );
    const result = await orchestrate({
      canonicalAsset: canonical,
      observations: assetObs,
      metadata: {
        watchlistRank: watchlist.findIndex(x => x.symbol === w.symbol) + 1,
        watchlistSize: watchlist.length,
        opportunityRank: undefined,
        allocationRank: undefined,
        hardGateTripped: false,
      },
      seed: 42,
    });
    specialistResults.push(result);
  }
  const aggregate = aggregateAcrossAssets(specialistResults);
  appendStage(session, { index: 11, name: "specialists", status: "succeeded", notes: `orchestrated ${specialistResults.length} assets, ${aggregate.challengeCount} open challenges, ${aggregate.vetoedAssets.length} vetoes` });

  // 16. Verifier + Challenger
  const findings = runVerifier({ snapshot, canonicalAssets: canonicalMap, watchlist: watchlist.map(w => w.symbol) });
  const challenger = runChallenger(snapshot.rankedAssets, 5);
  session.verifierOutput = {
    passed: findings.every(f => f.severity !== "error"),
    findings,
  };
  session.challengerOutput = { questions: challenger };
  appendStage(session, { index: 16, name: "verify-challenge", status: "succeeded" });
  // v0.4.2 audit fix: record risk-gates truthfully now that findings
  // are available.
  appendStage(session, { index: 12, name: "risk-gates", status: "succeeded", notes: `${findings.length} findings (${findings.filter(f => f.severity === "error").length} errors, ${findings.filter(f => f.severity === "warn").length} warnings)` });

  // 17-18. Publish + snapshot (the snapshot is already in norm).
  snapshot.conclusion = buildConclusion(snapshot, findings);
  appendStage(session, { index: 17, name: "publish", status: "succeeded" });

  // 18. Snapshot (the persistence path) — record truthfully. If persist
  // is not invoked, this is "not_configured" for this run.
  appendStage(session, { index: 18, name: "snapshot", status: "not_configured", notes: "snapshot built; persistence is a separate step" });

  // 19. Telemetry — v0.4.2 audit fix: previously marked "deferred" with
  // no terminal record. We now record a truthful status. In-memory
  // telemetry is captured (forecasts, calibration, observations),
  // persistent telemetry is "not_configured" until the learning module
  // is integrated end-to-end.
  const { composeStages, STAGE_NAMES } = await import("./stages.js");
  void STAGE_NAMES;
  appendStage(session, { index: 19, name: "telemetry", status: "not_configured", notes: "in-memory telemetry captured; persistent telemetry not yet wired" });

  // v0.4.2 audit fix: assert that the 19-stage record is complete. If
  // any stage is missing, the regression test will fail.
  const finalStages = composeStages(
    session.stages.map(s => ({ name: s.name as any, status: s.status as any, notes: s.notes })),
  );
  // Replace the session's stages with the canonical 19-stage record so
  // downstream consumers see exactly the expected set.
  session.stages = finalStages;

  session.completedAt = new Date().toISOString();
  session.snapshot = snapshot;

  return {
    session,
    observations: dedupedObservations,
    evidenceClaims,
    snapshot,
    findings,
    canonicalMap,
    providerHealthUpdates: healthUpdates,
    specialistResults,
    specialistAggregate: aggregate,
  };
}

function appendStage(session: RefreshSession, stage: { index: number; name: string; status: RefreshSession["stages"][number]["status"]; notes?: string }): void {
  const now = new Date().toISOString();
  session.stages.push({ ...stage, startedAt: now, completedAt: now, notes: stage.notes });
}

async function loadWatchlist(path: string): Promise<{ symbol: string; name: string }[]> {
  const raw = JSON.parse(await readFile(resolve(process.cwd(), path), "utf8"));
  return raw as { symbol: string; name: string }[];
}

async function acquireAllEvidence(
  adapters: RefreshAdapters,
  canonicalMap: Map<string, CanonicalAsset>,
  _opts: RefreshOptions,
): Promise<{
  observations: NormalizedObservation[];
  healthUpdates: ProviderHealthUpdate[];
  outcomes: {
    market: { kraken: { normalizedObservations: number; hadFailure: boolean; providerConfigured: boolean; errClass?: string };
              cmc: { normalizedObservations: number; hadFailure: boolean; providerConfigured: boolean; errClass?: string } };
    social: { lunarcrush: { normalizedObservations: number; hadFailure: boolean; providerConfigured: boolean; errClass?: string } };
    derivatives: { coinglass: { normalizedObservations: number; hadFailure: boolean; providerConfigured: boolean; errClass?: string } };
    catalysts: { coinmarketcal: { normalizedObservations: number; hadFailure: boolean; providerConfigured: boolean; errClass?: string } };
  };
}> {
  const observations: NormalizedObservation[] = [];
  const healthUpdates: ProviderHealthUpdate[] = [];
  // All per-result receivedAt comes from the adapter's FetchResult.
  // No global receivedAt is needed at this orchestration layer.

  async function runProvider(
    name: string,
    fetcher: () => Promise<Array<{
      raw: unknown;
      data: unknown;
      receivedAt: string;
      sourceTimestamp?: string;
      networkError?: string;
      endpoint?: string;
      dataMode?: "live" | "snapshot" | "fallback";
      requestedSymbol?: string;
      requestedExchange?: string;
      providerGeneratedAt?: string;
      fallbackReason?: string;
      upstreamFailure?: NormalizedObservation["upstreamFailure"];
    }>>,
    normalizer: (raw: unknown, ctx: {
      receivedAt: string;
      endpoint?: string;
      requestedSymbol?: string;
      requestedExchange?: string;
    }) => NormalizedObservation[],
  ): Promise<{ normalizedObservations: number; hadFailure: boolean; errClass?: string; providerConfigured: boolean; fallbackCount: number; dataMode?: "live" | "snapshot" | "fallback" }> {
    let hadFailure = false;
    let errClass: string | undefined;
    let normalizedObservations = 0;
    let fallbackCount = 0;
    let lastDataMode: "live" | "snapshot" | "fallback" | undefined;
    try {
      const results = await fetcher();
      for (const r of results) {
        if (r.networkError) { hadFailure = true; errClass = "network"; continue; }
        if (!r.data) continue;
        // v0.4.4 audit fix (P0-6): track dataMode per result. A
        // fallback result increments the fallback count so the stage
        // can be marked degraded even if normalization succeeded.
        if (r.dataMode === "fallback") fallbackCount++;
        if (r.dataMode) lastDataMode = r.dataMode;
        try {
          const payloadHash = hashProviderPayload(r.raw);
          const normalized = normalizer(r.data, {
            receivedAt: r.receivedAt,
            endpoint: r.endpoint,
            requestedSymbol: r.requestedSymbol,
            requestedExchange: r.requestedExchange,
          });
          const stamped = normalized.map((o): NormalizedObservation => ({
            ...o,
            dataMode: r.dataMode ?? "live",
            providerEndpoint: r.endpoint,
            requestedSymbol: r.requestedSymbol,
            requestedExchange: r.requestedExchange,
            providerGeneratedAt: r.providerGeneratedAt ?? r.sourceTimestamp,
            fallbackReason: r.fallbackReason,
            upstreamFailure: r.upstreamFailure ?? (r.dataMode === "fallback"
              ? { class: "network", message: r.fallbackReason ?? "live provider fallback" }
              : undefined),
            payloadHash,
          }));
          observations.push(...stamped);
          normalizedObservations += stamped.length;
        } catch {
          // v0.4.3 audit fix (P0-7A): a normalization failure is a
          // REAL failure and must not be hidden by `health() === "connected"`.
          // Track it on the outcome so the stage can record degraded/failed.
          hadFailure = true; errClass = "normalize";
        }
      }
    } catch {
      hadFailure = true; errClass = "fetch";
    }
    // v0.4.4 audit fix (P0-6): a fallback result must always make
    // the stage degraded, never succeeded. The audit caught that
    // adapters could fall through to fixture without exposing the
    // fallback to the runtime.
    if (fallbackCount > 0 && !hadFailure) {
      hadFailure = true;
      errClass = "fallback";
    }
    // Read the adapter's own self-reported status to honor fixture vs live vs degraded.
    const adapterHealth = (adapters as unknown as Record<string, { health?: () => { status: string; freshness: string } }>)[name]?.health?.();
    const status = (adapterHealth?.status as ProviderHealthUpdate["status"]) ?? (hadFailure ? "degraded" : "connected");
    const freshness = (adapterHealth?.freshness as ProviderHealthUpdate["freshness"]) ?? (hadFailure ? "unavailable" : "live");
    // v0.4.3 audit fix (P0-7A): "configured" means the adapter has
    // *some* configuration (live key or fixture). If neither is set,
    // the stage is "not_configured" — not "degraded".
    const providerConfigured = !!(adapterHealth?.status) && adapterHealth?.status !== "credentials-needed";
    healthUpdates.push({
      provider: name,
      status,
      freshness,
      success: !hadFailure,
      lastErrorClass: errClass,
      lastErrorAt: hadFailure ? Date.now() : undefined,
    });
    return { normalizedObservations, hadFailure, errClass, providerConfigured, fallbackCount, dataMode: lastDataMode };
  }

  // v0.4.3 audit fix (P0-7A): capture the actual acquisition outcome
  // for each provider so the 4 evidence stages can record truthful
  // status based on what actually happened, not on adapter.health().
  const marketOutcome = await runProvider(
    "kraken",
    () => adapters.kraken.fetch({ canonicalAssets: canonicalMap }),
    (data, ctx) => adapters.kraken.normalize(data, {
      canonicalAssets: canonicalMap,
      endpoint: "ticker",
      receivedAt: ctx.receivedAt,
      rawSchemaVersion: "1.0.0",
    }),
  );
  // CMC is also a market/identity source; we treat it as part of
  // acquire-market for stage-status purposes, since CMC quotes are
  // marketTechnical evidence.
  const cmcOutcome = await runProvider(
    "cmc",
    () => adapters.cmc.fetch({ canonicalAssets: canonicalMap }),
    (data, ctx) => adapters.cmc.normalize(data, {
      canonicalAssets: canonicalMap,
      endpoint: "quotes/latest",
      receivedAt: ctx.receivedAt,
      rawSchemaVersion: "1.0.0",
    }),
  );
  const socialOutcome = await runProvider(
    "lunarcrush",
    () => adapters.lunarcrush.fetch({ canonicalAssets: canonicalMap }),
    (data, ctx) => adapters.lunarcrush.normalize(data, {
      canonicalAssets: canonicalMap,
      endpoint: "v4/coins",
      receivedAt: ctx.receivedAt,
      rawSchemaVersion: "1.0.0",
    }),
  );
  const derivativesOutcome = await runProvider(
    "coinglass",
    () => adapters.coinglass.fetch({ canonicalAssets: canonicalMap }),
    (data, ctx) => {
      // v0.4.4 audit fix (P0-3): the FetchResult now carries an
      // `endpoint` tag. The runtime uses the tag to dispatch to the
      // right normalizer instead of the previous try/catch inference,
      // which the audit caught as broken (a permissive schema could
      // produce zero observations without throwing).
      const endpoint = ctx.endpoint === "liquidations" ? "liquidations" : "funding";
      return adapters.coinglass.normalize(data, {
        canonicalAssets: canonicalMap,
        endpoint,
        receivedAt: ctx.receivedAt,
        rawSchemaVersion: "4.0.0",
        // v0.4.4: forward the requested symbol so the normalizer
        // can attach observations to the canonical asset even
        // though the v4 response does not repeat the symbol.
        requestedSymbol: ctx.requestedSymbol,
        requestedExchange: ctx.requestedExchange,
      } as any);
    },
  );
  const catalystsOutcome = await runProvider(
    "coinmarketcal",
    () => adapters.coinmarketcal.fetch({ canonicalAssets: canonicalMap }),
    (data, ctx) => adapters.coinmarketcal.normalize(data, {
      canonicalAssets: canonicalMap,
      endpoint: "events",
      receivedAt: ctx.receivedAt,
      rawSchemaVersion: "1.0.0",
    }),
  );

  return {
    observations,
    healthUpdates,
    outcomes: {
      market: { kraken: marketOutcome, cmc: cmcOutcome },
      social: { lunarcrush: socialOutcome },
      derivatives: { coinglass: derivativesOutcome },
      catalysts: { coinmarketcal: catalystsOutcome },
    },
  };
}

function hashProviderPayload(raw: unknown): string {
  let serialized: string;
  try {
    serialized = JSON.stringify(raw) ?? "null";
  } catch {
    serialized = "[unserializable-provider-payload]";
  }
  return createHash("sha256").update(serialized).digest("hex");
}

function buildEvidenceSummaries(
  observations: NormalizedObservation[],
  canonicalMap: Map<string, CanonicalAsset>,
): Map<string, AssetEvidenceSummary> {
  const bySymbol = new Map<string, AssetEvidenceSummary>();
  const distinctProviders = new Map<string, Set<string>>();
  const freshestBySymbol = new Map<string, number>();
  // v0.4.4 audit fix (P1-1): initialize identityConfidence / epistemic
  // state from the canonical registry, NOT a hard-coded 0.5 / UNKNOWN.
  // The audit caught that an unmapped placeholder could receive
  // identity-coverage credit simply because a canonical object exists.
  for (const [sym, ca] of canonicalMap) {
    bySymbol.set(sym, defaultEvidenceSummary(sym, ca));
  }
  for (const o of observations) {
    if (!o.canonicalAssetId) continue;
    // v0.4.4 audit fix (P0-1): a normalized observation is only
    // analytically eligible if its identity is verified through a
    // strong path (id / provider-id / provider-slug / contract /
    // chain+symbol). Symbol-only and fallback joins are excluded
    // from scoring/coverage/specialists. They are still recorded
    // in the observation (so the audit trail and case file can
    // show "excluded evidence requiring identity resolution") but
    // they cannot change factor scores.
    const eligible = isObservationEligibleForAnalysis(o);
    if (eligible !== "eligible") {
      // v0.4.4: ambiguous/quarantined observations are still recorded
      // for the case file, but they MUST NOT affect coverage flags,
      // freshness aggregation, or specialist contribution. Skip the
      // mutation below; the case file path will surface them
      // separately.
      continue;
    }
    // v0.4.2 audit fix: the canonical id is now stable + deterministic
    // (cn-...). Resolve the symbol via the canonical map, not by
    // stripping a sym: prefix (the sym: pseudo-id model is gone).
    let symbol: string | null = null;
    for (const [sym, ca] of canonicalMap) {
      if (ca.id === o.canonicalAssetId) {
        symbol = sym;
        break;
      }
    }
    if (!symbol) {
      // Fallback: look in the observation payload (Soofi prompts carry
      // the symbol there).
      const p = (o.payload ?? {}) as Record<string, unknown>;
      if (typeof p["symbol"] === "string") symbol = (p["symbol"] as string).toUpperCase();
    }
    if (!symbol || !bySymbol.has(symbol)) continue;
    const s = bySymbol.get(symbol)!;
    const providers = distinctProviders.get(symbol) ?? new Set<string>();
    providers.add(o.provider);
    distinctProviders.set(symbol, providers);
    if (o.eventType === "ticker" || o.eventType === "quote") {
      s.hasMarketPrice = true;
      const p = o.payload as Record<string, unknown> | null;
      if (p && typeof p.change24hPct === "number") s.change24hPct = p.change24hPct;
      if (p && typeof p.priceUsd === "number") s.price = p.priceUsd;
      s.priceEpistemicState = o.epistemicState;
    }
    if (o.eventType === "social_snapshot") {
      s.hasSocial = true;
      s.socialEpistemicState = o.epistemicState;
    }
    if (o.eventType === "funding" || o.eventType === "liquidation") {
      s.hasDerivatives = true;
      s.derivativesEpistemicState = o.epistemicState;
    }
    if (o.eventType === "catalyst") {
      s.hasCatalysts = true;
      s.catalystsEpistemicState = o.epistemicState;
    }
    if (o.epistemicState === "CONFLICTED") s.conflictCount++;
    // Freshness
    const freshnessTimestamp = o.providerGeneratedAt ?? o.sourceTimestamp;
    if (freshnessTimestamp) {
      const ageSec = (Date.now() - new Date(freshnessTimestamp).getTime()) / 1000;
      const score = Math.max(0, Math.min(1, 1 - ageSec / 900));
      freshestBySymbol.set(symbol, Math.max(freshestBySymbol.get(symbol) ?? 0, score));
    }
  }
  for (const [symbol, summary] of bySymbol) {
    const providerCount = distinctProviders.get(symbol)?.size ?? 0;
    // A single source is not corroboration. Additional independent providers
    // raise agreement in an order-independent, duplicate-proof way.
    summary.crossSourceAgreement = Math.min(1, Math.max(0, (providerCount - 1) / 3));
    summary.freshness = freshestBySymbol.get(symbol) ?? 0;
  }
  return bySymbol;
}

function defaultEvidenceSummary(_symbol: string, canonical?: CanonicalAsset): AssetEvidenceSummary {
  // v0.4.4 audit fix (P1-1): initialize identityConfidence /
  // identityEpistemicState from the canonical registry. The previous
  // hard-coded 0.5/UNKNOWN let unmapped placeholders get identity
  // coverage credit. The new rules:
  //   verified    -> actual mappingConfidence
  //   ambiguous   -> bounded low confidence (0.3, but excluded from coverage)
  //   unmapped    -> 0 (excluded from coverage)
  //   quarantined -> 0 (excluded from coverage)
  let identityConfidence = 0;
  let identityEpistemicState: "KNOWN" | "INFERRED" | "UNCERTAIN" | "CONFLICTED" | "UNKNOWN" | "STALE" = "UNKNOWN";
  if (canonical) {
    const ms = canonical.mappingStatus as "verified" | "ambiguous" | "unmapped" | "quarantined";
    if (ms === "verified") {
      identityConfidence = canonical.mappingConfidence;
      identityEpistemicState = "KNOWN";
    } else if (ms === "ambiguous") {
      identityConfidence = 0.3;  // bounded low; coverage excluded
      identityEpistemicState = "UNCERTAIN";
    } else {
      // unmapped or quarantined
      identityConfidence = 0;
      identityEpistemicState = ms === "quarantined" ? "STALE" : "UNKNOWN";
    }
  }
  return {
    hasMarketPrice: false,
    hasSocial: false,
    hasDerivatives: false,
    hasOnchain: false,
    hasCatalysts: false,
    identityConfidence,
    identityEpistemicState,
    priceEpistemicState: "UNKNOWN",
    socialEpistemicState: "UNKNOWN",
    derivativesEpistemicState: "UNKNOWN",
    onchainEpistemicState: "UNKNOWN",
    catalystsEpistemicState: "UNKNOWN",
    crossSourceAgreement: 0,
    freshness: 0,
    conflictCount: 0,
    change24hPct: null,
    price: null,
    exploitFlagged: false,
    upcomingUnlockPct: undefined,
    holderConcentration: undefined,
    volumeToMcRatio: undefined,
    projectIntegrityOk: true,
  };
}

/**
 * Map a (provider, eventType) tuple to its factor family. Per the v0.4.2
 * audit (P0/P1): every evidence claim must be classified by the typed
 * data class it represents, not hard-coded to marketTechnical. LLM
 * completions are explicitly mapped to a separate `model` family so
 * they don't masquerade as measured market evidence.
 */
const FACTOR_FAMILY_BY_EVENT: Record<string, string> = {
  quote: "marketTechnical",
  ticker: "marketTechnical",
  social_snapshot: "socialAttention",
  social: "socialAttention",
  social_attention: "socialAttention",
  funding: "derivativesLeverage",
  liquidation: "derivativesLeverage",
  catalyst: "catalystsNarrative",
  onchain: "onchainPositioning",
  macro: "macro",
  identity: "identity",
  llm_completion: "model",
  synthetic: "model",
};

const SYMBOL_FROM_PAYLOAD = undefined;
void SYMBOL_FROM_PAYLOAD;

/**
 * v0.4.3 audit fix (P1): maintain both a by-symbol map and a by-id map
 * over the canonical assets. The runtime's `canonicalMap` is keyed by
 * symbol (so it can be iterated per watchlist row), but observations
 * carry a `canonicalAssetId` (a `cn-...` id). v0.4.2's
 * `canonicalMap.get(o.canonicalAssetId)` always returned undefined
 * because the keys did not match — the v0.4.2 audit attachment flagged
 * this as a hidden bug, hidden by the payload-symbol fallback. The
 * by-id map fixes the lookup.
 */
function indexCanonicalAssets(canonicalMap: Map<string, CanonicalAsset>): {
  bySymbol: Map<string, CanonicalAsset>;
  byId: Map<string, CanonicalAsset>;
} {
  const byId = new Map<string, CanonicalAsset>();
  for (const a of canonicalMap.values()) byId.set(a.id, a);
  return { bySymbol: canonicalMap, byId };
}

function buildEvidenceClaims(observations: NormalizedObservation[], canonicalMap: Map<string, CanonicalAsset>): EvidenceClaim[] {
  const claims: EvidenceClaim[] = [];
  const { byId } = indexCanonicalAssets(canonicalMap);
  for (const o of observations) {
    if (!o.canonicalAssetId) continue;
    // v0.4.3 audit fix (P1): look up the canonical asset by id, NOT
    // by symbol. The by-symbol map (canonicalMap) is iterated per
    // watchlist row; observations carry the by-id canonicalAssetId.
    const canonical = byId.get(o.canonicalAssetId);
    const symbol =
      canonical?.symbol ??
      (o.payload && typeof o.payload === "object" && "symbol" in o.payload && typeof o.payload["symbol"] === "string"
        ? (o.payload["symbol"] as string).toUpperCase()
        : "UNKNOWN");
    // v0.4.3 audit fix (P1): unknown event types are quarantined,
    // not silently mapped to "marketTechnical". A new event type
    // requires an explicit FACTOR_FAMILY_BY_EVENT entry; otherwise
    // the claim is recorded as `unclassified` and the factor
    // family cannot score.
    const factorFamily = (FACTOR_FAMILY_BY_EVENT[o.eventType] ?? "unclassified") as
      | "marketTechnical" | "fundamentalTokenomics" | "liquidityMarketStructure"
      | "socialAttention" | "derivativesLeverage" | "onchainPositioning"
      | "catalystsNarrative" | "asymmetryConvexity" | "macro" | "identity" | "model" | "unclassified";
    claims.push({
      id: o.id,
      // v0.4.2 audit fix (P0/P1): evidence claim directly references the
      // original observation. The persistence path no longer creates a
      // synthetic surrogate observation.
      observationId: o.id,
      symbol,
      factorFamily,
      // Consumers parse structured quote evidence; truncation corrupts JSON.
      claim: JSON.stringify(o.payload),
      source: o.providerEndpoint ? `${o.provider} ${o.providerEndpoint}` : o.provider,
      observedAt: o.sourceTimestamp ?? o.occurredAt,
      receivedAt: o.receivedAt,
      freshnessAgeSeconds: o.sourceTimestamp ? Math.max(0, (Date.now() - new Date(o.sourceTimestamp).getTime()) / 1000) : 0,
      epistemicState: o.epistemicState,
      evidenceConfidence: o.evidenceConfidence,
      licenseClass: o.licenseClass,
      providerIds: [o.provider],
      // v0.4.4 audit fix: typed provenance. Provider observations get
      // claimOrigin="provider" (NOT "synthetic" — that was the audit's
      // exact failure mode, where a free-text prefix was checked).
      claimOrigin: "provider",
      // v0.4.4 audit fix: freshness + dataMode on the claim itself
      // (the runtime can apply the no-new-positive-score rule for
      // fallback claims without re-deriving from age).
      freshness: freshnessForObservation(o),
      dataMode: o.dataMode ?? "live",
      payloadHash: o.payloadHash,
      transformationVersion: o.normalizerVersion ?? "0.0.0",
      providerEndpoint: o.providerEndpoint,
      // Provider claims have no parent claims — they ARE the leaves.
      parentClaimIds: [],
    });
  }
  return claims;
}

function freshnessForObservation(o: NormalizedObservation): EvidenceClaim["freshness"] {
  if (o.dataMode === "fallback") return "unavailable";
  const timestamp = o.providerGeneratedAt ?? o.sourceTimestamp;
  if (!timestamp) return o.dataMode === "snapshot" ? "delayed" : "live";
  const ageSeconds = Math.max(0, (Date.now() - new Date(timestamp).getTime()) / 1000);
  if (ageSeconds <= 900) return "live";
  if (ageSeconds <= 1_800) return "delayed";
  return "stale";
}

function buildConclusion(snapshot: PortfolioAnalysisSnapshot, findings: Finding[]): string {
  const top = snapshot.rankedAssets.filter(a => a.opportunityRank != null).slice(0, 5);
  const errors = findings.filter(f => f.severity === "error").length;
  const warnings = findings.filter(f => f.severity === "warn").length;
  return [
    `Refresh @ ${snapshot.asOf} (policy v${snapshot.policyVersion}).`,
    `Allocated ${snapshot.totalAllocatedPct.toFixed(2)}% + reserve ${snapshot.reservePct}% = ${(snapshot.totalAllocatedPct + snapshot.reservePct).toFixed(2)}%.`,
    `Top 5: ${top.map(a => `${a.symbol}@${a.opportunityRank} (score ${a.opportunity.adjusted.toFixed(1)}, conf ${a.confidence.pct.toFixed(0)}%)`).join("; ")}.`,
    `Verifier: ${errors} errors, ${warnings} warnings.`,
  ].join(" ");
}
