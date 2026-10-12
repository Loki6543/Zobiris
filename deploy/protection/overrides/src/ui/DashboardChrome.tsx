// Top-bar coin search + live ticker, and the sidebar "Daily edge" routine (ticks itself as you visit pages today).
import { useMemo, useRef, useState } from "react";
import { fmtPct, fmtUsd, toneOf } from "./charts";

export interface TickerQuote { symbol: string; name: string; priceUsd: number | null; change24hPct: number | null }

export function TopbarTicker({ quotes }: { quotes: Record<string, TickerQuote | undefined> }) {
  const items = ["BTC", "ETH", "SOL"].map((s) => quotes[s]).filter((q): q is TickerQuote => Boolean(q));
  if (!items.length) return null;
  return <div className="db-ticker" aria-label="Live prices">{items.map((q) => (
    <span key={q.symbol}><span className="asset-monogram" data-symbol={q.symbol} aria-hidden="true">{q.symbol[0]}</span><small>{q.symbol}</small><strong>{fmtUsd(q.priceUsd, 0)}</strong><em className={toneOf(q.change24hPct)}>{fmtPct(q.change24hPct, 1)}</em></span>
  ))}</div>;
}

/** Search your coins; picking one opens its analysis in Compare Lab. */
export function CoinSearch({ coins, onPick }: { coins: Array<{ symbol: string; name: string }>; onPick: (symbol: string) => void }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const box = useRef<HTMLDivElement>(null);
  const hits = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return [];
    return coins.filter((c) => c.symbol.toLowerCase().startsWith(t) || c.name.toLowerCase().includes(t)).slice(0, 8);
  }, [q, coins]);
  const pick = (s: string) => { onPick(s); setQ(""); setOpen(false); };
  return (
    <div className="db-search" ref={box} onBlur={(e) => { if (!box.current?.contains(e.relatedTarget as Node)) setOpen(false); }}>
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 4a7 7 0 1 1 0 14 7 7 0 0 1 0-14Zm9 16-4.2-4.2" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
      <input role="combobox" aria-expanded={open && hits.length > 0} aria-controls="db-search-list" aria-label="Search your coins" placeholder="Search your coins…" value={q}
        onChange={(e) => { setQ(e.target.value); setOpen(true); setActive(0); }} onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(hits.length - 1, a + 1)); }
          else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(0, a - 1)); }
          else if (e.key === "Enter" && hits[active]) pick(hits[active]!.symbol);
          else if (e.key === "Escape") setOpen(false);
        }} />
      {open && hits.length ? <ul id="db-search-list" role="listbox">{hits.map((c, i) => (
        <li key={c.symbol + c.name} role="option" aria-selected={i === active}><button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => pick(c.symbol)}><strong>{c.symbol}</strong> <small>{c.name}</small></button></li>
      ))}</ul> : null}
    </div>
  );
}

export const DAILY_EDGE = [
  { view: "dashboard", label: "Check the dashboard" },
  { view: "market", label: "Read Market Today" },
  { view: "watchlist", label: "Review your watchlist" },
  { view: "strategy", label: "Check opportunities" },
  { view: "portfolio", label: "Review your portfolio" },
] as const;
const KEY = "zobiris.dailyEdge.v1";
const today = () => new Date().toISOString().slice(0, 10);

export function readDailyEdge(): string[] {
  try { const v = JSON.parse(localStorage.getItem(KEY) ?? "null"); return v?.day === today() && Array.isArray(v.done) ? v.done : []; } catch { return []; }
}
export function markDailyEdge(view: string) {
  if (!DAILY_EDGE.some((d) => d.view === view)) return;
  try { const done = readDailyEdge(); if (!done.includes(view)) localStorage.setItem(KEY, JSON.stringify({ day: today(), done: [...done, view] })); } catch { /* storage blocked */ }
}

export function DailyEdge({ done, onOpen }: { done: string[]; onOpen: (view: string) => void }) {
  const n = DAILY_EDGE.filter((d) => done.includes(d.view)).length;
  const C = 2 * Math.PI * 20;
  return (
    <section className="db-edge" aria-label="Daily edge routine">
      <strong>Daily edge</strong>
      <svg viewBox="0 0 50 50" className="db-edge-ring" role="img" aria-label={`${n} of ${DAILY_EDGE.length} done today`}>
        <circle cx="25" cy="25" r="20" className="db-edge-track" />
        <circle cx="25" cy="25" r="20" className="db-edge-fill" strokeDasharray={`${(n / DAILY_EDGE.length) * C} ${C}`} transform="rotate(-90 25 25)" />
        <text x="25" y="29" textAnchor="middle">{n}/{DAILY_EDGE.length}</text>
      </svg>
      <ul>{DAILY_EDGE.map((d) => <li key={d.view} className={done.includes(d.view) ? "is-done" : ""}><button type="button" onClick={() => onOpen(d.view)}>{d.label}</button></li>)}</ul>
    </section>
  );
}
