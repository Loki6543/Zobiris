import { describe, expect, it } from "vitest";
import { evaluateMinimumEvidence } from "./minimumEvidence.js";

describe("MinimumEvidence", () => {
  it("refuses promotion for small samples", () => {
    const status = evaluateMinimumEvidence({
      qualifiedEpisodes: 8,
      controlEpisodes: 8,
      marketEpisodes: 3,
    });
    expect(status.promotable).toBe(false);
    expect(status.reasons).toContain("insufficient_qualified_episodes");
  });

  it("allows promotion review only after all minimums are met", () => {
    expect(evaluateMinimumEvidence({
      qualifiedEpisodes: 30,
      controlEpisodes: 30,
      marketEpisodes: 10,
      largestMarketEpisodeCount: 3,
    }).promotable).toBe(true);
  });

  it("blocks a numerically large sample dominated by one market episode", () => {
    const status=evaluateMinimumEvidence({
      qualifiedEpisodes:40,
      controlEpisodes:40,
      marketEpisodes:20,
      largestMarketEpisodeCount:8,
    });
    expect(status.promotable).toBe(false);
    expect(status.reasons).toContain("market_episode_concentration_too_high");
  });
});
