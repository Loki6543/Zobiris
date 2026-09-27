import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { loadConfig } from "../shared/config.js";
import { openDatabase } from "../db/client.js";
import { migrate } from "../db/migrate.js";
import { createApp } from "./app.js";
import { EngineRuntime } from "../engine/runtime.js";
import { mountProductionUi } from "./static.js";

const config = loadConfig();
const db = openDatabase(config.ZOBIRIS_DB_PATH);
migrate(db);
const engine=new EngineRuntime(db,config.CMC_API_KEY,{
  maneuverNavUsd:config.PILOT_MANEUVER_NAV_USD,
  availableCashUsd:config.PILOT_AVAILABLE_CASH_USD,
});
const app = createApp(db,engine);

async function refreshEngine() {
  try {
    const snapshot=await engine.refresh();
    console.log(`Engine refresh: ${snapshot.rows.length} coins, ${snapshot.qualifiedCount} qualified, ${snapshot.health.executionSampled} execution sampled`);
  } catch (error) {
    console.error("Engine refresh failed:", error instanceof Error ? error.message : String(error));
  }
}
void refreshEngine();
const refreshTimer=setInterval(()=>void refreshEngine(),config.ENGINE_REFRESH_MS);
refreshTimer.unref();

if (config.NODE_ENV === "production") {
  const here = fileURLToPath(new URL(".", import.meta.url));
  const staticDir = join(here, "../../dist");
  mountProductionUi(app, staticDir);
}

const server = app.listen(config.PORT, "0.0.0.0", () => {
  console.log(`Zobiris Core listening on :${config.PORT}`);
});

function shutdown() {
  clearInterval(refreshTimer);
  server.close(() => {
    db.close();
    process.exit(0);
  });
}
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
