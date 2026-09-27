import { describe,expect,it } from "vitest";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { openDatabase } from "./client.js";
import { migrate } from "./migrate.js";
import { archiveAndPruneHotData, verifyArchiveFile } from "./retention.js";

describe("cold retention archive",()=>{
  it("writes and verifies immutable archive bytes before pruning hot tables",()=>{
    const db=openDatabase(":memory:");migrate(db);
    db.prepare("INSERT INTO assets(symbol,asset_class,updated_at) VALUES ('AAVE','NORMAL_CRYPTO',?)").run("2026-01-01T00:00:00Z");
    db.prepare(`INSERT INTO execution_snapshots(
      symbol,observed_at,side,notional_usd,complete,impact_bps,vwap,worst_price,personal_gate
    ) VALUES ('AAVE',?,'buy',100,1,5,100,100,1)`).run("2026-01-01T00:00:00Z");
    db.prepare(`INSERT INTO book_samples(
      symbol,observed_at,midpoint,spread_bps
    ) VALUES ('AAVE',?,100,2)`).run("2026-01-01T00:00:00Z");

    const dir=mkdtempSync(join(tmpdir(),"zobiris-retention-"));
    const result=archiveAndPruneHotData(db,dir,new Date("2026-09-27T00:00:00Z"));
    expect(result).not.toBeNull();
    expect(verifyArchiveFile(result!.path,result!.sha256)).toBe(true);
    const payload=JSON.parse(readFileSync(result!.path,"utf8"));
    expect(payload.executionSnapshots).toHaveLength(1);
    expect(payload.bookSamples).toHaveLength(1);
    expect((db.prepare("SELECT COUNT(*) n FROM execution_snapshots").get() as any).n).toBe(0);
    expect((db.prepare("SELECT COUNT(*) n FROM book_samples").get() as any).n).toBe(0);
    expect((db.prepare("SELECT COUNT(*) n FROM archive_exports").get() as any).n).toBe(1);
    db.close();
  });

  it("does nothing when no rows are old enough to archive",()=>{
    const db=openDatabase(":memory:");migrate(db);
    const dir=mkdtempSync(join(tmpdir(),"zobiris-retention-empty-"));
    expect(archiveAndPruneHotData(db,dir,new Date("2026-09-27T00:00:00Z"))).toBeNull();
    db.close();
  });
});
