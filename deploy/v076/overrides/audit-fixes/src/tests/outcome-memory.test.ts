import test from "node:test";
import assert from "node:assert/strict";
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
            opportunityScore: 0.7,
            researchScore: 70,
            evidenceQuality: 0.8,
            thesisId: "btc:2026-09-25T20:00:00.000Z:thesis-v1",
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

test("decision outcome memory records a seed and resolves due horizons without look-ahead", async () => {
  const dir = await mkdtemp(join(tmpdir(), "zobiris-outcome-"));
  const path = join(dir, "outcomes.json");
  try {
    await updateOutcomeMemory(path, snapshot("2026-09-25T20:00:00.000Z", 100));
    let memory = await readOutcomeMemory(path, "BTC");
    assert.equal(memory.records.length, 1);
    assert.equal(memory.records[0]!.evaluations.find((item) => item.horizon === "1H")!.evaluatedAt, null);

    await updateOutcomeMemory(path, snapshot("2026-09-25T21:05:00.000Z", 105));
    memory = await readOutcomeMemory(path, "BTC");
    const record = memory.records[0]!;
    const oneHour = record.evaluations.find((item) => item.horizon === "1H")!;
    const fourHour = record.evaluations.find((item) => item.horizon === "4H")!;
    assert.equal(oneHour.evaluatedAt, "2026-09-25T21:05:00.000Z");
    assert.ok(Math.abs((oneHour.returnPct ?? 0) - 5) < 1e-9);
    assert.equal(fourHour.evaluatedAt, null);
    assert.ok(record.maxFavorablePct >= 5);
    assert.equal(record.maxAdversePct, 0);

    const summary = summarizeOutcomeMemory(memory.records);
    assert.equal(summary.byHorizon["1H"].count, 1);
    assert.equal(summary.byHorizon["1H"].positiveRate, 1);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("outcome memory tracks adverse excursion independently of horizon evaluation", async () => {
  const dir = await mkdtemp(join(tmpdir(), "zobiris-outcome-"));
  const path = join(dir, "outcomes.json");
  try {
    await updateOutcomeMemory(path, snapshot("2026-09-25T20:00:00.000Z", 100));
    await updateOutcomeMemory(path, snapshot("2026-09-25T20:30:00.000Z", 92));
    const memory = await readOutcomeMemory(path, "BTC");
    assert.ok(memory.records[0]!.maxAdversePct <= -8);
    assert.equal(memory.records[0]!.evaluations.find((item) => item.horizon === "1H")!.evaluatedAt, null);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
