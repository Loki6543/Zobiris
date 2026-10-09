import { describe, expect, it } from "vitest";
import { attentionAvailabilityView, providerHealthView } from "../server/providerPolicy.js";
import { localChallengeEvidence } from "../server/localChallenger.js";

describe("optional provider and challenger fallbacks", () => {
  it("removes credential-gated optional providers from degraded health and names the active substitutes", () => {
    const view = providerHealthView([
      { provider: "kraken", status: "connected", freshness: "live" },
      { provider: "cmc", status: "connected", freshness: "live" },
      { provider: "lunarcrush", status: "credentials-needed" },
      { provider: "coinglass", status: "credentials-needed" },
      { provider: "coinmarketcal", status: "credentials-needed" },
    ]);
    expect(view.providers.map((row) => row.provider)).toEqual(["kraken", "cmc"]);
    expect(view.optionalFallbacks.map((row) => row.provider)).toEqual([
      "lunarcrush",
      "coinglass",
      "coinmarketcal",
    ]);
    expect(view.optionalFallbacks.every((row) => row.status === "COVERED_BY_FALLBACK")).toBe(true);
  });

  it("treats missing Stocktwits credentials as an optional challenger gap when the CMC baseline completed", () => {
    const view = attentionAvailabilityView({ status: "PARTIAL", runId: "r1" }, {});
    expect(view.status).toBe("BASELINE_COMPLETE");
    expect(view.baseline).toBe("CMC_KEYLESS");
  });

  it("does not hide a partial attention state when Stocktwits was configured", () => {
    const view = attentionAvailabilityView(
      { status: "PARTIAL" },
      { STOCKTWITS_FIRESTREAM_USERNAME: "u", STOCKTWITS_FIRESTREAM_PASSWORD: "p" },
    );
    expect(view.status).toBe("PARTIAL");
  });

  it("provides a deterministic advisory challenger without external credentials", () => {
    const output = localChallengeEvidence({
      symbol: "BTC",
      claimId: "c1",
      claims: [
        { id: "c1", source: "source-a", factorFamily: "macro", claim: "Liquidity improves.", evidenceConfidence: 0.8 },
        { id: "c2", source: "source-b", factorFamily: "macro", claim: "A separate source contradicts the liquidity claim.", epistemicState: "CONFLICTING" },
      ],
    });
    expect(output.mode).toBe("DETERMINISTIC_LOCAL_CHALLENGER_V1");
    expect(output.verdict).toBe("CONTESTED");
    expect(output.mayWriteExchange).toBe(false);
    expect(output.canPromote).toBe(false);
  });
});
