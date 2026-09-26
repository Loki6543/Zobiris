export interface ScoredEvent { probability: number | null; outcome: boolean | null }
export interface CalibrationSummary {
  count: number;
  brierScore: number | null;
  logLoss: number | null;
  calibrationError: number | null;
  calibrated: boolean;
  bins: Array<{ range: string; count: number; meanPrediction: number; observedRate: number }>;
}

export function scoreMaturedForecasts(events: ScoredEvent[], minSamples = 30): CalibrationSummary {
  const values = events.filter((event): event is { probability: number; outcome: boolean } =>
    event.outcome !== null && event.probability !== null && Number.isFinite(event.probability) && event.probability >= 0 && event.probability <= 1);
  const count = values.length;
  const brierScore = count ? values.reduce((sum, item) => sum + (item.probability - Number(item.outcome)) ** 2, 0) / count : null;
  const logLoss = count ? values.reduce((sum, item) => {
    const p = Math.min(1 - 1e-12, Math.max(1e-12, item.probability));
    return sum - (item.outcome ? Math.log(p) : Math.log(1 - p));
  }, 0) / count : null;
  const bins = Array.from({ length: 10 }, (_, index) => {
    const group = values.filter((item) => Math.min(9, Math.floor(item.probability * 10)) === index);
    return group.length ? {
      range: `${index * 10}-${(index + 1) * 10}%`, count: group.length,
      meanPrediction: group.reduce((sum, item) => sum + item.probability, 0) / group.length,
      observedRate: group.filter((item) => item.outcome).length / group.length,
    } : null;
  }).filter((item): item is NonNullable<typeof item> => item !== null);
  const calibrationError = count ? bins.reduce((sum, bin) => sum + bin.count / count * Math.abs(bin.meanPrediction - bin.observedRate), 0) : null;
  return { count, brierScore, logLoss, calibrationError, calibrated: count >= minSamples && calibrationError !== null && calibrationError <= 0.1, bins };
}

export function detectPredictionDrift(recent: ScoredEvent[], baseline: ScoredEvent[], minSamples = 30):
  { drifted: boolean; reason: string } {
  const a = scoreMaturedForecasts(recent, minSamples);
  const b = scoreMaturedForecasts(baseline, minSamples);
  if (a.count < minSamples || b.count < minSamples) return { drifted: false, reason: "insufficient_samples" };
  return {
    drifted: a.brierScore! > b.brierScore! + 0.1,
    reason: a.brierScore! > b.brierScore! + 0.1 ? "recent_brier_deterioration" : "stable",
  };
}
