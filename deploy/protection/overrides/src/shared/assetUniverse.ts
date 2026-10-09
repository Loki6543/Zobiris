/** Shared product exclusion. Exchange records remain intact for reconciliation. */
export const isVisibleAsset = (symbol: unknown) => String(symbol ?? '').trim().toUpperCase() !== 'BABY';
export function visibleAssetData(value: any): any {
  if (Array.isArray(value)) return value.filter(row => typeof row === 'string' ? isVisibleAsset(row) : isVisibleAsset(row?.symbol ?? row?.assetSymbol ?? row?.scope)).map(visibleAssetData);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.entries(value).filter(([key]) => isVisibleAsset(key)).map(([key, item]) => {
    if (key === 'rankedAssets' && typeof item === 'string') {
      try { return [key, JSON.stringify(visibleAssetData(JSON.parse(item)))]; } catch { return [key, item]; }
    }
    return [key, visibleAssetData(item)];
  }));
}
/** Keep watchlist identities even before their first evaluation. */
export function mergeAssetUniverse(watchlist: {symbol:string;name?:string}[], ranked: any[]) {
  const evaluated = new Map(ranked.filter(a => isVisibleAsset(a.symbol)).map(a => [String(a.symbol).toUpperCase(), a]));
  return watchlist.filter(a => isVisibleAsset(a.symbol)).map(a => evaluated.get(a.symbol.toUpperCase()) ?? {symbol:a.symbol.toUpperCase(),name:a.name,mappingStatus:'unresolved',action:'Awaiting evaluation'});
}
