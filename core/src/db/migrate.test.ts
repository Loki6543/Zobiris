import { describe, expect, it } from "vitest";
import { openDatabase } from "./client.js";
import { migrate } from "./migrate.js";

describe("migrations", () => {
  it("are idempotent", () => {
    const db = openDatabase(":memory:");
    expect(migrate(db)).toBe(3);
    expect(migrate(db)).toBe(3);
    const rows = db.prepare("SELECT id FROM schema_migrations ORDER BY id").all();
    expect(rows).toEqual([{ id: 1 }]);
    db.close();
  });
});
