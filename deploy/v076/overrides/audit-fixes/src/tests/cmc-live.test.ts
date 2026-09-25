/**
 * CMC live-mode tests.
 *
 * These tests exercise the live HTTP path in CMCAdapter.fetch() without making
 * any real network calls. We use vi.stubGlobal('fetch', mockFn) to intercept
 * the global fetch and return canned responses.
 *
 * Coverage:
 *  - When apiKey is set + forceFixtures===false, fetch() attempts HTTP.
 *  - When apiKey is missing + forceFixtures===false, fetch() falls back to fixture.
 *  - When the API returns 401, fetch() throws AdapterNormalizationError whose
 *    reason is classified as `auth:` (caller-classified).
 *  - When the API returns 200, the resulting raw payload flows through the
 *    unchanged validateRaw/normalize path and yields a valid observation.
 *  - setLiveMode(apiKey) flips forceFixtures to false and stores the key in
 *    liveConfig (smoke test for the runtime API).
 *  - A 5xx HTTP response gracefully degrades to the fixture path.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { resolve } from "node:path";
import { CMCAdapter } from "../providers/cmc.js";
import {
  AdapterContractError,
  AdapterNormalizationError,
} from "../providers/types.js";
import type { CanonicalAsset } from "../domain/canonicalAsset.js";

const FIXTURE_DIR = resolve(process.cwd(), "src/providers/fixtures");
const FIXTURE_PATH = `${FIXTURE_DIR}/cmc-quote.valid.json`;

/** A 200 OK response mirroring the documented CMC quotes/latest shape. */
function cmc200Response(): unknown {
  return {
    status: { error_code: 0 },
    data: {
      "1": {
        id: 1,
        name: "Bitcoin",
        symbol: "BTC",
        quote: {
          USD: {
            price: 70000.00,
            percent_change_24h: 2.5,
            market_cap: 1400000000000,
            volume_24h: 40000000000,
            last_updated: "2026-08-22T02:00:00.000Z",
          },
        },
      },
      "1027": {
        id: 1027,
        name: "Ethereum",
        symbol: "ETH",
        quote: {
          USD: {
            price: 3000.00,
            percent_change_24h: 1.1,
            market_cap: 360000000000,
            volume_24h: 20000000000,
            last_updated: "2026-08-22T02:00:00.000Z",
          },
        },
      },
      "5426": {
        id: 5426,
        name: "Solana",
        symbol: "SOL",
        quote: {
          USD: {
            price: 100.00,
            percent_change_24h: 3.2,
            market_cap: 45000000000,
            volume_24h: 4000000000,
            last_updated: "2026-08-22T02:00:00.000Z",
          },
        },
      },
    },
  };
}

function mkCanonical(
  symbol: string,
  cmcId: string,
): CanonicalAsset {
  // v0.4.3: typed providerIds — cmcNumericId (or cmcSlug) is the
  // documented CMC identity field, not the legacy flat `cmc` key.
  return {
    id: `id-${symbol}`,
    symbol,
    name: symbol,
    providerIds: { cmcNumericId: cmcId },
    mappingStatus: "verified",
    mappingConfidence: 0.9,
    updatedAt: new Date().toISOString(),
  };
}

function mkAssetMap(): Map<string, CanonicalAsset> {
  return new Map<string, CanonicalAsset>([
    ["BTC", mkCanonical("BTC", "1")],
    ["ETH", mkCanonical("ETH", "1027")],
    ["SOL", mkCanonical("SOL", "5426")],
  ]);
}

/** Build a fetch mock that returns a single canned Response. */
function mockFetchOnce(body: unknown, init: { status?: number; ok?: boolean } = {}): ReturnType<typeof vi.fn> {
  const status = init.status ?? 200;
  return vi.fn(async () => new Response(JSON.stringify(body), {
    status,
    statusText: status === 200 ? "OK" : "Unauthorized",
    headers: { "content-type": "application/json" },
  })) as unknown as ReturnType<typeof vi.fn>;
}

describe("CMCAdapter live mode", () => {
  beforeEach(() => {
    // Each test installs its own fetch mock via vi.stubGlobal.
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("reports freshness from normalized live quote time and ages to stale", async () => {
    const adapter = new CMCAdapter();
    adapter.configure({ baseUrl: "https://pro-api.coinmarketcap.com/public-api", forceFixtures: false, liveConfig: { keyless: true } });
    expect(adapter.freshness()).toBe("unavailable");
    const now = Date.now();
    const raw = cmc200Response();
    for (const item of Object.values(raw.data)) (item.quote.USD as any).last_updated = new Date(now).toISOString();
    adapter.normalize(raw, { canonicalAssets: mkAssetMap(), endpoint: "quotes/latest", receivedAt: new Date(now).toISOString(), rawSchemaVersion: "1" });
    expect(adapter.health().freshness).toBe("live");
    vi.spyOn(Date, "now").mockReturnValue(now + 7 * 60 * 60 * 1000);
    expect(adapter.freshness()).toBe("stale");
    for (const item of Object.values(raw.data)) (item.quote.USD as any).last_updated = null;
    adapter.normalize(raw, { canonicalAssets: mkAssetMap(), endpoint: "quotes/latest", receivedAt: new Date(now).toISOString(), rawSchemaVersion: "1" });
    expect(adapter.freshness()).toBe("unavailable");
  });

  it("attempts HTTP when apiKey is set and forceFixtures is false", async () => {
    const mockFetch = mockFetchOnce(cmc200Response(), { status: 200 });
    vi.stubGlobal("fetch", mockFetch);

    const adapter = new CMCAdapter();
    adapter.configure({
      baseUrl: "https://pro-api.coinmarketcap.com",
      fixturePath: FIXTURE_PATH, // present so we can verify the fixture path is NOT used
      forceFixtures: false,
      liveConfig: { apiKey: "test-key-1234" },
    });

    const result = await adapter.fetch({ canonicalAssets: mkAssetMap() });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [urlArg, initArg] = mockFetch.mock.calls[0] as [string, RequestInit];
    // v0.4.4 audit fix (P0-2): CMC current production endpoint is
    // /v3/cryptocurrency/quotes/latest, not /v1/. CMC also
    // recommends querying by numeric id, not symbol. With no
    // canonical assets in this test, the adapter falls back to the
    // historical symbol=BTC,ETH,SOL parameter.
    expect(urlArg).toContain("/v3/cryptocurrency/quotes/latest");
    // Either symbol=... (legacy fallback) or id=... (v0.4.4 default)
    const hasSymbol = urlArg.includes("symbol=");
    const hasId = urlArg.includes("id=");
    expect(hasSymbol || hasId, "URL must have either symbol= or id= parameter").toBeTruthy();
    expect(urlArg).toContain("convert=USD");
    expect(urlArg.startsWith("https://pro-api.coinmarketcap.com/")).toBe(true);
    const headers = (initArg.headers ?? {}) as Record<string, string>;
    expect(headers["X-CMC_PRO_API_KEY"]).toBe("test-key-1234");
    expect(initArg.method).toBe("GET");
    // Result.raw should be the live response (not the fixture)
    expect(result).toHaveLength(1);
    expect((result[0]?.raw as { data: Record<string, unknown> }).data["1"]).toBeDefined();
    // Fixture path was NOT used: price is from the mock (70000), not the fixture (78408.50)
    const btc = (result[0]?.raw as { data: Record<string, { quote: { USD: { price: number } } }> }).data["1"];
    expect(btc!.quote.USD.price).toBe(70000.00);
  });

  it("falls back to the fixture path when apiKey is missing but forceFixtures===false", async () => {
    const mockFetch = vi.fn(async () => {
      throw new Error("fetch should not be called in fixture mode");
    });
    vi.stubGlobal("fetch", mockFetch);

    const adapter = new CMCAdapter();
    adapter.configure({
      baseUrl: "https://pro-api.coinmarketcap.com",
      fixturePath: FIXTURE_PATH,
      forceFixtures: false,
      // liveConfig intentionally omitted (no apiKey)
    });

    const result = await adapter.fetch({ canonicalAssets: mkAssetMap() });

    expect(mockFetch).not.toHaveBeenCalled();
    expect(result).toHaveLength(1);
    // Fixture price for BTC is 78408.50 (see cmc-quote.valid.json)
    const raw = result[0]?.raw as { data: Record<string, { quote: { USD: { price: number } } }> };
    expect(raw.data["1"]!.quote.USD.price).toBe(78408.50);
  });

  it("throws AdapterNormalizationError with auth classification on 401", async () => {
    const mockFetch = mockFetchOnce(
      { status: { error_code: 401, error_message: "Invalid API key" }, data: {} },
      { status: 401 },
    );
    vi.stubGlobal("fetch", mockFetch);

    const adapter = new CMCAdapter();
    adapter.configure({
      baseUrl: "https://pro-api.coinmarketcap.com",
      fixturePath: FIXTURE_PATH,
      forceFixtures: false,
      liveConfig: { apiKey: "bad-key" },
    });

    let thrown: unknown;
    try {
      await adapter.fetch({ canonicalAssets: mkAssetMap() });
    } catch (e) {
      thrown = e;
    }
    expect(thrown).toBeInstanceOf(AdapterNormalizationError);
    // Classifying marker: the reason string is prefixed with "auth:".
    const err = thrown as AdapterNormalizationError;
    expect(err.message).toMatch(/auth/);
    expect(err.message).toMatch(/401/);
    // The adapter's network error is NOT set on auth-class failures.
    expect(adapter.lastNetworkError).toBeUndefined();
    // The 401 should NOT have fallen back to the fixture path.
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("produces a valid observation via normalize() when the live API returns 200", async () => {
    const mockFetch = mockFetchOnce(cmc200Response(), { status: 200 });
    vi.stubGlobal("fetch", mockFetch);

    const adapter = new CMCAdapter();
    adapter.configure({
      baseUrl: "https://pro-api.coinmarketcap.com",
      fixturePath: FIXTURE_PATH,
      forceFixtures: false,
      liveConfig: { apiKey: "test-key-1234" },
    });

    const result = await adapter.fetch({ canonicalAssets: mkAssetMap() });
    expect(result).toHaveLength(1);
    const raw = result[0]?.raw;

    // The unchanged validateRaw/normalize path must accept the live response.
    expect(() =>
      adapter.validateRaw(raw, { endpoint: "quotes/latest" }),
    ).not.toThrow();

    const obs = adapter.normalize(raw, {
      canonicalAssets: mkAssetMap(),
      endpoint: "quotes/latest",
      receivedAt: "2026-08-22T02:00:00.000Z",
      rawSchemaVersion: "1.0.0",
    });

    expect(obs).toHaveLength(3);
    const symbols = obs.map((o) => (o.payload as { symbol: string }).symbol).sort();
    expect(symbols).toEqual(["BTC", "ETH", "SOL"]);
    for (const o of obs) {
      expect(o.provider).toBe("cmc");
      expect(o.eventType).toBe("quote");
      expect(o.epistemicState).toBe("KNOWN");
      expect(o.evidenceConfidence).toBe(1);
    }
    const btc = obs.find((o) => (o.payload as { symbol: string }).symbol === "BTC");
    expect(btc).toBeDefined();
    expect((btc?.payload as { priceUsd: number }).priceUsd).toBe(70000.00);
    expect((btc?.payload as { cmcId: number }).cmcId).toBe(1);
  });

  it("setLiveMode(apiKey) flips forceFixtures to false and stores the key", () => {
    const adapter = new CMCAdapter();
    // Initial: no live config, forceFixtures undefined (defaults to fixture path).
    adapter.configure({
      baseUrl: "https://pro-api.coinmarketcap.com",
      fixturePath: FIXTURE_PATH,
    });
    // Sanity: forceFixtures is unset initially.
    // (We access via the adapter's config indirectly by reading the
    // public observable: before setLiveMode, live HTTP path is NOT enabled.)
    expect(adapter.lastNetworkError).toBeUndefined();

    adapter.setLiveMode("op-key-xyz");

    // After setLiveMode, the internal config is mutated. We can probe via
    // a synthetic fetch: a 200 mock should now be consulted.
    const mockFetch = mockFetchOnce(cmc200Response(), { status: 200 });
    vi.stubGlobal("fetch", mockFetch);
    return adapter.fetch({ canonicalAssets: mkAssetMap() }).then((result) => {
      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [, initArg] = mockFetch.mock.calls[0] as [string, RequestInit];
      const headers = (initArg.headers ?? {}) as Record<string, string>;
      expect(headers["X-CMC_PRO_API_KEY"]).toBe("op-key-xyz");
      // And the live path returned the live payload (price 70000), not the fixture (78408.50).
      const raw = result[0]?.raw as { data: Record<string, { quote: { USD: { price: number } } }> };
      expect(raw.data["1"]!.quote.USD.price).toBe(70000.00);
    });
  });

  it("gracefully degrades to fixture on 5xx network error (not fabrication, not auth)", async () => {
    const mockFetch = mockFetchOnce(
      { status: { error_code: 500 }, data: {} },
      { status: 500 },
    );
    vi.stubGlobal("fetch", mockFetch);

    const adapter = new CMCAdapter();
    adapter.configure({
      baseUrl: "https://pro-api.coinmarketcap.com",
      fixturePath: FIXTURE_PATH,
      forceFixtures: false,
      liveConfig: { apiKey: "test-key-1234" },
    });

    let thrown: unknown;
    let result: Awaited<ReturnType<typeof adapter.fetch>> | undefined;
    try {
      result = await adapter.fetch({ canonicalAssets: mkAssetMap() });
    } catch (e) {
      thrown = e;
    }
    // 5xx is NOT an auth error — must not throw.
    expect(thrown).toBeUndefined();
    expect(result).toHaveLength(1);
    // Fixture path was used: the price 78408.50 is from the fixture.
    const raw = result?.[0]?.raw as { data: Record<string, { quote: { USD: { price: number } } }> };
    expect(raw.data["1"]!.quote.USD.price).toBe(78408.50);
    // The adapter records a non-auth network error for observability.
    expect(adapter.lastNetworkError).toMatch(/500/);
  });

  it("rejects malformed live payloads with AdapterContractError (validateRaw is unchanged)", async () => {
    // Live returns 200 but the body is malformed: `data` should be a record
    // keyed by CMC id, but is a string. validateRaw must reject this.
    const mockFetch = mockFetchOnce(
      { data: "not a record", status: { error_code: 0 } },
      { status: 200 },
    );
    vi.stubGlobal("fetch", mockFetch);

    const adapter = new CMCAdapter();
    adapter.configure({
      baseUrl: "https://pro-api.coinmarketcap.com",
      fixturePath: FIXTURE_PATH,
      forceFixtures: false,
      liveConfig: { apiKey: "test-key-1234" },
    });

    const result = await adapter.fetch({ canonicalAssets: mkAssetMap() });
    const raw = result[0]?.raw;
    // The validateRaw path (unchanged) must reject this.
    expect(() =>
      adapter.validateRaw(raw, { endpoint: "quotes/latest" }),
    ).toThrow(AdapterContractError);
  });
});
