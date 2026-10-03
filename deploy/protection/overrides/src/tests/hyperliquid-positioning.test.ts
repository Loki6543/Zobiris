import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  collectHyperliquidPositioning,
  parseHyperliquidPositioning,
  readLatestHyperliquidPositioning,
} from "../server/hyperliquidPositioning.js";

const dirs: string[] = [];
afterEach(async () => {
  await Promise.all(
    dirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })),
  );
});

function payload(options: {
  btcOi: number;
  ethOi?: number;
  solOi?: number;
  btcMark?: number;
  btcFunding?: number;
  btcPremium?: number;
}) {
  return [
    {
      universe: [
        { name: "BTC", szDecimals: 5, maxLeverage: 40 },
        { name: "ETH", szDecimals: 4, maxLeverage: 25 },
        { name: "SOL", szDecimals: 2, maxLeverage: 20 },
      ],
    },
    [
      {
        markPx: String(options.btcMark ?? 100),
        oraclePx: "99.8",
        prevDayPx: "95",
        dayNtlVlm: "1000000",
        funding: String(options.btcFunding ?? 0.00005),
        openInterest: String(options.btcOi),
        premium: String(options.btcPremium ?? 0.0008),
      },
      {
        markPx: "50",
        oraclePx: "50",
        prevDayPx: "49",
        dayNtlVlm: "800000",
        funding: "-0.00001",
        openInterest: String(options.ethOi ?? 1000),
        premium: "-0.0001",
      },
      {
        markPx: "20",
        oraclePx: "20",
        prevDayPx: "20.5",
        dayNtlVlm: "400000",
        funding: "-0.00004",
        openInterest: String(options.solOi ?? 2000),
        premium: "-0.0006",
      },
    ],
  ];
}

function fetcherFor(body: unknown): typeof fetch {
  return (async () =>
    new Response(JSON.stringify(body), {
      status: 200,
      headers: { "content-type": "application/json" },
    })) as typeof fetch;
}

describe("Hyperliquid positioning shadow", () => {
  it("pairs the universe and asset contexts by index without inventing wallet data", () => {
    const rows = parseHyperliquidPositioning(payload({ btcOi: 1000 }));
    expect(rows.map((row) => row.symbol)).toEqual(["BTC", "ETH", "SOL"]);
    expect(rows[0]!.openInterestUnits).toBe(1000);
    expect(rows[0]!.openInterestUsd).toBe(100000);
    expect(rows[0]!.premiumPct).toBeCloseTo(0.08);
  });

  it("derives a large leveraged-long build only after a meaningful prior OI observation", async () => {
    const dir = await mkdtemp(join(tmpdir(), "zobiris-hyperliquid-"));
    dirs.push(dir);
    const path = join(dir, "positioning.json");
    const t0 = Date.parse("2026-10-03T12:00:00Z");

    const first = await collectHyperliquidPositioning(
      path,
      ["BTC", "ETH", "SOL"],
      fetcherFor(payload({ btcOi: 1000 })),
      t0,
    );
    expect(first.get("BTC")?.flowState).toBe("DELTA_UNAVAILABLE");

    const second = await collectHyperliquidPositioning(
      path,
      ["BTC", "ETH", "SOL"],
      fetcherFor(
        payload({
          btcOi: 1250,
          ethOi: 1010,
          solOi: 1990,
          btcMark: 102,
          btcFunding: 0.00008,
          btcPremium: 0.001,
        }),
      ),
      t0 + 10 * 60_000,
    );
    const btc = second.get("BTC")!;
    expect(btc.oiChangePct).toBeCloseTo(25);
    expect(btc.priceChangeSincePriorPct).toBeCloseTo(2);
    expect(btc.oiAbsoluteMovePercentile).toBe(1);
    expect(btc.flowState).toBe("LEVERAGED_LONG_BUILD");
    expect(btc.crowdingState).toBe("CROWDED_LONG");
    expect(btc.whaleWalletEvidence).toBe("UNKNOWN_PUBLIC_AGGREGATE_ONLY");
    expect(btc.authority).toBe("SHADOW_ONLY_NO_TRADING_AUTHORITY");
  });

  it("does not serve stale persisted positioning as current evidence", async () => {
    const dir = await mkdtemp(join(tmpdir(), "zobiris-hyperliquid-stale-"));
    dirs.push(dir);
    const path = join(dir, "positioning.json");
    const t0 = Date.parse("2026-10-03T12:00:00Z");

    await collectHyperliquidPositioning(
      path,
      ["BTC", "ETH", "SOL"],
      fetcherFor(payload({ btcOi: 1000 })),
      t0,
    );
    const stale = await readLatestHyperliquidPositioning(path, {
      now: t0 + 31 * 60_000,
      maxAgeMs: 30 * 60_000,
    });
    expect(stale.size).toBe(0);
  });

  it("filters a malformed persisted record without losing valid history", async () => {
    const dir = await mkdtemp(join(tmpdir(), "zobiris-hyperliquid-malformed-"));
    dirs.push(dir);
    const path = join(dir, "positioning.json");
    const t0 = Date.parse("2026-10-03T12:00:00Z");

    await collectHyperliquidPositioning(
      path,
      ["BTC", "ETH", "SOL"],
      fetcherFor(payload({ btcOi: 1000 })),
      t0,
    );
    const stored = JSON.parse(await readFile(path, "utf8"));
    stored.records.push(null, { provider: "hyperliquid", symbol: "BTC" });
    await writeFile(path, JSON.stringify(stored), "utf8");

    const latest = await readLatestHyperliquidPositioning(path, {
      now: t0 + 5 * 60_000,
    });
    expect(latest.get("BTC")?.provider).toBe("hyperliquid");
    expect(latest.size).toBe(3);
  });

  it("fails closed on a truncated universe/context response", () => {
    expect(() =>
      parseHyperliquidPositioning([
        { universe: [{ name: "BTC" }, { name: "ETH" }] },
        [{ markPx: "100" }],
      ]),
    ).toThrow(/alignment/i);
  });
});
