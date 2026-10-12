// Portfolio header: KPI cards with sparklines, portfolio value over time, and allocation donut.
// Value history = your CURRENT holdings priced at each past Kraken daily close, plus today's cash.
// It is not your historical balance (trades in between are not replayed); the chart says so.
import { useMemo, useState, type ReactNode } from "react";
import { AreaChart, Donut, RangeTabs, Sparkline, fmtPct, fmtUsd, toneOf, useApi } from "./charts";

export interface OverviewRow { symbol: string; quantity: number; value: number; avgPriceUsd?: number | null }
export interface QuoteLite { change24hPct: number | null; sparkline7d: number[] }

const RANGES = ["1W", "1M", "3M", "1Y", "ALL"] as const;
type Range = (typeof RANGES)[number];
const DAYS: Record<Range, number> = { "1W": 7, "1M": 30, "3M": 90, "1Y": 365, ALL: 10_000 };

/** Sum of quantity x close on each day every held coin has a price; coins with no Kraken history count at today's value. */
export function valueSeries(rows: OverviewRow[], series: Record<string, Array<[number, number]>>, cashUsd: number): Array<[number, number]> {
  const priced = rows.filter((r) => series[r.symbol]?.length);
  const flat = rows.filter((r) => !series[r.symbol]?.length).reduce((s, r) => s + r.value, 0) + cashUsd;
  if (!priced.length) return [];
  const maps = priced.map((r) => new Map(series[r.symbol]!.map(([t, c]) => [Math.floor(t / 86400), c])));
  const start = Math.max(...priced.map((r) => Math.floor(series[r.symbol]![0]![0] / 86400)));
  const end = Math.max(...priced.map((r) => Math.floor(series[r.symbol]!.at(-1)![0] / 86400)));
  const last = maps.map(() => 0);
  const out: Array<[number, number]> = [];
  for (let d = start; d <= end; d++) {
    let v = flat;
    priced.forEach((r, i) => { const c = maps[i]!.get(d); if (c != null) last[i] = c; v += r.quantity * last[i]!; });
    if (last.every((c) => c > 0)) out.push([d * 86400, v]);
  }
  return out;
}

function Kpi({ label, value, sub, subTone, spark }: { label: string; value: string; sub?: ReactNode; subTone?: string; spark?: number[] }) {
  return (
    <div className="dashboard-metric zs-kpi">
      <span className="zs-kpi-label">{label}</span>
      <strong>{value}</strong>
      {sub ? <small className={subTone}>{sub}</small> : null}
      {spark && spark.length > 1 ? <Sparkline values={spark} width={110} height={34} className="zs-kpi-spark" /> : null}
    </div>
  );
}

export function PortfolioOverview({ rows, cashUsd, freeCashUsd, reservedUsd, maneuverUsd, accountSynced, quotes }: { rows: OverviewRow[]; cashUsd: number; freeCashUsd: number; reservedUsd: number; maneuverUsd: number; accountSynced: boolean; quotes: Record<string, QuoteLite | undefined> }) {
  const [range, setRange] = useState<Range>("1M");
  const symbols = rows.filter((r) => r.value > 0).map((r) => r.symbol).sort().join(",");
  const { data: hist, error } = useApi<{ series: Record<string, Array<[number, number]>>; missing: string[] }>(accountSynced && symbols ? `/api/price-history?symbols=${encodeURIComponent(symbols)}` : null, 30 * 60_000);
  const all = useMemo(() => (hist?.series ? valueSeries(rows, hist.series, cashUsd) : []), [hist, rows, cashUsd]);
  const shown = all.slice(-DAYS[range] - 1);

  if (!accountSynced) {
    return <section className="dashboard-metrics zs-kpis" aria-label="Portfolio overview">
      <Kpi label="Total value" value="Private" sub="Private account is locked on the public view" /><Kpi label="Total invested" value="Private" /><Kpi label="Total profit / loss" value="Private" /><Kpi label="24h change" value="Private" /><Kpi label="Maneuver capital" value="Private" sub="Unlock to view capital limits" />
    </section>;
  }

  const invested = rows.reduce((s, r) => s + r.value, 0);
  const total = invested + cashUsd;
  const withCost = rows.filter((r) => r.avgPriceUsd && r.avgPriceUsd > 0);
  const cost = withCost.reduce((s, r) => s + r.avgPriceUsd! * r.quantity, 0);
  const pl = withCost.reduce((s, r) => s + r.value, 0) - cost;
  const ch24 = rows.reduce((s, r) => { const c = quotes[r.symbol]?.change24hPct; return c == null ? s : s + r.value * (c / (100 + c)); }, 0);
  const startVal = shown[0]?.[1], endVal = shown.at(-1)?.[1];
  const rangeChange = startVal && endVal ? ((endVal / startVal) - 1) * 100 : null;
  const spark30 = all.slice(-31).map((p) => p[1]);
  const slices = [...rows.filter((r) => r.value > 0).map((r) => ({ label: r.symbol, value: r.value })).sort((a, b) => b.value - a.value), ...(cashUsd > 0 ? [{ label: "Cash", value: cashUsd }] : [])];
  const top = slices.slice(0, 8), rest = slices.slice(8).reduce((s, x) => s + x.value, 0);

  return (
    <>
      <section className="dashboard-metrics zs-kpis" aria-label="Portfolio overview">
        <Kpi label="Total value" value={fmtUsd(total)} sub={rangeChange == null ? undefined : `${fmtPct(rangeChange)} · ${range}`} subTone={toneOf(rangeChange)} spark={spark30} />
        <Kpi label="Total invested" value={fmtUsd(cost)} sub={`cost basis of ${withCost.length} of ${rows.length} positions`} />
        <Kpi label="Total profit / loss" value={(pl >= 0 ? "+" : "") + fmtUsd(pl)} sub={cost > 0 ? fmtPct((pl / cost) * 100) : undefined} subTone={toneOf(pl)} />
        <Kpi label="24h change" value={(ch24 >= 0 ? "+" : "") + fmtUsd(ch24)} sub={invested > 0 ? fmtPct((ch24 / (total - ch24)) * 100) : undefined} subTone={toneOf(ch24)} />
        <Kpi label="Cash" value={fmtUsd(cashUsd)} sub={<><span>{fmtUsd(freeCashUsd)}</span> free · <span>{fmtUsd(reservedUsd)}</span> reserved for buys<br />Maneuver capital {fmtUsd(maneuverUsd, 0)}</>} />
      </section>
      <section className="zs-two">
        <article className="dashboard-panel zs-panel">
          <div className="zs-panel-head">
            <div><h2>Portfolio value</h2><small className="strategy-muted">Current holdings at Kraken daily closes, plus cash · not your past balance</small></div>
            <RangeTabs options={RANGES} value={range} onChange={setRange} label="Portfolio value range" />
          </div>
          {shown.length > 1 ? <AreaChart points={shown} ariaLabel={`Portfolio value over ${range}`} /> : <div className="zs-empty">{error ? `Price history unavailable: ${error}` : "Loading price history…"}</div>}
          {hist?.missing?.length ? <small className="strategy-muted">No Kraken history for {hist.missing.join(", ")}: counted at today's value.</small> : null}
        </article>
        <article className="dashboard-panel zs-panel">
          <div className="zs-panel-head"><h2>Asset allocation</h2></div>
          <Donut slices={rest > 0 ? [...top, { label: "Others", value: rest }] : top} center={fmtUsd(total, 0)} sub="Total value" />
        </article>
      </section>
    </>
  );
}
