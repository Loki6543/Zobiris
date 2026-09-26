import type { BookFeatures } from "../strategy21/prediction/bookFeatures.js";
import { predictHorizons } from "../strategy21/prediction/forecast.js";
import { appendBookFeatures, readBookFeatures } from "./bookFeatureStore.js";
import { saveShadowForecasts, settleShadowForecasts } from "./predictionOutcomes.js";

/** The return value only writes shadow tables. It has no Strategy 2.1 decision input or output. */
export function createShadowFeatureHandler(dbPath: string, feeBpsPerSide = 40): (feature: BookFeatures) => void {
  const forecastBuckets = new Map<string, number>();
  return (feature) => {
    appendBookFeatures(dbPath, feature);
    settleShadowForecasts(dbPath, feature);
    const asOfMs = Date.parse(feature.observedAt);
    const bucket = Math.floor(asOfMs / (15 * 60_000));
    if (forecastBuckets.get(feature.pair) === bucket) return;
    const history = readBookFeatures(dbPath, feature.pair, feature.observedAt);
    if (history.length < 2) return;
    const forecasts = predictHorizons({ pair: feature.pair, asOf: feature.observedAt, features: history, feeBpsPerSide });
    saveShadowForecasts(dbPath, forecasts, feature.midpoint);
    forecastBuckets.set(feature.pair, bucket);
  };
}
