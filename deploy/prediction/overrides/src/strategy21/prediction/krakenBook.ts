export type Level = readonly [price: string | number, size: string | number];

export interface BookEvent {
  kind: "snapshot" | "delta";
  pair: string;
  sequence?: number;
  checksum?: number;
  observedAt: string;
  bids: Level[];
  asks: Level[];
}

export interface BookState {
  pair: string;
  sequence?: number;
  observedAt: string;
  bids: Level[];
  asks: Level[];
  mapped: boolean;
  continuity: boolean;
}

export type BookValidity = { valid: true } | { valid: false; reason: "sequence_gap" | "crossed" | "stale" | "unmapped" | "empty" };

function mergeLevels(current: Level[], changes: Level[], descending: boolean): Level[] {
  const levels = new Map(current.map(([price, size]) => [String(Number(price)), [String(price), String(size)] as Level]));
  for (const [price, size] of changes) {
    if (!Number.isFinite(Number(price)) || !Number.isFinite(Number(size)) || Number(price) <= 0 || Number(size) < 0) continue;
    if (Number(size) === 0) levels.delete(String(Number(price)));
    else levels.set(String(Number(price)), [String(price), String(size)]);
  }
  return [...levels.values()].sort((a, b) => descending ? Number(b[0]) - Number(a[0]) : Number(a[0]) - Number(b[0])).slice(0, 100);
}

function crc32(value: string): number {
  let crc = 0xffffffff;
  for (let i = 0; i < value.length; i++) {
    crc ^= value.charCodeAt(i);
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

export function bookChecksum(state: Pick<BookState, "asks" | "bids">): number {
  const format = ([price, size]: Level) => String(price).replace(".", "").replace(/^0+/, "") + String(size).replace(".", "").replace(/^0+/, "");
  return crc32([...state.asks.slice(0, 10), ...state.bids.slice(0, 10)].map(format).join(""));
}

export function applyBookEvent(state: BookState | null, event: BookEvent): BookState {
  const reset = event.kind === "snapshot";
  const continuity = reset || !!state && state.continuity && state.pair === event.pair &&
    (event.sequence === undefined || state.sequence === undefined || event.sequence === state.sequence + 1);
  if (!continuity && state) return { ...state, continuity: false };
  const next: BookState = {
    pair: event.pair,
    sequence: event.sequence,
    observedAt: event.observedAt,
    bids: mergeLevels(reset ? [] : state?.bids ?? [], event.bids, true),
    asks: mergeLevels(reset ? [] : state?.asks ?? [], event.asks, false),
    mapped: /^[A-Z0-9]+\/USD$/.test(event.pair),
    continuity,
  };
  if (event.checksum !== undefined && bookChecksum(next) !== event.checksum) next.continuity = false;
  return next;
}

export function bookValidity(state: BookState, now: string, maxAgeMs = 30_000): BookValidity {
  if (!state.continuity) return { valid: false, reason: "sequence_gap" };
  if (!state.mapped) return { valid: false, reason: "unmapped" };
  if (!state.bids.length || !state.asks.length) return { valid: false, reason: "empty" };
  if (Number(state.bids[0]![0]) >= Number(state.asks[0]![0])) return { valid: false, reason: "crossed" };
  const age = Date.parse(now) - Date.parse(state.observedAt);
  if (!Number.isFinite(age) || age < 0 || age > maxAgeMs) return { valid: false, reason: "stale" };
  return { valid: true };
}
