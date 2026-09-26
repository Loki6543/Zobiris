import type { BookEvent, Level } from "./krakenBook.js";

/** Preserve decimal lexemes before JSON.parse; native numbers lose trailing precision needed for CRC32. */
export function parseSpotBookMessage(raw: string): BookEvent | null {
  const precise = raw.replace(/"(price|qty)"\s*:\s*(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g, '"$1":"$2"');
  let payload: unknown;
  try { payload = JSON.parse(precise); } catch { return null; }
  if (!payload || typeof payload !== "object") return null;
  const message = payload as { channel?: unknown; type?: unknown; data?: unknown };
  if (message.channel !== "book" || !["snapshot", "update"].includes(String(message.type)) || !Array.isArray(message.data)) return null;
  const row = message.data[0] as { symbol?: unknown; timestamp?: unknown; bids?: unknown; asks?: unknown; checksum?: unknown } | undefined;
  if (!row || typeof row.symbol !== "string" || typeof row.timestamp !== "string" || !Number.isFinite(Date.parse(row.timestamp)) || !Number.isInteger(row.checksum)) return null;
  const levels = (value: unknown): Level[] | null => {
    if (!Array.isArray(value)) return null;
    const result: Level[] = [];
    for (const item of value) {
      if (!item || typeof item !== "object") return null;
      const entry = item as { price?: unknown; qty?: unknown };
      if (!/^(?:0|[1-9]\d*)(?:\.\d+)?$/.test(String(entry.price)) || !/^(?:0|[1-9]\d*)(?:\.\d+)?$/.test(String(entry.qty))) return null;
      result.push([String(entry.price), String(entry.qty)]);
    }
    return result;
  };
  const bids = levels(row.bids), asks = levels(row.asks);
  if (!bids || !asks) return null;
  return { kind: message.type === "snapshot" ? "snapshot" : "delta", pair: row.symbol, observedAt: row.timestamp, bids, asks, checksum: row.checksum as number };
}
