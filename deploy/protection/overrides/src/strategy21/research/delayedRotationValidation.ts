export type ValidationDataProvenance = "synthetic" | "provider_point_in_time";

export type PullbackVariant = "descriptive" | "prospective";

export type PullbackSignal = {
  symbol: string;
  return7d: number | null;
};

export type PullbackCompliance = {
  variant: PullbackVariant;
  rule: string;
  total: number;
  compliant: number;
  violations: string[];
  complianceRate: number;
  warning: boolean;
};

export type DelayedRotationActivePolicy = {
  maxRelative90dVsBtcPct: number;
  minChange30dPctExclusive: number;
  minChange90dPctExclusive: number;
  minTurnoverRatio: number;
  minControlledPullback7dPct: number;
  maxRecovery7dPct: number;
  maxPositive24hPct: number;
  minBreadth30dPositive: number;
  diagnosticMinBreadth7dPositive?: number;
  [key: string]: unknown;
};

const COMPLIANCE_WARN_BELOW = 0.80;

function stable(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, item]) => `${JSON.stringify(key)}:${stable(item)}`);
    return `{${entries.join(",")}}`;
  }
  return JSON.stringify(value);
}

/**
 * Conservative evidence-language gate adapted from the independent v2 review.
 * This is an audit verdict, not a trading decision or a probability of profit.
 */
export function validationVerdict(
  overallScore: number,
  evidenceCoverage: number,
  provenance: ValidationDataProvenance,
): string {
  if (provenance === "synthetic") {
    return "SELF_TEST_ONLY: synthetic input can verify engine consistency but is not market evidence";
  }
  if (!Number.isFinite(evidenceCoverage) || evidenceCoverage < 0.99) {
    return "INCOMPLETE: one or more required validation layers are missing";
  }
  if (!Number.isFinite(overallScore)) {
    return "INCOMPLETE: aggregate evidence score is unavailable";
  }
  if (overallScore >= 0.75) {
    return "SUPPORTED_PROVISIONAL: survives implemented checks but still requires untouched prospective confirmation";
  }
  if (overallScore >= 0.55) {
    return "PARTIALLY_SUPPORTED: mixed evidence; prospective confirmation required";
  }
  if (overallScore >= 0.35) {
    return "WEAK: hypothesis not established by this evidence";
  }
  return "NOT_SUPPORTED: implemented evidence is against the hypothesis";
}

function groupKey(
  row: Record<string, unknown>,
  fields: string[],
): string {
  return stable(Object.fromEntries(fields.map((field) => [field, row[field]])));
}

/**
 * An axis is dead unless there is a controlled comparison in which every
 * other parameter is fixed and changing this axis changes the output score.
 */
export function findDeadAxes<T extends Record<string, unknown>>(
  rows: T[],
  parameterFields: string[],
  scoreField = "score",
): string[] {
  if (rows.length < 2 || parameterFields.length === 0) return [...parameterFields];
  const dead: string[] = [];
  for (const parameter of parameterFields) {
    const others = parameterFields.filter((field) => field !== parameter);
    const groups = new Map<string, T[]>();
    for (const row of rows) {
      const key = groupKey(row, others);
      const values = groups.get(key) ?? [];
      values.push(row);
      groups.set(key, values);
    }

    let moved = false;
    for (const group of groups.values()) {
      const distinctParameterValues = new Set(group.map((row) => stable(row[parameter])));
      if (distinctParameterValues.size < 2) continue;
      const scoreByParameter = new Map<string, Set<string>>();
      for (const row of group) {
        const p = stable(row[parameter]);
        const bucket = scoreByParameter.get(p) ?? new Set<string>();
        bucket.add(stable(row[scoreField]));
        scoreByParameter.set(p, bucket);
      }
      const allScores = new Set(
        [...scoreByParameter.values()].flatMap((set) => [...set]),
      );
      if (allScores.size > 1) {
        moved = true;
        break;
      }
    }
    if (!moved) dead.push(parameter);
  }
  return dead;
}

function compliant(return7d: number, variant: PullbackVariant): boolean {
  if (variant === "descriptive") return return7d < 0;
  return return7d >= -0.08 && return7d < 0;
}

export function pullbackCompliance(
  signals: PullbackSignal[],
  variant: PullbackVariant,
): PullbackCompliance {
  const valid = signals.filter(
    (signal): signal is { symbol: string; return7d: number } =>
      typeof signal.return7d === "number" && Number.isFinite(signal.return7d),
  );
  const accepted = valid.filter((signal) => compliant(signal.return7d, variant));
  const violations = valid
    .filter((signal) => !compliant(signal.return7d, variant))
    .map((signal) => signal.symbol);
  const rate = valid.length ? accepted.length / valid.length : 0;
  return {
    variant,
    rule: variant === "descriptive" ? "R7d < 0" : "-8% <= R7d < 0",
    total: valid.length,
    compliant: accepted.length,
    violations,
    complianceRate: rate,
    warning: rate < COMPLIANCE_WARN_BELOW,
  };
}

/**
 * Hash only the thresholds that can actually alter qualification/entry-state
 * behavior. Diagnostic-only metadata must not move the provenance anchor.
 */
function fnv1a32(input: string, seed = 0x811c9dc5): number {
  let hash = seed >>> 0;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash >>> 0;
}

export function policyHashForDelayedRotation(
  policy: DelayedRotationActivePolicy,
): string {
  const active = {
    maxRelative90dVsBtcPct: policy.maxRelative90dVsBtcPct,
    minChange30dPctExclusive: policy.minChange30dPctExclusive,
    minChange90dPctExclusive: policy.minChange90dPctExclusive,
    minTurnoverRatio: policy.minTurnoverRatio,
    minControlledPullback7dPct: policy.minControlledPullback7dPct,
    maxRecovery7dPct: policy.maxRecovery7dPct,
    maxPositive24hPct: policy.maxPositive24hPct,
    minBreadth30dPositive: policy.minBreadth30dPositive,
  };
  const payload = stable(active);
  const left = fnv1a32(payload).toString(16).padStart(8, "0");
  const right = fnv1a32("zobiris-delayed-rotation:" + payload, 0x9e3779b9)
    .toString(16)
    .padStart(8, "0");
  return left + right;
}

export function relativeVolumeAcceleration(
  volumeAccelBySymbol: Record<string, number | null>,
): Record<string, number | null> {
  const logs = Object.values(volumeAccelBySymbol)
    .filter((value): value is number => typeof value === "number" && Number.isFinite(value) && value > 0)
    .map((value) => Math.log(value))
    .sort((a, b) => a - b);
  const median = logs.length === 0
    ? null
    : logs.length % 2
      ? logs[Math.floor(logs.length / 2)]!
      : (logs[logs.length / 2 - 1]! + logs[logs.length / 2]!) / 2;
  return Object.fromEntries(
    Object.entries(volumeAccelBySymbol).map(([symbol, value]) => [
      symbol,
      median == null || value == null || !Number.isFinite(value) || value <= 0
        ? null
        : Math.log(value) - median,
    ]),
  );
}
