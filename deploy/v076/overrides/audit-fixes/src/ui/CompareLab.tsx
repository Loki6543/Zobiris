import { useEffect, useMemo, useState } from "react";

type Point = { time: number; close: number };
type Series = { symbol: string; points: Point[] };
type Comparison = {
  source: string; provenance: string; asOf: string; observedDays: number; series: Series[];
};
const colors = ["#f7b84b", "#65c5ee", "#77dfab", "#ca9af7", "#f08283"];
const card = { background: "#171c25", border: "1px solid #303744", borderRadius: 12, padding: 18 };
const button = { background: "#252e3c", color: "#e8f0fb", border: "1px solid #465164",
  borderRadius: 8, padding: "8px 11px", cursor: "pointer" };

function returns(series: Series) {
  const p = series.points;
  return p.slice(1).map((v, i) => Math.log(v.close / p[i]!.close));
}
function statistics(base: Series, other: Series) {
  const a = returns(base), b = returns(other);
  const n = Math.min(a.length, b.length);
  const ma = a.reduce((x, y) => x + y, 0) / n;
  const mb = b.reduce((x, y) => x + y, 0) / n;
  let cov = 0, va = 0, vb = 0;
  for (let i = 0; i < n; i++) {
    cov += (a[i]! - ma) * (b[i]! - mb);
    va += (a[i]! - ma) ** 2; vb += (b[i]! - mb) ** 2;
  }
  let peak = other.points[0]!.close, drawdown = 0;
  for (const p of other.points) { peak = Math.max(peak, p.close); drawdown = Math.min(drawdown, p.close / peak - 1); }
  const start = other.points[0]!.close, end = other.points.at(-1)!.close;
  const baseStart = base.points[0]!.close, baseEnd = base.points.at(-1)!.close;
  return { change: (end / start - 1) * 100,
    relative: ((end / start) / (baseEnd / baseStart) - 1) * 100,
    correlation: va && vb ? cov / Math.sqrt(va * vb) : null,
    beta: va ? cov / va : null, drawdown: drawdown * 100 };
}
function Chart({ series }: { series: Series[] }) {
  const all = series.flatMap(s => s.points.map(p => p.close / s.points[0]!.close * 100));
  const low = Math.floor(Math.min(...all) / 5) * 5, high = Math.ceil(Math.max(...all) / 5) * 5;
  const span = Math.max(1, high - low), count = series[0]!.points.length;
  return <svg viewBox="0 0 800 320" role="img" aria-label="Indexed price comparison, starting at 100"
    style={{ width: "100%", minHeight: 220, background: "#10151e", borderRadius: 10 }}>
    {[0, 1, 2, 3, 4].map(i => {
      const y = 24 + i * 68;
      return <g key={i}><line x1="45" x2="780" y1={y} y2={y} stroke="#303744" />
        <text x="8" y={y + 4} fill="#aeb9c9" fontSize="12">{(high - i * span / 4).toFixed(0)}</text></g>;
    })}
    {series.map((s, i) => <polyline key={s.symbol} fill="none" stroke={colors[i]} strokeWidth="2.5"
      points={s.points.map((p, j) => `${45 + j * 735 / Math.max(1, count - 1)},${24 + (high - p.close / s.points[0]!.close * 100) * 272 / span}`).join(" ")} />)}
    <text x="45" y="310" fill="#aeb9c9" fontSize="12">{new Date(series[0]!.points[0]!.time * 1000).toLocaleDateString()}</text>
    <text x="680" y="310" fill="#aeb9c9" fontSize="12">{new Date(series[0]!.points.at(-1)!.time * 1000).toLocaleDateString()}</text>
  </svg>;
}
export function CompareLab() {
  const [universe, setUniverse] = useState<string[]>([]);
  const [symbols, setSymbols] = useState(["BTC", "SOL", "LINK"]);
  const [days, setDays] = useState(30);
  const [data, setData] = useState<Comparison | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => { fetch("/api/compare/universe").then(async r => { if (!r.ok) throw new Error("Coin list unavailable"); return r.json(); }).then(v => setUniverse(v.symbols ?? []))
    .catch(() => setError("Coin list unavailable")); }, []);
  useEffect(() => {
    const controller = new AbortController();
    setBusy(true); setError(""); setData(null);
    fetch(`/api/compare/daily?symbols=${encodeURIComponent(symbols.join(","))}&days=${days}`,
      { signal: controller.signal })
      .then(async r => { const v = await r.json(); if (!r.ok) throw new Error(v.error || "Comparison unavailable"); return v; })
      .then(setData).catch(e => { if (e.name !== "AbortError") setError(e.message); })
      .finally(() => { if (!controller.signal.aborted) setBusy(false); });
    return () => controller.abort();
  }, [symbols.join(","), days]);
  const rows = useMemo(() => data?.series.map((s, i) => ({
    symbol: s.symbol, color: colors[i], ...statistics(data.series[0]!, s),
  })) ?? [], [data]);
  return <main style={{ paddingTop: 18, display: "grid", gap: 16 }}>
    <section style={card}>
      <h1 style={{ marginTop: 0 }}>Compare Lab</h1>
      <p style={{ color: "#b5c0d0" }}>Choose 2–5 coins and investigate how they moved together. All statistics use completed Kraken daily candles.</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 15 }}>
        {universe.map(symbol => <button key={symbol} type="button" style={{
          ...button, background: symbols.includes(symbol) ? "#174e59" : "#252e3c",
        }} aria-pressed={symbols.includes(symbol)} onClick={() => setSymbols(previous =>
          previous.includes(symbol) ? previous.length > 2 ? previous.filter(s => s !== symbol) : previous
            : previous.length < 5 ? [...previous, symbol] : previous)}>{symbol}</button>)}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        {[7, 30, 90, 180].map(n => <button key={n} type="button" style={{
          ...button, background: n === days ? "#174e59" : "#252e3c",
        }} onClick={() => setDays(n)}>{n} days</button>)}
      </div>
    </section>
    {busy && <p role="status">Loading Kraken candles…</p>}
    {error && <p role="alert" style={{ color: "#ff9999" }}>{error}</p>}
    {data && <><section style={card}>
      <h2 style={{ marginTop: 0 }}>Indexed performance</h2>
      <p style={{ color: "#aeb9c9" }}>Each coin starts at 100. Base for relative statistics: {data.series[0]!!.symbol}.</p>
      <Chart series={data.series} />
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        {rows.map(r => <span key={r.symbol} style={{ color: r.color }}>● {r.symbol}</span>)}
      </div>
    </section><section style={{ ...card, overflowX: "auto" }}>
      <h2 style={{ marginTop: 0 }}>Comparison</h2>
      <table style={{ width: "100%", textAlign: "right", borderSpacing: "12px 10px", whiteSpace: "nowrap" }}>
        <thead><tr><th style={{ textAlign: "left" }}>Coin</th><th>Return</th><th>vs {data.series[0]!!.symbol}</th><th>Correlation</th><th>Beta</th><th>Max drawdown</th></tr></thead>
        <tbody>{rows.map(r => <tr key={r.symbol}><th style={{ textAlign: "left", color: r.color }}>{r.symbol}</th>
          <td>{r.change.toFixed(1)}%</td><td>{r.relative.toFixed(1)}%</td>
          <td>{r.correlation?.toFixed(2) ?? "—"}</td><td>{r.beta?.toFixed(2) ?? "—"}</td>
          <td>{r.drawdown.toFixed(1)}%</td></tr>)}</tbody>
      </table>
      <p style={{ color: "#9eabbc", fontSize: 13 }}>Kraken public OHLC · {data.observedDays} overlapping completed days · last candle {new Date(data.asOf).toLocaleDateString()}. Historical relationships do not establish a future trading edge.</p>
    </section></>}
  </main>;
}

