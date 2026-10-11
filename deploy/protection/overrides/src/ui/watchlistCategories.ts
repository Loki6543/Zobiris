export type WatchlistCategory='all'|'entry'|'delayed'|'missing';
export type CategoryRow={ready:boolean;asset?:{strategy21?:{delayedRotation?:unknown}};metrics:{stale:boolean;priceUsd:number|null}};
/** Pure UI grouping only. These categories do not alter entry/rotation eligibility. */
export function filterWatchlistCategory<T extends CategoryRow>(rows:T[],category:WatchlistCategory,snapshotFresh:boolean):T[]{
 if(category==='entry')return rows.filter(row=>snapshotFresh && row.ready===true && !row.metrics.stale && row.metrics.priceUsd!==null && Number.isFinite(row.metrics.priceUsd) && row.metrics.priceUsd>0);
 if(category==='delayed')return rows.filter(row=>row.asset?.strategy21?.delayedRotation!==undefined && row.asset?.strategy21?.delayedRotation!==null);
 if(category==='missing')return rows.filter(row=>row.metrics.stale || row.metrics.priceUsd===null || !Number.isFinite(row.metrics.priceUsd));
 return rows;
}
