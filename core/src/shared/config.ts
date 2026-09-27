import { z } from "zod";

const schema = z.object({
  PORT: z.coerce.number().int().positive().default(3000),
  ZOBIRIS_DB_PATH: z.string().default("./data/zobiris-core.sqlite"),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  CMC_API_KEY: z.string().min(1).optional(),
  AUTH_SESSION_SECRET: z.string().min(32).optional(),
  ZOBIRIS_BACKUP_DIR: z.string().default("./backups"),
  ENGINE_REFRESH_MS: z.coerce.number().int().min(60_000).default(300_000),
  PILOT_MANEUVER_NAV_USD: z.coerce.number().min(0).default(1850),
  PILOT_AVAILABLE_CASH_USD: z.coerce.number().min(0).default(0),
});

export type AppConfig = z.infer<typeof schema>;

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  return schema.parse(env);
}
