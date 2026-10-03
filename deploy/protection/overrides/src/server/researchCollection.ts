import { createHash } from "node:crypto";
import { publicSourceUrl, type EvidenceRepo } from "./researchEvidence.js";
import { evaluateReassessment } from "./reassessment.js";
import {
  parseStocktwitsFirestreamSnapshot,
  STOCKTWITS_FIRESTREAM_ALL_SYMBOLS_URL,
  basicAuthForTest,
} from "../strategy21/attentionLedger/live/stocktwitsFirestream.js";
export interface ResearchAsset {
  id: string;
  symbol: string;
  name: string;
  cmcId?: string;
}
export interface ResearchAdapter {
  id: string;
  configured(): boolean;
  fetch(assets: ResearchAsset[], signal: AbortSignal): Promise<unknown[]>;
}
export interface ResearchCollectionStatus {
  provider: string;
  status: "AVAILABLE" | "NOT_CONFIGURED" | "UNAVAILABLE" | "PARTIAL";
  attemptedAt: string;
  lastSuccessAt: string | null;
  cursor: number;
  failures: number;
  retryAt: number;
  coveredAssets: string[];
  records: number;
  error?: string;
}
const origins = new Set([
  "https://api.parallel.ai",
  "https://api-gw-prd.stocktwits.com",
  "https://pro-api.coinmarketcap.com",
]);
export async function safeProviderJson(
  url: string,
  init: RequestInit = {},
  fetcher: typeof fetch = fetch,
): Promise<any> {
  const u = new URL(url);
  if (!origins.has(u.origin) || u.username || u.password)
    throw Error("Provider destination rejected");
  const response = await fetcher(url, {
    ...init,
    redirect: "error",
    signal: init.signal ?? AbortSignal.timeout(10000),
  });
  if (!response.ok) throw Error("Provider unavailable");
  if (Number(response.headers.get("content-length")) > 1048576)
    throw Error("Provider response too large");
  if (!response.body) throw Error("Empty provider response");
  const reader = response.body.getReader();
  let bytes = 0;
  const chunks: Uint8Array[] = [];
  try {
    while (true) {
      const r = await reader.read();
      if (r.done) break;
      bytes += r.value.byteLength;
      if (bytes > 1048576) throw Error("Provider response too large");
      chunks.push(r.value);
    }
  } finally {
    await reader.cancel().catch(() => undefined);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}
export function importResearchEvidence(
  repo: EvidenceRepo,
  records: unknown[],
  authorized: boolean,
  now = Date.now(),
) {
  if (!authorized) throw Error("Unauthorized");
  if (
    !Array.isArray(records) ||
    records.length > 100 ||
    Buffer.byteLength(JSON.stringify(records)) > 1048576
  )
    throw Error("Import exceeds limits");
  const rows = repo.append(
    records.map((r) => ({ ...(r as object), dataMode: "IMPORTED" })),
    now,
  );
  for (const id of new Set(rows.map((r) => r.canonicalAssetId)))
    repo.saveReview(
      evaluateReassessment(repo.readReview(id), repo.list(id), now, id),
    );
  repo.setState("lastImportAt", new Date(now).toISOString());
  return { accepted: rows.length, dataMode: "IMPORTED" };
}
export async function collectResearchTick(
  repo: EvidenceRepo,
  adapters: ResearchAdapter[],
  universe: ResearchAsset[],
  now: number,
): Promise<ResearchCollectionStatus[]> {
  const statuses: ResearchCollectionStatus[] = [];
  for (const adapter of adapters) {
    const old = repo.getState(
      "provider:" + adapter.id,
    ) as ResearchCollectionStatus | null;
    const state: ResearchCollectionStatus = {
      provider: adapter.id,
      status: "NOT_CONFIGURED",
      attemptedAt: new Date(now).toISOString(),
      lastSuccessAt: old?.lastSuccessAt ?? null,
      cursor: old?.cursor ?? 0,
      failures: old?.failures ?? 0,
      retryAt: old?.retryAt ?? 0,
      coveredAssets: old?.coveredAssets ?? [],
      records: 0,
    };
    if (!adapter.configured()) {
      repo.setState("provider:" + adapter.id, state);
      statuses.push(state);
      continue;
    }
    if (state.retryAt > now) {
      statuses.push({ ...state, status: "UNAVAILABLE" });
      continue;
    }
    if (!universe.length) {
      state.status = "PARTIAL";
      repo.setState("provider:" + adapter.id, state);
      statuses.push(state);
      continue;
    }
    const selected = Array.from(
      { length: Math.min(5, universe.length) },
      (_, i) => universe[(state.cursor + i) % universe.length]!,
    );
    try {
      const records = await adapter.fetch(selected, AbortSignal.timeout(10000));
      const received = Date.now();
      const appended = repo.append(records, Math.max(now, received));
      for (const id of new Set(appended.map((r) => r.canonicalAssetId)))
        repo.saveReview(
          evaluateReassessment(
            repo.readReview(id),
            repo.list(id),
            Math.max(now, received),
            id,
          ),
        );
      state.records = appended.length;
      state.coveredAssets = [
        ...new Set([...state.coveredAssets, ...selected.map((a) => a.id)]),
      ].filter((id) => universe.some((a) => a.id === id));
      state.status =
        state.coveredAssets.length === universe.length
          ? "AVAILABLE"
          : "PARTIAL";
      state.lastSuccessAt = new Date(received).toISOString();
      state.failures = 0;
      state.retryAt = 0;
      for (const a of selected)
        repo.setState(`coverage:${adapter.id}:${a.id}`, {
          attemptedAt: state.attemptedAt,
          lastSuccessAt: state.lastSuccessAt,
          records: appended.filter((r) => r.canonicalAssetId === a.id).length,
        });
    } catch {
      state.status = "UNAVAILABLE";
      state.error = "PROVIDER_FETCH_OR_VALIDATION_FAILED";
      state.failures++;
      state.retryAt =
        now + Math.min(3600000, 300000 * 2 ** Math.min(state.failures - 1, 4));
    }
    state.cursor = (state.cursor + selected.length) % universe.length;
    repo.setState("provider:" + adapter.id, state);
    statuses.push(state);
  }
  return statuses;
}
export function researchAdapters(
  env: NodeJS.ProcessEnv,
  fetcher: typeof fetch = fetch,
): ResearchAdapter[] {
  return [
    {
      id: "parallel-news",
      configured: () => Boolean(env.PARALLEL_API_KEY),
      fetch: async (assets, signal) => {
        const rows: unknown[] = [];
        // Sequential requests keep provider concurrency at one and the shared ten-second tick budget bounded.
        for (const asset of assets) {
          const data = await safeProviderJson(
            "https://api.parallel.ai/v1/search",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "x-api-key": env.PARALLEL_API_KEY!,
              },
              signal,
              body: JSON.stringify({
                objective: `Find recent material news, official announcements and contrary evidence about ${asset.name} (${asset.symbol}) cryptocurrency. Distinguish company adoption from token demand. Return original sources and publication dates.`,
                search_queries: [
                  `${asset.name} ${asset.symbol} official announcement token risks`,
                ],
                mode: "fast",
              }),
            },
            fetcher,
          );
          if (!Array.isArray(data.results))
            throw Error("Invalid search response");
          for (const result of data.results.slice(0, 5)) {
            if (typeof result.url !== "string" || !publicSourceUrl(result.url))
              continue;
            const title = typeof result.title === "string" ? result.title : "";
            const content = Array.isArray(result.excerpts)
              ? result.excerpts
                  .filter((x: unknown) => typeof x === "string")
                  .join(" ")
              : "";
            const text = (title + " " + content).toLowerCase();
            const escapedName = asset.name.replace(
              /[.*+?^${}()|[\]\\]/g,
              "\\$&",
            );
            if (!new RegExp("\\b" + escapedName + "\\b", "i").test(text))
              continue;
            const retrievedAt = new Date().toISOString();
            const published =
              typeof result.publish_date === "string" &&
              Number.isFinite(Date.parse(result.publish_date))
                ? new Date(Date.parse(result.publish_date)).toISOString()
                : null;
            if (
              published &&
              (Date.parse(published) > Date.parse(retrievedAt) ||
                Date.parse(retrievedAt) - Date.parse(published) > 30 * 86400000)
            )
              continue;
            rows.push({
              canonicalAssetId: asset.id,
              symbol: asset.symbol,
              provider: "parallel-news",
              sourceUrl: result.url,
              publishedAt: published,
              retrievedAt,
              expiresAt: new Date(
                Date.parse(retrievedAt) + 86400000,
              ).toISOString(),
              kind: "NEWS",
              lineageId: createHash("sha256")
                .update(title.toLowerCase().trim() || result.url)
                .digest("hex"),
              summary: (title || content).slice(0, 1000),
              claim: (content || title).slice(0, 2000),
              relevance:
                "Search match to canonical project name; relevance and token impact still require verification.",
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
    },
    {
      id: "stocktwits",
      configured: () =>
        Boolean(
          env.STOCKTWITS_FIRESTREAM_USERNAME &&
          env.STOCKTWITS_FIRESTREAM_PASSWORD,
        ),
      fetch: async (assets, signal) => {
        const data = await safeProviderJson(
          STOCKTWITS_FIRESTREAM_ALL_SYMBOLS_URL,
          {
            signal,
            headers: {
              Authorization: basicAuthForTest(
                env.STOCKTWITS_FIRESTREAM_USERNAME!,
                env.STOCKTWITS_FIRESTREAM_PASSWORD!,
              ),
            },
          },
          fetcher,
        );
        const now = Date.now();
        return parseStocktwitsFirestreamSnapshot(
          data,
          assets.map((a, i) => ({
            assetId: a.id,
            symbol: a.symbol,
            rank: i + 1,
          })),
          now,
        )
          .observations.filter(
            (o) =>
              o.sourceObservedAt <= now && now - o.sourceObservedAt < 86400000,
          )
          .map((o) => ({
            canonicalAssetId: o.assetId,
            symbol: o.symbol,
            provider: "stocktwits",
            sourceUrl: `https://stocktwits.com/symbol/${encodeURIComponent(o.symbol)}.X`,
            publishedAt: new Date(o.sourceObservedAt).toISOString(),
            retrievedAt: new Date(now).toISOString(),
            expiresAt: new Date(o.sourceObservedAt + 86400000).toISOString(),
            kind: "SOCIAL_ACTIVITY",
            lineageId: `stocktwits:${o.symbol}:${o.sourceObservedAt}`,
            summary: "Stocktwits normalized activity observation",
            claim: `Normalized message volume: ${o.messageVolume ?? "unavailable"}; sentiment: ${o.sentiment ?? "unavailable"}. Raw mention and unique-participant counts unavailable.`,
            relevance:
              "Provider-mapped activity, not a measured probability of profit.",
            verification: "UNVERIFIED",
            verificationSourceUrl: null,
            polarity: "MIXED",
            material: false,
            dataMode: "LIVE",
          }));
      },
    },
  ];
}
