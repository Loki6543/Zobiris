export type AssetClass =
  | "NORMAL_CRYPTO"
  | "STABLECOIN"
  | "WRAPPED_OR_LST"
  | "MEME"
  | "RWA_TOKENIZED"
  | "UNKNOWN";

export interface ClassificationInput {
  symbol: string;
  categories?: string[];
  tags?: string[];
  explicitClass?: AssetClass;
}

export interface AssetClassification {
  symbol: string;
  assetClass: AssetClass;
  recommendationExcluded: boolean;
  reason: string | null;
}

const has=(values:string[]|undefined,pattern:RegExp) => (values ?? []).some(value=>pattern.test(value));

export function classifyAsset(input: ClassificationInput): AssetClassification {
  const symbol=input.symbol.toUpperCase();
  if(input.explicitClass) return {
    symbol,assetClass:input.explicitClass,
    recommendationExcluded:input.explicitClass==="STABLECOIN",
    reason:input.explicitClass==="STABLECOIN" ? "stablecoin_excluded" : null,
  };
  if(has(input.categories,/stablecoin/i)||has(input.tags,/stablecoin/i)) {
    return {symbol,assetClass:"STABLECOIN",recommendationExcluded:true,reason:"stablecoin_excluded"};
  }
  if(has(input.categories,/wrapped|liquid staking|lst/i)||has(input.tags,/wrapped|liquid staking|lst/i)) {
    return {symbol,assetClass:"WRAPPED_OR_LST",recommendationExcluded:false,reason:null};
  }
  if(has(input.categories,/meme/i)||has(input.tags,/meme/i)) {
    return {symbol,assetClass:"MEME",recommendationExcluded:false,reason:null};
  }
  if(has(input.categories,/real world asset|rwa|tokenized/i)||has(input.tags,/real world asset|rwa|tokenized/i)) {
    return {symbol,assetClass:"RWA_TOKENIZED",recommendationExcluded:false,reason:null};
  }
  if((input.categories?.length ?? 0)>0 || (input.tags?.length ?? 0)>0) {
    return {symbol,assetClass:"NORMAL_CRYPTO",recommendationExcluded:false,reason:null};
  }
  return {symbol,assetClass:"UNKNOWN",recommendationExcluded:false,reason:"classification_data_missing"};
}
