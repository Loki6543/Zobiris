import { join } from "node:path";
import { loadConfig } from "../shared/config.js";
import { openDatabase } from "./client.js";
import { migrate } from "./migrate.js";
import { createVerifiedBackup } from "./maintenance.js";
import { archiveAndPruneHotData } from "./retention.js";

const config=loadConfig();
const command=process.argv[2] ?? "status";
const db=openDatabase(config.ZOBIRIS_DB_PATH);
migrate(db);

try {
  if(command==="backup") {
    const stamp=new Date().toISOString().replace(/[:.]/g,"-");
    const destination=join(config.ZOBIRIS_BACKUP_DIR,`zobiris-core-${stamp}.sqlite`);
    const integrity=await createVerifiedBackup(db,destination);
    console.log(JSON.stringify({ok:true,command,destination,integrity}));
  } else if(command==="archive") {
    const directory=join(config.ZOBIRIS_BACKUP_DIR,"cold");
    const archive=archiveAndPruneHotData(db,directory,new Date());
    console.log(JSON.stringify({ok:true,command,archive}));
  } else {
    throw new Error("usage: maintenanceCli backup|archive");
  }
} finally {
  db.close();
}
