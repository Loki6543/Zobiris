export interface KrakenCandle {
  symbol: string;
  intervalMinutes: number;
  openTime: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number | null;
  committed: true;
}

function finite(value:unknown):number|null {
  const n=Number(value);
  return Number.isFinite(n) ? n : null;
}

export function parseCommittedOhlcRows(symbol:string,intervalMinutes:number,rows:unknown[][]):KrakenCandle[] {
  // Kraken documents that the last returned OHLC row is the still-open timeframe.
  return rows.slice(0,-1).flatMap((row)=>{
    const time=finite(row?.[0]),open=finite(row?.[1]),high=finite(row?.[2]),low=finite(row?.[3]),close=finite(row?.[4]),volume=finite(row?.[6]);
    if(time==null||open==null||high==null||low==null||close==null||open<=0||high<=0||low<=0||close<=0) return [];
    return [{
      symbol:symbol.toUpperCase(),intervalMinutes,
      openTime:new Date(time*1000).toISOString(),
      open,high,low,close,volume,committed:true as const,
    }];
  });
}

export interface TimedPrice {
  price:number;
  observedAt:string;
  delayMs:number;
  precisionMinutes:number;
}

export function nearestCandleOpen(candles:KrakenCandle[],targetAt:string,maxAbsoluteDelayMs:number):TimedPrice|null {
  const target=Date.parse(targetAt);
  if(!Number.isFinite(target)) return null;
  let best:KrakenCandle|null=null,bestDelay=Infinity;
  for(const candle of candles) {
    const at=Date.parse(candle.openTime);
    const delay=Math.abs(at-target);
    if(delay<bestDelay) { best=candle; bestDelay=delay; }
  }
  if(!best || bestDelay>maxAbsoluteDelayMs) return null;
  return {
    price:best.open,
    observedAt:best.openTime,
    delayMs:Date.parse(best.openTime)-target,
    precisionMinutes:best.intervalMinutes,
  };
}

export interface LimitFillEvidence {
  filled:boolean;
  filledAt:string|null;
  assumedFillPrice:number|null;
  evidence:"OHLC_TOUCH_CONSERVATIVE_LIMIT_PRICE"|"NO_TOUCH";
}

export function evaluateBuyLimitFill(candles:KrakenCandle[],args:{startAt:string;expiresAt:string;limitPrice:number}):LimitFillEvidence {
  const start=Date.parse(args.startAt),end=Date.parse(args.expiresAt);
  const eligible=candles.filter(c=>{
    const at=Date.parse(c.openTime);
    return at>=start && at<=end;
  }).sort((a,b)=>Date.parse(a.openTime)-Date.parse(b.openTime));
  const touched=eligible.find(c=>c.low<=args.limitPrice);
  if(!touched) return {filled:false,filledAt:null,assumedFillPrice:null,evidence:"NO_TOUCH"};
  return {
    filled:true,
    filledAt:touched.openTime,
    // OHLC proves a touch, not queue position or price improvement. Use the limit itself.
    assumedFillPrice:args.limitPrice,
    evidence:"OHLC_TOUCH_CONSERVATIVE_LIMIT_PRICE",
  };
}

export function favorableAdverseExcursion(candles:KrakenCandle[],entryPrice:number,args:{startAt:string;endAt:string}) {
  const start=Date.parse(args.startAt),end=Date.parse(args.endAt);
  const eligible=candles.filter(c=>{
    const at=Date.parse(c.openTime);
    return at>=start && at<=end;
  });
  if(!eligible.length || !(entryPrice>0)) return {mfePct:null as number|null,maePct:null as number|null};
  const high=Math.max(...eligible.map(c=>c.high));
  const low=Math.min(...eligible.map(c=>c.low));
  return {
    mfePct:(high/entryPrice-1)*100,
    maePct:(low/entryPrice-1)*100,
  };
}
