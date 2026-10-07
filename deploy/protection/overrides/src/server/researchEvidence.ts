import Database from "better-sqlite3";
import { createHash } from "node:crypto";
import { isIP } from "node:net";
import { z } from "zod";
import type { Review } from "./reassessment.js";
export function publicSourceUrl(value: string): boolean {
  try {
    const u = new URL(value);
    const host = u.hostname.toLowerCase();
    return (
      u.protocol === "https:" &&
      !u.username &&
      !u.password &&
      !u.port &&
      !isIP(host) &&
      !host.includes(":") &&
      !host.startsWith("[") &&
      host.includes(".") &&
      !/\.(local|internal|localhost|test)$/.test(host) &&
      host !== "localhost"
    );
  } catch {
    return false;
  }
}
const date = z
  .string()
  .refine((v) => Number.isFinite(Date.parse(v)), "Invalid timestamp");
const source = z
  .string()
  .max(2048)
  .refine(publicSourceUrl, "Public HTTPS source required");
const sha256 = z.string().regex(/^[a-f0-9]{64}$/);
const rawArtifactSchema = z.object({
  sourceUrl: source,
  retrievedAt: date,
  contentType: z.literal("text/markdown"),
  content: z.string().min(1).max(160 * 1024),
  byteLength: z.number().int().positive().max(160 * 1024),
  contentHash: sha256,
  hashAlgorithm: z.literal("SHA256"),
});
const schema = z.object({
  canonicalAssetId: z.string().min(1).max(150),
  symbol: z.string().regex(/^[A-Z0-9._-]{1,20}$/),
  provider: z.string().min(1).max(100),
  sourceUrl: source,
  publishedAt: date.nullable(),
  retrievedAt: date,
  expiresAt: date,
  kind: z.enum([
    "NEWS",
    "OFFICIAL_CATALYST",
    "SOCIAL_ACTIVITY",
    "SUPPLY_EVENT",
    "CONTRADICTING_EVIDENCE",
  ]),
  lineageId: z.string().min(1).max(200),
  summary: z.string().min(1).max(3000),
  claim: z.string().min(1).max(3000),
  relevance: z.string().min(1).max(3000),
  verification: z.enum([
    "UNVERIFIED",
    "PRIMARY_CONFIRMED",
    "CONFLICTING",
    "RETRACTED",
  ]),
  verificationSourceUrl: source.nullable(),
  polarity: z.enum(["POSITIVE", "NEGATIVE", "MIXED"]),
  material: z.boolean(),
  dataMode: z.enum(["LIVE", "IMPORTED"]),
  sourceFamily: z.string().min(1).max(255).optional(),
  sourceAuthorityScore: z.number().min(0).max(1).optional(),
  primarySourceLikely: z.boolean().optional(),
  claimTopic: z.string().min(1).max(100).optional(),
  extractionMethod: z.string().min(1).max(100).optional(),
  artifactHash: sha256.optional(),
  artifactByteLength: z.number().int().positive().max(160 * 1024).optional(),
  rawArtifact: rawArtifactSchema.optional(),
  social: z
    .object({
      mentions: z.number().nonnegative(),
      participants: z.number().nonnegative().nullable(),
      windowHours: z.number().positive(),
      periodEnd: date,
    })
    .optional(),
  sentiment: z
    .object({
      model: z.literal("ElKulako/cryptobert"),
      bearish: z.number().min(0).max(1),
      neutral: z.number().min(0).max(1),
      bullish: z.number().min(0).max(1),
      net: z.number().min(-1).max(1),
      confidence: z.number().min(0).max(1),
    })
    .optional(),
});
type ResearchEvidenceInput = z.infer<typeof schema>;
export type ResearchEvidence = Omit<ResearchEvidenceInput, "rawArtifact"> & {
  id: string;
  contentHash: string;
};
export type EvidenceRepo = ReturnType<typeof openResearchEvidence>;
export function openResearchEvidence(
  path: string,
  identities: Map<string, string>,
) {
  const db = new Database(path);
  db.pragma("journal_mode = WAL");
  db.exec(
    "CREATE TABLE IF NOT EXISTS research_evidence(id TEXT PRIMARY KEY, asset_id TEXT NOT NULL, payload TEXT NOT NULL); CREATE TABLE IF NOT EXISTS research_reviews(asset_id TEXT PRIMARY KEY,payload TEXT NOT NULL); CREATE TABLE IF NOT EXISTS research_state(key TEXT PRIMARY KEY,payload TEXT NOT NULL); CREATE TABLE IF NOT EXISTS research_evidence_artifacts(content_hash TEXT PRIMARY KEY, source_url TEXT NOT NULL, retrieved_at TEXT NOT NULL, content_type TEXT NOT NULL, byte_length INTEGER NOT NULL, payload TEXT NOT NULL)",
  );
  const append = (records: unknown[], now = Date.now()) => {
    if (records.length > 100) throw Error("At most 100 evidence records");
    const prepared = records.map((raw) => {
      const input = schema.parse(raw);
      if (identities.get(input.symbol) !== input.canonicalAssetId)
        throw Error("Canonical identity mismatch");
      if (
        Date.parse(input.retrievedAt) > now ||
        Date.parse(input.expiresAt) <= Date.parse(input.retrievedAt) ||
        (input.publishedAt &&
          Date.parse(input.publishedAt) > Date.parse(input.retrievedAt))
      )
        throw Error("Invalid evidence chronology");
      if (
        input.verification === "PRIMARY_CONFIRMED" &&
        !input.verificationSourceUrl
      )
        throw Error("Primary verification source required");

      const { rawArtifact, ...base } = input;
      let artifactHash = base.artifactHash;
      let artifactByteLength = base.artifactByteLength;
      if (rawArtifact) {
        if (
          rawArtifact.sourceUrl !== base.sourceUrl ||
          rawArtifact.retrievedAt !== base.retrievedAt
        )
          throw Error("Raw evidence artifact provenance mismatch");
        const actualBytes = Buffer.byteLength(rawArtifact.content, "utf8");
        const actualHash = createHash("sha256")
          .update(rawArtifact.content)
          .digest("hex");
        if (
          rawArtifact.byteLength !== actualBytes ||
          rawArtifact.contentHash !== actualHash
        )
          throw Error("Raw evidence artifact hash mismatch");
        if (artifactHash && artifactHash !== actualHash)
          throw Error("Evidence artifact reference mismatch");
        if (artifactByteLength && artifactByteLength !== actualBytes)
          throw Error("Evidence artifact byte length mismatch");
        artifactHash = actualHash;
        artifactByteLength = actualBytes;
      }

      const record = {
        ...base,
        ...(artifactHash ? { artifactHash } : {}),
        ...(artifactByteLength ? { artifactByteLength } : {}),
      };
      const normalized = record.claim
        .toLowerCase()
        .replace(/\s+/g, " ")
        .trim();
      const contentHash = createHash("sha256")
        .update(normalized)
        .digest("hex");
      const id = createHash("sha256")
        .update(
          [
            record.canonicalAssetId,
            record.lineageId,
            contentHash,
            record.verification,
            record.polarity,
            record.social?.periodEnd ?? "",
            record.material,
            record.relevance,
            record.verificationSourceUrl ?? "",
          ].join("|"),
        )
        .digest("hex");
      return {
        record: { ...record, id, contentHash } as ResearchEvidence,
        rawArtifact,
      };
    });

    db.transaction(() => {
      for (const item of prepared) {
        const r = item.record;
        if (item.rawArtifact) {
          const existingArtifact = db
            .prepare(
              "SELECT payload FROM research_evidence_artifacts WHERE content_hash=?",
            )
            .get(item.rawArtifact.contentHash) as
            | { payload: string }
            | undefined;
          if (
            existingArtifact &&
            JSON.parse(existingArtifact.payload).content !==
              item.rawArtifact.content
          )
            throw Error("Raw evidence artifact collision");
          db.prepare(
            "INSERT OR IGNORE INTO research_evidence_artifacts VALUES(?,?,?,?,?,?)",
          ).run(
            item.rawArtifact.contentHash,
            item.rawArtifact.sourceUrl,
            item.rawArtifact.retrievedAt,
            item.rawArtifact.contentType,
            item.rawArtifact.byteLength,
            JSON.stringify(item.rawArtifact),
          );
        }

        const previous = db
          .prepare("SELECT payload FROM research_evidence WHERE id=?")
          .get(r.id) as { payload: string } | undefined;
        // Re-observation advances freshness without manufacturing another confirmation.
        if (
          previous &&
          Date.parse(JSON.parse(previous.payload).retrievedAt) >=
            Date.parse(r.retrievedAt)
        )
          continue;
        db.prepare(
          "INSERT OR REPLACE INTO research_evidence VALUES(?,?,?)",
        ).run(r.id, r.canonicalAssetId, JSON.stringify(r));
      }
    })();
    return prepared.map((item) => item.record);
  };
  return {
    append,
    list: (assetId: string): ResearchEvidence[] =>
      (
        db
          .prepare(
            "SELECT payload FROM research_evidence WHERE asset_id=? ORDER BY rowid DESC LIMIT 500",
          )
          .all(assetId) as { payload: string }[]
      ).map((r) => JSON.parse(r.payload)),
    readReview: (assetId: string): Review | null => {
      const row = db
        .prepare("SELECT payload FROM research_reviews WHERE asset_id=?")
        .get(assetId) as { payload: string } | undefined;
      return row ? JSON.parse(row.payload) : null;
    },
    saveReview: (review: Review) =>
      db
        .prepare("INSERT OR REPLACE INTO research_reviews VALUES(?,?)")
        .run(review.assetId, JSON.stringify(review)),
    getState: (key: string): unknown => {
      const row = db
        .prepare("SELECT payload FROM research_state WHERE key=?")
        .get(key) as { payload: string } | undefined;
      return row ? JSON.parse(row.payload) : null;
    },
    setState: (key: string, value: unknown) =>
      db
        .prepare("INSERT OR REPLACE INTO research_state VALUES(?,?)")
        .run(key, JSON.stringify(value)),
    readArtifact: (contentHash: string) => {
      const row = db
        .prepare(
          "SELECT payload FROM research_evidence_artifacts WHERE content_hash=?",
        )
        .get(contentHash) as { payload: string } | undefined;
      return row ? JSON.parse(row.payload) : null;
    },
    close: () => db.close(),
  };
}
