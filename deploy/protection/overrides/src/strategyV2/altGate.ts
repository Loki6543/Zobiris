// Altcoin gate: a second layer on top of the BTC regime. Bitcoin can be in an uptrend while capital is still
// concentrating in BTC, or while stablecoin money is leaving the market. New altcoin entries (top-100 rotation and
// small-cap bets) only open when all three checks pass. Unknown inputs never block; they are reported as unknown.
//   1. BTC dominance not rising fast over 30 days (> +1.0 percentage point = capital concentrating in BTC;
//      estimated from top-100 30-day returns until the decision ledger has 30 days of real readings)
//   2. Stablecoin supply not shrinking over 30 days (DefiLlama total USD-pegged supply)
//   3. At least 45% of top-100 coins (stablecoins excluded) up over 30 days
import type { MarketCoin } from "./feed";

export type AltGateState = "ROTATION_OPEN" | "BTC_CONCENTRATING" | "DEFENSIVE_CASH" | "BREADTH_WEAK" | "BTC_DOWNTREND";

export interface AltGate {
  state: AltGateState;
  allowAltEntries: boolean;
  dominanceNowPct: number | null;
  dominanceChange30dPts: number | null;
  stablecoinSupplyUsd: number | null;
  stablecoinChange30dPct: number | null;
  breadth30dPositive: number | null;
  checks: Array<{ label: string; ok: boolean | null; detail: string }>;
}

export const ALT_GATE_RULES = { maxDominanceRise30dPts: 1.0, minBreadth30dPositive: 0.45 } as const;

const isStable = (c: MarketCoin) => c.priceUsd != null && c.priceUsd > 0.9 && c.priceUsd < 1.2 && Math.abs(c.change30dPct ?? 99) < 3;

/** BTC share of the top 100 now and an estimate 30 days ago (each coin's cap divided back by its 30-day return). */
export function dominanceTrend(market: MarketCoin[]): { now: number | null; change30dPts: number | null } {
  const top = market.filter((c) => c.rank != null && c.rank <= 100 && c.marketCapUsd && c.marketCapUsd > 0);
  const btc = top.find((c) => c.symbol === "BTC");
  if (!btc || top.length < 50) return { now: null, change30dPts: null };
  const total = top.reduce((s, c) => s + c.marketCapUsd!, 0);
  const now = (btc.marketCapUsd! / total) * 100;
  const past = (c: MarketCoin) => (c.change30dPct == null || c.change30dPct <= -99 ? c.marketCapUsd! : c.marketCapUsd! / (1 + c.change30dPct / 100));
  if (btc.change30dPct == null) return { now, change30dPts: null };
  const then = (past(btc) / top.reduce((s, c) => s + past(c), 0)) * 100;
  return { now, change30dPts: now - then };
}

export function breadth30d(market: MarketCoin[]): number | null {
  const rows = market.filter((c) => c.rank != null && c.rank <= 100 && !isStable(c) && c.change30dPct != null);
  return rows.length >= 50 ? rows.filter((c) => c.change30dPct! > 0).length / rows.length : null;
}

/** Total USD-pegged stablecoin supply today and its 30-day change, from DefiLlama /stablecoincharts/all rows. */
export function parseStablecoinSupply(raw: unknown): { supplyUsd: number; change30dPct: number | null } {
  if (!Array.isArray(raw) || !raw.length) throw new Error("DefiLlama stablecoins: expected rows");
  const usd = (r: any) => Number(r?.totalCirculatingUSD?.peggedUSD);
  const rows = (raw as any[]).filter((r) => Number.isFinite(usd(r)) && usd(r) > 0 && Number.isFinite(Number(r.date)));
  const last = rows[rows.length - 1];
  if (!last) throw new Error("DefiLlama stablecoins: no USD rows");
  const target = Number(last.date) - 30 * 86400;
  const base = [...rows].reverse().find((r) => Number(r.date) <= target);
  return { supplyUsd: usd(last), change30dPct: base ? ((usd(last) / usd(base)) - 1) * 100 : null };
}

export function computeAltGate(input: { btcAbove200d: boolean | null; market: MarketCoin[]; stablecoins: { supplyUsd: number; change30dPct: number | null } | null }): AltGate {
  const dom = dominanceTrend(input.market);
  const breadth = breadth30d(input.market);
  const st = input.stablecoins;
  const checks: AltGate["checks"] = [
    { label: "BTC above its 200-day average", ok: input.btcAbove200d, detail: input.btcAbove200d == null ? "unknown" : input.btcAbove200d ? "yes" : "no" },
    { label: "BTC dominance not rising fast (30d)", ok: dom.change30dPts == null ? null : dom.change30dPts <= ALT_GATE_RULES.maxDominanceRise30dPts, detail: dom.change30dPts == null ? "unknown" : `${dom.change30dPts >= 0 ? "+" : ""}${dom.change30dPts.toFixed(2)} pts (top-100 share ${dom.now!.toFixed(1)}%)` },
    { label: "Stablecoin supply not shrinking (30d)", ok: st?.change30dPct == null ? null : st.change30dPct >= 0, detail: st?.change30dPct == null ? "unknown" : `${st.change30dPct >= 0 ? "+" : ""}${st.change30dPct.toFixed(2)}% · $${(st.supplyUsd / 1e9).toFixed(1)}B` },
    { label: "≥45% of top 100 up over 30 days", ok: breadth == null ? null : breadth >= ALT_GATE_RULES.minBreadth30dPositive, detail: breadth == null ? "unknown" : `${Math.round(breadth * 100)}%` },
  ];
  const [trend, domOk, stableOk, breadthOk] = checks.map((c) => c.ok);
  const state: AltGateState = trend === false ? "BTC_DOWNTREND" : stableOk === false ? "DEFENSIVE_CASH" : domOk === false ? "BTC_CONCENTRATING" : breadthOk === false ? "BREADTH_WEAK" : "ROTATION_OPEN";
  return {
    state, allowAltEntries: state === "ROTATION_OPEN",
    dominanceNowPct: dom.now, dominanceChange30dPts: dom.change30dPts,
    stablecoinSupplyUsd: st?.supplyUsd ?? null, stablecoinChange30dPct: st?.change30dPct ?? null,
    breadth30dPositive: breadth, checks,
  };
}

export const ALT_GATE_LABEL: Record<AltGateState, string> = {
  ROTATION_OPEN: "Altcoin entries open", BTC_CONCENTRATING: "Paused: money concentrating in BTC", DEFENSIVE_CASH: "Paused: stablecoin money leaving",
  BREADTH_WEAK: "Paused: under 45% of top 100 rising", BTC_DOWNTREND: "Paused: BTC below 200-day average",
};
