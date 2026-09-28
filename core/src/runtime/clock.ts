import { DELAYED_ROTATION_POLICY } from "../policy/delayedRotationPolicy.js";

export type ClockIntegrityStatus="OK"|"DEGRADED"|"UNKNOWN";

export interface ClockIntegrity {
  status:ClockIntegrityStatus;
  checkedAt:string;
  maxFutureSkewMs:number|null;
  maxProviderAgeMs:number|null;
  usableTimestamps:number;
  reasons:string[];
}

export function assessClockIntegrity(now:Date,timestamps:(string|null|undefined)[]):ClockIntegrity {
  const nowMs=now.getTime();
  const parsed=timestamps
    .map(value=>value ? Date.parse(value) : NaN)
    .filter(Number.isFinite);
  if(!parsed.length) {
    return {
      status:"UNKNOWN",
      checkedAt:now.toISOString(),
      maxFutureSkewMs:null,
      maxProviderAgeMs:null,
      usableTimestamps:0,
      reasons:["no_provider_timestamps"],
    };
  }
  const futureSkews=parsed.map(ts=>Math.max(0,ts-nowMs));
  const ages=parsed.map(ts=>Math.max(0,nowMs-ts));
  const maxFutureSkewMs=Math.max(...futureSkews);
  const maxProviderAgeMs=Math.max(...ages);
  const reasons:string[]=[];
  if(maxFutureSkewMs>DELAYED_ROTATION_POLICY.freshness.providerMaxFutureSkewMs) reasons.push("provider_timestamp_in_future");
  if(maxProviderAgeMs>DELAYED_ROTATION_POLICY.freshness.providerMaxAgeMs) reasons.push("provider_timestamp_too_old");
  return {
    status:reasons.length?"DEGRADED":"OK",
    checkedAt:now.toISOString(),
    maxFutureSkewMs,
    maxProviderAgeMs,
    usableTimestamps:parsed.length,
    reasons,
  };
}

export function elapsedMs(startMonotonic:number,endMonotonic:number) {
  return Math.max(0,endMonotonic-startMonotonic);
}
