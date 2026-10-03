import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { evaluateSwarmShadow, type SwarmContext } from "../strategy21/swarm.js";
import { readSwarmLedger, summarizeSwarmAttribution, summarizeSwarmCalibration, updateSwarmLedger } from "../server/swarmLedger.js";

const dirs: string[] = [];
afterEach(async () => {
  await Promise.all(dirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

function shadow() {
  const ctx: SwarmContext = {
    symbol: "ETH",
    snapshotFresh: true,
    observationFresh: true,
    priceUsd: 100,
    marketGate: { pass: true, btc30d: 5, btc90d: 12, breadth7d: 0.6, breadth30d: 0.55 },
    rotationScore: 0.76,
    recommendedPullbackPct: 6,
    eligibilityStatus: "ACTIVE_ELIGIBLE",
    eligibleMaxUsd: 37,
    positionAuthorityUsd: 37,
    researchEligibility: "ELIGIBLE",
    accountFresh: true,
    freeCashUsd: 200,
    reentry: false,
    hasOpenOrder: false,
    confidencePct: 75,
    socialShadow: { state: "INSUFFICIENT_DATA", samples: 0, netSentiment: null },
    graphShadow: { available: false, state: "INSUFFICIENT", confidence: null },
    blockedReasonCount: 0,
  };
  return evaluateSwarmShadow(ctx);
}


function syntheticRecord(
  index: number,
  outcomePct: number,
  scores: Partial<Record<string, number>>,
) {
  const swarm = structuredClone(shadow()) as any;
  for (const [id, score] of Object.entries(scores)) {
    const specialist = swarm.specialists[id];
    if (!specialist) continue;
    specialist.state = "KNOWN";
    specialist.score = score;
    specialist.reliability = 1;
    specialist.independenceFactor = 1;
    specialist.effectiveWeight = 0.1;
  }
  for (const specialist of Object.values(swarm.specialists) as any[]) {
    if (specialist.state !== "KNOWN") {
      specialist.state = "KNOWN";
      specialist.score = 0.5;
      specialist.reliability = 1;
      specialist.independenceFactor = 1;
      specialist.effectiveWeight = 0.1;
    }
  }
  const generatedAt = new Date(Date.parse("2026-10-01T00:00:00Z") + index * 10_000).toISOString();
  return {
    id: `synthetic-${index}`,
    generatedAt,
    symbol: "ETH",
    referencePriceUsd: 100,
    swarm,
    evaluations: [
      {
        horizon: "30m",
        dueAt: generatedAt,
        status: "RESOLVED",
        evaluatedAt: generatedAt,
        priceUsd: 100 * (1 + outcomePct / 100),
        returnPct: outcomePct,
      },
    ],
  };
}

async function writeSyntheticLedger(
  path: string,
  records: ReturnType<typeof syntheticRecord>[],
) {
  await writeFile(
    path,
    JSON.stringify({
      version: "swarm-ledger-v1",
      updatedAt: records.at(-1)?.generatedAt ?? null,
      archivedRecordCount: 0,
      records,
    }),
    "utf8",
  );
}

describe("swarm outcome ledger", () => {
  it("records all requested horizons and resolves forward outcomes without duplicating the episode", async () => {
    const dir = await mkdtemp(join(tmpdir(), "zobiris-swarm-"));
    dirs.push(dir);
    const path = join(dir, "ledger.json");
    const t0 = Date.parse("2026-10-03T12:00:00Z");

    await updateSwarmLedger(path, new Date(t0).toISOString(), [
      { symbol: "ETH", price: 100, swarmShadow: shadow() },
    ]);
    await updateSwarmLedger(path, new Date(t0 + 31 * 60_000).toISOString(), [
      { symbol: "ETH", price: 110, swarmShadow: shadow() },
    ]);

    const ledger = await readSwarmLedger(path, { symbol: "ETH" });
    expect(ledger.records).toHaveLength(1);
    const record = ledger.records[0]!;
    expect(record.evaluations.map((item) => item.horizon)).toEqual([
      "30m",
      "2h",
      "8h",
      "12h",
      "1d",
      "3d",
      "7d",
    ]);
    const thirty = record.evaluations.find((item) => item.horizon === "30m")!;
    expect(thirty.status).toBe("RESOLVED");
    expect(thirty.priceUsd).toBe(110);
    expect(thirty.returnPct).toBeCloseTo(10);
    expect(record.swarm.authority).toBe("SHADOW_ONLY_NO_TRADING_AUTHORITY");

    const calibration = await summarizeSwarmCalibration(path, { horizon: "30m" });
    expect(calibration.status).toBe("COLLECTING");
    expect(calibration.promotionAuthority).toBe("NONE_SHADOW_ONLY");
    expect(calibration.returnBasis).toBe(
      "REFERENCE_PRICE_MARK_TO_MARKET_NOT_EXECUTED_PNL",
    );
    expect(calibration.sampleSize).toBe(1);
    expect(calibration.consensus.sampleSize).toBe(1);
  });
  it("identifies incremental positive specialist edge after controlling for the other specialists", async () => {
    const dir = await mkdtemp(join(tmpdir(), "zobiris-swarm-positive-"));
    dirs.push(dir);
    const path = join(dir, "ledger.json");
    const records = Array.from({ length: 40 }, (_, index) => {
      const positive = index % 2 === 0;
      const outcome = positive ? 4 + (index % 5) * 0.1 : -4 - (index % 5) * 0.1;
      const weakControl = index % 4 < 2 ? 0.55 : 0.45;
      return syntheticRecord(index, outcome, {
        entry: positive ? 0.9 : 0.1,
        regime: weakControl,
        liquidity: weakControl,
        relative: 0.5,
        sentiment: 0.5,
        onchainWhale: 0.5,
        portfolioRisk: 0.5,
        critic: 0.5,
      });
    });
    await writeSyntheticLedger(path, records);

    const calibration = await summarizeSwarmCalibration(path, { horizon: "30m" });
    expect(calibration.status).toBe("EVALUABLE");
    expect(calibration.attribution.entry.status).toBe("POSITIVE_EDGE");
    expect(calibration.attribution.entry.shrunkPartialCorrelation).toBeGreaterThan(0.08);
    expect(calibration.attribution.entry.directionalLiftPctPoints).toBeGreaterThan(2);
    expect(calibration.attribution.entry.weightReview).toBe("REVIEW_FOR_MORE_WEIGHT");
    expect(calibration.attribution.entry.automaticWeightChange).toBe(false);
  });

  it("identifies redundant specialists instead of rewarding duplicated confirmation", async () => {
    const dir = await mkdtemp(join(tmpdir(), "zobiris-swarm-redundant-"));
    dirs.push(dir);
    const path = join(dir, "ledger.json");
    const records = Array.from({ length: 40 }, (_, index) => {
      const positive = index % 2 === 0;
      const common = positive ? 0.8 : 0.2;
      const outcome = positive ? 3 + (index % 3) * 0.1 : -3 - (index % 3) * 0.1;
      return syntheticRecord(index, outcome, {
        regime: common,
        entry: common,
        liquidity: common,
        relative: common,
        sentiment: common,
        onchainWhale: common,
        portfolioRisk: common,
        critic: common,
      });
    });
    await writeSyntheticLedger(path, records);

    const calibration = await summarizeSwarmCalibration(path, { horizon: "30m" });
    expect(calibration.attribution.regime.status).toBe("REDUNDANT");
    expect(calibration.attribution.regime.specialistConsensusWithoutCorrelation).toBeGreaterThan(0.85);
    expect(calibration.attribution.regime.weightReview).toBe("REVIEW_FOR_REDUNDANCY");
  });

  it("identifies negative incremental edge without automatically changing weights", async () => {
    const dir = await mkdtemp(join(tmpdir(), "zobiris-swarm-negative-"));
    dirs.push(dir);
    const path = join(dir, "ledger.json");
    const records = Array.from({ length: 40 }, (_, index) => {
      const positive = index % 2 === 0;
      const outcome = positive ? 5 + (index % 4) * 0.1 : -5 - (index % 4) * 0.1;
      const weakControl = index % 4 < 2 ? 0.55 : 0.45;
      return syntheticRecord(index, outcome, {
        critic: positive ? 0.1 : 0.9,
        regime: weakControl,
        entry: weakControl,
        liquidity: 0.5,
        relative: 0.5,
        sentiment: 0.5,
        onchainWhale: 0.5,
        portfolioRisk: 0.5,
      });
    });
    await writeSyntheticLedger(path, records);

    const calibration = await summarizeSwarmCalibration(path, { horizon: "30m" });
    expect(calibration.attribution.critic.status).toBe("NEGATIVE_EDGE");
    expect(calibration.attribution.critic.shrunkPartialCorrelation).toBeLessThan(-0.08);
    expect(calibration.attribution.critic.directionalLiftPctPoints).toBeLessThan(-2);
    expect(calibration.attribution.critic.weightReview).toBe("REVIEW_FOR_LESS_WEIGHT");
    expect(calibration.attribution.critic.automaticWeightChange).toBe(false);

    const report = await summarizeSwarmAttribution(path);
    expect(report.version).toBe("SWARM_ATTRIBUTION_V1");
    expect(report.authority).toBe("SHADOW_ONLY_NO_AUTOMATIC_WEIGHT_CHANGES");
    expect(report.specialists.critic.automaticWeightChange).toBe(false);
  });

  it("preserves a corrupt ledger instead of replacing it with empty history", async () => {
    const dir = await mkdtemp(join(tmpdir(), "zobiris-swarm-corrupt-"));
    dirs.push(dir);
    const path = join(dir, "ledger.json");
    await writeFile(path, "{broken-json", "utf8");

    await expect(
      updateSwarmLedger(path, "2026-10-03T12:00:00.000Z", [
        { symbol: "ETH", price: 100, swarmShadow: shadow() },
      ]),
    ).rejects.toBeTruthy();
    expect(await readFile(path, "utf8")).toBe("{broken-json");
  });
});
