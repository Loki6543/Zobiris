export type CrossAssetGraphInput = {
  symbol: string;
  change24hPct: number | null;
  change7dPct: number | null;
  change30dPct: number | null;
  change90dPct: number | null;
};

export type CrossAssetNeighbor = {
  symbol: string;
  edgeWeight: number;
  attentionWeight: number;
  ecosystemEdge: boolean;
  move24hPct: number;
  move7dPct: number;
  contribution24hPct: number;
};

export type CrossAssetGraphShadow = {
  available: boolean;
  state:
    | "CATCH_UP_CANDIDATE"
    | "OVEREXTENDED"
    | "ALIGNED"
    | "MIXED"
    | "INSUFFICIENT";
  authority: "SHADOW_ONLY_NO_ENTRY_SCORE_CHANGE";
  source: "ZOBIRIS_CURRENT_CROSS_SECTION";
  paperReference: "arXiv:2606.27670";
  method: string;
  universeSize: number;
  neighborCount: number;
  networkImplied24hPct: number | null;
  networkImplied7dPct: number | null;
  residual24hPct: number | null;
  residual7dPct: number | null;
  confidence: number | null;
  entryPullbackAdjustmentPct: number;
  neighbors: CrossAssetNeighbor[];
};

const PARENT: Record<string, string> = {
  RAY: "SOL",
  JUP: "SOL",
  JOE: "AVAX",
  ARB: "ETH",
  OP: "ETH",
};

const finite = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const clamp = (value: number, low: number, high: number) =>
  Math.max(low, Math.min(high, value));

const round = (value: number, digits = 4) =>
  Number(value.toFixed(digits));

function ecosystemEdge(a: string, b: string) {
  return PARENT[a] === b || PARENT[b] === a;
}

function mean(values: number[]) {
  return values.length
    ? values.reduce((sum, value) => sum + value, 0) / values.length
    : 0;
}

function stdev(values: number[]) {
  if (values.length < 2) return 0;
  const m = mean(values);
  return Math.sqrt(
    values.reduce((sum, value) => sum + (value - m) ** 2, 0) /
      values.length,
  );
}

function zScores(
  rows: Required<CrossAssetGraphInput>[],
  key: "change7dPct" | "change30dPct" | "change90dPct",
) {
  const values = rows.map((row) => row[key]);
  const m = mean(values);
  const sd = stdev(values);
  return new Map(
    rows.map((row) => [
      row.symbol,
      sd > 1e-9 ? (row[key] - m) / sd : 0,
    ]),
  );
}

function unavailable(universeSize: number): CrossAssetGraphShadow {
  return {
    available: false,
    state: "INSUFFICIENT",
    authority: "SHADOW_ONLY_NO_ENTRY_SCORE_CHANGE",
    source: "ZOBIRIS_CURRENT_CROSS_SECTION",
    paperReference: "arXiv:2606.27670",
    method:
      "Graph-inspired cross-asset residual; requires complete 24h/7d/30d/90d observations and is not a trained GAT.",
    universeSize,
    neighborCount: 0,
    networkImplied24hPct: null,
    networkImplied7dPct: null,
    residual24hPct: null,
    residual7dPct: null,
    confidence: null,
    entryPullbackAdjustmentPct: 0,
    neighbors: [],
  };
}

/**
 * Lightweight shadow implementation of the paper's central idea: evaluate an
 * asset relative to connected peers instead of treating it as an isolated time
 * series. This intentionally does NOT claim to reproduce CryptoGAT.
 *
 * The production snapshot supplies four already-observed return horizons. We
 * form a dynamic peer graph from medium/long-horizon similarity, boost only a
 * small set of unambiguous parent/ecosystem links, apply softmax-like attention
 * to the strongest peers, then measure the target's short-horizon residual.
 *
 * No future observations, test-period statistics, model weights, entry score,
 * order size, or live execution rule are touched here.
 */
export function buildCrossAssetGraph(
  inputs: CrossAssetGraphInput[],
): Map<string, CrossAssetGraphShadow> {
  const deduped = new Map<string, CrossAssetGraphInput>();
  for (const row of inputs) {
    const symbol = String(row.symbol ?? "").trim().toUpperCase();
    if (!symbol || deduped.has(symbol)) continue;
    deduped.set(symbol, {...row, symbol});
  }

  const complete = [...deduped.values()].filter(
    (row): row is Required<CrossAssetGraphInput> =>
      finite(row.change24hPct) &&
      finite(row.change7dPct) &&
      finite(row.change30dPct) &&
      finite(row.change90dPct),
  );
  const result = new Map<string, CrossAssetGraphShadow>();
  for (const symbol of deduped.keys()) result.set(symbol, unavailable(complete.length));
  if (complete.length < 4) return result;

  const z7 = zScores(complete, "change7dPct");
  const z30 = zScores(complete, "change30dPct");
  const z90 = zScores(complete, "change90dPct");
  const move24Std = stdev(complete.map((row) => row.change24hPct));
  const residualThreshold = clamp(move24Std * 0.35, 0.75, 3.5);

  for (const target of complete) {
    const candidates = complete
      .filter((peer) => peer.symbol !== target.symbol)
      .map((peer) => {
        const longDistance =
          (Math.abs(z30.get(target.symbol)! - z30.get(peer.symbol)!) +
            Math.abs(z90.get(target.symbol)! - z90.get(peer.symbol)!)) /
          2;
        const weeklyDistance = Math.abs(
          z7.get(target.symbol)! - z7.get(peer.symbol)!,
        );
        const longSimilarity = Math.exp(-longDistance);
        const weeklySimilarity = Math.exp(-weeklyDistance);
        const eco = ecosystemEdge(target.symbol, peer.symbol);
        let edgeWeight =
          0.72 * longSimilarity +
          0.18 * weeklySimilarity +
          (eco ? 0.1 : 0);
        if (eco) edgeWeight = Math.max(edgeWeight, 0.74);
        return {peer, edgeWeight: clamp(edgeWeight, 0, 1), eco};
      })
      .filter((candidate) => candidate.edgeWeight >= 0.55)
      .sort((a, b) => b.edgeWeight - a.edgeWeight)
      .slice(0, 5);

    if (candidates.length < 2) {
      result.set(target.symbol, unavailable(complete.length));
      continue;
    }

    const rawAttention = candidates.map((candidate) =>
      Math.exp((candidate.edgeWeight - 0.5) * 4),
    );
    const totalAttention = rawAttention.reduce((sum, value) => sum + value, 0);
    const attention = rawAttention.map((value) => value / totalAttention);

    const implied24 = candidates.reduce(
      (sum, candidate, index) =>
        sum + attention[index]! * candidate.peer.change24hPct,
      0,
    );
    const implied7 = candidates.reduce(
      (sum, candidate, index) =>
        sum + attention[index]! * candidate.peer.change7dPct,
      0,
    );
    const residual24 = implied24 - target.change24hPct;
    const residual7 = implied7 - target.change7dPct;
    const edgeConfidence =
      mean(candidates.map((candidate) => candidate.edgeWeight)) *
      Math.min(1, candidates.length / 4) *
      Math.min(1, complete.length / 10);
    const confidence = clamp(edgeConfidence, 0, 1);

    let state: CrossAssetGraphShadow["state"] = "MIXED";
    if (confidence < 0.4) state = "INSUFFICIENT";
    else if (
      residual24 > residualThreshold &&
      residual7 > 0
    )
      state = "CATCH_UP_CANDIDATE";
    else if (
      residual24 < -residualThreshold &&
      residual7 < 0
    )
      state = "OVEREXTENDED";
    else if (
      Math.abs(residual24) <= residualThreshold &&
      Math.abs(residual7) <= Math.max(2, residualThreshold * 2)
    )
      state = "ALIGNED";

    // Conservative entry behavior: graph evidence may demand a deeper shadow
    // pullback when the asset is ahead of peers, but it never raises the live
    // buy price or reduces the production pullback requirement.
    const entryPullbackAdjustmentPct =
      state === "OVEREXTENDED"
        ? round(clamp(Math.abs(residual24) * 0.2, 0.25, 2), 2)
        : 0;

    result.set(target.symbol, {
      available: state !== "INSUFFICIENT",
      state,
      authority: "SHADOW_ONLY_NO_ENTRY_SCORE_CHANGE",
      source: "ZOBIRIS_CURRENT_CROSS_SECTION",
      paperReference: "arXiv:2606.27670",
      method:
        "Dynamic cross-asset similarity graph over observed 24h/7d/30d/90d returns; strongest peer edges receive normalized attention. Not a trained GAT and not trade-authoritative.",
      universeSize: complete.length,
      neighborCount: candidates.length,
      networkImplied24hPct: round(implied24),
      networkImplied7dPct: round(implied7),
      residual24hPct: round(residual24),
      residual7dPct: round(residual7),
      confidence: round(confidence),
      entryPullbackAdjustmentPct,
      neighbors: candidates.map((candidate, index) => ({
        symbol: candidate.peer.symbol,
        edgeWeight: round(candidate.edgeWeight),
        attentionWeight: round(attention[index]!),
        ecosystemEdge: candidate.eco,
        move24hPct: round(candidate.peer.change24hPct),
        move7dPct: round(candidate.peer.change7dPct),
        contribution24hPct: round(
          attention[index]! * candidate.peer.change24hPct,
        ),
      })),
    });
  }

  return result;
}
