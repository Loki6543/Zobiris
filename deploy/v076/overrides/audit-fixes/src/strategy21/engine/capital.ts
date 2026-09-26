import type { AssetStateName } from "./assetState.js";
import { deploymentCapForState, type MarketStateName } from "./marketState.js";

export type Mandate = "TACTICAL" | "STRATEGIC";
export type StrategyAssetClass = "CORE" | "MEME";

export interface CapitalLedger {
  maneuverNavUsd: number;
  maneuverCashUsd: number;
  maneuverReservedUsd: number;
  strategicTargetUsd: number;
  strategicFundedUsd: number;
  strategicAuthorizedUsd: number;
  strategicReservedUsd: number;
}

export function createCapitalLedger(overrides: Partial<CapitalLedger> = {}): CapitalLedger {
  return {
    maneuverNavUsd: 1850,
    maneuverCashUsd: 1850,
    maneuverReservedUsd: 0,
    strategicTargetUsd: 1800,
    strategicFundedUsd: 0,
    strategicAuthorizedUsd: 0,
    strategicReservedUsd: 0,
    ...overrides,
  };
}

export function reserveCapital(ledger: CapitalLedger, amountUsd: number, mandate: Mandate): CapitalLedger {
  if (!Number.isFinite(amountUsd) || amountUsd <= 0) throw new Error("reservation amount must be positive");
  if (mandate === "TACTICAL") {
    if (amountUsd > ledger.maneuverCashUsd) throw new Error("insufficient maneuver cash");
    return {
      ...ledger,
      maneuverCashUsd: ledger.maneuverCashUsd - amountUsd,
      maneuverReservedUsd: ledger.maneuverReservedUsd + amountUsd,
    };
  }
  const available = Math.min(ledger.strategicFundedUsd, ledger.strategicAuthorizedUsd) - ledger.strategicReservedUsd;
  if (available <= 0 || amountUsd > available) {
    throw new Error("strategic reserve is unfunded, unauthorized, or insufficient");
  }
  return { ...ledger, strategicReservedUsd: ledger.strategicReservedUsd + amountUsd };
}

export function deploymentAuthorityUsd(state: MarketStateName, ledger: CapitalLedger, mandate: Mandate): number {
  if (mandate === "TACTICAL") return deploymentCapForState(state, ledger.maneuverNavUsd);
  const fundedAuthorized = Math.min(ledger.strategicFundedUsd, ledger.strategicAuthorizedUsd);
  return deploymentCapForState(state, fundedAuthorized);
}

export interface PortfolioExposureContext {
  grossExposureUsd: number;
  assetExposureUsd: number;
  clusterExposureUsd: number;
  memeExposureUsd: number;
}

export interface PositionAuthorityInput {
  assetId: string;
  assetClass: StrategyAssetClass;
  requestedTargetUsd: number;
  marketState: MarketStateName;
  assetState: AssetStateName;
  confidence: number;
  eligibilityMaximumPositionUsd: number;
  eligibilityMaximumOrderUsd: number;
  ledger: CapitalLedger;
  portfolio: PortfolioExposureContext;
  mandate?: Mandate;
}

export interface PositionAuthority {
  assetId: string;
  maxPositionUsd: number;
  maxNextOrderUsd: number;
  probeOnly: boolean;
  reasons: string[];
}

function round2(n: number): number {
  return Math.round(Math.max(0, n) * 100) / 100;
}

const ADDABLE_ASSET_STATES = new Set<AssetStateName>(["PRE_IGNITION", "PROBE", "ACCUMULATE", "CONFIRMED_TREND"]);

export function calculatePositionAuthority(input: PositionAuthorityInput): PositionAuthority {
  const mandate = input.mandate ?? "TACTICAL";
  const reasons: string[] = [];
  if (input.confidence <= 0.50) {
    return { assetId: input.assetId, maxPositionUsd: input.portfolio.assetExposureUsd, maxNextOrderUsd: 0, probeOnly: false, reasons: ["confidence_not_above_0.50"] };
  }
  if (!ADDABLE_ASSET_STATES.has(input.assetState)) {
    return { assetId: input.assetId, maxPositionUsd: input.portfolio.assetExposureUsd, maxNextOrderUsd: 0, probeOnly: false, reasons: [`asset_state_${input.assetState}_does_not_permit_addition`] };
  }

  const capitalBase = mandate === "TACTICAL"
    ? input.ledger.maneuverNavUsd
    : input.ledger.maneuverNavUsd + Math.min(input.ledger.strategicFundedUsd, input.ledger.strategicAuthorizedUsd);
  const deploymentCap = deploymentAuthorityUsd(input.marketState, input.ledger, mandate);
  const deploymentRemaining = Math.max(0, deploymentCap - input.portfolio.grossExposureUsd);
  const singleAssetCap = capitalBase * (input.assetClass === "MEME" ? 0.03 : 0.12);
  const assetRemaining = Math.max(0, singleAssetCap - input.portfolio.assetExposureUsd);
  const clusterRemaining = Math.max(0, capitalBase * 0.25 - input.portfolio.clusterExposureUsd);
  const memeRemaining = input.assetClass === "MEME" ? Math.max(0, capitalBase * 0.05 - input.portfolio.memeExposureUsd) : Number.POSITIVE_INFINITY;
  const liquidityRemaining = Math.max(0, input.eligibilityMaximumPositionUsd - input.portfolio.assetExposureUsd);
  const requestedRemaining = Math.max(0, input.requestedTargetUsd - input.portfolio.assetExposureUsd);

  // maneuverCashUsd is already unreserved cash (reserveCapital debits it).
  const availableCash = mandate === "TACTICAL"
    ? input.ledger.maneuverCashUsd
    : Math.min(input.ledger.strategicFundedUsd, input.ledger.strategicAuthorizedUsd) - input.ledger.strategicReservedUsd;
  const fundedCapacity = Number.isFinite(availableCash) ? Math.max(0, availableCash) : 0;
  const additionalCapacity = Math.min(
    fundedCapacity,
    requestedRemaining,
    deploymentRemaining,
    assetRemaining,
    clusterRemaining,
    memeRemaining,
    liquidityRemaining,
  );

  if (additionalCapacity <= 0) reasons.push("no_remaining_position_capacity");
  if (assetRemaining <= additionalCapacity + 1e-9) reasons.push("single_asset_cap_binding");
  if (clusterRemaining <= additionalCapacity + 1e-9) reasons.push("cluster_cap_binding");
  if (memeRemaining <= additionalCapacity + 1e-9) reasons.push("meme_sleeve_cap_binding");
  if (liquidityRemaining <= additionalCapacity + 1e-9) reasons.push("liquidity_cap_binding");
  if (deploymentRemaining <= additionalCapacity + 1e-9) reasons.push("market_deployment_cap_binding");

  const probeOnly = input.confidence < 0.75 || input.assetState === "PRE_IGNITION" || input.assetState === "PROBE";
  const probeCap = capitalBase * 0.025;
  const maxNextOrder = Math.min(additionalCapacity, input.eligibilityMaximumOrderUsd, probeOnly ? probeCap : Number.POSITIVE_INFINITY);

  return {
    assetId: input.assetId,
    maxPositionUsd: round2(input.portfolio.assetExposureUsd + additionalCapacity),
    maxNextOrderUsd: round2(maxNextOrder),
    probeOnly,
    reasons,
  };
}
