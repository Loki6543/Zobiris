/** Research policy v1. No execution authority. Rates are stress assumptions, not exchange quotes. */
export const POLICY = {version:'tactical-v1', equity:300, riskFraction:.005, aggregateRisk:.01, maxLeverage:1.5, maxPositions:2, dailyLoss:.02, drawdown:.08} as const;
export type Side='long'|'short';
export const COSTS={fee:.004,slippage:.001,opening:.0003,rollover:.0003};
export function maintenance(now:number):boolean{
 const parts=new Intl.DateTimeFormat('en-US',{timeZone:'America/Chicago',weekday:'short',hour:'2-digit',hourCycle:'h23'}).formatToParts(now);
 const get=(t:string)=>parts.find(p=>p.type===t)?.value;
 return get('weekday')==='Fri'&&Number(get('hour'))>=17&&Number(get('hour'))<19;
}
export function netPnl(side:Side,quantity:number,entry:number,exit:number,hours:number,margin=true){
 const sign=side==='long'?1:-1;
 const gross=sign*quantity*(exit-entry);
 const costs=quantity*(entry+exit)*(COSTS.fee+COSTS.slippage)+(margin?quantity*entry*(COSTS.opening+Math.floor(Math.max(0,hours)/4)*COSTS.rollover):0);
 return {gross,costs,net:gross-costs};
}
export function sizeTrade(input:{equity:number;entry:number;stop:number;side:Side;leverage:number;hours:number;step:number;minQuantity:number;minCost:number;riskFraction?:number;availableCollateral?:number}){
 const {equity,entry,stop,side,leverage,hours,step,minQuantity,minCost}=input;
 const fraction=input.riskFraction??POLICY.riskFraction;
 if(![equity,entry,stop,leverage,hours,step,minQuantity,minCost,fraction,input.availableCollateral??equity].every(Number.isFinite)||equity<=0||entry<=0||stop<=0||step<=0||minQuantity<0||minCost<0||hours<=0||fraction<=0||fraction>.01||!['long','short'].includes(side)||![1,1.25,1.5].includes(leverage)||(side==='long'?stop>=entry:stop<=entry))throw new Error('Invalid plan or locked leverage');
 const risk=equity*fraction;
 const perUnit=-netPnl(side,1,entry,stop,hours).net;
 const available=Math.max(0,input.availableCollateral??equity);
 const quantity=Math.floor(Math.min(risk/perUnit,available/(entry/leverage+entry*(COSTS.fee+COSTS.slippage+COSTS.opening)))/step)*step;
 const notional=quantity*entry;
 return {quantity,notional,collateral:notional/leverage,risk:quantity*perUnit,riskBudget:risk,effectiveLeverage:notional/equity,eligible:quantity>=minQuantity&&notional>=minCost&&quantity>0,reason:quantity<minQuantity||notional<minCost?'Minimum position exceeds risk budget':null};
}
export type Candle={time:number;open:number;high:number;low:number;close:number;volume:number};
/** Standalone callers and restored/replayed data must satisfy the same OHLC contract as parseBars. */
export function assertValidCandles(bars:Candle[], minimum = 60): void {
 if(!Array.isArray(bars)||bars.length<minimum)throw new Error('Insufficient completed candles');
 for(let i=0;i<bars.length;i++){
  const b=bars[i]!;
  if(!b||![b.time,b.open,b.high,b.low,b.close,b.volume].every(Number.isFinite)
     ||b.open<=0||b.high<=0||b.low<=0||b.close<=0||b.volume<0
     ||b.high<Math.max(b.open,b.close,b.low)||b.low>Math.min(b.open,b.close)
     ||(i>0&&b.time<=bars[i-1]!.time))throw new Error('Invalid or unordered candles');
 }
}
export function signal(bars:Candle[]){
 assertValidCandles(bars);
 const closes=bars.map(b=>b.close),mean=(n:number)=>closes.slice(-n).reduce((a,b)=>a+b,0)/n;
 const fast=mean(20),slow=mean(50),last=bars[bars.length-1]!;
 let gain=0,loss=0;for(let i=closes.length-14;i<closes.length;i++){const d=closes[i]!-closes[i-1]!;gain+=Math.max(d,0);loss+=Math.max(-d,0);}
 const rsi=gain+loss===0?50:loss===0?100:100-100/(1+gain/loss);
 const atr=bars.slice(-14).reduce((s,b,i)=>{const prev=bars[bars.length-15+i]!.close;return s+Math.max(b.high-b.low,Math.abs(b.high-prev),Math.abs(b.low-prev));},0)/14;
 const volatility=atr/last.close;
 const side:Side|null=volatility>.04?null:last.close>fast&&fast>slow&&rsi>=50&&rsi<70?'long':last.close<fast&&fast<slow&&rsi>30&&rsi<=50?'short':null;
 return {side,rsi,atr,fast,slow,volatility,stopFraction:Math.max(.015,2*volatility),reason:side?`${side==='long'?'Up':'Down'}trend with moderate RSI; technical baseline only`:'Cash: overextended, conflicting trend or high volatility'};
}
/** Conservative intrabar ordering; gaps fill at the worse opening price. */
export function candleExit(side:Side,bar:Candle,stop:number,target:number):{price:number;reason:string}|null{
 if(side==='long'){if(bar.low<=stop)return {price:Math.min(stop,bar.open),reason:'stop'};if(bar.high>=target)return {price:target,reason:'target'};}
 else {if(bar.high>=stop)return {price:Math.max(stop,bar.open),reason:'stop'};if(bar.low<=target)return {price:target,reason:'target'};}
 return null;
}
export function replay(bars:Candle[],hours:number){
 assertValidCandles(bars);
 if(!Number.isSafeInteger(hours)||hours<=0)throw new Error('Invalid replay horizon');
 const boundary=Math.max(60,Math.floor(bars.length*.7));let equity=300,peak=300,drawdown=0,trades=0,longs=0,shorts=0,costs=0,gross=0;
 // Fixed rules; final 30% is chronological holdout, no training or parameter selection.
 for(let i=boundary;i+hours<bars.length;i++){
  const s=signal(bars.slice(0,i));if(!s.side)continue;
  const entry=bars[i]!.open,stop=entry*(1+(s.side==='long'?-1:1)*s.stopFraction),target=entry*(1+(s.side==='long'?1:-1)*s.stopFraction*2);
  const p=sizeTrade({equity,entry,stop,side:s.side,leverage:1,hours,step:1e-8,minQuantity:0,minCost:0});
  let exit=bars[i+hours]!.open,held=hours;
  for(let j=i;j<i+hours;j++){const hit=candleExit(s.side,bars[j]!,stop,target);if(hit){exit=hit.price;held=j-i+1;break;}}
  const result=netPnl(s.side,p.quantity,entry,exit,held);equity+=result.net;costs+=result.costs;gross+=result.gross;trades++;s.side==='long'?longs++:shorts++;peak=Math.max(peak,equity);drawdown=Math.max(drawdown,(peak-equity)/peak);i+=held-1;if(equity<=0)break;
 }
 return {trades,longs,shorts,net:equity-300,gross,costs,drawdown,from:bars[boundary]?.time??null,to:bars.at(-1)?.time??null,label:'Fixed-rule chronological holdout; hourly OHLC, assumed costs, no historical depth or exchange liquidation model'};
}
