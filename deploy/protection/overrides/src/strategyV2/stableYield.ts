// Stablecoin yield sleeve: the best risk-adjusted USD stablecoin pools from DefiLlama (yields.llama.fi/pools, keyless).
//
// Kept: single-asset stablecoin pools, no impermanent-loss risk, TVL >= $25M, on a major chain, APY between 0% and
// 30%, not flagged as an outlier. Ranked by a risk-adjusted APY: the 30-day mean APY (falls back to today's), minus
// half its volatility, minus a haircut for reward-token emissions (they are paid in a token that can fall), with a
// small bonus for size. Yield optimizers (auto-compounding vaults) are marked. Every pool still carries issuer,
// smart-contract and depeg risk: spread the sleeve over at least three pools and no protocol over 40% of it.

export interface StablePool {
  pool: string; project: string; chain: string; symbol: string; tvlUsd: number;
  apy: number; apyBase: number | null; apyReward: number | null; apyMean30d: number | null; riskAdjApy: number;
  optimizer: boolean; synthetic: boolean; url: string;
}

const MAJOR_CHAINS = new Set(["Ethereum", "Arbitrum", "Base", "Optimism", "Polygon", "Solana", "BSC", "Avalanche"]);
const OPTIMIZERS = /^(yearn|beefy|sommelier|idle|harvest|summer|concrete|yield-yak|autofarm|origin|spectra|pendle|morpho-vaults|euler-vaults|fluid-lite|instadapp|enzyme|stakedao|convex)/i;
const STABLE_SYMBOLS = /^(USDC|USDT|DAI|USDS|PYUSD|FRAX|FRXUSD|GHO|RLUSD|USD1|USDE|SUSDE|SUSDS|SDAI|CRVUSD|LUSD|USDC\.E|USDBC|USDT0)$/i;
const SYNTHETIC = /^(USDE|SUSDE)$/i;
const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);

export function parseStablePools(raw: unknown, limit = 12): StablePool[] {
  const data = (raw as any)?.data;
  if (!Array.isArray(data)) throw new Error("DefiLlama yields: expected {data:[]}");
  const out: StablePool[] = [];
  for (const p of data) {
    if (!p || p.stablecoin !== true || p.exposure !== "single" || p.ilRisk !== "no" || p.outlier === true) continue;
    const tvl = num(p.tvlUsd), apy = num(p.apy);
    if (tvl == null || tvl < 25e6 || apy == null || apy <= 0 || apy > 30 || !MAJOR_CHAINS.has(String(p.chain))) continue;
    const symbol = String(p.symbol ?? "").toUpperCase();
    if (!STABLE_SYMBOLS.test(symbol)) continue;
    const base = num(p.apyBase), reward = num(p.apyReward), mean30 = num(p.apyMean30d), sigma = num(p.sigma);
    const center = mean30 != null && mean30 > 0 ? Math.min(mean30, apy * 1.5) : apy;
    const rewardShare = reward != null && apy > 0 ? Math.min(1, reward / apy) : 0;
    const riskAdj = center - 0.5 * (sigma ?? 0) - center * rewardShare * 0.5 + Math.min(0.5, Math.log10(tvl / 25e6) * 0.25);
    const project = String(p.project ?? "");
    out.push({
      pool: String(p.pool ?? ""), project, chain: String(p.chain), symbol, tvlUsd: tvl, apy, apyBase: base, apyReward: reward, apyMean30d: mean30,
      riskAdjApy: Math.round(riskAdj * 100) / 100, optimizer: OPTIMIZERS.test(project), synthetic: SYNTHETIC.test(symbol),
      url: /^[a-f0-9-]{8,64}$/i.test(String(p.pool ?? "")) ? `https://defillama.com/yields/pool/${p.pool}` : "https://defillama.com/yields",
    });
  }
  out.sort((a, b) => b.riskAdjApy - a.riskAdjApy);
  // At most two pools per protocol in the list, so the suggestion stays diversified.
  const per = new Map<string, number>();
  return out.filter((p) => { const n = per.get(p.project) ?? 0; per.set(p.project, n + 1); return n < 2; }).slice(0, limit);
}
