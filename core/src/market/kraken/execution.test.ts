import { describe, expect, it } from "vitest";
import { evaluatePersonalExecution, type NormalizedBook } from "./execution.js";

const now="2026-09-27T08:30:00.000Z";
function book(depthUsdPerSide:number): NormalizedBook {
  const bid=100, ask=100.1;
  const levels=Math.max(1,Math.ceil(depthUsdPerSide/500));
  const usdPerLevel=depthUsdPerSide/levels;
  return {
    pair:"TEST/USD", observedAt:now,
    bids:Array.from({length:levels},(_,i)=>({price:bid-i*0.01,qty:usdPerLevel/(bid-i*0.01)})),
    asks:Array.from({length:levels},(_,i)=>({price:ask+i*0.01,qty:usdPerLevel/(ask+i*0.01)})),
  };
}

describe("personal-size execution", () => {
  it("allows a small order even when institutional stress depth fails", () => {
    const result=evaluatePersonalExecution(book(5_000),{asOf:now,proposedOrderUsd:37,currentPositionUsd:300});
    expect(result.hardPass).toBe(true);
    expect(["NORMAL","SMALL_SIZE_ONLY"]).toContain(result.marketDepthGrade);
    expect(result.stress["250000"].sell.complete).toBe(false);
  });

  it("fails closed when the standardized $100 trade cannot fully execute", () => {
    const result=evaluatePersonalExecution(book(50),{asOf:now,proposedOrderUsd:37});
    expect(result.hardPass).toBe(false);
    expect(result.reasonCodes).toContain("standard_sell_execution_fail");
  });

  it("fails stale books regardless of apparent depth", () => {
    const result=evaluatePersonalExecution(book(100_000),{asOf:"2026-09-27T08:31:00.000Z",proposedOrderUsd:37});
    expect(result.fresh).toBe(false);
    expect(result.hardPass).toBe(false);
  });

  it("tests the actual holding exit without using a $50k veto", () => {
    const result=evaluatePersonalExecution(book(1_000),{asOf:now,proposedOrderUsd:50,currentPositionUsd:2_000});
    expect(result.standardSell.complete).toBe(true);
    expect(result.positionSell?.complete).toBe(false);
    expect(result.hardPass).toBe(false);
    expect(result.reasonCodes).toContain("position_exit_execution_fail");
  });
});
