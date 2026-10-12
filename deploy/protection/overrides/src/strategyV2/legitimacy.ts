// Legitimacy score (0-100) for a coin outside the top 100: is there a real, maintained, liquid project behind it?
// Built only from checkable public facts; every point is listed so the score can be audited.
//
//   White paper link 15 · website 10 · X/Twitter 10 · Telegram or Discord 5
//   GitHub with commits in the last 12 weeks 15 (repo listed but idle 6)
//   Age >= 1 year 10 (>= 6 months 5)
//   Contract: PASS or native coin 15, WARN 8, unsupported/unchecked 0, FAIL caps the score at 10
//   Top-10 wallets <= 25% 10 (<= 40% 5) (Bubblemaps clustered top-10 when a holder map exists, else GoPlus raw top-10)
//   Bubblemaps decentralization score >= 60 5
//   Liquidity: DEX pools >= $1M or Kraken-listed or 24h volume >= $5M 10 (>= $250k 5)
// Deductions: CoinGecko public notice (hack, migration, delisting) -25 · LP tokens mostly unlocked -10 · sentiment < 30% -5
//   Bundled supply >= 25% -15 · fresh-wallet supply >= 20% -10 (Bubblemaps holder map, optional paid feed)
import type { Diligence } from "./diligence";

export interface LegitimacyInput { diligence: Diligence | null | undefined; ageDays: number | null; krakenListed: boolean; volume24hUsd: number | null; now?: number }
export interface Legitimacy { score: number; grade: "STRONG" | "MODERATE" | "WEAK" | "UNVERIFIED"; points: Array<{ label: string; points: number }>; redFlags: string[] }

export function legitimacyScore(i: LegitimacyInput): Legitimacy {
  const d = i.diligence;
  if (!d) return { score: 0, grade: "UNVERIFIED", points: [], redFlags: ["NOT_YET_SCANNED"] };
  // The CoinGecko lookup itself failed: nothing was checked, so this is unverified (retried later), not weak.
  if (!d.profile && d.security.status === "UNCHECKED") return { score: 0, grade: "UNVERIFIED", points: [], redFlags: ["SCAN_FAILED_RETRYING"] };
  const p = d.profile;
  const pts: Array<{ label: string; points: number }> = [];
  const red: string[] = [];
  const add = (label: string, points: number) => { if (points) pts.push({ label, points }); };
  if (p?.whitepaper) add("White paper published", 15); else red.push("NO_WHITE_PAPER");
  if (p?.homepage) add("Website", 10);
  if (p?.twitter) add("X / Twitter account", 10); else red.push("NO_SOCIAL_ACCOUNT");
  if (p?.telegram || p?.discord) add("Telegram or Discord community", 5);
  if (d.repo && (d.commits12w ?? 0) > 0) add(`GitHub active (${d.commits12w} commits / 12 weeks)`, 15);
  else if (d.repo) { add("GitHub listed but idle", 6); red.push("GITHUB_IDLE"); }
  const genesisAge = p?.genesisDate ? Math.floor(((i.now ?? Date.now()) - Date.parse(p.genesisDate)) / 86_400_000) : null;
  const age = Math.max(i.ageDays ?? -1, genesisAge ?? -1);
  if (age >= 365) add("Trading for over a year", 10); else if (age >= 180) add("Trading for over 6 months", 5); else red.push("YOUNG_OR_UNDATED");
  const s = d.security;
  if (s.status === "PASS" || s.status === "NATIVE") add(s.status === "NATIVE" ? "Native coin (no token contract)" : "Contract checks passed", 15);
  else if (s.status === "WARN") add("Contract checks: warnings only", 8);
  if (s.status === "FAIL") red.push(...s.vetoes.map((v) => `CONTRACT_${v}`));
  if (s.status === "UNCHECKED") red.push("CONTRACT_UNCHECKED");
  const hm = d.holders ?? null;
  const top10 = hm?.top10AdjustedPct ?? s.top10HolderPct;
  const top10Src = hm?.top10AdjustedPct != null ? " (clustered, exchanges excluded)" : "";
  if (top10 != null) {
    if (top10 <= 25) add(`Top-10 wallets hold 25% or less${top10Src}`, 10);
    else if (top10 <= 40) add(`Top-10 wallets hold 40% or less${top10Src}`, 5);
    else red.push("CONCENTRATED_HOLDERS");
  }
  if (hm) {
    if (hm.score != null && hm.score >= 60) add(`Bubblemaps decentralization score ${hm.score.toFixed(0)}`, 5);
    if (hm.flags.includes("BUNDLED_SUPPLY")) { add(`Bundled supply ${hm.bundlesPct?.toFixed(0)}% (wallet clusters)`, -15); red.push("BUNDLED_SUPPLY"); }
    if (hm.flags.includes("FRESH_WALLET_SUPPLY")) { add(`Fresh wallets hold ${hm.freshWalletsPct?.toFixed(0)}% of supply`, -10); red.push("FRESH_WALLET_SUPPLY"); }
  }
  const liq = s.dexLiquidityUsd ?? 0, vol = i.volume24hUsd ?? 0;
  if (liq >= 1e6 || i.krakenListed || vol >= 5e6) add(i.krakenListed ? "Kraken-listed" : liq >= 1e6 ? "DEX liquidity over $1M" : "24h volume over $5M", 10);
  else if (liq >= 250e3 || vol >= 250e3) add("Liquidity over $250k", 5);
  else red.push("THIN_LIQUIDITY");
  if (p?.publicNotice) { add("CoinGecko public notice", -25); red.push("PUBLIC_NOTICE"); }
  if (s.lpLockedPct != null && s.lpLockedPct < 50 && liq > 0 && s.chain && s.chain !== "solana") { add("LP tokens mostly unlocked", -10); red.push("LP_UNLOCKED"); }
  if (p?.sentimentUpPct != null && p.sentimentUpPct < 30) { add("Community sentiment under 30% positive", -5); red.push("NEGATIVE_SENTIMENT"); }
  let score = Math.max(0, Math.min(100, pts.reduce((a, b) => a + b.points, 0)));
  if (s.status === "FAIL") score = Math.min(score, 10);
  return { score, grade: score >= 70 ? "STRONG" : score >= 50 ? "MODERATE" : "WEAK", points: pts, redFlags: red };
}
