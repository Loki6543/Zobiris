import { createHash } from "node:crypto";
import { basicAuthForTest } from "../strategy21/attentionLedger/live/stocktwitsFirestream.js";
import type { ResearchAdapter, ResearchAsset } from "./researchCollection.js";
import type { ResearchEvidence } from "./researchEvidence.js";

export const CRYPTOBERT_MODEL = "ElKulako/cryptobert";
const HF_ENDPOINT =
  "https://router.huggingface.co/hf-inference/models/ElKulako/cryptobert";
const STOCKTWITS_MESSAGE_STREAM = "https://firestream.stocktwits.com/stream";
const MAX_MESSAGES_PER_TICK = 5;
const MAX_STREAM_BYTES = 256 * 1024;
const STREAM_SAMPLE_MS = 3000;

export interface CryptoBertSentiment {
  model: typeof CRYPTOBERT_MODEL;
  bearish: number;
  neutral: number;
  bullish: number;
  net: number;
  confidence: number;
}

export interface SocialIntelligenceWindow {
  hours: number;
  samples: number;
  bearish: number | null;
  neutral: number | null;
  bullish: number | null;
  net: number | null;
  confidence: number | null;
  acceleration: number | null;
  crowding: "BULLISH" | "BEARISH" | null;
}

export interface SocialIntelligenceSummary {
  available: boolean;
  model: typeof CRYPTOBERT_MODEL;
  authority: "SHADOW_ONLY_NO_TRADING_AUTHORITY";
  horizons: Record<string, SocialIntelligenceWindow>;
}

export interface PriceSentimentShadow {
  state:
    | "INSUFFICIENT_DATA"
    | "BULLISH_CROWDING_PULLBACK_RISK"
    | "POSITIVE_SENTIMENT_DIVERGENCE"
    | "NEGATIVE_SENTIMENT_DIVERGENCE"
    | "PRICE_SENTIMENT_CONFIRMATION"
    | "MIXED";
  authority: "SHADOW_ONLY_NO_ENTRY_SCORE_CHANGE";
  horizon: "8h";
  samples: number;
  netSentiment: number | null;
  acceleration: number | null;
  price24hPct: number | null;
  note: string;
}

function clamp(value: number, low = -1, high = 1) {
  return Math.max(low, Math.min(high, value));
}

function round(value: number, digits = 4) {
  const scale = 10 ** digits;
  return Math.round(value * scale) / scale;
}

function hfToken(env: NodeJS.ProcessEnv): string | null {
  const value = env.HUGGINGFACE_API_TOKEN ?? env.HF_TOKEN;
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function labelName(value: unknown): "bearish" | "neutral" | "bullish" | null {
  const label = String(value ?? "").trim().toUpperCase();
  if (label === "BEARISH" || label === "LABEL_0") return "bearish";
  if (label === "NEUTRAL" || label === "LABEL_1") return "neutral";
  if (label === "BULLISH" || label === "LABEL_2") return "bullish";
  return null;
}

export function parseCryptoBertScores(raw: unknown): CryptoBertSentiment {
  let rows: unknown = raw;
  if (
    Array.isArray(rows) &&
    rows.length === 1 &&
    Array.isArray(rows[0])
  )
    rows = rows[0];
  if (!Array.isArray(rows)) throw Error("Invalid CryptoBERT response");

  const scores = { bearish: 0, neutral: 0, bullish: 0 };
  let recognized = 0;
  for (const item of rows) {
    if (!item || typeof item !== "object") continue;
    const label = labelName((item as any).label);
    const score = Number((item as any).score);
    if (!label || !Number.isFinite(score) || score < 0 || score > 1) continue;
    scores[label] += score;
    recognized++;
  }
  const total = scores.bearish + scores.neutral + scores.bullish;
  if (!recognized || total <= 0) throw Error("CryptoBERT labels unavailable");
  const bearish = scores.bearish / total;
  const neutral = scores.neutral / total;
  const bullish = scores.bullish / total;
  return {
    model: CRYPTOBERT_MODEL,
    bearish: round(bearish),
    neutral: round(neutral),
    bullish: round(bullish),
    net: round(clamp(bullish - bearish)),
    confidence: round(Math.max(bearish, neutral, bullish)),
  };
}

export async function classifyCryptoText(
  text: string,
  env: NodeJS.ProcessEnv,
  fetcher: typeof fetch = fetch,
  signal: AbortSignal = AbortSignal.timeout(6000),
): Promise<CryptoBertSentiment> {
  const token = hfToken(env);
  if (!token) throw Error("CryptoBERT inference token not configured");
  const compact = text.replace(/\s+/g, " ").trim().slice(0, 500);
  if (!compact) throw Error("Empty social text");
  const response = await fetcher(HF_ENDPOINT, {
    method: "POST",
    redirect: "error",
    signal,
    headers: {
      Authorization: "Bearer " + token,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      inputs: compact,
      parameters: { top_k: 3, function_to_apply: "softmax" },
    }),
  });
  if (!response.ok) throw Error("CryptoBERT inference unavailable");
  const length = Number(response.headers.get("content-length"));
  if (Number.isFinite(length) && length > 256 * 1024)
    throw Error("CryptoBERT response too large");
  return parseCryptoBertScores(await response.json());
}

type StreamMessage = {
  id: string;
  body: string;
  createdAt: string;
  symbols: string[];
};

function normalizedSymbol(value: unknown): string | null {
  const raw =
    typeof value === "string"
      ? value
      : value && typeof value === "object"
        ? String((value as any).symbol ?? (value as any).ticker ?? "")
        : "";
  const symbol = raw.toUpperCase().replace(/\.X$/, "").trim();
  return /^[A-Z0-9._-]{1,20}$/.test(symbol) ? symbol : null;
}

export function parseStocktwitsMessageLine(line: string): StreamMessage | null {
  let text = line.trim();
  if (!text || text.startsWith(":")) return null;
  if (text.startsWith("data:")) text = text.slice(5).trim();
  let envelope: any;
  try {
    envelope = JSON.parse(text);
  } catch {
    return null;
  }
  if (
    String(envelope?.object ?? "").toLowerCase() !== "message" ||
    String(envelope?.action ?? "").toLowerCase() !== "create"
  )
    return null;
  const data = envelope?.data;
  const body = typeof data?.body === "string" ? data.body.trim() : "";
  const createdAt =
    typeof data?.created_at === "string"
      ? data.created_at
      : typeof data?.createdAt === "string"
        ? data.createdAt
        : "";
  const createdMs = Date.parse(createdAt);
  const symbols: string[] = [];
  if (Array.isArray(data?.symbols)) {
    for (const value of data.symbols as unknown[]) {
      const symbol = normalizedSymbol(value);
      if (symbol && !symbols.includes(symbol)) symbols.push(symbol);
    }
  }
  if (!body || !Number.isFinite(createdMs) || !symbols.length) return null;
  const id =
    data?.id == null
      ? createHash("sha256")
          .update(body + "|" + createdAt)
          .digest("hex")
          .slice(0, 24)
      : String(data.id);
  return { id, body, createdAt: new Date(createdMs).toISOString(), symbols };
}

async function sampleStocktwitsMessages(
  assets: ResearchAsset[],
  env: NodeJS.ProcessEnv,
  fetcher: typeof fetch,
  parentSignal: AbortSignal,
): Promise<StreamMessage[]> {
  const username = env.STOCKTWITS_FIRESTREAM_USERNAME;
  const password = env.STOCKTWITS_FIRESTREAM_PASSWORD;
  if (!username || !password) throw Error("Stocktwits Firestream not configured");
  const wanted = new Set(assets.map((asset) => asset.symbol.toUpperCase()));
  const local = new AbortController();
  const timer = setTimeout(() => local.abort(), STREAM_SAMPLE_MS);
  timer.unref?.();
  const signal = AbortSignal.any([parentSignal, local.signal]);
  const messages = new Map<string, StreamMessage>();
  let reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
  try {
    const response = await fetcher(STOCKTWITS_MESSAGE_STREAM, {
      method: "GET",
      redirect: "error",
      signal,
      headers: {
        Authorization: basicAuthForTest(username, password),
        Accept: "text/event-stream, application/x-ndjson, application/json",
      },
    });
    if (!response.ok || !response.body)
      throw Error("Stocktwits message stream unavailable");
    reader = response.body.getReader();
    const decoder = new TextDecoder();
    let pending = "";
    let bytes = 0;
    while (!local.signal.aborted && !parentSignal.aborted) {
      let read;
      try {
        read = await reader.read();
      } catch (error) {
        if (local.signal.aborted) break;
        throw error;
      }
      if (read.done) break;
      bytes += read.value.byteLength;
      if (bytes > MAX_STREAM_BYTES) break;
      pending += decoder.decode(read.value, { stream: true });
      const lines = pending.split(/\r?\n/);
      pending = lines.pop() ?? "";
      for (const line of lines) {
        const message = parseStocktwitsMessageLine(line);
        if (!message || !message.symbols.some((symbol) => wanted.has(symbol)))
          continue;
        messages.set(message.id, message);
        if (messages.size >= MAX_MESSAGES_PER_TICK) return [...messages.values()];
      }
    }
    const final = parseStocktwitsMessageLine(pending);
    if (final && final.symbols.some((symbol) => wanted.has(symbol)))
      messages.set(final.id, final);
  } catch (error) {
    if (!local.signal.aborted) throw error;
  } finally {
    clearTimeout(timer);
    await reader?.cancel().catch(() => undefined);
  }
  return [...messages.values()].slice(0, MAX_MESSAGES_PER_TICK);
}

export function cryptoBertStocktwitsAdapter(
  env: NodeJS.ProcessEnv,
  fetcher: typeof fetch = fetch,
): ResearchAdapter {
  return {
    id: "cryptobert-stocktwits",
    configured: () =>
      Boolean(
        hfToken(env) &&
          env.STOCKTWITS_FIRESTREAM_USERNAME &&
          env.STOCKTWITS_FIRESTREAM_PASSWORD,
      ),
    fetch: async (assets, signal) => {
      const messages = await sampleStocktwitsMessages(
        assets,
        env,
        fetcher,
        signal,
      );
      if (!messages.length) return [];
      const wanted = new Map(
        assets.map((asset) => [asset.symbol.toUpperCase(), asset]),
      );
      const classified = await Promise.allSettled(
        messages.map(async (message) => ({
          message,
          sentiment: await classifyCryptoText(
            message.body,
            env,
            fetcher,
            AbortSignal.any([signal, AbortSignal.timeout(6000)]),
          ),
        })),
      );
      const successes = classified
        .filter(
          (
            result,
          ): result is PromiseFulfilledResult<{
            message: StreamMessage;
            sentiment: CryptoBertSentiment;
          }> => result.status === "fulfilled",
        )
        .map((result) => result.value);
      if (!successes.length) throw Error("CryptoBERT classification failed");

      const retrievedAt = new Date().toISOString();
      const retrievedMs = Date.parse(retrievedAt);
      const rows: unknown[] = [];
      for (const { message, sentiment } of successes) {
        const publishedMs = Date.parse(message.createdAt);
        if (
          !Number.isFinite(publishedMs) ||
          publishedMs > retrievedMs ||
          retrievedMs - publishedMs > 24 * 3600000
        )
          continue;
        for (const symbol of message.symbols) {
          const asset = wanted.get(symbol);
          if (!asset) continue;
          const polarity =
            sentiment.net >= 0.15
              ? "POSITIVE"
              : sentiment.net <= -0.15
                ? "NEGATIVE"
                : "MIXED";
          const messageHash = createHash("sha256")
            .update(message.id + "|" + message.body + "|" + message.createdAt)
            .digest("hex");
          rows.push({
            canonicalAssetId: asset.id,
            symbol: asset.symbol,
            provider: "cryptobert-stocktwits",
            sourceUrl:
              "https://stocktwits.com/symbol/" +
              encodeURIComponent(asset.symbol) +
              ".X",
            publishedAt: message.createdAt,
            retrievedAt,
            expiresAt: new Date(publishedMs + 24 * 3600000).toISOString(),
            kind: "SOCIAL_ACTIVITY",
            lineageId: "cryptobert:" + asset.symbol + ":" + messageHash,
            summary:
              "CryptoBERT social sentiment — bullish " +
              Math.round(sentiment.bullish * 100) +
              "%, neutral " +
              Math.round(sentiment.neutral * 100) +
              "%, bearish " +
              Math.round(sentiment.bearish * 100) +
              "%.",
            claim:
              "CryptoBERT classified one current Stocktwits message about " +
              asset.symbol +
              "; net language sentiment " +
              sentiment.net.toFixed(3) +
              ".",
            relevance:
              "Raw post text is used only for inference and is not persisted. Per-message language sentiment is not a return probability, entry instruction or execution authority.",
            verification: "UNVERIFIED",
            verificationSourceUrl: null,
            polarity,
            material: false,
            dataMode: "LIVE",
            sentiment,
          });
        }
      }
      return rows;
    },
  };
}

const horizonSpecs = [
  ["30m", 0.5],
  ["1.5h", 1.5],
  ["8h", 8],
  ["24h", 24],
  ["3d", 72],
  ["7d", 168],
] as const;

function aggregateWindow(
  evidence: ResearchEvidence[],
  now: number,
  hours: number,
): Omit<SocialIntelligenceWindow, "acceleration"> {
  const duration = hours * 3600000;
  const rows = evidence.filter((item) => {
    if (item.provider !== "cryptobert-stocktwits" || !item.sentiment) return false;
    const at = Date.parse(item.publishedAt ?? item.retrievedAt);
    return Number.isFinite(at) && at <= now && now - at <= duration;
  });
  if (!rows.length)
    return {
      hours,
      samples: 0,
      bearish: null,
      neutral: null,
      bullish: null,
      net: null,
      confidence: null,
      crowding: null,
    };
  const average = (pick: (row: ResearchEvidence) => number) =>
    rows.reduce((sum, row) => sum + pick(row), 0) / rows.length;
  const bearish = average((row) => row.sentiment!.bearish);
  const neutral = average((row) => row.sentiment!.neutral);
  const bullish = average((row) => row.sentiment!.bullish);
  const net = average((row) => row.sentiment!.net);
  const confidence = average((row) => row.sentiment!.confidence);
  return {
    hours,
    samples: rows.length,
    bearish: round(bearish),
    neutral: round(neutral),
    bullish: round(bullish),
    net: round(net),
    confidence: round(confidence),
    crowding:
      rows.length >= 3 && net >= 0.6
        ? "BULLISH"
        : rows.length >= 3 && net <= -0.6
          ? "BEARISH"
          : null,
  };
}

function previousNet(
  evidence: ResearchEvidence[],
  now: number,
  hours: number,
): number | null {
  const duration = hours * 3600000;
  const rows = evidence.filter((item) => {
    if (item.provider !== "cryptobert-stocktwits" || !item.sentiment) return false;
    const at = Date.parse(item.publishedAt ?? item.retrievedAt);
    return (
      Number.isFinite(at) &&
      at <= now - duration &&
      at > now - 2 * duration
    );
  });
  if (!rows.length) return null;
  return rows.reduce((sum, row) => sum + row.sentiment!.net, 0) / rows.length;
}

export function summarizeSocialIntelligence(
  evidence: ResearchEvidence[],
  now = Date.now(),
): SocialIntelligenceSummary {
  const horizons: Record<string, SocialIntelligenceWindow> = {};
  for (const [label, hours] of horizonSpecs) {
    const current = aggregateWindow(evidence, now, hours);
    const prior = previousNet(evidence, now, hours);
    horizons[label] = {
      ...current,
      acceleration:
        current.net == null || prior == null
          ? null
          : round(clamp(current.net - prior)),
    };
  }
  return {
    available: Object.values(horizons).some((window) => window.samples > 0),
    model: CRYPTOBERT_MODEL,
    authority: "SHADOW_ONLY_NO_TRADING_AUTHORITY",
    horizons,
  };
}

export function priceSentimentShadow(
  summary: SocialIntelligenceSummary | null | undefined,
  price24hPct: number | null,
): PriceSentimentShadow {
  const window = summary?.horizons?.["8h"];
  const base = {
    authority: "SHADOW_ONLY_NO_ENTRY_SCORE_CHANGE" as const,
    horizon: "8h" as const,
    samples: window?.samples ?? 0,
    netSentiment: window?.net ?? null,
    acceleration: window?.acceleration ?? null,
    price24hPct,
  };
  if (!window || window.samples < 2 || window.net == null || price24hPct == null)
    return {
      ...base,
      state: "INSUFFICIENT_DATA",
      note: "Need at least two classified posts plus a current 24h price return.",
    };
  if (window.net >= 0.55 && price24hPct >= 5)
    return {
      ...base,
      state: "BULLISH_CROWDING_PULLBACK_RISK",
      note: "Strong bullish language after a large price advance is treated as possible crowding, not a buy confirmation.",
    };
  if (window.net >= 0.25 && price24hPct <= -1)
    return {
      ...base,
      state: "POSITIVE_SENTIMENT_DIVERGENCE",
      note: "Language sentiment is positive while price is down; flag for reversal research, not automatic entry.",
    };
  if (window.net <= -0.25 && price24hPct >= 1)
    return {
      ...base,
      state: "NEGATIVE_SENTIMENT_DIVERGENCE",
      note: "Price is rising while language sentiment is negative; flag for distribution or narrative-risk review.",
    };
  if (
    (window.net >= 0.2 && price24hPct > 0) ||
    (window.net <= -0.2 && price24hPct < 0)
  )
    return {
      ...base,
      state: "PRICE_SENTIMENT_CONFIRMATION",
      note: "Price direction and language sentiment agree; this remains supporting evidence only.",
    };
  return {
    ...base,
    state: "MIXED",
    note: "Price and language sentiment do not form a strong, validated divergence or crowding pattern.",
  };
}
