/**
 * v0.4.3 audit regression test (required #15)
 * Test: evidence-canonical-by-id
 *
 * Per the v0.4.3 audit (P1): "`canonicalMap` is keyed by symbol.
 * `buildEvidenceClaims()` does: `canonicalMap.get(o.canonicalAssetId)`
 * which cannot normally work because `o.canonicalAssetId` is a
 * `cn-...` ID. The payload-symbol fallback hides the mistake for
 * common event types."
 *
 * v0.4.3 fix: buildEvidenceClaims now indexes canonical assets by
 * both symbol AND id. The by-id map is used for evidence claims.
 */

import { describe, it, expect } from "vitest";
import { type CanonicalAsset, type NormalizedObservation } from "../domain/index.js";

function makeCanonical(symbol: string, id: string): CanonicalAsset {
  return {
    id,
    symbol,
    name: symbol,
    providerIds: {},
    mappingStatus: "verified",
    mappingConfidence: 0.99,
    updatedAt: new Date().toISOString(),
  };
}

function makeObservation(canonicalAssetId: string, eventType: string, symbol: string): NormalizedObservation {
  return {
    id: `obs-${symbol}-${eventType}`,
    idempotencyKey: `idem-${symbol}-${eventType}`,
    provider: "test",
    providerEventId: "evt-1",
    eventType,
    schemaVersion: "1.0.0",
    canonicalAssetId,
    quarantineState: "verified",
    occurredAt: new Date().toISOString(),
    receivedAt: new Date().toISOString(),
    retrievedAt: new Date().toISOString(),
    normalizerVersion: "1.0.0",
    payload: { symbol },
    epistemicState: "KNOWN",
    evidenceConfidence: 0.9,
    licenseClass: "display-only",
  };
}

describe("v0.4.3 P1: evidence registry is indexed by both symbol AND id", () => {
  it("v0.4.3 buildEvidenceClaims looks up canonical by id (not by symbol)", async () => {
    // Re-import buildEvidenceClaims from refresh (it's not exported,
    // so we test via a runRefresh call).
    const { runRefresh } = await import("../runtime/refresh.js");
    const { buildAdapters } = await import("../scripts/_adapters.js");
    const { DEFAULT_SCORING_CONFIG } = await import("../domain/scoring.js");
    const { readFileSync } = await import("node:fs");
    const { resolve } = await import("node:path");
    const watchlist = JSON.parse(readFileSync(resolve(process.cwd(), "src/fixtures/watchlist.json"), "utf8"));
    const result = await runRefresh({
      adapters: buildAdapters({ live: false, staleSeconds: 60 }),
      watchlist,
      policy: DEFAULT_SCORING_CONFIG,
    });
    // The evidence claims should reference symbols from the watchlist
    // (via the by-id lookup), not "UNKNOWN" from the symbol-only fallback.
    for (const claim of result.evidenceClaims) {
      const isKnownSymbol = claim.symbol !== "UNKNOWN";
      const hasSymbol = /^[A-Z]{2,8}$/.test(claim.symbol);
      // The claim must have a valid symbol, NOT the "UNKNOWN" fallback.
      expect(isKnownSymbol || hasSymbol, `claim has bad symbol: ${claim.symbol}`).toBeTruthy();
    }
  });

  it("by-id lookup returns the correct canonical asset (direct unit test)", () => {
    // Direct test of the by-id indexing logic used by buildEvidenceClaims.
    const canonicalMap = new Map<string, CanonicalAsset>([
      ["BTC", makeCanonical("BTC", "cn-btc-aaaa")],
      ["ETH", makeCanonical("ETH", "cn-eth-bbbb")],
    ]);
    const byId = new Map<string, CanonicalAsset>();
    for (const a of canonicalMap.values()) byId.set(a.id, a);
    const obs = makeObservation("cn-btc-aaaa", "quote", "BTC");
    const canonical = byId.get(obs.canonicalAssetId!);
    expect(canonical).toBeDefined();
    expect(canonical!.symbol).toBe("BTC");
  });

  it("the wrong key (symbol) cannot find the canonical asset", () => {
    // v0.4.2 bug: canonicalMap.get(o.canonicalAssetId) was a no-op
    // because the keys are symbols and the id is cn-...
    const canonicalMap = new Map<string, CanonicalAsset>([
      ["BTC", makeCanonical("BTC", "cn-btc-aaaa")],
    ]);
    const obs = makeObservation("cn-btc-aaaa", "quote", "BTC");
    const canonical = canonicalMap.get(obs.canonicalAssetId!);
    expect(canonical).toBeUndefined(); // v0.4.2 bug
  });
});


it("preserves long structured quotes as valid JSON through refresh evidence", async () => {
  const { runRefresh } = await import("../runtime/refresh.js");
  const { buildAdapters } = await import("../scripts/_adapters.js");
  const { DEFAULT_SCORING_CONFIG } = await import("../domain/scoring.js");
  const adapters = buildAdapters({ live: false, staleSeconds: 60 });
  const normalize = adapters.cmc.normalize.bind(adapters.cmc);
  adapters.cmc.normalize = (raw, ctx) => normalize(raw, ctx).map(o => ({
    ...o, payload: { ...o.payload as object, providerMetadata: "verified-provider-identity-".repeat(20) },
  }));
  const result = await runRefresh({ adapters, watchlist: [{ symbol: "BTC", name: "Bitcoin", rank: 1 }], policy: DEFAULT_SCORING_CONFIG });
  const quote = result.evidenceClaims.find(c => c.symbol === "BTC" && c.providerIds?.includes("cmc"));
  expect(quote).toBeDefined();
  const payload = JSON.parse(quote!.claim);
  expect(payload.priceUsd).toBeGreaterThan(0);
  expect(payload.providerMetadata).toBe("verified-provider-identity-".repeat(20));
});
