import { afterEach, describe, expect, it } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import Database from 'better-sqlite3';
import { openResearchProvenance, readResearchProvenance } from '../server/researchProvenance.js';

const dirs: string[] = [];
function path() { const dir = mkdtempSync(join(tmpdir(), 'zobiris-p0-')); dirs.push(dir); return join(dir, 'portfolio.sqlite'); }
afterEach(() => { for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true }); });

describe('P0 persistent research boundary', () => {
  it('reads the last committed evidence snapshot while an importer holds a write transaction', () => {
    const main = path(); const writer = openResearchProvenance(main);
    writer.exec('BEGIN IMMEDIATE');
    try { expect(readResearchProvenance(main).evidence.eligibleValidations).toBe(0); }
    finally { writer.exec('ROLLBACK'); writer.close(); }
  });
  it('initializes and reopens a separate persistent store without touching portfolio tables', () => {
    const main = path();
    const portfolio = new Database(main);
    portfolio.exec("CREATE TABLE holdings(symbol TEXT); INSERT INTO holdings VALUES('BTC')");
    portfolio.close();
    const db = openResearchProvenance(main);
    db.prepare('INSERT INTO artifact_store VALUES(?,?,?,?,?,?,?,?)').run('a'.repeat(64), 'text/plain', 1, 'private/a', 'manual_capture', '2026-09-29', 'test', null);
    expect(() => db.exec('DELETE FROM artifact_store')).toThrow();
    db.close();
    const status = readResearchProvenance(main);
    expect(status.evidence).toMatchObject({ version: '0.3.0', status: 'AWAITING_EVIDENCE', artifacts: 1, eligibleValidations: 0 });
    expect(status.assessment).toMatchObject({ experimentCount: 0, overallStatus: 'UNKNOWN', promotable: false, deflatedSharpe: { status: 'UNKNOWN', value: null } });
    const check = new Database(main);
    expect(check.prepare('SELECT symbol FROM holdings').get()).toEqual({ symbol: 'BTC' });
    expect(check.prepare("SELECT name FROM sqlite_master WHERE name='artifact_store'").get()).toBeUndefined();
    check.close();
  });
  it('rejects an unversioned pre-existing research schema instead of silently accepting it', () => {
    const main = path(); const db = new Database(main + '.research-p0.sqlite');
    db.exec('CREATE TABLE artifact_store(old_column TEXT)'); db.close();
    expect(() => openResearchProvenance(main)).toThrow(/unversioned/i);
  });
  it('rejects a migration checksum mismatch on reopen', () => {
    const main = path(); const db = openResearchProvenance(main);
    db.exec("UPDATE zobiris_p0_migrations SET sha256='changed'"); db.close();
    expect(() => openResearchProvenance(main)).toThrow(/checksum/i);
  });
  it('rejects removal of an evidence guard after initialization', () => {
    const main = path(); const db = openResearchProvenance(main);
    const trigger = db.prepare("SELECT name FROM sqlite_master WHERE type='trigger' LIMIT 1").get() as { name: string };
    db.exec(`DROP TRIGGER "${trigger.name}"`); db.close();
    expect(() => openResearchProvenance(main)).toThrow(/schema/i);
  });
});
