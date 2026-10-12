// AI watchlist: the daily Claude review of speculative coins (CoinMarketCap trends, narratives and news, plus web
// checks of white paper, team and socials). It is written by a scheduled Claude session to a data-only branch of the
// repository and read here. Treated as untrusted input: strictly validated, size-capped, and only ever able to
// lower a coin's standing (AVOID) or nudge its score by at most 10%; it cannot override a failed check.

export type AiVerdict = "CONSIDER" | "WATCH" | "AVOID";
export interface AiWatchItem {
  symbol: string;
  geckoId: string | null;
  name: string;
  verdict: AiVerdict;
  aiScore: number; // 0-100
  socialScore: number | null; // 0-100, legitimacy of the social presence (real engagement vs bots/paid shills)
  mindshareTrend: "RISING" | "FLAT" | "FALLING" | "UNKNOWN";
  narrative: string | null;
  thesis: string;
  greenFlags: string[];
  redFlags: string[];
  sources: string[];
}
export interface AiWatchlist { version: 1; generatedAt: string; items: AiWatchItem[] }

const MAX_ITEMS = 40;
const clean = (v: unknown, max: number): string => (typeof v === "string" ? v.replace(/[\u0000-\u001f\u007f<>]/g, " ").replace(/\s+/g, " ").trim().slice(0, max) : "");
const list = (v: unknown, maxItems: number, maxLen: number) => (Array.isArray(v) ? v.map((x) => clean(x, maxLen)).filter(Boolean).slice(0, maxItems) : []);
const score = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? Math.max(0, Math.min(100, Math.round(v))) : null);

export function parseAiWatchlist(raw: unknown): AiWatchlist {
  const r = raw as any;
  if (!r || typeof r !== "object" || r.version !== 1 || !Array.isArray(r.items)) throw new Error("AI watchlist: expected {version:1, items:[]}");
  const generatedAt = typeof r.generatedAt === "string" && Number.isFinite(Date.parse(r.generatedAt)) ? new Date(r.generatedAt).toISOString() : null;
  if (!generatedAt) throw new Error("AI watchlist: bad generatedAt");
  const items: AiWatchItem[] = [];
  for (const it of r.items.slice(0, MAX_ITEMS)) {
    const symbol = clean(it?.symbol, 15).toUpperCase();
    const verdict = it?.verdict;
    const aiScore = score(it?.aiScore);
    if (!/^[A-Z0-9]{1,15}$/.test(symbol) || !["CONSIDER", "WATCH", "AVOID"].includes(verdict) || aiScore == null) continue;
    const trend = String(it?.mindshareTrend ?? "UNKNOWN").toUpperCase();
    items.push({
      symbol, geckoId: /^[a-z0-9-]{1,80}$/.test(String(it?.geckoId ?? "")) ? String(it.geckoId) : null,
      name: clean(it?.name, 60) || symbol, verdict, aiScore, socialScore: score(it?.socialScore),
      mindshareTrend: (["RISING", "FLAT", "FALLING"].includes(trend) ? trend : "UNKNOWN") as AiWatchItem["mindshareTrend"],
      narrative: clean(it?.narrative, 60) || null, thesis: clean(it?.thesis, 500),
      greenFlags: list(it?.greenFlags, 8, 120), redFlags: list(it?.redFlags, 8, 120),
      sources: (Array.isArray(it?.sources) ? it.sources : []).filter((u: unknown) => typeof u === "string" && /^https:\/\/[^\s<>"]{4,300}$/.test(u)).slice(0, 6),
    });
  }
  return { version: 1, generatedAt, items };
}
