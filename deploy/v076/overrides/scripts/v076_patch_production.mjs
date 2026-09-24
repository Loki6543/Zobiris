import { readFile, writeFile } from "node:fs/promises";

async function replaceOnce(path, from, to) {
  const original = await readFile(path, "utf8");
  if (!original.includes(from)) {
    throw new Error(`v0.7.6 production patch anchor missing in ${path}`);
  }
  await writeFile(path, original.replace(from, to), "utf8");
}

await replaceOnce(
  "src/ui/App.tsx",
  `  const pageMeta = {
    command: [
      "Command Center",
      "Real-time evidence integrity and decision support",
    ],`,
  `  const pageMetaByView: Record<View, readonly [string, string]> = {
    command: [
      "Command Center",
      "Real-time evidence integrity and decision support",
    ],`,
);

await replaceOnce(
  "src/ui/App.tsx",
  `    "execution-readiness": [
      "Execution Readiness",
      "Fill probability, toxicity, order-book motion and capacity",
    ],
  }[view];`,
  `    "execution-readiness": [
      "Execution Readiness",
      "Fill probability, toxicity, order-book motion and capacity",
    ],
    "attention-ignition": [
      "Attention Ignition",
      "Early attention acceleration, source confirmation and lead-state evidence",
    ],
    "ownership-risk": [
      "Ownership Risk",
      "Concentration, holder structure and shadow-only risk-veto evidence",
    ],
  };
  const pageMeta = pageMetaByView[view];`,
);

await replaceOnce(
  "src/strategy21/engine/personality.ts",
  `function mean(values: number[]): number {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

`,
  "",
);

await replaceOnce(
  "src/strategy21/attentionLedger/live/cmcKeyless.ts",
  `    const row = object(raw);
    const quote = object(object(row?.quote)?.USD);
    const id = finiteNumber(row?.id);`,
  `    const row = object(raw);
    const quoteValue = row?.quote;
    const quoteObject = object(quoteValue);
    const quote = object(quoteObject?.USD) ?? (Array.isArray(quoteValue)
      ? quoteValue.map(object).find((candidate) => candidate?.symbol === "USD" || finiteNumber(candidate?.id) === 2781)
      : undefined);
    const id = finiteNumber(row?.id);`,
);

await writeFile(
  "tsconfig.production.json",
  JSON.stringify(
    {
      extends: "./tsconfig.json",
      compilerOptions: {
        types: ["node", "vite/client"],
        noEmit: true,
      },
      include: ["src/**/*.ts", "src/**/*.tsx", "vite.config.ts"],
      exclude: [
        "node_modules",
        "dist",
        "src/tests/**",
        "src/strategy21/tests/**",
        "src/strategy21/types/node-shim.d.ts",
      ],
    },
    null,
    2,
  ) + "\n",
  "utf8",
);


await writeFile(
  "src/providers/cmcQuoteShape.ts",
  `type UnknownRecord = Record<string, unknown>;

function record(value: unknown): UnknownRecord | undefined {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as UnknownRecord
    : undefined;
}

function numericErrorCode(value: unknown): unknown {
  if (typeof value === "string" && /^-?\\d+$/.test(value.trim())) return Number(value);
  return value;
}

export function normalizeCmcV3Shape(raw: unknown): any {
  const normalizeEntry = (value: unknown): UnknownRecord | undefined => {
    const entry = record(value);
    if (!entry) return undefined;
    const quoteValue = entry.quote;
    if (!Array.isArray(quoteValue)) return entry;
    const usd = quoteValue
      .map(record)
      .find((quote) => quote?.symbol === "USD" || quote?.id === 2781 || quote?.id === "2781");
    return {
      ...entry,
      quote: usd ? { USD: usd } : {},
    };
  };

  // Current CMC v3 quotes/latest returns a top-level array of CryptoQuoteV3DTO.
  // Convert that into the internal legacy-compatible {status,data} envelope so
  // the existing schema/normalizer can process all requested assets.
  if (Array.isArray(raw)) {
    const normalizedData: Record<string, unknown> = {};
    for (const value of raw) {
      const entry = normalizeEntry(value);
      if (!entry) continue;
      const id = entry.id;
      const key = typeof id === "number" || typeof id === "string"
        ? String(id)
        : typeof entry.symbol === "string"
          ? entry.symbol
          : undefined;
      if (key) normalizedData[key] = entry;
    }
    return {
      status: { error_code: 0, error_message: null },
      data: normalizedData,
    };
  }

  const root = record(raw);
  if (!root) return raw;

  const status = record(root.status);
  const normalizedStatus = status
    ? { ...status, error_code: numericErrorCode(status.error_code) }
    : root.status;

  // Some current keyless v3 responses use the standard API envelope but
  // return data as an array. Normalize that array to the legacy id-keyed map.
  if (Array.isArray(root.data)) {
    const normalizedData: Record<string, unknown> = {};
    for (const value of root.data) {
      const entry = normalizeEntry(value);
      if (!entry) continue;
      const id = entry.id;
      const key = typeof id === "number" || typeof id === "string"
        ? String(id)
        : typeof entry.symbol === "string"
          ? entry.symbol
          : undefined;
      if (key) normalizedData[key] = entry;
    }
    return { ...root, status: normalizedStatus, data: normalizedData };
  }

  const data = record(root.data);
  if (!data) return { ...root, status: normalizedStatus };

  const normalizedData: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    normalizedData[key] = normalizeEntry(value) ?? value;
  }

  return { ...root, status: normalizedStatus, data: normalizedData };
}
`,
  "utf8",
);

await replaceOnce(
  "src/providers/cmc.ts",
  `import { randomUUID } from "node:crypto";`,
  `import { randomUUID } from "node:crypto";
import { normalizeCmcV3Shape } from "./cmcQuoteShape.js";`,
);

await replaceOnce(
  "src/providers/cmc.ts",
  `    requiresApiKey: true,
    supported: "fixture-only" as const,
    dataClasses: ["market" as const, "identity" as const, "social" as const],
    notes: "Slice 1: fixture-driven. Use community/trending data only (do NOT invent a \`mindshare\` endpoint).",`,
  `    requiresApiKey: false,
    supported: "live" as const,
    dataClasses: ["market" as const, "identity" as const, "social" as const],
    notes: "Live quotes support paid-key and documented keyless-v3 access. Use community/trending data only (do NOT invent a \`mindshare\` endpoint).",`,
);

await replaceOnce(
  "src/providers/cmc.ts",
  `  liveConfig?: {
    apiKey: string;
    timeoutMs?: number;
  };`,
  `  liveConfig?: {
    apiKey?: string;
    keyless?: boolean;
    timeoutMs?: number;
  };`,
);

await replaceOnce(
  "src/providers/cmc.ts",
  `    const parsed = cmcQuoteSchema.safeParse(raw);`,
  `    const parsed = cmcQuoteSchema.safeParse(normalizeCmcV3Shape(raw));`,
);

await replaceOnce(
  "src/providers/cmc.ts",
  `      const url = \`\${this.config.baseUrl}/v3/cryptocurrency/quotes/latest?\${idParam}&convert=USD\`;`,
  `      const url = \`\${this.config.baseUrl}/v3/cryptocurrency/quotes/latest?\${idParam}&convert=USD&skip_invalid=true\`;`,
);

await replaceOnce(
  "src/providers/cmc.ts",
  `    const apiKey = this.config.liveConfig?.apiKey;
    if (this.config.forceFixtures === false && apiKey) {`,
  `    const liveConfig = this.config.liveConfig;
    const apiKey = liveConfig?.apiKey;
    if (this.config.forceFixtures === false && liveConfig) {`,
);

await replaceOnce(
  "src/providers/cmc.ts",
  `      const timeoutMs = this.config.liveConfig?.timeoutMs ?? CMC_LIVE_TIMEOUT_MS;`,
  `      const timeoutMs = liveConfig.timeoutMs ?? CMC_LIVE_TIMEOUT_MS;`,
);

await replaceOnce(
  "src/providers/cmc.ts",
  `        response = await fetch(url, {
          method: "GET",
          headers: { "X-CMC_PRO_API_KEY": apiKey },
          signal: controller.signal,
        });`,
  `        response = await fetch(url, {
          method: "GET",
          headers: apiKey ? { "X-CMC_PRO_API_KEY": apiKey } : { Accept: "application/json" },
          signal: controller.signal,
        });`,
);

await replaceOnce(
  "src/providers/cmc.ts",
  `    } else if (this.config.forceFixtures === false && this.config.liveConfig?.apiKey) {
      status = "connected";`,
  `    } else if (this.config.forceFixtures === false && this.config.liveConfig) {
      status = "connected";`,
);

await replaceOnce(
  "src/scripts/_adapters.ts",
  `  } else if (opts.live) {
    // Live mode requested, no key configured: explicit credentials-needed.
    // Do NOT silently use the fixture. The runtime will record this
    // honestly in the audit trail.
    cmc.configure({
      baseUrl: "https://pro-api.coinmarketcap.com",
      fixturePath: "",  // no fixture in live mode
    });
    // eslint-disable-next-line no-console
    console.warn("CMC_API_KEY not set; CMC adapter will report credentials-needed (no fixture fallback in live mode).");
  } else {`,
  `  } else if (opts.live) {
    // Current CMC v3 provides a documented keyless public-api surface for
    // quotes/listings. Use it in live mode when a paid key is absent rather
    // than dropping CMC coverage entirely. No fixture fallback is configured.
    cmc.configure({
      baseUrl: "https://pro-api.coinmarketcap.com/public-api",
      fixturePath: "",
      forceFixtures: false,
      liveConfig: { keyless: true, timeoutMs: 10_000 },
    });
  } else {`,
);

await replaceOnce(
  "src/tests/cmc-no-key-state-truthful.test.ts",
  `  it("with --live and no CMC_API_KEY: health() reports credentials-needed (not connected)", () => {
    delete process.env.CMC_API_KEY;
    const adapters = buildAdapters({ live: true, staleSeconds: 60 });
    const cmc = (adapters as any).cmc as CMCAdapter;
    const h = cmc.health();
    expect(h.status).toBe("credentials-needed");
  });`,
  `  it("with --live and no CMC_API_KEY: health() reports connected keyless live mode", () => {
    delete process.env.CMC_API_KEY;
    const adapters = buildAdapters({ live: true, staleSeconds: 60 });
    const cmc = (adapters as any).cmc as CMCAdapter;
    expect(cmc.health().status).toBe("connected");
  });`,
);

await replaceOnce(
  "src/tests/cmc-no-key-state-truthful.test.ts",
  `  it("with --live and no CMC_API_KEY: fetch() returns no rows (no fake data)", async () => {
    delete process.env.CMC_API_KEY;
    const adapters = buildAdapters({ live: true, staleSeconds: 60 });
    const cmc = (adapters as any).cmc as CMCAdapter;
    const result = await cmc.fetch({ canonicalAssets: new Map() });
    // No fixture, no live key: should return an empty/null result.
    expect(result).toBeDefined();
    expect(result.length).toBeLessThanOrEqual(1);
    // The single result (if any) has data=null, which the
    // normalizer handles as a no-op.
    if (result[0]) {
      expect(result[0].data).toBeNull();
    }
  });`,
  `  it("with --live and no CMC_API_KEY: fetch() uses keyless v3 quotes with no auth header", async () => {
    delete process.env.CMC_API_KEY;
    const originalFetch = globalThis.fetch;
    let seenUrl = "";
    let seenHeaders: HeadersInit | undefined;
    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      seenUrl = String(input);
      seenHeaders = init?.headers;
      return new Response(JSON.stringify({
        status: { error_code: "0" },
        data: {
          "1": { id: 1, name: "Bitcoin", symbol: "BTC", quote: [{ id: 2781, symbol: "USD", price: 85000, market_cap: 1700000000000, volume_24h: 20000000000, percent_change_24h: 1.2, last_updated: "2026-09-24T19:00:00.000Z" }] },
        },
      }), { status: 200, headers: { "content-type": "application/json" } });
    }) as typeof fetch;
    try {
      const adapters = buildAdapters({ live: true, staleSeconds: 60 });
      const cmc = (adapters as any).cmc as CMCAdapter;
      const assets = new Map([["BTC", { id: "btc", symbol: "BTC", name: "Bitcoin", providerIds: { cmcNumericId: "1" }, mappingStatus: "verified", mappingConfidence: 1, updatedAt: new Date().toISOString() } as any]]);
      const result = await cmc.fetch({ canonicalAssets: assets });
      expect(seenUrl).toContain("https://pro-api.coinmarketcap.com/public-api/v3/cryptocurrency/quotes/latest");
      expect(seenUrl).toContain("skip_invalid=true");
      expect(JSON.stringify(seenHeaders ?? {})).not.toContain("X-CMC_PRO_API_KEY");
      expect(result[0]?.dataMode).toBe("live");
      const observations = cmc.normalize(result[0]?.raw, { canonicalAssets: assets, endpoint: "quotes/latest", receivedAt: result[0]!.receivedAt, rawSchemaVersion: "1.0.0" });
      expect(observations[0]?.payload.priceUsd).toBe(85000);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });`,
);

await writeFile(
  "verification/cmcQuoteShape.node.test.mjs",
  `import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeCmcV3Shape } from '../src/providers/cmcQuoteShape.ts';

test('normalizes current keyless v3 top-level arrays and quote arrays', () => {
  const normalized = normalizeCmcV3Shape([
    {
      id: 1,
      name: 'Bitcoin',
      symbol: 'BTC',
      quote: [{ id: 2781, symbol: 'USD', price: 85000, market_cap: 1700000000000, volume_24h: 20000000000, percent_change_24h: 1.2, last_updated: '2026-09-24T19:00:00.000Z' }],
    },
    {
      id: 1027,
      name: 'Ethereum',
      symbol: 'ETH',
      quote: [{ id: 2781, symbol: 'USD', price: 2700, market_cap: 320000000000, volume_24h: 12000000000, percent_change_24h: 0.8, last_updated: '2026-09-24T19:00:00.000Z' }],
    },
  ]);
  assert.equal(normalized.status.error_code, 0);
  assert.equal(normalized.data['1'].quote.USD.price, 85000);
  assert.equal(normalized.data['1027'].quote.USD.price, 2700);
});

test('normalizes keyless v3 envelope data arrays', () => {
  const normalized = normalizeCmcV3Shape({
    status: { error_code: '0', error_message: '' },
    data: [
      { id: 1, name: 'Bitcoin', symbol: 'BTC', quote: [{ id: 2781, symbol: 'USD', price: 85000, market_cap: 1700000000000, volume_24h: 20000000000, percent_change_24h: 1.2, last_updated: '2026-09-24T19:00:00.000Z' }] },
      { id: 1027, name: 'Ethereum', symbol: 'ETH', quote: [{ id: 2781, symbol: 'USD', price: 2700, market_cap: 320000000000, volume_24h: 12000000000, percent_change_24h: 0.8, last_updated: '2026-09-24T19:00:00.000Z' }] },
    ],
  });
  assert.equal(normalized.status.error_code, 0);
  assert.equal(normalized.data['1'].quote.USD.price, 85000);
  assert.equal(normalized.data['1027'].quote.USD.price, 2700);
});

test('preserves legacy keyed quote objects', () => {
  const raw = { status: { error_code: 0 }, data: { '1': { id: 1, name: 'Bitcoin', symbol: 'BTC', quote: { USD: { price: 80000 } } } } };
  const normalized = normalizeCmcV3Shape(raw);
  assert.equal(normalized.data['1'].quote.USD.price, 80000);
});
`,
  "utf8",
);



await replaceOnce(
  "src/providers/kraken.ts",
  `const KRAKEN_RAW_SCHEMA_VERSION = "1.0.0";
const KRAKEN_NORMALIZER_VERSION = "0.1.0";`,
  `const KRAKEN_RAW_SCHEMA_VERSION = "1.0.0";
const KRAKEN_NORMALIZER_VERSION = "0.1.0";

function normalizeKrakenPairKey(pair: string): string {
  const upper = pair.toUpperCase();
  if (upper.endsWith("ZUSD")) {
    let base = upper.slice(0, -4);
    if (base.startsWith("X")) base = base.slice(1);
    return base + "USD";
  }
  return upper;
}`,
);

await replaceOnce(
  "src/providers/kraken.ts",
  `    const pairToSymbol = new Map<string, string>();
    for (const [symbol, pair] of Object.entries(this.config.pairMap)) {
      pairToSymbol.set(pair, symbol);
    }
    if (this.config.resultKeyToSymbol) {
      for (const [key, sym] of Object.entries(this.config.resultKeyToSymbol)) {
        pairToSymbol.set(key, sym);
      }
    }`,
  `    const pairToSymbol = new Map<string, string>();
    for (const [symbol, pair] of Object.entries(this.config.pairMap)) {
      pairToSymbol.set(pair, symbol);
      pairToSymbol.set(normalizeKrakenPairKey(pair), symbol);
    }
    for (const asset of ctx.canonicalAssets.values()) {
      const pair = asset.providerIds?.krakenPair;
      if (
        asset.mappingStatus === "verified" &&
        asset.mappingConfidence >= 0.8 &&
        typeof pair === "string" &&
        pair.length > 0
      ) {
        pairToSymbol.set(pair, asset.symbol);
        pairToSymbol.set(normalizeKrakenPairKey(pair), asset.symbol);
      }
    }
    if (this.config.resultKeyToSymbol) {
      for (const [key, sym] of Object.entries(this.config.resultKeyToSymbol)) {
        pairToSymbol.set(key, sym);
        pairToSymbol.set(normalizeKrakenPairKey(key), sym);
      }
    }`,
);

await replaceOnce(
  "src/providers/kraken.ts",
  `      const symbol = pairToSymbol.get(pair);`,
  `      const symbol = pairToSymbol.get(pair) ?? pairToSymbol.get(normalizeKrakenPairKey(pair));`,
);

await replaceOnce(
  "src/providers/kraken.ts",
  `  async fetch(_ctx: { canonicalAssets: Map<string, CanonicalAsset> }): Promise<FetchResult<unknown>[]> {
    const out: FetchResult<unknown>[] = [];
    const symbols = Object.keys(this.config.pairMap);`,
  `  async fetch(ctx: { canonicalAssets: Map<string, CanonicalAsset> }): Promise<FetchResult<unknown>[]> {
    const out: FetchResult<unknown>[] = [];
    const pairMap: Record<string, string> = { ...this.config.pairMap };
    for (const asset of ctx.canonicalAssets.values()) {
      const pair = asset.providerIds?.krakenPair;
      if (
        asset.mappingStatus === "verified" &&
        asset.mappingConfidence >= 0.8 &&
        typeof pair === "string" &&
        pair.length > 0
      ) {
        pairMap[asset.symbol] = pair;
      }
    }
    const symbols = Object.keys(pairMap);`,
);

await replaceOnce(
  "src/providers/kraken.ts",
  `        .map((s) => this.config.pairMap[s as keyof typeof this.config.pairMap])`,
  `        .map((s) => pairMap[s])`,
);

await replaceOnce(
  "src/providers/kraken.ts",
  `      const pairParam = symbols
        .map((s) => pairMap[s])
        .filter((p): p is string => Boolean(p))
        .join(",");`,
  `      const requestedPairs = symbols
        .map((s) => pairMap[s])
        .filter((p): p is string => Boolean(p));
      let resolvedPairs = requestedPairs;
      try {
        const discoveryController = new AbortController();
        const discoveryTimer = setTimeout(() => discoveryController.abort(), this.config.timeoutMs ?? 10_000);
        let discoveryResponse: Response;
        try {
          discoveryResponse = await fetch(`${this.config.baseUrl}/0/public/AssetPairs`, {
            method: "GET",
            signal: discoveryController.signal,
          });
        } finally {
          clearTimeout(discoveryTimer);
        }
        if (discoveryResponse.ok) {
          const discoveryRaw = await discoveryResponse.json() as { result?: Record<string, { altname?: string; wsname?: string }> };
          const available = new Map<string, string>();
          for (const [resultKey, meta] of Object.entries(discoveryRaw.result ?? {})) {
            const candidates = [resultKey, meta?.altname, meta?.wsname?.replace("/", "")].filter((value): value is string => Boolean(value));
            const requestName = meta?.altname ?? resultKey;
            for (const candidate of candidates) {
              available.set(normalizeKrakenPairKey(candidate), requestName);
            }
          }
          const discovered = requestedPairs
            .map((pair) => available.get(normalizeKrakenPairKey(pair)))
            .filter((pair): pair is string => Boolean(pair));
          if (discovered.length > 0) resolvedPairs = [...new Set(discovered)];
        }
      } catch {
        // Pair discovery is an optional compatibility layer. If it is unavailable,
        // retain the canonical requested pairs and let the ticker request determine coverage.
      }
      const pairParam = resolvedPairs.join(",");`,
);
await writeFile(
  "src/tests/kraken-watchlist-live-expansion.test.ts",
  `import { afterEach, describe, expect, it } from "vitest";
import { KrakenAdapter } from "../providers/kraken.js";

describe("v0.7.6 Kraken canonical-watchlist live expansion", () => {
  const originalFetch = globalThis.fetch;
  afterEach(() => { globalThis.fetch = originalFetch; });

  it("discovers live Kraken REST symbols and expands beyond BTC/SOL", async () => {
    const seenUrls: string[] = [];
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const url = String(input);
      seenUrls.push(url);
      if (url.includes("/0/public/AssetPairs")) {
        return new Response(JSON.stringify({
          error: [],
          result: {
            XXBTZUSD: { altname: "XBTUSD", wsname: "XBT/USD" },
            XETHZUSD: { altname: "ETHUSD", wsname: "ETH/USD" },
            SOLUSD: { altname: "SOLUSD", wsname: "SOL/USD" },
            COMPUSD: { altname: "COMPUSD", wsname: "COMP/USD" },
          },
        }), { status: 200, headers: { "content-type": "application/json" } });
      }
      return new Response(JSON.stringify({
        error: [],
        result: {
          XXBTZUSD: { c: ["85000", "1"], o: "84000" },
          SOLUSD: { c: ["115", "1"], o: "112" },
          XETHZUSD: { c: ["2700", "1"], o: "2650" },
          COMPUSD: { c: ["48", "1"], o: "46" },
        },
      }), { status: 200, headers: { "content-type": "application/json" } });
    }) as typeof fetch;

    const adapter = new KrakenAdapter();
    adapter.configure({
      baseUrl: "https://api.kraken.com",
      pairMap: { BTC: "XBTUSD", SOL: "SOLUSD" },
      resultKeyToSymbol: { XBTUSD: "BTC", XXBTZUSD: "BTC", SOLUSD: "SOL", XETHZUSD: "ETH" },
      forceFixtures: false,
      timeoutMs: 10_000,
    });

    const now = new Date().toISOString();
    const assets = new Map<string, any>([
      ["btc", { id: "btc", symbol: "BTC", name: "Bitcoin", providerIds: { krakenPair: "XBTUSD" }, mappingStatus: "verified", mappingConfidence: 1, updatedAt: now }],
      ["sol", { id: "sol", symbol: "SOL", name: "Solana", providerIds: { krakenPair: "SOLUSD" }, mappingStatus: "verified", mappingConfidence: 1, updatedAt: now }],
      ["eth", { id: "eth", symbol: "ETH", name: "Ethereum", providerIds: { krakenPair: "ETHUSD" }, mappingStatus: "verified", mappingConfidence: 1, updatedAt: now }],
      ["comp", { id: "comp", symbol: "COMP", name: "Compound", providerIds: { krakenPair: "COMPUSD" }, mappingStatus: "verified", mappingConfidence: 1, updatedAt: now }],
      ["hype", { id: "hype", symbol: "HYPE", name: "Hyperliquid", providerIds: { krakenPair: "HYPEUSD" }, mappingStatus: "verified", mappingConfidence: 1, updatedAt: now }],
    ]);

    const rows = await adapter.fetch({ canonicalAssets: assets });
    expect(seenUrls[0]).toContain("/0/public/AssetPairs");
    const tickerUrl = seenUrls.find((url) => url.includes("/0/public/Ticker")) ?? "";
    expect(tickerUrl).toContain("ETHUSD");
    expect(tickerUrl).toContain("COMPUSD");
    expect(tickerUrl).not.toContain("HYPEUSD");

    const observations = adapter.normalize(rows[0]!.raw, {
      canonicalAssets: assets,
      endpoint: "0/public/Ticker",
      receivedAt: rows[0]!.receivedAt,
      rawSchemaVersion: "1.0.0",
    });
    expect(observations.map((row) => row.payload.symbol)).toEqual(expect.arrayContaining(["BTC", "SOL", "ETH", "COMP"]));
  });
});
`,
  "utf8",
);
