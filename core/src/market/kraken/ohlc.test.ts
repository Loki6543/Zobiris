import { describe,expect,it } from "vitest";
import { evaluateBuyLimitFill, nearestCandleOpen, parseCommittedOhlcRows } from "./ohlc.js";

describe("Kraken OHLC utilities",()=>{
  it("drops Kraken's final still-open candle",()=>{
    const rows=[
      [1000,"10","11","9","10.5","10.2","100",5],
      [1060,"10.5","12","10","11","11","120",7],
    ];
    const parsed=parseCommittedOhlcRows("AAVE",1,rows);
    expect(parsed).toHaveLength(1);
    expect(parsed[0]?.open).toBe(10);
  });

  it("resolves the nearest actual candle timestamp and records timing error",()=>{
    const candles=[
      {symbol:"AAVE",intervalMinutes:1,openTime:"2026-09-27T01:59:30.000Z",open:100,high:101,low:99,close:100,volume:1,committed:true as const},
      {symbol:"AAVE",intervalMinutes:1,openTime:"2026-09-27T02:00:30.000Z",open:102,high:103,low:101,close:102,volume:1,committed:true as const},
    ];
    const price=nearestCandleOpen(candles,"2026-09-27T02:00:00.000Z",60_000);
    expect(price?.price).toBe(100);
    expect(Math.abs(price?.delayMs ?? 999999)).toBe(30_000);
  });

  it("does not count a candle whose interval extends beyond the limit expiry",()=>{
    const candles=[
      {symbol:"AAVE",intervalMinutes:5,openTime:"2026-09-27T01:55:00.000Z",open:145,high:146,low:137,close:142,volume:1,committed:true as const}
    ];
    const fill=evaluateBuyLimitFill(candles,{startAt:"2026-09-27T01:00:00.000Z",expiresAt:"2026-09-27T01:56:00.000Z",limitPrice:138});
    expect(fill.filled).toBe(false);
  });

  it("uses real candle low to prove a limit touch but never assumes price improvement",()=>{
    const candles=[
      {symbol:"AAVE",intervalMinutes:5,openTime:"2026-09-27T01:05:00.000Z",open:145,high:146,low:137.5,close:142,volume:1,committed:true as const}
    ];
    const fill=evaluateBuyLimitFill(candles,{startAt:"2026-09-27T01:00:00.000Z",expiresAt:"2026-09-27T02:00:00.000Z",limitPrice:138});
    expect(fill).toMatchObject({filled:true,assumedFillPrice:138,evidence:"OHLC_TOUCH_CONSERVATIVE_LIMIT_PRICE"});
  });
});
