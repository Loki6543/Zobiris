import { readFileSync,readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { ZOBIRIS_POLICY, ZOBIRIS_POLICY_CANONICAL_JSON, ZOBIRIS_POLICY_HASH } from "./config.js";

describe("Zobiris policy registry", () => {
  it("has a stable versioned sha256 identity", () => {
    expect(ZOBIRIS_POLICY.version).toBe("2.1.0");
    expect(ZOBIRIS_POLICY_HASH).toMatch(/^[a-f0-9]{64}$/);
    expect(ZOBIRIS_POLICY_CANONICAL_JSON).toContain('"standardTestUsd":100');
    expect(ZOBIRIS_POLICY_CANONICAL_JSON).toContain('"maxKrakenReferenceGapPct":0.1');
  });

  it("keeps personal-size execution separate from institutional stress", () => {
    expect(ZOBIRIS_POLICY.execution.standardTestUsd).toBe(100);
    expect(ZOBIRIS_POLICY.execution.stress.institutionalUsd).toBe(250_000);
    expect(ZOBIRIS_POLICY.execution.standardTestUsd).toBeLessThan(
      ZOBIRIS_POLICY.execution.stress.institutionalUsd,
    );
  });
});


describe("canonical policy source",()=>{
  it("forbids duplicate policy registries and stale imports",()=>{
    const here=fileURLToPath(new URL(".",import.meta.url));
    const src=join(here,"..");
    const files:string[]=[];
    const walk=(dir:string)=>{
      for(const entry of readdirSync(dir,{withFileTypes:true})) {
        const p=join(dir,entry.name);
        if(entry.isDirectory()) walk(p);
        else if(/\.(ts|tsx)$/.test(entry.name)) files.push(p);
      }
    };
    walk(src);
    const forbidden=["policy/policy.js","policy/delayedRotationPolicy.js","DELAYED_ROTATION_POLICY"];
    const hits:string[]=[];
    for(const file of files) {
      if(file.endsWith("config.test.ts")) continue;
      const text=readFileSync(file,"utf8");
      for(const token of forbidden) if(text.includes(token)) hits.push(`${file}:${token}`);
    }
    expect(hits).toEqual([]);
  });
});
