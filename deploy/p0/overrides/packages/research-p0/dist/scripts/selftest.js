import { DatabaseSync } from 'node:sqlite';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { canonicalJson, canonicalSha256 } from '../src/canonical.js';
import { diffCapabilityManifests, normalizeToolsList } from '../src/capability-manifest.js';
import { freezeLona } from '../src/freeze-core.js';
import { verifyObservations } from '../src/verifier.js';
function assert(condition, message) {
    if (!condition)
        throw new Error(`ASSERTION FAILED: ${message}`);
}
function expectReject(fn, message) {
    let rejected = false;
    try {
        fn();
    }
    catch {
        rejected = true;
    }
    assert(rejected, message);
}
const H = (c) => c.repeat(64);
const TS = '2026-09-27T00:00:00Z';
function putArtifact(db, hash, origin = 'computed') {
    db.prepare(`INSERT OR IGNORE INTO artifact_store(sha256,media_type,byte_len,storage_path,origin,created_at,created_by) VALUES(?,?,?,?,?,?,?)`)
        .run(hash, 'application/json', 2, `${hash.slice(0, 2)}/${hash}.json`, origin, TS, 'selftest');
}
function lastEventHash(db) {
    const row = db.prepare(`SELECT event_hash FROM audit_chain_event ORDER BY sequence_no DESC LIMIT 1`).get();
    return row?.event_hash ?? null;
}
let eventCounter = 1;
function addEvent(db, id, type, payload) {
    const eventHash = eventCounter.toString(16).padStart(64, '0');
    eventCounter++;
    db.prepare(`INSERT INTO audit_chain_event(event_id,event_type,payload_sha256,previous_event_hash,event_hash,occurred_at) VALUES(?,?,?,?,?,?)`)
        .run(id, type, payload, lastEventHash(db), eventHash, TS);
    return eventHash;
}
function setupDb() {
    const db = new DatabaseSync(':memory:');
    db.exec(awaitedMigration);
    return db;
}
let awaitedMigration = '';
function createConfirmatoryFixture(db) {
    const artifacts = [H('a'), H('b'), H('c'), H('d'), H('e'), H('f'), '0'.repeat(64), '1'.repeat(64), '2'.repeat(64), '3'.repeat(64), '4'.repeat(64), '5'.repeat(64), '6'.repeat(64), '7'.repeat(64), '8'.repeat(64), '9'.repeat(64)];
    for (const x of artifacts)
        putArtifact(db, x);
    addEvent(db, 'plan1-event', 'RESEARCH_PLAN_REGISTERED', H('a'));
    db.prepare(`INSERT INTO research_plan(plan_id,plan_hash,research_class,hypothesis,candidate_generation_hash,search_space_hash,selection_rule_hash,effective_trial_fn_hash,split_definition_hash,metric_definition_hash,cost_model_hash,data_universe_definition_hash,stopping_rule_hash,registration_event_id,registered_at,created_by) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
        .run('p1', H('a'), 'CONFIRMATORY', 'test', H('b'), H('c'), H('d'), H('e'), H('f'), '0'.repeat(64), '1'.repeat(64), '2'.repeat(64), '3'.repeat(64), 'plan1-event', TS, 'selftest');
    db.prepare(`INSERT INTO experiment_family(family_id,family_hash,plan_id,title,hypothesis,generation_method,search_space_sha256,candidate_universe_sha256,created_at) VALUES(?,?,?,?,?,?,?,?,?)`)
        .run('f1', '4'.repeat(64), 'p1', 'Family 1', 'test', 'grid', H('c'), '5'.repeat(64), TS);
    db.prepare(`INSERT INTO dataset_artifact(dataset_id,artifact_hash,name,source_kind,reproduction_tier,freeze_status,original_input_sha256,captured_at) VALUES(?,?,?,?,?,?,?,?)`)
        .run('d1', '6'.repeat(64), 'D1', 'SYNTHETIC', 'R1_BYTE_REPRODUCIBLE', 'FROZEN', '7'.repeat(64), TS);
    db.prepare(`INSERT INTO dataset_artifact(dataset_id,artifact_hash,name,source_kind,reproduction_tier,freeze_status,captured_at) VALUES(?,?,?,?,?,?,?)`)
        .run('dR2', '8'.repeat(64), 'D-R2', 'LONA_GLOBAL', 'R2_CONFIG_REPRODUCIBLE_INPUTS_UNPINNED', 'SOURCE_DATA_NOT_FROZEN', TS);
    db.prepare(`INSERT INTO dataset_artifact(dataset_id,artifact_hash,name,source_kind,reproduction_tier,freeze_status,original_input_sha256,captured_at) VALUES(?,?,?,?,?,?,?,?)`)
        .run('d2', '9'.repeat(64), 'D2', 'SYNTHETIC', 'R1_BYTE_REPRODUCIBLE', 'FROZEN', '7'.repeat(64), TS);
    db.prepare(`INSERT INTO engine_runtime(runtime_id,runtime_hash,engine_name,engine_version,observation_protocol_hash,observation_adapter_hash,execution_model_hash,default_tolerance_schedule_hash,created_at) VALUES(?,?,?,?,?,?,?,?,?)`)
        .run('r1', H('b'), 'LONA', '1', '1'.repeat(64), '2'.repeat(64), '3'.repeat(64), '4'.repeat(64), TS);
    db.prepare(`INSERT INTO engine_runtime(runtime_id,runtime_hash,engine_name,engine_version,observation_protocol_hash,observation_adapter_hash,execution_model_hash,default_tolerance_schedule_hash,created_at) VALUES(?,?,?,?,?,?,?,?,?)`)
        .run('r2', H('c'), 'LOCAL', '1', '1'.repeat(64), '5'.repeat(64), '3'.repeat(64), '4'.repeat(64), TS);
    db.prepare(`INSERT INTO candidate_strategy(candidate_id,family_id,ordinal,strategy_code_sha256,strategy_source_sha256,parameters_sha256,behavioral_spec_sha256,provider,source_capture_method,created_at) VALUES(?,?,?,?,?,?,?,?,?,?)`)
        .run('c1', 'f1', 0, H('d'), H('d'), H('e'), H('f'), 'LONA', 'tool', TS);
    db.prepare(`INSERT INTO evaluation_split(split_id,family_id,split_hash,scheme_kind,definition_sha256,registered_at) VALUES(?,?,?,?,?,?)`)
        .run('s1', 'f1', H('f'), 'HOLDOUT', H('f'), TS);
    addEvent(db, 'result-ref-event', 'CANDIDATE_RESULT_RECORDED', '0'.repeat(64));
    addEvent(db, 'result-can-event', 'CANDIDATE_RESULT_RECORDED', '1'.repeat(64));
    const ins = `INSERT INTO candidate_result(result_id,family_id,candidate_id,split_id,dataset_id,runtime_id,run_config_hash,result_hash,record_event_id,result_role,metric_definition_hash,cost_model_hash,observations_sha256,fills_sha256,positions_sha256,equity_marks_sha256,periodic_returns_sha256,primary_metric_name,primary_metric_value,n_observations,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;
    db.prepare(ins).run('cr-ref', 'f1', 'c1', 's1', 'd1', 'r1', '2'.repeat(64), '0'.repeat(64), 'result-ref-event', 'OUT_OF_SAMPLE', '0'.repeat(64), '1'.repeat(64), H('a'), H('b'), H('c'), H('d'), H('e'), 'return', 1, 10, TS);
    db.prepare(ins).run('cr-can', 'f1', 'c1', 's1', 'd1', 'r2', '2'.repeat(64), '1'.repeat(64), 'result-can-event', 'REFERENCE_ORACLE', '0'.repeat(64), '1'.repeat(64), H('a'), H('b'), H('c'), H('d'), H('e'), 'return', 1, 10, TS);
    addEvent(db, 'selection-event', 'SELECTION_RECORDED', '2'.repeat(64));
    db.prepare(`INSERT INTO selection_event(selection_id,family_id,selected_candidate_id,selected_split_id,selection_hash,record_event_id,selection_rule_hash,effective_trial_fn_hash,candidate_universe_hash,split_definition_hash,metric_definition_hash,cost_model_hash,trial_count_raw,effective_trial_count,experiment_hash,selected_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
        .run('sel1', 'f1', 'c1', 's1', '2'.repeat(64), 'selection-event', H('d'), H('e'), '5'.repeat(64), H('f'), '0'.repeat(64), '1'.repeat(64), 1, 1, '3'.repeat(64), TS);
    db.prepare(`INSERT INTO engine_validation(validation_id,family_id,candidate_id,reference_result_id,candidate_result_id,dataset_hash_equal,strategy_hash_equal,config_hash_equal,observation_protocol_hash_equal,execution_model_hash_equal,tolerance_schedule_hash,verifier_version,verifier_code_sha256,verifier_output_sha256,conclusion,computed_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
        .run('v1', 'f1', 'c1', 'cr-ref', 'cr-can', 1, 1, 1, 1, 1, '4'.repeat(64), 'v3', '5'.repeat(64), '6'.repeat(64), 'EXACT_MATCH', TS);
}
async function testSql() {
    const db = setupDb();
    putArtifact(db, H('a'));
    expectReject(() => db.prepare(`INSERT INTO artifact_store(sha256,media_type,byte_len,storage_path,origin,created_at,created_by) VALUES(?,?,?,?,?,?,?)`).run('z'.repeat(64), 'x', 1, 'x', 'computed', TS, 'x'), 'non-hex SHA-256 must be rejected');
    expectReject(() => db.prepare('UPDATE artifact_store SET byte_len=3 WHERE sha256=?').run(H('a')), 'append-only UPDATE must fail');
    expectReject(() => db.prepare('DELETE FROM artifact_store WHERE sha256=?').run(H('a')), 'append-only DELETE must fail');
    expectReject(() => db.prepare(`INSERT INTO audit_chain_event(event_id,event_type,payload_sha256,previous_event_hash,event_hash,occurred_at) VALUES(?,?,?,?,?,?)`).run('bad-genesis', 'X', H('a'), H('b'), H('c'), TS), 'genesis audit event cannot claim previous hash');
    db.close();
    const x = setupDb();
    createConfirmatoryFixture(x);
    const elig = x.prepare(`SELECT eligible_for_integrity_scoring FROM engine_validation WHERE validation_id='v1'`).get().eligible_for_integrity_scoring;
    assert(elig === 1, 'validation eligibility must be database-derived');
    const prereg = x.prepare(`SELECT preregistration_proven FROM v_confirmatory_preregistration WHERE plan_id='p1'`).get().preregistration_proven;
    assert(prereg === 1, 'pre-registration proof must derive from audit-chain ordering');
    // Create second family/candidate/split to attack composite lineage.
    addEvent(x, 'plan2-event', 'RESEARCH_PLAN_REGISTERED', H('b'));
    x.prepare(`INSERT INTO research_plan(plan_id,plan_hash,research_class,hypothesis,candidate_generation_hash,search_space_hash,selection_rule_hash,effective_trial_fn_hash,split_definition_hash,metric_definition_hash,cost_model_hash,data_universe_definition_hash,stopping_rule_hash,registration_event_id,registered_at,created_by) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
        .run('p2', H('b'), 'EXPLORATORY', 'other', H('c'), H('d'), H('e'), H('f'), '0'.repeat(64), '1'.repeat(64), '2'.repeat(64), '3'.repeat(64), '4'.repeat(64), 'plan2-event', TS, 'selftest');
    x.prepare(`INSERT INTO experiment_family(family_id,family_hash,plan_id,title,hypothesis,generation_method,search_space_sha256,candidate_universe_sha256,created_at) VALUES(?,?,?,?,?,?,?,?,?)`)
        .run('f2', '5'.repeat(64), 'p2', 'Family2', 'other', 'grid', H('d'), H('e'), TS);
    x.prepare(`INSERT INTO candidate_strategy(candidate_id,family_id,ordinal,strategy_code_sha256,parameters_sha256,provider,source_capture_method,created_at) VALUES(?,?,?,?,?,?,?,?)`)
        .run('c2', 'f2', 0, H('f'), H('e'), 'LOCAL', 'local', TS);
    x.prepare(`INSERT INTO evaluation_split(split_id,family_id,split_hash,scheme_kind,definition_sha256,registered_at) VALUES(?,?,?,?,?,?)`).run('s2', 'f2', '1'.repeat(64), 'SINGLE', '1'.repeat(64), TS);
    const attack = `INSERT INTO candidate_result(result_id,family_id,candidate_id,split_id,dataset_id,runtime_id,run_config_hash,result_hash,result_role,metric_definition_hash,cost_model_hash,primary_metric_name,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)`;
    expectReject(() => x.prepare(attack).run('bad-cross-candidate', 'f1', 'c2', 's1', 'd1', 'r1', '2'.repeat(64), '2'.repeat(64), 'REFERENCE_ORACLE', '0'.repeat(64), '1'.repeat(64), 'x', TS), 'candidate from family B cannot be attached to family A');
    expectReject(() => x.prepare(attack).run('bad-cross-split', 'f1', 'c1', 's2', 'd1', 'r1', '2'.repeat(64), '4'.repeat(64), 'REFERENCE_ORACLE', '0'.repeat(64), '1'.repeat(64), 'x', TS), 'split from family B cannot be attached to family A');
    addEvent(x, 'missing-primitives-event', 'CANDIDATE_RESULT_RECORDED', '5'.repeat(64));
    expectReject(() => x.prepare(attack.replace('result_hash,result_role', 'result_hash,record_event_id,result_role')).run('bad-primitives', 'f1', 'c1', 's1', 'd1', 'r1', '2'.repeat(64), '5'.repeat(64), 'missing-primitives-event', 'OUT_OF_SAMPLE', '0'.repeat(64), '1'.repeat(64), 'x', TS), 'confirmatory result without primitives must fail');
    // R2 data cannot back a confirmatory result.
    addEvent(x, 'r2-result-event', 'CANDIDATE_RESULT_RECORDED', '6'.repeat(64));
    const fullIns = `INSERT INTO candidate_result(result_id,family_id,candidate_id,split_id,dataset_id,runtime_id,run_config_hash,result_hash,record_event_id,result_role,metric_definition_hash,cost_model_hash,observations_sha256,fills_sha256,positions_sha256,equity_marks_sha256,periodic_returns_sha256,primary_metric_name,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;
    expectReject(() => x.prepare(fullIns).run('bad-r2', 'f1', 'c1', 's1', 'dR2', 'r1', '2'.repeat(64), '6'.repeat(64), 'r2-result-event', 'OUT_OF_SAMPLE', '0'.repeat(64), '1'.repeat(64), H('a'), H('b'), H('c'), H('d'), H('e'), 'x', TS), 'confirmatory result must use R1 data');
    // Selection drift from registered metric/cost/split must fail.
    addEvent(x, 'bad-selection-event', 'SELECTION_RECORDED', '7'.repeat(64));
    const selSql = `INSERT INTO selection_event(selection_id,family_id,selected_candidate_id,selected_split_id,selection_hash,record_event_id,selection_rule_hash,effective_trial_fn_hash,candidate_universe_hash,split_definition_hash,metric_definition_hash,cost_model_hash,trial_count_raw,effective_trial_count,experiment_hash,selected_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;
    expectReject(() => x.prepare(selSql).run('bad-sel', 'f1', 'c1', 's1', '7'.repeat(64), 'bad-selection-event', H('d'), H('e'), '5'.repeat(64), H('f'), '9'.repeat(64), '1'.repeat(64), 1, 1, '8'.repeat(64), TS), 'metric drift from pre-registered plan must fail');
    // Tolerance match cannot become eligible without tolerance evidence.
    expectReject(() => x.prepare(`INSERT INTO engine_validation(validation_id,family_id,candidate_id,reference_result_id,candidate_result_id,dataset_hash_equal,strategy_hash_equal,config_hash_equal,observation_protocol_hash_equal,execution_model_hash_equal,tolerance_schedule_hash,verifier_version,verifier_code_sha256,verifier_output_sha256,conclusion,computed_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
        .run('bad-tol', 'f1', 'c1', 'cr-ref', 'cr-can', 1, 1, 1, 1, 1, '4'.repeat(64), 'v3', '5'.repeat(64), '6'.repeat(64), 'MATCH_WITH_REGISTERED_NUMERIC_TOLERANCE', TS), 'tolerance match needs evidence');
    // Exact validation cannot lie about different underlying dataset artifacts.
    addEvent(x, 'result-d2-event', 'CANDIDATE_RESULT_RECORDED', '8'.repeat(64));
    x.prepare(fullIns).run('cr-d2', 'f1', 'c1', 's1', 'd2', 'r2', '2'.repeat(64), '8'.repeat(64), 'result-d2-event', 'HOLDOUT', '0'.repeat(64), '1'.repeat(64), H('a'), H('b'), H('c'), H('d'), H('e'), 'x', TS);
    expectReject(() => x.prepare(`INSERT INTO engine_validation(validation_id,family_id,candidate_id,reference_result_id,candidate_result_id,dataset_hash_equal,strategy_hash_equal,config_hash_equal,observation_protocol_hash_equal,execution_model_hash_equal,tolerance_schedule_hash,verifier_version,verifier_code_sha256,verifier_output_sha256,conclusion,computed_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
        .run('bad-dataset', 'f1', 'c1', 'cr-ref', 'cr-d2', 1, 1, 1, 1, 1, '4'.repeat(64), 'v3', '5'.repeat(64), '6'.repeat(64), 'EXACT_MATCH', TS), 'exact validation with different dataset artifact must fail');
    // Exact validation cannot lie about a different run configuration either.
    addEvent(x, 'result-config-event', 'CANDIDATE_RESULT_RECORDED', '9'.repeat(64));
    x.prepare(fullIns).run('cr-config', 'f1', 'c1', 's1', 'd1', 'r2', '3'.repeat(64), '9'.repeat(64), 'result-config-event', 'CPCV_PATH', '0'.repeat(64), '1'.repeat(64), H('a'), H('b'), H('c'), H('d'), H('e'), 'x', TS);
    expectReject(() => x.prepare(`INSERT INTO engine_validation(validation_id,family_id,candidate_id,reference_result_id,candidate_result_id,dataset_hash_equal,strategy_hash_equal,config_hash_equal,observation_protocol_hash_equal,execution_model_hash_equal,tolerance_schedule_hash,verifier_version,verifier_code_sha256,verifier_output_sha256,conclusion,computed_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
        .run('bad-config', 'f1', 'c1', 'cr-ref', 'cr-config', 1, 1, 1, 1, 1, '4'.repeat(64), 'v3', '5'.repeat(64), '6'.repeat(64), 'EXACT_MATCH', TS), 'exact validation with different run_config_hash must fail even if boolean claims equality');
    putArtifact(x, '8'.repeat(64));
    putArtifact(x, '9'.repeat(64));
    x.prepare(`INSERT INTO promotion_assessment(assessment_id,family_id,candidate_id,selection_event_id,engine_validation_id,behavioral_conformance_sha256,capital_invariant_passed,integrity_assessment_sha256,decision,human_approver,rationale,decided_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)`)
        .run('pa1', 'f1', 'c1', 'sel1', 'v1', '8'.repeat(64), 1, '9'.repeat(64), 'PROMOTE', 'human', 'passed', TS);
    expectReject(() => x.prepare(`INSERT INTO promotion_assessment(assessment_id,family_id,candidate_id,selection_event_id,engine_validation_id,capital_invariant_passed,decision,rationale,decided_at) VALUES(?,?,?,?,?,?,?,?,?)`)
        .run('bad-pa', 'f2', 'c2', 'sel1', 'v1', 1, 'PROMOTE', 'attack', TS), 'candidate B cannot reuse candidate A lineage');
    expectReject(() => x.prepare(`INSERT INTO family_lifecycle_event(lifecycle_id,family_id,seq,from_status,to_status,reason,occurred_at) VALUES(?,?,?,?,?,?,?)`).run('jump', 'f1', 2, 'OPEN', 'PROMOTED', 'jump', TS), 'OPEN to PROMOTED must fail');
    x.prepare(`INSERT INTO family_lifecycle_event(lifecycle_id,family_id,seq,from_status,to_status,reason,occurred_at) VALUES(?,?,?,?,?,?,?)`).run('lc2', 'f1', 2, 'OPEN', 'SELECTED', 'selected', TS);
    x.prepare(`INSERT INTO family_lifecycle_event(lifecycle_id,family_id,seq,from_status,to_status,reason,occurred_at) VALUES(?,?,?,?,?,?,?)`).run('lc3', 'f1', 3, 'SELECTED', 'FORWARD_SHADOW', 'shadow', TS);
    expectReject(() => x.prepare(`INSERT INTO family_lifecycle_event(lifecycle_id,family_id,seq,from_status,to_status,reason,occurred_at) VALUES(?,?,?,?,?,?,?)`).run('lc-bad-seq', 'f1', 5, 'FORWARD_SHADOW', 'WATCH', 'bad seq', TS), 'lifecycle seq gaps must fail');
    x.prepare(`INSERT INTO family_lifecycle_event(lifecycle_id,family_id,seq,from_status,to_status,assessment_id,reason,occurred_at) VALUES(?,?,?,?,?,?,?,?)`).run('lc4', 'f1', 4, 'FORWARD_SHADOW', 'PROMOTED', 'pa1', 'promoted', TS);
    const status = x.prepare(`SELECT current_status FROM v_family_current_status WHERE family_id='f1'`).get().current_status;
    assert(status === 'PROMOTED', 'lifecycle current status must be derived from events');
    x.close();
}
function testPreregistrationAttacks() {
    const db = setupDb();
    // Unrelated audit event cannot be reused as a plan registration witness.
    putArtifact(db, H('a'));
    putArtifact(db, H('b'));
    putArtifact(db, H('c'));
    putArtifact(db, H('d'));
    putArtifact(db, H('e'));
    putArtifact(db, H('f'));
    putArtifact(db, '0'.repeat(64));
    putArtifact(db, '1'.repeat(64));
    putArtifact(db, '2'.repeat(64));
    putArtifact(db, '3'.repeat(64));
    putArtifact(db, '4'.repeat(64));
    putArtifact(db, '5'.repeat(64));
    putArtifact(db, '6'.repeat(64));
    putArtifact(db, '7'.repeat(64));
    addEvent(db, 'unrelated', 'OTHER_EVENT', H('a'));
    const planSql = `INSERT INTO research_plan(plan_id,plan_hash,research_class,hypothesis,candidate_generation_hash,search_space_hash,selection_rule_hash,effective_trial_fn_hash,split_definition_hash,metric_definition_hash,cost_model_hash,data_universe_definition_hash,stopping_rule_hash,registration_event_id,registered_at,created_by) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;
    expectReject(() => db.prepare(planSql).run('bad-plan', H('a'), 'CONFIRMATORY', 'x', H('b'), H('c'), H('d'), H('e'), H('f'), '0'.repeat(64), '1'.repeat(64), '2'.repeat(64), '3'.repeat(64), 'unrelated', TS, 'selftest'), 'unrelated audit event cannot prove plan registration');
    // Pre-create a result audit event, then register the plan. Referencing that older event must fail.
    addEvent(db, 'too-early-result', 'CANDIDATE_RESULT_RECORDED', '4'.repeat(64));
    addEvent(db, 'late-plan-event', 'RESEARCH_PLAN_REGISTERED', '5'.repeat(64));
    db.prepare(planSql).run('late-plan', '5'.repeat(64), 'CONFIRMATORY', 'x', H('b'), H('c'), H('d'), H('e'), H('f'), '0'.repeat(64), '1'.repeat(64), '2'.repeat(64), '3'.repeat(64), 'late-plan-event', TS, 'selftest');
    db.prepare(`INSERT INTO experiment_family(family_id,family_hash,plan_id,title,hypothesis,generation_method,search_space_sha256,candidate_universe_sha256,created_at) VALUES(?,?,?,?,?,?,?,?,?)`).run('late-f', '6'.repeat(64), 'late-plan', 'late', 'x', 'grid', H('c'), '7'.repeat(64), TS);
    db.prepare(`INSERT INTO dataset_artifact(dataset_id,artifact_hash,name,source_kind,reproduction_tier,freeze_status,original_input_sha256,captured_at) VALUES(?,?,?,?,?,?,?,?)`).run('late-d', '8'.repeat(64), 'D', 'SYNTHETIC', 'R1_BYTE_REPRODUCIBLE', 'FROZEN', '7'.repeat(64), TS);
    db.prepare(`INSERT INTO engine_runtime(runtime_id,runtime_hash,engine_name,observation_protocol_hash,observation_adapter_hash,execution_model_hash,default_tolerance_schedule_hash,created_at) VALUES(?,?,?,?,?,?,?,?)`).run('late-r', '9'.repeat(64), 'LOCAL', '1'.repeat(64), '2'.repeat(64), '3'.repeat(64), '4'.repeat(64), TS);
    db.prepare(`INSERT INTO candidate_strategy(candidate_id,family_id,ordinal,strategy_code_sha256,parameters_sha256,provider,source_capture_method,created_at) VALUES(?,?,?,?,?,?,?,?)`).run('late-c', 'late-f', 0, H('d'), H('e'), 'LOCAL', 'local', TS);
    db.prepare(`INSERT INTO evaluation_split(split_id,family_id,split_hash,scheme_kind,definition_sha256,registered_at) VALUES(?,?,?,?,?,?)`).run('late-s', 'late-f', H('f'), 'HOLDOUT', H('f'), TS);
    const resultSql = `INSERT INTO candidate_result(result_id,family_id,candidate_id,split_id,dataset_id,runtime_id,run_config_hash,result_hash,record_event_id,result_role,metric_definition_hash,cost_model_hash,observations_sha256,fills_sha256,positions_sha256,equity_marks_sha256,periodic_returns_sha256,primary_metric_name,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;
    expectReject(() => db.prepare(resultSql).run('late-result', 'late-f', 'late-c', 'late-s', 'late-d', 'late-r', '2'.repeat(64), '4'.repeat(64), 'too-early-result', 'OUT_OF_SAMPLE', '0'.repeat(64), '1'.repeat(64), H('a'), H('b'), H('c'), H('d'), H('e'), 'x', TS), 'result audit event before plan registration must be rejected');
    db.close();
}
function testCanonical() {
    const a = { z: 2, a: { y: 3, x: 1 } }, b = { a: { x: 1, y: 3 }, z: 2 };
    assert(canonicalJson(a) === canonicalJson(b), 'canonical JSON stable across key order');
    assert(canonicalSha256(a) === canonicalSha256(b), 'canonical hash stable across key order');
    const one = normalizeToolsList([{ name: 'b', inputSchema: { z: 1, a: 2 } }, { name: 'a', inputSchema: {} }]);
    const two = normalizeToolsList([{ name: 'a', inputSchema: {} }, { name: 'b', inputSchema: { a: 2, z: 1 } }]);
    assert(one.hash === two.hash, 'capability hash stable across order');
    const diff = diffCapabilityManifests(one.tools, normalizeToolsList([...two.tools, { name: 'c', inputSchema: {} }]).tools);
    assert(diff.added.length === 1 && diff.added[0] === 'c', 'capability diff finds additions');
}
function baseEvents(fillPrice = 100, cashAfter = 899, equity = 1000, position = 1) {
    return [
        { kind: 'ORDER_SUBMITTED', ts: '2026-01-01T00:00:00Z', orderId: 'o', symbol: 'BTC', side: 'BUY', quantity: 1, orderType: 'MARKET' },
        { kind: 'ORDER_FILLED', ts: '2026-01-01T00:01:00Z', orderId: 'o', symbol: 'BTC', side: 'BUY', quantity: 1, price: fillPrice, feeQuote: 1 },
        { kind: 'MARK_PRICE', ts: '2026-01-01T00:02:00Z', symbol: 'BTC', price: 101, markConvention: 'close' },
        { kind: 'POSITION_SNAPSHOT', ts: '2026-01-01T00:02:00Z', symbol: 'BTC', quantity: position },
        { kind: 'CASH_SNAPSHOT', ts: '2026-01-01T00:02:00Z', currency: 'USD', amount: cashAfter },
        { kind: 'EQUITY_MARK', ts: '2026-01-01T00:02:00Z', equity, markConvention: 'close' },
    ];
}
const schedule = { scheduleId: 'strict', version: '3', timestampMode: 'EXACT', quantityTolerance: 0, priceToleranceTicks: 1, navToleranceBps: 1, cashTolerance: 0.01, positionTolerance: 0 };
function testVerifier() {
    const exact = verifyObservations({ reference: baseEvents(), candidate: baseEvents(), schedule, datasetHashEqual: true, strategyHashEqual: true, configHashEqual: true, observationProtocolHashEqual: true, executionModelHashEqual: true, initialCash: 1000, tickSizeBySymbol: { BTC: 0.01 } });
    assert(exact.conclusion === 'EXACT_MATCH' && exact.eligibleForIntegrityScoring, 'full-path exact match');
    const tolerated = verifyObservations({ reference: baseEvents(), candidate: baseEvents(100.001, 898.999, 999.999), schedule, datasetHashEqual: true, strategyHashEqual: true, configHashEqual: true, observationProtocolHashEqual: true, executionModelHashEqual: true, initialCash: 1000, tickSizeBySymbol: { BTC: 0.01 } });
    assert(tolerated.conclusion === 'MATCH_WITH_REGISTERED_NUMERIC_TOLERANCE' && tolerated.toleranceUses.length > 0, 'registered numeric tolerance is explicit');
    const badPath = verifyObservations({ reference: baseEvents(), candidate: baseEvents(100, 899, 1000, 0.5), schedule, datasetHashEqual: true, strategyHashEqual: true, configHashEqual: true, observationProtocolHashEqual: true, executionModelHashEqual: true, initialCash: 1000, tickSizeBySymbol: { BTC: 0.01 } });
    assert(badPath.conclusion === 'MATERIAL_EXECUTION_DIVERGENCE' && badPath.candidateSelfConformanceIssues.length > 0, 'wrong intermediate position cannot hide behind same final NAV');
    const wrongIdentity = verifyObservations({ reference: baseEvents(), candidate: baseEvents(), schedule, datasetHashEqual: true, strategyHashEqual: true, configHashEqual: true, observationProtocolHashEqual: false, executionModelHashEqual: true, initialCash: 1000 });
    assert(wrongIdentity.conclusion === 'NOT_COMPARABLE', 'observation protocol mismatch blocks comparison');
}
class FakeCaller {
    calls = [];
    async listTools() {
        return { tools: [
                { name: 'lona_list_strategies', inputSchema: { type: 'object', properties: { skip: { type: 'number' }, limit: { type: 'number' } } } },
                { name: 'lona_get_strategy', inputSchema: { type: 'object', properties: { id: { type: 'string' } } } },
                { name: 'lona_get_strategy_code', inputSchema: { type: 'object', properties: { id: { type: 'string' } } } },
                { name: 'lona_list_reports', inputSchema: { type: 'object', properties: { skip: { type: 'number' }, limit: { type: 'number' } } } },
                { name: 'lona_get_report', inputSchema: { type: 'object', properties: { id: { type: 'string' } } } },
                { name: 'lona_get_full_report', inputSchema: { type: 'object', properties: { id: { type: 'string' } } } },
                { name: 'lona_list_symbols', inputSchema: { type: 'object', properties: { skip: { type: 'number' }, limit: { type: 'number' }, is_global: { type: 'boolean' } } } },
                { name: 'lona_get_symbol', inputSchema: { type: 'object', properties: { id: { type: 'string' } } } },
                { name: 'lona_get_symbol_data', inputSchema: { type: 'object', properties: { id: { type: 'string' } } } },
            ] };
    }
    async callTool(name, args) {
        this.calls.push({ name, args });
        const skip = Number(args.skip ?? 0), limit = Number(args.limit ?? 2);
        if (name === 'lona_list_strategies') {
            const all = [{ id: 's1' }, { id: 's2' }];
            return { structuredContent: { strategies: all.slice(skip, skip + limit), total: all.length, hasNext: skip + limit < all.length } };
        }
        if (name === 'lona_get_strategy')
            return { structuredContent: { id: args.id, version: '1' } };
        if (name === 'lona_get_strategy_code')
            return { structuredContent: { code: `# ${args.id}\nclass S: pass` } };
        if (name === 'lona_list_reports') {
            const all = [{ id: 'r1', strategyId: 's1' }, { id: 'r2', strategyId: 's2' }];
            return { structuredContent: { reports: all.slice(skip, skip + limit), total: all.length, hasNext: skip + limit < all.length } };
        }
        if (name === 'lona_get_report')
            return { structuredContent: { id: args.id } };
        if (name === 'lona_get_full_report')
            return { structuredContent: { id: args.id, data_ids: [args.id === 'r1' ? 'custom1' : 'btc'], trades: [{ ts: '2026-01-01', qty: 0.1 }] } };
        if (name === 'lona_list_symbols') {
            const all = Boolean(args.is_global) ? [{ id: 'btc' }] : [{ id: 'custom1' }];
            return { structuredContent: { symbols: all.slice(skip, skip + limit), total: all.length, hasNext: false } };
        }
        if (name === 'lona_get_symbol')
            return { structuredContent: { id: args.id } };
        if (name === 'lona_get_symbol_data')
            return { structuredContent: { id: args.id, rows: [{ t: '2026-01-01', c: 1 }] } };
        throw new Error(`Unexpected tool ${name}`);
    }
}
async function testFreeze() {
    const dir = await mkdtemp(join(tmpdir(), 'zobiris-freeze-v3-'));
    try {
        const originalInputs = { custom1: { sha256: H('a'), relativePath: 'original-inputs/custom1.csv', byteLen: 123 } };
        const caller = new FakeCaller();
        const first = await freezeLona(caller, { bundleDir: dir, pageSize: 1, endpoint: 'https://example.invalid/mcp', originalInputs });
        assert(first.strategies === 2 && first.reports === 2 && first.symbols === 2, 'freeze captures core resources');
        assert(first.pagesFetched.lona_list_reports === 2, 'pagination exhausted');
        const r1 = first.reportTiers.find(x => x.reportId === 'r1'), r2 = first.reportTiers.find(x => x.reportId === 'r2');
        assert(r1.tier === 'R1_BYTE_REPRODUCIBLE' && r1.r1InputsPinned, 'exact original input mapping can award R1');
        assert(r2.tier === 'R2_CONFIG_REPRODUCIBLE_INPUTS_UNPINNED' && !r2.r1InputsPinned, 'unfrozen global report remains R2');
        const secondCaller = new FakeCaller();
        const second = await freezeLona(secondCaller, { bundleDir: dir, pageSize: 1, endpoint: 'https://example.invalid/mcp', originalInputs });
        assert(second.bundleHash === first.bundleHash, 'resume preserves bundle hash');
        assert(secondCaller.calls.length === 0, 'resume skips completed provider calls');
        const manifest = JSON.parse(await readFile(join(dir, 'MANIFEST.json'), 'utf8'));
        assert(manifest.captureSemantics.includes('not raw HTTP wire bytes'), 'manifest states SDK capture limitation');
    }
    finally {
        await rm(dir, { recursive: true, force: true });
    }
}
awaitedMigration = await readFile(resolve('migrations/001_research_provenance.sql'), 'utf8');
await testSql();
testPreregistrationAttacks();
testCanonical();
testVerifier();
await testFreeze();
console.log('PASS: Zobiris P0 v3 adversarial provenance self-test');
