import type { ResearchEvidence } from "./researchEvidence.js";
export interface Review {
  assetId: string;
  status:
    | "REVIEW_REQUIRED"
    | "NO_MATERIAL_CHANGE"
    | "EVIDENCE_INCOMPLETE"
    | "THESIS_RISK";
  evidenceIds: string[];
  previousEvidenceIds: string[];
  changedClaims: string[];
  counterEvidenceIds: string[];
  missingEvidence: string[];
  nextReviewCondition: string;
  updatedAt: string;
}
function socialAcceleration(rows: ResearchEvidence[], now: number): boolean {
  for (const r of rows) {
    if (
      !r.social ||
      Date.parse(r.expiresAt) < now ||
      r.social.windowHours !== 24 ||
      r.social.participants == null
    )
      continue;
    const end = Date.parse(r.social.periodEnd);
    if (end > now || now - end > 36 * 3600000) continue;
    const history = rows.filter(
      (p) =>
        p.id !== r.id &&
        p.provider === r.provider &&
        p.social?.windowHours === 24 &&
        Date.parse(p.social.periodEnd) < end &&
        end - Date.parse(p.social.periodEnd) <= 8 * 86400000,
    );
    const daily = [
      ...new Map(
        history.map((p) => [p.social!.periodEnd.slice(0, 10), p]),
      ).values(),
    ];
    if (daily.length < 7 || daily.some((p) => p.social!.participants == null))
      continue;
    const median = (v: number[]) =>
      v.sort((a, b) => a - b)[Math.floor(v.length / 2)]!;
    if (
      r.social.mentions > 2 * median(daily.map((p) => p.social!.mentions)) &&
      r.social.participants > median(daily.map((p) => p.social!.participants!))
    )
      return true;
  }
  return false;
}
export function evaluateReassessment(
  previous: Review | null,
  evidence: ResearchEvidence[],
  now: number,
  assetId: string,
): Review {
  const current = evidence.filter(
    (e) => Date.parse(e.expiresAt) > now && Date.parse(e.retrievedAt) <= now,
  );
  const fresh = current.filter((e) => !previous?.evidenceIds.includes(e.id));
  const confirmed = current.filter(
    (e) =>
      e.verification === "PRIMARY_CONFIRMED" &&
      e.material &&
      e.verificationSourceUrl &&
      e.publishedAt,
  );
  const risk =
    confirmed.some((e) => e.polarity === "NEGATIVE") ||
    current.some(
      (e) => e.verification === "RETRACTED" || e.verification === "CONFLICTING",
    );
  const social = socialAcceleration(evidence, now);
  const status: Review["status"] = risk
    ? "THESIS_RISK"
    : confirmed.length || social
      ? "REVIEW_REQUIRED"
      : current.length
        ? "EVIDENCE_INCOMPLETE"
        : "EVIDENCE_INCOMPLETE";
  if (previous && fresh.length === 0 && previous.status === status)
    return previous;
  return {
    assetId,
    status,
    evidenceIds: current.map((e) => e.id),
    previousEvidenceIds: previous?.evidenceIds ?? [],
    changedClaims: fresh.map((e) => e.claim),
    counterEvidenceIds: current
      .filter(
        (e) => e.polarity !== "POSITIVE" || e.verification === "CONFLICTING",
      )
      .map((e) => e.id),
    missingEvidence: confirmed.length
      ? ["Token-demand impact and entry conditions still require evaluation."]
      : [
          "No current material primary-confirmed catalyst; social evidence may be incomplete.",
        ],
    nextReviewCondition:
      "Verify token impact, contradictory evidence, current entry geometry and order-size execution before changing an investment decision.",
    updatedAt: new Date(now).toISOString(),
  };
}
