import { createHash } from "node:crypto";
import { publicSourceUrl } from "./researchEvidence.js";
import type { ResearchAdapter, ResearchAsset } from "./researchCollection.js";

const BRIGHTDATA_MCP_ORIGIN = "https://mcp.brightdata.com";
const BRIGHTDATA_MCP_PATH = "/mcp";
const MCP_PROTOCOL = "2026-07-28";
const LEGACY_MCP_PROTOCOL = "2025-11-25";
const MAX_MCP_RESPONSE_BYTES = 1024 * 1024;

type JsonRpcEnvelope = {
  id?: string | number | null;
  result?: any;
  error?: { code?: number; message?: string; data?: unknown };
};

function endpointFor(token: string): URL {
  const url = new URL(BRIGHTDATA_MCP_PATH, BRIGHTDATA_MCP_ORIGIN);
  url.searchParams.set("token", token);
  return url;
}

async function readLimitedText(response: Response): Promise<string> {
  const declared = Number(response.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > MAX_MCP_RESPONSE_BYTES)
    throw Error("BRIGHTDATA_MCP_RESPONSE_TOO_LARGE");
  if (!response.body) return "";
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  try {
    while (true) {
      const part = await reader.read();
      if (part.done) break;
      bytes += part.value.byteLength;
      if (bytes > MAX_MCP_RESPONSE_BYTES)
        throw Error("BRIGHTDATA_MCP_RESPONSE_TOO_LARGE");
      chunks.push(part.value);
    }
  } finally {
    await reader.cancel().catch(() => undefined);
  }
  return Buffer.concat(chunks).toString("utf8");
}

function parseEnvelope(text: string): JsonRpcEnvelope {
  const trimmed = text.trim();
  if (!trimmed) throw Error("BRIGHTDATA_MCP_EMPTY_RESPONSE");
  try {
    return JSON.parse(trimmed) as JsonRpcEnvelope;
  } catch {
    const events = trimmed
      .split(/\n\n+/)
      .flatMap((block) => {
        const data = block
          .split(/\r?\n/)
          .filter((line) => line.startsWith("data:"))
          .map((line) => line.slice(5).trim())
          .join("\n");
        if (!data || data === "[DONE]") return [];
        try {
          return [JSON.parse(data) as JsonRpcEnvelope];
        } catch {
          return [];
        }
      });
    const final = [...events].reverse().find((event) => event.result || event.error);
    if (!final) throw Error("BRIGHTDATA_MCP_INVALID_RESPONSE");
    return final;
  }
}

async function postRpc(
  endpoint: URL,
  body: unknown,
  headers: Record<string, string>,
  signal: AbortSignal,
  fetcher: typeof fetch,
): Promise<{ response: Response; envelope: JsonRpcEnvelope | null }> {
  const response = await fetcher(endpoint, {
    method: "POST",
    redirect: "error",
    signal,
    headers: {
      Accept: "application/json, text/event-stream",
      "Content-Type": "application/json",
      ...headers,
    },
    body: JSON.stringify(body),
  });
  if (response.status === 202 || response.status === 204)
    return { response, envelope: null };
  const text = await readLimitedText(response);
  if (!response.ok) throw Error("BRIGHTDATA_MCP_HTTP_" + response.status);
  return { response, envelope: parseEnvelope(text) };
}

function clientMeta() {
  return {
    "io.modelcontextprotocol/protocolVersion": MCP_PROTOCOL,
    "io.modelcontextprotocol/clientInfo": {
      name: "zobiris-research",
      version: "1.0.0",
    },
    "io.modelcontextprotocol/clientCapabilities": {},
  };
}

async function callModern(
  endpoint: URL,
  toolName: string,
  args: Record<string, unknown>,
  signal: AbortSignal,
  fetcher: typeof fetch,
): Promise<any> {
  const body = {
    jsonrpc: "2.0",
    id: 1,
    method: "tools/call",
    params: {
      name: toolName,
      arguments: args,
      _meta: clientMeta(),
    },
  };
  const { envelope } = await postRpc(
    endpoint,
    body,
    {
      "MCP-Protocol-Version": MCP_PROTOCOL,
      "Mcp-Method": "tools/call",
      "Mcp-Name": toolName,
    },
    signal,
    fetcher,
  );
  if (!envelope || envelope.error)
    throw Error("BRIGHTDATA_MCP_MODERN_CALL_FAILED");
  return envelope.result;
}

async function callLegacy(
  endpoint: URL,
  toolName: string,
  args: Record<string, unknown>,
  signal: AbortSignal,
  fetcher: typeof fetch,
): Promise<any> {
  const init = await postRpc(
    endpoint,
    {
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: LEGACY_MCP_PROTOCOL,
        capabilities: {},
        clientInfo: { name: "zobiris-research", version: "1.0.0" },
      },
    },
    {},
    signal,
    fetcher,
  );
  if (!init.envelope || init.envelope.error)
    throw Error("BRIGHTDATA_MCP_INITIALIZE_FAILED");
  const sessionId = init.response.headers.get("mcp-session-id");
  const sessionHeaders = sessionId ? { "Mcp-Session-Id": sessionId } : {};
  await postRpc(
    endpoint,
    { jsonrpc: "2.0", method: "notifications/initialized", params: {} },
    sessionHeaders,
    signal,
    fetcher,
  );
  const call = await postRpc(
    endpoint,
    {
      jsonrpc: "2.0",
      id: 2,
      method: "tools/call",
      params: { name: toolName, arguments: args },
    },
    sessionHeaders,
    signal,
    fetcher,
  );
  if (!call.envelope || call.envelope.error)
    throw Error("BRIGHTDATA_MCP_TOOL_CALL_FAILED");
  return call.envelope.result;
}

function resultText(result: any): string {
  if (result?.structuredContent != null)
    return JSON.stringify(result.structuredContent);
  if (!Array.isArray(result?.content))
    throw Error("BRIGHTDATA_MCP_RESULT_MISSING_CONTENT");
  const text = result.content
    .filter((item: any) => item?.type === "text" && typeof item.text === "string")
    .map((item: any) => item.text)
    .join("\n")
    .trim();
  if (!text) throw Error("BRIGHTDATA_MCP_RESULT_MISSING_TEXT");
  return text;
}

export async function callBrightDataMcpTool(
  token: string,
  toolName: string,
  args: Record<string, unknown>,
  signal: AbortSignal,
  fetcher: typeof fetch = fetch,
): Promise<string> {
  if (!token.trim()) throw Error("BRIGHTDATA_MCP_TOKEN_REQUIRED");
  const endpoint = endpointFor(token.trim());
  try {
    return resultText(
      await callModern(endpoint, toolName, args, signal, fetcher),
    );
  } catch {
    return resultText(
      await callLegacy(endpoint, toolName, args, signal, fetcher),
    );
  }
}

type SearchBatchRow = {
  query?: string;
  engine?: string;
  result?: {
    organic?: Array<{
      link?: string;
      title?: string;
      description?: string;
    }>;
  };
  error?: string;
};

function wholeWord(text: string, value: string): boolean {
  const escaped = value.replace(/[.*+?^$()|[\]\\{}]/g, "\\$&");
  return new RegExp("\\b" + escaped + "\\b", "i").test(text);
}

function queryFor(asset: ResearchAsset): string {
  return asset.name + " " + asset.symbol +
    " cryptocurrency latest official announcement news risk exploit regulation partnership token";
}

function geoLocation(env: NodeJS.ProcessEnv): string | undefined {
  const value = env.BRIGHTDATA_GEO_LOCATION?.trim().toLowerCase();
  return value && /^[a-z]{2}$/.test(value) ? value : undefined;
}

export function brightDataMcpResearchAdapter(
  env: NodeJS.ProcessEnv,
  fetcher: typeof fetch = fetch,
): ResearchAdapter {
  return {
    id: "brightdata-mcp-search",
    configured: () => Boolean(env.BRIGHTDATA_API_TOKEN?.trim()),
    fetch: async (assets, signal) => {
      const token = env.BRIGHTDATA_API_TOKEN?.trim();
      if (!token) throw Error("BRIGHTDATA_MCP_NOT_CONFIGURED");
      const geo = geoLocation(env);
      const queries = assets.map((asset) => ({
        query: queryFor(asset),
        engine: "google" as const,
        ...(geo ? { geo_location: geo } : {}),
      }));
      const text = await callBrightDataMcpTool(
        token,
        "search_engine_batch",
        { queries },
        signal,
        fetcher,
      );
      let parsed: SearchBatchRow[];
      try {
        parsed = JSON.parse(text);
      } catch {
        throw Error("BRIGHTDATA_MCP_SEARCH_PARSE_FAILED");
      }
      if (!Array.isArray(parsed))
        throw Error("BRIGHTDATA_MCP_SEARCH_SHAPE_INVALID");

      const retrievedAt = new Date().toISOString();
      const rows: unknown[] = [];
      for (const asset of assets) {
        const query = queryFor(asset);
        const batch = parsed.find((row) => row?.query === query);
        if (!batch || batch.error || !Array.isArray(batch.result?.organic))
          continue;
        for (const result of batch.result.organic.slice(0, 3)) {
          const sourceUrl = typeof result.link === "string" ? result.link : "";
          if (!publicSourceUrl(sourceUrl)) continue;
          const title = typeof result.title === "string" ? result.title.trim() : "";
          const description =
            typeof result.description === "string"
              ? result.description.trim()
              : "";
          const combined = title + " " + description;
          if (!wholeWord(combined, asset.name)) continue;
          const claim = (description || title).slice(0, 2000);
          if (!claim) continue;
          rows.push({
            canonicalAssetId: asset.id,
            symbol: asset.symbol,
            provider: "brightdata-mcp-search",
            sourceUrl,
            publishedAt: null,
            retrievedAt,
            expiresAt: new Date(
              Date.parse(retrievedAt) + 12 * 3600000,
            ).toISOString(),
            kind: "NEWS",
            lineageId: createHash("sha256")
              .update(sourceUrl + "|" + title.toLowerCase().trim())
              .digest("hex"),
            summary: (title || description).slice(0, 1000),
            claim,
            relevance:
              "Bright Data MCP Google SERP match to canonical project name. Publication timing, source quality, and token impact remain unverified.",
            verification: "UNVERIFIED",
            verificationSourceUrl: null,
            polarity: "MIXED",
            material: false,
            dataMode: "LIVE",
          });
        }
      }
      return rows;
    },
  };
}
