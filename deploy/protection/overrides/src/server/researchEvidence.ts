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
export type ResearchEvidence = z.infer<typeof schema> & {
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
    "CREATE TABLE IF NOT EXISTS research_evidence(id TEXT PRIMARY KEY, asset_id TEXT NOT NULL, payload TEXT NOT NULL); CREATE TABLE IF NOT EXISTS research_reviews(asset_id TEXT PRIMARY KEY,payload TEXT NOT NULL); CREATE TABLE IF NOT EXISTS research_state(key TEXT PRIMARY KEY,payload TEXT NOT NULL)",
  );
  const append = (records: unknown[], now = Date.now()) => {
    if (records.length > 100) throw Error("At most 100 evidence records");
    const parsed = records.map((raw) => {
      const r = schema.parse(raw);
      if (identities.get(r.symbol) !== r.canonicalAssetId)
        throw Error("Canonical identity mismatch");
      if (
        Date.parse(r.retrievedAt) > now ||
        Date.parse(r.expiresAt) <= Date.parse(r.retrievedAt) ||
        (r.publishedAt && Date.parse(r.publishedAt) > Date.parse(r.retrievedAt))
      )
        throw Error("Invalid evidence chronology");
      if (r.verification === "PRIMARY_CONFIRMED" && !r.verificationSourceUrl)
        throw Error("Primary verification source required");
      const normalized = r.claim.toLowerCase().replace(/\s+/g, " ").trim();
      const contentHash = createHash("sha256").update(normalized).digest("hex");
      const id = createHash("sha256")
        .update(
          [
            r.canonicalAssetId,
            r.lineageId,
            contentHash,
            r.verification,
            r.polarity,
            r.social?.periodEnd ?? "",
            r.material,
            r.relevance,
            r.verificationSourceUrl ?? "",
          ].join("|"),
        )
        .digest("hex");
      return { ...r, id, contentHash };
    });
    db.transaction(() => {
      for (const r of parsed) {
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
    return parsed;
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
    close: () => db.close(),
  };
}
