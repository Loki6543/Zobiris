import type { MarketDepthGrade } from "../../market/kraken/execution.js";
import { describe, expect, it } from "vitest";
import { classifyAsset } from "../../market/classification/classify.js";
import { evaluateDelayedRotation } from "./evaluate.js";

const market={btc7dPct:4,btc30dPct:10,btc90dPct:40,breadth7dPositive:.65,breadth30dPositive:.55};
const capital={maneuverNavUsd:1850,availableCashUsd:600};
const execution=(hardPass=true,marketDepthGrade:MarketDepthGrade="NORMAL")=>({hardPass,marketDepthGrade});
const asset=(overrides:Record<string,unknown>={})=>({
  symbol:"AAVE",priceUsd:145,change24hPct:-1,change7dPct:5,change30dPct:-10,change90dPct:-28,
  classification:classifyAsset({symbol:"AAVE",categories:["DeFi"]}),execution:execution(),riskPass:true,...overrides
});

describe("Delayed Rotation",()=>{
  it("authorizes a modest pullback limit for a strict recovering laggard",()=>{
    const d=evaluateDelayedRotation(market,asset(),capital);
    expect(d.state).toBe("WAIT_FOR_PULLBACK");
    expect(d.qualifiesForNewCapital).toBe(true);
    expect(d.maxNewOrderUsd).toBe(37);
    expect(d.recommendedPullbackPct).toBeGreaterThanOrEqual(4);
    expect(d.recommendedPullbackPct).toBeLessThanOrEqual(8);
  });

  it("does not let institutional stress grade alone veto good personal execution",()=>{
    const d=evaluateDelayedRotation(market,asset({execution:execution(true,"SMALL_SIZE_ONLY")}),capital);
    expect(d.state).toBe("WAIT_FOR_PULLBACK");
    expect(d.maxNewOrderUsd).toBeGreaterThan(0);
  });

  it("zeroes new-buy authority when personal-size execution fails",()=>{
    const d=evaluateDelayedRotation(market,asset({execution:execution(false,"DEEP")}),capital);
    expect(d.state).toBe("LIQUIDITY_FAIL");
    expect(d.maxNewOrderUsd).toBe(0);
  });

  it("rejects structurally damaged and already extended setups",()=>{
    expect(evaluateDelayedRotation(market,asset({change90dPct:-80}),capital).state).toBe("STRUCTURALLY_WEAK");
    expect(evaluateDelayedRotation(market,asset({change7dPct:16}),capital).state).toBe("ALREADY_EXTENDED");
  });

  it("waits rather than weakening rules when no strict setup exists",()=>{
    const d=evaluateDelayedRotation(market,asset({change30dPct:5,change90dPct:8}),capital);
    expect(d.qualifiesForNewCapital).toBe(false);
    expect(d.maxNewOrderUsd).toBe(0);
  });
});
