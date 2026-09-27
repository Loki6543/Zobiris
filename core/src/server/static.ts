import express, { type Express } from "express";
import { join } from "node:path";

export function mountProductionUi(app: Express, staticDir: string) {
  app.use(express.static(staticDir));
  app.get("/{*splat}", (_req, res) => res.sendFile(join(staticDir, "index.html")));
}
