// Watchlist performance (equal-weight 7-day line from CoinGecko sparklines) and top 24h movers.
import { useMemo, useState } from "react";
import { AreaChart, RangeTabs, Sparkline, fmtPct, fmtUsd, toneOf } from "./charts";
import type { MarketQuote } from "./MarketToday";

/** Equal-weight index of the coins' 7-day sparklines, rebased to 0% at the start. Exported for tests. */
export function equalWeightIndex(quotes: MarketQuote[], endSec: number): Array<[number, number]> {
  const lines = quotes.map((q) => q.sparkline7d).filter((s) => s.length >= 10);
  if (!lines.length) return [];
  const n = Math.min(...lines.map((l) => l.length));
  const stepSec = (7 * 86400) / (n - 1);
  return Array.from({ length: n }, (_, i) => {
    const avg = lines.reduce((s, l) => { const a = l.slice(-n); return s + a[i]! / a[0]!; }, 0) / lines.length;
    return [Math.round(endSec - (n - 1 - i) * stepSec), (avg - 1) * 100] as [number, number];
  });
}

const TABS = ["Top gainers", "Top losers"] as const;

export function WatchlistInsights({ quotes, asOf }: { quotes: MarketQuote[]; asOf: string | null }) {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Top gainers");
  const index = useMemo(() => (asOf ? equalWeightIndex(quotes, Math.floor(Date.parse(asOf) / 1000)) : []), [quotes, asOf]);
  const movers = [...quotes].filter((q) => q.change24hPct != null).sort((a, b) => tab === "Top gainers" ? b.change24hPct! - a.change24hPct! : a.change24hPct! - b.change24hPct!).slice(0, 6);
  const last = index.at(-1)?.[1] ?? null;
  const up = quotes.filter((q) => (q.change7dPct ?? 0) > 0).length;
  return (
    <section className="zs-two">
      <article className="dashboard-panel zs-panel">
        <div className="zs-panel-head">
          <div><h2>Watchlist performance</h2><small className="strategy-muted">Equal-weight, {quotes.length} coins · last 7 days</small></div>
          <div className="zs-big-change"><strong className={toneOf(last)}>{fmtPct(last)}</strong><small>{up} of {quotes.length} up over 7d</small></div>
        </div>
        {index.length > 1 ? <AreaChart points={index} height={200} format={(v) => fmtPct(v, 1)} ariaLabel="Equal-weight watchlist performance over 7 days" /> : <div className="zs-empty">Loading 7-day prices…</div>}
      </article>
      <section className="dashboard-panel zs-panel" aria-label="Verified top watchlist movers">
        <div className="zs-panel-head"><h2>Top movers (24h)</h2><RangeTabs options={TABS} value={tab} onChange={setTab} label="Movers" /></div>
        <ol className="zs-movers">
          {movers.map((q, i) => (
            <li key={q.symbol}>
              <span className="zs-movers-rank">{i + 1}</span>
              <span className="asset-monogram" data-symbol={q.symbol} aria-hidden="true">{q.symbol[0]}</span>
              <span className="zs-movers-name"><strong>{q.name}</strong><small>{q.symbol}</small></span>
              <Sparkline values={q.sparkline7d} width={70} height={24} />
              <span className="zs-movers-price">{fmtUsd(q.priceUsd)}</span>
              <strong className={toneOf(q.change24hPct)}>{fmtPct(q.change24hPct)}</strong>
            </li>
          ))}
        </ol>
        {!movers.length ? <p className="strategy-muted">Loading 24-hour quotes…</p> : null}
      </section>
    </section>
  );
}
