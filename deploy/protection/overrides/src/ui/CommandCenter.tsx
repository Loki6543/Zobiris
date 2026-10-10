import { useEffect, useMemo, useState } from "react";

type MarketPoint = { time: number; close: number };
type Brief = {
  asOf: string;
  chart: MarketPoint[];
  close: number;
  lower: number;
  upper: number;
  bias: string;
  market: string;
  daily: { rsi14: number; ema50: number; trend: string };
};
type Order = { symbol: string; side: "BUY" | "SELL"; targetPriceUsd: number; amountUsd: number };
type WatchItem = { symbol: string; move: string; reason: string; ready: boolean };
type Trade = { id: string; symbol: string; side: "BUY" | "SELL"; at: string; source: string };

type Props = {
  refreshKey: number;
  snapshotAsOf: number;
  snapshotFresh: boolean;
  regime: string;
  accountSynced: boolean;
  accountAsOf: string;
  portfolioValue: number;
  cash: number;
  freeCash: number;
  reservedBuys: number;
  orders: Order[];
  watch: WatchItem[];
  trades: Trade[];
  onNavigate: (view: "market" | "watchlist" | "history") => void;
  onAnalyze: (symbol: string) => void;
};

const price = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const money = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 });
const when = (iso: string) => Number.isFinite(Date.parse(iso)) ? new Date(iso).toLocaleString() : "unavailable";
const change = (points: MarketPoint[]) => {
  if (points.length < 2 || points[0]!.close <= 0) return null;
  return (points[points.length - 1]!.close / points[0]!.close - 1) * 100;
};
function frames(points: MarketPoint[]): { title: string; caption: string; points: MarketPoint[] }[] {
  const daily = points.slice(-14);
  const weekly: MarketPoint[] = [];
  for (let start = Math.max(0, points.length - 91); start < points.length; start += 7) {
    weekly.push(points[Math.min(points.length - 1, start + 6)]!);
  }
  const monthly: MarketPoint[] = [];
  for (let start = 0; start < points.length; start += 30) {
    monthly.push(points[Math.min(points.length - 1, start + 29)]!);
  }
  // The market-brief API currently supplies 90 completed daily closes, not 365.
  // A yearly plot must never be constructed from a 90-day sample.
  return [
    { title: "Daily", caption: "14 completed daily closes", points: daily },
    { title: "Weekly", caption: "7-day sampled closes · 90d source", points: weekly },
    { title: "Monthly", caption: "30-day sampled closes · 90d source", points: monthly },
    { title: "Yearly", caption: "365-day historical feed not connected", points: [] }
  ];
}
function ChartTile({ title, caption, points }: { title: string; caption: string; points: MarketPoint[] }) {
  const delta = change(points);
  if (points.length < 2) return (
    <article className="zcc-chart zcc-chart-missing">
      <div className="zcc-chart-head"><h3>{title}</h3><span className="zcc-muted">Unavailable</span></div>
      <div className="zcc-chart-empty" role="status">Awaiting verified historical candles</div>
      <p className="zcc-source">{caption}</p>
    </article>
  );
  const closes = points.map(p => p.close);
  const low = Math.min(...closes), high = Math.max(...closes);
  const padding = Math.max((high - low) * 0.14, high * 0.002);
  const range = Math.max(1, high - low + padding * 2);
  const coordinates = points.map((p, i) => {
    const x = 12 + i / Math.max(1, points.length - 1) * 356;
    const y = 105 - (p.close - (low - padding)) / range * 91;
    return [x, y];
  });
  const line = coordinates.map(p => p.join(",")).join(" ");
  const last = coordinates[coordinates.length - 1]!;
  return (
    <article className="zcc-chart">
      <div className="zcc-chart-head">
        <div><h3>{title}</h3><p>{caption}</p></div>
        <div className="zcc-chart-change"><strong>{price(points[points.length - 1]!.close)}</strong><span className={delta != null && delta >= 0 ? "zcc-positive" : "zcc-negative"}>{delta == null ? "—" : (delta >= 0 ? "+" : "") + delta.toFixed(2) + "%"}</span></div>
      </div>
      <svg viewBox="0 0 380 122" preserveAspectRatio="none" role="img" aria-label={title + " Bitcoin closing-price trend, " + (delta == null ? "change unavailable" : delta.toFixed(2) + " percent") + ". Source: Kraken completed daily candles."}>
        {[25,60,95].map(y => <line key={y} x1="8" x2="372" y1={y} y2={y} stroke="#294058" strokeOpacity=".72" strokeDasharray="3 5" />)}
        <polyline points={line} fill="none" stroke={delta != null && delta >= 0 ? "#59E1C5" : "#F17373"} strokeWidth="2.6" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        <circle cx={last[0]} cy={last[1]} r="3.7" fill="#EAF1FA" />
      </svg>
      <div className="zcc-chart-range"><span>{new Date(points[0]!.time * 1000).toLocaleDateString()}</span><span>Range {price(low)} – {price(high)}</span></div>
    </article>
  );
}

export function CommandCenter(props: Props) {
  const [brief, setBrief] = useState<Brief | null>(null);
  const [briefProblem, setBriefProblem] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      try {
        const response = await fetch("/api/market-brief", { signal: controller.signal });
        if (!response.ok) throw new Error("Market brief unavailable");
        const data = await response.json();
        if (!Array.isArray(data?.chart) || data.chart.length < 2 || !Number.isFinite(data.close) || !Number.isFinite(Date.parse(data.asOf))) throw new Error("Invalid market brief");
        if (Date.now() - Date.parse(data.asOf) > 36 * 60 * 60 * 1000) throw new Error("Market brief stale");
        if (!controller.signal.aborted) { setBrief(data); setBriefProblem(false); }
      } catch {
        if (!controller.signal.aborted) { setBrief(null); setBriefProblem(true); }
      }
    };
    void load();
    const timer = window.setInterval(() => void load(), 60_000);
    return () => { controller.abort(); window.clearInterval(timer); };
  }, [props.refreshKey]);
  const chartFrames = useMemo(() => frames(brief?.chart ?? []), [brief]);
  const importantOrders = props.accountSynced ? props.orders.slice(0, 4) : [];
  const latestTrades = props.accountSynced ? [...props.trades].sort((a, b) => Date.parse(b.at) - Date.parse(a.at)).slice(0, 3) : [];
  return (
    <section className="zcc" aria-label="Zobiris command center">
      <div className="zcc-heading">
        <div>
          <div className="zcc-eyebrow">ZOBIRIS / MARKET INTELLIGENCE WORKSPACE</div>
          <h1>Command Center <span className="zcc-trailing">/ Overview</span></h1>
          <p>What changed, what matters, and which limits deserve review.</p>
        </div>
        <div className="zcc-feed">
          <span className={props.snapshotFresh ? "zcc-feed-dot" : "zcc-feed-dot zcc-feed-stale"} aria-hidden="true" />
          <strong>{props.snapshotFresh ? "Market snapshot current" : "Market snapshot stale / unavailable"}</strong>
          <span>{Number.isFinite(props.snapshotAsOf) ? new Date(props.snapshotAsOf).toLocaleString() : "No market timestamp"} · trading disabled</span>
        </div>
      </div>

      <div className="zcc-metrics" aria-label="Capital and market overview">
        <div className="zcc-stat"><span>Portfolio equity</span><strong>{props.accountSynced ? money(props.portfolioValue) : "Private"}</strong><small>{props.accountSynced ? "Kraken read-only snapshot" : "Unlock portfolio for balances"}</small></div>
        <div className="zcc-stat"><span>Unreserved cash</span><strong>{props.accountSynced ? money(props.freeCash) : "Private"}</strong><small>{props.accountSynced ? money(props.reservedBuys) + " reserved in buy limits" : "No public cash figure"}</small></div>
        <div className="zcc-stat"><span>Market regime</span><strong className="zcc-regime">{props.snapshotFresh ? props.regime : "Verify market"}</strong><small>Engine classification, not a forecast</small></div>
        <div className="zcc-stat"><span>Pending limits</span><strong>{props.accountSynced ? String(props.orders.length) : "Private"}</strong><small>{props.accountSynced ? "Reported by Kraken private account" : "Order states not available publicly"}</small></div>
      </div>

      <div className="zcc-workspace">
        <div className="zcc-main">
          <section className="zcc-panel zcc-market">
            <div className="zcc-panel-title"><div><span className="zcc-eyebrow">MULTI-TIMEFRAME MARKET STRUCTURE</span><h2>Bitcoin / USD</h2><p>Completed daily closes · not intraday quotes · no simulated prices</p></div><button type="button" onClick={() => props.onNavigate("market")}>Full analysis ↗</button></div>
            {brief ? (
              <>
                <div className="zcc-chart-grid">{chartFrames.map(frame => <ChartTile key={frame.title} {...frame} />)}</div>
                <div className="zcc-market-foot"><span>Kraken daily candles through {when(brief.asOf)}</span><span>Daily RSI 14: {Number.isFinite(brief.daily?.rsi14) ? brief.daily.rsi14.toFixed(1) : "—"} · Bias: {brief.bias}</span></div>
              </>
            ) : <div className="zcc-fetch-state" role="status">{briefProblem ? "Verified BTC daily history is unavailable or too old. No trend chart is shown." : "Loading completed Kraken BTC candles…"}</div>}
          </section>

          <section className="zcc-panel zcc-watch">
            <div className="zcc-panel-title"><div><span className="zcc-eyebrow">RESEARCH QUEUE</span><h2>Watchlist priorities</h2><p>Investigation only — entry and liquidity checks still apply</p></div><button type="button" onClick={() => props.onNavigate("watchlist")}>All assets ↗</button></div>
            <div className="zcc-watch-table" role="list">
              {props.watch.slice(0, 5).map((item, index) => <div className="zcc-watch-row" role="listitem" key={item.symbol}>
                <span className="zcc-index">{String(index + 1).padStart(2, "0")}</span><strong>{item.symbol}</strong>
                <div><span className={item.ready && props.snapshotFresh ? "zcc-state zcc-ready" : "zcc-state"}>{props.snapshotFresh ? item.move : "Wait · stale market"}</span><small>{props.snapshotFresh ? item.reason : "Refresh before considering any entry"}</small></div>
                <button type="button" onClick={() => props.onAnalyze(item.symbol)} aria-label={"Analyze " + item.symbol}>Inspect ↗</button>
              </div>)}
              {!props.watch.length && <p className="zcc-muted">Waiting for a ranked, verified watchlist snapshot.</p>}
            </div>
          </section>
        </div>

        <aside className="zcc-rail" aria-label="Decision context">
          <section className="zcc-panel zcc-rail-portfolio">
            <div className="zcc-panel-title"><div><span className="zcc-eyebrow">CAPITAL DISCIPLINE</span><h2>Portfolio posture</h2></div></div>
            {props.accountSynced ? <>
              <div className="zcc-cash-row"><span>Cash allocation</span><strong>{props.portfolioValue > 0 ? (props.cash / props.portfolioValue * 100).toFixed(1) + "%" : "—"}</strong></div>
              <div className="zcc-capital-bar" aria-label="Cash allocation of portfolio" role="img"><div style={{ width: Math.max(0, Math.min(100, props.portfolioValue > 0 ? props.cash / props.portfolioValue * 100 : 0)) + "%" }} /></div>
              <div className="zcc-cash-row"><span>Available without buy reservations</span><strong>{money(props.freeCash)}</strong></div>
              <p className="zcc-source">Kraken account checked {when(props.accountAsOf)}. Values can differ from executable buying power.</p>
            </> : <p className="zcc-source">Private account locked. ZOBIRIS does not display stored holdings, order prices or trade history in public mode.</p>}
          </section>

          <section className="zcc-panel">
            <div className="zcc-panel-title"><div><span className="zcc-eyebrow">PENDING EXPOSURE</span><h2>Open order levels</h2></div></div>
            {props.accountSynced && importantOrders.length ? importantOrders.map((order, i) => <div className="zcc-order" key={order.symbol + order.side + i}>
              <div><strong>{order.side} {order.symbol}</strong><small>{money(order.amountUsd)} order notional</small></div>
              <strong>{order.targetPriceUsd > 0 ? order.targetPriceUsd.toLocaleString("en-US", {maximumFractionDigits: 10}) : "—"}</strong>
            </div>) : <p className="zcc-source">{props.accountSynced ? "No open orders reported. Verify directly in Kraken." : "Unlock private account to inspect orders."}</p>}
            {props.accountSynced && props.orders.length > importantOrders.length ? <p className="zcc-source">+{props.orders.length - importantOrders.length} further orders in Portfolio.</p> : null}
          </section>

          <section className="zcc-panel">
            <div className="zcc-panel-title"><div><span className="zcc-eyebrow">EVIDENCE & MEMORY</span><h2>Recent recorded activity</h2></div><button type="button" onClick={() => props.onNavigate("history")}>History ↗</button></div>
            {latestTrades.length ? latestTrades.map(trade => <div className="zcc-memory" key={trade.id}>
              <strong>{trade.side} {trade.symbol}</strong><span>{when(trade.at)}</span><small>{trade.source}; recorded event, not a predictive outcome</small>
            </div>) : <p className="zcc-source">{props.accountSynced ? "No recorded Kraken trades available." : "The research memory and private trade ledger are separate. Unlock to view account activity."}</p>}
            <p className="zcc-source">Versioned hypothesis and outcome comparison is not yet connected to this panel.</p>
          </section>
        </aside>
      </div>
      <p className="zcc-disclaimer">ZOBIRIS is decision support only. Market observations, analyst interpretations, unconfirmed order statuses and exchange-confirmed fills must remain distinct. This screen never places trades.</p>
    </section>
  );
}
