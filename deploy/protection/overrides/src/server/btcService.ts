// Bitcoin homepage data: candles per timeframe (Kraken), the daily forecast, its live score, macro and liquidations.
// Forecasts are appended once per UTC day to zobiris-btc-forecasts.jsonl on the data volume and scored from Kraken
// daily closes, so the page shows how the model is actually doing.
import { appendFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fetchJson, fetchFearGreed, parseKrakenDailyCandles, type Candle, type FetchLike } from "../strategyV2/feed.js";
import { buildForecast, scoreForecasts, type Forecast, type Macro } from "../strategyV2/btcForecast.js";
import { krakenSlot } from "./strategyV2Service.js";

const defaultFetch = fetch as unknown as FetchLike;
export const TIMEFRAMES = { "1h": 60, "4h": 240, "1d": 1440, "1w": 10080 } as const;
type Tf = keyof typeof TIMEFRAMES;
interface Cached<T> { value: T; at: number }
const candles = new Map<Tf, Cached<Candle[]>>();
const TTL: Record<Tf, number> = { "1h": 5 * 60_000, "4h": 15 * 60_000, "1d": 30 * 60_000, "1w": 6 * 3_600_000 };
let macro: Cached<Macro> | null = null, fng: Cached<number | null> | null = null, liq: Cached<LiqSummary | null> | null = null;

export async function getCandles(tf: Tf, fetcher = defaultFetch): Promise<Candle[]> {
  const hit = candles.get(tf);
  if (hit && Date.now() - hit.at < TTL[tf]) return hit.value;
  try {
    await krakenSlot();
    const value = parseKrakenDailyCandles(await fetchJson(fetcher, `https://api.kraken.com/0/public/OHLC?pair=XXBTZUSD&interval=${TIMEFRAMES[tf]}`));
    candles.set(tf, { value, at: Date.now() });
    return value;
  } catch (e) { if (hit) return hit.value; throw e; }
}

async function yahoo5d(fetcher: FetchLike, sym: string): Promise<number[] | null> {
  try {
    const r: any = await fetchJson(fetcher, `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?range=1mo&interval=1d`);
    const c = (r?.chart?.result?.[0]?.indicators?.quote?.[0]?.close ?? []).filter((v: unknown) => typeof v === "number");
    return c.length >= 6 ? c : null;
  } catch { return null; }
}
async function getMacro(fetcher: FetchLike): Promise<Macro> {
  if (macro && Date.now() - macro.at < 3_600_000) return macro.value;
  const [ndx, dxy, tnx] = await Promise.all([yahoo5d(fetcher, "^NDX"), yahoo5d(fetcher, "DX-Y.NYB"), yahoo5d(fetcher, "^TNX")]);
  const pct = (x: number[] | null) => (x ? (x.at(-1)! / x.at(-6)! - 1) * 100 : null);
  const value = { ndx5dPct: pct(ndx), dxy5dPct: pct(dxy), us10y5dBp: tnx ? (tnx.at(-1)! - tnx.at(-6)!) * 10 : null };
  macro = { value, at: Date.now() };
  return value;
}

export interface LiqSummary { longUsd24h: number; shortUsd24h: number; count: number; source: string }
/** OKX public liquidation orders for BTC perpetuals (keyless). Recorded as information; it carries no forecast weight yet. */
async function getLiquidations(fetcher: FetchLike): Promise<LiqSummary | null> {
  if (liq && Date.now() - liq.at < 15 * 60_000) return liq.value;
  try {
    const r: any = await fetchJson(fetcher, "https://www.okx.com/api/v5/public/liquidation-orders?instType=SWAP&uly=BTC-USDT&state=filled&limit=100");
    const det = (r?.data ?? []).flatMap((d: any) => d?.details ?? []);
    const since = Date.now() - 86_400_000;
    let longUsd = 0, shortUsd = 0, count = 0;
    for (const x of det) {
      if (Number(x?.ts) < since) continue;
      const usd = Number(x?.sz) * Number(x?.bkPx) * 0.01; // BTC-USDT-SWAP contract = 0.01 BTC
      if (!Number.isFinite(usd)) continue;
      count++; if (x?.posSide === "long" || x?.side === "sell") longUsd += usd; else shortUsd += usd;
    }
    const value = { longUsd24h: Math.round(longUsd), shortUsd24h: Math.round(shortUsd), count, source: "OKX BTC-USDT perpetual (sample of recent liquidations)" };
    liq = { value, at: Date.now() };
    return value;
  } catch { return liq?.value ?? null; }
}

export function forecastPath(): string {
  return process.env.ZOBIRIS_BTC_FORECAST_PATH ?? join(dirname(process.env.ZOBIRIS_DB_PATH ?? "/data/zobiris.sqlite"), "zobiris-btc-forecasts.jsonl");
}
let recorded: Forecast[] | null = null;
function loadRecorded(path = forecastPath()): Forecast[] {
  if (recorded) return recorded;
  const rows: Forecast[] = [];
  if (existsSync(path)) for (const line of readFileSync(path, "utf8").split("\n")) { if (!line.trim()) continue; try { rows.push(JSON.parse(line)); } catch { /* torn line */ } }
  recorded = rows;
  return rows;
}
function record(f: Forecast, path = forecastPath()) {
  const rows = loadRecorded(path);
  if (rows.some((r) => r.day === f.day)) return;
  try { mkdirSync(dirname(path), { recursive: true }); appendFileSync(path, JSON.stringify(f) + "\n"); rows.push(f); } catch { /* read-only volume: page still works */ }
}

export async function getBitcoinReport(fetcher = defaultFetch) {
  const day = await getCandles("1d", fetcher);
  if (fng == null || Date.now() - fng.at > 3_600_000) { try { fng = { value: (await fetchFearGreed(fetcher)).at(-1)?.value ?? null, at: Date.now() }; } catch { fng = fng ?? { value: null, at: 0 }; } }
  const [mac, liqs] = await Promise.all([getMacro(fetcher), getLiquidations(fetcher)]);
  const today = new Date((day.at(-1)?.time ?? 0) * 1000).toISOString().slice(0, 10);
  const f = buildForecast({ closes: day.map((c) => c.close), highs: day.map((c) => c.high), lows: day.map((c) => c.low), macro: mac, fearGreed: fng.value, eventRisk: [] }, today);
  if (f && process.env.ZOBIRIS_LEDGER !== "0") record(f);
  const closeByDay = new Map(day.map((c) => [new Date(c.time * 1000).toISOString().slice(0, 10), c.close]));
  return { asOf: new Date().toISOString(), forecast: f, score: scoreForecasts(loadRecorded(), closeByDay), recordedDays: loadRecorded().length, macro: mac, fearGreed: fng.value, liquidations: liqs,
    sources: ["Kraken public OHLC (XXBTZUSD)", "Yahoo Finance chart API (^NDX, DX-Y.NYB, ^TNX)", "alternative.me Fear & Greed", "OKX public liquidation orders"] };
}
export function resetBtcCache() { recorded = null; candles.clear(); macro = null; fng = null; liq = null; }
