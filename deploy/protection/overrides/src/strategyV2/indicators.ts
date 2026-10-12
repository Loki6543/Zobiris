// Classic technical indicators on daily closes (oldest first). Pure functions, no lookahead.

export function sma(xs: number[], n: number): number | null {
  return xs.length >= n ? xs.slice(-n).reduce((a, b) => a + b, 0) / n : null;
}

export function emaSeries(xs: number[], n: number): number[] {
  if (!xs.length) return [];
  const k = 2 / (n + 1);
  const out: number[] = [xs[0]!];
  for (let i = 1; i < xs.length; i++) out.push(xs[i]! * k + out[i - 1]! * (1 - k));
  return out;
}

/** Wilder's RSI. null until period + 1 closes exist. */
export function rsi(xs: number[], period = 14): number | null {
  if (xs.length < period + 1) return null;
  let gain = 0, loss = 0;
  for (let i = 1; i <= period; i++) { const d = xs[i]! - xs[i - 1]!; if (d >= 0) gain += d; else loss -= d; }
  gain /= period; loss /= period;
  for (let i = period + 1; i < xs.length; i++) {
    const d = xs[i]! - xs[i - 1]!;
    gain = (gain * (period - 1) + Math.max(0, d)) / period;
    loss = (loss * (period - 1) + Math.max(0, -d)) / period;
  }
  if (loss === 0) return 100;
  return 100 - 100 / (1 + gain / loss);
}

/** MACD(12, 26, 9). null until 35 closes exist so the signal line has settled a little. */
export function macd(xs: number[], fast = 12, slow = 26, signal = 9): { macd: number; signal: number; histogram: number } | null {
  if (xs.length < slow + signal) return null;
  const f = emaSeries(xs, fast), s = emaSeries(xs, slow);
  const line = xs.map((_, i) => f[i]! - s[i]!);
  const sig = emaSeries(line.slice(slow - 1), signal);
  const m = line[line.length - 1]!, g = sig[sig.length - 1]!;
  return { macd: m, signal: g, histogram: m - g };
}

export interface TechnicalRead { rsi14: number | null; rsiLabel: string; macd: ReturnType<typeof macd>; macdLabel: string; sma50: number | null; sma200: number | null; close: number | null }

export function technicalRead(closes: number[]): TechnicalRead {
  const r = rsi(closes), m = macd(closes);
  return {
    rsi14: r,
    rsiLabel: r == null ? "—" : r >= 70 ? "Overbought" : r <= 30 ? "Oversold" : "Neutral",
    macd: m,
    macdLabel: m == null ? "—" : m.histogram >= 0 ? (m.macd >= 0 ? "Bullish" : "Bullish cross, below zero") : (m.macd <= 0 ? "Bearish" : "Bearish cross, above zero"),
    sma50: sma(closes, 50), sma200: sma(closes, 200), close: closes.length ? closes[closes.length - 1]! : null,
  };
}
