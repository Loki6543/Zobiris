import { describe, expect, it } from "vitest";
import request from "supertest";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { openDatabase } from "../db/client.js";
import { migrate } from "../db/migrate.js";
import { createApp } from "./app.js";
import { mountProductionUi, productionStaticDir } from "./static.js";

describe("production UI routing", () => {
  it("resolves core/dist from the compiled core/dist-server/server directory", () => {
    expect(productionStaticDir("/repo/core/dist-server/server")).toBe("/repo/core/dist");
  });

  it("serves root and nested SPA routes under Express 5 without swallowing unknown API routes", async () => {
    const db=openDatabase(":memory:");
    migrate(db);
    const app=createApp(db);
    const dir=mkdtempSync(join(tmpdir(),"zobiris-core-"));
    writeFileSync(join(dir,"index.html"),"<html><body>ZOBIRIS-SPA</body></html>");
    mountProductionUi(app,dir);

    expect((await request(app).get("/")).text).toContain("ZOBIRIS-SPA");
    expect((await request(app).get("/compare/aave-vs-link")).text).toContain("ZOBIRIS-SPA");
    const api404=await request(app).get("/api/not-real");
    expect(api404.status).toBe(404);
    expect(api404.body).toEqual({ok:false,error:"API_NOT_FOUND"});
    db.close();
  });
});
