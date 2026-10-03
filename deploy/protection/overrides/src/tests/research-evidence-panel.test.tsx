// @vitest-environment jsdom
import { render, screen, cleanup } from "@testing-library/react";
import { afterEach, it, expect } from "vitest";
import { ResearchEvidenceContent } from "../ui/ResearchEvidencePanel";
afterEach(cleanup);
it("shows unavailable social and import provenance without inventing buy authority", () => {
  render(
    <ResearchEvidenceContent
      data={{
        asOf: null,
        providers: [{ provider: "stocktwits", status: "NOT_CONFIGURED" }],
        assets: [
          {
            symbol: "QNT",
            newsStatus: "AVAILABLE",
            socialStatus: "UNAVAILABLE",
            review: {
              status: "REVIEW_REQUIRED",
              changedClaims: ["Adoption announced"],
              missingEvidence: ["Token demand unknown"],
              nextReviewCondition: "Verify economics",
            },
            evidence: [
              {
                id: "1",
                dataMode: "IMPORTED",
                publishedAt: null,
                retrievedAt: "2026-10-03T00:00:00Z",
                expiresAt: "2026-10-01T00:00:00Z",
                verification: "UNVERIFIED",
                sourceUrl: "https://quant.network/news/",
                summary: "<script>alert(1)</script>",
                claim: "Contradictory claim",
                relevance: "Token demand unknown",
                polarity: "NEGATIVE",
              },
            ],
          },
        ],
      }}
    />,
  );
  expect(screen.getByText(/Social: UNAVAILABLE/)).toBeTruthy();
  expect(screen.getByText(/Imported research · UNVERIFIED/)).toBeTruthy();
  expect(screen.getByText(/STALE/)).toBeTruthy();
  expect(screen.getByText("<script>alert(1)</script>")).toBeTruthy();
  expect(document.querySelector("script")).toBeNull();
  expect(screen.queryByText("Buy")).toBeNull();
});
it("renders an honest empty state", () => {
  render(
    <ResearchEvidenceContent
      data={{ assets: [], providers: [], asOf: null }}
    />,
  );
  expect(screen.getByText(/No research evidence collected/)).toBeTruthy();
});
