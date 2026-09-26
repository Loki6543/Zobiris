import { applyBookEvent, bookValidity, type BookState } from "./krakenBook.js";
import { extractBookFeatures, type BookFeatures } from "./bookFeatures.js";
import { parseSpotBookMessage } from "./krakenSpotFeed.js";

export function consumeSpotBook(state: BookState | null, raw: string, allowedPairs: readonly string[], receivedAt: string):
  { state: BookState | null; features: BookFeatures | null; resubscribe: boolean } {
  const event = parseSpotBookMessage(raw);
  if (!event || !allowedPairs.includes(event.pair)) return { state, features: null, resubscribe: false };
  const next = applyBookEvent(state, event);
  const validity = bookValidity(next, receivedAt);
  return {
    state: next,
    features: validity.valid ? extractBookFeatures(next, receivedAt) : null,
    resubscribe: !validity.valid && validity.reason === "sequence_gap",
  };
}

/** Public market-data connection. Does not use private account credentials. */
export function startKrakenBookShadow(pairs: readonly string[], onFeature: (feature: BookFeatures) => void): () => void {
  const allowed = [...new Set(pairs.filter((pair) => /^[A-Z0-9]+\/USD$/.test(pair)))].slice(0, 12);
  if (!allowed.length) return () => {};
  let closed = false;
  let socket: WebSocket | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let retryMs = 5_000;
  const states = new Map<string, BookState>();
  const lastSampleMinute = new Map<string, number>();
  const connect = () => {
    if (closed) return;
    states.clear();
    lastSampleMinute.clear();
    socket = new WebSocket("wss://ws.kraken.com/v2");
    socket.addEventListener("open", () => {
      retryMs = 5_000;
      socket?.send(JSON.stringify({ method: "subscribe", params: { channel: "book", symbol: allowed, depth: 100, snapshot: true } }));
    });
    socket.addEventListener("message", (message) => {
      if (closed || typeof message.data !== "string") return;
      const event = parseSpotBookMessage(message.data);
      if (!event || !allowed.includes(event.pair)) return;
      const result = consumeSpotBook(states.get(event.pair) ?? null, message.data, allowed, new Date().toISOString());
      if (result.state) states.set(event.pair, result.state);
      if (result.features) {
        const minute = Math.floor(Date.parse(result.features.observedAt) / 60_000);
        if (lastSampleMinute.get(event.pair) !== minute) {
          lastSampleMinute.set(event.pair, minute);
          onFeature(result.features);
        }
      }
      if (result.resubscribe) socket?.close();
    });
    socket.addEventListener("close", () => {
      states.clear();
      lastSampleMinute.clear();
      if (!closed) {
        timer = setTimeout(connect, retryMs);
        retryMs = Math.min(60_000, retryMs * 2);
      }
    });
    socket.addEventListener("error", () => socket?.close());
  };
  connect();
  return () => { closed = true; if (timer) clearTimeout(timer); socket?.close(); };
}
