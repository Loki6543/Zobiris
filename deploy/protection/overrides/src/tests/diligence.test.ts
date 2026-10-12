import { describe, expect, it } from "vitest";
import { evaluateEvmSecurity, evaluateSolanaSecurity, goPlusPath, parseCoinDetail, parseGithubParticipation } from "../strategyV2/diligence";
import { screenSmallCap } from "../strategyV2/smallCapScreen";
import { checkCoin } from "../server/diligenceService";

const base = { symbol: "X", cmcRank: 150, marketCapUsd: 300e6, fullyDilutedValueUsd: 330e6, volume24hUsd: 15e6, ageDays: 900, krakenListed: true,
  change30dPct: 6, change90dPct: -30, btcChange30dPct: 5, drawdownFromAthPct: -85, priceAboveSma50: true, unlockShareNext60d: 0 };
const regime = { allowSmallCapBets: true, state: "RISK_ON" as const };

describe("small-cap contract diligence", () => {
  it("finds the token's home chain and contract; native coins have none", () => {
    expect(parseCoinDetail({ id: "c", asset_platform_id: "ethereum", platforms: { ethereum: "0xabc" }, links: { repos_url: { github: ["https://github.com/o/r", "https://github.com/o"] } } }))
      .toEqual({ assetPlatformId: "ethereum", contract: "0xabc", githubRepos: ["https://github.com/o/r"] });
    expect(parseCoinDetail({ id: "t", asset_platform_id: null, platforms: { "": "" } }).contract).toBeNull();
    expect([goPlusPath("ethereum"), goPlusPath("solana"), goPlusPath("chiliz")]).toEqual(["/api/v1/token_security/1", "/api/v1/solana/token_security", null]);
  });
  it("vetoes honeypots, taxes and owner balance powers; warns on mintable and concentration", () => {
    const evm = (t: object) => evaluateEvmSecurity({ result: { "0xa": t } }, "0xA", "ethereum");
    expect(evm({ is_honeypot: "1" }).vetoes).toContain("HONEYPOT");
    expect(evm({ sell_tax: "0.05" }).vetoes).toContain("TRANSFER_TAX");
    expect(evm({ owner_change_balance: "1" }).status).toBe("FAIL");
    const warn = evm({ is_mintable: "1", holders: Array.from({ length: 10 }, () => ({ percent: "0.05", is_contract: 0 })) });
    expect([warn.status, warn.warnings, Math.round(warn.top10HolderPct!)]).toEqual(["WARN", ["MINTABLE", "TOP10_WALLETS_OVER_40PCT"], 50]);
    expect(evm({ holders: [{ percent: "0.9", is_contract: 1 }] }).status).toBe("PASS"); // contracts (staking, bridges) excluded
    expect(evaluateEvmSecurity({ result: {} }, "0xa", "ethereum").status).toBe("UNCHECKED");
  });
  it("vetoes active Solana mint or freeze authority", () => {
    expect(evaluateSolanaSecurity({ result: { M: { mintable: { status: "1" }, freezable: { status: "0" } } } }, "M").vetoes).toEqual(["MINT_AUTHORITY_ACTIVE"]);
    expect(evaluateSolanaSecurity({ result: { M: { mintable: { status: "0" }, freezable: { status: "0" }, holders: [] } } }, "M").status).toBe("PASS");
  });
  it("feeds the screen: fail and unchecked block a bet, warnings and passes are notes", () => {
    expect(screenSmallCap({ ...base, security: { status: "FAIL", vetoes: ["HONEYPOT"], warnings: [] } }, regime).rejections).toEqual(["CONTRACT_RISK_HONEYPOT"]);
    expect(screenSmallCap({ ...base, security: { status: "UNCHECKED", vetoes: [], warnings: [] } }, regime).eligible).toBe(false);
    const w = screenSmallCap({ ...base, security: { status: "WARN", vetoes: [], warnings: ["MINTABLE"] } }, regime);
    expect([w.eligible, w.notes]).toEqual([true, ["UNLOCK_SCHEDULE_VERIFIED", "CONTRACT_MINTABLE"]]);
    expect(screenSmallCap({ ...base, security: { status: "NATIVE", vetoes: [], warnings: [] } }, regime).eligible).toBe(true);
  });
  it("counts GitHub commits over the last 12 weeks", () => {
    expect(parseGithubParticipation({ all: [...Array(40).fill(9), ...Array(12).fill(2)] })).toBe(24);
    expect(parseGithubParticipation({})).toBeNull();
  });
  it("chains CoinGecko -> GoPlus -> GitHub for one coin", async () => {
    (globalThis as any).__realTimeout ??= globalThis.setTimeout;
    const calls: string[] = [];
    const fetcher = async (url: string) => {
      calls.push(new URL(url).host);
      const body = url.includes("coingecko") ? { id: "c", asset_platform_id: "ethereum", platforms: { ethereum: "0xa" }, links: { repos_url: { github: ["https://github.com/o/r"] } } }
        : url.includes("gopluslabs") ? { result: { "0xa": { is_mintable: "0" } } } : { all: Array(52).fill(1) };
      return { ok: true, status: 200, json: async () => body };
    };
    const d = await checkCoin("c", fetcher as any, 0);
    expect(calls).toEqual(["api.coingecko.com", "api.gopluslabs.io", "api.github.com"]);
    expect([d.security.status, d.commits12w]).toEqual(["PASS", 12]);
  }, 10_000);
});
