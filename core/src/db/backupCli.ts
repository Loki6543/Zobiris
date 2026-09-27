import { join } from "node:path";
import { loadConfig } from "../shared/config.js";
import { openDatabase } from "./client.js";
import { createVerifiedBackup } from "./maintenance.js";

const config=loadConfig();
const db=openDatabase(config.ZOBIRIS_DB_PATH);
try {
  const stamp=new Date().toISOString().replace(/[:.]/g,"-");
  const destination=process.argv[2] ?? join(config.ZOBIRIS_BACKUP_DIR,`zobiris-core-${stamp}.sqlite`);
  const integrity=await createVerifiedBackup(db,destination);
  console.log(JSON.stringify({ok:true,destination,integrity}));
} finally {
  db.close();
}
