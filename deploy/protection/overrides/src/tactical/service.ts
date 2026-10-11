import fs from 'node:fs';
import path from 'node:path';
import {entryRules} from '../server/entryRules.js';
import {POLICY,COSTS,maintenance,signal,sizeTrade,netPnl,replay,type Candle,type Side} from './risk.js';
type RecordRow={id:string;symbol:string;at:number;horizon:number;side:Side|null;reason:string;status:'rejected'|'open'|'closed';entry?:number;stop?:number;target?:number;quantity?:number;risk?:number;collateral?:number;leverage?:number;exit?:number;closedAt?:number;net?:number;gross?:number;costs?:number;coverageComplete:boolean;lastSeen?:number;mark?:number};
type State={version:string;startedAt:number;paused:boolean;pauseReason:string|null;equity:number;peak:number;day:string;dayStart:number;records:RecordRow[];lastSuccess:number|null};

/** Fail closed on damaged or fabricated paper records rather than replaying NaN PnL. */
function validStoredRecord(value: unknown): value is RecordRow {
 if(!value||typeof value!=='object')return false;
 const r=value as Partial<RecordRow>;
 const positive=(v:unknown)=>typeof v==='number'&&Number.isFinite(v)&&v>0;
 const nonNegative=(v:unknown)=>typeof v==='number'&&Number.isFinite(v)&&v>=0;
 if(typeof r.id!=='string'||!r.id||typeof r.symbol!=='string'||!r.symbol
    ||!positive(r.at)||!positive(r.horizon)||typeof r.reason!=='string'
    ||!['rejected','open','closed'].includes(String(r.status))
    ||(r.side!==null&&r.side!=='long'&&r.side!=='short')
    ||typeof r.coverageComplete!=='boolean')return false;
 if(r.lastSeen!==undefined&&!positive(r.lastSeen))return false;
 if(r.mark!==undefined&&!positive(r.mark))return false;
 if(r.entry!==undefined&&!positive(r.entry))return false;
 if(r.stop!==undefined&&!positive(r.stop))return false;
 if(r.target!==undefined&&!positive(r.target))return false;
 for(const field of ['quantity','risk','collateral'] as const){
  if(r[field]!==undefined&&!nonNegative(r[field]))return false;
 }
 if(r.leverage!==undefined&&![1,1.25,1.5].includes(r.leverage))return false;
 if(r.status==='open'||r.status==='closed'){
  if(!r.side||!positive(r.entry)||!positive(r.stop)||!positive(r.target)
     ||!positive(r.quantity)||!nonNegative(r.risk)||!nonNegative(r.collateral)
     ||!positive(r.leverage))return false;
 }
 if(r.status==='closed'&&(!positive(r.exit)||!positive(r.closedAt)
    ||![r.net,r.gross,r.costs].every(Number.isFinite)))return false;
 return true;
}
function validStoredState(value: any): value is State {
 return value&&typeof value==='object'&&value.version===POLICY.version
   &&Array.isArray(value.records)&&value.records.length<=20000
   &&value.records.every(validStoredRecord)
   &&[value.equity,value.peak,value.dayStart,value.startedAt].every(Number.isFinite)
   &&value.startedAt>0&&value.peak>0&&value.dayStart>0
   &&typeof value.paused==='boolean'
   &&(value.pauseReason===null||typeof value.pauseReason==='string')
   &&typeof value.day==='string'&&/^\\d{4}-\\d{2}-\\d{2}$/.test(value.day)
   &&(value.lastSuccess===null||Number.isFinite(value.lastSuccess));
}

async function publicData(route:string){const response=await fetch(`https://api.kraken.com/0/public/${route}`,{signal:AbortSignal.timeout(12000)});if(!response.ok)throw new Error('Public market request failed');const body=await response.json() as any;if(body.error?.length||!body.result)throw new Error('Public market unavailable');return body.result;}
export function parseBars(rows:unknown,now:number):Candle[]{
 if(!Array.isArray(rows))throw new Error('Missing candles');
 const bars=rows.map((r:any)=>({time:Number(r[0])*1000,open:Number(r[1]),high:Number(r[2]),low:Number(r[3]),close:Number(r[4]),volume:Number(r[6])})).filter(b=>b.time+3600000<=now);
 if(bars.length<100||now-bars.at(-1)!.time>7200000)throw new Error('Stale or insufficient candles');
 for(let i=0;i<bars.length;i++){const b=bars[i]!;if(!Object.values(b).every(Number.isFinite)||b.low<=0||b.volume<0||b.high<Math.max(b.open,b.close,b.low)||b.low>Math.min(b.open,b.close)||i>0&&b.time-bars[i-1]!.time!==3600000)throw new Error('Invalid or discontinuous candles');}
 return bars;
}
export class TacticalService{
 private state:State;private busy=false;private error:string|null=null;private markets:any[]=[];
 constructor(private file:string){
  const now=Date.now();this.state={version:POLICY.version,startedAt:now,paused:false,pauseReason:null,equity:300,peak:300,day:new Date(now).toISOString().slice(0,10),dayStart:300,records:[],lastSuccess:null};
  if(fs.existsSync(file)){try{const value=JSON.parse(fs.readFileSync(file,'utf8'));if(!validStoredState(value))throw Error();this.state=value;}catch{this.state.paused=true;this.state.pauseReason='Ledger unreadable: manual recovery required';this.error=this.state.pauseReason;}}
 }
 private save(){fs.mkdirSync(path.dirname(this.file),{recursive:true});const tmp=this.file+'.tmp';fs.writeFileSync(tmp,JSON.stringify(this.state));fs.renameSync(tmp,this.file);}
 status(){const closed=this.state.records.filter(r=>r.status==='closed');return {mode:'PAPER ONLY',liveEnabled:false,policy:POLICY,costs:COSTS,paused:this.state.paused,pauseReason:this.state.pauseReason,error:this.error,startedAt:this.state.startedAt,lastSuccess:this.state.lastSuccess,equity:this.state.equity,markets:this.markets,records:this.state.records.slice(-150).reverse(),counts:{proposals:this.state.records.length,closed:closed.length,complete:closed.filter(r=>r.coverageComplete).length,open:this.state.records.filter(r=>r.status==='open').length},locks:['2× and 3× require independent forward validation and manual review','U.S. product API permission, account eligibility and collateral isolation unverified','Liquidation thresholds and exchange margin health unavailable; live entries disabled']};}
 pause(){if(this.error==='Ledger unreadable: manual recovery required')return this.status();this.state.paused=true;this.state.pauseReason='Operator paused new paper entries';this.save();return this.status();}
 async tick(){
  if(this.busy||this.error==='Ledger unreadable: manual recovery required')return;this.busy=true;
  try{
   const now=Date.now(),status=await publicData('SystemStatus');if(status.status!=='online')throw new Error('Exchange is not online');
   const rules=await entryRules();const markets=await Promise.all(['BTC','ETH','SOL'].map(async symbol=>{
    try{const rule=rules[symbol];const ruleAgeMs=rule?now-Date.parse(rule.observedAt):NaN;if(!rule||rule.status!=='online'||!Number.isFinite(ruleAgeMs)||ruleAgeMs<0||ruleAgeMs>16*60000)throw Error('Instrument metadata unavailable');
     const [ohlc,depth]=await Promise.all([publicData(`OHLC?pair=${encodeURIComponent(rule.pair)}&interval=60`),publicData(`Depth?pair=${encodeURIComponent(rule.pair)}&count=5`)]);
     const bars=parseBars(ohlc[rule.pair]??Object.entries(ohlc).find(([k])=>k!=='last')?.[1],Date.now());const book:any=Object.values(depth)[0];const bid=Number(book?.bids?.[0]?.[0]),ask=Number(book?.asks?.[0]?.[0]);
     if(!Number.isFinite(bid)||!Number.isFinite(ask)||bid<=0||ask<bid||(ask-bid)/bid>.005)throw Error('Invalid or wide order book');
     return {symbol,rule,bars,bid,ask,at:Date.now(),signal:signal(bars),replays:[4,24,120].map(h=>({hours:h,...replay(bars,h)})),error:null};
    }catch(e){return {symbol,error:e instanceof Error?e.message:'Data unavailable'};}
   }));
   this.markets=markets.map((m:any)=>({...m,bars:undefined,rule:undefined,history:m.bars?.slice(-72).map((b:Candle)=>({time:b.time,close:b.close})),expectedReturn:null}));
   for(const r of this.state.records.filter(r=>r.status==='open')){
    const m:any=markets.find(m=>m.symbol===r.symbol);if(!m||m.error){r.coverageComplete=false;continue;}
    if(now-(r.lastSeen??r.at)>180000)r.coverageComplete=false;r.lastSeen=now;r.mark=r.side==='long'?m.bid:m.ask;
    const elapsed=(now-r.at)/3600000;const hit=r.side==='long'?r.mark!<=r.stop!||r.mark!>=r.target!:r.mark!>=r.stop!||r.mark!<=r.target!;
    if(hit||elapsed>=r.horizon){Object.assign(r,netPnl(r.side!,r.quantity!,r.entry!,r.mark!,elapsed),{status:'closed',exit:r.mark,closedAt:now,reason:hit?'Observed stop/target crossing':'Maximum holding period'});this.state.equity+=r.net!;}
   }
   const unrealized=this.state.records.filter(r=>r.status==='open').reduce((s,r)=>s+netPnl(r.side!,r.quantity!,r.entry!,r.mark??r.entry!,(now-r.at)/3600000).net,0);
   const equity=this.state.equity+unrealized;this.state.peak=Math.max(this.state.peak,equity);
   const day=new Date(now).toISOString().slice(0,10);if(day!==this.state.day){this.state.day=day;this.state.dayStart=equity;}
   if(equity<=this.state.dayStart*(1-POLICY.dailyLoss)||equity<=this.state.peak*(1-POLICY.drawdown)){this.state.paused=true;this.state.pauseReason='Paper loss limit reached; manual review required';}
   const btc:any=markets.find(m=>m.symbol==='BTC');
   for(const m of markets as any[]){if(m.error)continue;
    for(const horizon of [4,24,120]){
     if(this.state.records.length>=20000)break;
     const id=`${POLICY.version}:${m.symbol}:${horizon}:${m.bars.at(-1).time}`;if(this.state.records.some(r=>r.id===id))continue;
     const side=m.signal.side as Side|null;let reason=m.signal.reason;let plan:any=null;
     const open=this.state.records.filter(r=>r.status==='open');const entry=side==='short'?m.bid:m.ask;const stop=entry*(1+(side==='short'?1:-1)*m.signal.stopFraction);
     if(side&&equity>0)plan=sizeTrade({equity,entry,stop,side,leverage:1,hours:horizon,step:10**-m.rule.lotDecimals,minQuantity:m.rule.orderMin,minCost:m.rule.costMin,availableCollateral:Math.max(0,equity-open.reduce((s,r)=>s+r.collateral!,0))});
     const blocked=!side||!plan?.eligible||this.state.paused||maintenance(now)||markets.some(m=>m.error)||open.length>=POLICY.maxPositions||open.some(r=>r.symbol===m.symbol)||open.reduce((s,r)=>s+r.risk!,0)+(plan?.risk??0)>equity*POLICY.aggregateRisk||side==='long'&&btc?.signal?.side!=='long';
     if(side&&blocked)reason=this.state.pauseReason??'Entry rejected: data, maintenance, BTC regime, minimum size or correlated risk gate';
     // No demonstrated incremental advantage: leverage remains 1×. Shorts are synthetic margin research.
     this.state.records.push({id,symbol:m.symbol,at:now,horizon,side,reason,status:blocked?'rejected':'open',entry,stop,target:entry*(1+(side==='short'?-1:1)*m.signal.stopFraction*2),quantity:plan?.quantity??0,risk:plan?.risk??0,collateral:plan?.collateral??0,leverage:1,coverageComplete:true,lastSeen:now,mark:entry});
    }
   }
   // Stop admission before bounded storage fills; retain every record for audit.
   if(this.state.records.length>=20000){this.state.paused=true;this.state.pauseReason='Ledger capacity reached; archive review required';}
   if(markets.every(m=>!m.error)){this.state.lastSuccess=now;this.error=null;}else this.error='One or more tactical feeds unavailable';this.save();
  }catch(e){this.error=e instanceof Error?e.message:'Tactical observer unavailable';for(const r of this.state.records.filter(r=>r.status==='open'))r.coverageComplete=false;try{this.save();}catch{this.state.paused=true;this.state.pauseReason='Ledger persistence failed';}}
  finally{this.busy=false;}
 }
}
