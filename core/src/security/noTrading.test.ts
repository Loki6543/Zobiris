import { describe,expect,it } from "vitest";
import { readFileSync,readdirSync } from "node:fs";
import { join,relative } from "node:path";
import { fileURLToPath } from "node:url";
import { CAPABILITY_MANIFEST,FORBIDDEN_CAPABILITIES } from "./capabilities.js";

function filesUnder(dir:string):string[] {
  const out:string[]=[];
  for(const entry of readdirSync(dir,{withFileTypes:true})) {
    const path=join(dir,entry.name);
    if(entry.isDirectory()) out.push(...filesUnder(path));
    else if(/\.(ts|tsx|js|jsx|json)$/.test(entry.name)) out.push(path);
  }
  return out;
}

describe("non-execution capability boundary",()=>{
  it("keeps every forbidden capability disabled",()=>{
    for(const name of FORBIDDEN_CAPABILITIES) expect(CAPABILITY_MANIFEST[name]).toBe(false);
  });

  it("contains no Kraken mutation endpoints or wallet-signing libraries in runtime source",()=>{
    const here=fileURLToPath(new URL(".",import.meta.url));
    const src=join(here,"..");
    const self=join(here,"noTrading.test.ts");
    const needles=[
      ["Add","Order"].join(""),
      ["Cancel","Order"].join(""),
      ["Edit","Order"].join(""),
      ["Withdraw"].join(""),
      ["Wallet","Transfer"].join(""),
      ["create","Sign"].join(""),
      ["sign","Transaction"].join(""),
      ["broadcast","Transaction"].join(""),
    ];
    const hits:string[]=[];
    for(const path of filesUnder(src)) {
      if(path===self || path.endsWith("capabilities.ts")) continue;
      const text=readFileSync(path,"utf8");
      for(const needle of needles) {
        if(text.includes(needle)) hits.push(`${relative(src,path)}:${needle}`);
      }
    }
    expect(hits).toEqual([]);
  });
});
