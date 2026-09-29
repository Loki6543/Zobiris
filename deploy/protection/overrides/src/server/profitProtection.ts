import Database from 'better-sqlite3';
import { createHash, randomUUID } from 'node:crypto';

export const protectionPolicy = {
 version:'path-tracking-v1', status:'UNVALIDATED_SCENARIOS', executionEnabled:false,
 drawdownReviewPct:[5,8,12,15], recoveryDrawdownPct:10, recoveryPeakFraction:0.9,
 profitGivebackFraction:0.3,
 harvestLadder:[{gainPct:25,originalPositionPct:10},{gainPct:50,originalPositionPct:15},{gainPct:75,originalPositionPct:15},{gainPct:100,originalPositionPct:20},{gainPct:150,originalPositionPct:15},{gainPct:200,originalPositionPct:10}],
 runnerPct:15,
 atrMultipliers:[{gainBelowPct:0,multiple:null},{gainBelowPct:25,multiple:3},{gainBelowPct:50,multiple:2.75},{gainBelowPct:100,multiple:2.5},{gainBelowPct:200,multiple:2},{gainBelowPct:null,multiple:1.75}],
 modes:['TREND: hold and trail','DISTRIBUTION: review partial harvest','EXIT: review trend/support break'],
 validation:'No exit recommendation or automatic order. Requires complete candles, reconciled fills, fees/slippage and out-of-sample testing.',
};
export type PathState={start:number;current:number;peak:number;trough:number;episodeDrawdownPct:number;maxDrawdownPct:number;recoveryLock:boolean;startedAt:string;updatedAt:string;peakAt:string;samples:number};
export function advancePath(previous:PathState|null,value:number,at:string):PathState {
 if(!Number.isFinite(value)||value<=0)throw new Error('Positive finite value required');
 if(!previous)return {start:value,current:value,peak:value,trough:value,episodeDrawdownPct:0,maxDrawdownPct:0,recoveryLock:false,startedAt:at,updatedAt:at,peakAt:at,samples:1};
 const p={...previous,current:value,updatedAt:at,samples:previous.samples+1};
 if(previous.episodeDrawdownPct+1e-9>=protectionPolicy.recoveryDrawdownPct&&value>previous.trough&&value>=previous.peak*protectionPolicy.recoveryPeakFraction)p.recoveryLock=true;
 if(value>p.peak){p.peak=value;p.peakAt=at;p.trough=value;p.episodeDrawdownPct=0;}
 else {p.trough=Math.min(p.trough,value);p.episodeDrawdownPct=Math.max(p.episodeDrawdownPct,(1-value/p.peak)*100);}
 p.maxDrawdownPct=Math.max(p.maxDrawdownPct,p.episodeDrawdownPct);
 if(p.episodeDrawdownPct+1e-9>=protectionPolicy.recoveryDrawdownPct&&value>p.trough&&value>=p.peak*protectionPolicy.recoveryPeakFraction)p.recoveryLock=true;
 return p;
}
export function pathMetrics(p:PathState,basis:number|null){
 const validBasis=basis!=null&&Number.isFinite(basis)&&basis>0?basis:null;
 const pnlPct=validBasis==null?null:(p.current/validBasis-1)*100;
 const peakPnlPct=validBasis==null?null:(p.peak/validBasis-1)*100;
 return {...p,returnSinceTrackingPct:(p.current/p.start-1)*100,drawdownPct:(1-p.current/p.peak)*100,recoveryPct:(p.current/p.trough-1)*100,
 pnlPct,peakPnlPct,profitGivebackPoints:pnlPct==null||peakPnlPct==null?null:peakPnlPct-pnlPct,
 profitGivebackPct:validBasis!=null&&p.peak>validBasis?(p.peak-p.current)/(p.peak-validBasis)*100:null,
 scenarioProfitFloor:validBasis!=null&&p.peak>validBasis?validBasis+(p.peak-validBasis)*(1-protectionPolicy.profitGivebackFraction):null,
 scenarioDrawdownFloor:p.peak*0.92,
 state:p.recoveryLock?'RECOVERY PROTECTION':p.episodeDrawdownPct>=10?'DRAWDOWN REVIEW':p.current>=p.peak?'OBSERVED HIGH':'TRACKING',
 };
}
type Account={privateAccountSynced:boolean;capturedAt:string;cashUsd:number;lastError?:string|null;holdings:{symbol:string;quantity:number;avgPriceUsd:number|null}[]};
const parse=(v:any)=>{if(typeof v!=='string')return v;try{return JSON.parse(v);}catch{return null;}};
const fresh=(v:unknown,now:number,maxAge:number)=>{const t=typeof v==='number'?v:Date.parse(String(v));return Number.isFinite(t)&&t<=now&&now-t<=maxAge;};
const hash=(v:unknown)=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
export function initializeProtection(db:Database.Database){
 db.exec(`CREATE TABLE IF NOT EXISTS protection_state(scope TEXT PRIMARY KEY,segment TEXT NOT NULL,body TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS protection_samples(scope TEXT NOT NULL,segment TEXT NOT NULL,at TEXT NOT NULL,value REAL NOT NULL,observation_key TEXT NOT NULL,PRIMARY KEY(scope,segment,observation_key));
 CREATE TABLE IF NOT EXISTS protection_context(symbol TEXT PRIMARY KEY,body TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS protection_meta(id INTEGER PRIMARY KEY CHECK(id=1),body TEXT NOT NULL);`);
}
function writeScope(db:Database.Database,scope:string,signature:string,value:number,at:string,basis:number|null,context:unknown,observationKey=at){
 const row=db.prepare('SELECT body FROM protection_state WHERE scope=?').get(scope) as {body:string}|undefined;
 const old=row?JSON.parse(row.body):null;
 const same=old?.signature===signature;
 // A new segment gets a unique identity even when returning to an earlier balance.
 const segment=same?old.segment:randomUUID();
 if(same&&(observationKey===old.observationKey||at<old.path.updatedAt))return;
 const body={scope,signature,segment,basis,context,observationKey,path:advancePath(same?old.path:null,value,at)};
 db.prepare('INSERT OR IGNORE INTO protection_samples VALUES(?,?,?,?,?)').run(scope,segment,at,value,observationKey);
 db.prepare('INSERT OR REPLACE INTO protection_state VALUES(?,?,?)').run(scope,segment,JSON.stringify(body));
}
export function sampleProtection(db:Database.Database,account:Account,snapshot:any,now=Date.now()){
 const snapshotFresh=fresh(snapshot?.asOf,now,6*3600000);
 const accountFresh=account.privateAccountSynced&&!account.lastError&&fresh(account.capturedAt,now,5*60000);
 const prior=db.prepare('SELECT body FROM protection_meta WHERE id=1').get() as {body:string}|undefined;
 const metadata:any={checkedAt:new Date(now).toISOString(),accountAt:account.capturedAt,marketAt:snapshot?.asOf??null,status:accountFresh&&snapshotFresh?'TRACKING':'WAITING_FOR_FRESH_DATA',missingPrices:[],activeSymbols:accountFresh?account.holdings.filter(h=>h.quantity>0).map(h=>h.symbol):prior?JSON.parse(prior.body).activeSymbols:[],regime:snapshot?.regime??'Unknown'};
 const holdings=account.holdings.filter(h=>Number.isFinite(h.quantity)&&h.quantity>0).sort((a,b)=>a.symbol.localeCompare(b.symbol));
 if(accountFresh)db.transaction(()=>{
  // A closed position must not inherit its old peak when later reopened.
  const currentScopes=db.prepare("SELECT scope,body FROM protection_state WHERE scope != 'PORTFOLIO'").all() as {scope:string;body:string}[];
  for(const row of currentScopes){const holding=holdings.find(h=>h.symbol===row.scope);if(!holding||JSON.parse(row.body).signature!==hash([holding.quantity,holding.avgPriceUsd]))db.prepare('DELETE FROM protection_state WHERE scope=?').run(row.scope);}
  const portfolioSignature=hash([account.cashUsd,holdings.map(h=>[h.symbol,h.quantity])]);
  const priorPortfolio=db.prepare("SELECT body FROM protection_state WHERE scope='PORTFOLIO'").get() as {body:string}|undefined;
  if(priorPortfolio&&JSON.parse(priorPortfolio.body).signature!==portfolioSignature)db.prepare("DELETE FROM protection_state WHERE scope='PORTFOLIO'").run();
 })();
 if(!accountFresh||!snapshotFresh){db.prepare('INSERT OR REPLACE INTO protection_meta VALUES(1,?)').run(JSON.stringify(metadata));return;}
 const ranked=parse(snapshot.rankedAssets);
 const assets=new Map<string,any>((Array.isArray(ranked)?ranked:[]).map((a:any)=>[a.symbol,a]));

 const marks:{symbol:string;qty:number;price:number;at:string;basis:number|null;context:any}[]=[];
 for(const h of holdings){
  const asset=assets.get(h.symbol);
  const observations=asset?.mappingStatus==='verified'?(asset?.strategy21?.explanation?.observations??[]):[];
  const o=[...observations].filter((o:any)=>fresh(o.observedAt,now,6*3600000)&&Date.parse(o.expiresAt)>now).sort((a:any,b:any)=>Date.parse(b.observedAt)-Date.parse(a.observedAt)).find((o:any)=>{const p=parse(o.claim)?.priceUsd;return typeof p==='number'&&Number.isFinite(p)&&p>0;});
  if(!o){metadata.missingPrices.push(h.symbol);continue;}
  const claim=parse(o.claim);
  marks.push({symbol:h.symbol,qty:h.quantity,price:claim.priceUsd,at:new Date(o.observedAt).toISOString(),basis:h.avgPriceUsd,context:{marketRegime:snapshot.regime??null,setupScore:asset.strategy21?.researchScore??null,priceObservedAt:o.observedAt,atr:null,trend:null,momentum:null,volumeConfirmation:null,exitPressure:null}});
 }
 db.transaction(()=>{
  for(const m of marks)writeScope(db,m.symbol,hash([m.qty,m.basis]),m.price,m.at,m.basis,m.context);
  if(!metadata.missingPrices.length&&marks.length&&Number.isFinite(account.cashUsd)&&account.cashUsd>=0){
   const value=account.cashUsd+marks.reduce((n,m)=>n+m.qty*m.price,0);
   const at=new Date(Math.max(...marks.map(m=>Date.parse(m.at)))).toISOString();
   const signature=hash([account.cashUsd,holdings.map(h=>[h.symbol,h.quantity])]);
   writeScope(db,'PORTFOLIO',signature,value,at,null,{cashUsd:account.cashUsd,priceTimes:marks.map(m=>({symbol:m.symbol,at:m.at})),marketRegime:snapshot.regime??null},hash(marks.map(m=>[m.symbol,m.at,m.price])));
  }else metadata.status='PARTIAL_COVERAGE';
  db.prepare('INSERT OR REPLACE INTO protection_meta VALUES(1,?)').run(JSON.stringify(metadata));
 })();
}
export function readProtection(db:Database.Database,now=Date.now()){
 const row=db.prepare('SELECT body FROM protection_meta WHERE id=1').get() as {body:string}|undefined;
 const meta=row?JSON.parse(row.body):{status:'COLLECTING',missingPrices:[],activeSymbols:[]};
 const contexts=new Map((db.prepare('SELECT symbol,body FROM protection_context').all() as {symbol:string;body:string}[]).map(r=>[r.symbol,JSON.parse(r.body)]));
 const rows=db.prepare('SELECT body FROM protection_state ORDER BY scope').all() as {body:string}[];
 const paths=rows.map(r=>JSON.parse(r.body)).map(r=>({symbol:r.scope,segment:r.segment,context:{...r.context,daily:contexts.get(r.scope)??null},...pathMetrics(r.path,r.basis),priceAvailable:!meta.missingPrices.includes(r.scope)&&meta.status!=='WAITING_FOR_FRESH_DATA',stale:!fresh(r.path.updatedAt,now,6*3600000)}));
 return {version:protectionPolicy.version,...meta,status:meta.checkedAt&&!fresh(meta.checkedAt,now,5*60000)?'STALE_TRACKER':meta.status,portfolio:meta.status==='TRACKING'?paths.find(p=>p.symbol==='PORTFOLIO')??null:null,positions:paths.filter(p=>p.symbol!=='PORTFOLIO'&&meta.activeSymbols.includes(p.symbol)),policy:protectionPolicy,
 limitations:['Observed history begins when tracking starts; intraperiod peaks may be missed.','Portfolio segment resets on any cash or holding change. This is not lifetime or cash-flow-adjusted performance.','Reported average costs may be incomplete; P/L is indicative, not audited.','Daily ATR/trend/momentum/volume inputs require supported, complete Kraken candles. SuperTrend and calibrated exit pressure remain unavailable.','Historical backtest and ladder fill reconciliation are pending; thresholds are research scenarios only.']};
}
export function openProtection(path:string){const db=new Database(path+'.profit-protection.sqlite');db.pragma('journal_mode = WAL');db.pragma('busy_timeout = 3000');initializeProtection(db);return db;}
