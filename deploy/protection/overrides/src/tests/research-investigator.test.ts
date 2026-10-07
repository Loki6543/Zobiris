import { describe, expect, it } from "vitest";
import {
  assessEvidenceIntegrity,
  chooseInvestigationCandidates,
} from "../server/researchInvestigator.js";

const now = Date.parse("2026-10-06T23:00:00Z");
const current = {
  retrievedAt: "2026-10-06T22:00:00Z",
  expiresAt: "2026-10-07T22:00:00Z",
};

describe("research evidence investigator", () => {
  it("escalates high-value discovery and rejects generic low-value SERP results", () => {
    const selected = chooseInvestigationCandidates(
      [
        {
          sourceUrl: "https://example.com/market-roundup",
          title: "Solana market roundup",
          description: "Solana appears in a broad market recap.",
        },
        {
          sourceUrl: "https://github.com/solana-labs/solana/releases",
          title: "Solana official network upgrade",
          description:
            "Solana developers published a network upgrade and validator release.",
        },
      ],
      2,
    );
    expect(selected).toHaveLength(1);
    expect(selected[0]!.sourceUrl).toContain("github.com");
    expect(selected[0]!.primarySourceLikely).toBe(true);
    expect(selected[0]!.highImpactTrigger).toBe(true);
  });

  it("does not call unrelated-topic corroboration VERIFIED", () => {
    const result = assessEvidenceIntegrity(
      [
        {
          id: "primary-security",
          sourceUrl: "https://project.example/security",
          sourceFamily: "project.example",
          claimTopic: "SECURITY_EXPLOIT",
          verification: "PRIMARY_CONFIRMED",
          polarity: "NEGATIVE",
          ...current,
        },
        {
          id: "listing-a",
          sourceUrl: "https://exchange.example/listing",
          sourceFamily: "exchange.example",
          claimTopic: "LISTING_DELISTING",
          verification: "UNVERIFIED",
          polarity: "POSITIVE",
          ...current,
        },
        {
          id: "listing-b",
          sourceUrl: "https://news.example/listing",
          sourceFamily: "news.example",
          claimTopic: "LISTING_DELISTING",
          verification: "UNVERIFIED",
          polarity: "POSITIVE",
          ...current,
        },
      ],
      now,
    );

    expect(result.label).not.toBe("VERIFIED");
    expect(result.label).toBe("STRONGLY_SUPPORTED");
  });

  it("requires same-topic independent corroboration for VERIFIED", () => {
    const result = assessEvidenceIntegrity(
      [
        {
          id: "official",
          sourceUrl: "https://project.example/upgrade",
          sourceFamily: "project.example",
          claimTopic: "NETWORK_UPGRADE",
          verification: "PRIMARY_CONFIRMED",
          polarity: "POSITIVE",
          ...current,
        },
        {
          id: "independent",
          sourceUrl: "https://news.example/upgrade",
          sourceFamily: "news.example",
          claimTopic: "NETWORK_UPGRADE",
          verification: "UNVERIFIED",
          polarity: "POSITIVE",
          ...current,
        },
      ],
      now,
    );

    expect(result.label).toBe("VERIFIED");
    expect(result.independentSourceCount).toBe(2);
    expect(result.corroboratedEvidenceIds).toEqual(
      expect.arrayContaining(["official", "independent"]),
    );
  });

  it("marks opposing independent evidence on one topic CONTESTED", () => {
    const result = assessEvidenceIntegrity(
      [
        {
          id: "positive",
          sourceUrl: "https://one.example/tokenomics",
          sourceFamily: "one.example",
          claimTopic: "TOKENOMICS_SUPPLY",
          verification: "UNVERIFIED",
          polarity: "POSITIVE",
          ...current,
        },
        {
          id: "negative",
          sourceUrl: "https://two.example/tokenomics",
          sourceFamily: "two.example",
          claimTopic: "TOKENOMICS_SUPPLY",
          verification: "UNVERIFIED",
          polarity: "NEGATIVE",
          ...current,
        },
      ],
      now,
    );

    expect(result.label).toBe("CONTESTED");
    expect(result.contradictionSeverity).toBe(1);
    expect(result.contradictingEvidenceIds).toEqual(
      expect.arrayContaining(["positive", "negative"]),
    );
  });
});
