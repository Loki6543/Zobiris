import type { AssetClassification } from "../../market/classification/classify.js";
import type { MarketDepthGrade, PersonalExecutionResult } from "../../market/kraken/execution.js";
import { DELAYED_ROTATION_POLICY, DELAYED_ROTATION_POLICY_HASH } from "../../policy/delayedRotationPolicy.js";
import { ZOBIRIS_POLICY, ZOBIRIS_POLICY_HASH } from "../../policy/config.js";

export const DELAYED_ROTATION_TAG = ZOBIRIS_POLICY.strategy.tag;
export const DELAYED_ROTATION_VERSION = ZOBIRIS_POLICY.strategy.version;

export type RotationState =
  | "WAIT_FOR_PULLBACK"
  | "READY"
  | "QUALIFIED"
  | "NEAR_ROTATION"
  | "TOO_EARLY"
  | "ALREADY_EXTENDED"
  | "STRUCTURALLY_WEAK"
  | "MARKET_NOT_BULLISH"
  | "LIQUIDITY_FAIL"
  | "RISK_BLOCKED"
  | "EXCLUDED"
  | "DATA_INCOMPLETE";

export interface RotationMarketContext {
  btc7dPct: number | null;
  btc30dPct: number | null;
  btc90dPct: number | null;
  breadth7dPositive: number | null;
  breadth30dPositive: number | null;
}

export interface RotationAssetInput {
  symbol: string;
  priceUsd: number | null;
  change24hPct: number | null;
  change7dPct: number | null;
  change30dPct: number | null;
  change90dPct: number | null;
  classification: AssetClassification;
  execution: Pick<PersonalExecutionResult, "hardPass" | "marketDepthGrade"> | null;
  riskPass: boolean;
}

export interface RotationCapital {
  maneuverNavUsd: number;
  availableCashUsd: number;
  pilotTypicalUsd?: number;
}

export interface RotationDecision {
  strategyTag: typeof DELAYED_ROTATION_TAG;
  strategyVersion: typeof DELAYED_ROTATION_VERSION;
  policyHash: string;
  policyVersion: string;
  policyHash: string;
  symbol: string;
  state: RotationState;
  setupQualified: boolean;
  qualifiesForNewCapital: boolean;
  catchUpQuality: number;
  relative30dVsBtcPct: number | null;
  relative90dVsBtcPct: number | null;
  recommendedPullbackPct: number | null;
  intendedLimitPrice: number | null;
  maxNewOrderUsd: number;
  marketDepthGrade: MarketDepthGrade | null;
  reasonCodes: string[];
}

const clamp=(n:number,min:number,max:number)=>Math.max(min,Math.min(max,n));
const finite=(n:number|null): n is number => n != null && Number.isFinite(n);
const lagQuality=(change:number,ideal:number,span:number)=>clamp(1-Math.abs(change-ideal)/span,0,1);

export function evaluateDelayedRotation(
  market: RotationMarketContext,
  asset: RotationAssetInput,
  capital: RotationCapital,
): RotationDecision {
  const p=ZOBIRIS_POLICY;
  const base=(state:RotationState,reasons:string[],score=0):RotationDecision=>({
    strategyTag:DELAYED_ROTATION_TAG,
    strategyVersion:DELAYED_ROTATION_VERSION,
    policyHash:DELAYED_ROTATION_POLICY_HASH,
    policyVersion:p.version,
    policyHash:ZOBIRIS_POLICY_HASH,
    symbol:asset.symbol.toUpperCase(),
    state,
    setupQualified:false,
    qualifiesForNewCapital:false,
    catchUpQuality:Math.round(score*100)/100,
    relative30dVsBtcPct:null,
    relative90dVsBtcPct:null,
    recommendedPullbackPct:null,
    intendedLimitPrice:null,
    maxNewOrderUsd:0,
    marketDepthGrade:asset.execution?.marketDepthGrade ?? null,
    reasonCodes:reasons,
  });

  if(asset.classification.recommendationExcluded) return base("EXCLUDED",[asset.classification.reason ?? "asset_excluded"]);
  if(![market.btc30dPct,market.btc90dPct,market.breadth7dPositive,market.breadth30dPositive,
    asset.priceUsd,asset.change7dPct,asset.change30dPct,asset.change90dPct].every(finite)) {
    return base("DATA_INCOMPLETE",["required_market_or_asset_history_missing"]);
  }

  const bullish=
    market.btc30dPct!>p.market.btc30dMinPct &&
    market.btc90dPct!>p.market.btc90dMinPct &&
    market.breadth7dPositive!>=p.market.breadth7dPositiveMin &&
    market.breadth30dPositive!>=p.market.breadth30dPositiveMin;
  if(!bullish) return base("MARKET_NOT_BULLISH",["btc_and_watchlist_breadth_not_bullish"]);

  const d7=asset.change7dPct!, d30=asset.change30dPct!, d90=asset.change90dPct!;
  const rel30=d30-market.btc30dPct!;
  const rel90=d90-market.btc90dPct!;
  const recovery=clamp(1-Math.abs(d7-p.catchUp.recoveryIdeal7dPct)/p.catchUp.recoverySpanPct,0,1);
  const lag30=lagQuality(d30,p.catchUp.lag30IdealPct,p.catchUp.lag30SpanPct);
  const lag90=lagQuality(d90,p.catchUp.lag90IdealPct,p.catchUp.lag90SpanPct);
  const rel=clamp((Math.max(0,-rel30)/p.catchUp.relative30ScalePct + Math.max(0,-rel90)/p.catchUp.relative90ScalePct)/2,0,1);
  const depthBonus=asset.execution?.marketDepthGrade
    ? p.catchUp.depthQuality[asset.execution.marketDepthGrade]
    : p.catchUp.depthQuality.VERY_THIN;
  const w=p.catchUp.weights;
  const score=100*(w.recovery*recovery+w.lag30*lag30+w.lag90*lag90+w.relativeLag*rel+w.marketDepth*depthBonus);

  const withRelative=(decision:RotationDecision):RotationDecision=>({...decision,relative30dVsBtcPct:rel30,relative90dVsBtcPct:rel90,catchUpQuality:Math.round(score*100)/100});

  if(d7<=0) return withRelative(base("TOO_EARLY",["seven_day_recovery_not_positive"],score));
  if(d7>p.candidate.maxRecovery7dPct || (asset.change24hPct!=null && asset.change24hPct>p.candidate.maxPositive24hPct)) {
    return withRelative(base("ALREADY_EXTENDED",["recovery_already_too_extended_to_chase"],score));
  }
  if(d30 < p.candidate.minChange30dPct || d90 < p.candidate.minChange90dPct) {
    return withRelative(base("STRUCTURALLY_WEAK",["medium_term_loss_exceeds_pilot_safety_floor"],score));
  }

  const strictLag=d30<=p.candidate.maxChange30dPct && d90<=p.candidate.maxChange90dPct;
  if(!strictLag) {
    if(rel30<=p.candidate.relative30dNearRotationPct || rel90<=p.candidate.relative90dNearRotationPct) {
      return withRelative(base("NEAR_ROTATION",["lagging_btc_but_not_strict_30d_90d_loser"],score));
    }
    return withRelative(base("NEAR_ROTATION",["not_yet_a_strict_delayed_rotation_setup"],score));
  }

  if(!asset.riskPass) return withRelative(base("RISK_BLOCKED",["research_or_structural_risk_gate_failed"],score));
  if(!asset.execution?.hardPass) return withRelative(base("LIQUIDITY_FAIL",["personal_size_execution_gate_failed"],score));

  const pullback=clamp(
    p.pullback.basePct +
      Math.max(0,d7)*p.pullback.perPositive7dPct +
      (d30<p.pullback.extraIf30dBelowPct?p.pullback.extra30dPct:0) +
      (d90<p.pullback.extraIf90dBelowPct?p.pullback.extra90dPct:0),
    p.pullback.minPct,
    p.pullback.maxPct,
  );
  const intended=asset.priceUsd!*(1-pullback/100);
  const pilotTypical=capital.pilotTypicalUsd ?? p.capital.defaultPilotOrderUsd;
  const orderCap=Math.max(0,Math.min(pilotTypical,capital.maneuverNavUsd*p.capital.maxManeuverNavPct,capital.availableCashUsd));
  const decision=withRelative(base("WAIT_FOR_PULLBACK",[
    "market_bullish","30d_and_90d_laggard","7d_recovery_confirmed","personal_execution_passed","pullback_entry_required"
  ],score));
  return {
    ...decision,
    setupQualified:true,
    qualifiesForNewCapital:orderCap>0,
    recommendedPullbackPct:Math.round(pullback*100)/100,
    intendedLimitPrice:Math.round(intended*1e8)/1e8,
    maxNewOrderUsd:Math.round(orderCap*100)/100,
  };
}
