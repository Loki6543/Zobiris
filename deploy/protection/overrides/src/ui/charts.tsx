// Small, dependency-free SVG charts shared by the dashboard pages.
import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";

export const fmtUsd = (n: number | null | undefined, digits = 2) => n == null || !Number.isFinite(n) ? "—" : n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: Math.abs(n) < 1 ? 6 : digits, minimumFractionDigits: Math.abs(n) < 1 ? 2 : Math.min(digits, 2) });
export const fmtPct = (n: number | null | undefined, d = 2) => n == null || !Number.isFinite(n) ? "—" : (n > 0 ? "+" : "") + n.toFixed(d) + "%";
export const fmtBig = (n: number | null | undefined) => {
  if (n == null || !Number.isFinite(n)) return "—";
  const a = Math.abs(n);
  return a >= 1e12 ? `$${(n / 1e12).toFixed(2)}T` : a >= 1e9 ? `$${(n / 1e9).toFixed(2)}B` : a >= 1e6 ? `$${(n / 1e6).toFixed(2)}M` : fmtUsd(n, 0);
};
export const toneOf = (n: number | null | undefined) => (n == null || !Number.isFinite(n) ? "" : n >= 0 ? "is-gain" : "is-loss");

/** Container width so SVG text stays at real pixel size. */
export function useWidth(fallback: number) {
  const ref = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(fallback);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(([e]) => { const cw = Math.round(e?.contentRect.width ?? 0); if (cw > 0) setW(cw); });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, w] as const;
}

export function Sparkline({ values, width = 120, height = 36, className = "" }: { values: number[]; width?: number; height?: number; className?: string }) {
  const id = useMemo(() => "sg" + Math.random().toString(36).slice(2, 8), []);
  if (values.length < 2) return <svg className={`zs-spark ${className}`} width={width} height={height} aria-hidden="true" />;
  const lo = Math.min(...values), hi = Math.max(...values), span = hi - lo || 1;
  const pts = values.map((v, i) => `${((i / (values.length - 1)) * width).toFixed(1)},${(height - 3 - ((v - lo) / span) * (height - 6)).toFixed(1)}`);
  const up = values[values.length - 1]! >= values[0]!;
  return (
    <svg className={`zs-spark ${up ? "is-up" : "is-down"} ${className}`} viewBox={`0 0 ${width} ${height}`} width={width} height={height} aria-hidden="true" preserveAspectRatio="none">
      <defs><linearGradient id={id} x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="currentColor" stopOpacity=".35" /><stop offset="1" stopColor="currentColor" stopOpacity="0" /></linearGradient></defs>
      <polygon points={`0,${height} ${pts.join(" ")} ${width},${height}`} fill={`url(#${id})`} />
      <polyline points={pts.join(" ")} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

export function RangeTabs<T extends string>({ options, value, onChange, label }: { options: readonly T[]; value: T; onChange: (v: T) => void; label: string }) {
  return (
    <div className="zs-tabs" role="tablist" aria-label={label}>
      {options.map((o) => <button key={o} type="button" role="tab" aria-selected={o === value} onClick={() => onChange(o)}>{o}</button>)}
    </div>
  );
}

/** Area line chart over (time seconds, value) points with hover readout. */
export function AreaChart({ points, height = 220, format = (v: number) => fmtUsd(v, 0), ariaLabel }: { points: Array<[number, number]>; height?: number; format?: (v: number) => string; ariaLabel: string }) {
  const [box, W] = useWidth(640);
  const [hover, setHover] = useState<number | null>(null);
  const PAD = { l: 6, r: 64, t: 12, b: 22 };
  const geo = useMemo(() => {
    if (points.length < 2) return null;
    const vs = points.map((p) => p[1]);
    const lo = Math.min(...vs), hi = Math.max(...vs), pad = (hi - lo) * 0.08 || hi * 0.02 || 1;
    const y0 = lo - pad, y1 = hi + pad;
    const x = (i: number) => PAD.l + (i / (points.length - 1)) * (W - PAD.l - PAD.r);
    const y = (v: number) => PAD.t + (1 - (v - y0) / (y1 - y0)) * (height - PAD.t - PAD.b);
    const line = points.map((p, i) => `${x(i).toFixed(1)},${y(p[1]).toFixed(1)}`).join(" ");
    const ticks = [y0 + (y1 - y0) * 0.2, y0 + (y1 - y0) * 0.5, y0 + (y1 - y0) * 0.8];
    const n = Math.min(5, points.length);
    const xt = Array.from({ length: n }, (_, k) => Math.round((k / (n - 1)) * (points.length - 1)));
    return { x, y, line, ticks, xt };
  }, [points, W, height]);
  if (!geo) return <div ref={box} className="zs-empty">Not enough history yet.</div>;
  const last = points[points.length - 1]!;
  const h = hover == null ? null : points[hover]!;
  const spanDays = (last[0] - points[0]![0]) / 86400;
  const dateFmt = (t: number) => new Date(t * 1000).toLocaleDateString("en-US", spanDays > 400 ? { month: "short", year: "2-digit" } : { month: "short", day: "numeric" });
  const onMove = (e: ReactPointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * W;
    setHover(Math.max(0, Math.min(points.length - 1, Math.round(((px - PAD.l) / (W - PAD.l - PAD.r)) * (points.length - 1)))));
  };
  const up = last[1] >= points[0]![1];
  return (
    <div ref={box} className={`zs-area ${up ? "is-up" : "is-down"}`}>
      <svg viewBox={`0 0 ${W} ${height}`} width="100%" height={height} onPointerMove={onMove} onPointerLeave={() => setHover(null)} role="img" aria-label={ariaLabel}>
        <defs><linearGradient id="zs-area-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="currentColor" stopOpacity=".32" /><stop offset="1" stopColor="currentColor" stopOpacity="0" /></linearGradient></defs>
        {geo.ticks.map((t) => <g key={t}><line x1={PAD.l} x2={W - PAD.r} y1={geo.y(t)} y2={geo.y(t)} className="zs-grid" /><text x={W - PAD.r + 6} y={geo.y(t) + 4} className="zs-axis">{format(t)}</text></g>)}
        {geo.xt.map((i) => <text key={i} x={geo.x(i)} y={height - 5} className="zs-axis" textAnchor={i === 0 ? "start" : i === points.length - 1 ? "end" : "middle"}>{dateFmt(points[i]![0])}</text>)}
        <polygon points={`${geo.x(0)},${height - PAD.b} ${geo.line} ${geo.x(points.length - 1)},${height - PAD.b}`} fill="url(#zs-area-fill)" />
        <polyline points={geo.line} className="zs-line" />
        <circle cx={geo.x(points.length - 1)} cy={geo.y(last[1])} r="4" className="zs-dot" />
        <g transform={`translate(${Math.min(W - PAD.r - 4, geo.x(points.length - 1))},${geo.y(last[1]) - 12})`}><rect x="-62" y="-11" width="62" height="18" rx="5" className="zs-tag" /><text x="-31" y="2" textAnchor="middle" className="zs-tag-text">{format(last[1])}</text></g>
        {h ? <g pointerEvents="none"><line x1={geo.x(hover!)} x2={geo.x(hover!)} y1={PAD.t} y2={height - PAD.b} className="zs-cross" /><circle cx={geo.x(hover!)} cy={geo.y(h[1])} r="4" className="zs-dot" /></g> : null}
      </svg>
      <div className="zs-readout" aria-live="polite">{h ? <>{new Date(h[0] * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} · <strong>{format(h[1])}</strong></> : <>&nbsp;</>}</div>
    </div>
  );
}

export interface OhlcPoint { t: number; o: number; h: number; l: number; c: number; v: number }

/** Candlesticks with a volume strip and hover OHLC readout. */
export function CandleChart({ candles, height: wanted = 300, ariaLabel }: { candles: OhlcPoint[]; height?: number; ariaLabel: string }) {
  const [box, W] = useWidth(640);
  const height = W < 520 ? Math.min(wanted, 290) : wanted;
  const [hover, setHover] = useState<number | null>(null);
  const PAD = { l: 6, r: 66, t: 10, b: 22 };
  const VOL = Math.round(height * 0.2);
  const geo = useMemo(() => {
    if (candles.length < 2) return null;
    const lo = Math.min(...candles.map((c) => c.l)) * 0.98, hi = Math.max(...candles.map((c) => c.h)) * 1.01;
    const priceH = height - PAD.t - PAD.b - VOL - 6;
    const step = (W - PAD.l - PAD.r) / candles.length;
    const x = (i: number) => PAD.l + step * (i + 0.5);
    const y = (v: number) => PAD.t + (1 - (v - lo) / (hi - lo)) * priceH;
    const vMax = Math.max(...candles.map((c) => c.v * c.c), 1);
    const vy = (v: number) => height - PAD.b - (v / vMax) * VOL;
    const ticks = [lo + (hi - lo) * 0.15, lo + (hi - lo) * 0.5, lo + (hi - lo) * 0.85];
    const n = Math.min(5, candles.length);
    const xt = Array.from({ length: n }, (_, k) => Math.round((k / (n - 1)) * (candles.length - 1)));
    return { x, y, vy, step, ticks, xt, priceH };
  }, [candles, W, height]);
  if (!geo) return <div ref={box} className="zs-empty">Not enough history yet.</div>;
  const bw = Math.max(1, Math.min(10, geo.step * 0.66));
  const onMove = (e: ReactPointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * W;
    setHover(Math.max(0, Math.min(candles.length - 1, Math.floor((px - PAD.l) / geo.step))));
  };
  const c = candles[hover ?? candles.length - 1]!;
  const prev = candles[(hover ?? candles.length - 1) - 1];
  const last = candles[candles.length - 1]!;
  return (
    <div ref={box} className="zs-candles">
      <svg viewBox={`0 0 ${W} ${height}`} width="100%" height={height} onPointerMove={onMove} onPointerLeave={() => setHover(null)} role="img" aria-label={ariaLabel}>
        {geo.ticks.map((t) => <g key={t}><line x1={PAD.l} x2={W - PAD.r} y1={geo.y(t)} y2={geo.y(t)} className="zs-grid" /><text x={W - PAD.r + 6} y={geo.y(t) + 4} className="zs-axis">{fmtUsd(t, 0)}</text></g>)}
        {geo.xt.map((i) => <text key={i} x={geo.x(i)} y={height - 5} className="zs-axis" textAnchor={i === 0 ? "start" : i === candles.length - 1 ? "end" : "middle"}>{new Date(candles[i]!.t * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</text>)}
        {candles.map((k, i) => {
          const up = k.c >= k.o, cls = up ? "zs-up" : "zs-down";
          const top = geo.y(Math.max(k.o, k.c)), bot = geo.y(Math.min(k.o, k.c));
          return <g key={k.t} className={cls}>
            <line x1={geo.x(i)} x2={geo.x(i)} y1={geo.y(k.h)} y2={geo.y(k.l)} />
            <rect x={geo.x(i) - bw / 2} y={top} width={bw} height={Math.max(1, bot - top)} />
            <rect className="zs-vol" x={geo.x(i) - bw / 2} y={geo.vy(k.v * k.c)} width={bw} height={height - PAD.b - geo.vy(k.v * k.c)} />
          </g>;
        })}
        <g transform={`translate(${W - PAD.r + 2},${geo.y(last.c)})`}><rect x="0" y="-9" width="62" height="18" rx="4" className={last.c >= last.o ? "zs-tag-up" : "zs-tag-down"} /><text x="31" y="4" textAnchor="middle" className="zs-tag-text">{fmtUsd(last.c, 0)}</text></g>
        {hover != null ? <line x1={geo.x(hover)} x2={geo.x(hover)} y1={PAD.t} y2={height - PAD.b} className="zs-cross" pointerEvents="none" /> : null}
      </svg>
      <div className="zs-readout" aria-live="polite">
        {new Date(c.t * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} · O {fmtUsd(c.o, 0)} · H {fmtUsd(c.h, 0)} · L {fmtUsd(c.l, 0)} · C <strong>{fmtUsd(c.c, 0)}</strong>
        {prev ? <span className={toneOf(c.c - prev.c)}> {fmtPct(((c.c / prev.c) - 1) * 100)}</span> : null} · Vol {fmtBig(c.v * c.c)}
      </div>
    </div>
  );
}

const DONUT_COLORS = ["#f7931a", "#627eea", "#14f195", "#e84142", "#2a5ada", "#8247e5", "#26a17b", "#f0b90b", "#ff007a", "#00d4aa", "#94a3b8"];

export function Donut({ slices, center, sub }: { slices: Array<{ label: string; value: number }>; center: ReactNode; sub: string }) {
  const total = slices.reduce((s, x) => s + x.value, 0) || 1;
  let acc = 0;
  const R = 52, C = 2 * Math.PI * R;
  return (
    <div className="zs-donut">
      <svg viewBox="0 0 140 140" role="img" aria-label={slices.map((s) => `${s.label} ${Math.round((s.value / total) * 100)}%`).join(", ")}>
        <circle cx="70" cy="70" r={R} className="zs-donut-track" />
        {slices.map((s, i) => {
          const frac = s.value / total, dash = Math.max(0, frac * C - (slices.length > 1 ? 1.5 : 0));
          const el = <circle key={s.label} cx="70" cy="70" r={R} fill="none" stroke={DONUT_COLORS[i % DONUT_COLORS.length]} strokeWidth="16" strokeDasharray={`${dash} ${C - dash}`} strokeDashoffset={-acc * C} transform="rotate(-90 70 70)" />;
          acc += frac; return el;
        })}
        <foreignObject x="30" y="48" width="80" height="44"><div className="zs-donut-center"><strong>{center}</strong><small>{sub}</small></div></foreignObject>
      </svg>
      <ul>{slices.map((s, i) => <li key={s.label}><i style={{ background: DONUT_COLORS[i % DONUT_COLORS.length] }} />{s.label}<strong>{((s.value / total) * 100).toFixed(1)}%</strong></li>)}</ul>
    </div>
  );
}

/** Shared fetch with a small in-memory cache so several panels can ask for the same URL. */
const cache = new Map<string, { at: number; data: unknown; p?: Promise<unknown> }>();
export function useApi<T>(url: string | null, everyMs = 5 * 60_000) {
  const [data, setData] = useState<T | null>(() => (url ? (cache.get(url)?.data as T) ?? null : null));
  const [error, setError] = useState("");
  useEffect(() => {
    if (!url) return;
    let live = true;
    const load = async (force: boolean) => {
      const hit = cache.get(url);
      if (!force && hit && Date.now() - hit.at < everyMs && hit.data) { setData(hit.data as T); return; }
      try {
        const p = hit?.p ?? fetch(url).then(async (r) => { const b = await r.json().catch(() => null); if (!r.ok) throw new Error(b?.error ?? `HTTP ${r.status}`); return b; });
        cache.set(url, { at: hit?.at ?? 0, data: hit?.data, p });
        const body = await p;
        cache.set(url, { at: Date.now(), data: body });
        if (live) { setData(body as T); setError(""); }
      } catch (e) { cache.set(url, { at: hit?.at ?? 0, data: hit?.data }); if (live) setError(String(e instanceof Error ? e.message : e)); }
    };
    void load(false);
    const t = setInterval(() => void load(true), everyMs);
    return () => { live = false; clearInterval(t); };
  }, [url, everyMs]);
  return { data, error };
}
