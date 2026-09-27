import type Database from "better-sqlite3";
import { dirname } from "node:path";
import { mkdirSync } from "node:fs";
import { openDatabase } from "./client.js";

export interface DatabaseIntegrity {
  ok:boolean;
  result:string;
  pageCount:number;
  pageSize:number;
  estimatedBytes:number;
}

export function databaseIntegrity(db:Database.Database):DatabaseIntegrity {
  const rows=db.pragma("quick_check") as Array<Record<string,string>>;
  const values=rows.flatMap(row=>Object.values(row));
  const result=values.join("; ") || "unknown";
  const pageCount=Number((db.pragma("page_count",{simple:true}) as number) ?? 0);
  const pageSize=Number((db.pragma("page_size",{simple:true}) as number) ?? 0);
  return {
    ok:values.length===1 && values[0]==="ok",
    result,
    pageCount,
    pageSize,
    estimatedBytes:pageCount*pageSize,
  };
}

export async function createVerifiedBackup(db:Database.Database,destination:string) {
  mkdirSync(dirname(destination),{recursive:true});
  await db.backup(destination);
  const copy=openDatabase(destination);
  try {
    const integrity=databaseIntegrity(copy);
    if(!integrity.ok) throw new Error(`Backup integrity failed: ${integrity.result}`);
    return integrity;
  } finally {
    copy.close();
  }
}
