import { it, expect, vi } from "vitest";
import { openResearchEvidence } from "../server/researchEvidence.js";
import {
  researchView,
  startResearchTimers,
  snapshotFreshness,
  fetchOutcomeQuotes,
} from "../server/researchRuntime.js";
it("has no fixture attention or fake timestamps when evidence is absent", () => {
  const repo = openResearchEvidence(":memory:", new Map());
  try {
    const view = researchView(
      repo,
      [{ id: "qnt", symbol: "QNT", name: "Quant" }],
      Date.now(),
    );
    expect(view.attentionIgnition).toEqual([]);
    expect(view.provenance.source).toBe("persistent-research-evidence");
    expect(view.assets[0]!.newsStatus).toBe("UNAVAILABLE");
    expect(view.asOf).toBeNull();
  } finally {
    repo.close();
  }
});
it("marks 31-minute snapshots stale independently of account freshness", () => {
  const now = Date.now();
  expect(snapshotFreshness(now - 31 * 60000, now)).toBe("stale");
  expect(snapshotFreshness(now + 1, now)).toBe("missing");
  expect(snapshotFreshness(null, now)).toBe("missing");
});
it("runs every five minutes without UI, skips overlap and stops cleanly", async () => {
  vi.useFakeTimers();
  let calls = 0;
  let release!: () => void;
  const wait = new Promise<void>((r) => (release = r));
  const stop = startResearchTimers(async () => {
    calls++;
    await wait;
  });
  await vi.advanceTimersByTimeAsync(600000);
  expect(calls).toBe(1);
  release();
  await vi.advanceTimersByTimeAsync(300000);
  expect(calls).toBe(2);
  stop();
  await vi.advanceTimersByTimeAsync(600000);
  expect(calls).toBe(2);
  vi.useRealTimers();
});
it("uses canonical CMC IDs and refuses missing timestamps and wrong returned symbols", async () => {
  const assets = [{ id: "qnt", symbol: "QNT", name: "Quant", cmcId: "3155" }];
  const rows = await fetchOutcomeQuotes(
    ["QNT", "UNKNOWN"],
    assets,
    {},
    async (url) => {
      expect(String(url)).toContain("id=3155");
      return new Response(
        JSON.stringify([
          {
            id: 3155,
            symbol: "BTC",
            quote: [
              {
                symbol: "USD",
                price: 100,
                last_updated: "2026-10-03T00:00:00Z",
              },
            ],
          },
        ]),
      );
    },
  );
  expect(rows).toEqual([]);
});
