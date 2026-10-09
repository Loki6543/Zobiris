type ClaimLike = {
  id?: string;
  source?: string;
  factorFamily?: string;
  claim?: string;
  epistemicState?: string;
  evidenceConfidence?: number;
  freshness?: string;
  [key: string]: unknown;
};

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function localChallengeEvidence(input: {
  symbol?: string;
  claimId?: string;
  claims?: ClaimLike[];
  [key: string]: unknown;
}) {
  const claims = Array.isArray(input.claims) ? input.claims : [];
  const target = claims.find((claim) => String(claim.id ?? "") === String(input.claimId ?? "")) ?? null;
  const targetFamily = text(target?.factorFamily);
  const targetSource = text(target?.source);
  const peers = targetFamily
    ? claims.filter((claim) => claim !== target && text(claim.factorFamily) === targetFamily)
    : claims.filter((claim) => claim !== target);
  const independentSources = new Set(
    claims.map((claim) => text(claim.source)).filter(Boolean),
  );
  const conflicting = peers.filter((claim) => {
    const state = text(claim.epistemicState).toUpperCase();
    const body = text(claim.claim).toLowerCase();
    return state.includes("CONFLICT") || /\b(deny|denies|denied|false|contradict|contrary|rebut|refut|not true)\b/.test(body);
  });
  const confidence = Number(target?.evidenceConfidence);
  const targetConfidence = Number.isFinite(confidence) ? confidence : null;

  const verdict =
    !target ? "TARGET_NOT_FOUND"
      : conflicting.length > 0 ? "CONTESTED"
      : independentSources.size < 2 ? "SINGLE_SOURCE_RISK"
      : targetConfidence != null && targetConfidence < 0.6 ? "LOW_CONFIDENCE"
      : "NO_DETERMINISTIC_CONTRADICTION_FOUND";

  return {
    mode: "DETERMINISTIC_LOCAL_CHALLENGER_V1",
    symbol: text(input.symbol).toUpperCase() || null,
    targetClaimId: input.claimId ?? null,
    verdict,
    authority: "ADVISORY_READ_ONLY",
    canPromote: false,
    mayAffectSizing: false,
    mayWriteExchange: false,
    target: target ? {
      factorFamily: targetFamily || null,
      source: targetSource || null,
      epistemicState: target.epistemicState ?? null,
      evidenceConfidence: targetConfidence,
      freshness: target.freshness ?? null,
    } : null,
    diagnostics: {
      ledgerClaims: claims.length,
      independentSources: independentSources.size,
      sameFamilyPeerClaims: peers.length,
      deterministicConflictCandidates: conflicting.length,
    },
    challengeQuestions: [
      "Is the target claim independently corroborated by a different source family?",
      "Could the claim describe company/ecosystem activity without creating token demand?",
      "Is the evidence fresh enough for the claimed decision horizon?",
      "Is there contrary evidence in the same factor family?",
      "Would the thesis still hold if the target claim were removed?",
    ],
    contraryClaimIds: conflicting.slice(0, 10).map((claim) => claim.id).filter(Boolean),
    note: "This fallback is deterministic and evidence-bound. It replaces an unavailable external LLM challenger without pretending to provide model-generated insight.",
  };
}
