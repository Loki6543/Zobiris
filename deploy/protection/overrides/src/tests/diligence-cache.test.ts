import { afterEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { getDiligence, resetDiligenceCache } from "../server/diligenceService";

const dir = mkdtempSync(join(tmpdir(), "zob-dil-"));
afterEach(() => { delete process.env.ZOBIRIS_DILIGENCE_CACHE_PATH; resetDiligenceCache(); });

// A native coin (no contract): one CoinGecko call, no GoPlus/GitHub, so the fetch count is exact.
const native = { id: "nat", links: { homepage: ["https://x.org"] }, asset_platform_id: null, platforms: {}, categories: [] };
const counting = () => { let calls = 0; const f = async () => { calls++; return { ok: true, status: 200, json: async () => native }; }; return { f, calls: () => calls }; };

describe("diligence cache persistence", () => {
  it("survives a restart: a reloaded cache serves the scan without refetching", async () => {
    process.env.ZOBIRIS_DILIGENCE_CACHE_PATH = join(dir, "a.json");
    const first = counting();
    expect((await getDiligence(["nat"], first.f as any, 1_000)).get("nat")?.security.status).toBe("NATIVE");
    expect(first.calls()).toBe(1);
    resetDiligenceCache(); // simulates a deploy: memory is gone, the file remains
    const second = counting();
    expect((await getDiligence(["nat"], second.f as any, 2_000)).get("nat")?.security.status).toBe("NATIVE");
    expect(second.calls()).toBe(0);
  });
  it("drops expired entries on load and ignores a corrupt file", async () => {
    process.env.ZOBIRIS_DILIGENCE_CACHE_PATH = join(dir, "b.json");
    await getDiligence(["nat"], counting().f as any, 1_000);
    resetDiligenceCache();
    const later = counting();
    await getDiligence(["nat"], later.f as any, 1_000 + 25 * 3_600_000); // past the 24h TTL
    expect(later.calls()).toBe(1);
    writeFileSync(join(dir, "b.json"), "{not json");
    resetDiligenceCache();
    const after = counting();
    await getDiligence(["nat"], after.f as any, 5_000);
    expect(after.calls()).toBe(1);
  });
});
process.on("exit", () => rmSync(dir, { recursive: true, force: true }));
