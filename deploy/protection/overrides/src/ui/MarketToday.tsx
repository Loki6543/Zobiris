// Market Today header: headline coin cards, BTC candlesticks, key market metrics and technical indicators.
import { useState } from "react";
import { CandleChart, RangeTabs, Sparkline, fmtBig, fmtPct, fmtUsd, toneOf, type OhlcPoint } from "./charts";

export interface MarketQuote { symbol: string; name: string; rank: number | null; priceUsd: number | null; change24hPct: number | null; change7dPct: number | null; marketCapUsd: number | null; volume24hUsd: number | null; circulatingSupply: number | null; maxSupply: number | null; sparkline7d: number[] }
export interface MarketOverview {
  asOf: string;
  quotes: Record<string, MarketQuote>;
  global: { totalMarketCapUsd: number | null; totalVolumeUsd: number | null; btcDominancePct: number | null; marketCapChange24hPct: number | null } | null;
  fearGreed: Array<{ time: number; value: number; label: string }>;
  btc: { candles: OhlcPoint[]; technicals: { rsi14: number | null; rsiLabel: string; macd: { macd: number; signal: number; histogram: number } | null; macdLabel: string; sma50: number | null; sma200: number | null; close: number | null } };
}

const RANGES = ["1M", "3M", "6M", "1Y"] as const;
type Range = (typeof RANGES)[number];
const DAYS: Record<Range, number> = { "1M": 30, "3M": 90, "6M": 180, "1Y": 365 };
const COIN_COLORS: Record<string, string> = { BTC: "#f7931a", ETH: "#627eea", SOL: "#14f195" };

function CoinCard({ q }: { q: MarketQuote }) {
  return (
    <article className="dashboard-metric zs-coin">
      <div className="zs-coin-head"><span className="asset-monogram" data-symbol={q.symbol} style={{ background: COIN_COLORS[q.symbol] }} aria-hidden="true">{q.symbol[0]}</span><strong>{q.name}</strong><small>{q.symbol}</small></div>
      <div className="zs-coin-body">
        <div><strong className="zs-coin-price">{fmtUsd(q.priceUsd)}</strong><small className={toneOf(q.change24hPct)}>{fmtPct(q.change24hPct)} 24h</small></div>
        <div className="zs-coin-spark"><Sparkline values={q.sparkline7d} width={130} height={44} /><small>7d {fmtPct(q.change7dPct, 1)}</small></div>
      </div>
    </article>
  );
}

function FearGreed({ history }: { history: MarketOverview["fearGreed"] }) {
  const now = history.at(-1);
  if (!now) return <span>—</span>;
  const tone = now.value >= 75 ? "is-extreme-greed" : now.value >= 55 ? "is-greed" : now.value > 45 ? "is-neutral" : now.value > 25 ? "is-fear" : "is-extreme-fear";
  return <span className={`zs-fng ${tone}`}><strong>{now.value}</strong> {now.label}</span>;
}

export function MarketToday({ data }: { data: MarketOverview | null }) {
  const [range, setRange] = useState<Range>("3M");
  if (!data) return <section className="dashboard-panel zs-panel"><p className="strategy-muted">Loading market data…</p></section>;
  const btc = data.quotes.BTC, t = data.btc.technicals;
  const candles = data.btc.candles.slice(-DAYS[range]);
  const fng = data.fearGreed;
  const vsSma = (s: number | null) => (s && t.close ? ((t.close / s) - 1) * 100 : null);
  return (
    <>
      <section className="zs-coins" aria-label="Major coins">{["BTC", "ETH", "SOL"].map((s) => data.quotes[s] ? <CoinCard key={s} q={data.quotes[s]!} /> : null)}</section>
      <section className="zs-two zs-two-wide">
        <article className="dashboard-panel zs-panel">
          <div className="zs-panel-head">
            <div><h2>Bitcoin (BTC)</h2><div className="zs-price-line"><strong>{fmtUsd(btc?.priceUsd)}</strong><span className={toneOf(btc?.change24hPct)}>{fmtPct(btc?.change24hPct)} (24h)</span></div></div>
            <RangeTabs options={RANGES} value={range} onChange={setRange} label="Bitcoin chart range" />
          </div>
          <CandleChart candles={candles} height={380} ariaLabel={`Bitcoin daily candles, last ${DAYS[range]} days`} />
          <small className="strategy-muted">Kraken daily candles · volume in USD</small>
        </article>
        <div className="zs-stack">
          <article className="dashboard-panel zs-panel">
            <div className="zs-panel-head"><h2>Key metrics</h2></div>
            <dl className="zs-metrics">
              <div><dt>BTC market cap</dt><dd>{fmtBig(btc?.marketCapUsd)}</dd></div>
              <div><dt>BTC 24h volume</dt><dd>{fmtBig(btc?.volume24hUsd)}</dd></div>
              <div><dt>Circulating supply</dt><dd>{btc?.circulatingSupply ? (btc.circulatingSupply / 1e6).toFixed(2) + "M BTC" : "—"}</dd></div>
              <div><dt>Max supply</dt><dd>{btc?.maxSupply ? (btc.maxSupply / 1e6).toFixed(2) + "M BTC" : "—"}</dd></div>
              <div><dt>BTC dominance</dt><dd>{data.global?.btcDominancePct != null ? data.global.btcDominancePct.toFixed(1) + "%" : "—"}</dd></div>
              <div><dt>Total crypto market</dt><dd>{fmtBig(data.global?.totalMarketCapUsd)} <small className={toneOf(data.global?.marketCapChange24hPct)}>{fmtPct(data.global?.marketCapChange24hPct, 1)}</small></dd></div>
              <div><dt>Fear &amp; Greed index</dt><dd><FearGreed history={fng} /></dd></div>
            </dl>
            {fng.length > 1 ? <div className="zs-fng-spark"><Sparkline values={fng.map((f) => f.value)} width={220} height={28} /><small className="strategy-muted">last {fng.length} days</small></div> : null}
            {fng.length ? <div className="zs-fng-bar" aria-hidden="true"><i style={{ left: `${fng.at(-1)!.value}%` }} /></div> : null}
          </article>
          <article className="dashboard-panel zs-panel">
            <div className="zs-panel-head"><h2>Technical indicators</h2><small className="strategy-muted">BTC daily</small></div>
            <dl className="zs-metrics">
              <div><dt>RSI (14)</dt><dd>{t.rsi14 != null ? t.rsi14.toFixed(1) : "—"} <span className={`zs-chip ${t.rsiLabel === "Overbought" ? "is-loss" : t.rsiLabel === "Oversold" ? "is-gain" : ""}`}>{t.rsiLabel}</span></dd></div>
              <div><dt>MACD (12, 26, 9)</dt><dd><span className={`zs-chip ${t.macd ? toneOf(t.macd.histogram) : ""}`}>{t.macdLabel}</span></dd></div>
              <div><dt>50-day SMA</dt><dd>{fmtUsd(t.sma50, 0)} <small className={toneOf(vsSma(t.sma50))}>{fmtPct(vsSma(t.sma50), 1)}</small></dd></div>
              <div><dt>200-day SMA</dt><dd>{fmtUsd(t.sma200, 0)} <small className={toneOf(vsSma(t.sma200))}>{fmtPct(vsSma(t.sma200), 1)}</small></dd></div>
            </dl>
            {t.rsi14 != null ? <div className="zs-rsi" aria-hidden="true"><span className="zs-rsi-zone" /><i style={{ left: `${t.rsi14}%` }} /></div> : null}
          </article>
        </div>
      </section>
    </>
  );
}
