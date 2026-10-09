import { isVisibleAsset } from "../shared/assetUniverse.js";
/**
 * Shared watchlist loader for the CLI and HTTP server.
 */

import { resolve } from "node:path";
import { readFile } from "node:fs/promises";

const PROJECT_ROOT = resolve(import.meta.dirname ?? new URL(".", import.meta.url).pathname, "..", "..");
const WATCHLIST_PATH = resolve(PROJECT_ROOT, "src", "fixtures", "watchlist.json");

export async function loadWatchlist(): Promise<{ symbol: string; name: string }[]> {
  return JSON.parse(await readFile(WATCHLIST_PATH, "utf8")).filter((a: {symbol:string}) => isVisibleAsset(a.symbol));
}
