import {
  readOutcomeMemory,
  updateOutcomeObservations,
  type OutcomeQuote,
} from "./outcomeMemory.js";
export interface CollectionStatus {
  status: "AVAILABLE" | "PARTIAL" | "UNAVAILABLE" | "SKIPPED";
  attemptedAt: string;
  lastSuccessAt: string | null;
  requestedSymbols: string[];
  observedSymbols: string[];
  error?: string;
}
const running = new Set<string>();
export async function collectOutcomeTick(opts: {
  path: string;
  now: () => number;
  fetchQuotes: (symbols: string[]) => Promise<OutcomeQuote[]>;
}): Promise<CollectionStatus> {
  const at = new Date(opts.now()).toISOString();
  const result: CollectionStatus = {
    status: "SKIPPED",
    attemptedAt: at,
    lastSuccessAt: null,
    requestedSymbols: [],
    observedSymbols: [],
  };
  if (running.has(opts.path)) return result;
  running.add(opts.path);
  try {
    const memory = await readOutcomeMemory(opts.path);
    const symbols = [
      ...new Set(
        memory.records
          .filter(
            (r) =>
              r.measurementVersion === "episodes-v2" &&
              r.evaluations.some(
                (e) => !e.evaluatedAt && e.status !== "EXPIRED",
              ),
          )
          .map((r) => r.symbol),
      ),
    ];
    if (!symbols.length) return result;
    if (!symbols.includes("BTC")) symbols.push("BTC");
    result.requestedSymbols = symbols;
    const quotes: OutcomeQuote[] = [];
    let failed = false;
    for (let i = 0; i < symbols.length; i += 100) {
      try {
        quotes.push(...(await opts.fetchQuotes(symbols.slice(i, i + 100))));
      } catch {
        failed = true;
      }
    }
    const receivedAt = new Date(opts.now()).toISOString();
    const ms = Date.parse(receivedAt);
    const accepted = quotes.filter(
      (q) =>
        symbols.includes(q.symbol) &&
        Number.isFinite(q.priceUsd) &&
        q.priceUsd > 0 &&
        Number.isFinite(Date.parse(q.observedAt)) &&
        Date.parse(q.observedAt) <= ms &&
        ms - Date.parse(q.observedAt) <= 15 * 60000,
    );
    await updateOutcomeObservations(opts.path, accepted, receivedAt);
    result.observedSymbols = [...new Set(accepted.map((q) => q.symbol))];
    result.status =
      result.observedSymbols.length === symbols.length
        ? "AVAILABLE"
        : result.observedSymbols.length
          ? "PARTIAL"
          : "UNAVAILABLE";
    if (accepted.length) result.lastSuccessAt = receivedAt;
    if (failed) result.error = "QUOTE_FETCH_FAILED";
    return result;
  } catch {
    result.status = "UNAVAILABLE";
    result.error = "OUTCOME_STORAGE_FAILED";
    return result;
  } finally {
    running.delete(opts.path);
  }
}
