import { bookValidity, type BookState, type Level } from "./krakenBook.js";

export interface BookFeatures {
  pair: string;
  observedAt: string;
  midpoint: number;
  microprice: number;
  spreadBps: number;
  queueImbalance: number;
  bidDepth50BpsUsd: number;
  askDepth50BpsUsd: number;
  bidDepth100BpsUsd: number;
  askDepth100BpsUsd: number;
}

function depth(levels: Level[], midpoint: number, bps: number): number {
  return levels.filter(([price]) => Math.abs(Number(price) / midpoint - 1) * 10000 <= bps)
    .reduce((sum, [price, size]) => sum + Number(price) * Number(size), 0);
}

export function extractBookFeatures(state: BookState, asOf: string): BookFeatures | null {
  if (!bookValidity(state, asOf).valid) return null;
  const bid = Number(state.bids[0]![0]);
  const ask = Number(state.asks[0]![0]);
  const bidQty = Number(state.bids[0]![1]);
  const askQty = Number(state.asks[0]![1]);
  const totalQty = bidQty + askQty;
  if (!(totalQty > 0)) return null;
  const midpoint = (bid + ask) / 2;
  return {
    pair: state.pair,
    observedAt: state.observedAt,
    midpoint,
    microprice: (ask * bidQty + bid * askQty) / totalQty,
    spreadBps: (ask - bid) / midpoint * 10000,
    queueImbalance: (bidQty - askQty) / totalQty,
    bidDepth50BpsUsd: depth(state.bids, midpoint, 50),
    askDepth50BpsUsd: depth(state.asks, midpoint, 50),
    bidDepth100BpsUsd: depth(state.bids, midpoint, 100),
    askDepth100BpsUsd: depth(state.asks, midpoint, 100),
  };
}
