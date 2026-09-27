import { describe, expect, it } from "vitest";
import { classifyAsset } from "./classify.js";

describe("asset classification", () => {
  it("excludes stablecoins explicitly instead of dropping them", () => {
    expect(classifyAsset({symbol:"USDC",categories:["USD Stablecoin"]})).toEqual({
      symbol:"USDC",assetClass:"STABLECOIN",recommendationExcluded:true,reason:"stablecoin_excluded"
    });
  });

  it("keeps unknown classifications visible and fail-observable", () => {
    expect(classifyAsset({symbol:"ABC"})).toMatchObject({
      symbol:"ABC",assetClass:"UNKNOWN",recommendationExcluded:false,reason:"classification_data_missing"
    });
  });
});
