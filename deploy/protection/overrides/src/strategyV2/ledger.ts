// Decision ledger: an append-only daily record of every Zobiris decision and the market state behind it, and a
// forward paper test scored from that record alone (no look-ahead: an outcome only uses prices recorded later).
//
// Scoring rules
//  - A signal counts once, on the first day of a run (a coin in a buy zone for 8 days is one event, not 8).
//  - Buy-zone events only count if a later recorded price reached the limit within 14 days; return is from the limit.
//  - Every other group enters at that day's price.
//  - Net return pays the shared Kraken cost schedule (costs.ts): maker fee on entry, taker fee plus half the
//    bid-ask spread on exit.
//  - Each event is compared with holding BTC over the same days.
//  - A coin with no recorded price at the horizon (dropped out of the data, e.g. delisted) is counted as "lost
//    coverage", never silently dropped and never averaged in.
import { netReturnPct } from "./costs";
import { decisionGroup, type DecisionGroup, type StrategyReport } from "./report";

export interface SnapshotRow { kind: "snapshot"; day: string; at: string; regime: string; score: number; altGate: string; dominancePct: number | null; stablecoinChange30dPct: number | null; breadth30dPositive: number | null; btcPriceUsd: number | null }
export interface DecisionRow { kind: "decision"; day: string; symbol: string; name: string; rank: number | null; source: "watchlist" | "market"; group: DecisionGroup; signal: string; priceUsd: number | null; limitPriceUsd: number | null; convexityScore: number | null }
/** One opening per day (rank 101+): its volume-shock class, opening score and verdict, for the forward test by class. */
export interface SignalRow { kind: "signal"; day: string; symbol: string; geckoId: string; rank: number | null; tier: string; volumeClass: string; score: number; verdict: string; priceUsd: number | null }
export type LedgerRow = SnapshotRow | DecisionRow | SignalRow;

export const HORIZONS = [7, 30, 90] as const;
export const FILL_WINDOW_DAYS = 14;

export const dayOf = (iso: string) => iso.slice(0, 10);
const addDays = (day: string, n: number) => new Date(Date.parse(day + "T00:00:00Z") + n * 86_400_000).toISOString().slice(0, 10);

/** The rows to append for one report (one snapshot + one decision per watchlist coin and market candidate). */
export function rowsForReport(report: StrategyReport): LedgerRow[] {
  const day = dayOf(report.asOf);
  const btc = report.watchlist.find((d) => d.symbol === "BTC");
  const rows: LedgerRow[] = [{
    kind: "snapshot", day, at: report.asOf, regime: report.regime.state, score: report.regime.score, altGate: report.altGate?.state ?? "UNKNOWN",
    dominancePct: report.altGate?.dominanceNowPct ?? null, stablecoinChange30dPct: report.altGate?.stablecoinChange30dPct ?? null,
    breadth30dPositive: report.altGate?.breadth30dPositive ?? null, btcPriceUsd: btc?.priceUsd ?? report.regime.close,
  }];
  const seen = new Set<string>();
  for (const d of report.watchlist) {
    if (seen.has(d.symbol)) continue;
    seen.add(d.symbol);
    rows.push({ kind: "decision", day, symbol: d.symbol, name: d.name, rank: d.rank, source: "watchlist", group: decisionGroup(d), signal: d.signal,
      priceUsd: d.priceUsd, limitPriceUsd: d.rotation?.limitPriceUsd ?? null, convexityScore: d.smallCap?.eligible ? d.smallCap.convexityScore : null });
  }
  const openings = report.valleyForge?.openings ?? [];
  const logged = new Set<string>();
  for (const o of openings) {
    if (logged.has(o.symbol) || o.priceUsd == null) continue;
    logged.add(o.symbol);
    rows.push({ kind: "signal", day, symbol: o.symbol, geckoId: o.geckoId, rank: o.rank, tier: o.tier, volumeClass: o.volume.class, score: o.score, verdict: o.verdict, priceUsd: o.priceUsd });
  }
  // Exchange events, logged as their own "class" so the forward test measures what each kind led to.
  for (const a of report.valleyForge?.exchangeAlerts ?? []) {
    if (a.priceUsd == null) continue;
    rows.push({ kind: "signal", day, symbol: a.symbol, geckoId: a.geckoId, rank: a.rank, tier: "event", volumeClass: `EVENT_${a.exchange.toUpperCase()}_${a.kind}`, score: 0, verdict: a.kind === "LISTING" ? "WATCH" : "AVOID", priceUsd: a.priceUsd });
  }
  for (const c of report.marketSmallCapCandidates) {
    if (seen.has(c.symbol)) continue;
    seen.add(c.symbol);
    rows.push({ kind: "decision", day, symbol: c.symbol, name: c.name, rank: c.rank, source: "market", group: "bet", signal: `Small bet candidate · score ${c.convexityScore}`,
      priceUsd: c.priceUsd ?? null, limitPriceUsd: null, convexityScore: c.convexityScore });
  }
  return rows;
}

export interface GroupStats { group: DecisionGroup; events: number; filled: number; horizons: Record<string, { n: number; avgNetPct: number | null; medianNetPct: number | null; hitRate: number | null; avgVsBtcPct: number | null; lostCoverage: number; pending: number }> }
export interface LedgerSummary { firstDay: string | null; lastDay: string | null; days: number; groups: GroupStats[]; recent: Array<{ day: string; symbol: string; group: DecisionGroup; entryUsd: number | null; filled: boolean | null; ret30Pct: number | null }> }

const median = (xs: number[]) => { if (!xs.length) return null; const s = [...xs].sort((a, b) => a - b); const m = s.length >> 1; return s.length % 2 ? s[m]! : (s[m - 1]! + s[m]!) / 2; };
const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);

export function summarizeLedger(rows: LedgerRow[], today: string): LedgerSummary {
  const decisions = rows.filter((r): r is DecisionRow => r.kind === "decision");
  const days = [...new Set(rows.map((r) => r.day))].sort();
  const lastDay = days.at(-1) ?? today;
  // price[symbol][day] from every recorded row (this is the only price source: no look-ahead, no outside data)
  const price = new Map<string, Map<string, number>>();
  for (const r of decisions) if (r.priceUsd != null && r.priceUsd > 0) { if (!price.has(r.symbol)) price.set(r.symbol, new Map()); price.get(r.symbol)!.set(r.day, r.priceUsd); }
  for (const r of rows) if (r.kind === "signal" && r.priceUsd != null && r.priceUsd > 0) { if (!price.has(r.symbol)) price.set(r.symbol, new Map()); if (!price.get(r.symbol)!.has(r.day)) price.get(r.symbol)!.set(r.day, r.priceUsd); }
  for (const r of rows) if (r.kind === "snapshot" && r.btcPriceUsd) { if (!price.has("BTC")) price.set("BTC", new Map()); if (!price.get("BTC")!.has(r.day)) price.get("BTC")!.set(r.day, r.btcPriceUsd); }
  const priceAt = (sym: string, day: string, slackDays = 3) => { const m = price.get(sym); if (!m) return null; for (let k = 0; k <= slackDays; k++) { const v = m.get(addDays(day, k)); if (v != null) return v; } return null; };

  // Signal onsets: first day of each run of the same group for a symbol.
  const bySym = new Map<string, DecisionRow[]>();
  for (const r of decisions) { if (!bySym.has(r.symbol)) bySym.set(r.symbol, []); bySym.get(r.symbol)!.push(r); }
  const onsets: DecisionRow[] = [];
  for (const list of bySym.values()) {
    list.sort((a, b) => a.day.localeCompare(b.day));
    list.forEach((r, i) => { const prev = list[i - 1]; if (!prev || prev.group !== r.group || addDays(prev.day, 3) < r.day) onsets.push(r); }); // a gap of more than 3 days starts a new run
  }

  const groups: DecisionGroup[] = ["buy", "bet", "watch", "wait", "filtered"];
  const recent: LedgerSummary["recent"] = [];
  const stats = groups.map((group): GroupStats => {
    const ev = onsets.filter((r) => r.group === group && r.priceUsd != null);
    let filled = 0;
    const per: GroupStats["horizons"] = {};
    for (const h of HORIZONS) per[`${h}d`] = { n: 0, avgNetPct: null, medianNetPct: null, hitRate: null, avgVsBtcPct: null, lostCoverage: 0, pending: 0 };
    const rets: Record<string, number[]> = {}, vsBtc: Record<string, number[]> = {};
    for (const r of ev) {
      let entry = r.priceUsd!, entryDay = r.day, isFilled: boolean | null = null;
      if (group === "buy" && r.limitPriceUsd) {
        isFilled = false;
        for (let k = 1; k <= FILL_WINDOW_DAYS; k++) { const p = price.get(r.symbol)?.get(addDays(r.day, k)); if (p != null && p <= r.limitPriceUsd) { isFilled = true; entry = r.limitPriceUsd; entryDay = addDays(r.day, k); break; } }
        if (!isFilled) { if (addDays(r.day, FILL_WINDOW_DAYS) <= today) recent.push({ day: r.day, symbol: r.symbol, group, entryUsd: r.limitPriceUsd, filled: false, ret30Pct: null }); continue; }
        filled++;
      }
      let ret30: number | null = null;
      for (const h of HORIZONS) {
        const key = `${h}d`, exitDay = addDays(entryDay, h);
        if (exitDay > today) { per[key]!.pending++; continue; }
        const exit = priceAt(r.symbol, exitDay);
        // Not recorded yet (the exit day or its 3-day slack is after the last recorded day) is pending, not lost.
        if (exit == null) { if (addDays(exitDay, 3) > lastDay) per[key]!.pending++; else per[key]!.lostCoverage++; continue; }
        const net = netReturnPct(entry, exit, r.symbol, r.rank);
        (rets[key] ??= []).push(net);
        if (h === 30) ret30 = net;
        const b0 = priceAt("BTC", entryDay, 0) ?? priceAt("BTC", entryDay), b1 = priceAt("BTC", exitDay);
        if (b0 && b1) (vsBtc[key] ??= []).push(net - ((b1 / b0) - 1) * 100);
      }
      recent.push({ day: r.day, symbol: r.symbol, group, entryUsd: entry, filled: isFilled, ret30Pct: ret30 });
    }
    for (const h of HORIZONS) {
      const key = `${h}d`, xs = rets[key] ?? [];
      Object.assign(per[key]!, { n: xs.length, avgNetPct: avg(xs), medianNetPct: median(xs), hitRate: xs.length ? xs.filter((x) => x > 0).length / xs.length : null, avgVsBtcPct: avg(vsBtc[key] ?? []) });
    }
    return { group, events: ev.length, filled, horizons: per };
  });
  recent.sort((a, b) => b.day.localeCompare(a.day));
  return { firstDay: days[0] ?? null, lastDay: days.length ? lastDay : null, days: days.length, groups: stats, recent: recent.filter((r) => r.group === "buy" || r.group === "bet").slice(0, 20) };
}

export interface SignalClassStats { key: string; events: number; horizons: Record<string, { n: number; avgNetPct: number | null; hitRate: number | null; avgVsBtcPct: number | null; pending: number; lostCoverage: number }> }

/**
 * Forward outcome of openings grouped by volume-shock class and by verdict. An event is the first day a coin shows a
 * class (repeats within 3 days are the same event). Entry at that day's recorded price, speculative-tier costs.
 */
export function summarizeSignals(rows: LedgerRow[], today: string): { byClass: SignalClassStats[]; byVerdict: SignalClassStats[] } {
  const sig = rows.filter((r): r is SignalRow => r.kind === "signal").sort((a, b) => a.day.localeCompare(b.day));
  const days = [...new Set(rows.map((r) => r.day))].sort();
  const lastDay = days.at(-1) ?? today;
  const price = new Map<string, Map<string, number>>();
  for (const r of rows) {
    const p = r.kind === "snapshot" ? null : r.priceUsd;
    if (r.kind !== "snapshot" && p != null && p > 0) { if (!price.has(r.symbol)) price.set(r.symbol, new Map()); if (!price.get(r.symbol)!.has(r.day)) price.get(r.symbol)!.set(r.day, p); }
    if (r.kind === "snapshot" && r.btcPriceUsd) { if (!price.has("BTC")) price.set("BTC", new Map()); if (!price.get("BTC")!.has(r.day)) price.get("BTC")!.set(r.day, r.btcPriceUsd); }
  }
  const at = (sym: string, day: string) => { const m = price.get(sym); if (!m) return null; for (let k = 0; k <= 3; k++) { const v = m.get(addDays(day, k)); if (v != null) return v; } return null; };
  const group = (keyOf: (r: SignalRow) => string): SignalClassStats[] => {
    const last = new Map<string, string>();
    const events: SignalRow[] = [];
    for (const r of sig) { const k = `${r.symbol}|${keyOf(r)}`; const prev = last.get(k); if (!prev || addDays(prev, 3) < r.day) events.push(r); last.set(k, r.day); }
    const keys = [...new Set(events.map(keyOf))].sort();
    return keys.map((key) => {
      const ev = events.filter((e) => keyOf(e) === key);
      const horizons: SignalClassStats["horizons"] = {};
      for (const h of [7, 30]) {
        const rets: number[] = [], vs: number[] = [];
        let pending = 0, lost = 0;
        for (const e of ev) {
          const exitDay = addDays(e.day, h);
          if (exitDay > today) { pending++; continue; }
          const exit = at(e.symbol, exitDay);
          if (exit == null) { if (addDays(exitDay, 3) > lastDay) pending++; else lost++; continue; }
          const net = netReturnPct(e.priceUsd!, exit, e.symbol, e.rank);
          rets.push(net);
          const b0 = at("BTC", e.day), b1 = at("BTC", exitDay);
          if (b0 && b1) vs.push(net - (b1 / b0 - 1) * 100);
        }
        horizons[`${h}d`] = { n: rets.length, avgNetPct: avg(rets), hitRate: rets.length ? rets.filter((x) => x > 0).length / rets.length : null, avgVsBtcPct: avg(vs), pending, lostCoverage: lost };
      }
      return { key, events: ev.length, horizons };
    });
  };
  return { byClass: group((r) => r.volumeClass), byVerdict: group((r) => r.verdict) };
}
