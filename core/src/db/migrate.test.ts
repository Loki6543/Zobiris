import { describe, expect, it } from "vitest";
import { openDatabase } from "./client.js";
import { migrate } from "./migrate.js";

describe("migrations", () => {
  it("are idempotent", () => {
    const db = openDatabase(":memory:");
    expect(migrate(db)).toBe(7);
    expect(migrate(db)).toBe(7);
    const rows = db.prepare("SELECT id FROM schema_migrations ORDER BY id").all();
    expect(rows).toEqual([{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }, { id: 6 }, { id: 7 }]);
    db.close();
  });
});
