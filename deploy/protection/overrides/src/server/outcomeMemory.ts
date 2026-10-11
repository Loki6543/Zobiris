import {entryReference} from '../shared/entryPlan.js';
import { appendFile, mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { assertBound, loadRegistry, stampEpisode, statusLabel, structuralBreakFlags } from "./policy/zobirisPolicyBinding.js";

const OUTCOME_POLICY_REGISTRY = (() => {
  try {
    return loadRegistry(fileURLToPath(new URL("./policy/zobiris-policy-registry-v3.1.json", import.meta.url)));
  } catch {
    return null;
  }
})();

export type OutcomeHorizon = "1H" | "4H" | "1D" | "3D" | "7D";

export interface OutcomeEvaluation {
  status?: "PENDING" | "RESOLVED" | "EXPIRED";
  priceObservedAt?: string;
  benchmarkReturnPct?:number|null;
  horizon: OutcomeHorizon;
  dueAt: string;
  evaluatedAt: string | null;
  priceUsd: number | null;
  returnPct: number | null;
}

export interface DecisionOutcomeRecord {
  measurementVersion?: "episodes-v2";
  /** New prospective measurement: QUALIFIED onsets spaced apart from other cohort states. */
  samplingRule?: "COHORT_SPACED_7D";
  decisionTime?: string;
  registryVersion?: string;
  policyHash?: string;
  evidenceClass?: string;
  feeScheduleVersion?: string;
  accountFeeTierAssumption?: string;
  makerTakerPath?: string;
  structuralBreakFlags?: string[];
  setupFamily?: string;
  sizeTier?: string;
  liquidityTier?: string;
  metadataProvenance?: string;
  proposedLimitUsd?:number|null;
  sampledTouchAt?:string|null;
  actualFill?:null;
  benchmarkPriceUsd?:number|null;
  outcomeId: string;
  symbol: string;
  generatedAt: string;
  referencePriceObservedAt?: string | null;
  regime?: string | null;
  action: string;
  assetState: string;
  referencePriceUsd: number;
  opportunityScore: number | null;
  researchScore: number;
  evidenceQuality: number;
  thesisId: string;
  strategyTag?: string;
  strategyStatus?: string;
  recommendedPullbackPct?: number | null;
  maxFavorablePct: number;
  maxAdversePct: number;
  evaluations: OutcomeEvaluation[];
}

interface OutcomeFile {
  version: "1.0";
  archivedRecordCount?:number;
  updatedAt: string;
  records: DecisionOutcomeRecord[];
}

export interface SnapshotLike {
  asOf: string;
  regime?: string;
  rankedAssets: Array<{
    symbol: string;
    strategy21?: {
      researchIntegrity?: {
        outcomeSeed?: {
          outcomeId?: string;
          symbol?: string;
          generatedAt?: string;
          action?: string;
          assetState?: string;
          referencePriceUsd?: number | null;
          priceObservedAt?:string|null;
          opportunityScore?: number | null;
          researchScore?: number;
          evidenceQuality?: number;
          thesisId?: string;
          strategyTag?: string;
          strategyStatus?: string;
          recommendedPullbackPct?: number | null;
          horizons?: Array<{ horizon: OutcomeHorizon; dueAt: string }>;
        };
      };
    };
  }>;
}

const HORIZON_MS:Record<OutcomeHorizon,number>={'1H':3600000,'4H':4*3600000,'1D':86400000,'3D':3*86400000,'7D':7*86400000};
const emptyFile = (): OutcomeFile => ({
  version: "1.0",
  updatedAt: new Date(0).toISOString(),
  records: [],
});

async function loadFile(path: string): Promise<OutcomeFile> {
  try {
    const parsed = JSON.parse(await readFile(path, "utf8"));
    if (parsed?.version !== "1.0" || !Array.isArray(parsed?.records)) throw new Error("Outcome history format is invalid; refusing to overwrite");
    return {
      version: "1.0",
      updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : new Date(0).toISOString(),
      records: parsed.records,
      archivedRecordCount:parsed.archivedRecordCount??0,
    };
  } catch(error:any) {
    if(error?.code!=="ENOENT")throw error;
    return emptyFile();
  }
}

async function saveFile(path: string, data: OutcomeFile): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  const tmp = `${path}.tmp`;
  await writeFile(tmp, JSON.stringify(data, null, 2), "utf8");
  await rename(tmp, path);
}

function finitePositive(value: unknown): number | null {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
}

function returnPct(reference: number, current: number): number {
  return ((current / reference) - 1) * 100;
}

function seedToRecord(seed: NonNullable<NonNullable<NonNullable<SnapshotLike["rankedAssets"][number]["strategy21"]>["researchIntegrity"]>["outcomeSeed"]>): DecisionOutcomeRecord | null {
  const referencePriceUsd = finitePositive(seed.referencePriceUsd);
  if (!seed.outcomeId || !seed.symbol || !seed.generatedAt || !referencePriceUsd || !seed.thesisId) return null;
  const horizons = Array.isArray(seed.horizons) ? seed.horizons : [];
  const base = {
    measurementVersion:"episodes-v2" as const,
    samplingRule:"COHORT_SPACED_7D" as const,
    decisionTime: seed.generatedAt,
    proposedLimitUsd:entryReference(referencePriceUsd,seed.recommendedPullbackPct),
    sampledTouchAt:null,actualFill:null,
    outcomeId: seed.outcomeId,
    symbol: seed.symbol.toUpperCase(),
    generatedAt: seed.generatedAt,
    referencePriceObservedAt: typeof seed.priceObservedAt === "string" ? seed.priceObservedAt : null,
    action: String(seed.action ?? "UNKNOWN"),
    assetState: String(seed.assetState ?? "UNKNOWN"),
    referencePriceUsd,
    opportunityScore: Number.isFinite(Number(seed.opportunityScore)) ? Number(seed.opportunityScore) : null,
    researchScore: Number.isFinite(Number(seed.researchScore)) ? Number(seed.researchScore) : 0,
    evidenceQuality: Number.isFinite(Number(seed.evidenceQuality)) ? Number(seed.evidenceQuality) : 0,
    thesisId: seed.thesisId,
    ...(seed.strategyTag ? { strategyTag: seed.strategyTag } : {}),
    ...(seed.strategyStatus ? { strategyStatus: seed.strategyStatus } : {}),
    ...(seed.recommendedPullbackPct != null ? { recommendedPullbackPct: Number(seed.recommendedPullbackPct) } : {}),
    maxFavorablePct: 0,
    maxAdversePct: 0,
    evaluations: horizons.map((item) => ({
      status:"PENDING",
      horizon: item.horizon,
      dueAt: item.dueAt,
      evaluatedAt: null,
      priceUsd: null,
      returnPct: null,
    })),
  };
  if (!OUTCOME_POLICY_REGISTRY) return null;
  const proposed = OUTCOME_POLICY_REGISTRY.registry.feeSchedule?.sidecarPolicyProposed ?? {};
  const stamped = stampEpisode(OUTCOME_POLICY_REGISTRY, base, {
    evidenceClass: "QUOTE_OUTCOME_ONLY",
    feeScheduleVersion: OUTCOME_POLICY_REGISTRY.registry.feeSchedule?.scheduleId ?? "UNKNOWN",
    accountFeeTierAssumption: proposed.accountFeeTierAssumption ?? "UNKNOWN",
    makerTakerPath: "MAKER_TAKER",
    structuralBreakFlags: structuralBreakFlags(OUTCOME_POLICY_REGISTRY, seed.generatedAt),
  });
  assertBound(stamped);
  return stamped as DecisionOutcomeRecord;
}

export interface OutcomeQuote { symbol: string; priceUsd: number; observedAt: string }

async function updateMemory(path: string, snapshot: SnapshotLike, observations?: OutcomeQuote[]): Promise<OutcomeFile> {
  const data = await loadFile(path);
  const asOfMs = Date.parse(snapshot.asOf);
  if (!Number.isFinite(asOfMs)) return data;

  // Quotes retain their actual observation time; a refreshed snapshot is not a fresh quote.
  const currentPrices = new Map<string, {price:number;at:number}>();
  for (const asset of snapshot.rankedAssets ?? []) {
    const seed=asset.strategy21?.researchIntegrity?.outcomeSeed;
    const price=finitePositive(seed?.referencePriceUsd),at=Date.parse(seed?.priceObservedAt??'');
    if(price&&Number.isFinite(at)&&at<=asOfMs&&asOfMs-at<=15*60000)currentPrices.set(String(asset.symbol).toUpperCase(),{price,at});
  }
  for (const q of observations ?? []) {
    const at=Date.parse(q.observedAt);
    if(Number.isFinite(q.priceUsd)&&q.priceUsd>0&&Number.isFinite(at)&&at<=asOfMs&&asOfMs-at<=15*60000) currentPrices.set(q.symbol.toUpperCase(),{price:q.priceUsd,at});
  }
  for (const record of data.records) {
    // Preserve old history but never mix legacy overlapping/late observations into the new cohort.
    if(record.measurementVersion!=='episodes-v2')continue;
    const quote=currentPrices.get(record.symbol),generatedMs=Date.parse(record.generatedAt);
    const ageMs=asOfMs-generatedMs;
    if(!Number.isFinite(generatedMs)||ageMs<0)continue;
    if(quote&&quote.at>generatedMs&&ageMs<=7*86400000){
      const change=returnPct(record.referencePriceUsd,quote.price);
      record.maxFavorablePct=Math.max(record.maxFavorablePct,change);
      record.maxAdversePct=Math.min(record.maxAdversePct,change);
      if(record.proposedLimitUsd!=null&&quote.price<=record.proposedLimitUsd&&!record.sampledTouchAt)record.sampledTouchAt=new Date(quote.at).toISOString();
    }
    for(const evaluation of record.evaluations){
      if(evaluation.evaluatedAt||evaluation.status==='EXPIRED')continue;
      const due=Date.parse(evaluation.dueAt),window=HORIZON_MS[evaluation.horizon]*0.25;
      if(!Number.isFinite(due)||!window||due>asOfMs)continue;
      if(quote&&quote.at>=due&&quote.at<=due+window){
        evaluation.status='RESOLVED';evaluation.evaluatedAt=snapshot.asOf;
        evaluation.priceObservedAt=new Date(quote.at).toISOString();evaluation.priceUsd=quote.price;
        evaluation.returnPct=returnPct(record.referencePriceUsd,quote.price);
        const btc=currentPrices.get('BTC');
        evaluation.benchmarkReturnPct=btc&&record.benchmarkPriceUsd&&btc.at>=due&&btc.at<=due+window&&Math.abs(btc.at-quote.at)<=5*60000?returnPct(record.benchmarkPriceUsd,btc.price):null;
      }else if(asOfMs>due+window)evaluation.status='EXPIRED';
    }
  }

  const known = new Set(data.records.map((record) => record.outcomeId));
  for (const asset of snapshot.rankedAssets ?? []) {
    const seed = asset.strategy21?.researchIntegrity?.outcomeSeed;
    if (!seed?.outcomeId || known.has(seed.outcomeId)) continue;
    const record = seedToRecord(seed);
    if (!record) continue;
    record.regime = typeof snapshot.regime === "string" ? snapshot.regime : null;
    const generated=Date.parse(record.generatedAt),quote=currentPrices.get(record.symbol);
    if(!quote||!Number.isFinite(generated)||generated>asOfMs||asOfMs-generated>15*60000)continue;
    const cohort = (status?:string) => status === 'QUALIFIED' ? 'QUALIFIED' : 'OTHER';
    if(data.records.some(r=>r.measurementVersion==='episodes-v2'&&r.symbol===record.symbol
        &&cohort(r.strategyStatus)===cohort(record.strategyStatus)
        &&Math.abs(generated-Date.parse(r.generatedAt))<7*86400000))continue;
    const btc=currentPrices.get('BTC');
    record.benchmarkPriceUsd=btc&&Math.abs(btc.at-quote.at)<=5*60000?btc.price:null;
    data.records.push(record);
    known.add(record.outcomeId);
  }

  data.records.sort((a, b) => Date.parse(a.generatedAt) - Date.parse(b.generatedAt));
  if (data.records.length > 5000) {
    const overflow=data.records.slice(0,-5000);
    await mkdir(dirname(path),{recursive:true});
    // Archive before pruning. A crash may duplicate archive lines, but cannot silently lose history.
    await appendFile(path+'.archive.jsonl',overflow.map(r=>JSON.stringify(r)).join('\n')+'\n','utf8');
    data.archivedRecordCount=(data.archivedRecordCount??0)+overflow.length;
    data.records=data.records.slice(-5000);
  }
  data.updatedAt = snapshot.asOf;
  await saveFile(path, data);
  return data;
}

export async function readOutcomeMemory(path: string, symbol?: string): Promise<OutcomeFile> {
  const data = await loadFile(path);
  if (!symbol) return data;
  const normalized = symbol.toUpperCase();
  return { ...data, records: data.records.filter((record) => record.symbol === normalized) };
}

export function summarizeOutcomeMemory(records: DecisionOutcomeRecord[]) {
  const horizons: OutcomeHorizon[] = ["1H", "4H", "1D", "3D", "7D"];
  const byHorizon = Object.fromEntries(horizons.map((horizon) => {
    const values = records
      .flatMap((record) => record.evaluations)
      .filter((evaluation) => evaluation.horizon === horizon && evaluation.returnPct != null)
      .map((evaluation) => evaluation.returnPct as number);
    const count = values.length;
    return [horizon, {
      count,
      averageReturnPct: count ? values.reduce((sum, value) => sum + value, 0) / count : null,
      positiveRate: count ? values.filter((value) => value > 0).length / count : null,
    }];
  }));
  const resolvedRecords = records.filter((record) => record.evaluations.some((evaluation) => evaluation.returnPct != null));
  return {
    recordCount: records.length,
    resolvedRecordCount: resolvedRecords.length,
    byHorizon,
    averageMaxFavorablePct: resolvedRecords.length
      ? resolvedRecords.reduce((sum, record) => sum + record.maxFavorablePct, 0) / resolvedRecords.length
      : null,
    averageMaxAdversePct: resolvedRecords.length
      ? resolvedRecords.reduce((sum, record) => sum + record.maxAdversePct, 0) / resolvedRecords.length
      : null,
  };
}


// Serialize updates per file so overlapping refreshes cannot drop episodes or corrupt atomic writes.
const queues=new Map<string,Promise<unknown>>();
export async function updateOutcomeMemory(path:string,snapshot:SnapshotLike):Promise<OutcomeFile>{
 const next=(queues.get(path)??Promise.resolve()).catch(()=>undefined).then(()=>updateMemory(path,snapshot));
 queues.set(path,next);try{return await next;}finally{if(queues.get(path)===next)queues.delete(path);}
}
export async function updateOutcomeObservations(path:string,quotes:OutcomeQuote[],receivedAt:string):Promise<void>{
 const next=(queues.get(path)??Promise.resolve()).catch(()=>undefined).then(()=>updateMemory(path,{asOf:receivedAt,rankedAssets:[]},quotes));
 queues.set(path,next);try{await next;}finally{if(queues.get(path)===next)queues.delete(path);}
}
export function pilotScorecard(data:OutcomeFile,now=Date.now()){
 const episodes=data.records.filter(r=>r.measurementVersion==='episodes-v2');
 const group=(records:DecisionOutcomeRecord[])=>{
  const horizons=Object.fromEntries(Object.keys(HORIZON_MS).map(h=>{
   const due=records.flatMap(r=>r.evaluations.filter(e=>e.horizon===h&&Date.parse(e.dueAt)<=now));
   const resolved=due.filter(e=>e.status==='RESOLVED'&&e.returnPct!=null);
   const relative=resolved.filter(e=>e.benchmarkReturnPct!=null);
   return [h,{due:due.length,resolved:resolved.length,expired:due.filter(e=>e.status==='EXPIRED').length,unresolvedPct:due.length?(due.length-resolved.length)/due.length*100:null,
    averageReturnPct:resolved.length?resolved.reduce((n,e)=>n+e.returnPct!,0)/resolved.length:null,
    benchmarkMatched:relative.length,averageExcessVsBtcPct:relative.length?relative.reduce((n,e)=>n+e.returnPct!-e.benchmarkReturnPct!,0)/relative.length:null}];
  }));
  return {episodes:records.length,horizons,sampledTouches:records.filter(r=>r.sampledTouchAt).length,proposedLimits:records.filter(r=>r.proposedLimitUsd!=null).length,
   averageSampledMfePct:records.length?records.reduce((n,r)=>n+r.maxFavorablePct,0)/records.length:null,averageSampledMaePct:records.length?records.reduce((n,r)=>n+r.maxAdversePct,0)/records.length:null};
 };
 const qualified=group(episodes.filter(r=>r.symbol!=='BTC'&&r.strategyStatus==='QUALIFIED'));
 const nonqualifying=group(episodes.filter(r=>r.symbol!=='BTC'&&r.strategyStatus&&r.strategyStatus!=='QUALIFIED'&&r.strategyStatus!=='DATA_INSUFFICIENT'));
 const evidenceClass='QUOTE_OUTCOME_ONLY';
 return {status:'SHADOW_ONLY_NO_VERDICT',statusLabel:statusLabel('SHADOW_ONLY_NO_VERDICT',evidenceClass),evidenceClass,registryVersion:OUTCOME_POLICY_REGISTRY?.registryVersion??null,policyHash:OUTCOME_POLICY_REGISTRY?.registrySha256??null,updatedAt:data.updatedAt,qualified,nonqualifying,benchmark:group(episodes.filter(r=>r.symbol==='BTC')),
  legacyExcluded:data.records.length-episodes.length,archivedRecordCount:data.archivedRecordCount??0,
  actualFills:null,fillProbability:null,missedFillRegret:null,
  limitations:['Seven-day spacing now applies within QUALIFIED and other cohorts (COHORT_SPACED_7D); two cohorts may share overlapping market paths. Record sampling-rule changes before comparing cohorts; correlated coins are not statistically independent.',
   'Horizons use the first observed quote within 25% of the due horizon, not an exact historical candle. Later observations expire.',
   'Returns and excursions use sampled spot prices, before fees. Sparse observations miss intraperiod highs/lows and limit touches.',
   'A sampled touch is not a real fill. Limit prices are unrounded baseline research priors, without personal re-entry adjustments or order authority.',
   'No verdict before at least 30 resolved episodes in each comparison group, acceptable coverage (at most 10% unresolved), and a separate validation review.',
   'Archive preserves older records outside this active-window scorecard; no lifetime performance claim. Real fills and missed-fill regret require reconciled order and candle evidence.']};
}
