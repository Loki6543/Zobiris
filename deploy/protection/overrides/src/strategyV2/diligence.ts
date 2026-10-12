// Small-cap diligence from free, keyless sources:
//   CoinGecko /coins/{id}         which chain the token lives on, its contract address, listed GitHub repos
//   GoPlus Security token_security honeypot / tax / owner powers / mint & freeze authority / top holders
//   GitHub /stats/participation    commits in the last 12 weeks (information only; listed repos are often stale)
// Contract red flags veto a small bet; softer findings are shown as warnings. Native coins (own chain) have no
// token contract to check and are marked NATIVE.

export interface CoinDetail { assetPlatformId: string | null; contract: string | null; githubRepos: string[] }

export function parseCoinDetail(raw: unknown): CoinDetail {
  const r = raw as any;
  if (!r || typeof r !== "object" || typeof r.id !== "string") throw new Error("CoinGecko coin: missing id");
  const platform: string | null = typeof r.asset_platform_id === "string" && r.asset_platform_id ? r.asset_platform_id : null;
  const contract = platform && typeof r.platforms?.[platform] === "string" && r.platforms[platform] ? String(r.platforms[platform]) : null;
  const repos = Array.isArray(r.links?.repos_url?.github) ? (r.links.repos_url.github as unknown[]).map(String) : [];
  return { assetPlatformId: platform, contract, githubRepos: repos.filter((u) => /^https:\/\/github\.com\/[^/]+\/[^/]+/.test(u)) };
}

/** GoPlus endpoint for a CoinGecko platform id, or null when GoPlus does not cover that chain. */
export function goPlusPath(platform: string): string | null {
  const evm: Record<string, number> = { ethereum: 1, "binance-smart-chain": 56, base: 8453, "arbitrum-one": 42161, "polygon-pos": 137, "optimistic-ethereum": 10, avalanche: 43114 };
  if (platform === "solana") return "/api/v1/solana/token_security";
  return evm[platform] ? `/api/v1/token_security/${evm[platform]}` : null;
}

export type SecurityStatus = "PASS" | "WARN" | "FAIL" | "NATIVE" | "UNSUPPORTED_CHAIN" | "UNCHECKED";
export interface SecurityResult { status: SecurityStatus; vetoes: string[]; warnings: string[]; top10HolderPct: number | null; chain: string | null }

const flag = (v: unknown) => String(v ?? "") === "1";
const pct = (v: unknown) => { const n = Number(v); return Number.isFinite(n) ? n : 0; };

/** GoPlus EVM token_security result for one address. */
export function evaluateEvmSecurity(raw: unknown, address: string, chain: string): SecurityResult {
  const t = (raw as any)?.result?.[address.toLowerCase()] ?? (raw as any)?.result?.[address];
  if (!t) return { status: "UNCHECKED", vetoes: [], warnings: ["NO_GOPLUS_RESULT"], top10HolderPct: null, chain };
  const vetoes: string[] = [], warnings: string[] = [];
  if (flag(t.is_honeypot)) vetoes.push("HONEYPOT");
  if (flag(t.cannot_sell_all)) vetoes.push("CANNOT_SELL_ALL");
  if (pct(t.buy_tax) > 0.005 || pct(t.sell_tax) > 0.005 || pct(t.transfer_tax) > 0.005) vetoes.push("TRANSFER_TAX");
  if (flag(t.owner_change_balance)) vetoes.push("OWNER_CAN_CHANGE_BALANCES");
  if (flag(t.hidden_owner)) vetoes.push("HIDDEN_OWNER");
  if (flag(t.can_take_back_ownership)) vetoes.push("OWNERSHIP_RECLAIMABLE");
  if (flag(t.selfdestruct)) vetoes.push("SELF_DESTRUCT");
  if (String(t.is_open_source ?? "1") === "0") vetoes.push("CONTRACT_NOT_VERIFIED");
  if (flag(t.trading_cooldown)) warnings.push("TRADING_COOLDOWN");
  if (flag(t.transfer_pausable)) warnings.push("TRANSFERS_PAUSABLE");
  if (flag(t.is_blacklisted)) warnings.push("BLACKLIST_FUNCTION");
  if (flag(t.is_mintable)) warnings.push("MINTABLE");
  if (flag(t.is_proxy)) warnings.push("UPGRADEABLE_PROXY");
  // Top-10 holders excluding contracts (staking, bridges, LPs) and locked wallets. Exchanges are untagged, so this is a warning only.
  const holders = Array.isArray(t.holders) ? t.holders : [];
  const top10 = holders.filter((h: any) => Number(h.is_contract) !== 1 && Number(h.is_locked) !== 1).slice(0, 10).reduce((s: number, h: any) => s + pct(h.percent), 0) * 100;
  if (top10 > 40) warnings.push("TOP10_WALLETS_OVER_40PCT");
  return { status: vetoes.length ? "FAIL" : warnings.length ? "WARN" : "PASS", vetoes, warnings, top10HolderPct: holders.length ? top10 : null, chain };
}

/** GoPlus Solana token_security result for one mint. */
export function evaluateSolanaSecurity(raw: unknown, mint: string): SecurityResult {
  const t = (raw as any)?.result?.[mint];
  if (!t) return { status: "UNCHECKED", vetoes: [], warnings: ["NO_GOPLUS_RESULT"], top10HolderPct: null, chain: "solana" };
  const vetoes: string[] = [], warnings: string[] = [];
  if (flag(t.mintable?.status)) vetoes.push("MINT_AUTHORITY_ACTIVE");
  if (flag(t.freezable?.status)) vetoes.push("FREEZE_AUTHORITY_ACTIVE");
  if (flag(t.balance_mutable_authority?.status)) vetoes.push("OWNER_CAN_CHANGE_BALANCES");
  if (t.transfer_fee && typeof t.transfer_fee === "object" && Object.keys(t.transfer_fee).length && pct(t.transfer_fee.fee_rate ?? t.transfer_fee.current_fee_rate) > 0) vetoes.push("TRANSFER_TAX");
  if (flag(t.non_transferable)) vetoes.push("NON_TRANSFERABLE");
  if (flag(t.closable?.status)) warnings.push("ACCOUNTS_CLOSABLE");
  if (flag(t.transfer_fee_upgradable?.status)) warnings.push("TRANSFER_FEE_UPGRADABLE");
  if (Array.isArray(t.transfer_hook) && t.transfer_hook.length) warnings.push("TRANSFER_HOOK");
  const holders = Array.isArray(t.holders) ? t.holders : [];
  const top10 = holders.filter((h: any) => Number(h.is_locked) !== 1).slice(0, 10).reduce((s: number, h: any) => s + pct(h.percent), 0) * 100;
  if (top10 > 40) warnings.push("TOP10_WALLETS_OVER_40PCT");
  return { status: vetoes.length ? "FAIL" : warnings.length ? "WARN" : "PASS", vetoes, warnings, top10HolderPct: holders.length ? top10 : null, chain: "solana" };
}

/** Commits in the last 12 weeks from GitHub /stats/participation ("all" is 52 weekly counts, oldest first). */
export function parseGithubParticipation(raw: unknown): number | null {
  const all = (raw as any)?.all;
  return Array.isArray(all) && all.length >= 12 ? all.slice(-12).reduce((s: number, v: unknown) => s + (Number(v) || 0), 0) : null;
}

export interface Diligence { geckoId: string; security: SecurityResult; commits12w: number | null; repo: string | null; checkedAt: string }
