import { it, expect } from "vitest";
import { openResearchEvidence } from "../server/researchEvidence.js";
import {
  collectResearchTick,
  importResearchEvidence,
  safeProviderJson,
  researchAdapters,
} from "../server/researchCollection.js";
it("reports absent credentials and persists round-robin coverage", async () => {
  const repo = openResearchEvidence(":memory:", new Map());
  try {
    const assets = Array.from({ length: 8 }, (_, i) => ({
      id: String(i),
      symbol: "X" + i,
      name: "Asset " + i,
    }));
    const seen: string[] = [];
    const adapter = {
      id: "news",
      configured: () => true,
      fetch: async (a: any[]) => {
        seen.push(...a.map((x) => x.symbol));
        return [];
      },
    };
    await collectResearchTick(repo, [adapter], assets, Date.now());
    await collectResearchTick(repo, [adapter], assets, Date.now() + 300000);
    expect(new Set(seen).size).toBe(8);
    const result = await collectResearchTick(
      repo,
      [{ ...adapter, id: "social", configured: () => false }],
      assets,
      Date.now(),
    );
    expect(result[0]!.status).toBe("NOT_CONFIGURED");
  } finally {
    repo.close();
  }
});
it("requires authorization and enforces import limits", () => {
  const repo = openResearchEvidence(":memory:", new Map());
  try {
    expect(() => importResearchEvidence(repo, [], false)).toThrow(
      "Unauthorized",
    );
    expect(() =>
      importResearchEvidence(repo, Array(101).fill({}), true),
    ).toThrow();
    expect(() =>
      importResearchEvidence(repo, [{ claim: "a".repeat(1024 * 1024) }], true),
    ).toThrow();
  } finally {
    repo.close();
  }
});
it("rejects arbitrary destinations without fetching and forbids redirects", async () => {
  let called = false;
  await expect(
    safeProviderJson("https://127.0.0.1/a", {}, async () => {
      called = true;
      return new Response("{}");
    }),
  ).rejects.toThrow();
  expect(called).toBe(false);
  await expect(
    safeProviderJson(
      "https://api.parallel.ai/v1/search",
      {},
      async (_url, init) => {
        expect(init?.redirect).toBe("error");
        return new Response("x".repeat(1024 * 1024 + 1));
      },
    ),
  ).rejects.toThrow();
});

it("does not revive stale social observations on retrieval", async () => {
  const now = Date.now();
  const adapter = researchAdapters(
    {
      STOCKTWITS_FIRESTREAM_USERNAME: "test",
      STOCKTWITS_FIRESTREAM_PASSWORD: "test",
    },
    async () =>
      new Response(
        JSON.stringify({
          "QNT.X": {
            now: {
              date: new Date(now - 2 * 86400000).toISOString(),
              mN: 0.8,
              sN: 0.7,
            },
          },
        }),
      ),
  )[1]!;
  expect(
    await adapter.fetch(
      [{ id: "qnt", symbol: "QNT", name: "Quant" }],
      AbortSignal.timeout(1000),
    ),
  ).toEqual([]);
});

it("does not assign a common-word ticker in unrelated news to a canonical coin", async () => {
  const adapter = researchAdapters(
    { PARALLEL_API_KEY: "test" },
    async () =>
      new Response(
        JSON.stringify({
          results: [
            {
              url: "https://example.com/article",
              title: "One person found a new job",
              excerpts: ["One step toward a new career."],
            },
          ],
        }),
      ),
  )[0]!;
  expect(
    await adapter.fetch(
      [{ id: "harmony", symbol: "ONE", name: "Harmony" }],
      AbortSignal.timeout(1000),
    ),
  ).toEqual([]);
});
