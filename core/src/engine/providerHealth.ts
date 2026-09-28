export type ProviderHealthState = "LIVE" | "DEGRADED" | "ERROR" | "MISSING";

export interface ProviderHealth {
  state: ProviderHealthState;
  requiredForNewBuy: boolean;
  lastAttemptAt: string | null;
  lastSuccessAt: string | null;
  ageMs: number | null;
  error: string | null;
}

export function providerHealth(args: {
  now: string;
  requiredForNewBuy: boolean;
  success: boolean;
  lastSuccessAt?: string | null;
  maxAgeMs: number;
  error?: string | null;
}): ProviderHealth {
  const nowMs=Date.parse(args.now);
  const successAt=args.success ? args.now : (args.lastSuccessAt ?? null);
  const ageMs=successAt ? Math.max(0, nowMs-Date.parse(successAt)) : null;
  const fresh=ageMs!=null && Number.isFinite(ageMs) && ageMs<=args.maxAgeMs;
  const state:ProviderHealthState=args.success ? "LIVE" : successAt && fresh ? "DEGRADED" : args.lastSuccessAt ? "ERROR" : "MISSING";
  return {
    state,
    requiredForNewBuy:args.requiredForNewBuy,
    lastAttemptAt:args.now,
    lastSuccessAt:successAt,
    ageMs,
    error:args.error ?? null,
  };
}

export function requiredProvidersPermitNewBuy(providers: Record<string,ProviderHealth>) {
  return Object.values(providers).every(p=>!p.requiredForNewBuy || p.state==="LIVE");
}
