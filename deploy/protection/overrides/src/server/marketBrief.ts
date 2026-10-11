import { compareDaily, exitMarketContext } from '../compareLab/compare.js';
import { buildBitcoinCycleResearch } from './bitcoinCycleResearch.js';
export function summarizeMarket(series: {symbol:string;points:{time:number;close:number}[]}[], daily: Awaited<ReturnType<typeof exitMarketContext>>, now=Date.now()) {
 const btc=series.find(s=>s.symbol==='BTC'); const points=btc?.points??[]; const last=points.at(-1);
 if(!daily||!last||now-(last.time+86400)*1000>36*3600000||(last.time+86400)*1000>now||points.length<91) throw new Error('Fresh completed Bitcoin history unavailable');
 if(Date.parse(daily.asOf)!==last.time*1000||![daily.ema50,daily.ema200,daily.rsi14,daily.atrPct].every(Number.isFinite))throw new Error('Daily indicators do not match the current candle');
 if(series.length!==3||!['BTC','ETH','SOL'].every(symbol=>series.filter(s=>s.symbol===symbol).length===1)||series.some(s=>s.points.length!==points.length||s.points.some((p,i)=>!Number.isFinite(p.close)||p.close<=0||p.time!==points[i]!.time||(i>0&&p.time-s.points[i-1]!.time!==86400))))throw new Error('Aligned major-coin history unavailable');
 const change=(p:typeof points,n:number)=>(p.at(-1)!.close/p.at(-n-1)!.close-1)*100;
 const returns=series.map(s=>({symbol:s.symbol,day:change(s.points,1),week:change(s.points,7),month:change(s.points,30),quarter:change(s.points,90)}));
 const week=change(points,7); const bias=daily.trend==='STRONG'&&week>0?'UPWARD BIAS':daily.trend==='WEAK'&&week<0?'DOWNWARD BIAS':'MIXED / RANGE';
 const positive=returns.filter(r=>r.week>0).length;
 return {asOf:new Date((last.time+86400)*1000).toISOString(),source:'Kraken completed daily candles',bias,
 market:positive===3?'BTC, ETH and SOL are all advancing over seven days. This supports a broad major-coin recovery.':positive===0?'BTC, ETH and SOL are all declining over seven days. Major-coin risk appetite is weak.':'Major coins are diverging. Participation is uneven, so Bitcoin strength alone would not confirm an altcoin recovery.',
 outlook:bias==='UPWARD BIAS'?'The daily structure favors continuation higher over the next several days, provided Bitcoin holds its 50-day trend and momentum stays positive.':bias==='DOWNWARD BIAS'?'The daily structure favors further downside over the next several days. A recovery needs a sustained reclaim of the 50-day trend and positive weekly momentum.':'There is no clean directional edge. Treat the recent range as unresolved until price and weekly momentum align with the daily trend.',
 counter:bias==='UPWARD BIAS'?'A rising trend can still reverse. A close below the 50-day EMA or a turn to negative weekly momentum would weaken this view.':bias==='DOWNWARD BIAS'?'Selling can exhaust. A close back above the 50-day EMA together with positive weekly momentum would weaken the bearish view.':'A sharp move can break the range in either direction; mixed indicators should not be read as low risk.',
 lower:Math.min(...points.slice(-20).map(p=>p.close)),upper:Math.max(...points.slice(-20).map(p=>p.close)),close:last.close,daily,returns,chart:points.slice(-90),
 cycleResearch:buildBitcoinCycleResearch({asOf:new Date((last.time+86400)*1000).toISOString(),close:last.close,weeklyReturnPct:week,ema50:daily.ema50,rsi14:daily.rsi14,atrPct:daily.atrPct}),
 caveat:daily.rsi14>70?'Momentum is stretched: simple RSI is above 70, increasing pullback concern.':daily.rsi14<30?'Momentum is depressed: simple RSI is below 30, increasing rebound potential without confirming a bottom.':'Momentum is not at an extreme on the simple 14-day RSI.',
 volume:daily.volume7dVsPrior30d==null?'Volume confirmation is unavailable.':daily.volume7dVsPrior30d>=1?'Recent average volume exceeds its preceding 30-day baseline.':'Recent average volume is below its preceding 30-day baseline; directional conviction is weaker.'};
}
let cached:{expires:number;value:ReturnType<typeof summarizeMarket>}|null=null;
export async function marketBrief(){
 if(cached&&cached.expires>Date.now())return cached.value;
 const [history,daily]=await Promise.all([compareDaily(['BTC','ETH','SOL'],90),exitMarketContext('BTC')]);
 const value=summarizeMarket(history.series,daily);cached={expires:Date.now()+300000,value};return value;
}

