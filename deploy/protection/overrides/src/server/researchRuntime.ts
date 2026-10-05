import { normalizeCmcV3Shape } from "../providers/cmcQuoteShape.js";
import { importResearchEvidence, safeProviderJson, type ResearchAsset } from "./researchCollection.js";
import type { EvidenceRepo } from "./researchEvidence.js";
import type { OutcomeQuote } from "./outcomeMemory.js";
import { evaluateReassessment } from "./reassessment.js";
import { summarizeSocialIntelligence } from "./socialIntelligence.js";
export function snapshotFreshness(at: number | null, now = Date.now()) {
  return at == null || !Number.isFinite(at) || at > now
    ? "missing"
    : now - at > 30 * 60000
      ? "stale"
      : "current";
}
export async function fetchOutcomeQuotes(
  symbols: string[],
  assets: ResearchAsset[],
  env: NodeJS.ProcessEnv,
  fetcher: typeof fetch = fetch,
): Promise<OutcomeQuote[]> {
  const selected = assets.filter(
    (a) => symbols.includes(a.symbol) && a.cmcId && /^\d+$/.test(a.cmcId),
  );
  if (!selected.length) return [];
  const key = env.CMC_API_KEY;
  const base = key
    ? "https://pro-api.coinmarketcap.com"
    : "https://pro-api.coinmarketcap.com/public-api";
  const raw = await safeProviderJson(
    `${base}/v3/cryptocurrency/quotes/latest?id=${selected.map((a) => a.cmcId).join(",")}&convert=USD&skip_invalid=true`,
    {
      headers: key
        ? { "X-CMC_PRO_API_KEY": key }
        : { Accept: "application/json" },
    },
    fetcher,
  );
  const data = normalizeCmcV3Shape(raw);
  if (data?.status?.error_code) throw Error("Quote provider rejected");
  const out: OutcomeQuote[] = [];
  for (const row of Object.values(data?.data ?? {}) as any[]) {
    const asset = selected.find(
      (a) =>
        a.cmcId === String(row.id) &&
        a.symbol === String(row.symbol).toUpperCase(),
    );
    const q = row.quote?.USD;
    if (
      asset &&
      typeof q?.price === "number" &&
      q.price > 0 &&
      typeof q.last_updated === "string" &&
      Number.isFinite(Date.parse(q.last_updated))
    )
      out.push({
        symbol: asset.symbol,
        priceUsd: q.price,
        observedAt: q.last_updated,
      });
  }
  return out;
}
export function researchView(
  repo: EvidenceRepo,
  assets: ResearchAsset[],
  now = Date.now(),
) {
  const rows = assets.map((a) => {
    const evidence = repo.list(a.id);
    const current = evidence.filter(
      (e) => Date.parse(e.expiresAt) > now && Date.parse(e.retrievedAt) <= now,
    );
    const status = (kind: "news" | "social") => {
      const filter = (e: (typeof evidence)[number]) =>
        kind === "social"
          ? e.kind === "SOCIAL_ACTIVITY"
          : e.kind !== "SOCIAL_ACTIVITY";
      return current.some(filter)
        ? "AVAILABLE"
        : evidence.some(filter)
          ? "STALE"
          : "UNAVAILABLE";
    };
    const review = evaluateReassessment(
      repo.readReview(a.id),
      evidence,
      now,
      a.id,
    );
    return {
      symbol: a.symbol,
      assetId: a.id,
      newsStatus: status("news"),
      socialStatus: status("social"),
      review,
      socialIntelligence: summarizeSocialIntelligence(evidence, now),
      evidence,
    };
  });
  const attention = rows.flatMap((a) =>
    a.evidence
      .filter(
        (e) => e.kind === "SOCIAL_ACTIVITY" && Date.parse(e.expiresAt) > now,
      )
      .map((e) => ({
        symbol: a.symbol,
        state: "OBSERVED_UNVALIDATED",
        dataMode: e.dataMode,
        observedAt: e.publishedAt,
        summary: e.claim,
        authority: "SHADOW_ONLY_NO_TRADING_AUTHORITY",
      })),
  );
  const times = rows
    .flatMap((a) => a.evidence.map((e) => Date.parse(e.retrievedAt)))
    .filter(Number.isFinite);
  return {
    authority: "SHADOW_ONLY_NO_TRADING_AUTHORITY",
    asOf: times.length ? new Date(Math.max(...times)).toISOString() : null,
    checkedAt: new Date(now).toISOString(),
    provenance: {
      source: "persistent-research-evidence",
      dataMode: rows.some((a) => a.evidence.length)
        ? "evidence"
        : "unavailable",
      note: "Imported and live observations are labeled individually. Research priority is not investment authority.",
    },
    attentionIgnition: attention,
    assets: rows,
    providers: ["parallel-news", "stocktwits", "cryptobert-stocktwits", "brightdata-mcp-search"].map(
      (p) =>
        repo.getState("provider:" + p) ?? {
          provider: p,
          status: "NOT_CONFIGURED",
          lastSuccessAt: null,
        },
    ),
    outcomeCollection: repo.getState("outcomes"),
    lastImportAt: repo.getState("lastImportAt"),
    bundleImportStatus: repo.getState("bundleImportStatus"),
  };
}
export function startResearchTimers(tick: () => Promise<void>) {
  let running = false,
    stopped = false;
  const run = async () => {
    if (running || stopped) return;
    running = true;
    try {
      await tick();
    } catch {
      /* Component status reports failures; runtime must survive provider failure. */
    } finally {
      running = false;
    }
  };
  const timer = setInterval(() => {
    void run();
  }, 300000);
  timer.unref?.();
  void run();
  return () => {
    stopped = true;
    clearInterval(timer);
  };
}

// Deployment-reviewed public research only; HTTP imports retain operator authentication.
export function applyResearchBundle(repo: EvidenceRepo, bundle: {id:string;records:unknown[]}, now=Date.now()) {
  if (repo.getState("bundle:"+bundle.id)) return;
  try {
    const result=importResearchEvidence(repo,bundle.records,true,now);
    repo.setState("bundle:"+bundle.id,{...result,importedAt:new Date(now).toISOString()});
    repo.setState("bundleImportStatus",{status:"IMPORTED",id:bundle.id,...result});
  } catch {
    repo.setState("bundleImportStatus",{status:"FAILED",id:bundle.id,message:"Research bundle validation failed; no successful import recorded."});
  }
}
