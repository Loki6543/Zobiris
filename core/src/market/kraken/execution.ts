import { ZOBIRIS_POLICY } from "../../policy/config.js";

export interface BookLevel { price: number; qty: number }
export interface NormalizedBook {
  pair: string;
  observedAt: string;
  bids: BookLevel[];
  asks: BookLevel[];
}
export interface BookWalk {
  side: "buy" | "sell";
  requestedUsd: number;
  executedUsd: number;
  executedQty: number;
  complete: boolean;
  midpoint: number | null;
  vwap: number | null;
  impactBps: number | null;
  worstPrice: number | null;
}
export type MarketDepthGrade = "INSTITUTIONAL" | "DEEP" | "NORMAL" | "SMALL_SIZE_ONLY" | "VERY_THIN";

function validLevels(levels: BookLevel[], descending: boolean): BookLevel[] {
  return levels.filter(x => Number.isFinite(x.price) && x.price > 0 && Number.isFinite(x.qty) && x.qty > 0)
    .sort((a,b) => descending ? b.price-a.price : a.price-b.price);
}
export function midpoint(book: NormalizedBook): number | null {
  const bids=validLevels(book.bids,true), asks=validLevels(book.asks,false);
  if (!bids[0] || !asks[0] || bids[0].price >= asks[0].price) return null;
  return (bids[0].price + asks[0].price) / 2;
}
export function walkBook(book: NormalizedBook, side: "buy" | "sell", requestedUsd: number): BookWalk {
  const mid=midpoint(book);
  if (!(requestedUsd > 0) || mid == null) return { side, requestedUsd, executedUsd:0, executedQty:0, complete:false, midpoint:mid, vwap:null, impactBps:null, worstPrice:null };
  const levels=side==="buy" ? validLevels(book.asks,false) : validLevels(book.bids,true);
  let remaining=requestedUsd, executedUsd=0, executedQty=0, worstPrice:null|number=null;
  for (const level of levels) {
    if (remaining <= 0.005) break;
    const availableUsd=level.price*level.qty;
    const takeUsd=Math.min(remaining,availableUsd);
    const takeQty=takeUsd/level.price;
    executedUsd+=takeUsd; executedQty+=takeQty; remaining-=takeUsd; worstPrice=level.price;
  }
  const complete=remaining <= Math.max(0.01, requestedUsd*1e-8);
  const vwap=executedQty>0 ? executedUsd/executedQty : null;
  const impactBps=vwap==null ? null : side==="buy" ? (vwap/mid-1)*10000 : (1-vwap/mid)*10000;
  return { side, requestedUsd, executedUsd, executedQty, complete, midpoint:mid, vwap, impactBps, worstPrice };
}

export interface PersonalExecutionResult {
  fresh: boolean;
  hardPass: boolean;
  maxImpactBps: number;
  standardBuy: BookWalk;
  standardSell: BookWalk;
  proposedBuy: BookWalk;
  positionSell: BookWalk | null;
  stress: Record<"500"|"2500"|"50000"|"250000", { buy: BookWalk; sell: BookWalk }>;
  marketDepthGrade: MarketDepthGrade;
  minimumOrderUsd: number | null;
  proposedOrderMeetsMinimum: boolean;
  positionExitMeetsMinimum: boolean | null;
  reasonCodes: string[];
}

function walkPass(walk: BookWalk, maxImpactBps: number) {
  return walk.complete && walk.impactBps != null && walk.impactBps <= maxImpactBps;
}

export function evaluatePersonalExecution(book: NormalizedBook, args: {
  asOf: string;
  proposedOrderUsd: number;
  currentPositionUsd?: number;
  standardUsd?: number;
  maxImpactBps?: number;
  maxAgeMs?: number;
  costMinUsd?: number | null;
  orderMinBase?: number | null;
}): PersonalExecutionResult {
  const standardUsd=args.standardUsd ?? ZOBIRIS_POLICY.execution.standardTestUsd;
  const maxImpactBps=args.maxImpactBps ?? ZOBIRIS_POLICY.execution.maxImpactBps;
  const maxAgeMs=args.maxAgeMs ?? ZOBIRIS_POLICY.execution.maxBookAgeMs;
  const age=Date.parse(args.asOf)-Date.parse(book.observedAt);
  const fresh=Number.isFinite(age) && age >= 0 && age <= maxAgeMs;

  const standardBuy=walkBook(book,"buy",standardUsd);
  const standardSell=walkBook(book,"sell",standardUsd);
  const proposedBuy=walkBook(book,"buy",args.proposedOrderUsd);
  const positionSell=args.currentPositionUsd && args.currentPositionUsd>0 ? walkBook(book,"sell",args.currentPositionUsd) : null;
  const minimumCandidates=[
    args.costMinUsd != null && Number.isFinite(args.costMinUsd) && args.costMinUsd>0 ? args.costMinUsd : null,
    args.orderMinBase != null && Number.isFinite(args.orderMinBase) && args.orderMinBase>0 && standardBuy.midpoint != null
      ? args.orderMinBase*standardBuy.midpoint : null,
  ].filter((value): value is number => value != null);
  const minimumOrderUsd=minimumCandidates.length ? Math.max(...minimumCandidates) : null;
  const proposedOrderMeetsMinimum=minimumOrderUsd==null || args.proposedOrderUsd+1e-9>=minimumOrderUsd;
  const positionExitMeetsMinimum=positionSell==null ? null : minimumOrderUsd==null || args.currentPositionUsd!+1e-9>=minimumOrderUsd;
  const stressSizes=[
    ZOBIRIS_POLICY.execution.stress.smallUsd,
    ZOBIRIS_POLICY.execution.stress.normalUsd,
    ZOBIRIS_POLICY.execution.stress.deepUsd,
    ZOBIRIS_POLICY.execution.stress.institutionalUsd,
  ] as const;
  const stress=Object.fromEntries(stressSizes.map(size => [String(size), { buy: walkBook(book,"buy",size), sell: walkBook(book,"sell",size) }])) as PersonalExecutionResult["stress"];

  const hardPass=fresh && proposedOrderMeetsMinimum && positionExitMeetsMinimum!==false
    && walkPass(standardBuy,maxImpactBps) && walkPass(standardSell,maxImpactBps)
    && walkPass(proposedBuy,maxImpactBps)
    && (!positionSell || walkPass(positionSell,maxImpactBps));

  const stressPairPass=(size:keyof typeof stress,bps:number) => walkPass(stress[size].buy,bps) && walkPass(stress[size].sell,bps);
  const marketDepthGrade: MarketDepthGrade =
    stressPairPass(String(ZOBIRIS_POLICY.execution.stress.institutionalUsd) as keyof typeof stress,ZOBIRIS_POLICY.execution.stress.institutionalMaxBps) ? "INSTITUTIONAL" :
    stressPairPass(String(ZOBIRIS_POLICY.execution.stress.deepUsd) as keyof typeof stress,ZOBIRIS_POLICY.execution.stress.deepMaxBps) ? "DEEP" :
    stressPairPass(String(ZOBIRIS_POLICY.execution.stress.normalUsd) as keyof typeof stress,ZOBIRIS_POLICY.execution.stress.normalMaxBps) ? "NORMAL" :
    stressPairPass(String(ZOBIRIS_POLICY.execution.stress.smallUsd) as keyof typeof stress,ZOBIRIS_POLICY.execution.stress.smallMaxBps) ? "SMALL_SIZE_ONLY" : "VERY_THIN";

  const reasonCodes:string[]=[];
  if(!fresh) reasonCodes.push("stale_book");
  if(!walkPass(standardBuy,maxImpactBps)) reasonCodes.push("standard_buy_execution_fail");
  if(!walkPass(standardSell,maxImpactBps)) reasonCodes.push("standard_sell_execution_fail");
  if(!proposedOrderMeetsMinimum) reasonCodes.push("below_kraken_minimum_order");
  if(positionExitMeetsMinimum===false) reasonCodes.push("position_below_kraken_minimum_order");
  if(!walkPass(proposedBuy,maxImpactBps)) reasonCodes.push("proposed_buy_execution_fail");
  if(positionSell && !walkPass(positionSell,maxImpactBps)) reasonCodes.push("position_exit_execution_fail");

  return { fresh, hardPass, maxImpactBps, standardBuy, standardSell, proposedBuy, positionSell, stress, marketDepthGrade,
    minimumOrderUsd, proposedOrderMeetsMinimum, positionExitMeetsMinimum, reasonCodes };
}
