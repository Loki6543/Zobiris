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
    expect(status.evidence).toMatchObject({ version: '0.3.0', status: 'AWAITING_EVIDENCE', artifacts: 1, eligibleValidations: 0, statisticalEvaluatorsImplemented: true });
    expect(status.evidence.statisticalEvaluation).toMatchObject({
      selectionCount: 0,
      dsr: { metric: { status: 'UNKNOWN', value: null } },
      pbo: { metric: { status: 'UNKNOWN', value: null } },
      cpcv: { metric: { status: 'UNKNOWN', value: null } },
      authority: 'SHADOW_ONLY_NO_TRADING_AUTHORITY',
    });
    expect(status.assessment).toMatchObject({ experimentCount: 0, overallStatus: 'UNKNOWN', promotable: false, deflatedSharpe: { status: 'UNKNOWN', value: null } });
    const check = new Database(main);
    expect(check.prepare('SELECT symbol FROM holdings').get()).toEqual({ symbol: 'BTC' });
    expect(check.prepare("SELECT name FROM sqlite_master WHERE name='artifact_store'").get()).toBeUndefined();
    check.close();
  });
  it('wires complete CSCV selection evidence into shadow DSR/PBO diagnostics without creating promotion authority', () => {
    const main = path();
    const db = openResearchProvenance(main);
    const h = (n: number) => n.toString(16).padStart(64, '0');
    const artifact = db.prepare('INSERT INTO artifact_store VALUES(?,?,?,?,?,?,?,?)');
    for (const [n, name] of [[1,'params'],[2,'split-1'],[3,'split-2'],[4,'primitive']] as const) {
      artifact.run(h(n), 'application/json', 2, `private/${name}.json`, 'computed', '2026-10-07T00:00:00Z', 'test', null);
    }
    db.prepare(`INSERT INTO experiment_family(family_id,family_hash,title,hypothesis,generation_method,created_at)
      VALUES(?,?,?,?,?,?)`).run('fam', h(10), 'family', 'hypothesis', 'test', '2026-10-07T00:00:00Z');
    const candidate = db.prepare(`INSERT INTO candidate_strategy(candidate_id,family_id,ordinal,strategy_code_sha256,parameters_sha256,provider,source_capture_method,created_at)
      VALUES(?,?,?,?,?,?,?,?)`);
    candidate.run('a','fam',0,h(11),h(1),'test','unit','2026-10-07T00:00:00Z');
    candidate.run('b','fam',1,h(12),h(1),'test','unit','2026-10-07T00:00:00Z');
    const split = db.prepare(`INSERT INTO evaluation_split(split_id,family_id,split_hash,scheme_kind,definition_sha256,partition_count,purge_bars,embargo_bars,registered_at)
      VALUES(?,?,?,?,?,?,?,?,?)`);
    split.run('s1','fam',h(2),'CSCV',h(2),4,1,1,'2026-10-07T00:00:00Z');
    split.run('s2','fam',h(3),'CSCV',h(3),4,1,1,'2026-10-07T00:00:00Z');
    db.prepare(`INSERT INTO dataset_artifact(dataset_id,artifact_hash,name,source_kind,reproduction_tier,freeze_status,captured_at)
      VALUES(?,?,?,?,?,?,?)`).run('data',h(20),'data','SYNTHETIC','R3_CONTEXTUAL_ONLY','FROZEN','2026-10-07T00:00:00Z');
    db.prepare(`INSERT INTO engine_runtime(runtime_id,runtime_hash,engine_name,observation_protocol_hash,observation_adapter_hash,execution_model_hash,default_tolerance_schedule_hash,created_at)
      VALUES(?,?,?,?,?,?,?,?)`).run('rt',h(21),'test',h(22),h(23),h(24),h(25),'2026-10-07T00:00:00Z');
    const result = db.prepare(`INSERT INTO candidate_result(
      result_id,family_id,candidate_id,split_id,dataset_id,runtime_id,run_config_hash,result_hash,result_role,
      metric_definition_hash,cost_model_hash,observations_sha256,fills_sha256,positions_sha256,equity_marks_sha256,
      periodic_returns_sha256,primary_metric_name,primary_metric_value,n_observations,skew,kurtosis,sharpe,created_at)
      VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);
    let serial = 30;
    const add = (candidateId: string, splitId: string, role: 'IN_SAMPLE'|'OUT_OF_SAMPLE', metricValue: number, sharpe: number) => {
      result.run(
        `r-${candidateId}-${splitId}-${role}`, 'fam', candidateId, splitId, 'data', 'rt', h(26), h(serial++), role,
        h(27), h(28), h(4), h(4), h(4), h(4), h(4), 'score', metricValue, 252, 0, 3, sharpe, '2026-10-07T00:00:00Z',
      );
    };
    add('a','s1','IN_SAMPLE',2,0.30);
    add('b','s1','IN_SAMPLE',1,0.10);
    add('a','s1','OUT_OF_SAMPLE',2,0.30);
    add('b','s1','OUT_OF_SAMPLE',1,0.10);
    add('a','s2','IN_SAMPLE',1,0.10);
    add('b','s2','IN_SAMPLE',2,0.30);
    add('a','s2','OUT_OF_SAMPLE',1,0.10);
    add('b','s2','OUT_OF_SAMPLE',2,0.30);
    const selectionHash = h(60);
    db.prepare(`INSERT INTO audit_chain_event(event_id,event_type,payload_sha256,previous_event_hash,event_hash,occurred_at)
      VALUES(?,?,?,?,?,?)`).run('selection-event','SELECTION_RECORDED',selectionHash,null,h(61),'2026-10-07T00:00:01Z');
    db.prepare(`INSERT INTO selection_event(
      selection_id,family_id,selected_candidate_id,selected_split_id,selection_hash,record_event_id,
      selection_rule_hash,effective_trial_fn_hash,candidate_universe_hash,split_definition_hash,
      metric_definition_hash,cost_model_hash,trial_count_raw,effective_trial_count,experiment_hash,selected_at)
      VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
        'sel','fam','a','s1',selectionHash,'selection-event',h(62),h(63),h(64),h(2),h(27),h(28),2,2,h(65),'2026-10-07T00:00:02Z',
      );
    db.close();

    const status = readResearchProvenance(main);
    expect(status.evidence.statisticalEvaluation.selectionCount).toBe(1);
    expect(status.evidence.statisticalEvaluation.dsr.metric.value).not.toBeNull();
    expect(status.evidence.statisticalEvaluation.pbo.metric).toMatchObject({ status: 'PASS', value: 0, sampleCount: 1 });
    expect(status.evidence.statisticalEvaluation.cpcv.metric.status).toBe('UNKNOWN');
    expect(status.assessment.promotable).toBe(false);
    expect(status.evidence.statisticalEvaluation.authority).toBe('SHADOW_ONLY_NO_TRADING_AUTHORITY');
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
