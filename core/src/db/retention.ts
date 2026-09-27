import type Database from "better-sqlite3";
import { createHash, randomUUID } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { ZOBIRIS_POLICY } from "../policy/config.js";

export interface ArchiveSummary {
  archiveId:string;
  path:string;
  sha256:string;
  bytes:number;
  cutoffAt:string;
  executionRows:number;
  bookRows:number;
}

function sha256Buffer(buffer:Buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

function cutoffIso(now:Date,days:number) {
  return new Date(now.getTime()-days*24*60*60_000).toISOString();
}

export function verifyArchiveFile(path:string,expectedSha256:string) {
  return sha256Buffer(readFileSync(path))===expectedSha256;
}

export function archiveAndPruneHotData(
  db:Database.Database,
  directory:string,
  now=new Date(),
):ArchiveSummary|null {
  const executionCutoff=cutoffIso(now,ZOBIRIS_POLICY.retention.hotExecutionDays);
  const bookCutoff=cutoffIso(now,ZOBIRIS_POLICY.retention.hotBookSampleDays);
  const commonCutoff=executionCutoff<bookCutoff?executionCutoff:bookCutoff;

  const executionRows=db.prepare("SELECT * FROM execution_snapshots WHERE observed_at<? ORDER BY id").all(executionCutoff);
  const bookRows=db.prepare("SELECT * FROM book_samples WHERE observed_at<? ORDER BY id").all(bookCutoff);
  if(!executionRows.length && !bookRows.length) return null;

  const archiveId=randomUUID();
  const payload={
    version:1,
    archiveId,
    createdAt:now.toISOString(),
    cutoffs:{execution:executionCutoff,book:bookCutoff},
    executionSnapshots:executionRows,
    bookSamples:bookRows,
  };
  const bytes=Buffer.from(JSON.stringify(payload)+"\n","utf8");
  const sha256=sha256Buffer(bytes);
  const path=join(directory,`zobiris-cold-${now.toISOString().replace(/[:.]/g,"-")}-${archiveId}.json`);
  mkdirSync(dirname(path),{recursive:true});
  writeFileSync(path,bytes,{flag:"wx"});
  if(!verifyArchiveFile(path,sha256)) throw new Error("cold archive hash verification failed");

  db.transaction(()=>{
    db.prepare(`INSERT INTO archive_exports(
      archive_id,created_at,cutoff_at,file_path,sha256,execution_rows,book_rows,bytes
    ) VALUES (?,?,?,?,?,?,?,?)`).run(
      archiveId,now.toISOString(),commonCutoff,path,sha256,executionRows.length,bookRows.length,bytes.length
    );
    db.prepare("DELETE FROM execution_snapshots WHERE observed_at<?").run(executionCutoff);
    db.prepare("DELETE FROM book_samples WHERE observed_at<?").run(bookCutoff);
  })();

  return {
    archiveId,path,sha256,bytes:bytes.length,cutoffAt:commonCutoff,
    executionRows:executionRows.length,bookRows:bookRows.length,
  };
}
