import { describe, expect, it } from "vitest";
import request from "supertest";
import { openDatabase } from "../db/client.js";
import { migrate } from "../db/migrate.js";
import { createApp } from "./app.js";

describe("health endpoint", () => {
  it("reports canonical service and migrated schema", async () => {
    const db = openDatabase(":memory:");
    migrate(db);
    const res = await request(createApp(db)).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.service).toBe("zobiris-core");
    expect(res.body.schemaVersion).toBe(1);
    db.close();
  });
});
