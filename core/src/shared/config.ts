import { z } from "zod";

const schema = z.object({
  PORT: z.coerce.number().int().positive().default(3000),
  ZOBIRIS_DB_PATH: z.string().default("./data/zobiris-core.sqlite"),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  CMC_API_KEY: z.string().min(1).optional(),
});

export type AppConfig = z.infer<typeof schema>;

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  return schema.parse(env);
}
