import { describe, expect, it } from "vitest";
import { openDatabase } from "./client.js";
import { migrate } from "./migrate.js";

describe("canonical schema", () => {
  it("creates durable market, execution and episode tables", () => {
    const db=openDatabase(":memory:");
    expect(migrate(db)).toBe(4);
    const names=(db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as {name:string}[]).map(x=>x.name);
    for(const table of ["assets","watchlist","kraken_instruments","book_samples","execution_snapshots","strategy_episodes","episode_outcomes","market_candles","policy_versions","provider_health","refresh_runs"]) {
      expect(names).toContain(table);
    }
    db.close();
  });
});
