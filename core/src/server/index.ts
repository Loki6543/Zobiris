import express from "express";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { loadConfig } from "../shared/config.js";
import { openDatabase } from "../db/client.js";
import { migrate } from "../db/migrate.js";
import { createApp } from "./app.js";

const config = loadConfig();
const db = openDatabase(config.ZOBIRIS_DB_PATH);
migrate(db);
const app = createApp(db);

if (config.NODE_ENV === "production") {
  const here = fileURLToPath(new URL(".", import.meta.url));
  const staticDir = join(here, "../../../dist");
  app.use(express.static(staticDir));
  app.get("*", (_req, res) => res.sendFile(join(staticDir, "index.html")));
}

const server = app.listen(config.PORT, "0.0.0.0", () => {
  console.log(`Zobiris Core listening on :${config.PORT}`);
});

function shutdown() {
  server.close(() => {
    db.close();
    process.exit(0);
  });
}
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
