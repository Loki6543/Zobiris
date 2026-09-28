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
    }).promotable).toBe(true);
  });
});
