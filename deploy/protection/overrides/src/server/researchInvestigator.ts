import { createHash } from "node:crypto";

export type EvidenceTopic =
  | "SECURITY_EXPLOIT"
  | "LISTING_DELISTING"
  | "TOKENOMICS_SUPPLY"
  | "REGULATION"
  | "ECOSYSTEM_PARTNERSHIP"
  | "NETWORK_UPGRADE"
  | "TREASURY_FLOW"
  | "GOVERNANCE"
  | "GENERAL_CATALYST";

export interface DiscoveryCandidate {
  sourceUrl: string;
  title: string;
  description: string;
}

export interface RankedCandidate extends DiscoveryCandidate {
  sourceFamily: string;
  sourceAuthorityScore: number;
  primarySourceLikely: boolean;
  highImpactTrigger: boolean;
  score: number;
}

export interface RawEvidenceArtifact {
  sourceUrl: string;
  retrievedAt: string;
  contentType: "text/markdown";
  content: string;
  byteLength: number;
  contentHash: string;
  hashAlgorithm: "SHA256";
}

export interface AtomicClaim {
  claim: string;
  summary: string;
  topic: EvidenceTopic;
  polarity: "POSITIVE" | "NEGATIVE" | "MIXED";
  material: boolean;
}

export interface IntegrityEvidenceLike {
  id: string;
  sourceUrl: string;
  sourceFamily?: string;
  sourceAuthorityScore?: number;
  primarySourceLikely?: boolean;
  claimTopic?: string;
  verification?: string;
  polarity?: "POSITIVE" | "NEGATIVE" | "MIXED";
  expiresAt?: string;
  retrievedAt?: string;
}

export interface EvidenceIntegritySummary {
  label:
    | "VERIFIED"
    | "STRONGLY_SUPPORTED"
    | "CONTESTED"
    | "SINGLE_SOURCE"
    | "STALE"
    | "UNVERIFIED";
  independentSourceCount: number;
  primarySourceCount: number;
  contradictionSeverity: number;
  corroboratedEvidenceIds: string[];
  contradictingEvidenceIds: string[];
  unresolvedTopics: string[];
}

const MATERIAL_PATTERNS: Array<{ topic: EvidenceTopic; re: RegExp }> = [
  { topic: "SECURITY_EXPLOIT", re: /\b(exploit|hack(?:ed)?|breach|drain(?:ed)?|vulnerab(?:ility|le)|attack)\b/i },
  { topic: "LISTING_DELISTING", re: /\b(list(?:ed|ing)?|delist(?:ed|ing)?|trading pair|exchange support)\b/i },
  { topic: "TOKENOMICS_SUPPLY", re: /\b(token unlock|unlock schedule|vesting|emission|circulating supply|burn(?:ed|ing)?|mint(?:ed|ing)?|dilution)\b/i },
  { topic: "REGULATION", re: /\b(sec\b|cftc\b|regulat(?:or|ion|ory)|lawsuit|court|enforcement|license|approval)\b/i },
  { topic: "ECOSYSTEM_PARTNERSHIP", re: /\b(partnership|integrat(?:e|ed|ion)|adoption|ecosystem|collaborat(?:e|ion)|launch partner)\b/i },
  { topic: "NETWORK_UPGRADE", re: /\b(mainnet|testnet|upgrade|hard fork|fork|network update|protocol update|release)\b/i },
  { topic: "TREASURY_FLOW", re: /\b(treasury|foundation wallet|reserve|token transfer|moved? .* tokens?|sold? .* tokens?)\b/i },
  { topic: "GOVERNANCE", re: /\b(governance|proposal|vote|validator|dao)\b/i },
];

const NEGATIVE_RE = /\b(exploit|hack(?:ed)?|breach|drain(?:ed)?|vulnerab(?:ility|le)|delist(?:ed|ing)?|lawsuit|enforcement|outage|halt(?:ed)?|suspend(?:ed)?|dilution|unlock|sell(?:ing|off)?)\b/i;
const POSITIVE_RE = /\b(list(?:ed|ing)?|approval|approved|partnership|integrat(?:e|ed|ion)|adoption|upgrade|launch|release|burn(?:ed|ing)?|growth|expand(?:ed|ing)?)\b/i;

function hostname(url: string): string {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return "";
  }
}

export function sourceFamilyFor(url: string): string {
  const host = hostname(url);
  const parts = host.split(".").filter(Boolean);
  if (parts.length <= 2) return host;
  const suffix2 = parts.slice(-2).join(".");
  const suffix3 = parts.slice(-3).join(".");
  if (/\.(co\.uk|com\.au|co\.jp)$/.test(host)) return suffix3;
  return suffix2;
}

function authorityFor(url: string, title: string, description: string): {
  score: number;
  primarySourceLikely: boolean;
} {
  const host = hostname(url);
  const text = `${title} ${description}`.toLowerCase();

  if (!host) return { score: 0, primarySourceLikely: false };
  if (/\.gov$/.test(host)) return { score: 1, primarySourceLikely: true };
  if (host === "github.com") return { score: 0.9, primarySourceLikely: true };
  if (/(^|\.)(kraken|coinbase|binance)\.com$/.test(host))
    return { score: 0.93, primarySourceLikely: true };
  if (/(^|\.)(reuters|bloomberg)\.com$/.test(host))
    return { score: 0.88, primarySourceLikely: false };
  if (/(^|\.)(coindesk|theblock)\.co$/.test(host) || /(^|\.)decrypt\.co$/.test(host))
    return { score: 0.76, primarySourceLikely: false };

  const officialLanguage =
    /\b(official|foundation|protocol|developer|governance|documentation|docs|blog|announcement)\b/.test(text);
  return {
    score: officialLanguage ? 0.68 : 0.55,
    primarySourceLikely: false,
  };
}

function impactTopic(text: string): EvidenceTopic | null {
  for (const row of MATERIAL_PATTERNS) if (row.re.test(text)) return row.topic;
  return null;
}

export function rankInvestigationCandidates(
  candidates: DiscoveryCandidate[],
): RankedCandidate[] {
  const seen = new Set<string>();
  return candidates
    .filter((candidate) => {
      if (!candidate.sourceUrl || seen.has(candidate.sourceUrl)) return false;
      seen.add(candidate.sourceUrl);
      return true;
    })
    .map((candidate) => {
      const authority = authorityFor(
        candidate.sourceUrl,
        candidate.title,
        candidate.description,
      );
      const text = `${candidate.title} ${candidate.description}`;
      const highImpactTrigger = impactTopic(text) != null;
      const primaryBonus = authority.primarySourceLikely ? 0.15 : 0;
      const impactBonus = highImpactTrigger ? 0.15 : 0;
      const specificityBonus = candidate.description.length >= 80 ? 0.05 : 0;
      return {
        ...candidate,
        sourceFamily: sourceFamilyFor(candidate.sourceUrl),
        sourceAuthorityScore: authority.score,
        primarySourceLikely: authority.primarySourceLikely,
        highImpactTrigger,
        score: Math.min(
          1,
          authority.score * 0.65 + primaryBonus + impactBonus + specificityBonus,
        ),
      };
    })
    .sort((a, b) => b.score - a.score);
}

export function chooseInvestigationCandidates(
  candidates: DiscoveryCandidate[],
  limit = 2,
): RankedCandidate[] {
  const ranked = rankInvestigationCandidates(candidates).filter(
    (candidate) =>
      candidate.primarySourceLikely ||
      candidate.highImpactTrigger ||
      candidate.score >= 0.58,
  );
  const selected: RankedCandidate[] = [];
  const families = new Set<string>();
  for (const candidate of ranked) {
    if (selected.length >= Math.max(1, limit)) break;
    if (
      families.has(candidate.sourceFamily) &&
      ranked.some((r) => !families.has(r.sourceFamily))
    )
      continue;
    selected.push(candidate);
    families.add(candidate.sourceFamily);
  }
  return selected;
}

export function buildRawEvidenceArtifact(
  sourceUrl: string,
  retrievedAt: string,
  markdown: string,
): RawEvidenceArtifact {
  const content = markdown.replace(/\r\n/g, "\n");
  const byteLength = Buffer.byteLength(content, "utf8");
  if (!content.trim()) throw Error("BRIGHTDATA_EMPTY_FULL_SOURCE");
  if (byteLength > 160 * 1024) throw Error("BRIGHTDATA_FULL_SOURCE_TOO_LARGE");
  return {
    sourceUrl,
    retrievedAt,
    contentType: "text/markdown",
    content,
    byteLength,
    contentHash: createHash("sha256").update(content).digest("hex"),
    hashAlgorithm: "SHA256",
  };
}

function cleanMarkdown(markdown: string): string {
  return markdown
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/[#>*_`|]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function assetMention(text: string, name: string, symbol: string): boolean {
  const escapedName = name.replace(/[.*+?^$()|[\]\\{}]/g, "\\$&");
  const escapedSymbol = symbol.replace(/[.*+?^$()|[\]\\{}]/g, "\\$&");
  return (
    new RegExp("\\b" + escapedName + "\\b", "i").test(text) ||
    new RegExp("\\b" + escapedSymbol + "\\b", "i").test(text)
  );
}

function topicForSentence(sentence: string): EvidenceTopic {
  return impactTopic(sentence) ?? "GENERAL_CATALYST";
}

function polarityForSentence(sentence: string): AtomicClaim["polarity"] {
  const negative = NEGATIVE_RE.test(sentence);
  const positive = POSITIVE_RE.test(sentence);
  if (negative && !positive) return "NEGATIVE";
  if (positive && !negative) return "POSITIVE";
  return "MIXED";
}

export function extractAtomicClaims(
  markdown: string,
  assetName: string,
  symbol: string,
  limit = 2,
): AtomicClaim[] {
  const clean = cleanMarkdown(markdown);
  const sentences = clean
    .split(/(?<=[.!?])\s+(?=[A-Z0-9])/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length >= 35 && sentence.length <= 900);

  const material = sentences.filter(
    (sentence) => assetMention(sentence, assetName, symbol) && impactTopic(sentence),
  );
  const relevant = sentences.filter((sentence) =>
    assetMention(sentence, assetName, symbol),
  );
  const pool = material.length ? material : relevant;
  const unique: string[] = [];
  const seen = new Set<string>();
  for (const sentence of pool) {
    const key = sentence.toLowerCase().replace(/\s+/g, " ").trim();
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(sentence);
    if (unique.length >= Math.max(1, limit)) break;
  }

  return unique.map((claim) => {
    const topic = topicForSentence(claim);
    return {
      claim,
      summary: claim.slice(0, 500),
      topic,
      polarity: polarityForSentence(claim),
      material: topic !== "GENERAL_CATALYST",
    };
  });
}

function familyOf(row: IntegrityEvidenceLike): string {
  return row.sourceFamily?.trim().toLowerCase() || sourceFamilyFor(row.sourceUrl);
}

export function assessEvidenceIntegrity(
  evidence: IntegrityEvidenceLike[],
  now: number,
): EvidenceIntegritySummary {
  const current = evidence.filter((row) => {
    const expiry = Date.parse(row.expiresAt ?? "");
    const retrieved = Date.parse(row.retrievedAt ?? "");
    return (
      Number.isFinite(expiry) &&
      expiry > now &&
      Number.isFinite(retrieved) &&
      retrieved <= now
    );
  });

  if (!current.length) {
    return {
      label: evidence.length ? "STALE" : "UNVERIFIED",
      independentSourceCount: 0,
      primarySourceCount: 0,
      contradictionSeverity: 0,
      corroboratedEvidenceIds: [],
      contradictingEvidenceIds: [],
      unresolvedTopics: [],
    };
  }

  const families = new Set(current.map(familyOf).filter(Boolean));
  const primary = current.filter(
    (row) => row.primarySourceLikely || row.verification === "PRIMARY_CONFIRMED",
  );

  const byTopic = new Map<string, IntegrityEvidenceLike[]>();
  for (const row of current) {
    const topic = row.claimTopic || "UNCLASSIFIED";
    byTopic.set(topic, [...(byTopic.get(topic) ?? []), row]);
  }

  const corroborated = new Set<string>();
  const contradicting = new Set<string>();
  const unresolvedTopics: string[] = [];
  let contestedTopics = 0;
  let verifiedTopic = false;

  for (const [topic, rows] of byTopic) {
    const topicFamilies = new Set(rows.map(familyOf).filter(Boolean));
    const positiveFamilies = new Set(
      rows.filter((r) => r.polarity === "POSITIVE").map(familyOf).filter(Boolean),
    );
    const negativeFamilies = new Set(
      rows.filter((r) => r.polarity === "NEGATIVE").map(familyOf).filter(Boolean),
    );
    const explicitlyConflicting = rows.some(
      (r) => r.verification === "CONFLICTING",
    );
    const contested =
      explicitlyConflicting ||
      (positiveFamilies.size > 0 && negativeFamilies.size > 0);

    if (contested) {
      contestedTopics += 1;
      rows.forEach((row) => contradicting.add(row.id));
      continue;
    }

    if (topicFamilies.size >= 2) {
      rows.forEach((row) => corroborated.add(row.id));
      if (rows.some((row) => row.verification === "PRIMARY_CONFIRMED"))
        verifiedTopic = true;
    } else unresolvedTopics.push(topic);
  }

  const contradictionSeverity = Math.min(
    1,
    contestedTopics / Math.max(1, byTopic.size),
  );

  const verified = verifiedTopic && contradictionSeverity === 0;

  const strong =
    !verified &&
    corroborated.size > 0 &&
    families.size >= 2 &&
    contradictionSeverity < 0.5;

  let label: EvidenceIntegritySummary["label"];
  if (contradictionSeverity >= 0.5 || contradicting.size > 0)
    label = "CONTESTED";
  else if (verified) label = "VERIFIED";
  else if (strong) label = "STRONGLY_SUPPORTED";
  else if (families.size === 1) label = "SINGLE_SOURCE";
  else label = "UNVERIFIED";

  return {
    label,
    independentSourceCount: families.size,
    primarySourceCount: primary.length,
    contradictionSeverity,
    corroboratedEvidenceIds: [...corroborated],
    contradictingEvidenceIds: [...contradicting],
    unresolvedTopics: [...new Set(unresolvedTopics)],
  };
}
