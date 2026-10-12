// Persists the decision ledger as append-only JSON lines on the data volume (next to the SQLite database).
// One write per UTC day: the first strategy report of the day appends its rows; nothing is ever rewritten.
import { appendFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { dayOf, rowsForReport, summarizeLedger, type LedgerRow } from "../strategyV2/ledger.js";
import type { StrategyReport } from "../strategyV2/report.js";

export function ledgerPath(): string {
  return process.env.ZOBIRIS_LEDGER_PATH ?? join(dirname(process.env.ZOBIRIS_DB_PATH ?? "/data/zobiris.sqlite"), "zobiris-decisions.jsonl");
}

let rows: LedgerRow[] | null = null;
let lastError: string | null = null;

function load(path = ledgerPath()): LedgerRow[] {
  if (rows) return rows;
  rows = [];
  if (existsSync(path)) {
    for (const line of readFileSync(path, "utf8").split("\n")) {
      if (!line.trim()) continue;
      try { rows.push(JSON.parse(line)); } catch { /* a torn last line from a crash is skipped, never repaired in place */ }
    }
  }
  return rows;
}

/** Append today's rows once. Returns true when something was written. */
export function recordReport(report: StrategyReport, path = ledgerPath()): boolean {
  try {
    const all = load(path);
    const day = dayOf(report.asOf);
    if (all.some((r) => r.kind === "snapshot" && r.day === day)) return false;
    const fresh = rowsForReport(report);
    mkdirSync(dirname(path), { recursive: true });
    appendFileSync(path, fresh.map((r) => JSON.stringify(r)).join("\n") + "\n", "utf8");
    all.push(...fresh);
    lastError = null;
    return true;
  } catch (e) {
    lastError = String(e instanceof Error ? e.message : e);
    return false;
  }
}

export function ledgerStatus() {
  const all = load();
  return { path: ledgerPath(), rows: all.length, error: lastError, summary: summarizeLedger(all, new Date().toISOString().slice(0, 10)) };
}

/** Test hook: forget the in-memory copy so the next call re-reads the file. */
export function resetLedgerCache() { rows = null; lastError = null; }
