// Leverage state from Hyperliquid (one free, keyless call covering every perp). Research finding: crowded leverage
// sizes the drawdown, it does not time it (Oct 10 2025: ~$19B liquidated after OI rose +69% in July). So it only
// shrinks position size; it never creates a buy signal.
export interface PerpState { fundingAprPct: number; openInterestUsd: number; dayVolumeUsd: number }
export function parseHyperliquidCtxs(raw: unknown): Map<string, PerpState> {
  if (!Array.isArray(raw) || raw.length < 2) throw new Error("Hyperliquid: expected [meta, ctxs]");
  const uni = (raw[0] as any)?.universe, ctxs = raw[1];
  if (!Array.isArray(uni) || !Array.isArray(ctxs)) throw new Error("Hyperliquid: bad shape");
  const out = new Map<string, PerpState>();
  uni.forEach((u: any, i: number) => {
    const c = ctxs[i], name = String(u?.name ?? "").replace(/^k/, "").toUpperCase(); // kPEPE = 1000x PEPE
    const funding = Number(c?.funding), oi = Number(c?.openInterest), px = Number(c?.markPx), vol = Number(c?.dayNtlVlm);
    if (!name || !Number.isFinite(funding) || !Number.isFinite(oi) || !Number.isFinite(px)) return;
    out.set(name, { fundingAprPct: funding * 24 * 365 * 100, openInterestUsd: oi * px, dayVolumeUsd: Number.isFinite(vol) ? vol : 0 });
  });
  return out;
}
/** CROWDED when funding is extreme (|APR| >= 50%) or perp open interest exceeds 8% of market cap. */
export function leverageFlag(p: PerpState | undefined, marketCapUsd: number | null): "CROWDED_LONG" | "CROWDED_SHORT" | null {
  if (!p) return null;
  const oiShare = marketCapUsd && marketCapUsd > 0 ? p.openInterestUsd / marketCapUsd : 0;
  if (p.fundingAprPct >= 50 || (oiShare >= 0.08 && p.fundingAprPct > 10)) return "CROWDED_LONG";
  if (p.fundingAprPct <= -50 || (oiShare >= 0.08 && p.fundingAprPct < -10)) return "CROWDED_SHORT";
  return null;
}
