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

it("imports a release bundle once without renewing evidence on restart", async () => {
  const { applyResearchBundle } = await import("../server/researchRuntime.js");
  const repo = openResearchEvidence(":memory:", new Map([["QNT", "qnt"]]));
  const record = {canonicalAssetId:"qnt",symbol:"QNT",provider:"connector",sourceUrl:"https://quant.network/news",publishedAt:null,retrievedAt:"2026-10-03T07:00:00Z",expiresAt:"2026-10-03T08:00:00Z",kind:"NEWS",lineageId:"test",summary:"Observed announcement",claim:"A project announced a change",relevance:"Review token relevance",verification:"UNVERIFIED",verificationSourceUrl:null,polarity:"MIXED",material:false,dataMode:"LIVE"};
  try {
    applyResearchBundle(repo, {id:"release-test",records:[record]}, Date.parse("2026-10-03T07:10:00Z"));
    expect(repo.list("qnt")[0]?.dataMode).toBe("IMPORTED");
    const received=repo.getState("lastImportAt");
    applyResearchBundle(repo, {id:"release-test",records:[record]}, Date.parse("2026-10-03T09:00:00Z"));
    expect(repo.getState("lastImportAt")).toBe(received);
    expect(researchView(repo,[{id:"qnt",symbol:"QNT",name:"Quant"}],Date.parse("2026-10-03T09:00:00Z")).assets[0]?.newsStatus).toBe("STALE");
    expect(repo.list("qnt")).toHaveLength(1);
  } finally {repo.close();}
});
it("rejects mismatched release identities without marking the bundle imported", async () => {
  const { applyResearchBundle } = await import("../server/researchRuntime.js");
  const repo=openResearchEvidence(":memory:",new Map());
  try {
    applyResearchBundle(repo,{id:"invalid",records:[{symbol:"QNT"}]});
    expect(repo.getState("bundle:invalid")).toBeNull();
    expect(repo.getState("bundleImportStatus")).toMatchObject({status:"FAILED"});
    expect(repo.getState("lastImportAt")).toBeNull();
  } finally {repo.close();}
});

it("validates the actual connector bundle and queues its confirmed QNT catalyst", async () => {
 const {applyResearchBundle}=await import("../server/researchRuntime.js");
 const {releaseResearchBundle}=await import("../server/researchImportBundle.js");
 const repo=openResearchEvidence(":memory:",new Map([["QNT","41351d72-b10d-4ab1-9a70-66aa5943c4b5"],["BTC","f31da15e-f756-4051-ac90-1296488d9952"]]));
 try {
  applyResearchBundle(repo,releaseResearchBundle,Date.parse("2026-10-03T07:50:00Z"));
  expect(repo.getState("bundleImportStatus")).toMatchObject({status:"IMPORTED",accepted:3});
  expect(repo.readReview("41351d72-b10d-4ab1-9a70-66aa5943c4b5")).toMatchObject({status:"REVIEW_REQUIRED"});
 } finally {repo.close();}
});
