import { describe, expect, it } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { readOutcomeMemory, summarizeOutcomeMemory, updateOutcomeMemory } from "../server/outcomeMemory.js";

function snapshot(asOf: string, price: number) {
  return {
    asOf,
    rankedAssets: [{
      symbol: "BTC",
      strategy21: {
        researchIntegrity: {
          outcomeSeed: {
            outcomeId: "btc:2026-09-25T20:00:00.000Z:outcome-v1",
            symbol: "BTC",
            generatedAt: "2026-09-25T20:00:00.000Z",
            action: "HOLD",
            assetState: "CONFIRMED_TREND",
            referencePriceUsd: price,
            priceObservedAt: asOf,
            opportunityScore: 0.7,
            researchScore: 70,
            evidenceQuality: 0.8,
            thesisId: "btc:2026-09-25T20:00:00.000Z:thesis-v1",
            strategyTag: "DELAYED_ROTATION_PILOT_V1",
            strategyStatus: "QUALIFIED",
            recommendedPullbackPct: 5,
            horizons: [
              { horizon: "1H" as const, dueAt: "2026-09-25T21:00:00.000Z" },
              { horizon: "4H" as const, dueAt: "2026-09-26T00:00:00.000Z" },
              { horizon: "1D" as const, dueAt: "2026-09-26T20:00:00.000Z" },
              { horizon: "3D" as const, dueAt: "2026-09-28T20:00:00.000Z" },
              { horizon: "7D" as const, dueAt: "2026-10-02T20:00:00.000Z" },
            ],
          },
        },
      },
    }],
  };
}

describe("decision outcome memory", () => {
it("records a seed and resolves due horizons without look-ahead", async () => {
  const dir = await mkdtemp(join(tmpdir(), "zobiris-outcome-"));
  const path = join(dir, "outcomes.json");
  try {
    await updateOutcomeMemory(path, snapshot("2026-09-25T20:00:00.000Z", 100));
    let memory = await readOutcomeMemory(path, "BTC");
    expect(memory.records.length).toBe(1);
    expect(memory.records[0]!.strategyTag).toBe("DELAYED_ROTATION_PILOT_V1");
    expect(memory.records[0]!.strategyStatus).toBe("QUALIFIED");
    expect(memory.records[0]!.recommendedPullbackPct).toBe(5);
    expect(memory.records[0]!.evaluations.find((item) => item.horizon === "1H")!.evaluatedAt).toBeNull();

    await updateOutcomeMemory(path, snapshot("2026-09-25T21:05:00.000Z", 105));
    memory = await readOutcomeMemory(path, "BTC");
    const record = memory.records[0]!;
    const oneHour = record.evaluations.find((item) => item.horizon === "1H")!;
    const fourHour = record.evaluations.find((item) => item.horizon === "4H")!;
    expect(oneHour.evaluatedAt).toBe("2026-09-25T21:05:00.000Z");
    expect(oneHour.returnPct ?? 0).toBeCloseTo(5, 9);
    expect(fourHour.evaluatedAt).toBeNull();
    expect(record.maxFavorablePct).toBeGreaterThanOrEqual(5);
    expect(record.maxAdversePct).toBe(0);

    const summary = summarizeOutcomeMemory(memory.records);
    expect(summary.byHorizon["1H"].count).toBe(1);
    expect(summary.byHorizon["1H"].positiveRate).toBe(1);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

it("tracks adverse excursion independently of horizon evaluation", async () => {
  const dir = await mkdtemp(join(tmpdir(), "zobiris-outcome-"));
  const path = join(dir, "outcomes.json");
  try {
    await updateOutcomeMemory(path, snapshot("2026-09-25T20:00:00.000Z", 100));
    await updateOutcomeMemory(path, snapshot("2026-09-25T20:30:00.000Z", 92));
    const memory = await readOutcomeMemory(path, "BTC");
    expect(memory.records[0]!.maxAdversePct).toBeCloseTo(-8, 9);
    expect(memory.records[0]!.evaluations.find((item) => item.horizon === "1H")!.evaluatedAt).toBeNull();
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

});


it("expires late horizons instead of substituting today's price",async()=>{
 const dir=await mkdtemp(join(tmpdir(),'outcome-late-'));const path=join(dir,'memory.json');
 try{await updateOutcomeMemory(path,snapshot('2026-09-25T20:00:00.000Z',100));
 const r=await updateOutcomeMemory(path,snapshot('2026-09-25T22:00:00.000Z',130));
 expect(r.records[0]!.evaluations[0]!.returnPct).toBeNull();expect(r.records[0]!.evaluations[0]!.status).toBe('EXPIRED');
 }finally{await rm(dir,{recursive:true,force:true});}
});
it("deduplicates overlapping episodes and records sampled touches without inventing fills",async()=>{
 const dir=await mkdtemp(join(tmpdir(),'outcome-episode-'));const path=join(dir,'memory.json');
 try{await updateOutcomeMemory(path,snapshot('2026-09-25T20:00:00.000Z',100));
 const next=snapshot('2026-09-25T20:30:00.000Z',94);next.rankedAssets[0]!.strategy21.researchIntegrity.outcomeSeed.outcomeId='new-snapshot';
 next.rankedAssets[0]!.strategy21.researchIntegrity.outcomeSeed.generatedAt=next.asOf;
 const r=await updateOutcomeMemory(path,next);expect(r.records).toHaveLength(1);
 expect(r.records[0]!.proposedLimitUsd).toBe(95);expect(r.records[0]!.sampledTouchAt).toBe(next.asOf);expect(r.records[0]!.actualFill).toBeNull();
 }finally{await rm(dir,{recursive:true,force:true});}
});
it("does not use a pre-horizon quote or a future quote to resolve an outcome",async()=>{
 const dir=await mkdtemp(join(tmpdir(),'outcome-quotes-'));const path=join(dir,'memory.json');
 try{await updateOutcomeMemory(path,snapshot('2026-09-25T20:00:00.000Z',100));
 const s=snapshot('2026-09-25T21:05:00.000Z',110);s.rankedAssets[0]!.strategy21.researchIntegrity.outcomeSeed.priceObservedAt='2026-09-25T20:50:00.000Z';
 let r=await updateOutcomeMemory(path,s);expect(r.records[0]!.evaluations[0]!.returnPct).toBeNull();
 s.rankedAssets[0]!.strategy21.researchIntegrity.outcomeSeed.priceObservedAt='2026-09-25T22:00:00.000Z';
 r=await updateOutcomeMemory(path,s);expect(r.records[0]!.evaluations[0]!.returnPct).toBeNull();
 }finally{await rm(dir,{recursive:true,force:true});}
});
it('preserves overflow before pruning the active window and refuses corrupt history',async()=>{
 const {writeFile,readFile}=await import('node:fs/promises');
 const dir=await mkdtemp(join(tmpdir(),'outcome-archive-'));const path=join(dir,'memory.json');
 try{
 const first=await updateOutcomeMemory(path,snapshot('2026-09-25T20:00:00.000Z',100));
 const records=Array.from({length:5001},(_,i)=>({...first.records[0]!,measurementVersion:undefined,outcomeId:`old-${i}`}));
 await writeFile(path,JSON.stringify({version:'1.0',updatedAt:first.updatedAt,records}));
 const r=await updateOutcomeMemory(path,{asOf:'2026-09-26T00:00:00Z',rankedAssets:[]});
 expect(r.records).toHaveLength(5000);expect(r.archivedRecordCount).toBe(1);
 expect(JSON.parse((await readFile(path+'.archive.jsonl','utf8')).trim()).outcomeId).toBe('old-0');
 await writeFile(path,'corrupted');await expect(updateOutcomeMemory(path,snapshot('2026-09-26T00:00:00Z',100))).rejects.toThrow();
 expect(await readFile(path,'utf8')).toBe('corrupted');
 }finally{await rm(dir,{recursive:true,force:true});}
});
