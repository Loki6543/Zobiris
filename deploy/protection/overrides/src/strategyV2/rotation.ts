// Top-100 delayed rotation on free CoinGecko fields (7d / 30d / 200d / 1y changes).
// A "delayed rotation" entry is a liquid large cap that has lagged BTC over the medium term and has
// just started to recover over the short term — bought on a pullback limit, never chased.
import type { BtcRegime } from "./btcRegime";

export type RotationStatus = "QUALIFIED" | "NEAR_ROTATION" | "TOO_EARLY" | "EXTENDED" | "NOT_LAGGING" | "STRUCTURALLY_WEAK" | "REGIME_BLOCKED" | "DATA_INSUFFICIENT";

export interface RotationInput {
  symbol: string;
  rank: number | null;
  priceUsd: number | null;
  change7dPct: number | null;
  change30dPct: number | null;
  change200dPct: number | null;
  btcChange7dPct: number | null;
  btcChange30dPct: number | null;
  btcChange200dPct: number | null;
}

export interface RotationResult {
  symbol: string;
  status: RotationStatus;
  relative30dVsBtcPct: number | null;
  relative200dVsBtcPct: number | null;
  /** Suggested limit price below current (pullback entry). null unless QUALIFIED/NEAR. */
  limitPriceUsd: number | null;
  pullbackPct: number | null;
  reasons: string[];
}

const ok = (v: number | null): v is number => v != null && Number.isFinite(v);

export function evaluateRotation(a: RotationInput, regime: Pick<BtcRegime, "allowTop100Rotation" | "state" | "realizedVolAnnualPct">): RotationResult {
  const base = { symbol: a.symbol, relative30dVsBtcPct: null, relative200dVsBtcPct: null, limitPriceUsd: null, pullbackPct: null };
  if (![a.priceUsd, a.change7dPct, a.change30dPct, a.change200dPct, a.btcChange7dPct, a.btcChange30dPct, a.btcChange200dPct].every(ok))
    return { ...base, status: "DATA_INSUFFICIENT", reasons: ["MISSING_PRICE_OR_RETURNS"] };
  const rel30 = a.change30dPct! - a.btcChange30dPct!;
  const rel200 = a.change200dPct! - a.btcChange200dPct!;
  const rel7 = a.change7dPct! - a.btcChange7dPct!;
  const out = { ...base, relative30dVsBtcPct: rel30, relative200dVsBtcPct: rel200 };
  const reasons: string[] = [];

  if (a.change200dPct! <= -75) return { ...out, status: "STRUCTURALLY_WEAK", reasons: ["DOWN_75PCT_200D_POSSIBLE_VALUE_TRAP"] };
  if (rel200 > -10 && rel30 > -5) return { ...out, status: "NOT_LAGGING", reasons: ["NOT_LAGGING_BTC"] };
  if (a.change7dPct! > 25) return { ...out, status: "EXTENDED", reasons: ["UP_25PCT_7D_DO_NOT_CHASE"] };
  if (rel7 <= 0) return { ...out, status: "TOO_EARLY", reasons: ["NO_7D_RECOVERY_VS_BTC_YET"] };

  const status: RotationStatus = rel7 >= 3 && a.change7dPct! > 0 ? "QUALIFIED" : "NEAR_ROTATION";
  reasons.push(rel200 <= -10 ? "LAGGED_BTC_200D" : "LAGGED_BTC_30D", status === "QUALIFIED" ? "FRESH_7D_RECOVERY_VS_BTC" : "RECOVERY_FORMING");
  // Pullback scales with BTC volatility: 4% in calm markets up to 8% when volatile.
  const vol = regime.realizedVolAnnualPct ?? 50;
  const pullbackPct = Math.min(8, Math.max(4, vol / 10));
  const limitPriceUsd = Number((a.priceUsd! * (1 - pullbackPct / 100)).toPrecision(6));
  if (!regime.allowTop100Rotation) return { ...out, status: "REGIME_BLOCKED", limitPriceUsd: null, pullbackPct: null, reasons: [...reasons, `BTC_REGIME_${regime.state}`] };
  return { ...out, status, limitPriceUsd, pullbackPct, reasons };
}
