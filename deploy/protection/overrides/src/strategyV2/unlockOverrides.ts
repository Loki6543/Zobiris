// Verified unlock data for watchlist small caps, researched by hand because no free unlock API exists
// (DefiLlama emissions and Tokenomist are paid). share60d = new supply over the next 60 days as a
// fraction of circulating supply, counting vesting AND protocol inflation. Entries expire after
// MAX_AGE_DAYS; the screen then falls back to the circulating/minted supply proxy.

export interface UnlockOverride { share60d: number; asOf: string; source: string; note?: string }

export const UNLOCK_OVERRIDE_MAX_AGE_DAYS = 45;

export const UNLOCK_OVERRIDES: Record<string, UnlockOverride> = {
  TIA: { share60d: 0.017, asOf: "2026-10-12", source: "https://kresmion.com/crypto/tokens/TIA", note: "Ecosystem + core contributor tranches Oct 30 and Nov 30, about 16M TIA on 975M circulating" },
  PENGU: { share60d: 0.016, asOf: "2026-10-12", source: "https://mrnasdog.com/research/pengu", note: "Team + company release about 520M PENGU on the 17th of each month; CoinGecko circulating supply is stale" },
  APE: { share60d: 0, asOf: "2026-10-12", source: "https://app.blockworks.com/projects/apecoin/token-unlocks", note: "Vesting completed 17 Mar 2026" },
  BONK: { share60d: 0, asOf: "2026-10-12", source: "https://tokenomist.ai/bonk/unlock-events", note: "Contributor vesting completed Dec 2025" },
  COMP: { share60d: 0, asOf: "2026-10-12", source: "https://tokenomist.ai/compound-governance-token/unlock-events", note: "Fully unlocked since 2024" },
  CHZ: { share60d: 0.012, asOf: "2026-10-12", source: "https://docs.chiliz.com/learn/about-chiliz-chain/tokenomics", note: "No vesting left; protocol inflation about 7% a year" },
};

/** Verified 60-day unlock share, or null when there is no entry or it is too old to trust. */
export function verifiedUnlockShare(symbol: string, now: number): UnlockOverride | null {
  const o = UNLOCK_OVERRIDES[symbol.toUpperCase()];
  if (!o) return null;
  const ageDays = (now - Date.parse(o.asOf)) / 86_400_000;
  return ageDays >= 0 && ageDays <= UNLOCK_OVERRIDE_MAX_AGE_DAYS ? o : null;
}
