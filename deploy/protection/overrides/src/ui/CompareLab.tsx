import { useEffect, useMemo, useState } from "react";

type Point = { time: number; close: number };
type Series = { symbol: string; points: Point[] };
type Comparison = {
  source: string; provenance: string; asOf: string; observedDays: number; series: Series[];
};
type Patterns = {
  sampleCount: number; asOf: string | null;
  summary: { symbol: string; count: number; medianForwardPct: number | null;
    positiveCount: number; beatBtcCount: number; worstForwardPct: number | null }[];
  matches: { start: string; end: string; btcPriorPct: number; forwardPct: Record<string, number> }[];
};
const colors = ["#f7b84b", "#65c5ee", "#77dfab", "#ca9af7", "#f08283"];
const card = { background: "#111e36", border: "1px solid #304565", borderRadius: 12, padding: 18 };
const button = { background: "#233756", color: "#e8f0fb", border: "1px solid #465164",
  borderRadius: 8, padding: "8px 11px", cursor: "pointer" };
export function formatUtcDay(value: number | string) {
  return new Date(typeof value === "number" ? value * 1000 : value).toISOString().slice(0, 10);
}

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
      return <g key={i}><line x1="45" x2="780" y1={y} y2={y} stroke="#304565" />
        <text x="8" y={y + 4} fill="#aeb9c9" fontSize="12">{(high - i * span / 4).toFixed(0)}</text></g>;
    })}
    {series.map((s, i) => <polyline key={s.symbol} fill="none" stroke={colors[i]} strokeWidth="2.5"
      points={s.points.map((p, j) => `${45 + j * 735 / Math.max(1, count - 1)},${24 + (high - p.close / s.points[0]!.close * 100) * 272 / span}`).join(" ")} />)}
    <text x="45" y="310" fill="#aeb9c9" fontSize="12">{formatUtcDay(series[0]!.points[0]!.time)}</text>
    <text x="680" y="310" fill="#aeb9c9" fontSize="12">{formatUtcDay(series[0]!.points.at(-1)!.time)}</text>
  </svg>;
}
export function CompareLab({ rankedAssets = [], focusSymbol = "BTC", onAnalyzeSymbol }: { rankedAssets?: any[]; focusSymbol?: string; onAnalyzeSymbol?: (symbol:string)=>void }) {
  const [mode, setMode] = useState<"compare" | "patterns" | "analysis">("compare");
  const [selectedSymbol, setSelectedSymbol] = useState(focusSymbol);
  useEffect(() => { setSelectedSymbol(focusSymbol); if (focusSymbol !== "BTC") setMode("analysis"); }, [focusSymbol]);
  const [universe, setUniverse] = useState<string[]>([]);
  const [symbols, setSymbols] = useState(["BTC", "SOL", "LINK"]);
  const [days, setDays] = useState(30);
  const [data, setData] = useState<Comparison | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [threshold, setThreshold] = useState(2);
  const [patterns, setPatterns] = useState<Patterns | null>(null);
  const [patternsError, setPatternsError] = useState("");
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
  useEffect(() => {
    if (mode !== "patterns") return;
    const controller = new AbortController();
    setPatterns(null); setPatternsError("");
    const requested = ["BTC", ...symbols.filter(s => s !== "BTC")].slice(0, 5);
    if (requested.length < 2) { setPatternsError("Select BTC and another coin."); return; }
    fetch(`/api/compare/sideways?symbols=${encodeURIComponent(requested.join(","))}&threshold=${threshold}`,
      { signal: controller.signal })
      .then(async r => { const v = await r.json(); if (!r.ok) throw new Error(v.error || "Patterns unavailable"); return v; })
      .then(setPatterns).catch(e => { if (e.name !== "AbortError") setPatternsError(e.message); });
    return () => controller.abort();
  }, [mode, symbols.join(","), threshold]);
  const allSymbols = [...new Set([...universe, ...rankedAssets.map(a => a.symbol)])].filter(Boolean).sort();
  const selectedAsset = rankedAssets.find(asset => String(asset?.symbol ?? "").toUpperCase() === selectedSymbol);
  const btcSol = data?.series.find(s => s.symbol === "BTC") && data?.series.find(s => s.symbol === "SOL")
    ? statistics(data.series.find(s => s.symbol === "BTC")!, data.series.find(s => s.symbol === "SOL")!) : null;
  const rows = useMemo(() => data?.series.map((s, i) => ({
    symbol: s.symbol, color: colors[i], ...statistics(data.series[0]!, s),
  })) ?? [], [data]);
  return <main style={{ paddingTop: 18, display: "grid", gap: 16 }}>
    <section style={card}>
      <h1 style={{ marginTop: 0 }}>Compare Lab</h1>
      <p style={{ color: "#b5c0d0" }}>Choose 2–5 coins and investigate how they moved together. The full watchlist is available here. Select up to five at once; charts require overlapping completed Kraken daily candles. Missing history is reported explicitly.</p>
      <div style={{ display: "flex", gap: 8, marginBottom: 15, flexWrap: "wrap" }}>
        {(["compare", "patterns", "analysis"] as const).map(value => <button key={value} type="button" style={{
          ...button, background: mode === value ? "#174e59" : "#233756",
        }} onClick={() => {
          setMode(value);
          if (value === "patterns") setSymbols(previous => ["BTC", ...previous.filter(s => s !== "BTC")].slice(0, 5));
        }}>{value === "compare" ? "BTC / SOL & compare" : value === "patterns" ? "BTC sideways patterns" : "Crypto analysis"}</button>)}
      </div>
      {mode === "compare" ? <button type="button" style={{ ...button, marginBottom: 12 }} onClick={() => { setSymbols(["BTC", "SOL"]); setDays(30); }}>BTC / SOL analysis preset</button> : null}
      {mode === "analysis" ? <label style={{ color: "#b5c0d0" }}>Analyze coin{" "}<select aria-label="Analyze coin" value={selectedSymbol} onChange={event => { setSelectedSymbol(event.target.value); onAnalyzeSymbol?.(event.target.value); }} style={button}>
        {allSymbols.map(symbol => <option key={symbol}>{symbol}</option>)}
      </select></label> : null}
      {mode !== "analysis" && <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 15 }}>
        {allSymbols.map(symbol => <button key={symbol} type="button" style={{
          ...button, background: symbols.includes(symbol) ? "#174e59" : "#233756",
        }} aria-pressed={symbols.includes(symbol)} onClick={() => setSymbols(previous =>
          mode === "patterns" && symbol === "BTC" ? previous
          : previous.includes(symbol) ? previous.length > 2 ? previous.filter(s => s !== symbol) : previous
            : previous.length < 5 ? [...previous, symbol] : previous)}>{symbol}</button>)}
      </div>
      }
      {mode === "compare" ? <div style={{ display: "flex", gap: 8 }}>
        {[7, 30, 90, 180].map(n => <button key={n} type="button" style={{
          ...button, background: n === days ? "#174e59" : "#233756",
        }} onClick={() => setDays(n)}>{n} days</button>)}
      </div> : mode === "patterns" ? <div style={{ display: "flex", gap: 8 }}>
        {[1, 2, 3].map(n => <button key={n} type="button" style={{
          ...button, background: n === threshold ? "#174e59" : "#233756",
        }} onClick={() => setThreshold(n)}>BTC ±{n}%</button>)}
      </div> : null}
    </section>
    {mode === "analysis" && <section style={card}>
      <h2 style={{ marginTop: 0 }}>{selectedSymbol} crypto analysis</h2>
      {selectedAsset && selectedAsset.action !== "Awaiting evaluation" ? <>
        <p style={{ color: "#b5c0d0" }}>Research rank #{selectedAsset.strategy21?.researchRank ?? "—"} · research score {Number(selectedAsset.strategy21?.researchScore ?? selectedAsset.opportunity?.adjusted ?? 0).toFixed(1)} · confidence {Number(selectedAsset.confidence?.pct ?? 0).toFixed(1)}%</p>
        <p><strong>Current decision:</strong> {selectedAsset.strategy21?.action ?? selectedAsset.action ?? "Research"} · {selectedAsset.strategy21?.assetState ?? "state unknown"}</p>
        <p><strong>Kraken execution:</strong> {String(selectedAsset.strategy21?.eligibility?.status ?? "UNKNOWN").replaceAll("_", " ")} · maximum next order {Number(selectedAsset.strategy21?.positionAuthority?.maxNextOrderUsd ?? 0).toFixed(2)} USD</p>
        <p><strong>What needs to improve:</strong> {selectedAsset.strategy21?.eligibility?.failureReasons?.[0] ?? selectedAsset.decisionBoundary?.nearestFlip ?? "Review the latest evidence and entry quality."}</p>
        <p style={{ color: "#9eabbc", fontSize: 13 }}>This is the current Strategy 2.1 snapshot, including its execution blocks. Research rank does not authorize a limit order.</p>
      </> : <p>This coin is on the watchlist and is awaiting its first research evaluation.</p>}
    </section>}
    {mode === "compare" && busy && <p role="status">Loading Kraken candles…</p>}
    {mode === "compare" && error && <p role="alert" style={{ color: "#ff9999" }}>{error}</p>}
    {mode === "compare" && data && <>{btcSol && <section style={card}>
      <h2 style={{ marginTop: 0 }}>BTC / SOL analysis</h2>
      <p>SOL {btcSol.change >= 0 ? "+" : ""}{btcSol.change.toFixed(1)}% over the selected window · {btcSol.relative >= 0 ? "+" : ""}{btcSol.relative.toFixed(1)}% relative to BTC.</p>
      <p>Correlation {btcSol.correlation?.toFixed(2) ?? "—"} · beta {btcSol.beta?.toFixed(2) ?? "—"} · SOL max drawdown {btcSol.drawdown.toFixed(1)}%.</p>
      <p style={{ color: "#9eabbc", fontSize: 13 }}>Completed Kraken daily candles only. These describe the observed relationship, not a forecast or entry instruction.</p>
    </section>}<section style={card}>
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
      <p style={{ color: "#9eabbc", fontSize: 13 }}>Kraken public OHLC · {data.observedDays} overlapping completed days · last candle {formatUtcDay(data.asOf)} UTC. Historical relationships do not establish a future trading edge.</p>
    </section></>}
    {mode === "patterns" && !patterns && !patternsError && <p role="status">Finding completed historical windows…</p>}
    {mode === "patterns" && patternsError && <p role="alert" style={{ color: "#ff9999" }}>{patternsError}</p>}
    {mode === "patterns" && patterns && <section style={{ ...card, overflowX: "auto" }}>
      <h2 style={{ marginTop: 0 }}>After BTC moved sideways for 7 days</h2>
      <p style={{ color: "#b5c0d0" }}>Past non-overlapping windows where BTC stayed within ±{threshold}%. The table shows each coin's following 7 days.</p>
      <p><strong>{patterns.sampleCount} historical matches</strong>{patterns.asOf ? ` · candles through ${formatUtcDay(patterns.asOf)} UTC` : ""}</p>
      {patterns.sampleCount > 0 ? <table style={{ width: "100%", textAlign: "right", borderSpacing: "12px 10px", whiteSpace: "nowrap" }}>
        <thead><tr><th style={{ textAlign: "left" }}>Coin</th><th>Median next 7d</th><th>Positive</th><th>Beat BTC</th><th>Worst next 7d</th></tr></thead>
        <tbody>{patterns.summary.map(row => <tr key={row.symbol}><th style={{ textAlign: "left" }}>{row.symbol}</th>
          <td>{row.medianForwardPct?.toFixed(1) ?? "—"}%</td>
          <td>{row.positiveCount}/{row.count}</td><td>{row.symbol === "BTC" ? "—" : `${row.beatBtcCount}/${row.count}`}</td>
          <td>{row.worstForwardPct?.toFixed(1) ?? "—"}%</td></tr>)}</tbody>
      </table> : <p>There are no qualifying, fully observed windows for this selection.</p>}
      {patterns.matches.length > 0 && <details><summary>See {patterns.matches.length} most recent matching periods</summary>
        <ul>{patterns.matches.map(m => <li key={m.start}>{m.start}–{m.end}: BTC {m.btcPriorPct.toFixed(1)}% before the following week</li>)}</ul>
      </details>}
      <p style={{ color: "#9eabbc", fontSize: 13 }}>Completed Kraken daily candles only. Windows do not overlap. Small samples and historical selection can mislead; this is an investigation tool, not a trading signal.</p>
    </section>}
  </main>;
}


