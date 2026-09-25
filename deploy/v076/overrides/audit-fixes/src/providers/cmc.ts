/**
 * CoinMarketCap adapter — fixture-driven only in slice 1.
 *
 * CMC is the canonical identity source. In slice 1 we only validate that
 * fixtures with documented shape parse correctly. Live acquisition is slice 4.
 *
 * Reference shape: docs/ARCHITECTURE.md and research_sources/Crypto_Application_Data_Streaming_Stack.md
 *
 * IMPORTANT: docs/KNOWN_GAPS.md + the prompt say "Do not invent a CoinMarketCap
 * endpoint called `Mindshare` if official supported access is not documented."
 * This adapter reads documented `community/trending` data only, not `mindshare`.
 */

import { z } from "zod";
import {
  type CanonicalAsset,
  type NormalizedObservation,
  type ProviderHealth,
  type FreshnessState,
} from "../domain/index.js";
import {
  type ProviderAdapter,
  type FetchResult,
  AdapterContractError,
  AdapterNormalizationError,
} from "./types.js";
import { loadFixture, makeIdempotencyKey } from "./identity.js";
import { resolveCanonicalIdentity, lookupCanonicalIdentity } from "./canonicalResolve.js";
import { randomUUID } from "node:crypto";
import { normalizeCmcV3Shape } from "./cmcQuoteShape.js";

const CMC_RAW_SCHEMA_VERSION = "1.0.0";
const CMC_NORMALIZER_VERSION = "0.1.0";
const CMC_LIVE_TIMEOUT_MS = 10_000;
const CMC_LIVE_SYMBOLS = "BTC,ETH,SOL";

/** Documented CMC `/v1/cryptocurrency/quotes/latest` response (subset). */
const cmcQuoteSchema = z.object({
  data: z.record(z.string(), z.object({
    id: z.number().int(),
    name: z.string(),
    symbol: z.string(),
    quote: z.record(z.string(), z.object({
      price: z.number().nullable().optional(),
      percent_change_24h: z.number().nullable().optional(),
      market_cap: z.number().nullable().optional(),
      volume_24h: z.number().nullable().optional(),
      last_updated: z.string().nullable().optional(),
    })).optional(),
  })).optional(),
  status: z.object({
    error_code: z.number().optional(),
    error_message: z.string().nullable().optional(),
  }).optional(),
});

export interface CMCAdapterConfig {
  baseUrl: string;
  apiKey?: string;
  fixturePath?: string;
  /** Force fixture mode (no network). Defaults to true when no live key is configured. */
  forceFixtures?: boolean;
  /** Live-mode config. When set AND forceFixtures===false, fetch() hits the live API. */
  liveConfig?: {
    apiKey?: string;
    keyless?: boolean;
    timeoutMs?: number;
  };
}

export class CMCAdapter implements ProviderAdapter<CMCAdapterConfig> {
  readonly id = "cmc";
  readonly capabilities = {
    provider: "cmc",
    displayName: "CoinMarketCap",
    requiresApiKey: false,
    supported: "live" as const,
    dataClasses: ["market" as const, "identity" as const, "social" as const],
    notes: "Live quotes support paid-key and documented keyless-v3 access. Use community/trending data only (do NOT invent a `mindshare` endpoint).",
  };

  private config: CMCAdapterConfig = { baseUrl: "https://pro-api.coinmarketcap.com" };

  /** Most recent network error from the live fetch (set when the live call fails). */
  lastNetworkError?: string;
  private lastQuoteAt?: number;

  configure(config: CMCAdapterConfig): void {
    this.config = config;
  }

  /**
   * Switch this adapter into live mode for the current process. Stores the key
   * in `liveConfig.apiKey` and flips `forceFixtures: false`. The runtime should
   * call this only when a real CMC key is available; otherwise the fixture path
   * remains the safe default.
   */
  setLiveMode(apiKey: string): void {
    this.config.forceFixtures = false;
    this.config.liveConfig = {
      apiKey,
      timeoutMs: this.config.liveConfig?.timeoutMs ?? CMC_LIVE_TIMEOUT_MS,
    };
  }

  validateRaw(raw: unknown, ctx: { endpoint: string }): unknown {
    const parsed = cmcQuoteSchema.safeParse(normalizeCmcV3Shape(raw));
    if (!parsed.success) {
      throw new AdapterContractError(this.id, ctx.endpoint, parsed.error.message.slice(0, 200), undefined);
    }
    if (parsed.data.status?.error_code && parsed.data.status.error_code !== 0) {
      throw new AdapterContractError(this.id, ctx.endpoint, parsed.data.status.error_message ?? "unknown", undefined);
    }
    return parsed.data;
  }

  normalize(
    raw: unknown,
    ctx: { canonicalAssets: Map<string, CanonicalAsset>; endpoint: string; receivedAt: string; rawSchemaVersion: string },
  ): NormalizedObservation[] {
    const validated = this.validateRaw(raw, ctx);
    const out: NormalizedObservation[] = [];
    const data = (validated as z.infer<typeof cmcQuoteSchema>).data ?? {};
    // v0.4.3 audit fix (P0-1, P0-2): use the typed providerIds lookup. CMC's
    // documented provider-native identity is the NUMERIC id, so the
    // resolver tries `cmcNumericId` first. If the registered canonical
    // asset has the numeric id, the match is `verified`; if not, the
    // resolver falls through to slug lookup, then chain+symbol, then
    // symbol-only (which is now `ambiguous`, never `verified`).
    //
    // The resolver's `mappingStatus` and `mappingConfidence` flow into
    // the observation as `quarantineState` and `evidenceConfidence`. A
    // symbol-only join therefore cannot appear as "verified" evidence.
    for (const [responseKey, entry] of Object.entries(data)) {
      const symbol = entry.symbol?.toUpperCase();
      if (!symbol) continue;
      // v0.4.4 audit fix (P0-2): CMC's response-map key is NOT the
      // numeric CMC id. CMC's documented contract:
      //   symbol=BTC,ETH -> data keys "BTC", "ETH" (TICKER)
      //   id=1,1027     -> data keys "1", "1027"  (NUMERIC ID)
      // Use the entry's own `id` field as the providerAssetId. That
      // id is present in both v3 responses (id=1) and the symbol
      // alias response (where the key was the symbol, but entry.id
      // is still the numeric id). This way the typed providerIds
      // lookup against `cmcNumericId` is correct.
      const cmcNumericId = String(entry.id ?? responseKey);
      // Prefer the registered canonical asset (preserves stable id across
      // refreshes). Fall back to the deterministic resolver (still stable).
      const existing = lookupCanonicalIdentity(
        { provider: "cmc", providerAssetId: cmcNumericId, symbol },
        Array.from(ctx.canonicalAssets.values()),
      );
      const resolved = existing ?? resolveCanonicalIdentity({ provider: "cmc", providerAssetId: cmcNumericId, symbol });
      const assetId = resolved.canonicalAssetId;
      const usdQuote = entry.quote?.USD;
      out.push({
        id: randomUUID(),
        idempotencyKey: makeIdempotencyKey({
          provider: this.id,
          providerEventId: cmcNumericId,
          canonicalAssetId: assetId,
          eventType: "quote",
          sourceTimestamp: usdQuote?.last_updated ?? undefined,
        }),
        provider: this.id,
        providerEventId: cmcNumericId,
        eventType: "quote",
        schemaVersion: CMC_RAW_SCHEMA_VERSION,
        canonicalAssetId: assetId,
        // v0.4.3 audit fix (P0-2): quarantineState now reflects the
        // resolver's mappingStatus, not a hard-coded "verified". An
        // ambiguous/symbol-only join is quarantined before it can reach
        // the scoring layer.
        quarantineState: resolved.mappingStatus,
        sourceTimestamp: usdQuote?.last_updated ?? undefined,
        occurredAt: usdQuote?.last_updated ?? ctx.receivedAt,
        receivedAt: ctx.receivedAt,
        retrievedAt: ctx.receivedAt,
        normalizerVersion: CMC_NORMALIZER_VERSION,
        // v0.4.3 fix: record the match method + resolver confidence so
        // downstream consumers (scoring, specialists, audit) can see how
        // the canonical id was derived.
        identityMatchMethod: resolved.matchMethod,
        payload: {
          symbol,
          cmcId: Number(cmcNumericId),
          priceUsd: usdQuote?.price ?? null,
          change24hPct: usdQuote?.percent_change_24h ?? null,
          marketCapUsd: usdQuote?.market_cap ?? null,
          volume24hUsd: usdQuote?.volume_24h ?? null,
          identityMatchMethod: resolved.matchMethod,
          mappingConfidence: resolved.mappingConfidence,
        },
        epistemicState: usdQuote?.price == null ? "UNKNOWN" : "KNOWN",
        // v0.4.3 fix: evidenceConfidence is bounded above by the
        // resolver's mapping confidence. A symbol-only join cannot score
        // higher than 0.7 even if the price is fresh.
        evidenceConfidence: usdQuote?.price == null ? 0 : Math.min(1, resolved.mappingConfidence),
        licenseClass: "display-only",
      });
    }
    if (this.config.forceFixtures === false && this.config.liveConfig && !this.lastNetworkError) {
      const times = out.filter(o => Number((o.payload as any).priceUsd) > 0)
        .map(o => Date.parse(o.sourceTimestamp ?? "")).filter(Number.isFinite);
      this.lastQuoteAt = times.length ? Math.max(...times) : undefined;
    }
    return out;
  }

  async fetch(ctx: { canonicalAssets: Map<string, CanonicalAsset> }): Promise<FetchResult<unknown>[]> {
    const receivedAt = new Date().toISOString();
    const liveConfig = this.config.liveConfig;
    const apiKey = liveConfig?.apiKey;
    if (this.config.forceFixtures === false && liveConfig) {
      // v0.4.4 audit fix (P0-2): CMC's documented production contract
      // recommends /v3/cryptocurrency/quotes/latest and querying by
      // CMC numeric ID, not by symbol. The numeric id is the safer
      // production identity (ticker symbols collide across chains).
      // The current canonical-mappings.json carries `cmcNumericId`
      // for verified assets. We build the `id=` parameter from the
      // canonical assets registered in the runtime.
      const ids = Array.from(ctx.canonicalAssets.values())
        .map(a => a.providerIds?.cmcNumericId)
        .filter((id): id is string => typeof id === "string" && id.length > 0);
      const idParam = ids.length > 0
        ? `id=${ids.join(",")}`
        : `symbol=${encodeURIComponent(CMC_LIVE_SYMBOLS)}`;  // fallback
      const url = `${this.config.baseUrl}/v3/cryptocurrency/quotes/latest?${idParam}&convert=USD&skip_invalid=true`;
      const timeoutMs = liveConfig.timeoutMs ?? CMC_LIVE_TIMEOUT_MS;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      let response: Response;
      try {
        response = await fetch(url, {
          method: "GET",
          headers: apiKey ? { "X-CMC_PRO_API_KEY": apiKey } : { Accept: "application/json" },
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timer);
      }
      if (response.status === 401 || response.status === 403) {
        // Auth-class failure: surface immediately, do NOT fall back to fixtures.
        // The reason is prefixed `auth:` so callers can classify it.
        this.lastNetworkError = undefined;
        throw new AdapterNormalizationError(
          this.id,
          `auth: CMC API responded ${response.status}`,
          undefined,
        );
      }
      if (!response.ok) {
        // Other HTTP error: graceful degradation to fixture path.
        this.lastNetworkError = `cmc http ${response.status}`;
        return this.fetchFromFixture(receivedAt, true);
      }
      const raw = await response.json();
      this.lastNetworkError = undefined;
      // Raw shape from the live endpoint matches the documented CMC schema
      // already validated by validateRaw(); pass through unchanged.
      return [{
        raw,
        data: raw,
        receivedAt,
        endpoint: "quotes/latest",
        dataMode: "live",
      }];
    }
    // No live key configured, or forceFixtures===true: use the fixture path.
    return this.fetchFromFixture(receivedAt, false);
  }

  /** Fixture path: load the configured fixture file (or return a null row). */
  private async fetchFromFixture(receivedAt: string, isLiveFallback: boolean): Promise<FetchResult<unknown>[]> {
    if (!this.config.fixturePath) {
      return [{ raw: null, data: null, receivedAt }];
    }
    const raw = await loadFixture(this.config.fixturePath);
    return [{
      raw,
      data: raw,
      receivedAt,
      endpoint: "quotes/latest",
      // v0.4.4 audit fix (P0-6): if the caller is in live mode and
      // we're loading the fixture, mark dataMode as "fallback" so
      // the runtime can mark the stage degraded. Otherwise this is a
      // snapshot (operator chose fixture mode deliberately).
      dataMode: isLiveFallback ? "fallback" : "snapshot",
      fallbackReason: isLiveFallback
        ? `live http ${this.lastNetworkError ?? "no-response"}`
        : undefined,
    }];
  }

  health(): ProviderHealth {
    let status: ProviderHealth["status"];
    if (this.lastNetworkError) {
      status = "degraded";
    } else if (this.config.forceFixtures === false && this.config.liveConfig) {
      status = "connected";
    } else if (this.config.fixturePath) {
      status = "snapshot";
    } else {
      status = "credentials-needed";
    }
    return {
      provider: this.id,
      status,
      reconnectAttempt: 0,
      lastErrorAt: this.lastNetworkError ? new Date().toISOString() : undefined,
      lastErrorClass: this.lastNetworkError ? "network" : undefined,
      freshness: this.freshness(),
    };
  }

  freshness(): FreshnessState {
    if (this.config.forceFixtures !== false || !this.config.liveConfig || this.lastNetworkError || this.lastQuoteAt === undefined) return "unavailable";
    return Date.now() - this.lastQuoteAt <= 6 * 60 * 60 * 1000 ? "live" : "stale";
  }
}
