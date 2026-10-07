import Database from 'better-sqlite3';
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { evaluateResearchIntegrity } from '../strategy21/researchIntegrity/index.js';
import {
  cpcvDiagnostics,
  deflatedSharpeFromSummary,
  pboFromSplitMatrix,
  type StatisticalMetric,
} from '../strategy21/researchIntegrity/statistics.js';

export const P0_VERSION = '0.3.0' as const;
const migration = readFileSync(new URL('../../packages/research-p0/migrations/001_research_provenance.sql', import.meta.url), 'utf8');
const hash = (text: string) => createHash('sha256').update(text).digest('hex');
const migrationHash = hash(migration);
const DSR_PASS_THRESHOLD = 0.95;
const PBO_PASS_THRESHOLD = 0.10;
const MAX_SELECTIONS_PER_READ = 200;

function schemaHash(db: Database.Database): string {
  return hash(JSON.stringify(db.prepare("SELECT type,name,tbl_name,sql FROM sqlite_master WHERE name NOT LIKE 'sqlite_%' ORDER BY type,name").all()));
}
function validateSchema(db: Database.Database): void {
  const rows = db.prepare('SELECT version,sha256,schema_hash FROM zobiris_p0_migrations').all() as Array<{version: string; sha256: string; schema_hash: string}>;
  if (rows.length !== 1 || rows[0]?.version !== P0_VERSION || rows[0]?.sha256 !== migrationHash) throw new Error('P0 migration version/checksum mismatch');
  if (rows[0].schema_hash !== schemaHash(db)) throw new Error('P0 schema integrity mismatch');
}

/** Independent evidence ledger beside the portfolio DB, on the same persistent volume. */
export function openResearchProvenance(mainDbPath: string): Database.Database {
  const path = mainDbPath === ':memory:' ? ':memory:' : resolve(mainDbPath) + '.research-p0.sqlite';
  if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true });
  const db = new Database(path);
  try {
    db.pragma('foreign_keys = ON');
    db.pragma('busy_timeout = 5000');
    db.pragma('journal_mode = WAL');
    db.transaction(() => {
      const objects = db.prepare("SELECT name FROM sqlite_master WHERE name NOT LIKE 'sqlite_%'").all() as Array<{ name: string }>;
      if (!objects.some(row => row.name === 'zobiris_p0_migrations')) {
        if (objects.length) throw new Error('Unversioned P0 research schema: explicit migration required');
        db.exec(migration);
        db.exec('CREATE TABLE zobiris_p0_migrations(version TEXT PRIMARY KEY, sha256 TEXT NOT NULL, schema_hash TEXT NOT NULL, applied_at TEXT NOT NULL)');
        db.prepare('INSERT INTO zobiris_p0_migrations VALUES(?,?,?,?)').run(P0_VERSION, migrationHash, schemaHash(db), new Date().toISOString());
      } else {
        validateSchema(db);
      }
    }).immediate();
    return db;
  } catch (error) { db.close(); throw error; }
}

type SelectionRow = {
  selectionId: string;
  familyId: string;
  candidateId: string;
  splitId: string;
  metricHash: string;
  costHash: string;
  trialCountRaw: number;
  effectiveTrialCount: number;
};

type SummaryRow = {
  resultRole: string;
  sharpe: number;
  skew: number;
  kurtosis: number;
  nObservations: number;
};

function selections(db: Database.Database, familyId?: string): { rows: SelectionRow[]; total: number; truncated: boolean } {
  const family = familyId?.trim() || null;
  const total = Number((db.prepare(
    'SELECT count(*) AS n FROM selection_event WHERE (? IS NULL OR family_id=?)',
  ).get(family, family) as { n: number }).n);
  const rows = db.prepare(`SELECT selection_id AS selectionId, family_id AS familyId,
    selected_candidate_id AS candidateId, selected_split_id AS splitId,
    metric_definition_hash AS metricHash, cost_model_hash AS costHash,
    trial_count_raw AS trialCountRaw, effective_trial_count AS effectiveTrialCount
    FROM selection_event
    WHERE (? IS NULL OR family_id=?)
    ORDER BY selected_at DESC, selection_id DESC LIMIT ?`).all(
      family, family, MAX_SELECTIONS_PER_READ,
    ) as SelectionRow[];
  return { rows, total, truncated: total > rows.length };
}

function selectedSummary(db: Database.Database, selection: SelectionRow): SummaryRow | null {
  return (db.prepare(`SELECT result_role AS resultRole, sharpe, skew, kurtosis,
      n_observations AS nObservations
    FROM candidate_result
    WHERE family_id=? AND candidate_id=? AND split_id=?
      AND metric_definition_hash=? AND cost_model_hash=?
      AND primitive_complete=1
      AND sharpe IS NOT NULL AND skew IS NOT NULL AND kurtosis IS NOT NULL
      AND n_observations IS NOT NULL
    ORDER BY CASE result_role
      WHEN 'OUT_OF_SAMPLE' THEN 1
      WHEN 'HOLDOUT' THEN 2
      WHEN 'CPCV_PATH' THEN 3
      WHEN 'FORWARD_SHADOW' THEN 4
      WHEN 'IN_SAMPLE' THEN 5
      ELSE 9 END
    LIMIT 1`).get(
      selection.familyId, selection.candidateId, selection.splitId,
      selection.metricHash, selection.costHash,
    ) as SummaryRow | undefined) ?? null;
}

function familySharpes(db: Database.Database, selection: SelectionRow, role: string): number[] {
  return (db.prepare(`SELECT sharpe FROM candidate_result
    WHERE family_id=? AND split_id=? AND result_role=?
      AND metric_definition_hash=? AND cost_model_hash=?
      AND primitive_complete=1 AND sharpe IS NOT NULL
    ORDER BY candidate_id`).all(
      selection.familyId, selection.splitId, role,
      selection.metricHash, selection.costHash,
    ) as Array<{ sharpe: number }>).map(row => Number(row.sharpe)).filter(Number.isFinite);
}

function aggregateMetric(
  values: number[],
  totalExpected: number,
  pass: (value: number) => boolean,
  worst: 'MIN' | 'MAX',
  threshold: string,
  missingReason: string,
): StatisticalMetric {
  if (!values.length) return { status: 'UNKNOWN', value: null, sampleCount: 0, threshold, reasons: [missingReason] };
  const representative = worst === 'MIN' ? Math.min(...values) : Math.max(...values);
  const anyFail = values.some(value => !pass(value));
  const incomplete = values.length < totalExpected;
  return {
    status: anyFail ? 'FAIL' : incomplete ? 'WATCH' : 'PASS',
    value: representative,
    sampleCount: values.length,
    threshold,
    reasons: [
      ...(anyFail ? [`${values.filter(value => !pass(value)).length} evaluated item(s) fail the threshold.`] : []),
      ...(incomplete ? [`${totalExpected - values.length} item(s) lack sufficient primitive statistical evidence.`] : []),
    ],
  };
}

const dsrPass = (value: number) => value > DSR_PASS_THRESHOLD;
const pboPass = (value: number) => value < PBO_PASS_THRESHOLD;

function evaluateDsr(db: Database.Database, selected: SelectionRow[]) {
  const values: number[] = [];
  const diagnostics: Array<Record<string, unknown>> = [];
  for (const selection of selected) {
    const summary = selectedSummary(db, selection);
    if (!summary) continue;
    const sharpes = familySharpes(db, selection, summary.resultRole);
    // Never silently shrink a search family: DSR must see the full registered
    // candidate universe for the selected split/metric/cost.
    if (sharpes.length !== selection.trialCountRaw) continue;
    const diag = deflatedSharpeFromSummary({
      observedSharpe: Number(summary.sharpe),
      skew: Number(summary.skew),
      kurtosis: Number(summary.kurtosis),
      nObservations: Number(summary.nObservations),
      trialSharpes: sharpes,
      effectiveTrialCount: Number(selection.effectiveTrialCount),
    });
    if (!diag) continue;
    values.push(diag.dsr);
    diagnostics.push({
      selectionId: selection.selectionId,
      familyId: selection.familyId,
      resultRole: summary.resultRole,
      dsr: diag.dsr,
      observedSharpe: diag.observedSharpe,
      deflatedBenchmarkSharpe: diag.deflatedBenchmarkSharpe,
      nTrials: diag.nTrials,
      nObservations: diag.nObservations,
    });
  }
  return {
    metric: aggregateMetric(
      values, selected.length, dsrPass, 'MIN',
      `>${DSR_PASS_THRESHOLD.toFixed(2)}`,
      'No selection has sufficient primitive Sharpe/skew/kurtosis/sample evidence for DSR.',
    ),
    diagnostics,
  };
}

function evaluatePbo(db: Database.Database, selected: SelectionRow[]) {
  const values: number[] = [];
  const diagnostics: Array<Record<string, unknown>> = [];
  const seenFamilies = new Set<string>();
  for (const selection of selected) {
    const familyKey = `${selection.familyId}:${selection.metricHash}:${selection.costHash}`;
    if (seenFamilies.has(familyKey)) continue;
    seenFamilies.add(familyKey);
    const rows = db.prepare(`SELECT cr.split_id AS splitId, cr.candidate_id AS candidateId,
        cr.result_role AS role, cr.primary_metric_value AS value
      FROM candidate_result cr
      JOIN evaluation_split es ON es.split_id=cr.split_id AND es.family_id=cr.family_id
      WHERE cr.family_id=? AND cr.metric_definition_hash=? AND cr.cost_model_hash=?
        AND es.scheme_kind='CSCV' AND cr.result_role IN ('IN_SAMPLE','OUT_OF_SAMPLE')
        AND cr.primitive_complete=1 AND cr.primary_metric_value IS NOT NULL
      ORDER BY cr.split_id, cr.candidate_id, cr.result_role`).all(
        selection.familyId, selection.metricHash, selection.costHash,
      ) as Array<{ splitId: string; candidateId: string; role: 'IN_SAMPLE' | 'OUT_OF_SAMPLE'; value: number }>;
    const diag = pboFromSplitMatrix(
      rows.map(row => ({ ...row, value: Number(row.value) })),
      selection.trialCountRaw,
    );
    if (!diag) continue;
    values.push(diag.pbo);
    diagnostics.push({
      familyId: selection.familyId,
      pbo: diag.pbo,
      validSplits: diag.validSplits,
      droppedSplits: diag.droppedSplits,
    });
  }
  return {
    metric: aggregateMetric(
      values, seenFamilies.size, pboPass, 'MAX',
      `<${PBO_PASS_THRESHOLD.toFixed(2)}`,
      'No family has a complete CSCV in-sample/out-of-sample matrix for PBO.',
    ),
    diagnostics,
  };
}

function evaluateCpcv(db: Database.Database, selected: SelectionRow[]) {
  const diagnostics: Array<Record<string, unknown>> = [];
  const rates: number[] = [];
  for (const selection of selected) {
    const rows = db.prepare(`SELECT cr.primary_metric_value AS value
      FROM candidate_result cr
      JOIN evaluation_split es ON es.split_id=cr.split_id AND es.family_id=cr.family_id
      WHERE cr.family_id=? AND cr.candidate_id=?
        AND cr.metric_definition_hash=? AND cr.cost_model_hash=?
        AND es.scheme_kind='CPCV' AND cr.result_role='CPCV_PATH'
        AND cr.primitive_complete=1 AND cr.primary_metric_value IS NOT NULL
      ORDER BY cr.split_id`).all(
        selection.familyId, selection.candidateId, selection.metricHash, selection.costHash,
      ) as Array<{ value: number }>;
    const diag = cpcvDiagnostics(rows.map(row => Number(row.value)));
    if (diag.pathCount === 0 || diag.positivePathRate == null) continue;
    rates.push(diag.positivePathRate);
    diagnostics.push({ selectionId: selection.selectionId, familyId: selection.familyId, ...diag });
  }
  if (!rates.length) {
    return {
      metric: {
        status: 'UNKNOWN', value: null, sampleCount: 0,
        threshold: 'PREREGISTERED_THRESHOLD_REQUIRED',
        reasons: ['No complete CPCV path evidence is available.'],
      } as StatisticalMetric,
      diagnostics,
    };
  }
  // Do not invent a promotion threshold. The uploaded research requested CPCV,
  // but neither the current registry nor the verified dependency defines the
  // ZOBIRIS-specific path-rate threshold. Surface the measurement as WATCH.
  return {
    metric: {
      status: 'WATCH', value: Math.min(...rates), sampleCount: rates.length,
      threshold: 'PREREGISTERED_THRESHOLD_REQUIRED',
      reasons: ['CPCV path behavior is measured, but no ZOBIRIS promotion threshold is preregistered; measurement cannot become authority.'],
    } as StatisticalMetric,
    diagnostics,
  };
}

export function evaluateP0StatisticalEvidence(db: Database.Database, familyId?: string) {
  const scan = selections(db, familyId);
  const selected = scan.rows;
  const dsr = evaluateDsr(db, selected);
  const pbo = evaluatePbo(db, selected);
  const cpcv = evaluateCpcv(db, selected);
  if (scan.truncated) {
    for (const entry of [dsr, pbo, cpcv]) {
      if (entry.metric.status === 'PASS') entry.metric.status = 'WATCH';
      entry.metric.reasons.push(`Evidence read bounded at ${MAX_SELECTIONS_PER_READ} newest selections out of ${scan.total}; full-history certification is required offline.`);
    }
  }
  return {
    selectionCount: scan.total,
    evaluatedSelectionCount: selected.length,
    truncated: scan.truncated,
    dsr,
    pbo,
    cpcv,
    thresholds: {
      dsr: `>${DSR_PASS_THRESHOLD.toFixed(2)}`,
      pbo: `<${PBO_PASS_THRESHOLD.toFixed(2)}`,
      cpcv: 'PREREGISTERED_THRESHOLD_REQUIRED',
    },
    authority: 'SHADOW_ONLY_NO_TRADING_AUTHORITY' as const,
  };
}

export type StrategyEvidenceMappingStatus = 'MAPPED' | 'UNMAPPED' | 'AMBIGUOUS';
export type StrategyStatisticalGateStatus = 'PASS' | 'FAIL' | 'WATCH' | 'UNKNOWN';

export interface StrategyStatisticalEvidence {
  strategyTag: string;
  authority: 'SHADOW_ONLY_NO_TRADING_AUTHORITY';
  source: 'PERSISTED_P0_EVIDENCE' | 'UNAVAILABLE';
  mapping: {
    status: StrategyEvidenceMappingStatus;
    familyId: string | null;
    matchedBy: 'family_id' | 'family_title' | 'provider_strategy_id' | null;
  };
  provenanceComplete: boolean;
  eligibleValidations: number;
  selectionCount: number;
  evaluatedSelectionCount: number;
  truncated: boolean;
  dsr: StatisticalMetric;
  pbo: StatisticalMetric;
  cpcv: StatisticalMetric;
  gate: {
    status: StrategyStatisticalGateStatus;
    reasons: string[];
  };
}

function unknownMetric(threshold: string, reason: string): StatisticalMetric {
  return { status: 'UNKNOWN', value: null, sampleCount: 0, threshold, reasons: [reason] };
}

function unavailableStrategyEvidence(
  strategyTag: string,
  mappingStatus: StrategyEvidenceMappingStatus = 'UNMAPPED',
  reason = 'No uniquely mapped P0 experiment family is available for this strategy tag.',
): StrategyStatisticalEvidence {
  return {
    strategyTag,
    authority: 'SHADOW_ONLY_NO_TRADING_AUTHORITY',
    source: 'UNAVAILABLE',
    mapping: { status: mappingStatus, familyId: null, matchedBy: null },
    provenanceComplete: false,
    eligibleValidations: 0,
    selectionCount: 0,
    evaluatedSelectionCount: 0,
    truncated: false,
    dsr: unknownMetric(`>${DSR_PASS_THRESHOLD.toFixed(2)}`, reason),
    pbo: unknownMetric(`<${PBO_PASS_THRESHOLD.toFixed(2)}`, reason),
    cpcv: unknownMetric('PREREGISTERED_THRESHOLD_REQUIRED', reason),
    gate: { status: 'UNKNOWN', reasons: [reason] },
  };
}

function resolveStrategyFamily(
  db: Database.Database,
  strategyTag: string,
): { status: StrategyEvidenceMappingStatus; familyId: string | null; matchedBy: StrategyStatisticalEvidence['mapping']['matchedBy'] } {
  const tag = strategyTag.trim();
  if (!tag) return { status: 'UNMAPPED', familyId: null, matchedBy: null };
  const rows = db.prepare(`
    SELECT DISTINCT ef.family_id AS familyId,
      CASE
        WHEN ef.family_id = ? COLLATE NOCASE THEN 'family_id'
        WHEN ef.title = ? COLLATE NOCASE THEN 'family_title'
        WHEN cs.provider_strategy_id = ? COLLATE NOCASE THEN 'provider_strategy_id'
        ELSE NULL
      END AS matchedBy
    FROM experiment_family ef
    LEFT JOIN candidate_strategy cs ON cs.family_id=ef.family_id
    WHERE ef.family_id = ? COLLATE NOCASE
       OR ef.title = ? COLLATE NOCASE
       OR cs.provider_strategy_id = ? COLLATE NOCASE
    ORDER BY ef.family_id
  `).all(tag, tag, tag, tag, tag, tag) as Array<{ familyId: string; matchedBy: StrategyStatisticalEvidence['mapping']['matchedBy'] }>;
  const unique = [...new Map(rows.map(row => [row.familyId, row])).values()];
  if (unique.length === 0) return { status: 'UNMAPPED', familyId: null, matchedBy: null };
  if (unique.length > 1) return { status: 'AMBIGUOUS', familyId: null, matchedBy: null };
  return { status: 'MAPPED', familyId: unique[0]!.familyId, matchedBy: unique[0]!.matchedBy };
}

function eligibleValidationsForFamily(db: Database.Database, familyId: string): number {
  return Number((db.prepare(`SELECT count(*) AS n FROM engine_validation ev
    WHERE ev.family_id=?
      AND ev.eligible_for_integrity_scoring=1
      AND NOT EXISTS (
        SELECT 1 FROM engine_validation newer
        WHERE newer.supersedes_validation_id=ev.validation_id
          AND newer.candidate_id=ev.candidate_id
          AND newer.family_id=ev.family_id
      )`).get(familyId) as { n: number }).n);
}

function strategyStatisticalEvidence(
  db: Database.Database,
  strategyTag: string,
): StrategyStatisticalEvidence {
  const mapping = resolveStrategyFamily(db, strategyTag);
  if (mapping.status !== 'MAPPED' || !mapping.familyId) {
    return unavailableStrategyEvidence(
      strategyTag,
      mapping.status,
      mapping.status === 'AMBIGUOUS'
        ? 'Multiple P0 experiment families match this strategy tag; certification refuses an ambiguous mapping.'
        : 'No P0 experiment family is persistently mapped to this strategy tag.',
    );
  }

  const statistics = evaluateP0StatisticalEvidence(db, mapping.familyId);
  const eligibleValidations = eligibleValidationsForFamily(db, mapping.familyId);
  const reasons: string[] = [];
  if (eligibleValidations < 1) reasons.push('No integrity-eligible engine validation exists for the mapped family.');
  if (statistics.selectionCount < 1) reasons.push('The mapped family has no registered selection event.');
  if (statistics.truncated) reasons.push('The mapped family statistical read is truncated; offline full-history certification is required.');
  reasons.push(...statistics.dsr.metric.reasons, ...statistics.pbo.metric.reasons);

  const provenanceComplete = eligibleValidations > 0
    && statistics.selectionCount > 0
    && !statistics.truncated;
  let gateStatus: StrategyStatisticalGateStatus = 'UNKNOWN';
  if (statistics.dsr.metric.status === 'FAIL' || statistics.pbo.metric.status === 'FAIL') gateStatus = 'FAIL';
  else if (
    provenanceComplete
    && statistics.dsr.metric.status === 'PASS'
    && statistics.pbo.metric.status === 'PASS'
  ) gateStatus = 'PASS';
  else if (
    statistics.dsr.metric.status === 'WATCH'
    || statistics.pbo.metric.status === 'WATCH'
    || statistics.truncated
  ) gateStatus = 'WATCH';

  return {
    strategyTag,
    authority: 'SHADOW_ONLY_NO_TRADING_AUTHORITY',
    source: 'PERSISTED_P0_EVIDENCE',
    mapping,
    provenanceComplete,
    eligibleValidations,
    selectionCount: statistics.selectionCount,
    evaluatedSelectionCount: statistics.evaluatedSelectionCount,
    truncated: statistics.truncated,
    dsr: statistics.dsr.metric,
    pbo: statistics.pbo.metric,
    cpcv: statistics.cpcv.metric,
    gate: { status: gateStatus, reasons: [...new Set(reasons)] },
  };
}

/**
 * Resolve DSR/PBO evidence to a strategy tag only through persisted, exact P0
 * lineage. Caller-supplied family IDs are intentionally not accepted.
 */
export function readStrategyStatisticalEvidenceBatch(
  mainDbPath: string,
  strategyTags: string[],
): Record<string, StrategyStatisticalEvidence> {
  const tags = [...new Set(strategyTags.map(tag => tag.trim()).filter(Boolean))].slice(0, 100);
  if (!tags.length) return {};
  let db: Database.Database | null = null;
  try {
    db = new Database(resolve(mainDbPath) + '.research-p0.sqlite', { readonly: true, fileMustExist: true, timeout: 100 });
    validateSchema(db);
    return Object.fromEntries(tags.map(tag => [tag, strategyStatisticalEvidence(db!, tag)]));
  } catch {
    return Object.fromEntries(tags.map(tag => [
      tag,
      unavailableStrategyEvidence(tag, 'UNMAPPED', 'P0 statistical provenance is unavailable; certification fails closed.'),
    ]));
  } finally {
    db?.close();
  }
}

export function readResearchProvenance(mainDbPath: string) {
  const db = new Database(resolve(mainDbPath) + '.research-p0.sqlite', { readonly: true, fileMustExist: true, timeout: 100 });
  try {
    return db.transaction(() => {
      validateSchema(db);
      const count = (sql: string) => Number((db.prepare(sql).get() as { n: number }).n);
      const families = count('SELECT count(*) AS n FROM experiment_family');
      const candidates = count('SELECT count(*) AS n FROM candidate_strategy');
      const eligibleValidations = count(`SELECT count(*) AS n FROM engine_validation ev
        WHERE eligible_for_integrity_scoring=1 AND NOT EXISTS
        (SELECT 1 FROM engine_validation newer WHERE newer.supersedes_validation_id=ev.validation_id
          AND newer.candidate_id=ev.candidate_id AND newer.family_id=ev.family_id)`);
      const statistics = evaluateP0StatisticalEvidence(db);
      const assessment = evaluateResearchIntegrity({
        strategyId: 'p0-evidence-registry', experimentCount: candidates,
        pointInTimeUniverse: 'UNKNOWN',
        deflatedSharpe: { status: statistics.dsr.metric.status, value: statistics.dsr.metric.value },
        probabilityBacktestOverfit: { status: statistics.pbo.metric.status, value: statistics.pbo.metric.value },
        cpcv: { status: statistics.cpcv.metric.status, value: statistics.cpcv.metric.value },
        parameterStability: { status: 'UNKNOWN', value: null }, benchmarks: [],
      });
      assessment.failureReasons.unshift(eligibleValidations === 0
        ? 'No integrity-eligible engine validations have been registered.'
        : statistics.selectionCount === 0
          ? 'Engine reproduction evidence exists, but no registered selection event is available for statistical evaluation.'
          : 'P1B DSR/PBO diagnostics are wired from persisted point-in-time evidence; unresolved gates remain non-promotable.');
      return {
        assessment,
        evidence: {
          version: P0_VERSION, migrationSha256: migrationHash,
          source: 'PERSISTED_P0_EVIDENCE' as const,
          status: eligibleValidations > 0 ? 'ENGINE_EVIDENCE_ONLY' as const : 'AWAITING_EVIDENCE' as const,
          authority: 'SHADOW_ONLY_NO_TRADING_AUTHORITY' as const,
          artifacts: count('SELECT count(*) AS n FROM artifact_store'), families, candidates,
          results: count('SELECT count(*) AS n FROM candidate_result'), eligibleValidations,
          statisticalEvaluatorsImplemented: true,
          statisticalEvaluation: statistics,
          externalWitnessRequired: true,
        },
      };
    })();
  } finally { db.close(); }
}
