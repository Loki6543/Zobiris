// Daily market history for ranks 1-1000 (aggregate 24h volume and price per CoinGecko id), kept 60 days on the data
// volume next to the database. Written once per UTC day with an atomic replace, so a crash never leaves half a file.
// This is what lets volume shocks be measured against each coin's own history instead of the cross-section.
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import type { MarketCoin } from "../strategyV2/feed.js";

const KEEP_DAYS = 60;
type Day = Record<string, [number, number]>; // geckoId -> [volume24hUsd, priceUsd]
interface Store { version: 1; days: Record<string, Day> }

export function marketHistoryPath(): string {
  return process.env.ZOBIRIS_MARKET_HISTORY_PATH ?? join(dirname(process.env.ZOBIRIS_DB_PATH ?? "/data/zobiris.sqlite"), "zobiris-market-history.json");
}

let cache: { path: string; store: Store } | null = null;
let lastError: string | null = null;

function load(path: string): Store {
  if (cache?.path === path) return cache.store;
  let store: Store = { version: 1, days: {} };
  if (existsSync(path)) {
    try { const raw = JSON.parse(readFileSync(path, "utf8")); if (raw?.version === 1 && raw.days && typeof raw.days === "object") store = raw; }
    catch { /* unreadable file: start over rather than crash; the old file is replaced on the next write */ }
  }
  cache = { path, store };
  return store;
}

/** Record today's volumes once per UTC day. Returns true when a new day was written. */
export function recordMarketDay(coins: MarketCoin[], now = Date.now(), path = marketHistoryPath()): boolean {
  try {
    const store = load(path);
    const day = new Date(now).toISOString().slice(0, 10);
    if (store.days[day]) return false;
    const snap: Day = {};
    for (const c of coins) if (c.volume24hUsd != null && c.volume24hUsd > 0 && c.priceUsd != null && c.priceUsd > 0) snap[c.geckoId] = [Math.round(c.volume24hUsd), c.priceUsd];
    if (Object.keys(snap).length < 100) return false; // a broken feed must not become a "history" day
    const next: Store = { version: 1, days: { ...store.days, [day]: snap } };
    for (const d of Object.keys(next.days).sort().slice(0, -KEEP_DAYS)) delete next.days[d];
    mkdirSync(dirname(path), { recursive: true });
    const tmp = `${path}.tmp`;
    writeFileSync(tmp, JSON.stringify(next), "utf8");
    renameSync(tmp, path);
    cache = { path, store: next };
    lastError = null;
    return true;
  } catch (e) {
    lastError = (e as NodeJS.ErrnoException)?.code ? `file error ${(e as NodeJS.ErrnoException).code}` : "file error";
    return false;
  }
}

/** Previous days' volumes per coin, oldest first, excluding `today`. */
export function volumeHistory(today: string, path = marketHistoryPath()): Map<string, number[]> {
  const out = new Map<string, number[]>();
  try {
    const store = load(path);
    for (const d of Object.keys(store.days).sort()) {
      if (d >= today) continue;
      for (const [id, v] of Object.entries(store.days[d]!)) { if (!out.has(id)) out.set(id, []); out.get(id)!.push(v[0]); }
    }
  } catch { /* no history yet */ }
  return out;
}

export function marketHistoryStatus(path = marketHistoryPath()) {
  try { const days = Object.keys(load(path).days).sort(); return { days: days.length, lastDay: days.at(-1) ?? null, error: lastError }; }
  catch { return { days: 0, lastDay: null, error: lastError ?? "file error" }; }
}

export function resetMarketHistoryCache() { cache = null; lastError = null; }
