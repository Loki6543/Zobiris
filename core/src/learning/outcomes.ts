import type Database from "better-sqlite3";
import { nearestCandleOpen, favorableAdverseExcursion, type KrakenCandle } from "../market/kraken/ohlc.js";

export interface ResolveOutcomeInput {
  episodeId:string;
  horizon:string;
  assetCandles:KrakenCandle[];
  btcCandles:KrakenCandle[];
  controlCandles?:KrakenCandle[];
  maxTimingErrorMs:number;
}

export function resolveEpisodeOutcome(db:Database.Database,input:ResolveOutcomeInput) {
  const episode=db.prepare(`SELECT episode_id,symbol,signal_at,signal_price,btc_signal_price,control_signal_price
    FROM strategy_episodes WHERE episode_id=?`).get(input.episodeId) as any;
  const outcome=db.prepare("SELECT horizon,due_at,evaluated_at FROM episode_outcomes WHERE episode_id=? AND horizon=?")
    .get(input.episodeId,input.horizon) as any;
  if(!episode||!outcome) throw new Error("episode or horizon not found");
  if(outcome.evaluated_at) return {updated:false,reason:"already_resolved"};

  const asset=nearestCandleOpen(input.assetCandles,outcome.due_at,input.maxTimingErrorMs);
  const btc=nearestCandleOpen(input.btcCandles,outcome.due_at,input.maxTimingErrorMs);
  const control=episode.control_signal_price && input.controlCandles
    ? nearestCandleOpen(input.controlCandles,outcome.due_at,input.maxTimingErrorMs) : null;
  if(!asset || !btc) return {updated:false,reason:"price_timing_unresolved"};

  const ret=(asset.price/episode.signal_price-1)*100;
  const btcRet=episode.btc_signal_price ? (btc.price/episode.btc_signal_price-1)*100 : null;
  const controlRet=episode.control_signal_price && control ? (control.price/episode.control_signal_price-1)*100 : null;
  const excursion=favorableAdverseExcursion(input.assetCandles,episode.signal_price,{startAt:episode.signal_at,endAt:outcome.due_at});
  const evaluatedAt=new Date().toISOString();

  db.prepare(`UPDATE episode_outcomes SET evaluated_at=?,asset_price=?,btc_price=?,control_price=?,
    return_pct=?,excess_btc_pct=?,excess_control_pct=?,max_favorable_pct=?,max_adverse_pct=?
    WHERE episode_id=? AND horizon=?`).run(
      evaluatedAt,asset.price,btc.price,control?.price ?? null,ret,
      btcRet==null?null:ret-btcRet,controlRet==null?null:ret-controlRet,
      excursion.mfePct,excursion.maePct,input.episodeId,input.horizon
    );

  return {
    updated:true,
    assetPrice:asset.price,
    btcPrice:btc.price,
    returnPct:ret,
    excessBtcPct:btcRet==null?null:ret-btcRet,
    excessControlPct:controlRet==null?null:ret-controlRet,
    timingErrorMs:asset.delayMs,
    precisionMinutes:asset.precisionMinutes,
  };
}
