import type Database from "better-sqlite3";

export const OUTCOME_HORIZONS = [
  ["1H", 60*60*1000],
  ["4H", 4*60*60*1000],
  ["1D", 24*60*60*1000],
  ["3D", 3*24*60*60*1000],
  ["7D", 7*24*60*60*1000],
  ["14D", 14*24*60*60*1000],
  ["30D", 30*24*60*60*1000],
] as const;

const ACTIONABLE=new Set(["QUALIFIED","WAIT_FOR_PULLBACK","READY"]);
const CONTROL_STATES=new Set(["NEAR_ROTATION","TOO_EARLY","ALREADY_EXTENDED","STRUCTURALLY_WEAK"]);

export interface EpisodeTransitionInput {
  symbol:string;
  strategyTag:string;
  strategyVersion:string;
  policyVersion:string;
  policyHash:string;
  fromState:string|null;
  toState:string;
  signalAt:string;
  signalPrice:number;
  btcSignalPrice?:number|null;
  controlSymbol?:string|null;
  controlSignalPrice?:number|null;
  intendedLimit?:number|null;
  recommendedSizeUsd?:number|null;
  decisionContext?:unknown;
}

export interface EpisodeTransitionResult {
  episodeId:string|null;
  created:boolean;
  closed:boolean;
  controlEpisodeId?:string|null;
}

function scheduleOutcomes(db:Database.Database,episodeId:string,signalAt:string) {
  const insertOutcome=db.prepare("INSERT INTO episode_outcomes (episode_id,horizon,due_at) VALUES (?,?,?)");
  const start=Date.parse(signalAt);
  if(!Number.isFinite(start)) throw new Error("invalid signalAt");
  for(const [horizon,ms] of OUTCOME_HORIZONS) insertOutcome.run(episodeId,horizon,new Date(start+ms).toISOString());
}

function insertEpisode(
  db:Database.Database,
  input:EpisodeTransitionInput,
  args:{episodeId:string;kind:"QUALIFIED"|"CONTROL";status:"OPEN"|"CLOSED"},
) {
  db.prepare(`INSERT INTO strategy_episodes (
    episode_id,symbol,strategy_tag,strategy_version,policy_version,policy_hash,episode_kind,entry_state,exit_state,
    from_state,to_state,signal_at,signal_price,
    btc_signal_price,control_symbol,control_signal_price,intended_limit,recommended_size_usd,decision_context_json,
    status,created_at,updated_at
  ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?, ?,?)`).run(
    args.episodeId,input.symbol,input.strategyTag,input.strategyVersion,input.policyVersion,input.policyHash,
    args.kind,input.toState,null,input.fromState,input.toState,input.signalAt,input.signalPrice,
    input.btcSignalPrice ?? null,input.controlSymbol ?? null,input.controlSignalPrice ?? null,
    input.intendedLimit ?? null,input.recommendedSizeUsd ?? null,
    input.decisionContext===undefined?null:JSON.stringify(input.decisionContext),
    args.status,input.signalAt,input.signalAt
  );
  scheduleOutcomes(db,args.episodeId,input.signalAt);
}

export function applyStrategyTransition(db:Database.Database,input:EpisodeTransitionInput):EpisodeTransitionResult {
  const open=db.prepare(`SELECT episode_id,to_state FROM strategy_episodes
    WHERE symbol=? AND strategy_tag=? AND episode_kind='QUALIFIED' AND status='OPEN'
    ORDER BY signal_at DESC LIMIT 1`)
    .get(input.symbol,input.strategyTag) as {episode_id:string;to_state:string}|undefined;

  const actionable=ACTIONABLE.has(input.toState);
  const control=CONTROL_STATES.has(input.toState);

  if(actionable) {
    if(open) {
      db.prepare(`UPDATE strategy_episodes
        SET to_state=?,updated_at=?,intended_limit=COALESCE(?,intended_limit),
            recommended_size_usd=COALESCE(?,recommended_size_usd)
        WHERE episode_id=?`)
        .run(input.toState,input.signalAt,input.intendedLimit ?? null,input.recommendedSizeUsd ?? null,open.episode_id);
      return {episodeId:open.episode_id,created:false,closed:false};
    }

    const episodeId=`${input.strategyTag}:QUALIFIED:${input.symbol}:${input.signalAt}`;
    db.transaction(()=>insertEpisode(db,input,{episodeId,kind:"QUALIFIED",status:"OPEN"}))();
    return {episodeId,created:true,closed:false};
  }

  let closed=false;
  if(open) {
    db.prepare("UPDATE strategy_episodes SET status='CLOSED',exit_state=?,updated_at=? WHERE episode_id=?")
      .run(input.toState,input.signalAt,open.episode_id);
    closed=true;
  }

  if(control && input.fromState!==input.toState) {
    const controlEpisodeId=`${input.strategyTag}:CONTROL:${input.symbol}:${input.signalAt}`;
    db.transaction(()=>insertEpisode(db,input,{episodeId:controlEpisodeId,kind:"CONTROL",status:"CLOSED"}))();
    return {episodeId:open?.episode_id ?? null,created:true,closed,controlEpisodeId};
  }

  return {episodeId:open?.episode_id ?? null,created:false,closed,controlEpisodeId:null};
}
