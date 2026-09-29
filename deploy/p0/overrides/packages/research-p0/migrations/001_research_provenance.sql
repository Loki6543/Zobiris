PRAGMA foreign_keys = ON;

-- Zobiris P0 v3 research-provenance schema.
-- Design goals:
--   * provenance is part of the math;
--   * confirmatory claims are chain-ordered after a registered plan;
--   * family/candidate/split/result lineage cannot be mixed across families;
--   * primitive evidence is required for confirmatory/integrity-eligible claims;
--   * validation eligibility is computed by SQLite, never asserted by a runner;
--   * corrections are new rows; UPDATE/DELETE are blocked.

CREATE TABLE IF NOT EXISTS artifact_store (
  sha256 TEXT PRIMARY KEY
    CHECK(length(sha256)=64 AND lower(sha256)=sha256 AND sha256 NOT GLOB '*[^0-9a-f]*'),
  media_type TEXT NOT NULL,
  byte_len INTEGER NOT NULL CHECK(byte_len >= 0),
  storage_path TEXT NOT NULL,
  origin TEXT NOT NULL CHECK(origin IN (
    'original_input','provider_response','canonical_representation','computed','manual_capture','external_witness'
  )),
  created_at TEXT NOT NULL,
  created_by TEXT NOT NULL,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS audit_chain_event (
  sequence_no INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  payload_sha256 TEXT NOT NULL
    CHECK(length(payload_sha256)=64 AND lower(payload_sha256)=payload_sha256 AND payload_sha256 NOT GLOB '*[^0-9a-f]*'),
  previous_event_hash TEXT
    CHECK(previous_event_hash IS NULL OR (length(previous_event_hash)=64 AND lower(previous_event_hash)=previous_event_hash AND previous_event_hash NOT GLOB '*[^0-9a-f]*')),
  event_hash TEXT NOT NULL UNIQUE
    CHECK(length(event_hash)=64 AND lower(event_hash)=event_hash AND event_hash NOT GLOB '*[^0-9a-f]*'),
  occurred_at TEXT NOT NULL,
  external_witness_ref TEXT
);

CREATE TABLE IF NOT EXISTS capability_manifest (
  manifest_id TEXT PRIMARY KEY,
  provider TEXT NOT NULL,
  surface TEXT NOT NULL CHECK(surface IN ('CHATGPT_CONNECTOR','DIRECT_MCP','WEB_UI','OTHER')),
  endpoint TEXT,
  protocol_version TEXT,
  client_version TEXT,
  server_version TEXT,
  account_fingerprint TEXT,
  oauth_scope_set_sha256 TEXT
    CHECK(oauth_scope_set_sha256 IS NULL OR (length(oauth_scope_set_sha256)=64 AND lower(oauth_scope_set_sha256)=oauth_scope_set_sha256 AND oauth_scope_set_sha256 NOT GLOB '*[^0-9a-f]*')),
  tools_raw_sha256 TEXT NOT NULL REFERENCES artifact_store(sha256),
  tools_canonical_sha256 TEXT NOT NULL
    CHECK(length(tools_canonical_sha256)=64 AND lower(tools_canonical_sha256)=tools_canonical_sha256 AND tools_canonical_sha256 NOT GLOB '*[^0-9a-f]*'),
  previous_manifest_id TEXT REFERENCES capability_manifest(manifest_id),
  diff_sha256 TEXT REFERENCES artifact_store(sha256),
  observed_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS research_plan (
  plan_id TEXT PRIMARY KEY,
  plan_hash TEXT NOT NULL UNIQUE
    CHECK(length(plan_hash)=64 AND lower(plan_hash)=plan_hash AND plan_hash NOT GLOB '*[^0-9a-f]*'),
  research_class TEXT NOT NULL CHECK(research_class IN ('EXPLORATORY','CONFIRMATORY')),
  hypothesis TEXT NOT NULL,
  parent_family_id TEXT,
  candidate_generation_hash TEXT NOT NULL
    CHECK(length(candidate_generation_hash)=64 AND lower(candidate_generation_hash)=candidate_generation_hash AND candidate_generation_hash NOT GLOB '*[^0-9a-f]*'),
  search_space_hash TEXT NOT NULL
    CHECK(length(search_space_hash)=64 AND lower(search_space_hash)=search_space_hash AND search_space_hash NOT GLOB '*[^0-9a-f]*'),
  selection_rule_hash TEXT NOT NULL
    CHECK(length(selection_rule_hash)=64 AND lower(selection_rule_hash)=selection_rule_hash AND selection_rule_hash NOT GLOB '*[^0-9a-f]*'),
  effective_trial_fn_hash TEXT NOT NULL
    CHECK(length(effective_trial_fn_hash)=64 AND lower(effective_trial_fn_hash)=effective_trial_fn_hash AND effective_trial_fn_hash NOT GLOB '*[^0-9a-f]*'),
  split_definition_hash TEXT NOT NULL
    CHECK(length(split_definition_hash)=64 AND lower(split_definition_hash)=split_definition_hash AND split_definition_hash NOT GLOB '*[^0-9a-f]*'),
  metric_definition_hash TEXT NOT NULL
    CHECK(length(metric_definition_hash)=64 AND lower(metric_definition_hash)=metric_definition_hash AND metric_definition_hash NOT GLOB '*[^0-9a-f]*'),
  cost_model_hash TEXT NOT NULL
    CHECK(length(cost_model_hash)=64 AND lower(cost_model_hash)=cost_model_hash AND cost_model_hash NOT GLOB '*[^0-9a-f]*'),
  data_universe_definition_hash TEXT NOT NULL
    CHECK(length(data_universe_definition_hash)=64 AND lower(data_universe_definition_hash)=data_universe_definition_hash AND data_universe_definition_hash NOT GLOB '*[^0-9a-f]*'),
  stopping_rule_hash TEXT NOT NULL
    CHECK(length(stopping_rule_hash)=64 AND lower(stopping_rule_hash)=stopping_rule_hash AND stopping_rule_hash NOT GLOB '*[^0-9a-f]*'),
  hypothesis_generation_end_ts TEXT,
  confirmation_start_ts TEXT,
  registration_event_id TEXT NOT NULL UNIQUE REFERENCES audit_chain_event(event_id),
  registered_at TEXT NOT NULL,
  created_by TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS experiment_family (
  family_id TEXT PRIMARY KEY,
  family_hash TEXT NOT NULL UNIQUE
    CHECK(length(family_hash)=64 AND lower(family_hash)=family_hash AND family_hash NOT GLOB '*[^0-9a-f]*'),
  plan_id TEXT REFERENCES research_plan(plan_id),
  title TEXT NOT NULL,
  hypothesis TEXT NOT NULL,
  generation_method TEXT NOT NULL,
  search_space_sha256 TEXT REFERENCES artifact_store(sha256),
  candidate_universe_sha256 TEXT REFERENCES artifact_store(sha256),
  capability_manifest_id TEXT REFERENCES capability_manifest(manifest_id),
  created_at TEXT NOT NULL,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS dataset_artifact (
  dataset_id TEXT PRIMARY KEY,
  artifact_hash TEXT NOT NULL UNIQUE
    CHECK(length(artifact_hash)=64 AND lower(artifact_hash)=artifact_hash AND artifact_hash NOT GLOB '*[^0-9a-f]*'),
  name TEXT NOT NULL,
  provider TEXT,
  source_kind TEXT NOT NULL CHECK(source_kind IN ('LONA_GLOBAL','LONA_CUSTOM','LOCAL_OWNED','SYNTHETIC','OTHER')),
  reproduction_tier TEXT NOT NULL CHECK(reproduction_tier IN (
    'R1_BYTE_REPRODUCIBLE','R2_CONFIG_REPRODUCIBLE_INPUTS_UNPINNED','R3_CONTEXTUAL_ONLY'
  )),
  freeze_status TEXT NOT NULL CHECK(freeze_status IN ('FROZEN','SOURCE_DATA_NOT_FROZEN','RESTATED_SUSPECT','MISSING')),
  original_input_sha256 TEXT REFERENCES artifact_store(sha256),
  provider_response_sha256 TEXT REFERENCES artifact_store(sha256),
  canonical_representation_sha256 TEXT REFERENCES artifact_store(sha256),
  symbol TEXT,
  frequency TEXT,
  start_ts TEXT,
  end_ts TEXT,
  row_count INTEGER CHECK(row_count IS NULL OR row_count >= 0),
  capture_method TEXT,
  capability_manifest_id TEXT REFERENCES capability_manifest(manifest_id),
  captured_at TEXT NOT NULL,
  notes TEXT,
  CHECK(reproduction_tier <> 'R1_BYTE_REPRODUCIBLE' OR (freeze_status='FROZEN' AND original_input_sha256 IS NOT NULL))
);

CREATE TABLE IF NOT EXISTS engine_runtime (
  runtime_id TEXT PRIMARY KEY,
  runtime_hash TEXT NOT NULL UNIQUE
    CHECK(length(runtime_hash)=64 AND lower(runtime_hash)=runtime_hash AND runtime_hash NOT GLOB '*[^0-9a-f]*'),
  engine_name TEXT NOT NULL,
  engine_version TEXT,
  language_runtime TEXT,
  git_commit TEXT,
  dependency_lock_sha256 TEXT
    CHECK(dependency_lock_sha256 IS NULL OR (length(dependency_lock_sha256)=64 AND lower(dependency_lock_sha256)=dependency_lock_sha256 AND dependency_lock_sha256 NOT GLOB '*[^0-9a-f]*')),
  container_image_digest TEXT,
  os_arch TEXT,
  numerical_libraries_sha256 TEXT
    CHECK(numerical_libraries_sha256 IS NULL OR (length(numerical_libraries_sha256)=64 AND lower(numerical_libraries_sha256)=numerical_libraries_sha256 AND numerical_libraries_sha256 NOT GLOB '*[^0-9a-f]*')),
  observation_protocol_hash TEXT NOT NULL
    CHECK(length(observation_protocol_hash)=64 AND lower(observation_protocol_hash)=observation_protocol_hash AND observation_protocol_hash NOT GLOB '*[^0-9a-f]*'),
  observation_adapter_hash TEXT NOT NULL
    CHECK(length(observation_adapter_hash)=64 AND lower(observation_adapter_hash)=observation_adapter_hash AND observation_adapter_hash NOT GLOB '*[^0-9a-f]*'),
  execution_model_hash TEXT NOT NULL
    CHECK(length(execution_model_hash)=64 AND lower(execution_model_hash)=execution_model_hash AND execution_model_hash NOT GLOB '*[^0-9a-f]*'),
  default_tolerance_schedule_hash TEXT NOT NULL
    CHECK(length(default_tolerance_schedule_hash)=64 AND lower(default_tolerance_schedule_hash)=default_tolerance_schedule_hash AND default_tolerance_schedule_hash NOT GLOB '*[^0-9a-f]*'),
  created_at TEXT NOT NULL,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS candidate_strategy (
  candidate_id TEXT PRIMARY KEY,
  family_id TEXT NOT NULL REFERENCES experiment_family(family_id),
  ordinal INTEGER NOT NULL CHECK(ordinal >= 0),
  strategy_code_sha256 TEXT NOT NULL
    CHECK(length(strategy_code_sha256)=64 AND lower(strategy_code_sha256)=strategy_code_sha256 AND strategy_code_sha256 NOT GLOB '*[^0-9a-f]*'),
  strategy_source_sha256 TEXT REFERENCES artifact_store(sha256),
  parameters_sha256 TEXT NOT NULL REFERENCES artifact_store(sha256),
  behavioral_spec_sha256 TEXT REFERENCES artifact_store(sha256),
  provider TEXT NOT NULL,
  provider_strategy_id TEXT,
  provider_strategy_version_id TEXT,
  provider_report_id TEXT,
  source_capture_method TEXT NOT NULL,
  generation_model TEXT,
  behavioral_fingerprint TEXT,
  created_at TEXT NOT NULL,
  UNIQUE(family_id, ordinal),
  UNIQUE(candidate_id, family_id)
);

CREATE TABLE IF NOT EXISTS evaluation_split (
  split_id TEXT PRIMARY KEY,
  family_id TEXT NOT NULL REFERENCES experiment_family(family_id),
  split_hash TEXT NOT NULL
    CHECK(length(split_hash)=64 AND lower(split_hash)=split_hash AND split_hash NOT GLOB '*[^0-9a-f]*'),
  scheme_kind TEXT NOT NULL CHECK(scheme_kind IN ('SINGLE','HOLDOUT','WALK_FORWARD','CSCV','CPCV','FORWARD_SHADOW')),
  definition_sha256 TEXT NOT NULL REFERENCES artifact_store(sha256),
  partition_count INTEGER CHECK(partition_count IS NULL OR partition_count > 1),
  purge_bars INTEGER NOT NULL DEFAULT 0 CHECK(purge_bars >= 0),
  embargo_bars INTEGER NOT NULL DEFAULT 0 CHECK(embargo_bars >= 0),
  registration_event_id TEXT REFERENCES audit_chain_event(event_id),
  registered_at TEXT NOT NULL,
  UNIQUE(family_id, split_hash),
  UNIQUE(split_id, family_id),
  CHECK(split_hash=definition_sha256)
);

-- Primitive observations are root evidence. Summary metrics are versioned derivations.
CREATE TABLE IF NOT EXISTS candidate_result (
  result_id TEXT PRIMARY KEY,
  family_id TEXT NOT NULL,
  candidate_id TEXT NOT NULL,
  split_id TEXT NOT NULL,
  dataset_id TEXT NOT NULL REFERENCES dataset_artifact(dataset_id),
  runtime_id TEXT NOT NULL REFERENCES engine_runtime(runtime_id),
  run_config_hash TEXT NOT NULL
    CHECK(length(run_config_hash)=64 AND lower(run_config_hash)=run_config_hash AND run_config_hash NOT GLOB '*[^0-9a-f]*'),
  result_hash TEXT NOT NULL UNIQUE
    CHECK(length(result_hash)=64 AND lower(result_hash)=result_hash AND result_hash NOT GLOB '*[^0-9a-f]*'),
  record_event_id TEXT REFERENCES audit_chain_event(event_id),
  result_role TEXT NOT NULL CHECK(result_role IN ('IN_SAMPLE','OUT_OF_SAMPLE','CPCV_PATH','HOLDOUT','FORWARD_SHADOW','REFERENCE_ORACLE')),
  metric_definition_hash TEXT NOT NULL
    CHECK(length(metric_definition_hash)=64 AND lower(metric_definition_hash)=metric_definition_hash AND metric_definition_hash NOT GLOB '*[^0-9a-f]*'),
  cost_model_hash TEXT NOT NULL
    CHECK(length(cost_model_hash)=64 AND lower(cost_model_hash)=cost_model_hash AND cost_model_hash NOT GLOB '*[^0-9a-f]*'),
  observations_sha256 TEXT REFERENCES artifact_store(sha256),
  orders_sha256 TEXT REFERENCES artifact_store(sha256),
  fills_sha256 TEXT REFERENCES artifact_store(sha256),
  positions_sha256 TEXT REFERENCES artifact_store(sha256),
  equity_marks_sha256 TEXT REFERENCES artifact_store(sha256),
  periodic_returns_sha256 TEXT REFERENCES artifact_store(sha256),
  raw_report_sha256 TEXT REFERENCES artifact_store(sha256),
  primary_metric_name TEXT NOT NULL,
  primary_metric_value REAL,
  n_observations INTEGER CHECK(n_observations IS NULL OR n_observations >= 0),
  mean_return REAL,
  stddev_return REAL,
  skew REAL,
  kurtosis REAL,
  sharpe REAL,
  max_drawdown_pct REAL,
  cagr_pct REAL,
  turnover REAL,
  first_fill_ts TEXT,
  max_exposure_pct REAL,
  avg_exposure_pct REAL,
  time_in_market_pct REAL,
  primitive_complete INTEGER GENERATED ALWAYS AS (
    CASE WHEN observations_sha256 IS NOT NULL
           AND fills_sha256 IS NOT NULL
           AND positions_sha256 IS NOT NULL
           AND equity_marks_sha256 IS NOT NULL
           AND periodic_returns_sha256 IS NOT NULL
         THEN 1 ELSE 0 END
  ) STORED,
  created_at TEXT NOT NULL,
  FOREIGN KEY(candidate_id, family_id) REFERENCES candidate_strategy(candidate_id, family_id),
  FOREIGN KEY(split_id, family_id) REFERENCES evaluation_split(split_id, family_id),
  UNIQUE(candidate_id, split_id, result_role, metric_definition_hash, cost_model_hash),
  UNIQUE(result_id, candidate_id, family_id)
);

CREATE TABLE IF NOT EXISTS selection_event (
  selection_id TEXT PRIMARY KEY,
  family_id TEXT NOT NULL,
  selected_candidate_id TEXT NOT NULL,
  selected_split_id TEXT NOT NULL,
  selection_hash TEXT NOT NULL UNIQUE
    CHECK(length(selection_hash)=64 AND lower(selection_hash)=selection_hash AND selection_hash NOT GLOB '*[^0-9a-f]*'),
  record_event_id TEXT NOT NULL UNIQUE REFERENCES audit_chain_event(event_id),
  selection_rule_hash TEXT NOT NULL
    CHECK(length(selection_rule_hash)=64 AND lower(selection_rule_hash)=selection_rule_hash AND selection_rule_hash NOT GLOB '*[^0-9a-f]*'),
  effective_trial_fn_hash TEXT NOT NULL
    CHECK(length(effective_trial_fn_hash)=64 AND lower(effective_trial_fn_hash)=effective_trial_fn_hash AND effective_trial_fn_hash NOT GLOB '*[^0-9a-f]*'),
  candidate_universe_hash TEXT NOT NULL
    CHECK(length(candidate_universe_hash)=64 AND lower(candidate_universe_hash)=candidate_universe_hash AND candidate_universe_hash NOT GLOB '*[^0-9a-f]*'),
  split_definition_hash TEXT NOT NULL
    CHECK(length(split_definition_hash)=64 AND lower(split_definition_hash)=split_definition_hash AND split_definition_hash NOT GLOB '*[^0-9a-f]*'),
  metric_definition_hash TEXT NOT NULL
    CHECK(length(metric_definition_hash)=64 AND lower(metric_definition_hash)=metric_definition_hash AND metric_definition_hash NOT GLOB '*[^0-9a-f]*'),
  cost_model_hash TEXT NOT NULL
    CHECK(length(cost_model_hash)=64 AND lower(cost_model_hash)=cost_model_hash AND cost_model_hash NOT GLOB '*[^0-9a-f]*'),
  trial_count_raw INTEGER NOT NULL CHECK(trial_count_raw >= 1),
  effective_trial_count REAL NOT NULL CHECK(effective_trial_count >= 1 AND effective_trial_count <= trial_count_raw),
  experiment_hash TEXT NOT NULL UNIQUE
    CHECK(length(experiment_hash)=64 AND lower(experiment_hash)=experiment_hash AND experiment_hash NOT GLOB '*[^0-9a-f]*'),
  dsr_artifact_sha256 TEXT REFERENCES artifact_store(sha256),
  pbo_artifact_sha256 TEXT REFERENCES artifact_store(sha256),
  cpcv_artifact_sha256 TEXT REFERENCES artifact_store(sha256),
  selected_at TEXT NOT NULL,
  notes TEXT,
  FOREIGN KEY(selected_candidate_id, family_id) REFERENCES candidate_strategy(candidate_id, family_id),
  FOREIGN KEY(selected_split_id, family_id) REFERENCES evaluation_split(split_id, family_id),
  UNIQUE(selection_id, selected_candidate_id, family_id)
);

CREATE TABLE IF NOT EXISTS engine_validation (
  validation_id TEXT PRIMARY KEY,
  family_id TEXT NOT NULL,
  candidate_id TEXT NOT NULL,
  reference_result_id TEXT NOT NULL,
  candidate_result_id TEXT NOT NULL,
  dataset_hash_equal INTEGER NOT NULL CHECK(dataset_hash_equal IN (0,1)),
  strategy_hash_equal INTEGER NOT NULL CHECK(strategy_hash_equal IN (0,1)),
  config_hash_equal INTEGER NOT NULL CHECK(config_hash_equal IN (0,1)),
  observation_protocol_hash_equal INTEGER NOT NULL CHECK(observation_protocol_hash_equal IN (0,1)),
  execution_model_hash_equal INTEGER NOT NULL CHECK(execution_model_hash_equal IN (0,1)),
  tolerance_schedule_hash TEXT NOT NULL
    CHECK(length(tolerance_schedule_hash)=64 AND lower(tolerance_schedule_hash)=tolerance_schedule_hash AND tolerance_schedule_hash NOT GLOB '*[^0-9a-f]*'),
  verifier_version TEXT NOT NULL,
  verifier_code_sha256 TEXT NOT NULL
    CHECK(length(verifier_code_sha256)=64 AND lower(verifier_code_sha256)=verifier_code_sha256 AND verifier_code_sha256 NOT GLOB '*[^0-9a-f]*'),
  verifier_output_sha256 TEXT NOT NULL REFERENCES artifact_store(sha256),
  conclusion TEXT NOT NULL CHECK(conclusion IN (
    'EXACT_MATCH',
    'MATCH_WITH_REGISTERED_NUMERIC_TOLERANCE',
    'ORDER_DIVERGENCE',
    'PRICE_DIVERGENCE',
    'SIGNAL_DIVERGENCE',
    'POSITION_DIVERGENCE',
    'CASH_DIVERGENCE',
    'NAV_DIVERGENCE',
    'MATERIAL_EXECUTION_DIVERGENCE',
    'DATASET_NOT_REPRODUCIBLE',
    'NOT_COMPARABLE'
  )),
  numeric_tolerance_evidence_sha256 TEXT REFERENCES artifact_store(sha256),
  diff_summary_sha256 TEXT REFERENCES artifact_store(sha256),
  eligible_for_integrity_scoring INTEGER GENERATED ALWAYS AS (
    CASE WHEN conclusion IN ('EXACT_MATCH','MATCH_WITH_REGISTERED_NUMERIC_TOLERANCE')
              AND dataset_hash_equal=1
              AND strategy_hash_equal=1
              AND config_hash_equal=1
              AND observation_protocol_hash_equal=1
              AND execution_model_hash_equal=1
         THEN 1 ELSE 0 END
  ) STORED,
  supersedes_validation_id TEXT REFERENCES engine_validation(validation_id),
  computed_at TEXT NOT NULL,
  FOREIGN KEY(candidate_id, family_id) REFERENCES candidate_strategy(candidate_id, family_id),
  FOREIGN KEY(reference_result_id, candidate_id, family_id) REFERENCES candidate_result(result_id, candidate_id, family_id),
  FOREIGN KEY(candidate_result_id, candidate_id, family_id) REFERENCES candidate_result(result_id, candidate_id, family_id),
  UNIQUE(validation_id, candidate_id, family_id)
);

CREATE TABLE IF NOT EXISTS noise_calibration (
  calibration_id TEXT PRIMARY KEY,
  calibration_hash TEXT NOT NULL UNIQUE
    CHECK(length(calibration_hash)=64 AND lower(calibration_hash)=calibration_hash AND calibration_hash NOT GLOB '*[^0-9a-f]*'),
  universe_definition_hash TEXT NOT NULL
    CHECK(length(universe_definition_hash)=64 AND lower(universe_definition_hash)=universe_definition_hash AND universe_definition_hash NOT GLOB '*[^0-9a-f]*'),
  horizon_definition_hash TEXT NOT NULL
    CHECK(length(horizon_definition_hash)=64 AND lower(horizon_definition_hash)=horizon_definition_hash AND horizon_definition_hash NOT GLOB '*[^0-9a-f]*'),
  cost_model_hash TEXT NOT NULL
    CHECK(length(cost_model_hash)=64 AND lower(cost_model_hash)=cost_model_hash AND cost_model_hash NOT GLOB '*[^0-9a-f]*'),
  metric_definition_hash TEXT NOT NULL
    CHECK(length(metric_definition_hash)=64 AND lower(metric_definition_hash)=metric_definition_hash AND metric_definition_hash NOT GLOB '*[^0-9a-f]*'),
  raw_trial_count INTEGER NOT NULL CHECK(raw_trial_count >= 1),
  effective_trial_count REAL NOT NULL CHECK(effective_trial_count >= 1 AND effective_trial_count <= raw_trial_count),
  effective_trial_fn_hash TEXT NOT NULL
    CHECK(length(effective_trial_fn_hash)=64 AND lower(effective_trial_fn_hash)=effective_trial_fn_hash AND effective_trial_fn_hash NOT GLOB '*[^0-9a-f]*'),
  prng_algorithm TEXT NOT NULL,
  prng_seed TEXT NOT NULL,
  distribution_artifact_sha256 TEXT NOT NULL REFERENCES artifact_store(sha256),
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS promotion_assessment (
  assessment_id TEXT PRIMARY KEY,
  family_id TEXT NOT NULL,
  candidate_id TEXT NOT NULL,
  selection_event_id TEXT,
  engine_validation_id TEXT,
  noise_calibration_id TEXT REFERENCES noise_calibration(calibration_id),
  behavioral_conformance_sha256 TEXT REFERENCES artifact_store(sha256),
  capital_invariant_passed INTEGER NOT NULL CHECK(capital_invariant_passed IN (0,1)),
  integrity_assessment_sha256 TEXT REFERENCES artifact_store(sha256),
  shadow_start_ts TEXT,
  shadow_status TEXT,
  decision TEXT NOT NULL CHECK(decision IN ('PASS','WATCH','REJECT','PROMOTE','DEMOTE','REVALIDATE')),
  human_approver TEXT,
  rationale TEXT NOT NULL,
  supersedes_assessment_id TEXT REFERENCES promotion_assessment(assessment_id),
  decided_at TEXT NOT NULL,
  FOREIGN KEY(candidate_id, family_id) REFERENCES candidate_strategy(candidate_id, family_id),
  FOREIGN KEY(selection_event_id, candidate_id, family_id) REFERENCES selection_event(selection_id, selected_candidate_id, family_id),
  FOREIGN KEY(engine_validation_id, candidate_id, family_id) REFERENCES engine_validation(validation_id, candidate_id, family_id),
  UNIQUE(assessment_id, family_id)
);

CREATE TABLE IF NOT EXISTS family_lifecycle_event (
  lifecycle_id TEXT PRIMARY KEY,
  family_id TEXT NOT NULL REFERENCES experiment_family(family_id),
  seq INTEGER NOT NULL CHECK(seq >= 1),
  from_status TEXT NOT NULL CHECK(from_status IN ('NONE','OPEN','OBSERVATIONAL','SELECTED','FORWARD_SHADOW','PROMOTED','WATCH','REJECTED','DEMOTED','REVALIDATING','CLOSED')),
  to_status TEXT NOT NULL CHECK(to_status IN ('OPEN','OBSERVATIONAL','SELECTED','FORWARD_SHADOW','PROMOTED','WATCH','REJECTED','DEMOTED','REVALIDATING','CLOSED')),
  assessment_id TEXT,
  reason TEXT NOT NULL,
  occurred_at TEXT NOT NULL,
  FOREIGN KEY(assessment_id, family_id) REFERENCES promotion_assessment(assessment_id, family_id),
  UNIQUE(family_id, seq)
);

CREATE TABLE IF NOT EXISTS benchmark_definition (
  benchmark_id TEXT NOT NULL,
  version INTEGER NOT NULL CHECK(version >= 1),
  benchmark_hash TEXT NOT NULL UNIQUE
    CHECK(length(benchmark_hash)=64 AND lower(benchmark_hash)=benchmark_hash AND benchmark_hash NOT GLOB '*[^0-9a-f]*'),
  supersedes_benchmark_hash TEXT REFERENCES benchmark_definition(benchmark_hash),
  strategy_code_sha256 TEXT NOT NULL
    CHECK(length(strategy_code_sha256)=64 AND lower(strategy_code_sha256)=strategy_code_sha256 AND strategy_code_sha256 NOT GLOB '*[^0-9a-f]*'),
  dataset_id TEXT NOT NULL REFERENCES dataset_artifact(dataset_id),
  runtime_id TEXT NOT NULL REFERENCES engine_runtime(runtime_id),
  execution_model_hash TEXT NOT NULL
    CHECK(length(execution_model_hash)=64 AND lower(execution_model_hash)=execution_model_hash AND execution_model_hash NOT GLOB '*[^0-9a-f]*'),
  cost_model_hash TEXT NOT NULL
    CHECK(length(cost_model_hash)=64 AND lower(cost_model_hash)=cost_model_hash AND cost_model_hash NOT GLOB '*[^0-9a-f]*'),
  expected_result_sha256 TEXT NOT NULL REFERENCES artifact_store(sha256),
  capital_invariant_passed INTEGER NOT NULL CHECK(capital_invariant_passed IN (0,1)),
  status TEXT NOT NULL CHECK(status IN ('CANDIDATE','REGISTERED','SUPERSEDED','REJECTED')),
  registered_at TEXT NOT NULL,
  PRIMARY KEY(benchmark_id, version),
  CHECK(status <> 'REGISTERED' OR capital_invariant_passed=1)
);

CREATE TABLE IF NOT EXISTS benchmark_recompute (
  recompute_id TEXT PRIMARY KEY,
  benchmark_id TEXT NOT NULL,
  benchmark_version INTEGER NOT NULL,
  runtime_id TEXT NOT NULL REFERENCES engine_runtime(runtime_id),
  actual_result_sha256 TEXT NOT NULL REFERENCES artifact_store(sha256),
  same_container_digest INTEGER NOT NULL CHECK(same_container_digest IN (0,1)),
  tolerance_schedule_hash TEXT NOT NULL
    CHECK(length(tolerance_schedule_hash)=64 AND lower(tolerance_schedule_hash)=tolerance_schedule_hash AND tolerance_schedule_hash NOT GLOB '*[^0-9a-f]*'),
  conclusion TEXT NOT NULL CHECK(conclusion IN ('BIT_EXACT','WITHIN_REGISTERED_TOLERANCE','DRIFT','NOT_COMPARABLE')),
  diff_sha256 TEXT REFERENCES artifact_store(sha256),
  computed_at TEXT NOT NULL,
  FOREIGN KEY(benchmark_id, benchmark_version) REFERENCES benchmark_definition(benchmark_id, version)
);

-- ----- Integrity triggers -----

CREATE TRIGGER IF NOT EXISTS audit_chain_contiguous_insert
BEFORE INSERT ON audit_chain_event
BEGIN
  SELECT CASE
    WHEN (SELECT COUNT(*) FROM audit_chain_event)=0 AND NEW.previous_event_hash IS NOT NULL
      THEN RAISE(ABORT, 'audit chain: genesis previous_event_hash must be NULL')
    WHEN (SELECT COUNT(*) FROM audit_chain_event)>0 AND NEW.previous_event_hash IS NULL
      THEN RAISE(ABORT, 'audit chain: previous_event_hash required')
    WHEN (SELECT COUNT(*) FROM audit_chain_event)>0
      AND NEW.previous_event_hash <> (SELECT event_hash FROM audit_chain_event ORDER BY sequence_no DESC LIMIT 1)
      THEN RAISE(ABORT, 'audit chain: previous_event_hash does not match current head')
  END;
END;

CREATE TRIGGER IF NOT EXISTS research_plan_registration_event_check
BEFORE INSERT ON research_plan
BEGIN
  SELECT CASE WHEN NOT EXISTS (
    SELECT 1 FROM audit_chain_event ace
    WHERE ace.event_id=NEW.registration_event_id
      AND ace.event_type='RESEARCH_PLAN_REGISTERED'
      AND ace.payload_sha256=NEW.plan_hash
  ) THEN RAISE(ABORT, 'research plan: registration event/type/payload mismatch') END;
  SELECT CASE WHEN NEW.parent_family_id IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM experiment_family WHERE family_id=NEW.parent_family_id)
    THEN RAISE(ABORT, 'research plan: parent_family_id does not exist') END;

  SELECT CASE WHEN NEW.research_class='CONFIRMATORY'
    AND NEW.parent_family_id IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM experiment_family pf
      JOIN research_plan pp ON pp.plan_id=pf.plan_id
      WHERE pf.family_id=NEW.parent_family_id
        AND pp.hypothesis_generation_end_ts IS NOT NULL
        AND (NEW.confirmation_start_ts IS NULL OR NEW.confirmation_start_ts <= pp.hypothesis_generation_end_ts)
    )
    THEN RAISE(ABORT, 'confirmatory plan overlaps parent hypothesis-generation period') END;
END;

CREATE TRIGGER IF NOT EXISTS experiment_family_plan_alignment_check
BEFORE INSERT ON experiment_family
WHEN NEW.plan_id IS NOT NULL
BEGIN
  SELECT CASE WHEN NOT EXISTS (
    SELECT 1 FROM research_plan rp
    WHERE rp.plan_id=NEW.plan_id
      AND rp.hypothesis=NEW.hypothesis
      AND (NEW.search_space_sha256 IS NULL OR NEW.search_space_sha256=rp.search_space_hash)
  ) THEN RAISE(ABORT, 'experiment family does not align with registered plan hypothesis/search space') END;
END;

CREATE TRIGGER IF NOT EXISTS candidate_result_lineage_check
BEFORE INSERT ON candidate_result
BEGIN
  SELECT CASE WHEN EXISTS (
    SELECT 1 FROM experiment_family ef
    JOIN research_plan rp ON rp.plan_id=ef.plan_id
    WHERE ef.family_id=NEW.family_id AND rp.research_class='CONFIRMATORY'
  ) AND (
    NEW.record_event_id IS NULL OR
    NEW.observations_sha256 IS NULL OR NEW.fills_sha256 IS NULL OR NEW.positions_sha256 IS NULL OR
    NEW.equity_marks_sha256 IS NULL OR NEW.periodic_returns_sha256 IS NULL
  ) THEN RAISE(ABORT, 'confirmatory result requires chain event and complete primitive evidence') END;

  SELECT CASE WHEN EXISTS (
    SELECT 1 FROM experiment_family ef
    JOIN research_plan rp ON rp.plan_id=ef.plan_id
    JOIN dataset_artifact da ON da.dataset_id=NEW.dataset_id
    WHERE ef.family_id=NEW.family_id AND rp.research_class='CONFIRMATORY'
      AND da.reproduction_tier <> 'R1_BYTE_REPRODUCIBLE'
  ) THEN RAISE(ABORT, 'confirmatory result requires R1 byte-reproducible dataset') END;

  SELECT CASE WHEN NEW.record_event_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM audit_chain_event ace
    WHERE ace.event_id=NEW.record_event_id
      AND ace.event_type='CANDIDATE_RESULT_RECORDED'
      AND ace.payload_sha256=NEW.result_hash
  ) THEN RAISE(ABORT, 'candidate result: audit event/type/payload mismatch') END;

  SELECT CASE WHEN EXISTS (
    SELECT 1
    FROM experiment_family ef
    JOIN research_plan rp ON rp.plan_id=ef.plan_id
    JOIN audit_chain_event plan_ev ON plan_ev.event_id=rp.registration_event_id
    JOIN audit_chain_event result_ev ON result_ev.event_id=NEW.record_event_id
    WHERE ef.family_id=NEW.family_id AND rp.research_class='CONFIRMATORY'
      AND result_ev.sequence_no <= plan_ev.sequence_no
  ) THEN RAISE(ABORT, 'confirmatory result predates or equals plan registration in audit chain') END;
END;

CREATE TRIGGER IF NOT EXISTS selection_event_integrity_check
BEFORE INSERT ON selection_event
BEGIN
  SELECT CASE WHEN NOT EXISTS (
    SELECT 1 FROM audit_chain_event ace
    WHERE ace.event_id=NEW.record_event_id
      AND ace.event_type='SELECTION_RECORDED'
      AND ace.payload_sha256=NEW.selection_hash
  ) THEN RAISE(ABORT, 'selection: audit event/type/payload mismatch') END;

  SELECT CASE WHEN NEW.trial_count_raw <> (SELECT COUNT(*) FROM candidate_strategy cs WHERE cs.family_id=NEW.family_id)
    THEN RAISE(ABORT, 'selection: trial_count_raw must equal stored candidate universe count') END;

  SELECT CASE WHEN NOT EXISTS (
    SELECT 1 FROM candidate_result cr
    WHERE cr.family_id=NEW.family_id
      AND cr.candidate_id=NEW.selected_candidate_id
      AND cr.split_id=NEW.selected_split_id
      AND cr.metric_definition_hash=NEW.metric_definition_hash
      AND cr.cost_model_hash=NEW.cost_model_hash
  ) THEN RAISE(ABORT, 'selection: selected candidate has no matching result under selected split/metric/cost') END;

  SELECT CASE WHEN EXISTS (
    SELECT 1 FROM experiment_family ef
    JOIN research_plan rp ON rp.plan_id=ef.plan_id
    WHERE ef.family_id=NEW.family_id AND rp.research_class='CONFIRMATORY'
      AND EXISTS (
        SELECT 1 FROM candidate_strategy cs
        WHERE cs.family_id=NEW.family_id
          AND NOT EXISTS (
            SELECT 1 FROM candidate_result cr
            WHERE cr.family_id=NEW.family_id
              AND cr.candidate_id=cs.candidate_id
              AND cr.split_id=NEW.selected_split_id
              AND cr.metric_definition_hash=NEW.metric_definition_hash
              AND cr.cost_model_hash=NEW.cost_model_hash
              AND cr.primitive_complete=1
          )
      )
  ) THEN RAISE(ABORT, 'confirmatory selection requires primitive-complete matching result for every candidate') END;

  SELECT CASE WHEN NEW.dsr_artifact_sha256 IS NOT NULL AND EXISTS (
    SELECT 1 FROM candidate_strategy cs
    LEFT JOIN candidate_result cr
      ON cr.family_id=cs.family_id AND cr.candidate_id=cs.candidate_id
      AND cr.split_id=NEW.selected_split_id
      AND cr.metric_definition_hash=NEW.metric_definition_hash
      AND cr.cost_model_hash=NEW.cost_model_hash
    WHERE cs.family_id=NEW.family_id
      AND (cr.result_id IS NULL OR cr.sharpe IS NULL OR cr.skew IS NULL OR cr.kurtosis IS NULL OR cr.n_observations IS NULL)
  ) THEN RAISE(ABORT, 'DSR artifact requires Sharpe/skew/kurtosis/observation count for every candidate') END;

  SELECT CASE WHEN EXISTS (
    SELECT 1
    FROM experiment_family ef
    JOIN research_plan rp ON rp.plan_id=ef.plan_id
    JOIN audit_chain_event plan_ev ON plan_ev.event_id=rp.registration_event_id
    WHERE ef.family_id=NEW.family_id AND rp.research_class='CONFIRMATORY'
      AND (
        NEW.selection_rule_hash <> rp.selection_rule_hash OR
        NEW.effective_trial_fn_hash <> rp.effective_trial_fn_hash OR
        NEW.split_definition_hash <> rp.split_definition_hash OR
        NEW.metric_definition_hash <> rp.metric_definition_hash OR
        NEW.cost_model_hash <> rp.cost_model_hash OR
        NOT EXISTS (
          SELECT 1 FROM evaluation_split es
          WHERE es.split_id=NEW.selected_split_id
            AND es.family_id=NEW.family_id
            AND es.split_hash=rp.split_definition_hash
        ) OR
        ef.candidate_universe_sha256 IS NULL OR
        NEW.candidate_universe_hash <> ef.candidate_universe_sha256 OR
        EXISTS (
          SELECT 1 FROM candidate_result cr
          LEFT JOIN audit_chain_event result_ev ON result_ev.event_id=cr.record_event_id
          WHERE cr.family_id=NEW.family_id
            AND (result_ev.sequence_no IS NULL OR result_ev.sequence_no <= plan_ev.sequence_no)
        )
      )
  ) THEN RAISE(ABORT, 'confirmatory selection violates pre-registered plan or chain ordering') END;
END;

CREATE TRIGGER IF NOT EXISTS engine_validation_eligible_identity_check
BEFORE INSERT ON engine_validation
WHEN NEW.conclusion IN ('EXACT_MATCH','MATCH_WITH_REGISTERED_NUMERIC_TOLERANCE')
BEGIN
  SELECT CASE WHEN NEW.dataset_hash_equal<>1 OR NEW.strategy_hash_equal<>1 OR NEW.config_hash_equal<>1
                     OR NEW.observation_protocol_hash_equal<>1 OR NEW.execution_model_hash_equal<>1
    THEN RAISE(ABORT, 'eligible validation requires exact identity hashes/protocol/execution model') END;

  SELECT CASE WHEN NEW.conclusion='MATCH_WITH_REGISTERED_NUMERIC_TOLERANCE'
                   AND NEW.numeric_tolerance_evidence_sha256 IS NULL
    THEN RAISE(ABORT, 'tolerance match requires explicit numeric-tolerance evidence artifact') END;

  SELECT CASE WHEN EXISTS (
    SELECT 1
    FROM candidate_result rr
    JOIN candidate_result cr ON cr.result_id=NEW.candidate_result_id
    JOIN dataset_artifact rd ON rd.dataset_id=rr.dataset_id
    JOIN dataset_artifact cd ON cd.dataset_id=cr.dataset_id
    JOIN engine_runtime re ON re.runtime_id=rr.runtime_id
    JOIN engine_runtime ce ON ce.runtime_id=cr.runtime_id
    WHERE rr.result_id=NEW.reference_result_id
      AND (rr.primitive_complete<>1 OR cr.primitive_complete<>1
           OR rd.artifact_hash<>cd.artifact_hash
           OR rr.run_config_hash<>cr.run_config_hash
           OR rr.metric_definition_hash<>cr.metric_definition_hash
           OR rr.cost_model_hash<>cr.cost_model_hash
           OR rr.split_id<>cr.split_id
           OR re.observation_protocol_hash<>ce.observation_protocol_hash
           OR re.execution_model_hash<>ce.execution_model_hash)
  ) THEN RAISE(ABORT, 'eligible validation requires primitive-complete results and exact dataset/protocol/execution identities') END;
END;

CREATE TRIGGER IF NOT EXISTS promotion_assessment_promote_gate
BEFORE INSERT ON promotion_assessment
WHEN NEW.decision='PROMOTE'
BEGIN
  SELECT CASE WHEN NEW.selection_event_id IS NULL OR NEW.engine_validation_id IS NULL
                     OR NEW.behavioral_conformance_sha256 IS NULL
                     OR NEW.integrity_assessment_sha256 IS NULL
                     OR NEW.capital_invariant_passed<>1
                     OR NEW.human_approver IS NULL
    THEN RAISE(ABORT, 'promotion requires selection, eligible validation, behavioral/integrity evidence, capital invariant, and human approval') END;

  SELECT CASE WHEN NOT EXISTS (
    SELECT 1
    FROM experiment_family ef
    JOIN research_plan rp ON rp.plan_id=ef.plan_id
    JOIN engine_validation ev ON ev.validation_id=NEW.engine_validation_id
    WHERE ef.family_id=NEW.family_id
      AND rp.research_class='CONFIRMATORY'
      AND ev.eligible_for_integrity_scoring=1
  ) THEN RAISE(ABORT, 'promotion requires confirmatory family and integrity-eligible validation') END;
END;

CREATE TRIGGER IF NOT EXISTS family_lifecycle_sequence_check
BEFORE INSERT ON family_lifecycle_event
BEGIN
  SELECT CASE WHEN NEW.seq <> COALESCE((SELECT MAX(seq)+1 FROM family_lifecycle_event WHERE family_id=NEW.family_id),1)
    THEN RAISE(ABORT, 'lifecycle seq must be previous max + 1') END;

  SELECT CASE WHEN NEW.seq=1 AND NOT (NEW.from_status='NONE' AND NEW.to_status='OPEN')
    THEN RAISE(ABORT, 'first lifecycle event must be NONE -> OPEN') END;

  SELECT CASE WHEN NEW.seq>1 AND NEW.from_status <> (
    SELECT to_status FROM family_lifecycle_event WHERE family_id=NEW.family_id ORDER BY seq DESC LIMIT 1
  ) THEN RAISE(ABORT, 'lifecycle from_status must equal current status') END;

  SELECT CASE WHEN NOT (
       (NEW.from_status='NONE' AND NEW.to_status='OPEN')
    OR (NEW.from_status='OPEN' AND NEW.to_status IN ('OBSERVATIONAL','SELECTED','REJECTED','CLOSED'))
    OR (NEW.from_status='OBSERVATIONAL' AND NEW.to_status IN ('SELECTED','REJECTED','CLOSED'))
    OR (NEW.from_status='SELECTED' AND NEW.to_status IN ('FORWARD_SHADOW','WATCH','REJECTED','REVALIDATING'))
    OR (NEW.from_status='FORWARD_SHADOW' AND NEW.to_status IN ('PROMOTED','WATCH','REJECTED','REVALIDATING'))
    OR (NEW.from_status='PROMOTED' AND NEW.to_status IN ('WATCH','DEMOTED','REVALIDATING'))
    OR (NEW.from_status='WATCH' AND NEW.to_status IN ('FORWARD_SHADOW','PROMOTED','REJECTED','DEMOTED','REVALIDATING','CLOSED'))
    OR (NEW.from_status='DEMOTED' AND NEW.to_status IN ('REVALIDATING','CLOSED'))
    OR (NEW.from_status='REVALIDATING' AND NEW.to_status IN ('FORWARD_SHADOW','PROMOTED','WATCH','REJECTED','CLOSED'))
    OR (NEW.from_status='REJECTED' AND NEW.to_status IN ('REVALIDATING','CLOSED'))
  ) THEN RAISE(ABORT, 'illegal lifecycle transition') END;

  SELECT CASE WHEN NEW.to_status='PROMOTED' AND NOT EXISTS (
    SELECT 1 FROM promotion_assessment pa
    WHERE pa.assessment_id=NEW.assessment_id AND pa.family_id=NEW.family_id AND pa.decision='PROMOTE'
  ) THEN RAISE(ABORT, 'PROMOTED lifecycle transition requires PROMOTE assessment') END;

  SELECT CASE WHEN NEW.to_status='DEMOTED' AND NOT EXISTS (
    SELECT 1 FROM promotion_assessment pa
    WHERE pa.assessment_id=NEW.assessment_id AND pa.family_id=NEW.family_id AND pa.decision='DEMOTE'
  ) THEN RAISE(ABORT, 'DEMOTED lifecycle transition requires DEMOTE assessment') END;
END;

CREATE TRIGGER IF NOT EXISTS experiment_family_open_lifecycle
AFTER INSERT ON experiment_family
BEGIN
  INSERT INTO family_lifecycle_event(lifecycle_id,family_id,seq,from_status,to_status,assessment_id,reason,occurred_at)
  VALUES('open:' || NEW.family_id, NEW.family_id, 1, 'NONE', 'OPEN', NULL, 'family created', NEW.created_at);
END;

-- ----- Views -----

CREATE VIEW IF NOT EXISTS v_family_current_status AS
SELECT ef.family_id,
       COALESCE((SELECT fle.to_status FROM family_lifecycle_event fle WHERE fle.family_id=ef.family_id ORDER BY fle.seq DESC LIMIT 1),'OPEN') AS current_status
FROM experiment_family ef;

CREATE VIEW IF NOT EXISTS v_confirmatory_preregistration AS
SELECT rp.plan_id,
       rp.plan_hash,
       rp.research_class,
       plan_ev.sequence_no AS plan_sequence,
       CASE WHEN rp.research_class='CONFIRMATORY'
                  AND NOT EXISTS (
                    SELECT 1 FROM experiment_family ef
                    JOIN candidate_result cr ON cr.family_id=ef.family_id
                    LEFT JOIN audit_chain_event re ON re.event_id=cr.record_event_id
                    WHERE ef.plan_id=rp.plan_id AND (re.sequence_no IS NULL OR re.sequence_no <= plan_ev.sequence_no)
                  )
            THEN 1 ELSE 0 END AS preregistration_proven
FROM research_plan rp
JOIN audit_chain_event plan_ev ON plan_ev.event_id=rp.registration_event_id;

CREATE VIEW IF NOT EXISTS v_pbo_matrix AS
SELECT cr.family_id, cr.candidate_id, cr.split_id, cr.result_role,
       cr.primary_metric_name, cr.primary_metric_value,
       cr.metric_definition_hash, cr.cost_model_hash,
       cr.skew, cr.kurtosis, cr.sharpe, cr.n_observations
FROM candidate_result cr
WHERE cr.result_role IN ('IN_SAMPLE','OUT_OF_SAMPLE','CPCV_PATH');

CREATE VIEW IF NOT EXISTS v_family_provenance_bundle AS
SELECT ef.family_id,
       ef.family_hash,
       fcs.current_status,
       rp.plan_hash,
       rp.research_class,
       cm.tools_canonical_sha256 AS capability_manifest_hash,
       COUNT(DISTINCT cs.candidate_id) AS candidate_count,
       COUNT(DISTINCT cr.result_id) AS result_count,
       COUNT(DISTINCT cr.dataset_id) AS dataset_count
FROM experiment_family ef
LEFT JOIN v_family_current_status fcs ON fcs.family_id=ef.family_id
LEFT JOIN research_plan rp ON rp.plan_id=ef.plan_id
LEFT JOIN capability_manifest cm ON cm.manifest_id=ef.capability_manifest_id
LEFT JOIN candidate_strategy cs ON cs.family_id=ef.family_id
LEFT JOIN candidate_result cr ON cr.family_id=ef.family_id
GROUP BY ef.family_id, ef.family_hash, fcs.current_status, rp.plan_hash, rp.research_class, cm.tools_canonical_sha256;

-- ----- Indexes -----
CREATE INDEX IF NOT EXISTS idx_candidate_family ON candidate_strategy(family_id);
CREATE INDEX IF NOT EXISTS idx_result_family_candidate ON candidate_result(family_id,candidate_id);
CREATE INDEX IF NOT EXISTS idx_result_split ON candidate_result(split_id,family_id);
CREATE INDEX IF NOT EXISTS idx_candidate_provider_report ON candidate_strategy(provider_report_id);
CREATE INDEX IF NOT EXISTS idx_dataset_artifact_hash ON dataset_artifact(artifact_hash);
CREATE INDEX IF NOT EXISTS idx_family_cap_manifest ON experiment_family(capability_manifest_id);
CREATE INDEX IF NOT EXISTS idx_validation_candidate ON engine_validation(candidate_id,family_id,computed_at);
CREATE INDEX IF NOT EXISTS idx_promotion_family ON promotion_assessment(family_id,decided_at);
CREATE INDEX IF NOT EXISTS idx_lifecycle_family_seq ON family_lifecycle_event(family_id,seq);

-- ----- Append-only mutation guards -----
-- Privileged DB owners can alter SQLite schema. These triggers prevent accidental
-- application-level mutation; audit-chain anchoring/external witness provides tamper evidence.

CREATE TRIGGER IF NOT EXISTS artifact_store_no_update BEFORE UPDATE ON artifact_store BEGIN SELECT RAISE(ABORT,'append-only: artifact_store UPDATE forbidden'); END;
CREATE TRIGGER IF NOT EXISTS artifact_store_no_delete BEFORE DELETE ON artifact_store BEGIN SELECT RAISE(ABORT,'append-only: artifact_store DELETE forbidden'); END;
CREATE TRIGGER IF NOT EXISTS audit_chain_event_no_update BEFORE UPDATE ON audit_chain_event BEGIN SELECT RAISE(ABORT,'append-only: audit_chain_event UPDATE forbidden'); END;
CREATE TRIGGER IF NOT EXISTS audit_chain_event_no_delete BEFORE DELETE ON audit_chain_event BEGIN SELECT RAISE(ABORT,'append-only: audit_chain_event DELETE forbidden'); END;
CREATE TRIGGER IF NOT EXISTS capability_manifest_no_update BEFORE UPDATE ON capability_manifest BEGIN SELECT RAISE(ABORT,'append-only: capability_manifest UPDATE forbidden'); END;
CREATE TRIGGER IF NOT EXISTS capability_manifest_no_delete BEFORE DELETE ON capability_manifest BEGIN SELECT RAISE(ABORT,'append-only: capability_manifest DELETE forbidden'); END;
CREATE TRIGGER IF NOT EXISTS research_plan_no_update BEFORE UPDATE ON research_plan BEGIN SELECT RAISE(ABORT,'append-only: research_plan UPDATE forbidden'); END;
CREATE TRIGGER IF NOT EXISTS research_plan_no_delete BEFORE DELETE ON research_plan BEGIN SELECT RAISE(ABORT,'append-only: research_plan DELETE forbidden'); END;
CREATE TRIGGER IF NOT EXISTS experiment_family_no_update BEFORE UPDATE ON experiment_family BEGIN SELECT RAISE(ABORT,'append-only: experiment_family UPDATE forbidden'); END;
CREATE TRIGGER IF NOT EXISTS experiment_family_no_delete BEFORE DELETE ON experiment_family BEGIN SELECT RAISE(ABORT,'append-only: experiment_family DELETE forbidden'); END;
CREATE TRIGGER IF NOT EXISTS dataset_artifact_no_update BEFORE UPDATE ON dataset_artifact BEGIN SELECT RAISE(ABORT,'append-only: dataset_artifact UPDATE forbidden'); END;
CREATE TRIGGER IF NOT EXISTS dataset_artifact_no_delete BEFORE DELETE ON dataset_artifact BEGIN SELECT RAISE(ABORT,'append-only: dataset_artifact DELETE forbidden'); END;
CREATE TRIGGER IF NOT EXISTS engine_runtime_no_update BEFORE UPDATE ON engine_runtime BEGIN SELECT RAISE(ABORT,'append-only: engine_runtime UPDATE forbidden'); END;
CREATE TRIGGER IF NOT EXISTS engine_runtime_no_delete BEFORE DELETE ON engine_runtime BEGIN SELECT RAISE(ABORT,'append-only: engine_runtime DELETE forbidden'); END;
CREATE TRIGGER IF NOT EXISTS candidate_strategy_no_update BEFORE UPDATE ON candidate_strategy BEGIN SELECT RAISE(ABORT,'append-only: candidate_strategy UPDATE forbidden'); END;
CREATE TRIGGER IF NOT EXISTS candidate_strategy_no_delete BEFORE DELETE ON candidate_strategy BEGIN SELECT RAISE(ABORT,'append-only: candidate_strategy DELETE forbidden'); END;
CREATE TRIGGER IF NOT EXISTS evaluation_split_no_update BEFORE UPDATE ON evaluation_split BEGIN SELECT RAISE(ABORT,'append-only: evaluation_split UPDATE forbidden'); END;
CREATE TRIGGER IF NOT EXISTS evaluation_split_no_delete BEFORE DELETE ON evaluation_split BEGIN SELECT RAISE(ABORT,'append-only: evaluation_split DELETE forbidden'); END;
CREATE TRIGGER IF NOT EXISTS candidate_result_no_update BEFORE UPDATE ON candidate_result BEGIN SELECT RAISE(ABORT,'append-only: candidate_result UPDATE forbidden'); END;
CREATE TRIGGER IF NOT EXISTS candidate_result_no_delete BEFORE DELETE ON candidate_result BEGIN SELECT RAISE(ABORT,'append-only: candidate_result DELETE forbidden'); END;
CREATE TRIGGER IF NOT EXISTS selection_event_no_update BEFORE UPDATE ON selection_event BEGIN SELECT RAISE(ABORT,'append-only: selection_event UPDATE forbidden'); END;
CREATE TRIGGER IF NOT EXISTS selection_event_no_delete BEFORE DELETE ON selection_event BEGIN SELECT RAISE(ABORT,'append-only: selection_event DELETE forbidden'); END;
CREATE TRIGGER IF NOT EXISTS engine_validation_no_update BEFORE UPDATE ON engine_validation BEGIN SELECT RAISE(ABORT,'append-only: engine_validation UPDATE forbidden'); END;
CREATE TRIGGER IF NOT EXISTS engine_validation_no_delete BEFORE DELETE ON engine_validation BEGIN SELECT RAISE(ABORT,'append-only: engine_validation DELETE forbidden'); END;
CREATE TRIGGER IF NOT EXISTS noise_calibration_no_update BEFORE UPDATE ON noise_calibration BEGIN SELECT RAISE(ABORT,'append-only: noise_calibration UPDATE forbidden'); END;
CREATE TRIGGER IF NOT EXISTS noise_calibration_no_delete BEFORE DELETE ON noise_calibration BEGIN SELECT RAISE(ABORT,'append-only: noise_calibration DELETE forbidden'); END;
CREATE TRIGGER IF NOT EXISTS promotion_assessment_no_update BEFORE UPDATE ON promotion_assessment BEGIN SELECT RAISE(ABORT,'append-only: promotion_assessment UPDATE forbidden'); END;
CREATE TRIGGER IF NOT EXISTS promotion_assessment_no_delete BEFORE DELETE ON promotion_assessment BEGIN SELECT RAISE(ABORT,'append-only: promotion_assessment DELETE forbidden'); END;
CREATE TRIGGER IF NOT EXISTS family_lifecycle_event_no_update BEFORE UPDATE ON family_lifecycle_event BEGIN SELECT RAISE(ABORT,'append-only: family_lifecycle_event UPDATE forbidden'); END;
CREATE TRIGGER IF NOT EXISTS family_lifecycle_event_no_delete BEFORE DELETE ON family_lifecycle_event BEGIN SELECT RAISE(ABORT,'append-only: family_lifecycle_event DELETE forbidden'); END;
CREATE TRIGGER IF NOT EXISTS benchmark_definition_no_update BEFORE UPDATE ON benchmark_definition BEGIN SELECT RAISE(ABORT,'append-only: benchmark_definition UPDATE forbidden'); END;
CREATE TRIGGER IF NOT EXISTS benchmark_definition_no_delete BEFORE DELETE ON benchmark_definition BEGIN SELECT RAISE(ABORT,'append-only: benchmark_definition DELETE forbidden'); END;
CREATE TRIGGER IF NOT EXISTS benchmark_recompute_no_update BEFORE UPDATE ON benchmark_recompute BEGIN SELECT RAISE(ABORT,'append-only: benchmark_recompute UPDATE forbidden'); END;
CREATE TRIGGER IF NOT EXISTS benchmark_recompute_no_delete BEFORE DELETE ON benchmark_recompute BEGIN SELECT RAISE(ABORT,'append-only: benchmark_recompute DELETE forbidden'); END;
