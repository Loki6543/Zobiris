import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe,expect,it } from "vitest";
import { openDatabase } from "./client.js";
import { migrate } from "./migrate.js";
import { createVerifiedBackup, databaseIntegrity } from "./maintenance.js";

describe("database maintenance",()=>{
  it("reports quick_check integrity",()=>{
    const db=openDatabase(":memory:");
    migrate(db);
    expect(databaseIntegrity(db).ok).toBe(true);
    db.close();
  });

  it("creates a verified backup of a live on-disk database",async()=>{
    const dir=mkdtempSync(join(tmpdir(),"zobiris-backup-"));
    const source=join(dir,"source.sqlite");
    const target=join(dir,"backup.sqlite");
    const db=openDatabase(source);
    migrate(db);
    db.prepare("INSERT INTO app_metadata(key,value,updated_at) VALUES ('x','y',?)").run(new Date().toISOString());
    const result=await createVerifiedBackup(db,target);
    expect(result.ok).toBe(true);
    db.close();
    const copy=openDatabase(target);
    expect((copy.prepare("SELECT value FROM app_metadata WHERE key='x'").get() as any).value).toBe("y");
    copy.close();
    rmSync(dir,{recursive:true,force:true});
  });
});
