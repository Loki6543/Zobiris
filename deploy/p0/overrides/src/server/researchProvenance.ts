import Database from 'better-sqlite3';
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { evaluateResearchIntegrity } from '../strategy21/researchIntegrity/index.js';

export const P0_VERSION = '0.3.0' as const;
const migration = readFileSync(new URL('../../packages/research-p0/migrations/001_research_provenance.sql', import.meta.url), 'utf8');
const hash = (text: string) => createHash('sha256').update(text).digest('hex');
const migrationHash = hash(migration);
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
      const assessment = evaluateResearchIntegrity({
        strategyId: 'p0-evidence-registry', experimentCount: candidates,
        pointInTimeUniverse: 'UNKNOWN',
        deflatedSharpe: { status: 'UNKNOWN', value: null },
        probabilityBacktestOverfit: { status: 'UNKNOWN', value: null },
        cpcv: { status: 'UNKNOWN', value: null },
        parameterStability: { status: 'UNKNOWN', value: null }, benchmarks: [],
      });
      assessment.failureReasons.unshift(eligibleValidations === 0
        ? 'No integrity-eligible engine validations have been registered.'
        : 'Engine reproduction evidence exists; P1B statistical evaluation is not implemented.');
      return {
        assessment,
        evidence: {
          version: P0_VERSION, migrationSha256: migrationHash,
          source: 'PERSISTED_P0_EVIDENCE' as const,
          status: eligibleValidations > 0 ? 'ENGINE_EVIDENCE_ONLY' as const : 'AWAITING_EVIDENCE' as const,
          authority: 'SHADOW_ONLY_NO_TRADING_AUTHORITY' as const,
          artifacts: count('SELECT count(*) AS n FROM artifact_store'), families, candidates,
          results: count('SELECT count(*) AS n FROM candidate_result'), eligibleValidations,
          statisticalEvaluatorsImplemented: false,
          externalWitnessRequired: true,
        },
      };
    })();
  } finally { db.close(); }
}
