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

export interface EpisodeTransitionInput {
  symbol:string;
  strategyTag:string;
  strategyVersion:string;
  fromState:string|null;
  toState:string;
  signalAt:string;
  signalPrice:number;
  btcSignalPrice?:number|null;
  controlSymbol?:string|null;
  controlSignalPrice?:number|null;
  intendedLimit?:number|null;
  recommendedSizeUsd?:number|null;
}

export interface EpisodeTransitionResult {
  episodeId:string|null;
  created:boolean;
  closed:boolean;
}

export function applyStrategyTransition(db:Database.Database,input:EpisodeTransitionInput):EpisodeTransitionResult {
  const open=db.prepare(`SELECT episode_id,to_state FROM strategy_episodes
    WHERE symbol=? AND strategy_tag=? AND status='OPEN' ORDER BY signal_at DESC LIMIT 1`)
    .get(input.symbol,input.strategyTag) as {episode_id:string;to_state:string}|undefined;

  if(!ACTIONABLE.has(input.toState)) {
    if(open) {
      db.prepare("UPDATE strategy_episodes SET to_state=?,status='CLOSED',updated_at=? WHERE episode_id=?")
        .run(input.toState,input.signalAt,open.episode_id);
      return {episodeId:open.episode_id,created:false,closed:true};
    }
    return {episodeId:null,created:false,closed:false};
  }

  if(open) {
    db.prepare("UPDATE strategy_episodes SET to_state=?,updated_at=?,intended_limit=COALESCE(?,intended_limit),recommended_size_usd=COALESCE(?,recommended_size_usd) WHERE episode_id=?")
      .run(input.toState,input.signalAt,input.intendedLimit ?? null,input.recommendedSizeUsd ?? null,open.episode_id);
    return {episodeId:open.episode_id,created:false,closed:false};
  }

  const episodeId=`${input.strategyTag}:${input.symbol}:${input.signalAt}`;
  const insertEpisode=db.prepare(`INSERT INTO strategy_episodes (
    episode_id,symbol,strategy_tag,strategy_version,from_state,to_state,signal_at,signal_price,
    btc_signal_price,control_symbol,control_signal_price,intended_limit,recommended_size_usd,status,created_at,updated_at
  ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,'OPEN',?,?)`);
  const insertOutcome=db.prepare("INSERT INTO episode_outcomes (episode_id,horizon,due_at) VALUES (?,?,?)");

  db.transaction(()=>{
    insertEpisode.run(
      episodeId,input.symbol,input.strategyTag,input.strategyVersion,input.fromState,input.toState,input.signalAt,input.signalPrice,
      input.btcSignalPrice ?? null,input.controlSymbol ?? null,input.controlSignalPrice ?? null,input.intendedLimit ?? null,input.recommendedSizeUsd ?? null,
      input.signalAt,input.signalAt
    );
    const start=Date.parse(input.signalAt);
    if(!Number.isFinite(start)) throw new Error("invalid signalAt");
    for(const [horizon,ms] of OUTCOME_HORIZONS) insertOutcome.run(episodeId,horizon,new Date(start+ms).toISOString());
  })();

  return {episodeId,created:true,closed:false};
}
