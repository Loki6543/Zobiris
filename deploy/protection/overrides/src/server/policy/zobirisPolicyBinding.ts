/**
 * Drop-in policy binding for the main ZOBIRIS app (copy into server/ of the main repo
 * together with zobiris-policy-registry-v3.1.json).
 *
 * It turns the registry from documentation into a runtime input:
 *   - every decision, episode and report is stamped with the registry version and hash;
 *   - records without that stamp are rejected instead of silently accepted;
 *   - authority is read from the registry's authorityScopes, not module conventions;
 *   - episode tags are LIVE, RECONSTRUCTED or UNKNOWN, never defaulted;
 *   - research statuses always travel with their evidence class;
 *   - a candidate's vault contains only decisions made after it was registered.
 *
 * Nothing here can place, edit or cancel an order.
 */
import { createHash } from 'node:crypto';
import fs from 'node:fs';

type Json = Record<string, any>;

export interface RegistryHandle {
  registry: Json;
  registryVersion: string;
  /** SHA-256 of the registry file bytes, the same value the v3.1 manifest lists. */
  registrySha256: string;
}

export interface PolicyStamp {
  registryVersion: string;
  policyHash: string;
}

export type MetadataProvenance = 'LIVE' | 'RECONSTRUCTED' | 'UNKNOWN';

export type AuthorityQuestion = 'mayAffectQualification' | 'mayAffectReferenceLimit' | 'mayAffectSizing' | 'mayAffectOrderRecommendation';

/** Fields that describe the decision; the rest of requiredEpisodeFields are filled by the binding itself. */
const TAG_FIELDS = ['setupFamily', 'sizeTier', 'liquidityTier', 'evidenceClass', 'feeScheduleVersion', 'accountFeeTierAssumption', 'makerTakerPath', 'structuralBreakFlags'] as const;
export type TagField = (typeof TAG_FIELDS)[number];

const ENUM_FOR: Partial<Record<TagField, string>> = {
  setupFamily: 'setupFamily',
  evidenceClass: 'evidenceClass',
  makerTakerPath: 'makerTakerPath',
  accountFeeTierAssumption: 'accountFeeTierAssumption',
};

export function loadRegistry(filePath: string): RegistryHandle {
  const bytes = fs.readFileSync(filePath);
  const registry = JSON.parse(bytes.toString('utf8')) as Json;
  if (registry.invariants?.mayWriteExchange !== false) throw new Error('registry invariant mayWriteExchange must be false');
  if (!Array.isArray(registry.authorityScopes) || !Array.isArray(registry.requiredEpisodeFields)) throw new Error('registry is missing authorityScopes or requiredEpisodeFields');
  return { registry, registryVersion: String(registry.registryVersion), registrySha256: createHash('sha256').update(bytes).digest('hex') };
}

export function stampOf(h: RegistryHandle): PolicyStamp {
  return { registryVersion: h.registryVersion, policyHash: h.registrySha256 };
}

/** Attach the registry identity to a decision, recommendation or report. */
export function bindDecision<T extends object>(h: RegistryHandle, record: T): T & PolicyStamp {
  return { ...record, ...stampOf(h) };
}

/** Throws unless the record carries a well-formed registry stamp. Call before persisting or displaying. */
export function assertBound(record: unknown): asserts record is PolicyStamp {
  const r = record as Partial<PolicyStamp> | null;
  if (!r || typeof r.policyHash !== 'string' || !/^[0-9a-f]{64}$/.test(r.policyHash) || typeof r.registryVersion !== 'string') {
    throw new Error('UNBOUND_DECISION: record lacks registryVersion and a 64-hex policyHash');
  }
}

/**
 * Reads authority from the registry. Unknown features, non-DEPLOYED features and
 * anything the registry does not grant answer false; exchange writes are always false.
 */
export function mayAffect(h: RegistryHandle, featureId: string, question: AuthorityQuestion): boolean {
  const s = (h.registry.authorityScopes as Json[]).find((x) => x.featureId === featureId);
  if (!s || s.status !== 'DEPLOYED') return false;
  return s[question] === true;
}

function checkEnum(h: RegistryHandle, field: TagField, value: unknown): void {
  const name = ENUM_FOR[field];
  if (!name || value === 'UNKNOWN') return;
  const e = h.registry.enums?.[name];
  const allowed = Array.isArray(e) ? e : e && typeof e === 'object' ? Object.keys(e) : [];
  if (!allowed.includes(value as string)) throw new Error(`INVALID_${field.toUpperCase()}: ${String(value)}`);
}

/**
 * Stamps a new episode at decision time. Tags supplied now are LIVE; tags not
 * supplied are the string UNKNOWN, never a guessed value.
 */
export function stampEpisode<T extends { decisionTime: string }>(h: RegistryHandle, episode: T, liveTags: Partial<Record<TagField, unknown>>): T & Json {
  if (!Number.isFinite(Date.parse(episode.decisionTime))) throw new Error('INVALID_DECISION_TIME');
  const out: Json = { ...episode, ...stampOf(h) };
  let anyLive = false;
  for (const f of TAG_FIELDS) {
    const v = liveTags[f];
    if (v === undefined || v === null) out[f] = 'UNKNOWN';
    else {
      checkEnum(h, f, v);
      out[f] = v;
      anyLive = true;
    }
  }
  out.metadataProvenance = (anyLive ? 'LIVE' : 'UNKNOWN') satisfies MetadataProvenance;
  for (const f of h.registry.requiredEpisodeFields as string[]) if (!(f in out)) out[f] = 'UNKNOWN';
  return out as T & Json;
}

/**
 * Adds tags after the decision. The episode becomes RECONSTRUCTED for good,
 * which keeps it out of certification and out of any vault.
 */
export function reconstructTags<T extends Json>(h: RegistryHandle, episode: T, tags: Partial<Record<TagField, unknown>>, at: string): T & Json {
  const out: Json = { ...episode };
  const changed: string[] = [];
  for (const [f, v] of Object.entries(tags) as [TagField, unknown][]) {
    if (!TAG_FIELDS.includes(f) || v === undefined) continue;
    checkEnum(h, f, v);
    if (out[f] !== v) {
      out[f] = v;
      changed.push(f);
    }
  }
  if (changed.length) {
    out.metadataProvenance = 'RECONSTRUCTED' satisfies MetadataProvenance;
    out.reconstructedAt = at;
    out.reconstructedFields = [...new Set([...(episode.reconstructedFields ?? []), ...changed])];
  }
  return out as T & Json;
}

/** A research status is never shown without its evidence class. */
export function statusLabel(status: string, evidenceClass: string | null | undefined): string {
  return `${status} · ${evidenceClass && evidenceClass !== 'UNKNOWN' ? evidenceClass : 'EVIDENCE_CLASS_UNKNOWN'}`;
}

/** Vault eligibility: decided after the candidate was frozen, with live tags. */
export function isVaultEligible(episode: { decisionTime: string; metadataProvenance?: string }, candidateRegisteredAt: string): boolean {
  const d = Date.parse(episode.decisionTime);
  const r = Date.parse(candidateRegisteredAt);
  return Number.isFinite(d) && Number.isFinite(r) && d > r && episode.metadataProvenance === 'LIVE';
}

/** Groups records by the policy in force when they were created; never pool across groups silently. */
export function segmentByPolicy<T extends Partial<PolicyStamp>>(records: T[]): Map<string, T[]> {
  const m = new Map<string, T[]>();
  for (const r of records) {
    const k = typeof r.policyHash === 'string' ? r.policyHash : 'UNBOUND';
    const g = m.get(k) ?? [];
    g.push(r);
    m.set(k, g);
  }
  return m;
}

/** Same shape as PortfolioPolicy in portfolioGate.ts, built from registry values so the gate has one source of numbers. */
export interface RegistryPortfolioPolicy {
  intentionalHoldingsTarget: [number, number];
  intentionalHoldingsMax: number;
  meaningfulActionFloorUsd: number;
  cashBufferDivisor: number;
  typicalProbeUsd: number;
  maxAccountDataAgeMin: number;
}

export function portfolioPolicyFromRegistry(h: RegistryHandle): RegistryPortfolioPolicy {
  const P = h.registry.parameters as Json;
  const v = (k: string) => {
    if (!P?.[k] || P[k].value === null || P[k].value === undefined) throw new Error(`REGISTRY_PARAMETER_MISSING: ${k}`);
    return P[k].value;
  };
  const target = v('portfolio.intentionalHoldingsTarget') as [number, number];
  return {
    intentionalHoldingsTarget: [Number(target[0]), Number(target[1])],
    intentionalHoldingsMax: Number(v('portfolio.intentionalHoldingsMax')),
    meaningfulActionFloorUsd: Number(v('portfolio.meaningfulActionFloorUsd')),
    cashBufferDivisor: Number(v('ui.cashBufferDivisor')),
    typicalProbeUsd: Number(v('capital.typicalProbeUsd')),
    maxAccountDataAgeMin: Number(v('portfolio.maxAccountDataAgeMin')),
  };
}

/**
 * Structural-break flags for an episode: which registered breaks were already in
 * force at decision time (AFTER_<id>). Computed, never guessed.
 */
export function structuralBreakFlags(h: RegistryHandle, decisionTime: string): string[] {
  const d = Date.parse(decisionTime);
  if (!Number.isFinite(d)) throw new Error('INVALID_DECISION_TIME');
  return ((h.registry.structuralBreaks ?? []) as Json[])
    .filter((b) => Date.parse(`${b.date}T00:00:00.000Z`) <= d)
    .map((b) => `AFTER_${b.id}`);
}
