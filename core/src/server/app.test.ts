import { describe, expect, it } from "vitest";
import request from "supertest";
import { openDatabase } from "../db/client.js";
import { migrate } from "../db/migrate.js";
import { createApp } from "./app.js";

describe("health and metrics endpoints", () => {
  it("reports schema, database integrity and policy identity", async () => {
    const db = openDatabase(":memory:");
    migrate(db);
    const res = await request(createApp(db)).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.service).toBe("zobiris-core");
    expect(res.body.schemaVersion).toBe(5);
    expect(res.body.database.ok).toBe(true);
    expect(res.body.policy.hash).toMatch(/^[a-f0-9]{64}$/);
    expect(res.body.engine).toBeNull();
    db.close();
  });

  it("exposes the shared minimum-evidence gate without inventing confidence", async () => {
    const db = openDatabase(":memory:");
    migrate(db);
    const res = await request(createApp(db)).get("/api/learning/evidence/7D");
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.evidence.horizon).toBe("7D");
    expect(res.body.evidence.promotable).toBe(false);
    expect(res.body.evidence.qualifiedEpisodes).toBe(0);
    db.close();
  });

  it("exposes non-sensitive operational metrics", async () => {
    const db = openDatabase(":memory:");
    migrate(db);
    const res = await request(createApp(db)).get("/api/metrics");
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.refreshes24h).toEqual({total:0,failed:0});
    expect(res.body.openEpisodes).toBe(0);
    expect(res.body.overdueOutcomes).toBe(0);
    expect(res.body.authorityEnabled).toBe(false);
    db.close();
  });
});
