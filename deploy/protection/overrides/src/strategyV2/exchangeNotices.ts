// Exchange notices: the event class with the strongest measured, still-tradable effect (research report
// "What really moves crypto prices"): Binance delistings (median -15.5% at 24h, -22.7% at 7d) and Monitoring Tags
// (median low -15.8% ~4h later), Upbit delisting / caution designations, and fresh listings (pop, then reversal from
// day 2). Read from the public JSON the exchanges' own websites use (unofficial: shapes can change, so parsing is
// defensive and a failure only drops the feed).
export type NoticeKind = "DELIST" | "MONITORING_TAG" | "CAUTION" | "LISTING";
export interface ExchangeNotice { kind: NoticeKind; exchange: "Binance" | "Upbit"; symbols: string[]; title: string; at: string }

const STOP = new Set(["USDT", "USDC", "FDUSD", "BTC", "ETH", "BNB", "TRY", "EUR", "KRW", "USD", "BINANCE", "UPBIT", "API", "UTC", "AM", "PM", "NFT", "AND", "THE", "ON", "OF", "FOR", "TO", "WILL", "SPOT", "ALPHA", "HODLER", "MARGIN", "SEED", "TAG", "NEW"]);
const clean = (s: unknown) => (typeof s === "string" ? s.replace(/[\u0000-\u001f<>]/g, " ").slice(0, 200) : "");
/** Tickers named in a title: "(ABC)" groups first, else capitalised words of 2-10 letters/digits. */
export function tickersIn(title: string): string[] {
  const paren = [...title.matchAll(/\(([A-Z0-9]{2,10})\)/g)].map((m) => m[1]!);
  const list = paren.length ? paren : [...title.matchAll(/\b[A-Z][A-Z0-9]{1,9}\b/g)].map((m) => m[0]);
  return [...new Set(list.filter((t) => !STOP.has(t)))].slice(0, 30);
}

export function classifyBinanceTitle(title: string): NoticeKind | null {
  if (/removal of (the )?monitoring tag/i.test(title)) return null;
  if (/monitoring tag/i.test(title)) return "MONITORING_TAG";
  if (/will delist|delisting of/i.test(title) && !/(trading pairs|margin|futures|perpetual|earn|convert|loan|options|copy trading|bots)/i.test(title)) return "DELIST";
  if (/will list|adds? .* (to|on) binance spot|launchpool|hodler airdrops/i.test(title) && !/(futures|perpetual|margin|options|pairs?)$/i.test(title)) return "LISTING";
  return null;
}

/** Binance /bapi/composite/v1/public/cms/article/list/query response (catalogs[].articles[]). */
export function parseBinanceNotices(raw: unknown): ExchangeNotice[] {
  const cats = (raw as any)?.data?.catalogs;
  if (!Array.isArray(cats)) throw new Error("Binance notices: expected data.catalogs");
  const out: ExchangeNotice[] = [];
  for (const c of cats) for (const a of Array.isArray(c?.articles) ? c.articles : []) {
    const title = clean(a?.title), kind = classifyBinanceTitle(title), t = Number(a?.releaseDate);
    if (!kind || !Number.isFinite(t)) continue;
    const symbols = tickersIn(title);
    if (symbols.length) out.push({ kind, exchange: "Binance", symbols, title, at: new Date(t).toISOString() });
  }
  return out;
}

/** Upbit api-manager notices: 거래지원 종료 = delisting, 유의 종목 = caution, 신규 거래지원 = new listing. */
export function parseUpbitNotices(raw: unknown): ExchangeNotice[] {
  const list = (raw as any)?.data?.list ?? (raw as any)?.data?.notices;
  if (!Array.isArray(list)) throw new Error("Upbit notices: expected data.list");
  const out: ExchangeNotice[] = [];
  for (const n of list) {
    const title = clean(n?.title), at = Date.parse(String(n?.created_at ?? n?.listed_at ?? ""));
    if (!Number.isFinite(at)) continue;
    const kind: NoticeKind | null = /거래지원 종료|(end|termination) of (trading|market) support|delist/i.test(title) ? "DELIST"
      : /유의\s*종목|투자유의|caution|investment warning/i.test(title) ? (/해제|release|lift/i.test(title) ? null : "CAUTION")
      : /신규 거래지원|디지털 자산 추가|market support for|new listing/i.test(title) ? "LISTING" : null;
    if (!kind) continue;
    const symbols = tickersIn(title);
    if (symbols.length) out.push({ kind, exchange: "Upbit", symbols, title, at: new Date(at).toISOString() });
  }
  return out;
}

/** Latest notice per symbol within `days` (risk notices win over listings). */
export function noticesBySymbol(notices: ExchangeNotice[], now: number, days = 30): Map<string, ExchangeNotice> {
  const rank: Record<NoticeKind, number> = { DELIST: 3, MONITORING_TAG: 2, CAUTION: 2, LISTING: 1 };
  const out = new Map<string, ExchangeNotice>();
  for (const n of notices) {
    if (now - Date.parse(n.at) > days * 86_400_000) continue;
    for (const s of n.symbols) { const prev = out.get(s); if (!prev || rank[n.kind] > rank[prev.kind] || (rank[n.kind] === rank[prev.kind] && n.at > prev.at)) out.set(s, n); }
  }
  return out;
}
