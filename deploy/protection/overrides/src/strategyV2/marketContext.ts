// Free, keyless context feeds. Each is information only: none carries forecast or allocation weight, none can promote a
// coin or authorise a trade, and the page shows a feed only once it has returned data.
//   Deribit public options book: near-money implied volatility and put/call open interest for BTC.
//   Coin Metrics community API: BTC exchange inflow/outflow (USD) and active addresses (daily, "flash" = preliminary).
//   Snapshot hub: active DAO governance votes, matched to coins by CoinGecko id (or ticker + name when the id is missing).
import { normName } from "./exploits";

export interface OptionsContext { nearMoneyIvPct: number; putCallOiRatio: number; optionsCount: number; expiryWindowDays: [number, number] }
export interface ChainFlows { day: string; netflowUsd: number; netflow7dUsd: number; activeAddresses: number; activeAddresses30dAvg: number | null; preliminary: boolean }
export interface GovernanceVote { geckoId: string; symbol: string; space: string; title: string; endsAt: string; url: string }

const MONTHS: Record<string, number> = { JAN: 0, FEB: 1, MAR: 2, APR: 3, MAY: 4, JUN: 5, JUL: 6, AUG: 7, SEP: 8, OCT: 9, NOV: 10, DEC: 11 };
/** "BTC-27NOV26-73000-P" -> { expiry (08:00 UTC), strike, put } */
export function parseDeribitInstrument(name: string): { expiry: number; strike: number; put: boolean } | null {
  const m = /^[A-Z]+-(\d{1,2})([A-Z]{3})(\d{2})-(\d+(?:\.\d+)?)-([CP])$/.exec(name);
  if (!m || MONTHS[m[2]!] == null) return null;
  return { expiry: Date.UTC(2000 + Number(m[3]), MONTHS[m[2]!]!, Number(m[1]), 8), strike: Number(m[4]), put: m[5] === "P" };
}

/** get_book_summary_by_currency?kind=option. Near-money = strike within ±10% of the underlying, expiry 7-45 days out. */
export function parseDeribitOptions(raw: unknown, now: number): OptionsContext {
  const rows = (raw as any)?.result;
  if (!Array.isArray(rows) || !rows.length) throw new Error("Deribit: expected result[]");
  let putOi = 0, callOi = 0, ivW = 0, w = 0;
  for (const r of rows) {
    const inst = parseDeribitInstrument(String(r?.instrument_name ?? "")), oi = Number(r?.open_interest), iv = Number(r?.mark_iv), u = Number(r?.underlying_price);
    if (!inst || !(oi >= 0)) continue;
    if (inst.put) putOi += oi; else callOi += oi;
    const days = (inst.expiry - now) / 86_400_000;
    if (days >= 7 && days <= 45 && u > 0 && Math.abs(inst.strike / u - 1) <= 0.1 && iv > 0 && oi > 0) { ivW += iv * oi; w += oi; }
  }
  if (!w || !callOi) throw new Error("Deribit: no near-money open interest");
  return { nearMoneyIvPct: Math.round((ivW / w) * 10) / 10, putCallOiRatio: Math.round((putOi / callOi) * 100) / 100, optionsCount: rows.length, expiryWindowDays: [7, 45] };
}

/** timeseries/asset-metrics?assets=btc&metrics=AdrActCnt,FlowInExUSD,FlowOutExUSD&frequency=1d (oldest first). */
export function parseCoinMetricsFlows(raw: unknown): ChainFlows {
  const rows = ((raw as any)?.data ?? []).filter((r: any) => r?.asset === "btc" && Number.isFinite(Number(r?.FlowInExUSD)) && Number.isFinite(Number(r?.FlowOutExUSD)));
  if (!rows.length) throw new Error("Coin Metrics: no BTC flow rows");
  const net = (r: any) => Number(r.FlowInExUSD) - Number(r.FlowOutExUSD);
  const last = rows.at(-1), act = rows.map((r: any) => Number(r.AdrActCnt)).filter(Number.isFinite);
  return {
    day: String(last.time).slice(0, 10), netflowUsd: Math.round(net(last)), netflow7dUsd: Math.round(rows.slice(-7).reduce((s: number, r: any) => s + net(r), 0)),
    activeAddresses: Number(last.AdrActCnt), activeAddresses30dAvg: act.length >= 20 ? Math.round(act.slice(-30).reduce((a: number, b: number) => a + b, 0) / Math.min(30, act.length)) : null,
    preliminary: last["FlowInExUSD-status"] === "flash",
  };
}

/** Snapshot proposals(state:"active") with space { id name coingecko symbol }, matched to coins in the market list. */
export function matchGovernance(raw: unknown, market: Array<{ geckoId: string; symbol: string; name: string }>, now: number): GovernanceVote[] {
  const list = (raw as any)?.data?.proposals;
  if (!Array.isArray(list)) throw new Error("Snapshot: expected data.proposals");
  const byId = new Map(market.map((c) => [c.geckoId, c]));
  const bySym = new Map<string, typeof market>();
  for (const c of market) bySym.set(c.symbol, [...(bySym.get(c.symbol) ?? []), c]);
  const out: GovernanceVote[] = [];
  for (const p of list) {
    const sp = p?.space ?? {}, end = Number(p?.end) * 1000;
    if (!Number.isFinite(end) || end < now || typeof p?.id !== "string" || typeof sp?.id !== "string") continue;
    // CoinGecko id when the space declares one; otherwise the voting ticker, only if unique and the space is named after the coin.
    const sym = typeof sp.symbol === "string" ? sp.symbol.toUpperCase() : "";
    const cand = (typeof sp.coingecko === "string" && byId.get(sp.coingecko))
      || ((bySym.get(sym) ?? []).length === 1 && normName(String(sp.name ?? "")).includes(normName(bySym.get(sym)![0]!.name)) ? bySym.get(sym)![0] : null);
    if (!cand) continue;
    out.push({ geckoId: cand.geckoId, symbol: cand.symbol, space: String(sp.name ?? sp.id).slice(0, 80), title: String(p.title ?? "").replace(/[\u0000-\u001f<>]/g, " ").slice(0, 160),
      endsAt: new Date(end).toISOString(), url: `https://snapshot.box/#/s:${encodeURIComponent(sp.id)}/proposal/${encodeURIComponent(p.id)}` });
  }
  return out.sort((a, b) => a.endsAt.localeCompare(b.endsAt));
}

export const SNAPSHOT_ACTIVE_URL = "https://hub.snapshot.org/graphql?query=" + encodeURIComponent(
  '{proposals(first:200,orderBy:"created",orderDirection:desc,where:{state:"active"}){id title end space{id name coingecko symbol}}}');
export const COINMETRICS_BTC_URL = "https://community-api.coinmetrics.io/v4/timeseries/asset-metrics?assets=btc&metrics=AdrActCnt,FlowInExUSD,FlowOutExUSD&frequency=1d&limit_per_asset=30&page_size=30";
export const DERIBIT_BTC_OPTIONS_URL = "https://www.deribit.com/api/v2/public/get_book_summary_by_currency?currency=BTC&kind=option";
