// Interactive 3D view of the portfolio, built with CSS 3D transforms (no WebGL library).
// Each holding is a glowing bar: height = value, colour = profit/loss. Drag to rotate, tap a bar for details.
import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

export interface Portfolio3DRow { symbol: string; quantity: number; livePrice: number; value: number; upl: number; avgPriceUsd?: number | null; action?: string }

const MAX_BAR = 190; // px, tallest bar
const CELL = 74; // px, grid spacing
const BAR = 44; // px, bar footprint
const money = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: n < 1 ? 6 : 2 });
const pct = (n: number) => (n > 0 ? "+" : "") + n.toFixed(1) + "%";

interface Bar { key: string; symbol: string; value: number; upl: number | null; h: number; x: number; y: number; row: Portfolio3DRow | null }

/** Lay bars out on a square grid, biggest positions nearest the centre. Exported for tests. */
export function layoutBars(rows: Portfolio3DRow[], cashUsd: number): Bar[] {
  const items: Array<Omit<Bar, "h" | "x" | "y">> = rows.filter((r) => r.value > 0).map((r) => ({ key: r.symbol, symbol: r.symbol, value: r.value, upl: r.upl, row: r }));
  if (cashUsd > 0) items.push({ key: "__cash", symbol: "CASH", value: cashUsd, upl: null, row: null });
  items.sort((a, b) => b.value - a.value);
  const max = items[0]?.value ?? 1;
  const cols = Math.max(1, Math.ceil(Math.sqrt(items.length)));
  // Spiral-ish ordering: fill cells by distance from the grid centre.
  const cells = Array.from({ length: cols * cols }, (_, i) => ({ cx: i % cols, cy: Math.floor(i / cols) }))
    .map((c) => ({ ...c, d: Math.hypot(c.cx - (cols - 1) / 2, c.cy - (cols - 1) / 2) }))
    .sort((a, b) => a.d - b.d || a.cy - b.cy || a.cx - b.cx);
  return items.map((it, i) => ({
    ...it,
    h: Math.max(10, Math.sqrt(it.value / max) * MAX_BAR),
    x: (cells[i]!.cx - (cols - 1) / 2) * CELL,
    y: (cells[i]!.cy - (cols - 1) / 2) * CELL,
  }));
}

const VIEW_W = 500, VIEW_H = 320, FOCAL = 1400;

/** Rotate around the vertical axis by yaw, tilt by pitch (0 = top-down), then apply mild perspective. */
function project(x: number, y: number, z: number, yaw: number, pitch: number): [number, number, number] {
  const a = (yaw * Math.PI) / 180, e = (pitch * Math.PI) / 180;
  const X = x * Math.cos(a) - y * Math.sin(a);
  const Y = x * Math.sin(a) + y * Math.cos(a);
  const depth = Y * Math.sin(e) + z * Math.cos(e); // larger = nearer the viewer
  const k = FOCAL / (FOCAL - depth);
  return [X * k, (Y * Math.cos(e) - z * Math.sin(e)) * k, depth];
}

const pts = (p: Array<[number, number, number]>) => p.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
const area = (p: Array<[number, number, number]>) => p.reduce((s, q, i) => { const r = p[(i + 1) % p.length]!; return s + (q[0] * r[1] - r[0] * q[1]); }, 0) / 2;

/** Painter's-algorithm projection: far bars first, back faces culled. Exported for tests. */
export function projectScene(bars: Bar[], yaw: number, pitch: number) {
  const half = BAR / 2;
  const out = bars.map((b) => {
    const c = barColor(b.upl);
    const P = (dx: number, dy: number, z: number) => project(b.x + dx, b.y + dy, z, yaw, pitch);
    const base = [P(-half, -half, 0), P(half, -half, 0), P(half, half, 0), P(-half, half, 0)];
    const top = [P(-half, -half, b.h), P(half, -half, b.h), P(half, half, b.h), P(-half, half, b.h)];
    const normals: Array<[number, number]> = [[0, -1], [1, 0], [0, 1], [-1, 0]];
    const ya = (yaw * Math.PI) / 180;
    const sides = [0, 1, 2, 3].map((i) => {
      const j = (i + 1) % 4;
      const quad = [base[i]!, base[j]!, top[j]!, top[i]!];
      const [nx, ny] = normals[i]!;
      const towardLight = nx * Math.cos(ya) - ny * Math.sin(ya); // light from screen right
      return { quad, pts: pts(quad), light: 38 + towardLight * 12 };
    }).filter((f) => area(f.quad) > 0); // keep faces wound toward the viewer
    const centre = project(b.x, b.y, 0, yaw, pitch); // sort by footprint, not height
    const labelAt = project(b.x, b.y, b.h, yaw, pitch);
    return {
      key: b.key, symbol: b.symbol, cash: b.upl == null, depth: centre[2], sides, topPts: pts(top), label: [labelAt[0], labelAt[1]] as const,
      color: (l: number) => `hsl(${c.hue} ${c.sat}% ${Math.min(80, l + (c.light - 50))}%)`,
    };
  }).sort((a, b) => a.depth - b.depth);
  const extent = Math.max(CELL * 1.6, ...bars.map((b) => Math.hypot(b.x, b.y) + CELL));
  const grid: string[] = [];
  for (let g = -extent; g <= extent + 0.1; g += CELL / 2) {
    const a1 = project(g, -extent, 0, yaw, pitch), a2 = project(g, extent, 0, yaw, pitch);
    const b1 = project(-extent, g, 0, yaw, pitch), b2 = project(extent, g, 0, yaw, pitch);
    grid.push(`M${a1[0].toFixed(1)},${a1[1].toFixed(1)}L${a2[0].toFixed(1)},${a2[1].toFixed(1)}`, `M${b1[0].toFixed(1)},${b1[1].toFixed(1)}L${b2[0].toFixed(1)},${b2[1].toFixed(1)}`);
  }
  const e = (pitch * Math.PI) / 180;
  return { bars: out, grid, floorCy: 0, floorRx: extent * 1.15, floorRy: extent * 1.15 * Math.cos(e) };
}

function barColor(upl: number | null) {
  if (upl == null) return { hue: 218, sat: 85, light: 58 }; // cash: brand blue
  const strength = Math.min(1, Math.abs(upl) / 40);
  return upl >= 0 ? { hue: 145, sat: 70, light: 42 + strength * 16 } : { hue: 356, sat: 78, light: 50 + strength * 8 };
}

export function Portfolio3D({ rows, cash, accountSynced }: { rows: Portfolio3DRow[]; cash: number; accountSynced: boolean }) {
  const bars = useMemo(() => layoutBars(rows, cash), [rows, cash]);
  const [rot, setRot] = useState({ x: 58, z: -32 });
  const [selected, setSelected] = useState<string | null>(null);
  const drag = useRef<{ x: number; y: number; moved: boolean; id: number } | null>(null);
  const stage = useRef<HTMLDivElement>(null);
  const idleUntil = useRef(0);

  // Slow auto-rotate while visible and idle; off for reduced motion.
  useEffect(() => {
    const reduce = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !stage.current) return;
    let visible = true;
    let frame = 0;
    const io = typeof IntersectionObserver !== "undefined" ? new IntersectionObserver(([e]) => { visible = Boolean(e?.isIntersecting); }) : null;
    io?.observe(stage.current);
    let last = performance.now();
    const tick = (t: number) => {
      const dt = Math.min(64, t - last); last = t;
      if (visible && !drag.current && !document.hidden && t > idleUntil.current) setRot((r) => ({ ...r, z: r.z + dt * 0.006 }));
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(frame); io?.disconnect(); };
  }, []);

  const onDown = (e: ReactPointerEvent) => { drag.current = { x: e.clientX, y: e.clientY, moved: false, id: e.pointerId }; };
  const onMove = (e: ReactPointerEvent) => {
    const d = drag.current; if (!d || d.id !== e.pointerId) return;
    const dx = e.clientX - d.x, dy = e.clientY - d.y;
    if (!d.moved && Math.hypot(dx, dy) < 6) return;
    if (!d.moved) { d.moved = true; (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId); }
    d.x = e.clientX; d.y = e.clientY;
    // Touch only spins (vertical swipes keep scrolling the page); mouse/pen also tilts.
    setRot((r) => ({ z: r.z + dx * 0.45, x: e.pointerType === "touch" ? r.x : Math.min(78, Math.max(30, r.x - dy * 0.3)) }));
  };
  const onUp = (e: ReactPointerEvent) => {
    const d = drag.current; drag.current = null; idleUntil.current = performance.now() + 4000;
    if (d && !d.moved) {
      const key = (e.target as HTMLElement).closest<HTMLElement>("[data-bar]")?.dataset.bar ?? null;
      setSelected((s) => (key && key !== s ? key : key ? null : s));
    }
  };

  if (!accountSynced) {
    return <section className="dashboard-panel p3d p3d-locked" aria-label="3D portfolio"><h2>Portfolio in 3D</h2><p className="strategy-muted">Unlock your private portfolio to see your holdings as an interactive 3D scene.</p></section>;
  }
  if (!bars.length) return null;

  const sel = bars.find((b) => b.key === selected) ?? null;
  const total = bars.reduce((s, b) => s + b.value, 0);
  const scene = projectScene(bars, rot.z, rot.x);

  return (
    <section className="dashboard-panel p3d" aria-label="3D portfolio">
      <div className="p3d-head">
        <div><h2>Portfolio in 3D</h2><p className="strategy-muted">Height = value · green = profit · red = loss · blue = cash. Drag to rotate, tap a bar.</p></div>
        <strong className="p3d-total">{money(total)}</strong>
      </div>
      <div ref={stage} className="p3d-stage" onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={() => { drag.current = null; }}>
        <svg viewBox={`${-VIEW_W / 2} ${-VIEW_H * 0.62} ${VIEW_W} ${VIEW_H}`} role="img" aria-label={`3D bar chart of ${bars.length} positions`}>
          <defs>
            <radialGradient id="p3d-floor-glow"><stop offset="0" stopColor="#3b82f6" stopOpacity=".28" /><stop offset="1" stopColor="#3b82f6" stopOpacity="0" /></radialGradient>
            <filter id="p3d-glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6" /></filter>
          </defs>
          <ellipse cx="0" cy={scene.floorCy} rx={scene.floorRx} ry={scene.floorRy} fill="url(#p3d-floor-glow)" />
          {scene.grid.map((d, i) => <path key={i} d={d} className="p3d-grid" />)}
          {scene.bars.map((b) => (
            <g key={b.key} data-bar={b.key} className={`p3d-bar${b.key === selected ? " is-selected" : ""}${b.cash ? " is-cash" : ""}`}>
              <polygon points={b.topPts} className="p3d-glow" style={{ fill: b.color(70) }} filter="url(#p3d-glow)" />
              {b.sides.map((f, i) => <polygon key={i} points={f.pts} style={{ fill: b.color(f.light) }} />)}
              <polygon points={b.topPts} className="p3d-top" style={{ fill: b.color(b.cash ? 66 : 62) }} />
              <text x={b.label[0]} y={b.label[1] - 8} className="p3d-text">{b.symbol}</text>
            </g>
          ))}
        </svg>
      </div>
      <div className="p3d-legend" role="group" aria-label="Holdings">
        {bars.map((b) => (
          <button key={b.key} type="button" aria-pressed={b.key === selected} onClick={() => setSelected((s) => (s === b.key ? null : b.key))}
            className={b.upl == null ? "is-cash" : b.upl >= 0 ? "is-gain" : "is-loss"}>
            <strong>{b.symbol}</strong> {Math.round((b.value / total) * 100)}%
          </button>
        ))}
      </div>
      {sel ? (
        <div className="p3d-detail" aria-live="polite">
          <div><span className="strategy-label">{sel.symbol === "CASH" ? "Cash" : sel.symbol}</span><strong>{money(sel.value)}</strong></div>
          {sel.row ? <>
            <div><span className="strategy-label">Amount</span><strong>{sel.row.quantity.toLocaleString("en-US", { maximumFractionDigits: 6 })}</strong></div>
            <div><span className="strategy-label">Price</span><strong>{money(sel.row.livePrice)}</strong></div>
            <div><span className="strategy-label">Avg. price</span><strong>{sel.row.avgPriceUsd ? money(sel.row.avgPriceUsd) : "—"}</strong></div>
            <div><span className="strategy-label">P/L</span><strong className={sel.upl! >= 0 ? "is-gain" : "is-loss"}>{pct(sel.upl!)}</strong></div>
            {sel.row.action ? <div><span className="strategy-label">Signal</span><strong>{sel.row.action}</strong></div> : null}
          </> : <div><span className="strategy-label">Share</span><strong>{Math.round((sel.value / total) * 100)}%</strong></div>}
        </div>
      ) : null}
    </section>
  );
}
