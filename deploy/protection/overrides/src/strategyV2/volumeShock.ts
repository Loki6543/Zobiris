// Volume shocks outside the top 100: how unusual today's volume is, and what the price did with it.
//
// Ratio R = 24h volume / median daily volume of the previous 30 recorded days (needs >= 7 days of history).
// Until that history exists the ratio is cross-sectional: the coin's turnover (volume / market cap) divided by the
// median turnover of its rank band. That is weaker evidence and is labelled as such.
//
// Classes (price response is what separates them):
//   BREAKOUT              R >= 3 and price +8% or more in 24h       demand overwhelming supply
//   ACCUMULATION          R >= 2 and |24h| < 4%                     heavy volume absorbed without a price move
//   CAPITULATION_FLUSH    R >= 3 and price -10% or worse in 24h     forced selling; an opening only if the asset is sound
//   DISTRIBUTION          R >= 2, up 25%+ over 7d, down 4%+ today   holders selling into strength
//   VOLUME_COLLAPSE       R <= 0.35 and price down over 7d          liquidity leaving (avoid)
//   NEGLECTED             R <= 0.35 otherwise                       nobody is watching (List: wait for a catalyst)
//   NORMAL                anything else
// What each class actually leads to is measured, not assumed: the decision ledger records the class daily and the
// forward test scores 7/30-day outcomes per class.

export type VolumeClass = "BREAKOUT" | "ACCUMULATION" | "CAPITULATION_FLUSH" | "DISTRIBUTION" | "VOLUME_COLLAPSE" | "NEGLECTED" | "NORMAL";
export const VOLUME_CLASS_LABEL: Record<VolumeClass, string> = {
  BREAKOUT: "Breakout on volume", ACCUMULATION: "Quiet accumulation", CAPITULATION_FLUSH: "Capitulation flush", DISTRIBUTION: "Distribution into strength",
  VOLUME_COLLAPSE: "Liquidity leaving", NEGLECTED: "Neglected", NORMAL: "Normal",
};
/** Score adjustment the opening model applies per class (before any outcome data exists). */
export const VOLUME_CLASS_TILT: Record<VolumeClass, number> = {
  BREAKOUT: 0.6, ACCUMULATION: 1, CAPITULATION_FLUSH: 0.5, DISTRIBUTION: -0.8, VOLUME_COLLAPSE: -1, NEGLECTED: -0.2, NORMAL: 0,
};

export interface VolumeShock { ratio: number | null; source: "history" | "cross-section" | "none"; historyDays: number; class: VolumeClass }

export const median = (xs: number[]) => {
  const v = xs.filter((x) => Number.isFinite(x)).sort((a, b) => a - b);
  if (!v.length) return null;
  const m = v.length >> 1;
  return v.length % 2 ? v[m]! : (v[m - 1]! + v[m]!) / 2;
};

export function classifyVolume(ratio: number | null, change24hPct: number | null, change7dPct: number | null): VolumeClass {
  if (ratio == null || !Number.isFinite(ratio)) return "NORMAL";
  const d1 = change24hPct ?? 0, d7 = change7dPct ?? 0;
  if (ratio >= 3 && d1 >= 8) return "BREAKOUT";
  if (ratio >= 3 && d1 <= -10) return "CAPITULATION_FLUSH";
  if (ratio >= 2 && d7 >= 25 && d1 <= -4) return "DISTRIBUTION";
  if (ratio >= 2 && Math.abs(d1) < 4) return "ACCUMULATION";
  if (ratio <= 0.35) return d7 < 0 ? "VOLUME_COLLAPSE" : "NEGLECTED";
  return "NORMAL";
}

/**
 * @param volume24hUsd today's aggregate 24h volume
 * @param history previous daily aggregate volumes, oldest first (today excluded)
 * @param turnover volume / market cap today; bandMedianTurnover the median of the same rank band
 */
export function volumeShock(volume24hUsd: number | null, history: number[], turnover: number | null, bandMedianTurnover: number | null, change24hPct: number | null, change7dPct: number | null): VolumeShock {
  const past = history.slice(-30).filter((v) => Number.isFinite(v) && v > 0);
  if (volume24hUsd != null && volume24hUsd > 0 && past.length >= 7) {
    const m = median(past)!;
    const ratio = volume24hUsd / m;
    return { ratio, source: "history", historyDays: past.length, class: classifyVolume(ratio, change24hPct, change7dPct) };
  }
  if (turnover != null && turnover > 0 && bandMedianTurnover != null && bandMedianTurnover > 0) {
    const ratio = turnover / bandMedianTurnover;
    // Cross-sectional evidence is weaker: require a bigger multiple before calling a shock.
    const shrunk = ratio >= 1 ? 1 + (ratio - 1) * 0.6 : ratio;
    return { ratio: shrunk, source: "cross-section", historyDays: past.length, class: classifyVolume(shrunk, change24hPct, change7dPct) };
  }
  return { ratio: null, source: "none", historyDays: past.length, class: "NORMAL" };
}
