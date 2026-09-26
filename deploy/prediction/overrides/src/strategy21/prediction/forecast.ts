import type { BookFeatures } from "./bookFeatures.js";

export type PredictionHorizon = "1H" | "4H" | "1D" | "3D" | "7D";
export type PredictionAuthority = { level: "HIGH" | "NORMAL" | "LOW" | "ABSTAIN"; reason: string };
export interface ForecastRecord {
  forecastId: string;
  pair: string;
  asOf: string;
  featureCutoff: string | null;
  horizon: PredictionHorizon;
  modelVersion: "shadow-baselines/1";
  availability: "shadow_uncalibrated" | "insufficient_data";
  regime: "up" | "down" | "sideways" | null;
  positiveReturnProbability: number | null;
  plusThreePercentProbability: number | null;
  drawdownFivePercentProbability: number | null;
  quantilesPct: { p10: number; p50: number; p90: number } | null;
  estimatedNetReturnPct: number | null;
  estimatedRoundTripCostPct: number | null;
  shadowSignal: number | null;
}

export interface PredictionInput {
  pair: string;
  asOf: string;
  features: BookFeatures[];
  feeBpsPerSide: number;
}

const HORIZONS: PredictionHorizon[] = ["1H", "4H", "1D", "3D", "7D"];
export function predictHorizons(input: PredictionInput): ForecastRecord[] {
  const cutoff = Date.parse(input.asOf);
  const history = input.features.filter((row) => row.pair === input.pair && Number.isFinite(Date.parse(row.observedAt)) && Date.parse(row.observedAt) <= cutoff)
    .sort((a, b) => Date.parse(a.observedAt) - Date.parse(b.observedAt));
  const recent = history.at(-1);
  const previous = history.at(-2);
  const usable = !!recent && !!previous && cutoff - Date.parse(recent.observedAt) <= 30_000 && recent.midpoint > 0 && previous.midpoint > 0;
  const trend = usable ? (recent!.midpoint / previous!.midpoint - 1) * 100 : null;
  const regime = trend == null ? null : trend > 0.2 ? "up" : trend < -0.2 ? "down" : "sideways";
  // Diagnostic score only: it is not a return forecast or a calibrated probability.
  const shadowSignal = usable ? Number((0.5 * Math.tanh(trend! / 2) + 0.5 * recent!.queueImbalance).toFixed(4)) : null;
  const roundTripCostPct = usable ? (2 * Math.max(0, input.feeBpsPerSide) + recent!.spreadBps) / 100 : null;
  return HORIZONS.map((horizon) => ({
    forecastId: `${input.pair}:${input.asOf}:${horizon}:shadow-baselines/1`,
    pair: input.pair, asOf: input.asOf,
    featureCutoff: usable ? recent!.observedAt : null,
    horizon, modelVersion: "shadow-baselines/1",
    availability: usable ? "shadow_uncalibrated" : "insufficient_data",
    regime,
    positiveReturnProbability: null,
    plusThreePercentProbability: null,
    drawdownFivePercentProbability: null,
    quantilesPct: null,
    estimatedNetReturnPct: null,
    estimatedRoundTripCostPct: roundTripCostPct,
    shadowSignal,
  }));
}

export function assessAuthority(forecast: ForecastRecord): PredictionAuthority {
  if (forecast.availability === "insufficient_data") return { level: "ABSTAIN", reason: "insufficient_data" };
  return { level: "ABSTAIN", reason: "uncalibrated" };
}
