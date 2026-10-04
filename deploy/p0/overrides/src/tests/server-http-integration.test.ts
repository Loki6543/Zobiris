import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";

type JsonRecord = Record<string, any>;

describe("v0.4.13 watchlist-only HTTP boundary", () => {
  let server: Server;
  let baseUrl: string;
  let workDir: string;
  const originalEnv = {
    NODE_ENV: process.env.NODE_ENV,
    ZOBIRIS_DB_PATH: process.env.ZOBIRIS_DB_PATH,
    ZOBIRIS_ALLOW_ANONYMOUS_REFRESH:
      process.env.ZOBIRIS_ALLOW_ANONYMOUS_REFRESH,
    ZOBIRIS_ALLOW_LIVE_PROVIDERS: process.env.ZOBIRIS_ALLOW_LIVE_PROVIDERS,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    ZOBIRIS_REFRESH_TOKEN: process.env.ZOBIRIS_REFRESH_TOKEN,
  };

  beforeAll(async () => {
    workDir = mkdtempSync(join(tmpdir(), "zobiris-http-"));
    process.env.NODE_ENV = "development";
    process.env.ZOBIRIS_DB_PATH = join(workDir, "integration.db");
    process.env.ZOBIRIS_ALLOW_ANONYMOUS_REFRESH = "1";
    process.env.ZOBIRIS_ALLOW_LIVE_PROVIDERS = "0";
    process.env.OPENAI_API_KEY = "";
    process.env.ZOBIRIS_REFRESH_TOKEN = "test-refresh-token";
    vi.resetModules();
    const { createZobirisServer } = await import("../server/server.js");
    server = createZobirisServer();
    await new Promise<void>((resolve, reject) => {
      server.once("error", reject);
      server.listen(0, "127.0.0.1", resolve);
    });
    const address = server.address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  afterAll(async () => {
    server.closeAllConnections();
    await new Promise<void>((resolve) => server.close(() => resolve()));
    rmSync(workDir, { recursive: true, force: true });
    for (const [key, value] of Object.entries(originalEnv)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });

  it("serves the built operator console and health endpoint", async () => {
    const health = await fetch(`${baseUrl}/api/health`);
    expect(health.status).toBe(200);
    expect(await health.json()).toMatchObject({ status: "ok" });

    const index = await fetch(`${baseUrl}/`);
    expect(index.status).toBe(200);
    expect(await index.text()).toContain("Zobiris Intelligence Engine");
  });

  it("serves persisted P0 evidence without sample backtest claims and protects diagnostics", async () => {
    const integrity = await fetch(`${baseUrl}/api/intelligence/research-integrity`).then(r => r.json());
    expect(integrity.provenance.source).toBe('PERSISTED_P0_EVIDENCE');
    expect(integrity.researchIntegrity).toMatchObject({ experimentCount: 0, promotable: false, overallStatus: 'UNKNOWN' });
    expect(integrity.researchIntegrity.deflatedSharpe.value).toBeNull();
    const overview = await fetch(`${baseUrl}/api/intelligence/overview`).then(r => r.json());
    expect(overview.researchIntegrity).toEqual(integrity.researchIntegrity);
    expect(overview.researchEvidence.version).toBe('0.3.0');
    expect((await fetch(`${baseUrl}/api/research/provenance`)).status).toBe(401);
    const diagnostic = await fetch(`${baseUrl}/api/research/provenance`, { headers: { authorization: 'Bearer test-refresh-token' } });
    expect(diagnostic.status).toBe(200);
    expect((await diagnostic.json()).evidence.status).toBe('AWAITING_EVIDENCE');
    const health = await fetch(`${baseUrl}/api/health`).then(r => r.json());
    expect(health.researchProvenance).toEqual({ version: '0.3.0', status: 'AWAITING_EVIDENCE' });
  });

  it("protects private account and diagnostic endpoints", async () => {
    for (const path of ["/api/account", "/api/profit-protection", "/api/audit", "/api/db-info"]) {
      const anonymous = await fetch(`${baseUrl}${path}`);
      expect(anonymous.status).toBe(401);
      const authorized = await fetch(`${baseUrl}${path}`, {
        headers: { authorization: "Bearer test-refresh-token" },
      });
      expect(authorized.status).not.toBe(401);
    }
  });

  it("keeps shadow diagnostics behind the operator token", async () => {
    const anonymous = await fetch(`${baseUrl}/api/prediction/shadow?symbol=SOL`);
    expect(anonymous.status).toBe(401);
    const authorized = await fetch(`${baseUrl}/api/prediction/shadow?symbol=SOL`, {
      headers: { authorization: "Bearer test-refresh-token" },
    });
    expect(authorized.status).toBe(200);
    expect(await authorized.json()).toMatchObject({ mode: "SHADOW", authority: "ABSTAIN", forecasts: [] });
  });

  it("refreshes, atomically persists, and rehydrates an evidence-rich case file", async () => {
    const firstResponse = await fetch(`${baseUrl}/api/refresh`, {
      method: "POST",
    });
    expect(firstResponse.status).toBe(200);
    const first = (await firstResponse.json()) as JsonRecord;
    expect(first).toMatchObject({
      observationCount: 18,
      evidenceClaimCount: 18,
      live: false,
    });
    expect(first.outboxIds).toHaveLength(1);

    const anonymousLatest = await fetch(`${baseUrl}/api/snapshot/latest`);
    expect(anonymousLatest.status).toBe(200);
    const anonymousSnapshot = (await anonymousLatest.json()) as JsonRecord;
    expect(anonymousSnapshot.snapshot.portfolioDependency).toBeNull();

    const latestResponse = await fetch(`${baseUrl}/api/snapshot/latest`, {
      headers: { authorization: "Bearer test-refresh-token" },
    });
    expect(latestResponse.status).toBe(200);
    const latest = (await latestResponse.json()) as JsonRecord;
    expect(latest.snapshot.id).toBe(first.snapshotId);
    expect(latest.snapshot.sessionId).toBe(first.sessionId);
    expect(latest.session.id).toBe(first.sessionId);
    const dependency = JSON.parse(latest.snapshot.portfolioDependency);
    expect(dependency.grossCurrentExposureUsd).toBeGreaterThan(200);
    expect(dependency.assets.map((a: any) => a.symbol)).toEqual(expect.arrayContaining(["BTC", "SOL", "ETH", "AAVE", "KAS", "EGLD", "LINK", "QNT", "HBAR", "XRP"]));
    expect(dependency.grossPostFillExposureUsd).toBeCloseTo(dependency.grossCurrentExposureUsd + 102, 2);
    const publicStrategyResponse = await fetch(`${baseUrl}/api/strategy21`);
    expect(publicStrategyResponse.status).toBe(200);
    const publicStrategy = await publicStrategyResponse.json() as JsonRecord;
    expect(publicStrategy.strategy21.portfolioDependency).toBeNull();
    expect(publicStrategy.strategy21.privateAccountSynced).toBe(false);

    const strategyResponse = await fetch(`${baseUrl}/api/strategy21`, {
      headers: { authorization: "Bearer test-refresh-token" },
    });
    const strategy = await strategyResponse.json() as JsonRecord;
    expect(strategy.asOf).toBe(new Date(latest.snapshot.asOf).toISOString());
    expect(strategy.strategy21.fundedCashUsd).toBe(713.74);
    expect(strategy.strategy21.freeCashUsd).toBe(611.74);
    const stages = JSON.parse(latest.session.stages) as Array<{
      index: number;
      status: string;
    }>;
    expect(stages.find((stage) => stage.index === 18)?.status).toBe(
      "succeeded",
    );

    const secondResponse = await fetch(`${baseUrl}/api/refresh`, {
      method: "POST",
    });
    expect(secondResponse.status).toBe(200);

    const assetResponse = await fetch(`${baseUrl}/api/asset/BTC`);
    expect(assetResponse.status).toBe(200);
    const asset = (await assetResponse.json()) as JsonRecord;
    expect(asset.caseFile.symbol).toBe("BTC");
    expect(asset.caseFile.recentHistory).toHaveLength(1);
    expect(asset.caseFile.changeSincePrevious).not.toBeNull();
    expect(asset.caseFile.evidence.length).toBeGreaterThan(0);
    // Structured market evidence must survive persistence as complete JSON.
    const marketClaims = asset.evidence.filter((claim: JsonRecord) => claim.factorFamily === "marketTechnical");
    expect(marketClaims.length).toBeGreaterThan(0);
    for (const claim of marketClaims) {
      expect(() => JSON.parse(claim.claim)).not.toThrow();
      expect(JSON.parse(claim.claim).priceUsd).toBeGreaterThan(0);
    }
    expect(
      asset.caseFile.evidence.every(
        (item: JsonRecord) => typeof item.dataMode === "string",
      ),
    ).toBe(true);
    expect(
      asset.caseFile.evidence.every(
        (item: JsonRecord) => typeof item.eligibility === "string",
      ),
    ).toBe(true);
    expect(
      asset.evidence.every(
        (claim: JsonRecord) => typeof claim.payloadHash === "string",
      ),
    ).toBe(true);
  }, 20_000);

  it("fails truthfully when the optional OpenAI Challenger is not configured", async () => {
    const response = await fetch(`${baseUrl}/api/agents/challenge`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer test-refresh-token",
      },
      body: JSON.stringify({}),
    });
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      error: "OpenAI challenger is not configured",
    });
  });

  it("exposes only the canonical watchlist as the asset universe", async () => {
    const watchlistResponse = await fetch(`${baseUrl}/api/watchlist`);
    expect(watchlistResponse.status).toBe(200);
    const watchlist = (await watchlistResponse.json()) as JsonRecord;
    expect(watchlist.source).toBe(
      "https://coinmarketcap.com/?type=coins&tableRankBy=watchlist&watchListId=6a9a95c387e5a45cc1f40d5e",
    );
    expect(watchlist.watchlist.length).toBeGreaterThan(0);
    expect(watchlist.watchlist.map((a: any) => a.symbol)).toEqual(expect.arrayContaining(["AAVE", "HBAR", "XRP"]));
    expect(watchlist.watchlist[0]).toMatchObject({
      rank: 1,
      symbol: "BTC",
      name: "Bitcoin",
    });

    const outsideUniverse = await fetch(`${baseUrl}/api/asset/NOTINLIST`);
    expect(outsideUniverse.status).toBe(404);
    expect(await outsideUniverse.json()).toEqual({
      error: "NOTINLIST is not in the active watchlist",
    });
  });

  it("serves shadow-only v0.7.0 intelligence endpoints", async () => {
    const paths = [
      "/api/intelligence/overview",
      "/api/intelligence/research-integrity",
      "/api/intelligence/relative-opportunity",
      "/api/intelligence/ecosystem-graph",
      "/api/intelligence/execution-readiness",
    ];
    for (const path of paths) {
      const response = await fetch(`${baseUrl}${path}`);
      expect(response.status).toBe(200);
      expect(await response.json()).toMatchObject({
        authority: "SHADOW_ONLY_NO_TRADING_AUTHORITY",
      });
    }
  });

  it("returns a typed 404 for unknown API routes", async () => {
    const response = await fetch(`${baseUrl}/api/not-a-route`);
    expect(response.status).toBe(404);
    expect(await response.json()).toMatchObject({
      error: "no route for GET /api/not-a-route",
    });
  });
});
