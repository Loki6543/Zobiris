// Persists the decision ledger as append-only JSON lines on the data volume (next to the SQLite database).
// One write per UTC day: the first strategy report of the day appends its rows; nothing is ever rewritten.
import { appendFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { dayOf, rowsForReport, summarizeLedger, summarizeSignals, type LedgerRow } from "../strategyV2/ledger.js";
import type { StrategyReport } from "../strategyV2/report.js";

export function ledgerPath(): string {
  return process.env.ZOBIRIS_LEDGER_PATH ?? join(dirname(process.env.ZOBIRIS_DB_PATH ?? "/data/zobiris.sqlite"), "zobiris-decisions.jsonl");
}

let cache: { path: string; rows: LedgerRow[]; endsWithNewline: boolean } | null = null;
let lastError: string | null = null;

/** Rows on disk. A read error is thrown (and never cached) so a bad read cannot make today look unrecorded. */
function load(path = ledgerPath()): { rows: LedgerRow[]; endsWithNewline: boolean } {
  if (cache?.path === path) return cache;
  const rows: LedgerRow[] = [];
  let endsWithNewline = true;
  if (existsSync(path)) {
    const text = readFileSync(path, "utf8");
    endsWithNewline = text.length === 0 || text.endsWith("\n");
    for (const line of text.split("\n")) {
      if (!line.trim()) continue;
      try { rows.push(JSON.parse(line)); } catch { /* a torn last line from a crash is skipped, never repaired in place */ }
    }
  }
  cache = { path, rows, endsWithNewline };
  return cache;
}

/** Short, path-free error text for the public status. */
const errorText = (e: unknown) => { const code = (e as NodeJS.ErrnoException)?.code; return code ? `file error ${code}` : "file error"; };

/** Append today's rows once. Returns true when something was written. */
export function recordReport(report: StrategyReport, path = ledgerPath()): boolean {
  try {
    const state = load(path);
    const day = dayOf(report.asOf);
    if (state.rows.some((r) => r.kind === "snapshot" && r.day === day)) return false;
    const fresh = rowsForReport(report);
    // The snapshot goes last: it marks the day as recorded, so a write cut short is retried rather than half-kept.
    // Repeated same-day decision rows from such a retry do not change the scoring (one onset per run, one price per day).
    const ordered = [...fresh.filter((r) => r.kind !== "snapshot"), ...fresh.filter((r) => r.kind === "snapshot")];
    mkdirSync(dirname(path), { recursive: true });
    // Start on a new line if the file ends in a torn line, so the first new row is not glued onto it.
    appendFileSync(path, (state.endsWithNewline ? "" : "\n") + ordered.map((r) => JSON.stringify(r)).join("\n") + "\n", "utf8");
    state.rows.push(...ordered);
    state.endsWithNewline = true;
    lastError = null;
    return true;
  } catch (e) {
    cache = null; // re-read the file next time so memory matches what actually reached the disk
    lastError = errorText(e);
    return false;
  }
}

export function ledgerStatus() {
  let rows: LedgerRow[] = [];
  let error = lastError;
  try { rows = load().rows; } catch (e) { error = errorText(e); }
  const today = new Date().toISOString().slice(0, 10);
  return { path: ledgerPath(), rows: rows.length, error, summary: summarizeLedger(rows, today), signals: summarizeSignals(rows, today) };
}

/** BTC regime state per recorded day, oldest first (for the Valley Forge transition check). */
export function recentRegimes(days = 30): string[] {
  try { return load().rows.filter((r) => r.kind === "snapshot").sort((a, b) => a.day.localeCompare(b.day)).slice(-days).map((r) => (r as { regime: string }).regime); }
  catch { return []; }
}

/** Test hook: forget the in-memory copy so the next call re-reads the file. */
export function resetLedgerCache() { cache = null; lastError = null; }
