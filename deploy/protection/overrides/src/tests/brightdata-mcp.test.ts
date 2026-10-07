import { describe, expect, it } from "vitest";
import {
  brightDataMcpResearchAdapter,
  callBrightDataMcpTool,
} from "../server/brightDataMcp.js";

function rpcResult(text: string, headers: Record<string, string> = {}) {
  return new Response(
    JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      result: { content: [{ type: "text", text }] },
    }),
    {
      status: 200,
      headers: { "content-type": "application/json", ...headers },
    },
  );
}

describe("Bright Data MCP research adapter", () => {
  it("is fail-closed until a Bright Data token is configured", () => {
    expect(brightDataMcpResearchAdapter({}).configured()).toBe(false);
    expect(
      brightDataMcpResearchAdapter({ BRIGHTDATA_API_TOKEN: "token" }).configured(),
    ).toBe(true);
    expect(
      brightDataMcpResearchAdapter({ BRIGHT_API_KEY: "legacy-token" }).configured(),
    ).toBe(true);
    expect(
      brightDataMcpResearchAdapter({ BRIGHT_API_KEY: "legacy-token" }).minIntervalMs,
    ).toBe(30 * 60 * 1000);
  });

  it("prefers BRIGHTDATA_API_TOKEN but accepts the Railway legacy BRIGHT_API_KEY alias", async () => {
    let observedUrl = "";
    const adapter = brightDataMcpResearchAdapter(
      {
        BRIGHTDATA_API_TOKEN: "preferred-token",
        BRIGHT_API_KEY: "legacy-token",
        BRIGHTDATA_MIN_INTERVAL_MS: "3600000",
      },
      async (url, init) => {
        observedUrl = String(url);
        const body = JSON.parse(String(init?.body));
        const query = body.params.arguments.queries[0].query;
        return rpcResult(JSON.stringify([{ query, engine: "google", result: { organic: [] } }]));
      },
    );
    expect(adapter.minIntervalMs).toBe(3_600_000);
    await adapter.fetch(
      [{ id: "asset-btc", symbol: "BTC", name: "Bitcoin" }],
      AbortSignal.timeout(1000),
    );
    expect(new URL(observedUrl).searchParams.get("token")).toBe("preferred-token");
  });

  it("uses the hosted MCP batch search and emits unverified provenance-only evidence", async () => {
    let observedUrl = "";
    let observedBody: any = null;
    const adapter = brightDataMcpResearchAdapter(
      {
        BRIGHTDATA_API_TOKEN: "secret-token",
        BRIGHTDATA_GEO_LOCATION: "us",
      },
      async (url, init) => {
        observedUrl = String(url);
        observedBody = JSON.parse(String(init?.body));
        const query = observedBody.params.arguments.queries[0].query;
        return rpcResult(
          JSON.stringify([
            {
              query,
              engine: "google",
              result: {
                organic: [
                  {
                    link: "https://example.com/solana-update",
                    title: "Solana network update",
                    description:
                      "Solana developers published a new network update and risk disclosure.",
                  },
                ],
              },
            },
          ]),
        );
      },
    );

    const rows = (await adapter.fetch(
      [{ id: "asset-sol", symbol: "SOL", name: "Solana" }],
      AbortSignal.timeout(1000),
    )) as any[];

    const endpoint = new URL(observedUrl);
    expect(endpoint.origin).toBe("https://mcp.brightdata.com");
    expect(endpoint.pathname).toBe("/mcp");
    expect(endpoint.searchParams.get("token")).toBe("secret-token");
    expect(observedBody.method).toBe("tools/call");
    expect(observedBody.params.name).toBe("search_engine_batch");
    expect(observedBody.params.arguments.queries[0].geo_location).toBe("us");
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      canonicalAssetId: "asset-sol",
      symbol: "SOL",
      provider: "brightdata-mcp-search",
      sourceUrl: "https://example.com/solana-update",
      verification: "UNVERIFIED",
      material: false,
      dataMode: "LIVE",
    });
    expect(JSON.stringify(rows[0])).not.toContain("secret-token");
  });

  it("requires the canonical project name, not an unrelated common-word ticker hit", async () => {
    const adapter = brightDataMcpResearchAdapter(
      { BRIGHTDATA_API_TOKEN: "token" },
      async (_url, init) => {
        const body = JSON.parse(String(init?.body));
        const query = body.params.arguments.queries[0].query;
        return rpcResult(
          JSON.stringify([
            {
              query,
              engine: "google",
              result: {
                organic: [
                  {
                    link: "https://example.com/article",
                    title: "One person found a new job",
                    description: "One step toward a new career.",
                  },
                ],
              },
            },
          ]),
        );
      },
    );
    await expect(
      adapter.fetch(
        [{ id: "harmony", symbol: "ONE", name: "Harmony" }],
        AbortSignal.timeout(1000),
      ),
    ).resolves.toEqual([]);
  });

  it("falls back to legacy sessioned MCP when the modern request is rejected", async () => {
    const calls: any[] = [];
    const result = await callBrightDataMcpTool(
      "token",
      "search_engine_batch",
      { queries: [{ query: "Bitcoin BTC crypto", engine: "google" }] },
      AbortSignal.timeout(1000),
      async (_url, init) => {
        const body = JSON.parse(String(init?.body));
        calls.push({ body, headers: init?.headers });
        if (calls.length === 1)
          return new Response("unsupported", { status: 400 });
        if (body.method === "initialize")
          return new Response(
            JSON.stringify({
              jsonrpc: "2.0",
              id: 1,
              result: {
                protocolVersion: "2025-11-25",
                capabilities: { tools: {} },
                serverInfo: { name: "Bright Data", version: "test" },
              },
            }),
            {
              status: 200,
              headers: {
                "content-type": "application/json",
                "mcp-session-id": "session-1",
              },
            },
          );
        if (body.method === "notifications/initialized")
          return new Response(null, { status: 202 });
        expect((init?.headers as any)["Mcp-Session-Id"]).toBe("session-1");
        return rpcResult(JSON.stringify([{ query: "Bitcoin BTC crypto", result: { organic: [] } }]));
      },
    );
    expect(JSON.parse(result)).toHaveLength(1);
    expect(calls.map((call) => call.body.method)).toEqual([
      "tools/call",
      "initialize",
      "notifications/initialized",
      "tools/call",
    ]);
  });
});
