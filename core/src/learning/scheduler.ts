import type Database from "better-sqlite3";
import type { KrakenCandle } from "../market/kraken/ohlc.js";
import { resolveEpisodeOutcome } from "./outcomes.js";

export interface DueOutcome {
  episodeId:string;
  horizon:string;
  dueAt:string;
  signalAt:string;
  symbol:string;
  controlSymbol:string|null;
}

export function intervalForHorizon(horizon:string):number {
  switch(horizon) {
    case "1H": return 1;
    case "4H": return 1;
    case "1D": return 5;
    case "3D": return 15;
    case "7D": return 15;
    case "14D": return 60;
    case "30D": return 60;
    default: return 60;
  }
}

export function listDueOutcomes(db:Database.Database,now:string,limit=3):DueOutcome[] {
  return db.prepare(`
    SELECT eo.episode_id AS episodeId,eo.horizon,eo.due_at AS dueAt,
           se.signal_at AS signalAt,se.symbol,se.control_symbol AS controlSymbol
    FROM episode_outcomes eo
    JOIN strategy_episodes se ON se.episode_id=eo.episode_id
    WHERE eo.evaluated_at IS NULL AND eo.due_at<=?
    ORDER BY eo.due_at ASC
    LIMIT ?
  `).all(now,limit) as DueOutcome[];
}

export interface OutcomeResolverDeps {
  pairForSymbol(symbol:string):string|null;
  fetchCandles(symbol:string,pair:string,intervalMinutes:number,sinceSeconds:number):Promise<KrakenCandle[]>;
  now():Date;
}

function persistCandles(db:Database.Database,candles:KrakenCandle[]) {
  const stmt=db.prepare(`INSERT OR IGNORE INTO market_candles(
    symbol,interval_minutes,open_time,open,high,low,close,volume,committed
  ) VALUES (?,?,?,?,?,?,?,?,1)`);
  db.transaction(()=>{
    for(const c of candles) stmt.run(c.symbol,c.intervalMinutes,c.openTime,c.open,c.high,c.low,c.close,c.volume);
  })();
}

export async function resolveDueOutcomeBatch(
  db:Database.Database,
  deps:OutcomeResolverDeps,
  limit=3,
) {
  const due=listDueOutcomes(db,deps.now().toISOString(),limit);
  const results:Array<{episodeId:string;horizon:string;updated:boolean;reason?:string}>=[];
  for(const item of due) {
    const assetPair=deps.pairForSymbol(item.symbol);
    const btcPair=deps.pairForSymbol("BTC");
    const controlPair=item.controlSymbol ? deps.pairForSymbol(item.controlSymbol) : null;
    if(!assetPair||!btcPair) {
      results.push({episodeId:item.episodeId,horizon:item.horizon,updated:false,reason:"kraken_pair_missing"});
      continue;
    }

    const interval=intervalForHorizon(item.horizon);
    const since=Math.floor((Date.parse(item.signalAt)-interval*60_000)/1000);
    try {
      const [assetCandles,btcCandles,controlCandles]=await Promise.all([
        deps.fetchCandles(item.symbol,assetPair,interval,since),
        deps.fetchCandles("BTC",btcPair,interval,since),
        item.controlSymbol&&controlPair
          ? deps.fetchCandles(item.controlSymbol,controlPair,interval,since)
          : Promise.resolve([]),
      ]);
      persistCandles(db,[...assetCandles,...btcCandles,...controlCandles]);
      const resolved=resolveEpisodeOutcome(db,{
        episodeId:item.episodeId,
        horizon:item.horizon,
        assetCandles,
        btcCandles,
        controlCandles:controlCandles.length?controlCandles:undefined,
        maxTimingErrorMs:interval*60_000,
      });
      results.push({episodeId:item.episodeId,horizon:item.horizon,updated:resolved.updated,reason:resolved.updated?undefined:resolved.reason});
    } catch(error) {
      results.push({
        episodeId:item.episodeId,
        horizon:item.horizon,
        updated:false,
        reason:error instanceof Error?error.message:String(error),
      });
    }
  }
  return results;
}
