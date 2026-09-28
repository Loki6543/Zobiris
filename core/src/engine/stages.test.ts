import { describe,expect,it } from "vitest";
import { runStage } from "./stages.js";

describe("typed engine stages",()=>{
  it("captures success and failure without erasing timing metadata",async()=>{
    let mono=10;
    const clock={
      now:()=>new Date("2026-09-28T12:00:00Z"),
      monotonicNow:()=>mono+=5,
    };
    const ok=await runStage("ok",clock,async()=>42);
    expect(ok).toMatchObject({status:"SUCCESS",data:42,error:null});
    const fail=await runStage("fail",clock,async()=>{throw new Error("boom");});
    expect(fail.status).toBe("FAILED");
    expect(fail.error).toBe("boom");
  });
});
