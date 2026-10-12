// Backtest Lab data: runs the long/flat strategy suite on Kraken BTC daily bars (the same cached candles as the Bitcoin page).
// Pure computation over public data, cached 6h; it never touches an account and cannot place orders.
import { getCandles } from "./btcService.js";
import { runBacktestLab, type BacktestReport } from "../strategyV2/backtest.js";

const TTL_MS = 6 * 3_600_000;
let cached: { value: BacktestReport; at: number } | null = null;

export async function getBacktestReport(): Promise<BacktestReport> {
  if (cached && Date.now() - cached.at < TTL_MS) return cached.value;
  const candles = await getCandles("1d");
  const report = runBacktestLab(candles.map((c) => ({ time: c.time, open: c.open, high: c.high, low: c.low, close: c.close })), new Date().toISOString());
  if (!report) throw new Error("Not enough daily history for the backtest lab (needs about 470 days)");
  cached = { value: report, at: Date.now() };
  return report;
}
export function resetBacktestCache() { cached = null; }
