import { it, expect } from "vitest";
import { openResearchEvidence } from "../server/researchEvidence.js";
import { evaluateReassessment } from "../server/reassessment.js";
const now = Date.parse("2026-10-03T02:00:00Z");
const evidence = (extra: any = {}) => ({
  canonicalAssetId: "qnt",
  symbol: "QNT",
  provider: "manual",
  sourceUrl: "https://quant.network/news/test",
  publishedAt: "2026-10-03T00:00:00Z",
  retrievedAt: "2026-10-03T01:00:00Z",
  expiresAt: "2026-10-04T01:00:00Z",
  kind: "OFFICIAL_CATALYST",
  lineageId: "announcement-1",
  summary: "Partnership",
  claim: "Partnership announced",
  relevance: "Names Quant directly; token demand not established",
  verification: "PRIMARY_CONFIRMED",
  verificationSourceUrl: "https://quant.network/news/test",
  polarity: "POSITIVE",
  material: true,
  dataMode: "IMPORTED",
  ...extra,
});
it("validates canonical identity, source URLs and dates without inventing publication time", () => {
  const r = openResearchEvidence(":memory:", new Map([["QNT", "qnt"]]));
  try {
    expect(() =>
      r.append([evidence({ canonicalAssetId: "btc" })], now),
    ).toThrow();
    expect(() =>
      r.append([evidence({ sourceUrl: "http://127.0.0.1/a" })], now),
    ).toThrow();
    expect(() =>
      r.append([evidence({ retrievedAt: "2027-01-01T00:00:00Z" })], now),
    ).toThrow();
    r.append([evidence({ publishedAt: null })], now);
    expect(r.list("qnt")[0]!.publishedAt).toBeNull();
  } finally {
    r.close();
  }
});
it("deduplicates syndicated claims while preserving conflicting evidence", () => {
  const r = openResearchEvidence(":memory:", new Map([["QNT", "qnt"]]));
  try {
    r.append(
      [
        evidence(),
        evidence({ sourceUrl: "https://example.com/copy", provider: "copy" }),
      ],
      now,
    );
    expect(r.list("qnt")).toHaveLength(1);
    r.append(
      [
        evidence({
          claim: "Token demand is unconfirmed",
          verification: "CONFLICTING",
          polarity: "NEGATIVE",
        }),
      ],
      now,
    );
    expect(r.list("qnt")).toHaveLength(2);
  } finally {
    r.close();
  }
});
it("queues material evidence once, preserves contrary claims, and never produces order authority", () => {
  const r = openResearchEvidence(":memory:", new Map([["QNT", "qnt"]]));
  try {
    r.append([evidence()], now);
    const rows = r.list("qnt");
    const review = evaluateReassessment(null, rows, now, "qnt");
    expect(review.status).toBe("REVIEW_REQUIRED");
    r.saveReview(review);
    expect(r.readReview("qnt")).toEqual(review);
    expect(evaluateReassessment(review, rows, now, "qnt").status).toBe(
      "REVIEW_REQUIRED",
    );
    expect(JSON.stringify(review)).not.toContain("maxOrder");
    r.append(
      [
        evidence({
          claim: "Exploit confirmed",
          polarity: "NEGATIVE",
          lineageId: "risk",
        }),
      ],
      now,
    );
    expect(evaluateReassessment(review, r.list("qnt"), now, "qnt").status).toBe(
      "THESIS_RISK",
    );
  } finally {
    r.close();
  }
});
it("cannot promote unverified or stale news to a confirmed catalyst", () => {
  expect(
    evaluateReassessment(
      null,
      [evidence({ verification: "UNVERIFIED", id: "u" })],
      now,
      "qnt",
    ).status,
  ).toBe("EVIDENCE_INCOMPLETE");
  expect(
    evaluateReassessment(
      null,
      [evidence({ expiresAt: "2026-10-02T00:00:00Z", id: "s" })],
      now,
      "qnt",
    ).status,
  ).toBe("EVIDENCE_INCOMPLETE");
});

it("refreshes repeat observations without multiplying confirmations and retains meaningful revisions", () => {
  const r = openResearchEvidence(":memory:", new Map([["QNT", "qnt"]]));
  try {
    r.append([evidence()], now);
    const later = now + 2 * 86400000;
    r.append(
      [
        evidence({
          retrievedAt: new Date(later).toISOString(),
          expiresAt: new Date(later + 86400000).toISOString(),
        }),
      ],
      later,
    );
    expect(r.list("qnt")).toHaveLength(1);
    expect(r.list("qnt")[0]!.retrievedAt).toBe(new Date(later).toISOString());
    r.append(
      [
        evidence({
          material: false,
          relevance: "Revised token-impact assessment",
        }),
      ],
      now,
    );
    expect(r.list("qnt")).toHaveLength(2);
  } finally {
    r.close();
  }
});
