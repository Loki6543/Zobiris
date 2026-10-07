import { createHash } from "node:crypto";
import { publicSourceUrl } from "./researchEvidence.js";
import type { ResearchAdapter, ResearchAsset } from "./researchCollection.js";
import {
  buildRawEvidenceArtifact,
  chooseInvestigationCandidates,
  extractAtomicClaims,
} from "./researchInvestigator.js";

const BRIGHTDATA_MCP_ORIGIN = "https://mcp.brightdata.com";
const BRIGHTDATA_MCP_PATH = "/mcp";
const MCP_PROTOCOL = "2026-07-28";
const LEGACY_MCP_PROTOCOL = "2025-11-25";
const MAX_MCP_RESPONSE_BYTES = 1024 * 1024;
const DEFAULT_BRIGHTDATA_MIN_INTERVAL_MS = 30 * 60 * 1000;

function brightDataToken(env: NodeJS.ProcessEnv): string | undefined {
  return env.BRIGHTDATA_API_TOKEN?.trim() || env.BRIGHT_API_KEY?.trim() || undefined;
}

function brightDataMinimumIntervalMs(env: NodeJS.ProcessEnv): number {
  const configured = Number(env.BRIGHTDATA_MIN_INTERVAL_MS);
  if (!Number.isFinite(configured) || configured < 60_000)
    return DEFAULT_BRIGHTDATA_MIN_INTERVAL_MS;
  return Math.min(configured, 24 * 60 * 60 * 1000);
}

type JsonRpcEnvelope = {
  id?: string | number | null;
  result?: any;
  error?: { code?: number; message?: string; data?: unknown };
};

class McpCompatibilityError extends Error {}

function isCompatibilityHttpError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return [
    "BRIGHTDATA_MCP_HTTP_400",
    "BRIGHTDATA_MCP_HTTP_404",
    "BRIGHTDATA_MCP_HTTP_405",
    "BRIGHTDATA_MCP_HTTP_415",
    "BRIGHTDATA_MCP_HTTP_426",
  ].includes(error.message);
}

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
  let envelope: JsonRpcEnvelope | null;
  try {
    ({ envelope } = await postRpc(
      endpoint,
      body,
      {
        "MCP-Protocol-Version": MCP_PROTOCOL,
        "Mcp-Method": "tools/call",
        "Mcp-Name": toolName,
      },
      signal,
      fetcher,
    ));
  } catch (error) {
    if (isCompatibilityHttpError(error))
      throw new McpCompatibilityError("BRIGHTDATA_MCP_MODERN_UNSUPPORTED");
    throw error;
  }
  if (!envelope)
    throw new McpCompatibilityError("BRIGHTDATA_MCP_MODERN_EMPTY");
  if (envelope.error) {
    if (envelope.error.code === -32601)
      throw new McpCompatibilityError("BRIGHTDATA_MCP_MODERN_METHOD_UNSUPPORTED");
    throw Error("BRIGHTDATA_MCP_TOOL_ERROR");
  }
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
  const sessionHeaders: Record<string, string> = sessionId
    ? { "Mcp-Session-Id": sessionId }
    : {};
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
  } catch (error) {
    if (!(error instanceof McpCompatibilityError)) throw error;
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

function scrapeLimitPerAsset(env: NodeJS.ProcessEnv): number {
  const configured = Number(env.BRIGHTDATA_SCRAPE_MAX_PER_ASSET);
  if (!Number.isInteger(configured)) return 2;
  return Math.max(1, Math.min(3, configured));
}

function evidenceKind(topic: string, polarity: string) {
  if (topic === "TOKENOMICS_SUPPLY") return "SUPPLY_EVENT" as const;
  if (topic === "SECURITY_EXPLOIT" && polarity === "NEGATIVE")
    return "CONTRADICTING_EVIDENCE" as const;
  return "NEWS" as const;
}

export function brightDataMcpResearchAdapter(
  env: NodeJS.ProcessEnv,
  fetcher: typeof fetch = fetch,
): ResearchAdapter {
  return {
    id: "brightdata-mcp-search",
    minIntervalMs: brightDataMinimumIntervalMs(env),
    configured: () => Boolean(brightDataToken(env)),
    fetch: async (assets, signal) => {
      const token = brightDataToken(env);
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

      const rows: unknown[] = [];
      let selectedSources = 0;
      let scrapedSources = 0;
      for (const asset of assets) {
        const query = queryFor(asset);
        const batch = parsed.find((row) => row?.query === query);
        if (!batch || batch.error || !Array.isArray(batch.result?.organic))
          continue;

        const discovered = batch.result.organic
          .slice(0, 6)
          .flatMap((result) => {
            const sourceUrl = typeof result.link === "string" ? result.link : "";
            if (!publicSourceUrl(sourceUrl)) return [];
            const title =
              typeof result.title === "string" ? result.title.trim() : "";
            const description =
              typeof result.description === "string"
                ? result.description.trim()
                : "";
            const combined = title + " " + description;
            if (!wholeWord(combined, asset.name)) return [];
            return [{ sourceUrl, title, description }];
          });

        const selected = chooseInvestigationCandidates(
          discovered,
          scrapeLimitPerAsset(env),
        );
        selectedSources += selected.length;

        for (const candidate of selected) {
          let artifact;
          try {
            const retrievedAt = new Date().toISOString();
            const markdown = await callBrightDataMcpTool(
              token,
              "scrape_as_markdown",
              { url: candidate.sourceUrl },
              signal,
              fetcher,
            );
            artifact = buildRawEvidenceArtifact(
              candidate.sourceUrl,
              retrievedAt,
              markdown,
            );
          } catch {
            continue;
          }

          scrapedSources += 1;
          const claims = extractAtomicClaims(
            artifact.content,
            asset.name,
            asset.symbol,
            candidate.description || candidate.title,
            2,
          );
          for (const [index, claim] of claims.entries()) {
            rows.push({
              canonicalAssetId: asset.id,
              symbol: asset.symbol,
              provider: "brightdata-mcp-investigator",
              sourceUrl: candidate.sourceUrl,
              publishedAt: null,
              retrievedAt: artifact.retrievedAt,
              expiresAt: new Date(
                Date.parse(artifact.retrievedAt) + 24 * 3600000,
              ).toISOString(),
              kind: evidenceKind(claim.topic, claim.polarity),
              lineageId: createHash("sha256")
                .update(
                  [
                    candidate.sourceFamily,
                    candidate.sourceUrl,
                    claim.topic,
                    String(index),
                  ].join("|"),
                )
                .digest("hex"),
              summary: claim.summary.slice(0, 1000),
              claim: claim.claim.slice(0, 2000),
              relevance:
                "Full source acquired after Bright Data SERP discovery. Evidence remains research-only until corroboration, contradiction review, and entry/execution checks are complete.",
              verification: "UNVERIFIED",
              verificationSourceUrl: null,
              polarity: claim.polarity,
              material: claim.material,
              dataMode: "LIVE",
              sourceFamily: candidate.sourceFamily,
              sourceAuthorityScore: candidate.sourceAuthorityScore,
              primarySourceLikely: candidate.primarySourceLikely,
              claimTopic: claim.topic,
              extractionMethod: "BRIGHTDATA_FULL_SOURCE_ATOMIC_V1",
              artifactHash: artifact.contentHash,
              artifactByteLength: artifact.byteLength,
              ...(index === 0 ? { rawArtifact: artifact } : {}),
            });
          }
        }
      }
      if (selectedSources > 0 && scrapedSources === 0)
        throw Error("BRIGHTDATA_MCP_SCRAPE_FAILED");
      return rows;
    },
  };
}
