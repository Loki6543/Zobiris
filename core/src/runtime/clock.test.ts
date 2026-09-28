import { describe,expect,it } from "vitest";
import { assessClockIntegrity } from "./clock.js";

describe("clock integrity",()=>{
  const now=new Date("2026-09-28T12:00:00Z");
  it("accepts recent provider timestamps",()=>{
    expect(assessClockIntegrity(now,["2026-09-28T11:59:00Z"]).status).toBe("OK");
  });
  it("fails a materially future provider timestamp",()=>{
    const result=assessClockIntegrity(now,["2026-09-28T12:05:00Z"]);
    expect(result.status).toBe("DEGRADED");
    expect(result.reasons).toContain("provider_timestamp_in_future");
  });
  it("reports unknown rather than inventing clock confidence",()=>{
    expect(assessClockIntegrity(now,[null,undefined]).status).toBe("UNKNOWN");
  });
});
