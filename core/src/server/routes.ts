import type { Express, RequestHandler } from "express";
import type { RouteAccess } from "./auth.js";

export interface GetRoute {
  method:"get";
  path:string;
  access:RouteAccess;
  handler:RequestHandler;
}

export function registerRoutes(app:Express,routes:GetRoute[],authGuard?:RequestHandler) {
  for(const route of routes) {
    if(route.access!=="public" && !authGuard) {
      throw new Error(`Protected route ${route.method.toUpperCase()} ${route.path} has no auth guard`);
    }
    const handlers=route.access==="public" ? [route.handler] : [authGuard!,route.handler];
    app.get(route.path,...handlers);
  }
}
